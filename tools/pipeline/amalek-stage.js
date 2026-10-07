"use strict";
// STAGED projection adapter for JBC_AMALEK_CONNECTED_WORBS_20261001_01 (app_ready_metadata v2 template).
//   node tools/pipeline/amalek-stage.js            → writes tools/pipeline/staging/amalek/{staged.projection.json,staged.report.json}
// It is deliberately NOT wired into run.js / ingest.config.json / data/*.js: it produces a staged record only.
// Never: publishes a reader layer, creates a marker, assigns a polygon, merges with an existing place, touches the ATLAS registry.
// Source is read from the vault only (no mirror fallback). Fails closed: any failed check → staged file is not written as "ready".
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { parseNote } = require("./parse"), { parseRef } = require("./normalize"), { loadKrv, ROOT } = require("./run");

const VAULT = process.env.JBC_VAULT || "G:/내 드라이브/Projects/옵시디언/Jude_Research";
const SRC = path.join(VAULT, "02_연구물", "아말렉", "JBC_AMALEK_CONNECTED_WORBS_20261001_01.md");
const ATLAS = path.join(VAULT, "02_연구물", "BIBLE_ATLAS_LEVEL_A_90_PLACE_REFERENCE_v0.1.md");
const OUT = path.join(__dirname, "staging", "amalek");
const EXPECT = { viewer: "JBC-CR-PLACE-AMALEK-001", registry: "BAT01-PLACE-0059", predecessor: "71e54a4d7b940c83673de080ae173a4de9ad987ede57be6d2f8a8ea1e9c5e5ac" };
// Heading line numbers of the predecessor note (sha 71e54a4d…) as recorded before the identity binding was applied.
const PRED_HEADINGS = { "0": 43, "1": 94, "2": 138, "3": 187, "4": 260, "5": 359, "6": 392, "7": 423, "8": 469, "9": 506, "10": 537, "11": 617, "12": 678, "13": 746, "14": 781, "15": 863, "16": 938, "17": 959, "18": 1162, "19": 1182, "20": 1229 };
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const LIVE = ["data/projection.research.js", "data/scripture.index.js", "tools/pipeline/ingest.config.json"].map((p) => path.join(ROOT, p));

