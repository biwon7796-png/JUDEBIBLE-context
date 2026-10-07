"use strict";
// Obsidian → JudeBible research pipeline (one pipeline for every approved research record).
//   node tools/pipeline/run.js            → discover → (per record) parse → validate → normalize → combined projection + Scripture Entity Index
//   node tools/pipeline/run.js --dry      → same, writes nothing under data/ or out/sync
// Fail-closed per record: a record with validation errors is never projected; its last known good projection entry (if any) is kept.
// Source notes are opened read-only. Only ingest.config.json "include" folders are read; "exclude" folders never are.
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const { regionPass } = require("./region-stage");   // canonical Region pass (entity-type dispatch for Region records)
const { runPersonAdapter } = require("./person-adapter"); // Project01-approved Person projection; no identity/Registry promotion
const { parseNote } = require("./parse"), { validate, mediaErrors } = require("./validate"), { normalize, mediaHash, parseRef } = require("./normalize"), sidx = require("./scripture-index"), resolver = require("./media-resolver"), rb = require("./relation-binding");

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
// Atomic writes: content goes to <file>.tmp first and is renamed into place, so a crash never leaves a half-written file. The live projection + index are staged as a pair
// (both .tmp files must be written before either is renamed) so a failure while generating never replaces a previous live file.
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// Windows refuses to replace a file another process (editor, dev server, virus scanner) briefly holds open: retry the rename a few times before giving up.
// If the target stays locked (a dev server / browser keeping the file open without share-delete), the already fully written .tmp is copied over it instead and removed.
const rename = (a, b) => { for (let n = 0; ; n++) { try { return fs.renameSync(a, b); } catch (e) { if (!/^(EPERM|EBUSY|EACCES)$/.test(e.code)) throw e; if (n >= 3) { fs.copyFileSync(a, b); fs.unlinkSync(a); return; } sleep(60 * (n + 1)); } } };
const write = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const t = f + ".tmp"; fs.writeFileSync(t, s); rename(t, f); };
// flush: if any rename fails, the files already replaced are restored from their .prev copy → the previous live pair is never left half-updated.
const stagePair = () => { const q = []; return { stage: (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + ".tmp", s); q.push(f); }, flush: () => { const done = []; try { for (const f of q) { if (fs.existsSync(f)) fs.copyFileSync(f, f + ".prev"); rename(f + ".tmp", f); done.push(f); } } catch (e) { for (const f of done) { try { rename(f + ".prev", f); } catch (e2) {} } for (const f of q) { try { fs.unlinkSync(f + ".tmp"); } catch (e3) {} } throw e; } finally { for (const f of q) { try { fs.unlinkSync(f + ".prev"); } catch (e4) {} } } q.length = 0; }, abort: () => { q.forEach((f) => { try { fs.unlinkSync(f + ".tmp"); } catch (e) {} }); q.length = 0; } }; };
const loadConfig = (f) => JSON.parse(fs.readFileSync(f || CONFIG, "utf8"));
function loadGenerated(file, name) { try { const box = { window: {} }; vm.runInNewContext(fs.readFileSync(file, "utf8"), box); return box.window[name] || null; } catch (e) { return null; } }

