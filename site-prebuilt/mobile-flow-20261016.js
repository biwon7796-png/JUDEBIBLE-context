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
  function placeMap() {
    var r = document.getElementById("rail"); if (!r) return;
    var bottom = r.getBoundingClientRect().bottom; if (bottom > 0 && bottom < 400) body.style.setProperty("--m-map-top", Math.round(bottom + 8) + "px");
  }
  function placeTop() {
    var r = document.getElementById("rail"); if (!r) return;
    var rb = r.getBoundingClientRect().bottom, h = document.querySelector("header.top"), hb = h ? h.getBoundingClientRect().bottom : 0;
    var top = Math.max(rb, hb); if (top > 0 && top < 400) body.style.setProperty("--m-top", Math.round(top + 8) + "px");
    var vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
    body.style.setProperty("--m-vh", Math.round(vh) + "px");
  }

  // shorter placeholders so both search boxes fit side by side
  function placeholders() {
    var q = document.getElementById("qs-input"), r = document.querySelector(".ref-input");
    if (q) { if (!q.dataset.ph) q.dataset.ph = q.placeholder; q.placeholder = mq.matches ? "인물·장소 검색" : q.dataset.ph; }
    if (r) { if (!r.dataset.ph) r.dataset.ph = r.placeholder; r.placeholder = mq.matches ? "본문 (창 22:2)" : r.dataset.ph; }
  }
  function refreshMap() { try { var m = window.BVC && BVC.mapRenderer && BVC.mapRenderer.map && BVC.mapRenderer.map(); if (m && m.resize) { m.resize(); } } catch (e) {} }

  function setTab(next) {
    tab = next; body.dataset.mtab = next; draw(); placeTop(); setTimeout(placeTop, 150);
    if (next === "detail" && window.BVC && BVC.setPanel && body.dataset.panel !== "open") BVC.setPanel("open");
    if (next === "map") { placeMap(); setTimeout(placeMap, 120); setTimeout(refreshMap, 60); setTimeout(refreshMap, 400); }
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
    body.dataset.mtab = tab; draw(); placeTop();
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
  window.addEventListener("resize", function () { if (tab === "map") { placeMap(); refreshMap(); } });
  window.addEventListener("resize", placeTop);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", placeTop);
  setTimeout(placeTop, 300);
  placeholders(); mq.addEventListener && mq.addEventListener("change", placeholders);
  sync();
})();
