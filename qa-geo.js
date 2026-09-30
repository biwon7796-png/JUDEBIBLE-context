// 지리 지도 기반 + 위치 상태 표식 검증. 실행: index.html?qa=geo (개발 모드 전용).
(function () {
  "use strict";
  if (!/[?&]qa=geo/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var SID = "JBC-CR-PLACE-BEERSHEBA-001";
  function mk(w, h) { var f = document.createElement("iframe"); f.style.cssText = "width:" + (w || 1400) + "px;height:" + (h || 800) + "px;border:0"; return f; }
  function ready(f, res) { f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 150); }; }
  function load(hash, w, h) { return new Promise(function (res) { var f = mk(w, h); ready(f, res); f.src = "index.html" + (hash || ""); host.appendChild(f); }); }
  function variant(edit) { return fetch("index.html").then(function (r) { return r.text(); }).then(function (t) { var html = edit(t.replace("<head>", '<head><base href="' + location.origin + '/">')); return new Promise(function (res) { var f = mk(1400, 800); ready(f, res); f.srcdoc = html; host.appendChild(f); }); }); }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function q(x, sel) { return x.d.querySelector(sel); }
  function qa(x, sel) { return [].slice.call(x.d.querySelectorAll(sel)); }
  function click(x, sel) { var e = typeof sel === "string" ? q(x, sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function snap(x) { var s = x.B.state; return J({ passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null, panel: s.panel, view: s.view }); }
  var near = function (a, b, e) { return Math.abs(a - b) <= (e || 1e-6); };
  var VB = function (x) { return q(x, "#map-body svg.gmap").getAttribute("viewBox").split(" ").map(Number); };

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("GEO-01", "web_mercator_projection_is_correct_invertible_and_has_no_sample_mapping", async function (ev) {
    var x = await load("#gen-22:19"), G = x.B.geo.GEO;
    var lat = 31.245, lon = 34.840556, p = G.project(lat, lon), refY = -(180 / Math.PI) * Math.asinh(Math.tan(lat * Math.PI / 180)); ev.push("project(31.245, 34.840556) → x=" + p.x + " y=" + p.y.toFixed(6));
    ok(near(p.x, lon) && near(p.y, refY, 1e-9), "x = longitude (deg), y = Mercator (deg) — matches the closed form");
    var back = G.unproject(p.x, p.y); ok(near(back.lat, lat, 1e-9) && near(back.lon, lon, 1e-9), "unproject(project(p)) round-trips");
    ok(near(G.project(0, 10).y, 0, 1e-12) && G.project(30, 0).y < G.project(20, 0).y && G.project(-10, 0).y > 0, "equator y=0, north is up (y decreases with latitude)");
    var hav = function (a, b, c, d) { var r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * 6371.0088 * Math.asin(Math.sqrt(h)); };
    var A = G.project(31.2518136, 34.7912979), B2 = { x: p.x, y: p.y }, latc = (31.2518136 + 31.245) / 2, dEast = (B2.x - A.x) * G.km(latc), dNorth = (A.y - B2.y) * 111.32 * Math.cos(latc * Math.PI / 180), dist = Math.hypot(dEast, dNorth), ref = hav(31.2518136, 34.7912979, 31.245, 34.840556); ev.push("Tel ↔ modern city: from projection " + dist.toFixed(2) + " km, great-circle " + ref.toFixed(2) + " km (research: about 4 km east)");
    ok(Math.abs(dist - ref) / ref < 0.01 && dEast > 4 && dEast < 5.2, "projected geometry keeps real distances and puts Tel Be'er Sheva ≈4–5 km east of the modern city, as the research states");
    var t12 = G.tile(lat, lon, 12); ev.push("OSM tile z12 = " + J(t12)); ok(t12.x === 2444 && t12.y === 1673 && G.tileUrl(t12) === "https://tile.openstreetmap.org/12/2444/1673.png", "tile math");
    ok(!("lat" in x.B.data.places.moriah) && !("lon" in x.B.data.places.moriah) && x.B.data.places.moriah.x === 58, "fixture places keep abstract x/y only — no lat/lon was invented for them"); clean(x);
  });

  t("GEO-02", "location_status_contract_labels_and_marker_semantics", async function (ev) {
    var x = await load("#gen-22:19"), g = x.B.geo, S = g.markerSpec, L = g.LOC_LABEL;
    ok(L.VERIFIED === "확인된 위치" && L.LIKELY === "유력한 위치" && L.PLAUSIBLE === "가능성 있는 위치" && L.VERIFY === "추정지" && L.DISPUTED === "여러 후보지" && L.UNKNOWN === "위치 미상" && L.HOLD === null, "reader labels (Reader Language lock); HOLD is never shown");
    var c = function (o) { return Object.assign({ lat: 31.2, lon: 34.8, role: "biblical_place", status: "VERIFIED" }, o); }, cases = {
      confirmed: S(c({})), likely: S(c({ status: "LIKELY" })), plausible: S(c({ status: "PLAUSIBLE" })), verify: S(c({ status: "VERIFY" })), disputed: S(c({ status: "DISPUTED" })), unknown: S(c({ status: "UNKNOWN" })), hold: S(c({ status: "HOLD" })),
      site: S(c({ role: "archaeological_candidate", status: "VERIFIED_ARCHAEOLOGICAL_SITE" })), site_unverified: S(c({ role: "archaeological_candidate", status: "VERIFY" })), modern: S(c({ role: "modern_context", status: "MODERN_CITY_REFERENCE" })), modern_bad: S(c({ role: "modern_context", status: "HOLD" })),
      no_coords: S({ role: "biblical_place", status: "VERIFIED" }), bad_lat: S(c({ lat: 200 })), bad_lon: S(c({ lon: -300 })), unknown_role: S(c({ role: "x" })) };
    var got = {}; Object.keys(cases).forEach(function (k) { got[k] = cases[k].render ? cases[k].style : "—(" + cases[k].reason + ")"; }); ev.push(J(got));
    ok(got.confirmed === "confirmed" && got.likely === "estimated" && got.plausible === "estimated" && got.verify === "estimated", "VERIFIED → solid; LIKELY / PLAUSIBLE / VERIFY → estimated (dashed) — never drawn as confirmed");
    ok(!cases.disputed.render && !cases.unknown.render && !cases.hold.render, "DISPUTED / UNKNOWN / HOLD get no marker");
    ok(got.site === "site" && !cases.site_unverified.render && got.modern === "modern" && !cases.modern_bad.render, "candidate sites and the modern city use their own styles, and only with the expected coordinate status");
    ok(!cases.no_coords.render && !cases.bad_lat.render && !cases.bad_lon.render && !cases.unknown_role.render, "no coordinates / invalid range / unknown role → nothing is drawn"); clean(x);
  });

  t("GEO-03", "beersheba_geographic_view_shows_candidate_and_modern_city_but_no_exact_marker", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800), btn = q(x, "#map-mode"); ok(!btn.hidden && /지리 지도/.test(btn.textContent), "geographic view is offered where research coordinates exist"); ok(x.B.geo.mode() === "sample" && q(x, "#map-body svg.smap"), "default remains the sample map");
    click(x, "#map-mode"); await sleep(80); var svg = q(x, "#map-body svg.gmap"); ok(svg && x.d.body.dataset.mapview === "geo" && !q(x, "#map-body svg.smap") && svg.dataset.projection === "web-mercator", "geographic Web-Mercator view is shown");
    var ms = qa(x, "#map-body .gm"); ev.push("markers=" + J(ms.map(function (m) { return m.dataset.marker + ":" + m.className.baseVal; })));
    ok(ms.length === 2 && ms.map(function (m) { return m.dataset.marker; }).sort().join() === "JBC-CR-PLACE-BEERSHEBA_MODERN-001,JBC-CR-SITE-TEL_BEER_SHEVA-001", "only the two research-approved coordinates are drawn");
    ok(!q(x, '#map-body .pin, #map-body [data-marker="' + SID + '"]') && !qa(x, "#map-body .gm").some(function (m) { return m.dataset.marker === SID; }), "no exact marker for the biblical place, no sample pins (Moriah/Haran are not on a geographic map)");
    var tel = q(x, '[data-marker="JBC-CR-SITE-TEL_BEER_SHEVA-001"]'), mod = q(x, '[data-marker="JBC-CR-PLACE-BEERSHEBA_MODERN-001"]'), G = x.B.geo.GEO, pt = G.project(31.245, 34.840556), pm = G.project(31.2518136, 34.7912979), tr = tel.getAttribute("transform").match(/translate\(([-\d.e]+) ([-\d.e]+)\)/), mr = mod.getAttribute("transform").match(/translate\(([-\d.e]+) ([-\d.e]+)\)/);
    ok(near(+tr[1], pt.x, 1e-9) && near(+tr[2], pt.y, 1e-9) && near(+mr[1], pm.x, 1e-9) && near(+mr[2], pm.y, 1e-9), "markers sit at the projected research coordinates");
    ok(+tr[1] > +mr[1] && +tr[2] > +mr[2], "Tel Be'er Sheva is east of and (slightly) south of the modern city, as in the research coordinates");
    ok(tel.classList.contains("gm-site") && !tel.classList.contains("active") && mod.classList.contains("gm-modern"), "style semantics: candidate site vs modern reference; nothing highlighted before a selection");
    click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); ok(q(x, '[data-marker="JBC-CR-SITE-TEL_BEER_SHEVA-001"]').classList.contains("active") && !q(x, '[data-marker="JBC-CR-PLACE-BEERSHEBA_MODERN-001"]').classList.contains("active") && x.d.body.dataset.mapview === "geo", "selecting the place highlights its candidate site (not the modern city) and keeps the geographic view");
    tel = q(x, '[data-marker="JBC-CR-SITE-TEL_BEER_SHEVA-001"]'); mod = q(x, '[data-marker="JBC-CR-PLACE-BEERSHEBA_MODERN-001"]');
    ok(tel.getAttribute("aria-label") === "유력한 고고학 후보지" && mod.getAttribute("aria-label") === "현대 브엘세바(참고)" && tel.dataset.stableId === SID, "reader labels; both markers stay tied to the one place identity");
    var lg = q(x, ".geo-legend").textContent; ok(/고고학 후보지/.test(lg) && /현대 도시\(참고\)/.test(lg) && /정확히 그곳이라는 뜻은 아닙니다/.test(lg) && !/VERIFY|HOLD|stable_id|authority|projection|FIXTURE/.test(lg), "legend states the candidates are not the biblical place, in natural Korean");
    ok(qa(x, ".gm-grid line").length >= 4 && /°E/.test(svg.textContent) && /°N/.test(svg.textContent) && q(x, ".gm-scale text"), "graticule with degree labels and a scale bar"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-04", "switching_map_views_preserves_research_context", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); x.d.querySelector('[data-verse="19"]').scrollIntoView({ block: "start" }); await sleep(150); click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); x.B.setPanel("collapsed"); await sleep(60);
    var st0 = snap(x), a0 = x.B.scrollAnchor(), cam0 = J(x.B.ui.cam), hash0 = x.w.location.hash, frac0 = x.B.ui.frac, m0 = q(x, "#map-pane").getBoundingClientRect().width;
    click(x, "#map-mode"); await sleep(80); ok(snap(x) === st0 && x.w.location.hash === hash0 && J(x.B.ui.cam) === cam0 && x.B.ui.frac === frac0 && Math.abs(q(x, "#map-pane").getBoundingClientRect().width - m0) <= 1, "switching to the geographic view changes only the presentation (passage, verse, entity, closed Detail, URL, sample camera, split)");
    var a1 = x.B.scrollAnchor(); ok(a0 && a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 3, "reading anchor kept"); click(x, "#map-mode"); await sleep(80); ok(x.d.body.dataset.mapview === "sample" && q(x, "#map-body svg.smap") && snap(x) === st0, "back to the sample map with the same selection");
    var g = await load("#gen-22:2"); click(g, "#guide-next"); await sleep(60); click(g, "#map-mode"); click(g, "#guide-next"); await sleep(60); ok(g.B.state.entity.id === "beersheba" && g.B.state.panel === "collapsed", "navigation steps still select entities without opening Detail while the geographic view is on"); ok(x.w.__errs.length === 0 && g.w.__errs.length === 0); clean(g); clean(x);
  });

  t("GEO-05", "geographic_pan_zoom_fit_and_grid_follow_the_camera", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); click(x, "#map-mode"); await sleep(80); var v0 = VB(x), lab0 = qa(x, ".gm-grid text").map(function (e) { return e.textContent; }).join();
    click(x, "#map-zoom-in"); await sleep(30); var v1 = VB(x); ok(v1[2] < v0[2] * 0.8 && near(v1[0] + v1[2] / 2, v0[0] + v0[2] / 2, 1e-9), "zoom in shrinks the visible geographic window around the same centre");
    var lab1 = qa(x, ".gm-grid text").map(function (e) { return e.textContent; }).join(); ev.push("grid labels " + lab0.slice(0, 40) + " → " + lab1.slice(0, 40)); ok(lab1 !== lab0, "graticule step / labels follow the zoom");
    var body = q(x, "#map-body"), sv = q(x, "svg.gmap"), pe = function (tp, cx, cy) { body.dispatchEvent(new x.w.PointerEvent(tp, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 5 })); };
    sv.dispatchEvent(new x.w.PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 200, clientY: 200, button: 0, pointerId: 5 })); pe("pointermove", 260, 230); var dragging = x.d.body.dataset.dragging; pe("pointerup", 260, 230); await sleep(30);
    var v2 = VB(x); ev.push("pan " + v1.map(function (n) { return +n.toFixed(4); }) + " → " + v2.map(function (n) { return +n.toFixed(4); })); ok(dragging === "map" && v2[0] < v1[0] && v2[1] < v1[1] && near(v2[2], v1[2], 1e-9), "dragging the map pans it (content follows the pointer) without changing zoom");
    ok(x.w.getComputedStyle(q(x, "svg.gmap")).cursor === "grab", "grab cursor"); click(x, "#map-zoom-fit"); await sleep(30); var v3 = VB(x); ok(near(v3[2], v0[2], 1e-9) && near(v3[0], v0[0], 1e-9), "fit restores the framing of the approved markers");
    click(x, "#map-zoom-out"); ok(VB(x)[2] > v0[2], "zoom out"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-06", "modern_map_tiles_are_opt_in_with_attribution_and_default_to_no_external_loading", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); click(x, "#map-mode"); await sleep(120);
    var ext0 = x.w.performance.getEntriesByType("resource").filter(function (r) { return new URL(r.name).origin !== x.w.location.origin; }); ev.push("external loads before opt-in=" + ext0.length); ok(!ext0.length && !qa(x, "#map-body image").length && q(x, "svg.gmap").dataset.tiles === "off" && !/OpenStreetMap/.test(q(x, ".geo-legend").textContent), "default: no basemap request, no tile elements");
    click(x, "#map-tiles"); await sleep(60); var imgs = qa(x, "#map-body image"), hrefs = imgs.map(function (i) { return i.getAttribute("href"); }); ev.push("tiles on: " + imgs.length + " tiles, e.g. " + hrefs[0]);
    ok(imgs.length > 0 && imgs.length <= 36 && hrefs.every(function (h) { return /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(h); }) && /© OpenStreetMap contributors/.test(q(x, ".geo-legend").textContent) && q(x, "#map-tiles").getAttribute("aria-pressed") === "true", "opt-in shows OSM tiles with the required attribution");
    var g = q(x, "svg.gmap"), first = g.firstElementChild.className.baseVal; ok(first === "gm-tiles", "tiles sit under the graticule and markers"); click(x, "#map-tiles"); await sleep(40); ok(!qa(x, "#map-body image").length && q(x, "svg.gmap").dataset.tiles === "off", "turning it off removes them"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-07", "sample_map_and_regressions_unaffected_and_no_geo_view_where_no_coordinates_exist", async function (ev) {
    var h = await load("#heb-11:17", 1400, 800); ok(q(h, "#map-mode").hidden && h.B.geo.mode() === "sample" && !h.B.geo.available(), "no research coordinates → no geographic view offered"); h.B.ui.mapMode = "geo"; h.B.render(); ok(h.B.geo.mode() === "sample" && !q(h, "#map-body svg.gmap"), "a stale geo preference falls back to the sample map safely"); clean(h);
    var m = await load("#gen-22:2", 1400, 800); ok(qa(m, "#map-body svg.smap .pin").length === 1 && q(m, '#map-body .pin[data-id="moriah"]').classList.contains("fx"), "sample map unchanged; fixture positions are marked as sample (dashed) so they never look confirmed"); clean(m);
    var v = await load("#gen-22:19&view=map", 1400, 800); click(v, "#map-mode"); await sleep(80); var r = q(v, "#map-pane").getBoundingClientRect(); ok(v.w.getComputedStyle(q(v, "#map-pane")).position === "fixed" && r.width >= 1380 && q(v, "svg.gmap").getBoundingClientRect().width >= 1000, "map perspective: the geographic view fills the canvas"); ok(v.w.__errs.length === 0); clean(v);
  });

  t("GEO-08", "bad_or_unrecognized_coordinates_are_never_drawn_and_never_break_the_page", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800), R = x.B.projection.places[SID], orig = J(R.spatial.sites);
    R.spatial.sites[0].lat = 200; R.spatial.sites[1].coordinate_status = "HOLD"; x.B.render(); ev.push("markers after corrupting both candidates=" + x.B.geo.markers().length); ok(x.B.geo.markers().length === 0 && q(x, "#map-mode").hidden && x.B.geo.mode() === "sample", "invalid range and unrecognized status are dropped; the view offer disappears");
    R.spatial.sites = JSON.parse(orig); R.spatial.sites[0].coordinate_status = "VERIFY"; x.B.render(); ok(x.B.geo.markers().length === 1 && x.B.geo.markers()[0].id === "JBC-CR-PLACE-BEERSHEBA_MODERN-001", "a candidate site whose coordinate status is not the verified-site status is not drawn as a site");
    R.spatial.sites = JSON.parse(orig); R.spatial.sites[1].role = "biblical_place"; R.spatial.sites[1].coordinate_status = "VERIFIED_ARCHAEOLOGICAL_SITE"; x.B.render(); ok(x.B.geo.markers().every(function (m) { return m.id !== "JBC-CR-PLACE-BEERSHEBA_MODERN-001"; }), "role/status mismatch is not drawn");
    var y = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', ""); }); ok(!y.B.geo.available() && q(y, "#map-mode").hidden, "projection failure → no geographic view, sample map intact"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(y); clean(x);
  });
  var GSID = "JBC-CR-PLACE-GERAR-001";
  t("GEO-09", "pilot_E2E_map_detail_scripture_share_one_stable_id_both_directions", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900), B = x.B; click(x, "#map-mode"); await sleep(120); ok(B.geo.mode() === "geo", "geographic view on");
    var ms = qa(x, "#map-body g.gm"); ev.push("markers=" + ms.map(function (m) { return m.dataset.marker + "/" + m.dataset.stableId; }).join(",")); ok(ms.length === 2 && ms.every(function (m) { return m.dataset.stableId === SID && m.dataset.place === "beersheba" && m.getAttribute("role") === "button" && m.getAttribute("tabindex") === "0"; }), "Map: every marker carries the research stable_id (interactive)");
    click(x, '#map-body g.gm-site'); await sleep(150); var d = q(x, "#panel .detail"); ok(B.state.entity && B.state.entity.id === "beersheba" && d && d.dataset.stableId === SID && B.state.panel === "open", "Map → Detail: a marker click opens the Detail of the same stable_id"); ok(q(x, "#map-body g.gm-site").classList.contains("active"), "the selected place's site marker is highlighted");
    click(x, '#map-body g.gm-site'); await sleep(100); ok(B.state.entity && B.state.entity.id === "beersheba" && q(x, "#panel .detail"), "a second marker click does not toggle the selection away");
    click(x, '#panel [data-part="scripture"] [data-open-ref="gen-26:23"]'); await sleep(200); ok(B.state.passage === "gen-26" && B.state.entity.id === "beersheba" && B.geo.mode() === "geo" && qa(x, "#map-body g.gm").length === 2, "Detail → Scripture: the passage changes; entity, geographic view and its markers stay"); var tag = q(x, "#verses .tag.l.active"); ok(tag && tag.dataset.stableId === SID, "Scripture tag = same stable_id, active");
    var y = await load("#gen-26:23", 1440, 900); ok(y.B.geo.available() && y.B.geo.mode() === "sample", "fresh Scripture view (sample map, geographic view offered)"); click(y, '#verses .tag.l[data-id="beersheba"]'); await sleep(120); click(y, "#map-mode"); await sleep(100); ok(y.B.geo.mode() === "geo" && q(y, "#map-body g.gm-site.active").dataset.stableId === SID && q(y, "#panel .detail").dataset.stableId === SID, "Scripture → Map/Detail: a tag selects the same place; its site marker is highlighted; Detail opens");
    var m2 = q(x, "#map-body g.gm-site"); m2.focus(); m2.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await sleep(80); ok(B.state.entity.id === "beersheba", "keyboard: Enter on a marker selects it"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0, "no console errors"); clean(x); clean(y);
  });

  t("GEO-10", "a_marker_click_reopens_a_collapsed_Detail_and_keeps_the_context", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900), B = x.B; click(x, "#map-mode"); await sleep(100); click(x, '#map-body g.gm-site'); await sleep(120); B.setPanel("collapsed"); await sleep(80); ok(B.state.panel === "collapsed" && B.state.entity, "Detail collapsed, entity kept"); var g0 = J(B.ui.gcam); click(x, '#map-body g.gm-modern'); await sleep(120); ok(B.state.panel === "open" && B.state.entity.id === "beersheba" && q(x, "#panel .detail").dataset.stableId === SID && B.geo.mode() === "geo", "a marker click reopens the Detail for the same place without changing the view"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-11", "no_coordinate_graceful_degradation_Gerar_keeps_Detail_and_Scripture_without_any_marker", async function (ev) {
    var x = await load("#gen-10:19", 1440, 900), B = x.B; ev.push("markers=" + B.geo.markers().length + " available=" + B.geo.available()); ok(B.geo.markers().length === 0 && !B.geo.available() && q(x, "#map-mode").hidden && B.geo.mode() === "sample", "no marker, no geographic view offered");
    var note = q(x, '#map-body .map-note[data-place="gerar"]'); ok(note && note.dataset.stableId === GSID && /여러 견해/.test(note.textContent) && !q(x, '#map-body .pin[data-id="gerar"]') && !q(x, "#map-body svg g.gm"), "natural-language note instead of a point; no pin, no marker");
    click(x, '#verses .tag.l[data-id="gerar"]'); await sleep(150); var d = q(x, "#panel .detail"); ok(d && d.dataset.stableId === GSID && /식별 HIGH \/ 좌표 DISPUTED/.test(q(x, "#panel details.research .meta").textContent), "Detail works; identity and coordinate certainty are shown as separate dimensions"); ok(/좌표 없음/.test(q(x, "#panel details.research").textContent) && /여러 후보지/.test(q(x, ".d-kind").textContent), "candidate without a coordinate is listed as such; location wording is 'several candidates'");
    var R = B.projection.places[GSID]; ok(R.spatial.degradation.markers === 0 && R.spatial.verify_hold.verify.length === 6, "VERIFY kept in the read model"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-12", "generic_path_for_a_verified_primary_coordinate_test_data_only", async function (ev) {
    var y = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', '<script src="data/projection.research.js"></script><script>(function(){var R=window.BVC_PROJECTION.places["JBC-CR-PLACE-GERAR-001"]; R.coordinates={lat:31.25,lon:34.79}; R.coordinate_status="VERIFIED_TEST_FIXTURE"; R.coordinate_certainty="VERIFIED_TEST_FIXTURE"; R.location.reader_status="VERIFIED"; R.spatial.primary.coordinates={lat:31.25,lon:34.79}; R.spatial.primary.coordinate_status="VERIFIED_TEST_FIXTURE"; R.spatial.primary.marker={render:true,reason:"verified_primary_coordinate"}; R.spatial.certainty.coordinate="VERIFIED_TEST_FIXTURE"; R.spatial.certainty.reader_location_status="VERIFIED";})();</script>'); });
    y.w.location.hash = "#gen-10:19"; await sleep(400); var B = y.B, mk = B.geo.markers(); ev.push("markers=" + J(mk.map(function (m) { return [m.id, m.style, m.lat, m.lon]; }))); ok(mk.length === 1 && mk[0].place === "gerar" && mk[0].style === "confirmed" && mk[0].lat === 31.25 && mk[0].lon === 34.79 && mk[0].primary === true, "a verified primary coordinate is drawn by the same generic code, exactly at the supplied point");
    ok(!q(y, '#map-body .map-note[data-place="gerar"]') && !q(y, "#map-body .degraded") && !q(y, '#map-body .pin[data-id="gerar"]'), "such a place is neither 'unlocated' nor a bad-coordinate warning, and never a sample-map pin"); click(y, "#map-mode"); await sleep(120); var g = q(y, "#map-body g.gm-confirmed"); ok(g && g.dataset.stableId === GSID && near(+g.dataset.lat, 31.25) && near(+g.dataset.lon, 34.79), "marker on the geographic view with the research stable_id"); click(y, "#map-body g.gm-confirmed"); await sleep(120); ok(q(y, "#panel .detail").dataset.stableId === GSID, "marker → Detail (same stable_id)");
    var z = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', '<script src="data/projection.research.js"></script><script>(function(){var R=window.BVC_PROJECTION.places["JBC-CR-PLACE-GERAR-001"]; R.coordinates={lat:31.25,lon:34.79};})();</script>'); }); z.w.location.hash = "#gen-10:19"; await sleep(400); ok(!z.B.data.places.gerar || z.B.geo.markers().length === 0, "a coordinate without a verified spatial primary marker is refused (no drawing, no stub)"); ok(y.w.__errs.length === 0); clean(y); clean(z);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length, verdict = p === res.length ? "PASS" : "FAIL"; window.BVC_GEO_QA = { pass: p, total: res.length, verdict: verdict, results: res };
    var el = document.createElement("div"); el.id = "geo-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "GEOGRAPHIC_MAP_FOUNDATION " + verdict + " " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " " + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
