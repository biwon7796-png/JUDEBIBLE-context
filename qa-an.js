// 강의 필기 도구 QA. 실행: index.html?qa=an (개발 모드 전용)
// 확인: 필기는 임시 오버레이일 뿐 지도 카메라·선택 대상·본문 상태·연구 자료를 바꾸지 않고, 이미지 저장에는 포함되며, 지도 이동은 그리는 동안만 멈춘다.
(function () {
  "use strict";
  if (!/[?&]qa=an/.test(location.search)) return;
  var B = window.BVC, A = window.JBC_ANN, L = document.getElementById("ann-layer"), T = [], t = function (n, fn) { T.push([n, fn]); };
  var ok = function (c, m) { if (!c) throw new Error(m || "assertion failed"); };
  var pe = function (type, x, y) { L.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, bubbles: true })); };
  var snap = function () { return JSON.stringify({ cam: B.ui.gcam, ent: B.state.entity, pas: B.state.passage, verse: B.state.verse, proj: Object.keys(B.projection && B.projection.places || {}).length }); };
  var pt = function () { var r = L.getBoundingClientRect(); return { x: r.left + r.width * 0.65, y: r.top + r.height * 0.55 }; };
  t("AN-01 상단 가로 고정 바 · 도구 5개 + 실행취소/모두지우기/강의모드", function () {
    ["hand", "pen", "hl", "eraser", "dist"].forEach(function (k) { ok(document.querySelector('#ann-tools [data-ann-tool="' + k + '"]'), k); });
    ["undo", "clear", "lecture"].forEach(function (k) { ok(document.querySelector('#ann-tools [data-ann-act="' + k + '"]'), k); });
    ok(!document.querySelector('#ann-tools [data-ann-tool="line"]'), "A→B 임의 선 도구는 장소 간 거리로 대체됨");
    var bar = document.getElementById("ann-tools"), r = bar.getBoundingClientRect(), br = document.querySelector(".brand").getBoundingClientRect(), hd = document.querySelector("header.top"), pr = document.getElementById("map-pane").getBoundingClientRect(), sp = document.getElementById("side-pane").getBoundingClientRect();
    ok(bar.parentNode === hd && !document.getElementById("map-pane").contains(bar), "전역 상단 헤더 안");
    ok(r.left >= br.right - 1 && Math.abs(r.top - br.top) < br.height, "홈 로고 오른쪽 같은 줄");
    ok(r.bottom <= hd.getBoundingClientRect().bottom && r.top >= hd.getBoundingClientRect().top, "헤더 높이 안에 들어감(세로 확장 0)");
    ok(r.bottom <= pr.top + 1, "지도 영역과 겹치지 않음");
    var bs = [].map.call(document.querySelectorAll("#ann-tools > button"), function (b) { return b.getBoundingClientRect(); }); ok(bs.every(function (x) { return Math.abs(x.top - bs[0].top) < 2; }), "가로 한 줄");
    ok(getComputedStyle(document.getElementById("map-pane")).getPropertyValue("--detail-left").trim() === "10px", "Detail 위치 변수 불변");
  });
  t("AN-02 안내 카드/팝업 없음 · 이동 도구에는 패널 없음 · 펜은 색상/굵기만", function () {
    A.setTool("hand"); ok(!document.getElementById("ann-opts").textContent.trim(), "이동 안내 카드 없음");
    A.setTool("pen"); ok(document.querySelectorAll(".ann-sw").length === 8 && document.querySelectorAll(".ann-wd").length === 4, "펜 옵션");
    ok(!document.querySelector(".ann-hint, .ann-note, .ann-auto"), "설명 카드 없음"); A.setTool("hand");
  });
  t("AN-03 연속 사용: 펜 여러 획 · 지우개 · 실행 취소 · 모두 지우기(되살림) · 도구 유지", function () {
    A.clearAll(); var p = pt(), s0 = snap(), n0 = A.state.shapes.length;
    A.setTool("pen"); [0, 30, 60].forEach(function (dy) { pe("pointerdown", p.x, p.y + dy); pe("pointermove", p.x + 20, p.y + dy + 8); pe("pointerup", p.x + 40, p.y + dy + 12); });
    ok(A.state.shapes.length === n0 + 3 && A.state.tool === "pen", "펜 3획 후에도 펜 유지");
    A.setTool("eraser"); pe("pointerdown", p.x + 20, p.y + 8); pe("pointerup", p.x + 20, p.y + 8); pe("pointerdown", p.x + 20, p.y + 38); pe("pointerup", p.x + 20, p.y + 38); ok(A.state.shapes.length === n0 + 1 && A.state.tool === "eraser", "지우개 연속");
    A.undo(); A.undo(); ok(A.state.shapes.length === n0 + 3, "지우개 취소");
    A.clearAll(); ok(A.state.shapes.length === 0, "모두 지우기"); A.undo(); ok(A.state.shapes.length === n0 + 3, "모두 지우기 취소");
    A.setTool("hand"); ok(snap() === s0, "지도 카메라·선택·본문·연구 자료 불변");
  });
  t("AN-03b 거리 측정: 지명↔지명 · 임의↔임의 · 혼합 · 연속 · 자료 불변", function () {
    // 고정 자료에는 표식이 있는 장소가 브엘세바뿐이라, 검증용 표식(예루살렘)을 지도 SVG 의 DOM 에만 임시로 얹는다(자료·상태는 건드리지 않음).
    var sv = document.querySelector("#map-body svg.gmap"), base = sv.querySelector("g.gm[data-place]"), G = B.geo.GEO, jl = base.cloneNode(true), pr = G.project(31.778, 35.235);
    jl.dataset.place = "qa-jerusalem"; jl.dataset.stableId = "QA-JERUSALEM"; jl.dataset.lat = "31.778"; jl.dataset.lon = "35.235"; jl.setAttribute("transform", "translate(" + pr.x + " " + pr.y + ")");
    var jt = jl.querySelector("text") || jl.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "text")); jt.textContent = "예루살렘"; sv.appendChild(jl);
    var c = function (g) { var r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    var before = snap() + JSON.stringify(B.data.places) + JSON.stringify(B.refLabelList()), bar = document.getElementById("ann-tools");
    A.clearAll(); A.state.hist.length = 0; A.setTool("dist"); var a = c(jl), b = c(base), s;
    // 1) 지명 ↔ 지명
    pe("pointerdown", a.x, a.y); ok(A.state.pending && A.state.pending.kind === "place" && A.state.pending.stable === "QA-JERUSALEM", "A 스냅·stable id 결속");
    pe("pointerdown", b.x, b.y); s = A.state.shapes[0];
    ok(s && s.from.kind === "place" && s.to.kind === "place" && s.km > 69 && s.km < 73 && /^예루살렘 ↔ .* · 7\d\.\d km$/.test(s.label), "지명↔지명 라벨: " + (s && s.label));
    ok(A.state.tool === "dist" && !A.state.pending && bar.isConnected && getComputedStyle(bar).display !== "none", "완료 후 도구·바 유지");
    // 2) 임의 ↔ 임의(빈 곳): 클릭 좌표 그대로
    var L = document.getElementById("ann-layer"), r = L.getBoundingClientRect(), v = A.view(), p1 = { x: r.left + r.width * 0.2, y: r.top + r.height * 0.75 }, p2 = { x: r.left + r.width * 0.8, y: r.top + r.height * 0.8 };
    ok(!A.hitFeature(p1.x, p1.y, v) && !A.hitFeature(p2.x, p2.y, v), "빈 곳 두 점");
    pe("pointerdown", p1.x, p1.y); pe("pointerdown", p2.x, p2.y); s = A.state.shapes[1];
    var g1 = G.unproject(v.vb[0] + (p1.x - r.left - v.ox) / v.s, v.vb[1] + (p1.y - r.top - v.oy) / v.s);
    ok(s && s.from.kind === "point" && s.to.kind === "point" && s.from.id === null && Math.abs(s.from.lat - g1.lat) < 1e-9 && Math.abs(s.from.lon - g1.lon) < 1e-9, "클릭한 정확한 위경도 사용");
    ok(/^거리 · \d+\.\d km$/.test(s.label) && s.km > 10, "이름 없는 라벨: " + s.label);
    // 3) 혼합(지명 + 임의), 곧바로 연속
    pe("pointerdown", b.x, b.y); pe("pointerdown", p1.x, p1.y); s = A.state.shapes[2];
    ok(s && s.from.kind === "place" && s.to.kind === "point" && /^거리 · /.test(s.label), "혼합: 하나는 스냅, 하나는 원좌표");
    ok(A.state.shapes.length === 3 && A.state.tool === "dist", "재활성화 클릭 없이 연속 측정");
    A.setTool("hand"); jl.remove();
    ok(!document.querySelector("#map-body [data-annotation]") && before === snap() + JSON.stringify(B.data.places) + JSON.stringify(B.refLabelList()), "장소·참고·투영 자료·좌표·카메라 불변(경로/Registry 생성 없음)");
    ok(A.state.shapes.every(function (x) { return x.type === "dist" && !x.route; }), "경로 객체 없음");
  });
  t("AN-04 그리는 동안 지도 이동 정지 · 이동 도구에서는 필기 레이어가 포인터를 받지 않음", function () {
    A.setTool("pen"); ok(L.dataset.active === "1"); A.setTool("hand"); ok(L.dataset.active === "0" && getComputedStyle(L).pointerEvents === "none", "이동 복원");
  });
  t("AN-05 이미지 저장 복제본에 필기 포함 · 필기 없는 지도는 변하지 않음", function () {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "svg"); g.setAttribute("viewBox", L.getAttribute("viewBox")); ok(A.exportInto(g) && g.querySelectorAll("[data-annotation]").length >= 1, "필기 포함");
    var live = document.querySelector("#map-body svg.gmap"); ok(!live.querySelector("[data-annotation]"), "지도 SVG 자체에는 필기가 들어가지 않는다");
  });
  t("AN-06 강의 모드 = 전체화면 발표: 레이아웃 불변 · 맥락/필기/도구 유지 · 전체화면 상태를 따름", function () {
    var s0 = snap(), pane = document.getElementById("map-pane"), pos0 = getComputedStyle(pane).position, h0 = pane.getBoundingClientRect().height, hd0 = document.querySelector("header.top").getBoundingClientRect().height, n0 = A.state.shapes.length, tool0 = A.state.tool;
    try { A.toggleLecture(true); } catch (e) {}   // 사용자 제스처가 없으면 브라우저가 거부한다 — 그래도 아무것도 바뀌지 않아야 한다
    ok(getComputedStyle(pane).position === pos0 && Math.abs(pane.getBoundingClientRect().height - h0) < 1 && Math.abs(document.querySelector("header.top").getBoundingClientRect().height - hd0) < 1, "레이아웃 불변");
    ok(snap() === s0 && A.state.shapes.length === n0 && A.state.tool === tool0 && document.querySelector("#ann-tools").offsetHeight > 0, "맥락·필기·도구·바 유지");
    ok(A.state.lecture === !!document.fullscreenElement, "강의 모드 상태 = 전체화면 상태");
  });
  t("AN-07 필기는 연구 자료로 저장되지 않음(저장소에는 색·굵기 선호만)", function () {
    var keys = []; try { for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch (e) {}
    keys.forEach(function (k) { if (/^jbc\.ann\./.test(k)) ok(!/pts/.test(localStorage.getItem(k)), "필기 좌표가 저장됨"); });
  });
  var out = [], fail = 0; T.forEach(function (x) { try { x[1](); out.push("PASS " + x[0]); } catch (e) { fail++; out.push("FAIL " + x[0] + " — " + e.message); } });
  A.clearAll(); A.state.hist.length = 0;
  var el = document.createElement("pre"); el.id = "an-qa-report"; el.textContent = "AN " + (T.length - fail) + "/" + T.length + " " + (fail ? "FAIL" : "PASS") + "\n" + out.join("\n"); el.style.cssText = "position:fixed;left:0;bottom:0;z-index:9999;background:#fff;font-size:11px;max-height:40vh;overflow:auto;margin:0;padding:6px"; document.body.appendChild(el);
})();
