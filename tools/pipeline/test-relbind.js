"use strict";
// node tools/pipeline/test-relbind.js — focused relation-binding integration tests; synthetic only, no live writes.
const { bindRelations, buildIndex } = require("./relation-binding");
const results = [];
const T = (id, name, fn) => { try { const ev = fn() || []; results.push({ id, name, pass: true, ev }); } catch (e) { results.push({ id, name, pass: false, err: e.message }); } };
const ok = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
const clone = (x) => JSON.parse(JSON.stringify(x));
const rec = (sid, label, extra) => Object.assign({
  stable_id: sid, display_label: label, aliases: [], source_refs: [{ id: "SRC-" + sid }],
  authority: { approval_record_id: "APR-" + sid }, relations: [], connected: { places: [], people: [] },
  related_people: [], related_events: []
}, extra || {});
const A = "JBC-CR-PLACE-ALPHA-001", B = "JBC-CR-PLACE-BETA-001", R = "JBC-CR-REGION-GAMMA-001", P = "JBC-CR-PERSON-DELTA-001";
function base() {
  return { places: {
    [A]: rec(A, "Alpha"),
    [B]: rec(B, "Beta", { identity_binding: { source_registry_id: "BAT01-PLACE-0002" } })
  }, regions: { [R]: rec(R, "Gamma") }, people: { [P]: rec(P, "Delta") }, events: {} };
}
T("RB01", "whole-graph index contains Place / Region / Person without coercion", () => {
  const i = buildIndex(base()); ok(i.list.length === 4, "entities=" + i.list.length);
  ok(i.byId.get(R).type === "Region" && i.byId.get(P).type === "Person", "types lost");
  return ["entities=4"];
});T("RB02", "exact stable_id relation auto-binds and records provenance", () => {
  const p = base(); p.places[A].relations = [{ to: "Beta", to_id: B, relation: "RELATED" }];
  const r = bindRelations(p); const row = p.places[A].relations[0];
  ok(row.resolved === true && row.to_id === B && row.binding.state === "AUTO_BIND", JSON.stringify(row));
  ok(r.auto.length === 1 && r.auto[0].rule === "exact_stable_id_match" && /relations\[0\]/.test(r.auto[0].locator), JSON.stringify(r.auto));
  return ["auto=1"];
});
T("RB03", "approved registry identity auto-binds; registry id is not promoted to stable identity", () => {
  const p = base(); p.regions[R].relations = [{ to_source_registry_id: "BAT01-PLACE-0002", name: "Beta", relation: "BORDERS" }];
  const r = bindRelations(p), row = p.regions[R].relations[0];
  ok(row.resolved === true && row.to_id === B && row.binding.rule === "approved_identity_binding", JSON.stringify(row));
  ok(row.to_source_registry_id === "BAT01-PLACE-0002" && p.places[B].stable_id === B, "registry identity mutated");
  return ["registry->" + B];
});
T("RB04", "name-only match stays VERIFY and never merges", () => {
  const p = base(); p.places[A].relations = [{ to: "Beta", relation: "RELATED" }];
  const r = bindRelations(p), row = p.places[A].relations[0];
  ok(row.resolved !== true && row.binding.state === "VERIFY" && row.binding.candidates[0] === B, JSON.stringify(row));
  ok(r.verify.length === 1 && r.auto.length === 0, JSON.stringify(r.counts));
  return ["verify=1"];
});
T("RB05", "incompatible entity type fails closed as HOLD", () => {
  const p = base(); p.places[A].related_people = [{ name: "Beta", global_person_id: B, relation: "KNOWS", resolved: false }];
  const r = bindRelations(p), row = p.places[A].related_people[0];
  ok(row.binding.state === "HOLD" && /incompatible_entity_type/.test(row.binding.reason), JSON.stringify(row));
  ok(r.hold.length === 1, JSON.stringify(r.counts));
  return ["hold=1"];
});T("RB06", "missing target is a research gap, not a fabricated entity", () => {
  const p = base(); p.places[A].relations = [{ to: "Unprojected Place", to_id: "JBC-CR-PLACE-MISSING-001", relation: "RELATED" }];
  const before = Object.keys(p.places).length, r = bindRelations(p), row = p.places[A].relations[0];
  ok(row.resolved !== true && !row.binding, JSON.stringify(row));
  ok(r.gaps.length === 1 && r.gaps[0].reason === "target_entity_not_projected", JSON.stringify(r.gaps));
  ok(Object.keys(p.places).length === before, "entity fabricated");
  return ["gaps=1"];
});
T("RB07", "binding does not create coordinates, geometry or reader authority", () => {
  const p = base(); p.places[A].relations = [{ to: "Beta", to_id: B, relation: "RELATED" }];
  const protectedBefore = clone({ a: { coordinates: p.places[A].coordinates, geometry: p.places[A].geometry, reader: p.places[A].reader }, b: { coordinates: p.places[B].coordinates, geometry: p.places[B].geometry, reader: p.places[B].reader } });
  bindRelations(p);
  const protectedAfter = { a: { coordinates: p.places[A].coordinates, geometry: p.places[A].geometry, reader: p.places[A].reader }, b: { coordinates: p.places[B].coordinates, geometry: p.places[B].geometry, reader: p.places[B].reader } };
  ok(JSON.stringify(protectedBefore) === JSON.stringify(protectedAfter), "protected fields mutated");
  return ["protected-fields=unchanged"];
});
T("RB08", "same input is deterministic after reset", () => {
  const p = base(); p.places[A].relations = [{ to: "Beta", to_id: B, relation: "RELATED" }];
  const r1 = bindRelations(p), a = JSON.stringify({ row: p.places[A].relations[0], counts: r1.counts });
  const r2 = bindRelations(p), b = JSON.stringify({ row: p.places[A].relations[0], counts: r2.counts });
  ok(a === b, "non-deterministic rebinding");
  return ["deterministic"];
});
const fail = results.filter((r) => !r.pass);
results.forEach((r) => console.log((r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.pass ? (r.ev.length ? " · " + r.ev.join(" · ") : "") : " — " + r.err)));
console.log((fail.length ? "FAIL " : "PASS ") + (results.length - fail.length) + "/" + results.length);
process.exit(fail.length ? 1 : 0);
