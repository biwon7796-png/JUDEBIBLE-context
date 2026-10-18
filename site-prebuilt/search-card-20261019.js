/* Photo-credit "!" toggle on search cards. */
(function () {
  "use strict";
  function closeAll(except) {
    var open = document.querySelectorAll(".pc-credit-wrap.is-open"), i;
    for (i = 0; i < open.length; i++) if (open[i] !== except) { open[i].classList.remove("is-open"); var b = open[i].querySelector(".pc-credit-i"); if (b) b.setAttribute("aria-expanded", "false"); }
  }
  document.addEventListener("click", function (e) {
    var t = e.target, btn = t && t.closest && t.closest(".pc-credit-i");
    if (btn) {
      e.preventDefault(); e.stopPropagation();
      var wrap = btn.parentNode, on = !wrap.classList.contains("is-open");
      closeAll(wrap); wrap.classList.toggle("is-open", on); btn.setAttribute("aria-expanded", on ? "true" : "false");
      return;
    }
    if (!(t && t.closest && t.closest(".pc-credit-wrap"))) closeAll(null);
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(null); });
})();
