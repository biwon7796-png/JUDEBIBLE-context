"use strict";
// node tools/pipeline/test-autodiscovery.js — approved-research auto-discovery: no per-asset registration, entity-type dispatch, eligibility gate, determinism.
// Everything runs in memory or in temp directories; the live data/ files, the ingest config and the vault notes are only read.
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto"), vm = require("vm");
const { ingest, discover, loadConfig, loadKrv, ROOT } = require("./run"), { findApprovalRef } = require("./region-stage");
const VAULT = process.env.JBC_VAULT, KRV = loadKrv(), CFG = loadConfig(), ACH = "JBC_ACHAIA_CONNECTED_WORBS_20260930_01", AMA = "JBC_AMALEK_CONNECTED_WORBS_20261001_01", A_ID = "JBC-CR-PLACE-ACHAIA-001", M_ID = "JBC-CR-PLACE-AMALEK-001";
const results = [], T = (id, name, fn) => { try { results.push({ id, name, pass: true, ev: fn() || [] }); } catch (e) { results.push({ id, name, pass: false, err: e.message }); } };
const ok = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex"), J = JSON.stringify;
const load = (f, n) => { const w = {}; w.window = w; vm.runInNewContext(fs.readFileSync(f, "utf8"), w); return w[n]; };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "jbc-ad-"));
const gen = (o) => { o = o || {}; const d = tmp(); const s = ingest(Object.assign({ config: o.config || CFG, krv: KRV, dataDir: d, outDir: d, syncFile: path.join(d, "sync.json"), writeArtifacts: false }, o.opts || {})); return { d, s, P: s.projection, I: s.index }; };
const vaultCopy = (names, edit) => { const v = tmp(); for (const [rel, f] of names) { const dst = path.join(v, "02_연구물", rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, edit ? edit(rel, fs.readFileSync(path.join(VAULT, "02_연구물", rel), "utf8")) : fs.readFileSync(path.join(VAULT, "02_연구물", rel))); } for (const x of ["01_소스들", "03_산출물", "99_운영문서"]) fs.mkdirSync(path.join(v, x), { recursive: true }); return v; };
const NOTE = (id) => id + ".md", ACH_REL = "아가야/" + NOTE(ACH), AMA_REL = "아말렉/" + NOTE(AMA), BS_REL = "브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md", GR_REL = "그랄/JBC_GERAR_CONNECTED_WORBS_20260930_01.md";
const liveBefore = ["data/projection.research.js", "data/scripture.index.js", "tools/pipeline/ingest.config.json"].map((p) => sha(path.join(ROOT, p))).join(), notes = [ACH_REL, AMA_REL, BS_REL, GR_REL].map((r) => path.join(VAULT, "02_연구물", r)), notesBefore = notes.map(sha).join();
const ap = (over) => { const dir = tmp(), src = JSON.parse(fs.readFileSync(path.join(__dirname, "approvals", "ACHAIA_IDENTITY_BINDING_APPROVAL_v0.1.json"), "utf8")); const r = over(src) || src; fs.writeFileSync(path.join(dir, "a.json"), J(r)); return dir; };

