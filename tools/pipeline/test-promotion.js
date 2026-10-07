"use strict";
// node tools/pipeline/test-promotion.js — promotion dry-run contract tests (isolated; no live write).
const fs = require("fs"), path = require("path"), crypto = require("crypto"), os = require("os");
const P = require("./promotion"), ROOT = path.resolve(__dirname, "..", "..");
const results = [], T = (id, name, fn) => { try { results.push({ id, name, pass: true, ev: fn() }); } catch (e) { results.push({ id, name, pass: false, err: e.message }); } };
const ok = (c, m) => { if (!c) throw new Error(m || "assertion failed"); }, sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 12), clone = (o) => JSON.parse(JSON.stringify(o));
const LIVE = ["data/projection.research.js", "data/scripture.index.js", "tools/pipeline/ingest.config.json", "data/labels.reference.js", "data/hydrology.ne10m.js"].map((p) => path.join(ROOT, p)), live0 = LIVE.map(sha).join(",");
const base = P.run({ noWrite: true }), proj = base.projection, TARGET = "JBC-CR-PLACE-BEERSHEBA_MODERN-001", PARENT = "JBC-CR-PLACE-BEERSHEBA-001";
const input = JSON.parse(fs.readFileSync(path.join(__dirname, "promotion", "pilot", "ne-beer-sheva.candidate-input.json"), "utf8"));
const mkCand = (over) => Object.assign(P.buildCandidate(input, { target_stable_identity: TARGET, parent_record: PARENT, license_declared: "Public Domain", license_declared_in: "test" }), over || {});
const passV = (cand) => P.validate(cand, { projection: proj, rights_evidence: { provider_terms_checked: true } });   // TEST-ONLY: pretend rights were independently verified
const review = (o) => Object.assign({ completed: true, reviewer: "TEST_REVIEWER_FIXTURE", reviewed_at: "2026-10-02T00:00:00+09:00", adopted_certainty: "CORROBORATING_REFERENCE_ONLY", decision: "ADOPT_AS_EVIDENCE" }, o || {});

