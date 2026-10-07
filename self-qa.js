// IMPLEMENTATION_SELF_QA (구 QA-BVC-001~020, 자체 정의 · authoritative 아님). 실행: index.html?qa=self
(function () {
  "use strict";
  if (!/[?&]qa=(self|1)/.test(location.search)) return;
  var B = window.BVC, D = B.data, $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var click = function (s) { var e = typeof s === "string" ? $(s) : s; if (!e) throw new Error("not found: " + s); e.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); };
  var text = function (s) { var e = $(s); return e ? e.textContent : ""; };
  var reset = function (p) { B.go(p || "gen-22"); B.setTab("context"); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var T = [];
  var t = function (id, name, fn) { T.push([id, name, fn]); };

  t("001", "fixture 로드 · 3개 본문 · fixture 고지문", function () { ok(Object.keys(D.passages).length === 3); ok(text("#notice").length > 0); });
  t("002", "본문 8절 렌더링", function () { reset(); ok($$(".verse").length === D.passages["gen-22"].verses.length); ok($("#ref-input") && $("#ref-form")); });
  t("003", "절 클릭 선택/재클릭 해제", function () { reset(); click('[data-verse="3"]'); ok($('[data-verse="3"]').classList.contains("sel")); click('[data-verse="3"]'); ok(!$(".verse.sel")); });
  t("004", "Detail 에 탭 UI 없음(지도 탭 제거) · 레일은 2관점(본문연구·연표)", function () { ok(!$("#tabs") && !$("#side-pane [role=tab]") && !$("[data-tab]")); ok(!$("#side-pane svg.smap") && !$("#side-pane svg.map")); ok($$("#rail [data-perspective]").map(function (b) { return b.dataset.perspective; }).join(",") === "study,timeline"); });
  t("005", "Context: 장르·앞뒤 문맥·구조·주제", function () { reset(); reset(); ok(["genre", "before", "after", "structure", "theme"].every(function (k) { return $('#panel [data-section="' + k + '"]'); })); });
  t("006", "Context: 선택 절이 속한 구조 항목 강조", function () { reset(); click('[data-verse="4"]'); var b = $$("#panel li[aria-current]"); ok(b.length === 1 && /3–6/.test(b[0].textContent)); });
  t("007", "People: 절 범위로 좁혀짐 (7절 → 그 절의 인물만)", function () { reset(); click('[data-verse="7"]'); B.setTab("people"); var c = $$('#panel [data-ov="people"] .item'); var all = B.data.lexicon ? Object.keys(B.data.lexicon).filter(function (k) { return B.data.lexicon[k].kind === "p"; }).length : 3; ok(c.length >= 1 && c.length < all && c.some(function (e) { return e.dataset.id === "isaac"; })); });
  t("008", "인물 태그 클릭 → People 탭·활성·비관련 절 dim", function () { reset(); click('.tag.p[data-id="isaac"]'); ok(B.state.tab === "people"); ok($(".tag.p.active")); ok($$(".verse.dim").length === D.passages["gen-22"].verses.length - B.versesWith("p", "isaac").length); ok($$(".verse.dim").length > 0); });
  t("009", "Places: 2절 → 모리아", function () { reset(); click('[data-verse="2"]'); B.setTab("places"); ok($('#panel .item[data-id="moriah"]')); });
  t("010", "장소 태그 클릭 → Places 탭·카드 활성·dim", function () { reset(); click('.tag.l[data-id="moriah"]'); ok(B.state.tab === "places"); ok($("#panel .detail[data-id=moriah]")); ok($$(".verse.dim").length === D.passages["gen-22"].verses.length - B.versesWith("l", "moriah").length); });
  t("011", "Map: 단일 지리 모드이며 모리아 샘플 핀·경로를 만들지 않음", function () { reset(); ok($("#map-body svg.gmap") && !$("#map-body svg.smap")); ok(!$$("#map-body g.gm").some(function (m) { return m.dataset.place === "moriah"; })); ok(!$("#map-body .gm-route")); });
  t("012", "무좌표 모리아 선택도 본문·Detail·Navigation 연동", function () { reset(); click('.tag.l[data-id="moriah"]'); ok(B.state.entity.id === "moriah"); ok($(".tag.l.active") && $("#panel .detail[data-id=moriah]")); ok(!$$("#map-body g.gm").some(function (m) { return m.dataset.place === "moriah"; })); });
  t("013", "2절 선택은 모리아 문맥을 보존하되 지리 핀을 발명하지 않음", function () { reset(); click('[data-verse="2"]'); ok(B.state.verse === 2 && $('.verse.sel[data-verse="2"]')); ok(!$$("#map-body g.gm").some(function (m) { return m.dataset.place === "moriah"; })); });
  t("014", "Photos: 모리아 → 사진+출처 표기", function () { reset(); click('[data-verse="2"]'); B.setTab("photos"); ok($$("#panel .photo").length === 1); ok($("#panel .photo").dataset.source && $("#panel .photo").dataset.rights === "CLEARED"); });
  t("015", "Photos: 사진 없는 절은 빈 상태 안내", function () { reset(); click('[data-verse="1"]'); B.setTab("photos"); ok($$("#panel .photo").length === 0 && !$('#panel [data-ov="photos"]')); });
  t("016", "CrossRef: 2절 → 히 11:17 링크", function () { reset(); click('[data-verse="2"]'); B.setTab("crossref"); ok($('#panel [data-goto="heb-11:17"]')); });
  t("017", "CrossRef 이동 → 본문·절 선택 전환 + 되돌아가기 링크", function () { reset(); click('[data-verse="2"]'); B.setTab("crossref"); click('#panel [data-goto="heb-11:17"]'); ok(B.state.passage === "heb-11" && B.state.verse === 17); ok($(".verse.sel")); B.setTab("crossref"); ok($('#panel [data-goto="gen-22:2"]')); });
  t("018", "Resources: 본문별 목록 + 종류 필터", function () { reset(); B.setTab("resources"); var RI = '#panel [data-ov="resources"] .item'; var all = $$(RI).length; ok(all === 3); click('[data-reskind="주석"]'); ok($$(RI).length === 1); click('[data-reskind="전체"]'); ok($$(RI).length === all); ok($$('#panel [data-ov="resources"] a[target="_blank"][rel~="noopener"]').length === all); });
  t("019", "Notes: 저장·절 전환 후 복원·내보내기", function () {
    try { localStorage.removeItem("bvc.note.gen-22:5"); localStorage.removeItem("bvc.noteIndex"); } catch (e) {}
    reset(); click('[data-verse="5"]'); B.setTab("notes"); $("#note-text").value = "QA 메모"; click("#note-save"); ok($("#note-status").dataset.state === "saved");
    click('[data-verse="6"]'); ok($("#note-text").value === ""); click('[data-verse="5"]'); ok($("#note-text").value === "QA 메모");
    click("#note-export"); ok(/QA 메모/.test(text("#note-out")));
    try { localStorage.removeItem("bvc.note.gen-22:5"); localStorage.removeItem("bvc.noteIndex"); } catch (e) {}
  });
  t("020", "fixture 무결성: 태그·교차참조·장소·사진 참조 모두 유효", function () {
    Object.keys(D.passages).forEach(function (pid) { D.passages[pid].verses.forEach(function (v) { var e = B.entitiesIn(v.text); e.p.forEach(function (i) { ok(D.people[i], "person " + i); }); e.l.forEach(function (i) { ok(D.places[i], "place " + i); }); }); ok(D.context[pid], "context " + pid); ok(D.placeLinks[pid], "placeLinks " + pid); });
    D.crossrefs.forEach(function (r) { [r.from, r.to].forEach(function (k) { var a = k.split(":"); ok(D.passages[a[0]] && D.passages[a[0]].verses.some(function (v) { return v.n === +a[1]; }), "ref " + k); }); });
    Object.keys(D.places).forEach(function (i) { D.places[i].photos.forEach(function (p) { ok(D.photos[p], "photo " + p); }); });
  });

  var res = T.map(function (x) { try { reset(); x[2](); return [x[0], x[1], true, ""]; } catch (e) { return [x[0], x[1], false, e.message]; } });
  reset();
  var pass = res.filter(function (r) { return r[2]; }).length;
  window.BVC_SELF_QA = { pass: pass, total: res.length, results: res };
  var el = document.createElement("div"); el.id = "self-qa-report"; el.className = "qa"; document.body.appendChild(el);
  el.innerHTML = "<b>QA-BVC " + pass + "/" + res.length + (pass === res.length ? " PASS" : " FAIL") + "</b>\n" + res.map(function (r) { return '<span class="' + (r[2] ? "pass" : "fail") + '">' + (r[2] ? "PASS" : "FAIL") + "</span> QA-BVC-" + r[0] + " " + r[1] + (r[3] ? " — " + r[3] : ""); }).join("\n");
  console.log("IMPLEMENTATION_SELF_QA " + pass + "/" + res.length);
})();
