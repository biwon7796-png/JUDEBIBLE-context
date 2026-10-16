/* Map: every place that has registered coordinates is shown as a dot (name label from the mid zoom levels), not only the places of the open passage.
   Read-only: it reads BVC.placeIndex() and draws an extra MapLibre layer; nothing in the research data or the existing markers is changed. */
(function () {
  var SRC = "jbc-place-dots", DOT = "jbc-place-dots-circle", LBL = "jbc-place-dots-label";
  var bound = null;

  function mapObj() { try { return window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); } catch (e) { return null; } }
  function features() {
    var list = [];
    try { list = BVC.placeIndex().list || []; } catch (e) {}
    return list.filter(function (p) { return typeof p.lat === "number" && typeof p.lon === "number" && isFinite(p.lat) && isFinite(p.lon); }).map(function (p) {
      return { type: "Feature", properties: { key: p.key, label: p.label || p.en || p.key }, geometry: { type: "Point", coordinates: [p.lon, p.lat] } };
    });
  }
  function labelFont(m) {
    try {
      var layers = m.getStyle().layers || [];
      for (var i = 0; i < layers.length; i++) { var f = layers[i].layout && layers[i].layout["text-font"]; if (f) return f; }
    } catch (e) {}
    return ["Noto Sans Regular"];
  }
  function ensure(m) {
    if (!m || !m.getStyle || !m.getStyle()) return;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type: "geojson", data: { type: "FeatureCollection", features: features() } });
      if (!m.getLayer(DOT)) m.addLayer({
        id: DOT, type: "circle", source: SRC,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2.2, 9, 3.8],
          "circle-color": "#b8692a", "circle-stroke-color": "#fffaf0", "circle-stroke-width": 1.1, "circle-opacity": 0.96
        }
      });
      if (!m.getLayer(LBL)) m.addLayer({
        id: LBL, type: "symbol", source: SRC, minzoom: 6.2,
        layout: { "text-field": ["get", "label"], "text-font": labelFont(m), "text-size": 11.5, "text-anchor": "top", "text-offset": [0, 0.9], "text-optional": true },
        paint: { "text-color": "#4a2c12", "text-halo-color": "rgba(255,250,240,.96)", "text-halo-width": 1.6 }
      });
    } catch (e) { /* the style may still be loading; the next styledata/idle event retries */ }
  }
  function bind(m) {
    if (!m || bound === m) return;
    bound = m;
    var again = function () { ensure(m); };
    m.on("load", again); m.on("styledata", again); m.on("idle", again);
    m.on("click", DOT, function (e) {
      var f = e.features && e.features[0]; if (!f) return;
      try { BVC.openPlace(f.properties.key); } catch (err) {}
    });
    m.on("mouseenter", DOT, function () { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", DOT, function () { m.getCanvas().style.cursor = ""; });
    ensure(m);
  }
  // the map is created lazily and can be re-created: keep looking for it
  setInterval(function () { var m = mapObj(); if (m) { bind(m); ensure(m); } }, 1200);
})();
