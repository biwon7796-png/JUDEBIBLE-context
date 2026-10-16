/* Conquest era topic: tribal territories drawn from the town lists of Joshua 13-19 located with OpenBible.info data (see tribal-regions-conquest-20261016.js).
   They replace the old Holman-inspired schematic for this era (the old overlay is switched off for it). REFERENCE ONLY: an approximate range, not a boundary.
   The source and the method are behind the small (i); a click on a territory shows its scripture basis and the towns used. */
(function () {
  var SRC = "jbc-trb", FILL = "jbc-trb-fill", LINE = "jbc-trb-line", LBL = "jbc-trb-label", LSRC = "jbc-trb-pts";
  var ERAS = { "era.conquest": true, "era.judges": true };
  var ENC = "jbc-enc", ENC_FILL = "jbc-enc-fill", ENC_LINE = "jbc-enc-line", ENC_LBL = "jbc-enc-label", ENC_PTS = "jbc-enc-pts";
  function eraName() { return topic() === "era.judges" ? "사사 시대" : "정복 시대"; }
  var COLOR = { "Judah": "#c9a227", "Simeon": "#b0654a", "Benjamin": "#7a8f4e", "Dan": "#a64f7f", "Ephraim": "#3f8f8a", "Manasseh-west": "#4f7fa6", "Issachar": "#8f6b4f",
                "Asher": "#6b8f6b", "Zebulun": "#2f7fb0", "Naphtali": "#9a6a3a", "Reuben": "#7b5aa6", "Gad": "#c27a3a", "Manasseh-east": "#5f7f9a" };
  var bound = null, lastOn = null, infoBtn = null, infoTip = null, cardEl = null, cardLL = null;

  function mapObj() { try { return window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); } catch (e) { return null; } }
  function topic() { try { return (BVC.ui && BVC.ui.nav && BVC.ui.nav.topic) || ""; } catch (e) { return ""; } }
  function on() { return !!ERAS[topic()] && document.body.dataset.view === "study"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function colorExpr() { var e = ["match", ["get", "en"]]; Object.keys(COLOR).forEach(function (k) { e.push(k, COLOR[k]); }); e.push("#888"); return e; }
  function labelFont(m) {
    try { var ls = m.getStyle().layers || []; for (var i = 0; i < ls.length; i++) { var f = ls[i].layout && ls[i].layout["text-font"]; if (f) return f; } } catch (e) {}
    return ["Noto Sans Regular"];
  }
  // draw the territories under the water layers, so the sea and the lakes stay clear
  function waterLayerId(m) {
    try { var ls = m.getStyle().layers || []; for (var i = 0; i < ls.length; i++) if (/^water/i.test(ls[i].id)) return ls[i].id; } catch (e) {}
    return undefined;
  }
  function ensure(m) {
    var data = window.JBC_TRIBAL_CONQUEST; if (!m || !m.getStyle || !m.getStyle() || !data) return;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type: "geojson", data: data });
      if (!m.getSource(LSRC)) m.addSource(LSRC, { type: "geojson", data: { type: "FeatureCollection", features: data.features.map(function (f) { return { type: "Feature", properties: { en: f.properties.en, ko: f.properties.ko }, geometry: { type: "Point", coordinates: [f.properties.cx, f.properties.cy] } }; }) } });
      var under = waterLayerId(m);
      if (!m.getLayer(FILL)) m.addLayer({ id: FILL, type: "fill", source: SRC, paint: { "fill-color": colorExpr(), "fill-opacity": 0.28 }, layout: { visibility: "none" } }, under);
      if (!m.getLayer(LINE)) m.addLayer({ id: LINE, type: "line", source: SRC, paint: { "line-color": colorExpr(), "line-width": 1.6, "line-opacity": 0.8, "line-dasharray": [3, 2] }, layout: { visibility: "none" } }, under);
      if (!m.getLayer(LBL)) m.addLayer({ id: LBL, type: "symbol", source: LSRC, layout: { visibility: "none", "text-field": ["get", "ko"], "text-font": labelFont(m), "text-size": 15, "text-letter-spacing": 0.1, "text-allow-overlap": false, "text-ignore-placement": false }, paint: { "text-color": "#3a2a1a", "text-halo-color": "rgba(255,250,240,.88)", "text-halo-width": 1.8 } });
      var enc = window.JBC_JUDGES_ENCLAVES;
      if (enc) {
        if (!m.getSource(ENC)) m.addSource(ENC, { type: "geojson", data: enc });
        if (!m.getSource(ENC_PTS)) m.addSource(ENC_PTS, { type: "geojson", data: { type: "FeatureCollection", features: enc.features.map(function (f) { var r = f.geometry.coordinates[0], x = 0, y = 0; r.forEach(function (q) { x += q[0]; y += q[1]; }); return { type: "Feature", properties: { ko: f.properties.ko, kind: f.properties.kind }, geometry: { type: "Point", coordinates: [x / r.length, y / r.length] } }; }) } });
        var isEnc = ["==", ["get", "kind"], "enclave"];
        if (!m.getLayer(ENC_FILL)) m.addLayer({ id: ENC_FILL, type: "fill", source: ENC, paint: { "fill-color": ["case", isEnc, "#8a2f2f", "#a64f7f"], "fill-opacity": ["case", isEnc, 0.42, 0.22] }, layout: { visibility: "none" } }, under);
        if (!m.getLayer(ENC_LINE)) m.addLayer({ id: ENC_LINE, type: "line", source: ENC, paint: { "line-color": ["case", isEnc, "#6e2020", "#a64f7f"], "line-width": 1.4, "line-opacity": 0.9, "line-dasharray": [2, 2] }, layout: { visibility: "none" } }, under);
        if (!m.getLayer(ENC_LBL)) m.addLayer({ id: ENC_LBL, type: "symbol", source: ENC_PTS, layout: { visibility: "none", "text-field": ["get", "ko"], "text-font": labelFont(m), "text-size": 12, "text-offset": [0, 1.2], "text-allow-overlap": false }, paint: { "text-color": "#5a1c1c", "text-halo-color": "rgba(255,250,240,.9)", "text-halo-width": 1.6 }, minzoom: 8.2 });
      }
    } catch (e) { /* style still loading */ }
  }
  function setVisible(m, v) {
    [FILL, LINE, LBL].forEach(function (id) { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", v ? "visible" : "none"); });
    var j = v && topic() === "era.judges";
    [ENC_FILL, ENC_LINE, ENC_LBL].forEach(function (id) { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", j ? "visible" : "none"); });
  }

  // ---- click card (own source, no card without a source) ----
  function closeCard() { if (cardEl) { cardEl.remove(); cardEl = null; cardLL = null; } }
  function placeCard() {
    if (!cardEl || !cardLL || !bound) return;
    var pt = bound.project(cardLL), box = cardEl.getBoundingClientRect(), host = bound.getContainer().getBoundingClientRect();
    var x = Math.max(8, Math.min(host.width - box.width - 8, pt.x - box.width / 2)), y = pt.y - box.height - 12; if (y < 8) y = pt.y + 14;
    cardEl.style.left = x + "px"; cardEl.style.top = y + "px";
  }
  var TRIBE_KO = { "Benjamin": "베냐민", "Manasseh-west": "서쪽 므낫세", "Ephraim": "에브라임", "Zebulun": "스불론", "Asher": "아셀", "Naphtali": "납달리", "Dan": "단" };
  function showEncCard(m, f, ll) {
    closeCard(); if (infoTip) infoTip.hidden = true; var p = f.properties, dan = p.kind === "dan-north";
    cardEl = document.createElement("div"); cardEl.className = "jbc-ref-popup jbc-trb-card";
    cardEl.innerHTML = '<button type="button" class="jbc-ref-close" aria-label="닫기">×</button><div class="jbc-ref-pop"><strong>' + esc(p.ko) + ' <span>사사 시대</span></strong>' +
      '<p class="jbc-ref-tag">참고용 · 실제 경계가 아님</p>' +
      (dan ? '<p>근거: ' + esc(p.ref) + ' — 단 지파가 라이스(단)를 쳐서 차지하고 북쪽으로 이주함. 원래 기업(남쪽)은 아모리 사람에게 밀려남(삿 1:34).</p>' : '<p>근거: ' + esc(p.ref) + ' — ' + esc(TRIBE_KO[p.tribe] || "") + ' 지파가 그 주민을 완전히 쫓아내지 못한 성읍</p>') +
      '<p class="jbc-ref-src">위치: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> · CC BY 4.0 · 식별 점수 ' + esc(p.s) + '/1000' + (p.m ? ' · 정밀도 약 ' + esc(p.m) + ' m' : '') + '. 원은 위치 표시이며 성벽이나 경계가 아닙니다.</p></div>';
    cardEl.querySelector(".jbc-ref-close").onclick = closeCard;
    m.getContainer().appendChild(cardEl); cardLL = ll; placeCard();
  }
  function showCard(m, f, ll) {
    closeCard(); if (infoTip) infoTip.hidden = true; var p = f.properties, towns = [];
    try { towns = typeof p.towns === "string" ? JSON.parse(p.towns) : (p.towns || []); } catch (e) {}
    cardEl = document.createElement("div"); cardEl.className = "jbc-ref-popup jbc-trb-card";
    cardEl.innerHTML = '<button type="button" class="jbc-ref-close" aria-label="닫기">×</button><div class="jbc-ref-pop"><strong>' + esc(p.ko) + ' 지파 <span>' + eraName() + '</span></strong>' +
      '<p class="jbc-ref-tag">참고용 개략 범위 · 실제 경계가 아님</p>' +
      '<p>근거: 여호수아 ' + esc(String(p.ref).replace(/^수\s*/, '')) + '절의 성읍 목록 중 위치를 찾은 ' + esc(p.n) + '곳</p>' +
      (p.rule ? '<p>본문 읽기에 따른 보정: ' + esc(p.rule) + '</p>' : '') +
      (p.nb ? '<p>경계 서술 수 ' + esc(String(p.bref).replace(/^수\s*/, '')) + '절에 나온 지점 ' + esc(p.nb) + '곳을 더해 보정했습니다.</p>' : '') +
      '<p class="jbc-ref-src">' + esc(towns.join(", ")) + (p.more ? " 외 " + esc(p.more) + "곳" : "") + '</p>' +
      '<p class="jbc-ref-src">성읍 좌표: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> · CC BY 4.0. 영역 모양은 이 좌표를 바탕으로 직접 그렸습니다.</p></div>';
    cardEl.querySelector(".jbc-ref-close").onclick = closeCard;
    m.getContainer().appendChild(cardEl); cardLL = ll; placeCard();
  }

  // ---- small (i) ----
  function showInfo(m, v) {
    if (!infoBtn) {
      infoBtn = document.createElement("button"); infoBtn.type = "button"; infoBtn.id = "jbc-trb-info"; infoBtn.textContent = "i"; infoBtn.setAttribute("aria-label", "지파 영역 출처와 방법"); infoBtn.title = "지파 영역 출처와 방법";
      infoTip = document.createElement("div"); infoTip.id = "jbc-trb-tip"; infoTip.hidden = true;
      infoTip.innerHTML = "<strong>정복 시대 지파 영역 · 참고용</strong>" +
        "<p>여호수아 13–19장에 적힌 지파별 성읍 목록의 각 성읍 위치를 찾아, 가장 가까운 지파에 배정해 그린 개략 범위입니다. 경계가 적힌 구절(수 15:1–12, 16:1–10, 17:7–10, 18:11–20, 19:10–14, 19:17–22, 19:24–30, 19:32–34)에 나온 지점도 반영했습니다(해당 지점 113곳 중 112곳이 지파 영역 3 km 안). 성경에 적힌 경계를 그대로 복원한 것이 아니며, 학자마다 복원이 다릅니다.</p>" +
        "<p>본문 읽기에 따른 보정: ① 유다 — 블레셋 평야 성읍(수 15:45–47: 에그론·아스돗·가사)은 점령하지 못했으므로(삿 1:18–19) 유다 영역으로 그리지 않음. ② 시므온 — 기업이 유다 안에 있고(수 19:1, 9) 두 목록에 모두 나온 성읍은 시므온에 배정. ③ 에브라임 — 세겜(수 20:7; 21:21), 답부아(수 17:8), 레위 성읍(수 21:20–22)은 에브라임에 배정하고, 믹므다·엔답부아는 므낫세 경계 표지(수 17:7–10)로만 사용. ④ 서쪽 므낫세 — 남쪽 경계를 믹므다–엔답부아–가나 시내(수 17:7–9)를 잇는 선으로 보고, 그 북쪽 다아낙까지를 므낫세로 둠. ⑤ 동쪽(수 13장) — 르우벤은 아르논 가의 아로엘~헤스본(13:15–23), 갓은 야셀·길르앗 성읍·헤스본~라맛미스바·요단 골짜기에서 긴네렛 바다 남쪽 끝까지(13:24–28), 동쪽 므낫세는 마하나임 이북 바산(옥 왕국: 아스다롯·에드레이·살르가·골란)과 하윗야일(13:29–31; 12:4–5). 마하나임은 갓과 므낫세의 경계 지점이라 어느 쪽에도 넣지 않음.</p>" +
        '<p>비교 기준(모양을 따라 그리지 않고 어긋나는 곳만 점검): George Adam Smith, <em>Atlas of the Historical Geography of the Holy Land</em> (1915), “Palestine, Period of Israel’s Settlement and of the Judges” · 퍼블릭 도메인 · <a href="https://commons.wikimedia.org/wiki/File:Palestine_in_the_period_of_Israel%27s_settlement_and_of_the_Judges_(Smith,_1915).jpg" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></p>' +
        '<p>성읍 좌표 출처: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info Bible Geocoding Data</a> · CC BY 4.0 (신뢰도 200/1000 이상, 정밀도 3 km 이내인 지점만 사용)</p>' +
        "<p>주변 나라(블레셋·에돔·암몬 등)의 색면도 같은 자료의 지역 범위(가능성이 높은 범위의 등고선)이며, 정치적 국경이 아닙니다. 일부 원자료는 OpenStreetMap 기반(ODbL 1.0)입니다.</p>";
      infoBtn.onclick = function () { closeCard(); infoTip.hidden = !infoTip.hidden; };
    }
    var host = m.getContainer().parentElement || m.getContainer();
    if (infoBtn.parentElement !== host) { host.appendChild(infoBtn); host.appendChild(infoTip); }
    if (!infoTip._base) infoTip._base = infoTip.innerHTML;
    infoTip.innerHTML = topic() === "era.judges"
      ? "<strong>사사 시대 지파 영역 · 참고용</strong><p>사사 시대의 지파 영역은 정복 시대와 같은 방식으로 그린 범위(여호수아 13–19장의 성읍 목록)를 쓰되, 사사기가 말하는 두 가지를 덧붙였습니다.</p>" +
        "<p>① 붉은 표시 — 지파가 주민을 쫓아내지 못한 성읍(삿 1:21 예루살렘, 1:27 벧스안·다아낙·돌·이블르암·므깃도, 1:29 게셀, 1:30 깃론, 1:31 악고·시돈·아흘랍·악십·아빅·르홉, 1:33 벧세메스·벧아낫, 1:35 아얄론·사알빔·헤레스산). 각 성읍은 OpenBible 위치 둘레 약 5 km 원으로 표시했으며 성벽이나 경계가 아닙니다. 나할롤(삿 1:30)은 위치를 찾지 못해 뺐습니다.</p>" +
        "<p>② 단 지파의 북쪽 이주(삿 18:27–29) — 라이스(단) 둘레 약 14 km 범위를 연보라로 표시했습니다. 남쪽 단 영역은 아모리 사람에게 밀려난 기업(삿 1:34)이므로 정복 시대 범위를 그대로 두었습니다.</p>" +
        "<p>사사기는 지파 영역의 선을 적지 않으며, 이 시기에 경계가 고정되어 있었다는 뜻도 아닙니다. 아래는 지파 범위를 그린 방법과 출처입니다.</p>" + infoTip._base.replace(/^<strong>[^<]*<\/strong>/, "")
      : infoTip._base;
    infoBtn.hidden = !v; if (!v) infoTip.hidden = true;
    window.JBC_TRB_INFO_ACTIVE = !!v;
  }


  // ---- labels that follow the visible part of each area (a single fixed label point vanishes when you zoom in) ----
  var relabelT = 0;
  function relabel(m, fillId, srcId, filterIsOn) {
    var src = m.getSource(srcId); if (!src || !filterIsOn) return;
    var canvas = m.getCanvas(), w = canvas.clientWidth, h = canvas.clientHeight, cols = 14, rows = 18, hits = {};
    for (var iy = 0; iy < rows; iy++) for (var ix = 0; ix < cols; ix++) {
      var pt = [(ix + 0.5) * w / cols, (iy + 0.5) * h / rows], fs = m.queryRenderedFeatures(pt, { layers: [fillId] });
      for (var k = 0; k < fs.length; k++) { var n = fs[k].properties.en, ko = fs[k].properties.ko; (hits[n] = hits[n] || { ko: ko, pts: [] }).pts.push(pt); }
    }
    var feats = [];
    Object.keys(hits).forEach(function (n) {
      var pts = hits[n].pts, mx = 0, my = 0; pts.forEach(function (p) { mx += p[0]; my += p[1]; }); mx /= pts.length; my /= pts.length;
      var best = pts[0], bd = 1e12; pts.forEach(function (p) { var d = (p[0] - mx) * (p[0] - mx) + (p[1] - my) * (p[1] - my); if (d < bd) { bd = d; best = p; } });   // a point inside the area, closest to the middle of its visible part
      var ll = m.unproject(best); feats.push({ type: "Feature", properties: { en: n, ko: hits[n].ko }, geometry: { type: "Point", coordinates: [ll.lng, ll.lat] } });
    });
    src.setData({ type: "FeatureCollection", features: feats });
  }
  function scheduleRelabel(m, fillId, srcId, isOn) {
    clearTimeout(relabelT); relabelT = setTimeout(function () { try { relabel(m, fillId, srcId, isOn()); } catch (e) {} }, 180);
  }
  function apply(m) {
    ensure(m); if (!m.getLayer(FILL)) return;
    var v = on() ? topic() : ""; window.JBC_OLD_ERA_OVERLAY_OFF = window.JBC_OLD_ERA_OVERLAY_OFF || {}; window.JBC_OLD_ERA_OVERLAY_OFF["era.conquest"] = true; window.JBC_OLD_ERA_OVERLAY_OFF["era.judges"] = true;
    if (v !== lastOn) { lastOn = v; setVisible(m, !!v); showInfo(m, !!v); if (!v) closeCard(); }
  }
  function bind(m) {
    if (!m || bound === m) return; bound = m; lastOn = null;
    m.on("styledata", function () { ensure(m); lastOn = null; });
    m.on("click", FILL, function (e) {
      if (m.queryRenderedFeatures(e.point, { layers: ["jbc-ref-ob-circle", "jbc-place-dots-circle"].filter(function (id) { return m.getLayer(id); }) }).length) return;   // a place dot wins
      var f = e.features && e.features[0]; if (f) showCard(m, f, e.lngLat.toArray());
    });
    m.on("click", ENC_FILL, function (e) {
      if (m.queryRenderedFeatures(e.point, { layers: ["jbc-ref-ob-circle", "jbc-place-dots-circle"].filter(function (id) { return m.getLayer(id); }) }).length) return;
      var f = e.features && e.features[0]; if (f) showEncCard(m, f, e.lngLat.toArray());
    });
    m.on("mouseenter", ENC_FILL, function () { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", ENC_FILL, function () { m.getCanvas().style.cursor = ""; });
    m.on("move", placeCard);
    var rl = function () { scheduleRelabel(m, FILL, LSRC, function () { return lastOn; }); };
    m.on("moveend", rl); m.on("zoomend", rl); m.on("idle", rl);
    m.on("mouseenter", FILL, function () { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", FILL, function () { m.getCanvas().style.cursor = ""; });
    apply(m);
  }
  setInterval(function () { var m = mapObj(); if (m) { bind(m); apply(m); } }, 500);
})();
