"use strict";
// Shared Region pass used by BOTH the canonical generation (run.js ingest) and the isolated dry run (isolated-ingest.js).
// Reuses region-adapter (discoverRegions / buildRegion) and validate-region; the durable approval record is the shared approval gate.
// Fail-closed per record; last known good = the previous generated projection/index of the same target. Vault-only (no mirror fallback).
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const sidx = require("./scripture-index"), { parseNote } = require("./parse"), { discoverRegions, buildRegion } = require("./region-adapter"), { validateRegion } = require("./validate-region");

function listNotes(cfg, vault) {
  const out = [], isEx = (rel) => (cfg.exclude || []).some((ex) => ("/" + rel).indexOf("/" + ex.replace(/\/$/, "") + "/") >= 0);
  const walk = (dir, rel) => { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) { const f = path.join(dir, e.name), r = rel + e.name; if (e.isDirectory()) walk(f, r + "/"); else if (/\.md$/i.test(e.name) && !isEx(r)) out.push({ abs: f, vrel: r }); } };
  for (const inc of cfg.include || []) walk(path.join(vault, inc), inc);
  return out;
}

// Approval authority: a durable approval record referenced by id + file. Missing / altered / out-of-scope record → no approval (fail closed).
function loadApprovalRecord(ref, bind) {
  const errs = []; if (!ref || !ref.record_file || !ref.record_id) return { ok: false, errors: ["no approval record reference in the ingest config"], approval: null };
  let r; try { r = JSON.parse(fs.readFileSync(path.resolve(ROOT, ref.record_file), "utf8")); } catch (e) { return { ok: false, errors: ["approval record unavailable: " + ref.record_file], approval: null }; }
  const L = r.scope_limits || {}, src = r.source_reference || {};
  const need = [["approval_record_id", r.approval_record_id === ref.record_id], ["approval_authority", r.approval_authority === "CAPTAIN"], ["approval_state", r.approval_state === "CAPTAIN_APPROVED"], ["approval_scope", r.approval_scope === "IDENTITY_BINDING_ONLY"], ["recorded_at/approval_date", !!r.recorded_at && /^\d{4}-\d{2}-\d{2}$/.test(r.approval_date || "")],
    ["approved_asset", r.approved_asset === bind.research_id], ["approved_stable_identity", bind.viewer_id == null ? /^JBC-CR-[A-Z]+-[A-Z0-9_]+-\d{3}$/.test(r.approved_stable_identity || "") : r.approved_stable_identity === bind.viewer_id], ["source_reference", src.registry_id === bind.registry_id && src.role === "REFERENCE_ONLY" && src.equivalence_semantics === "NOT_AUTOMATIC_CROSSWALK"],
    ["scope_limits", L.coordinate_authorization === false && L.geometry_authorization === false && L.reader_layer_authorization === false && L.live_projection_activation === false && L.registry_effect === "NONE" && L.research_content_changed === false && L.VERIFY_HOLD === "PRESERVED" && L.automatic_merge === false && L.BAT01_crosswalk === false], ["no_re_approval", !(r.evidence && r.evidence.re_approval_requested)]];
  need.forEach((n) => { if (!n[1]) errs.push("approval record field/rule failed: " + n[0]); });
  return { ok: !errs.length, errors: errs, binding: errs.length ? null : { viewer_id: r.approved_stable_identity, registry_id: src.registry_id, crosswalk: L.BAT01_crosswalk, merge: L.automatic_merge }, approval: errs.length ? null : { value: "CAPTAIN_APPROVED", source: "approval record " + r.approval_record_id + " (" + r.approval_authority + ", " + r.approval_date + ", scope " + r.approval_scope + ")", record_id: r.approval_record_id, scope: r.approval_scope, recorded_at: r.recorded_at } };
}

// Auto-discovery of the approval record: every record in tools/pipeline/approvals/*.json whose approved_asset is this research asset. No config entry needed.
// More than one candidate is ambiguous → fail closed (no guess). An explicit config reference (records[id].approval) still wins.
const APPROVALS = path.join(__dirname, "approvals");
function findApprovalRef(documentId, dir) {
  dir = dir || APPROVALS; let hits = [];
  try { hits = fs.readdirSync(dir).filter((f) => /\.json$/i.test(f)).map((f) => { try { return { f, r: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }; } catch (e) { return null; } }).filter((x) => x && x.r && x.r.approved_asset === documentId); } catch (e) {}
  if (hits.length > 1) return { ambiguous: hits.map((h) => h.f) };
  return hits.length ? { record_id: hits[0].r.approval_record_id, record_file: path.relative(ROOT, path.join(dir, hits[0].f)).split(path.sep).join("/") } : null;
}

