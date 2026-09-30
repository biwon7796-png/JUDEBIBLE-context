"use strict";
// Obsidian → JudeBible research pipeline (one pipeline for every approved research record).
//   node tools/pipeline/run.js            → discover → (per record) parse → validate → normalize → combined projection + Scripture Entity Index
//   node tools/pipeline/run.js --dry      → same, writes nothing under data/ or out/sync
// Fail-closed per record: a record with validation errors is never projected; its last known good projection entry (if any) is kept.
// Source notes are opened read-only. Only ingest.config.json "include" folders are read; "exclude" folders never are.
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const { parseNote } = require("./parse"), { validate, mediaErrors } = require("./validate"), { normalize, mediaHash } = require("./normalize"), sidx = require("./scripture-index"), resolver = require("./media-resolver");

const ROOT = path.resolve(__dirname, "..", ".."), OUT = path.join(__dirname, "out");
const CONFIG = path.join(__dirname, "ingest.config.json");
const VAULT_ROOT = process.env.JBC_VAULT || null;
const VAULT_SOURCE = VAULT_ROOT && path.join(VAULT_ROOT, "02_연구물", "브엘세바", "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md");
const SOURCE = VAULT_SOURCE || path.join(ROOT, "docs", "architecture", "브엘세바", "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md");   // an explicit vault binding is authoritative and never falls back to a mirror
const OVERLAY = path.join(ROOT, "data", "projection.overlay.beersheba.json");
const SYNC = path.join(OUT, "media-sync.json");   // per-record, per-media hash manifest of the last successful run
const VAULT_GERAR = VAULT_ROOT && path.join(VAULT_ROOT, "02_연구물", "그랄", "JBC_GERAR_CONNECTED_WORBS_20260930_01.md");
const GERAR = VAULT_GERAR || path.join(ROOT, "docs", "architecture", "그랄", "JBC_GERAR_CONNECTED_WORBS_20260930_01.md");
const sha256 = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

