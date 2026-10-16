/* Mobile: press and hold a verse, then slide over the following verses to select them as one continuous range.
   Uses the app's own range selection (BVC.selectVerse with mode "range"), so the selection looks the same as a shift-click range. */
(function () {
  var mq = window.matchMedia("(max-width:760px)");
  var HOLD_MS = 420, MOVE_PX = 10;
  var timer = null, active = false, suppress = false, startX = 0, startY = 0, lastN = null, scroller = null, scrollDir = 0, raf = 0;

  function verseOf(el) { var v = el && el.closest ? el.closest("#verses .verse[data-verse]") : null; return v ? +v.dataset.verse : null; }
  function scrollParent() {
    var p = document.getElementById("verses");
    while (p && p !== document.documentElement) { var s = getComputedStyle(p); if (/auto|scroll/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 4) return p; p = p.parentElement; }
    return document.scrollingElement || document.documentElement;
  }
  function select(n, mode) { try { window.BVC.selectVerse(n, mode); } catch (e) {} }
  function visualCount() { try { return (BVC.ui.vsel || []).length; } catch (e) { return 0; } }

  function begin(n) {
    active = true; lastN = n; scroller = scrollParent();
    // a fresh selection that starts at the held verse (selectVerse toggles, so clear a lone selection of the same verse first)
    try { if (BVC.state.verse === n && visualCount() <= 1) select(n); } catch (e) {}
    select(n);
    document.body.classList.add("jbc-range-select");
    if (navigator.vibrate) { try { navigator.vibrate(14); } catch (e) {} }
  }
  function stopAuto() { scrollDir = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function autoScroll() {
    if (!active || !scrollDir) { raf = 0; return; }
    if (scroller === document.scrollingElement || scroller === document.documentElement) window.scrollBy(0, scrollDir * 12); else scroller.scrollTop += scrollDir * 12;
    raf = requestAnimationFrame(autoScroll);
  }
  function finish() {
    clearTimeout(timer); timer = null; stopAuto();
    if (active) { active = false; suppress = true; setTimeout(function () { suppress = false; }, 450); }
    document.body.classList.remove("jbc-range-select");
  }

  document.addEventListener("touchstart", function (ev) {
    if (!mq.matches || ev.touches.length !== 1) return;
    var n = verseOf(ev.target); if (n == null) return;
    var t = ev.touches[0]; startX = t.clientX; startY = t.clientY;
    // the app re-renders the verses on every selection change, which detaches this node; its own listeners still fire
    var node = ev.target;
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd, { passive: true });
    node.addEventListener("touchcancel", onEnd, { passive: true });
    node.__jbcLp = true;
    clearTimeout(timer); timer = setTimeout(function () { begin(n); }, HOLD_MS);
  }, { passive: true, capture: true });

  function onMove(ev) {
    var t = ev.touches[0]; if (!t) return;
    if (!active) { if (Math.hypot(t.clientX - startX, t.clientY - startY) > MOVE_PX) { clearTimeout(timer); timer = null; } return; }
    ev.preventDefault();
    var el = document.elementFromPoint(t.clientX, t.clientY), n = verseOf(el);
    if (n != null && n !== lastN) { lastN = n; select(n, "range"); }
    var r = scroller && scroller.getBoundingClientRect ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    var top = Math.max(r.top, 0), bottom = Math.min(r.bottom, window.innerHeight - 80);
    scrollDir = t.clientY < top + 70 ? -1 : (t.clientY > bottom - 70 ? 1 : 0);
    if (scrollDir && !raf) raf = requestAnimationFrame(autoScroll);
    if (!scrollDir) stopAuto();
  }
  function onEnd(ev) {
    var node = ev.currentTarget; node.removeEventListener("touchmove", onMove); node.removeEventListener("touchend", onEnd); node.removeEventListener("touchcancel", onEnd);
    finish();
  }

  // no browser text-selection menu on a long press inside the verses
  document.addEventListener("contextmenu", function (ev) { if (mq.matches && verseOf(ev.target) != null) ev.preventDefault(); }, true);
  // the tap that ends a long press must not toggle the verse again
  document.addEventListener("click", function (ev) { if (suppress) { ev.preventDefault(); ev.stopPropagation(); } }, true);
})();