// o: { cfg, krv, vault, claimedAbs: Set of notes the Place pipeline claimed, prevProj, prevIdx, activationState }
function regionPass(o) {
  const out = { regions: {}, regionMeta: [], parts: [], records: [], skipped: [], preserved: [], found: [] };
  if (!o.vault || !fs.existsSync(o.vault)) return out;   // regions are generated from the authoritative vault only
  const notes = listNotes(o.cfg, o.vault).filter((n) => !o.claimedAbs.has(n.abs)), rdisc = discoverRegions(notes, {}); out.skipped = rdisc.skipped; out.found = rdisc.found;
  const staged = [];
  for (const d of rdisc.found) {
    const rc = (o.cfg.records || {})[d.document_id] || {};
    // eligibility gate: the approval record is found by asset id (no per-asset config entry); a note without one is reported as awaiting approval and never generated
    let ref = rc.approval || null, amb = null; if (!ref) { const f = findApprovalRef(d.document_id, o.approvalsDir); if (f && f.ambiguous) amb = f.ambiguous; else ref = f; }
    if (!ref && !amb && !rc.expected_identity) { out.records.push({ document_id: d.document_id, entity_type: "region", profile: d.profile, ok: false, gate: "AWAITING_APPROVAL", skipped: "eligibility gate: no approval record for this research asset (tools/pipeline/approvals has no approved_asset = " + d.document_id + ") — not ingested" }); continue; }
    const parsed = parseNote(d.abs), ap = amb ? { ok: false, errors: ["ambiguous approval records: " + amb.join(", ")], approval: null, binding: null } : loadApprovalRecord(ref, { research_id: d.document_id, viewer_id: d.stable_id, registry_id: d.registry_id }), expected = rc.expected_identity || (ap.binding && ap.binding.viewer_id) || null;
    const norm = buildRegion(parsed, { relPath: d.abs, approval: ap.approval, activationState: o.activationState, profile: d.profile, binding: ap.binding }), txt = fs.readFileSync(d.abs, "utf8").split(String.fromCharCode(13) + String.fromCharCode(10)).join("\n");
    const val = norm.record ? validateRegion(norm.record, { krv: o.krv, profile: d.profile, expected_identity: expected, sourceVerifyCount: (txt.match(/^\s*- id: VERIFY-[A-Z0-9-]+/gm) || []).length, sourceHoldCount: ((txt.split("retained_HOLD:")[1] || "").split(/```|~~~/)[0].match(/^\s*- \S+/gm) || []).length }) : { ok: false, errors: norm.errors, warnings: [], checks: [] };
    if (!ap.ok) { val.ok = false; ap.errors.forEach((e) => val.errors.push("R15_approval_record: " + e)); }
    const sid = (norm.record && norm.record.stable_id) || expected;
    staged.push({ d, rc, norm, val, sid });
  }
  // stable id collision (two research assets — or a region and a Place — claiming one viewer id) fails every claimant closed; the last known good entry of that id is kept
  const claim = {}; staged.forEach((x) => { if (x.val.ok) (claim[x.sid] = claim[x.sid] || []).push(x.d.document_id); });
  staged.forEach((x) => { const clash = (claim[x.sid] || []).length > 1 || (o.placeIds && o.placeIds.has(x.sid)); if (x.val.ok && clash) { x.val.ok = false; x.val.errors.push("R18_stable_id_collision: viewer id " + x.sid + " is claimed by " + ((claim[x.sid] || []).concat(o.placeIds && o.placeIds.has(x.sid) ? ["(a Place record)"] : [])).join(", ")); } });
  for (const { d, rc, norm, val, sid } of staged) {
    if (val.ok) {
      const idx = sidx.build(norm.record, o.krv); out.regions[sid] = norm.record;
      out.regionMeta.push({ stable_id: sid, entity_type: "region", research_id: norm.record.source_refs[0].id, source: { path: norm.record.source_refs[0].path, sha256: norm.record.source_refs[0].sha256 }, source_registry_id: norm.record.identity_binding.source_registry_id, source_registry_id_role: "REFERENCE_ONLY" });
      out.parts.push({ record: sid, research_id: norm.record.source_refs[0].id, source_sha256: norm.record.source_refs[0].sha256, entries: idx.entries, stats: idx.stats });
      out.records.push({ document_id: d.document_id, entity_type: "region", profile: d.profile, identity_source: rc.expected_identity ? "config" : "approval_record", approval_record: norm.record.authority.approval_record_id, stable_id: sid, ok: true, checks: val.checks.length, warnings: val.warnings, index: idx.stats });
    } else {
      const pp = o.prevProj, lk = pp && pp.regions && pp.regions[sid], lm = pp && pp.meta && (pp.meta.regions || []).find((m) => m.stable_id === sid), e = { document_id: d.document_id, stable_id: sid, ok: false, errors: val.errors };
      if (lk && lm) { out.regions[sid] = lk; out.regionMeta.push(Object.assign({}, lm, { preserved_last_known_good: true })); const pe = {}; Object.keys((o.prevIdx && o.prevIdx.entries) || {}).forEach((k) => { const es = o.prevIdx.entries[k].filter((x) => x.stable_id === sid); if (es.length) pe[k] = es; }); out.parts.push({ record: sid, research_id: lm.research_id, source_sha256: lm.source.sha256, entries: pe, stats: null }); e.preserved_last_known_good = true; out.preserved.push(sid); }
      out.records.push(e);
    }
  }
  return out;
}
module.exports = { listNotes, loadApprovalRecord, findApprovalRef, regionPass };
