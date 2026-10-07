"use strict";
// node tools/pipeline/test-region.js — isolated dry-run tests for the generic region adapter (no live writes).
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");
const iso = require("./isolated-ingest"), { discover, loadConfig, loadKrv, ROOT } = require("./run"), { discoverRegions, buildRegion } = require("./region-adapter"), { parseNote } = require("./parse");
const VAULT = process.env.JBC_VAULT || iso.DEFAULT_VAULT, CFG = path.join(__dirname, "staging", "isolated", "ingest.config.json"), KRV = loadKrv();
const results = [], T = (id, name, fn) => { try { const ev = fn(); results.push({ id, name, pass: true, ev }); } catch (e) { results.push({ id, name, pass: false, err: e.message }); } };
const ok = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"), tree = (d) => { const o = []; (function w(x) { if (!fs.existsSync(x)) return; for (const e of fs.readdirSync(x, { withFileTypes: true })) { const f = path.join(x, e.name); if (e.isDirectory()) w(f); else o.push(f); } })(d); return o.sort().map((f) => path.relative(ROOT, f) + ":" + sha(f).slice(0, 12)).join("|"); };
const LIVE = () => ["data/projection.research.js", "data/scripture.index.js", "tools/pipeline/ingest.config.json", "tools/pipeline/lineage/source-lineage.json"].map((p) => sha(path.join(ROOT, p)).slice(0, 12)).join(",") + "#" + tree(path.join(__dirname, "out"));
const ATLAS = path.join(VAULT, "02_연구물", "BIBLE_ATLAS_LEVEL_A_90_PLACE_REFERENCE_v0.1.md"), liveBefore = LIVE(), atlasBefore = fs.existsSync(ATLAS) ? sha(ATLAS) : "none";
const copyNotes = (v) => { for (const inc of cfg.include) { const src = path.join(VAULT, inc), dst = path.join(v, inc); fs.mkdirSync(dst, { recursive: true }); (function w(a, b) { for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (e.isDirectory()) { fs.mkdirSync(path.join(b, e.name), { recursive: true }); w(path.join(a, e.name), path.join(b, e.name)); } else if (/\.md$/i.test(e.name)) fs.copyFileSync(path.join(a, e.name), path.join(b, e.name)); } })(src, dst); } };   // plain .md copies only (no Drive metadata files)
const tmpOut = () => fs.mkdtempSync(path.join(os.tmpdir(), "jbc-iso-")), cfg = loadConfig(CFG);
const A_ID = "JBC-CR-PLACE-AMALEK-001", REG = "BAT01-PLACE-0059";
const load = (f, n) => iso.loadGenerated(f, n);

