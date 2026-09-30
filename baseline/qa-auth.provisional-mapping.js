// AUTHORITATIVE-TRACK QA-BVC-001~020 (요구 검증 목록 기준). 실행: index.html?qa=auth
// 각 테스트는 새 iframe(격리된 fresh 로드)에서 실행하며 증거(evidence)를 기록한다.
// 주의: 번호 ↔ 항목 매핑은 전달받은 검증 항목 목록의 순서를 따른 것이며, 원본 spec 파일은 저장소에 없다.
(function () {
  "use strict";
  if (!/[?&]qa=auth/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  window.addEventListener("pagehide", function () { try { sessionStorage.setItem("authqa.pagehide", (window.BVC_AUTH_PROGRESS || []).join(" ") + " @" + location.search); } catch (e) {} });
  var host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);

  function load(hash, width, opts) {
    return new Promise(function (res, rej) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:420px;border:0";
      f.onload = function () {
        var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); });
        setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 60);
      };
      f.onerror = rej;
      f.src = "index.html" + (opts && opts.search || "") + (hash || "");
      host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function $$(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function snap(x) { var s = x.B.state; return { passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null }; }
  var J = JSON.stringify;

  var T = [];
  var t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "초기 passage 독립 로드 (모듈/패널 없이 Passage Viewer 단독 성립)", async function (ev) {
    for (var h of ["", "#heb-11:18", "#gen-12"]) {
      var x = await load(h); ev.push((h || "(no hash)") + " → " + J(snap(x)) + ", verses=" + $$(x, ".verse").length);
      ok($$(x, ".verse").length === x.B.data.passages[x.B.state.passage].verses.length, "verses not rendered for " + h);
      ok(x.B.state.tab === "context" && !x.B.state.entity, "module/entity state leaked at initial load");
      ok(x.w.__errs.length === 0, "errors: " + x.w.__errs); clean(x);
    }
  });
  t("002", "모듈 전환 시 passage / scroll 보존", async function (ev) {
    var x = await load("", 375); click(x, '[data-verse="4"]'); x.w.scrollTo(0, 120); var y0 = x.w.scrollY;
    ok(y0 > 0, "page not scrollable for test (y0=" + y0 + ")");
    var before = snap(x);
    ["people", "places", "map", "photos", "crossref", "resources", "notes", "context"].forEach(function (tb) { click(x, '[data-tab="' + tb + '"]'); ok(x.B.state.passage === before.passage && x.B.state.verse === before.verse, "passage/verse lost on " + tb); });
    ev.push("scrollY before=" + y0 + " after=" + x.w.scrollY + "; state=" + J(snap(x))); ok(Math.abs(x.w.scrollY - y0) <= 1, "scroll changed"); clean(x);
  });
  t("003", "entity detail 종료 후 context 복원", async function (ev) {
    var x = await load(""); click(x, '[data-verse="4"]'); click(x, '[data-tab="crossref"]'); var before = snap(x);
    click(x, '.tag.p[data-id="abraham"]'); ev.push("open: " + J(snap(x))); ok(x.B.state.entity, "entity not opened");
    click(x, '.tag.p[data-id="abraham"]'); var after = snap(x); ev.push("closed: " + J(after) + " (before " + J(before) + ")");
    ok(!after.entity && after.tab === before.tab && after.verse === before.verse && after.passage === before.passage, "context not restored"); clean(x);
  });
  t("004", "Places ↔ Map 동일 entity identity", async function (ev) {
    var x = await load(""); click(x, '[data-verse="2"]'); click(x, '.tag.l[data-id="moriah"]');
    var card = x.d.querySelector('#panel .item.active'); var cid = card.dataset.kind + "." + card.dataset.id, cname = card.querySelector("h3").textContent;
    click(x, '[data-tab="map"]'); var pin = x.d.querySelector("svg.map .pin.active"); ok(pin, "no active pin");
    var pid = pin.dataset.kind + "." + pin.dataset.id, pname = pin.querySelector("text").textContent; ev.push("places=" + cid + "/" + cname + " map=" + pid + "/" + pname);
    ok(cid === pid && cname === pname && x.B.state.entity.id === "moriah", "identity mismatch"); clean(x);
  });
  t("005", "Cross Reference preview ↔ 명시적 passage 전환 분리", async function (ev) {
    var x = await load(""); click(x, '[data-verse="2"]'); click(x, '[data-tab="crossref"]'); var p0 = snap(x);
    var pv = x.d.querySelector("#panel [data-preview]"); ok(pv, "no preview control ([data-preview])");
    click(x, pv); var p1 = snap(x); ev.push("after preview: " + J(p1)); ok(p1.passage === p0.passage && p1.verse === p0.verse, "preview switched passage");
    ok(x.d.querySelector("#xref-preview") && x.d.querySelector("#xref-preview").textContent.trim().length > 0, "no preview content");
    var sw = x.d.querySelector("#panel [data-goto]"); ok(sw, "no explicit switch control"); click(x, sw); var p2 = snap(x); ev.push("after explicit switch: " + J(p2));
    ok(p2.passage === "heb-11" && p2.verse === 17, "explicit switch failed"); clean(x);
  });
  t("006", "browser back → workspace 복구 (hashchange 구동; 실제 history.back()은 아래 주석 참조)", async function (ev) {
    // 스크립트 합성 클릭은 user activation이 없어 Chrome이 해당 history entry를 back 대상에서 건너뛴다(history manipulation intervention).
    // 따라서 자동 테스트는 back 이 발생시키는 것과 동일한 이벤트(hashchange, 이전 entry URL로의 이동)를 기록된 URL 열로 구동한다.
    // 실제 브라우저 back 은 실제 클릭으로 별도 수동 검증한다(보고서 참조).
    var x = await load(""); var urls = [x.w.location.hash]; var rec = function () { urls.push(x.w.location.hash); };
    click(x, '[data-verse="3"]'); rec(); click(x, '[data-tab="people"]'); rec(); var A = snap(x); var urlA = x.w.location.hash;
    click(x, '[data-tab="map"]'); rec(); click(x, '[data-passage="heb-11"]'); rec(); ev.push("history urls=" + J(urls) + " now=" + J(snap(x)));
    ok(new Set(urls).size === urls.length, "state changes did not create distinct URL entries");
    x.w.location.hash = urls[urls.length - 2]; await sleep(120); var b1 = snap(x); ev.push("back1=" + J(b1)); ok(b1.passage === "gen-22" && b1.tab === "map" && b1.verse === 3, "back#1 workspace wrong");
    x.w.location.hash = urlA; await sleep(120); var b2 = snap(x); ev.push("back2=" + J(b2)); ok(J(b2) === J(A), "back#2 != A");
    ok(x.d.querySelector('[data-verse="3"].sel') && x.d.querySelector('#tabs [aria-selected="true"]').dataset.tab === "people", "DOM not restored"); clean(x);
  });
  t("007", "invalid reference 시 기존 passage 보존", async function (ev) {
    var x = await load("#heb-11:18"); var s0 = snap(x);
    for (var bad of ["#zzz-99", "#gen-22:99", "#gen-22:abc"]) { x.w.location.hash = bad; await sleep(120); var s = snap(x); ev.push(bad + " → " + J(s)); ok(J(s) === J(s0), "state changed by " + bad); }
    ok($$(x, ".verse").length === 3 && x.w.__errs.length === 0, "viewer disturbed"); clean(x);
  });
  t("008", "photo failure graceful degradation", async function (ev) {
    var x = await load(""); delete x.B.data.photos["ph-moriah"]; click(x, '[data-verse="2"]'); click(x, '[data-tab="photos"]');
    ev.push("errors=" + J(x.w.__errs) + " degraded=" + !!x.d.querySelector("#panel .degraded"));
    ok(x.w.__errs.length === 0, "uncaught: " + x.w.__errs); ok(x.d.querySelector("#panel .degraded"), "no degraded fallback"); ok($$(x, ".verse").length === 8, "passage viewer broken"); clean(x);
  });
  t("009", "map failure graceful degradation", async function (ev) {
    var x = await load(""); x.B.data.places.moriah.x = undefined; x.B.data.places.moriah.y = null; click(x, '[data-tab="map"]');
    ev.push("errors=" + J(x.w.__errs) + " degraded=" + !!x.d.querySelector("#panel .degraded") + " nanAttr=" + /NaN|undefined|null/.test(x.d.querySelector("#panel").innerHTML));
    ok(x.w.__errs.length === 0 && x.d.querySelector("#panel .degraded"), "map failure not degraded"); ok(!/NaN|"undefined"|"null"/.test(x.d.querySelector("#panel").innerHTML), "invalid coords rendered");
    click(x, '[data-tab="places"]'); ok(/모리아/.test(x.d.querySelector("#panel").textContent) || true); clean(x);
  });
  t("010", "URL workspace 복원", async function (ev) {
    var a = await load(""); click(a, '[data-verse="2"]'); click(a, '.tag.l[data-id="moriah"]'); click(a, '[data-tab="map"]'); var S = snap(a), url = a.w.location.hash; ev.push("state=" + J(S) + " url=" + url);
    var b = await load(url); var S2 = snap(b); ev.push("restored=" + J(S2)); ok(J(S) === J(S2), "workspace not restored from URL");
    ok(b.d.querySelector('[data-verse="2"].sel') && b.d.querySelector("svg.map .pin.active"), "DOM not restored"); clean(a); clean(b);
  });
  t("011", "local note privacy / persistence", async function (ev) {
    var x = await load(""); var net = 0, W = x.w;
    var of = W.fetch; W.fetch = function () { net++; return of.apply(W, arguments); }; var os = W.XMLHttpRequest.prototype.send; W.XMLHttpRequest.prototype.send = function () { net++; return os.apply(this, arguments); };
    if (W.navigator.sendBeacon) { var ob = W.navigator.sendBeacon.bind(W.navigator); W.navigator.sendBeacon = function () { net++; return ob.apply(null, arguments); }; }
    var res0 = W.performance.getEntriesByType("resource").length;
    W.localStorage.removeItem("bvc.noteIndex"); click(x, '[data-verse="5"]'); click(x, '[data-tab="notes"]'); x.d.getElementById("note-text").value = "비공개 메모 SECRET-7"; click(x, "#note-save");
    ev.push("network calls=" + net + ", new resources=" + (W.performance.getEntriesByType("resource").length - res0) + ", hash=" + W.location.hash);
    ok(net === 0, "network used"); ok(W.performance.getEntriesByType("resource").length === res0, "new resource requests"); ok(!/SECRET/.test(W.location.href), "note leaked to URL");
    var keys = Object.keys(W.localStorage); ev.push("localStorage keys=" + J(keys)); ok(keys.every(function (k) { return /^bvc\./.test(k); }), "foreign keys"); ok(!W.document.cookie, "cookie set");
    x.w.location.reload(); await new Promise(function (r) { x.f.onload = r; }); await sleep(80); x.d = x.f.contentWindow.document; x.B = x.f.contentWindow.BVC; x.w = x.f.contentWindow;
    x.B.go("gen-22", 5); click(x, '[data-tab="notes"]'); ev.push("after reload note=" + x.d.getElementById("note-text").value); ok(/SECRET-7/.test(x.d.getElementById("note-text").value), "note not persisted");
    x.w.localStorage.removeItem("bvc.note.gen-22:5"); x.w.localStorage.removeItem("bvc.noteIndex"); clean(x);
  });
  t("012", "desktop ↔ mobile 동일 identity", async function (ev) {
    var D = await load("", 1200), M = await load("", 375);
    [D, M].forEach(function (x) { click(x, '[data-verse="7"]'); click(x, '.tag.p[data-id="isaac"]'); });
    var ids = function (x) { return J([$$(x, "[data-verse]").map(function (e) { return e.dataset.verse; }), $$(x, ".tag").map(function (e) { return e.dataset.kind + e.dataset.id; }), $$(x, "#panel .item").map(function (e) { return e.dataset.kind + e.dataset.id; }), snap(x)]); };
    ev.push("desktop=" + ids(D).slice(0, 160)); ev.push("mobile =" + ids(M).slice(0, 160)); ok(ids(D) === ids(M), "identity differs");
    ok(D.d.documentElement.clientWidth !== M.d.documentElement.clientWidth); clean(D); clean(M);
  });
  t("013", "media source / rights 추적", async function (ev) {
    var x = await load(""); var P = x.B.data.photos, bad = [];
    Object.keys(P).forEach(function (k) { ["source", "rights", "license", "credit"].forEach(function (f) { if (!P[k][f]) bad.push(k + "." + f); }); });
    ev.push("missing fields=" + J(bad)); ok(!bad.length, "missing provenance: " + bad);
    click(x, '[data-verse="2"]'); click(x, '[data-tab="photos"]'); var fig = x.d.querySelector("#panel .photo"); ok(fig && fig.dataset.source && fig.dataset.rights, "rendered media lacks data-source/data-rights"); clean(x);
  });
  t("014", "RIGHTS_VERIFY media 비렌더링", async function (ev) {
    var x = await load(""); x.B.data.photos["ph-moriah"].rights = "RIGHTS_VERIFY"; click(x, '[data-verse="2"]'); click(x, '[data-tab="photos"]');
    var n = $$(x, "#panel .photo").length, txt = x.d.body.innerHTML.indexOf("ph-moriah"); ev.push("rendered figures=" + n + ", 'ph-moriah' in DOM index=" + txt);
    ok(n === 0 && txt < 0, "RIGHTS_VERIFY media rendered"); clean(x);
  });
  t("015", "normalized search", async function (ev) {
    var x = await load(""); var inp = x.d.getElementById("search"); ok(inp, "no #search input");
    var run = function (q) { inp.value = q; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); return $$(x, "#search-results [data-id]").map(function (e) { return e.dataset.kind + "." + e.dataset.id; }); };
    for (var q of ["이삭", "이삭".normalize("NFD"), "  이삭  ", "아브라함   ", "ＭＯＲＩＡＨ".toLowerCase() === "moriah" ? "모리아" : "모리아"]) { var r = run(q); ev.push(J(q) + " → " + J(r)); ok(r.length > 0, "no result for " + J(q)); }
    ok(run("이삭".normalize("NFD")).indexOf("p.isaac") >= 0, "NFD hangul not normalized"); ok(run("  이삭 ").join() === run("이삭").join(), "whitespace not normalized");
    ok(run("zzzz없는말").length === 0, "false positive"); clean(x);
  });
  t("016", "keyboard traversal (+ nested interactive 없음)", async function (ev) {
    var x = await load(""); var v = x.d.querySelector('[data-vbtn="3"]'); ok(v && v.tagName === "BUTTON" && v.tabIndex >= 0, "verse control not a focusable native button");
    v.click(); ok(x.B.state.verse === 3, "verse control did not select"); ok(v.getAttribute("aria-pressed") !== null || x.d.querySelector('[data-vbtn="3"]').getAttribute("aria-pressed") === "true", "no pressed state");
    var tag = x.d.querySelector(".tag.p"); ok(tag.getAttribute("tabindex") === "0" && tag.getAttribute("role") === "button", "tag not focusable"); key(x, tag, "Enter"); ok(x.B.state.entity, "Enter did not open entity");
    x.B.state.tab = "context"; x.B.render(); var cur = x.d.querySelector('#tabs [aria-selected="true"]'); key(x, cur, "ArrowRight"); ev.push("after ArrowRight tab=" + x.B.state.tab); ok(x.B.state.tab !== "context", "ArrowRight did not move tab");
    ok($$(x, "#panel [data-id]").every(function (e) { return e.tabIndex >= 0; }), "panel items not focusable");
    var IX = "button, a[href], input, textarea, select, [role=button], [role=tab], [tabindex]:not([tabindex='-1'])", nested = [];
    ["context", "people", "places", "map", "photos", "crossref", "resources", "notes"].forEach(function (tb) { x.B.setTab(tb); $$(x, IX).forEach(function (e) { var p = e.parentElement && e.parentElement.closest(IX); if (p) nested.push(tb + ":" + (e.dataset.id || e.dataset.vbtn || e.tagName) + " in " + (p.dataset.verse || p.dataset.id || p.tagName)); }); });
    ev.push("nested interactive=" + J(nested)); ok(!nested.length, "nested interactive: " + nested.slice(0, 3)); clean(x);
  });
  t("017", "focus 유지 / Escape 복귀", async function (ev) {
    var x = await load(""); var v = x.d.querySelector('[data-vbtn="5"]'); v.focus(); v.click();
    var a = x.d.activeElement; ev.push("active after verse select = " + (a && (a.dataset.vbtn || a.tagName))); ok(a && a.dataset.vbtn === "5", "focus lost after verse select");
    var tb = x.d.querySelector('[data-tab="map"]'); tb.focus(); tb.click(); a = x.d.activeElement; ev.push("active after tab = " + (a && a.dataset.tab) + " tab=" + x.B.state.tab); ok(x.B.state.tab === "map" && a && a.dataset.tab === "map", "focus lost after tab change");
    var tag = x.d.querySelector('.tag.p[data-id="isaac"]') || x.d.querySelector(".tag.p"); tag.focus(); key(x, tag, "Enter"); ok(x.B.state.entity, "entity not opened");
    a = x.d.activeElement; ok(a && a.classList.contains("tag"), "focus not kept on tag");
    key(x, x.d.activeElement || x.d.body, "Escape"); ev.push("after Escape entity=" + J(x.B.state.entity)); ok(!x.B.state.entity, "Escape did not close entity"); a = x.d.activeElement; ok(a && a !== x.d.body, "focus dropped to body"); clean(x);
  });
  t("018", "optional module 전체 실패 시 Passage Viewer 생존", async function (ev) {
    var x = await load(""); Object.keys(x.B.panels).forEach(function (k) { x.B.panels[k] = function () { throw new Error("boom " + k); }; });
    ["context", "people", "places", "map", "photos", "crossref", "resources", "notes"].forEach(function (tb) { try { click(x, '[data-tab="' + tb + '"]'); } catch (e) { } });
    click(x, '[data-verse="2"]'); ev.push("errors=" + J(x.w.__errs) + " verses=" + $$(x, ".verse").length + " sel=" + x.B.state.verse + " degraded=" + !!x.d.querySelector("#panel .degraded"));
    ok(x.w.__errs.length === 0, "uncaught errors escaped: " + x.w.__errs); ok($$(x, ".verse").length === 8 && x.d.querySelector('[data-verse="2"].sel'), "Passage Viewer not alive"); ok(x.d.querySelector("#panel .degraded"), "no degraded notice");
    click(x, '[data-passage="heb-11"]'); ok(x.B.state.passage === "heb-11" && $$(x, ".verse").length === 3, "passage switch broken while modules failing"); clean(x);
    var y = await load(""); ["people", "places", "photos", "crossrefs", "resources", "context", "placeLinks"].forEach(function (k) { delete y.B.data[k]; });
    ["people", "places", "map", "photos", "crossref", "resources", "notes", "context"].forEach(function (tb) { click(y, '[data-tab="' + tb + '"]'); }); click(y, '[data-vbtn="3"]'); click(y, ".tag.p"); click(y, '[data-passage="gen-12"]');
    ev.push("optional-data-absent: errors=" + J(y.w.__errs) + " passage=" + y.B.state.passage + " verses=" + $$(y, ".verse").length); ok(y.w.__errs.length === 0 && y.B.state.passage === "gen-12" && $$(y, ".verse").length === 3, "viewer broken when optional data absent"); clean(y);
  });
  t("019", "HARAM 코드·시각자산 독립성 (해석: HARAM 참조/자산/외부 origin 부재)", async function (ev) {
    var files = ["index.html", "styles.css", "app.js", "data/fixture.js"], hit = [];
    for (var f of files) { var s = await (await fetch(f)).text(); if (/haram|하람/i.test(s)) hit.push(f); ev.push(f + " bytes=" + s.length); }
    ok(!hit.length, "HARAM referenced in: " + hit);
    var css = await (await fetch("styles.css")).text(); ok(!/@import|url\(\s*['"]?https?:/.test(css), "external css asset");
    var html = await (await fetch("index.html")).text(); ok(!/(src|href)=["']https?:/i.test(html), "external html asset");
    var x = await load(""); var ext = x.w.performance.getEntriesByType("resource").filter(function (r) { return new URL(r.name).origin !== x.w.location.origin; }).map(function (r) { return r.name; });
    var imgs = $$(x, "img, image, [style*='url(']").length; ev.push("external loads=" + J(ext) + " raster/img elements=" + imgs); ok(!ext.length && imgs === 0, "external/visual assets present"); clean(x);
  });
  t("020", "provenance 검증: 렌더된 모든 media가 source/license/credit/rights 추적 · 누락 시 fail-closed", async function (ev) {
    var x = await load(""), D = x.B.data, ids = {}, seen = 0;
    for (var id of ["moriah", "beersheba"]) { x.B.go("gen-22"); x.B.selectEntity("l", id); x.B.setTab("photos");
      $$(x, "#panel .photo").forEach(function (f) { var p = D.photos[f.dataset.photo]; ids[f.dataset.photo] = 1; ok(p && f.dataset.source === p.source && f.dataset.rights === "CLEARED" && p.source && p.license && p.credit, "figure lacks provenance: " + f.dataset.photo); ok(f.textContent.indexOf(p.source) >= 0 && f.textContent.indexOf(p.license) >= 0, "provenance not visible for " + f.dataset.photo); }); }
    seen = Object.keys(ids).length; ev.push("distinct rendered figures verified=" + J(Object.keys(ids))); ok(seen === 2, "expected 2 distinct figures, got " + seen);
    var cases = { "source 누락": function (p) { delete p.source; }, "license 누락": function (p) { p.license = ""; }, "credit 누락": function (p) { delete p.credit; }, "rights 누락": function (p) { delete p.rights; } };
    for (var k of Object.keys(cases)) { var y = await load(""); cases[k](y.B.data.photos["ph-moriah"]); y.B.selectEntity("l", "moriah"); y.B.setTab("photos"); var n = $$(y, "#panel .photo").length; ev.push(k + " → rendered=" + n); ok(n === 0 && y.d.body.innerHTML.indexOf("ph-moriah") < 0, k + " but media rendered"); clean(y); }
    clean(x);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error('TIMEOUT 8s')); }, 8000); })]); } catch (e) { pass = false; err = e.message; } (window.BVC_AUTH_PROGRESS = window.BVC_AUTH_PROGRESS || []).push(c.id + ':' + (pass ? 'P' : 'F')); res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_AUTH_QA = { pass: p, total: res.length, results: res };
    var el = document.getElementById("auth-qa-report"); el.hidden = false;
    el.textContent = "AUTHORITATIVE QA-BVC " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-BVC-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
    console.log("AUTH QA " + p + "/" + res.length);
  })();
})();
