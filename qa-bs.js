// 브엘세바 승인 연구 투영 E2E 검증. 실행: index.html?qa=bs (개발 모드 전용).
// 기준: docs/architecture/BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1.md + Connected Research Lock. 결과 = BEERSHEBA_WEB_PROJECTION_E2E (전부 PASS 일 때만 PASS).
(function () {
  "use strict";
  if (!/[?&]qa=bs/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var SID = "JBC-CR-PLACE-BEERSHEBA-001", CANONICAL_SHA = "ff3bd3789f737b7eaac65cb6eab1fdf303d21bb57379c71d3f48b46599966d90", NORM = "tools/pipeline/out/records/JBC-CR-PLACE-BEERSHEBA-001/03-normalized.json";
  function mk(w, h) { var f = document.createElement("iframe"); f.style.cssText = "width:" + (w || 1400) + "px;height:" + (h || 800) + "px;border:0"; return f; }
  function ready(f, res) { f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 150); }; }
  function load(hash, w, h) { return new Promise(function (res) { var f = mk(w, h); ready(f, res); f.src = "index.html" + (hash || ""); host.appendChild(f); }); }
  // 투영 스크립트를 바꿔 끼운 변형(폴백 검증): srcdoc 은 부모와 같은 origin 이다.
  function loadVariant(replaceWith, hash) {
    return fetch("index.html").then(function (r) { return r.text(); }).then(function (t) {
      var html = t.replace('<script src="data/projection.research.js"></script>', replaceWith).replace("<head>", '<head><base href="' + location.origin + '/">');
      return new Promise(function (res) { var f = mk(1400, 800); ready(f, res); f.srcdoc = html; host.appendChild(f); });
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function q(x, sel) { return x.d.querySelector(sel); }
  function qa(x, sel) { return [].slice.call(x.d.querySelectorAll(sel)); }
  function click(x, sel) { var e = typeof sel === "string" ? q(x, sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function guideCur(x) { var c = q(x, '#guide-pane [aria-current="step"]'); return c ? c.dataset.guideStep : null; }
  var INTERNAL = /VERIFY|HOLD|stable_id|authority|source_locator|STAGE_APPROVED|DISPUTED|NO_EXACT|FIXTURE|Registry|projection|JBC-CR|CLM-BS/;

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("BS-01", "source_authority_preserved_and_values_traceable_to_the_approved_research_file", async function (ev) {
    var n = await (await fetch(NORM)).json(), x = await load("#gen-22:19"), R = x.B.projection.places[SID], P = x.B.data.places.beersheba, N = n.record;
    ev.push("canonical sha256=" + R.source_refs[0].sha256 + " provenance=" + R.source_refs[0].path); ok(R.source_refs[0].sha256 === CANONICAL_SHA && N.source_refs[0].sha256 === CANONICAL_SHA && /^G:\//.test(R.source_refs[0].path), "projection and normalized artifact must trace to the bound G: canonical record");
    ok(J(R.claims) === J(N.claims) && J(R.verify) === J(N.verify) && J(R.hold) === J(N.hold) && R.certainty === N.certainty && R.coordinate_certainty === N.coordinate_certainty, "claims, certainty and VERIFY/HOLD must equal the canonical normalized record");
    ok(P.status === "STAGE_APPROVED_WITH_VERIFY" && P.authority.project === "01_목회연구_WORBS_BICS" && P.stable_id === SID && R.source_refs[0].id === "JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01", "status/authority must not be upgraded or altered");
    ok(R.coordinates === null && R.coordinate_status === "NO_EXACT_POINT_ASSIGNED" && R.VERIFY_HOLD.verify === true && R.VERIFY_HOLD.hold === true, "VERIFY/HOLD and the no-exact-coordinate rule preserved"); clean(x);
  });

  t("BS-02", "stable_id_preserved_via_explicit_alias_only_one_record_replaced", async function (ev) {
    var x = await load("#gen-22"), B = x.B, P = B.data.places, ids = Object.keys(P);
    ev.push("place keys=" + J(ids) + " beersheba.id=" + P.beersheba.id + " legacy_key=" + P.beersheba.legacy_key + " resolveKey(stable)=" + B.resolveKey(SID));
    ok(ids.join() === "moriah,beersheba,haran,gerar" && P.gerar.stable_id === "JBC-CR-PLACE-GERAR-001" && P.gerar.research && B.resolveKey("JBC-CR-PLACE-GERAR-001") === "gerar" && P.beersheba.id === SID && P.beersheba.legacy_key === "beersheba" && B.resolveKey(SID) === "beersheba" && B.stableId("l", "beersheba") === SID, "explicit alias mapping beersheba → stable_id");
    ok(ids.filter(function (k) { return P[k].stable_id === SID; }).length === 1 && !P.moriah.research && !P.haran.research, "no duplicate place / no same-name merge / other fixture records untouched");
    ok(P.moriah.id === "moriah" && P.moriah.x === 58 && P.moriah.y === 38 && P.haran.id === "haran" && P.haran.x === 70 && P.moriah.status === "FIXTURE_SAMPLE", "other fixture entities preserved as-is");
    ok(B.stableId("l", "moriah") === "moriah" && !B.data.photos["ph-beersheba"], "fixture-only entities keep their ids; the Beersheba placeholder photo is gone"); clean(x);
  });

  t("BS-03", "no_fabricated_metadata_no_coordinates_no_person_event_ids", async function (ev) {
    var x = await load("#gen-22:19"), P = x.B.data.places.beersheba;
    ev.push("x/y present=" + ("x" in P) + "/" + ("y" in P) + " location_state=" + P.location_state); ok(!("x" in P) && !("y" in P) && P.location_state === "unlocated", "no coordinate on the biblical place");
    click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); var d = q(x, "#panel .detail");
    ok(d && !d.querySelector("[data-rel]") && !d.querySelector('[data-part="people"]') && !d.querySelector('[data-part="places"]') && !d.querySelector("[data-obj]"), "Person/Event/Place links without research IDs are hidden (no name-based linking)");
    ok(!/중요한 인물/.test(d.textContent) && !/아비멜렉|이삭/.test(d.querySelector('[data-part="facts"]').textContent), "quick facts must not carry the Person row");
    var circles = qa(x, "#map-body svg.smap circle.dot").length, pins = qa(x, "#map-body svg.smap .pin").length; ev.push("dots=" + circles + " pins=" + pins); ok(circles === pins && pins === 1, "only Moriah (fixture) has a point; nothing for Beersheba/Tel/modern city"); clean(x);
  });

  t("BS-04", "same_stable_id_across_Scripture_Detail_Guide_Map", async function (ev) {
    var x = await load("#gen-22:19"), B = x.B, tag = q(x, '.tag.l[data-id="beersheba"]'); ok(tag, "Beersheba tag in Genesis 22:19"); var tagSid = tag.dataset.stableId;
    click(x, tag); await sleep(80); var det = q(x, "#panel .detail"), gobj = null;
    var surfaces = { scripture: tagSid, detail: det.dataset.stableId, state: B.stableId(B.state.entity.kind, B.state.entity.id), guide_step: guideCur(x), map_note: q(x, ".map-note").dataset.stableId, url: x.w.location.hash };
    ev.push("surfaces=" + J(surfaces)); ok(tagSid === SID && surfaces.detail === SID && surfaces.state === SID && surfaces.map_note === SID && /e=l\.beersheba/.test(surfaces.url), "one stable_id on Scripture/Detail/Map");
    ok(surfaces.guide_step === "1", "Guide consumes the same identity (step 2 = Beersheba return)");
    click(x, "#guide-prev"); await sleep(50); click(x, "#guide-next"); await sleep(60); ok(B.state.entity.id === "beersheba" && q(x, "#panel .detail").dataset.stableId === SID, "Guide step selects the same entity id");
    var y = await load("#gen-22:19&e=l." + SID + "&panel=open"); ok(y.B.state.entity && y.B.state.entity.id === "beersheba" && q(y, "#panel .detail").dataset.stableId === SID, "a URL carrying the stable_id resolves to the same entity"); ev.push("deep link by stable_id → " + y.w.location.hash); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(y); clean(x);
  });

  t("BS-05", "map_no_pin_no_route_natural_language_note_no_projection_of_candidates", async function (ev) {
    var x = await load("#gen-22:19"); x.B.setPanel("open"); await sleep(60); var m = q(x, "#map-body"), note = m.querySelector(".map-note");
    ev.push("note=" + (note && note.textContent)); ok(note && /정확한 위치에 대해서는 여러 견해가 있어 지도에 점으로 표시하지 않습니다/.test(note.textContent) && !INTERNAL.test(note.textContent), "natural-language controlled degradation");
    ok(!m.querySelector('.pin[data-id="beersheba"]') && !m.querySelector("svg.smap polyline, svg.smap .map-route"), "no Beersheba pin and no route line");
    ok(!m.querySelector(".degraded"), "an intentionally unlocated place is not reported as a coordinate error");
    var svgSrc = m.innerHTML; ok(svgSrc.indexOf("31.245") < 0 && svgSrc.indexOf("34.84") < 0 && svgSrc.indexOf("Tel") < 0, "Tel Be'er Sheva / modern city are not drawn (no lat/lon → x/y invention)"); clean(x);
  });

  t("BS-06", "guide_departure_removed_return_step_from_Genesis_22_19_no_route", async function (ev) {
    var x = await load("#gen-22:2"), G = x.B.guide, st = x.B.guideSteps(); ev.push("steps=" + J(st.map(function (s) { return s.sequence + ":" + s.title + "@" + s.passage_ref; })));
    ok(st.length === 2 && /모리아/.test(st[0].title) && st[1].title === "모리아 사건 후 브엘세바로 돌아옴" && st[1].passage_ref === "gen-22:19", "return step follows the Moriah step, text per Gate");
    ok(JSON.stringify(G).indexOf("출발") < 0 && q(x, "#guide-pane").textContent.indexOf("출발") < 0, "no departure claim anywhere"); ok(st.every(function (s) { return s.route_id === null; }) && Object.keys(G.routes).length === 0 && !q(x, "#layer-route") && !q(x, "#guide-pane [data-part=legend]"), "route line and route controls removed");
    click(x, "#guide-next"); click(x, "#guide-next"); await sleep(60); ok(!q(x, '[data-obj^="p."]'), "return step lists no people (no research Person IDs)"); ok(st[1].basis && st[1].basis.claim === "CLM-BS-03" && st[1].basis.locator === "Genesis 22:19", "step basis traceable to CLM-BS-03"); clean(x);
  });

  t("BS-07", "detail_reader_layer_natural_language_research_layer_folded_verify_hold_kept", async function (ev) {
    var x = await load("#gen-22:19"); click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); var d = q(x, "#panel .detail"), res = d.querySelector("details.research");
    var parts = qa(x, "#panel .detail [data-part]").map(function (e) { return e.dataset.part; }).join(); ev.push("parts=" + parts); ok(parts === "identity,media,hook,facts,summary,scripture,location,credits,research", "flow order: " + parts);
    var clone = d.cloneNode(true); clone.querySelector("details.research").remove(); var reader = clone.textContent; ok(!INTERNAL.test(reader), "reader layer exposes no internal terms: " + (reader.match(INTERNAL) || [])[0]);
    ok(/여러 후보지/.test(d.querySelector('[data-part="identity"]').textContent) && /בְּאֵר שֶׁבַע/.test(d.textContent) && /Beer-sheba/.test(d.textContent), "natural status label + names (names live in the research layer)");
    ok(res && !res.open, "research detail collapsed by default"); var rt = res.textContent; ok(["CLM-BS-01", "CLM-BS-10", "VERIFY-BS-01", "VERIFY-BS-04", "Fritz", "Genesis 22:19", "31.245", "STAGE_APPROVED_WITH_VERIFY", "BAT01_PLACE or BAT01_P crosswalk"].every(function (k) { return rt.indexOf(k) >= 0; }), "claims/evidence locators, competing view, candidates, VERIFY/HOLD preserved in the research layer");
    ok(/성경의 브엘세바와 동일시하지 않음/.test(rt), "candidate coordinates carry the not-equivalent note"); clean(x);
  });

  t("BS-08", "related_passages_from_PassageLink_open_scripture_without_duplicating_identity", async function (ev) {
    var x = await load("#gen-22:19"); click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); var rows = qa(x, '#panel .detail [data-part="scripture"] [data-open-ref]'), refs = rows.map(function (r) { return r.dataset.openRef; });
    ev.push("rows=" + J(refs)); ok(refs.join() === "gen-21:14,gen-21:31,gen-22:19,gen-26:23,gen-28:10,gen-46:1,gen-20:,gen-26:1", "PassageLink set from the research (direct + related)");
    var h0 = x.w.history.length; click(x, rows[1]); await sleep(120); ev.push("open gen-21:31 → " + x.w.location.hash);
    ok(x.B.state.passage === "gen-21" && x.B.state.verse === null && JSON.stringify(x.B.ui.refTarget) === JSON.stringify({ passage: "gen-21", verse: 31 }) && x.B.state.entity.id === "beersheba" && x.w.history.length === h0 + 1 && qa(x, "#panel .detail").length === 1 && q(x, "#panel .detail").dataset.stableId === SID, "Scripture moves, entity identity is not duplicated, history entry added");
    var ch = q(x, '#panel .detail [data-open-ref="gen-20:"]'); click(x, ch); await sleep(100); ok(x.B.state.passage === "gen-20" && x.B.state.verse === null && x.B.state.entity.id === "beersheba", "chapter-level link opens the chapter");
    x.w.history.back(); await sleep(200); ok(x.B.state.passage === "gen-21", "browser back restores the previous passage"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("BS-09", "verified_representative_image_and_lightbox_progressive_source_disclosure", async function (ev) {
    var x = await load("#gen-22:19"); click(x, '.tag.l[data-id="beersheba"]'); await sleep(180); var R = x.B.projection.places[SID], hero = q(x, '#panel [data-part="media"]'), im = hero.querySelector("img.hero-img");
    ok(hero.dataset.mediaMode === "image" && im && im.getAttribute("src") === R.media[0].preview_url && /^https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\//.test(im.src), "representative image uses the resolver-derived Commons preview");
    ok(!hero.querySelector(".hero-src") && !qa(x, "#panel .media-ref").length, "inline Detail shows only the image and short caption, without repeated attribution blocks");
    click(x, ".hero-open"); await sleep(60); var box = q(x, "#media-lightbox"), link = q(x, "#media-lightbox a.src-link"); ok(!box.hidden && q(x, ".media-lightbox-img") && /Sasha1506/.test(box.textContent) && /CC BY-SA 4.0/.test(box.textContent), "image click opens large view with creator and exact license");
    ok(link && link.getAttribute("href") === R.media[0].source_url && link.target === "_blank" && link.rel === "noopener noreferrer", "lightbox exposes only the verified source link"); click(x, "[data-media-lightbox-close]"); ok(box.hidden, "lightbox closes"); clean(x);
  });

  t("BS-10", "projection_failure_falls_back_safely_to_the_fixture_stub", async function (ev) {
    for (var v of [{ n: "projection missing", s: "" }, { n: "invalid stable_id", s: '<script>window.BVC_PROJECTION={places:{"WRONG":{stable_id:"OTHER",legacy_key:"beersheba",type:"place",display_label:"x",status:"s",authority:{},source_refs:[1],reader:{},location:{}}}};</script>' }, { n: "coordinates present (not allowed this round)", s: '<script>window.BVC_PROJECTION={places:{"JBC-CR-PLACE-BEERSHEBA-001":{stable_id:"JBC-CR-PLACE-BEERSHEBA-001",legacy_key:"beersheba",type:"place",display_label:"x",status:"s",authority:{},source_refs:[1],reader:{},location:{},coordinates:{lat:1,lon:1}}}};</script>' }]) {
      var x = await loadVariant(v.s), P = x.B.data.places.beersheba; ev.push(v.n + " → research=" + !!P.research + " status=" + P.status + " x=" + P.x);
      ok(!P.research && P.status === "FIXTURE_SAMPLE" && P.x === undefined && !q(x, '#map-body .pin[data-id="beersheba"]') && x.B.resolveKey(SID) === SID, v.n + ": must keep the stub (no pin, no upgrade)");
      click(x, '.tag.l[data-id="beersheba"]'); await sleep(60); ok(x.B.state.entity && x.B.state.entity.id === "beersheba" && q(x, "#panel .detail") && x.w.__errs.length === 0, v.n + ": Detail still opens without errors"); clean(x);
    }
  });

  t("BS-11", "no_ui_regression_locked_structure_intact", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); click(x, '.tag.l[data-id="beersheba"]'); await sleep(80);
    ok(qa(x, "#rail [data-perspective]").map(function (b) { return b.textContent.trim(); }).join() === "본문연구,지도,연표" && !q(x, "[role=tab], #tabs"), "rail and tab-free Detail unchanged");
    ok(x.w.getComputedStyle(q(x, "#side-pane")).position === "absolute" && q(x, "#map-pane #side-pane") && x.B.state.panel === "open", "Detail is still a map overlay opened by explicit selection");
    var m = q(x, "#map-pane").getBoundingClientRect(), t = q(x, "#text-pane").getBoundingClientRect(); x.B.setPanel("collapsed"); await sleep(80); var m2 = q(x, "#map-pane").getBoundingClientRect(), t2 = q(x, "#text-pane").getBoundingClientRect(); ok(Math.abs(m.width - m2.width) <= 1 && Math.abs(t.left - t2.left) <= 1, "Detail open/close does not move map or scripture");
    click(x, "#guide-prev"); await sleep(40); click(x, "#guide-next"); await sleep(60); ok(x.B.state.panel === "collapsed", "guide does not reopen a user-closed Detail"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("BS-12", "detail_information_hierarchy_order_headings_and_above_the_fold_media", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); click(x, '.tag.l[data-id="beersheba"]'); await sleep(120); var sp = q(x, "#side-pane").getBoundingClientRect(), top = function (sel) { var e = q(x, "#panel " + sel); ok(e, "missing " + sel); return e.getBoundingClientRect().top; };
    var order = ["identity", "media", "hook", "facts", "summary", "scripture", "location", "credits", "research"].map(function (k) { return top('[data-part="' + k + '"]'); }); ev.push("tops=" + J(order.map(Math.round))); ok(order.every(function (v, i) { return i === 0 || v > order[i - 1]; }), "vertical order: identity → media → hook → facts → summary → scripture → location → secondary");
    var id = q(x, '#panel [data-part="identity"]'); ev.push("identity=" + id.textContent); ok(id.querySelector("h3").textContent === "브엘세바" && id.querySelector(".d-en").textContent === "Beersheba" && id.querySelector(".d-kind").textContent === "성읍·도시 · 여러 후보지", "identity block per the hierarchy (ko / en / type · natural status)");
    var media = q(x, '#panel [data-part="media"]').getBoundingClientRect(); ev.push("hero rect top=" + Math.round(media.top) + " bottom=" + Math.round(media.bottom) + " | side-pane bottom=" + Math.round(sp.bottom)); ok(media.top >= sp.top && media.bottom <= sp.bottom, "representative media (or its fallback) is visible without scrolling");
    ok(q(x, '#panel [data-part="media"] .hero-cap').textContent === "브엘세바의 유력한 고고학 후보지", "representative caption per handoff");
    ok(q(x, '#panel [data-part="hook"]').textContent === "우물과 맹세, 약속의 기억이 겹쳐지는 장소" && !q(x, '#panel [data-part="hook"]').closest(".media-ref, details"), "reader hook is plain text, not a card");
    var heads = qa(x, "#panel .d-flat .d-sec > .d-h").map(function (h) { return h.textContent; }); ev.push("headings=" + J(heads)); ok(heads.join("|") === "한눈에 보기|이 장소는 왜 중요한가|관련 본문|위치는 어디인가", "section headings");
    var rows = qa(x, '#panel [data-part="facts"] .qf').map(function (r) { return r.querySelector("dt").textContent + "=" + r.querySelector("dd").textContent; }); ev.push("facts=" + J(rows)); ok(rows.join("|") === "이름의 뜻=맹세의 우물 / 일곱의 우물|지역=네게브 북부|대표 본문=창 21 · 22 · 26|핵심 주제=우물 · 언약 · 예배", "quick facts rows");
    var pills = qa(x, '#panel [data-part="scripture"] .pill'); ok(pills.length === 8 && pills.every(function (b) { return b.dataset.openRef; }) && !q(x, '#panel [data-part="scripture"] .vrow'), "related passages are light pills (no large rows/cards)");
    var loc = q(x, '#panel [data-part="location"]').textContent; ok(/정확한 위치는 확정되지 않았습니다/.test(loc) && /텔 브엘세바가 중요한 고고학 후보/.test(loc) && /현대 브엘세바와 텔 브엘세바를 구별/.test(loc) && !INTERNAL.test(loc), "natural uncertainty explanation");
    ok(!q(x, "#panel .d-flat details[open]") && q(x, "#panel details.research"), "research detail collapsed, no tabs"); ok(x.w.__errs.length === 0, "no console errors"); clean(x);
  });

  t("BS-13", "flat_editorial_surface_no_nested_cards_and_typographic_hierarchy", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); click(x, '.tag.l[data-id="beersheba"]'); await sleep(120); var d = q(x, "#panel .detail"), cs = function (e) { return x.w.getComputedStyle(e); }, bw = function (c) { return parseFloat(c.borderTopWidth) + parseFloat(c.borderLeftWidth) + parseFloat(c.borderBottomWidth) + parseFloat(c.borderRightWidth); };
    var dc = cs(d); ok(bw(dc) === 0 && dc.boxShadow === "none" && (dc.backgroundColor === "rgba(0, 0, 0, 0)" || dc.backgroundColor === "transparent") && parseFloat(dc.borderTopLeftRadius) === 0, "the Detail body itself is not a card");
    var boxed = qa(x, "#panel .detail *").filter(function (e) { if (e.closest(".pill, .d-back, summary") || e.classList.contains("d-rule")) return false; var c = cs(e); return bw(c) > 0 || (c.backgroundColor !== "rgba(0, 0, 0, 0)" && c.backgroundColor !== "transparent") || c.boxShadow !== "none"; });
    ev.push("boxed descendants=" + J(boxed.map(function (e) { return e.tagName + "." + e.className; }))); ok(!boxed.length, "no section cards, no repeated borders/backgrounds");
    ok(qa(x, "#panel .detail .d-rule").length === 1 && !q(x, "#panel .detail hr"), "a single subtle divider before the secondary information");
    var fs = function (sel) { return parseFloat(cs(q(x, "#panel " + sel)).fontSize); }, sizes = [fs(".detail-name"), fs(".d-hook"), fs(".d-h"), fs(".d-body"), fs(".qf dt"), fs(".d-credits > .prov")]; ev.push("font sizes name>hook>heading>body>label>credit=" + J(sizes));
    ok(sizes[0] > sizes[1] && sizes[1] > sizes[2] && sizes[2] > sizes[3] && sizes[3] > sizes[4] && sizes[4] > sizes[5], "relative hierarchy: name > hook > heading > body > fact label > credit");
    var g1 = parseFloat(cs(q(x, "#panel .d-sec")).marginBottom), g2 = 6; ev.push("section gap=" + g1 + " in-section gap=" + g2); ok(g1 >= 24 && g1 > g2 * 3, "tight inside sections, generous between them"); clean(x);
  });

  t("BS-14", "representative_media_gate_image_only_when_all_conditions_hold", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900), G = x.B.mediaGate, good = { preview_url: "https://upload.wikimedia.org/wikipedia/commons/x/x/a.jpg", creator: "c", license: "CC BY-SA 4.0", file: "File:a.jpg", rights: { validated: true, status: "CLEARED" } };
    var cases = { real_projection_media: x.B.projection.places[SID].media[0], all_conditions: good, no_preview: Object.assign({}, good, { preview_url: null }), foreign_host: Object.assign({}, good, { preview_url: "https://example.com/a.jpg" }), no_creator: Object.assign({}, good, { creator: "" }), no_license: Object.assign({}, good, { license: "" }), no_source_page: Object.assign({}, good, { file: "" }), rights_not_validated: Object.assign({}, good, { rights: { validated: false, status: "CLEARED" } }), rights_hold: Object.assign({}, good, { rights: { validated: true, status: "HOLD" } }), no_rights: Object.assign({}, good, { rights: null }) };
    var got = {}; Object.keys(cases).forEach(function (k) { got[k] = G(cases[k]); }); ev.push("gate=" + J(got)); ok(got.real_projection_media === "image" && got.all_conditions === "image" && Object.keys(got).filter(function (k) { return k !== "real_projection_media" && k !== "all_conditions"; }).every(function (k) { return got[k] === "attribution_only"; }), "image only when preview URL + creator/license/source page + validated CLEARED rights are all present");
    click(x, '.tag.l[data-id="beersheba"]'); await sleep(160); var hero = q(x, '#panel [data-part="media"]'); ok(hero.dataset.mediaMode === "image" && hero.querySelector("img.hero-img"), "current canonical data passes the unchanged gate"); clean(x);
  });

  t("BS-15", "responsive_narrow_desktop_and_mobile_no_overflow_hierarchy_kept", async function (ev) {
    var n = await load("#gen-22:19", 1000, 720); click(n, '.tag.l[data-id="beersheba"]'); await sleep(140); var p = q(n, "#panel");
    ev.push("narrow desktop: panel scrollWidth=" + p.scrollWidth + " clientWidth=" + p.clientWidth + " doc=" + n.d.documentElement.scrollWidth + "/1000");
    ok(p.scrollWidth <= p.clientWidth + 1 && n.d.documentElement.scrollWidth <= 1001, "narrow desktop: no horizontal overflow"); ok(["identity", "media", "hook", "facts", "summary", "scripture", "location", "credits", "research"].every(function (k) { return q(n, '#panel [data-part="' + k + '"]'); }), "narrow desktop: hierarchy preserved"); ok(n.w.__errs.length === 0); clean(n);
    var m = await load("#gen-22:19&e=l.beersheba&panel=open", 375, 700); await sleep(80); var mp = q(m, "#panel"), sp = q(m, "#side-pane"), cs = m.w.getComputedStyle(sp);
    ev.push("mobile: sheet position=" + cs.position + " panel scrollWidth=" + mp.scrollWidth + "/" + mp.clientWidth + " doc=" + m.d.documentElement.scrollWidth); ok(cs.position === "fixed" && mp.scrollWidth <= mp.clientWidth + 1 && m.d.documentElement.scrollWidth <= 376, "mobile: single column, no overflow");
    var tops = ["identity", "media", "hook", "facts"].map(function (k) { return q(m, '#panel [data-part="' + k + '"]').getBoundingClientRect().top; }); ok(tops.every(function (v, i) { return i === 0 || v > tops[i - 1]; }), "mobile: representative media (fallback) directly after identity"); ok(!q(m, "#panel details.research").open, "mobile: research collapsed"); ok(m.w.__errs.length === 0); clean(m);
  });

  t("BS-16", "reader_layer_sections_do_not_duplicate_location_talk", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); click(x, '.tag.l[data-id="beersheba"]'); await sleep(120);
    var txt = function (k) { return q(x, '#panel [data-part="' + k + '"]').textContent; }, why = q(x, '#panel [data-part="summary"] .d-body').textContent, where = txt("location"), hook = txt("hook");
    ev.push("why=" + why); ev.push("where=" + where);
    ok(!/위치|고고학|후보|텔 브엘세바|현대 브엘세바|경쟁|견해|확정/.test(why), "왜 중요한가 contains only significance (no location / candidate / modern-city / dispute talk)");
    ok(/우물/.test(why) && /맹세/.test(why) && /언약/.test(why) && /예배/.test(why) && /하나님의 임재/.test(why) && /모리아 사건 뒤/.test(why) && /아브라함/.test(why) && /이삭/.test(why), "왜 중요한가 keeps the approved significance (Abraham/Isaac, wells, oath, covenant, worship, presence, return after Moriah)");
    ok(/확정되지 않았습니다/.test(where) && /텔 브엘세바가 중요한 고고학 후보/.test(where) && /현대 브엘세바와 텔 브엘세바를 구별/.test(where) && !/맹세|언약|예배|우물|하나님의 임재|아비멜렉/.test(where), "위치는 어디인가 contains only geography and its uncertainty (no significance summary)");
    var sents = function (t) { return t.split(/[.!?。]\s*/).map(function (v) { return v.trim(); }).filter(function (v) { return v.length > 8; }); };
    var all = sents(why).concat(sents(where), sents(hook), sents(txt("facts"))), dup = all.filter(function (v, i) { return all.indexOf(v) !== i; }); ev.push("duplicate sentences=" + J(dup)); ok(!dup.length, "no sentence appears twice across the reader sections");
    var full = q(x, "#panel .detail").cloneNode(true); full.querySelector("details.research").remove(); ok(full.textContent.split("정확한 고대 도시의 위치는 학계에서 완전히 확정된 것은 아니지만").length === 2, "the location sentence exists exactly once in the reader layer");
    var src = x.B.projection.places[SID]; ok(src.reader.concise_summary.indexOf(src.location.sentences[0]) >= 0, "approved research/projection text itself is unchanged (only re-placed at render)");
    ok(["identity", "media", "hook", "facts", "summary", "scripture", "location", "credits", "research"].join() === qa(x, "#panel .detail [data-part]").map(function (e) { return e.dataset.part; }).join(), "reader flow preserved"); ok(x.w.__errs.length === 0, "no console errors"); clean(x);
  });

  t("BS-17", "media_source_link_rule_verified_url_only_never_derived_from_filename", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900), H = x.B.mediaSourceHtml, base = { file: "File:20211001 100742 Tel Be'er Sheva.jpg" };
    var got = { title_only: H(base), unverified_url: H(Object.assign({}, base, { source_url: "https://commons.wikimedia.org/wiki/File:X.jpg" })), verified_url: H(Object.assign({}, base, { source_url: "https://commons.wikimedia.org/wiki/File:X.jpg", source_url_verified: true })), verified_foreign_host: H(Object.assign({}, base, { source_url: "https://example.com/File:X.jpg", source_url_verified: true })), verified_not_https: H(Object.assign({}, base, { source_url: "http://commons.wikimedia.org/wiki/File:X.jpg", source_url_verified: true })) };
    ev.push("cases=" + J(got)); ok(!/<a /.test(got.title_only) && !/<a /.test(got.unverified_url) && !/<a /.test(got.verified_foreign_host) && !/<a /.test(got.verified_not_https), "plain text unless a verified Commons URL exists");
    ok(/<a class="src-link" href="https:\/\/commons\.wikimedia\.org\/wiki\/File:X\.jpg" target="_blank" rel="noopener noreferrer">/.test(got.verified_url), "verified URL → clickable link (new tab, noopener)");
    click(x, '.tag.l[data-id="beersheba"]'); await sleep(100); var cur = x.B.projection.places[SID].media;
    var ovl = await (await fetch("data/projection.overlay.beersheba.json")).json();
    ok(cur.every(function (m) { return m.source_url_verified === true && m.source_url === ovl.media_bindings[m.id].source_url && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(m.source_url); }), "each Beersheba asset keeps its explicit, validator-verified source page (never derived from the file name)");
    ok(cur.every(function (m) { return m.source_url.replace(/%27/g, "'").replace(/_/g, " ").indexOf(m.file.replace("File:", "")) >= 0; }) && cur.every(function (m) { return m.preview_url === m.resolution.thumb_url && m.display_mode === "image" && m.rights.status === "CLEARED"; }), "pages match the research files and previews come only from verified resolver responses"); click(x, ".hero-open"); await sleep(40); ok(qa(x, "#media-lightbox a.src-link").length === 1, "verified source link is disclosed in the lightbox"); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length, verdict = p === res.length ? "PASS" : "FAIL"; window.BVC_BS_QA = { pass: p, total: res.length, verdict: verdict, results: res };
    var el = document.createElement("div"); el.id = "bs-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "BEERSHEBA_WEB_PROJECTION_E2E " + verdict + " " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " " + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
