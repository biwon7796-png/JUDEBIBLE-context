/* United / divided monarchy, Assyria, exile, return: sourced colour areas (see era-areas-20261016.js) replace the old Holman-inspired schematics.
   REFERENCE ONLY: an approximate range, not a border. Shares the small (i) of the tribal module; source and method are written in it. */
(function () {
  var SRC = "jbc-era", FILL = "jbc-era-fill", LINE = "jbc-era-line", LBL = "jbc-era-label", LSRC = "jbc-era-pts";
  var KEY = { "era.united-monarchy": "united", "era.divided-monarchy": "divided", "era.assyria": "assyria", "era.exile": "exile", "era.return": "return", "era.intertestamental": "intertest", "era.primitive": "primitive" };
  var NAME = { united: "통일 왕국", divided: "분열 왕국", assyria: "아시리아 시대", exile: "바벨론 포로 시대", "return": "귀환 시대", intertest: "중간사 시대", primitive: "원역사" };
  var GCOL = { Japheth: "#3f8f8a", Ham: "#c27a3a", Shem: "#7b5aa6" }, GKO = { Japheth: "야벳 계열", Ham: "함 계열", Shem: "셈 계열" };
  var COLOR = { "United": "#c9a227", "Judah-kingdom": "#c9a227", "Israel-kingdom": "#3f8f8a", "Samaria": "#3f8f8a", "Galilee": "#9a6a3a", "Gilead": "#7b5aa6", "Judah-land": "#c9a227", "Yehud": "#a64f7f", "Judea-early": "#a64f7f", "Samaria-m": "#3f8f8a", "Toparchies": "#b0524a", "Conquests": "#8a2f2f" };
  var TIP = {
    united: "<p>열두 지파가 차지한 땅(단에서 브엘세바까지, 삼하 24:2, 5–7)을 정복 시대 지파 영역(여호수아 13–19장 성읍 목록)을 합쳐 그린 근사 범위입니다. 다윗과 솔로몬의 실제 영향권은 이보다 넓었다고 기록되지만(삼하 8장 등), 그 경계는 본문에 적혀 있지 않아 그리지 않았습니다. 주변 나라의 색면은 같은 자료의 지역 범위입니다.</p>",
    divided: "<p>왕상 12:16–21에 따라 갈라진 두 왕국입니다. 유다 왕국은 유다·베냐민에 시므온과 단 남쪽 성읍(대하 11:10)을 더했고, 이스라엘(북) 왕국은 나머지 지파 땅과 북쪽으로 옮긴 단(왕상 12:29)을 합쳤습니다. 둘 다 정복 시대 지파 영역을 합친 근사 범위이며, 시기에 따른 경계 변동(예: 모압이 르우벤 땅을 되찾은 일)은 반영하지 않았습니다.</p>",
    assyria: "<p>아시리아 침공을 본문에 따라 나눈 근사 범위입니다. BC 732: 납달리·갈릴리와 길르앗(왕하 15:29). BC 722: 사마리아와 그 주변(왕하 17:5–6). 남은 유다는 BC 701에 침공받았습니다(왕하 18:13). 스불론을 갈릴리에, 아셀·잇사갈을 사마리아 지역에 넣은 것은 본문이 직접 나누지 않은 해석입니다.</p>",
    exile: "<p>예루살렘 함락(BC 586) 뒤 바벨론이 그다랴를 총독으로 세운 유다 땅(왕하 25:22–26)을 분열 왕국 시대 유다 영역으로 근사했습니다. 총독의 중심은 미스바였습니다(왕하 25:23). 바벨론·엘람·이집트 색면은 같은 자료의 지역 범위입니다.</p>",
    primitive: "<p>창세기 10장 ‘민족 목록’에 나오는 이름 가운데 OpenBible이 위치를 정한 25곳을 점으로만 표시했습니다. 색은 야벳(청록)·함(주황)·셈(보라) 계열입니다. 점은 OpenBible이 그 지명을 비정하는 곳(또는 지역의 중심)일 뿐, 그 민족이 거기 살았다거나 영역이 그곳까지였다는 뜻이 아닙니다. 앗수르는 셈 계열(10:22)로 두었고, 니느웨·갈라는 10:11–12에 따라 함 계열 쪽에 두었습니다.</p><p>에덴 동산, 아담과 하와·가인의 땅, 홍수와 아라랏 산은 본문이 위치를 정해 주지 않고 학자들의 견해가 크게 갈려 <strong>위치 미상</strong>으로 두고 표시하지 않았습니다.</p>",
    intertest: "<p>마카비 시대(1마카)를 근거로 그린 근사 범위입니다. 유대의 중심부는 귀환 시대 예후드 범위를 쓰고, BC 145년경 사마리아에서 유대에 편입된 지방(1마카 10:38; 11:34)과 시몬이 차지한 욥바·게셀·벧술(1마카 13:11, 43–48; 14:33–34)을 덧붙였습니다. 하스몬 왕국이 가장 넓었던 때의 범위는 그리지 않았습니다. 이집트·아람 등 색면은 구약 시대 지명 기준의 같은 자료이며 헬라 시대의 셀레우코스·프톨레마이오스 영역과 정확히 같지 않습니다.</p>",
    "return": "<p>귀환한 사람들의 성읍 목록(스 2:21–34)과 성벽 중건 명단(느 3)에 나온 23곳을 OpenBible 위치로 찾아 그 둘레를 이은 근사 범위입니다. 느 11:25–35는 더 남쪽(브엘세바)까지 적지만 그 범위는 그리지 않았습니다. 페르시아 속주 예후드의 실제 경계는 본문에 없습니다.</p>"
  };
  var COMMON = '<p>성읍 좌표 출처: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info Bible Geocoding Data</a> · CC BY 4.0 (일부 원자료는 OpenStreetMap 기반, ODbL 1.0). 영역 모양은 이 좌표와 성경 구절을 바탕으로 직접 그렸으며 정치적 국경이 아닙니다.</p>';
  var savedMin = null, pendingFit = false, bound = null, lastKey = null, cardEl = null, cardLL = null, shown = false, relabelT = 0;

  function mapObj() { try { return window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); } catch (e) { return null; } }
  function topic() { try { return (BVC.ui && BVC.ui.nav && BVC.ui.nav.topic) || ""; } catch (e) { return ""; } }
  function eraKey() { return KEY[topic()] && document.body.dataset.view === "study" ? KEY[topic()] : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function colorExpr() { var e = ["match", ["get", "en"]]; Object.keys(COLOR).forEach(function (k) { e.push(k, COLOR[k]); }); e.push("#888"); return e; }
  function labelFont(m) {
    try { var ls = m.getStyle().layers || []; for (var i = 0; i < ls.length; i++) { var f = ls[i].layout && ls[i].layout["text-font"]; if (f) return f; } } catch (e) {}
    return ["Noto Sans Regular"];
  }
  function waterLayerId(m) {
    try { var ls = m.getStyle().layers || []; for (var i = 0; i < ls.length; i++) if (/^water/i.test(ls[i].id)) return ls[i].id; } catch (e) {}
    return undefined;
  }
  function ensure(m) {
    var data = window.JBC_ERA_AREAS; if (!m || !m.getStyle || !m.getStyle() || !data) return;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type: "geojson", data: data });
      if (!m.getSource(LSRC)) m.addSource(LSRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      var under = waterLayerId(m), none = ["==", ["get", "eras"], ""];
      if (!m.getLayer(FILL)) m.addLayer({ id: FILL, type: "fill", source: SRC, paint: { "fill-color": colorExpr(), "fill-opacity": 0.28 }, filter: none }, under);
      if (!m.getLayer(LINE)) m.addLayer({ id: LINE, type: "line", source: SRC, paint: { "line-color": colorExpr(), "line-width": 1.6, "line-opacity": 0.8, "line-dasharray": [3, 2] }, filter: none }, under);
      var pts = window.JBC_ERA_POINTS;
      if (pts) {
        if (!m.getSource("jbc-erp")) m.addSource("jbc-erp", { type: "geojson", data: pts });
        var gc = ["match", ["get", "group"], "Japheth", GCOL.Japheth, "Ham", GCOL.Ham, "Shem", GCOL.Shem, "#888"];
        if (!m.getLayer("jbc-erp-dot")) m.addLayer({ id: "jbc-erp-dot", type: "circle", source: "jbc-erp", paint: { "circle-radius": 6, "circle-color": gc, "circle-opacity": 0.85, "circle-stroke-color": "#fffaf0", "circle-stroke-width": 1.6 }, filter: none });
        if (!m.getLayer("jbc-erp-label")) m.addLayer({ id: "jbc-erp-label", type: "symbol", source: "jbc-erp", layout: { "text-field": ["get", "ko"], "text-font": labelFont(m), "text-size": 13, "text-offset": [0, 1.1], "text-anchor": "top", "text-allow-overlap": false }, paint: { "text-color": "#3a2a1a", "text-halo-color": "rgba(255,250,240,.9)", "text-halo-width": 1.6 }, filter: none });
      }
      if (!m.getLayer(LBL)) m.addLayer({ id: LBL, type: "symbol", source: LSRC, layout: { "text-field": ["get", "ko"], "text-font": labelFont(m), "text-size": 15, "text-letter-spacing": 0.1, "text-allow-overlap": false }, paint: { "text-color": "#3a2a1a", "text-halo-color": "rgba(255,250,240,.88)", "text-halo-width": 1.8 } });
    } catch (e) { /* style still loading */ }
  }
  function closeCard() { if (cardEl) { cardEl.remove(); cardEl = null; cardLL = null; } }
  function placeCard() {
    if (!cardEl || !cardLL || !bound) return;
    var pt = bound.project(cardLL), box = cardEl.getBoundingClientRect(), host = bound.getContainer().getBoundingClientRect();
    var x = Math.max(8, Math.min(host.width - box.width - 8, pt.x - box.width / 2)), y = pt.y - box.height - 12; if (y < 8) y = pt.y + 14;
    cardEl.style.left = x + "px"; cardEl.style.top = y + "px";
  }
  function showCard(m, f, ll) {
    closeCard(); var tip = document.getElementById("jbc-trb-tip"); if (tip) tip.hidden = true; var p = f.properties;
    cardEl = document.createElement("div"); cardEl.className = "jbc-ref-popup jbc-trb-card";
    cardEl.innerHTML = '<button type="button" class="jbc-ref-close" aria-label="닫기">×</button><div class="jbc-ref-pop"><strong>' + esc(p.ko) + ' <span>' + esc(NAME[lastKey] || "") + '</span></strong>' +
      '<p class="jbc-ref-tag">참고용 개략 범위 · 실제 경계가 아님</p><p>근거: ' + esc(p.ref) + '</p><p>' + esc(p.note) + '</p>' +
      '<p class="jbc-ref-src">성읍 좌표: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> · CC BY 4.0. 영역 모양은 직접 그렸습니다.</p></div>';
    cardEl.querySelector(".jbc-ref-close").onclick = closeCard;
    m.getContainer().appendChild(cardEl); cardLL = ll; placeCard();
  }
  // the (i) button and its tip are the tribal module's; this module fills them while one of its eras is open
  function showPointCard(m, f, ll) {
    closeCard(); var tip = document.getElementById("jbc-trb-tip"); if (tip) tip.hidden = true; var p = f.properties;
    cardEl = document.createElement("div"); cardEl.className = "jbc-ref-popup jbc-trb-card";
    cardEl.innerHTML = '<button type="button" class="jbc-ref-close" aria-label="닫기">×</button><div class="jbc-ref-pop"><strong>' + esc(p.ko) + ' <span>' + esc(GKO[p.group] || "") + '</span></strong>' +
      '<p class="jbc-ref-tag">참고 위치 · 민족이 살았던 곳을 확정한 것이 아님</p><p>근거: ' + esc(p.ref) + ' (창세기 10장 민족 목록의 이름)</p>' +
      '<p class="jbc-ref-src">위치: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> · CC BY 4.0 · 식별 점수 ' + esc(p.s) + '/1000. 점은 이 지명이 가리키는 곳(또는 지역의 중심)입니다.</p></div>';
    cardEl.querySelector(".jbc-ref-close").onclick = closeCard;
    m.getContainer().appendChild(cardEl); cardLL = ll; placeCard();
  }
  function showInfo(k) {
    var btn = document.getElementById("jbc-trb-info"), tip = document.getElementById("jbc-trb-tip");
    if (!btn || !tip || !tip._base) return false;
    if (k) {
      tip.innerHTML = "<strong>" + esc(NAME[k]) + " 영역 · 참고용</strong>" + TIP[k] + COMMON;
      btn.hidden = false; shown = true; window.JBC_ERA_INFO_ACTIVE = true; btn.setAttribute("aria-label", "영역 출처와 방법"); btn.title = "영역 출처와 방법";
    } else if (shown) {
      shown = false; window.JBC_ERA_INFO_ACTIVE = false; btn.hidden = true; tip.hidden = true;
    }
    return true;
  }
  function relabel(m) {
    var src = m.getSource(LSRC); if (!src || !eraKey()) return;
    var canvas = m.getCanvas(), w = canvas.clientWidth, h = canvas.clientHeight, cols = 14, rows = 18, hits = {};
    for (var iy = 0; iy < rows; iy++) for (var ix = 0; ix < cols; ix++) {
      var pt = [(ix + 0.5) * w / cols, (iy + 0.5) * h / rows], fs = m.queryRenderedFeatures(pt, { layers: [FILL] });
      for (var k = 0; k < fs.length; k++) { var n = fs[k].properties.en, ko = fs[k].properties.ko; (hits[n] = hits[n] || { ko: ko, pts: [] }).pts.push(pt); }
    }
    var feats = [];
    Object.keys(hits).forEach(function (n) {
      var pts = hits[n].pts, mx = 0, my = 0; pts.forEach(function (p) { mx += p[0]; my += p[1]; }); mx /= pts.length; my /= pts.length;
      var best = pts[0], bd = 1e12; pts.forEach(function (p) { var d = (p[0] - mx) * (p[0] - mx) + (p[1] - my) * (p[1] - my); if (d < bd) { bd = d; best = p; } });
      var ll = m.unproject(best); feats.push({ type: "Feature", properties: { en: n, ko: hits[n].ko }, geometry: { type: "Point", coordinates: [ll.lng, ll.lat] } });
    });
    src.setData({ type: "FeatureCollection", features: feats });
  }
  function scheduleRelabel(m) { clearTimeout(relabelT); relabelT = setTimeout(function () { try { relabel(m); } catch (e) {} }, 180); }
  function apply(m) {
    ensure(m); if (!m.getLayer(FILL)) return;
    window.JBC_OLD_ERA_OVERLAY_OFF = window.JBC_OLD_ERA_OVERLAY_OFF || {};
    Object.keys(KEY).forEach(function (t) { window.JBC_OLD_ERA_OVERLAY_OFF[t] = true; });
    var k = eraKey(), infoOk = showInfo(k);
    if (pendingFit && m.getCanvas().clientWidth > 100) { pendingFit = false; try { if (savedMin == null) savedMin = m.getMinZoom(); m.setMinZoom(3.2); m.fitBounds([[22, 14], [50, 42]], { padding: 10, duration: 0 }); } catch (e) {} }
    if (!k && savedMin != null) { try { m.setMinZoom(savedMin); } catch (e) {} savedMin = null; }
    if (k !== lastKey || (k && !shown && infoOk)) {
      lastKey = k;
      var f = k ? ["==", ["get", "eras"], k] : ["==", ["get", "eras"], ""];
      [FILL, LINE].forEach(function (id) { if (m.getLayer(id)) m.setFilter(id, f); });
      var pf = k ? ["==", ["get", "era"], k] : ["==", ["get", "era"], ""];
      ["jbc-erp-dot", "jbc-erp-label"].forEach(function (id) { if (m.getLayer(id)) m.setFilter(id, pf); });
      if (!k) { closeCard(); var s = m.getSource(LSRC); if (s) s.setData({ type: "FeatureCollection", features: [] }); } else scheduleRelabel(m);
      if (k) showInfo(k);
      pendingFit = k === "primitive";
    }
  }
  function bind(m) {
    if (!m || bound === m) return; bound = m; lastKey = null;
    m.on("styledata", function () { ensure(m); lastKey = null; });
    m.on("click", FILL, function (e) {
      if (m.queryRenderedFeatures(e.point, { layers: ["jbc-ref-ob-circle", "jbc-place-dots-circle"].filter(function (id) { return m.getLayer(id); }) }).length) return;
      var f = e.features && e.features[0]; if (f) showCard(m, f, e.lngLat.toArray());
    });
    m.on("click", "jbc-erp-dot", function (e) { var f = e.features && e.features[0]; if (f) showPointCard(m, f, e.lngLat.toArray()); });
    m.on("mouseenter", "jbc-erp-dot", function () { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "jbc-erp-dot", function () { m.getCanvas().style.cursor = ""; });
    m.on("mouseenter", FILL, function () { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", FILL, function () { m.getCanvas().style.cursor = ""; });
    m.on("move", placeCard);
    var rl = function () { scheduleRelabel(m); };
    m.on("moveend", rl); m.on("zoomend", rl); m.on("idle", rl);
    apply(m);
  }
  // printed maps carry the source of the colour areas / points that are on screen
  window.JBC_PRINT_CREDIT = function () {
    var tp = topic(); if (!/^era\./.test(tp) || document.body.dataset.view !== "study") return "";
    return "시대 색면·표시 지점은 참고용 개략 범위이며 실제 경계가 아닙니다. 위치: OpenBible.info Bible Geocoding Data (CC BY 4.0, 일부 OpenStreetMap 기반 ODbL 1.0). 영역 모양은 성경 구절의 성읍·경계 서술을 근거로 직접 그렸습니다.";
  };
  setInterval(function () { var m = mapObj(); if (m) { bind(m); apply(m); } }, 500);
})();
