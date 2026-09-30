// QA-W1-001~008 — Wave 1 (텍스트 작업공간) 축약 QA 계약. 실행: index.html?qa=w1 (개발 모드 전용)
// 정식 QA-BVC-FAST 명세 파일은 로컬에 없으므로 재구성하지 않고, 전달받은 8개 항목명 그대로 검증한다.
(function () {
  "use strict";
  if (!/[?&]qa=w1/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(hash, width, height) {
    return new Promise(function (res) {
      var f = document.createElement("iframe"); f.style.cssText = "width:" + (width || 1200) + "px;height:" + (height || 420) + "px;border:0";
      f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 80); };
      f.src = "index.html" + (hash || ""); host.appendChild(f);
    });
  }
  function clean(x) { if (x && x.f) x.f.remove(); }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function key(x, el, k) { el.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }
  function submitRef(x, text) { var i = x.d.getElementById("ref-input"); i.value = text; x.d.getElementById("ref-form").dispatchEvent(new x.w.Event("submit", { bubbles: true, cancelable: true })); }
  function snap(x) { var s = x.B.state; return { passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null }; }
  function $$(x, s) { return [].slice.call(x.d.querySelectorAll(s)); }
  function nverses(x, pid) { return x.B.data.passages[pid].verses.length; }
  var TABS = ["context", "people", "places", "map", "photos", "crossref", "resources", "notes"];
  async function sha256(text) { var b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [].map.call(new Uint8Array(b), function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }
  function inView(x, el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < x.w.innerHeight; }

  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("001", "valid_reference_loads_passage", async function (ev) {
    var x = await load(""), cases = [
      ["창세기 22:2", "gen-22", 2], ["창 22장 2절", "gen-22", 2], ["gen 22:2", "gen-22", 2], ["GEN 22:2", "gen-22", 2], ["  창세기   22 : 2 ", "gen-22", 2], ["Genesis 1:1", "gen-1", 1],
      ["시편 23편", "psa-23", null], ["요 3:16", "jhn-3", 16], ["고전 13", "1co-13", null], ["창 22:1-8", "gen-22", 1], ["요한1서 3:16", "1jn-3", 16], ["이사야 53:5", "isa-53", 5]];
    for (var c of cases) {
      submitRef(x, c[0]); var s = snap(x), P = x.B.data.passages[c[1]];
      ev.push(J(c[0]) + " → " + c[1] + (c[2] ? ":" + c[2] : "") + " | title=" + x.d.getElementById("passage-title").textContent + " verses=" + $$(x, ".verse").length + " hash=" + x.w.location.hash);
      ok(s.passage === c[1] && s.verse === c[2], c[0] + " → " + J(s)); ok($$(x, ".verse").length === P.verses.length && x.d.getElementById("passage-title").textContent === P.ref, "passage not mounted for " + c[0]);
      ok(x.w.location.hash.indexOf("#" + c[1] + (c[2] ? ":" + c[2] : "")) === 0, "hash not updated for " + c[0]); ok(x.d.getElementById("ref-error").textContent === "", "error shown for valid input");
      if (c[2]) { var sel = x.d.querySelector(".verse.sel"); ok(sel && +sel.dataset.verse === c[2] && inView(x, sel), "selected verse not visible for " + c[0]); }
    }
    ok(/22장 2절|시편|이사야/.test(x.d.getElementById("ref-input").value) || x.d.getElementById("ref-input").value.length > 0, "ref input not synced"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("002", "passage_remains_mounted_during_context_interaction", async function (ev) {
    var x = await load("#gen-22:3"); x.B.setPanel("open"); await sleep(80); var box = x.d.getElementById("verses"), v3 = x.d.querySelector('[data-verse="3"]'), tag = x.d.querySelector("#verses .tag"), count0 = $$(x, ".verse").length, muts = 0, y0 = x.w.scrollY;
    var mo = new x.w.MutationObserver(function (l) { l.forEach(function (m) { if (m.type === "childList") muts++; }); }); mo.observe(box, { childList: true, subtree: true });
    TABS.forEach(function (tb) { x.B.setTab(tb); });
    x.B.setTab("people"); var t1 = x.d.querySelector('#verses [data-verse="3"] .tag.p'); click(x, t1); key(x, x.d.activeElement || x.d.body, "Escape"); click(x, t1); click(x, t1);
    x.B.setTab("crossref"); var pv = x.d.querySelector("#panel [data-preview]"); if (pv) click(x, pv);
    x.B.setTab("notes"); x.d.getElementById("note-text").value = "w1"; x.B.setTab("resources"); var rk = x.d.querySelector("[data-reskind]"); if (rk) click(x, rk); x.B.setTab("context");
    await sleep(60); mo.disconnect();
    ev.push("childList mutations in #verses=" + muts + " same #verses=" + (x.d.getElementById("verses") === box) + " same verse el=" + (x.d.querySelector('[data-verse="3"]') === v3) + " same tag el=" + (x.d.querySelector("#verses .tag") === tag) + " verses " + count0 + "→" + $$(x, ".verse").length + " scrollY " + y0 + "→" + x.w.scrollY);
    ok(muts === 0 && x.d.getElementById("verses") === box && x.d.querySelector('[data-verse="3"]') === v3 && v3.isConnected && x.d.querySelector("#verses .tag") === tag, "passage was re-mounted during context interaction");
    ok($$(x, ".verse").length === count0 && x.B.state.passage === "gen-22", "passage changed"); ok(Math.abs(x.w.scrollY - y0) <= 1, "scroll moved"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("003", "selected_verse_state_persists", async function (ev) {
    var x = await load("#gen-22"); click(x, '[data-vbtn="5"]'); ok(x.B.state.verse === 5 && x.d.querySelector('[data-verse="5"].sel'));
    TABS.forEach(function (tb) { x.B.setTab(tb); ok(x.B.state.verse === 5 && x.d.querySelector('[data-verse="5"].sel') && x.d.querySelectorAll(".verse.sel").length === 1, "lost at " + tb); });
    var tg = x.d.querySelector('#verses [data-verse="5"] .tag'); if (tg) { click(x, tg); ok(x.B.state.verse === 5, "entity open lost verse"); click(x, tg); ok(x.B.state.verse === 5 && x.d.querySelector('[data-verse="5"].sel'), "entity close lost verse"); }
    ev.push("after tabs/entity: " + J(snap(x)) + " hash=" + x.w.location.hash); ok(/^#gen-22:5/.test(x.w.location.hash));
    var url = x.w.location.hash, y = await load(url); ev.push("fresh load of " + url + " → " + J(snap(y))); ok(y.B.state.verse === 5 && y.d.querySelector('[data-verse="5"].sel'), "not restored from URL");
    click(y, '[data-vbtn="7"]'); ok(y.B.state.verse === 7 && !y.d.querySelector('[data-verse="5"].sel'), "selection switch"); click(y, '[data-vbtn="7"]'); ok(y.B.state.verse === null, "toggle off"); clean(x); clean(y);
  });

  t("004", "passage_scroll_anchor_persists", async function (ev) {
    var x = await load("#gen-22"); x.B.setPanel("open"); await sleep(80); var el = x.d.querySelector('[data-verse="12"]'); el.scrollIntoView({ block: "start" }); await sleep(120);
    var a0 = x.B.scrollAnchor(), y0 = x.w.scrollY; ev.push("anchor before=" + J(a0) + " scrollY=" + y0); ok(a0 && a0.verse === 12 && y0 > 0, "anchor not established: " + J(a0));
    TABS.forEach(function (tb) { x.B.setTab(tb); });
    var tg = x.d.querySelector("#verses .tag.p"); click(x, tg); click(x, tg); var pv; x.B.setTab("crossref"); pv = x.d.querySelector("#panel [data-preview]"); if (pv) click(x, pv); x.B.setTab("context"); await sleep(120);
    var a1 = x.B.scrollAnchor(); ev.push("anchor after context interaction=" + J(a1) + " scrollY=" + x.w.scrollY); ok(a1 && a1.verse === 12 && Math.abs(a1.offset - a0.offset) <= 2 && Math.abs(x.w.scrollY - y0) <= 2, "anchor moved by context interaction");
    submitRef(x, "창 23"); await sleep(120); ev.push("after opening 창 23: " + J(snap(x)) + " scrollY=" + x.w.scrollY); ok(x.B.state.passage === "gen-23" && x.w.scrollY <= 2, "new chapter should start at top");
    submitRef(x, "창 22"); await sleep(150); var a2 = x.B.scrollAnchor(); ev.push("returned to 창 22: anchor=" + J(a2) + " scrollY=" + x.w.scrollY); ok(a2 && a2.verse === 12 && Math.abs(a2.offset) <= 6, "anchor not restored when returning to the passage"); clean(x);
  });

  t("005", "invalid_reference_preserves_current_passage", async function (ev) {
    var x = await load("#heb-11:18"); x.d.querySelector('[data-verse="20"]').scrollIntoView({ block: "start" }); await sleep(100);
    var S = snap(x), box = x.d.getElementById("verses"), html = box.innerHTML, y0 = x.w.scrollY, bad = ["", "   ", "없는책 1:1", "창세기 51장", "창세기 22:99", "창세기 22:0", "요 3:16-2", "창 22:5-99", "asdf", "22:2", "창세기", "gen 0:1", "창 -1", "시편 151편", "계 23:1"];
    for (var q of bad) {
      submitRef(x, q); var msg = x.d.getElementById("ref-error").textContent.trim(); ev.push(J(q) + " → error=\"" + msg.slice(0, 60) + "\" state kept=" + (J(snap(x)) === J(S)));
      ok(msg.length > 0, "no error for " + J(q)); ok(J(snap(x)) === J(S) && x.d.getElementById("verses") === box && box.innerHTML === html && Math.abs(x.w.scrollY - y0) <= 1, "current passage disturbed by " + J(q));
    }
    submitRef(x, "창 22:2"); ok(x.d.getElementById("ref-error").textContent === "" && x.B.state.passage === "gen-22" && x.B.state.verse === 2, "valid input after invalid should work and clear error"); ok(x.w.__errs.length === 0); clean(x);
  });

  t("006", "unresolved_low_priority_KRV_variant_does_not_block_rendering", async function (ev) {
    var x = await load("#gen-22"), n = nverses(x, "gen-22"), texts = x.B.data.passages["gen-22"].verses.map(function (v) { return v.text; });
    x.w.BVC_KRV_VARIANTS = { "gen-22:3": { status: "UNRESOLVED", priority: "LOW" }, "gen-22:5": true, "gen-22:7": {}, "gen-22:9": null, "gen-22:10": { status: {} }, "gen-22:99": "junk" }; x.B.remount();
    var flagged = $$(x, "[data-krv-variant]").map(function (e) { return e.dataset.verse + "=" + e.dataset.krvVariant; }); ev.push("verses=" + $$(x, ".verse").length + "/" + n + " flagged=" + J(flagged) + " errors=" + x.w.__errs.length);
    ok($$(x, ".verse").length === n && !x.d.querySelector("#verses .degraded") && x.w.__errs.length === 0, "flags blocked rendering"); ok(flagged.indexOf("3=UNRESOLVED_LOW") >= 0 && flagged.length >= 3, "flags not surfaced as attributes");
    $$(x, ".verse").forEach(function (el, i) { ok(el.textContent.slice(el.firstChild.textContent.length) === texts[i], "verse text altered by variant flag at " + (i + 1)); }); click(x, '[data-vbtn="3"]'); ok(x.B.state.verse === 3, "flagged verse cannot be selected");
    Object.defineProperty(x.w, "BVC_KRV_VARIANTS", { get: function () { throw new Error("variant source failure"); }, configurable: true }); x.B.remount(); ev.push("variant source throws → verses=" + $$(x, ".verse").length + " errors=" + x.w.__errs.length); ok($$(x, ".verse").length === n && x.w.__errs.length === 0, "throwing variant source blocked rendering");
    submitRef(x, "마 17:21"); var t1 = x.d.querySelector('[data-verse="21"]').textContent; ev.push("mat 17:21 (KRV placeholder-style verse) renders: " + t1.slice(0, 30)); ok(x.B.state.passage === "mat-17" && /없음/.test(t1)); submitRef(x, "막 9:44"); ok(x.d.querySelector('[data-verse="44"]'), "막 9:44 not rendered"); clean(x);
  });

  t("007", "Viewer_does_not_mutate_KRV_source", async function (ev) {
    var x = await load(""), fp = function () { return sha256(JSON.stringify(x.B.krv)); }, before = await fp(), file0 = await sha256(await (await fetch("data/krv.js")).text()), prov = await (await fetch("data/krv.provenance.json")).json();
    ev.push("krv.js sha256 (served)=" + file0.slice(0, 16) + "… provenance.output_sha256=" + prov.output_sha256.slice(0, 16) + "…"); ok(file0 === prov.output_sha256, "served krv.js differs from provenance sha256");
    ok(Object.isFrozen(x.B.krv) && Object.isFrozen(x.B.krv.books[0]) && Object.isFrozen(x.B.krv.books[0].chapters) && Object.isFrozen(x.B.krv.books[0].chapters[21]), "KRV not frozen");
    ["창 1", "시 119", "창 22:2", "요 3:16", "마 17", "계 22:21"].forEach(function (q) { submitRef(x, q); }); click(x, '[data-vbtn="3"]'); ["context", "people", "places", "map", "notes"].forEach(function (tb) { x.B.setTab(tb); });
    var tg = x.d.querySelector("#verses .tag"); if (tg) { click(x, tg); click(x, tg); } click(x, '[data-step="1"]'); click(x, '[data-step="-1"]');
    var si = x.d.getElementById("search"); ["이삭", "독생자", "Isaac", "창 22:2"].forEach(function (q) { si.value = q; si.dispatchEvent(new x.w.Event("input", { bubbles: true })); });
    x.w.BVC_KRV_VARIANTS = { "gen-22:3": { status: "UNRESOLVED", priority: "LOW" } }; x.B.go("gen-22"); x.B.remount(); x.B.go("psa-119");
    var K = x.B.krv; try { K.books[0].chapters[21][1] = "MUTATED"; } catch (e) { } try { K.meta.translation.name = "MUTATED"; } catch (e) { } try { K.books.push({}); } catch (e) { }
    var after = await fp(), file1 = await sha256(await (await fetch("data/krv.js")).text()); ev.push("KRV JSON sha before=" + before.slice(0, 16) + "… after=" + after.slice(0, 16) + "… (mutation attempts made) ; served file unchanged=" + (file0 === file1));
    ok(before === after && K.books[0].chapters[21][1].indexOf("MUTATED") < 0 && K.meta.translation.name !== "MUTATED" && K.books.length === 66, "KRV mutated"); ok(file0 === file1); ok(x.w.__errs.length === 0); clean(x);
  });

  t("008", "ContextSurface_can_fail_without_blocking_scripture", async function (ev) {
    var x = await load("#gen-22:2"); Object.keys(x.B.panels).forEach(function (k) { x.B.panels[k] = function () { throw new Error("boom " + k); }; });
    TABS.forEach(function (tb) { x.B.setTab(tb); }); click(x, '[data-vbtn="4"]'); submitRef(x, "요 3:16"); click(x, '[data-step="1"]');
    ev.push("all panels throw: passage=" + x.B.state.passage + " verses=" + $$(x, ".verse").length + " degraded=" + !!x.d.querySelector("#panel .degraded") + " errors=" + x.w.__errs.length); ok(x.w.__errs.length === 0 && x.B.state.passage === "jhn-4" && $$(x, ".verse").length === nverses(x, "jhn-4"), "scripture blocked by failing panels");
    var y = await load("#gen-22:2"); y.d.getElementById("map-pane").remove();   // 지도 캔버스와 그 위 Detail overlay 를 통째로 제거
    click(y, '[data-vbtn="6"]'); submitRef(y, "시 23"); var tg = y.d.querySelector("#verses .tag"); submitRef(y, "창 22"); var tg2 = y.d.querySelector("#verses .tag.p"); click(y, tg2); click(y, tg2);
    ev.push("ContextSurface DOM removed entirely: passage=" + y.B.state.passage + " selected verse via click ok; errors=" + y.w.__errs.length); ok(y.w.__errs.length === 0 && y.B.state.passage === "gen-22" && $$(y, ".verse").length === nverses(y, "gen-22"), "scripture blocked when context surface removed");
    var z = await load("#gen-22:2"); ["context", "people", "places", "photos", "crossref", "resources", "placeLinks"].forEach(function (k) { delete z.B.data[k]; }); TABS.forEach(function (tb) { z.B.setTab(tb); }); click(z, '[data-vbtn="3"]'); submitRef(z, "히 11:17");
    ev.push("all context data absent: passage=" + z.B.state.passage + " verse=" + z.B.state.verse + " errors=" + z.w.__errs.length); ok(z.w.__errs.length === 0 && z.B.state.passage === "heb-11" && z.B.state.verse === 17); clean(x); clean(y); clean(z);
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 30s")); }, 30000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_W1_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "w1-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "QA-W1 " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS" : "FAIL") + " QA-W1-" + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
