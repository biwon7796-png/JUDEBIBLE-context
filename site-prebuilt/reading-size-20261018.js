/* Reading size button ("가"): cycles scripture text size 0 -> 1 -> 2 -> 0 and remembers it on this device.
   The style rules live in reading-size-20261018.css and only apply while <html data-reading="1|2"> is set. */
(function () {
  "use strict";
  var KEY = "jbc.reading.size.v1", NAMES = ["기본", "크게", "아주 크게"], LABELS = ["가", "가+", "가++"];
  var level = 0;
  try { level = Math.max(0, Math.min(2, parseInt(localStorage.getItem(KEY), 10) || 0)); } catch (e) {}
  var root = document.documentElement;
  function apply() { if (level) root.setAttribute("data-reading", String(level)); else root.removeAttribute("data-reading"); }
  apply();   // before first paint, so there is no flash of the old size

  function build() {
    var head = document.querySelector("#text-pane .pane-head"), anchor = document.getElementById("ol-toggle");
    if (!head || !anchor || document.getElementById("reading-size")) return;
    var b = document.createElement("button");
    b.type = "button"; b.id = "reading-size"; b.className = "btn ghost";
    function paint() {
      b.textContent = LABELS[level];
      b.setAttribute("aria-label", "본문 글자 크기: " + NAMES[level] + " (누르면 " + NAMES[(level + 1) % 3] + ")");
      b.title = "본문 글자 크기: " + NAMES[level];
    }
    b.addEventListener("click", function () {
      // keep the verse at the top of the screen in place while the text reflows
      var keep = null, vs = document.querySelectorAll("#verses .verse"), i;
      for (i = 0; i < vs.length; i++) { var r = vs[i].getBoundingClientRect(); if (r.bottom > 80) { keep = vs[i]; break; } }
      level = (level + 1) % 3; apply(); paint();
      try { localStorage.setItem(KEY, String(level)); } catch (e) {}
      if (keep && keep.isConnected) { try { keep.scrollIntoView({ block: "start" }); } catch (e) {} }
    });
    paint();
    head.insertBefore(b, anchor);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
