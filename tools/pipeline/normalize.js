"use strict";
// Stage 3 — normalizer: parsed research note (+ app overlay) → the existing JudeBible projection record shape
// (window.BVC_PROJECTION.places[stable_id]). It only re-shapes what the note states. Nothing is inferred:
// missing values stay null/absent, unresolved relation endpoints are flagged, coordinates come only from the note.
const path = require("path");

const BOOKS = { Genesis: "gen", Exodus: "exo", Leviticus: "lev", Numbers: "num", Deuteronomy: "deu", Joshua: "jos", Judges: "jdg", Ruth: "rut", "1 Samuel": "1sa", "2 Samuel": "2sa", "1 Kings": "1ki", "2 Kings": "2ki", "1 Chronicles": "1ch", "2 Chronicles": "2ch", Ezra: "ezr", Nehemiah: "neh", Esther: "est", Job: "job", Psalms: "psa", Proverbs: "pro", Ecclesiastes: "ecc", "Song of Solomon": "sng", Isaiah: "isa", Jeremiah: "jer", Lamentations: "lam", Ezekiel: "ezk", Daniel: "dan", Hosea: "hos", Joel: "jol", Amos: "amo", Obadiah: "oba", Jonah: "jon", Micah: "mic", Nahum: "nam", Habakkuk: "hab", Zephaniah: "zep", Haggai: "hag", Zechariah: "zec", Malachi: "mal", Matthew: "mat", Mark: "mrk", Luke: "luk", John: "jhn", Acts: "act", Romans: "rom", "1 Corinthians": "1co", "2 Corinthians": "2co", Galatians: "gal", Ephesians: "eph", Philippians: "php", Colossians: "col", "1 Thessalonians": "1th", "2 Thessalonians": "2th", "1 Timothy": "1ti", "2 Timothy": "2ti", Titus: "tit", Philemon: "phm", Hebrews: "heb", James: "jas", "1 Peter": "1pe", "2 Peter": "2pe", "1 John": "1jn", "2 John": "2jn", "3 John": "3jn", Jude: "jud", Revelation: "rev" };

const plain = (s) => String(s == null ? "" : s).replace(/\*\*/g, "").replace(/`/g, "");   // reader-facing text: markdown emphasis / code ticks only
const unt = (s) => String(s == null ? "" : s).replace(/`/g, "").trim();
const sentences = (t) => String(t).split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);

function findYaml(parsed, pred) { for (const k of parsed.order) for (const b of parsed.sections[k].yaml) if (b.data && pred(b.data)) return { section: parsed.sections[k], data: b.data, line: b.line }; return null; }
function findSection(parsed, re) { for (const k of parsed.order) if (re.test(parsed.sections[k].heading)) return parsed.sections[k]; return null; }
function findTable(parsed, re, headRe) { const s = findSection(parsed, re); if (!s) return null; return s.tables.find((t) => !headRe || headRe.test(t.header.join("|"))) || s.tables[0] || null; }

