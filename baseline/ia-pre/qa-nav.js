// 참조 이동 상시 접근(스크롤 리셋 없음) 검증. 실행: index.html?qa=nav (개발 모드 전용). 공식 명세가 아니라 이번 요구에서 도출한 QA-NAV-IMPL.
(function () {
  "use strict";
  if (!/[?&]qa=nav/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(hash, width, height) {
    return new Promise(function (res) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:" + (height || 700) + "px;border:0";
      f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 150); };
      f.src = "index.html" + (hash || ""); host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function typeInto(x, id, text) { var i = x.d.getElementById(id); i.focus(); i.value = text; i.dispatchEvent(new x.w.Event("input", { bubbles: true })); return i; }
  function submitRef(x, text) { var i = x.d.getElementById("ref-input"); i.value = text; x.d.getElementById("ref-form").dispatchEvent(new x.w.Event("submit", { bubbles: true, cancelable: true })); }
  function snap(x) { var s = x.B.state; return J({ passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null, panel: s.panel, sheet: s.sheet }); }
  function rect(x, sel) { return (typeof sel === "string" ? x.d.querySelector(sel) : sel).getBoundingClientRect(); }
  function cs(x, sel) { return x.w.getComputedStyle(x.d.querySelector(sel)); }
  function anchorAt(x, n) { x.d.querySelector('[data-verse="' + n + '"]').scrollIntoView({ block: "start" }); return sleep(140); }
  function visibleAndUncovered(x, el) { var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, hit = x.d.elementFromPoint(cx, cy); return r.top >= 0 && r.bottom <= x.w.innerHeight && r.width > 0 && !!hit && (hit === el || el.contains(hit)); }

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "reference_navigation_always_accessible_while_reading", async function (ev) {
    for (var W of [1200, 375]) {
      var x = await load("#gen-22", W, 700); await anchorAt(x, 15); var y = x.w.scrollY, inp = x.d.getElementById("ref-input"), hdr = rect(x, "header.top");
      ev.push("viewport " + W + ": scrollY=" + y + " header top=" + Math.round(hdr.top) + " height=" + Math.round(hdr.height) + " ref-input visible&uncovered=" + visibleAndUncovered(x, inp));
      ok(y > 200 && hdr.top === 0 && visibleAndUncovered(x, inp), "ref input not reachable while reading at width " + W); ok(x.w.__errs.length === 0); clean(x);
    }
  });

  t("002", "no_scroll_jump_on_focus_or_typing", async function (ev) {
    for (var W of [1200, 375]) {
      var x = await load("#gen-22:6", W, 700); await anchorAt(x, 14); var y0 = x.w.scrollY, a0 = x.B.scrollAnchor(), box = x.d.getElementById("verses");
      var inp = x.d.getElementById("ref-input"); inp.focus(); inp.value = "요"; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); inp.value = "요 3:"; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); await sleep(100);
      ev.push(W + " ref focus+typing: scrollY " + y0 + "→" + x.w.scrollY + " anchor " + J(a0) + "→" + J(x.B.scrollAnchor()));
      ok(x.w.scrollY === y0 && x.B.scrollAnchor().verse === a0.verse, "ref input focus/typing scrolled the page at " + W);
      if (W === 1200) { var s = typeInto(x, "search", "이삭"); await sleep(160); ok(!x.d.getElementById("search-workspace").hidden && x.w.scrollY === y0, "search focus/typing moved scroll"); click(x, "#sw-close"); await sleep(100); }
      else { click(x, "#search-open"); await sleep(100); ok(!x.d.getElementById("search-workspace").hidden && x.w.scrollY === y0, "search open moved scroll"); click(x, "#sw-close"); await sleep(100); }
      ok(x.w.scrollY === y0 && x.d.getElementById("verses") === box, "closing search disturbed the page"); ok(x.w.__errs.length === 0); clean(x);
    }
  });

  t("003", "passage_and_selected_verse_preserved_until_a_valid_reference", async function (ev) {
    var x = await load("#gen-22:6&tab=people"); await anchorAt(x, 14); var S = snap(x), y0 = x.w.scrollY, box = x.d.getElementById("verses"), html = box.innerHTML, inp = x.d.getElementById("ref-input");
    inp.focus(); inp.value = "창세기 51장"; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); await sleep(80); ok(snap(x) === S && x.w.scrollY === y0, "typing alone must not navigate");
    submitRef(x, "창세기 51장"); await sleep(80); ev.push("invalid submit: state kept=" + (snap(x) === S) + " typed text kept=" + (inp.value === "창세기 51장") + " error=" + x.d.getElementById("ref-error").textContent.slice(0, 30)); ok(snap(x) === S && box.innerHTML === html && x.w.scrollY === y0 && inp.value === "창세기 51장" && x.d.getElementById("ref-error").textContent.length > 0, "invalid reference disturbed the passage or discarded the typed text");
    key(x, inp, "Escape"); await sleep(80); ev.push("Escape → input=" + inp.value + " error=" + JSON.stringify(x.d.getElementById("ref-error").textContent)); ok(inp.value.indexOf("창세기 22장") === 0 && x.d.getElementById("ref-error").textContent === "" && x.d.activeElement !== inp && snap(x) === S, "Escape should restore the canonical reference");
    submitRef(x, "창 22:9"); await sleep(120); ev.push("valid same-passage ref → " + snap(x)); ok(x.B.state.passage === "gen-22" && x.B.state.verse === 9 && x.d.getElementById("verses") === box, "same-passage navigation should just move the selection");
    submitRef(x, "요 3:16"); await sleep(120); ev.push("valid other-passage ref → " + snap(x)); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16, "navigation failed"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("004", "scroll_anchor_behavior_with_pinned_header", async function (ev) {
    var x = await load("#gen-22"); await anchorAt(x, 12); var hb = rect(x, "header.top").bottom, v12 = rect(x, '[data-verse="12"]').top, a0 = x.B.scrollAnchor();
    ev.push("verse 12 top=" + Math.round(v12) + " header bottom=" + Math.round(hb) + " anchor=" + J(a0)); ok(Math.abs(v12 - hb) <= 2 && a0 && a0.verse === 12 && Math.abs(a0.offset) <= 2, "verse should align just below the pinned header");
    submitRef(x, "창 23"); await sleep(120); ok(x.B.state.passage === "gen-23" && x.w.scrollY <= 2); submitRef(x, "창 22"); await sleep(160); var a1 = x.B.scrollAnchor(); ev.push("back to 창 22: " + J(a1) + " scrollY=" + x.w.scrollY); ok(a1 && a1.verse === 12 && Math.abs(a1.offset) <= 3, "anchor not restored");
    x.B.setPanel("collapsed"); await sleep(120); var a2 = x.B.scrollAnchor(); ok(a2 && a2.verse === 12 && Math.abs(a2.offset - a1.offset) <= 3, "anchor moved when the panel collapsed"); x.B.setPanel("open");
    var side = rect(x, "#side-pane").top; ev.push("side pane top=" + Math.round(side) + " header bottom=" + Math.round(hb)); ok(side >= hb - 1, "side pane hidden under header"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("005", "mobile_compact_behavior", async function (ev) {
    var x = await load("#gen-22:2", 375, 700); await anchorAt(x, 12); var hb = rect(x, "header.top"), inp = rect(x, "#ref-input"), fracHeader = hb.height / x.w.innerHeight;
    ev.push("mobile header height=" + Math.round(hb.height) + "px (" + Math.round(fracHeader * 100) + "% of viewport) brand display=" + cs(x, ".brand").display + " header search display=" + cs(x, "#search").display + " search button display=" + cs(x, "#search-open").display + " ref input width=" + Math.round(inp.width));
    ok(hb.height <= 64 && fracHeader < 0.1 && cs(x, ".brand").display === "none" && cs(x, "#search").display === "none" && cs(x, "#search-open").display !== "none" && inp.width >= 200, "mobile header is not compact enough"); ok(hb.top === 0, "header not pinned");
    click(x, "#search-open"); await sleep(120); ok(!x.d.getElementById("search-workspace").hidden && x.d.activeElement.id === "sw-query", "search button should open the workspace"); click(x, "#sw-close"); await sleep(80);
    var txt = rect(x, "#text-pane"); ok(x.w.innerHeight - hb.height > 600, "reading area too small"); ev.push("reading area=" + Math.round(x.w.innerHeight - hb.height) + "px");
    submitRef(x, "요 3:16"); await sleep(140); ev.push("mobile ref → " + snap(x)); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16); var sel = rect(x, ".verse.sel"); ok(sel.top >= hb.bottom - 2 && sel.bottom <= x.w.innerHeight + 2 || (sel.bottom > hb.bottom && sel.top < x.w.innerHeight), "selected verse hidden behind header"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("006", "desktop_pinned_header_layout", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); await anchorAt(x, 16); var hb = rect(x, "header.top"); ev.push("desktop header top=" + Math.round(hb.top) + " height=" + Math.round(hb.height) + " position=" + cs(x, "header.top").position + " ref/search visible=" + visibleAndUncovered(x, x.d.getElementById("ref-input")) + "/" + visibleAndUncovered(x, x.d.getElementById("search")));
    ok(hb.top === 0 && hb.height <= 84 && cs(x, "header.top").position === "sticky" && visibleAndUncovered(x, x.d.getElementById("ref-input")) && visibleAndUncovered(x, x.d.getElementById("search")), "desktop header not pinned/usable");
    submitRef(x, "창 99"); await sleep(80); var er = rect(x, "#ref-error"); ev.push("error toast top=" + Math.round(er.top) + " (header bottom " + Math.round(hb.bottom) + ")"); ok(er.top >= hb.bottom - 1, "error toast overlaps the header");
    var y = x.w.scrollY; x.d.getElementById("search").focus(); ok(x.w.scrollY === y); x.d.getElementById("ref-input").focus(); ok(x.w.scrollY === y, "focus moved the page"); ok(x.w.__errs.length === 0); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_NAV_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "nav-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "QA-NAV-IMPL " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-NAV-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
