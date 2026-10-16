/* Clicking a verse makes the "본문연구" edge tab (left of the map) grow slightly and return, as a hint that research is available there. */
(function () {
  document.addEventListener("click", function (e) {
    if (!(e.target.closest && e.target.closest("#verses [data-verse]"))) return;
    setTimeout(function () {
      var tag = document.querySelector(".jb-research-edge-open"); if (!tag || tag.hidden || tag.offsetParent === null) return;
      tag.classList.remove("jbc-pop"); void tag.offsetWidth; tag.classList.add("jbc-pop");
      tag.addEventListener("animationend", function done() { tag.classList.remove("jbc-pop"); tag.removeEventListener("animationend", done); });
    }, 60);
  }, false);
})();
