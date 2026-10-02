"use strict";
// ISOLATED dry-run ingest: Place records → existing pipeline (run.js ingest, in memory); Region records → the shared region pass (region-stage.js).
// Output goes ONLY to an isolated directory (default tools/pipeline/staging/isolated). The canonical generation (run.js) uses the same region pass.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), vm = require("vm");
const { ingest, loadConfig, loadKrv, ROOT } = require("./run"), sidx = require("./scripture-index"), rb = require("./relation-binding"), { listNotes, regionPass } = require("./region-stage");

const DEFAULT_OUT = path.join(__dirname, "staging", "isolated"), DEFAULT_VAULT = "G:/내 드라이브/Projects/옵시디언/Jude_Research";
const sha256f = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const loadGenerated = (file, name) => { try { const w = {}; w.window = w; vm.runInNewContext(fs.readFileSync(file, "utf8"), w); return w[name] || null; } catch (e) { return null; } };

function run(opts) {
  opts = opts || {};
  const outDir = path.resolve(opts.outDir || DEFAULT_OUT), vault = opts.vault || process.env.JBC_VAULT || DEFAULT_VAULT, cfg = opts.config || loadConfig(opts.configFile), krv = opts.krv || loadKrv();
  if (path.resolve(outDir) === path.resolve(ROOT, "data") || path.resolve(outDir) === path.resolve(__dirname, "out")) throw new Error("ISOLATION_GUARD: the isolated output directory may not be a live data directory");
  if (!fs.existsSync(vault)) throw new Error("vault unavailable: " + vault);   // no mirror fallback
  fs.mkdirSync(outDir, { recursive: true });
  const projFile = path.join(outDir, "projection.research.js"), idxFile = path.join(outDir, "scripture.index.js"), prevProj = loadGenerated(projFile, "BVC_PROJECTION"), prevIdx = loadGenerated(idxFile, "BVC_SCRIPTURE_INDEX");
  // Place path: the canonical ingest in memory (its own region pass is switched off here; the shared pass runs below with the isolated state)
  const place = ingest({ dryRun: true, config: Object.assign({}, cfg, { _no_region_pass: true }), krv, vault, dataDir: outDir, outDir: path.join(outDir, "_unused"), syncFile: path.join(outDir, "_media-sync.json"), writeArtifacts: false });
  const claimed = new Set(place.discovery.found.map((f) => f.abs)), reg = regionPass({ cfg, krv, vault, claimedAbs: claimed, prevProj, prevIdx, approvalsDir: opts.approvalsDir });
  rb.bindRelations({ places: place.projection.places, regions: reg.regions }, { prev: prevProj });   // same whole-graph binding as the canonical run (places were bound without regions inside ingest)
  const summary = { place_records: place.records, region_records: reg.records, skipped: place.discovery.skipped.filter((s) => !reg.records.some((r) => r.document_id && s.path.indexOf(r.document_id) >= 0)).concat(reg.skipped), preserved_last_known_good: reg.preserved };
  const parts = [];
  for (const r of place.results) if (r.validation && r.validation.ok) parts.push({ record: r.doc.stable_id, research_id: r.meta.research_id, source_sha256: r.meta.source.sha256, entries: r.index.entries, stats: r.index.stats });
  const index = sidx.combine(parts.concat(reg.parts), krv); index.meta.krv_sha256 = sha256f(path.join(ROOT, "data", "krv.js")); index.meta.isolated = true;
  const projection = { meta: Object.assign({}, place.projection.meta, { isolated: true, generated_by: "tools/pipeline/isolated-ingest.js v0.1", regions: reg.regionMeta }), places: place.projection.places, regions: reg.regions };
  const hdr = "// ISOLATED DRY-RUN OUTPUT — not loaded by the app, never written to data/. Places via the existing pipeline; regions via the shared region pass.\n";
  const projText = hdr + "window.BVC_PROJECTION = " + JSON.stringify(projection, null, 2) + ";\n", idxText = hdr + "window.BVC_SCRIPTURE_INDEX = " + JSON.stringify(index, null, 2) + ";\n";
  const anyFail = reg.records.some((r) => !r.ok && !r.skipped) || place.records.some((r) => !r.ok);
  if (!opts.noWrite) { fs.writeFileSync(projFile, projText); fs.writeFileSync(idxFile, idxText); }
  const report = { verdict: anyFail ? (reg.preserved.length ? "PARTIAL_WITH_LAST_KNOWN_GOOD" : "FAIL_CLOSED") : "PASS", out_dir: outDir.replace(/\\/g, "/"), counts: { places: Object.keys(projection.places).length, regions: Object.keys(reg.regions).length, index_verses: Object.keys(index.entries).length }, sha256: { projection: crypto.createHash("sha256").update(projText).digest("hex"), index: crypto.createHash("sha256").update(idxText).digest("hex") }, summary };
  if (!opts.noWrite) fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
  return { report, projection, index, place };
}
if (require.main === module) {
  try { const out = (() => { const i = process.argv.indexOf("--out"); return i > 0 ? process.argv[i + 1] : null; })(), cf = (() => { const i = process.argv.indexOf("--config"); return i > 0 ? process.argv[i + 1] : path.join(DEFAULT_OUT, "ingest.config.json"); })(); const r = run({ outDir: out, configFile: cf }).report; console.log(JSON.stringify({ verdict: r.verdict, counts: r.counts, sha256: r.sha256, regions: r.summary.region_records.map((x) => ({ id: x.stable_id, ok: x.ok })) }, null, 1)); process.exit(r.verdict === "PASS" ? 0 : 1); }
  catch (e) { console.error("HOLD: " + e.message); process.exit(2); }
}
module.exports = { run, listNotes, loadGenerated, DEFAULT_OUT, DEFAULT_VAULT };