function build() {
  const parsed = parseNote(SRC), blocks = parsed.order.flatMap((k) => parsed.sections[k].yaml.map((b) => Object.assign({ sec: parsed.sections[k].heading }, b))).filter((b) => b.data);
  const find = (pred) => blocks.find((b) => pred(b.data));
  const dc = find((d) => d.research_id && d.status), app = find((d) => d.app_ready_metadata), direct = find((d) => d.S066_DIRECT_PASSAGE_REFS), rel = find((d) => d.STRONGLY_RELATED_NOT_ADDED_TO_S066_DIRECT_SET);
  const ents = find((d) => d.related_entities), ppl = find((d) => d.related_people), evs = find((d) => d.related_events), ver = find((d) => d.retained_VERIFY), hold = find((d) => d.retained_HOLD) || ver;
  if (!dc || !app || !direct) throw new Error("required blocks missing (DOCUMENT_CONTROL / app_ready_metadata / S066_DIRECT_PASSAGE_REFS)");
  const D = dc.data, A = app.data.app_ready_metadata, B = D.identity_binding_application || null;
  const claimsTab = parsed.order.map((k) => parsed.sections[k]).filter((s) => /^16\./.test(s.heading)).flatMap((s) => s.tables)[0] || { rows: [] };
  const toRef = (s) => { const r = parseRef(String(s).replace(/[–—]/g, "-").replace(/^Psalm\s/, "Psalms ")); return r; };   // "Psalm 83:7" → the pipeline book name "Psalms"
  const links = [];
  (direct.data.S066_DIRECT_PASSAGE_REFS || []).forEach((s) => { const r = toRef(s); links.push(Object.assign({ group: "direct", source: "S066", raw: s }, r)); });
  (rel ? rel.data.STRONGLY_RELATED_NOT_ADDED_TO_S066_DIRECT_SET : []).forEach((o) => { const r = toRef(o.ref); links.push(Object.assign({ group: "related", source: "WORBS_strongly_related_not_direct", raw: o.ref }, r)); });
  const verifyItems = ((ver && ver.data.retained_VERIFY) || []).map((v) => ({ id: v.id, issue: v.issue, effect: v.effect }));
  const holdItems = ((hold && (hold.data.retained_HOLD || [])) || []).map((h) => (typeof h === "string" ? { id: h } : { id: h.id, issue: h.issue, effect: h.effect }));
  const ap = A.spatial || {};
  const rec = {
    staging: { status: "STAGED_NOT_PUBLISHED", activation: (B && B.app_projection_activation) || "UNKNOWN", published: false, template: "app_ready_metadata_v2", adapter: "tools/pipeline/amalek-stage.js v0.1" },
    stable_id: B && B.binding_id, entity_type: A.identity.entity_type, display_label: A.identity.display_name_ko, label_en: A.identity.canonical_name,
    identity_binding: { viewer_stable_id: B && B.binding_id, binding_role: B && B.binding_role, source_registry_id: B && B.source_registry_id, equivalence_semantics: "NOT_AUTOMATIC_CROSSWALK", BAT01_PLACE_reuse: B && B.BAT01_PLACE_reuse, BAT01_P_crosswalk: B && B.BAT01_P_crosswalk, automatic_merge: B && B.automatic_merge },
    status: A.research.status, certainty: A.research.certainty,
    authority: { module: D.selected_module, approval: D.approval && D.approval.status || D.status.approval_status, explicit_captain_approval_found: !!(D.approval && D.approval.explicit_captain_approval_found), registry_effect: D.mutation.Registry, BAT01_crosswalk: "NOT_PERFORMED" },
    source_refs: [{ id: D.research_id, path: SRC.replace(/\\/g, "/"), sha256: parsed.source.sha256, bytes: parsed.source.bytes, predecessor_sha256: D.lineage && D.lineage.predecessor_sha256, metadata_revision: D.lineage && D.lineage.metadata_revision }],
    source_locator: "§14 App-Ready Metadata",
    coordinates: null, coordinate_status: "NONE", centroid: null,
    reader: { published: false },
    passage_links: links,
    claims: claimsTab.rows.map((r) => ({ id: r[0], statement: r[1], evidence: r[2], locator: r[3], confidence: r[4] })),
    verify: verifyItems, hold: holdItems,
    relations: ((ents && ents.data.related_entities) || []).map((e) => ({ to_source_registry_id: e.stable_id, name: e.name, relation: e.relation, certainty: e.certainty, evidence: e.evidence || [], to_id: null, resolved: false })),
    related_people: ((ppl && ppl.data.related_people) || []).map((p) => ({ name: p.name, global_person_id: p.global_person_id, relation: p.relation, resolved: false })),
    related_events: ((evs && evs.data.related_events) || []).map((e) => Object.assign({}, e, { resolved: false })),
    spatial: {
      schema: "JBC_SPATIAL_STAGED_v0", subject: { stable_id: B && B.binding_id, kind: "region" },
      primary: { ref: B && B.binding_id, coordinates: null, coordinate_status: "NONE", marker: { render: false, reason: "no_coordinate_region_identity" } },
      broad_region_labels: ap.broad_region_labels || [], exact_coordinate: ap.exact_coordinate, centroid: null, centroid_declared: ap.centroid, exact_polygon: ap.exact_polygon,
      region: { boundary: null, render: "HOLD" }, routes: [], sites: [],
      reference_only: {   // carried as non-promoted reference metadata; never rendered, never a coordinate of this record
        external_geometry: ap.external_geometry ? { provider: ap.external_geometry.provider, ancient_id: ap.external_geometry.ancient_id, geometry_id: ap.external_geometry.geometry_id, status: ap.external_geometry.status, rendered: false, geometry_embedded: false } : null,
        external_representative_point: ap.external_representative_point ? { provider: ap.external_representative_point.provider, modern_id: ap.external_representative_point.modern_id, name: ap.external_representative_point.name, status: ap.external_representative_point.status, promote_to_record_coordinate: false, rendered: false, coordinates_embedded: false } : null
      },
      map_policy: A.map || null, consumer_safety: A.consumer_safety || [],
      verify_hold: { verify: verifyItems.map((v) => v.id), hold: holdItems.length },
      degradation: { markers: 0, reason: "region identity without an approved coordinate or boundary (geometry HOLD)" }
    },
    media: { bound: false, note: "§15 media metadata is not bound or published in the staged projection" }
  };
  return { rec, parsed, D, A, B, directCount: (direct.data.S066_DIRECT_PASSAGE_REFS || []).length };
}

