"use strict";
// Contract regression for Connected Research binding/projection. Real vault is read-only; no live output is written.
process.env.JBC_VAULT = process.env.JBC_VAULT || "G:/내 드라이브/Projects/옵시디언/Jude_Research";
const { ingest } = require("./run");
const { bindingContractFailures } = require("./relation-binding");
const out = [], T = (id, name, fn) => { try { out.push({ id, name, pass: true, ev: fn() }); } catch (e) { out.push({ id, name, pass: false, err: e.message }); } };
const ok = (x, m) => { if (!x) throw new Error(m || "assertion failed"); };
const S = ingest({ dryRun: true, writeArtifacts: false });
const A = S.projection.regions["JBC-CR-PLACE-ACHAIA-001"];
const M = S.projection.regions["JBC-CR-PLACE-AMALEK-001"];
const states = (rows) => rows.map((x) => x.binding && x.binding.state);

T("CB01", "Achaia related Place identities bind without invented detail entities", () => {
  ok(A && A.relations.length === 4, "Achaia relation count");
  ok(A.relations.every((x) => x.resolved && x.binding.state === "IDENTITY_BOUND" && x.binding.detailed_projection === false), "Achaia place identities");
  return A.relations.map((x) => x.binding.target_registry_id);
});
T("CB02", "Amalek related Place identities bind without false unlinked state", () => {
  ok(M && M.relations.length === 5, "Amalek relation count");
  ok(M.relations.every((x) => x.resolved && x.binding.state === "IDENTITY_BOUND"), "Amalek place identities");
  return M.relations.map((x) => x.binding.target_registry_id);
});
T("CB03", "Person/Event unresolved identities are explicit, never name-merged", () => {
  ok(states(A.related_people).every((x) => x === "EXPLICIT_UNBOUND") && states(A.related_events).every((x) => x === "EXPLICIT_UNBOUND"), "Achaia unbound classification");
  ok(states(M.related_people).every((x) => x === "EXPLICIT_UNBOUND") && states(M.related_events).every((x) => x === "EXPLICIT_UNBOUND"), "Amalek unbound classification");
  return ["A:" + A.related_people.length + "/" + A.related_events.length, "M:" + M.related_people.length + "/" + M.related_events.length];
});T("CB04", "Media metadata and rights survive projection", () => {
  ok(A.media.references.length === 1 && M.media.references.length === 2, "media count");
  ok(A.media.references[0].rights_status === "CLEARED" && A.media.references[0].rights.validated === true, "Achaia cleared rights");
  ok(M.media.references.every((x) => x.state === "BOUND" && x.rights_status === "CLEARED"), "Amalek media rights");
  for (const x of A.media.references.concat(M.media.references)) for (const k of ["stable_id","display_role","source","canonical_file_page","creator","license","rights_status","media_identity_certainty","use_boundary"]) ok(Object.prototype.hasOwnProperty.call(x, k), "missing media field " + k);
  return ["A=" + A.media.references.length, "M=" + M.media.references.length];
});
T("CB05", "Research, identity, relation, media, geometry and projection states are independent", () => {
  for (const r of [A, M]) for (const k of ["research_status","identity_binding_status","relation_binding_status","media_binding_status","geometry_status","projection_status"]) ok(r[k], "missing " + k);
  ok(A.geometry_status === "HOLD" && M.geometry_status === "HOLD", "geometry must stay HOLD");
  ok(!A.coordinates && !A.centroid && !M.coordinates && !M.centroid, "no fake coordinate");
  return [A.relation_binding_status, M.relation_binding_status, A.geometry_status, M.geometry_status];
});
T("CB06", "Reader Layer and scripture distinction are consumed", () => {
  ok(M.reader && M.reader.concise_summary && M.reader.quick_facts.length > 0, "Amalek Reader Layer");
  ok(A.reader && A.reader.concise_summary, "Achaia controlled Reader Layer");
  ok(M.passage_links.filter((x) => x.group === "direct").length === 28 && M.passage_links.some((x) => x.group === "related"), "Amalek direct/related distinction");
  ok(A.passage_links.some((x) => x.group === "direct") && A.passage_links.some((x) => x.group === "related"), "Achaia direct/related distinction");
  return ["Amalek direct=28", "Reader consumed"];
});
T("CB07", "Binding completeness gate is clean, and detects a dropped required binding", () => {
  ok(S.relation_binding.contract_failures.length === 0, "live dry-run contract failures");
  const copy = JSON.parse(JSON.stringify({ regions: { [A.stable_id]: A }, places: {}, people: {}, events: {} }));
  delete copy.regions[A.stable_id].relations[0].binding; copy.regions[A.stable_id].relations[0].resolved = false;
  const failures = bindingContractFailures(copy);
  ok(failures.some((x) => x.reason === "explicit_stable_identity_dropped"), "dropped binding must fail visibly");
  return failures[0];
});T("CB08", "Existing Connected Research assets still dry-run successfully", () => {
  const rec = Object.fromEntries(S.records.map((x) => [x.document_id, x]));
  ok(rec.JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.ok, "Beersheba dry-run");
  ok(rec.JBC_GERAR_CONNECTED_WORBS_20260930_01.ok, "Gerar dry-run");
  return ["Beersheba PASS", "Gerar PASS"];
});

const failed = out.filter((x) => !x.pass);
console.log((failed.length ? "FAIL " : "PASS ") + (out.length - failed.length) + "/" + out.length);
out.forEach((x) => console.log((x.pass ? "PASS " : "FAIL ") + x.id + " " + x.name + (x.pass ? " · " + JSON.stringify(x.ev) : " ✗ " + x.err)));
process.exit(failed.length ? 1 : 0);
