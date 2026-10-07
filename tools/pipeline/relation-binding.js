"use strict";
// Relation binding stage — generic, record-agnostic. Runs inside ingest() after every Place / Region record is normalized + validated, against the WHOLE projected entity set,
// so a new approved note is matched against every existing entity on every run (watch.js → run.js → this stage). It only attaches relations the notes already state:
// it creates no entity, no identity, no relation, no coordinate. Rows it cannot prove stay exactly as written (unresolved).
//   AUTO_BIND  exact stable-id match · approved identity binding (registry id) · identity declared by the same note's structured block   → row resolved, rule + source locator recorded
//   VERIFY     exact name / alias match without identity · several candidates · indirect (path) mention                                  → candidate recorded, nothing merged / promoted
//   HOLD       incompatible type · contradictory identity · registry id vs stable id conflict                                           → fail closed: last known good binding of that row is kept
// Targets that no projected entity answers to (e.g. BAT01 ids of places that have no research asset yet) are true research gaps, reported apart from the above.
const TYPES = [["places", "Place"], ["regions", "Region"], ["people", "Person"], ["events", "Event"]];
const norm = (s) => String(s == null ? "" : s).toLowerCase().replace(/[_’'\-–—]/g, " ").replace(/^biblical\s+/, "").replace(/\s+/g, " ").trim();
const STABLE = /^JBC-CR-[A-Z]+-[A-Z0-9_]+-\d{3}$/;
const SOURCE_REGISTRY_ID = /^BAT01-(?:PLACE|REG)-\d{4}$/;
const ref = (rec) => (rec.source_refs && rec.source_refs[0] && rec.source_refs[0].id) || null;

function buildIndex(proj) {
  const idx = { byId: new Map(), byRegistry: new Map(), byName: new Map(), list: [] };
  for (const [key, type] of TYPES) for (const sid of Object.keys(proj[key] || {})) {
    const rec = proj[key][sid], names = new Set([rec.display_label, rec.label_en].concat(rec.aliases || []).map(norm).filter(Boolean));
    const e = { sid, type, rec, names, registry: (rec.identity_binding && rec.identity_binding.source_registry_id) || null, research: ref(rec), approved: !!(rec.authority && rec.authority.approval_record_id) };
    idx.byId.set(sid, e); idx.list.push(e); if (e.registry) idx.byRegistry.set(e.registry, e);
    for (const n of names) idx.byName.set(n, (idx.byName.get(n) || []).concat(e));
  }
  return idx;
}

// ---- mentions: every place in a record where another entity is pointed at. Only the structures the adapters already produce are read.
function mentions(e) {
  const rec = e.rec, out = [], loc = (what) => (rec.source_locator ? rec.source_locator + " · " : "") + what, isSelf = (name) => e.names.has(norm(name));
  (rec.relations || []).forEach((row, i) => {
    const where = loc("relations[" + i + "]");
    if (row.to_source_registry_id !== undefined) out.push({ slot: "row", row, i, end: "to", d: { registry: row.to_source_registry_id, name: row.name, expect: ["Place", "Region"] }, owner: e.sid, where });   // Region profile: registry-id target
    else for (const end of ["from", "to"]) {
      const name = row[end], idKey = end + "_id";
      if (name == null || row[idKey] === e.sid || isSelf(name)) continue;
      out.push({ slot: "row", row, i, end, d: { id: row[idKey] || null, name }, owner: e.sid, where });
    }
  });
  ((rec.connected && rec.connected.places) || []).forEach((p, i) => out.push({ slot: "connected.places", row: p, i, d: { id: p.stable_id || p.known_parent_asset_identity || null, name: p.name, expect: ["Place", "Region"] }, owner: e.sid, where: loc("connected.places[" + i + "]") }));
  ((rec.connected && rec.connected.people) || []).forEach((p, i) => out.push({ slot: "connected.people", row: p, i, d: { id: STABLE.test(p.global_person_id || p.stable_id || "") ? (p.global_person_id || p.stable_id) : null, name: p.label || p.name, expect: ["Person"], explicitUnbound: !STABLE.test(p.global_person_id || p.stable_id || ""), mergeBlocked: p.merge_with_other === "not_authorized" }, owner: e.sid, where: loc("connected.people[" + i + "]") }));
  ((rec.connected && rec.connected.events) || []).forEach((v, i) => { const id = v.event_id || (STABLE.test(v.global_event_id || "") ? v.global_event_id : null); if (id) out.push({ slot: "connected.events", row: v, i, d: { id, name: v.event || v.name || v.label, expect: ["Event"], explicitUnbound: false }, owner: e.sid, where: loc("connected.events[" + i + "]") }); });
  (rec.related_people || []).forEach((p, i) => out.push({ slot: "related_people", row: p, i, d: { id: STABLE.test(p.global_person_id || p.stable_id || "") ? (p.global_person_id || p.stable_id) : null, name: p.name || p.label, expect: ["Person"], explicitUnbound: !STABLE.test(p.global_person_id || p.stable_id || "") }, owner: e.sid, where: loc("related_people[" + i + "]") }));
  (rec.related_events || []).forEach((v, i) => out.push({ slot: "related_events", row: v, i, d: { id: STABLE.test(v.global_event_id || "") ? v.global_event_id : null, name: v.event || v.name || v.label, expect: ["Event"], explicitUnbound: !STABLE.test(v.global_event_id || "") }, owner: e.sid, where: loc("related_events[" + i + "]") }));
  return out;
}

function resolve(m, e, idx, declared) {
  const d = m.d, self = (t) => t.sid === e.sid, names = (t) => !d.name || t.names.has(norm(d.name)) || String(d.name).split(/\s*(?:→|\/)\s*/).some((x) => t.names.has(norm(x)));
  const typed = (t) => !d.expect || d.expect.includes(t.type);
  const byIdent = (t, rule) => (self(t) ? { state: "SELF" } : !typed(t) ? { state: "HOLD", reason: "incompatible_entity_type: " + t.sid + " is a " + t.type + ", the slot expects " + d.expect.join("/") } : !names(t) ? { state: "HOLD", reason: "contradictory_identity: " + t.sid + " is not named '" + d.name + "'" } : { state: "AUTO_BIND", rule, target: t.sid });
  let a = d.id && idx.byId.get(d.id), b = d.registry && idx.byRegistry.get(d.registry);
  if (a && b && a !== b) return { state: "HOLD", reason: "stable_id_conflict: " + d.id + " vs registry " + d.registry + " resolve to different entities" };
  if (a) return byIdent(a, "exact_stable_id_match");
  if (d.id && !b) { const t = idx.byRegistry.get(d.id); if (t) b = t; else if (SOURCE_REGISTRY_ID.test(d.id)) return { state: "EXTERNAL_BIND", rule: "explicit_source_registry_id", target_registry_id: d.id }; else return d.explicitUnbound ? { state: "UNBOUND", reason: "explicit_unbound_identity", target_ref: d.id } : { state: "GAP", reason: "target_entity_not_projected", target_ref: d.id }; }
  if (b) return !b.approved ? { state: "VERIFY", reason: "registry_match_without_approved_identity_binding", candidates: [b.sid] } : byIdent(b, "approved_identity_binding");
  if (d.registry) return SOURCE_REGISTRY_ID.test(d.registry) ? { state: "EXTERNAL_BIND", rule: "explicit_source_registry_id", target_registry_id: d.registry } : { state: "GAP", reason: "target_entity_not_projected", target_ref: d.registry };
  if (d.explicitUnbound) return { state: "UNBOUND", reason: "explicit_unbound_identity", target_ref: d.name || null };
  if (!d.name) return { state: "GAP", reason: "no_target" };
  const dec = declared.get(norm(d.name));   // identity pinned by the same note's structured block (an explicit alias crosswalk written by the note)
  if (dec && m.slot === "row" && idx.byId.get(dec)) return byIdent(idx.byId.get(dec), "record_declared_identity");
  const direct = (idx.byName.get(norm(d.name)) || []).filter((t) => !self(t));
  if (direct.length) return { state: "VERIFY", reason: direct.length > 1 ? "multiple_possible_entities" : "exact_name_match_without_identity", candidates: direct.map((t) => t.sid) };
  if (/→/.test(String(d.name))) {   // path / sequence strings: indirect mention only
    const hit = [...new Set(String(d.name).split(/\s*→\s*/).flatMap((x) => idx.byName.get(norm(x)) || []).filter((t) => !self(t)).map((t) => t.sid))];
    if (hit.length) return { state: "VERIFY", reason: "indirect_reference_without_explicit_identity", candidates: hit };
  }
  return { state: "GAP", reason: d.mergeBlocked ? "merge_not_authorized_by_note" : "target_entity_not_projected", target_ref: d.name };
}

// reset what an earlier run may have bound (last-known-good records are carried over as they were generated) so the result depends on the current entity set only
function reset(rec, sid) {
  const un = (row) => { if (!row || !row.binding) return; const explicitStableId = row.binding.rule === "exact_stable_id_match"; delete row.binding; if ("resolved" in row) row.resolved = false; if (!explicitStableId) for (const k of ["from_id", "to_id"]) if (row[k] && row[k] !== sid) row[k] = null; };
  (rec.relations || []).forEach(un); ((rec.connected && rec.connected.places) || []).forEach((p) => { delete p.binding; delete p.resolved; }); ((rec.connected && rec.connected.events) || []).forEach((p) => { delete p.binding; delete p.resolved; });
  (rec.related_people || []).forEach(un); (rec.related_events || []).forEach(un);
}

function bindingContractFailures(proj) {
  const idx = buildIndex(proj), failures = [];
  for (const e of idx.list) {
    (e.rec.relations || []).forEach((row, i) => { if (SOURCE_REGISTRY_ID.test(row.to_source_registry_id || "") && !(row.resolved === true && row.binding && (row.binding.state === "IDENTITY_BOUND" || row.binding.state === "AUTO_BIND"))) failures.push({ owner: e.sid, slot: "relations", index: i, reason: "explicit_stable_identity_dropped", target_ref: row.to_source_registry_id }); });
    (e.rec.related_people || []).forEach((row, i) => { const hasGlobal = STABLE.test(row.global_person_id || row.stable_id || ""); if (hasGlobal && !(row.resolved === true && row.binding && row.binding.state === "AUTO_BIND")) failures.push({ owner: e.sid, slot: "related_people", index: i, reason: "global_person_identity_not_bound", target_ref: row.global_person_id || row.stable_id }); if (!hasGlobal && !(row.resolved === false && row.binding && row.binding.state === "EXPLICIT_UNBOUND")) failures.push({ owner: e.sid, slot: "related_people", index: i, reason: "unresolved_person_not_explicitly_classified", target_ref: row.name || row.label }); });
    ((e.rec.connected && e.rec.connected.events) || []).forEach((row, i) => { const eid = row.event_id || row.global_event_id || ""; if (eid && !(row.resolved === true && row.binding && row.binding.state === "AUTO_BIND")) failures.push({ owner:e.sid, slot:"connected.events", index:i, reason:"explicit_event_identity_not_bound", target_ref:eid }); });
    (e.rec.related_events || []).forEach((row, i) => { const gid = row.global_event_id || "", hasGlobal = STABLE.test(gid); if (hasGlobal && !(row.resolved === true && row.binding && row.binding.state === "AUTO_BIND")) failures.push({ owner: e.sid, slot: "related_events", index: i, reason: "global_event_identity_not_bound", target_ref: gid }); if (!hasGlobal && !(row.resolved === false && row.binding && row.binding.state === "EXPLICIT_UNBOUND")) failures.push({ owner: e.sid, slot: "related_events", index: i, reason: "unresolved_event_not_explicitly_classified", target_ref: row.event || row.name || row.label }); });
  }
  return failures;
}

// proj: { places, regions, people?, events? } (records mutated in place). prev: previous generated projection (last known good for HOLD rows).
function bindRelations(proj, opts) {
  opts = opts || {}; const idx = buildIndex(proj), rep = { auto: [], verify: [], hold: [], gaps: [], contract_failures: [], provenance_references: [], counts: {}, shared_unprojected_targets: [] }, gapMap = new Map(), blocked = new Set();
  for (const e of idx.list) reset(e.rec, e.sid);
  for (const e of idx.list) {
    const declared = new Map(); ((e.rec.connected && e.rec.connected.places) || []).forEach((p) => { if (STABLE.test(p.known_parent_asset_identity || "") && p.name) declared.set(norm(p.name), p.known_parent_asset_identity); });
    for (const m of mentions(e)) {
      const r = resolve(m, e, idx, declared); if (r.state === "SELF") continue; if (m.d.mergeBlocked) blocked.add(norm(m.d.name));
      const base = { owner: e.sid, slot: m.slot, index: m.i, name: m.d.name || null, relation: m.row.relation || null, locator: m.where };
      if (r.state === "AUTO_BIND") {
        const t = idx.byId.get(r.target), b = { state: "AUTO_BIND", rule: r.rule, target_id: r.target, source_locator: m.where };
        if (m.slot === "row") { m.row.resolved = true; if (m.end === "from") { m.row.from_id = r.target; m.row.to_id = m.row.to_id || e.sid; } else if (m.end === "to") { m.row.to_id = r.target; m.row.from_id = m.row.from_id || (m.row.to_source_registry_id !== undefined ? null : e.sid); } else m.row.to_id = r.target; }
        else m.row.resolved = true;
        m.row.binding = b;
        rep.auto.push(Object.assign(base, { target: r.target, target_type: t.type, rule: r.rule, certainty: m.row.certainty === undefined ? null : m.row.certainty, evidence: m.row.evidence === undefined ? null : m.row.evidence }));
      } else if (r.state === "EXTERNAL_BIND") {
        m.row.resolved = true;
        m.row.binding = { state: "IDENTITY_BOUND", rule: r.rule, target_registry_id: r.target_registry_id, source_locator: m.where, detailed_projection: false };
        rep.auto.push(Object.assign(base, { target_registry_id: r.target_registry_id, target_type: "ExternalIdentity", rule: r.rule, certainty: m.row.certainty === undefined ? null : m.row.certainty, evidence: m.row.evidence === undefined ? null : m.row.evidence }));
      } else if (r.state === "UNBOUND") {
        m.row.resolved = false;
        m.row.binding = { state: "EXPLICIT_UNBOUND", reason: r.reason, target_ref: r.target_ref || null, source_locator: m.where };
        rep.gaps.push(Object.assign(base, { reason: r.reason, target_ref: r.target_ref || null, explicit_unbound: true }));
      } else if (r.state === "VERIFY") { m.row.binding = { state: "VERIFY", reason: r.reason, candidates: r.candidates, source_locator: m.where }; rep.verify.push(Object.assign(base, { reason: r.reason, candidates: r.candidates })); }
      else if (r.state === "HOLD") {
        const pv = prevBinding(opts.prev, e, m), kept = pv && idx.byId.has(pv.target_id) ? pv : null;
        if (kept) { if (m.slot === "row") m.row[m.end === "from" ? "from_id" : "to_id"] = kept.target_id; m.row.resolved = true; m.row.binding = Object.assign({}, kept, { preserved_last_known_good: true }); }
        else m.row.binding = { state: "HOLD", reason: r.reason, source_locator: m.where };
        rep.hold.push(Object.assign(base, { reason: r.reason, preserved_last_known_good: !!kept }));
      } else {
        const g = Object.assign(base, { reason: r.reason, target_ref: r.target_ref || null }); rep.gaps.push(g);
        const k = norm(r.target_ref || m.d.name); if (k && r.reason === "target_entity_not_projected") { const x = gapMap.get(k) || { target: r.target_ref || m.d.name, owners: new Set() }; x.owners.add(e.sid); gapMap.set(k, x); }
      }
    }
  }
  rep.shared_unprojected_targets = [...gapMap.values()].filter((x) => x.owners.size > 1 && !blocked.has(norm(x.target))).map((x) => ({ target: x.target, referenced_by: [...x.owners].sort() })).sort((p, q) => (p.target < q.target ? -1 : 1));
  for (const e of idx.list) {
    const owned = (a) => a.filter((x) => x.owner === e.sid), h = owned(rep.hold), v = owned(rep.verify), g = owned(rep.gaps), a = owned(rep.auto);
    const media = e.rec.media && Array.isArray(e.rec.media.references) ? e.rec.media.references : Array.isArray(e.rec.media) ? e.rec.media : [];
    e.rec.research_status = e.rec.status || null;
    e.rec.identity_binding_status = e.rec.stable_id ? "BOUND" : "UNBOUND";
    e.rec.relation_binding_status = h.length ? "HOLD" : v.length ? "VERIFY" : g.length ? (a.length ? "PARTIAL_WITH_EXPLICIT_UNBOUND" : "EXPLICIT_UNBOUND") : "BOUND";
    e.rec.media_binding_status = !media.length ? "NO_MEDIA" : media.every((m) => m.state === "BOUND" || m.rights && m.rights.validated === true) ? "BOUND" : media.some((m) => m.state === "BOUND" || m.rights && m.rights.validated === true) ? "PARTIAL" : "VERIFY";
    e.rec.geometry_status = e.rec.geometry && e.rec.geometry.approved === true ? "BOUND" : e.rec.spatial && e.rec.spatial.region && e.rec.spatial.region.render === "HOLD" ? "HOLD" : e.rec.coordinates ? "BOUND" : "UNBOUND";
    e.rec.projection_status = "PROJECTED";
  }
  rep.contract_failures = bindingContractFailures(proj);
  rep.counts = { entities: idx.list.length, auto_bound: rep.auto.length, verify_candidates: rep.verify.length, hold: rep.hold.length, true_research_gaps: rep.gaps.filter((x) => !x.explicit_unbound).length, explicit_unbound: rep.gaps.filter((x) => x.explicit_unbound).length, contract_failures: rep.contract_failures.length };
  return rep;
}

// last known good binding of the same row (same owner, slot, relation, endpoint name) in the previous generated projection
function prevBinding(prev, e, m) {
  if (!prev) return null; const cont = prev[e.type === "Region" ? "regions" : "places"], pr = cont && cont[e.sid]; if (!pr) return null;
  const arr = m.slot === "row" ? pr.relations : m.slot === "connected.places" ? (pr.connected && pr.connected.places) : null; if (!arr) return null;
  const hit = arr.find((x) => x.binding && x.binding.state === "AUTO_BIND" && (x.relation || null) === (m.row.relation || null) && ((x.name || x.to || x.from) === (m.row.name || m.row.to || m.row.from)));
  return hit ? hit.binding : null;
}

// Cross-note provenance references (e.g. a selection-audit row naming another research asset). They are source / lineage links, NOT entity relations: reported, never bound.
function provenanceReferences(files, idx) {
  const fs = require("fs"), out = [], byResearch = new Map(idx.list.filter((e) => e.research).map((e) => [e.research, e]));
  for (const f of files) {
    let txt; try { txt = fs.readFileSync(f.abs, "utf8"); } catch (e) { continue; } const own = f.document_id;
    const seen = new Set(); for (const mm of txt.matchAll(/research_asset:\s*([A-Za-z0-9_\-]+)/g)) { const t = byResearch.get(mm[1]); if (t && mm[1] !== own && !seen.has(mm[1])) { seen.add(mm[1]); out.push({ from_document: own, to_research_asset: mm[1], to_entity: t.sid, kind: "selection_audit_reference", bound_as_entity_relation: false }); } }
  }
  return out;
}
module.exports = { bindRelations, bindingContractFailures, buildIndex, provenanceReferences, norm };