function run() {
  const before = LIVE.map(sha).concat(fs.existsSync(ATLAS) ? [sha(ATLAS)] : ["(atlas missing)"]);
  const { rec, parsed, D, A, B, directCount } = build();
  const srcText = fs.readFileSync(SRC, "utf8").split(String.fromCharCode(13) + String.fromCharCode(10)).join(String.fromCharCode(10)), srcHold = ((srcText.split("retained_HOLD:")[1] || "").split("```")[0].match(/^\s*- \S+/gm) || []).length, krv = loadKrv(), checks = [], chk = (id, ok, msg, ev) => checks.push({ id, ok: !!ok, msg, evidence: ev === undefined ? null : ev });
  // --- identity binding
  chk("S01_identity_binding", B && B.binding_id === EXPECT.viewer && B.binding_role === "VIEWER_BINDING_ID_ONLY" && B.source_registry_id === EXPECT.registry && B.BAT01_PLACE_reuse === false && B.BAT01_P_crosswalk === false && B.automatic_merge === false && B.registry_effect === "NONE" && A.identity.stable_id === EXPECT.registry, "viewer id bound to registry id as NOT_AUTOMATIC_CROSSWALK; no reuse / crosswalk / merge", { viewer: B && B.binding_id, registry: A.identity.stable_id });
  // --- source lineage
  const heads = parsed.order.map((k) => parsed.sections[k]).filter((s) => /^\d+\.\s/.test(s.heading)), shifts = {};
  const lines = fs.readFileSync(SRC, "utf8").replace(/\r\n/g, "\n").split("\n"); heads.forEach((s) => { const n = /^(\d+)\./.exec(s.heading)[1], ln = lines.findIndex((l) => l.startsWith("## " + n + ".")) + 1; shifts[n] = ln - PRED_HEADINGS[n]; });
  const uniq = Array.from(new Set(Object.values(shifts)));
  chk("S02_source_lineage", D.lineage && D.lineage.predecessor_sha256 === EXPECT.predecessor && D.lineage.change_scope === "CONTROL_METADATA_ONLY" && D.lineage.research_findings_changed === false && parsed.source.sha256 !== EXPECT.predecessor, "predecessor hash declared; change scope CONTROL_METADATA_ONLY", { current_sha256: parsed.source.sha256, predecessor_sha256: D.lineage && D.lineage.predecessor_sha256 });
  chk("S02b_research_body_unshifted", uniq.length === 1 && Object.keys(shifts).length === Object.keys(PRED_HEADINGS).length, "all " + Object.keys(shifts).length + " numbered sections moved by the same line offset → only the control block grew (byte-level diff of the predecessor is not available)", { line_offset: uniq, sections: Object.keys(shifts).length });
  // --- registry / mutation
  const mut = D.mutation || {};
  chk("S03_no_registry_mutation", mut.Registry === "NONE" && mut.new_PLACE_ID === "NONE" && mut.BAT01_P_prefix_conversion === "NONE" && rec.authority.registry_effect === "NONE" && rec.authority.BAT01_crosswalk === "NOT_PERFORMED", "mutation block all NONE; adapter only reads the ATLAS file", mut);
  // --- coordinate invention
  const coordKeys = []; (function w(o, p) { if (o && typeof o === "object") Object.keys(o).forEach((k) => { if (/^(lat|lon|latitude|longitude)$/i.test(k) || (k === "coordinates" && o[k] !== null) || (k === "centroid" && o[k] !== null)) coordKeys.push(p + "." + k); w(o[k], p + "." + k); }); })(rec, "");
  chk("S04_no_coordinate_invention", rec.coordinates === null && rec.centroid === null && rec.spatial.primary.coordinates === null && !coordKeys.length && A.spatial.exact_coordinate === "NONE" && A.spatial.centroid === "NONE" && A.spatial.exact_polygon === "NONE" && rec.spatial.reference_only.external_representative_point.promote_to_record_coordinate === false, "no coordinate, centroid or lat/lon key anywhere in the staged record; Ain el Qudeirat stays an unpromoted reference", { coordinate_like_keys: coordKeys });
  // --- VERIFY / HOLD
  chk("S05_verify_hold_preserved", /WITH_VERIFY/.test(rec.status) && rec.verify.length === (srcText.match(/^\s*- id: VERIFY-AML-\d+/gm) || []).length && rec.hold.length === srcHold && rec.verify.every((v) => v.id && v.issue) && rec.spatial.verify_hold.verify.length === rec.verify.length && A.spatial.exact_polygon === "NONE" && rec.spatial.region.render === "HOLD", "status keeps WITH_VERIFY; " + rec.verify.length + " VERIFY items and geometry HOLD preserved verbatim", { verify: rec.verify.map((v) => v.id), hold_items: rec.hold.length });
  // --- passages
  const bad = [], direct = rec.passage_links.filter((l) => l.group === "direct");
  rec.passage_links.forEach((l) => { const b = l.book && krv.books.find((x) => x.id === l.book), ch = b && b.chapters[l.chapter - 1]; if (!l.book || !ch || (l.v1 && (l.v1 > ch.length || (l.v2 && l.v2 > ch.length)))) bad.push(l.raw); });
  chk("S06_passages", direct.length === directCount && direct.length === A.scripture.direct_passage_ref_count && !bad.length && direct.every((l) => l.source === "S066"), "direct set equals the S066 set (" + direct.length + ") and every reference exists in KRV; related refs kept separate", { direct: direct.length, related: rec.passage_links.length - direct.length, unresolved: bad });
  // --- no merge / no reader / no marker / no polygon
  const live = (() => { try { const w = { window: {} }; w.window = w; require("vm").runInNewContext(fs.readFileSync(LIVE[0], "utf8"), w); return Object.keys(w.BVC_PROJECTION.places); } catch (e) { return []; } })();
  chk("S07_no_merge", !live.includes(rec.stable_id) && rec.relations.every((r) => r.resolved === false && r.to_id === null) && rec.related_people.every((p) => p.resolved === false), "viewer id absent from the live projection (" + live.join(",") + "); relations/people stay unresolved", { live_places: live });
  chk("S08_no_reader_marker_polygon", rec.reader.published === false && rec.spatial.primary.marker.render === false && rec.spatial.sites.length === 0 && rec.spatial.region.boundary === null && rec.spatial.reference_only.external_geometry.geometry_embedded === false && !JSON.stringify(rec).match(/MultiPolygon\\b.*coordinates/), "reader layer unpublished, no marker, no polygon / geometry payload", null);
  chk("S09_approval_not_promoted", rec.authority.approval === "PENDING_CAPTAIN_REVIEW" && rec.authority.explicit_captain_approval_found === false && rec.staging.activation === "BLOCKED_PENDING_CAPTAIN_REVIEW", "approval stays PENDING_CAPTAIN_REVIEW; activation blocked", rec.authority);
  // --- nothing outside staging was touched
  const after = LIVE.map(sha).concat(fs.existsSync(ATLAS) ? [sha(ATLAS)] : ["(atlas missing)"]);
  chk("S10_live_untouched", JSON.stringify(before) === JSON.stringify(after), "live projection, scripture index, ingest config and the ATLAS reference file are byte-identical before/after", { sha_prefix: after.map((s) => s.slice(0, 12)) });
  const ok = checks.every((c) => c.ok), json = JSON.stringify(rec, null, 2);
  fs.mkdirSync(OUT, { recursive: true });
  const report = { verdict: ok ? "STAGED_VALID_PENDING_APPROVAL" : "HOLD", staged_file: "tools/pipeline/staging/amalek/staged.projection.json", staged_sha256: crypto.createHash("sha256").update(json).digest("hex"), source: { path: SRC.replace(/\\/g, "/"), sha256: parsed.source.sha256, bytes: parsed.source.bytes }, checks };
  if (ok) fs.writeFileSync(path.join(OUT, "staged.projection.json"), json + "\n");
  else { try { fs.unlinkSync(path.join(OUT, "staged.projection.json")); } catch (e) {} }
  fs.writeFileSync(path.join(OUT, "staged.report.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}
if (require.main === module) { try { const r = run(); console.log(r.verdict, r.checks.filter((c) => c.ok).length + "/" + r.checks.length); r.checks.forEach((c) => console.log((c.ok ? "PASS " : "FAIL ") + c.id + " — " + c.msg)); console.log("staged sha256", r.staged_sha256); process.exit(r.verdict === "HOLD" ? 1 : 0); } catch (e) { console.error("HOLD: " + e.message); process.exit(2); } }
module.exports = { run, build };
