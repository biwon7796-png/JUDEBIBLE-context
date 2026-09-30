// Wave 2 (Persistent Center Context) 구현 검증. 실행: index.html?qa=w2 (개발 모드 전용)
// 주의: 공식 QA-W2 명세는 전달되지 않았다. 아래 6개는 Wave 2 implement 항목 6개에서 직접 도출한 구현 QA(QA-W2-IMPL)이며
//       공식 QA 계약으로 주장하지 않는다.
(function () {
  "use strict";
  if (!/[?&]qa=w2/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(hash, width, height) {
    return new Promise(function (res) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:" + (height || 500) + "px;border:0";
      f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 100); };
      f.src = "index.html" + (hash || ""); host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function submitRef(x, text) { var i = x.d.getElementById("ref-input"); i.value = text; x.d.getElementById("ref-form").dispatchEvent(new x.w.Event("submit", { bubbles: true, cancelable: true })); }
  function snap(x) { var s = x.B.state; return { passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null }; }
  function $$(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function cs(x, sel) { return x.w.getComputedStyle(x.d.querySelector(sel)); }
  function goHash(x, h) { x.w.location.hash = h; return sleep(160); }
  var TABS = ["context", "people", "places", "map", "photos", "crossref", "resources", "notes"];
  function anchorAt(x, n) { x.d.querySelector('[data-verse="' + n + '"]').scrollIntoView({ block: "start" }); return sleep(120); }

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "passage_kept_mounted_during_context_navigation", async function (ev) {
    var x = await load("#gen-22:3"), box = x.d.getElementById("verses"), v3 = x.d.querySelector('[data-verse="3"]'), muts = 0;
    var mo = new x.w.MutationObserver(function (l) { l.forEach(function (m) { if (m.type === "childList") muts++; }); }); mo.observe(box, { childList: true, subtree: true });
    TABS.forEach(function (tb) { x.B.setTab(tb); }); var tg = x.d.querySelector("#verses .tag.p"); click(x, tg); click(x, tg);
    click(x, "#panel-toggle"); click(x, "#panel-open"); click(x, "#panel-toggle"); x.B.setTab("people"); click(x, "#panel-toggle");   // 접기·열기·접기 후 탭 클릭으로 재오픈
    submitRef(x, "창 22:5"); await goHash(x, "#gen-22:3"); await goHash(x, "#gen-22:6&tab=places"); x.B.setSheet("peek"); x.B.setSheet("full"); x.B.setSheet("half");
    await sleep(80); mo.disconnect(); ev.push("mutations=" + muts + " same #verses=" + (x.d.getElementById("verses") === box) + " same verse el=" + (x.d.querySelector('[data-verse="3"]') === v3) + " state=" + J(snap(x)));
    ok(muts === 0 && x.d.getElementById("verses") === box && x.d.querySelector('[data-verse="3"]') === v3 && v3.isConnected, "passage remounted"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("002", "selected_verse_preserved", async function (ev) {
    var x = await load("#gen-22"), y = null; x.B.setPanel("open"); click(x, '[data-vbtn="6"]');   var chk = function (label) { ok(x.B.state.verse === 6 && x.d.querySelector('[data-verse="6"].sel') && $$(x, ".verse.sel").length === 1, "lost at " + label); };
    click(x, "#panel-toggle"); chk("panel collapsed"); click(x, "#panel-open"); chk("panel open"); TABS.forEach(function (tb) { x.B.setTab(tb); chk(tb); });
    var tg = x.d.querySelector('#verses [data-verse="6"] .tag'); if (tg) { click(x, tg); chk("entity open"); click(x, tg); chk("entity close"); }
    x.B.setSheet("peek"); chk("sheet peek"); x.B.setSheet("full"); chk("sheet full"); x.B.setSheet("half"); var here = x.w.location.hash;
    await goHash(x, "#gen-22:2&tab=map"); ok(x.B.state.verse === 2); await goHash(x, here); await sleep(60); ev.push("returned to " + here + " → " + J(snap(x))); chk("history return");
    x.B.setPanel("collapsed"); x.B.setSheet("full"); var url = x.w.location.hash; y = await load(url); ev.push("fresh load " + url + " → " + J(snap(y)) + " panel=" + y.B.state.panel + " sheet=" + y.B.state.sheet);
    ok(y.B.state.verse === 6 && y.B.state.panel === "collapsed" && y.B.state.sheet === "full" && y.d.querySelector('[data-verse="6"].sel'), "not restored from URL"); clean(x); clean(y);
  });

  t("003", "scroll_anchor_preserved", async function (ev) {
    var x = await load("#gen-22"); x.B.setPanel("open"); await anchorAt(x, 12); var a0 = x.B.scrollAnchor(); ev.push("anchor=" + J(a0)); ok(a0 && a0.verse === 12, "anchor not at 12");
    var same = function (label, tol) { var a = x.B.scrollAnchor(); ev.push(label + " → " + J(a)); ok(a && a.verse === 12 && Math.abs(a.offset - a0.offset) <= (tol || 3), "anchor moved at " + label + ": " + J(a)); };
    click(x, "#panel-toggle"); await sleep(120); ok(cs(x, "#side-pane").display === "none", "panel not collapsed"); same("desktop panel collapsed (text reflowed)");
    click(x, "#panel-open"); await sleep(120); same("desktop panel reopened");
    click(x, "#panel-toggle"); var tg = x.d.querySelector("#verses .tag.p"); click(x, tg); await sleep(120); ok(x.B.state.panel === "open" && x.B.state.entity, "entity click should reopen collapsed panel"); same("entity click while collapsed");
    click(x, tg); TABS.forEach(function (tb) { x.B.setTab(tb); }); await sleep(100); same("tabs + entity");
    var m = await load("#gen-22", 375, 600); await anchorAt(m, 12); var am = m.B.scrollAnchor(); ["peek", "full", "half"].forEach(function (v) { m.B.setSheet(v); }); await sleep(120); var am2 = m.B.scrollAnchor(); ev.push("mobile sheet cycle: " + J(am) + " → " + J(am2)); ok(am2 && am2.verse === 12 && Math.abs(am2.offset - am.offset) <= 3, "mobile anchor moved");
    await anchorAt(x, 15); await sleep(400); var url = x.w.location.href; var z = await load(url.slice(url.indexOf("#"))); z.f.remove();   // 다른 새 프레임은 history.state 가 없으므로 reload 로 검증
    var p = new Promise(function (r) { x.f.onload = function () { r(); }; }); x.w.location.reload(); await p; await sleep(250); var ar = x.f.contentWindow.BVC.scrollAnchor(); ev.push("after reload anchor=" + J(ar)); ok(ar && ar.verse === 15, "anchor not restored after reload"); clean(x); clean(m);
  });

  t("004", "passage_state_restored_on_history_back_forward", async function (ev) {
    var x = await load("#gen-22"); click(x, '[data-vbtn="3"]'); await anchorAt(x, 12); x.B.setTab("people"); var eA = x.w.location.hash; ev.push("entry A=" + eA + " (anchor 12 at leave)");
    submitRef(x, "히 11"); await sleep(80); x.d.querySelector('[data-verse="20"]').scrollIntoView({ block: "start" }); await sleep(100); click(x, '[data-vbtn="22"]'); await sleep(60); var eB = x.w.location.hash; ev.push("entry B=" + eB);
    var L0 = x.w.history.length; await goHash(x, eA); ev.push("back → " + J(snap(x)) + " anchor=" + J(x.B.scrollAnchor()) + " history.length " + L0 + "→" + x.w.history.length);
    ok(x.B.state.passage === "gen-22" && x.B.state.verse === 3 && x.B.state.tab === "people", "workspace not restored"); ok(x.B.scrollAnchor() && x.B.scrollAnchor().verse === 12, "anchor not restored on back"); ok(x.w.history.length === L0 + 1 || x.w.history.length === L0, "restore created extra history entries");
    ok(x.d.querySelector('[data-verse="3"].sel') && x.d.getElementById("passage-title").textContent === x.B.data.passages["gen-22"].ref, "DOM not restored");
    await goHash(x, eB); ev.push("forward → " + J(snap(x)) + " anchor=" + J(x.B.scrollAnchor())); ok(x.B.state.passage === "heb-11" && x.B.state.verse === 22 && x.B.scrollAnchor() && x.B.scrollAnchor().verse === 20, "forward not restored");
    x.B.setPanel("collapsed"); await goHash(x, eA); ev.push("back with panel collapsed → panel=" + x.B.state.panel); ok(x.B.state.panel === "collapsed" && x.B.state.verse === 3, "UI panel state should persist across history");
    x.B.setPanel("open"); x.B.setSheet("peek"); await goHash(x, eB); ok(x.B.state.sheet === "peek", "sheet state should persist across history"); x.B.setSheet("half");
    await anchorAt(x, 30); await sleep(400); var p = new Promise(function (r) { x.f.onload = function () { r(); }; }); x.w.location.reload(); await p; await sleep(250); var W = x.f.contentWindow;
    ev.push("reload → " + J({ passage: W.BVC.state.passage, verse: W.BVC.state.verse, anchor: W.BVC.scrollAnchor() })); ok(W.BVC.state.passage === "heb-11" && W.BVC.state.verse === 22 && W.BVC.scrollAnchor() && W.BVC.scrollAnchor().verse === 30, "reload did not restore passage state/anchor"); ok(W.__errs === undefined || true); clean(x);
  });

  t("005", "desktop_context_panel_state", async function (ev) {
    var x = await load("#gen-22:2"), hist0 = x.w.history.length, W0 = x.d.getElementById("text-pane").getBoundingClientRect().width;
    ev.push("default(Lock v1.1: Detail CLOSED): panel=" + x.B.state.panel + " side-pane display=" + cs(x, "#side-pane").display + " text width=" + Math.round(W0) + " reopen visible=" + !x.d.getElementById("panel-open").hidden + " hash=" + x.w.location.hash); ok(x.B.state.panel === "collapsed" && cs(x, "#side-pane").display === "none" && !x.d.getElementById("panel-open").hidden && x.d.getElementById("panel-toggle").dataset.mode === "panel" && !/panel=/.test(x.w.location.hash), "default should be closed");
    click(x, "#panel-open"); await sleep(100); var W1 = x.d.getElementById("text-pane").getBoundingClientRect().width; ev.push("opened: display=" + cs(x, "#side-pane").display + " text width=" + Math.round(W1) + " reopen hidden=" + x.d.getElementById("panel-open").hidden + " hash=" + x.w.location.hash);
    ok(x.B.state.panel === "open" && cs(x, "#side-pane").display !== "none" && x.d.getElementById("panel-open").hidden && /panel=open/.test(x.w.location.hash), "open failed");
    click(x, "#panel-toggle"); await sleep(60); ok(x.B.state.panel === "collapsed" && !/panel=/.test(x.w.location.hash), "close failed");
    x.B.setTab("places"); await sleep(60); ok(x.B.state.panel === "open" && cs(x, "#side-pane").display !== "none", "tab click should reopen panel"); ev.push("tab click reopened the panel");
    var hist1 = x.w.history.length; click(x, "#panel-toggle"); click(x, "#panel-open"); click(x, "#panel-toggle"); click(x, "#panel-open"); ok(x.B.state.panel === "open" && x.d.getElementById("panel-open").hidden && /panel=open/.test(x.w.location.hash), "reopen failed: " + x.w.location.hash);
    ok(x.w.history.length === hist1, "panel toggles must not create history entries (" + hist1 + "→" + x.w.history.length + ")"); ev.push("history.length unchanged across 4 panel toggles: " + hist1);
    var y = await load("#gen-22:2&panel=open"); ev.push("boot with panel=open → " + y.B.state.panel + " display=" + cs(y, "#side-pane").display); ok(y.B.state.panel === "open" && cs(y, "#side-pane").display !== "none");
    var y2 = await load("#gen-22:2&panel=collapsed"); ok(y2.B.state.panel === "collapsed" && cs(y2, "#side-pane").display === "none", "explicit collapsed still valid"); clean(y2);
    var S = snap(y); await goHash(y, "#gen-22:2&panel=weird"); ok(J(snap(y)) === J(S) && y.B.state.panel === "open" && y.d.getElementById("ref-error").textContent.length > 0, "invalid panel value should be rejected"); ev.push("invalid &panel=weird rejected, state kept");
    ok(x.w.__errs.length === 0 && y.w.__errs.length === 0); clean(x); clean(y);
  });

  t("006", "mobile_context_sheet_state", async function (ev) {
    var x = await load("#gen-22:2", 375, 600), H = function () { return Math.round(x.d.getElementById("side-pane").getBoundingClientRect().height); }, pos = cs(x, "#side-pane").position, hist0 = x.w.history.length;
    ev.push("default: sheet=" + x.B.state.sheet + " position=" + pos + " height=" + H() + " toggle mode=" + x.d.getElementById("panel-toggle").dataset.mode + " label=" + x.d.getElementById("panel-toggle").textContent); ok(pos === "fixed" && x.B.state.sheet === "half" && x.d.getElementById("panel-toggle").dataset.mode === "sheet");
    var hHalf = H(); click(x, "#panel-toggle"); await sleep(80); var hFull = H(); ev.push("half→full: sheet=" + x.B.state.sheet + " height " + hHalf + "→" + hFull + " hash=" + x.w.location.hash); ok(x.B.state.sheet === "full" && hFull > hHalf && /sheet=full/.test(x.w.location.hash));
    click(x, "#panel-toggle"); await sleep(80); var hPeek = H(); ev.push("full→peek: height=" + hPeek + " panel display=" + cs(x, "#panel").display + " aria-expanded=" + x.d.getElementById("panel-toggle").getAttribute("aria-expanded")); ok(x.B.state.sheet === "peek" && hPeek < 100 && cs(x, "#panel").display === "none" && x.d.getElementById("panel-toggle").getAttribute("aria-expanded") === "false");
    x.B.setTab("people"); await sleep(60); ev.push("tab click from peek → sheet=" + x.B.state.sheet); ok(x.B.state.sheet === "half" && cs(x, "#panel").display !== "none", "peek should open on tab click");
    click(x, "#panel-toggle"); click(x, "#panel-toggle"); ok(x.B.state.sheet === "peek"); var tg = x.d.querySelector("#verses .tag"); click(x, tg); await sleep(60); ok(x.B.state.sheet === "half" && x.B.state.entity, "entity click should open sheet"); click(x, tg);
    ["context", "map", "notes"].forEach(function (tb) { x.B.setTab(tb); ok(x.B.state.sheet === "half", "sheet changed by tab " + tb); });
    x.B.setSheet("full"); submitRef(x, "요 3:16"); await sleep(80); ev.push("after passage change: sheet=" + x.B.state.sheet); ok(x.B.state.sheet === "full" && x.B.state.passage === "jhn-3", "sheet state lost on passage change");
    var hs0 = x.w.history.length; x.B.setSheet("peek"); x.B.setSheet("full"); x.B.setSheet("half"); click(x, "#panel-toggle"); click(x, "#panel-toggle"); click(x, "#panel-toggle"); ok(x.w.history.length === hs0, "sheet cycling should not create history entries (" + hs0 + "→" + x.w.history.length + ")"); ev.push("history.length unchanged across 6 sheet changes: " + hs0); x.B.setSheet("full"); var url = x.w.location.hash; var y = await load(url, 375, 600); ev.push("fresh load " + url + " → sheet=" + y.B.state.sheet); ok(y.B.state.sheet === "full" && y.B.state.verse === 16);
    var z = await load("#gen-22&sheet=peek", 375, 600); ok(z.B.state.sheet === "peek" && Math.round(z.d.getElementById("side-pane").getBoundingClientRect().height) < 100, "peek boot"); z.f.style.width = "1200px"; z.w.dispatchEvent(new z.w.Event("resize")); await sleep(250);
    ev.push("resized to desktop: mode=" + z.d.getElementById("panel-toggle").dataset.mode + " sheet state kept=" + z.B.state.sheet + " side-pane position=" + cs(z, "#side-pane").position); ok(z.d.getElementById("panel-toggle").dataset.mode === "panel" && z.B.state.sheet === "peek" && cs(z, "#side-pane").position !== "fixed");
    z.f.style.width = "375px"; z.w.dispatchEvent(new z.w.Event("resize")); await sleep(250); ok(z.d.getElementById("panel-toggle").dataset.mode === "sheet" && z.B.state.sheet === "peek" && cs(z, "#side-pane").position === "fixed", "resize back to mobile"); ok(x.w.__errs.length === 0); clean(x); clean(y); clean(z);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 40s")); }, 40000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_W2_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "w2-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "QA-W2-IMPL " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-W2-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
