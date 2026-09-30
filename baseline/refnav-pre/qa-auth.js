// AUTHORITATIVE QA-BVC-001~020 — 원본 spec 번호/기준 그대로. 실행: index.html?qa=auth
// 각 테스트는 fresh iframe 에서 실행하고, 증거(evidence)를 #auth-qa-report / window.BVC_AUTH_QA 에 기록한다.
// selector 는 visible text 가 아니라 data-* / id 를 사용한다(UI 언어 변경에 독립).
(function () {
  "use strict";
  if (!/[?&]qa=auth/.test(location.search)) return;
  window.addEventListener("pagehide", function () { try { sessionStorage.setItem("authqa.pagehide", (window.BVC_AUTH_PROGRESS || []).join(" ") + " @" + location.search); } catch (e) { } });
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  var J = JSON.stringify;

  function load(hash, width) {
    return new Promise(function (res, rej) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:420px;border:0";
      f.onload = function () {
        var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); });
        setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 60);
      };
      f.onerror = rej; f.src = "index.html" + (hash || ""); host.appendChild(f);
    });
  }
  async function reload(x) {
    var p = new Promise(function (r) { x.f.onload = function () { r(); }; }); x.w.location.reload(); await p; await sleep(80);
    x.w = x.f.contentWindow; x.d = x.w.document; x.B = x.w.BVC; x.w.__errs = []; x.w.addEventListener("error", function (e) { x.w.__errs.push(e.message); });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function $$(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function snap(x) { var s = x.B.state; return { passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null }; }
  function title(x) { return x.d.getElementById("passage-title").textContent; }
  function N(x, pid) { return x.B.data.passages[pid].verses.length; }
  function openRef(x, text) { var i = x.d.getElementById("ref-input"); i.value = text; x.d.getElementById("ref-form").dispatchEvent(new x.w.Event("submit", { bubbles: true, cancelable: true })); }
  var TABS = ["context", "people", "places", "map", "photos", "crossref", "resources", "notes"];

  var T = [];
  var t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "초기 passage가 즉시 중심 화면에 나타난다 — Context/지도/사진 없이도 본문 읽기 가능", async function (ev) {
    var v0 = await load("#heb-11:18"); var sv = v0.d.querySelector(".verse.sel").getBoundingClientRect(); ev.push("with verse in URL: selected verse top=" + Math.round(sv.top) + " (in viewport " + (sv.bottom > 0 && sv.top < v0.w.innerHeight) + ")"); ok(sv.bottom > 0 && sv.top < v0.w.innerHeight, "selected verse from URL not visible"); clean(v0);
    var x = await load("#heb-11"); var r = x.d.getElementById("text-pane").getBoundingClientRect(), vh = x.w.innerHeight;
    ev.push("text-pane top=" + Math.round(r.top) + " h=" + Math.round(r.height) + " viewportH=" + vh + " title=" + title(x)); ok(r.top >= 0 && r.top < vh / 2 && r.height > 0, "passage not in primary screen area");
    ok($$(x, ".verse").length === N(x, "heb-11") && x.B.state.tab === "context", "initial passage not rendered");
    ["context", "placeLinks", "places", "photos", "crossrefs", "resources", "people"].forEach(function (k) { delete x.B.data[k]; }); x.B.render();
    var txt = x.d.getElementById("verses").textContent; ev.push("after removing Context/map/photos data: verses=" + $$(x, ".verse").length + " errors=" + x.w.__errs.length);
    ok($$(x, ".verse").length === N(x, "heb-11") && txt.trim().length > 20 && x.w.__errs.length === 0, "passage unreadable without optional data"); clean(x);
  });
  t("002", "Context → People → Places → Photos 순차 전환 — passage_ref, passage scroll 유지", async function (ev) {
    var x = await load("", 375); click(x, '[data-vbtn="4"]'); x.w.scrollTo(0, 120); var y0 = x.w.scrollY, ref0 = title(x), p0 = x.B.state.passage; ok(y0 > 0, "not scrollable y0=" + y0);
    for (var tb of ["context", "people", "places", "photos"]) { click(x, '[data-tab="' + tb + '"]'); ev.push(tb + ": passage=" + x.B.state.passage + " ref=" + title(x) + " verse=" + x.B.state.verse + " scrollY=" + x.w.scrollY);
      ok(x.B.state.passage === p0 && title(x) === ref0 && x.B.state.verse === 4 && Math.abs(x.w.scrollY - y0) <= 1, "lost passage/scroll at " + tb); }
    clean(x);
  });
  t("003", "People entity 선택 후 닫기 — 본문 위치와 active module context 보존", async function (ev) {
    var x = await load("", 375); click(x, '[data-vbtn="4"]'); click(x, '[data-tab="crossref"]'); x.w.scrollTo(0, 100); var y0 = x.w.scrollY, S = snap(x);
    click(x, '.tag.p[data-id="abraham"]'); ev.push("open=" + J(snap(x))); ok(x.B.state.entity && x.B.state.tab === "people", "entity not opened in People");
    click(x, '.tag.p[data-id="abraham"]'); var S2 = snap(x); ev.push("closed=" + J(S2) + " scrollY " + y0 + "→" + x.w.scrollY + " before=" + J(S));
    ok(J(S2) === J(S) && Math.abs(x.w.scrollY - y0) <= 1, "position/module not preserved"); clean(x);
  });
  t("004", "Places에서 장소 선택 후 Map으로 이동 — 동일 place entity_id 가 지도에서 선택", async function (ev) {
    var x = await load(""); click(x, '[data-vbtn="2"]'); click(x, '[data-tab="places"]'); var card = click(x, '#panel .item[data-id="moriah"]'); var id = x.B.state.entity && x.B.state.entity.id;
    click(x, '[data-tab="map"]'); var pin = x.d.querySelector("svg.map .pin.active"); ev.push("places selected=" + id + " map active pin=" + (pin && pin.dataset.kind + "." + pin.dataset.id));
    ok(id === "moriah" && pin && pin.dataset.id === id && pin.dataset.kind === "l" && x.B.state.entity.id === id, "entity_id mismatch on map"); clean(x);
  });
  t("005", "Map pin에서 장소 선택 — Places detail과 동일 entity가 열림", async function (ev) {
    var x = await load(""); click(x, '[data-tab="map"]'); click(x, 'svg.map .pin[data-id="moriah"]');
    var card = x.d.querySelector("#panel .item.active"); ev.push("tab=" + x.B.state.tab + " detail=" + (card && card.dataset.kind + "." + card.dataset.id) + " name=" + (card && card.querySelector("h3").textContent));
    ok(x.B.state.tab === "places" && card && card.dataset.id === "moriah" && x.B.state.entity.id === "moriah", "Places detail not same entity"); clean(x);
  });
  t("006", "Cross Reference preview — preview만으로 현재 본문이 교체되지 않음", async function (ev) {
    var x = await load(""); click(x, '[data-vbtn="2"]'); click(x, '[data-tab="crossref"]'); var S = snap(x), verses0 = x.d.getElementById("verses").innerHTML, ref0 = title(x), h0 = x.w.location.hash;
    click(x, "#panel [data-preview]"); var pv = x.d.getElementById("xref-preview"); ev.push("after preview: " + J(snap(x)) + " hash " + h0 + "→" + x.w.location.hash + " preview=" + (pv && pv.textContent.slice(0, 40)));
    ok(pv && pv.textContent.trim(), "no preview"); ok(J(snap(x)) === J(S) && title(x) === ref0 && x.d.getElementById("verses").innerHTML === verses0 && x.w.location.hash === h0, "current passage replaced by preview"); clean(x);
  });
  t("007", "Cross Reference 명시적 열기 — 새 passage 이동 · browser back 시 이전 workspace 복구", async function (ev) {
    // 합성 클릭은 user activation 이 없어 Chrome 이 history entry 를 back 에서 건너뛴다 → back 이 발생시키는 hashchange 로 구동. 실제 back 은 별도 수동 검증(보고서).
    var x = await load(""); click(x, '[data-vbtn="2"]'); click(x, '[data-tab="crossref"]'); var S = snap(x), before = x.w.location.hash;
    click(x, "#panel [data-goto]"); var S2 = snap(x); ev.push("explicit open → " + J(S2) + " hash=" + x.w.location.hash); ok(S2.passage === "heb-11" && S2.verse === 17 && x.w.location.hash !== before, "explicit open failed / no history entry");
    x.w.location.hash = before; await sleep(150); var S3 = snap(x); ev.push("back(hashchange) → " + J(S3) + " (before " + J(S) + ")"); ok(J(S3) === J(S) && x.d.querySelector('[data-verse="2"].sel'), "workspace not restored"); clean(x);
  });
  t("008", "잘못된 Bible reference — 오류를 표시하고 기존 passage를 제거하지 않음", async function (ev) {
    var x = await load("#heb-11:18"); var S = snap(x), v0 = x.d.getElementById("verses").innerHTML;
    for (var bad of ["#zzz-99", "#gen-22:99", "#gen-22:abc"]) { x.w.location.hash = bad; await sleep(120); var msg = x.d.getElementById("ref-error").textContent.trim(); ev.push(bad + " → " + J(snap(x)) + " error=\"" + msg + "\"");
      ok(J(snap(x)) === J(S) && x.d.getElementById("verses").innerHTML === v0, "passage removed/changed by " + bad); ok(msg.length > 0, "no error displayed for " + bad); }
    ok(x.w.__errs.length === 0); clean(x);
  });
  t("009", "remote photo source failure — Photos만 degraded, passage/context 사용 가능", async function (ev) {
    var x = await load(""); delete x.B.data.photos["ph-moriah"]; click(x, '[data-vbtn="2"]'); click(x, '[data-tab="photos"]');
    ev.push("photos degraded=" + !!x.d.querySelector("#panel .degraded") + " errors=" + x.w.__errs.length); ok(x.d.querySelector("#panel .degraded") && x.w.__errs.length === 0, "Photos not gracefully degraded");
    click(x, '[data-tab="context"]'); ok(x.d.querySelector('#panel [data-section="genre"]') && !x.d.querySelector("#panel .degraded"), "Context unusable"); click(x, '[data-vbtn="4"]'); ok(x.B.state.verse === 4 && $$(x, ".verse").length === N(x, "gen-22"), "passage unusable");
    ev.push("context usable, passage usable, verse=" + x.B.state.verse); clean(x);
  });
  t("010", "map tile/network failure — 장소 text list/detail 사용 가능", async function (ev) {
    var x = await load(""); x.B.data.places.moriah.x = undefined; x.B.data.places.moriah.y = null; click(x, '[data-vbtn="2"]'); click(x, '[data-tab="map"]');
    var mp = x.d.getElementById("panel"); ev.push("bad coords: degraded=" + !!mp.querySelector(".degraded") + " text-list ids=" + (mp.querySelector(".degraded") && mp.querySelector(".degraded").dataset.places) + " errors=" + x.w.__errs.length); ok(mp.querySelector(".degraded") && /moriah/.test(mp.querySelector(".degraded").dataset.places || "") && x.w.__errs.length === 0, "map not degraded with text list");
    click(x, '[data-tab="places"]'); var card = x.d.querySelector('#panel .item[data-id="moriah"]'); ok(card && card.querySelector(".vs"), "place detail unusable"); click(x, card); ok(x.B.state.entity.id === "moriah", "detail not selectable");
    var y = await load(""); y.B.panels.map = function () { throw new Error("tile/network failure"); }; click(y, '[data-vbtn="2"]'); click(y, '[data-tab="map"]'); ok(y.d.querySelector("#panel .degraded") && y.w.__errs.length === 0, "map panel failure not contained");
    click(y, '[data-tab="places"]'); ev.push("map panel throws: places list still has moriah card=" + !!y.d.querySelector('#panel .item[data-id="moriah"]')); ok(y.d.querySelector('#panel .item[data-id="moriah"]'), "places text list unavailable"); clean(x); clean(y);
  });
  t("011", "새로고침 — URL passage와 shareable workspace state 복원", async function (ev) {
    var x = await load(""); click(x, '[data-vbtn="2"]'); click(x, '.tag.l[data-id="moriah"]'); click(x, '[data-tab="map"]'); var S = snap(x), url = x.w.location.hash; await reload(x); var S2 = snap(x);
    ev.push("before=" + J(S) + " url=" + url + " | after reload=" + J(S2)); ok(J(S) === J(S2) && x.d.querySelector('[data-verse="2"].sel') && x.d.querySelector("svg.map .pin.active"), "not restored on reload");
    var y = await load(url); ok(J(snap(y)) === J(S), "shared URL does not restore in a fresh load"); ev.push("fresh load of shared URL=" + J(snap(y))); clean(x); clean(y);
  });
  t("012", "local note 작성 후 재실행 — 동일 browser에서 note 복원", async function (ev) {
    var x = await load(""); x.w.localStorage.removeItem("bvc.noteIndex"); click(x, '[data-vbtn="5"]'); click(x, '[data-tab="notes"]'); x.d.getElementById("note-text").value = "재실행 메모 NOTE-12"; click(x, "#note-save");
    await reload(x); x.B.go("gen-22", 5); click(x, '[data-tab="notes"]'); var v = x.d.getElementById("note-text").value; ev.push("after relaunch note=" + v); ok(/NOTE-12/.test(v), "note not restored");
    var y = await load(""); y.B.go("gen-22", 5); click(y, '[data-tab="notes"]'); ok(/NOTE-12/.test(y.d.getElementById("note-text").value), "note not restored in new load"); ev.push("new load note=" + y.d.getElementById("note-text").value);
    x.w.localStorage.removeItem("bvc.note.gen-22:5"); x.w.localStorage.removeItem("bvc.noteIndex"); clean(x); clean(y);
  });
  t("013", "local note — URL 또는 public source payload에 note가 노출되지 않음", async function (ev) {
    var x = await load(""), W = x.w, net = 0, of = W.fetch; W.fetch = function () { net++; return of.apply(W, arguments); }; var os = W.XMLHttpRequest.prototype.send; W.XMLHttpRequest.prototype.send = function () { net++; return os.apply(this, arguments); };
    if (W.navigator.sendBeacon) { var ob = W.navigator.sendBeacon.bind(W.navigator); W.navigator.sendBeacon = function () { net++; return ob.apply(null, arguments); }; }
    var res0 = W.performance.getEntriesByType("resource").length; W.localStorage.removeItem("bvc.noteIndex");
    click(x, '[data-vbtn="5"]'); click(x, '[data-tab="notes"]'); x.d.getElementById("note-text").value = "비공개 SECRET-13"; click(x, "#note-save"); click(x, "#note-export");
    var payload = J(x.B.data), files = ["index.html", "app.js", "data/fixture.js", "styles.css"], leaked = [];
    for (var f of files) if (/SECRET-13/.test(await (await fetch(f)).text())) leaked.push(f);
    ev.push("network calls=" + net + " new resources=" + (W.performance.getEntriesByType("resource").length - res0) + " href=" + W.location.href + " public-data-leak=" + /SECRET-13/.test(payload) + " source-file-leaks=" + J(leaked) + " keys=" + J(Object.keys(W.localStorage)));
    ok(net === 0 && W.performance.getEntriesByType("resource").length === res0, "network activity"); ok(!/SECRET/.test(W.location.href), "note in URL"); ok(!/SECRET-13/.test(payload) && !leaked.length, "note in public payload/source");
    ok(Object.keys(W.localStorage).every(function (k) { return /^bvc\./.test(k); }) && !W.document.cookie, "foreign storage"); W.localStorage.removeItem("bvc.note.gen-22:5"); W.localStorage.removeItem("bvc.noteIndex"); clean(x);
  });
  t("014", "desktop → mobile viewport 전환 — passage/entity identity 손실 없이 side panel이 sheet로 변환", async function (ev) {
    var x = await load("", 1200); click(x, '[data-vbtn="7"]'); click(x, '.tag.p[data-id="isaac"]'); var S = snap(x), ids = J([$$(x, "[data-verse]").map(function (e) { return e.dataset.verse; }), $$(x, "#panel .item").map(function (e) { return e.dataset.kind + e.dataset.id; })]);
    var pos1 = x.w.getComputedStyle(x.d.getElementById("side-pane")).position; x.f.style.width = "375px"; await sleep(200);
    var cs = x.w.getComputedStyle(x.d.getElementById("side-pane")), ids2 = J([$$(x, "[data-verse]").map(function (e) { return e.dataset.verse; }), $$(x, "#panel .item").map(function (e) { return e.dataset.kind + e.dataset.id; })]);
    ev.push("desktop side-pane position=" + pos1 + " → mobile position=" + cs.position + " bottom=" + cs.bottom + " state same=" + (J(snap(x)) === J(S)) + " ids same=" + (ids === ids2));
    ok(pos1 !== "fixed" && cs.position === "fixed" && parseFloat(cs.bottom) === 0, "side panel not converted to bottom sheet"); ok(J(snap(x)) === J(S) && ids === ids2 && x.d.querySelector("#panel .item.active[data-id=isaac]"), "identity lost"); ok(x.w.__errs.length === 0); clean(x);
  });
  t("015", "사진 표시 — source + rights/license 정보 추적 가능", async function (ev) {
    var x = await load(""), D = x.B.data, bad = [], ids = {};
    Object.keys(D.photos).forEach(function (k) { ["source", "rights", "license", "credit"].forEach(function (f) { if (!D.photos[k][f]) bad.push(k + "." + f); }); }); ev.push("missing provenance fields=" + J(bad)); ok(!bad.length, "missing: " + bad);
    for (var id of ["moriah", "beersheba"]) { x.B.go("gen-22"); x.B.selectEntity("l", id); x.B.setTab("photos");
      $$(x, "#panel .photo").forEach(function (f) { var p = D.photos[f.dataset.photo]; ids[f.dataset.photo] = 1; ok(f.dataset.source === p.source && f.dataset.rights === p.rights, "attrs mismatch"); ok(f.textContent.indexOf(p.source) >= 0 && f.textContent.indexOf(p.license) >= 0, "provenance not visible " + f.dataset.photo); }); }
    ev.push("rendered figures traced=" + J(Object.keys(ids))); ok(Object.keys(ids).length === 2, "expected 2 figures");
    var cases = { "source 누락": function (p) { delete p.source; }, "license 누락": function (p) { p.license = ""; }, "credit 누락": function (p) { delete p.credit; }, "rights 누락": function (p) { delete p.rights; } };
    for (var k of Object.keys(cases)) { var y = await load(""); cases[k](y.B.data.photos["ph-moriah"]); y.B.selectEntity("l", "moriah"); y.B.setTab("photos"); var n = $$(y, '#panel [data-photo="ph-moriah"]').length; ev.push(k + " → moriah figure rendered=" + n + " (other valid figures in scope: " + $$(y, "#panel .photo").length + ")"); ok(n === 0, k + " but rendered"); clean(y); }
    clean(x);
  });
  t("016", "rights=VERIFY media — 공개 이미지 본체를 렌더링하지 않음", async function (ev) {
    for (var val of ["VERIFY", "RIGHTS_VERIFY"]) { var x = await load(""); x.B.data.photos["ph-moriah"].rights = val; click(x, '[data-vbtn="2"]'); click(x, '[data-tab="photos"]');
      var n = $$(x, "#panel .photo").length, svg = $$(x, '#panel svg[role="img"]').length, body = x.d.body.innerHTML; ev.push("rights=" + val + " → figures=" + n + " image bodies=" + svg + " id/title in DOM=" + (/ph-moriah|모리아 지역/.test(body)));
      ok(n === 0 && svg === 0 && !/ph-moriah|모리아 지역/.test(body), "VERIFY media rendered (" + val + ")"); clean(x); }
  });
  t("017", "client normalized search — 대소문자·공백·기본 표기 변형 후 동일 canonical target 회수", async function (ev) {
    var x = await load(""); var inp = x.d.getElementById("search"); ok(inp, "no search input");
    var run = function (q) { inp.value = q; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); return $$(x, "#search-results [data-id]").map(function (e) { return e.dataset.kind + "." + e.dataset.id; }); };
    var groups = { "p.isaac": ["이삭", "이삭".normalize("NFD"), "  이삭  ", "Isaac", "ISAAC", " isaac ", "Ｉｓａａｃ"], "p.abraham": ["아브라함", "  아브라함   ", "ABRAHAM", "abraham", "Abram"], "l.moriah": ["모리아", "Moriah", "MORIAH", " moriah "] };
    for (var target of Object.keys(groups)) { var first = null; for (var q of groups[target]) { var r = run(q); ev.push(J(q) + " → " + J(r.slice(0, 3))); ok(r.indexOf(target) >= 0, J(q) + " did not retrieve " + target); ok(r[0] === target, J(q) + " top result " + r[0] + " != canonical " + target); } }
    ok(run("zzzz없는말").length === 0, "false positive"); clean(x);
  });
  t("018", "keyboard traversal — 본문 → 모듈 → detail → 본문으로 focus 회귀 가능", async function (ev) {
    var x = await load(""); var v = x.d.querySelector('[data-vbtn="3"]'); v.focus(); v.click();
    var tabbable = $$(x, "button, a[href], input, textarea, [tabindex]").filter(function (e) { return e.tabIndex >= 0 && !e.disabled; }), idx = function (e) { return tabbable.indexOf(e); };
    var iV = idx(x.d.querySelector('[data-vbtn="3"]')), iT = idx(x.d.querySelector('#tabs [aria-selected="true"]')); click(x, '[data-tab="people"]'); tabbable = $$(x, "button, a[href], input, textarea, [tabindex]").filter(function (e) { return e.tabIndex >= 0 && !e.disabled; });
    var iD = idx(x.d.querySelector('#panel .item[data-id="abraham"]')); ev.push("tab order index: 본문=" + iV + " 모듈=" + iT + " detail=" + iD); ok(iV >= 0 && iV < iT && iT < iD, "DOM/tab order is not 본문 → 모듈 → detail");
    var tb = x.d.querySelector('[data-tab="people"]'); tb.focus(); ok(x.d.activeElement === tb);
    var card = x.d.querySelector('#panel .item[data-id="abraham"]'); card.focus(); key(x, card, "Enter"); ev.push("detail opened=" + J(x.B.state.entity) + " active=" + (x.d.activeElement && (x.d.activeElement.dataset.id || x.d.activeElement.tagName))); ok(x.B.state.entity && x.B.state.entity.id === "abraham", "detail not opened by keyboard");
    key(x, x.d.activeElement, "Escape"); var a = x.d.activeElement; ev.push("after Escape entity=" + J(x.B.state.entity) + " active=" + (a && (a.className + " " + (a.dataset.id || a.dataset.vbtn || a.tagName)))); ok(!x.B.state.entity, "detail not closed");
    ok(a && a.closest("#text-pane") && a !== x.d.body, "focus did not return to passage text"); clean(x);
  });
  t("019", "optional modules 모두 실패 — Bible Passage Viewer 자체는 정상 동작", async function (ev) {
    var x = await load(""); Object.keys(x.B.panels).forEach(function (k) { x.B.panels[k] = function () { throw new Error("boom " + k); }; });
    TABS.forEach(function (tb) { click(x, '[data-tab="' + tb + '"]'); }); click(x, '[data-vbtn="2"]'); click(x, ".tag.p");
    ev.push("all panels throw: errors=" + J(x.w.__errs) + " verses=" + $$(x, ".verse").length + " sel=" + x.B.state.verse + " degraded=" + !!x.d.querySelector("#panel .degraded"));
    ok(x.w.__errs.length === 0 && $$(x, ".verse").length === N(x, "gen-22") && x.d.querySelector('[data-verse="2"].sel') && x.d.querySelector("#panel .degraded"), "Passage Viewer not alive"); openRef(x, "히 11"); ok(x.B.state.passage === "heb-11" && $$(x, ".verse").length === N(x, "heb-11"), "passage switch broken"); clean(x);
    var y = await load(""); ["people", "places", "photos", "crossrefs", "resources", "context", "placeLinks"].forEach(function (k) { delete y.B.data[k]; });
    TABS.forEach(function (tb) { click(y, '[data-tab="' + tb + '"]'); }); click(y, '[data-vbtn="3"]'); click(y, ".tag.p"); openRef(y, "창 12");
    ev.push("all optional data absent: errors=" + J(y.w.__errs) + " passage=" + y.B.state.passage + " verses=" + $$(y, ".verse").length); ok(y.w.__errs.length === 0 && y.B.state.passage === "gen-12" && $$(y, ".verse").length === N(y, "gen-12"), "viewer broken without optional data"); clean(y);
  });
  t("020", "HARAM 독립성 — HARAM 시각 자산·코드·고유 컴포넌트 복제 없음", async function (ev) {
    var files = ["index.html", "styles.css", "app.js", "data/fixture.js", "data/krv.js"], hit = [];
    for (var f of files) { var s = await (await fetch(f)).text(); var scripture = f === "data/krv.js", re = scripture ? /haram/i : /haram|하람/i; if (re.test(s)) hit.push(f); ev.push(f + " bytes=" + s.length + " haram-refs=" + (re.test(s) ? "YES" : "0") + (scripture ? " (scripture data: latin pattern only; '벧 하람' in Josh 13:27 is a place name)" : "")); }
    ok(!hit.length, "HARAM referenced in " + hit);
    var css = await (await fetch("styles.css")).text(), html = await (await fetch("index.html")).text(); ok(!/@import|url\(/i.test(css) && !/(src|href)=["']https?:/i.test(html) && !/<img|<link[^>]+icon/i.test(html), "external/visual asset reference");
    var x = await load(""); var ext = x.w.performance.getEntriesByType("resource").map(function (r) { return new URL(r.name); }).filter(function (u) { return u.origin !== x.w.location.origin; }).map(String);
    var names = x.w.performance.getEntriesByType("resource").map(function (r) { return r.name.split("/").pop(); }); ev.push("loaded resources=" + J(names) + " external=" + J(ext) + " img/image elements=" + $$(x, "img, image, picture, canvas, video").length);
    ok(!ext.length && !$$(x, "img, image, picture, canvas, video").length && names.every(function (n) { return /^(app\.js|styles\.css|fixture\.js|krv\.js|self-qa\.js|qa-auth\.js|qa-krv\.js|qa-w1\.js|qa-w2\.js|qa-sw\.js|index\.html)?$/.test(n.split("?")[0]); }), "external or unexpected assets"); clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) {
      var ev = [], pass = true, err = "";
      try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 12s")); }, 12000); })]); } catch (e) { pass = false; err = e.message; }
      (window.BVC_AUTH_PROGRESS = window.BVC_AUTH_PROGRESS || []).push(c.id + ":" + (pass ? "P" : "F")); res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev });
    }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_AUTH_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "auth-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "AUTHORITATIVE QA-BVC " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-BVC-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
    console.log("AUTH QA " + p + "/" + res.length);
  })();
})();
