"use strict";
// SINGLE-REGION live projection commit: adds the validated Amalek Region (and only its Scripture Index entries) from the isolated staging
// output to data/projection.research.js and data/scripture.index.js. Everything else in the live files stays byte-for-byte equal in meaning
// (places, person data, existing index entries). Never touches Registry, media sync, the ingest config, or KRV.
//   node tools/pipeline/live-region-commit.js            → preflight + commit (writes a rollback backup first)
//   node tools/pipeline/live-region-commit.js --dry      → preflight only
//   node tools/pipeline/live-region-commit.js --rollback → restore the pre-commit backup (verifies hashes)
const fs = require("fs"), path = require("path"), crypto = require("crypto"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..", ".."), SID = "JBC-CR-PLACE-AMALEK-001", STAGE = path.join(__dirname, "staging", "isolated");
const LIVE = { proj: path.join(ROOT, "data", "projection.research.js"), idx: path.join(ROOT, "data", "scripture.index.js") };
const BK = path.join(__dirname, "baseline", "live-region-commit"), BKF = { proj: path.join(BK, "projection.research.pre-amalek.js"), idx: path.join(BK, "scripture.index.pre-amalek.js") }, MAN = path.join(BK, "manifest.json");
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"), J = (o) => JSON.stringify(o), eq = (a, b) => J(a) === J(b);
const load = (f, n) => { const w = {}; w.window = w; vm.runInNewContext(fs.readFileSync(f, "utf8"), w); return w[n]; };
const ser = (n, o) => "window." + n + " = " + JSON.stringify(o, null, 2) + ";\n";
const fail = (m) => { console.error("ABORT: " + m); process.exit(1); };

function rollback() {
  const m = JSON.parse(fs.readFileSync(MAN, "utf8"));
  for (const k of ["proj", "idx"]) { if (sha(BKF[k]) !== m.pre[k]) fail("backup hash mismatch: " + k); fs.copyFileSync(BKF[k], LIVE[k]); if (sha(LIVE[k]) !== m.pre[k]) fail("restore verification failed: " + k); }
  console.log("ROLLBACK OK — live files restored to pre-commit sha256 " + m.pre.proj.slice(0, 12) + " / " + m.pre.idx.slice(0, 12)); process.exit(0);
}
if (process.argv.includes("--rollback")) rollback();

// ---- preflight ----
const rep = JSON.parse(fs.readFileSync(path.join(STAGE, "report.json"), "utf8"));
if (rep.verdict !== "PASS") fail("isolated ingest report is not PASS");
const SP = path.join(STAGE, "projection.research.js"), SI = path.join(STAGE, "scripture.index.js");
if (sha(SP) !== rep.sha256.projection || sha(SI) !== rep.sha256.index) fail("staging files differ from the validated report hashes");
const sp = load(SP, "BVC_PROJECTION"), si = load(SI, "BVC_SCRIPTURE_INDEX"), lp = load(LIVE.proj, "BVC_PROJECTION"), li = load(LIVE.idx, "BVC_SCRIPTURE_INDEX");
const R = sp.regions && sp.regions[SID]; if (!R) fail("Amalek region missing in staging");
if (Object.keys(sp.regions).length !== 1) fail("staging holds more than the single pilot region");
if (lp.regions || (li.meta.records || []).some((r) => r.record === SID) || J(li.entries).includes(SID)) fail("live files already carry the region (not a fresh commit)");
const must = [["entity_type", R.entity_type === "Region"], ["stable_id", R.stable_id === SID], ["approval", R.authority.approval === "CAPTAIN_APPROVED" && R.authority.approval_record_id === "APR-JBC-AMALEK-IDBIND-20261002-001" && R.authority.approval_scope === "IDENTITY_BINDING_ONLY" && R.authority.note_approval_status === "PENDING_CAPTAIN_REVIEW"],
  ["registry", R.identity_binding.source_registry_id === "BAT01-PLACE-0059" && R.identity_binding.source_registry_id_role === "REFERENCE_ONLY" && R.identity_binding.automatic_merge === false && R.identity_binding.BAT01_P_crosswalk === false && R.identity_binding.BAT01_PLACE_reuse === false],
  ["published", R.reader.published === false && R.activation.publishable === false], ["geometry", R.coordinates === null && R.centroid === null && R.geometry.status === "none" && R.geometry.map_polygon === "OMIT" && R.spatial.primary.marker.render === false && !R.spatial.region.boundary],
  ["verify/hold", R.verify.length === 7 && R.hold.length === 10], ["status", R.status === "RESEARCH_COMPLETE_WITH_VERIFY"], ["places equal live", eq(lp.places, sp.places)]];
must.forEach((m) => { if (!m[1]) fail("preflight failed: " + m[0]); });
const meta = (sp.meta.regions || []).filter((m) => m.stable_id === SID)[0], im = (si.meta.records || []).filter((r) => r.record === SID)[0];
if (!meta || !im || im.source_sha256 !== R.source_refs[0].sha256 || meta.source.sha256 !== R.source_refs[0].sha256) fail("source hash chain (projection ↔ index) broken");
if (si.meta.krv_sha256 !== li.meta.krv_sha256 || si.meta.krv_modified !== false) fail("KRV hash differs between staging and live index");

// ---- build ----
const proj = { meta: Object.assign({}, lp.meta, { regions: [meta] }), places: lp.places, regions: { [SID]: R } };
const entries = {}; Object.keys(li.entries).forEach((k) => { entries[k] = li.entries[k].slice(); });
let added = 0; Object.keys(si.entries).forEach((k) => { const a = si.entries[k].filter((e) => e.stable_id === SID); if (!a.length) return; added++; entries[k] = (entries[k] || []).concat(a); });
const idx = { meta: Object.assign({}, li.meta, { records: li.meta.records.concat([im]) }), entries };
const head = fs.readFileSync(LIVE.proj, "utf8").split("window.BVC_PROJECTION = ")[0].replace("// App-side reader fields", "//   " + SID + "  ←  " + R.source_refs[0].path + "  sha256: " + R.source_refs[0].sha256 + "  (Region · identity binding only · reader.published=false · no geometry)\n// App-side reader fields");
const idxHead = fs.readFileSync(LIVE.idx, "utf8").split("window.BVC_SCRIPTURE_INDEX = ")[0];
const outProj = head + ser("BVC_PROJECTION", proj), outIdx = idxHead + ser("BVC_SCRIPTURE_INDEX", idx);

// ---- verify the build before writing ----
const w1 = {}; w1.window = w1; vm.runInNewContext(outProj, w1); const np = w1.BVC_PROJECTION;
const w2 = {}; w2.window = w2; vm.runInNewContext(outIdx, w2); const ni = w2.BVC_SCRIPTURE_INDEX;
if (!eq(np.places, lp.places) || !eq(np.regions[SID], R) || Object.keys(np.regions).length !== 1) fail("post-build projection check");
Object.keys(li.entries).forEach((k) => { if (!eq(ni.entries[k].filter((e) => e.stable_id !== SID), li.entries[k])) fail("existing index entry changed: " + k); });
if (Object.keys(ni.entries).some((k) => ni.entries[k].some((e) => e.stable_id === SID) && !si.entries[k])) fail("index entry not in staging");
const stats = { projection_places_unchanged: true, region_entries_added_verses: added, index_verses_before: Object.keys(li.entries).length, index_verses_after: Object.keys(ni.entries).length };
if (process.argv.includes("--dry")) { console.log("DRY OK", J(stats)); process.exit(0); }

// ---- backup + write ----
fs.mkdirSync(BK, { recursive: true }); fs.copyFileSync(LIVE.proj, BKF.proj); fs.copyFileSync(LIVE.idx, BKF.idx);
const pre = { proj: sha(LIVE.proj), idx: sha(LIVE.idx) }; if (sha(BKF.proj) !== pre.proj || sha(BKF.idx) !== pre.idx) fail("backup verification failed");
fs.writeFileSync(LIVE.proj, outProj); fs.writeFileSync(LIVE.idx, outIdx);
const post = { proj: sha(LIVE.proj), idx: sha(LIVE.idx) };
fs.writeFileSync(MAN, JSON.stringify({ task: "EXECUTE_SINGLE_AMALEK_REGION_LIVE_PROJECTION_COMMIT_v0.1", region: SID, committed_at: new Date().toISOString(), pre, post, stats, rollback: "node tools/pipeline/live-region-commit.js --rollback" }, null, 2) + "\n");
console.log("COMMIT OK", J({ pre, post, stats }));
