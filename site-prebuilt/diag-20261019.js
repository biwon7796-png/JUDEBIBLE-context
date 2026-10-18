/* Observe-only scroll diagnostic. Active ONLY on the page load whose URL contains ?dbg=1 (nothing is stored, nothing is changed).
   Shows, bottom-left: where the last touch landed, touch/pointer cancels, which parts of the page keep changing (DOM mutation
   sources), scroll positions, and focus. Purpose: find what stops scrolling on the search page of the KakaoTalk in-app browser. */
(function () {
  "use strict";
  if (!/[?&]dbg=1(?:&|$)/.test(location.search)) return;
  var c = { ts: 0, tm: 0, te: 0, tc: 0, pc: 0, shell: 0, win: 0, rs: 0 }, last = "-", src = {}, t0 = Date.now(), lastTouchY = 0, moved = 0;
  function path(e) {
    var p = [], x = e, i;
    for (i = 0; i < 4 && x && x.nodeType === 1 && x !== document.body; i++) {
      p.unshift(x.tagName.toLowerCase() + (x.id ? "#" + x.id : "") + (typeof x.className === "string" && x.className ? "." + x.className.trim().split(/\s+/)[0] : ""));
      x = x.parentElement;
    }
    return p.join(">");
  }
  window.addEventListener("touchstart", function (e) { c.ts++; last = path(e.target); }, { passive: true, capture: true });
  window.addEventListener("touchmove", function (e) { c.tm++; var t = e.touches && e.touches[0]; if (t) { moved = Math.abs(t.clientY - lastTouchY); lastTouchY = t.clientY; } }, { passive: true, capture: true });
  window.addEventListener("touchend", function () { c.te++; }, { passive: true, capture: true });
  window.addEventListener("touchcancel", function () { c.tc++; }, { passive: true, capture: true });
  window.addEventListener("pointercancel", function () { c.pc++; }, { passive: true, capture: true });
  window.addEventListener("scroll", function () { c.win++; }, { passive: true });
  document.addEventListener("scroll", function (e) { if (e.target && e.target.classList && e.target.classList.contains("sw-shell")) c.shell++; }, { passive: true, capture: true });
  window.addEventListener("resize", function () { c.rs++; });
  document.addEventListener("DOMContentLoaded", function () {
    var box = document.createElement("pre");
    box.style.cssText = "position:fixed;left:4px;bottom:84px;z-index:99999;margin:0;padding:4px 6px;font:10px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.82);pointer-events:none;max-width:92vw;white-space:pre-wrap;word-break:break-all";
    document.body.appendChild(box);
    new MutationObserver(function (list) {
      list.forEach(function (m) { if (m.target === box || box.contains(m.target)) return; var k = path(m.target.nodeType === 1 ? m.target : m.target.parentElement); src[k] = (src[k] || 0) + 1; });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "hidden", "data-view", "data-panel", "data-mtab"] });
    setInterval(function () {
      var sh = document.querySelector(".sw-shell"), vv = window.visualViewport, a = document.activeElement;
      var top = Object.keys(src).sort(function (x, y) { return src[y] - src[x]; }).slice(0, 3).map(function (k) { return src[k] + "x " + k; }).join("\n  ");
      box.textContent = "t=" + Math.round((Date.now() - t0) / 1000) + "s " + document.body.dataset.view + "/" + (document.body.dataset.mtab || "-") + " ua=" + (/KAKAOTALK/i.test(navigator.userAgent) ? "kakao" : "other") + "\n" +
        "shell y/h/ch=" + (sh ? Math.round(sh.scrollTop) + "/" + sh.scrollHeight + "/" + sh.clientHeight : "-") + " scrolls=" + c.shell + " | win y=" + Math.round(window.scrollY) + " scrolls=" + c.win + "\n" +
        "touch start/move/end/CANCEL=" + c.ts + "/" + c.tm + "/" + c.te + "/" + c.tc + " ptrCancel=" + c.pc + " lastMoveDy=" + Math.round(moved) + "\n" +
        "lastTouch: " + last + "\n" +
        "focus: " + path(a) + " | vv=" + (vv ? Math.round(vv.height) : "-") + " inner=" + innerHeight + " resize=" + c.rs + "\n" +
        "DOM changes by source:\n  " + (top || "-");
    }, 500);
  });
})();
