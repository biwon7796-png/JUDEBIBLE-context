/* Map: reference places from OpenBible.info Bible Geocoding Data (CC BY 4.0), shown as small hollow dots.
   REFERENCE ONLY: they are not part of the research registry and they do not claim to identify the biblical place.
   Needs reference-places-openbible-20261016.js (window.JBC_REF_PLACES_OPENBIBLE). Local test build. */
(function () {
  var SRC = "jbc-ref-ob", DOT = "jbc-ref-ob-circle", LBL = "jbc-ref-ob-label";
  var CREDIT_URL = "https://www.openbible.info/geo/";
  var bound = null;

  function mapObj() { try { return window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function features() {
    var list = window.JBC_REF_PLACES_OPENBIBLE || [];
    return list.map(function (p, i) {
      return { type: "Feature", id: i, properties: { i: i, label: p.n }, geometry: { type: "Point", coordinates: [p.lon, p.lat] } };
    });
  }
  function labelFont(m) {
    try { var ls = m.getStyle().layers || []; for (var i = 0; i < ls.length; i++) { var f = ls[i].layout && ls[i].layout["text-font"]; if (f) return f; } } catch (e) {}
    return ["Noto Sans Regular"];
  }
  function ensure(m) {
    if (!m || !m.getStyle || !m.getStyle() || !window.JBC_REF_PLACES_OPENBIBLE) return;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type: "geojson", data: { type: "FeatureCollection", features: features() } });
      if (!m.getLayer(DOT)) m.addLayer({
        id: DOT, type: "circle", source: SRC,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 1.8, 9, 3.2],
          "circle-color": "#fffaf0", "circle-stroke-color": "#8a5a2b", "circle-stroke-width": 1.2, "circle-opacity": 0.92
        }
      });
      if (!m.getLayer(LBL)) m.addLayer({
        id: LBL, type: "symbol", source: SRC, minzoom: 7.2,
        layout: { "text-field": ["get", "label"], "text-font": labelFont(m), "text-size": 10.5, "text-anchor": "top", "text-offset": [0, 0.8], "text-optional": true },
        paint: { "text-color": "#6a4a2a", "text-halo-color": "rgba(255,250,240,.95)", "text-halo-width": 1.5 }
      });
      // keep the reference dots under the registered place dots
      if (m.getLayer("jbc-place-dots-circle")) { try { m.moveLayer(DOT, "jbc-place-dots-circle"); m.moveLayer(LBL, "jbc-place-dots-circle"); } catch (e) {} }
    } catch (e) { /* style still loading: retried on the next styledata / idle */ }
  }
  function popupHtml(p) {
    var conf = p.s >= 800 ? "높음" : "보통";
    var prec = p.m ? "약 ±" + (p.m >= 1000 ? (p.m / 1000) + " km" : p.m + " m") : "정밀도 미상";
    return '<div class="jbc-ref-pop"><strong>' + esc(p.n) + (p.ko ? " <span>" + esc(p.en) + "</span>" : "") + '</strong>' +
      '<p class="jbc-ref-tag">참고 위치 · 성경 속 장소를 확정한 것이 아님</p>' +
      '<p>동일시 신뢰도 ' + esc(p.s) + ' / 1000 (' + conf + ') · ' + esc(prec) + '</p>' +
      '<p class="jbc-ref-src">출처: <a href="' + CREDIT_URL + '" target="_blank" rel="noopener noreferrer">OpenBible.info Bible Geocoding Data</a> · CC BY 4.0' +
      (p.mod ? ' · 현대 위치: ' + esc(p.mod) : "") + '</p></div>';
  }

  // lightweight popup (MapLibre is loaded as a module, so its Popup class is not a global)
  var popupEl = null, popupLL = null;
  function closePopup() { if (popupEl) { popupEl.remove(); popupEl = null; popupLL = null; } }
  function placePopup() {
    if (!popupEl || !popupLL || !bound) return;
    var pt = bound.project(popupLL), box = popupEl.getBoundingClientRect(), host = bound.getContainer().getBoundingClientRect();
    var x = Math.max(8, Math.min(host.width - box.width - 8, pt.x - box.width / 2)), y = pt.y - box.height - 14;
    if (y < 8) y = pt.y + 16;
    popupEl.style.left = x + "px"; popupEl.style.top = y + "px";
  }
  function showPopup(m, p, ll) {
    closePopup();
    popupEl = document.createElement("div"); popupEl.className = "jbc-ref-popup";
    popupEl.innerHTML = '<button type="button" class="jbc-ref-close" aria-label="닫기">×</button>' + popupHtml(p);
    popupEl.querySelector(".jbc-ref-close").onclick = closePopup;
    m.getContainer().appendChild(popupEl); popupLL = ll; placePopup();
  }
  function bind(m) {
    if (!m || bound === m) return;
    bound = m;
    var again = function () { ensure(m); };
    m.on("load", again); m.on("styledata", again); m.on("idle", again);
    m.on("click", DOT, function (e) {
      var f = e.features && e.features[0]; if (!f) return;
      var p = (window.JBC_REF_PLACES_OPENBIBLE || [])[f.properties.i]; if (!p) return;
      showPopup(m, p, f.geometry.coordinates);
    });
    // a click anywhere else on the map closes the card
    m.on("click", function (e) {
      var hit = m.queryRenderedFeatures(e.point, { layers: [DOT] });
      if (!hit.length) closePopup();
    });
    m.on("move", placePopup);
    m.on("mouseenter", DOT, function () { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", DOT, function () { m.getCanvas().style.cursor = ""; });
    ensure(m);
  }

  // --- source line in the map settings "자료 출처" list and a legend entry (once) ---
  function addCredits() {
    var list = document.querySelector(".map-src-list");
    if (list && !list.querySelector("[data-jbc-ref-ob]")) {
      var li = document.createElement("li"); li.setAttribute("data-jbc-ref-ob", "1");
      li.innerHTML = '<span class="map-src-k">참고 지명 좌표</span><a href="' + CREDIT_URL + '" target="_blank" rel="noopener noreferrer">OpenBible.info Bible Geocoding Data</a> · CC BY 4.0 · 참고 위치(속이 빈 점)이며 성경 장소를 확정하지 않습니다';
      list.appendChild(li);
    }
    var leg = document.querySelector('[data-mi="reference"] .mi-list');
    if (leg && !leg.querySelector("[data-jbc-ref-ob]")) {
      var li2 = document.createElement("li"); li2.setAttribute("data-jbc-ref-ob", "1");
      li2.innerHTML = '<span class="mi-aa jbc-ref-key" aria-hidden="true"></span>참고 위치 (OpenBible.info · 위치 확정 아님)';
      leg.appendChild(li2);
    }
  }

  setInterval(function () { var mb = document.getElementById("map-body"), r = mb && mb.getBoundingClientRect(); if (!r || r.width < 1 || r.height < 1) return; var m = mapObj(); if (m) { bind(m); ensure(m); } addCredits(); }, 1200);
})();