// ---------------------------------------------------------------- stale-source guard
// A write run against the REAL data/ directory must come from the authoritative vault. When JBC_VAULT is missing the discovery silently
// falls back to the repo mirror, which can be stale (it once dropped structured_media_rights and turned cleared photos into attribution-only).
// So: no vault → refuse, unless --allow-mirror is given AND the mirror reproduces the recorded source sha256 of every projected record;
// a deliberate lineage change from a mirror needs --accept-source-change as well. Vault runs that change a source sha are reported and appended to
// tools/pipeline/lineage/source-lineage.json (read-only audit trail; it never approves a hash — qa-bs BS-01 pin stays a manual decision).
const LINEAGE = path.join(__dirname, "lineage", "source-lineage.json");
function guardSources(disc, results, prevProj, opts) {
  const mirrorUsed = (disc.scanned || []).some((s) => s.resolved_from === "mirror"), prevMeta = (id) => prevProj && prevProj.meta && (prevProj.meta.records || []).find((m) => m.stable_id === id);
  const changes = (results || []).filter((r) => r.meta && r.meta.source).map((r) => ({ r, prev: prevMeta(r.doc.stable_id) })).filter((x) => x.prev && x.prev.source && x.prev.source.sha256 !== x.r.meta.source.sha256);
  if (mirrorUsed && !opts.allowMirror) throw new Error("STALE_SOURCE_GUARD: JBC_VAULT is not bound, so the repo mirror would be used for a write run. The mirror may be stale (media rights / structured blocks can be missing). Bind JBC_VAULT to the research vault, or pass --allow-mirror to knowingly use the mirror. Nothing was written.");
  if (mirrorUsed && changes.length && !opts.acceptSourceChange) throw new Error("STALE_SOURCE_GUARD: the mirror would change the recorded source lineage of " + changes.map((c) => c.r.doc.stable_id + " (" + c.prev.source.sha256.slice(0, 12) + " → " + c.r.meta.source.sha256.slice(0, 12) + ")").join(", ") + ". Use the vault, or pass --accept-source-change after the owner approved the new source. Nothing was written.");
  return changes.map((c) => ({ stable_id: c.r.doc.stable_id, from: c.prev.source.sha256, to: c.r.meta.source.sha256, via: mirrorUsed ? "mirror" : "vault" }));
}
function recordLineage(results, disc, changes) {
  let log = { schema: "JBC_SOURCE_LINEAGE_v0.1", entries: [] }; try { log = JSON.parse(fs.readFileSync(LINEAGE, "utf8")); } catch (e) {}
  const via = (disc.scanned || []).some((s) => s.resolved_from === "mirror") ? "mirror" : "vault";
  for (const r of results) { if (!r.meta || !r.meta.source) continue; const e = { stable_id: r.doc.stable_id, path: r.meta.source.path, sha256: r.meta.source.sha256, via };
    if (!log.entries.some((x) => x.stable_id === e.stable_id && x.sha256 === e.sha256 && x.path === e.path)) log.entries.push(Object.assign({ observed: new Date().toISOString() }, e)); }
  write(LINEAGE, JSON.stringify(log, null, 2) + "\n");
}

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
    let files = []; walk(base, inc, files);
    // The repo mirror root itself is not a research folder (locks, gates and stale flat copies sit there): for a root include only its sub-folders count (the vault root files are judged by the eligibility gate).
    if (!useVault && path.resolve(base) === mirror) files = files.filter((f) => f.vrel.slice(inc.length).indexOf("/") > 0);
    scanned.push({ include: inc, resolved_from: via, files: files.length });
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
  // Auto-discovery scans whole roots, so the same research asset may appear twice (a stray copy). Two notes claiming one research id are ambiguous:
  // both stay in `found` flagged and fail closed in ingest (the last known good entry is kept) — the pipeline never guesses which copy is authoritative.
  found.sort((a, b) => (a.document_id < b.document_id ? -1 : a.document_id > b.document_id ? 1 : 0));   // processing / output order depends on the research id, never on the folder layout
  // A byte-identical copy is the same asset (first path wins, the copy is reported as skipped); differing copies are ambiguous.
  for (let i = found.length - 1; i > 0; i--) { const twin = found.slice(0, i).find((x) => x.document_id === found[i].document_id && sha256(x.abs) === sha256(found[i].abs)); if (twin) { skipped.push({ path: found[i].vrel, reason: "byte-identical copy of " + twin.vrel + " — not ingested twice" }); found.splice(i, 1); } }
  const dupIds = new Set(found.map((f) => f.document_id).filter((id, i, a) => a.indexOf(id) !== i));
  found.forEach((f) => { if (dupIds.has(f.document_id)) f.duplicate = true; });
  return { found, skipped, excluded, scanned, vault: useVault ? vault : null };
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