const out1 = tmpOut(); let R1;
T("RG01", "place discovery unchanged: live config still finds exactly the two Place records; the region note is not claimed by it", () => {
  const live = discover(loadConfig(), { vault: VAULT }), isoD = discover(cfg, { vault: VAULT });
  ok(live.found.map((f) => f.document_id).join() === isoD.found.map((f) => f.document_id).join() && live.found.length === 2, "place discovery differs: " + isoD.found.map((f) => f.document_id)); ok(!isoD.found.some((f) => /AMALEK/.test(f.document_id)), "amalek must not be discovered as a Place");
  const rd = discoverRegions(iso.listNotes(cfg, VAULT).filter((n) => !isoD.found.some((f) => f.abs === n.abs)), {}); ok(rd.found.length === 1 && rd.found[0].stable_id === A_ID && rd.found[0].entity_type === "region", "region discovery"); return ["place=" + live.found.length, "region=" + rd.found.length];
});
T("RG02", "entity-type dispatch: an unsupported entity_type is skipped with a reason, never coerced", () => {
  const v = fs.mkdtempSync(path.join(os.tmpdir(), "jbc-v-")); copyNotes(v);
  const f = path.join(v, "02_연구물", "아말렉", "JBC_AMALEK_CONNECTED_WORBS_20261001_01.md"), t = fs.readFileSync(f, "utf8").replace("entity_type: region", "entity_type: person"); fs.writeFileSync(f, t);
  const r = iso.run({ vault: v, outDir: tmpOut(), configFile: CFG, noWrite: true }); ok(Object.keys(r.projection.regions).length === 0 && r.report.summary.skipped.some((s) => /no adapter/.test(s.reason)) && Object.keys(r.projection.places).length === 2, "person must be skipped, places unaffected"); return r.report.summary.skipped.map((s) => s.reason);
});
T("RG03", "isolated dry run passes and writes only to the isolated directory", () => { R1 = iso.run({ vault: VAULT, outDir: out1, configFile: CFG }); ok(R1.report.verdict === "PASS" && R1.report.counts.places === 2 && R1.report.counts.regions === 1, JSON.stringify(R1.report.counts)); ok(fs.existsSync(path.join(out1, "projection.research.js")) && fs.existsSync(path.join(out1, "scripture.index.js"))); return [JSON.stringify(R1.report.counts)]; });
T("RG04", "Amalek region semantics preserved (entity_type region, regions container, registry id reference-only, no coordinates/markers/polygons, VERIFY/HOLD)", () => {
  const P = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"), r = P.regions[A_ID];
  ok(r && !P.places[A_ID] && Object.keys(P.regions).length === 1 && r.entity_type === "Region", "region must live only in regions"); ok(r.identity_binding.source_registry_id === REG && r.identity_binding.source_registry_id_role === "REFERENCE_ONLY" && r.stable_id === A_ID && !JSON.stringify(P.places).includes(REG), "BAT01 reference only; never an id/merge");
  ok(r.coordinates === null && r.centroid === null && r.spatial.primary.marker.render === false && r.spatial.region.boundary === null && r.spatial.sites.length === 0 && r.spatial.routes.length === 0 && r.reader.published === false, "no coordinate/marker/polygon/reader"); ok(r.verify.length === 7 && r.hold.length === 10 && /WITH_VERIFY/.test(r.status) && r.activation.publishable === false && r.activation.state === "ISOLATED_DRY_RUN_ONLY" && r.authority.approval === "CAPTAIN_APPROVED", "VERIFY/HOLD kept; approved via ingest authority but not publishable");
  ok(P.meta.regions.length === 1 && P.meta.regions[0].source_registry_id === REG && !P.meta.records.some((m) => m.stable_id === A_ID), "meta lists the region separately from place records"); return ["verify=7", "hold=10", "links=" + r.passage_links.length];
});
T("RG05", "existing Place regression: isolated Place projection and Place index entries equal the live ones", () => {
  const P = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"), L = load(path.join(ROOT, "data", "projection.research.js"), "BVC_PROJECTION");
  const preservesLegacy = (n, old, at) => { if (Array.isArray(old)) { ok(Array.isArray(n) && n.length === old.length, at + " array shape"); old.forEach((v, i) => preservesLegacy(n[i], v, at + "[" + i + "]")); return; } if (old && typeof old === "object") { ok(n && typeof n === "object", at + " object missing"); Object.keys(old).forEach((k) => preservesLegacy(n[k], old[k], at + "." + k)); return; } ok(JSON.stringify(n) === JSON.stringify(old), at + " changed"); };
  ok(JSON.stringify(Object.keys(P.places)) === JSON.stringify(Object.keys(L.places)), "place ids"); for (const k of Object.keys(L.places)) preservesLegacy(P.places[k], L.places[k], "places." + k);
  const I = load(path.join(out1, "scripture.index.js"), "BVC_SCRIPTURE_INDEX"), LI = load(path.join(ROOT, "data", "scripture.index.js"), "BVC_SCRIPTURE_INDEX"), ids = Object.keys(L.places), pick = (idx) => { const o = {}; Object.keys(idx.entries).sort().forEach((k) => { const e = idx.entries[k].filter((x) => ids.includes(x.stable_id)); if (e.length) o[k] = e; }); return JSON.stringify(o); };
  ok(pick(I) === pick(LI), "place entries differ from live index"); return ["places=" + ids.length, "verses(place)=" + Object.keys(JSON.parse(pick(LI))).length];
});
T("RG06", "scripture index integrity: region tagged only inside direct ranges with a literal surface; related never tagged; no duplicates; all ids resolve", () => {
  const P = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"), I = load(path.join(out1, "scripture.index.js"), "BVC_SCRIPTURE_INDEX"), r = P.regions[A_ID], seen = new Set(), bad = [];
  const inDirect = (book, ch, v) => r.passage_links.some((l) => l.group === "direct" && l.book === book && l.chapter === ch && v >= (l.v1 || 1) && v <= (l.v2 || 999));
  for (const k of Object.keys(I.entries)) for (const e of I.entries[k]) { const m = /^([a-z0-9]+)-(\d+):(\d+)$/.exec(k), b = KRV.books.find((x) => x.id === m[1]), txt = b.chapters[+m[2] - 1][+m[3] - 1], key = k + "|" + e.stable_id; if (seen.has(key)) bad.push("dup " + key); seen.add(key); if (!(P.places[e.stable_id] || P.regions[e.stable_id])) bad.push("unresolved id " + e.stable_id); if (e.stable_id === A_ID) { if (!inDirect(m[1], +m[2], +m[3])) bad.push("outside direct " + k); if (e.group !== "direct") bad.push("group " + k); if (!e.spans.length || !e.spans.every((s) => txt.slice(s[0], s[1]) === e.surface)) bad.push("span " + k); } }
  const related = r.passage_links.filter((l) => l.group === "related"); for (const l of related) if (l.v1 && !inDirect(l.book, l.chapter, l.v1) && I.entries[l.book + "-" + l.chapter + ":" + l.v1] && I.entries[l.book + "-" + l.chapter + ":" + l.v1].some((e) => e.stable_id === A_ID)) bad.push("related tagged " + l.raw);
  ok(!bad.length, bad.join("; ")); ok(I.meta.records.some((x) => x.record === A_ID) && I.meta.isolated === true, "index meta lists the region"); const n = Object.keys(I.entries).filter((k) => I.entries[k].some((e) => e.stable_id === A_ID)).length; ok(n > 0, "region verses tagged"); return ["amalek_verses=" + n, "stats=" + JSON.stringify(R1.report.summary.region_records[0].index).slice(0, 120)];
});
T("RG07", "idempotency: same input twice → byte-identical outputs, one region, zero duplicates", () => {
  const o2 = tmpOut(), a = iso.run({ vault: VAULT, outDir: o2, configFile: CFG }), b = iso.run({ vault: VAULT, outDir: o2, configFile: CFG }); ok(a.report.sha256.projection === b.report.sha256.projection && a.report.sha256.index === b.report.sha256.index, "outputs changed between runs"); ok(R1.report.sha256.projection === a.report.sha256.projection, "outputs differ between independent dirs");
  const P = load(path.join(o2, "projection.research.js"), "BVC_PROJECTION"); ok(Object.keys(P.regions).length === 1 && P.meta.regions.length === 1 && P.meta.records.length === 2, "duplicate entries"); return ["projection=" + a.report.sha256.projection.slice(0, 12)];
});
T("RG08", "fail-closed + last known good: a violation (injected centroid) excludes nothing silently — the previous valid region is preserved", () => {
  const o3 = tmpOut(), good = iso.run({ vault: VAULT, outDir: o3, configFile: CFG }); ok(good.report.verdict === "PASS");
  const v = fs.mkdtempSync(path.join(os.tmpdir(), "jbc-v2-")); copyNotes(v);
  const f = path.join(v, "02_연구물", "아말렉", "JBC_AMALEK_CONNECTED_WORBS_20261001_01.md"), t = fs.readFileSync(f, "utf8"); ok(t.includes("    centroid: NONE"), "fixture anchor"); fs.writeFileSync(f, t.replace("    centroid: NONE", "    centroid: 30.65, 34.42"));
  const before = fs.readFileSync(path.join(o3, "projection.research.js"), "utf8"), bad = iso.run({ vault: v, outDir: o3, configFile: CFG }); const rr = bad.report.summary.region_records[0];
  ok(!rr.ok && rr.errors.some((e) => /R07/.test(e)) && rr.preserved_last_known_good === true && bad.report.verdict === "PARTIAL_WITH_LAST_KNOWN_GOOD", "must fail closed with LKG: " + JSON.stringify(rr).slice(0, 200));
  const P = load(path.join(o3, "projection.research.js"), "BVC_PROJECTION"), G = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"); ok(JSON.stringify(P.regions[A_ID]) === JSON.stringify(G.regions[A_ID]) && P.meta.regions[0].preserved_last_known_good === true, "last known good region unchanged"); ok(!JSON.stringify(P).includes("30.65"), "invented coordinate never reaches output");
  const o4 = tmpOut(), cold = iso.run({ vault: v, outDir: o4, configFile: CFG }); ok(cold.report.verdict === "FAIL_CLOSED" && Object.keys(cold.projection.regions).length === 0 && Object.keys(cold.projection.places).length === 2, "without LKG the invalid region is simply absent; places unaffected"); return [rr.errors[0].slice(0, 60)];
});
T("RG09", "isolation: live data, ingest config, media sync, lineage, out/ and the ATLAS reference are byte-identical after all runs", () => { ok(LIVE() === liveBefore, "live files changed"); ok((fs.existsSync(ATLAS) ? sha(ATLAS) : "none") === atlasBefore, "atlas changed"); let thrown = false; try { iso.run({ vault: VAULT, outDir: path.join(ROOT, "data"), configFile: CFG, noWrite: true }); } catch (e) { thrown = /ISOLATION_GUARD/.test(e.message); } ok(thrown, "isolation guard must refuse data/"); return ["live=" + liveBefore.slice(0, 40)]; });
T("RG10", "approval is consumed from the bound ingest authority (note's PENDING value retained), V33-equivalent passes; without that authority the region fails closed", () => {
  const P = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"), au = P.regions[A_ID].authority;
  ok(au.approval === "CAPTAIN_APPROVED" && au.note_approval_status === "PENDING_CAPTAIN_REVIEW" && au.approval_origin === "ingest_authority" && /approval record APR-JBC-AMALEK/.test(au.approval_source), "authority: " + JSON.stringify(au).slice(0, 160));
  ok(R1.report.summary.region_records[0].checks >= 17, "region validator ran all checks");
  const noAuth = JSON.parse(JSON.stringify(cfg)); delete noAuth.records["JBC_AMALEK_CONNECTED_WORBS_20261001_01"].approval; const r = iso.run({ vault: VAULT, outDir: tmpOut(), config: noAuth, noWrite: true, approvalsDir: tmpOut() }), rr = r.report.summary.region_records[0];
  ok(!rr.ok && rr.errors.some((e) => /R15/.test(e)) && Object.keys(r.projection.regions).length === 0, "no approval authority → R15 fails closed (validator not relaxed)"); return ["effective=" + au.approval, "note=" + au.note_approval_status];
});
T("RG11", "Region geometry contract: none is allowed (polygon omitted, detail + relations available); polygons only from explicit approved geometry", () => {
  const { validateRegion } = require("./validate-region"), P = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"), r = P.regions[A_ID];
  ok(r.entity_type === "Region" && r.geometry.status === "none" && r.geometry.type === null && r.geometry.map_polygon === "OMIT" && r.geometry.detail === "AVAILABLE" && r.geometry.relations === "AVAILABLE" && r.relations.length > 0, "Amalek: geometry none, polygon omitted, detail + relations available");
  const ctx = { krv: KRV, expected_identity: A_ID }, mk = (g) => Object.assign(JSON.parse(JSON.stringify(r)), { geometry: g });
  for (const t of ["polygon", "multipolygon", "approximate_area"]) { ok(!validateRegion(mk({ status: "present", type: t, approved: false, approval_source: null }), ctx).ok, t + " without explicit approval must be rejected"); ok(!validateRegion(mk({ status: "none", type: t, approved: false, approximate_area: null, map_polygon: "OMIT", detail: "AVAILABLE", relations: "AVAILABLE" }), ctx).ok, "'none' status carrying a " + t + " must be rejected"); }
  ok(validateRegion(mk({ status: "present", type: "polygon", approved: true, approval_source: "approved geometry record X" }), ctx).errors.every((e) => !/R17/.test(e)), "explicitly approved geometry satisfies the geometry contract (shape check only)");
  ok(r.spatial.reference_only.external_geometry.rendered === false && r.spatial.reference_only.external_geometry.geometry_embedded === false, "the VERIFY reference overlay is never treated as approved geometry"); return ["geometry=none"];
});
T("RG12", "durable approval record: referenced by id, carries id/date/scope; removal, tampering or scope creep fail closed", () => {
  const recFile = path.join(ROOT, "tools", "pipeline", "approvals", "AMALEK_IDENTITY_BINDING_APPROVAL_v0.1.json"), rec = JSON.parse(fs.readFileSync(recFile, "utf8"));
  ok(rec.approval_record_id === "APR-JBC-AMALEK-IDBIND-20261002-001" && rec.approval_authority === "CAPTAIN" && rec.approval_state === "CAPTAIN_APPROVED" && rec.approval_scope === "IDENTITY_BINDING_ONLY" && /^\d{4}-\d{2}-\d{2}$/.test(rec.approval_date) && !!rec.recorded_at && rec.approved_asset === "JBC_AMALEK_CONNECTED_WORBS_20261001_01" && rec.approved_stable_identity === A_ID && rec.source_reference.registry_id === REG, "record has id, authority, date, scope, asset and identities");
  const L = rec.scope_limits; ok(L.coordinate_authorization === false && L.geometry_authorization === false && L.reader_layer_authorization === false && L.live_projection_activation === false && L.registry_effect === "NONE" && L.VERIFY_HOLD === "PRESERVED" && L.research_content_changed === false && rec.evidence.re_approval_requested === false, "no coordinate / geometry / reader-layer / live authorization; registry NONE; VERIFY/HOLD preserved");
  const P = load(path.join(out1, "projection.research.js"), "BVC_PROJECTION"), au = P.regions[A_ID].authority; ok(au.approval_record_id === rec.approval_record_id && au.approval_scope === "IDENTITY_BINDING_ONLY" && au.approval_recorded_at === rec.recorded_at && /approval record APR-/.test(au.approval_source), "projected region references the record id, scope and recorded_at");
  const runWith = (mutate, file) => { const c = JSON.parse(JSON.stringify(cfg)); c.records["JBC_AMALEK_CONNECTED_WORBS_20261001_01"].approval = { record_id: rec.approval_record_id, record_file: file }; return iso.run({ vault: VAULT, outDir: tmpOut(), config: c, noWrite: true }); };
  const bad = (r) => { const x = r.report.summary.region_records[0]; return !x.ok && x.errors.some((e) => /R15/.test(e)) && Object.keys(r.projection.regions).length === 0; };
  ok(bad(runWith(null, path.join(os.tmpdir(), "jbc-no-such-approval.json"))), "record removed → fail closed");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jbc-apr-")), tamper = (name, fn) => { const o = JSON.parse(JSON.stringify(rec)); fn(o); const f = path.join(tmp, name + ".json"); fs.writeFileSync(f, JSON.stringify(o)); return runWith(null, f); };
  ok(bad(tamper("scope", (o) => { o.approval_scope = "FULL_PROJECTION"; })), "scope widened → fail closed"); ok(bad(tamper("geom", (o) => { o.scope_limits.geometry_authorization = true; })), "geometry authorization → fail closed"); ok(bad(tamper("asset", (o) => { o.approved_asset = "JBC_OTHER_20261001_01"; })), "asset mismatch → fail closed");
  ok(bad(tamper("ident", (o) => { o.approved_stable_identity = "JBC-CR-PLACE-OTHER-001"; })), "identity mismatch → fail closed"); ok(bad(tamper("auth", (o) => { o.approval_authority = "ASSISTANT"; })), "non-Captain authority → fail closed"); ok(bad(tamper("date", (o) => { delete o.approval_date; })), "missing date → fail closed");
  ok(bad(tamper("reapp", (o) => { o.evidence.re_approval_requested = true; })), "re-approval request flag → fail closed"); return ["id=" + rec.approval_record_id, "recorded_at=" + rec.recorded_at];
});
T("RG13", "explicit Region navigation metadata is preserved as multi-path derived-index input without changing Region identity", () => {
  const f = path.join(VAULT, "02_연구물", "아말렉", "JBC_AMALEK_CONNECTED_WORBS_20261001_01.md"), p0 = parseNote(f), k = "NAVIGATION_TEST";
  p0.order.push(k); p0.sections[k] = { heading: k, yaml: [{ data: { navigation_paths: [
    { domain: "구약 역사", period: "검증 시대 A", story: "지역 이야기 A", scene: "지역 장면 A", passage_refs: ["Exodus 17:8"], places: [A_ID] },
    { domain: "기초 지리", period: "검증 시대 B", story: "지역 이야기 B", scene: "지역 장면 B", passage_refs: ["Numbers 24:20"], places: [A_ID] }
  ] } }], text: [], tables: [] };
  const br = buildRegion(p0, { profile: "app_ready_metadata", relPath: "fixture/amalek.md", activationState: "ISOLATED_DRY_RUN_ONLY" }).record;
  ok(br && br.stable_id === A_ID && Array.isArray(br.navigation) && br.navigation.length === 2 && br.navigation.every((n) => n.places[0] === A_ID), JSON.stringify(br && br.navigation));
  return ["paths=2", "stable_id="+br.stable_id];
});
const p = results.filter((r) => r.pass).length; console.log((p === results.length ? "PASS " : "FAIL ") + p + "/" + results.length);
results.forEach((r) => console.log((r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.pass ? (r.ev && r.ev.length ? "  · " + r.ev.join(" ") : "") : "  ✗ " + r.err)));
process.exit(p === results.length ? 0 : 1);
