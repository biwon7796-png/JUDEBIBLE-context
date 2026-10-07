// KRV 결속 검증(추가 스위트). 실행: index.html?qa=krv  — QA-BVC-001~020(?qa=auth)과 별개이며 그것을 대체하지 않는다.
(function () {
  "use strict";
  if (!/[?&]qa=krv/.test(location.search)) return;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var J = JSON.stringify, host = document.createElement("div"); host.style.cssText = "position:absolute;left:-10000px;top:0"; document.body.appendChild(host);
  function load(hash) {
    return new Promise(function (res) {
      var f = document.createElement("iframe"); f.style.cssText = "width:1200px;height:600px;border:0";
      f.onload = function () { var w = f.contentWindow; w.__errs = []; w.addEventListener("error", function (e) { w.__errs.push(e.message); }); setTimeout(function () { res({ f: f, w: w, d: w.document, B: w.BVC }); }, 60); };
      f.src = "index.html?qa=fixture" + (hash || ""); host.appendChild(f);
    });
  }
  function click(x, sel) { var e = typeof sel === "string" ? x.d.querySelector(sel) : sel; ok(e, "not found: " + sel); e.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true })); return e; }
  function snap(x) { var s = x.B.state; return { passage: s.passage, verse: s.verse, tab: s.tab, entity: s.entity ? s.entity.kind + "." + s.entity.id : null }; }
  async function sha256(text) { var b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [].map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  var T = [], t = function (id, name, fn) { T.push({ id: id, name: name, fn: fn }); };

  t("K01", "canonical 구조: 66권 · 1189장 · 31102절, 장/절 번호 연속", async function (ev) {
    var x = await load(""), K = x.B.krv, ch = 0, vs = 0, bad = [];
    K.books.forEach(function (b) { ch += b.chapters.length; b.chapters.forEach(function (c, i) { vs += c.length; if (!c.length || c.some(function (t) { return typeof t !== "string" || !t.trim(); })) bad.push(b.id + " " + (i + 1)); }); });
    ev.push("books=" + K.books.length + " chapters=" + ch + " verses=" + vs + " empty/invalid=" + J(bad)); ok(K.books.length === 66 && ch === 1189 && vs === 31102 && !bad.length);
    ok(K.books[0].id === "gen" && K.books[65].id === "rev" && K.books[0].chapters.length === 50 && K.books[18].chapters.length === 150, "canon order/psalms"); ev.push("gen=50장, psa=150편, rev=22장=" + K.books[65].chapters.length); ok(K.books[65].chapters.length === 22); x.f.remove();
  });
  t("K02", "번역본/출처 식별정보와 권리 경계 보존 (krv.js meta + provenance.json + 화면 고지)", async function (ev) {
    var x = await load(""), m = x.B.krv.meta, prov = await (await fetch("data/krv.provenance.json")).json(), js = await (await fetch("data/krv.js")).text(), h = await sha256(js), n = x.d.getElementById("notice");
    ev.push("translation=" + J(m.translation) + " source=" + m.source.site + " idx_rev=" + m.source.index_revid + " rights=" + J(m.rights) + " sha256(krv.js)=" + h.slice(0, 16) + "… provenance.output_sha256=" + prov.output_sha256.slice(0, 16) + "…");
    ok(m.translation.abbr === "KRV" && m.translation.publisher && m.translation.edition_year === 1961 && m.source.index_revid && m.source.retrieved, "identity missing");
    ok(prov.output_sha256 === h, "krv.js does not match provenance sha256"); ok(prov.books.length === 66 && prov.books.every(function (b) { return b.source_revid && b.source_wikitext_sha256 && b.source_title; }), "per-book pin missing");
    ok(m.rights.text_status === "PD_CLAIMED_NOT_CONFIRMED_BY_PUBLISHER" && m.rights.data_file_status === "RIGHTS_VERIFY" && /CAPTAIN_ONLY/.test(m.rights.release), "rights boundary not recorded");
    ok(prov.rights_boundary.text.evidence_against_or_unresolved.length > 0 && prov.rights_boundary.not_used_as_canonical.length > 0, "unresolved evidence not recorded");
    ev.push("notice=" + n.textContent.slice(0, 90) + "… data-translation=" + n.dataset.translation + " data-status=" + n.dataset.status); ok(n.dataset.translation === "KRV" && n.dataset.status === "UNVERIFIED_TRANSCRIPTION" && n.textContent.length > 20); x.f.remove();
  });
  t("K03", "원문 무수정: 화면 DOM 본문 == krv.js 원문 (entity 표시 후에도, featured 3장 전 절)", async function (ev) {
    var x = await load(""), checked = 0;
    for (var pid of ["gen-22", "heb-11", "gen-12", "psa-119"]) { x.B.go(pid); var P = x.B.data.passages[pid];
      P.verses.forEach(function (v) { var el = x.d.querySelector('.verse[data-verse="' + v.n + '"]'), btn = el.querySelector(".vnum"), txt = el.textContent.slice(btn.textContent.length); ok(txt === v.text, pid + ":" + v.n + " DOM text differs from data"); checked++; }); }
    ev.push("verses compared=" + checked); ok(checked === 24 + 40 + 20 + 176); x.f.remove();
  });
  t("K04", "장/절 이동: 이전·다음 장 (권 경계 포함) 실제 동작", async function (ev) {
    var x = await load("#gen-22"); click(x, '[data-step="1"]'); ev.push("next → " + x.B.state.passage + " title=" + x.d.getElementById("passage-title").textContent); ok(x.B.state.passage === "gen-23" && x.d.querySelectorAll(".verse").length === x.B.krv.books[0].chapters[22].length);
    x.B.go("gen-50"); click(x, '[data-step="1"]'); ev.push("gen-50 next → " + x.B.state.passage); ok(x.B.state.passage === "exo-1");
    x.B.go("mal-4"); click(x, '[data-step="1"]'); ok(x.B.state.passage === "mat-1"); x.B.go("mat-1"); click(x, '[data-step="-1"]'); ok(x.B.state.passage === "mal-4");
    x.B.go("gen-1"); ok(x.d.querySelector('[data-step="-1"]').disabled, "prev not disabled at gen-1"); x.B.go("rev-22"); ok(x.d.querySelector('[data-step="1"]').disabled, "next not disabled at rev-22");
    x.B.go("psa-119"); ok(x.d.querySelectorAll(".verse").length === 176 && /시편 119편/.test(x.d.getElementById("passage-title").textContent)); ev.push("psa-119 verses=176 title ok"); ok(x.w.__errs.length === 0); x.f.remove();
  });
  t("K05", "reference parser 결속: 이름/약어/영문 id/장-절 표기 → 동일 canonical, 잘못된 참조는 오류·기존 본문 유지", async function (ev) {
    var x = await load("#heb-11:18"), P = x.B.parseReference, cases = { "창세기 22:2": "gen-22:2", "창 22장 2절": "gen-22:2", "gen 22:2": "gen-22:2", "GEN 22:2": "gen-22:2", "요 3:16": "jhn-3:16", "요한복음3:16": "jhn-3:16", "시편 23편": "psa-23:", "요일 3:16": "1jn-3:16", "요한1서 3:16": "1jn-3:16", "고전 13": "1co-13:", "계 22:21": "rev-22:21" };
    for (var q of Object.keys(cases)) { var r = P(q); ev.push(J(q) + " → " + (r && (r.passage + ":" + (r.verse == null ? "" : r.verse) || r.error))); ok(r && r.passage + ":" + (r.verse == null ? "" : r.verse) === cases[q], q + " → " + J(r)); }
    ["창세기 51장", "창세기 22:25", "요 22:1"].forEach(function (q) { var r = P(q); ok(r && r.error, q + " should be an error: " + J(r)); ev.push(q + " → error: " + r.error); });
    ok(P("이삭") === null && P("Isaac") === null && P("사라") === null, "entity query misparsed as reference");
    var S0 = snap(x), inp = x.d.getElementById("search"); inp.value = "창세기 51장"; inp.dispatchEvent(new x.w.Event("input", { bubbles: true }));
    ev.push("UI error shown=" + !!x.d.querySelector("#search-results [data-ref-error]") + " state kept=" + (J(snap(x)) === J(S0))); ok(x.d.querySelector("#search-results [data-ref-error]") && J(snap(x)) === J(S0));
    inp.value = "요 3:16"; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); click(x, '#search-results [data-kind="r"]'); ev.push("open 요 3:16 → " + J(snap(x))); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16 && x.d.querySelector('.verse.sel'), "reference open failed");
    ok(/독생자/.test(x.d.querySelector(".verse.sel").textContent), "John 3:16 text"); x.f.remove();
  });
  t("K06", "URL 계약: 전 성경 passage 해시 복원, 범위 밖 장/절은 거부(기존 유지)", async function (ev) {
    var x = await load("#jhn-3:16&tab=crossref"); ev.push("restored=" + J(snap(x))); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16 && x.B.state.tab === "crossref");
    var S = snap(x); for (var bad of ["#gen-51", "#gen-22:25", "#1co-99:1", "#xyz-1"]) { x.w.location.hash = bad; await sleep(120); ev.push(bad + " → kept " + (J(snap(x)) === J(S)) + " msg=" + (x.d.getElementById("ref-error").textContent.length > 0)); ok(J(snap(x)) === J(S) && x.d.getElementById("ref-error").textContent.length > 0, bad); }
    var y = await load("#1co-13:4"); ok(y.B.state.passage === "1co-13" && y.B.state.verse === 4, "1co hash"); x.f.remove(); y.f.remove();
  });
  t("K07", "기존 fixture 관계 회귀 없음: 실제 본문 위 entity/문맥/관련 본문/지도/사진", async function (ev) {
    var x = await load(""); click(x, '[data-vbtn="2"]');
    var tags = [].map.call(x.d.querySelectorAll('[data-verse="2"] .tag'), function (e) { return e.dataset.kind + "." + e.dataset.id + "=" + e.textContent; }); ev.push("gen-22:2 tags=" + J(tags)); ok(tags.indexOf("p.isaac=이삭") >= 0 && tags.indexOf("l.moriah=모리아") >= 0, "entity not recognised in real text");
    x.B.setTab("places"); ok(x.d.querySelector('#panel .item[data-id="moriah"]')); click(x, '.tag.l[data-id="moriah"]'); ok(x.B.state.entity.id === "moriah" && x.d.querySelector(".tag.l.active") && x.d.querySelector("#map-body svg.gmap") && !x.d.querySelector('#map-body g.gm[data-place="moriah"]'), "entity linkage survives while unlocated Moriah gets no geographic marker");
    click(x, "#panel [data-clear-entity]"); x.B.setTab("crossref"); click(x, "#panel [data-goto]"); ev.push("crossref → " + J(snap(x))); ok(x.B.state.passage === "heb-11" && x.B.state.verse === 17 && /아브라함/.test(x.d.querySelector(".verse.sel").textContent));
    x.B.go("gen-12", 1); x.B.setTab("context"); ok(x.d.querySelector('#panel [data-section="theme"]'), "gen-12 context"); x.B.go("jhn-3", 16); x.B.setTab("context"); ev.push("unannotated context panel=" + x.d.getElementById("panel").textContent.trim().slice(0, 30)); ok(!x.d.querySelector('#panel [data-ov="context"]') && x.d.querySelector('#panel [data-ov="notes"]') && !x.d.querySelector("#panel .degraded") && !x.d.querySelector("#verses .tag"), "unannotated chapter must be plain text with graceful empty context");
    ok(x.w.__errs.length === 0); x.f.remove();
  });
  t("K08", "전체 본문 검색: 실제 절 회수 + 정규화, 결과 클릭 이동", async function (ev) {
    var x = await load(""), inp = x.d.getElementById("search"); var run = function (q) { inp.value = q; inp.dispatchEvent(new x.w.Event("input", { bubbles: true })); return [].map.call(x.d.querySelectorAll("#search-results [data-id]"), function (e) { return e.dataset.kind + "." + e.dataset.id; }); };
    var a = run("독생자를 주셨으니"), b = run("  독생자를   주셨으니 "), c = run("독생자를 주셨으니".normalize("NFD")); ev.push("독생자를 주셨으니 → " + J(a.slice(0, 4))); ok(a.indexOf("v.jhn-3:16") >= 0 && J(a) === J(b) && J(a) === J(c), "verse search/normalization");
    click(x, '#search-results [data-id="jhn-3:16"]'); ok(x.B.state.passage === "jhn-3" && x.B.state.verse === 16); x.f.remove();
  });
  t("K09", "notes/mobile/QA baseline 보존 (메모는 본문 데이터·URL과 분리)", async function (ev) {
    var x = await load("#jhn-3:16"); x.w.localStorage.removeItem("bvc.noteIndex"); x.B.setTab("notes"); x.d.getElementById("note-text").value = "요3:16 메모 KRV-K09"; click(x, "#note-save");
    var keys = Object.keys(x.w.localStorage), js = await (await fetch("data/krv.js")).text(); ev.push("keys=" + J(keys) + " href has note=" + /KRV-K09/.test(x.w.location.href) + " krv.js has note=" + /KRV-K09/.test(js));
    ok(keys.indexOf("bvc.note.jhn-3:16") >= 0 && !/KRV-K09/.test(x.w.location.href) && !/KRV-K09/.test(js)); x.w.localStorage.removeItem("bvc.note.jhn-3:16"); x.w.localStorage.removeItem("bvc.noteIndex"); x.f.remove();
  });

  (async function () {
    var res = [];
    for (var c of T) { var ev = [], pass = true, err = ""; try { await Promise.race([c.fn(ev), new Promise(function (_, rj) { setTimeout(function () { rj(new Error("TIMEOUT 30s")); }, 30000); })]); } catch (e) { pass = false; err = e.message; } res.push({ id: c.id, name: c.name, pass: pass, err: err, evidence: ev }); }
    var p = res.filter(function (r) { return r.pass; }).length; window.BVC_KRV_QA = { pass: p, total: res.length, results: res };
    var el = document.createElement("div"); el.id = "krv-qa-report"; el.className = "qa"; document.body.appendChild(el);
    el.textContent = "KRV BINDING QA " + p + "/" + res.length + "\n" + res.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + r.id + " " + r.name + (r.err ? "\n   ✗ " + r.err : "") + "\n   · " + r.evidence.join("\n   · "); }).join("\n");
  })();
})();