// Reference auto-bind (future automation): after a real projection write, re-extract the external ids declared in the approved notes and regenerate the Reference Layer
// projection (tools/reference/build.py → data/reference.bindings.js). Non-fatal by design: the research projection is already written and is never touched by this step;
// a failure (e.g. no python) is reported in the summary and the previous bindings stay in place.
function refreshReferenceBindings() {
  const cp = require("child_process"), steps = [];
  const go = (label, cmd, args) => { const r = cp.spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8" }); steps.push({ step: label, ok: r.status === 0, detail: ((r.stdout || "") + (r.stderr || "")).trim().split(String.fromCharCode(10)).pop() || (r.error && r.error.message) || "" }); return r.status === 0; };
  if (!go("external-refs", process.execPath, [path.join(__dirname, "external-refs.js")])) return { ok: false, steps };
  const py = ["python", "py"].find((c) => cp.spawnSync(c, ["--version"], { encoding: "utf8" }).status === 0);
  if (!py) { steps.push({ step: "reference-build", ok: false, detail: "python not found — run `python tools/reference/build.py` manually" }); return { ok: false, steps }; }
  return { ok: go("reference-build", py, [path.join(ROOT, "tools", "reference", "build.py")]), steps };
}
function refreshContextualResearch() {
  const cp = require("child_process"), script = path.join(__dirname, "contextual-research.js");
  const r = cp.spawnSync(process.execPath, [script], { cwd: ROOT, encoding: "utf8", env: process.env });
  return { ok: r.status === 0, status: r.status, detail: ((r.stdout || "") + (r.stderr || "")).trim().split(String.fromCharCode(10)).pop() || (r.error && r.error.message) || "" };
}

// ---------------------------------------------------------------- all configured records → one shared projection + one Scripture Entity Index
function ingest(opts) {
  opts = opts || {};
  const cfg = opts.config || loadConfig(opts.configFile), krv = opts.krv || loadKrv(), dataDir = opts.dataDir || path.join(ROOT, "data"), outDir = opts.outDir || OUT, syncFile = opts.syncFile || SYNC;
  const projFile = path.join(dataDir, "projection.research.js"), idxFile = path.join(dataDir, "scripture.index.js");
  const disc = discover(cfg, opts), prevProj = loadGenerated(projFile, "BVC_PROJECTION"), prevIdx = loadGenerated(idxFile, "BVC_SCRIPTURE_INDEX"), krvHash = sha256(path.join(ROOT, "data", "krv.js"));
  const results = [], failed = [];
  for (const d of disc.found) {
    const rc = (cfg.records || {})[d.document_id] || {};
    if (rc.projection_mode === "DETAIL_ONLY") continue;   // approved Full Place Profile is projected by the dedicated detail stage; do not collide with the compatibility spatial/media record
    const overlayFile = rc.overlay ? path.join(opts.rootDir || ROOT, rc.overlay) : null;
    // zero-config discovery: a Place note found in the vault needs no ingest.config entry. Without one, the identity pin is the note's own Place.stable_id (the approval gate V33 still applies;
    // an unapproved note is reported as awaiting approval, never generated). A config entry stays available to pin an identity, supply an overlay or record an approval override.
    const r = run({ source: d.abs, krv, overlay: overlayFile && fs.existsSync(overlayFile) ? overlayFile : path.join(__dirname, "empty-overlay.json"), syncFile, approval: rc.approval, expected: rc.expected_identity || d.stable_id, cacheDir: opts.cacheDir, resolveMode: opts.resolveMode });
    r.doc = d;
    if (d.duplicate) { r.validation = { ok: false, errors: ["DUPLICATE_RESEARCH_ID: more than one note carries research id " + d.document_id + " — ambiguous source, not ingested"], warnings: [], checks: [] }; delete r.sync; }
    if (!rc.expected_identity && !r.validation.ok && r.validation.errors.length && r.validation.errors.every((e) => /^V33/.test(e))) { results.push({ doc: d, gate: "AWAITING_APPROVAL", skipped: "eligibility gate: " + r.validation.errors[0] + " — not ingested" }); continue; }
    results.push(r); if (!r.validation.ok) failed.push(r);
  }
  // stable id collision: two Place notes claiming one viewer id fail closed together (the last known good entry of that id is kept by the failure path below)
  const byId = {}; results.forEach((r) => { if (r.validation && r.validation.ok) (byId[r.doc.stable_id] = byId[r.doc.stable_id] || []).push(r); });
  Object.keys(byId).filter((k) => byId[k].length > 1).forEach((k) => byId[k].forEach((r) => { r.validation = { ok: false, errors: ["STABLE_ID_COLLISION: viewer id " + k + " is claimed by " + byId[k].map((x) => x.doc.document_id).join(", ")], warnings: [], checks: [] }; failed.push(r); }));
  const realWrite = !opts.dryRun && path.resolve(dataDir) === path.resolve(ROOT, "data"), srcChanges = realWrite ? guardSources(disc, results, prevProj, opts) : [];   // throws before anything is written
  const ok = results.filter((r) => r.validation && r.validation.ok), summary = { discovery: disc, records: [], preserved_last_known_good: [], wrote: false, source_changes: srcChanges };
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
  // Region pass (entity-type dispatch): Region notes are discovered/normalized/validated by the shared region modules, vault only, fail-closed with last known good.
  // Without Region records the output format is exactly what it was before (no `regions` key).
  const reg = cfg._no_region_pass ? { regions: {}, regionMeta: [], parts: [], records: [], preserved: [] } : regionPass({ cfg, krv, vault: disc.vault || null, claimedAbs: new Set(disc.found.map((f) => f.abs)), prevProj, prevIdx, activationState: "NOT_ACTIVATED", approvalsDir: opts.approvalsDir, placeIds: new Set(Object.keys(places)) });
  summary.region_records = reg.records;
  // Event adapter: only explicit event_id records carried by an already CAPTAIN-approved canonical parent asset are projected.
  // Scope remains ASSET_LOCAL; this does not create a global Event Registry identity, public exposure, geometry, or new research meaning.
  const events = {}, eventRecords = [], eventOwner = {};
  Object.keys(places).forEach((parentId) => {
    const parent = places[parentId], approved = parent && parent.authority && parent.authority.approval === "CAPTAIN_APPROVED";
    if (!approved) return;
    ((parent.connected && parent.connected.events) || []).forEach((ev) => {
      if (!ev || !ev.event_id || ev.scope !== "ASSET_LOCAL") return;
      const id = ev.event_id;
      if (eventOwner[id] && eventOwner[id] !== parentId) { delete events[id]; eventRecords.push({ stable_id:id, parent_asset_id:parentId, ok:false, errors:["EVENT_STABLE_ID_COLLISION: "+id+" also declared by "+eventOwner[id]] }); return; }
      eventOwner[id] = parentId;
      const passage = ev.passage ? parseRef(ev.passage) : null;
      events[id] = {
        stable_id:id, type:"Event", display_label:ev.label || ev.event || id, aliases:[], passage_refs:passage ? [passage] : [],
        source_refs:(parent.source_refs || []).map((x) => Object.assign({}, x)), source_locator:"§6.3 Event · "+id,
        certainty:ev.certainty || null, status:parent.status, scope:ev.scope, parent_asset_id:parentId,
        authority:Object.assign({}, parent.authority, { approval_scope:"PARENT_ASSET_CONTENT", parent_asset_id:parentId, event_scope:ev.scope }),
        VERIFY_HOLD:parent.VERIFY_HOLD || { verify:false, hold:false, reason:null },
        event_location:ev.event_location || null, origin:ev.origin || null, destination_event_location:ev.destination_event_location || null,
        exact_geometry:ev.exact_geometry || null, route_geometry:ev.route_geometry || null,
        reader:{ published:false }, activation:{ publishable:false }, projection_role:"INTERNAL_CANONICAL_EVENT_FROM_APPROVED_PARENT_ASSET"
      };
      eventRecords.push({ stable_id:id, parent_asset_id:parentId, ok:true, scope:ev.scope, passage:ev.passage || null });
    });
  });
  summary.event_records = eventRecords;
  // Person pass: resolve only Project01 lifecycle records that explicitly carry PROFESSIONAL_RESEARCH_PASS
  // + APPROVED_DOWNSTREAM_PROJECTION and exact source SHA. Projection key stays the research identity;
  // no Registry/global stable identity is minted or promoted.
  const person = disc.vault
    ? runPersonAdapter({ vault: disc.vault, project01Root: opts.project01Root, krv, write: realWrite })
    : { ok: true, status: "SKIPPED_NO_AUTHORITATIVE_VAULT", count: 0, records: {}, parts: [], assets: [], authority_effect: "NONE", registry_effect: "NONE", identity_issuance: "NONE" };
  summary.person_projection = person;
  const people = person.records || {};
  // Projection-local research identities are searchable/scripture-bindable, but they are not global Person identities.
  // Until an explicit stable identity is issued, keep them out of cross-entity relation auto/verify matching so a name match cannot mutate Place/Event semantics.
  const bindablePeople = Object.fromEntries(Object.entries(people).filter(([sid, rec]) => /^JBC-CR-PERSON-[A-Z0-9_]+-\d{3}$/.test(sid) && rec.identity_binding && rec.identity_binding.global_identity_issued === true));
  // Relation binding (whole-graph): only entities with approved/global relation identities participate in cross-entity binding.
  const graph = { places, regions: reg.regions, people: bindablePeople, events };
  const relBind = rb.bindRelations(graph, { prev: prevProj }); relBind.provenance_references = rb.provenanceReferences(disc.found.concat(reg.found || []), rb.buildIndex(graph)); summary.relation_binding = relBind;
  // Asset discovery report: one line per eligible-looking research asset, whatever its entity type — what was found, which adapter took it, and where the eligibility gate stopped it.
  const stat = (r) => (r.ok ? "ingested" : r.gate === "AWAITING_APPROVAL" || r.skipped ? "awaiting_approval" : "failed_closed");
  const personIds = new Set((person.assets || []).map((a) => a.document_id));
  summary.assets = results.map((r) => ({ document_id: r.doc.document_id, entity_type: "place", path: r.doc.vrel, status: r.skipped ? "awaiting_approval" : r.validation.ok ? "ingested" : "failed_closed", reason: r.skipped || (r.validation && !r.validation.ok ? r.validation.errors[0] : undefined) }))
    .concat(reg.records.map((r) => ({ document_id: r.document_id, entity_type: "region", profile: r.profile, stable_id: r.stable_id, status: stat(r), identity_source: r.identity_source, approval_record: r.approval_record, reason: r.skipped || (r.errors && r.errors[0]) || undefined, errors: r.errors })))
    .concat(person.assets || [])
    .concat(disc.skipped.concat(reg.skipped || []).filter((x) => x.entity_type && !(x.entity_type === "person" && personIds.has(path.basename(x.path || "", ".md")))).map((x) => ({ path: x.path, entity_type: x.entity_type, status: "no_adapter", reason: x.reason })));
   summary.preserved_last_known_good = summary.preserved_last_known_good.concat(reg.preserved);
  const hasRegions = Object.keys(reg.regions).length > 0, hasEvents = Object.keys(events).length > 0, hasPeople = Object.keys(people).length > 0, projection = { meta: Object.assign({ schema: "JUDEBIBLE_CONTEXT_PROJECTION_v0.2", generated_by: "tools/pipeline/run.js v0.2", gate: "BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1", records: metaRecords, event_adapter: { status:"ACTIVE_FROM_APPROVED_PARENT_ASSET", scope:"ASSET_LOCAL_ONLY", projected:Object.keys(events).length } }, hasRegions ? { regions: reg.regionMeta } : {}), places };
  if (hasRegions) projection.regions = reg.regions;
  if (hasEvents) projection.events = events;
  const index = sidx.combine(parts.concat(reg.parts, person.parts || []), krv); index.meta.krv_sha256 = krvHash;
  summary.projection = projection; summary.index = index; summary.results = results;
  if (!opts.dryRun && (ok.length || hasRegions || hasEvents || hasPeople)) {
    const hdr = metaRecords.concat(hasRegions ? reg.regionMeta : []).map((m) => "//   " + m.stable_id + "  ←  " + m.source.path + "  sha256: " + m.source.sha256).join("\n");
    const pair = stagePair(); try {
    pair.stage(projFile, "// GENERATED by tools/pipeline/run.js from the approved research notes — do not edit by hand.\n" + hdr + "\n// App-side reader fields come from data/projection.overlay.*.json (see meta.records[].overlay_fields).\nwindow.BVC_PROJECTION = " + JSON.stringify(projection, null, 2) + ";\n");
    pair.stage(idxFile, "// GENERATED by tools/pipeline/run.js — Scripture Entity Index (verified against KRV offsets at load; KRV itself is untouched).\nwindow.BVC_SCRIPTURE_INDEX = " + JSON.stringify(index, null, 2) + ";\n");
    pair.flush(); } catch (e) { pair.abort(); throw e; }
    let prevSync = {}; try { prevSync = JSON.parse(fs.readFileSync(syncFile, "utf8")).records || {}; } catch (e) {}
    for (const r of ok) prevSync[r.doc.stable_id] = r.sync.now;
    write(syncFile, JSON.stringify({ schema: "JBC_MEDIA_SYNC_v0.2", records: prevSync }, null, 2) + "\n");
    summary.wrote = true; if (realWrite) summary.reference_bindings = refreshReferenceBindings(); if (realWrite) summary.contextual_projection = refreshContextualResearch(); if (realWrite) recordLineage(results.concat(reg.regionMeta.map((m) => ({ doc: { stable_id: m.stable_id }, meta: { source: m.source } }))), disc, srcChanges);
  }
  if (!opts.dryRun && opts.writeArtifacts !== false) {
    const strip = (p) => ({ source: p.source, frontmatter: p.frontmatter, order: p.order, sections: Object.fromEntries(p.order.map((k) => [k, { heading: p.sections[k].heading, level: p.sections[k].level, textLines: p.sections[k].text.length, quotes: p.sections[k].quotes, fields: p.sections[k].fields, tables: p.sections[k].tables.map((t) => ({ header: t.header, rows: t.rows.length })), yamlBlocks: p.sections[k].yaml.length }])) });
    write(path.join(outDir, "00-discovery.json"), JSON.stringify(disc, null, 2));
    for (const r of results) { if (r.skipped || !r.parsed) continue; const d = path.join(outDir, "records", r.doc.stable_id);
      write(path.join(d, "01-parsed.json"), JSON.stringify(strip(r.parsed), null, 2)); write(path.join(d, "02-validation.json"), JSON.stringify(r.validation, null, 2));
      write(path.join(d, "03-normalized.json"), JSON.stringify({ record: r.norm.record, provenance: r.norm.provenance, warnings: r.norm.warnings, skipped: r.norm.skipped, overlayFields: r.norm.overlayFields }, null, 2));
      if (r.mediaReport) { write(path.join(d, "04-projection-entry.json"), JSON.stringify(r.norm.record, null, 2)); write(path.join(d, "05-scripture-index.json"), JSON.stringify(r.index, null, 2)); write(path.join(d, "06-media-report.json"), JSON.stringify(r.mediaReport, null, 2)); } }
    write(path.join(outDir, "relation-binding-report.json"), JSON.stringify(Object.assign({ schema: "JBC_RELATION_BINDING_REPORT_v0.1" }, relBind), null, 2));
    write(path.join(outDir, "run-summary.json"), JSON.stringify({ assets: summary.assets, discovery: { found: disc.found.map((f) => f.vrel), skipped: disc.skipped, excluded: disc.excluded, scanned: disc.scanned }, records: summary.records, relation_binding: relBind.counts, preserved_last_known_good: summary.preserved_last_known_good, wrote: summary.wrote }, null, 2));
  }
  return summary;
}

// Online step, only when asked (--resolve-media): refresh the Commons API cache for every eligible asset of every record.
async function refresh(opts) {
  opts = opts || {}; const cfg = opts.config || loadConfig(opts.configFile), krv = opts.krv || loadKrv(), disc = discover(cfg, opts), out = [];
  for (const d of disc.found) {
    const rc = (cfg.records || {})[d.document_id] || {}; if (!rc.expected_identity || rc.projection_mode === "DETAIL_ONLY") continue;
    const overlayFile = rc.overlay ? path.join(opts.rootDir || ROOT, rc.overlay) : path.join(__dirname, "empty-overlay.json"), parsed = parseNote(d.abs), norm = normalize(parsed, JSON.parse(fs.readFileSync(overlayFile, "utf8")), { relPath: path.relative(ROOT, d.abs), approval: rc.approval });
    if (norm.record) out.push({ record: d.stable_id, media: await resolver.refreshCache(norm.record, { fetcher: opts.fetcher, cacheDir: opts.cacheDir }) });
  }
  return out;
}

if (require.main === module) (async () => {
  if (process.argv.includes("--resolve-media")) console.log(JSON.stringify({ resolver_refresh: await refresh() }, null, 1));
  let s; try { s = ingest({ dryRun: process.argv.includes("--dry"), allowMirror: process.argv.includes("--allow-mirror"), acceptSourceChange: process.argv.includes("--accept-source-change") }); } catch (e) { console.error(e.message); process.exit(e.message.indexOf("STALE_SOURCE_GUARD") === 0 ? 3 : 1); }
  console.log(JSON.stringify({ discovery: { found: s.discovery.found.map((f) => f.vrel), skipped: s.discovery.skipped, scanned: s.discovery.scanned }, assets: s.assets, records: s.records, region_records: s.region_records, event_records: s.event_records, person_projection: s.person_projection || null, relation_binding: s.relation_binding.counts, relation_holds: s.relation_binding.hold, contextual_projection: s.contextual_projection || null, preserved_last_known_good: s.preserved_last_known_good, source_changes: s.source_changes, wrote: s.wrote }, null, 1));
  process.exit(s.records.length && s.records.every((r) => r.ok) && (s.region_records || []).every((r) => r.ok || r.skipped) && (s.event_records || []).every((r) => r.ok) && (!s.person_projection || s.person_projection.ok) && !s.relation_binding.hold.length && !(s.relation_binding.contract_failures || []).length && (!s.contextual_projection || s.contextual_projection.ok) ? 0 : 1);
})();
module.exports = { stagePair, run, ingest, refresh, discover, loadConfig, loadKrv, SOURCE, GERAR, OVERLAY, CONFIG, ROOT };