T("PR01", "contracts: ExternalReferenceCandidate / ValidationResult / PromotionRecord carry the required fields; lifecycle and decisions are enumerated", () => {
  const c = base.candidate, v = base.validation, r = base.record;
  ok(c.authority_class === "REFERENCE_ONLY" && c.research_authority === false && P.LIFECYCLE[0] === "REFERENCE_ONLY" && P.LIFECYCLE.length === 5 && P.TERMINAL.length === 3 && P.DECISIONS.length === 7, "enums / default authority");
  ok(["source", "original_locator", "claim", "proposed_target"].every((k) => c[k]) && c.source.license_declared && c.proposed_target.derived_from_name === false, "candidate fields");
  ok(v.automatic_transition === false && Array.isArray(v.checks) && v.checks.length === 9, "validation fields: " + v.checks.length);
  ["promotion_id", "external_source", "external_dataset_or_resource", "external_feature_or_locator", "original_locator", "license_or_rights", "validation_basis", "reviewer", "reviewed_at", "spatial_claim_type", "source_certainty", "adopted_certainty", "conflicting_views_if_any", "promotion_decision", "JudeBible_stable_identity"].forEach((k) => ok(k in r, "promotion record missing " + k)); return ["checks=9"];
});
T("PR02", "dry run on a real existing reference feature (Natural Earth 'Beer Sheva' vs the research modern-city reference): HOLD with reasons, zero automatic promotion", () => {
  const v = base.validation, r = base.record, g = base.gate;
  ok(v.status === "RIGHTS_OR_PROVENANCE_HOLD" && r.promotion_decision === "HOLD" && r.human_review_completed === false && r.reviewer === null && r.hold_reasons.some((h) => /X04/.test(h)) && r.hold_reasons.some((h) => /X08/.test(h)), "HOLD with reasons: " + r.hold_reasons.length);
  ok(g.applied === false && g.delta === null && g.errors.length >= 3, "gate refuses: " + g.errors.join(" | ")); const d = v.checks.find((c) => c.id === "X07_spatial_claim_evidence").evidence.distance_km; ok(d > 0 && d < 10, "real spatial evidence: " + d + " km"); return ["distance_km=" + d, "decision=" + r.promotion_decision];
});
T("PR03", "the gate refuses every shortcut (no review, missing reviewer/time/certainty, failed validation, name-only or unknown target, coordinate overwrite, geometry)", () => {
  const cand = mkCand(), v = passV(cand); ok(v.status === "PASS_PENDING_HUMAN_REVIEW", "fixture validation should pass machine checks: " + v.status);
  const g = (rec, val) => P.applyPromotion(rec, val || v, { projection: proj }), mk = (rv) => P.buildPromotionRecord(cand, v, rv);
  ok(g(mk(null)).applied === false && g(mk(null)).errors.some((e) => /human review/.test(e)), "no human review"); ok(g(mk(review({ reviewer: null }))).errors.some((e) => /reviewer/.test(e)), "no reviewer"); ok(g(mk(review({ reviewed_at: null }))).errors.some((e) => /reviewed_at/.test(e)), "no reviewed_at"); ok(g(mk(review({ adopted_certainty: null }))).errors.some((e) => /certainty/.test(e)), "no certainty");
  ok(g(mk(review()), P.validate(cand, { projection: proj, rights_evidence: null })).errors.some((e) => /validation has not passed/.test(e)), "validation not passed"); ok(g(mk(review({ decision: "REJECT" }))).errors.some((e) => /not an adoption/.test(e)) && g(mk(review({ decision: "HOLD" }))).applied === false, "REJECT / HOLD never apply");
  const byName = mk(review()); byName.JudeBible_stable_identity = "Beersheba"; ok(g(byName).errors.some((e) => /existing JudeBible stable identity/.test(e)), "name-only target refused"); const unknown = mk(review()); unknown.JudeBible_stable_identity = "JBC-CR-PLACE-NEWPLACE-001"; ok(g(unknown).errors.some((e) => /existing/.test(e)), "unknown identity refused (no identity creation)");
  ok(g(mk(review({ decision: "ADOPT_COORDINATE" }))).errors.some((e) => /overwrite an existing research coordinate/.test(e)), "reference coordinate may not overwrite research"); ok(g(mk(review({ decision: "ADOPT_REGION_GEOMETRY" }))).errors.some((e) => /geometry/.test(e)) && g(mk(review({ decision: "ADOPT_ROUTE_GEOMETRY" }))).errors.some((e) => /geometry/.test(e)), "geometry adoption needs its own approved record"); return ["refusals=10"];
});
T("PR04", "a reviewed adoption (test fixture reviewer) yields only an evidence link: no coordinate write, source/locator/certainty history/competing views survive, nothing merged or cleared", () => {
  const cand = mkCand(), v = passV(cand), rec = P.buildPromotionRecord(cand, v, review()), g = P.applyPromotion(rec, v, { projection: proj });
  ok(g.errors.length === 0 && g.dry_run === true && g.applied === false, "reviewed adoption passes the gate as a dry run: " + g.errors.join(";")); const d = g.delta, e = d.new_evidence_link;
  ok(e.target === TARGET && e.source_reference.provider === "Natural Earth" && e.source_reference.locator.record_index === input.original_locator.record_index && e.promotion_id === rec.promotion_id, "source reference + original locator + promotion id");
  ok(e.certainty_history.length === 2 && e.certainty_history[0].event === "SOURCE_CLAIM" && e.certainty_history[1].event === "ADOPTED_BY_REVIEW" && e.competing_views_retained.length === 1, "certainty history and competing view survive");
  ok(d.writes_research_coordinate === false && d.replaces_existing_evidence === false && d.merges_entities === false && d.clears_VERIFY_HOLD === false && e.lat === undefined && e.lon === undefined && !("coordinates" in d) && !("coordinates" in e) && e.competing_views_retained.every((c) => c.source === "existing_research_reference"), "no coordinate written into research (the only lat/lon present is the retained competing research view), nothing replaced / merged / cleared");
  ok(rec.source_reference_survives === true && !("same_as" in rec) && !("crosswalk" in rec), "no silent same-as / crosswalk fields"); return ["delta=evidence_link_only"];
});
T("PR05", "provenance integrity: tampered source hash or version fails validation; the reference input file is never modified", () => {
  const f = path.join(__dirname, "promotion", "pilot", "ne-beer-sheva.candidate-input.json"), before = sha(f), c1 = mkCand(); c1.source.files.shp = "0".repeat(64); ok(!P.validate(c1, { projection: proj }).checks.find((c) => c.id === "X02_provenance_traceable").ok, "hash tamper detected");
  const c2 = mkCand(); c2.source.version = "9.9.9"; ok(!P.validate(c2, { projection: proj }).checks.find((c) => c.id === "X01_source_identity").ok, "version mismatch detected"); P.run({ noWrite: true }); ok(sha(f) === before, "reference input untouched by promotion runs"); return ["input_sha=" + before];
});
T("PR06", "identity rules: target must pre-exist and be named explicitly; derived-from-name candidates fail validation", () => {
  const a = mkCand(); a.proposed_target.stable_identity = "JBC-CR-PLACE-GHOST-001"; ok(!P.validate(a, { projection: proj }).checks.find((c) => c.id === "X05_target_is_existing_identity").ok, "nonexistent target"); const b = mkCand(); b.proposed_target.derived_from_name = true; ok(!P.validate(b, { projection: proj }).checks.find((c) => c.id === "X05_target_is_existing_identity").ok, "name-derived target"); const c = mkCand(); c.proposed_target.stable_identity = PARENT; ok(!P.validate(c, { projection: proj }).checks.find((c2) => c2.id === "X06_temporal_context").ok || !P.validate(c, { projection: proj }).checks.find((c2) => c2.id === "X05_target_is_existing_identity").ok, "wrong-role target is not accepted"); return ["ok"];
});
T("PR07", "reference de-duplication touches only provably identical external features (never by name, never research entities)", () => {
  const a = mkCand(), dupe = clone(a); dupe.candidate_id = "XREF-DUP"; const sameName = clone(a); sameName.candidate_id = "XREF-SAMENAME"; sameName.original_locator.record_index = 999;
  const r = P.dedupeReferences([a, dupe, sameName]); ok(r.kept.length === 2 && r.dropped.length === 1 && r.dropped[0].duplicate === "XREF-DUP" && r.kept.some((k) => k.candidate_id === "XREF-SAMENAME"), "same feature merged, same-name different locator kept"); ok(Object.keys(proj.places).length === 2, "research entities untouched"); return ["kept=2"];
});
T("PR08", "live mutation zero: live data / config / reference data are byte-identical after all runs; outputs only under staging/promotion", () => {
  const out = os.tmpdir(); P.run({ noWrite: true }); ok(LIVE.map(sha).join(",") === live0, "live files changed"); const o = path.join(__dirname, "staging", "promotion"); P.run(); ok(LIVE.map(sha).join(",") === live0, "live files changed after writing staging"); ok(fs.readdirSync(o).sort().join() === "candidate.json,promotion-record.json,validation.json", "outputs: " + fs.readdirSync(o)); return ["live=" + live0.slice(0, 40)];
});
const p = results.filter((r) => r.pass).length; console.log((p === results.length ? "PASS " : "FAIL ") + p + "/" + results.length);
results.forEach((r) => console.log((r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.pass ? (r.ev && r.ev.length ? "  · " + r.ev.join(" ") : "") : "  ✗ " + r.err)));
process.exit(p === results.length ? 0 : 1);