let R1;
T("AD01", "zero manual registration: the config names neither Achaia nor its folder, yet the whole 02_연구물 root is discovered and Achaia is found", () => {
  ok(!J(CFG).includes("ACHAIA") && !J(CFG).includes("아가야") && J(CFG.include) === J(["02_연구물/"]), "config must not register Achaia: " + J(CFG.include));
  R1 = gen(); const a = R1.s.assets.find((x) => x.document_id === ACH); ok(a && a.entity_type === "region" && a.status === "ingested" && a.profile === "worbs_sections" && a.identity_source === "approval_record", J(a)); return [J(a)];
});
T("AD02", "Achaia canonical generation PASS: a Region in the regions container only (never a Place), approval from the durable record, no geometry, VERIFY/HOLD kept", () => {
  const r = R1.P.regions[A_ID]; ok(r && r.entity_type === "Region" && !R1.P.places[A_ID] && R1.s.region_records.every((x) => x.ok), "region present and valid");
  ok(r.authority.approval === "CAPTAIN_APPROVED" && r.authority.note_approval_status === "PENDING_CAPTAIN_REVIEW" && r.authority.approval_record_id === "APR-JBC-ACHAIA-IDBIND-20261002-001" && r.authority.approval_scope === "IDENTITY_BINDING_ONLY" && r.authority.registry_effect === "NONE", "approval is recorded, note value kept");
  ok(r.identity_binding.source_registry_id === "BAT01-PLACE-0016" && r.identity_binding.source_registry_id_role === "REFERENCE_ONLY" && r.identity_binding.BAT01_PLACE_reuse === false && r.identity_binding.BAT01_P_crosswalk === false && r.identity_binding.automatic_merge === false && !J(R1.P.places).includes("BAT01-PLACE-0016"), "registry id reference only, no crosswalk / merge");
  ok(r.coordinates === null && r.centroid === null && r.geometry.status === "none" && r.geometry.map_polygon === "OMIT" && r.spatial.region.boundary === null && r.spatial.primary.marker.render === false && !r.spatial.routes.length && !r.spatial.sites.length, "no coordinate / centroid / boundary / marker / route");
  ok(r.reader.published === false && r.activation.publishable === false && r.activation.state === "NOT_ACTIVATED", "never published"); ok(r.verify.length === 4 && r.hold.length === 6 && /WITH_VERIFY/.test(r.status), "VERIFY/HOLD preserved");
  ok(r.relations.every((x) => x.resolved === true && x.binding && x.binding.state === "IDENTITY_BOUND" && x.binding.detailed_projection === false) && r.related_people.every((x) => x.resolved === false && x.binding.state === "EXPLICIT_UNBOUND") && r.related_events.every((x) => x.resolved === false && x.binding.state === "EXPLICIT_UNBOUND"), "stable Place identities bound; Person/Event explicitly unbound; no automatic identity creation"); ok(r.claims.length === 12 && r.passage_links.filter((l) => l.group === "direct").length === 10, "claims / direct refs as written");
  return ["verify=4", "hold=6", "claims=12", "direct=10"];
});
T("AD03", "Scripture Index: Achaia tagged only inside its 10 direct verses (literal surface), related links never tagged, index meta lists the record", () => {
  const ks = Object.keys(R1.I.entries).filter((k) => R1.I.entries[k].some((e) => e.stable_id === A_ID)); ok(ks.length === 10 && R1.I.stats[A_ID].verses_tagged === 10 && R1.I.stats[A_ID].related_links_not_tagged.length === 4, ks.join());
  ok(R1.I.meta.records.some((x) => x.record === A_ID && x.source_sha256 === R1.P.regions[A_ID].source_refs[0].sha256), "meta source hash chain"); return ["verses=" + ks.length];
});
T("AD04", "existing non-target Place meaning and scripture index are preserved while additive binding metadata is allowed", () => {
  const L = load(path.join(ROOT, "data", "projection.research.js"), "BVC_PROJECTION"), LI = load(path.join(ROOT, "data", "scripture.index.js"), "BVC_SCRIPTURE_INDEX"), ids = Object.keys(L.places).concat(M_ID);
  const additive = new Set(["research_status","identity_binding_status","relation_binding_status","media_binding_status","geometry_status","projection_status","binding","resolved","global_person_id","global_event_id","stable_id"]);
  const legacy = (n, old, at) => { if (Array.isArray(old)) { ok(Array.isArray(n) && n.length === old.length, at + " array"); old.forEach((v, i) => legacy(n[i], v, at + "[" + i + "]")); return; } if (old && typeof old === "object") { ok(n && typeof n === "object", at + " object"); Object.keys(old).filter((k) => !additive.has(k)).forEach((k) => legacy(n[k], old[k], at + "." + k)); return; } ok(J(n) === J(old), at + " changed"); };
  ok(J(Object.keys(L.places)) === J(Object.keys(R1.P.places)), "place order"); for (const k of Object.keys(L.places)) legacy(R1.P.places[k], L.places[k], "places." + k);
  const mr = R1.P.regions[M_ID]; ok(mr && mr.verify.length === 7 && mr.hold.length === 10 && mr.coordinates === null && mr.centroid === null, "Amalek protected meaning/geometry changed");
  const pick = (I) => { const o = {}; Object.keys(I.entries).sort().forEach((k) => { const e = I.entries[k].filter((x) => ids.includes(x.stable_id)); if (e.length) o[k] = e; }); return J(o); }; ok(pick(LI) === pick(R1.I), "index entries of existing records changed"); return ["records=" + ids.length];
});
T("AD05", "deterministic regeneration: two independent generations are byte-identical", () => { const b = gen(); for (const f of ["projection.research.js", "scripture.index.js"]) ok(sha(path.join(R1.d, f)) === sha(path.join(b.d, f)), f + " differs"); return ["projection=" + sha(path.join(b.d, "projection.research.js")).slice(0, 12)]; });
T("AD06", "Amalek still works both ways: with its config entry (live) and with the entry removed (approval record found by asset id) — identical record", () => {
  const cfg2 = JSON.parse(J(CFG)); delete cfg2.records[AMA]; const b = gen({ config: cfg2 }); ok(J(b.P.regions[M_ID]) === J(R1.P.regions[M_ID]), "record differs without config"); ok(b.s.assets.find((x) => x.document_id === AMA).identity_source === "approval_record", "identity from the approval record"); return ["identical"];
});
T("AD07", "eligibility gate — no approval record: the asset is discovered but reported awaiting approval and nothing is generated", () => {
  const dir = tmp(); const b = gen({ opts: { approvalsDir: dir } }); const a = b.s.assets.find((x) => x.document_id === ACH), m = b.s.assets.find((x) => x.document_id === AMA); ok(a.status === "awaiting_approval" && /no approval record/.test(a.reason) && !(b.P.regions || {})[A_ID], J(a)); ok(m.status === "ingested" && !!b.P.regions[M_ID], "the explicitly configured record is unaffected"); ok(findApprovalRef(ACH, dir) === null, "lookup is by asset id"); return [a.reason.slice(0, 80)];
});
T("AD08", "eligibility gate — invalid approval records fail closed (no approval upgrade, scope can't be widened, asset must match)", () => {
  const cases = { geometry_authorization: (r) => { r.scope_limits.geometry_authorization = true; }, reader_layer: (r) => { r.scope_limits.reader_layer_authorization = true; }, scope: (r) => { r.approval_scope = "FULL"; }, state: (r) => { r.approval_state = "PENDING_CAPTAIN_REVIEW"; }, registry_id: (r) => { r.source_reference.registry_id = "BAT01-PLACE-9999"; }, bad_identity: (r) => { r.approved_stable_identity = "ACHAIA"; }, crosswalk: (r) => { r.scope_limits.BAT01_crosswalk = true; } };
  const ev = []; for (const k of Object.keys(cases)) { const b = gen({ opts: { approvalsDir: ap((r) => { cases[k](r); }) } }), a = b.s.assets.find((x) => x.document_id === ACH); ok(a.status === "failed_closed" && !(b.P.regions || {})[A_ID], k + " must fail closed: " + J(a)); ev.push(k + "→failed_closed"); }
  const dir = ap(() => {}); fs.writeFileSync(path.join(dir, "b.json"), fs.readFileSync(path.join(dir, "a.json"))); const amb = gen({ opts: { approvalsDir: dir } }).s.assets.find((x) => x.document_id === ACH); ok(amb.status === "failed_closed" && amb.errors.some((e) => /ambiguous/.test(e)), "two records for one asset are ambiguous"); return ev;
});
T("AD09", "no invented geometry: a coordinate / centroid / polygon written into the note fails closed", () => {
  for (const [from, to] of [["  coordinate: NONE", "  coordinate: 37.9, 22.4"], ["  polygon: NONE", "  polygon: some_polygon"]]) {
    const v = vaultCopy([[ACH_REL]], (rel, t) => { ok(t.includes(from), "fixture anchor " + from); return t.replace(from, to); }), b = gen({ opts: { vault: v } }), a = b.s.assets.find((x) => x.document_id === ACH); ok(a.status === "failed_closed" && /R0[79]/.test(a.reason) && !(b.P.regions || {})[A_ID], J(a)); }
  const v2 = vaultCopy([[ACH_REL]], (rel, t) => t.replace("retained_VERIFY:", "retained_VERIFY_X:")); const b2 = gen({ opts: { vault: v2 } }); ok(b2.s.assets.find((x) => x.document_id === ACH).status === "failed_closed", "VERIFY count must match the source"); return ["coordinate→R07", "polygon→R09", "verify→closed"];
});
T("AD10", "entity-type dispatch: Place + Region adapters; an unsupported entity_type is reported as no adapter and never coerced", () => {
  const types = R1.s.assets.map((x) => x.entity_type + ":" + x.status).sort(); ok(types.filter((x) => x === "place:ingested").length === 2 && types.filter((x) => x === "region:ingested").length === 2, types.join());
  const v = vaultCopy([[AMA_REL], [ACH_REL]], (rel, t) => (rel === AMA_REL ? t.replace("entity_type: region", "entity_type: person") : t.replace("~~~yaml\nRegion:", "~~~yaml\nRoute:"))); const b = gen({ opts: { vault: v } }); const np = b.s.assets.filter((x) => x.status === "no_adapter"); ok(np.length === 2 && np.some((x) => x.entity_type === "person") && np.some((x) => x.entity_type === "route") && !Object.keys(b.P.regions || {}).length, J(np)); return np.map((x) => x.entity_type);
});
T("AD11", "not every note is ingested: operational / supporting / gate documents, other 02_연구물 files and excluded folders never become assets", () => {
  const d = discover(CFG, { vault: VAULT }); const ids = R1.s.assets.map((x) => x.document_id).filter(Boolean).sort(); ok(J(ids) === J([ACH, AMA, "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01", "JBC_GERAR_CONNECTED_WORBS_20260930_01"].sort()), ids.join());
  ok(d.skipped.some((x) => /RN_PART05/.test(x.path)) || fs.readdirSync(path.join(VAULT, "02_연구물")).every((f) => !/^RN_/.test(f)), "root research notes are judged by the gate and skipped"); ok(!R1.s.assets.some((x) => /GEOMETRY_SOURCE_CHAIN/.test(x.document_id || "")), "the geometry source-chain audit is not an app-ready asset");
  const v = vaultCopy([[ACH_REL]]); fs.mkdirSync(path.join(v, "99_운영문서"), { recursive: true }); fs.copyFileSync(path.join(VAULT, "02_연구물", ACH_REL), path.join(v, "99_운영문서", NOTE(ACH))); const b = gen({ opts: { vault: v } }); ok(b.s.region_records.length === 1, "excluded folder copy ignored"); return ["assets=" + ids.length, "skipped=" + d.skipped.length];
});
T("AD12", "duplicate research ids: an identical copy is ignored; a differing copy is ambiguous and fails closed (last known good kept)", () => {
  const v = vaultCopy([[BS_REL], [GR_REL]]); fs.mkdirSync(path.join(v, "02_연구물", "복사본"), { recursive: true }); fs.copyFileSync(path.join(VAULT, "02_연구물", BS_REL), path.join(v, "02_연구물", "복사본", path.basename(BS_REL)));
  const same = discover(CFG, { vault: v }); ok(same.found.filter((f) => /BEERSHEBA/.test(f.document_id)).length === 1 && same.skipped.some((x) => /byte-identical copy/.test(x.reason)), "identical copy");
  fs.appendFileSync(path.join(v, "02_연구물", "복사본", path.basename(BS_REL)), "\n<!-- edited -->\n"); const d = discover(CFG, { vault: v }); ok(d.found.filter((f) => f.duplicate).length === 2, "differing copies are both flagged"); return ["identical→1", "differing→ambiguous"];
});
T("AD13", "zero-config Place: a Place note needs no config entry; without an approval it is reported awaiting approval and not generated", () => {
  const v = vaultCopy([[GR_REL]]), cfg2 = JSON.parse(J(CFG)); cfg2.records = {}; const b = gen({ config: cfg2, opts: { vault: v } }); const a = b.s.assets.find((x) => x.document_id === "JBC_GERAR_CONNECTED_WORBS_20260930_01"); ok(a.status === "awaiting_approval" && !Object.keys(b.P.places).length && /V33/.test(a.reason), J(a)); return [a.reason.slice(0, 90)];
});
T("AD14", "isolation: source notes, the live generated files and the ingest config are byte-identical after every run above; Registry / Reader are untouched", () => {
  ok(notes.map(sha).join() === notesBefore, "a source note changed"); ok(["data/projection.research.js", "data/scripture.index.js", "tools/pipeline/ingest.config.json"].map((p) => sha(path.join(ROOT, p))).join() === liveBefore, "a live file changed during tests");
  const flat = J(R1.P.regions[A_ID]); ok(!/"reader":\{"published":true/.test(flat) && !/"lat"|"lon"/.test(flat), "no reader / lat-lon"); return ["notes=" + notes.length];
});
const fail = results.filter((r) => !r.pass); results.forEach((r) => console.log((r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.pass ? "" : " — " + r.err))); console.log((fail.length ? "FAIL " : "PASS ") + (results.length - fail.length) + "/" + results.length); process.exit(fail.length ? 1 : 0);
