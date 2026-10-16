/* Timeline card photos: the source/licence tooltip appears only on the small ⓘ mark (top-right of each photo), not on the whole photo.
   The app's own tooltip code (hover/touch on the <img>) stays untouched; this file filters the events it receives. */
(function () {
  var CARD = ".tl-era-card, .tl-event-card";
  var inZone = false, zoneImg = null;

  function cardOf(t) { return t && t.closest ? t.closest(CARD) : null; }
  function creditImg(card) { return card ? card.querySelector("img[data-tl-photo-credit]") : null; }
  function overInfo(card, x, y, r) {
    var b = card.getBoundingClientRect(), cx = b.right - 10 - 8, cy = b.top + 10 + 8;   // centre of the ⓘ drawn by the card's ::after
    return Math.abs(x - cx) <= r && Math.abs(y - cy) <= r;
  }

  // 1) mouse: swallow the real mouseover on the photo; show the tooltip only while the pointer is over the ⓘ
  window.addEventListener("mouseover", function (e) {
    if (!e.isTrusted) return;
    var img = e.target.closest && e.target.closest("img[data-tl-photo-credit]");
    if (img && cardOf(img)) e.stopImmediatePropagation();
  }, true);
  window.addEventListener("mousemove", function (e) {
    if (!e.isTrusted) return;
    var card = cardOf(e.target), img = creditImg(card), on = !!(img && overInfo(card, e.clientX, e.clientY, 14));
    if (on && !inZone) { inZone = true; zoneImg = img; img.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY })); }
    else if (!on && inZone) { var was = zoneImg; inZone = false; zoneImg = null; if (was) was.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, cancelable: true })); }
    else if (on && img !== zoneImg) { zoneImg = img; }
  }, true);

  // 2) touch / pen: a tap on the photo selects the card as usual; only a tap on the ⓘ opens the tooltip
  window.addEventListener("pointerdown", function (e) {
    if (!e.isTrusted || (e.pointerType !== "touch" && e.pointerType !== "pen")) return;
    var img = e.target.closest && e.target.closest("img[data-tl-photo-credit]"), card = cardOf(img);
    if (img && card && !overInfo(card, e.clientX, e.clientY, 22)) e.stopImmediatePropagation();
  }, true);
})();
