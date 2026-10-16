/* PROTOTYPE (local only): keeps the twisted cord seamless across the pieces of one selected group
   (selected verses + the original-language block). Each piece restarts its own background, so this sets
   --rope-y per piece so the repeating tile continues where the previous piece ended. Not part of the public bundle. */
(function () {
  var TILE = 34, CAP = 68;
  function sync() {
    var box = document.getElementById("verses"); if (!box) return;
    var groupTop = null, kids = box.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.matches(".verse.sel, .ol-body")) {
        if (groupTop === null) groupTop = el.offsetTop;
        var rel = el.offsetTop - groupTop, y = (((CAP - rel) % TILE) + TILE) % TILE;
        var v = y + "px"; if (el.style.getPropertyValue("--rope-y") !== v) el.style.setProperty("--rope-y", v);
      } else groupTop = null;
    }
  }
  var raf = 0; function later() { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }
  function start() {
    var box = document.getElementById("verses"); if (!box) return setTimeout(start, 300);
    new MutationObserver(later).observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "data-state"] });
    if (window.ResizeObserver) new ResizeObserver(later).observe(box);
    window.addEventListener("resize", later); later();
    setInterval(sync, 300);   // layout also shifts when the original-language text loads or a card opens (no DOM mutation fires for that)
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
