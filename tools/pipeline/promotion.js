"use strict";
// External reference → validation → PromotionRecord (ISOLATED DRY RUN). Contract: reference features are REFERENCE_ONLY by default and are
// never promoted automatically. Promotion happens per claim/feature, needs a passing ValidationResult AND a completed human review, and may only
// target an EXISTING JudeBible stable identity (never created from a name). The reference record survives promotion untouched.
//   node tools/pipeline/promotion.js   → tools/pipeline/staging/promotion/{candidate,validation,promotion-record}.json   (no live write)
const fs = require("fs"), path = require("path"), crypto = require("crypto"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..", ".."), OUT = path.join(__dirname, "staging", "promotion");
const PILOT = path.join(__dirname, "promotion", "pilot", "ne-beer-sheva.candidate-input.json");
const LIFECYCLE = ["REFERENCE_ONLY", "ELIGIBLE_FOR_VALIDATION", "VALIDATION_IN_PROGRESS", "VALIDATED_PROMOTION_READY", "PROMOTED_RESEARCH_EVIDENCE"], TERMINAL = ["CONFLICTING_EVIDENCE", "RIGHTS_OR_PROVENANCE_HOLD", "REJECTED_FOR_PROMOTION"];
const DECISIONS = ["ADOPT_AS_EVIDENCE", "ADOPT_COORDINATE", "ADOPT_CANDIDATE_LOCATION", "ADOPT_REGION_GEOMETRY", "ADOPT_ROUTE_GEOMETRY", "REJECT", "HOLD"];
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const hav = (a, b, c, d) => { const r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, h = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2; return 2 * 6371.0088 * Math.asin(Math.sqrt(h)); };
const loadProjection = (f) => { const w = {}; w.window = w; vm.runInNewContext(fs.readFileSync(f, "utf8"), w); return w.BVC_PROJECTION; };

// A reference feature becomes an ExternalReferenceCandidate only through an explicit request naming the target identity (never derived from names).
function buildCandidate(input, request) {
  return {
    schema: "JBC_EXTERNAL_REFERENCE_CANDIDATE_v0.1", candidate_id: "XREF-NE-POPULATED_PLACES-" + input.original_locator.record_index,
    lifecycle_state: "VALIDATION_IN_PROGRESS", authority_class: "REFERENCE_ONLY", research_authority: false,
    source: { provider: input.source.provider, dataset: input.source.dataset, version: input.source.version, files: input.source.files, license_declared: request.license_declared, license_declared_in: request.license_declared_in },
    original_locator: input.original_locator,
    claim: { type: input.claim.type, lat: input.claim.lat, lon: input.claim.lon, semantic_role: "modern_city_point", source_certainty: "UNSPECIFIED_CITY_POINT" },
    proposed_target: { stable_identity: request.target_stable_identity, parent_record: request.parent_record, set_by: "explicit_request", derived_from_name: false }
  };
}

// Machine validation only. It can reach PASS but never decides promotion (human review is a separate, mandatory gate).
function validate(candidate, ctx) {
  const checks = [], chk = (id, ok, msg, evidence) => checks.push({ id, ok: !!ok, msg, evidence: evidence === undefined ? null : evidence });
  const S = candidate.source, L = candidate.original_locator, root = ctx.root || ROOT, file = path.join(root, L.file.replace(/\.shp$/, "")), now = {};
  ["shp", "dbf", "shx"].forEach((e) => { const f = path.join(root, L.file.replace(/\.shp$/, "." + e)); now[e] = fs.existsSync(f) ? sha(f) : null; });
  const ver = (() => { try { return fs.readFileSync(path.join(root, L.file.replace(/\.shp$/, ".VERSION.txt")), "utf8").trim(); } catch (e) { return null; } })();
  chk("X01_source_identity", S.provider === "Natural Earth" && S.dataset === "ne_10m_populated_places" && ver === S.version, "provider, dataset and version match the local VERSION file", { version_recorded: S.version, version_file: ver });
  chk("X02_provenance_traceable", ["shp", "dbf", "shx"].every((e) => now[e] && now[e] === S.files[e]) && Number.isInteger(L.record_index) && !!(L.fields && L.fields.NAME), "source files re-hash to the recorded sha256 and the original record locator is present", { record_index: L.record_index, sha256_shp: (now.shp || "").slice(0, 12) });
  chk("X03_dataset_identified", !!S.dataset && !!S.provider, "dataset identified");
  // rights: a declared license in our own metadata is NOT independent verification of the provider's terms
  const declared = S.license_declared, indep = !!(ctx.rights_evidence && ctx.rights_evidence.provider_terms_checked === true);
  chk("X04_rights_verified", !!declared && indep, "license/usage rights verified against the provider's terms" + (indep ? "" : " — only declared in local metadata (" + (S.license_declared_in || "n/a") + "); provider terms not independently checked"), { declared, independently_verified: indep });
  const proj = ctx.projection, parent = proj && proj.places && proj.places[candidate.proposed_target.parent_record], tgt = parent && (parent.candidates || []).find((c) => c.id === candidate.proposed_target.stable_identity);
  chk("X05_target_is_existing_identity", !!tgt && candidate.proposed_target.derived_from_name === false && candidate.proposed_target.set_by === "explicit_request", "target is an existing JudeBible stable identity named explicitly (not derived from a name match)", { target: candidate.proposed_target.stable_identity, exists: !!tgt });
  chk("X06_temporal_context", !!tgt && tgt.role === "modern_context" && candidate.claim.semantic_role === "modern_city_point", "modern city point ↔ modern-context reference only (no biblical-period claim is made)", { target_role: tgt && tgt.role });
  const dist = tgt && typeof tgt.lat === "number" ? hav(candidate.claim.lat, candidate.claim.lon, tgt.lat, tgt.lon) : null;
  chk("X07_spatial_claim_evidence", dist != null && dist <= 10, "reference point lies within 10 km of the existing research modern-city point", { distance_km: dist == null ? null : +dist.toFixed(2), research_point: tgt && { lat: tgt.lat, lon: tgt.lon } });
  const conflicts = tgt && typeof tgt.lat === "number" ? [{ source: "existing_research_reference", lat: tgt.lat, lon: tgt.lon, status: tgt.status, distance_km: dist == null ? null : +dist.toFixed(2) }] : [];
  chk("X08_conflicting_sources_reviewed", false, "conflicting / competing views must be reviewed by a human before promotion", { competing_views: conflicts });
  chk("X09_certainty_assigned", false, "adopted certainty is assigned by the reviewer (source certainty: " + candidate.claim.source_certainty + ")", null);
  const machine = checks.filter((c) => !/^X08|^X09/.test(c.id)), rightsHold = !checks.find((c) => c.id === "X04_rights_verified").ok;
  const status = machine.every((c) => c.ok) ? "PASS_PENDING_HUMAN_REVIEW" : rightsHold ? "RIGHTS_OR_PROVENANCE_HOLD" : "HOLD";
  return { schema: "JBC_VALIDATION_RESULT_v0.1", candidate_id: candidate.candidate_id, status, checks, competing_views: conflicts, lifecycle_state_proposed: status === "PASS_PENDING_HUMAN_REVIEW" ? "VALIDATED_PROMOTION_READY" : "RIGHTS_OR_PROVENANCE_HOLD", automatic_transition: false };
}

function buildPromotionRecord(candidate, validation, review) {
  review = review || {};
  const holds = validation.checks.filter((c) => !c.ok).map((c) => c.id + ": " + c.msg);
  return {
    schema: "JBC_PROMOTION_RECORD_v0.1", promotion_id: "PRM-" + candidate.candidate_id + "-" + (candidate.original_locator.fields.NAME || "").replace(/\W+/g, "_"),
    external_source: candidate.source.provider, external_dataset_or_resource: candidate.source.dataset + " " + candidate.source.version, external_feature_or_locator: candidate.candidate_id, original_locator: candidate.original_locator,
    license_or_rights: { declared: candidate.source.license_declared, verified: false }, validation_basis: { result: validation.status, checks: validation.checks.map((c) => ({ id: c.id, ok: c.ok })) },
    reviewer: review.reviewer || null, reviewed_at: review.reviewed_at || null, human_review_completed: review.completed === true,
    spatial_claim_type: candidate.claim.type, source_certainty: candidate.claim.source_certainty, adopted_certainty: review.adopted_certainty || null,
    conflicting_views_if_any: validation.competing_views, promotion_decision: review.decision || "HOLD", JudeBible_stable_identity: candidate.proposed_target.stable_identity,
    hold_reasons: review.completed ? [] : holds, source_reference_survives: true, certainty_history: [{ event: "SOURCE_CLAIM", certainty: candidate.claim.source_certainty }].concat(review.adopted_certainty ? [{ event: "ADOPTED_BY_REVIEW", certainty: review.adopted_certainty, by: review.reviewer, at: review.reviewed_at }] : []),
    decision_history: [{ event: review.completed ? "REVIEWED" : "DRY_RUN_CREATED", decision: review.decision || "HOLD" }]
  };
}

// The gate: returns { applied, errors, delta }. Never mutates anything; delta is only what a controlled adapter MAY write.
function applyPromotion(rec, validation, ctx) {
  const errors = [], req = (c, m) => { if (!c) errors.push(m); };
  req(DECISIONS.includes(rec.promotion_decision), "unknown decision");
  req(/^ADOPT_/.test(rec.promotion_decision), "decision is not an adoption (" + rec.promotion_decision + ")");
  req(validation && validation.status === "PASS_PENDING_HUMAN_REVIEW", "validation has not passed (" + (validation && validation.status) + ")");
  req(rec.human_review_completed === true && !!rec.reviewer && !!rec.reviewed_at, "explicit human review (reviewer + reviewed_at) is required");
  req(!!rec.adopted_certainty, "reviewer must assign the adopted certainty"); req(rec.source_reference_survives === true && !!rec.original_locator && !!rec.external_source, "source reference and original locator must survive");
  const proj = ctx.projection, tgt = proj && Object.values(proj.places || {}).flatMap((p) => p.candidates || []).concat(Object.values(proj.places || {})).find((x) => (x.id || x.stable_id) === rec.JudeBible_stable_identity);
  req(!!tgt, "target must be an existing JudeBible stable identity (never created from a name)");
  if (rec.promotion_decision === "ADOPT_COORDINATE") req(!(tgt && typeof tgt.lat === "number"), "ADOPT_COORDINATE may not overwrite an existing research coordinate");
  if (rec.promotion_decision === "ADOPT_REGION_GEOMETRY" || rec.promotion_decision === "ADOPT_ROUTE_GEOMETRY") req(false, "geometry adoption needs a separate approved-geometry record (not implemented in this dry run)");
  if (errors.length) return { applied: false, errors, delta: null };
  return { applied: false, dry_run: true, errors: [], delta: { new_evidence_link: { target: rec.JudeBible_stable_identity, source_reference: { provider: rec.external_source, dataset: rec.external_dataset_or_resource, locator: rec.original_locator }, claim_type: rec.spatial_claim_type, certainty_history: rec.certainty_history, competing_views_retained: rec.conflicting_views_if_any, promotion_id: rec.promotion_id }, writes_research_coordinate: false, replaces_existing_evidence: false, merges_entities: false, clears_VERIFY_HOLD: false } };
}

// Duplicate EXTERNAL reference records only (same source feature proven by provider+dataset+original locator). Never research entities, never by name.
function dedupeReferences(list) {
  const seen = new Map(), kept = [], dropped = [];
  for (const c of list) { const k = [c.source.provider, c.source.dataset, c.original_locator.file, c.original_locator.record_index].join("|"); if (seen.has(k)) dropped.push({ duplicate: c.candidate_id, of: seen.get(k) }); else { seen.set(k, c.candidate_id); kept.push(c); } }
  return { kept, dropped };
}

function run(opts) {
  opts = opts || {}; const input = JSON.parse(fs.readFileSync(opts.input || PILOT, "utf8")), projection = loadProjection(path.join(ROOT, "data", "projection.research.js"));
  const meta = (() => { try { const w = {}; w.window = w; vm.runInNewContext(fs.readFileSync(path.join(ROOT, "data", "labels.reference.js"), "utf8"), w); return w.JBC_REFERENCE_LABELS.meta; } catch (e) { return {}; } })();
  const candidate = buildCandidate(input, { target_stable_identity: "JBC-CR-PLACE-BEERSHEBA_MODERN-001", parent_record: "JBC-CR-PLACE-BEERSHEBA-001", license_declared: meta.license || null, license_declared_in: "data/labels.reference.js meta.license" });
  const validation = validate(candidate, { projection, rights_evidence: null }), record = buildPromotionRecord(candidate, validation, null), gate = applyPromotion(record, validation, { projection });
  if (!opts.noWrite) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, "candidate.json"), JSON.stringify(candidate, null, 2) + "\n"); fs.writeFileSync(path.join(OUT, "validation.json"), JSON.stringify(validation, null, 2) + "\n"); fs.writeFileSync(path.join(OUT, "promotion-record.json"), JSON.stringify(Object.assign({}, record, { gate_result: gate }), null, 2) + "\n"); }
  return { candidate, validation, record, gate, projection };
}
if (require.main === module) { const r = run(); console.log(r.record.promotion_decision, "| validation:", r.validation.status, "| gate applied:", r.gate.applied, "|", r.gate.errors.length, "gate errors"); r.validation.checks.forEach((c) => console.log((c.ok ? "ok   " : "HOLD ") + c.id + " — " + c.msg)); }
module.exports = { buildCandidate, validate, buildPromotionRecord, applyPromotion, dedupeReferences, run, LIFECYCLE, TERMINAL, DECISIONS };
