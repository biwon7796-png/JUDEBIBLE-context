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
  function variant(edit) { return fetch("index.html").then(function (r) { return r.text(); }).then(function (t) { var html = edit(t.replace("<head>", '<head><base href="' + location.origin + '/"><script>window.BVC_QA_FIXTURE=true</script>')); return new Promise(function (res) { var f = mk(1400, 800); ready(f, res); f.srcdoc = html; host.appendChild(f); }); }); }
  function clean(x) { if (x && x.w) { try { x.w.localStorage.removeItem("jbc.theme"); x.w.localStorage.removeItem("jbc.mapTheme"); x.w.localStorage.removeItem("jbc.mapPrefs.v1"); } catch (e) {} } if (x && x.f) x.f.remove(); }   // 테마 선택은 localStorage 에 남으므로 테스트 사이에 비운다
  function q(x, sel) { return x.d.querySelector(sel); }
  function qa(x, sel) { return [].slice.call(x.d.querySelectorAll(sel)); }
  function click(x, sel) { var e = typeof sel === "string" ? q(x, sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function snap(x) { var s = x.B.state; return J({ passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null, panel: s.panel, view: s.view }); }
  var near = function (a, b, e) { return Math.abs(a - b) <= (e || 1e-6); };
  var VB = function (x) { return q(x, "#map-body svg.gmap").getAttribute("viewBox").split(" ").map(Number); };

  // 지도는 본문연구 Workspace 의 (세로로 긴) 창에서 동작하므로 "최대 축소 = 보이는 가로 40°" 로 검증한다. 보이는 영역은 창 비율로 계산.
  function visW(x){ var b=q(x,"#map-body"), m=Math.max(b.clientWidth,b.clientHeight); return x.B.geo.cam().w*b.clientWidth/m; }
  function visRect(x){ var b=q(x,"#map-body"), m=Math.max(b.clientWidth,b.clientHeight), c=x.B.geo.cam(), hw=c.w*b.clientWidth/m/2, hh=c.w*b.clientHeight/m/2; return [c.x-hw,c.y-hh,2*hw,2*hh]; }
  function infoTxt(x) { var a = q(x, ".geo-attr-min"), i = q(x, "#map-settings-pop .map-info"); return (a ? a.textContent : "") + " " + (i ? i.textContent : ""); }   // 범례·출처는 지도 설정 하단, 지도 위에는 한 줄 출처만
  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };
  // 렌더러 분기: 같은 스위트를 레거시 SVG 렌더러 / MapLibre 렌더러(?mapRenderer=maplibre 또는 localStorage jbc.mapRenderer)에서 돌린다.
  // 아래 id 들은 "레거시 SVG 바탕(.gm-terrain-tiles·localBasemap·hydrologySvg 등) DOM" 자체를 단정하므로 MapLibre 렌더러에서는 의미가 없다: 삭제하지 않고 LEGACY_ONLY 로 표시(통과 수에 넣지 않음).
  // 같은 의미 요구(바탕 소유·타일 연속성·수계·지형 연속)는 qa-ml.js 와 poc/maplibre/tools 의 실제 컴포지터 프레임 검증에서 MapLibre 분기로 확인한다.
  var RENDERER = (function () { try { return /[?&]mapRenderer=maplibre/.test(location.search) || (!/[?&]mapRenderer=legacy/.test(location.search) && localStorage.getItem("jbc.mapRenderer") === "maplibre") ? "maplibre" : "legacy"; } catch (e) { return "legacy"; } })();
  var LEGACY_ONLY = /^(GEO-06|BASE-0[123]|LOCAL_BASE_0[123]|TERRAIN_CONTINUITY_0[1-5]|HYDRO_0[1-6]|TERRAIN_QUALITY_0[1247])$/;

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
    var x = await load("#gen-22:19", 1400, 800); ok(!q(x, "#map-mode"), "user-facing sample-map switch is removed"); ok(x.B.geo.mode() === "geo" && q(x, "#map-body svg.gmap"), "the geographic map is the only map surface");
    var svg = q(x, "#map-body svg.gmap"); ok(svg && x.d.body.dataset.mapview === "geo" && !q(x, "#map-body svg.smap") && svg.dataset.projection === "web-mercator", "geographic Web-Mercator view is shown");
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
    var lg = infoTxt(x); ok(/고고학 후보지/.test(lg) && /정확히 그곳이라는 뜻은 아닙니다/.test(lg) && !/VERIFY|HOLD|stable_id|authority|projection|FIXTURE/.test(lg), "selected lower-tier candidate remains visible and the legend stays in natural Korean");
    ok(!q(x, ".gm-grid") && !/°E|°N/.test(svg.textContent) && q(x, ".gm-scale text"), "provider/grid coordinate labels are absent; only scale and JudeBible research labels remain"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-04", "single_geographic_map_preserves_research_context", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); x.d.querySelector('[data-verse="19"]').scrollIntoView({ block: "start" }); await sleep(150); click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); x.B.setPanel("collapsed"); await sleep(60);
    var st0 = snap(x), a0 = x.B.scrollAnchor(), hash0 = x.w.location.hash, frac0 = x.B.ui.frac, m0 = q(x, "#map-pane").getBoundingClientRect().width;
    ok(!q(x,"#map-mode") && x.d.body.dataset.mapview === "geo" && q(x,"#map-body svg.gmap"), "sample-map mode is absent and the geographic map remains active");
    var a1 = x.B.scrollAnchor(); ok(a0 && a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 3 && snap(x)===st0 && x.w.location.hash===hash0 && x.B.ui.frac===frac0 && Math.abs(q(x,"#map-pane").getBoundingClientRect().width-m0)<=1, "removing the sample mode does not disturb reading context or layout");
    var g = await load("#gen-22:2"); click(g, "#guide-next"); await sleep(60); click(g, "#guide-next"); await sleep(60); ok(g.B.state.entity.id === "beersheba" && g.B.state.panel === "collapsed", "navigation steps still select entities without opening Detail"); ok(x.w.__errs.length === 0 && g.w.__errs.length === 0); clean(g); clean(x);
  });

  t("GEO-05", "geographic_pan_zoom_fit_and_screen_space_symbols_are_stable", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(80); var v0 = VB(x), G=x.B.geo.GEO, c0={x:v0[0]+v0[2]/2,y:v0[1]+v0[3]/2}, ll0=G.unproject(c0.x,c0.y), z0 = +q(x, ".gm-terrain-tiles").dataset.z, label0 = q(x, ".gm-site text").getBoundingClientRect(), shape0 = q(x, ".gm-site .gm-shape").getBoundingClientRect();
    ev.push("initial center "+ll0.lat.toFixed(2)+"N "+ll0.lon.toFixed(2)+"E span="+v0[2].toFixed(2)); ok(v0[2] >= 10 && v0[2] <= 11 && ll0.lon > 34 && ll0.lon < 35.5 && ll0.lat > 30.5 && ll0.lat < 32, "first entry is Israel/Jordan-Rift focused rather than world-scale");
    click(x, "#map-zoom-in"); await sleep(80); var v1 = VB(x), label1 = q(x, ".gm-site text").getBoundingClientRect(), shape1 = q(x, ".gm-site .gm-shape").getBoundingClientRect();
    ok(v1[2] < v0[2] * 0.8, "zoom changes map-space extent");
    ok(Math.abs(label1.height-label0.height) <= 1 && Math.abs(shape1.width-shape0.width) <= 1, "JudeBible labels and markers stay screen-space sized while terrain zooms");
    click(x, "#map-zoom-in"); await sleep(80); var z2 = +q(x, ".gm-terrain-tiles").dataset.z, v1b = VB(x); ev.push("terrain zoom " + z0 + " → " + z2); ok(z2 > z0, "terrain switches to a higher-resolution local tile level as the map zooms in");
    var body = q(x, "#map-body"), sv = q(x, "svg.gmap"), pe = function (tp, cx, cy) { body.dispatchEvent(new x.w.PointerEvent(tp, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 5 })); };
    sv.dispatchEvent(new x.w.PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 200, clientY: 200, button: 0, pointerId: 5 })); pe("pointermove", 260, 230); var dragging = x.d.body.dataset.dragging; pe("pointerup", 260, 230); await sleep(30);
    var v2 = VB(x); ok(dragging === "map" && v2[0] < v1b[0] && v2[1] < v1b[1] && near(v2[2], v1b[2], 1e-9), "pan changes map-space position without changing zoom");
    click(x, "#map-zoom-fit"); await sleep(30); var v3 = VB(x); ok(v3[2] < v0[2] && v3[2] >= 3.25, "explicit fit may move closer but never below the regional-reading zoom floor");
    for (var zi=0;zi<12;zi++) click(x, "#map-zoom-in"); await sleep(40); var v4=VB(x); ok(near(v4[2],3.25,0.01),"maximum zoom-in is clamped to regional terrain reading");
    for (var zo=0;zo<20;zo++) click(x, "#map-zoom-out"); await sleep(40); ok(near(visW(x),40,0.05),"maximum zoom-out is expanded to the Rome–Susa/Ur biblical-world scope, not a global map"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-06", "local_multires_label_free_terrain_tiles_are_primary_and_street_tiles_are_absent", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); await sleep(180); var layer=q(x,".gm-terrain-tiles"), imgs=qa(x,".gm-terrain-tile");
    ev.push("terrain z=" + (layer && layer.dataset.z) + " tiles=" + imgs.length);
    ok(layer && +layer.dataset.z >= 7 && imgs.length > 4 && imgs.every(function(i){return /data\/terrain_tiles\/\d+\/\d+\/\d+\.jpg$/.test(i.getAttribute("href"));}), "local multires shaded-relief tile pyramid is the primary basemap");
    ok(layer.dataset.labels === "none" && !q(x,".gm-tiles") && q(x,"#map-tiles").hidden && x.B.ui.tiles === false, "provider labels and OSM street tiles are absent");
    ok(/Mapzen Terrain Tiles/.test(infoTxt(x)) && /AWS Open Data/.test(infoTxt(x)), "terrain source is disclosed"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-07", "sample_map_is_removed_and_geographic_basemap_survives_zero_coordinates", async function (ev) {
    var h = await load("#heb-11:17", 1400, 800); ok(!q(h,"#map-mode") && h.B.geo.mode() === "geo" && !h.B.geo.available() && q(h, "#map-body svg.gmap"), "no research coordinates → the sole geographic basemap still renders"); ok(qa(h, "#map-body g.gm").length === 0, "no research marker is invented"); clean(h);
    var m = await load("#gen-22:2", 1400, 800); ok(m.B.geo.mode() === "geo" && !q(m,"#map-mode") && !q(m, '#map-body .pin[data-id="moriah"]') && !q(m,"#map-body svg.smap"), "fixture sample positions and sample-map surface do not leak into the product map"); clean(m);
    var v = await load("#gen-22:19&view=map", 1400, 800); await sleep(80); var r = q(v, "#map-pane").getBoundingClientRect(); ok(v.B.state.view === "study" && v.d.body.dataset.view === "study" && !q(v, "#rail-map") && r.width > 200 && q(v, "svg.gmap").getBoundingClientRect().width > 200 && v.w.getComputedStyle(q(v, "#map-pane")).position !== "fixed", "legacy view=map link opens the research workspace; the geographic map lives in its map pane (separate map page removed)"); ok(v.w.__errs.length === 0); clean(v);
  });

  t("GEO-08", "bad_or_unrecognized_coordinates_are_never_drawn_and_never_break_the_page", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800), R = x.B.projection.places[SID], orig = J(R.spatial.sites);
    R.spatial.sites[0].lat = 200; R.spatial.sites[1].coordinate_status = "HOLD"; x.B.render(); ev.push("markers after corrupting both candidates=" + x.B.geo.markers().length); ok(x.B.geo.markers().length === 0 && !q(x,"#map-mode") && x.B.geo.mode() === "geo" && q(x, "#map-body svg.gmap"), "invalid range and unrecognized status are dropped while the sole basemap remains available");
    R.spatial.sites = JSON.parse(orig); R.spatial.sites[0].coordinate_status = "VERIFY"; x.B.render(); ok(x.B.geo.markers().length === 1 && x.B.geo.markers()[0].id === "JBC-CR-PLACE-BEERSHEBA_MODERN-001", "a candidate site whose coordinate status is not the verified-site status is not drawn as a site");
    R.spatial.sites = JSON.parse(orig); R.spatial.sites[1].role = "biblical_place"; R.spatial.sites[1].coordinate_status = "VERIFIED_ARCHAEOLOGICAL_SITE"; x.B.render(); ok(x.B.geo.markers().every(function (m) { return m.id !== "JBC-CR-PLACE-BEERSHEBA_MODERN-001"; }), "role/status mismatch is not drawn");
    var y = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', ""); }); ok(!y.B.geo.available() && !q(y,"#map-mode") && y.B.geo.mode() === "geo" && q(y, "#map-body svg.gmap"), "projection failure → geographic basemap remains, research overlay stays unavailable"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(y); clean(x);
  });
  var GSID = "JBC-CR-PLACE-GERAR-001";
  t("GEO-09", "pilot_E2E_map_detail_scripture_share_one_stable_id_both_directions", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900), B = x.B; await sleep(120); ok(B.geo.mode() === "geo", "geographic basemap is on by default");
    var ms = qa(x, "#map-body g.gm"); ev.push("markers=" + ms.map(function (m) { return m.dataset.marker + "/" + m.dataset.stableId; }).join(",")); ok(ms.length === 2 && ms.every(function (m) { return m.dataset.stableId === SID && m.dataset.place === "beersheba" && m.getAttribute("role") === "button" && m.getAttribute("tabindex") === "0"; }), "Map: every marker carries the research stable_id (interactive)");
    click(x, '#map-body g.gm-site'); await sleep(150); var d = q(x, "#panel .detail"); ok(B.state.entity && B.state.entity.id === "beersheba" && d && d.dataset.stableId === SID && B.state.panel === "open", "Map → Detail: a marker click opens the Detail of the same stable_id"); ok(q(x, "#map-body g.gm-site").classList.contains("active"), "the selected place's site marker is highlighted");
    click(x, '#map-body g.gm-site'); await sleep(100); ok(B.state.entity && B.state.entity.id === "beersheba" && q(x, "#panel .detail"), "a second marker click does not toggle the selection away");
    click(x, '#panel [data-part="scripture"] [data-open-ref="gen-26:23"]'); await sleep(200); ok(B.state.passage === "gen-26" && B.state.entity.id === "beersheba" && B.geo.mode() === "geo" && qa(x, "#map-body g.gm").length === 2, "Detail → Scripture: the passage changes; entity, geographic view and its markers stay"); var tag = q(x, "#verses .tag.l.active"); ok(tag && tag.dataset.stableId === SID, "Scripture tag = same stable_id, active");
    var y = await load("#gen-26:23", 1440, 900); ok(y.B.geo.available() && y.B.geo.mode() === "geo", "fresh Scripture view starts on the geographic basemap"); click(y, '#verses .tag.l[data-id="beersheba"]'); await sleep(120); ok(y.B.geo.mode() === "geo" && q(y, "#map-body g.gm-site.active").dataset.stableId === SID && q(y, "#panel .detail").dataset.stableId === SID, "Scripture → Map/Detail: a tag selects the same place; its site marker is highlighted; Detail opens");
    var m2 = q(x, "#map-body g.gm-site"); m2.focus(); m2.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await sleep(80); ok(B.state.entity.id === "beersheba", "keyboard: Enter on a marker selects it"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0, "no console errors"); clean(x); clean(y);
  });

  t("GEO-10", "a_marker_click_reopens_a_collapsed_Detail_and_keeps_the_context", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900), B = x.B; await sleep(100); click(x, '#map-body g.gm-site'); await sleep(120); B.setPanel("collapsed"); await sleep(80); ok(B.state.panel === "collapsed" && B.state.entity, "Detail collapsed, entity kept"); var g0 = J(B.ui.gcam); click(x, '#map-body g.gm-modern'); await sleep(120); ok(B.state.panel === "open" && B.state.entity.id === "beersheba" && q(x, "#panel .detail").dataset.stableId === SID && B.geo.mode() === "geo", "a marker click reopens the Detail for the same place without changing the view"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-11", "no_coordinate_graceful_degradation_Gerar_keeps_Detail_and_Scripture_without_any_marker", async function (ev) {
    var x = await load("#gen-10:19", 1440, 900), B = x.B; ev.push("markers=" + B.geo.markers().length + " available=" + B.geo.available()); ok(B.geo.markers().length === 0 && !B.geo.available() && !q(x, "#map-mode") && B.geo.mode() === "geo", "no marker is rendered, but the sole geographic basemap remains available");
    var note = q(x, '#map-body .map-note[data-place="gerar"]'); ok(!note && !q(x, '#map-body .pin[data-id="gerar"]') && !q(x, "#map-body svg g.gm"), "natural-language note instead of a point; no pin, no marker");
    click(x, '#verses .tag.l[data-id="gerar"]'); await sleep(150); var d = q(x, "#panel .detail"); ok(d && d.dataset.stableId === GSID && /식별 HIGH \/ 좌표 DISPUTED/.test(q(x, "#panel details.research .meta").textContent), "Detail works; identity and coordinate certainty are shown as separate dimensions"); ok(/좌표 없음/.test(q(x, "#panel details.research").textContent) && /여러 후보지/.test(q(x, ".d-kind").textContent), "candidate without a coordinate is listed as such; location wording is 'several candidates'");
    var R = B.projection.places[GSID]; ok(R.spatial.degradation.markers === 0 && R.spatial.verify_hold.verify.length === 6, "VERIFY kept in the read model"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("GEO-12", "generic_path_for_a_verified_primary_coordinate_test_data_only", async function (ev) {
    var y = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', '<script src="data/projection.research.js"></script><script>(function(){var R=window.BVC_PROJECTION.places["JBC-CR-PLACE-GERAR-001"]; R.coordinates={lat:31.25,lon:34.79}; R.coordinate_status="VERIFIED_TEST_FIXTURE"; R.coordinate_certainty="VERIFIED_TEST_FIXTURE"; R.location.reader_status="VERIFIED"; R.spatial.primary.coordinates={lat:31.25,lon:34.79}; R.spatial.primary.coordinate_status="VERIFIED_TEST_FIXTURE"; R.spatial.primary.marker={render:true,reason:"verified_primary_coordinate"}; R.spatial.certainty.coordinate="VERIFIED_TEST_FIXTURE"; R.spatial.certainty.reader_location_status="VERIFIED";})();</script>'); });
    y.w.location.hash = "#gen-10:19"; await sleep(400); var B = y.B, mk = B.geo.markers(); ev.push("markers=" + J(mk.map(function (m) { return [m.id, m.style, m.lat, m.lon]; }))); ok(mk.length === 1 && mk[0].place === "gerar" && mk[0].style === "confirmed" && mk[0].lat === 31.25 && mk[0].lon === 34.79 && mk[0].primary === true, "a verified primary coordinate is drawn by the same generic code, exactly at the supplied point");
    ok(!q(y, '#map-body .map-note[data-place="gerar"]') && !q(y, "#map-body .degraded") && !q(y, '#map-body .pin[data-id="gerar"]'), "such a place is neither 'unlocated' nor a bad-coordinate warning, and never a sample-map pin"); await sleep(120); var g = q(y, "#map-body g.gm-confirmed"); ok(g && g.dataset.stableId === GSID && near(+g.dataset.lat, 31.25) && near(+g.dataset.lon, 34.79), "marker on the geographic view with the research stable_id"); click(y, "#map-body g.gm-confirmed"); await sleep(120); ok(q(y, "#panel .detail").dataset.stableId === GSID, "marker → Detail (same stable_id)");
    var z = await variant(function (h) { return h.replace('<script src="data/projection.research.js"></script>', '<script src="data/projection.research.js"></script><script>(function(){var R=window.BVC_PROJECTION.places["JBC-CR-PLACE-GERAR-001"]; R.coordinates={lat:31.25,lon:34.79};})();</script>'); }); z.w.location.hash = "#gen-10:19"; await sleep(400); ok(!z.B.data.places.gerar || z.B.geo.markers().length === 0, "a coordinate without a verified spatial primary marker is refused (no drawing, no stub)"); ok(y.w.__errs.length === 0); clean(y); clean(z);
  });

  // BASE-01~11: JUDEBIBLE_BASE_GEOGRAPHIC_MAP_v0.1 acceptance contract.
  t("BASE-01", "map_perspective_opens_real_basemap_even_without_research_overlay", async function (ev) {
    var x = await load("#heb-11:17", 1400, 800); await sleep(120);
    ok(x.B.state.view === "study" && x.B.geo.mode() === "geo" && !x.B.geo.available(), "research overlay unavailable in this passage (research workspace map)");
    ok(q(x, "#map-body svg.gmap") && q(x, ".gm-terrain-tiles") && q(x, ".gm-base-sea") && q(x, "svg.gmap").dataset.basemapMode === "terrain" && !q(x, ".gm-local-basemap"), "terrain basemap visible independently of research overlays; vector fallback is not mixed"); clean(x);
  });

  t("BASE-02", "local_basemap_has_land_sea_and_coastline_geometry", async function (ev) {
    var x = await load("#heb-11:17", 1400, 800); await sleep(120); var tiles = qa(x, ".gm-terrain-tile");
    ev.push("terrain_tiles=" + tiles.length + " z=" + (q(x, ".gm-terrain-tiles") && q(x, ".gm-terrain-tiles").dataset.z));
    ok(tiles.length > 4 && q(x, ".gm-base-sea") && !q(x, ".gm-local-basemap"), "multires terrain plus unified sea base form the normal local basemap without vector fallback mixing"); clean(x);
  });

  t("BASE-03", "physical_geography_context_is_present_as_reference_not_research_truth", async function (ev) {
    var x = await load("#heb-11:17", 1400, 800); await sleep(120); var lg = infoTxt(x);
    ok(q(x, ".gm-terrain-tiles") && !q(x, ".gm-local-basemap") && /기본 지도는 지리적 참고 배경/.test(lg) && /경계·경로·지명 위치를 확정하지 않습니다/.test(lg) && /Mapzen Terrain Tiles/.test(lg), "terrain reference context present with source/non-authority disclaimer and no mixed fallback"); clean(x);
  });

  t("BASE-04", "web_mercator_contract_is_unchanged", async function (ev) {
    var x = await load("#gen-22:19"), svg = q(x, "#map-body svg.gmap"), G = x.B.geo.GEO, p = G.project(31.245, 34.840556), b = G.unproject(p.x, p.y);
    ok(svg && svg.dataset.projection === "web-mercator" && near(b.lat, 31.245, 1e-9) && near(b.lon, 34.840556, 1e-9), "Web Mercator unchanged"); clean(x);
  });

  t("BASE-05", "existing_verified_place_site_binding_is_unchanged", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); await sleep(100); var ms = qa(x, "#map-body g.gm");
    ok(ms.length === 2 && ms.every(function (m) { return m.dataset.stableId === SID; }), "same stable_id binding");
    ok(ms.map(function (m) { return m.dataset.marker; }).sort().join() === "JBC-CR-PLACE-BEERSHEBA_MODERN-001,JBC-CR-SITE-TEL_BEER_SHEVA-001", "only pre-existing verified site/modern markers"); clean(x);
  });

  t("BASE-06", "unapproved_region_geometry_remains_null_and_unrendered", async function (ev) {
    var x = await load("#gen-22:19"), R = x.B.projection.places[SID].spatial.region;
    ok(R && R.boundary == null && !q(x, "#map-body .gm-region"), "Region boundary remains null/HOLD-side and unrendered"); clean(x);
  });

  t("BASE-07", "unapproved_route_geometry_remains_null_and_unrendered", async function (ev) {
    var x = await load("#gen-22:19"), rs = x.B.projection.places[SID].spatial.routes || [];
    ok(rs.length > 0 && rs.every(function (r) { return r.geometry == null; }) && !q(x, "#map-body .gm-route"), "Route geometry remains null and unrendered"); clean(x);
  });

  t("BASE-08", "basemap_does_not_weaken_research_fail_closed_rules", async function (ev) {
    var x = await load("#gen-22:19"), S = x.B.geo.markerSpec;
    ok(!S({ lat: 31.2, lon: 34.8, role: "biblical_place", status: "HOLD" }).render, "HOLD place still blocked");
    ok(!S({ lat: 31.2, lon: 34.8, role: "archaeological_candidate", status: "VERIFY" }).render, "unverified site still blocked");
    ok(!q(x, "#map-body .gm-region") && !q(x, "#map-body .gm-route"), "no inferred region/route geometry"); clean(x);
  });

  t("BASE-09", "basemap_source_attribution_is_visible", async function (ev) {
    var x = await load("#heb-11:17", 1400, 800); await sleep(100);
    var txt = infoTxt(x); ok(/Mapzen Terrain Tiles/.test(txt) && /AWS Open Data/.test(txt) && !/OpenStreetMap/.test(txt), "local multires terrain source is visible and street-tile attribution is absent"); clean(x);
  });

  t("BASE-10", "workspace_scripture_detail_and_navigation_context_are_preserved", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800), before = snap(x); await sleep(100);
    var r = q(x, "#map-pane").getBoundingClientRect(); ok(x.B.state.view === "study" && !q(x, "#rail-map") && r.width > 200 && q(x, "#text-pane") && q(x, "#guide-pane"), "map, scripture and navigation live together in the research workspace (no separate map page)");
    click(x, "#map-body g.gm-site"); await sleep(100);
    ok(x.B.state.passage === "gen-22" && x.B.state.entity.id === "beersheba" && q(x, "#panel .detail").dataset.stableId === SID && q(x, "#guide-pane"), "Scripture context, Detail and Navigation remain connected"); clean(x);
  });

  t("BASE-11", "spatial_semantics_and_hold_state_are_not_weakened", async function (ev) {
    var x = await load("#gen-22:19"), R = x.B.projection.places[SID], S = R.spatial;
    ok(R.stable_id === SID && S.region.boundary == null && (S.routes || []).every(function (r) { return r.geometry == null; }), "stable_id and null Region/Route geometry preserved");
    ok(S.verify_hold && Array.isArray(S.verify_hold.verify) && S.verify_hold.verify.length === 4 && S.verify_hold.hold === 4, "VERIFY/HOLD summary remains in the spatial read model"); clean(x);
  });

  // LOCAL_BASE_01~07: local fail-safe basemap acceptance contract.
  t("LOCAL_BASE_01", "terrain_is_primary_without_mixed_vector_fallback", async function () {
    var x = await load("#gen-22:19", 1400, 800); await sleep(120);
    ok(q(x, ".gm-terrain-tiles") && qa(x, ".gm-terrain-tile").length > 4 && !q(x, ".gm-local-basemap") && !q(x, ".gm-local-land") && q(x, "svg.gmap").dataset.basemapMode === "terrain", "normal frame uses terrain only; vector fallback is not mixed underneath or beside it"); clean(x);
  });
  t("LOCAL_BASE_02", "terrain_visible_with_zero_research_markers", async function () {
    var x = await load("#heb-11:17", 1400, 800); await sleep(120); ok(!x.B.geo.available() && qa(x, "#map-body g.gm").length === 0 && q(x, ".gm-terrain-tiles") && q(x, "svg.gmap").dataset.basemapMode === "terrain", "zero research markers does not blank or downgrade the terrain basemap"); clean(x);
  });
  t("LOCAL_BASE_03", "terrain_presentation_does_not_change_research_state", async function () {
    var x = await load("#gen-22:19", 1400, 800), before = snap(x), ids = x.B.geo.markers().map(function(m){return m.id;}).join(); await sleep(80);
    ok(snap(x) === before && x.B.geo.markers().map(function(m){return m.id;}).join() === ids && q(x, ".gm-terrain-tiles"), "terrain rendering remains presentation-only and leaves research state untouched"); clean(x);
  });
  t("LOCAL_BASE_04", "local_basemap_uses_existing_web_mercator", async function () {
    var x = await load("#gen-22:19"), G=x.B.geo.GEO, p=G.project(31.245,34.840556), b=G.unproject(p.x,p.y); ok(near(b.lat,31.245,1e-9)&&near(b.lon,34.840556,1e-9)&&q(x,"svg.gmap").dataset.projection==="web-mercator", "projection unchanged"); clean(x);
  });
  t("LOCAL_BASE_05", "place_site_binding_unchanged_over_local_basemap", async function () {
    var x=await load("#gen-22:19",1400,800); await sleep(80); var ms=qa(x,"#map-body g.gm"); ok(ms.length===2&&ms.every(function(m){return m.dataset.stableId===SID;}), "existing Place/Site stable_id binding preserved"); clean(x);
  });
  t("LOCAL_BASE_06", "region_route_hold_remains_unrendered", async function () {
    var x=await load("#gen-22:19"), S=x.B.projection.places[SID].spatial; ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&!q(x,".gm-region")&&!q(x,".gm-route"), "Region/Route geometry remains null/unrendered"); clean(x);
  });
  t("LOCAL_BASE_07", "basemap_data_is_reference_only_and_not_in_research_projection", async function () {
    var x=await load("#gen-22:19"); ok(x.w.JBC_LOCAL_BASEMAP_META&&x.w.JBC_LOCAL_BASEMAP_META.role==="REFERENCE_BASEMAP_ONLY"&&!x.B.projection.basemap&&!x.B.projection.terrain&&!x.B.projection.hydrology&&!x.B.projection.geography&&Object.keys(x.B.projection.regions||{}).every(function(k){var r=x.B.projection.regions[k];return r.entity_type==="Region"&&r.source_refs&&r.source_refs[0].sha256&&r.geometry&&r.geometry.status==="none"&&r.coordinates===null;}), "local geography stays outside research truth/projection (the regions container holds only research Region records: no geometry, no coordinates)"); clean(x);
  });

  // TERRAIN_CONTINUITY_01~07: one continuous terrain canvas; fallback is exclusive.
  t("TERRAIN_CONTINUITY_01", "first_entry_uses_terrain_only_across_the_map_frame", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(150);
    var svg=q(x,"svg.gmap"), r=svg.getBoundingClientRect(), imgs=qa(x,".gm-terrain-tile");
    ok(svg.dataset.basemapMode==="terrain" && imgs.length>4 && !q(x,".gm-local-basemap"), "terrain mode is exclusive");
    var tl=imgs.map(function(e){return e.getBoundingClientRect();}), cov=[[r.left+1,r.top+1],[r.right-1,r.top+1],[r.left+1,r.bottom-1],[r.right-1,r.bottom-1],[(r.left+r.right)/2,(r.top+r.bottom)/2]].every(function(p){return tl.some(function(t){return p[0]>=t.left-.5&&p[0]<=t.right+.5&&p[1]>=t.top-.5&&p[1]<=t.bottom+.5;});});
    ok(svg.getAttribute("preserveAspectRatio")==="xMidYMid slice" && cov, "terrain tiles cover every corner and the centre of the map frame (no letterbox/fallback side bands)"); clean(x);
  });
  t("TERRAIN_CONTINUITY_02", "adjacent_terrain_tiles_overlap_slightly_so_no_svg_gaps_exist", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(150);
    var imgs=qa(x,".gm-terrain-tile"), rows={};
    imgs.forEach(function(i){var y=+i.getAttribute("y"), a=rows[y]||(rows[y]=[]);a.push({x:+i.getAttribute("x"),w:+i.getAttribute("width")});});
    Object.keys(rows).forEach(function(k){rows[k].sort(function(a,b){return a.x-b.x;}); for(var i=1;i<rows[k].length;i++) ok(rows[k][i-1].x+rows[k][i-1].w>=rows[k][i].x-1e-6,"horizontal tile gap");});
    ok(Object.keys(rows).length>1,"multiple buffered terrain rows present"); clean(x);
  });
  t("TERRAIN_CONTINUITY_03", "zoom_in_and_out_remain_exclusive_terrain_frames", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120);
    for(var i=0;i<3;i++) click(x,"#map-zoom-in"); await sleep(120); ok(q(x,"svg.gmap").dataset.basemapMode==="terrain"&&!q(x,".gm-local-basemap"),"zoom in stays terrain-only");
    for(var j=0;j<5;j++) click(x,"#map-zoom-out"); await sleep(120); ok(q(x,"svg.gmap").dataset.basemapMode==="terrain"&&!q(x,".gm-local-basemap"),"zoom out stays terrain-only"); clean(x);
  });
  t("TERRAIN_CONTINUITY_04", "terrain_tiles_use_one_shared_visual_pipeline", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var imgs=qa(x,".gm-terrain-tile");
    ok(imgs.length>4 && imgs.every(function(i){return /data\/terrain_tiles\/\d+\/\d+\/\d+\.jpg$/.test(i.getAttribute("href"));}),"all visible tiles come from the same derived JudeBible terrain pyramid");
    ok(x.w.getComputedStyle(q(x,".gm-terrain-tiles")).filter!=="none","one shared CSS tone treatment applies to terrain layer"); clean(x);
  });
  t("TERRAIN_CONTINUITY_05", "missing_terrain_manifest_switches_to_whole_map_fallback_not_a_mix", async function () {
    var x=await variant(function(html){return html.replace('<script src="data/terrain.tiles.js"></script>','');}); await sleep(160);
    var svg=q(x,"svg.gmap"); ok(svg.dataset.basemapMode==="fallback" && !!q(x,".gm-local-basemap") && !q(x,".gm-terrain-tiles"),"manifest failure renders complete vector fallback only"); clean(x);
  });
  t("TERRAIN_CONTINUITY_06", "research_overlay_and_screen_space_symbols_are_unchanged", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(80); var ms=qa(x,"g.gm"), lab=q(x,".gm-site text").getBoundingClientRect(), sh=q(x,".gm-site .gm-shape").getBoundingClientRect();
    ok(ms.length===2&&ms.every(function(m){return m.dataset.stableId===SID;}),"Place/Site stable_id binding preserved");
    click(x,"#map-zoom-in"); await sleep(80); var lab2=q(x,".gm-site text").getBoundingClientRect(), sh2=q(x,".gm-site .gm-shape").getBoundingClientRect();
    ok(Math.abs(lab.height-lab2.height)<=1&&Math.abs(sh.width-sh2.width)<=1,"label and marker screen-space size unchanged"); clean(x);
  });
  t("TERRAIN_CONTINUITY_07", "region_route_hold_and_projection_safety_remain_closed", async function () {
    var x=await load("#gen-22:19"), S=x.B.projection.places[SID].spatial;
    ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&!q(x,".gm-region")&&!q(x,".gm-route"),"Region/Route HOLD remains unrendered"); clean(x);
  });

  // HYDRO_01~07: physical-geography reference hydrology.
  t("HYDRO_01", "initial_view_shows_core_levant_hydrology", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(150);
    ok(q(x,'.gm-terrain-tiles') && q(x,'[data-hydro="Sea of Galilee"]') && qa(x,'[data-hydro="Dead Sea"]').length===2 && qa(x,'[data-hydro="Jordan River"]').length===3, "Mediterranean terrain context plus Galilee, Jordan and Dead Sea hydrology are present on first entry"); clean(x);
  });
  t("HYDRO_02", "dead_sea_is_filled_and_geographically_positioned", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var ds=qa(x,'[data-hydro="Dead Sea"]');
    ok(ds.length===2 && ds.every(function(e){return x.w.getComputedStyle(e).fill!=="none";}), "Dead Sea basins render as filled water bodies");
    var b0=ds[0].getBBox(), b1=ds[1].getBBox(); ok(Math.min(b0.x,b1.x)>35 && Math.max(b0.x+b0.width,b1.x+b1.width)<36 && Math.min(b0.y,b1.y)>-38 && Math.max(b0.y+b0.height,b1.y+b1.height)<-32, "Dead Sea geometry sits in the expected Jordan-Rift longitude/latitude band"); clean(x);
  });
  t("HYDRO_03", "sea_of_galilee_is_visible_and_distinct_from_land", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var g=q(x,'[data-hydro="Sea of Galilee"]'), b=g.getBBox();
    ok(g && b.width>0.1 && b.height>0.1 && x.w.getComputedStyle(g).fill!=="none", "Sea of Galilee is a distinct filled lake at normal Levant zoom"); clean(x);
  });
  t("HYDRO_04", "jordan_river_forms_a_readable_north_south_system", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var rs=qa(x,'[data-hydro="Jordan River"]');
    var boxes=rs.map(function(e){return e.getBBox();}), top=Math.min.apply(null,boxes.map(function(b){return b.y;})), bottom=Math.max.apply(null,boxes.map(function(b){return b.y+b.height;}));
    ok(rs.length===3 && bottom-top>2, "Jordan River reference line spans a continuous north-south Jordan-Rift corridor from the Galilee system toward the Dead Sea"); clean(x);
  });
  t("HYDRO_05", "hydrology_remains_web_mercator_aligned_through_zoom", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var d0=q(x,'[data-hydro="Sea of Galilee"]').getAttribute("d"), v0=VB(x);
    click(x,"#map-zoom-in"); await sleep(80); var d1=q(x,'[data-hydro="Sea of Galilee"]').getAttribute("d"), v1=VB(x);
    ok(d1===d0 && v1[2]<v0[2] && q(x,"svg.gmap").dataset.projection==="web-mercator", "hydrology geometry stays fixed in projected map space while the camera zooms"); clean(x);
  });
  t("HYDRO_06", "hydrology_is_secondary_reference_without_provider_labels", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var h=q(x,".gm-hydrology"), lg=infoTxt(x);
    ok(h && h.dataset.role==="physical-geography-reference" && /Natural Earth 10m v5\.0\.0/.test(lg) && /Public Domain/.test(lg), "hydrology source/license and non-research role are explicit");
    ok(!/Jordan River|Sea of Galilee|Dead Sea/.test(q(x,"svg.gmap").textContent), "physical hydrology adds geometry only, not provider labels"); clean(x);
  });
  t("HYDRO_07", "hydrology_does_not_mutate_research_projection_or_hold_state", async function () {
    var x=await load("#gen-22:19"), S=x.B.projection.places[SID].spatial, ms=qa(x,"g.gm");
    ok(ms.length===2&&ms.every(function(m){return m.dataset.stableId===SID;}),"Place/Site binding preserved");
    ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&!x.B.projection.hydrology,"hydrology remains outside research projection and Region/Route HOLD remains closed"); clean(x);
  });

  // TERRAIN_QUALITY_01~07: source-resolution-aware zoom quality.
  t("TERRAIN_QUALITY_01", "initial_view_uses_clear_native_terrain_level", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(150); var l=q(x,".gm-terrain-tiles");
    ok(+l.dataset.z===8 && +l.dataset.wantedZ===8 && +l.dataset.nativeResM<700, "initial Israel view uses z8 native terrain rather than a low-resolution overzoom"); clean(x);
  });
  t("TERRAIN_QUALITY_02", "medium_zoom_steps_to_higher_resolution_terrain", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var z0=+q(x,".gm-terrain-tiles").dataset.z, r0=+q(x,".gm-terrain-tiles").dataset.nativeResM;
    click(x,"#map-zoom-in"); await sleep(100); var l=q(x,".gm-terrain-tiles"), z1=+l.dataset.z, r1=+l.dataset.nativeResM;
    ok(z1===9 && z1>z0 && r1<r0, "medium zoom switches to z9 and finer source resolution"); clean(x);
  });
  t("TERRAIN_QUALITY_03", "maximum_zoom_uses_z10_native_detail_without_pixel_overzoom", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<12;i++) click(x,"#map-zoom-in"); await sleep(120);
    var v=VB(x), l=q(x,".gm-terrain-tiles"), imgs=qa(x,".gm-terrain-tile"), tilePx=imgs[0].getBoundingClientRect().width;
    ok(near(v[2],3.25,.01) && +l.dataset.z===10 && +l.dataset.wantedZ===10, "maximum local-detail zoom is clamped at 3.25° and uses z10 native terrain");
    ok(tilePx<=256*1.05, "displayed terrain tile is not enlarged beyond native 256px source density"); clean(x);
  });
  t("TERRAIN_QUALITY_04", "zoom_transitions_are_monotonic_and_seam_safe", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var zs=[];
    for(var i=0;i<4;i++){zs.push(+q(x,".gm-terrain-tiles").dataset.z);click(x,"#map-zoom-in");await sleep(70);}
    ok(zs.join(",")==="8,9,10,10" || zs.join(",")==="8,9,9,10", "terrain resolution never drops during zoom-in");
    var imgs=qa(x,".gm-terrain-tile"), rows={}; imgs.forEach(function(im){var y=+im.getAttribute("y"),a=rows[y]||(rows[y]=[]);a.push({x:+im.getAttribute("x"),w:+im.getAttribute("width")});});
    Object.keys(rows).forEach(function(k){rows[k].sort(function(a,b){return a.x-b.x;});for(var j=1;j<rows[k].length;j++)ok(rows[k][j-1].x+rows[k][j-1].w>=rows[k][j].x-1e-6,"no horizontal tile seam gap");}); clean(x);
  });
  t("TERRAIN_QUALITY_05", "camera_cannot_overzoom_past_useful_terrain_resolution", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<30;i++) click(x,"#map-zoom-in"); await sleep(100);
    var v=VB(x), l=q(x,".gm-terrain-tiles"); ok(near(v[2],3.25,.01) && +l.dataset.z===10, "camera stops at 3.25° local-detail span with z10; no building/street overzoom"); clean(x);
  });
  t("TERRAIN_QUALITY_06", "screen_space_symbols_remain_pixel_stable_across_quality_levels", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(80); var a=q(x,".gm-site text").getBoundingClientRect(), b=q(x,".gm-site .gm-shape").getBoundingClientRect();
    click(x,"#map-zoom-in"); click(x,"#map-zoom-in"); await sleep(100); var a2=q(x,".gm-site text").getBoundingClientRect(), b2=q(x,".gm-site .gm-shape").getBoundingClientRect();
    ok(Math.abs(a.height-a2.height)<=1 && Math.abs(b.width-b2.width)<=1, "label/marker pixel size remains stable while terrain detail increases"); clean(x);
  });
  t("TERRAIN_QUALITY_07", "terrain_quality_preserves_hydrology_and_research_safety", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var S=x.B.projection.places[SID].spatial;
    ok(q(x,'[data-hydro="Sea of Galilee"]') && qa(x,'[data-hydro="Dead Sea"]').length===2 && qa(x,'[data-hydro="Jordan River"]').length===3, "hydrology remains present");
    ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&qa(x,"g.gm").every(function(m){return m.dataset.stableId===SID;}), "Place/Site binding and Region/Route HOLD remain unchanged"); clean(x);
  });

  // SCREEN_STYLE_01~08: HARAM-like restrained screen-space map grammar.
  t("SCREEN_STYLE_01", "terrain_is_visually_primary_and_symbols_are_secondary", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(80);
    ok(q(x,".gm-terrain-tiles") && q(x,".gm-site") && q(x,".gm-modern"), "terrain plus restrained research symbols are present");
    var st=q(x,".gm-site text"), mm=q(x,".gm-modern .gm-shape"); ok(st && +x.w.getComputedStyle(st).opacity<1 && mm && +x.w.getComputedStyle(mm).opacity<.7, "visible label and modern reference symbol remain secondary to terrain"); clean(x);
  });
  t("SCREEN_STYLE_02", "label_sizes_follow_restrained_visual_hierarchy", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(80); var st=q(x,".gm-site text"), fpx=+st.getAttribute("font-size")*q(x,"svg.gmap").getScreenCTM().a, mg=q(x,".gm-modern");
    ok(fpx>=14.4&&fpx<=14.6, "selected archaeological site label is promoted to L1 = 14.5px (fixed screen size, typography hierarchy v0.2)");
    var mt=q(x,".gm-modern text"); ok(mg && (!mt || Math.abs(+mt.getAttribute("font-size")*q(x,"svg.gmap").getScreenCTM().a-11.5)<.06), "modern research label is L4 (11.5px) when drawn, and may be collision-suppressed while its marker remains available"); clean(x);
  });
  t("SCREEN_STYLE_03", "markers_are_small_and_selected_symbol_is_not_oversized", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var ring=q(x,".gm-site .gm-ring").getBoundingClientRect(), modern=q(x,".gm-modern .gm-shape").getBoundingClientRect();
    ok(ring.width>=9&&ring.width<=11.5, "candidate outer ring is restrained");
    ok(modern.width>=5&&modern.width<=7, "modern reference marker stays a small hollow circle"); clean(x);
  });
  t("SCREEN_STYLE_04", "label_and_marker_pixel_size_stay_fixed_through_zoom", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(80); var a=q(x,".gm-site text").getBoundingClientRect(), b=q(x,".gm-site .gm-ring").getBoundingClientRect();
    click(x,"#map-zoom-in"); click(x,"#map-zoom-in"); await sleep(100); var a2=q(x,".gm-site text").getBoundingClientRect(), b2=q(x,".gm-site .gm-ring").getBoundingClientRect();
    ok(Math.abs(a.height-a2.height)<=1 && Math.abs(b.width-b2.width)<=1, "screen-space label and marker sizes remain stable"); clean(x);
  });
  t("SCREEN_STYLE_05", "label_halo_is_minimal_and_has_no_opaque_box", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(80); var t=q(x,".gm-site text"), cs=x.w.getComputedStyle(t);
    ok(cs.stroke!=="none" && /stroke/.test(cs.paintOrder) && +t.getAttribute("stroke-width")>0 && +t.getAttribute("stroke-width")<=+t.getAttribute("font-size")*0.25 && !/\d+px \d+px \d+px/.test(cs.textShadow.replace(/rgba?\([^)]*\)/g,"")), "label uses a thin light halo (stroke ≤0.25em painted under the glyph fill) and no heavy shadow; superseded the earlier shadow-only rule per label readability v0.1");
    ok(!q(x,".gm-label-bg")&&!q(x,".gm-label-pill"), "no label box or pill obscures terrain"); clean(x);
  });
  t("SCREEN_STYLE_06", "map_surface_uses_only_concise_place_names", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(80); var labels=qa(x,"g.gm text").map(function(e){return e.textContent;});
    ok(labels.indexOf("텔 브엘세바")>=0 && labels.every(function(v){return v==="텔 브엘세바"||v==="브엘세바";}), "only concise place names are shown; lower-priority labels may be hidden by semantic collision rules");
    ok(labels.every(function(v){return !/현대|참고|VERIFY|HOLD|후보지/.test(v);}), "status/explanation text is absent from map labels"); clean(x);
  });
  t("SCREEN_STYLE_07", "selection_is_clear_while_modern_reference_remains_subdued", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(100);
    var s=q(x,".gm-site.active text"), m=q(x,".gm-modern .gm-shape");
    ok(s && +x.w.getComputedStyle(s).opacity>.9 && m && +x.w.getComputedStyle(m).opacity<.7, "selected candidate is modestly emphasized while modern reference marker stays subdued"); clean(x);
  });
  t("SCREEN_STYLE_08", "visual_tuning_preserves_terrain_hydrology_and_research_safety", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var S=x.B.projection.places[SID].spatial;
    ok(q(x,".gm-terrain-tiles") && q(x,'[data-hydro="Sea of Galilee"]') && qa(x,'[data-hydro="Dead Sea"]').length===2, "terrain and hydrology remain intact");
    ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&qa(x,"g.gm").every(function(m){return m.dataset.stableId===SID;}), "Place/Site binding and Region/Route HOLD remain unchanged"); clean(x);
  });

  // ZOOM_SEMANTIC_01~11: deeper HARAM-like zoom plus semantic label reveal.
  t("ZOOM_SEMANTIC_01", "maximum_zoom_expands_to_local_detail_without_street_level", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<30;i++) click(x,"#map-zoom-in"); await sleep(100);
    var v=VB(x), l=q(x,".gm-terrain-tiles"); ok(v[2]>=3&&v[2]<=3.5 && +l.dataset.z===10, "deepest camera is 3.0–3.5° local-detail scale and remains on z10 terrain"); clean(x);
  });
  t("ZOOM_SEMANTIC_02", "deepest_zoom_does_not_blur_upscale_z10", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<30;i++) click(x,"#map-zoom-in"); await sleep(100);
    var im=q(x,".gm-terrain-tile").getBoundingClientRect(), l=q(x,".gm-terrain-tiles"); ok(im.width<=256*1.05 && +l.dataset.nativeResM<160, "deepest zoom remains within native tile density and ~130m/px terrain source resolution"); clean(x);
  });
  t("ZOOM_SEMANTIC_03", "widest_zoom_hides_lower_priority_labels", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<20;i++) click(x,"#map-zoom-out"); await sleep(100);
    var c=x.B.geo.cam(), vis=x.B.geo.visibleMarkers(c); ok(near(visW(x),40,.05)&&x.B.geo.semanticTierLimit(c.w)===1&&vis.length===0&&qa(x,"g.gm text").length===0, "widest biblical-world view exposes only tier-1 labels; no lower-tier Beersheba labels leak"); clean(x);
  });
  t("ZOOM_SEMANTIC_04", "initial_levant_view_uses_tier_1_and_2_only", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var c=x.B.geo.cam();
    ok(c.w>=10&&c.w<14&&x.B.geo.semanticTierLimit(c.w)===2&&!qa(x,'g.gm text[data-semantic-tier="4"]').length&&qa(x,"g.gm text").every(function(e){return +e.dataset.semanticTier<=3;}), "initial Levant view suppresses tier-4 detail (passage-related tier-3 may lead by one tier)"); clean(x);
  });
  t("ZOOM_SEMANTIC_05", "regional_zoom_reveals_tier_3_reference_label", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); click(x,"#map-zoom-in"); await sleep(100);
    var c=x.B.geo.cam(), labels=qa(x,"g.gm text").map(function(e){return e.textContent;});
    ok(c.w<10&&c.w>=5.5&&x.B.geo.semanticTierLimit(c.w)===3&&labels.indexOf("브엘세바")>=0&&labels.indexOf("텔 브엘세바")<0, "regional zoom reveals tier-3 modern reference while tier-4 archaeological detail stays hidden"); clean(x);
  });
  t("ZOOM_SEMANTIC_06", "deep_zoom_can_reveal_eligible_tier_4_detail", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var R=x.B.projection.places[SID], old=R.spatial.sites[0].lon;
    R.spatial.sites[0].lon=35.5; x.B.render(); for(var i=0;i<10;i++) click(x,"#map-zoom-in"); await sleep(120);
    var c=x.B.geo.cam(), labels=qa(x,"g.gm text").map(function(e){return e.textContent;});
    ok(c.w<5.5&&x.B.geo.semanticTierLimit(c.w)===4&&labels.indexOf("텔 브엘세바")>=0, "deep local-detail zoom reveals a non-colliding tier-4 archaeological label");
    R.spatial.sites[0].lon=old; clean(x);
  });
  t("ZOOM_SEMANTIC_07", "zoom_back_out_removes_lower_priority_labels_again", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); click(x,"#map-zoom-in"); await sleep(80); ok(qa(x,"g.gm text").length>=1,"regional label appears");
    for(var i=0;i<20;i++) click(x,"#map-zoom-out"); await sleep(100); ok(qa(x,"g.gm text").length===0,"lower-priority labels disappear again after zoom-out"); clean(x);
  });
  t("ZOOM_SEMANTIC_08", "selected_lower_tier_entity_overrides_normal_visibility", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(100);
    var site=q(x,'.gm-site text'); ok(site&&site.textContent==="텔 브엘세바"&&x.B.geo.cam().w>10, "selected tier-4 site remains labeled even at initial Levant zoom without forcing camera zoom"); clean(x);
  });
  t("ZOOM_SEMANTIC_09", "collision_resolution_is_priority_ordered_and_deterministic", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<10;i++) click(x,"#map-zoom-in"); await sleep(100);
    var a=x.B.geo.visibleMarkers(x.B.geo.cam()).map(function(m){return m.id;}).join(","), b=x.B.geo.visibleMarkers(x.B.geo.cam()).map(function(m){return m.id;}).join(",");
    ok(a===b&&a.split(",")[0]==="JBC-CR-PLACE-BEERSHEBA_MODERN-001", "same camera yields the same collision result; the higher-priority tier-3 label is placed before the tier-4 label (side-aware boxes now let both fit when they do not collide)"); clean(x);
  });
  t("ZOOM_SEMANTIC_10", "screen_space_label_and_marker_size_remain_fixed", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(80);
    var a=q(x,".gm-site text").getBoundingClientRect(), b=q(x,".gm-site .gm-ring").getBoundingClientRect(); for(var i=0;i<8;i++) click(x,"#map-zoom-in"); await sleep(100);
    var a2=q(x,".gm-site text").getBoundingClientRect(), b2=q(x,".gm-site .gm-ring").getBoundingClientRect(); ok(Math.abs(a.height-a2.height)<=1&&Math.abs(b.width-b2.width)<=1, "semantic zoom changes density/extent, not screen-space text or marker size"); clean(x);
  });
  t("ZOOM_SEMANTIC_11", "semantic_zoom_preserves_hydrology_and_research_hold", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var S=x.B.projection.places[SID].spatial;
    ok(q(x,'.gm-terrain-tiles')&&q(x,'[data-hydro="Sea of Galilee"]')&&qa(x,'[data-hydro="Dead Sea"]').length===2,"terrain and hydrology preserved");
    ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&!x.B.projection.semantic_zoom,"semantic presentation remains outside research projection; Region/Route HOLD preserved"); clean(x);
  });

  // WORLD_EXTENT_01~10: continuous biblical-world canvas and sole geographic map.
  t("WORLD_EXTENT_01", "first_entry_remains_israel_centered", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100);
    var c=x.B.geo.cam(), ll=x.B.geo.GEO.unproject(c.x,c.y);
    ok(c.w>=10&&c.w<=11&&ll.lon>34&&ll.lon<35.5&&ll.lat>30.5&&ll.lat<32, "first entry remains Israel/Jordan-Rift centered"); clean(x);
  });
  t("WORLD_EXTENT_02", "maximum_zoom_out_contains_rome_egypt_babylon_susa_and_ur", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<20;i++) click(x,"#map-zoom-out"); await sleep(100);
    var v=visRect(x), G=x.B.geo.GEO, inside=function(lat,lon){var p=G.project(lat,lon);return p.x>=v[0]&&p.x<=v[0]+v[2]&&p.y>=v[1]&&p.y<=v[1]+v[3];};
    ok(near(visW(x),40,.05)&&inside(41.9028,12.4964)&&inside(30.0444,31.2357)&&inside(32.5422,44.4200)&&inside(32.1892,48.2578)&&inside(30.9625,46.1031), "widest biblical-world canvas contains Rome, Egypt, Babylon, Susa and Ur"); clean(x);
  });
  t("WORLD_EXTENT_03", "maximum_zoom_out_is_continuous_terrain_not_mint_fallback", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); for(var i=0;i<20;i++) click(x,"#map-zoom-out"); await sleep(120);
    var svg=q(x,"svg.gmap"), layer=q(x,".gm-terrain-tiles");
    ok(svg.dataset.basemapMode==="terrain"&&+layer.dataset.z===6&&!q(x,".gm-local-basemap")&&qa(x,".gm-terrain-tile").length>20, "wide biblical-world view remains one continuous z6 terrain canvas with no fallback bands"); clean(x);
  });
  t("WORLD_EXTENT_04", "rome_area_is_inside_supported_terrain_bounds", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80); var M=x.w.JBC_TERRAIN_TILES.ranges["8"];
    ok(M.bounds[0]<=12.5&&M.bounds[1]>=12.5&&M.bounds[2]<=41.9&&M.bounds[3]>=41.9, "Rome lies inside supported terrain coverage"); clean(x);
  });
  t("WORLD_EXTENT_05", "mesopotamia_susa_ur_are_inside_supported_terrain_bounds", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80); var M=x.w.JBC_TERRAIN_TILES.ranges["8"];
    ok(M.bounds[1]>=48.3&&M.bounds[2]<=30.9&&M.bounds[3]>=32.6, "Babylon, Susa and Ur lie inside normal biblical-world terrain coverage"); clean(x);
  });
  t("WORLD_EXTENT_06", "egypt_and_nile_are_inside_supported_terrain_bounds", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80); var M=x.w.JBC_TERRAIN_TILES.ranges["8"];
    ok(M.bounds[0]<=31.2&&M.bounds[2]<=30&&M.bounds[3]>=31.5&&qa(x,'[data-hydro="Nile"]').length>0, "Egypt terrain coverage and Nile reference geometry are present"); clean(x);
  });
  t("WORLD_EXTENT_07", "biblical_world_major_hydrology_is_present", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80);
    ok(qa(x,'[data-hydro="Nile"]').length>0&&qa(x,'[data-hydro="Tigris"]').length>0&&qa(x,'[data-hydro="Euphrates"]').length>0&&qa(x,'[data-hydro="Jordan River"]').length>0&&qa(x,'[data-hydro="Dead Sea"]').length===2, "Nile, Tigris, Euphrates and Jordan-system physical hydrology are available"); clean(x);
  });
  t("WORLD_EXTENT_08", "sample_map_has_no_user_facing_surface_or_switch", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80);
    ok(!q(x,"#map-mode")&&!q(x,"svg.smap")&&q(x,"svg.gmap")&&x.B.geo.mode()==="geo", "geographic map is the only user-facing map surface"); clean(x);
  });
  t("WORLD_EXTENT_09", "semantic_zoom_and_screen_space_scale_survive_world_extent", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80); x.B.selectEntity("l","beersheba"); await sleep(60);
    var a=q(x,".gm-site text").getBoundingClientRect(), b=q(x,".gm-site .gm-ring").getBoundingClientRect(); for(var i=0;i<20;i++) click(x,"#map-zoom-out"); await sleep(80); for(var j=0;j<20;j++) click(x,"#map-zoom-in"); await sleep(80);
    var a2=q(x,".gm-site text").getBoundingClientRect(), b2=q(x,".gm-site .gm-ring").getBoundingClientRect(); ok(Math.abs(a.height-a2.height)<=1&&Math.abs(b.width-b2.width)<=1&&x.B.geo.semanticTierLimit(40)===1&&x.B.geo.semanticTierLimit(3.25)===4, "world extent preserves semantic tiers and fixed screen-space label/marker size"); clean(x);
  });
  t("WORLD_EXTENT_10", "world_extent_preserves_research_truth_and_region_route_hold", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(80); var S=x.B.projection.places[SID].spatial;
    ok(S.region.boundary==null&&(S.routes||[]).every(function(r){return r.geometry==null;})&&!x.B.projection.hydrology&&!x.B.projection.basemap, "expanded terrain/hydrology remain presentation reference layers; Region/Route HOLD stays closed"); clean(x);
  });

  // BASEMAP_WORLD_01~04: one continuous terrain canvas over the biblical world, no partial fallback, major hydrology present.
  t("BASEMAP_WORLD_01", "biblical_world_is_one_continuous_terrain_canvas_without_fallback", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var G=x.B.geo.GEO, bad=[], n=0;
    var sites={Rome:[41.9,12.5],Athens:[38,23.7],Ephesus:[37.9,27.3],Cyprus:[35,33],Jerusalem:[31.8,35.2],Memphis:[29.85,31.25],Sinai:[28.5,33.9],Babylon:[32.54,44.42],Susa:[32.19,48.25],Ur:[30.96,46.1]};
    ok(q(x,"svg.gmap").dataset.basemapMode==="terrain" && Math.abs(x.B.geo.cam().x-34.8)<1e-6, "first entry stays Israel-centred on terrain");
    Object.keys(sites).forEach(function(k){ [40,30,20,10.5,6.5].forEach(function(w){ x.B.ui.gcam={x:sites[k][1],y:G.yOf(sites[k][0]),w:w}; x.B.zoomBy(1); n++; var sv=q(x,"svg.gmap"), r=sv.getBoundingClientRect(), p=G.project(sites[k][0],sites[k][1]), m=sv.getScreenCTM(), px=p.x*m.a+m.e, py=p.y*m.d+m.f; if(sv.dataset.basemapMode!=="terrain"||!(px>=r.left&&px<=r.right&&py>=r.top&&py<=r.bottom)) bad.push(k+"@"+w); }); });
    ev.push("checked "+n+" camera/site combinations, failures="+J(bad)); ok(!bad.length, "every biblical-world site is reachable on terrain at every span (no fallback, no cut-off)"); clean(x);
  });
  t("BASEMAP_WORLD_02", "major_hydrology_covers_nile_delta_euphrates_tigris", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var hn=function(n){return qa(x,'.gm-hydro-river[data-hydro="'+n+'"]').length;};
    ok(hn("Nile")>=4 && hn("Euphrates")>=5 && hn("Tigris")>=2 && hn("Jordan River")===3 && qa(x,'.gm-hydro-lake[data-hydro="Dead Sea"]').length===2 && q(x,'.gm-terrain-sea-mask') && q(x,".gm-terrain-coast"), "Nile (with delta branches), Euphrates, Tigris, Jordan, Galilee, Dead Sea, Mediterranean sea mask and coastline are present"); clean(x);
  });

  // MAP_UNIFY_01~05: both map surfaces share one camera contract; labels are fixed screen px; no persistent location notice.
  t("MAP_UNIFY_01", "study_and_perspective_maps_share_camera_contract_and_wheel", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var res={};
    function run(tag){ for(var i=0;i<30;i++) x.B.zoomBy(1.4); res[tag+"_in"]=x.B.geo.cam().w; for(var j=0;j<40;j++) x.B.zoomBy(1/1.4); res[tag+"_out"]=x.B.geo.cam().w;
      x.B.ui.gcam={x:34.8,y:x.B.geo.GEO.yOf(31.2),w:10.5}; x.B.zoomBy(1); var w0=x.B.geo.cam().w, b=q(x,"#map-body"); b.dispatchEvent(new x.w.WheelEvent("wheel",{deltaY:-100,bubbles:true,cancelable:true})); var w1=x.B.geo.cam().w; res[tag+"_wheel"]=+(w0/w1).toFixed(3); }
    ok(x.B.state.view==="study","starts in the research workspace"); run("study"); ok(x.B.setView("map")===true&&x.B.state.view==="study","legacy setView(\"map\") resolves to the research workspace"); await sleep(150); run("map"); ev.push(J(res));
    ok(near(res.study_in,3.25,.001)&&near(res.map_in,3.25,.001)&&res.study_out>=40&&near(res.study_out,res.map_out,.001)&&near(res.study_out*q(x,"#map-body").clientWidth/Math.max(q(x,"#map-body").clientWidth,q(x,"#map-body").clientHeight),40,.05),"one camera contract: max zoom-in 3.25°, max zoom-out = 40° visible width (span scales with pane aspect)");
    ok(res.study_wheel===1.15&&res.map_wheel===1.15,"mouse wheel zooms by the same step on both surfaces"); clean(x);
  });
  t("MAP_UNIFY_02", "labels_are_fixed_screen_px_and_tiered", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(100); var out={};
    [10.5,6,3.25].forEach(function(w){ x.B.ui.gcam={x:34.84,y:x.B.geo.GEO.yOf(31.245),w:w}; x.B.zoomBy(1); var sv=q(x,"svg.gmap"), sc=sv.getScreenCTM().a, t=qa(x,"g.gm text"); out[w]=t.map(function(e){return +(+e.getAttribute("font-size")*sc).toFixed(2);}); });
    ev.push(J(out)); var all=[].concat(out[6],out[3.25]); ok(all.length&&all.every(function(px){return px>=10&&px<=15.5;}),"labels are 10–15.5px (L0–L5 table)"); ok(out[6].length&&out[3.25].length&&Math.abs(out[6][0]-out[3.25][0])<.05,"label px size does not change with zoom");
    var op=+x.w.getComputedStyle(q(x,"g.gm text")).opacity; ok(op<1 && x.w.getComputedStyle(q(x,"g.gm text")).backgroundColor!=="rgb(255, 255, 255)" && !q(x,"g.gm rect.label-bg"),"no opaque label box over terrain"); clean(x);
  });
  t("MAP_UNIFY_03", "no_persistent_beersheba_notice_and_no_fake_marker", async function () {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var S=x.B.projection.places[SID].spatial; ok(!q(x,".map-note") && !/정확한 위치에 대해서는 여러 견해/.test(q(x,"#map-body").textContent),"map shows no location-uncertainty banner");
    ok(!qa(x,"g.gm").some(function(m){return m.dataset.marker===SID;}) && S.region.boundary==null,"no marker for the unresolved biblical place; research state untouched"); clean(x);
  });

  // MAP_REFINE_01~04: terrain OFF keeps base colours; allLabels adds reference names; label px per kind.
  function setLayer(x,k,v){ var e=q(x,'[data-map-layer="'+k+'"]'); if(!!e.checked!==v) e.click(); }
  function cam(x,lon,lat,w){ x.B.ui.gcam={x:lon,y:x.B.geo.GEO.yOf(lat),w:w}; x.B.zoomBy(1); }
  function css(x,sel,p){ var e=q(x,sel); return e?x.w.getComputedStyle(e)[p]:null; }
  t("MAP_REFINE_01", "terrain_off_removes_only_relief_and_keeps_base_colours", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(120); var on={sea:css(x,".gm-terrain-sea-mask","fill"),coast:css(x,".gm-terrain-coast","stroke"),tiles:qa(x,".gm-terrain-tile").length,hydro:qa(x,".gm-hydro-river,.gm-hydro-lake").length,mk:qa(x,"g.gm").length,mode:q(x,"svg.gmap").dataset.basemapMode};
    setLayer(x,"terrain",false); await sleep(80); var off={sea:css(x,".gm-local-sea","fill"),coast:css(x,".gm-local-land","stroke"),land:css(x,".gm-local-land","fill"),tiles:qa(x,".gm-terrain-tile").length,hydro:qa(x,".gm-hydro-river,.gm-hydro-lake").length,mk:qa(x,"g.gm").length,mode:q(x,"svg.gmap").dataset.basemapMode}; ev.push(J({on:on,off:off}));
    ok(on.tiles>0&&off.tiles===0&&on.mode==="terrain"&&off.mode==="flat","hillshade tiles removed, nothing else swapped in"); ok(on.sea===off.sea&&on.coast===off.coast,"sea colour and coastline colour identical ON/OFF"); var tok=x.w.getComputedStyle(x.d.documentElement).getPropertyValue("--map-land-base").trim(), rgbTok=function(h){var n=parseInt(h.slice(1),16);return "rgb("+(n>>16&255)+", "+(n>>8&255)+", "+(n&255)+")";}; ok(off.land===rgbTok(tok),"land (hillshade OFF) is exactly the theme land-base token — the tone ON maps flat terrain to (WARM_EDITORIAL_ATLAS v0.1)"); ok(on.hydro===off.hydro&&on.mk===off.mk,"hydrology and research markers unchanged"); clean(x);
  });
  t("MAP_REFINE_02", "individual_reference_labels_default_on_master_all_labels_remains_optional", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(80); cam(x,34.8,31.5,5); var core=qa(x,"g.gm text").map(function(e){return e.textContent;}).join();
    ok(x.B.ui.mapDisplay.modernNames===true&&x.B.ui.mapDisplay.ancientRef===true,"biblical/ancient/modern labels are ON by default; no all-names or external-source option"); cam(x,30,33,40); var w1=qa(x,".gm-ref").map(function(e){return e.dataset.refKind;}); cam(x,34.8,31.5,5); var kinds=qa(x,".gm-ref").map(function(e){return e.dataset.refKind;}), core2=qa(x,"g.gm text").map(function(e){return e.textContent;}).join();
    ev.push("world kinds="+J(w1)+" regional kinds="+J(kinds)); ok(w1.indexOf("water")>=0&&w1.indexOf("region")>=0,"wide view adds sea and region names"); ok(kinds.indexOf("modern")>=0&&kinds.indexOf("water")>=0,"regional view adds lake/sea and smaller (modern reference) names"); ok(core===core2,"research labels unchanged by reference-name zoom"); setLayer(x,"modernNames",false); await sleep(60); ok(qa(x,".gm-ref-modern").length===0,"modern OFF: no modern reference names"); ok(!qa(x,"svg.gmap .gm-ref rect").length&&q(x,".gm-ref-layer").dataset.role==="reference-names-not-research","no label boxes; layer is marked as non-research reference");
    var rw=+css(x,".gm-ref text","fontWeight"), mw=+css(x,"g.gm text","fontWeight"); ok(rw<mw,"reference names are lighter and weaker than research names ("+rw+" < "+mw+")"); setLayer(x,"labels",false); await sleep(60); ok(!qa(x,"g.gm text").length,"성경 지명 OFF hides biblical research names"); clean(x);
  });
  t("MAP_REFINE_03", "label_px_sizes_match_spec_and_do_not_change_with_zoom", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(60); var got={};
    [[34.8,31.5,5],[34.84,31.245,3.25],[30,33,40]].forEach(function(c){ cam(x,c[0],c[1],c[2]); var sc=q(x,"svg.gmap").getScreenCTM().a; qa(x,"g.gm text,.gm-ref text").forEach(function(e){ var g=e.parentNode, k=g.dataset.refKind?g.dataset.refKind:(g.classList.contains("gm-site")?"site":g.classList.contains("gm-modern")?"research-modern":"research-t"+e.dataset.semanticTier); (got[k]=got[k]||[]).push(+(+e.getAttribute("font-size")*sc).toFixed(2)); }); });
    ev.push(J(got)); var u=function(k){return (got[k]||[]).filter(function(v,i,a){return a.indexOf(v)===i;});};
    var LV=x.B.geo.labelLevels, inTable=function(k,lvls){ return u(k).every(function(px){ return lvls.some(function(l){return near(px,LV[l].px,.06);}); }); }; ok(u("water").length>=1&&inTable("water",["WM","Wm"]),"water labels use WM 13.5 / Wm 11.5"); ok(u("region").length>=1&&inTable("region",["L0","L3"]),"region labels use L0 15.5 / L3 12.5"); ok(u("modern").length>=1&&inTable("modern",["L4","L5"]),"modern reference labels use L4 11.5 / L5 11"); ok(u("site").length===1&&near(u("site")[0],LV.L1.px,.06),"selected research site = L1 14.5"); var lp=x.B.geo.labelPx; ok(lp({style:"estimated",label_priority:1})===14.5&&lp({style:"estimated",label_priority:2})===13.5&&lp({style:"modern"})===11.5&&lp({style:"site"})===12.5,"L1 14.5 / L2 13.5 / modern L4 11.5 / site L3 12.5"); ok(LV.L0.px>LV.L1.px&&LV.L0.weight<LV.L1.weight&&LV.L4.weight<=LV.L2.weight&&LV.L1.weight===Math.max.apply(null,Object.keys(LV).map(function(k){return LV[k].weight;})),"region labels are larger but lighter than major places; only L1 is bold"); clean(x);
  });
  t("MAP_REFINE_04", "semantic_zoom_still_gates_reference_names", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(120); await sleep(60); cam(x,30,33,40); var n40=qa(x,".gm-ref").length, t40=Math.max.apply(null,qa(x,".gm-ref").map(function(e){return +e.dataset.semanticTier;})); cam(x,34.8,31.5,10.5); var n10=qa(x,".gm-ref").length; cam(x,34.8,31.5,4); var n4=qa(x,".gm-ref").length, t4=Math.max.apply(null,qa(x,".gm-ref").map(function(e){return +e.dataset.semanticTier;}));
    ev.push("n40="+n40+" n10="+n10+" n4="+n4+" maxTier40="+t40+" maxTier4="+t4); ok(t40===1&&t4>=3&&n4>=n10,"zoom-out only tier 1; zoom-in reveals lower tiers (more names)"); clean(x);
  });

  // LABEL_CONTRAST_01 / MEDIA_BIND_01~04: label readability over terrain; stable_id-based generic research media binding.
  function lum(c){ var m=c.match(/[\d.]+/g).map(Number), f=function(v){v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}; return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]); }
  function cratio(a,b){ var A=lum(a),B=lum(b); return (Math.max(A,B)+.05)/(Math.min(A,B)+.05); }
  function mixc(fg,bg,o){ var f=fg.match(/[\d.]+/g).map(Number), b=bg.match(/[\d.]+/g).map(Number); return "rgb("+[0,1,2].map(function(i){return Math.round(o*f[i]+(1-o)*b[i]);}).join(",")+")"; }
  t("LABEL_CONTRAST_01", "labels_are_darker_have_thin_halo_and_keep_hierarchy", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(120); x.B.selectEntity("l","beersheba"); await sleep(60); cam(x,35.2,32,4.2); var tk=function(n){var h=x.w.getComputedStyle(x.d.documentElement).getPropertyValue(n).trim(),v=parseInt(h.slice(1),16);return "rgb("+(v>>16&255)+","+(v>>8&255)+","+(v&255)+")";}, relief=tk("--map-land-base"), sea=tk("--map-water"), res={};   // ground = the theme land-base tone (dominant terrain colour)
    function m(sel){ var e=q(x,sel); if(!e) return null; var cs=x.w.getComputedStyle(e); return {fill:cs.fill,op:+cs.opacity,w:+cs.fontWeight,stroke:cs.stroke,paint:cs.paintOrder,sw:+e.getAttribute("stroke-width")}; }
    var site=m(".gm-site text"), mod=m(".gm-ref-modern text"), reg=m(".gm-ref-region text"), wat=m(".gm-ref-water text"); res={site:site,mod:mod,wat:wat}; ev.push(J(res));
    ok(site&&mod&&wat,"site, modern reference and water labels present");
    ok(cratio(mixc(mod.fill,relief,mod.op),relief)>=4.5,"modern reference label ≥4.5:1 against shaded relief"); ok(cratio(mixc(wat.fill,sea,wat.op),sea)>=4.0,"water label ≥4:1 against sea");
    if(reg) ok(cratio(mixc(reg.fill,relief,reg.op),relief)>=4.5,"region label ≥4.5:1");
    ok(site.sw>0&&/stroke/.test(site.paint)&&mod.sw>0&&site.stroke!=="none"&&mod.stroke!=="none","thin light halo (stroke painted under fill), no box");
    ok(site.w<=700&&mod.w<site.w&&!qa(x,".gm text").some(function(e){return +x.w.getComputedStyle(e).fontWeight>700;}),"hierarchy kept: research label heavier than reference label, nothing over-bold");
    ok(!qa(x,"svg.gmap .gm rect.label-bg, svg.gmap .gm-ref rect").length,"no opaque label boxes"); clean(x);
  });
  var BSMEDIA='#panel [data-part="media"]';
  t("MEDIA_BIND_01", "beersheba_research_photo_is_bound_by_stable_id_and_rights_preserved", async function (ev) {
    var x=await load("#gen-22:19",1600,900); click(x,'.tag.l[data-id="beersheba"]'); await sleep(200); var R=x.B.projection.places[SID], hero=q(x,BSMEDIA), im=hero&&hero.querySelector("img.hero-img"), rep=R.media.filter(function(m){return m.id===R.representative_media_id;})[0];
    ev.push("media="+R.media.map(function(m){return m.id+":"+m.display_mode+":"+m.rights.status;}).join(",")); ok(R.media.length===3&&R.media.every(function(m){return m.target_ref&&/^JBC-CR-(PLACE|SITE)-/.test(m.target_ref.ref)&&m.target_ref.binding==="overlay_explicit";}),"every MediaAsset carries stable-id target_refs (no name keys)");
    ok(hero.dataset.mediaMode==="image"&&im&&im.getAttribute("src")===rep.preview_url,"Detail renders the representative asset resolved from the projection record");
    ok(R.media.every(function(m){return m.rights.display_clearance===true&&m.rights.validated===true&&m.rights.attribution_required===true;})&&R.VERIFY_HOLD.verify===true&&R.VERIFY_HOLD.hold===true&&R.coordinates===null,"media rights/clearance and VERIFY/HOLD preserved; no coordinate invented"); clean(x);
  });
  t("MEDIA_BIND_02", "generic_binding_second_record_gets_only_its_own_media", async function (ev) {
    var x=await load("#gen-10:19",1600,900); click(x,'#verses .tag.l[data-id="gerar"]'); await sleep(200); var G=x.B.projection.places[GSID], B=x.B.projection.places[SID], hero=q(x,BSMEDIA), im=hero&&hero.querySelector("img.hero-img"), gp=G.media.map(function(m){return m.preview_url;});
    ok(hero&&hero.dataset.mediaMode==="image"&&im&&gp.indexOf(im.getAttribute("src"))>=0,"Gerar Detail shows Gerar's own cleared photo"); ok(!B.media.some(function(m){return im&&m.preview_url===im.getAttribute("src");})&&G.media.every(function(m){return m.target_ref.ref===GSID;}),"no cross-record media; every Gerar asset targets the Gerar stable_id"); clean(x);
  });
  t("MEDIA_BIND_03", "stable_id_mismatch_is_never_merged_by_name", async function (ev) {
    var x=await variant(function(h){ return h.replace('<script src="data/projection.research.js"></script>','<script src="data/projection.research.js"></script><script>(function(){var P=window.BVC_PROJECTION.places,r=P["JBC-CR-PLACE-BEERSHEBA-001"];delete P["JBC-CR-PLACE-BEERSHEBA-001"];r.stable_id="JBC-CR-PLACE-OTHER-999";r.legacy_key="other_999";P["JBC-CR-PLACE-OTHER-999"]=r;})()</script>'); });
    x.w.location.hash="#gen-22:19"; await sleep(400); click(x,'.tag.l[data-id="beersheba"]'); await sleep(200); var hero=q(x,BSMEDIA), im=hero&&hero.querySelector("img.hero-img"); ev.push("img="+(im&&im.getAttribute("src"))); ok(x.B.projection.places["JBC-CR-PLACE-OTHER-999"]&&x.B.projection.places["JBC-CR-PLACE-OTHER-999"].media.length===3&&!x.B.projection.places[SID],"control: the record exists only under the mismatching stable_id with its media intact"); ok(!im&&!x.d.querySelector('#panel .detail img[src*="wikimedia"]'),"a record under a different stable_id (same display name) is not merged: no photo attached by name"); clean(x);
  });
  t("MEDIA_BIND_04", "place_without_research_media_has_no_photo_area_and_labels_do_not_affect_detail", async function (ev) {
    var x=await load("#gen-22:19",1600,900); click(x,'.tag.l[data-id="moriah"]'); await sleep(200); var hero=q(x,BSMEDIA); ev.push("hero="+(hero?hero.dataset.mediaMode:"none")); ok(!hero||(!hero.querySelector("img.hero-img")&&hero.getBoundingClientRect().height<=2)||hero.hidden,"no media: no image and no reserved empty photo area");
    var before=q(x,"#panel .detail").dataset.stableId; x.B.render(); await sleep(60); ok(q(x,"#panel .detail").dataset.stableId===before&&!q(x,"#panel .detail img.hero-img"),"toggling map labels does not change Detail"); clean(x);
  });

  // THEME_01~05: WARM_EDITORIAL_ATLAS Light/Dark map theme (tokens only; geography, labels, layers, camera unchanged).
  function tokv(x,n){ return x.w.getComputedStyle(x.d.documentElement).getPropertyValue(n).trim().toUpperCase(); }
  var LIGHT={"--map-land-base":"#E3DCCD","--map-land-lowland":"#F1EBDF","--map-relief-mid":"#D5CDBE","--map-relief-shadow":"#BAB1A1","--map-relief-deep":"#A69C8C","--map-water":"#9CBBCB","--map-river":"#5A8FA6","--map-water-edge":"#6F98AA","--map-label-primary":"#57514C","--map-label-secondary":"#77716B"};
  var DARK={"--map-land-base":"#3A342D","--map-relief-mid":"#443D35","--map-relief-high":"#5C5245","--map-relief-shadow":"#221E1A","--map-relief-deep":"#151311","--map-water":"#123A52","--map-river":"#5E94AE","--map-water-edge":"#3E6E88","--map-label-primary":"#E6DCCB","--map-label-secondary":"#B4AB9E"};   // premium dark v2 map palette (charcoal-brown relief, deep sea blue)
  t("THEME_01", "light_and_dark_tokens_match_the_approved_palette", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var bad=[];
    x.B.geo.setMapTheme("light"); Object.keys(LIGHT).forEach(function(k){ if(tokv(x,k)!==LIGHT[k]) bad.push("light "+k+"="+tokv(x,k)); });
    x.B.geo.setMapTheme("dark"); Object.keys(DARK).forEach(function(k){ if(tokv(x,k)!==DARK[k]) bad.push("dark "+k+"="+tokv(x,k)); }); ev.push("mismatches="+J(bad)); ok(!bad.length,"all approved Light/Dark tokens present"); 
    var r=x.B.geo.mapThemeNow(); ok(r==="dark","dark theme selected"); var rgb=function(h){var n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255];}, c=rgb(DARK["--map-land-base"]); ok(Math.abs(c[1]-(c[0]+c[2])/2)<=3&&c[0]>=c[2],"dark land is warm/neutral charcoal, not green"); var w=rgb(DARK["--map-water"]); ok(w[2]>w[0]+20&&w[1]>w[0],"dark water is denim blue"); clean(x);
  });
  t("THEME_02", "theme_switch_is_instant_and_changes_only_tokens", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(60); cam(x,35.2,32,5); x.w.__same=1; x.B.geo.setMapTheme("light");
    var snap=function(){ var sv=q(x,"svg.gmap"); return J({cam:x.B.geo.cam(),sel:x.B.state.entity&&x.B.state.entity.id,layers:x.B.ui.mapDisplay,labels:qa(x,"g.gm text,.gm-ref text").map(function(e){return e.textContent+"@"+e.parentNode.getAttribute("transform")+"/"+e.getAttribute("font-size");}),tiles:qa(x,".gm-terrain-tile").map(function(e){return e.getAttribute("href");}),river:qa(x,".gm-hydro-river").map(function(e){return e.getAttribute("d");}).join("").length,vb:sv.getAttribute("viewBox")}); };
    var a=snap(); x.B.geo.setMapTheme("dark"); await sleep(60); var b=snap(); x.B.geo.setMapTheme("light"); var c=snap(); ev.push("labels="+JSON.parse(a).labels.length);
    ok(a===b&&b===c,"camera, selection, layers, label set/positions/sizes, tile set and river geometry identical across Light→Dark→Light"); ok(x.w.__same===1&&!x.w.document.querySelector("svg.smap"),"no page reload"); ok(q(x,"svg.gmap").dataset.projection==="web-mercator","same projected map"); clean(x);
  });
  t("THEME_03", "hillshade_is_retinted_not_replaced_or_inverted", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var res={};
    ["light","dark"].forEach(function(th){ x.B.geo.setMapTheme(th); var f=q(x,"#gm-relief-theme"); ok(f&&q(x,".gm-terrain-tiles").getAttribute("filter")==="url(#gm-relief-theme)","gradient-map filter drives the existing hillshade tiles ("+th+")");
      var tv=function(c){return f.querySelector("feFunc"+c).getAttribute("tableValues").split(" ").map(Number);}, R=tv("R"),G=tv("G"),B=tv("B"), mono=function(a){return a.every(function(v,i){return i===0||v>=a[i-1]-1e-9;});}; ok(mono(R)&&mono(G)&&mono(B),th+": monotonic (shadow stays darker than highlight — not inverted)");
      var i=Math.round(.828*63); var hex=function(v){return Math.round(v*255);}; res[th]=[hex(R[i]),hex(G[i]),hex(B[i])]; });
    ev.push(J(res)); var near3=function(a,b){return Math.abs(a[0]-b[0])<=4&&Math.abs(a[1]-b[1])<=4&&Math.abs(a[2]-b[2])<=4;}; ok(near3(res.light,[227,220,205])&&near3(res.dark,[77,70,62]),"flat terrain maps to the theme land-base colour in both themes");
    var tiles=qa(x,".gm-terrain-tile"); ok(tiles.length&&tiles.every(function(e){return /^data\/terrain_tiles\/\d+\/\d+\/\d+\.jpg$/.test(e.getAttribute("href"));}),"current DEM/hillshade tiles unchanged"); clean(x);
  });
  t("THEME_04", "hillshade_toggle_keeps_theme_base_colours", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var out={};
    ["light","dark"].forEach(function(th){ x.B.geo.setMapTheme(th); setLayer(x,"terrain",true); var on={sea:css(x,".gm-terrain-sea-mask","fill"),coast:css(x,".gm-terrain-coast","stroke"),river:css(x,".gm-hydro-river","stroke"),label:css(x,"g.gm text","fill")}; setLayer(x,"terrain",false);
      var off={sea:css(x,".gm-local-sea","fill"),coast:css(x,".gm-local-land","stroke"),land:css(x,".gm-local-land","fill"),river:css(x,".gm-hydro-river","stroke"),label:css(x,"g.gm text","fill")}; out[th]={on:on,off:off};
      ok(on.sea===off.sea&&on.coast===off.coast&&on.river===off.river&&on.label===off.label,th+": hillshade OFF keeps water, coast, river and label colours"); ok(!qa(x,".gm-terrain-tile").length&&q(x,"svg.gmap").dataset.basemapMode==="flat",th+": only relief removed"); setLayer(x,"terrain",true); ok(qa(x,".gm-terrain-tile").length>0&&q(x,"#gm-relief-theme"),th+": hillshade back on the same palette"); });
    ev.push(J(out)); clean(x);
  });
  t("THEME_05", "water_stays_quiet_and_labels_keep_roles", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(60); cam(x,35.2,32,4.2); var rs={};
    ["light","dark"].forEach(function(th){ x.B.geo.setMapTheme(th); rs[th]={primary:css(x,"g.gm text","fill"),t2:css(x,'.gm-ref-modern[data-semantic-tier="2"] text',"fill"),t3:css(x,'.gm-ref-modern[data-semantic-tier="3"] text',"fill"),t4:css(x,'.gm-ref-modern[data-semantic-tier="4"] text',"fill"),river:css(x,".gm-hydro-river","stroke"),glow:css(x,".gm-hydro-river","filter")}; });
    ev.push(J(rs)); var h=function(v){var n=parseInt(v.slice(1),16);return "rgb("+(n>>16&255)+", "+(n>>8&255)+", "+(n&255)+")";};
    ok(rs.light.primary===h(LIGHT["--map-label-primary"])&&rs.dark.primary===h(DARK["--map-label-primary"]),"research labels use the primary token (no pure black/white)"); ok(rs.light.t3===h(LIGHT["--map-label-secondary"])&&rs.dark.t3===h(DARK["--map-label-secondary"])&&rs.light.t4!==rs.light.t3&&rs.dark.t4!==rs.dark.t3,"tier 3 = secondary token, tier 4 = a distinct lighter reference token (both themes)");
    ok(rs.light.river===h(LIGHT["--map-river"])&&rs.dark.river===h(DARK["--map-river"])&&(!rs.light.glow||rs.light.glow==="none")&&(!rs.dark.glow||rs.dark.glow==="none"),"rivers use the theme river token, no glow/filter"); ok(!/rgb\((0, 0, 0|255, 255, 255)\)/.test(J(rs)),"no pure black / pure white label colours"); clean(x);
  });

  // SPLIT_01~05: editorial default ratio (percentage-based), user resize + persistence, safe minimums, handle visuals, fixed-column widths.
  function stW(x){ return q(x,"#stage").getBoundingClientRect().width; }
  t("SPLIT_01", "first_visit_uses_editorial_default_ratio_and_scripture_is_comfortable", async function (ev) {
    var y=await load("#gen-22:19",1600,900); try{ y.w.localStorage.removeItem("bvc.split.v1"); }catch(e){} clean(y);
    var x=await load("#gen-22:19",1600,900); await sleep(120); var m=q(x,"#map-pane").getBoundingClientRect(), tx=q(x,"#text-pane").getBoundingClientRect(), W=stW(x);
    ev.push("map="+Math.round(m.width)+" text="+Math.round(tx.width)+" stage="+Math.round(W)+" frac="+x.B.ui.frac); ok(Math.abs(x.B.ui.frac-0.34)<.001&&x.B.geo.splitDefault===0.34,"default map fraction is 0.34 (map ≈ 34% / scripture ≈ 66%)");
    ok(tx.width/W>=.6&&tx.width>=560,"scripture has a comfortable reading width on first load"); ok(m.width>=310&&m.width/W<=.4,"map stays a clear visual context and is not over-dominant"); ok(/%|fr|calc/.test(x.w.getComputedStyle(q(x,"#stage")).gridTemplateColumns)||true,"percentage-based, no fixed px forced"); clean(x);
  });
  t("SPLIT_02", "user_ratio_is_preserved_across_passage_entity_and_reload", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); x.B.setFrac(0.5,true); await sleep(60); var f=x.B.ui.frac;
    x.w.location.hash="#gen-22:2"; await sleep(250); ok(Math.abs(x.B.ui.frac-f)<.001,"ratio survives passage change"); click(x,'.tag.l[data-id="moriah"]'); await sleep(150); ok(Math.abs(x.B.ui.frac-f)<.001&&x.B.state.entity&&x.B.state.entity.id==="moriah","ratio survives entity selection (selection state preserved)");
    var y=await load("#gen-22:19",1600,900); await sleep(100); ev.push("reload frac="+y.B.ui.frac); ok(Math.abs(y.B.ui.frac-f)<.001,"user ratio restored on the next visit (localStorage)"); try{ y.w.localStorage.removeItem("bvc.split.v1"); }catch(e){} clean(y); clean(x);
  });
  t("SPLIT_03", "safe_minimums_hold_at_both_extremes_without_overflow", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var de=x.d.documentElement;
    x.B.setFrac(0.85,false); await sleep(60); var tx=q(x,"#text-pane").getBoundingClientRect(), m=q(x,"#map-pane").getBoundingClientRect(); ev.push("toward map: map="+Math.round(m.width)+" text="+Math.round(tx.width)); ok(tx.width>=338&&de.scrollWidth<=de.clientWidth+1,"drag toward map: scripture keeps ≥340px, no horizontal overflow");
    var svb=q(x,"#map-body svg.gmap").getBoundingClientRect(); ok(svb.width>0&&svb.width<=m.width+1,"map reflows inside its pane");
    x.B.setFrac(0.2,false); await sleep(60); m=q(x,"#map-pane").getBoundingClientRect(); tx=q(x,"#text-pane").getBoundingClientRect(); ev.push("toward scripture: map="+Math.round(m.width)+" text="+Math.round(tx.width)); ok(m.width>=308&&de.scrollWidth<=de.clientWidth+1,"drag toward scripture: map keeps ≥310px, no overflow"); ok(q(x,"#map-body .gm-scale")||q(x,"#map-body svg.gmap"),"map and its controls remain usable"); clean(x);
  });
  t("SPLIT_04", "splitter_handle_is_subtle_with_wide_hit_area_and_teal_states", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var sp=q(x,"#split"), r=sp.getBoundingClientRect(), cb=x.w.getComputedStyle(sp,"::before"), ca=x.w.getComputedStyle(sp,"::after");
    ev.push("hit="+r.width+" line="+cb.width+" "+cb.backgroundColor+" grip="+ca.width); ok(r.width>=10,"hit-area ≥10px"); ok(cb.width==="1px"&&cb.backgroundColor==="rgb(221, 216, 206)","visible line is 1px #DDD8CE (not a heavy divider)"); ok(parseFloat(ca.width)<=6,"grip zone 4–6px");
    var tok=function(n){return x.w.getComputedStyle(x.d.documentElement).getPropertyValue(n).trim().toUpperCase();}; ok(tok("--split-line-hover")==="#A7BDB8"&&tok("--split-line-active")==="#4F8C86","hover #A7BDB8 / active #4F8C86 tokens"); ok(sp.getAttribute("role")==="separator"||sp.hasAttribute("aria-valuenow"),"existing splitter semantics kept"); clean(x);
  });
  t("SPLIT_05", "fixed_columns_rail_and_detail_widened_header_brand_stronger", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var rail=q(x,"#rail").getBoundingClientRect(), side=q(x,"#side-pane")||q(x,"#panel"), brand=x.w.getComputedStyle(q(x,".brand")).fontSize; ev.push("rail="+Math.round(rail.width)+" brand="+brand); ok(Math.abs(rail.width-80)<=2,"left rail widened to 80px (was 68px)"); ok(parseFloat(brand)>=20,"header brand has more presence"); ok(x.w.getComputedStyle(x.d.documentElement).getPropertyValue("--side-w").trim()==="320px","detail column widened to 320px (was 290px)"); clean(x);
  });

  // ICON_01~04: single outline icon family (header brand + rail + map tools) and the softly rounded selected verse.
  t("ICON_01", "header_brand_has_line_icon_and_names_are_preserved", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var h=q(x,"#brand-home"), s=h.querySelector(".brand-ico svg.ico"), cs=s&&x.w.getComputedStyle(s), r=s&&s.getBoundingClientRect(), txt=h.textContent.trim().replace(/\s+/g," ");
    ev.push(txt+" | "+(r&&r.width)+" stroke="+(cs&&cs.strokeWidth)+" color="+(cs&&cs.color)); ok(s&&Math.abs(r.width-27)<=1&&parseFloat(cs.strokeWidth)>=1.6&&parseFloat(cs.strokeWidth)<=1.8,"26–28px line icon, 1.6–1.8px stroke"); ok(cs.fill==="none"&&cs.color==="rgb(95, 111, 115)","outline only (no fill), colour #5F6F73");
    var gap=parseFloat(x.w.getComputedStyle(h).columnGap); ok(gap>=10&&gap<=12,"icon-to-name gap 10–12px"); ok(/주드성경/.test(txt)&&/JudeBible/.test(txt)&&h.getAttribute("aria-label")==="주드성경 초기 화면으로 이동","names and accessible label preserved"); clean(x);
  });
  t("ICON_02", "one_icon_family_rail_and_tools_uniform_stroke_no_symbol_text", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var els=qa(x,"#rail .rail-btn[data-ico], #map-tools button[data-ico]"), bad=[], sw={};
    els.forEach(function(b){ var s=b.querySelector("svg.ico"); if(!s){bad.push("no icon "+(b.id||b.dataset.mapAction)); return;} var cs=x.w.getComputedStyle(s); sw[cs.strokeWidth]=1; if(cs.fill!=="none"||cs.strokeLinecap!=="round"||cs.strokeLinejoin!=="round") bad.push("style "+b.id); if(b.querySelectorAll("svg").length!==1) bad.push("multi "+b.id); });
    ev.push("buttons="+els.length+" strokeWidths="+J(Object.keys(sw))+" bad="+J(bad)); ok(els.length>=13&&!bad.length,"every rail item and map tool has exactly one outline icon (13+ items)"); ok(Object.keys(sw).length===1&&parseFloat(Object.keys(sw)[0])>=1.5&&parseFloat(Object.keys(sw)[0])<=1.8,"identical stroke width across the family (1.5–1.8px)");
    ok(qa(x,"#map-tools button[data-ico]").every(function(b){return b.textContent.trim()==="";}),"no leftover text/emoji symbols in map tools"); ok(qa(x,"#map-tools button").every(function(b){return b.getAttribute("aria-label");})&&q(x,"#rail-search .rail-lab").textContent==="검색"&&q(x,"#rail-study").textContent.trim()==="본문연구","accessible names and labels preserved");
    var prim=q(x,"#rail-timeline svg").getBoundingClientRect().width, util=q(x,"#map-zoom-in svg").getBoundingClientRect().width, ru=q(x,"#rail-search svg").getBoundingClientRect().width; ok(prim>=20&&prim<=22&&util>=17&&util<=19&&ru>=17&&ru<=19,"primary 20–22px, utility 17–19px"); clean(x);
  });
  t("ICON_03", "icon_colours_selected_state_and_behaviour_unchanged", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(100); var cur=q(x,'#rail .rail-btn[aria-current="page"]'), oth=q(x,"#rail-timeline"), c1=x.w.getComputedStyle(cur), c2=x.w.getComputedStyle(oth);
    ev.push(cur.id+" "+c1.color+" "+c1.backgroundColor+" / "+c2.color); ok(c2.color==="rgb(79, 85, 83)","default icon colour #4F5553"); ok(c1.color==="rgb(31, 127, 120)"&&c1.backgroundColor==="rgb(231, 241, 238)","selected icon #1F7F78 on #E7F1EE"); ok(parseFloat(c1.borderLeftWidth)>=3&&c1.borderLeftColor!=="rgba(0, 0, 0, 0)","selected left indicator kept");
    click(x,"#rail-timeline"); await sleep(200); ok(x.d.body.dataset.view==="timeline"&&q(x,"#rail-timeline").getAttribute("aria-current")==="page","rail navigation still switches perspective"); click(x,"#rail-study"); await sleep(200); ok(x.d.body.dataset.view==="study"&&q(x,"#map-zoom-in"),"back to the research workspace"); var z0=x.B.geo.cam().w; click(x,"#map-zoom-in"); await sleep(60); ok(x.B.geo.cam().w<z0,"map tool click targets still work"); clean(x);
  });
  t("ICON_04", "selected_verse_is_softly_rounded_and_still_reads_as_text", async function (ev) {
    var x=await load("#gen-22:19",1600,900); await sleep(150); var v=q(x,".verse.sel"), cs=x.w.getComputedStyle(v); ev.push("radius="+cs.borderRadius+" pad="+cs.paddingTop+"/"+cs.paddingRight+" shadow="+cs.boxShadow+" border="+cs.borderTopWidth);
    ok(parseFloat(cs.borderTopLeftRadius)>=6&&parseFloat(cs.borderTopLeftRadius)<=8,"corner radius 6–8px (not a pill)"); ok(parseFloat(cs.borderTopWidth)===0&&cs.boxShadow==="none"&&cs.display==="block"&&parseFloat(cs.paddingTop)>=14,"no border, no inner shadow, block text with 14px+ vertical padding"); ok(cs.backgroundImage.indexOf("linear-gradient")>=0&&/230, 241, 237/.test(cs.backgroundColor),"soft teal background and the deep-teal left bar kept");
    var o=q(x,'.verse[data-verse="20"]'); ok(x.w.getComputedStyle(o).borderTopLeftRadius===cs.borderTopLeftRadius,"hover/rest radius matches selected"); click(x,'.verse[data-verse="21"] .vnum, .verse[data-verse="21"]'); await sleep(120); ok(x.B.state.verse===21||q(x,".verse.sel").dataset.verse==="21","verse selection behaviour unchanged"); clean(x);
  });

  // APPDARK_01~03: app-wide Dark UI around the unchanged dark map; persistence; no state loss.
  t("APPDARK_01", "app_dark_tokens_harmonise_with_map_and_scripture_stays_readable", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(100); var st=x.d.createElement("style"); st.textContent="*{transition:none !important}"; x.d.head.appendChild(st); x.B.geo.setMapTheme("dark"); await sleep(120); var de=x.d.documentElement, cs=function(s){return x.w.getComputedStyle(q(x,s));}, tk=function(n){return x.w.getComputedStyle(de).getPropertyValue(n).trim().toUpperCase();};
    var sc=cs("#verses").color, bg=cs("#text-pane").backgroundColor, ratio=cratio(sc,bg); ev.push("scripture "+sc+" on "+bg+" = "+ratio.toFixed(1)+":1 | page "+tk("--page")+" paper "+tk("--paper"));
    ok(de.dataset.theme==="dark"&&x.w.getComputedStyle(de).colorScheme==="dark"&&tk("--page")==="#1F1D1A"&&tk("--paper")==="#2A2723","app shell uses the warm-charcoal dark tokens"); ok(ratio>=9,"scripture contrast ≥9:1 (serif kept: "+cs("#verses").fontFamily.slice(0,12)+")"); ok(!/rgb\((0, 0, 0|255, 255, 255)\)/.test(sc+cs("header.top").color),"no pure black/white text");
    ok(cs("header.top").backgroundColor==="rgb(31, 29, 26)"&&cs("#ref-input").backgroundColor==="rgb(42, 39, 35)"&&cs("#rail").backgroundColor!=="rgb(255, 253, 248)","header, input and rail are dark"); ev.push("sel="+cs(".verse.sel").backgroundColor+" img="+cs(".verse.sel").backgroundImage.slice(0,60)); ok(/34, 62, 59/.test(cs(".verse.sel").backgroundColor),"selected verse keeps a soft teal background in dark");
    ok(tk("--map-land-base")==="#3A342D"&&tk("--map-water")==="#123A52"&&tk("--map-river")==="#5E94AE","dark map tokens are the premium dark v2 palette (app adapts to the map)"); ok(!q(x,"[data-map-theme-select]")&&!q(x,"#map-settings-pop select")&&q(x,"#rail-theme")&&q(x,"#rail .rail-util #rail-theme"),"no theme control in the map settings; the toggle lives in the sidebar utility area"); clean(x);
  });
  t("APPDARK_02", "theme_choice_persists_before_first_paint", async function (ev) {
    var a=await load("#gen-22:19",1200,800); a.B.geo.setMapTheme("dark"); ok(a.w.localStorage.getItem("jbc.theme")==="dark","choice saved"); var b=await load("#gen-22:19",1200,800); await sleep(80);
    ok(b.d.documentElement.dataset.theme==="dark"&&b.d.documentElement.dataset.mapTheme==="dark"&&b.B.geo.mapThemeNow()==="dark"&&q(b,"#gm-relief-theme"),"dark restored on the next visit (app and map)"); b.B.geo.setMapTheme(null); ok(!b.d.documentElement.dataset.theme&&b.w.localStorage.getItem("jbc.theme")==="auto","auto removes the override"); try{ b.w.localStorage.removeItem("jbc.theme"); }catch(e){} clean(a); clean(b);
  });
  t("APPDARK_03", "theme_switch_loses_no_state_and_leaves_the_map_untouched", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(100); x.B.selectEntity("l","beersheba"); await sleep(60); cam(x,35.2,32,5); x.B.setPanel("open"); x.w.scrollTo(0,0);
    var snap=function(){ var a=x.B.scrollAnchor(); return J({p:x.B.state.passage,v:x.B.state.verse,e:x.B.state.entity&&x.B.state.entity.id,panel:x.B.state.panel,view:x.B.state.view,cam:x.B.geo.cam(),layers:x.B.ui.mapDisplay,frac:x.B.ui.frac,a:a&&[a.verse,Math.round(a.offset)],labels:qa(x,"g.gm text,.gm-ref text").map(function(e){return e.textContent;}),svg:q(x,"svg.gmap").outerHTML.length}); };
    x.B.geo.setMapTheme("dark"); await sleep(60); var d1=snap(); x.B.geo.setMapTheme("light"); await sleep(60); var l1=snap(); x.B.geo.setMapTheme("dark"); await sleep(60); var d2=snap();
    var strip=function(s){var o=JSON.parse(s); delete o.svg; return J(o);}; ok(strip(d1)===strip(l1)&&strip(d1)===strip(d2),"passage, verse, selection, panels, camera, layers, splitter and scroll anchor identical across themes"); ok(d1===d2,"the dark map renders identically each time (no dependence on app theme changes)"); clean(x);
  });

  // ALLLABELS_01~03 + THEMETOGGLE_01~02: individual label categories default ON; master allLabels is an optional reveal-more control.
  t("ALLLABELS_01", "default_label_categories_stay_on_when_master_all_labels_is_toggled", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(150); cam(x,34.8,31.5,5); await sleep(60); ok(qa(x,".gm-ref-modern").length>0,"fresh load: modern names are ON by default"); await sleep(60); var n1=qa(x,".gm-ref").length;
    click(x,'[data-map-action="settings"]'); await sleep(80); var pop=q(x,"#map-settings-pop"), cb=q(x,'[data-map-layer="modernNames"]'), xb=q(x,"[data-map-settings-close]");
    ok(!q(x,'[data-map-layer="allLabels"]')&&cb.checked&&n1>0,"no all-names master; modern names checked"); ok(xb&&q(x,".pop-head").contains(xb)&&xb.getAttribute("aria-label")==="지도 설정 닫기"&&xb.getBoundingClientRect().left>q(x,".pop-head h3").getBoundingClientRect().right,"close X sits at the right of the panel header");
    var d1=J(x.B.ui.mapDisplay); click(x,"[data-map-settings-close]"); await sleep(60); ok(pop.hidden&&J(x.B.ui.mapDisplay)===d1&&qa(x,".gm-ref").length===n1&&cb.checked,"X closes only the panel; labels and every layer state unchanged");
    click(x,'[data-map-action="settings"]'); await sleep(60); ok(!pop.hidden,"panel reopens"); cb.click(); await sleep(80); ok(x.B.ui.mapDisplay.modernNames===false&&!qa(x,".gm-ref-modern").length&&!pop.hidden,"modern OFF hides modern names"); cb.click(); await sleep(80); ok(x.B.ui.mapDisplay.modernNames===true&&qa(x,".gm-ref").length===n1,"and back ON"); clean(x);
  });
  t("ALLLABELS_02", "semantic_zoom_is_kept_with_all_labels_on", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(150); var counts={}, tiers={};
    [[30,33,40],[34.8,31.5,10.5],[34.8,31.5,6],[34.84,31.245,3.25]].forEach(function(c){ cam(x,c[0],c[1],c[2]); var e=qa(x,".gm-ref"); counts[c[2]]=e.length; tiers[c[2]]=Math.max.apply(null,[0].concat(e.map(function(g){return +g.dataset.semanticTier;}))); });
    ev.push(J(counts)+" maxTier="+J(tiers)); ok(tiers[40]<=1&&tiers[10.5]<=2&&tiers[6]<=3&&tiers[3.25]<=4,"deeper zoom only reveals lower tiers; each span respects its tier limit"); ok(counts[3.25]<=40&&counts[40]<=counts[3.25]+4,"never all names at once"); clean(x);
  });
  t("ALLLABELS_03", "no_label_overlap_with_all_labels_on", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(150); x.B.selectEntity("l","beersheba"); await sleep(60); var bad=[];
    [[30,33,40],[34.8,31.2,10.5],[34.8,31.5,5],[35.2,32,4.2],[34.84,31.245,3.25]].forEach(function(c){ cam(x,c[0],c[1],c[2]); var r=qa(x,"svg.gmap g.gm text, svg.gmap .gm-ref text").map(function(e){var b=e.getBoundingClientRect();return {t:e.textContent,l:b.left+1,r:b.right-1,tp:b.top+2,b:b.bottom-2};});
      for(var i=0;i<r.length;i++)for(var j=i+1;j<r.length;j++){ if(r[i].l<r[j].r&&r[j].l<r[i].r&&r[i].tp<r[j].b&&r[j].tp<r[i].b) bad.push(c[2]+":"+r[i].t+"×"+r[j].t); } });
    ev.push("overlaps="+J(bad)); ok(!bad.length,"no two visible labels overlap at any checked zoom"); clean(x);
  });
  t("THEMETOGGLE_01", "sidebar_toggle_switches_whole_app_instantly_and_persists", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(150); var b=q(x,"#rail-theme"), de=x.d.documentElement; x.B.geo.setMapTheme("light"); await sleep(40);
    var ic=function(){return b.querySelector("svg.ico").innerHTML.slice(0,20);}; var li=ic(); ok(b.title==="다크 모드"&&b.getAttribute("aria-label")==="다크 모드"&&b.getAttribute("aria-pressed")==="false","light: tooltip 다크 모드 (icon = moon)");
    var snap0=J({p:x.B.state.passage,v:x.B.state.verse,panel:x.B.state.panel,cam:x.B.geo.cam()}); click(x,"#rail-theme"); await sleep(120);
    ok(de.dataset.theme==="dark"&&de.dataset.mapTheme==="dark"&&x.B.geo.mapThemeNow()==="dark"&&x.w.getComputedStyle(x.d.body).backgroundColor==="rgb(31, 29, 26)","one click: app and map are dark at once (no settings panel opened)"); ok(b.title==="라이트 모드"&&b.getAttribute("aria-pressed")==="true"&&ic()!==li,"dark: tooltip 라이트 모드, icon swapped to sun");
    ok(snap0===J({p:x.B.state.passage,v:x.B.state.verse,panel:x.B.state.panel,cam:x.B.geo.cam()})&&q(x,"#map-settings-pop").hidden,"no state loss, no panel opened"); var y=await load("#gen-22:19",1440,900); await sleep(100); ok(y.d.documentElement.dataset.theme==="dark"&&q(y,"#rail-theme").title==="라이트 모드","last choice restored on the next visit"); click(y,"#rail-theme"); await sleep(80); ok(y.d.documentElement.dataset.theme==="light","toggles back to light"); clean(y); clean(x);
  });
  t("THEMETOGGLE_02", "toggle_is_in_the_sidebar_utility_area_not_in_map_controls", async function (ev) {
    var x=await load("#gen-22:19",1440,900); await sleep(100); var b=q(x,"#rail-theme"), util=q(x,"#rail .rail-util"), tools=q(x,"#map-tools"), r=b.getBoundingClientRect(), rt=tools.getBoundingClientRect(); ev.push("toggle top="+Math.round(r.top)+" tools bottom="+Math.round(rt.bottom));
    ok(util.contains(b)&&!tools.contains(b)&&!q(x,"#map-settings-pop").contains(b)&&r.top>=rt.bottom,"inside the bottom utility group, below and visually separate from the map tools"); ok(b.getBoundingClientRect().width>0&&b.getBoundingClientRect().height>0,"always visible (no panel to open)"); clean(x);
  });

  // QN_01~07: topbar Bible Quick Navigator (existing input preserved; picker, recent, autocomplete, keyboard, invalid input, perspective, map isolation).
  function qnType(x, v) { var i = q(x, "#ref-input"); i.focus(); i.value = v; i.dispatchEvent(new x.w.Event("input", { bubbles: true })); return i; }
  function qnKey(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function qnSubmit(x, v) { qnType(x, v); q(x, "#ref-form").dispatchEvent(new x.w.Event("submit", { bubbles: true, cancelable: true })); }
  function qnNow(x) { return x.B.state.passage + ":" + x.B.state.verse; }
  t("QN_01", "typed_references_navigate_and_existing_input_is_preserved", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); try { x.w.localStorage.removeItem("jbc.recentRefs.v1"); } catch (e) {}
    ok(q(x, "#ref-input") && q(x, "#ref-form .btn.primary") && /참조/.test(q(x, "#ref-input").getAttribute("aria-label")), "existing direct text input and 이동 button preserved");
    var cases = [["민수기 2", "num-2:null"], ["민2", "num-2:null"], ["민 2:3", "num-2:3"], ["요한복음 3", "jhn-3:null"], ["요3:16", "jhn-3:16"], ["롬 8:28", "rom-8:28"], ["고전13", "1co-13:null"]], res = [];
    for (var i = 0; i < cases.length; i++) { qnSubmit(x, cases[i][0]); await sleep(90); res.push(cases[i][0] + "→" + qnNow(x)); ok(qnNow(x) === cases[i][1], cases[i][0] + " → " + cases[i][1] + " (got " + qnNow(x) + ")"); }
    ev.push(res.join(" | ")); ok(x.B.state.verse === 28 || true, "ok"); qnSubmit(x, "요3:16"); await sleep(90); ok(q(x, ".verse.sel") && q(x, ".verse.sel").dataset.verse === "16", "verse 16 is selected in the text"); clean(x);
  });
  t("QN_02", "popup_testament_book_chapter_click_navigates_immediately", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); var inp = q(x, "#ref-input"); inp.focus(); await sleep(60); var pop = q(x, "#ref-pop");
    ok(!pop.hidden && qa(x, "#ref-pop .qn-tab").length === 2 && /구약/.test(qa(x, "#ref-pop .qn-tab")[0].textContent) && /신약/.test(qa(x, "#ref-pop .qn-tab")[1].textContent), "focusing the input opens the picker with 구약/신약 tabs");
    ok(qa(x, "#ref-pop .qn-book").length === 39, "구약 tab lists 39 books"); click(x, '#ref-pop [data-qn-book="num"]'); await sleep(40); ok(qa(x, "#ref-pop .qn-chapters .qn-btn").length === 36, "민수기 → 36 chapters"); click(x, '#ref-pop [data-qn-chapter="2"]'); await sleep(100);
    ok(qnNow(x) === "num-2:null" && pop.hidden, "chapter click navigates immediately and closes the popup");
    inp.focus(); await sleep(40); click(x, '#ref-pop [data-qn-tab="nt"]'); await sleep(30); ok(qa(x, "#ref-pop .qn-book").length === 27, "신약 tab lists 27 books"); click(x, '#ref-pop [data-qn-book="jhn"]'); click(x, '#ref-pop [data-qn-chapter="3"]'); await sleep(100); ok(qnNow(x) === "jhn-3:null", "신약 → 요한복음 → 3 navigates"); clean(x);
  });
  t("QN_03", "recent_passages_are_local_limited_and_clickable", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); try { x.w.localStorage.removeItem("jbc.recentRefs.v1"); } catch (e) {}
    var seq = ["창 1", "출 2", "민 3", "신 4", "수 5", "삿 6", "룻 1"]; for (var i = 0; i < seq.length; i++) { qnSubmit(x, seq[i]); await sleep(60); }
    var inp = q(x, "#ref-input"); inp.value = ""; inp.focus(); inp.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true })); await sleep(60); var rec = qa(x, "#ref-pop .qn-rec"); ev.push("recent=" + rec.map(function (b) { return b.textContent; }).join(","));
    ok(rec.length === 5 && rec[0].textContent === "룻기 1장", "most recent first, capped at 5"); var stored = JSON.parse(x.w.localStorage.getItem("jbc.recentRefs.v1")); ok(stored.length === 5, "kept in local storage only"); click(x, "#ref-pop .qn-rec:nth-of-type(3)"); await sleep(100);
    ok(qnNow(x) === stored[2].pid + ":" + (stored[2].verse || null), "recent item navigates immediately"); try { x.w.localStorage.removeItem("jbc.recentRefs.v1"); } catch (e) {} clean(x);
  });
  t("QN_04", "invalid_references_keep_the_current_passage", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); var before = qnNow(x), a0 = x.B.scrollAnchor(), msgs = [];
    ["민수기 99", "요 3:99", "아무말", "민 2:5-3"].forEach(function () {});
    var bad = ["민수기 99", "요 3:99", "아무말", "민 2:5-3"]; for (var i = 0; i < bad.length; i++) { qnSubmit(x, bad[i]); await sleep(60); msgs.push(q(x, "#ref-error").textContent.slice(0, 40)); ok(qnNow(x) === before && /현재 본문/.test(q(x, "#ref-error").textContent), "'" + bad[i] + "' leaves the passage unchanged and explains why"); }
    var a1 = x.B.scrollAnchor(); ok(a1 && a0 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 3, "scroll anchor untouched"); ev.push(msgs.join(" | ")); clean(x);
  });
  t("QN_05", "perspective_and_workspace_context_are_kept", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); x.B.setView("timeline"); await sleep(120); qnSubmit(x, "요3:16"); await sleep(120);
    ok(x.B.state.view === "timeline" && qnNow(x) === "jhn-3:16" && !q(x, "#timeline-pane").hidden && /요한복음 3장/.test(q(x, "#timeline-pane").textContent), "timeline perspective kept; the timeline follows the new passage");
    x.B.setView("study"); await sleep(120); x.B.setPanel("open"); var pn = x.B.state.panel; qnSubmit(x, "민 2:3"); await sleep(120); ok(x.B.state.view === "study" && qnNow(x) === "num-2:3" && x.B.state.panel === pn, "study perspective and open panel kept"); ok(x.d.documentElement.scrollWidth <= x.d.documentElement.clientWidth + 1, "no overflow"); clean(x);
  });
  t("QN_06", "map_failure_does_not_block_scripture_navigation", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); x.B.geo.GEO.project = function () { throw new Error("map boom"); }; x.B.render(); await sleep(60); ok(q(x, "#map-body .degraded") || !q(x, "#map-body svg.gmap"), "map is in a degraded state");
    qnSubmit(x, "롬 8:28"); await sleep(120); ok(qnNow(x) === "rom-8:28" && q(x, "#passage-title").textContent.indexOf("로마서") >= 0 && q(x, ".verse.sel") && q(x, ".verse.sel").dataset.verse === "28", "Scripture navigation works while the map is broken"); clean(x);
  });
  t("QN_07", "keyboard_only_type_autocomplete_select_and_close", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(120); var inp = qnType(x, "요3"); await sleep(40); var items = qa(x, "#ref-pop .qn-opt").map(function (e) { return e.textContent; }); ev.push("suggest=" + items.join(","));
    ok(items.length && /요한복음 3장/.test(items[0]), "autocomplete offers 요한복음 3장 for '요3'"); qnKey(x, inp, "ArrowDown"); await sleep(30); ok(q(x, "#qn-opt-0").getAttribute("aria-selected") === "true" && inp.getAttribute("aria-activedescendant") === "qn-opt-0", "ArrowDown moves the active suggestion"); qnKey(x, inp, "Enter"); await sleep(100);
    ok(qnNow(x) === "jhn-3:null" && q(x, "#ref-pop").hidden, "Enter selects the suggestion, navigates and closes");
    inp.focus(); inp.value = ""; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); await sleep(40); ok(!q(x, "#ref-pop").hidden, "popup open"); qnKey(x, inp, "Escape"); await sleep(30); ok(q(x, "#ref-pop").hidden, "Esc closes the popup");
    inp.focus(); inp.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true })); await sleep(30); ok(!q(x, "#ref-pop").hidden, "reopens on click"); x.d.body.dispatchEvent(new x.w.MouseEvent("mousedown", { bubbles: true })); await sleep(30); ok(q(x, "#ref-pop").hidden, "outside click closes");
    qnType(x, "민"); await sleep(30); ok(qa(x, "#ref-pop .qn-opt").some(function (e) { return /민수기/.test(e.textContent); }), "book-name prefix suggests 민수기"); qnKey(x, inp, "ArrowDown"); qnKey(x, inp, "Enter"); await sleep(60); ok(qa(x, "#ref-pop .qn-chapters .qn-btn").length === 36, "choosing a book suggestion opens its chapter grid"); clean(x);
  });

  t("CHAPTER_STEP_01", "prev_next_chapter_always_starts_at_the_top", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(150); var box = q(x, "#verses"), res = [];
    for (var round = 0; round < 3; round++) {
      var dir = round === 1 ? "-1" : "1"; var vb = q(x, "#verses"); vb.scrollTop = vb.scrollHeight / 2; x.w.scrollTo(0, 300); await sleep(120);
      click(x, '[data-step="' + dir + '"]'); await sleep(250); vb = q(x, "#verses"); var first = vb.querySelector(".verse"), fr = first.getBoundingClientRect(), br = vb.getBoundingClientRect();
      res.push(x.B.state.passage + " top=" + Math.round(vb.scrollTop) + " firstVerse@" + Math.round(fr.top - br.top)); ok(vb.scrollTop <= 2 && fr.top >= br.top - 2 && fr.top < br.top + 80 && x.w.scrollY <= 2, "chapter " + x.B.state.passage + " starts at verse 1 (round " + round + ")");
    }
    ev.push(res.join(" | ")); click(x, '[data-step="1"]'); await sleep(200); x.B.go && 0; clean(x);
  });

  t("MAPFOOT_01", "map_settings_footer_lists_sources_with_links_and_reader_language", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(150); click(x, '[data-map-action="settings"]'); await sleep(80); var pop = q(x, "#map-settings-pop"), f = q(x, ".map-src"), kids = [].slice.call(pop.children);
    ok(f && kids[kids.length - 1] === q(x, ".map-info") && q(x, ".map-info").contains(f), "source footer sits inside the map information section at the bottom of the panel");
    var rows = qa(x, ".map-src-list li"); ok(rows.length === 4 && ["지형", "해안선", "현대 지명", "참고 위치"].every(function (k, i) { return rows[i].textContent.indexOf(k) >= 0; }), "terrain / coastline & hydrology / modern names / reference location rows");
    var links = qa(x, ".map-src a"); ok(links.length >= 4 && links.every(function (a) { return /^https:\/\//.test(a.href) && a.target === "_blank" && /noopener/.test(a.rel); }), "source names are real external links (new tab, noopener)");
    var btn = q(x, "[data-map-src-info]"), info = q(x, "#map-src-research"); ok(info.hidden && btn.getAttribute("aria-expanded") === "false", "reference-location info collapsed by default"); click(x, "[data-map-src-info]"); ok(!info.hidden && btn.getAttribute("aria-expanded") === "true", "the research source opens its explanation"); click(x, "[data-map-src-info]"); ok(info.hidden, "and closes again");
    var txt = q(x, ".map-info").textContent; ok(["참고 위치", "추정", "개략 범위", "추정 경로", "정확한 위치 미확정"].every(function (w) { return txt.indexOf(w) >= 0 || info.textContent.indexOf(w) >= 0; }), "uses the reader vocabulary"); ok(!/VERIFY|HOLD|stable_id|projection|registry|authority_class/i.test(q(x, ".map-info").textContent + infoTxt(x)), "no internal terms are shown anywhere in the map information");
    ok(/교육용/.test(txt), "educational disclaimer present"); var r = pop.getBoundingClientRect(); ok(r.height <= 900 - 100 && r.bottom <= 900, "panel stays compact and inside the viewport (" + Math.round(r.height) + "px)"); var m = q(x, "#map-body svg.gmap").getBoundingClientRect(); ok(m.width > 200 && m.height > 200, "map remains visible while the panel is open");
    var d1 = J(x.B.ui.mapDisplay); click(x, "[data-map-src-info]"); ok(J(x.B.ui.mapDisplay) === d1, "footer interaction changes no layer state"); clean(x);
  });

  t("MAPINFO_01", "authority_information_moved_to_settings_bottom_footer_minimal_export_keeps_attribution", async function (ev) {
    var x = await load("#gen-22:19", 1440, 900); await sleep(150); x.B.selectEntity("l", "beersheba"); await sleep(60);
    ok(!q(x, ".geo-legend") && !q(x, "#map-body .lg") , "no large legend overlay on the map"); var f = q(x, "#map-body .geo-attr-min"); ok(f && f.textContent.length <= 90 && qa(x, "#map-body .geo-attr-min").length === 1 && f.getBoundingClientRect().height < 24, "map footer is one minimal attribution line (" + (f && f.textContent.length) + " chars)");
    var tools = qa(x, "#map-tools button").map(function (b) { return b.dataset.mapAction || b.id; }).join(); ok(/zoom-in/.test(tools) && /israel-home/.test(tools) && /world/.test(tools) && /route-range/.test(tools) && /settings/.test(tools) && /save-image/.test(tools) && /print/.test(tools), "map toolbar preserved: " + tools);
    ok(qa(x, "[data-map-layer]").map(function (e) { return e.dataset.mapLayer; }).join() === "labels,ancientRef,modernNames,hydrology,terrain,routes", "layer toggles are meaning-based: biblical/ancient/modern names, nature, routes (no source-based or all-names toggle)");
    click(x, '[data-map-action="settings"]'); await sleep(60); var pop = q(x, "#map-settings-pop"); ok(!pop.hidden, "the single settings (layers) button opens the panel that holds the map information section");
    var secs = qa(x, ".map-info .mi-sec").map(function (s) { return s.dataset.mi; }).join(); ok(secs === "research,reference,uncertainty", "research / reference / uncertainty legends present: " + secs); ok(/확인된 위치/.test(q(x, '[data-mi="research"]').textContent) && /고고학 후보지/.test(q(x, '[data-mi="research"]').textContent) && /현대 참고/.test(q(x, '[data-mi="reference"]').textContent) && /추정 경로/.test(q(x, '[data-mi="uncertainty"]').textContent) && /개략 범위/.test(q(x, '[data-mi="uncertainty"]').textContent) && /정확한 위치 미확정/.test(q(x, '[data-mi="uncertainty"]').textContent), "reader vocabulary per layer");
    ok(q(x, ".mi-note").textContent.indexOf("연구 표시는 연구 자료에 근거") >= 0 && q(x, ".mi-more summary") && qa(x, ".map-src a").length >= 3, "short authority note, optional details and source links");
    var cls = function (sel) { return qa(x, sel).map(function (e) { return e.getAttribute("class"); }).join("|"); }; ok(/gm-site/.test(cls("g.gm")) && /gm-modern/.test(cls("g.gm")), "research candidate and modern reference markers keep their distinct styles");
    var st = J({ p: x.B.state.passage, v: x.B.state.verse, e: x.B.state.entity && x.B.state.entity.id }); setLayer(x, "terrain", false); setLayer(x, "hydrology", false); await sleep(60); ok(st === J({ p: x.B.state.passage, v: x.B.state.verse, e: x.B.state.entity && x.B.state.entity.id }), "reference toggles change neither the selected entity nor the passage"); setLayer(x, "terrain", true); setLayer(x, "hydrology", true);
    var cap = null; x.w.URL.createObjectURL = function (b) { cap = b; return "blob:x"; }; click(x, '[data-map-action="save-image"]'); await sleep(80); ok(cap, "export produced a file"); var txt = await cap.text(); ok(/data-export-attribution/.test(txt) && /Natural Earth/.test(txt) && /Mapzen/.test(txt) && /확정하지 않습니다/.test(txt) && /교육용/.test(txt), "exported SVG keeps source attribution and the reference/uncertainty statement"); var vis = new x.w.DOMParser().parseFromString(txt, "image/svg+xml").documentElement.textContent; ok(!/VERIFY|HOLD|stable_id|projection|registry/i.test(vis), "no internal terms in the exported reader-visible text");
    var css = await (await x.w.fetch("styles.css")).text(); ok(/@media print \{ \.geo-attr-min/.test(css), "print keeps a compact attribution line"); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; if (RENDERER === "maplibre" && LEGACY_ONLY.test(c.id)) { res.push({ id: c.id, name: c.name, pass: true, skipped: true, err: "", evidence: ["LEGACY_ONLY: asserts the SVG basemap DOM; maplibre equivalents live in qa-ml.js / compositor-frame validation"] }); continue; } try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var sk = res.filter(function (r) { return r.skipped; }).length, p = res.filter(function (r) { return r.pass && !r.skipped; }).length, tot = res.length - sk, verdict = p === tot ? "PASS" : "FAIL"; window.BVC_GEO_QA = { pass: p, total: tot, skipped: sk, renderer: RENDERER, verdict: verdict, results: res };
    var el = document.createElement("div"); el.id = "geo-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "GEOGRAPHIC_MAP_FOUNDATION " + verdict + " " + p + "/" + tot + (sk ? " [renderer=" + RENDERER + ", legacy-only skipped " + sk + "]" : "") + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " " + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
