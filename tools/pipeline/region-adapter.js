"use strict";
// Generic REGION ingest adapter (app_ready_metadata template) + region discovery.
// Region records are never coerced into Place records: they are normalized into their own record shape and projected into a
// separate `regions` container. Nothing here invents a coordinate, marker, polygon, crosswalk or merge.
const fs = require("fs"), path = require("path");
const { parseNote } = require("./parse"), { parseRef, LICENSES } = require("./normalize");

// ---- discovery / eligibility classification. Two note profiles are understood; both normalize into the same Region record:
//   "app_ready_metadata" (Amalek): research header + app_ready_metadata block (entity_type region) + identity_binding_application
//   "worbs_sections"     (Achaia):  FINAL_RESEARCH_RESULT block + a `Region:` identity block (object_type region); the viewer id comes only from a durable approval record
// A note is claimed by at most one pipeline (Place first). Other entity types (route / person / event) are reported as "no adapter", never coerced.
const OTHER_ENTITY_KEYS = ["Route", "Person", "Event"];
function classify(parsed, vrel, abs) {
  const data = parsed.order.flatMap((k) => parsed.sections[k].yaml).filter((b) => b.data).map((b) => b.data);
  const head = data.find((d) => d.research_id && d.status) || data.find((d) => d.research_id && (d.quality_status || d.approval_status)), app = data.find((d) => d.app_ready_metadata), place = data.find((d) => d.Place && d.Place.stable_id), reg = data.find((d) => d.Region && d.Region.stable_id);
  if (place) return { kind: "place" };
  if (!head) return { kind: "not_research", reason: "not a research record (no research header block): operational / gate / supporting document" };
  const id = head.research_id, stem = path.basename(abs || vrel).replace(/\.md$/i, "");
  if (id !== stem) return { kind: "skip", reason: "research header id does not equal the file name" };
  if (app) {
    const ident = app.app_ready_metadata.identity || {}, bind = head.identity_binding_application || null, et = String(ident.entity_type || "").toLowerCase();
    if (et !== "region") return { kind: "no_adapter", entity_type: et || null, reason: "entity_type '" + ident.entity_type + "' has no adapter (only region is implemented)" };
    return { kind: "region", profile: "app_ready_metadata", document_id: id, entity_type: "region", stable_id: bind && bind.binding_id || null, registry_id: ident.stable_id || null };
  }
  if (reg) {
    if (String(reg.Region.object_type || "").toLowerCase() !== "region") return { kind: "no_adapter", entity_type: reg.Region.object_type || null, reason: "entity_type '" + reg.Region.object_type + "' has no adapter (only region is implemented)" };
    return { kind: "region", profile: "worbs_sections", document_id: id, entity_type: "region", stable_id: null, registry_id: reg.Region.stable_id };
  }
  const other = OTHER_ENTITY_KEYS.find((k) => data.some((d) => d[k] && typeof d[k] === "object"));
  if (other) return { kind: "no_adapter", entity_type: other.toLowerCase(), reason: "entity_type '" + other.toLowerCase() + "' has no adapter (only place and region are implemented)" };
  return { kind: "not_research", reason: "research header without an entity identity block (Place / Region): not an app-ready asset" };
}
// Returns { found, skipped }. Place discovery (run.js discover) is untouched; non-region notes are not the region pass's business.
function discoverRegions(files, opts) {
  const found = [], skipped = [];
  for (const f of files) {
    let p; try { p = parseNote(f.abs); } catch (e) { skipped.push({ path: f.vrel, reason: "unreadable: " + e.message }); continue; }
    const c = classify(p, f.vrel, f.abs);
    if (c.kind === "region") found.push({ document_id: c.document_id, abs: f.abs, vrel: f.vrel, entity_type: "region", profile: c.profile, stable_id: c.stable_id, registry_id: c.registry_id });
    else if (c.kind === "skip" || c.kind === "no_adapter") skipped.push({ path: f.vrel, reason: c.reason, entity_type: c.entity_type });
  }
  found.sort((a, b) => (a.document_id < b.document_id ? -1 : a.document_id > b.document_id ? 1 : 0));
  return { found, skipped };
}

