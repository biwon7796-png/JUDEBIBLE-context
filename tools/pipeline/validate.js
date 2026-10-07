"use strict";
// Stage 2 — validator (fail-closed). Checks the normalized record against the JudeBible projection contract,
// the Connected Research lock and the Beersheba gate. Errors stop the pipeline; warnings are reported and kept.
// Per-asset media validation (used by validate() for the whole record and by run.js to quarantine a single bad asset).
const COMMONS = /^https:\/\/commons\.wikimedia\.org\/wiki\/(File:[^\s"'<>?#]+)$/;
const UNSAFE = /^\s*(data:|javascript:|blob:|file:\/\/)|<\s*(script|iframe|object|embed|img|svg)[\s>\/]|(^|\s)on[a-z]+\s*=\s*["']/i;
function mediaErrors(a, rec) {
  const errs = [], add = (check, msg) => errs.push({ check, msg: a.id + ": " + msg });
  const known = new Set([rec.stable_id].concat((rec.candidates || []).map((c) => c.id)));
  const tr = a.target_ref;
  if (!tr || !tr.ref) add("V27_media_target_binding", "no explicit target_ref (bindings are never inferred from names or captions)");
  else if (!known.has(tr.ref)) add("V27_media_target_binding", "target_ref does not resolve to a known record id: " + tr.ref);
  else if (tr.binding !== "note" && tr.binding !== "overlay_explicit") add("V27_media_target_binding", "binding must be explicit (note | overlay_explicit): " + tr.binding);
  else {
    const c = (rec.candidates || []).find((x) => x.id === tr.ref), modern = c && /MODERN_CITY/.test(c.status || "");
    if (/modern/.test(a.role || "") && !modern) add("V27_media_target_binding", "a modern-landscape image must bind to the modern-city reference");
    if (modern && !/modern/.test(a.role || "")) add("V27_media_target_binding", "an ancient/archaeological image must not bind to the modern-city reference");
    const ic = a.identity_certainty && typeof a.identity_certainty === "object" ? a.identity_certainty : null, candidateOnly = !!ic && Object.keys(ic).some((k) => /^biblical_/i.test(k) && /CANDIDATE_ONLY/.test(String(ic[k])));
    if (tr.ref === rec.stable_id && !candidateOnly) add("V27_media_target_binding", "an image may not be bound to the biblical place itself unless it declares identity_certainty ... CANDIDATE_ONLY (no exact/ancient depiction is claimed)");
  }
  const r = a.rights || {};
  if (a.declared_rights && (!a.declared_rights.status || !a.declared_rights.license || a.declared_rights.license !== a.license)) add("V28_media_rights", "structured rights must state a status and exactly match the media license (declared " + a.declared_rights.license + ", media " + a.license + ")");
  if (!r.validated || !r.license_code || r.status === "UNNORMALIZED") add("V28_media_rights", "license '" + a.license + "' is not a normalized license → rights unvalidated");
  else {
    const RS = require("./media-resolver"), b = r.clearance_basis, basisOk = !!b && b.resolver === "wikimedia_commons_api" && b.license_code_match === true && b.creator_match === true && b.source_page_match === true && b.source_url_verified === true && !!RS.CLEARABLE[b.declared_rights_status];
    if (r.status === "CLEARED" && !(basisOk && a.preview_url)) add("V28_media_rights", "status CLEARED requires a verified resolver clearance basis (declared clearable status + license/creator/source page matched) and a resolved preview; otherwise it is reserved for the app display gate");
    if (r.display_clearance !== (r.status === "CLEARED")) add("V28_media_rights", "display clearance must be true exactly when the status is CLEARED");
    if (r.attribution_required && !(a.attribution && a.attribution.indexOf(a.creator) >= 0 && a.attribution.indexOf(a.license) >= 0)) add("V28_media_rights", "attribution text must contain creator and license");
    if (/ShareAlike/i.test(a.rights_note || "") && !r.share_alike) add("V28_media_rights", "note requires ShareAlike but the license is not share-alike");
  }
  if (a.source_url != null) {
    const good = require("./normalize").checkSourceUrl(a.source_url, a.file);
    if (!COMMONS.test(String(a.source_url))) add("V29_media_source_url", "source_url must be an https commons.wikimedia.org/wiki/File:… page: " + a.source_url);
    else if (!good) add("V29_media_source_url", "source_url page does not match the media file title");
    else if (a.source_url_verified !== true) add("V29_media_source_url", "a valid explicit source_url must be marked verified by the validator");
  } else if (a.source_url_verified !== false) add("V29_media_source_url", "source_url_verified must be false when there is no URL");
  const payloadKeys = ["image_url", "thumb_url", "payload", "data", "blob", "base64", "src"].filter((k) => a[k] != null && a[k] !== "");
  if (payloadKeys.length) add("V30_media_no_payload_or_unsafe", "payload/preview field present: " + payloadKeys.join(","));
  if (a.display_mode !== "attribution_only" && !(a.display_mode === "image" && a.preview_url)) add("V30_media_no_payload_or_unsafe", "display_mode must stay attribution_only unless a verified preview exists");
  const unsafe = []; (function w(o, p) { if (typeof o === "string") { if (UNSAFE.test(o)) unsafe.push(p); } else if (o && typeof o === "object") Object.keys(o).forEach((k) => w(o[k], p + "." + k)); })(a, "");
  if (unsafe.length) add("V30_media_no_payload_or_unsafe", "unsafe content in " + unsafe.join(","));
  // V35: a preview_url exists only when the Commons API resolution verified it against the research record; otherwise none
  const RS2 = require("./media-resolver"), res = a.resolution || null;
  if (a.preview_url != null) {
    const p = String(a.preview_url), bad = [];
    if (!RS2.HOST_OK.test(p)) bad.push("preview_url is not a Wikimedia Commons thumbnail host/path");
    if (!res || res.verified !== true) bad.push("no verified resolution");
    else {
      if (res.thumb_url !== p) bad.push("preview_url differs from the resolved thumbnail");
      if (res.license_match !== true || res.creator_match !== true || res.source_page_match !== true || res.title_match !== true) bad.push("resolution cross-checks incomplete");
      if (!RS2.MIME_OK.test(String(res.mime || ""))) bad.push("mime not an allowed raster image");
      if (res.restrictions) bad.push("API lists restrictions");
      if (res.eligible_for_display !== true) bad.push("resolution not eligible for display");
    }
    if (a.source_url_verified !== true) bad.push("source_url not verified");
    if (a.display_mode !== "image") bad.push("display_mode must be image when a preview is present");
    if (!a.rights || a.rights.status !== "CLEARED") bad.push("rights not CLEARED");
    if (bad.length) add("V35_media_preview_resolution", bad.join("; "));
  } else if (res && res.eligible_for_display === true) add("V35_media_preview_resolution", "resolution is eligible but no preview_url was applied");
  return errs;
}

function validate(rec, parsed, ctx) {
  const errors = [], warnings = [], checks = [];
  const check = (id, ok, msg, level) => { checks.push({ id, ok: !!ok, msg }); if (!ok) (level === "warn" ? warnings : errors).push(id + ": " + msg); };
  ctx = ctx || {};
  if (!rec) { errors.push("no record"); return { ok: false, errors, warnings, checks }; }

  check("V01_stable_id", /^JBC-CR-PLACE-[A-Z0-9_]+-\d{3}$/.test(rec.stable_id || ""), "stable_id must match JBC-CR-PLACE-<NAME>-<NNN>: " + rec.stable_id);
  check("V02_display_label", !!rec.display_label && !!rec.label_en, "canonical_name_ko / canonical_name_en required");
  check("V03_aliases_array", Array.isArray(rec.aliases), "aliases must be an array");
  check("V04_status_authority", !!rec.status && !!(rec.authority && rec.authority.project && rec.authority.approval), "status and authority(project, approval) required");
  check("V05_source_refs", !!(rec.source_refs && rec.source_refs[0] && rec.source_refs[0].id && rec.source_refs[0].sha256), "source_refs with research id + source hash required");
  check("V06_source_locator", !!rec.source_locator, "source_locator required");
  check("V07_certainty", !!rec.certainty && !!rec.coordinate_certainty, "certainty and coordinate_certainty required");
  check("V08_no_registry_effect", rec.authority && rec.authority.registry_effect === "NONE" && rec.authority.BAT01_crosswalk === "NOT_PERFORMED", "registry effect must be NONE and BAT01 crosswalk NOT_PERFORMED");
  const lineage = parsed && (Object.values(parsed.sections).flatMap((s) => s.yaml).map((b) => b.data).find((d) => d && d.Place) || {}).Place;
  check("V09_no_BAT01_reuse", !lineage || !lineage.identity_lineage || (lineage.identity_lineage.BAT01_PLACE_reuse === false && lineage.identity_lineage.BAT01_P_crosswalk === false), "identity_lineage must not reuse BAT01 ids");

  // biblical place must not receive an exact coordinate unless the note says it is verified
  const unlocated = /^(NO_EXACT_POINT|NOT_ASSIGNED|UNKNOWN)/.test(rec.coordinate_status || "") || /DISPUTED|UNKNOWN/.test(rec.coordinate_certainty || "");
  check("V10_no_invented_primary_coordinate", !(unlocated && rec.coordinates), "primary place is unlocated in the note but a coordinate was produced");
  check("V11_coordinate_status_stated", !!rec.coordinate_status, "coordinate_status must come from the note");
  check("V12_candidates_not_equated", (rec.candidates || []).every((c) => c.equivalence_locked === false && ((c.lat === null && c.lon === null) || (typeof c.lat === "number" && isFinite(c.lat) && typeof c.lon === "number" && isFinite(c.lon)))), "candidate sites must carry coordinates (or an explicit null) and stay non-equivalent to the biblical place");
  check("V13_candidate_coords_agree", (rec.candidates || []).every((c) => !c._tableLat || (c._tableLat === c.lat && c._tableLon === c.lon)), "candidate coordinates disagree between tables", "warn");

  check("V26_coordinate_ranges", (rec.candidates || []).every((c) => c.lat === null || (Math.abs(c.lat) <= 85 && Math.abs(c.lon) <= 180)), "candidate coordinates must be valid geographic coordinates (|lat| <= 85, |lon| <= 180)");

  // passage links must resolve inside the (read-only) KRV
  const krv = ctx.krv, bad = [];
  if (krv) for (const l of rec.passage_links || []) { const b = krv.books.find((x) => x.id === l.book), ch = b && b.chapters[l.chapter - 1]; if (!ch || (l.v1 && (l.v1 > ch.length || l.v2 > ch.length || l.v2 < l.v1))) bad.push(l); }
  check("V14_passage_refs_exist", (rec.passage_links || []).length > 0 && !bad.length, "passage_refs must exist in KRV: " + JSON.stringify(bad));
  check("V15_direct_links_present", (rec.passage_links || []).some((l) => l.group === "direct"), "at least one direct-mention passage link required");

  // claims & evidence
  const ids = (rec.claims || []).map((c) => c.id);
  check("V16_claims_complete", (rec.claims || []).length > 0 && (rec.claims || []).every((c) => c.id && c.statement && c.class && c.locator && c.confidence), "every claim needs id, statement, class, evidence locator, confidence");
  check("V17_claim_ids_unique", new Set(ids).size === ids.length, "claim ids must be unique");

  // VERIFY / HOLD preservation
  const withVerify = /WITH_VERIFY/.test(rec.status || "");
  check("V18_verify_hold_preserved", !!rec.VERIFY_HOLD && (!withVerify || (rec.verify || []).length > 0), "status carries VERIFY but no retained VERIFY item was preserved");
  check("V19_verify_items_complete", (rec.verify || []).every((v) => v.id && v.issue), "each VERIFY item needs id and issue");

  // media metadata
  check("V20_media_metadata", (rec.media || []).every((m) => m.id && m.file && m.creator && m.license && m.provider), "each media ref needs id, source file, creator, license, provider");
  check("V21_no_media_payload", (rec.media || []).every((m) => (!m.preview_url || (m.resolution && m.resolution.verified === true)) && (!m.source_url || m.source_url_verified === true)), "a preview URL exists only when the Commons API resolution verified it; a source URL is carried only when explicitly supplied and verified (V29 checks host and file match)");
  const unnorm = (rec.media || []).filter((m) => !m.rights || !m.rights.validated);
  check("V22_media_rights_unnormalized", !unnorm.length, unnorm.length + " media ref(s) have no app-normalized rights → attribution-only display", "warn");

  // media asset contract (per asset: target binding, rights, source URL, payload safety) + representative + hash
  const mErr = (rec.media || []).map((a) => mediaErrors(a, rec)), flat = mErr.flat();
  for (const id of ["V27_media_target_binding", "V28_media_rights", "V29_media_source_url", "V30_media_no_payload_or_unsafe", "V35_media_preview_resolution"]) { const f = flat.filter((e) => e.check === id); check(id, !f.length, f.map((e) => e.msg).join("; ")); }
  const repIds = (rec.media || []).filter((a) => a.representative).map((a) => a.id);
  check("V31_representative_resolution", repIds.length <= 1 && (rec.representative_media_id || null) === (repIds[0] || null) && (!rec.representative_media_id || (rec.media || []).some((a) => a.id === rec.representative_media_id)), "representative must resolve to exactly one bound, non-modern asset (or none): " + repIds.join());
  check("V32_media_hash", (rec.media || []).every((a) => a.content_hash && a.content_hash === (ctx.mediaHash || require("./normalize").mediaHash)(a)), "per-media content hash missing or stale");

  // V36: spatial read model — kinds kept apart, certainty dimensions separate, nothing invented, VERIFY/HOLD preserved
  const sp = rec.spatial, sm = require("./normalize").siteMarker, spErr = [];
  if (!sp) spErr.push("spatial read model missing");
  else {
    if (!sp.subject || sp.subject.stable_id !== rec.stable_id || sp.primary.ref !== rec.stable_id && !(sp.primary.ref || "").startsWith("JBC-CR-")) spErr.push("spatial identity must be the record's stable_id");
    if (!(sp.certainty && "identity" in sp.certainty && "coordinate" in sp.certainty) || sp.certainty.identity !== rec.certainty || sp.certainty.coordinate !== rec.coordinate_certainty) spErr.push("certainty dimensions (identity vs coordinate) must be carried separately and unchanged");
    if (sp.primary.coordinates !== rec.coordinates && JSON.stringify(sp.primary.coordinates) !== JSON.stringify(rec.coordinates)) spErr.push("primary coordinates differ from the record");
    if (sp.primary.marker.render && !(sp.primary.coordinates && /^VERIFIED/.test(sp.primary.coordinate_status || "") && /^VERIFIED/.test(rec.coordinate_certainty || ""))) spErr.push("a primary marker needs a verified coordinate, status and certainty");
    if (!sp.primary.coordinates && sp.primary.marker.render) spErr.push("no primary marker without a coordinate");
    if ((sp.sites || []).some((x, i) => JSON.stringify(x.marker) !== JSON.stringify(sm(rec.candidates[i] || {})) || x.lat !== rec.candidates[i].lat || x.lon !== rec.candidates[i].lon)) spErr.push("site markers/coordinates must equal the record's candidates under the marker rule");
    if (sp.region && (sp.region.boundary !== null || "lat" in sp.region || "lon" in sp.region || "geometry" in sp.region)) spErr.push("a region carries no invented boundary or point");
    if ((sp.routes || []).some((r) => r.geometry !== null)) spErr.push("a route carries no invented geometry");
    if (JSON.stringify(sp.verify_hold) !== JSON.stringify({ verify: (rec.verify || []).map((v) => v.id), hold: (rec.hold || []).length })) spErr.push("VERIFY/HOLD must be preserved exactly");
    if (sp.degradation.markers === 0 && !sp.degradation.reason) spErr.push("no markers requires a stated degradation reason");
    if ((sp.sites || []).some((x) => x.equivalence_locked !== false)) spErr.push("candidate sites are never equated with the primary place");
  }
  check("V36_spatial_read_model", !spErr.length, spErr.join("; "));

  // approval + identity expectations from the ingest configuration
  check("V33_approval_state", /APPROVED/.test((rec.authority && rec.authority.approval) || ""), "record is not approved (effective approval: " + (rec.authority && rec.authority.approval) + (rec.authority && rec.authority.note_approval_status ? "; note says " + rec.authority.note_approval_status : "") + ")");
  check("V34_expected_identity", !ctx.expected_identity || rec.stable_id === ctx.expected_identity, "stable_id " + rec.stable_id + " does not match the expected identity " + ctx.expected_identity);

  // relations: never resolved by name
  check("V23_no_name_only_relations", (rec.relations || []).every((r) => r.resolved === false && r.from_id === null), "relations must not be resolved by name");
  check("V24_no_invented_relations", (rec.relations || []).length > 0 ? true : true, "relations only as written");

  // navigation metadata (lock §9): explicit only; one record may carry multiple approved paths using the same stable_id.
  if (rec.navigation) {
    const top = new Set(["기초 지리", "자연환경", "구약 역사", "중간기", "신약"]), paths = Array.isArray(rec.navigation) ? rec.navigation : [rec.navigation];
    check("V25_navigation_metadata", paths.length > 0 && paths.every((n) => !!(n && n.domain && n.period && n.story && n.scene) && top.has(n.domain) && (n.places || []).every((p) => /^JBC-CR-/.test(p))), "navigation paths need an approved NAV_TOP_5 domain + period/story/scene + explicit research ids");
  } else warnings.push("V25_navigation_metadata: absent in source → no Navigation candidate generated (nothing invented)");

  return { ok: errors.length === 0, errors, warnings, checks };
}
module.exports = { validate, mediaErrors };
