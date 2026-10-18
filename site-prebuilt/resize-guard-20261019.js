/* Resize guard. Some phone browsers (the KakaoTalk in-app browser was measured at ~4.5 resize events per second while scrolling)
   fire `resize` over and over. The app answers every one by re-measuring the page, rewriting header/panel buttons and
   restoring the scroll anchor, which fights the finger while the search list is being scrolled.
   This runs before the app's own listeners and
     1. drops real resize events when the window size did not actually change,
     2. holds back height-only changes while a finger is down (and for 0.7s after), replaying a single resize afterwards.
   Script-made (untrusted) resize events and genuine size changes pass through untouched, so desktop behaviour is unchanged. */
(function () {
  "use strict";
  var w = window.innerWidth, h = window.innerHeight, touching = false, quietUntil = 0, pending = false, timer = 0;
  var vv = window.visualViewport, vw = vv ? Math.round(vv.width) : 0, vh = vv ? Math.round(vv.height) : 0;

  function begin() { touching = true; }
  function end() { touching = false; quietUntil = Date.now() + 700; clearTimeout(timer); timer = setTimeout(replay, 760); }
  function replay() {
    if (!pending || touching) return;
    pending = false;
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
  }
  window.addEventListener("touchstart", begin, { passive: true, capture: true });
  window.addEventListener("touchend", end, { passive: true, capture: true });
  window.addEventListener("touchcancel", end, { passive: true, capture: true });

  window.addEventListener("resize", function (e) {
    if (!e.isTrusted) return;   // replayed / script-made: let it through
    var nw = window.innerWidth, nh = window.innerHeight;
    if (nw === w && nh === h) { e.stopImmediatePropagation(); return; }   // nothing changed
    if (nw === w && (touching || Date.now() < quietUntil)) { pending = true; e.stopImmediatePropagation(); return; }   // toolbar sliding under a finger
    w = nw; h = nh;
  }, true);

  if (vv) vv.addEventListener("resize", function (e) {
    if (!e.isTrusted) return;
    var nw = Math.round(vv.width), nh = Math.round(vv.height);
    if (nw === vw && nh === vh) { e.stopImmediatePropagation(); return; }
    if (nw === vw && (touching || Date.now() < quietUntil)) { pending = true; e.stopImmediatePropagation(); return; }
    vw = nw; vh = nh;
  }, true);
})();