function loadKrv() { const box = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data", "krv.js"), "utf8"), box); return box.window.BVC_KRV; }
const write = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const loadConfig = (f) => JSON.parse(fs.readFileSync(f || CONFIG, "utf8"));
function loadGenerated(file, name) { try { const box = { window: {} }; vm.runInNewContext(fs.readFileSync(file, "utf8"), box); return box.window[name] || null; } catch (e) { return null; } }

// ---------------------------------------------------------------- discovery
// Only the configured include folders are scanned (vault "02_연구물/…" when JBC_VAULT is set, otherwise the repo mirror of those folders).
// A markdown file is a research record only if it has a research header (research_id | document_id) that equals its file name and a Place block.
function discover(cfg, opts) {
  opts = opts || {};
  const vault = Object.prototype.hasOwnProperty.call(opts, "vault") ? opts.vault : process.env[cfg.vault_env || "JBC_VAULT"], mirror = path.resolve(opts.mirrorRoot || path.join(ROOT, cfg.mirror_root));
  const found = [], skipped = [], scanned = [], excluded = [];
  const isExcluded = (vrel) => (cfg.exclude || []).some((ex) => ("/" + vrel).indexOf("/" + ex.replace(/\/$/, "") + "/") >= 0);
  const walk = (dir, vbase, out) => { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f, vbase + e.name + "/", out); else if (/\.md$/i.test(e.name)) out.push({ abs: f, vrel: vbase + e.name }); } };
  if (vault) {
    if (!fs.existsSync(vault)) throw new Error("JBC_VAULT is bound but unavailable: " + vault);
    const missing = (cfg.include || []).filter((inc) => !fs.existsSync(path.join(vault, inc)));
    if (missing.length) throw new Error("JBC_VAULT is missing configured include folders: " + missing.join(", "));
  }
  const useVault = !!vault;   // one source of truth: an explicit vault never falls back to the repo mirror
  for (const inc of cfg.include || []) {
    const base = useVault ? path.join(vault, inc) : path.join(mirror, inc.replace(/^02_연구물\//, "")), via = useVault ? "vault" : "mirror";
    const files = []; walk(base, inc, files); scanned.push({ include: inc, resolved_from: via, files: files.length });
    for (const f of files) {
      if (isExcluded(f.vrel)) { excluded.push(f.vrel); continue; }
      let p; try { p = parseNote(f.abs); } catch (e) { skipped.push({ path: f.vrel, reason: "unreadable: " + e.message }); continue; }
      const blocks = p.order.flatMap((k) => p.sections[k].yaml).filter((b) => b.data), head = blocks.map((b) => b.data).find((d) => d.research_id || d.document_id), place = blocks.map((b) => b.data).find((d) => d.Place && d.Place.stable_id);
      const id = head && (head.research_id || head.document_id), stem = path.basename(f.abs).replace(/\.md$/i, "");
      if (!head || !place) skipped.push({ path: f.vrel, reason: "not a research record (no research header + Place block): operational / gate / supporting document" });
      else if (id !== stem) skipped.push({ path: f.vrel, reason: "research header id does not equal the file name" });
      else found.push({ document_id: id, abs: f.abs, vrel: f.vrel, stable_id: place.Place.stable_id });
    }
  }
  return { found, skipped, excluded, scanned };
}

// Media failure isolation: an asset that fails its own checks is quarantined (kept out of the projection, reported) and never blocks
// its siblings or the record. Record-level validation errors still fail closed.
function isolateMedia(rec) {
  const quarantined = [], keep = [];
  for (const a of rec.media) { const e = mediaErrors(a, rec); if (e.length) quarantined.push({ id: a.id, errors: e.map((x) => x.check + ": " + x.msg) }); else keep.push(a); }
  if (quarantined.length) {
    rec.media = keep;
    const modern = new Set((rec.candidates || []).filter((c) => /MODERN_CITY/.test(c.status || "")).map((c) => c.id)), reps = keep.filter((a) => /representative/.test(a.role) && a.target_ref && !modern.has(a.target_ref.ref));
    rec.representative_media_id = reps.length === 1 ? reps[0].id : null; keep.forEach((a) => { a.representative = a.id === rec.representative_media_id; a.content_hash = mediaHash(a); });
  }
  return quarantined;
}
function mediaSync(rec, quarantined, before) {
  before = before || {}; const now = Object.fromEntries(rec.media.map((a) => [a.id, a.content_hash]));
  return { added: Object.keys(now).filter((id) => !(id in before)), changed: Object.keys(now).filter((id) => id in before && before[id] !== now[id]), unchanged: Object.keys(now).filter((id) => before[id] === now[id]), removed: Object.keys(before).filter((id) => !(id in now)), quarantined: quarantined.map((q) => q.id), now };
}

// ---------------------------------------------------------------- one record (parse → validate → normalize → scripture index); writes nothing
function run(opts) {
  opts = opts || {};
  const source = opts.source || SOURCE, krv = opts.krv || loadKrv(), overlay = JSON.parse(fs.readFileSync(opts.overlay || OVERLAY, "utf8"));
  const parsed = parseNote(source), srcHashBefore = sha256(source);
  const norm = normalize(parsed, overlay, { relPath: path.relative(ROOT, source), approval: opts.approval });
  if (!norm.record) return { parsed, norm, validation: { ok: false, errors: ["no record: " + (norm.warnings || []).join("; ")], warnings: [], checks: [] }, quarantined: [] };
  const discovered = norm.record.media.length, resolutions = resolver.resolveFromCache(norm.record, { mode: opts.resolveMode, cacheDir: opts.cacheDir }), quarantined = isolateMedia(norm.record);
  const validation = validate(norm.record, parsed, { krv, expected_identity: opts.expected });
  const result = { parsed, norm, validation, quarantined };
  if (!validation.ok) return result;
  let prev = null; try { prev = JSON.parse(fs.readFileSync(opts.syncFile || SYNC, "utf8")); } catch (e) {}
  const sync = mediaSync(norm.record, quarantined, prev && prev.records && prev.records[norm.record.stable_id]), allText = fs.readFileSync(source, "utf8") + JSON.stringify(overlay), M = norm.record.media;
  const report = { discovered, bound: M.filter((a) => a.target_ref && a.target_ref.ref).length, rights_validated: M.filter((a) => a.rights && a.rights.validated).length, attribution_only: M.filter((a) => a.display_mode === "attribution_only").length, quarantined: quarantined.length, representative: norm.record.representative_media_id,
    image_payloads: M.filter((a) => a.image_url || a.payload || a.data).length,   // image bytes carried in the projection: never
    preview_urls: M.filter((a) => a.preview_url).length, images_enabled: M.filter((a) => a.display_mode === "image").length, resolved: M.filter((a) => a.resolution && a.resolution.verified === true).length, invented_preview_urls: M.filter((a) => a.preview_url && !(a.resolution && a.resolution.thumb_url === a.preview_url)).length, resolver: resolutions, invented_urls: M.filter((a) => a.source_url && allText.indexOf(a.source_url) < 0).length, unsafe_payloads: M.filter((a) => JSON.stringify(a).match(/"(data|javascript|blob):|<script/i)).length, source_mutations: sha256(source) === srcHashBefore ? 0 : 1,
    sync: { added: sync.added, changed: sync.changed, unchanged: sync.unchanged, removed: sync.removed, quarantined: sync.quarantined } };
  const index = sidx.build(norm.record, krv);
  result.sync = sync; result.mediaReport = report; result.index = index;
  result.meta = { stable_id: norm.record.stable_id, research_id: norm.record.source_refs[0].id, source: { path: norm.record.source_refs[0].path, sha256: norm.record.source_refs[0].sha256 }, app_overlay: path.relative(ROOT, opts.overlay || OVERLAY).replace(/\\/g, "/"), overlay_fields: norm.overlayFields, media: { discovered: report.discovered, bound: report.bound, attribution_only: report.attribution_only, quarantined: report.quarantined, representative: report.representative } };
  return result;
}

// ---------------------------------------------------------------- all configured records → one shared projection + one Scripture Entity Index
function ingest(opts) {
  opts = opts || {};
  const cfg = opts.config || loadConfig(opts.configFile), krv = opts.krv || loadKrv(), dataDir = opts.dataDir || path.join(ROOT, "data"), outDir = opts.outDir || OUT, syncFile = opts.syncFile || SYNC;
  const projFile = path.join(dataDir, "projection.research.js"), idxFile = path.join(dataDir, "scripture.index.js");
  const disc = discover(cfg, opts), prevProj = loadGenerated(projFile, "BVC_PROJECTION"), prevIdx = loadGenerated(idxFile, "BVC_SCRIPTURE_INDEX"), krvHash = sha256(path.join(ROOT, "data", "krv.js"));
  const results = [], failed = [];
  for (const d of disc.found) {
    const rc = (cfg.records || {})[d.document_id] || {}, overlayFile = rc.overlay ? path.join(opts.rootDir || ROOT, rc.overlay) : null;
    if (!rc.expected_identity) { results.push({ doc: d, skipped: "no ingest configuration for this record (expected_identity missing) — not ingested" }); continue; }
    const r = run({ source: d.abs, krv, overlay: overlayFile && fs.existsSync(overlayFile) ? overlayFile : path.join(__dirname, "empty-overlay.json"), syncFile, approval: rc.approval, expected: rc.expected_identity, cacheDir: opts.cacheDir, resolveMode: opts.resolveMode });
    r.doc = d; results.push(r); if (!r.validation.ok) failed.push(r);
  }
  const ok = results.filter((r) => r.validation && r.validation.ok), summary = { discovery: disc, records: [], preserved_last_known_good: [], wrote: false };
  const places = {}, metaRecords = [], parts = [];
  for (const r of results) {
    if (r.skipped) { summary.records.push({ document_id: r.doc.document_id, ok: false, skipped: r.skipped }); continue; }
    const sid = r.validation.ok ? r.doc.stable_id : ((cfg.records || {})[r.doc.document_id] || {}).expected_identity || r.doc.stable_id;   // a failed record is matched to its last known good entry by its configured identity
    if (r.validation.ok) { places[sid] = r.norm.record; metaRecords.push(r.meta); parts.push({ record: sid, research_id: r.meta.research_id, source_sha256: r.meta.source.sha256, entries: r.index.entries, stats: r.index.stats }); summary.records.push({ document_id: r.doc.document_id, stable_id: sid, ok: true, warnings: r.validation.warnings.length, checks: r.validation.checks.length, media: r.mediaReport }); }
    else {
      const prevPlace = prevProj && prevProj.places && prevProj.places[sid], prevMeta = prevProj && prevProj.meta && (prevProj.meta.records || []).find((m) => m.stable_id === sid);
      const entry = { document_id: r.doc.document_id, stable_id: sid, ok: false, errors: r.validation.errors };
      if (prevPlace && prevMeta) { places[sid] = prevPlace; metaRecords.push(Object.assign({}, prevMeta, { preserved_last_known_good: true })); const pe = {}; Object.keys((prevIdx && prevIdx.entries) || {}).forEach((k) => { const e = prevIdx.entries[k].filter((x) => x.stable_id === sid); if (e.length) pe[k] = e; }); const pm = ((prevIdx && prevIdx.meta && prevIdx.meta.records) || []).find((x) => x.record === sid); if (pm) parts.push({ record: sid, research_id: pm.research_id, source_sha256: pm.source_sha256, entries: pe, stats: null }); summary.preserved_last_known_good.push(sid); entry.preserved_last_known_good = true; }
      summary.records.push(entry);
    }
  }
  const projection = { meta: { schema: "JUDEBIBLE_CONTEXT_PROJECTION_v0.2", generated_by: "tools/pipeline/run.js v0.2", gate: "BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1", records: metaRecords }, places };
  const index = sidx.combine(parts, krv); index.meta.krv_sha256 = krvHash;
  summary.projection = projection; summary.index = index; summary.results = results;
  if (!opts.dryRun && ok.length) {
    const hdr = metaRecords.map((m) => "//   " + m.stable_id + "  ←  " + m.source.path + "  sha256: " + m.source.sha256).join("\n");
    write(projFile, "// GENERATED by tools/pipeline/run.js from the approved research notes — do not edit by hand.\n" + hdr + "\n// App-side reader fields come from data/projection.overlay.*.json (see meta.records[].overlay_fields).\nwindow.BVC_PROJECTION = " + JSON.stringify(projection, null, 2) + ";\n");
    write(idxFile, "// GENERATED by tools/pipeline/run.js — Scripture Entity Index (verified against KRV offsets at load; KRV itself is untouched).\nwindow.BVC_SCRIPTURE_INDEX = " + JSON.stringify(index, null, 2) + ";\n");
    let prevSync = {}; try { prevSync = JSON.parse(fs.readFileSync(syncFile, "utf8")).records || {}; } catch (e) {}
    for (const r of ok) prevSync[r.doc.stable_id] = r.sync.now;
    write(syncFile, JSON.stringify({ schema: "JBC_MEDIA_SYNC_v0.2", records: prevSync }, null, 2) + "\n");
    summary.wrote = true;
  }
  if (!opts.dryRun && opts.writeArtifacts !== false) {
    const strip = (p) => ({ source: p.source, frontmatter: p.frontmatter, order: p.order, sections: Object.fromEntries(p.order.map((k) => [k, { heading: p.sections[k].heading, level: p.sections[k].level, textLines: p.sections[k].text.length, quotes: p.sections[k].quotes, fields: p.sections[k].fields, tables: p.sections[k].tables.map((t) => ({ header: t.header, rows: t.rows.length })), yamlBlocks: p.sections[k].yaml.length }])) });
    write(path.join(outDir, "00-discovery.json"), JSON.stringify(disc, null, 2));
    for (const r of results) { if (r.skipped || !r.parsed) continue; const d = path.join(outDir, "records", r.doc.stable_id);
      write(path.join(d, "01-parsed.json"), JSON.stringify(strip(r.parsed), null, 2)); write(path.join(d, "02-validation.json"), JSON.stringify(r.validation, null, 2));
      write(path.join(d, "03-normalized.json"), JSON.stringify({ record: r.norm.record, provenance: r.norm.provenance, warnings: r.norm.warnings, skipped: r.norm.skipped, overlayFields: r.norm.overlayFields }, null, 2));
      if (r.mediaReport) { write(path.join(d, "04-projection-entry.json"), JSON.stringify(r.norm.record, null, 2)); write(path.join(d, "05-scripture-index.json"), JSON.stringify(r.index, null, 2)); write(path.join(d, "06-media-report.json"), JSON.stringify(r.mediaReport, null, 2)); } }
    write(path.join(outDir, "run-summary.json"), JSON.stringify({ discovery: { found: disc.found.map((f) => f.vrel), skipped: disc.skipped, excluded: disc.excluded, scanned: disc.scanned }, records: summary.records, preserved_last_known_good: summary.preserved_last_known_good, wrote: summary.wrote }, null, 2));
  }
  return summary;
}

// Online step, only when asked (--resolve-media): refresh the Commons API cache for every eligible asset of every record.
async function refresh(opts) {
  opts = opts || {}; const cfg = opts.config || loadConfig(opts.configFile), krv = opts.krv || loadKrv(), disc = discover(cfg, opts), out = [];
  for (const d of disc.found) {
    const rc = (cfg.records || {})[d.document_id] || {}; if (!rc.expected_identity) continue;
    const overlayFile = rc.overlay ? path.join(opts.rootDir || ROOT, rc.overlay) : path.join(__dirname, "empty-overlay.json"), parsed = parseNote(d.abs), norm = normalize(parsed, JSON.parse(fs.readFileSync(overlayFile, "utf8")), { relPath: path.relative(ROOT, d.abs), approval: rc.approval });
    if (norm.record) out.push({ record: d.stable_id, media: await resolver.refreshCache(norm.record, { fetcher: opts.fetcher, cacheDir: opts.cacheDir }) });
  }
  return out;
}

if (require.main === module) (async () => {
  if (process.argv.includes("--resolve-media")) console.log(JSON.stringify({ resolver_refresh: await refresh() }, null, 1));
  const s = ingest({ dryRun: process.argv.includes("--dry") });
  console.log(JSON.stringify({ discovery: { found: s.discovery.found.map((f) => f.vrel), skipped: s.discovery.skipped, scanned: s.discovery.scanned }, records: s.records, preserved_last_known_good: s.preserved_last_known_good, wrote: s.wrote }, null, 1));
  process.exit(s.records.length && s.records.every((r) => r.ok) ? 0 : 1);
})();
module.exports = { run, ingest, refresh, discover, loadConfig, loadKrv, SOURCE, GERAR, OVERLAY, CONFIG, ROOT };
