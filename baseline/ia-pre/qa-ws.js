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
      f.src = "index.html" + (hash || ""); host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function q(x, sel) { return x.d.querySelector(sel); }
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

  t("001", "desktop_regions_left_to_right_rail_detail_map_scripture_guide", async function (ev) {
    for (var W of [1200, 1600]) {
      var x = await load("#gen-22:2", W, 800), R = {};
      ["#tabs", "#panel", "#map-pane", "#split", "#text-pane", "#guide-pane"].forEach(function (s) { R[s] = rect(x, s); });
      ev.push("W=" + W + " x: " + J(Object.keys(R).map(function (k) { return k + "=" + Math.round(R[k].left) + "+" + Math.round(R[k].width); })));
      var order = ["#tabs", "#panel", "#map-pane", "#split", "#text-pane", "#guide-pane"];
      for (var i = 1; i < order.length; i++) ok(R[order[i]].left >= R[order[i - 1]].right - 1, order[i] + " overlaps/precedes " + order[i - 1]);
      ok(R["#text-pane"].width >= 320 && R["#map-pane"].width >= 170, "region too narrow: text=" + R["#text-pane"].width + " map=" + R["#map-pane"].width);
      ok(R["#guide-pane"].right <= W + 1, "guide overflows viewport"); ok(x.w.document.documentElement.scrollWidth <= W + 1, "horizontal page scroll");
      ok(cs(x, "#map-pane").position === "sticky" && cs(x, "#guide-pane").position === "sticky" && cs(x, "#side-pane").position === "sticky", "side regions not sticky");
      ok(x.w.__errs.length === 0); clean(x);
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
    x.B.setFrac(0.3, true); var y = await load("#gen-22", 1600, 800); ev.push("reload restores split: " + Math.round(y.d.getElementById("stage").style.getPropertyValue("--map-frac") * 100) + "%"); ok(Math.abs(+y.d.getElementById("stage").style.getPropertyValue("--map-frac") - 0.3) < 0.01, "split not restored"); try { y.w.localStorage.removeItem("bvc.split.v1"); } catch (e) {} clean(y); clean(x);
  });

  t("003", "map_pin_selects_place_and_syncs_detail_guide_text", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); click(x, '#map-body .pin[data-id="moriah"]'); await sleep(60);
    var det = q(x, '#panel .detail[data-id="moriah"]'), hist = x.w.location.hash;
    ev.push("after pin: " + snap(x) + " detail=" + !!det + " map active=" + activePins(x, "#map-body") + " guide step=" + guideCur(x) + " tag active=" + !!q(x, ".tag.l.active[data-id=moriah]") + " hash=" + hist);
    ok(x.B.state.entity && x.B.state.entity.id === "moriah" && x.B.state.tab === "places", "entity/tab not set"); ok(det, "detail block missing"); ok(activePins(x, "#map-body") === "moriah" && guideCur(x) === "1" && q(x, ".tag.l.active"), "map/guide/text out of sync");
    ok(/e=l\.moriah/.test(hist) && x.B.state.verse === 2, "url/verse state wrong"); click(x, '#map-body .pin[data-id="moriah"]'); await sleep(40); ok(!x.B.state.entity && !q(x, "#panel .detail") && guideCur(x) === null && activePins(x, "#map-body") === "moriah", "second click should close detail (verse 2 scope keeps pin hint)");
    ok(x.w.__errs.length === 0); clean(x);
  });

  t("004", "left_detail_panel_selection_syncs_map_and_guide", async function (ev) {
    var x = await load("#gen-22", 1200, 800); click(x, '[data-tab="places"]'); click(x, '#panel .item[data-id="beersheba"]'); await sleep(60);
    ev.push("after card: " + snap(x) + " map active=" + activePins(x, "#map-body") + " guide step=" + guideCur(x) + " detail=" + !!q(x, '#panel .detail[data-id="beersheba"]'));
    ok(activePins(x, "#map-body") === "beersheba" && guideCur(x) === "0" && q(x, '#panel .detail[data-id="beersheba"]'), "not synced");
    click(x, '[data-tab="people"]'); click(x, '#panel .item[data-id="abraham"]'); await sleep(40); ev.push("person: " + snap(x) + " detail=" + !!q(x, '#panel .detail[data-kind], #panel .detail[data-detail="p"]') + " map active=" + activePins(x, "#map-body") + " guide step=" + guideCur(x));
    ok(q(x, '#panel .detail[data-detail="p"]') && activePins(x, "#map-body") === "" && guideCur(x) === null, "person selection should clear place highlight"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("005", "guide_previous_next_drive_map_detail_history", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800), h0 = x.w.history.length;
    var prev = q(x, "#guide-prev"), next = q(x, "#guide-next"); ev.push("start: prev disabled=" + prev.disabled + " next disabled=" + next.disabled + " step=" + guideCur(x));
    click(x, "#guide-next"); await sleep(60); ev.push("next#1 → " + snap(x) + " map=" + activePins(x, "#map-body") + " step=" + guideCur(x)); ok(x.B.state.entity.id === "beersheba" && activePins(x, "#map-body") === "beersheba" && q(x, '#panel .detail[data-id="beersheba"]') && guideCur(x) === "0", "first step");
    ok(q(x, "#guide-prev").disabled && !q(x, "#guide-next").disabled, "prev should be disabled at first step");
    click(x, "#guide-next"); await sleep(60); ev.push("next#2 → " + snap(x) + " map=" + activePins(x, "#map-body") + " step=" + guideCur(x)); ok(x.B.state.entity.id === "moriah" && activePins(x, "#map-body") === "moriah" && guideCur(x) === "1", "second step"); ok(q(x, "#guide-next").disabled && !q(x, "#guide-prev").disabled, "next should be disabled at last step");
    click(x, "#guide-next"); ok(x.B.state.entity.id === "moriah", "next past end must not move");
    click(x, "#guide-prev"); await sleep(60); ok(x.B.state.entity.id === "beersheba" && activePins(x, "#map-body") === "beersheba", "prev failed");
    ok(x.B.state.verse === 2, "selected verse changed by guide"); ok(x.w.__errs.length === 0);
    x.w.history.back(); await sleep(200); ev.push("history.back → " + snap(x) + " step=" + guideCur(x)); ok(x.B.state.entity && x.B.state.entity.id === "moriah" && guideCur(x) === "1" && activePins(x, "#map-body") === "moriah", "browser back did not restore previous guide step");
    var stepBtn = q(x, '.g-step[data-guide-step="0"]'); click(x, stepBtn); await sleep(50); ok(x.B.state.entity.id === "beersheba", "step list click failed"); clean(x);
  });

  t("006", "guide_and_map_do_not_disturb_scroll_anchor_or_verse", async function (ev) {
    var x = await load("#gen-22:10", 1200, 500); await anchorAt(x, 12); var a0 = x.B.scrollAnchor(), s0 = x.w.scrollY;
    click(x, "#guide-next"); await sleep(120); click(x, "#guide-next"); await sleep(120); var a1 = x.B.scrollAnchor();
    ev.push("anchor " + J(a0) + " → " + J(a1) + " scrollY " + s0 + "→" + x.w.scrollY + " verse=" + x.B.state.verse); ok(a0 && a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 4, "reading anchor moved by guide"); ok(x.B.state.verse === 10 && q(x, '.verse.sel[data-verse="10"]'), "verse selection lost");
    click(x, '#map-body .pin[data-id="beersheba"]'); await sleep(100); var a2 = x.B.scrollAnchor(); ok(a2 && a2.verse === a0.verse && Math.abs(a2.offset - a0.offset) <= 4, "reading anchor moved by map pin"); clean(x);
  });

  t("007", "passage_without_route_guide_and_map_degrade_gracefully", async function (ev) {
    var x = await load("#heb-11:17", 1200, 800); var g = q(x, "#guide-pane").textContent;
    ev.push("heb-11 guide: prev/next disabled=" + q(x, "#guide-prev").disabled + "/" + q(x, "#guide-next").disabled + " map empty note=" + /장소가 없습니다/.test(q(x, "#map-body").textContent) + " pins=" + x.d.querySelectorAll("#map-body .pin").length);
    ok(q(x, "#guide-prev").disabled && q(x, "#guide-next").disabled && /경로가 없습니다/.test(g) && /장소가 없습니다/.test(q(x, "#map-body").textContent), "no-route state wrong"); click(x, "#guide-next"); ok(!x.B.state.entity, "next moved without a route");
    var y = await load("#gen-90", 1200, 800); ok(y.w.__errs.length === 0); clean(y);
    var z = await load("#gen-22:2", 1200, 800); z.B.data.places.moriah.x = undefined; z.B.data.places.moriah.y = null; z.B.render(); ev.push("bad coords: map degraded note=" + !!q(z, "#map-body .degraded") + " guide still steps=" + z.d.querySelectorAll(".g-step").length);
    ok(q(z, "#map-body .degraded") && z.d.querySelectorAll(".g-step").length === 2 && z.d.querySelectorAll("#verses .verse").length > 10 && z.w.__errs.length === 0, "bad coordinate isolation failed"); clean(z); ok(x.w.__errs.length === 0); clean(x);
  });

  t("008", "panel_collapse_keeps_map_scripture_guide_and_anchor", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); await anchorAt(x, 12); var a0 = x.B.scrollAnchor(), t0 = rect(x, "#text-pane").width;
    x.B.setPanel("collapsed"); await sleep(140); var a1 = x.B.scrollAnchor(), t1 = rect(x, "#text-pane").width, g = rect(x, "#guide-pane");
    ev.push("collapsed: display=" + cs(x, "#side-pane").display + " text " + Math.round(t0) + "→" + Math.round(t1) + " map visible=" + (rect(x, "#map-pane").width > 0) + " guide right=" + Math.round(g.right) + " anchor " + J(a0) + "→" + J(a1));
    ok(cs(x, "#side-pane").display === "none" && t1 > t0 && rect(x, "#map-pane").width > 0 && g.width > 0 && g.right <= 1201, "collapse layout"); ok(a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 4, "anchor moved on collapse");
    click(x, "#guide-next"); await sleep(60); ok(x.B.state.panel === "open" && x.B.state.entity && x.B.state.entity.id === "beersheba", "guide selection should reveal the detail panel"); clean(x);
  });

  t("009", "mobile_order_guide_map_scripture_sheet_preserved", async function (ev) {
    var x = await load("#gen-22:2", 375, 700), g = rect(x, "#guide-pane"), m = rect(x, "#map-pane"), tx = rect(x, "#text-pane");
    ev.push("mobile y: guide=" + Math.round(g.top) + " map=" + Math.round(m.top) + " text=" + Math.round(tx.top) + " map body display=" + cs(x, "#map-body").display + " toggle hidden=" + q(x, "#map-toggle").hidden + " side-pane=" + cs(x, "#side-pane").position + " split display=" + cs(x, "#split").display);
    ok(g.top < m.top && m.top < tx.top, "mobile order"); ok(cs(x, "#map-body").display === "none" && !q(x, "#map-toggle").hidden && cs(x, "#side-pane").position === "fixed" && cs(x, "#split").display === "none", "mobile chrome");
    ok(tx.top < 700 * 0.45, "scripture pushed too low on mobile: " + tx.top); ok(x.d.documentElement.scrollWidth <= 376, "horizontal scroll on mobile");
    click(x, "#guide-next"); await sleep(80); ev.push("guide next → " + snap(x) + " map display=" + cs(x, "#map-body").display); ok(cs(x, "#map-body").display !== "none" && x.B.state.entity.id === "beersheba" && activePins(x, "#map-body") === "beersheba", "guide should open map on mobile");
    click(x, "#map-toggle"); await sleep(40); ok(cs(x, "#map-body").display === "none", "toggle collapse"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("010", "existing_search_workspace_and_history_still_work_in_new_layout", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); await anchorAt(x, 12); var a0 = x.B.scrollAnchor();
    x.B.openSearch("이삭"); await sleep(80); ok(!q(x, "#search-workspace").hidden, "search did not open"); x.B.closeSearch(false); await sleep(120); var a1 = x.B.scrollAnchor();
    ev.push("search open/close anchor " + J(a0) + "→" + J(a1)); ok(a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 4, "search close moved reading position");
    x.B.openSearch("아브라함"); await sleep(80); var row = q(x, '#search-results .sr-row[data-kind="p"]'); ok(row, "no entity result"); click(x, row); await sleep(120); ev.push("search entity → " + snap(x) + " detail=" + !!q(x, "#panel .detail")); ok(x.B.state.entity && q(x, "#panel .detail"), "entity open from search failed"); ok(x.w.__errs.length === 0); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_WS_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "ws-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "QA-WS-IMPL " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-WS-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