// ---- normalize: parsed note → region record (reads only what the note states). The profile decides how the note is read; the record shape is shared.
const strs = (a) => (Array.isArray(a) ? a : []);
function readAppReady(blocks, find) {
  const D = find((d) => d.research_id && d.status), appB = find((d) => d.app_ready_metadata), direct = find((d) => d.S066_DIRECT_PASSAGE_REFS), rel = find((d) => d.STRONGLY_RELATED_NOT_ADDED_TO_S066_DIRECT_SET);
  const ents = find((d) => d.related_entities), ppl = find((d) => d.related_people), evs = find((d) => d.related_events), ver = find((d) => d.retained_VERIFY), hold = find((d) => d.retained_HOLD) || ver;
  if (!D || !appB) return null;
  const A = appB.app_ready_metadata, B = D.identity_binding_application || null, ap = A.spatial || {};
  return {
    profile: "app_ready_metadata", researchId: D.research_id, module: D.selected_module, name_ko: A.identity.display_name_ko, name_en: A.identity.canonical_name, semantic_note: A.identity.semantic_note || null,
    binding: B ? { id: B.binding_id, role: B.binding_role, registry: B.source_registry_id, reuse: B.BAT01_PLACE_reuse, crosswalk: B.BAT01_P_crosswalk, merge: B.automatic_merge, activation: B.app_projection_activation || null } : null,
    status: A.research.status, certainty: A.research.certainty, noteApproval: (D.approval && D.approval.status) || (D.status && D.status.approval_status) || null, registryEffect: D.mutation && D.mutation.Registry, mutation: D.mutation || null, lineage: D.lineage || null,
    direct: ((direct && direct.S066_DIRECT_PASSAGE_REFS) || []).map((x) => ({ raw: x, source: "S066" })), related: ((rel && rel.STRONGLY_RELATED_NOT_ADDED_TO_S066_DIRECT_SET) || []).map((x) => ({ raw: x.ref, source: "WORBS_strongly_related_not_direct" })),
    places: ((ents && ents.related_entities) || []).map((e) => ({ ref: e.stable_id, name: e.name, relation: e.relation, certainty: e.certainty, evidence: e.evidence || [] })), people: (ppl && ppl.related_people) || [], events: (evs && evs.related_events) || [],
    verify: ((ver && ver.retained_VERIFY) || []), hold: ((hold && hold.retained_HOLD) || []),
    spatial: { broad_region_labels: ap.broad_region_labels || [], exact_coordinate: ap.exact_coordinate, centroid: ap.centroid, exact_polygon: ap.exact_polygon, external_geometry: ap.external_geometry, external_point: ap.external_representative_point, map_policy: A.map || null, consumer_safety: A.consumer_safety || [] },
    sourceLocator: "§14 App-Ready Metadata", declaredDirect: A.scripture && A.scripture.direct_passage_ref_count, registryId: A.identity.stable_id
  };
}
// "worbs_sections": identity / passage links / geography / relations / retained VERIFY-HOLD live in separate section blocks. The note carries no binding of its own:
// the viewer id is supplied by the durable approval record (o.binding), never invented here.
function readSections(parsed, blocks, find, o) {
  const FIN = find((d) => d.research_id && (d.quality_status || d.approval_status)), RB = find((d) => d.Region && d.Region.stable_id), src = find((d) => d.approved_source_record), dm = find((d) => d.DIRECT_MENTION), sr = find((d) => d.STRONGLY_RELATED);
  const geoB = find((d) => d.geography), mapB = find((d) => d.map_ready), ents = find((d) => d.related_places), ppl = find((d) => d.related_people), evs = find((d) => d.related_events), ver = find((d) => d.retained_VERIFY), hold = find((d) => d.retained_HOLD), ib = find((d) => d.interpretive_boundary);
  if (!FIN || !RB || !dm) return null;
  const R = RB.Region, geo = (geoB && geoB.geography) || {}, mr = (mapB && mapB.map_ready && mapB.map_ready.primary_region) || {}, lin = R.identity_lineage || {}, ob = o.binding || null, routes = (mapB && mapB.map_ready && mapB.map_ready.routes) || [];
  const idf = parsed.order.map((k) => parsed.sections[k]).find((s) => /^Identity finding/i.test(s.heading));
  const crit = { Registry: FIN.registry_mutation, new_PLACE_ID: lin.new_global_id_created === false ? "NONE" : "CREATED", geometry_creation: geo.coordinate_point_for_region === "NONE" && geo.centroid === "NOT_CREATED" ? "NONE" : "UNSTATED", polygon_creation: geo.polygon === "NOT_CREATED" ? "NONE" : "UNSTATED", route_polyline_creation: routes.every((r) => r.geometry === "NONE") ? "NONE" : "UNSTATED" };
  return {
    profile: "worbs_sections", researchId: FIN.research_id, module: FIN.selected_module, name_ko: R.canonical_name_ko, name_en: R.canonical_name_en, semantic_note: (idf && idf.text[0]) || null,
    binding: ob ? { id: ob.viewer_id, role: "VIEWER_BINDING_ID_ONLY", registry: R.stable_id, reuse: ob.viewer_id === R.stable_id, crosswalk: ob.crosswalk, merge: ob.merge, activation: null } : null,
    status: FIN.quality_status, certainty: R.certainty || null, noteApproval: FIN.approval_status || null, registryEffect: FIN.registry_mutation, mutation: crit, lineage: null, crosswalkStatement: lin.BAT01_REG_crosswalk || null,
    direct: strs(dm.DIRECT_MENTION.refs).map((x) => ({ raw: x, source: /S066/.test(dm.DIRECT_MENTION.source || "") ? "S066" : String(dm.DIRECT_MENTION.source || "UNSTATED") })), related: strs(sr && sr.STRONGLY_RELATED).map((x) => ({ raw: x.ref, source: "WORBS_strongly_related_not_direct" })),
    places: strs(ents && ents.related_places).map((e) => ({ ref: e.ref, name: e.name, relation: e.relation, certainty: e.certainty, evidence: e.evidence || [] })), people: strs(ppl && ppl.related_people), events: strs(evs && evs.related_events),
    verify: strs(ver && ver.retained_VERIFY), hold: strs(hold && hold.retained_HOLD),
    spatial: { broad_region_labels: [], exact_coordinate: mr.coordinate, centroid: mr.centroid, exact_polygon: mr.polygon, external_geometry: null, external_point: null, map_policy: { render_mode: mr.render_mode || null, exact_point: mr.exact_point, period_context: (mapB && mapB.map_ready && mapB.map_ready.period_context) || null }, consumer_safety: strs(ib && ib.interpretive_boundary) },
    sourceLocator: "§1 Region Identity · §4 PassageLink Set · §9 Map Ready Fields · §12 Retained VERIFY / HOLD", declaredDirect: src && src.approved_source_record.classification_signals && src.approved_source_record.classification_signals.biblical_ref_count, registryId: R.stable_id
  };
}
// ---- media references (metadata only). A MediaAsset block that the note itself carries is recorded as a reference bound to this region's own note section; nothing is fetched, no preview
// URL or image payload is created, and display stays attribution_only. A reference is BOUND only with explicit rights (rights_status CLEARED + a recognised license), a Commons file page
// whose title is the file, a creator and a stated use role; anything less is VERIFY (listed with the reasons, never rendered).
const flat = (v) => String(v == null ? "" : v).replace(/\s+/g, " ").trim();
function regionMedia(blocks, viewerId) {
  const refs = [];
  for (const b of blocks) {
    const M = b.data && b.data.MediaAsset; if (!M || typeof M !== "object") continue;
    const lic = M.license && typeof M.license === "object" ? flat(M.license.Wikimedia_LicenseShortName || M.license.status) : flat(M.license), rec = LICENSES[lic] || null, explicitPublicDomain = flat(M.license && typeof M.license === "object" && M.license.status) === "PUBLIC_DOMAIN", rights = flat(M.rights_status) || (explicitPublicDomain ? "CLEARED" : null);
    const file = flat(M.canonical_file_page).replace(/^File:/, "") || null, url = flat(M.source_url || M.explicit_source_url).replace(/\s+/g, "") || null;
    let title = null; const m = /^https:\/\/commons\.wikimedia\.org\/wiki\/(.+)$/.exec(url || ""); try { title = m && decodeURIComponent(m[1]); } catch (e) { title = null; }
    const urlOk = !!(title && file && title.replace(/^File:/, "").replace(/_/g, " ") === file.replace(/_/g, " ")), creator = flat(M.creator || M.creator_credit) || null, role = flat(M.display_role) || null, why = [];
    if (rights !== "CLEARED") why.push("rights_status_not_declared_CLEARED"); if (!rec) why.push("license_not_normalized"); if (!urlOk) why.push("source_page_unverified"); if (!creator) why.push("creator_missing"); if (!role) why.push("use_role_missing");
    const mediaCertainty = M.media_identity_certainty && typeof M.media_identity_certainty === "object" ? M.media_identity_certainty : (M.media_identity_certainty || null);
    refs.push({ id: M.stable_id || M.media_id || null, stable_id: M.stable_id || M.media_id || null, state: why.length ? "VERIFY" : "BOUND", reasons: why, source: flat(M.source) || null, provider: flat(M.source).split("/")[0].trim() || null, canonical_file_page: flat(M.canonical_file_page) || null, file, creator, license: lic || null, rights_status: rights, rights_status_declared: rights,
      rights: rec ? { validated: rights === "CLEARED", status: rights === "CLEARED" ? "CLEARED" : "VERIFY", license_code: rec.code, attribution_required: rec.by, share_alike: rec.sa } : { validated: false, status: "VERIFY", license_code: null },
      source_url: url, source_url_verified: urlOk, display_role: role, role, depicts: [].concat(M.depicts || []).map(flat), media_identity_certainty: mediaCertainty, identity_certainty: mediaCertainty, use_boundary: [].concat(M.use_boundary || []).map(flat),
      attribution: flat(M.attribution || (M.license && M.license.recommended_attribution)) || (rec && creator && file ? creator + ", “" + file + ",” Wikimedia Commons, " + lic + "." : null), ...(M.attribution || (M.license && M.license.recommended_attribution) ? {} : { attribution_composed: true }), target_ref: { ref: viewerId, binding: "own_note_media_section", kind: "context_media" }, source_locator: "§" + String(b.sec || "").replace(/^(\d+)\.\s*/, "$1 "), display_mode: "attribution_only", preview_url: null });
  }
  return { bound: false, payload: "NONE", note: "reference metadata only: no image payload or preview URL is bound; display stays attribution_only (rights / identity gated)", references: refs };
}
function buildRegion(parsed, o) {
  o = o || {};
  const blocks = parsed.order.flatMap((k) => parsed.sections[k].yaml.map((b) => Object.assign({ sec: parsed.sections[k].heading }, b))).filter((b) => b.data), find = (pred) => (blocks.find((b) => pred(b.data)) || {}).data;
  const S = (o.profile === "worbs_sections" ? readSections(parsed, blocks, find, o) : readAppReady(blocks, find));
  if (!S) return { record: null, errors: ["DOCUMENT_CONTROL / app_ready_metadata block missing"] };
  const B = S.binding, ap = S.spatial, sections = parsed.order.map((k) => parsed.sections[k]), claimsTab = sections.filter((s) => /^\d+\.\s*Claim.*Evidence/i.test(s.heading)).flatMap((s) => s.tables)[0] || { rows: [] };
  const readerSection = (re) => sections.find((s) => re.test(s.heading)), identitySec = readerSection(/^identity$/i), summarySec = readerSection(/^concise_summary$/i), factsSec = readerSection(/^quick_facts$/i);
  const identityText = identitySec ? identitySec.text.join(" ").replace(/\*\*/g, "").trim() : null, readerSummary = summarySec ? summarySec.text.join(" ").trim() : (S.semantic_note || null);
  const reader = { published: false, headline: identityText || null, concise_summary: readerSummary, quick_facts: factsSec && factsSec.tables[0] ? factsSec.tables[0].rows.map((r) => [r[0], r[1]]) : [] };
  const link = (raw, group, source) => Object.assign({ group, source, raw }, parseRef(String(raw).replace(/[–—]/g, "-").replace(/^Psalm\s/, "Psalms ")));
  const links = S.direct.map((x) => link(x.raw, "direct", x.source)).concat(S.related.map((x) => link(x.raw, "related", x.source)));
  const verifyItems = S.verify.map((v) => ({ id: v.id, issue: v.issue, effect: v.effect }));
  const holdItems = S.hold.map((h) => (typeof h === "string" ? { id: h } : { id: h.id, issue: h.issue, effect: h.effect }));
  const ovr = o.approval && o.approval.value ? o.approval : null, approvalStatus = ovr ? ovr.value : S.noteApproval, ext = ap.external_geometry, pt = ap.external_point, noteApproval = S.noteApproval, lin = S.lineage;
  const rec = {
    entity_type: "Region", stable_id: B && B.id || null, display_label: S.name_ko, label_en: S.name_en, semantic_note: S.semantic_note,
    identity_binding: { viewer_stable_id: B && B.id, binding_role: B && B.role, source_registry_id: B && B.registry, source_registry_id_role: "REFERENCE_ONLY", equivalence_semantics: "NOT_AUTOMATIC_CROSSWALK", BAT01_PLACE_reuse: B && B.reuse, BAT01_P_crosswalk: B && B.crosswalk, automatic_merge: B && B.merge },
    status: S.status, certainty: S.certainty,
    authority: Object.assign({ module: S.module, approval: approvalStatus, registry_effect: S.registryEffect, BAT01_crosswalk: "NOT_PERFORMED" }, ovr ? { note_approval_status: noteApproval, approval_source: ovr.source, approval_origin: "ingest_authority", approval_record_id: ovr.record_id || null, approval_scope: ovr.scope || null, approval_recorded_at: ovr.recorded_at || null } : { approval_origin: "research_note" }),
    activation: { state: o.activationState || "ISOLATED_DRY_RUN_ONLY", note_declared: (B && B.activation) || null, publishable: false },   // approval does not publish: no live commit, no reader layer
    geometry: { status: "none", type: null, approved: false, approximate_area: null, map_polygon: "OMIT", detail: "AVAILABLE", relations: "AVAILABLE" },   // polygon / multipolygon / approximate area only from explicit approved geometry — none exists in the note
    source_refs: [{ id: S.researchId, path: String(o.relPath || parsed.source.path).replace(/\\/g, "/"), sha256: parsed.source.sha256, bytes: parsed.source.bytes, predecessor_sha256: lin && lin.predecessor_sha256, metadata_revision: lin && lin.metadata_revision, change_scope: lin && lin.change_scope }],
    source_locator: S.sourceLocator,
    coordinates: null, centroid: null, coordinate_status: "NONE",
    reader, passage_links: links,
    claims: claimsTab.rows.map((r) => ({ id: r[0], statement: r[1], evidence: r[2], locator: r[3], confidence: r[4] })),
    verify: verifyItems, hold: holdItems,
    relations: S.places.map((e) => ({ to_source_registry_id: e.ref, name: e.name, relation: e.relation, certainty: e.certainty, evidence: e.evidence, to_id: null, resolved: false })),
    related_people: S.people.map((p) => ({ name: p.name, global_person_id: p.global_person_id || null, relation: p.relation || null, evidence: p.evidence || null, certainty: p.certainty || null, resolved: false })),
    related_events: S.events.map((e) => Object.assign({}, e, { global_event_id: e.global_event_id || null, evidence: e.evidence || null, certainty: e.certainty || null, resolved: false })),
    spatial: {
      schema: "JBC_REGION_SPATIAL_v0.1", subject: { stable_id: B && B.id, kind: "region" },
      primary: { ref: B && B.id, coordinates: null, coordinate_status: "NONE", marker: { render: false, reason: "region_identity_no_coordinate" } },
      broad_region_labels: ap.broad_region_labels || [], declared: { exact_coordinate_value: ap.exact_coordinate, centroid_value: ap.centroid, exact_polygon_value: ap.exact_polygon },
      region: { boundary: null, render: "HOLD" }, routes: [], sites: [],
      reference_only: { external_geometry: ext ? { provider: ext.provider, ancient_id: ext.ancient_id, geometry_id: ext.geometry_id, status: ext.status, rendered: false, geometry_embedded: false } : null, external_representative_point: pt ? { provider: pt.provider, modern_id: pt.modern_id, name: pt.name, status: pt.status, promote_to_record_coordinate: pt.promote_to_Amalek_coordinate === true || pt.promote_to_record_coordinate === true, rendered: false, coordinates_embedded: false } : null },
      map_policy: ap.map_policy || null, consumer_safety: ap.consumer_safety || [], verify_hold: { verify: verifyItems.map((v) => v.id), hold: holdItems.length }, degradation: { markers: 0, reason: "region identity without an approved coordinate or boundary (geometry HOLD)" }
    },
    media: regionMedia(blocks, B && B.id),
    declared: Object.assign({ direct_ref_count: S.declaredDirect, registry_stable_id: S.registryId, mutation: S.mutation }, S.crosswalkStatement ? { BAT01_REG_crosswalk: S.crosswalkStatement } : {})
  };
  return { record: rec, errors: [] };
}
module.exports = { discoverRegions, buildRegion, classify };
