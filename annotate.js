// 강의용 지도 필기 도구: 앱 상단 헤더(로고 오른쪽)의 가로 도구 모음.
// 경계: 이 모듈은 "화면 위 임시 필기"만 다룬다. 필기는 메모리에만 있고, 연구 자료·좌표·경로·Registry·선택 대상·본문 상태를 읽어 바꾸거나 거기에 쓰지 않는다.
//  - 거리 측정선은 정경 경로·연구 geometry 가 아니라, 두 지점(지명에 붙은 좌표 또는 클릭한 좌표) 사이의 측지거리 참고 값이다. 장소 좌표·정체성·참고 자료는 읽기만 하고 만들거나 바꾸지 않는다.
//  - 필기는 지도와 같은 Web Mercator 좌표(경도, y)에 얹혀 지도를 이동·확대해도 제자리에 남는다. 지도 카메라(ui.gcam)는 건드리지 않는다.
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", PREF_KEY = "jbc.ann.prefs.v1";
  var $ = function (id) { return document.getElementById(id); };
  var layer = $("ann-layer"), tools = $("ann-tools"), opts = $("ann-opts"), pane = $("map-pane"), mapBody = $("map-body");
  if (!layer || !tools || !opts || !pane || !mapBody) return;
  var shapesG = layer.querySelector("#ann-shapes"), liveG = layer.querySelector("#ann-live"), printNote = $("ann-print-note");

  var COLORS = [["#d93025", "빨강"], ["#f08c00", "주황"], ["#f5c518", "노랑"], ["#2f9e44", "초록"], ["#1c7ed6", "파랑"], ["#7048e8", "보라"], ["#212529", "검정"], ["#ffffff", "흰색"]];
  var TOOLS = {
    hand: { label: "이동" },
    pen: { label: "펜", color: "#d93025", widths: [2, 4, 8, 14], w: 4 },
    hl: { label: "형광펜", color: "#f5c518", widths: [12, 18, 28, 40], w: 18 },
    eraser: { label: "지우개", widths: [16, 28, 44], w: 28 },
    dist: { label: "장소 간 거리", color: "#2f9e44", widths: [2, 3, 5, 8], w: 3 }
  };
  var KEYS = { v: "hand", p: "pen", m: "hl", e: "eraser", d: "dist" };

  var A = { tool: "hand", shapes: [], hist: [], seq: 0, live: null, pending: null, erased: null, drawing: false, pid: null, down: null, space: false, lecture: false, hidden: false, upp: 0, hover: null };

  function loadPrefs() {
    try {
      var p = JSON.parse(localStorage.getItem(PREF_KEY) || "null"); if (!p) return;
      Object.keys(TOOLS).forEach(function (k) { var t = TOOLS[k], q = p.tools && p.tools[k]; if (!q) return; if (t.color && COLORS.some(function (c) { return c[0] === q.color; })) t.color = q.color; if (t.widths && t.widths.indexOf(q.w) >= 0) t.w = q.w; });
    } catch (e) {}
  }
  function savePrefs() {
    try { var o = { tools: {} }; Object.keys(TOOLS).forEach(function (k) { if (TOOLS[k].widths) o.tools[k] = { color: TOOLS[k].color, w: TOOLS[k].w }; }); localStorage.setItem(PREF_KEY, JSON.stringify(o)); } catch (e) {}
  }

  // ---------- 좌표: 오버레이는 지도 SVG 와 같은 viewBox/slice 규칙을 쓴다 ----------
  function view() {
    var vb = (layer.getAttribute("viewBox") || "").split(/\s+/).map(Number); if (vb.length < 4 || vb.some(isNaN) || !(vb[2] > 0)) return null;
    var r = layer.getBoundingClientRect(), W = r.width, H = r.height; if (!W || !H) return null;
    var s = Math.max(W, H) / vb[2];
    return { vb: vb, r: r, s: s, ox: (W - vb[2] * s) / 2, oy: (H - vb[3] * s) / 2, upp: 1 / s };
  }
  function toGeo(cx, cy, v) { return { x: v.vb[0] + (cx - v.r.left - v.ox) / v.s, y: v.vb[1] + (cy - v.r.top - v.oy) / v.s }; }
  function toPx(p, v) { return { x: (p.x - v.vb[0]) * v.s + v.ox, y: (p.y - v.vb[1]) * v.s + v.oy }; }
  function f(n) { return (+n).toFixed(5); }

  // ---------- 그리기(SVG 문자열). 선 굵기·글자 크기는 화면 px × upp 로 환산해 줌 수준과 무관하게 같은 px 로 보인다 ----------
  function pathD(P) {
    var d = "M" + f(P[0].x) + " " + f(P[0].y), i;
    if (P.length === 2) return d + "L" + f(P[1].x) + " " + f(P[1].y);
    for (i = 1; i < P.length - 1; i++) d += "Q" + f(P[i].x) + " " + f(P[i].y) + " " + f((P[i].x + P[i + 1].x) / 2) + " " + f((P[i].y + P[i + 1].y) / 2);
    return d + "L" + f(P[P.length - 1].x) + " " + f(P[P.length - 1].y);
  }
  function distKm(a, b) {   // WGS84 타원체 측지거리(Vincenty 역문제, km). 수렴하지 않으면 대원거리로 대체
    var rad = Math.PI / 180, a_ = 6378137, f_ = 1 / 298.257223563, b_ = (1 - f_) * a_;
    var L = (b.lon - a.lon) * rad, U1 = Math.atan((1 - f_) * Math.tan(a.lat * rad)), U2 = Math.atan((1 - f_) * Math.tan(b.lat * rad));
    var sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2), lam = L, it = 0, sS, cS, sig, sA, c2A, c2SM, C, lamP;
    do {
      var sL = Math.sin(lam), cL = Math.cos(lam); sS = Math.sqrt((cU2 * sL) * (cU2 * sL) + (cU1 * sU2 - sU1 * cU2 * cL) * (cU1 * sU2 - sU1 * cU2 * cL));
      if (sS === 0) return 0; cS = sU1 * sU2 + cU1 * cU2 * cL; sig = Math.atan2(sS, cS); sA = cU1 * cU2 * sL / sS; c2A = 1 - sA * sA; c2SM = c2A ? cS - 2 * sU1 * sU2 / c2A : 0;
      C = f_ / 16 * c2A * (4 + f_ * (4 - 3 * c2A)); lamP = lam; lam = L + (1 - C) * f_ * sA * (sig + C * sS * (c2SM + C * cS * (-1 + 2 * c2SM * c2SM)));
    } while (Math.abs(lam - lamP) > 1e-12 && ++it < 200);
    if (it >= 200) { var dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad, h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2); return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h))); }
    var u2 = c2A * (a_ * a_ - b_ * b_) / (b_ * b_), A_ = 1 + u2 / 16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))), B_ = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
    var dS = B_ * sS * (c2SM + B_ / 4 * (cS * (-1 + 2 * c2SM * c2SM) - B_ / 6 * c2SM * (-3 + 4 * sS * sS) * (-3 + 4 * c2SM * c2SM)));
    return b_ * A_ * (sig - dS) / 1000;
  }
  function xe(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function build(s, u) {
    var P = s.pts, w = s.width * u, c = s.color, a = 'data-annotation="lecture-overlay" data-ann-type="' + s.type + '"';
    if (s.type === "pen" || s.type === "hl") {
      var hl = s.type === "hl";
      if (P.length === 1) return "<circle " + a + ' cx="' + f(P[0].x) + '" cy="' + f(P[0].y) + '" r="' + f(w / 2) + '" fill="' + c + '"' + (hl ? ' opacity="0.38"' : "") + "/>";
      return "<path " + a + ' d="' + pathD(P) + '" fill="none" stroke="' + c + '" stroke-width="' + f(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (hl ? ' opacity="0.38"' : "") + "/>";
    }
    var p0 = P[0], p1 = P[1] || P[0], ang = Math.atan2(p1.y - p0.y, p1.x - p0.x), halo = ' stroke-linecap="round"';
    // dist: 점선 + 끝 눈금 + 직선거리 라벨(글자는 항상 읽히도록 어두운 글자 + 밝은 후광)
    var tk = (8 + s.width) * u, nx = -Math.sin(ang) * tk, ny = Math.cos(ang) * tk, mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2, fs = 14 * u;
    var lab = xe(s.label || "");
    return "<g " + a + '><line x1="' + f(p0.x) + '" y1="' + f(p0.y) + '" x2="' + f(p1.x) + '" y2="' + f(p1.y) + '" stroke="' + c + '" stroke-width="' + f(w) + '" stroke-dasharray="' + f(w * 2.4) + " " + f(w * 1.8) + '"' + halo + '/>' +
      '<path d="M' + f(p0.x - nx) + " " + f(p0.y - ny) + "L" + f(p0.x + nx) + " " + f(p0.y + ny) + "M" + f(p1.x - nx) + " " + f(p1.y - ny) + "L" + f(p1.x + nx) + " " + f(p1.y + ny) + '" stroke="' + c + '" stroke-width="' + f(w) + '" fill="none"' + halo + "/>" +
      '<circle cx="' + f(p0.x) + '" cy="' + f(p0.y) + '" r="' + f((w / u + 3) * u) + '" fill="' + c + '" stroke="#ffffff" stroke-width="' + f(1.5 * u) + '"/><circle cx="' + f(p1.x) + '" cy="' + f(p1.y) + '" r="' + f((w / u + 3) * u) + '" fill="' + c + '" stroke="#ffffff" stroke-width="' + f(1.5 * u) + '"/>' +
      (lab ? '<text x="' + f(s.lp ? s.lp.x : mx) + '" y="' + f(s.lp ? s.lp.y + fs * 0.35 : my - (10 + s.width) * u) + '" text-anchor="middle" font-size="' + f(fs) + '" font-weight="700" font-family="sans-serif" fill="#212529" stroke="#ffffff" stroke-width="' + f(fs * 0.28) + '" paint-order="stroke" stroke-linejoin="round">' + lab + "</text>" : "") + "</g>";
  }

  // ---------- 동기화: 오버레이를 현재 지도 SVG 위에 정확히 겹친다 ----------
  var dirty = true;
  function sync() {
    var sv = mapBody.querySelector("svg.gmap");
    if (!sv) { layer.setAttribute("hidden", ""); return; }
    layer.removeAttribute("hidden");   // SVG 요소에는 .hidden 프로퍼티가 없어 속성으로 다룬다
    var pr = pane.getBoundingClientRect(), r = sv.getBoundingClientRect(), vb = sv.getAttribute("viewBox");
    layer.style.left = (r.left - pr.left - pane.clientLeft + pane.scrollLeft) + "px"; layer.style.top = (r.top - pr.top - pane.clientTop + pane.scrollTop) + "px";
    layer.style.width = r.width + "px"; layer.style.height = r.height + "px";
    if (vb) layer.setAttribute("viewBox", vb);
    var v = view(); if (!v) return;
    if (dirty || Math.abs(v.upp - A.upp) > A.upp * 1e-6) { A.upp = v.upp; dirty = false; rebuild(); }
  }
  function rebuild() {
    shapesG.innerHTML = A.shapes.map(function (s) { return build(s, A.upp); }).join("");
    drawLive(); chrome();
  }
  function drawLive() {
    var h = "", c = (TOOLS[A.tool] && TOOLS[A.tool].color) || "#2f9e44", u = A.upp, ring = function (m, r) { return '<circle cx="' + f(m.x) + '" cy="' + f(m.y) + '" r="' + f(r * u) + '" fill="none" stroke="' + c + '" stroke-width="' + f(3 * u) + '"/><circle cx="' + f(m.x) + '" cy="' + f(m.y) + '" r="' + f((r + 2) * u) + '" fill="none" stroke="#fff" stroke-width="' + f(1.5 * u) + '"/>'; };
    if (A.live) h += build(A.live, u);
    if (A.tool === "dist") {   // 장소 표식에 붙는 고리: 고른 출발지 + 지금 붙을 수 있는 장소
      var hv = A.hover;
      if (A.pending) { h += ring(A.pending, 11); if (hv) h += '<line x1="' + f(A.pending.x) + '" y1="' + f(A.pending.y) + '" x2="' + f((hv.snap || hv).x) + '" y2="' + f((hv.snap || hv).y) + '" stroke="' + c + '" stroke-width="' + f(2 * u) + '" stroke-dasharray="' + f(6 * u) + " " + f(5 * u) + '" opacity=".75"/>'; }
      if (hv && hv.snap && (!A.pending || hv.snap.id !== A.pending.id)) h += ring(hv.snap, 11);
    }
    if (A.tool === "eraser" && A.hover) h += '<circle cx="' + f(A.hover.x) + '" cy="' + f(A.hover.y) + '" r="' + f(TOOLS.eraser.w / 2 * u) + '" fill="rgba(255,255,255,.35)" stroke="#555" stroke-width="' + f(1.5 * u) + '"/>';
    liveG.innerHTML = h;
  }
  // 화면에 그려진 장소 표식(g.gm[data-place])의 표식·지명 어디를 눌러도 그 장소의 정체성(data-place/stable-id)과 좌표(data-lat/lon)에 붙는다. 읽기 전용.
  function hitPlace(cx, cy, v) {
    var G = window.BVC && window.BVC.geo && window.BVC.geo.GEO, best = null, bd = 1e9;
    if (!G) return null;
    [].forEach.call(mapBody.querySelectorAll("svg.gmap g.gm[data-place]"), function (g) {
      var r = g.getBoundingClientRect(), tol = 10; if (cx < r.left - tol || cx > r.right + tol || cy < r.top - tol || cy > r.bottom + tol) return;
      var lat = parseFloat(g.dataset.lat), lon = parseFloat(g.dataset.lon); if (!isFinite(lat) || !isFinite(lon)) return;
      var pr = G.project(lat, lon), pp = toPx(pr, v), d = Math.hypot(pp.x + v.r.left - cx, pp.y + v.r.top - cy);
      if (d < bd) { bd = d; var tx = g.querySelector("text"); best = { kind: "place", id: g.dataset.place, stable: g.dataset.stableId || "", name: String((window.BVC.data.places && window.BVC.data.places[g.dataset.place] && window.BVC.data.places[g.dataset.place].name) || (tx && tx.textContent) || g.getAttribute("aria-label") || g.dataset.place).trim(), lat: lat, lon: lon, x: pr.x, y: pr.y }; }
    });
    return best;
  }
  // 승인된 참고 지명(g.gm-ref[data-ref]: 수역·지역·현대 지명) — 이름과 좌표만 읽는다. 장소 정체성이 아니므로 id 는 참고 항목 id 로만 남긴다.
  var refIdx = null;
  function hitRef(cx, cy, v) {
    var G = window.BVC && window.BVC.geo && window.BVC.geo.GEO, best = null, bd = 1e9; if (!G || !window.BVC.refLabelList) return null;
    if (!refIdx) { refIdx = {}; try { window.BVC.refLabelList().forEach(function (l) { refIdx[l.id] = l; }); } catch (e) {} }
    [].forEach.call(mapBody.querySelectorAll("svg.gmap g.gm-ref[data-ref]"), function (g) {
      var r = g.getBoundingClientRect(), tol = 6, l = refIdx[g.dataset.ref]; if (!l || cx < r.left - tol || cx > r.right + tol || cy < r.top - tol || cy > r.bottom + tol) return;
      var lat = +l.lat, lon = +l.lon; if (!isFinite(lat) || !isFinite(lon)) return;
      var pr = G.project(lat, lon), pp = toPx(pr, v), d = Math.hypot(pp.x + v.r.left - cx, pp.y + v.r.top - cy);
      if (d < bd) { bd = d; best = { kind: "ref", id: l.id, stable: l.source_feature_id || l.id, name: String(l.name || "").trim(), lat: lat, lon: lon, x: pr.x, y: pr.y }; }
    });
    return best;
  }
  function hitFeature(cx, cy, v) { return hitPlace(cx, cy, v) || hitRef(cx, cy, v); }   // 스냅은 편의일 뿐: 근처에 지명이 없으면 null
  function rawPoint(p) {   // 지명이 없는 곳: 클릭한 좌표 그대로(지도 좌표 → 위도·경도)
    var G = window.BVC.geo.GEO, ll = G.unproject(p.x, p.y); return { kind: "point", id: null, stable: null, name: null, lat: ll.lat, lon: ll.lon, x: p.x, y: p.y };
  }

  // ---------- 도구 상태·UI ----------
  function activeNow() { return A.tool !== "hand" && !A.space && !A.hidden && document.body.dataset.annSurface !== "scripture"; }
  function renderOpts() {
    var t = TOOLS[A.tool]; if (A.tool === "hand") { opts.innerHTML = ""; return; }   // 이동 도구에는 옵션도 안내도 없다
    var h = '<span class="map-tool-sep"></span>';
    if (t.color) {
      h += '<div class="ann-swatches" role="group" aria-label="색상">' + COLORS.map(function (c) { return '<button type="button" class="ann-sw" data-ann-color="' + c[0] + '" style="--c:' + c[0] + '" aria-label="' + c[1] + '" title="' + c[1] + '" aria-pressed="' + (t.color === c[0]) + '"></button>'; }).join("") + "</div>";
    }
    if (t.widths) {
      h += '<div class="ann-widths" role="group" aria-label="' + (A.tool === "eraser" ? "지우개 크기" : "굵기") + '">' + t.widths.map(function (w) { var d = Math.min(26, Math.max(4, w * (A.tool === "hl" ? 0.6 : A.tool === "eraser" ? 0.5 : 1.4))); return '<button type="button" class="ann-wd" data-ann-width="' + w + '" aria-label="' + w + 'px" title="' + w + 'px" aria-pressed="' + (t.w === w) + '"><i style="width:' + d + "px;height:" + d + 'px"></i></button>'; }).join("") + "</div>";
    }
    opts.innerHTML = h;
  }
  function chrome() {
    layer.dataset.active = activeNow() ? "1" : "0"; layer.dataset.tool = A.tool; layer.dataset.vis = A.hidden ? "0" : "1";
    if (document.body.dataset.annSurface === "scripture") { if (printNote) printNote.hidden = !A.shapes.length || A.hidden; return; }
    var vb_ = tools.querySelector('[data-ann-act="visible"]'); if (vb_) vb_.setAttribute("aria-pressed", String(!A.hidden));
    [].forEach.call(tools.querySelectorAll("[data-ann-tool]"), function (b) { var on = b.dataset.annTool === A.tool; b.setAttribute("aria-pressed", String(on)); });
    var u = tools.querySelector('[data-ann-act="undo"]'), c = tools.querySelector('[data-ann-act="clear"]'), l = tools.querySelector('[data-ann-act="lecture"]');
    if (u) u.disabled = !A.hist.length; if (c) c.disabled = !A.shapes.length; if (l) l.setAttribute("aria-pressed", String(A.lecture));
    document.body.dataset.annTool = A.tool; if (A.shapes.length) document.body.dataset.ann = "has"; else delete document.body.dataset.ann;
    if (printNote) printNote.hidden = !A.shapes.length || A.hidden;
  }
  function setTool(name) {
    if (!TOOLS[name]) return; if (A.hidden && name !== "hand") A.hidden = false;   // 필기 도구를 고르면 숨겨 둔 필기가 다시 보인다
    cancel(); A.tool = name; A.hover = null; layer.style.cursor = ""; chrome(); renderOpts(); drawLive();
  }
  function cancel() { A.live = null; A.pending = null; A.erased = null; A.drawing = false; A.down = null; delete document.body.dataset.annDrawing; drawLive(); }

  // ---------- 필기 기록(실행 취소) ----------
  function pushHist(op) { A.hist.push(op); if (A.hist.length > 200) A.hist.shift(); }
  function add(s) { s.id = ++A.seq; A.shapes.push(s); pushHist({ t: "add", id: s.id }); shapesG.insertAdjacentHTML("beforeend", build(s, A.upp)); }
  function undo() {
    var op = A.hist.pop(); if (!op) return; cancel();
    if (op.t === "add") A.shapes = A.shapes.filter(function (s) { return s.id !== op.id; });
    else A.shapes = A.shapes.concat(op.list).sort(function (a, b) { return a.id - b.id; });
    rebuild();
  }
  function clearAll() { if (!A.shapes.length) return; cancel(); pushHist({ t: "clear", list: A.shapes }); A.shapes = []; rebuild(); }   // 대화상자 없이 지우되 실행 취소로 되살릴 수 있다
  function finish(s) { cancel(); add(s); chrome(); }   // 도구는 그대로 선택된 채 남는다(연속 사용)
  // 거리 라벨 자리: 선 중점 근처에서 지명(표식·참고 지명) 글자를 가리지 않는 곳을 고른다
  function placeLabel(a, b, text, v) {
    var pa = toPx(a, v), pb = toPx(b, v), mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2, w = text.length * 11.5 + 12, h = 22, boxes = [];
    [].forEach.call(mapBody.querySelectorAll("svg.gmap g.gm, svg.gmap g.gm-ref"), function (g) { var r = g.getBoundingClientRect(); boxes.push({ l: r.left - v.r.left - 2, t: r.top - v.r.top - 2, r: r.right - v.r.left + 2, b: r.bottom - v.r.top + 2 }); });
    var cands = [[0, -18], [0, 18], [0, -42], [0, 42], [w / 2 + 14, -16], [-w / 2 - 14, 16], [w / 2 + 14, 16], [-w / 2 - 14, -16], [0, -66], [0, 66]], best = null, bn = 1e9;
    cands.forEach(function (o) {
      var cx = mx + o[0], cy = my + o[1], bx = { l: cx - w / 2, t: cy - h / 2, r: cx + w / 2, b: cy + h / 2 }, n = boxes.filter(function (q) { return !(bx.r < q.l || bx.l > q.r || bx.b < q.t || bx.t > q.b); }).length;
      if (n < bn) { bn = n; best = { x: cx, y: cy }; }
    });
    return toGeo(v.r.left + best.x, v.r.top + best.y, v);
  }
  function completeDist(a, b) {
    var km = distKm(a, b), named = a.name && b.name, nm = (named ? a.name + " ↔ " + b.name : "거리") + " · " + km.toFixed(1) + " km", v = view();
    var A0 = { x: a.x, y: a.y }, B0 = { x: b.x, y: b.y }, pick = function (m) { return { kind: m.kind, id: m.id, stable: m.stable, name: m.name, lat: m.lat, lon: m.lon }; };
    finish({ type: "dist", color: TOOLS.dist.color, width: TOOLS.dist.w, pts: [A0, B0], label: nm, km: km, lp: v ? placeLabel(A0, B0, nm, v) : null, from: pick(a), to: pick(b) });
  }

  // ---------- 지우개 ----------
  function segDist(px, py, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy, t = l2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2)) : 0;
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }
  function hits(s, cx, cy, rad, v) {
    var P = s.pts.map(function (p) { return toPx(p, v); }), lim = rad + s.width / 2, i;
    if (P.length === 1) return Math.hypot(P[0].x - cx, P[0].y - cy) <= lim;
    for (i = 0; i < P.length - 1; i++) if (segDist(cx, cy, P[i], P[i + 1]) <= lim) return true;
    return false;
  }
  function eraseAt(ev) {
    var v = view(); if (!v) return; var cx = ev.clientX - v.r.left, cy = ev.clientY - v.r.top, rad = TOOLS.eraser.w / 2, gone = [];
    A.shapes = A.shapes.filter(function (s) { if (hits(s, cx, cy, rad, v)) { gone.push(s); return false; } return true; });
    if (gone.length) { (A.erased = A.erased || []).push.apply(A.erased, gone); shapesG.innerHTML = A.shapes.map(function (s) { return build(s, A.upp); }).join(""); chrome(); }
  }

  // ---------- 포인터 ----------
  function mk(type, p) { var t = TOOLS[type]; return { type: type, color: t.color, width: t.w, pts: [p] }; }
  layer.addEventListener("pointerdown", function (ev) {
    if (!activeNow() || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    if (A.drawing) return;   // 두 번째 손가락 등은 무시
    var v = view(); if (!v) return; ev.preventDefault();
    var p = toGeo(ev.clientX, ev.clientY, v), tool = A.tool;
    if (tool === "dist") {   // 두 지점을 차례로 누른다: 지명 근처면 지명에 결속, 아니면 클릭한 좌표 그대로. 끝나면 곧바로 다음 출발지
      var m = hitFeature(ev.clientX, ev.clientY, v) || rawPoint(p);
      if (!A.pending) { A.pending = m; A.hover = { x: p.x, y: p.y, snap: m.kind === "point" ? null : m }; drawLive(); }
      else if (!(m.id && m.id === A.pending.id) && !(m.kind === "point" && A.pending.kind === "point" && Math.hypot((m.x - A.pending.x) * v.s, (m.y - A.pending.y) * v.s) < 4)) { var a0 = A.pending; A.pending = null; A.hover = null; completeDist(a0, m); }
      return;
    }
    try { layer.setPointerCapture(ev.pointerId); } catch (e) {}
    A.pid = ev.pointerId;
    if (tool === "pen" || tool === "hl") { A.live = mk(tool, p); A.drawing = true; }
    else if (tool === "eraser") { A.erased = []; A.drawing = true; eraseAt(ev); A.hover = p; }
    document.body.dataset.annDrawing = "1";   // 그리는 동안 지도 이동은 멈춘다(오버레이가 포인터를 받고 지도에는 전달되지 않음)
    drawLive();
  });
  layer.addEventListener("pointermove", function (ev) {
    var v = view(); if (!v || !activeNow()) return;
    var p = toGeo(ev.clientX, ev.clientY, v);
    if (A.tool === "eraser") { A.hover = p; if (A.drawing && ev.pointerId === A.pid) eraseAt(ev); drawLive(); return; }
    if (A.tool === "dist") { A.hover = { x: p.x, y: p.y, snap: hitFeature(ev.clientX, ev.clientY, v) }; layer.style.cursor = A.hover.snap ? "pointer" : ""; drawLive(); return; }
    if (!A.drawing || ev.pointerId !== A.pid || !A.live) return;
    var evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev], P = A.live.pts;
    (evs.length ? evs : [ev]).forEach(function (e) { var q = toGeo(e.clientX, e.clientY, v), l = P[P.length - 1]; if (Math.hypot((q.x - l.x) * v.s, (q.y - l.y) * v.s) >= 1.5) P.push(q); });
    drawLive();
  });
  function up(ev) {
    if (!A.drawing || ev.pointerId !== A.pid) return;
    try { layer.releasePointerCapture(ev.pointerId); } catch (e) {}
    var tool = A.tool, live = A.live;
    if (tool === "eraser") { var er = A.erased; cancel(); if (er && er.length) { pushHist({ t: "erase", list: er }); chrome(); } return; }
    if (ev.type === "pointercancel") { cancel(); return; }
    finish(live);
  }
  layer.addEventListener("pointerup", up); layer.addEventListener("pointercancel", up);
  layer.addEventListener("pointerleave", function () { if ((A.tool === "eraser" || A.tool === "dist") && !A.drawing) { A.hover = null; drawLive(); } });
  layer.addEventListener("wheel", function (ev) { ev.preventDefault(); if (!A.drawing && window.BVC && window.BVC.zoomBy) window.BVC.zoomBy(ev.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });   // 필기 도구 중에도 휠 확대는 지도와 같다
  layer.addEventListener("contextmenu", function (ev) { if (activeNow()) ev.preventDefault(); });

  // ---------- 도구 모음 · 옵션 패널 ----------
  // 강의 모드 = 브라우저 전체화면 발표. 화면 구성(본문·지도·Detail·메모·필기)은 그대로 두고 레이아웃을 바꾸지 않는다.
  // 전체화면 진입은 사용자 클릭 같은 명시적 제스처 안에서만 허용되므로 버튼 클릭 핸들러에서 바로 요청한다. 상태는 fullscreenchange 가 따른다.
  var fsEl = function () { return document.fullscreenElement || document.webkitFullscreenElement || null; };
  function syncLecture() {
    A.lecture = !!fsEl(); if (A.lecture) document.body.dataset.lecture = "on"; else delete document.body.dataset.lecture;
    chrome(); setTimeout(sync, 0);
  }
  function toggleLecture(on) {
    var want = on == null ? !fsEl() : !!on, de = document.documentElement, req = de.requestFullscreen || de.webkitRequestFullscreen, ex = document.exitFullscreen || document.webkitExitFullscreen, r;
    try { r = want ? (req && req.call(de)) : (fsEl() && ex ? ex.call(document) : null); } catch (e) { r = null; }
    if (r && r.catch) r.catch(function () {});   // 거부/미지원이면 아무것도 바뀌지 않는다
    return r;
  }
  document.addEventListener("fullscreenchange", syncLecture); document.addEventListener("webkitfullscreenchange", syncLecture);
  tools.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.annTool) setTool(b.dataset.annTool);
    else if (b.dataset.annAct === "undo") undo();
    else if (b.dataset.annAct === "clear") clearAll();
    else if (b.dataset.annAct === "lecture") toggleLecture();
    else if (b.dataset.annAct === "visible") { A.hidden = !A.hidden; cancel(); chrome(); }
    if (ev.detail > 0) b.blur();   // 마우스로 누른 버튼에 포커스가 남아 Space 이동이 막히지 않게
  });
  opts.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("button"); if (!b) return; var t = TOOLS[A.tool];
    if (b.dataset.annColor) t.color = b.dataset.annColor;
    else if (b.dataset.annWidth) t.w = +b.dataset.annWidth;
    else return;
    savePrefs(); renderOpts(); if (ev.detail > 0) b.blur();
  });

  // ---------- 키보드: 한 글자 단축키(입력창 제외), 실행 취소, Space 임시 이동, Esc ----------
  function typing(t) { return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function studyMap() { return document.body.dataset.view === "study" && document.body.dataset.annSurface !== "scripture" && !layer.hasAttribute("hidden"); }
  document.addEventListener("keydown", function (ev) {
    var t = ev.target; if (typing(t) || !studyMap()) return;
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && ev.key.toLowerCase() === "z") { if (A.hist.length) { ev.preventDefault(); undo(); } return; }
    if (ev.key === "Escape") {
      if (A.drawing || A.pending) { ev.preventDefault(); ev.stopImmediatePropagation(); cancel(); renderOpts(); return; }
      if (A.tool !== "hand") { ev.preventDefault(); ev.stopImmediatePropagation(); setTool("hand"); return; }
      return;
    }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === " " && A.tool !== "hand" && !/^(BUTTON|A|SUMMARY)$/.test(t.tagName)) { ev.preventDefault(); if (!A.space && !A.drawing) { A.space = true; chrome(); renderOpts(); } return; }
    var k = KEYS[ev.key.toLowerCase()]; if (k && !/^(BUTTON|A|SUMMARY)$/.test(t.tagName)) { setTool(k); }
  }, true);
  document.addEventListener("keyup", function (ev) { if (ev.key === " " && A.space) { A.space = false; chrome(); renderOpts(); } });
  window.addEventListener("blur", function () { if (A.space) { A.space = false; chrome(); renderOpts(); } });

  // ---------- 지도 렌더/크기 변화 추적 ----------
  new MutationObserver(sync).observe(mapBody, { childList: true, subtree: true });   // 지도 SVG 는 이동·확대마다 통째로 교체된다
  if (window.ResizeObserver) { var ro = new ResizeObserver(sync); ro.observe(pane); ro.observe(mapBody); }
  window.addEventListener("resize", sync);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["data-view", "data-lecture", "data-map", "data-detail-context", "data-panel"] });

  // ---------- 이미지 저장: 현재 지도 SVG 복제본에 필기를 얹는다(지도 SVG·데이터는 그대로) ----------
  function exportInto(cl) {
    if (!A.shapes.length || A.hidden) return false; var v = view(); if (!v) return false;
    var g = document.createElementNS(NS, "g"); g.setAttribute("data-role", "lecture-annotation-not-research");
    g.innerHTML = A.shapes.map(function (s) { return build(s, v.upp); }).join(""); cl.appendChild(g);
    var vb = (cl.getAttribute("viewBox") || "0 0 10 10").split(" ").map(Number), fs0 = vb[2] * 0.0125, tx = document.createElementNS(NS, "text");
    tx.setAttribute("x", vb[0] + vb[2] * 0.012); tx.setAttribute("y", vb[1] + vb[3] - fs0 * (1.2 + 2 * 1.45)); tx.setAttribute("font-size", fs0); tx.setAttribute("fill", "#4a463f"); tx.setAttribute("stroke", "#f4f1e9"); tx.setAttribute("stroke-width", fs0 * 0.2); tx.setAttribute("paint-order", "stroke"); tx.setAttribute("font-family", "sans-serif"); tx.setAttribute("data-export-attribution", "1");
    tx.textContent = "강의 필기(임시 표시)가 포함되어 있습니다 · 연구 자료·확정된 경로·거리가 아닙니다"; cl.appendChild(tx);
    return true;
  }

  loadPrefs(); renderOpts(); sync(); chrome();
  window.JBC_ANN = { exportInto: exportInto, hitFeature: hitFeature, rawPoint: rawPoint, setTool: setTool, undo: undo, clearAll: clearAll, toggleLecture: toggleLecture, sync: sync, state: A, tools: TOOLS, build: build, view: view, distKm: distKm, hitPlace: hitPlace };
})();
