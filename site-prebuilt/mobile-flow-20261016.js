/* JudeBible mobile one-flow: bottom tab bar that switches the single visible panel (see mobile-flow-20261016.css). */
(function () {
  var mq = window.matchMedia("(max-width:760px)");
  var body = document.body, bar = document.createElement("nav");
  bar.id = "m-flow-tabs"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "화면 전환");
  body.appendChild(bar);
  var tab = "main", lastView = "", lastSig = "";

  function view() { return body.dataset.view || "study"; }
  function ctx() { return body.dataset.detailContext || "passage"; }
  function mainKey() { return view() === "study" ? "text" : "main"; }
  function tabsFor() {
    var v = view(), detail = ctx() === "entity" ? "장소·인물" : (v === "study" ? "본문연구" : "상세");
    if (v === "study") return [["text", "본문"], ["detail", detail], ["guide", "주제탐색"], ["map", "지도"]];
    return [["main", v === "timeline" ? "연표" : "검색"], ["detail", detail]];
  }
  function panelSig() { var p = document.getElementById("panel"); return p ? p.textContent.length + ":" + p.textContent.slice(0, 80) : ""; }
  function refreshMap() { try { var m = window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); if (m && m.resize) { m.resize(); } } catch (e) {} }

  function setTab(next) {
    tab = next; body.dataset.mtab = next; draw();
    if (next === "detail" && window.BVC && BVC.setPanel && body.dataset.panel !== "open") BVC.setPanel("open");
    if (next === "map") { setTimeout(refreshMap, 60); setTimeout(refreshMap, 400); }
    window.scrollTo(0, 0);
  }
  function draw() {
    var list = tabsFor(), sig = list.map(function (t) { return t[0] + t[1]; }).join("|") + "|" + tab;
    if (sig === lastSig) return; lastSig = sig; bar.textContent = "";
    list.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(t[0] === tab)); b.textContent = t[1]; b.dataset.mt = t[0];
      b.onclick = function () { setTab(t[0]); }; bar.appendChild(b);
    });
  }
  function sync() {
    if (!mq.matches) { delete body.dataset.mflow; delete body.dataset.mtab; bar.textContent = ""; lastSig = ""; return; }
    body.dataset.mflow = "1";
    var v = view();
    if (v !== lastView) { lastView = v; tab = mainKey(); }
    // a collapsed panel can't be the visible tab; a tab that no longer exists falls back to the main one
    if (tab === "detail" && body.dataset.panel !== "open") tab = mainKey();
    if (!tabsFor().some(function (t) { return t[0] === tab; })) tab = mainKey();
    body.dataset.mtab = tab; draw();
  }

  // opening a place / person / passage detail from a card or a button moves to the detail tab
  document.addEventListener("click", function (ev) {
    if (!mq.matches || ev.target.closest("#m-flow-tabs")) return;
    var before = panelSig(), v = view();
    if (v === "study" && ctx() !== "entity" && !ev.target.closest("#guide-pane,#map-pane")) { /* verse clicks keep the text visible */ }
    setTimeout(function () {
      if (body.dataset.panel !== "open" || tab === "detail") return;
      var changed = panelSig() !== before;
      var fromCard = !!ev.target.closest("#search-workspace,#topic-board,#timeline-pane,#guide-pane,#map-pane");
      var entity = ctx() === "entity";
      if (changed && (fromCard || entity) && (v !== "study" || entity || fromCard)) setTab("detail");
    }, 220);
  }, true);

  new MutationObserver(function () { requestAnimationFrame(sync); }).observe(body, { attributes: true, attributeFilter: ["data-view", "data-panel", "data-detail-context"] });
  document.addEventListener("bvc:rendered", sync);
  window.addEventListener("hashchange", function () { setTimeout(sync, 60); });
  (mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync));
  sync();
})();
