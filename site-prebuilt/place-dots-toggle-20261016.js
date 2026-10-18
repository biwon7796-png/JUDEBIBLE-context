/* On/off switch for the place-name dots (registered places + OpenBible reference places).
   Two controls, one state: a small chip on the map and a checkbox in the map settings. The choice is remembered in this browser. */
(function () {
  var KEY = "jbc.placeDots";
  var LAYERS = ["jbc-place-dots-circle", "jbc-place-dots-label", "jbc-ref-ob-circle", "jbc-ref-ob-label"];
  var chip = null, box = null, lastApplied = null;

  function load() { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } }
  function save(v) { try { localStorage.setItem(KEY, v ? "on" : "off"); } catch (e) {} }
  window.JBC_PLACE_DOTS_ON = load();

  function mapObj() { try { return window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); } catch (e) { return null; } }
  function apply(m) {
    if (!m || !m.getStyle || !m.getStyle()) return;
    var want = window.JBC_PLACE_DOTS_ON ? "visible" : "none";
    LAYERS.forEach(function (id) {
      try { if (m.getLayer(id) && m.getLayoutProperty(id, "visibility") !== want) m.setLayoutProperty(id, "visibility", want); } catch (e) {}
    });
  }
  function paintControls() {
    var on = window.JBC_PLACE_DOTS_ON;
    if (chip) { chip.setAttribute("aria-pressed", String(on)); chip.classList.toggle("is-off", !on); chip.querySelector("b").textContent = on ? "켜짐" : "꺼짐"; }
    if (box) box.checked = on;
  }
  function set(v) { window.JBC_PLACE_DOTS_ON = !!v; save(!!v); paintControls(); apply(mapObj()); }

  function ensureChip(m) {
    var host = m.getContainer().parentElement || m.getContainer();
    if (!chip) {
      chip = document.createElement("button"); chip.type = "button"; chip.id = "jbc-dots-chip"; chip.title = "지도의 지명 점 켜기/끄기";
      chip.innerHTML = '<i aria-hidden="true"></i>지명 점 <b></b>';
      chip.onclick = function () { set(!window.JBC_PLACE_DOTS_ON); };
    }
    if (chip.parentElement !== host) host.appendChild(chip);
    paintControls();
  }
  function ensureSettings() {
    var grp = document.querySelector('[data-set-group="names"]'); if (!grp || grp.querySelector("[data-jbc-dots]")) return;
    var lab = document.createElement("label"); lab.setAttribute("data-jbc-dots", "1");
    lab.innerHTML = '<span>지명 점 표시 (등록 지명·참고 지명)</span><input type="checkbox">';
    box = lab.querySelector("input"); box.checked = window.JBC_PLACE_DOTS_ON;
    box.onchange = function () { set(box.checked); };
    var first = grp.querySelector("label"); grp.insertBefore(lab, first ? first : null);
  }

  setInterval(function () { var mb = document.getElementById("map-body"), r = mb && mb.getBoundingClientRect(); if (!r || r.width < 1 || r.height < 1) return; var m = mapObj(); if (m) { ensureChip(m); apply(m); } ensureSettings(); }, 600);
})();
