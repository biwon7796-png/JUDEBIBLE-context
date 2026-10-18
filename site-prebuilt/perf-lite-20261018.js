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
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "perf-lite-20261018.css?v=2"; document.head.appendChild(l);
  } catch (e) {}
})();
