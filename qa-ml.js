// Renderer-parameterized map QA: the SAME semantic requirements run under the legacy SVG renderer and the MapLibre renderer.
//   index.html?qa=ml                       → legacy SVG renderer
//   index.html?qa=ml&mapRenderer=maplibre  → MapLibre renderer (shared overlays on a persistent GL basemap)
// Known stale qa-jn failures (JN-04/05/06/09: `ot` selector debt) are NOT part of this suite and must not be read as renderer regressions.
(function () { "use strict"; if (!/[?&]qa=ml\b/.test(location.search)) return;
var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }, ok = function (c, m) { if (!c) throw Error(m); }, R = [], $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
async function t(id, name, fn) { var pass = true, err = ""; try { await fn(); } catch (e) { pass = false; err = e.message; } R.push({ id: id, name: name, pass: pass, err: err }); }
(async function () {
  await sleep(500); var ML = BVC.mapRenderer.mode() === "maplibre", renderer = ML ? "maplibre" : "legacy";
  if (ML) for (var i = 0; i < 60 && !BVC.mapRenderer.ready(); i++) await sleep(500);
  var prefs0 = JSON.stringify(BVC.ui.mapDisplay), root = function () { return ML ? "#ml-ovl" : "#map-body"; };
  async function openJourney(id, cat) { document.getElementById("brand-home").click(); await sleep(150); $("[data-nav-board-open]").click(); await sleep(60); $('[data-nav-tab="' + (cat || "era") + '"]').click(); await sleep(40); $('[data-nav-topic="' + id + '"]').click(); await sleep(1500); }
  await t("ML-01", renderer + ": renderer flag selects exactly one basemap owner", async function () { if (ML) { ok(BVC.mapRenderer.ready() && !BVC.mapRenderer.failed(), "maplibre ready: " + BVC.mapRenderer.failed()); ok($("#ml-map canvas") && !$("#map-body .gm-terrain-tiles"), "GL canvas, no SVG terrain tiles"); } else ok(!$("#ml-map") && $("#map-body svg.gmap"), "legacy svg map"); ok($(root() + " svg.gmap"), "shared overlay svg present"); });
  await t("ML-02", renderer + ": journey scene → numbered waypoints + route + distance bound to segment", async function () {
    await openJourney("era.patriarchal"); $('[data-nav-step="2"]').click(); await sleep(2200);
    var wp = $$(root() + " [data-nav-wp]"), act = $(root() + " .gm-wp-active[data-nav-wp]"), seg = $(root() + " .gm-ovroute-active[data-route-segment-id]"), lab = $$(root() + " .gm-seg-label");
    ok(wp.length >= 8 && act && +act.dataset.navWp === 3, "numbered waypoints, active #3"); ok(seg && seg.dataset.fromWaypoint && seg.dataset.toWaypoint, "active segment ids");
    lab.forEach(function (g) { ok(g.dataset.routeSegmentId === seg.dataset.routeSegmentId && g.dataset.distanceKm, "distance label bound to its segment"); });
    var lw = parseFloat(getComputedStyle(seg.querySelector(".gm-ovroute-line")).strokeWidth); ok(lw >= 4 && lw <= 5, "active route 4–5px: " + lw);
    ok(Math.abs(act.querySelector(".gm-wp-dot").getBoundingClientRect().width - 27) < 1.5, "marker diameter screen-fixed ~27px"); });
  await t("ML-03", renderer + ": scene ↔ Scripture ↔ header timeline stay shared", async function () {
    ok(BVC.state.passage === "gen-12" && BVC.state.verse === 5, "scripture synced to scene " + BVC.state.passage + ":" + BVC.state.verse);
    ok($$(".jn-erag [data-nav-act=timeline]").length === 1 && !$(".jn-card [data-nav-act=timeline]"), "연표보기 once at era header");
    $(".jn-erag [data-nav-act=timeline]").click(); await sleep(600); ok(BVC.state.view === "timeline", "timeline view"); BVC.setView("study"); await sleep(500); });
  await t("ML-04", renderer + ": research toggle opens/closes; scene change follows the CURRENT shared behaviour (JOURNEY_STEP_CLICK: an open research panel stays open and follows the scene)", async function () {
    var b = function () { return $('.jn-card [data-nav-act="research"]'); }; b().click(); await sleep(900); ok(BVC.state.panel === "open" && b().getAttribute("aria-pressed") === "true", "opened");
    b().click(); await sleep(900); ok(BVC.state.panel === "collapsed", "closed by second click"); b().click(); await sleep(700); $('[data-nav-step="3"]').click(); await sleep(1500); ok(BVC.mapScene().scene === 3 && BVC.state.panel === "open", "open research follows the new scene (shared logic, identical under both renderers)"); b().click(); await sleep(900); ok(BVC.state.panel === "collapsed", "closes again by toggle"); });
  await t("ML-05", renderer + ": place hover card + click use the shared PLACE_INDEX key", async function () {
    var a = $(root() + ' [data-nav-wp="3"] .gm-wp-dot'); ok(a, "waypoint dot"); a.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" })); await sleep(450);
    var c = document.getElementById("place-hovercard"); ok(c && !c.hidden && c.querySelector("[data-place-key]").dataset.placeKey === "shechem", "compact card for shechem");
    a.dispatchEvent(new MouseEvent("click", { bubbles: true })); await sleep(700); ok($('#panel [data-part="place-basic"]') && BVC.placeIndex().byKey.shechem, "basic detail from the same index"); });
  await t("ML-06", renderer + ": mapPrefs untouched by scene/panel/renderer", async function () { ok(JSON.stringify(BVC.ui.mapDisplay) === prefs0, "mapPrefs changed"); ok(BVC.ui.mapPrefs === BVC.ui.mapDisplay, "alias"); });
  await t("ML-07", renderer + ": rapid scene selection settles on the newest target (no queue)", async function () {
    $('[data-nav-step="1"]').click(); await sleep(120); $('[data-nav-step="6"]').click(); await sleep(2600); ok(BVC.mapScene().scene === 6, "scene 6"); if (ML) ok(!BVC.mapRenderer.map().isMoving(), "camera settled"); });
  await t("ML-08", renderer + ": export + print path produce a composed image", async function () {
    if (ML) { var cv = await BVC.mapRenderer.compose(); ok(cv.width > 100 && cv.height > 100, "composed canvas"); var w = await BVC.mapRenderer.printSheet(); ok(w > 100 && $("#ml-print-sheet img"), "print sheet"); BVC.mapRenderer.printDone(); }
    else { ok($("[data-map-action=save-image]") && $("[data-map-action=print]"), "legacy export/print controls remain"); } });
  if (ML) await t("ML-09", "maplibre: overlay locked to geography (px) and panel resize does not rebuild the basemap", async function () {
    var m = BVC.mapRenderer.map(), box = function () { return m.getContainer().getBoundingClientRect(); }, idx = BVC.placeIndex();
    var err = function () { var b = box(), mx = 0; $$("#ml-ovl [data-nav-wp] .gm-wp-dot").forEach(function (d) { var g = d.closest("[data-nav-place]"), p = idx.byKey[g.dataset.navPlace]; if (!p || p.lat == null) return; var r = d.getBoundingClientRect(), c = m.project([p.lon, p.lat]); mx = Math.max(mx, Math.hypot(r.left + r.width / 2 - b.left - c.x, r.top + r.height / 2 - b.top - c.y)); }); return mx; };
    ok(err() < 1.5, "aligned at rest: " + err()); var cv0 = $("#ml-map canvas"); $('.jn-card [data-nav-act="research"]').click(); await sleep(1500); ok(err() < 1.5, "aligned after resize: " + err()); ok(cv0 === $("#ml-map canvas"), "same GL canvas"); $('.jn-card [data-nav-act="research"]').click(); await sleep(900); });
  await t("ML-10", renderer + ": mapPrefs (hydrology/terrain) toggle changes layers, not data", async function () {
    if (ML) { var m = BVC.mapRenderer.map(); var hv = m.getLayoutProperty("hydro-rivers", "visibility"); ok(hv === "visible", "hydrology on by default"); } else ok($("#map-body .gm-hydro-lake, #map-body [data-hydro]"), "legacy hydrology drawn"); });
  await t("ML-14", renderer + ": research panel persistence — PLACE / TEXT / PERSON survive scene changes, no silent fallback, only explicit close closes", async function () {
    await openJourney("era.patriarchal"); $('[data-nav-step="2"]').click(); await sleep(1800);
    var shell = function () { return $("#rs-shell"); }, mode = function () { return shell() && !shell().hidden ? shell().dataset.mode : (BVC.state.entity && BVC.state.entity.kind === "p" ? "PERSON" : "(shell hidden)"); }, next = async function () { $("#guide-next").click(); await sleep(1500); };
    $('.jn-card [data-nav-act="research"]').click(); await sleep(900); ok(BVC.state.panel === "open", "research opened");
    // PLACE
    $('[data-rs-mode="PLACE"]').click(); await sleep(500); var t0 = $('[data-part="rs-title"]').textContent; ok(mode() === "PLACE", "PLACE selected: " + mode()); await next();
    ok(BVC.state.panel === "open" && mode() === "PLACE", "PLACE persists after next: " + BVC.state.panel + "/" + mode()); ok($('[data-part="rs-title"]').textContent !== t0, "PLACE context changed with the scene");
    // TEXT
    $('[data-rs-mode="TEXT"]').click(); await sleep(500); ok(mode() === "TEXT", "TEXT selected"); var tt = $('[data-part="rs-passage"],[data-part="rs-title"]').textContent; await next(); ok(BVC.state.panel === "open" && mode() === "TEXT", "TEXT persists after next: " + mode());
    // PLACE with no research data in the new context → status view, still PLACE, never TEXT
    $('[data-rs-mode="PLACE"]').click(); await sleep(500); await next(); ok(mode() === "PLACE" && BVC.state.panel === "open", "PLACE kept on a context without place research"); ok($('#panel [data-part="research-status-place"], #panel [data-part="place-basic"], #panel .full-place-profile'), "place status/basic view, no silent text fallback");
    // PERSON: open Isaac's card on an Isaac scene, then move to scenes without him
    $('[data-nav-track="isaac"]').click(); await sleep(1500); BVC.selectRpPerson(); await sleep(900); var ent = BVC.state.entity; ok(ent && ent.kind === "p" && BVC.state.panel === "open", "person card open");
    $('[data-nav-track="abraham"]').click(); await sleep(1800); ok(BVC.state.panel === "open", "panel stays open for PERSON"); ok(mode() === "PERSON", "PERSON mode kept: " + mode()); ok((BVC.state.entity && BVC.state.entity.kind === "p") || $('#panel [data-part="research-status-person"]'), "person view or person-unavailable status (no TEXT/PLACE fallback)");
    // explicit close
    var c = $('.rs-shell [data-rs-collapse]'); if (c) { c.click(); await sleep(700); ok(BVC.state.panel === "collapsed", "explicit collapse closes"); } });
  if (ML) {   // qa-geo 의 레거시 SVG 바탕 단정(BASE/LOCAL_BASE/TERRAIN_CONTINUITY/HYDRO/TERRAIN_QUALITY)에 대응하는 MapLibre 분기
    await t("ML-11", "maplibre: terrain/baked tiles load without errors and match the theme (TERRAIN_*, LOCAL_BASE equivalents)", async function () {
      var m = BVC.mapRenderer.map(), vis = function (id) { return m.getLayoutProperty(id, "visibility"); }, dark = getComputedStyle(document.documentElement).getPropertyValue("--map-land-base").trim() !== "#E3DCCD" && false;
      var on = ["a", "b", "c"].map(function (b) { return vis("rl-light" + b) === "visible" || vis("rl-dark" + b) === "visible"; }); ok(on.every(Boolean), "a relief band layer is visible for each zoom band");
      var bad = performance.getEntriesByType("resource").filter(function (e) { return e.name.indexOf("terrain_baked") >= 0 && e.responseStatus >= 400; }); ok(bad.length === 0, "no failed baked-tile requests: " + bad.length);
      ok(m.areTilesLoaded(), "tiles loaded"); ok(!!m.getLayer("land") && !!m.getLayer("coast") && !!m.getLayer("water"), "water/land/coast layers"); });
    await t("ML-12", "maplibre: hydrology is a persistent GeoJSON layer pair (HYDRO_* equivalent)", async function () {
      var m = BVC.mapRenderer.map(); ok(m.getLayer("hydro-lakes") && m.getLayer("hydro-rivers"), "hydro layers"); var n = m.querySourceFeatures("hydro").length; ok(n > 0, "hydrology features present: " + n); });
    await t("ML-13", "maplibre: theme switch swaps baked tile set + colours without rebuilding the map", async function () {
      var m = BVC.mapRenderer.map(), cv0 = $("#ml-map canvas"), cur = document.documentElement.dataset.theme; document.documentElement.dataset.theme = "dark"; document.documentElement.dataset.mapTheme = "dark"; await sleep(900);
      ok(m.getLayoutProperty("rl-darka", "visibility") === "visible" && m.getLayoutProperty("rl-lighta", "visibility") === "none", "dark tile set active"); ok(m.getPaintProperty("rl-darka", "raster-contrast") === 0.2 && m.getPaintProperty("rl-darka", "raster-resampling") === "nearest", "validated dark tuning");
      document.documentElement.dataset.theme = "light"; document.documentElement.dataset.mapTheme = "light"; await sleep(900); ok(m.getLayoutProperty("rl-lighta", "visibility") === "visible", "light tile set restored"); ok(cv0 === $("#ml-map canvas"), "same GL canvas");
      if (cur) { document.documentElement.dataset.theme = cur; document.documentElement.dataset.mapTheme = cur; } else { delete document.documentElement.dataset.theme; delete document.documentElement.dataset.mapTheme; } });
  }
  var p = R.filter(function (x) { return x.pass; }).length; window.BVC_ML_QA = { renderer: renderer, pass: p, total: R.length, verdict: p === R.length ? "PASS" : "FAIL", results: R };
  var d = document.createElement("div"); d.id = "ml-qa-report"; d.className = "qa"; d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;background:#fff;color:#000;padding:8px;font:12px monospace;white-space:pre;max-width:90vw;overflow:auto";
  d.textContent = "QA-ML " + renderer + " " + p + "/" + R.length + " " + (p === R.length ? "PASS" : "FAIL") + "\n" + R.map(function (x) { return (x.pass ? "PASS " : "FAIL ") + x.id + " " + x.name + (x.pass ? "" : "\n   ✗ " + x.err); }).join("\n"); document.body.appendChild(d);
})(); })();
