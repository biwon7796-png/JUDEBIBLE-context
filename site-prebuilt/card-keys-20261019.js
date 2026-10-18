/* Card keys: after a card is clicked (search results, timeline events, journey / topic steps) the arrow keys and Space move the selection to
   the neighbouring card instead of scrolling the page.
     → ↓ Space  next card      ← ↑ Shift+Space  previous card      Home / End  first / last
   In the search-result grid ↑ ↓ move to the card above / below. Works only while focus is on a card button, so typing and the
   chapter keys in keyboard-20261018.js are untouched. */
(function () {
  "use strict";
  var CTX = [
    { sel: ".sr-row.ee-primary", scope: "#search-results", key: function (b) { return b.getAttribute("data-stable-id") || b.getAttribute("data-id") || b.getAttribute("data-levelb-open") || b.getAttribute("data-atlas90-open"); }, grid: true, kind: "search" },
    { sel: ".tl-event-card[data-tl-step]", scope: "#tl-body", key: function (b) { return b.getAttribute("data-tl-step"); }, kind: "timeline" },
    { sel: ".jn-step-btn[data-nav-step]", scope: "#side-pane, #guide-pane, body", key: function (b) { return b.getAttribute("data-nav-step"); }, kind: "nav" }
  ];
  function visible(el) { return !!(el.offsetParent || el.getClientRects().length) && !el.disabled; }
  function ctxOf(t) {
    if (!t || !t.closest) return null;
    for (var i = 0; i < CTX.length; i++) { var b = t.closest(CTX[i].sel); if (b) return { c: CTX[i], btn: b }; }
    return null;
  }
  function list(c, btn) {
    var root = btn.closest(c.scope) || document;
    if (c.kind === "nav") root = btn.closest("ol, ul") || root;
    return [].slice.call(root.querySelectorAll(c.sel)).filter(visible);
  }
  function scroller(el) {
    for (var p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      var oy = getComputedStyle(p).overflowY;
      if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return null;
  }
  // move only the container that scrolls (scrollIntoView would also push the whole page)
  function reveal(el) {
    var sc = scroller(el), r = el.getBoundingClientRect();
    if (sc) {
      var s = sc.getBoundingClientRect(), pad = 12;
      if (r.top < s.top + pad) sc.scrollTop -= s.top + pad - r.top; else if (r.bottom > s.bottom - pad) sc.scrollTop += r.bottom - (s.bottom - pad);
    } else {
      var lock = getComputedStyle(document.body).overflowY === "hidden" && getComputedStyle(document.documentElement).overflowY === "hidden";
      if (!lock) { if (r.top < 70) window.scrollBy(0, r.top - 90); else if (r.bottom > innerHeight - 20) window.scrollBy(0, r.bottom - innerHeight + 90); }
    }
  }
  function vertical(items, cur, dir) {   // grid: nearest card in the row above/below, same column
    var cr = cur.getBoundingClientRect(), best = null, bestD = 1e9;
    items.forEach(function (b) {
      if (b === cur) return; var r = b.getBoundingClientRect();
      if (dir > 0 ? r.top <= cr.top + 4 : r.top >= cr.top - 4) return;
      var dy = Math.abs(r.top - cr.top), dx = Math.abs(r.left - cr.left), d = dy * 4 + dx;
      if (d < bestD) { bestD = d; best = b; }
    });
    return best;
  }
  function pick(c, key, tries, noReveal) {
    var all = [].slice.call(document.querySelectorAll(c.sel)).filter(visible), i, f = null;
    for (i = 0; i < all.length; i++) if (c.key(all[i]) === key) { f = all[i]; break; }
    if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } if (!noReveal) reveal(f); }
    else if (tries > 0) setTimeout(function () { pick(c, key, tries - 1, noReveal); }, 80);
  }
  function go(c, target) {
    var key = c.key(target);
    target.click();
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    reveal(target);
    if (key != null) setTimeout(function () { pick(c, key, 3); }, 60);   // the list may be re-rendered by the click; keep focus on the same card
  }
  // A mouse click re-renders the list (timeline, search), which drops focus to <body>; put it back on the clicked card so the keys work right away.
  document.addEventListener("click", function (e) {
    if (e.detail === 0) return;   // keyboard / scripted clicks are handled in go()
    var hit = ctxOf(e.target); if (!hit) return;
    var key = hit.c.key(hit.btn); if (key == null) return;
    setTimeout(function () { var a = document.activeElement; if (!a || a === document.body || !a.isConnected || !ctxOf(a)) pick(hit.c, key, 4, true); }, 90);
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, isSpace = k === " " || k === "Spacebar";
    if (!isSpace && ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].indexOf(k) < 0) return;
    var hit = ctxOf(e.target); if (!hit) return;
    var lb = document.getElementById("media-lightbox"); if (lb && !lb.hidden) return;
    var c = hit.c, items = list(c, hit.btn), i = items.indexOf(hit.btn); if (i < 0) return;
    var next = null, fwd = k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || (isSpace && !e.shiftKey), more = null;
    if (k === "Home") next = items[0]; else if (k === "End") next = items[items.length - 1];
    else if (c.grid && (k === "ArrowDown" || k === "ArrowUp")) next = vertical(items, hit.btn, k === "ArrowDown" ? 1 : -1) || (k === "ArrowDown" ? items[i + 1] : items[i - 1]);
    else next = fwd ? items[i + 1] : items[i - 1];
    e.preventDefault(); e.stopPropagation();
    if (next) { if (next !== hit.btn) go(c, next); return; }
    if (c.kind === "search" && fwd) {   // end of the loaded cards: load the next batch, then continue
      more = hit.btn.closest("[data-sw-sec]") && hit.btn.closest("[data-sw-sec]").querySelector("[data-sw-ent-more]");
      if (more) { more.click(); setTimeout(function () { var n = list(c, hit.btn.isConnected ? hit.btn : document.querySelector(c.sel)), j = n.indexOf(hit.btn); if (j >= 0 && n[j + 1]) go(c, n[j + 1]); }, 120); }
    } else if (c.kind === "timeline") {   // event cards are paged: turn the page, then take the first / last card
      var pg = document.querySelector('#tl-body [data-tl-page="' + (fwd ? 1 : -1) + '"]');
      if (pg && !pg.disabled) { pg.click(); setTimeout(function () { var n = [].slice.call(document.querySelectorAll(c.sel)).filter(visible); var t = fwd ? n[0] : n[n.length - 1]; if (t) go(c, t); }, 120); }
    }
  }, true);
})();
