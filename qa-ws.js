// 통합 작업공간 v0.2 검증. 실행: index.html?qa=ws (개발 모드 전용). 이번 요구(IMPLEMENT_LOCKED_BIBLE_CONTEXT_VIEWER_INTEGRATED_WORKSPACE_v0.2)에서 도출한 QA-WS-IMPL.
(function () {
  "use strict";
  if (!/[?&]qa=ws/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(hash, width, height) {
    return new Promise(function (res) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:" + (height || 800) + "px;border:0";
      f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 150); };
      f.src = "index.html?qa=fixture" + (hash || ""); host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function q(x, sel) { return x.d.querySelector(sel); }
  function qa(x, sel) { return [].slice.call(x.d.querySelectorAll(sel)); }
  function click(x, sel) { var e = typeof sel === "string" ? q(x, sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function rect(x, sel) { return (typeof sel === "string" ? q(x, sel) : sel).getBoundingClientRect(); }
  function cs(x, sel) { return x.w.getComputedStyle(q(x, sel)); }
  function ptr(x, el, type, cx) { el.dispatchEvent(new x.w.PointerEvent(type, { bubbles: true, cancelable: true, clientX: cx, clientY: 200, button: 0, pointerId: 7 })); }
  function snap(x) { var s = x.B.state; return J({ passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null, panel: s.panel, sheet: s.sheet }); }
  function activePins(x, root) { return [].map.call(x.d.querySelectorAll(root + " .pin.active"), function (p) { return p.dataset.id; }).join(","); }
  function guideCur(x) { var c = q(x, '#guide-pane [aria-current="step"]'); return c ? c.dataset.guideStep : null; }
  function anchorAt(x, n) { q(x, '[data-verse="' + n + '"]').scrollIntoView({ block: "start" }); return sleep(160); }
  async function drag(x, from, to) { var sp = q(x, "#split"); ptr(x, sp, "pointerdown", from); ptr(x, sp, "pointermove", to); await sleep(80); ptr(x, sp, "pointerup", to); await sleep(80); }

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "desktop_regions_rail_map_canvas_with_detail_overlay_scripture_guide", async function (ev) {
    for (var W of [1200, 1600]) {
      var x = await load("#gen-22:2", W, 800); ev.push("W=" + W + " default Detail closed: side display=" + cs(x, "#side-pane").display); ok(cs(x, "#side-pane").display === "none", "Detail must be closed by default");
      var m0 = rect(x, "#map-pane"), t0 = rect(x, "#text-pane"), f0 = x.B.ui.frac, cam0 = J(x.B.ui.cam); x.B.setPanel("open"); await sleep(120); var R = {};
      ["#rail", "#map-pane", "#split", "#text-pane", "#guide-pane"].forEach(function (s) { R[s] = rect(x, s); }); var d = rect(x, "#side-pane"), m = R["#map-pane"];
      ev.push("W=" + W + " x: " + J(Object.keys(R).map(function (k) { return k + "=" + Math.round(R[k].left) + "+" + Math.round(R[k].width); })) + " detail overlay=" + Math.round(d.left) + "+" + Math.round(d.width) + " (map " + Math.round(m.left) + "+" + Math.round(m.width) + ")");
      var order = ["#rail", "#map-pane", "#split", "#text-pane", "#guide-pane"];
      for (var i = 1; i < order.length; i++) { ok(R[order[i - 1]].width > 0 && R[order[i]].width > 0, order[i] + " not rendered"); ok(R[order[i]].left >= R[order[i - 1]].right - 1, order[i] + " overlaps/precedes " + order[i - 1]); }
      ok(q(x, "#map-pane #side-pane") && cs(x, "#side-pane").position === "absolute", "Detail must be an overlay inside the map pane"); ok(d.width > 0 && d.left >= m.left - 1 && d.right <= m.right + 1 && d.top >= m.top - 1 && d.bottom <= m.bottom + 1, "Detail overlay must sit inside the map canvas"); ok(d.width <= 341, "Detail overlay width should be about 300-340px: " + d.width);
      ok(Math.abs(rect(x, "#map-pane").width - m0.width) <= 1 && Math.abs(rect(x, "#map-pane").left - m0.left) <= 1 && Math.abs(rect(x, "#text-pane").left - t0.left) <= 1 && Math.abs(rect(x, "#text-pane").width - t0.width) <= 1 && x.B.ui.frac === f0 && J(x.B.ui.cam) === cam0, "opening Detail must not change map width, scripture position/width, split ratio or camera");
      ok(R["#text-pane"].width >= 300 && R["#map-pane"].width >= 150, "region too narrow"); ok(R["#guide-pane"].right <= W + 1, "guide overflows viewport"); ok(x.w.document.documentElement.scrollWidth <= W + 1, "horizontal page scroll");
      ok(cs(x, "#map-pane").position === "sticky" && cs(x, "#guide-pane").position === "sticky", "map/guide should be sticky"); ok(x.w.__errs.length === 0); clean(x);
    }
  });

  t("002", "draggable_divider_resizes_map_and_scripture_and_keeps_reading_anchor", async function (ev) {
    var x = await load("#gen-22", 1600, 800); try { x.w.localStorage.removeItem("bvc.split.v1"); } catch (e) {} x.B.setFrac(0.4, false); await sleep(60);
    await anchorAt(x, 12); var a0 = x.B.scrollAnchor(), hash0 = x.w.location.hash, st0 = snap(x), m0 = rect(x, "#map-pane").width, t0 = rect(x, "#text-pane").width, sp = rect(x, "#split");
    await drag(x, sp.left + 5, sp.left + 5 + 120); var m1 = rect(x, "#map-pane").width, t1 = rect(x, "#text-pane").width, a1 = x.B.scrollAnchor();
    ev.push("drag +120px: map " + Math.round(m0) + "→" + Math.round(m1) + " text " + Math.round(t0) + "→" + Math.round(t1) + " anchor " + J(a0) + "→" + J(a1) + " hash unchanged=" + (x.w.location.hash === hash0) + " state unchanged=" + (snap(x) === st0));
    ok(m1 > m0 + 80 && t1 < t0 - 80, "divider did not resize"); ok(a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 4, "reading anchor moved"); ok(x.w.location.hash === hash0 && snap(x) === st0, "workspace state/URL changed by split");
    var sp2 = rect(x, "#split"); await drag(x, sp2.left + 5, 5000); var tMin = rect(x, "#text-pane").width; ok(tMin >= 330, "scripture below minimum width: " + tMin);
    await drag(x, rect(x, "#split").left + 5, -5000); var mMin = rect(x, "#map-pane").width; ok(mMin >= 170, "map below minimum width: " + mMin); ev.push("clamped: text min=" + Math.round(tMin) + " map min=" + Math.round(mMin));
    var sep = q(x, "#split"), v0 = +sep.getAttribute("aria-valuenow"); sep.focus(); key(x, sep, "ArrowRight"); var v1 = +sep.getAttribute("aria-valuenow"); key(x, sep, "Enter"); var v2 = +sep.getAttribute("aria-valuenow");
    ev.push("keyboard: aria-valuenow " + v0 + "→" + v1 + " → reset " + v2); ok(v1 > v0 && v2 === 40 && sep.getAttribute("role") === "separator" && sep.tabIndex === 0, "keyboard separator failed");
    x.B.setFrac(0.3, true); var y = await load("#gen-22", 1600, 800); ev.push("reload restores split: " + Math.round(y.d.getElementById("stage").style.getPropertyValue("--map-frac") * 100) + "%"); ok(Math.abs(y.B.ui.frac - 0.3) < 0.001, "split not restored"); try { y.w.localStorage.removeItem("bvc.split.v1"); } catch (e) {} clean(y); clean(x);
  });

  t("003", "unlocated_moriah_selection_syncs_detail_guide_text_without_a_map_pin", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); click(x, '.tag.l[data-id="moriah"]'); await sleep(60);
    var det = q(x, '#panel .detail[data-id="moriah"]'), hist = x.w.location.hash;
    ev.push("after scripture place select: " + snap(x) + " detail=" + !!det + " guide step=" + guideCur(x) + " geo marker=" + !!q(x, '#map-body g.gm[data-place="moriah"]') + " hash=" + hist);
    ok(x.B.state.entity && x.B.state.entity.id === "moriah" && x.B.state.tab === "places", "entity/tab not set"); ok(det, "detail block missing"); ok(guideCur(x) === "0" && q(x, ".tag.l.active"), "guide/text out of sync");
    ok(!q(x, "#map-body svg.smap") && q(x, "#map-body svg.gmap") && !q(x, '#map-body g.gm[data-place="moriah"]'), "unlocated Moriah must not regain a sample/geographic point"); ok(/e=l\.moriah/.test(hist) && x.B.state.verse === 2, "url/verse state wrong");
    ok(x.w.__errs.length === 0); clean(x);
  });

  t("004", "left_detail_panel_selection_syncs_map_and_guide", async function (ev) {
    var x = await load("#gen-22", 1200, 800); x.B.setTab("places"); click(x, '#panel .item[data-id="moriah"]'); await sleep(60);
    ev.push("after card: " + snap(x) + " guide step=" + guideCur(x) + " detail=" + !!q(x, '#panel .detail[data-id="moriah"]') + " geo marker=" + !!q(x, '#map-body g.gm[data-place="moriah"]'));
    ok(guideCur(x) === "0" && q(x, '#panel .detail[data-id="moriah"]') && !q(x, '#map-body g.gm[data-place="moriah"]'), "selection/guide/detail sync must not invent a point for Moriah");
    click(x, "#panel [data-clear-entity]"); x.B.setTab("places"); click(x, '#panel .item[data-id="beersheba"]'); await sleep(60); ev.push("unlocated place: " + snap(x) + " map active=" + activePins(x, "#map-body") + " guide step=" + guideCur(x) + " pins=" + x.d.querySelectorAll("#map-body svg.smap .pin").length);
    ok(x.B.state.entity.id === "beersheba" && q(x, '#panel .detail[data-id="beersheba"]') && guideCur(x) === "1" && activePins(x, "#map-body") === "" && !q(x, '#map-body .pin[data-id="beersheba"]') && !q(x, '#map-body .map-note'), "unlocated place: Detail + guide sync, no pin, no persistent map notice");
    click(x, "#panel [data-clear-entity]"); x.B.setTab("people"); click(x, '#panel .item[data-id="abraham"]'); await sleep(40); ev.push("person: " + snap(x) + " detail=" + !!q(x, '#panel .detail[data-detail="p"]') + " map active=" + activePins(x, "#map-body") + " guide step=" + guideCur(x));
    ok(q(x, '#panel .detail[data-detail="p"]') && activePins(x, "#map-body") === "" && guideCur(x) === null, "person selection should clear place highlight"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("005", "guide_previous_next_drive_map_detail_history", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800), h0 = x.w.history.length;
    var prev = q(x, "#guide-prev"), next = q(x, "#guide-next"); ev.push("start: prev disabled=" + prev.disabled + " next disabled=" + next.disabled + " step=" + guideCur(x));
    click(x, "#guide-next"); await sleep(60); ev.push("next#1 → " + snap(x) + " step=" + guideCur(x) + " geo marker=" + !!q(x, '#map-body g.gm[data-place="moriah"]')); ok(x.B.state.entity.id === "moriah" && q(x, '#panel .detail[data-id="moriah"]') && guideCur(x) === "0" && !q(x, '#map-body g.gm[data-place="moriah"]'), "first step selects unlocated Moriah without inventing a marker");
    ok(q(x, "#guide-prev").disabled && !q(x, "#guide-next").disabled, "prev should be disabled at first step");
    click(x, "#guide-next"); await sleep(60); ev.push("next#2 → " + snap(x) + " map=" + activePins(x, "#map-body") + " step=" + guideCur(x)); ok(x.B.state.entity.id === "beersheba" && activePins(x, "#map-body") === "" && q(x, '#panel .detail[data-id="beersheba"]') && guideCur(x) === "1", "second step (Beersheba return, no map point)"); ok(q(x, "#guide-next").disabled && !q(x, "#guide-prev").disabled, "next should be disabled at last step");
    click(x, "#guide-next"); ok(x.B.state.entity.id === "beersheba", "next past end must not move");
    click(x, "#guide-prev"); await sleep(60); ok(x.B.state.entity.id === "moriah" && guideCur(x) === "0" && !q(x, '#map-body g.gm[data-place="moriah"]'), "prev failed or invented a Moriah marker");
    ok(x.B.state.verse === 2, "selected verse changed by guide"); ok(x.w.__errs.length === 0);
    x.w.history.back(); await sleep(200); ev.push("history.back → " + snap(x) + " step=" + guideCur(x)); ok(x.B.state.entity && x.B.state.entity.id === "beersheba" && guideCur(x) === "1", "browser back did not restore previous guide step");
    var stepBtn = q(x, '.g-step[data-guide-step="0"]'); click(x, stepBtn); await sleep(50); ok(x.B.state.entity.id === "moriah", "step list click failed"); clean(x);
  });

  t("006", "guide_and_map_do_not_disturb_scroll_anchor_or_verse", async function (ev) {
    var x = await load("#gen-22:10", 1200, 500); await anchorAt(x, 12); var a0 = x.B.scrollAnchor(), s0 = x.w.scrollY;
    click(x, "#guide-next"); await sleep(120); click(x, "#guide-next"); await sleep(120); var a1 = x.B.scrollAnchor();
    ev.push("anchor " + J(a0) + " → " + J(a1) + " scrollY " + s0 + "→" + x.w.scrollY + " verse=" + x.B.state.verse); ok(a0 && a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 4, "reading anchor moved by guide"); ok(x.B.state.verse === 10 && q(x, '.verse.sel[data-verse="10"]'), "verse selection lost");
    click(x, '#map-body g.gm-site'); await sleep(100); var a2 = x.B.scrollAnchor(); ok(a2 && a2.verse === a0.verse && Math.abs(a2.offset - a0.offset) <= 4, "reading anchor moved by approved geographic marker"); clean(x);
  });

  t("007", "passage_without_route_guide_and_map_degrade_gracefully", async function (ev) {
    var x = await load("#heb-11:17", 1200, 800); var g = q(x, "#guide-pane").textContent;
    ev.push("heb-11 navigation: state=" + q(x, "#guide-pane").dataset.navState + " categories=" + x.d.querySelectorAll("#guide-pane [data-nav-category]").length + " map empty note=" + /장소가 없습니다/.test(q(x, "#map-body").textContent) + " pins=" + x.d.querySelectorAll("#map-body .pin").length);
    ok(q(x, "#guide-pane").dataset.navState === "explore" && x.d.querySelectorAll("#guide-pane [data-nav-category]").length === 5 && !/이야기·주제가 없습니다/.test(g) && !q(x, "#guide-next") && /장소가 없습니다/.test(q(x, "#map-body").textContent), "no-story state: broader exploration, no empty-state sentence"); ok(!x.B.state.entity, "no selection was invented");
    var y = await load("#gen-90", 1200, 800); ok(y.w.__errs.length === 0); clean(y);
    var z = await load("#gen-22:2", 1200, 800); z.B.data.places.moriah.x = undefined; z.B.data.places.moriah.y = null; z.B.render(); ev.push("bad coords: map degraded note=" + !!q(z, "#map-body .degraded") + " guide still steps=" + z.d.querySelectorAll(".g-step").length);
    ok(q(z, "#map-body .degraded") && z.d.querySelectorAll(".g-step").length === 2 && z.d.querySelectorAll("#verses .verse").length > 10 && z.w.__errs.length === 0, "bad coordinate isolation failed"); clean(z); ok(x.w.__errs.length === 0); clean(x);
  });

  t("008", "detail_overlay_open_close_changes_no_layout_geographic_camera_or_scroll_and_guide_keeps_it_closed", async function (ev) {
    var x = await load("#gen-22:2", 1600, 800); await anchorAt(x, 12); await sleep(60);
    var sn = function () { var m = rect(x, "#map-pane"), t = rect(x, "#text-pane"), sp = rect(x, "#split"), svg = q(x, "#map-body svg.gmap"); return J([m.left, m.width, m.top, m.height, t.left, t.width, sp.left].map(Math.round)) + "|" + x.B.ui.frac + "|" + J(x.B.ui.gcam) + "|" + J(x.B.ui.layers) + "|" + (svg && svg.getAttribute("viewBox")) + "|" + x.w.scrollY; };
    var s0 = sn(), a0 = x.B.scrollAnchor(); x.B.setPanel("open"); await sleep(140); var s1 = sn(); x.B.setPanel("collapsed"); await sleep(140); var s2 = sn(); var a2 = x.B.scrollAnchor();
    ev.push("closed " + s0 + " | open " + s1 + " | closed " + s2); ok(s0 === s1 && s1 === s2, "Detail open/close must not change map size, scripture, split ratio, geographic camera, layers or scroll"); ok(a2 && a2.verse === a0.verse && a2.offset === a0.offset, "anchor moved");
    var y = await load("#gen-22:2", 1600, 800); var ys0 = J([rect(y, "#map-pane").width, rect(y, "#text-pane").left, y.B.ui.frac].map(Math.round)); click(y, '.tag.l[data-id="moriah"]'); await sleep(80); ok(y.B.state.panel === "open" && J([rect(y, "#map-pane").width, rect(y, "#text-pane").left, y.B.ui.frac].map(Math.round)) === ys0 && !q(y, '#map-body g.gm[data-place="moriah"]'), "explicit unlocated selection opens Detail without relayout or invented marker"); clean(y);
    var z = await load("#gen-22:2", 1400, 800); click(z, "#guide-next"); await sleep(80); ev.push("guide next while closed: panel=" + z.B.state.panel + " side display=" + cs(z, "#side-pane").display + " step=" + guideCur(z));
    ok(z.B.state.panel === "collapsed" && cs(z, "#side-pane").display === "none" && z.B.state.entity && z.B.state.entity.id === "moriah" && guideCur(z) === "0" && !q(z, '#map-body g.gm[data-place="moriah"]') && !/panel=/.test(z.w.location.hash), "guide step must not force Detail open or create a Moriah marker");
    click(z, "#panel-open"); await sleep(60); ok(z.B.state.panel === "open" && q(z, '#panel .detail[data-id="moriah"]'), "detail ready when the user opens it");
    click(z, "#panel-toggle"); await sleep(60); click(z, "#guide-next"); await sleep(60); ok(z.B.state.panel === "collapsed" && z.B.state.entity.id === "beersheba", "user-closed Detail stays closed on guide step");
    z.B.setPanel("open"); await sleep(60); click(z, "#guide-prev"); await sleep(60); ok(q(z, '#panel .detail[data-id="moriah"]') && z.B.state.panel === "open", "open Detail refreshes to the new selection"); ok(x.w.__errs.length === 0); clean(z); clean(x);
  });

  t("009", "mobile_order_guide_map_scripture_sheet_preserved", async function (ev) {
    var x = await load("#gen-22:2", 375, 700), g = rect(x, "#guide-pane"), m = rect(x, "#map-pane"), tx = rect(x, "#text-pane");
    ev.push("mobile y: guide=" + Math.round(g.top) + " map=" + Math.round(m.top) + " text=" + Math.round(tx.top) + " map body display=" + cs(x, "#map-body").display + " toggle hidden=" + q(x, "#map-toggle").hidden + " side-pane=" + cs(x, "#side-pane").position + " split display=" + cs(x, "#split").display);
    ok(g.top < m.top && m.top < tx.top, "mobile order"); ok(cs(x, "#map-body").display === "none" && !q(x, "#map-toggle").hidden && cs(x, "#side-pane").position === "fixed" && cs(x, "#split").display === "none", "mobile chrome");
    ok(tx.top < 700 * 0.45, "scripture pushed too low on mobile: " + tx.top); ok(x.d.documentElement.scrollWidth <= 376, "horizontal scroll on mobile");
    click(x, "#guide-next"); await sleep(80); ev.push("guide next → " + snap(x) + " map display=" + cs(x, "#map-body").display); ok(x.B.state.entity.id === "moriah" && guideCur(x) === "0" && !q(x, '#map-body g.gm[data-place="moriah"]'), "guide selects unlocated Moriah on mobile without requiring or inventing a map point");
    click(x, "#map-toggle"); await sleep(40); ok(cs(x, "#map-body").display === "none", "toggle collapse"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("010", "existing_search_workspace_and_history_still_work_in_new_layout", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); await anchorAt(x, 12); var a0 = x.B.scrollAnchor();
    x.B.openSearch("이삭"); await sleep(80); ok(!q(x, "#search-workspace").hidden, "search did not open"); x.B.closeSearch(false); await sleep(120); var a1 = x.B.scrollAnchor();
    ev.push("search open/close anchor " + J(a0) + "→" + J(a1)); ok(a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 4, "search close moved reading position");
    x.B.openSearch("아브라함"); await sleep(80); var row = q(x, '#search-results .sr-row[data-kind="p"]'); ok(row, "no entity result"); click(x, row); await sleep(120); ev.push("search entity → " + snap(x) + " detail=" + !!q(x, "#panel .detail")); ok(x.B.state.entity && q(x, "#panel .detail"), "entity open from search failed"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("011", "rail_has_two_perspectives_two_utilities_and_detail_has_no_tabs", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800), per = [].map.call(x.d.querySelectorAll("#rail [data-perspective]"), function (b) { return b.textContent.trim(); }), util = [].map.call(x.d.querySelectorAll("#rail [data-util]"), function (b) { return b.textContent.trim(); });
    ev.push("perspectives=" + J(per) + " utilities=" + J(util) + " tab UI present=" + !!q(x, "#tabs, [role=tab], [data-tab]") + " detail inside map pane=" + !!q(x, "#map-pane #side-pane") + " current=" + q(x, '#rail [aria-current="page"]').textContent);
    ok(per.join() === "본문연구,연표" && util.join() === "검색,설정", "rail contents differ from the lock (map page consolidated into 본문연구)"); ok(!q(x, "#tabs, [role=tab], [data-tab]"), "tab-switching UI must not exist"); ok(q(x, "#map-pane #side-pane"), "Detail lives in the map pane");
    x.B.setPanel("open"); click(x, '.tag.l[data-id="moriah"]'); await sleep(60); ok(!q(x, "#side-pane svg.smap, #side-pane svg.map, #side-pane .map-wrap"), "no map UI inside Detail");
    ok(q(x, '#rail [aria-current="page"]').textContent.trim() === "본문연구", "default perspective"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("012", "fixture_sample_marked_in_data_and_ui", async function (ev) {
    var x = await load("#gen-22", 1200, 800), g = q(x, "#guide-pane"); ev.push("data status=" + x.B.data.placeLinksStatus + " guide data-route-source=" + g.dataset.routeSource + " badge=" + !!q(x, ".g-sample") + " map note sample=" + /샘플/.test(q(x, "#map-body").textContent));
    ok(x.B.data.placeLinksStatus === "DERIVED_COMPAT_VIEW" && Object.keys(x.B.data.places).every(function (k) { var p = x.B.data.places[k]; return p.research ? (p.status === p.research.status && /WITH_VERIFY$/.test(p.status) && /APPROVED/.test(p.research.authority.approval)) : (p.status === "FIXTURE_SAMPLE" && p.authority === "NON_AUTHORITATIVE"); }) && g.dataset.routeSource === "fixture-sample" && q(x, ".g-sample") && /샘플/.test(q(x, "#map-body").textContent), "fixture sample not marked");
    var y = await load("#heb-11", 1200, 800); ok(!q(y, ".g-sample"), "badge shown without a route"); clean(y); clean(x);
  });

  t("013", "detail_is_connected_information_flow_with_entity_links", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800); ok(x.B.state.panel === "collapsed", "closed by default");
    click(x, '.tag.l[data-id="moriah"]'); await sleep(60); ev.push("scripture entity click → panel=" + x.B.state.panel + " " + snap(x)); ok(x.B.state.panel === "open" && q(x, '#panel .detail[data-id="moriah"]'), "scripture entity click opens Detail");
    var sect = [].map.call(x.d.querySelectorAll("#panel .detail [data-part]"), function (e) { return e.dataset.part; }).join(); ev.push("detail order=" + sect); ok(sect === "identity,summary,scripture,people,location,research", "detail content order: " + sect); ok(q(x, "#panel .detail").classList.contains("d-flat") && q(x, "#panel .detail").dataset.research === "0", "legacy entity uses the common Detail shell"); ok(!q(x, "#panel .detail .research[open]"), "research detail must be collapsed by default"); ok(!/샘플|fixture|FIXTURE_SAMPLE|NON_AUTHORITATIVE|프로토타입용/.test(q(x, "#panel .detail").textContent), "fixture/internal language must not be visible in normal Detail UI");
    click(x, '#panel [data-rel="p.abraham"]'); await sleep(60); ev.push("related person → " + snap(x) + " map active=" + activePins(x, "#map-body")); ok(x.B.state.entity.kind === "p" && x.B.state.entity.id === "abraham" && q(x, '#panel .detail[data-id="abraham"]') && x.B.state.panel === "open" && activePins(x, "#map-body") === "", "related person: same Detail panel shows the person");
    click(x, '#panel [data-rel="l.moriah"]'); await sleep(60); ev.push("related place → " + snap(x) + " guide=" + guideCur(x) + " geo marker=" + !!q(x, '#map-body g.gm[data-place="moriah"]')); ok(x.B.state.entity.id === "moriah" && q(x, '#panel .detail[data-id="moriah"]') && !q(x, '#map-body g.gm[data-place="moriah"]') && guideCur(x) === "0", "related place: entity, Detail and guide follow while no coordinate is invented");
    var same = q(x, '#panel [data-open-ref^="gen-22:"]'), h0 = x.w.location.hash; ok(same, "same-passage related scripture"); click(x, same); await sleep(60); ok(x.B.state.passage === "gen-22" && x.B.state.entity.id === "moriah", "same-passage ref must keep passage/selection");
    click(x, '#panel [data-rel="p.abraham"]'); await sleep(40); var hl = x.w.history.length, ref = q(x, '#panel [data-open-ref^="heb-11:"]'); ok(ref, "cross-passage related scripture"); click(x, ref); await sleep(100);
    ev.push("cross-passage ref → " + snap(x) + " history " + hl + "→" + x.w.history.length); ok(x.B.state.passage === "heb-11" && x.B.state.entity && x.B.state.entity.id === "abraham" && q(x, '#panel .detail[data-id="abraham"]') && x.w.history.length === hl + 1, "opening scripture in the right pane keeps the selected entity and adds a history entry");
    x.w.history.back(); await sleep(200); ok(x.B.state.passage === "gen-22", "browser back restores the previous passage");
    click(x, "#panel [data-clear-entity]"); await sleep(40); ok(!x.B.state.entity && q(x, "#panel .ov-flow") && x.B.state.panel === "open", "back to passage overview keeps Detail open");
    click(x, '#map-body g.gm-site'); await sleep(60); ok(x.B.state.panel === "open" && x.B.state.entity.id === "beersheba" && q(x, "#panel .detail").dataset.stableId === "JBC-CR-PLACE-BEERSHEBA-001", "approved geographic marker click opens the connected Detail"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("013U", "unresearched Place and Person use the common Detail shell without fixture/internal language", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800), targets = [["l","moriah","모리아"],["l","haran","하란"],["p","abraham","아브라함"],["p","isaac","이삭"],["p","god","하나님"]];
    for (var i = 0; i < targets.length; i++) {
      var t0 = targets[i]; x.B.selectEntity(t0[0], t0[1]); await sleep(45); var d = q(x, '#panel .detail[data-id="' + t0[1] + '"]'); ok(d && d.classList.contains("d-flat") && d.dataset.research === "0", t0[2] + " common shell");
      var txt = d.textContent; ok(!/샘플|fixture|FIXTURE_SAMPLE|NON_AUTHORITATIVE|프로토타입용|미검증\(샘플\)/i.test(txt), t0[2] + " has raw fixture/internal language");
      ok(d.querySelector('[data-part="identity"]') && d.querySelector('[data-part="research"]') && !d.querySelector('.research[open]'), t0[2] + " identity/research shell");
      ok([].every.call(d.querySelectorAll(".d-sec"), function (s) { return s.textContent.trim().length > 0; }), t0[2] + " has an empty visible section");
      if (t0[0] === "l") ok(d.querySelector('[data-part="location"]') && /상세 연구에 연결되지 않았습니다/.test(txt), t0[2] + " safe unresearched location copy");
    }
    clean(x);
  });

  t("014", "map_lives_in_the_research_workspace_and_legacy_map_view_redirects", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800); await anchorAt(x, 12); var a0 = x.B.scrollAnchor();
    ok(!q(x, "#rail-map") && qa(x, "#rail [data-perspective]").map(function (b) { return b.dataset.perspective; }).join() === "study,timeline", "no separate map perspective in the rail");
    var m0 = rect(x, "#map-pane"), g = rect(x, "#guide-pane"); ok(x.B.state.view === "study" && cs(x, "#map-pane").position !== "fixed" && m0.width > 200 && cs(x, "#guide-pane").position !== "fixed" && !q(x, "#text-pane").inert, "map, scripture and navigation are all live in 본문연구");
    click(x, '#map-body g.gm-site'); await sleep(80); var sp = rect(x, "#side-pane"), m1 = rect(x, "#map-pane"); ev.push("pin → panel=" + x.B.state.panel + " map width " + Math.round(m0.width) + "→" + Math.round(m1.width)); ok(x.B.state.panel === "open" && cs(x, "#side-pane").position === "absolute" && sp.width > 0 && Math.abs(m1.width - m0.width) <= 1, "Detail overlays, not pushes, the map");
    click(x, "#guide-next"); await sleep(60); ok(x.B.state.view === "study" && Math.abs(rect(x, "#map-pane").width - m0.width) <= 1, "guide does not change the map pane"); var a1 = x.B.scrollAnchor(); ok(a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 3, "reading position unchanged by map/guide interaction");
    var y = await load("#gen-22:2&view=map", 1400, 800); ok(y.B.state.view === "study" && !/view=map/.test(y.w.location.hash) && cs(y, "#map-pane").position !== "fixed", "legacy view=map URL opens the research workspace (no dead link)"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(y); clean(x);
  });

  t("015", "timeline_perspective_carries_context_without_inventing_data", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800); click(x, '.tag.p[data-id="isaac"]'); await sleep(50); var h0 = x.w.history.length; click(x, "#rail-timeline"); await sleep(100); var tl = q(x, "#timeline-pane"), txt = q(x, "#tl-body").textContent;
    ev.push("timeline: hidden=" + tl.hidden + " pos=" + cs(x, "#timeline-pane").position + " text=" + txt.slice(0, 120) + " hash=" + x.w.location.hash + " history " + h0 + "→" + x.w.history.length);
    ok(!tl.hidden && cs(x, "#timeline-pane").position === "fixed" && /창세기 22장/.test(txt) && /이삭/.test(txt) && /연표 데이터가 아직/.test(txt), "context not carried / data invented"); ok(x.B.state.entity && x.B.state.entity.id === "isaac" && x.B.state.verse === 2 && /view=timeline/.test(x.w.location.hash), "state changed by perspective switch");
    click(x, "#rail-study"); await sleep(80); ok(tl.hidden && x.B.state.entity.id === "isaac" && x.B.state.verse === 2, "context lost on return"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("016", "single_geographic_map_pan_zoom_layers_and_unlocated_guide_step", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800), vb = function () { return q(x, "#map-body svg.gmap").getAttribute("viewBox"); }, v0 = vb(), hash0 = x.w.location.hash, st0 = snap(x);
    click(x, "#map-zoom-in"); await sleep(40); var v1 = vb(); ok(v1 !== v0, "geographic zoom in changes viewBox"); click(x, "#map-zoom-fit"); await sleep(40); var vf = vb(); ok(vf !== v1, "fit changes geographic extent");
    var body = q(x, "#map-body"), sv = q(x, "#map-body svg.gmap"), before = J(x.B.ui.gcam), pe = function (t, cx, cy) { body.dispatchEvent(new x.w.PointerEvent(t, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 3 })); };
    sv.dispatchEvent(new x.w.PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 200, clientY: 200, button: 0, pointerId: 3 })); pe("pointermove", 260, 200); var drag = x.d.body.dataset.dragging; pe("pointerup", 260, 200); await sleep(30); ev.push("gcam " + before + "→" + J(x.B.ui.gcam) + " drag=" + drag); ok(J(x.B.ui.gcam) !== before && drag === "map" && x.w.location.hash === hash0 && snap(x) === st0, "pan changes only geographic camera");
    ok(!x.d.body.dataset.dragging, "pointerup clears the map dragging state"); ok(!q(x, "#map-mode") && !q(x, "#layer-route") && !q(x, "#map-body .gm-route"), "single geographic mode has no mode switch or route geometry");
    click(x, "#layer-place"); await sleep(30); ok(x.B.ui.layers.place === false && q(x, "#map-body svg.gmap") && !q(x, "#map-body svg.smap"), "place-layer control updates navigation layer state without switching map surfaces"); click(x, "#layer-place"); await sleep(30); ok(x.B.ui.layers.place === true && q(x, "#map-body g.gm-site"), "place-layer state restores while approved geographic markers remain on the single map surface");
    var y = await load("#gen-22:2", 1400, 800); click(y, "#guide-next"); await sleep(50); ok(y.B.state.entity.id === "moriah" && guideCur(y) === "0" && !q(y, '#map-body g.gm[data-place="moriah"]'), "guide selects Moriah without converting fixture position into a geographic point");
    ok(q(y, '[data-verse="2"]'), "scripture unaffected"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(y); clean(x);
  });

  t("017", "utilities_settings_brand_and_guide_structure", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800); click(x, "#rail-search"); await sleep(60); ok(!q(x, "#search-workspace").hidden, "rail search opens the dedicated search workspace"); x.B.closeSearch(false); await sleep(40);
    click(x, "#rail-settings"); ok(!q(x, "#settings-pop").hidden && q(x, "#rail-settings").getAttribute("aria-expanded") === "true", "settings popover"); x.B.setFrac(0.55, true); click(x, "#reset-split"); ok(Math.abs(x.B.ui.frac - x.B.geo.splitDefault) < 0.001, "reset split (editorial default)"); key(x, x.d.body, "Escape"); ok(q(x, "#settings-pop").hidden, "Esc closes settings");
    var brand = q(x, ".brand").textContent; ev.push("title=" + x.d.title + " brand=" + brand + " legacy name visible=" + /성경 맥락 보기/.test(x.d.body.innerText)); ok(/주드성경/.test(brand) && /JudeBible/.test(brand) && !/컨텍스트바이블|JudeBible Context/.test(brand + x.d.title + x.d.body.innerText) && /주드성경 · JudeBible/.test(x.d.title) && !/성경 맥락 보기/.test(x.d.body.innerText), "product name (주드성경 / JudeBible; legacy names not user-visible)");
    var parts = [].map.call(x.d.querySelectorAll("#guide-pane [data-part]"), function (e) { return e.dataset.part; }).join(); ev.push("guide parts=" + parts); ok(parts === "topic,progress,layers,navigation", "guide structure order (Lock §7; no route legend without a route): " + parts); ok(q(x, "#guide-pane .g-nav").getBoundingClientRect().bottom >= rect(x, "#guide-pane").bottom - 1, "navigation fixed at the bottom of the guide");
    click(x, "#guide-next"); parts = [].map.call(x.d.querySelectorAll("#guide-pane [data-part]"), function (e) { return e.dataset.part; }).join(); ok(parts === "topic,progress,current,layers,objects,navigation", "current step block after progress: " + parts); ok(x.w.__errs.length === 0); clean(x);
  });

  t("018", "detail_open_at_narrow_width_keeps_reading_anchor_and_selected_verse", async function (ev) {
    var x = await load("#gen-22:5", 1200, 800); await anchorAt(x, 12); var a0 = x.B.scrollAnchor(), v0 = x.B.state.verse;
    x.B.setTab("people"); await sleep(140); var a1 = x.B.scrollAnchor(); ev.push("closed→open at 1200 (text may reflow): anchor " + J(a0) + "→" + J(a1) + " panel=" + x.B.state.panel + " verse=" + x.B.state.verse);
    ok(x.B.state.panel === "open" && a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 2 && x.B.state.verse === v0 && q(x, '.verse.sel[data-verse="5"]'), "opening Detail must keep the reading anchor and selected verse even when text reflows");
    x.B.setPanel("collapsed"); await sleep(140); var a2 = x.B.scrollAnchor(); ok(a2 && a2.verse === a0.verse && Math.abs(a2.offset - a0.offset) <= 2, "closing Detail must keep the reading anchor"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("019", "guide_reads_GuideTopic_GuideStep_fixture_not_placeLinks", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800), B = x.B, G = B.guide, stp = function (id) { return G.steps.filter(function (s) { return s.id === id; })[0]; };
    ev.push("fixture meta=" + J(G.meta.status) + "/" + G.meta.authority + " topic=" + G.topics[0].id + " steps=" + G.steps.map(function (s) { return s.id + ":" + s.status; }).join(","));
    ok(G.meta.status === "FIXTURE_SAMPLE" && G.meta.authority === "NON_AUTHORITATIVE" && G.topics.every(function (t) { return t.status === "FIXTURE_SAMPLE" && t.authority === "NON_AUTHORITATIVE" && Array.isArray(t.source_research_asset_ids); }) && G.steps.every(function (s) { return s.status === "FIXTURE_SAMPLE" && ["id", "topic_id", "sequence", "title", "short_explanation", "passage_ref", "place_ids", "person_ids", "event_ids", "route_id", "layer_state", "camera_target"].every(function (k) { return k in s; }); }), "fixture schema/markers");
    ok(q(x, "#guide-pane").dataset.guideSource === "fixture-sample" && q(x, ".g-sample").dataset.status === "FIXTURE_SAMPLE" && q(x, ".g-sample").textContent.indexOf("FIXTURE_SAMPLE") < 0 && /샘플 데이터/.test(q(x, ".g-sample").textContent), "UI marker (natural language; internal code only as a data attribute)");
    delete B.data.placeLinks; B.render(); ok(x.d.querySelectorAll(".g-step").length === 2, "guide lost steps without placeLinks"); click(x, "#guide-next"); await sleep(50); ok(B.state.entity.id === "moriah" && guideCur(x) === "0" && B.ui.cam.k === 1.8, "guide next without placeLinks");
    stp("gs.gen22.2").sequence = 9; stp("gs.gen22.2").camera_target.zoom = 3; stp("gs.gen22.2").layer_state = { route: false, place: false }; stp("gs.gen22.2").person_ids = ["god"]; B.ui.guideStep = null; B.state.entity = null; B.ui.cam = { x: 50, y: 50, k: 1 }; B.render();
    var titles = [].map.call(x.d.querySelectorAll(".g-step"), function (b) { return b.textContent; }); ev.push("reordered titles=" + J(titles)); ok(/브엘세바/.test(titles[0]) && /모리아/.test(titles[1]), "order must follow GuideStep.sequence");
    click(x, "#guide-next"); await sleep(50); ok(B.state.entity.id === "beersheba" && B.ui.cam.k === 1, "first step (no camera target) leaves the camera alone");
    click(x, "#guide-next"); await sleep(50); ev.push("second step now: entity=" + B.state.entity.id + " cam=" + J(B.ui.cam) + " layers=" + J(B.ui.layers) + " persons=" + [].map.call(x.d.querySelectorAll('[data-obj^="p."]'), function (b) { return b.dataset.obj; }).join());
    ok(B.state.entity.id === "moriah" && B.ui.cam.k === 3 && B.ui.layers.place === false && !q(x, "#map-body svg.smap .pin") && q(x, '[data-obj="p.god"]') && !q(x, '[data-obj="p.abraham"]'), "camera/layers/selection/objects must be read from the GuideStep");
    click(x, "#guide-prev"); await sleep(50); ok(B.state.entity.id === "beersheba" && B.ui.layers.place === true && q(x, "#map-body svg.gmap") && !q(x, "#map-body svg.smap"), "layer state re-read on the previous step while the single geographic surface is preserved");
    ok(B.state.panel === "collapsed", "guide navigation must not open the user-closed Detail"); ok(x.w.__errs.length === 0); clean(x);
    var y = await load("#gen-12:1", 1400, 800); ok(y.B.guideSteps().length === 0 && q(y, "#guide-pane").dataset.navState === "explore" && !q(y, "#guide-prev"), "passage without a topic → exploration"); clean(y);
  });

  t("020", "map_guide_detail_share_one_place_entity_source", async function (ev) {
    var x = await load("#gen-22:2", 1400, 800), B = x.B, P = B.data.places;
    var shape = Object.keys(P).every(function (k) { var p = P[k]; if (p.research) return p.id === p.stable_id && p.legacy_key === k && p.type === "place" && p.label === p.name && p.location_state === "unlocated" && !("x" in p) && !("y" in p); return p.id === k && p.type === "place" && p.label === p.name && Array.isArray(p.aliases) && p.status === "FIXTURE_SAMPLE" && p.authority === "NON_AUTHORITATIVE"; });
    ev.push("place keys=" + J(Object.keys(P)) + " shape ok=" + shape); ok(shape, "place identity shape");
    ok(B.guideSteps().every(function (s) { return s.place_ids.every(function (id) { return P[id]; }); }), "GuideStep.place_ids must reference the shared place entities"); ok(q(x, "#map-body svg.gmap") && !q(x, "#map-body svg.smap"), "map consumes the single geographic surface");
    click(x, '.tag.l[data-id="moriah"]'); await sleep(50); var ids1 = [B.state.entity.id, guideCur(x) === "0" ? "moriah" : "?", q(x, "#panel .detail").dataset.id, q(x, ".tag.l.active").dataset.id]; ev.push("Moriah selection → " + J(ids1)); ok(ids1.every(function (i) { return i === "moriah"; }) && !q(x, '#map-body g.gm[data-place="moriah"]'), "unlocated Moriah remains one shared entity without a map point");
    click(x, "#guide-next"); await sleep(50); var ids2 = [B.state.entity.id, q(x, "#panel .detail").dataset.id]; ev.push("guide next → " + J(ids2) + " stable=" + q(x, "#panel .detail").dataset.stableId); ok(ids2.every(function (i) { return i === "beersheba"; }) && q(x, "#panel .detail").dataset.stableId === "JBC-CR-PLACE-BEERSHEBA-001", "guide selection id mismatch");
    var ms = qa(x, "#map-body g.gm"); ok(ms.length === 2 && ms.every(function (m) { return m.dataset.stableId === "JBC-CR-PLACE-BEERSHEBA-001"; }), "approved geographic markers bind back to the same place stable_id");
    P.moriah.x = 20; P.moriah.y = 30; B.data.placeLinks = { "gen-22": ["haran"] }; B.render(); ok(!q(x, '#map-body g.gm[data-place="moriah"]') && !q(x, '#map-body g.gm[data-place="haran"]'), "legacy fixture x/y and compat placeLinks cannot create geographic markers");
    var y = await load("#gen-12:1", 1400, 800); ok(q(y, "#map-body svg.gmap") && !q(y, "#map-body svg.smap") && y.B.data.placeLinks["gen-12"].join() === "haran" && y.B.data.placeLinks["heb-11"].length === 0, "compat occurrence view remains data-only and does not restore the sample map"); ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(y); clean(x);
  });

  t("021", "passage_overview_is_one_connected_flow_not_accordion_navigation", async function (ev) {
    var x = await load("#gen-22", 1400, 800); x.B.setPanel("open"); await sleep(100); var vis = function (sel) { var e = q(x, sel); return !!e && e.getBoundingClientRect().height > 0; };
    var acc = [].map.call(x.d.querySelectorAll("#panel details"), function (d) { return d.dataset.ov || d.className; }); ev.push("details in overview=" + J(acc) + " core visible=" + J(["context", "people", "places", "crossref", "photos"].map(function (k) { return k + ":" + vis('#panel [data-ov="' + k + '"]'); })));
    ok(acc.slice().sort().join() === "notes,research,resources", "only research/resources/notes may be collapsible: " + J(acc)); ok(["context", "people", "places", "crossref", "photos"].every(function (k) { return vis('#panel [data-ov="' + k + '"]'); }), "core sections must be visible without an extra click");
    ok(!q(x, "#panel details[open]"), "collapsible sections default closed"); ok(!q(x, '#panel summary[data-ov="context"], #panel [data-ov="context"] summary, #panel [data-ov="people"] summary, #panel [data-ov="places"] summary, #panel [data-ov="crossref"] summary, #panel [data-ov="photos"] summary'), "no accordion header on core sections");
    var order = [].map.call(x.d.querySelectorAll("#panel .ov-flow > [data-ov]"), function (e) { return e.dataset.ov; }).join(); ok(order === "context,people,places,crossref,photos,resources,notes", "flow order: " + order);
    // 연결 이동: 인물 → 같은 Detail, 장소 → Detail + 지도, 관련 본문 → 본문 pane
    click(x, '#panel [data-ov="people"] .item[data-id="isaac"]'); await sleep(60); ok(x.B.state.entity.id === "isaac" && q(x, '#panel .detail[data-id="isaac"]') && x.B.state.panel === "open", "person click → Detail");
    click(x, "#panel [data-clear-entity]"); await sleep(40); click(x, '#panel [data-ov="places"] .item[data-id="moriah"]'); await sleep(60); ev.push("place click → " + snap(x) + " guide=" + guideCur(x) + " geo marker=" + !!q(x, '#map-body g.gm[data-place="moriah"]')); ok(x.B.state.entity.id === "moriah" && q(x, '#panel .detail[data-id="moriah"]') && !q(x, '#map-body g.gm[data-place="moriah"]') && guideCur(x) === "0", "place click → Detail + guide while unlocated Moriah remains unplotted");
    click(x, "#panel [data-clear-entity]"); await sleep(40); click(x, '#panel [data-ov="crossref"] [data-goto]'); await sleep(80); ok(x.B.state.passage !== "gen-22" && x.B.state.verse != null, "related passage click → Scripture pane changes"); clean(x);
    var h = await load("#heb-11", 1400, 800); h.B.setPanel("open"); await sleep(80); var hk = [].map.call(h.d.querySelectorAll("#panel .ov-flow > [data-ov]"), function (e) { return e.dataset.ov; }).join(); ev.push("heb-11 overview sections=" + hk); ok(!q(h, '#panel [data-ov="places"]') && !q(h, '#panel [data-ov="photos"]') && !q(h, "#panel details:not([data-ov]):not(.research)"), "sections without data must be hidden (no empty accordion)"); ok(/notes/.test(hk) && h.w.__errs.length === 0, "notes stay available"); clean(h);
    var j = await load("#jhn-3:16", 1400, 800); j.B.setPanel("open"); await sleep(80); ok(!q(j, '#panel [data-ov="context"]') && !q(j, '#panel [data-ov="people"]') && q(j, '#panel [data-ov="notes"]') && j.w.__errs.length === 0, "unannotated passage: only available sections"); clean(j);
    var n = await load("#gen-22:2", 1400, 800); n.B.setPanel("open"); n.B.setTab("notes"); await sleep(60); ok(q(n, '#panel details[data-ov="notes"]').open, "notes may be opened (deep link/API)"); clean(n);
  });

  t("022", "navigation_panel_rename_and_no_empty_state", async function (ev) {
    var pane = function (x) { return q(x, "#guide-pane"); };
    for (var h of ["#gen-22:2", "#heb-11:17", "#jhn-3:16"]) { var x = await load(h, 1400, 800); var t0 = pane(x).textContent; ev.push(h + ": title=" + q(x, "#guide-pane .g-title").textContent + " state=" + pane(x).dataset.navState);
      ok(q(x, "#guide-pane .g-title").textContent === "네비게이션" && pane(x).getAttribute("aria-label") === "네비게이션" && t0.indexOf("안내") < 0, h + ": panel is named 네비게이션 (no 안내)"); ok(!/이야기·주제가 없습니다|안내할|없습니다/.test(t0) && t0.trim().length > 20, h + ": no empty-state sentence, panel not empty"); ok(x.w.__errs.length === 0); clean(x); }
  });

  t("023", "navigation_priority_direct_story_then_related_story_then_bible_wide_exploration", async function (ev) {
    var a = await load("#gen-22:2", 1400, 800); ok(q(a, "#guide-pane").dataset.navState === "context" && q(a, "#guide-prev") && q(a, "#guide-next") && a.d.querySelectorAll(".g-step").length === 2, "1: passage with a direct story → CONTEXT navigation with steps");
    var b = await load("#heb-11:17", 1400, 800); var tops = qa(b, "#guide-pane [data-nav-category]").map(function (e) { return e.dataset.navCategory; }); ev.push("no direct context → categories=" + J(tops));
    ok(b.d.getElementById("guide-pane").dataset.navState === "explore" && tops.join("|") === "기초 지리|자연환경|구약 역사|중간기|신약", "4: no direct or related context → EXPLORE with exactly the five locked top categories"); ok(!q(b, "#guide-prev") && !q(b, "#guide-next") && !q(b, "#guide-pane .g-nav"), "explore has no step footer");
    var c = await load("#gen-21:31", 1400, 800); click(c, '#verses [data-verse="31"] .tag'); await sleep(100); var pn = q(c, "#guide-pane"); ev.push("entity Beersheba in gen-21 → state=" + pn.dataset.navState + " text=" + pn.textContent.slice(0, 80));
    ok(pn.dataset.navState === "related" && /이 대상과 연결된 이야기/.test(pn.textContent) && /모리아 산으로의 여정/.test(pn.textContent), "2: selected place is in a story → related-story navigation");
    var stepBtn = q(c, '#guide-pane .g-related [data-open-ref="gen-22:19"]'); ok(stepBtn && /모리아 사건 후 브엘세바로 돌아옴/.test(stepBtn.textContent), "related story lists its steps as scripture links"); var h0 = c.w.history.length; click(c, stepBtn); await sleep(140);
    ev.push("open related step → " + c.w.location.hash); ok(c.B.state.passage === "gen-22" && c.B.state.verse === 19 && c.B.state.entity.id === "beersheba" && q(c, "#guide-pane").dataset.navState === "context" && guideCur(c) === "1", "opening the story step moves Scripture, keeps the entity, and lands in CONTEXT navigation on the same step"); c.w.history.back(); await sleep(200); ok(c.B.state.passage === "gen-21", "browser back returns to the previous passage (joint-history length is unreliable in stacked iframes, so the entry is checked by navigating back)");
    ok(c.B.state.panel === "open", "Detail was opened by the explicit tag click, not by navigation"); clean(a); clean(b); clean(c);
  });

  t("024", "explore_toggle_is_the_same_panel_and_keeps_context", async function (ev) {
    var x = await load("#gen-22:19", 1400, 800); click(x, '.tag.l[data-id="beersheba"]'); await sleep(80); x.B.setPanel("collapsed"); await sleep(60); var st0 = snap(x), a0 = x.B.scrollAnchor();
    click(x, '#guide-pane [data-nav-mode="explore"]'); await sleep(60); ok(q(x, "#guide-pane").dataset.navState === "explore" && qa(x, "#guide-pane [data-nav-category]").length === 5 && q(x, '#guide-pane [data-nav-mode="context"]'), "explore opens inside the same panel with a way back");
    ok(snap(x) === st0 && x.B.state.panel === "collapsed", "passage / verse / entity / closed Detail unchanged by broader exploration"); click(x, '#guide-pane [data-nav-mode="context"]'); await sleep(60);
    ok(q(x, "#guide-pane").dataset.navState === "context" && guideCur(x) === "1" && snap(x) === st0, "back returns to the same story step"); var a1 = x.B.scrollAnchor(); ok(a0 && a1 && a1.verse === a0.verse, "reading anchor kept"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("025", "exploration_tree_is_metadata_driven_never_guessed", async function (ev) {
    var x = await load("#heb-11:17", 1400, 800), B = x.B;
    ok(qa(x, "#guide-pane .g-nav-item, #guide-pane .g-nav-period").length === 0 && B.navigationCandidates().length === 0, "today: no explicit navigation metadata → no sub-levels, nothing assigned to any category (Genesis 22 story is NOT placed under 구약 역사)");
    ok(!/족장 시대|출애굽|정복과 정착|사사 시대|통일왕국|분열왕국|포로와 귀환/.test(q(x, "#guide-pane").textContent), "no era list or invented sub-category is shown");
    var R = B.projection.places["JBC-CR-PLACE-BEERSHEBA-001"]; R.navigation = { domain: "구약 역사", period: "족장 시대", story: "브엘세바와 아비멜렉", scene: "브엘세바와 아비멜렉의 맹세", passage_refs: [{ book: "gen", chapter: 21, v1: 22, v2: 34 }], places: ["JBC-CR-PLACE-BEERSHEBA-001"], people: [], events: [] };
    B.renderGuide(); var cat = q(x, '#guide-pane [data-nav-category="구약 역사"]'); ev.push("with explicit metadata → " + cat.textContent.slice(0, 80));
    ok(B.navigationCandidates().length === 1 && cat.querySelector('[data-nav-period="족장 시대"] .g-nav-story').textContent === "브엘세바와 아비멜렉" && /맹세/.test(cat.querySelector(".g-nav-scene").textContent), "explicit domain/period/story/scene metadata builds domain → period → story → scene");
    ok(qa(x, '#guide-pane [data-nav-category="신약"] .g-nav-item').length === 0 && qa(x, '#guide-pane [data-nav-category="기초 지리"] .g-nav-item').length === 0, "other categories stay empty (no guessed assignment)");
    var link = cat.querySelector("[data-open-ref]"); ok(link && link.dataset.openRef === "gen-21:22", "scene links to its passage"); click(x, link); await sleep(120); ok(x.B.state.passage === "gen-21", "the link opens Scripture");
    R.navigation = { domain: "알 수 없는 분류", period: "x", story: "y", scene: "z", passage_refs: [] }; B.ui.navExplore = false; B.renderGuide(); ok(B.navigationCandidates().length === 1 && qa(x, "#guide-pane .g-nav-item").length === 0, "a domain outside the locked top categories is not placed anywhere");
    ok(x.w.__errs.length === 0); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_WS_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "ws-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "QA-WS-IMPL " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-WS-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
