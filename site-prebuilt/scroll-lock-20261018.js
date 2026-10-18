/* Desktop (>=1100px) locks the page to the viewport (html/body overflow:hidden), which hides the scrollbar.
   Programmatic scrolling (focus, scrollIntoView, #hash) can still push the whole page up, exposing the
   source/footer area with no way back except a hard refresh. Keep the locked page pinned to the top. */
(function () {
  "use strict";
  var raf = 0;
  function locked() {
    if (window.innerWidth < 1100) return false;   // desktop-only lock; phones/tablets scroll normally (and lite mode locks the page on purpose)
    try { return getComputedStyle(document.body).overflowY === "hidden" && getComputedStyle(document.documentElement).overflowY === "hidden"; } catch (e) { return false; }
  }
  function pin() {
    raf = 0;
    if (!locked()) return;
    var se = document.scrollingElement || document.documentElement;
    if (se.scrollTop || se.scrollLeft || window.scrollY || window.scrollX) window.scrollTo(0, 0);
    if (document.body.scrollTop || document.body.scrollLeft) { document.body.scrollTop = 0; document.body.scrollLeft = 0; }
  }
  function queue() { if (!raf) raf = requestAnimationFrame(pin); }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  window.addEventListener("hashchange", queue);
  queue();
})();
