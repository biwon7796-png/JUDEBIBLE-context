/* Era topics: colour areas for the NEIGHBOURING nations, drawn from OpenBible.info geometry (CC BY 4.0) instead of the Holman-inspired schematics.
   REFERENCE ONLY: confidence contours of where each ancient region probably lay, not political borders. Source is shown behind a small (i).
   Needs neighbor-regions-openbible-20261016.js. Local test build. */
(function () {
  var SRC = "jbc-nbr", FILL = "jbc-nbr-fill", LINE = "jbc-nbr-line", LBL = "jbc-nbr-label", LSRC = "jbc-nbr-pts";
  var COLOR = { Philistia: "#c27a3a", Edom: "#b0524a", Ammon: "#7a8f4e", Aram: "#4f7fa6", Moab: "#a6704f", "Aram-naharaim": "#5f8fb8", Assyria: "#7b5aa6", Babylonia: "#3f8f8a", Egypt: "#c9a227", Persia: "#a64f7f", Phoenicia: "#2f7fb0", Elam: "#9a6a3a", Midian: "#6b8f6b", Amalek: "#8f6b4f", Media: "#7f8590" };
  // which neighbours belong to which era topic
  var ERA = {
    "era.conquest": ["Philistia", "Ammon", "Edom", "Midian", "Amalek"],
    "era.judges": ["Philistia", "Ammon", "Moab", "Midian", "Amalek", "Aram", "Aram-naharaim"],
    "era.united-monarchy": ["Philistia", "Ammon", "Moab", "Edom", "Aram", "Phoenicia", "Egypt"],
    "era.divided-monarchy": ["Aram", "Phoenicia", "Philistia", "Edom", "Ammon", "Moab", "Egypt"],
    "era.assyria": ["Assyria", "Aram", "Egypt", "Philistia"],
    "era.exile": ["Babylonia", "Elam", "Egypt", "Edom"],
    "era.return": ["Persia", "Media", "Egypt", "Edom"],
    "era.intertestamental": ["Egypt", "Aram", "Edom", "Phoenicia", "Philistia", "Ammon"]
  };
  var bound = null, lastKey = "", infoBtn = null, infoTip = null;

  function mapObj() { try { return window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); } catch (e) { return null; } }
  function topic() { try { return (BVC.ui && BVC.ui.nav && BVC.ui.nav.topic) || ""; } catch (e) { return ""; } }
  function active() { return ERA[topic()] && document.body.dataset.view === "study" ? ERA[topic()] : null; }
  function bboxCenter(g) {
    var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    (function walk(a) { if (typeof a[0] === "number") { minx = Math.min(minx, a[0]); maxx = Math.max(maxx, a[0]); miny = Math.min(miny, a[1]); maxy = Math.max(maxy, a[1]); } else a.forEach(walk); })(g.coordinates);
    return [(minx + maxx) / 2, (miny + maxy) / 2];
  }
  function labelFont(m) {
    try { var ls = m.getStyle().layers || []; for (var i = 0; i < ls.length; i++) { var f = ls[i].layout && ls[i].layout["text-font"]; if (f) return f; } } catch (e) {}
    return ["Noto Sans Regular"];
  }
  function colorExpr() { var e = ["match", ["get", "en"]]; Object.keys(COLOR).forEach(function (k) { e.push(k, COLOR[k]); }); e.push("#888"); return e; }

  function ensure(m) {
    var data = window.JBC_NEIGHBOR_REGIONS_OB; if (!m || !m.getStyle || !m.getStyle() || !data) return;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type: "geojson", data: data });
      if (!m.getSource(LSRC)) m.addSource(LSRC, { type: "geojson", data: { type: "FeatureCollection", features: data.features.map(function (f) { return { type: "Feature", properties: { en: f.properties.en, ko: f.properties.ko }, geometry: { type: "Point", coordinates: bboxCenter(f.geometry) } }; }) } });
      var before = m.getLayer("jbc-ref-ob-circle") ? "jbc-ref-ob-circle" : (m.getLayer("jbc-place-dots-circle") ? "jbc-place-dots-circle" : undefined);
      if (!m.getLayer(FILL)) m.addLayer({ id: FILL, type: "fill", source: SRC, paint: { "fill-color": colorExpr(), "fill-opacity": ["match", ["get", "en"], ["Persia", "Media"], 0.11, 0.035] }, filter: ["==", ["get", "en"], ""] }, before);
      if (!m.getLayer(LINE)) m.addLayer({ id: LINE, type: "line", source: SRC, paint: { "line-color": colorExpr(), "line-width": ["match", ["get", "en"], ["Persia", "Media"], 1.5, 1.2], "line-opacity": ["match", ["get", "en"], ["Persia", "Media"], 0.55, 0.35], "line-dasharray": [3, 2] }, filter: ["==", ["get", "en"], ""] }, before);
      if (!m.getLayer(LBL)) m.addLayer({ id: LBL, type: "symbol", source: LSRC, layout: { "text-field": ["get", "ko"], "text-font": labelFont(m), "text-size": 14, "text-letter-spacing": 0.12, "text-allow-overlap": false }, paint: { "text-color": "#3a2a1a", "text-halo-color": "rgba(255,250,240,.85)", "text-halo-width": 1.6, "text-opacity": 0.75 }, filter: ["==", ["get", "en"], ""] });
    } catch (e) { /* style still loading */ }
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
    var list = active(), key = list ? list.join(",") : "";
    ensure(m);
    if (!m.getLayer(FILL)) return;
    if (key !== lastKey) {
      lastKey = key;
      var f = list ? ["in", ["get", "en"], ["literal", list]] : ["==", ["get", "en"], ""];
      [FILL, LINE, LBL].forEach(function (id) { if (m.getLayer(id)) m.setFilter(id, f); });
    }
    showInfo(!!list, m);
  }

  // small (i) with the source, bottom-left of the map
  function showInfo(on, m) {
    if (!infoBtn) {
      infoBtn = document.createElement("button"); infoBtn.type = "button"; infoBtn.id = "jbc-nbr-info"; infoBtn.textContent = "i"; infoBtn.setAttribute("aria-label", "주변국 색면 출처"); infoBtn.title = "주변국 색면 출처";
      infoTip = document.createElement("div"); infoTip.id = "jbc-nbr-tip"; infoTip.hidden = true;
      infoTip.innerHTML = "<strong>주변국 색면 · 참고용</strong><p>각 나라가 있었을 가능성이 높은 범위를 나타낸 개략 영역이며, 정치적 국경이 아닙니다. 시대에 따라 범위가 달랐습니다.</p>" +
        '<p>출처: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info Bible Geocoding Data</a> · CC BY 4.0 (일부 OpenStreetMap 기반, ODbL 1.0)</p>';
      infoBtn.onclick = function () { infoTip.hidden = !infoTip.hidden; };
    }
    var host = m.getContainer().parentElement || m.getContainer();
    if (infoBtn.parentElement !== host) { host.appendChild(infoBtn); host.appendChild(infoTip); }
    var show = on && !window.JBC_TRB_INFO_ACTIVE && !window.JBC_ERA_INFO_ACTIVE;   // the tribal (i) already covers these sources
    infoBtn.hidden = !show; if (!show) infoTip.hidden = true;
  }

  function bind(m) {
    if (!m || bound === m) return; bound = m; lastKey = "";
    var again = function () { ensure(m); lastKey = ""; apply(m); };
    m.on("load", again); m.on("styledata", function () { ensure(m); });
    var rl = function () { scheduleRelabel(m, FILL, LSRC, function () { return !!active(); }); };
    m.on("moveend", rl); m.on("zoomend", rl); m.on("idle", rl);
    apply(m);
  }
  setInterval(function () { var m = mapObj(); if (m) { bind(m); apply(m); } }, 500);
})();
