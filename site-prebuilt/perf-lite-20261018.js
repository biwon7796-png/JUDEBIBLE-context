/* Opt-in "lite" rendering for slow phones: ?perf=lite turns it on (remembered on this device), ?perf=off turns it off.
   Nothing changes unless the flag is set. See perf-lite-20261018.css for what it switches off. */
(function () {
  "use strict";
  try {
    var m = /[?&]perf=(lite|off)(?:&|$)/.exec(location.search);
    if (m) { if (m[1] === "lite") localStorage.setItem("jbc.perf", "lite"); else localStorage.removeItem("jbc.perf"); }
    var on = m ? m[1] === "lite" : localStorage.getItem("jbc.perf") === "lite";
    if (!on) return;
    document.documentElement.setAttribute("data-perf", "lite");
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "perf-lite-20261018.css?v=3"; document.head.appendChild(l);
  } catch (e) {}
})();

/* ?dbg=1 shows a small on-screen scroll monitor (remembered on this device; ?dbg=0 hides it).
   For diagnosing phones where scrolling stalls. It only observes; it never changes behaviour. */
(function () {
  "use strict";
  try {
    var m = /[?&]dbg=(0|1)(?:&|$)/.exec(location.search);
    if (m) { if (m[1] === "1") localStorage.setItem("jbc.dbg", "1"); else localStorage.removeItem("jbc.dbg"); }
    if (!(m ? m[1] === "1" : localStorage.getItem("jbc.dbg") === "1")) return;
    var c = { shellScroll: 0, winScroll: 0, vvResize: 0, resize: 0, tStart: 0, tMove: 0, tMovePrevented: 0, mut: 0, longMs: 0 }, t0 = Date.now();
    window.addEventListener("touchstart", function () { c.tStart++; }, { passive: true, capture: true });
    window.addEventListener("touchmove", function (e) { c.tMove++; if (e.defaultPrevented) c.tMovePrevented++; }, { passive: true });
    window.addEventListener("scroll", function () { c.winScroll++; }, { passive: true });
    document.addEventListener("scroll", function (e) { if (e.target && e.target.classList && e.target.classList.contains("sw-shell")) c.shellScroll++; }, { passive: true, capture: true });
    window.addEventListener("resize", function () { c.resize++; });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", function () { c.vvResize++; });
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { c.longMs = Math.max(c.longMs, Math.round(e.duration)); }); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
    document.addEventListener("DOMContentLoaded", function () {
      new MutationObserver(function (l) { c.mut += l.length; }).observe(document.body, { childList: true, subtree: true });
      var box = document.createElement("pre");
      box.style.cssText = "position:fixed;left:4px;bottom:84px;z-index:99999;margin:0;padding:4px 6px;font:10px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.78);pointer-events:none;max-width:70vw;white-space:pre-wrap";
      document.body.appendChild(box);
      setInterval(function () {
        var sh = document.querySelector(".sw-shell"), vv = window.visualViewport, d = document.documentElement;
        box.textContent = "t=" + Math.round((Date.now() - t0) / 1000) + "s view=" + document.body.dataset.view + "\n" +
          "shell top/h/ch=" + (sh ? Math.round(sh.scrollTop) + "/" + sh.scrollHeight + "/" + sh.clientHeight : "-") + " scrolls=" + c.shellScroll + "\n" +
          "win y=" + Math.round(window.scrollY) + " scrolls=" + c.winScroll + " docH=" + d.scrollHeight + "\n" +
          "innerH=" + innerHeight + " vvH=" + (vv ? Math.round(vv.height) : "-") + " resize=" + c.resize + " vv=" + c.vvResize + "\n" +
          "touch s/m/prevented=" + c.tStart + "/" + c.tMove + "/" + c.tMovePrevented + "\n" +
          "dom mut=" + c.mut + " longtask max=" + c.longMs + "ms\n" +
          "ovf html/body=" + getComputedStyle(d).overflowY + "/" + getComputedStyle(document.body).overflowY;
      }, 500);
    });
  } catch (e) {}
})();