// "Genesis 21:31-34" | "Genesis 20" | "Genesis 26:1-22" → { book, chapter, v1, v2 } (null when the string is not a scripture reference)
function parseRef(str) {
  const u = /^((?:[1-3]_)?[A-Za-z]+)_(\d+)(?:_(\d+)(?:_(\d+))?)?$/.exec(String(str).trim());
  if (u && BOOKS[u[1].replace("_", " ")]) return { book: BOOKS[u[1].replace("_", " ")], chapter: +u[2], v1: u[3] ? +u[3] : null, v2: u[3] ? (u[4] ? +u[4] : +u[3]) : null };
  const m = /^\s*((?:[1-3]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/.exec(String(str));
  if (!m || !BOOKS[m[1].trim()]) return null;
  return { book: BOOKS[m[1].trim()], chapter: +m[2], v1: m[3] ? +m[3] : null, v2: m[3] ? (m[4] ? +m[4] : +m[3]) : null };
}

// License names as written in the notes → normalized rights (BY = attribution required, SA = ShareAlike). Unknown names stay unnormalized.
const LICENSES = { "CC BY 4.0": { code: "CC-BY-4.0", by: true, sa: false }, "CC BY-SA 4.0": { code: "CC-BY-SA-4.0", by: true, sa: true }, "CC BY-SA 3.0": { code: "CC-BY-SA-3.0", by: true, sa: true }, "CC BY 3.0": { code: "CC-BY-3.0", by: true, sa: false }, "CC0 1.0": { code: "CC0-1.0", by: false, sa: false }, "CC0_1.0": { code: "CC0-1.0", by: false, sa: false }, "Public domain": { code: "PUBLIC-DOMAIN", by: false, sa: false } };
// Per-media incremental hash: sha256 over the canonical JSON of the asset (without its own hash), keys sorted.
const canon = (o) => Array.isArray(o) ? "[" + o.map(canon).join(",") + "]" : o && typeof o === "object" ? "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}" : JSON.stringify(o === undefined ? null : o);
// A source URL is accepted only when it is explicit (supplied by the note/overlay) and is a Wikimedia Commons file page whose title matches
// the media file. "Verified" is generated here, never taken from author input, and never built from a file name.
const COMMONS_PAGE = /^https:\/\/commons\.wikimedia\.org\/wiki\/(File:[^\s"'<>?#]+)$/;
function checkSourceUrl(url, file) {
  const m = COMMONS_PAGE.exec(String(url == null ? "" : url)); if (!m || !file) return false;
  let t; try { t = decodeURIComponent(m[1]); } catch (e) { return false; }
  return t.replace(/_/g, " ") === String(file).replace(/_/g, " ");
}
const mediaHash = (a) => { const c = Object.assign({}, a); delete c.content_hash; if (c.resolution) c.resolution = Object.assign({}, c.resolution, { retrieved_at: null }); /* retrieval time is not content */ return require("crypto").createHash("sha256").update(canon(c)).digest("hex"); };

// Marker eligibility for a candidate site (mirrors the app's markerSpec): real coordinates AND a recognized explicit status for its role.
function siteMarker(c) {
  const ok = typeof c.lat === "number" && typeof c.lon === "number" && isFinite(c.lat) && isFinite(c.lon) && Math.abs(c.lat) <= 85 && Math.abs(c.lon) <= 180;
  if (!ok) return { render: false, style: null, reason: "no_usable_coordinates" };
  if (c.role === "modern_context") return /^MODERN_CITY_REFERENCE$/.test(c.status || "") ? { render: true, style: "modern", reason: "modern_city_reference" } : { render: false, style: null, reason: "unrecognized_status" };
  if (c.role === "archaeological_candidate") return /^VERIFIED_ARCHAEOLOGICAL_SITE$/.test(c.status || "") ? { render: true, style: "site", reason: "verified_archaeological_site" } : { render: false, style: null, reason: "unrecognized_status" };
  return { render: false, style: null, reason: "unknown_role" };
}

function normalize(parsed, overlay, opts) {
  opts = opts || {};
  const prov = {}, warn = [];
  const rel = opts.relPath || path.basename(parsed.source.path);

  const head = findYaml(parsed, (d) => d.research_id || d.document_id);
  const place = findYaml(parsed, (d) => d.Place);
  const hand = findYaml(parsed, (d) => d.MINIMUM_HANDOFF);
  const mapReady = findYaml(parsed, (d) => d.map_ready);
  const links = findYaml(parsed, (d) => d.DIRECT_MENTION || (d.PassageLink && d.PassageLink.DIRECT_MENTION));
  const vh = findYaml(parsed, (d) => d.retained_VERIFY || d.retained_HOLD);
  const mediaRightsBlock = findYaml(parsed, (d) => d.structured_media_rights);
  const navBlock = findYaml(parsed, (d) => d.domain || d.period || d.story || d.scene);
  const P = place && place.data.Place, H = head && head.data, HO = hand && hand.data.MINIMUM_HANDOFF, MR = mapReady && mapReady.data.map_ready;
  if (!P) return { record: null, provenance: prov, warnings: ["no Place block"] };

  const sid = P.stable_id;
  const cert = P.certainty && typeof P.certainty === "object" ? P.certainty : null, an = P.ancient_name || {};
  const noteApproval = (H && (H.quality_status || H.approval_status || H.quality_gate)) || null, ovrApproval = opts.approval && opts.approval.value ? opts.approval : null;
  const rec = {
    stable_id: sid,
    legacy_key: overlay.legacy_key || null,
    type: "place",
    reader_type: overlay.reader_type,
    hero_caption: overlay.hero_caption,
    hero_subject: overlay.hero_subject,
    display_label: P.canonical_name_ko,
    label_en: P.canonical_name_en,
    ancient_name: { hebrew: an.hebrew || an.hebrew_consonantal, transliteration: an.transliteration || an.scholarly_transliteration },
    aliases: (P.aliases || []).slice(),
    place_type: { primary: P.place_type && P.place_type.primary, secondary: ((P.place_type && P.place_type.secondary) || []).slice() },
    region: { canonical: P.region && (P.region.canonical || P.region.label), stable_ref: P.region && P.region.stable_ref },
    certainty: cert ? cert.biblical_place_identity : P.certainty,
    coordinate_certainty: P.coordinate_certainty || (cert && cert.exact_modern_location),
    coordinates: null,
    coordinate_status: null,
    status: P.status || (H && H.research_status),
    authority: { project: HO && HO.from_project, module: H && H.selected_module, approval: ovrApproval ? ovrApproval.value : noteApproval, registry_effect: H && H.registry_mutation, BAT01_crosswalk: H && H.BAT01_crosswalk, ...(ovrApproval ? { note_approval_status: noteApproval, approval_source: ovrApproval.source } : {}) },
    source_refs: [{ id: H && (H.research_id || H.document_id), version: HO && HO.version, path: rel.replace(/\\/g, "/"), sha256: parsed.source.sha256 }],
    source_locator: "§" + (place.section.heading.replace(/^(\d+)\.\s*/, "$1 ")),
    VERIFY_HOLD: null
  };
  prov.identity = place.section.key + " (yaml @line " + place.line + ")";

  // --- Reader layer
  const idSec = findSection(parsed, /^identity$/), sumSec = findSection(parsed, /^concise_summary$/), qfTab = findTable(parsed, /^quick_facts$/);
  const bold = idSec && idSec.text.join(" ").match(/^\*\*(.+?)\*\*$/);
  const headline = bold ? bold[1].split(" — ").slice(1).join(" — ").trim() : null;
  const summary = sumSec ? sumSec.text.join(" ") : null;
  const hide = new Set(overlay.hide_quick_fact_rows || []);
  rec.reader = { headline, concise_summary: summary, quick_facts: (qfTab ? qfTab.rows : []).filter((r) => !hide.has(r[0])).map((r) => [r[0], plain(r[1])]), glance: overlay.glance || (qfTab ? qfTab.rows : []).filter((r) => !hide.has(r[0])).map((r) => [r[0], plain(r[1])]) };
  prov.reader = "Reader Layer > identity / concise_summary / quick_facts";

  // --- Location (reader status derived from the note's coordinate_certainty; sentences per overlay spec)
  const st = /^(VERIFIED|LIKELY|PLAUSIBLE|DISPUTED|UNKNOWN|VERIFY|HOLD)/.exec(rec.coordinate_certainty || "");
  const lastSentence = summary ? sentences(summary).pop() : null;
  rec.location = {
    reader_status: st ? st[1] : null,
    lead: overlay.location && overlay.location.lead,
    sentences: overlay.location ? ((overlay.location.sentences) || []).map((s) => (s.from === "summary_last_sentence" ? lastSentence : s.text)).filter(Boolean) : ((findSection(parsed, /^location_hypothesis$/) || { text: [] }).text.map(plain))
  };

  // --- Coordinates (primary must stay unlocated; candidates only from the note)
  const coordTab = findTable(parsed, /Coordinates$/, /identity/i), cand = [];
  for (const r of (coordTab ? coordTab.rows : [])) {
    const id = (/`([^`]+)`/.exec(r[0]) || [])[1], xy = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/.exec(r[1] || "");
    if (id === sid) { rec.coordinate_status = unt(r[2]); if (xy) rec.coordinates = { lat: +xy[1], lon: +xy[2] }; continue; }
    if (id && xy) cand.push({ id, lat: +xy[1], lon: +xy[2], status: unt(r[2]), note: unt(r[3]) });
  }
  const roleOf = {}; if (MR) { if (MR.archaeological_candidate) roleOf[MR.archaeological_candidate.ref] = { role: "archaeological_candidate", lat: MR.archaeological_candidate.lat, lon: MR.archaeological_candidate.lon, eq: MR.archaeological_candidate.exact_equivalence === true }; if (MR.modern_city) roleOf[MR.modern_city.ref] = { role: "modern_context", lat: MR.modern_city.lat, lon: MR.modern_city.lon, eq: MR.modern_city.biblical_identity === true }; }
  rec.candidates = cand.map((c) => ({ id: c.id, label: (overlay.candidate_labels || {})[c.id] || c.id, reader_label: (overlay.candidate_reader_labels || {})[c.id] || null, lat: (roleOf[c.id] || c).lat, lon: (roleOf[c.id] || c).lon, status: c.status, role: (roleOf[c.id] || {}).role || null, equivalence_locked: (roleOf[c.id] || {}).eq === true, note: c.note }));
  const geo = findYaml(parsed, (d) => Array.isArray(d.candidate_sites) && !d.map_ready), detail = (geo && geo.data.candidate_sites) || [];
  const primaryGeo = !rec.coordinate_status && geo && Object.keys(geo.data).map((k) => geo.data[k]).find((v) => v && typeof v === "object" && !Array.isArray(v) && "exact_coordinate" in v);
  if (primaryGeo) rec.coordinate_status = unt(primaryGeo.exact_coordinate);   // primary coordinate is never produced here; only the note's own status word is carried
  if (!rec.candidates.length && MR && Array.isArray(MR.candidate_sites)) {
    rec.candidates = MR.candidate_sites.map((c) => {
      const d = detail.find((x) => x.candidate_name === c.label) || {}, has = isFinite(c.lat) && isFinite(c.lon) && c.lat !== null && c.lon !== null;
      return { id: null, label: (overlay.candidate_labels || {})[c.label] || c.label, reader_label: (overlay.candidate_reader_labels || {})[c.label] || null, lat: has ? c.lat : null, lon: has ? c.lon : null, status: null, role: c.coordinate_applies_to === "archaeological_site_only" ? "archaeological_candidate" : null, candidate_role: d.candidate_role || c.relation_to_primary || null, identification_certainty: d.identification_certainty || null, coordinate_source: (d.coordinate_for_archaeological_site && d.coordinate_for_archaeological_site.source) || null, equivalence_locked: d.biblical_equivalence_locked === true, note: d.note || null };
    });
  }
  if (!rec.coordinate_status) warn.push("no primary coordinate status found in the note; coordinate_status left empty");
  prov.coordinates = "Research Layer > Coordinates / Geography + Map Ready Fields";

  // --- PassageLink (scripture references only; CONTEXTUAL free text is not a scripture reference and is skipped)
  const skipped = [];
  rec.passage_links = [];
  const linkSrc = links && (links.data.DIRECT_MENTION ? links.data : links.data.PassageLink);
  if (linkSrc) for (const [key, group] of [["DIRECT_MENTION", "direct"], ["STRONGLY_RELATED", "related"], ["CONTEXTUAL", "context"]]) for (const it of [].concat(linkSrc[key] && linkSrc[key]._items ? linkSrc[key]._items : linkSrc[key] || [])) { const s = it && typeof it === "object" ? it.passage : it, r = parseRef(s); if (r && group !== "context") rec.passage_links.push(Object.assign({ group }, r)); else skipped.push(key + ": " + s); }
  if (linkSrc) for (const it of [].concat(linkSrc.TEXTUAL_VARIANT || [])) skipped.push("TEXTUAL_VARIANT: " + it);
  prov.passage_links = "PassageLink Set (yaml @line " + (links && links.line) + ")";

  // --- Claims / Evidence locators
  const clTab = findTable(parsed, /Claim.Evidence Matrix/);
  const claimCols = clTab && /^Claim ID$/i.test(clTab.header[0] || "") && clTab.header.length >= 5;
  rec.claims = (clTab ? clTab.rows : []).map((r) => { if (claimCols) return { id: ((/`(CLM-[A-Z0-9-]+)`/.exec(r[0]) || [])[1]) || null, statement: (r[1] || "").trim(), class: r[2], locator: r[3], confidence: r[4] }; const m = /`(CLM-[A-Z0-9-]+)`\s*(.*)/.exec(r[0]) || []; return { id: m[1] || null, statement: (m[2] || "").trim(), class: r[1], locator: r[2], confidence: r[3] }; });
  const dispute = findSection(parsed, /고고학 판정/), fritz = dispute && sentences(dispute.text.join(" ")).find((s) => /Fritz/.test(s));
  const viewSecs = parsed.order.map((k) => parsed.sections[k]).filter((x) => /^View [A-Z] — /.test(x.heading));
  rec.competing_views = fritz ? [unt(fritz)] : viewSecs.map((x) => plain(x.heading.replace(/^View [A-Z] — /, "") + " — " + x.text.join(" ")));

  // --- Relations (as written; endpoints without a research id are flagged unresolved and never linked)
  const rlTab = findTable(parsed, /Entity and Relation Matrix|Relation Matrix/), selfNames = new Set([P.canonical_name_en, "Biblical " + P.canonical_name_en]);
  rec.relations = (rlTab ? rlTab.rows : []).map((r) => ({ from: r[0], relation: unt(r[1]), to: r[2], evidence: r[3], certainty: r[4], from_id: null, to_id: selfNames.has(r[2]) ? sid : null, resolved: false }));

  // --- VERIFY / HOLD
  const V = (vh && vh.data.retained_VERIFY) || [], Hd = (vh && vh.data.retained_HOLD) || [];
  rec.verify = V.map((v) => ({ id: v.id, issue: v.issue, state: v.state, consequence: v.consequence })); rec.hold = Hd.map((h) => (h && typeof h === "object" ? h.issue : h));
  rec.VERIFY_HOLD = { verify: V.length > 0, hold: Hd.length > 0, reason: "retained " + V.map((v) => v.id).join(", ") + " / HOLD " + Hd.length + "건" };

  // --- Media (Wikimedia Media Refs) → normalized MediaAsset contract. Metadata only: no image payload, no preview URL,
  // no URL derived from a file name. Target binding, rights and source URL are explicit or absent — never inferred.
  rec.media = [];
  const bindings = overlay.media_bindings || {};
  const structuredRights = (mediaRightsBlock && mediaRightsBlock.data.structured_media_rights) || {};
  for (const k of parsed.order) {
    const s = parsed.sections[k], Y = (s.yaml.find((b) => b.data && b.data.MediaAsset) || { data: {} }).data.MediaAsset;
    const m = Y ? [null, Y.media_id] : /^`?(JBC-MEDIA-[A-Z0-9-]+)`?/.exec(s.heading); if (!m || !m[1]) continue;
    if (Y) s.fields = { Source: (Y.source || "").replace(/_/g, " ") + ", `" + Y.file_title + "`", Creator: Y.creator, License: Y.license, "Display role": [].concat(Y.display_role || []).join(" / "), "Rights status": Y.rights_status, "Source URL": Y.source_page };
    const id = m[1], file = (/`(File:[^`]+)`/.exec(s.fields.Source || "") || [])[1], creator = unt(s.fields.Creator), license = unt(s.fields.License), title = (file || "").replace(/^File:/, "");
    const declared = structuredRights[id] && typeof structuredRights[id] === "object" ? structuredRights[id] : null;
    const verbatim = Y ? (Y.attribution || null) : s.quotes.find((q) => q.trim()), role = unt(s.fields["Display role"]), rightsNote = unt(declared && declared.rights_status) || unt(s.fields["Rights status"]) || null;
    const noteTarget = unt(s.fields["Target ref"]) || null, ovl = bindings[id] || {};
    const target = noteTarget || ovl.target_ref || null;
    const lic = LICENSES[license] || null, srcUrl = unt(s.fields["Source URL"]) || ovl.source_url || null, srcVerified = checkSourceUrl(srcUrl, file);
    const asset = { id, provider: unt((s.fields.Source || "").split(",")[0]), file, creator, license, role, reader_caption: (overlay.media_captions || {})[id] || (Y && Y.recommended_reader_caption_ko) || null, attribution: verbatim ? verbatim.trim() : creator + ", “" + title + ",” Wikimedia Commons, " + license + ".", ...(verbatim ? {} : { attribution_composed: true }), rights_note: rightsNote,
      ...(declared ? { declared_rights: { status: unt(declared.rights_status) || null, license: unt(declared.license) || null, obligations: [].concat(declared.license_obligations || []), discrepancy_note: unt(declared.license_discrepancy_note) || null } } : {}),
      ...(license.indexOf("_") >= 0 ? { license_label: license.replace(/_/g, " ") } : {}),
      target_ref: target ? { ref: target, kind: ovl.subject || null, binding: noteTarget ? "note" : "overlay_explicit" } : null,
      representative: false,
      source_url: srcUrl, source_url_verified: !!srcUrl && srcVerified,
      ...(Y ? { depicts: Y.depicts || null, identity_certainty: Y.identity_certainty || null } : {}),
      preview_url: null, display_mode: "attribution_only",
      rights: lic ? { validated: true, status: lic.by ? "REUSE_WITH_ATTRIBUTION" : "REUSE_NO_ATTRIBUTION_REQUIRED", license_code: lic.code, attribution_required: lic.by, share_alike: lic.sa, derivatives_note: lic.sa ? "ShareAlike" : null, display_clearance: false } : { validated: false, status: "UNNORMALIZED", license_code: null, attribution_required: null, share_alike: null, display_clearance: false } };
    rec.media.push(asset);
  }
  // representative resolution: exactly one asset whose role states "representative" AND whose bound target is a non-modern candidate/place
  const modernIds = new Set((rec.candidates || []).filter((c) => /MODERN_CITY/.test(c.status || "")).map((c) => c.id));
  const reps = rec.media.filter((a) => /representative/.test(a.role) && a.target_ref && !modernIds.has(a.target_ref.ref));
  rec.representative_media_id = reps.length === 1 ? reps[0].id : null;
  rec.media.forEach((a) => { a.representative = a.id === rec.representative_media_id; a.content_hash = mediaHash(a); });
  prov.media = "Wikimedia Media Refs";
  if (mediaRightsBlock) prov.media_rights = "structured_media_rights (yaml @line " + mediaRightsBlock.line + ")";

  // --- Connected (structured yaml only): people / events / places / routes exactly as written. No identity resolution, no geometry.
  const peopleY = findYaml(parsed, (d) => Array.isArray(d.related_people)), eventsY = findYaml(parsed, (d) => Array.isArray(d.events) && !d.map_ready), placesY = findYaml(parsed, (d) => d.related_places || (d.primary && d.related_places));
  const asList = (v) => (v && v._items ? v._items : Array.isArray(v) ? v : []);
  const conn = {
    people: peopleY ? peopleY.data.related_people.map((x) => (x && typeof x === "object" ? { label: unt(x.label || x.name), global_person_id: x.global_person_id || x.stable_id || null, relation: x.relation || null, evidence: x.evidence || null, certainty: x.certainty || null, passage: x.passage || null, merge_with_other: x.merge_with_other_Abimelech === "NOT_AUTHORIZED" ? "not_authorized" : null } : { label: unt(x), global_person_id: null })) : [],
    events: eventsY ? eventsY.data.events.map((x) => ({ global_event_id: x.global_event_id || null, event_id: x.event_id || null, scope: x.scope || null, label: unt(x.label || x.event), event: unt(x.event || x.label), relation: x.relation || null, evidence: x.evidence || null, passage: x.passage || null, certainty: x.certainty || null })) : (MR ? asList(MR.events).map((x) => ({ label: unt(x), event: unt(x), global_event_id: null })) : []),
    places: placesY ? asList(placesY.data.related_places).map((x) => ({ stable_id: x.stable_id || x.ref || x.known_parent_asset_identity || null, name: unt(x.name || x.label), relation: x.relation || null, evidence: x.evidence || null, certainty: x.certainty || null, known_parent_asset_identity: x.known_parent_asset_identity || x.stable_id || x.ref || null })) : [],
    routes: MR && MR.routes ? asList(MR.routes).map((x) => (x && typeof x === "object" ? { label: unt(x.route_label), basis: x.basis || null, geometry: x.geometry || "NOT_ASSIGNED" } : { label: unt(x), geometry: MR.routes.geometry || "NOT_ASSIGNED" })) : []
  };
  if (Object.values(conn).some((v) => v.length)) rec.connected = conn;

  // --- <spatial-binding> Spatial read model (generic, record-agnostic). It restates what the note says about WHERE, kept apart by kind
  // (Place / Region / Route / candidate Sites) and by certainty dimension. It computes no coordinate, no boundary and no geometry; the
  // marker eligibility below is the same rule the app re-checks before drawing anything.
  const pp = MR && MR.primary_place, regionSrc = (MR && MR.region) || {};
  const primaryVerified = !!rec.coordinates && /^VERIFIED/.test(rec.coordinate_status || "") && /^VERIFIED/.test(rec.coordinate_certainty || "");
  rec.spatial = {
    schema: "JBC_SPATIAL_READ_MODEL_v0.1",
    subject: { stable_id: sid, kind: "Place", place_type: rec.place_type.primary || null },
    primary: { ref: (pp && pp.ref) || sid, coordinates: rec.coordinates, coordinate_status: rec.coordinate_status, exact_marker: pp ? pp.exact_marker === true : false, render_mode: (pp && pp.render_mode) || null,
      marker: rec.coordinates ? (primaryVerified ? { render: true, reason: "verified_primary_coordinate" } : { render: false, reason: "primary_coordinate_not_verified" }) : { render: false, reason: "no_exact_coordinate" } },
    certainty: { identity: rec.certainty, coordinate: rec.coordinate_certainty, reader_location_status: rec.location.reader_status },
    sites: rec.candidates.map((c) => ({ ref: c.id, label: c.label, reader_label: c.reader_label || null, role: c.role, candidate_role: c.candidate_role || null, lat: c.lat, lon: c.lon, coordinate_status: c.status, identification_certainty: c.identification_certainty || null, equivalence_locked: c.equivalence_locked, marker: siteMarker(c) })),
    region: { label: rec.region.canonical || null, stable_ref: rec.region.stable_ref || null, boundary: null, geometry_status: regionSrc.geometry || (regionSrc.ref ? "NOT_STATED" : null) },
    routes: ((rec.connected && rec.connected.routes) || []).map((r) => ({ label: r.label, basis: r.basis || null, geometry: null, geometry_status: r.geometry || "NOT_ASSIGNED" })),
    verify_hold: { verify: rec.verify.map((v) => v.id), hold: rec.hold.length },
    policy: "coordinates only as supplied by the note; no boundary or route geometry is produced; a primary point needs a verified coordinate; candidate sites are drawn only with a recognized status"
  };
  rec.spatial.degradation = { markers: rec.spatial.sites.filter((x) => x.marker.render).length + (rec.spatial.primary.marker.render ? 1 : 0), reason: null };
  if (!rec.spatial.degradation.markers) rec.spatial.degradation.reason = rec.coordinates || rec.candidates.some((c) => c.lat !== null) ? "coordinates_present_but_status_not_drawable" : "no_coordinates_supplied";
  // </spatial-binding>

  // --- Navigation metadata (lock §9): only when the note states it. Never invented.
  rec.navigation = navBlock ? { domain: navBlock.data.domain || null, period: navBlock.data.period || null, story: navBlock.data.story || null, scene: navBlock.data.scene || null, passage_refs: (navBlock.data.passage_refs || []).map(parseRef).filter(Boolean), places: navBlock.data.places || [], people: navBlock.data.people || [], events: navBlock.data.events || [] } : null;
  if (!navBlock) warn.push("note has no navigation metadata (domain / period / story / scene); none was generated");

  return { record: rec, provenance: prov, warnings: warn, skipped, overlayFields: ["legacy_key", "reader_type", "hero_caption", "reader.glance", "location.lead", "location.sentences", "candidates[].label", "candidates[].reader_label", "media[].reader_caption", "media[].target_ref", "representative_media_id", "hero_subject", "reader.glance(fallback)", "candidate labels", "reader.quick_facts(hide rows)"] };
}

module.exports = { normalize, siteMarker, LICENSES, mediaHash, checkSourceUrl, parseRef, BOOKS, sentences };
