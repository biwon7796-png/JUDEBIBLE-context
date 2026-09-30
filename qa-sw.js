// 검색 작업공간(SW) 전용 검증. 실행: index.html?qa=sw (개발 모드 전용). 공식 명세가 아니라 이번 UI 보정 요구사항에서 도출한 QA-SW-IMPL 이다.
(function () {
  "use strict";
  if (!/[?&]qa=sw/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(hash, width, height) {
    return new Promise(function (res) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:" + (height || 800) + "px;border:0";
      f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 120); };
      f.src = "index.html" + (hash || ""); host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k, o) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", Object.assign({ key: k, bubbles: true, cancelable: true }, o || {}))); }
  function typeHeader(x, q) { var i = x.d.getElementById("search"); i.focus(); i.value = q; i.dispatchEvent(new x.w.Event("input", { bubbles: true })); return sleep(160).then(function () { if (x.w.__errs.length) throw new Error("browser error: " + x.w.__errs.join(" | ")); }); }
  function snap(x) { var s = x.B.state; return J({ passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null, panel: s.panel, sheet: s.sheet }); }
  function $$(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function cs(x, sel) { return x.w.getComputedStyle(typeof sel === "string" ? x.d.querySelector(sel) : sel); }
  function rect(x, sel) { return x.d.querySelector(sel).getBoundingClientRect(); }
  function anchorAt(x, n) { x.d.querySelector('[data-verse="' + n + '"]').scrollIntoView({ block: "start" }); return sleep(120); }
  async function viaFab(x, q) {   // 모바일 컴팩트 헤더: 검색 입력 대신 "검색" 버튼 → 작업공간 입력
    var hs = x.d.getElementById("search"); if (hs.offsetParent !== null) return typeHeader(x, q);
    click(x, "#search-open"); var sq = x.d.getElementById("sw-query"); sq.value = q; sq.dispatchEvent(new x.w.Event("input", { bubbles: true })); await sleep(150);
  }
  var open = function (x) { return !x.d.getElementById("search-workspace").hidden; };

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "no_inline_chips_and_no_layout_push", async function (ev) {
    var x = await load("#gen-22:2"), vTop = rect(x, "#verses").top, dh = x.d.documentElement.scrollHeight, y0 = x.w.scrollY;
    await typeHeader(x, "이삭"); var w = x.d.getElementById("search-workspace");
    ev.push("workspace open=" + open(x) + " position=" + cs(x, w).position + " #verses top " + Math.round(vTop) + "→" + Math.round(rect(x, "#verses").top) + " docHeight " + dh + "→" + x.d.documentElement.scrollHeight + " scrollY " + y0 + "→" + x.w.scrollY);
    ok(open(x) && cs(x, w).position === "fixed", "workspace not a fixed overlay"); ok(w.contains(x.d.getElementById("search-results")), "results not inside workspace");
    ok($$(x, ".sr, .sr-chip").length === 0 && !x.d.querySelector("body > #search-results, header #search-results"), "inline chips still present");
    ok(Math.abs(rect(x, "#verses").top - vTop) < 1 && x.d.documentElement.scrollHeight === dh && x.w.scrollY === y0, "passage moved when search results appeared"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("002", "desktop_large_workspace_and_multiline_result_cards", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); await typeHeader(x, "이삭"); var p = rect(x, ".sw-panel"), rows = $$(x, "#search-results .sr-row");
    ev.push("panel " + Math.round(p.width) + "x" + Math.round(p.height) + " rows=" + rows.length + " summary=" + x.d.getElementById("sw-summary").textContent); ok(p.width >= 900 && p.height >= 400 && rows.length > 5, "workspace not large / no rows");
    var vrow = rows.filter(function (r) { return r.dataset.kind === "v"; })[0]; ok(vrow, "no verse rows"); var prev = vrow.querySelector(".sr-preview"), lh = parseFloat(cs(x, prev).lineHeight), hgt = prev.getBoundingClientRect().height;
    ev.push("verse row: ref=" + vrow.querySelector(".sr-ref").firstChild.textContent + " preview height=" + Math.round(hgt) + "px line-height=" + lh + " clamp=" + cs(x, prev).webkitLineClamp + " marks=" + prev.querySelectorAll("mark").length);
    ok(/장 \d+절/.test(vrow.querySelector(".sr-ref").textContent), "reference missing"); ok(hgt >= lh * 1.9 && hgt <= lh * 4.1, "preview should be 2–4 lines, got " + hgt / lh); ok(prev.querySelector("mark") && prev.querySelector("mark").textContent.indexOf("이삭") >= 0, "search term not highlighted");
    ok(vrow.tagName === "BUTTON" && vrow.dataset.id && vrow.dataset.kind === "v", "row not clickable/identified"); ok($$(x, "[data-swfilter]").length >= 6, "filters missing");
    var multi = rows.filter(function (r) { var pv = r.querySelector(".sr-preview"); return pv && pv.getBoundingClientRect().height >= parseFloat(cs(x, pv).lineHeight) * 2.5; }).length; ev.push("rows with ≥3-line previews=" + multi); ok(multi > 0, "no multi-line cards"); clean(x);
  });

  t("003", "optional_filters", async function (ev) {
    var x = await load("#gen-22:2", 1200, 800); await typeHeader(x, "이삭"); var kinds = function () { return $$(x, "#search-results .sr-row").map(function (r) { return r.dataset.kind; }); }; var all = kinds();
    click(x, '[data-swfilter="kind:entity"]'); var k1 = kinds(); ev.push("entity-only kinds=" + J(k1)); ok(k1.length > 0 && k1.every(function (k) { return k === "p" || k === "l"; }) && x.d.querySelector('[data-swfilter="kind:entity"]').getAttribute("aria-pressed") === "true");
    click(x, '[data-swfilter="kind:verse"]'); var k2 = kinds(); ev.push("verse-only rows=" + k2.length); ok(k2.length > 0 && k2.every(function (k) { return k === "v"; }));
    var bookOf = function (r) { return x.B.krv.books.map(function (b) { return b.id; }).indexOf(r.dataset.id.split("-")[0]); };
    click(x, '[data-swfilter="testament:nt"]'); var nt = $$(x, "#search-results .sr-row"); ok(nt.length > 0 && nt.every(function (r) { return bookOf(r) >= 39; }), "NT filter leaks OT verses"); var s1 = x.d.getElementById("sw-summary").textContent;
    click(x, '[data-swfilter="testament:ot"]'); var ot = $$(x, "#search-results .sr-row"); ok(ot.length > 0 && ot.every(function (r) { return bookOf(r) < 39; }), "OT filter leaks NT verses"); ev.push("NT summary: " + s1 + " | OT summary: " + x.d.getElementById("sw-summary").textContent);
    click(x, '[data-swfilter="testament:all"]'); click(x, '[data-swfilter="kind:all"]'); ok(kinds().length === all.length, "resetting filters should restore results");
    await typeHeader(x, "하나님"); var n0 = $$(x, "#search-results .sr-row").length; ok(!x.d.getElementById("sw-more").hidden, "more button should appear"); click(x, "#sw-more"); var n1 = $$(x, "#search-results .sr-row").length; ev.push("more: " + n0 + "→" + n1); ok(n1 > n0, "더 보기 did not load more"); clean(x);
  });

  t("004", "desktop_underlying_passage_state_preserved", async function (ev) {
    var x = await load("#gen-22:6&tab=people"); x.B.setPanel("collapsed"); await anchorAt(x, 12); var S = snap(x), a0 = x.B.scrollAnchor(), y0 = x.w.scrollY, box = x.d.getElementById("verses"), muts = 0;
    var mo = new x.w.MutationObserver(function (l) { l.forEach(function (m) { if (m.type === "childList") muts++; }); }); mo.observe(box, { childList: true, subtree: true });
    var closers = [["Escape", function () { key(x, x.d.activeElement, "Escape"); }], ["닫기 버튼", function () { click(x, "#sw-close"); }], ["backdrop", function () { click(x, ".sw-backdrop"); }]];
    for (var c of closers) {
      var hb = rect(x, "header.top"); ok(hb.top === 0 && hb.bottom > 0, "header should stay pinned while reading"); await typeHeader(x, "독생자"); ok(open(x), "search did not open from the pinned header"); x.d.getElementById("search-results").scrollTop = 200; c[1](); await sleep(120);
      var a1 = x.B.scrollAnchor(); ev.push(c[0] + ": open=" + open(x) + " state kept=" + (snap(x) === S) + " anchor " + J(a0) + "→" + J(a1) + " scrollY " + y0 + "→" + x.w.scrollY + " focus=" + (x.d.activeElement && x.d.activeElement.id));
      ok(!open(x) && snap(x) === S && a1 && a1.verse === a0.verse && Math.abs(a1.offset - a0.offset) <= 2 && Math.abs(x.w.scrollY - y0) <= 1, "state disturbed after closing via " + c[0]); ok(x.d.activeElement && x.d.activeElement !== x.d.body, "focus should return to a control");
    }
    mo.disconnect(); ok(muts === 0 && x.d.getElementById("verses") === box, "passage re-mounted"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("005", "mobile_fullscreen_results_sheet_and_return", async function (ev) {
    var x = await load("#gen-22:6", 375, 700); x.B.setSheet("full"); await anchorAt(x, 12); var S = snap(x), a0 = x.B.scrollAnchor(), y0 = x.w.scrollY;
    await viaFab(x, "이삭"); var p = rect(x, ".sw-panel"), rows = $$(x, "#search-results .sr-row"), r0 = rows.filter(function (r) { return r.dataset.kind === "v"; })[0];
    ev.push("panel " + Math.round(p.left) + "," + Math.round(p.top) + " " + Math.round(p.width) + "x" + Math.round(p.height) + " rows=" + rows.length); ok(p.width === x.d.documentElement.clientWidth && p.height === x.w.innerHeight && p.top === 0 && p.left === 0, "not full-screen on mobile");
    var ref = r0.querySelector(".sr-ref").getBoundingClientRect(), prev = r0.querySelector(".sr-preview").getBoundingClientRect(), fs = parseFloat(cs(x, r0.querySelector(".sr-preview")).fontSize);
    ev.push("row stacked: ref.bottom=" + Math.round(ref.bottom) + " preview.top=" + Math.round(prev.top) + " font=" + fs + " row height=" + Math.round(r0.getBoundingClientRect().height)); ok(prev.top >= ref.bottom - 2 && fs >= 15 && r0.getBoundingClientRect().height >= 60, "rows not readable/stacked");
    ok(cs(x, "#sw-query").fontSize === "16px" && !!x.d.getElementById("sw-close"), "mobile input/close");
    click(x, "#sw-close"); await sleep(120); var a1 = x.B.scrollAnchor(); ev.push("closed → state kept=" + (snap(x) === S) + " anchor " + J(a0) + "→" + J(a1) + " scrollY " + y0 + "→" + x.w.scrollY); ok(!open(x) && snap(x) === S && a1 && a1.verse === a0.verse && Math.abs(x.w.scrollY - y0) <= 1, "did not return to the previous passage view");
    await viaFab(x, "독생자"); var v = $$(x, '#search-results .sr-row[data-id="jhn-3:16"]')[0]; ok(v, "jhn 3:16 row missing"); click(x, v); await sleep(160);
    ev.push("opened result → " + snap(x) + " workspace open=" + open(x)); ok(!open(x) && x.B.state.passage === "jhn-3" && x.B.state.verse === 16 && x.B.state.sheet === "full", "result open failed"); var sel = x.d.querySelector(".verse.sel").getBoundingClientRect(); ok(sel.bottom > 0 && sel.top < 700, "selected verse not visible"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("006", "click_row_opens_passage_for_each_result_kind", async function (ev) {
    var x = await load("#gen-12"); await typeHeader(x, "독생자를"); click(x, '#search-results .sr-row[data-kind="v"][data-id="jhn-3:16"]'); await sleep(120); ev.push("verse row → " + snap(x)); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16 && !open(x) && /^#jhn-3:16/.test(x.w.location.hash));
    await typeHeader(x, "창 22:2"); var first = x.d.querySelector("#search-results .sr-row"); ok(first && first.dataset.kind === "r", "reference row should be first"); ev.push("reference row preview=" + first.querySelector(".sr-preview").textContent.slice(0, 20)); ok(first.querySelector(".sr-preview").textContent.length > 10); click(x, first); await sleep(120); ev.push("reference row → " + snap(x)); ok(x.B.state.passage === "gen-22" && x.B.state.verse === 2 && !open(x));
    await typeHeader(x, "이삭"); var ent = x.d.querySelector('#search-results .sr-row[data-kind="p"][data-id="isaac"]'); ok(ent, "entity row missing"); click(x, ent); await sleep(120); ev.push("entity row → " + snap(x)); ok(x.B.state.entity && x.B.state.entity.id === "isaac" && x.B.state.tab === "people" && !open(x)); ok(x.w.__errs.length === 0); clean(x);
  });

  t("007", "keyboard_focus_and_dialog_behavior", async function (ev) {
    var x = await load("#gen-22"); await typeHeader(x, "요 3:16"); ev.push("focus after typing=" + (x.d.activeElement && x.d.activeElement.id)); ok(x.d.activeElement.id === "sw-query", "focus should move into the dialog input"); ok(x.d.querySelector(".sw-panel").getAttribute("role") === "dialog" && x.d.querySelector(".sw-panel").getAttribute("aria-modal") === "true");
    key(x, x.d.activeElement, "Enter"); await sleep(120); ev.push("Enter → " + snap(x)); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16 && !open(x), "Enter should open the first result");
    await typeHeader(x, "이삭"); var fs = [].filter.call(x.d.getElementById("search-workspace").querySelectorAll("button, input, [tabindex]"), function (n) { return !n.disabled && !n.hidden && n.tabIndex >= 0 && n.offsetParent !== null; }); var last = fs[fs.length - 1]; last.focus(); key(x, last, "Tab"); ev.push("Tab on last focusable wraps to " + (x.d.activeElement.id || x.d.activeElement.className)); ok(x.d.activeElement === fs[0], "focus trap broken");
    key(x, x.d.activeElement, "Tab", { shiftKey: true }); ok(x.d.activeElement === last, "shift+Tab wrap broken"); key(x, x.d.activeElement, "Escape"); await sleep(100); ok(!open(x) && x.d.activeElement.id === "search", "Escape/focus return"); clean(x);
  });

  t("008", "search_term_highlight_correctness", async function (ev) {
    var x = await load("#gen-22"), MR = x.B.markRanges, txt = "가나다 ABC 라마 이삭이 말하되";
    ok(J(MR("가나다 ABC 라마", "abc")) === "[[4,7]]", "case-insensitive"); ok(J(MR("이삭이 말하되", "이삭".normalize("NFD"))) === "[[0,2]]", "NFD query"); ok(J(MR("아브라함이 이삭을", "이삭 아브라함")) === "[[0,4],[6,8]]", "multi-token: " + J(MR("아브라함이 이삭을", "이삭 아브라함")));
    await typeHeader(x, "독생자를 주셨으니"); var row = x.d.querySelector('#search-results .sr-row[data-id="jhn-3:16"]'); var marks = row ? [].map.call(row.querySelectorAll("mark"), function (m) { return m.textContent; }) : []; ev.push("marks in John 3:16 row=" + J(marks)); ok(marks.join(" ").indexOf("독생자를") >= 0 && marks.join(" ").indexOf("주셨으니") >= 0, "phrase terms not marked");
    await typeHeader(x, "독생자를 주셨으니".normalize("NFD")); ok(x.d.querySelector('#search-results .sr-row[data-id="jhn-3:16"] mark'), "NFD phrase not marked");
    var long = null; x.B.krv.books.some(function (b, bi) { return b.chapters.some(function (ch, ci) { return ch.some(function (v, vi) { if (v.length > 190) { long = { id: b.id + "-" + (ci + 1) + ":" + (vi + 1), text: v }; return true; } return false; }); }); });
    var tail = long.text.slice(-28).trim().split(" ").filter(function (w) { return w.length >= 3; })[0]; await typeHeader(x, tail); var lr = x.d.querySelector('#search-results .sr-row[data-id="' + long.id + '"]');
    ev.push("long verse " + long.id + " (" + long.text.length + " chars) query=" + tail + " → row " + !!lr + " snippet starts=" + (lr ? lr.querySelector(".sr-preview").textContent.slice(0, 12) : "-")); ok(lr && lr.querySelector("mark") && lr.querySelector(".sr-preview").textContent.charAt(0) === "…", "snippet should center on the late match with ellipsis"); ok(x.w.__errs.length === 0); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_SW_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "sw-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "QA-SW-IMPL " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-SW-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
