/* Search page: (1) every selected result card gets the same selected look, (2) the "본문보기" button above the place detail opens the study page. */
(function () {
  var selectedId = null;

  function results() { return document.getElementById("search-results"); }
  function cardOf(el) { return el && el.closest && el.closest("#search-results article.ee-card"); }

  // --- 1. same selected colour for every card kind (the app only marks cards of registered places) ---
  function paint() {
    var box = results(); if (!box) return;
    var cards = box.querySelectorAll("article.ee-card");
    for (var i = 0; i < cards.length; i++) {
      if (!selectedId) continue;
      var on = cards[i].dataset.entityId === selectedId;
      // exactly one selected card: also clears the app's own marker left on a previously opened (registered) place
      if (on) { if (!cards[i].classList.contains("is-selected")) cards[i].classList.add("is-selected"); }
      else if (cards[i].classList.contains("is-selected")) cards[i].classList.remove("is-selected");
    }
  }
  document.addEventListener("click", function (ev) {
    var c = cardOf(ev.target); if (!c) return;
    if (ev.target.closest("a[href]")) return;
    selectedId = c.dataset.entityId || null; paint(); setTimeout(paint, 60); setTimeout(paint, 300);
  }, true);
  var mo = null;
  function watch() {
    var box = results(); if (!box) return setTimeout(watch, 400);
    if (mo) mo.disconnect();
    mo = new MutationObserver(function () { paint(); });
    mo.observe(box, { childList: true, subtree: true });
  }
  watch();
  document.addEventListener("bvc:rendered", function () { watch(); paint(); });


  var BOOK = {
    gen: "gen", exod: "exo", ex: "exo", lev: "lev", num: "num", deut: "deu", josh: "jos", judg: "jdg", ruth: "rut",
    "1 sam": "1sa", "2 sam": "2sa", "1 kgs": "1ki", "2 kgs": "2ki", "1 kings": "1ki", "2 kings": "2ki", "1 chr": "1ch", "2 chr": "2ch",
    ezra: "ezr", neh: "neh", esth: "est", job: "job", ps: "psa", prov: "pro", eccl: "ecc", song: "sng", isa: "isa", jer: "jer", lam: "lam",
    ezek: "ezk", dan: "dan", hos: "hos", joel: "jol", amos: "amo", obad: "oba", jonah: "jon", mic: "mic", nah: "nam", hab: "hab",
    zeph: "zep", hag: "hag", zech: "zec", mal: "mal",
    matt: "mat", mark: "mrk", luke: "luk", john: "jhn", acts: "act", rom: "rom", "1 cor": "1co", "2 cor": "2co", gal: "gal", eph: "eph",
    phil: "php", col: "col", "1 thess": "1th", "2 thess": "2th", "1 tim": "1ti", "2 tim": "2ti", titus: "tit", phlm: "phm", heb: "heb",
    jas: "jas", "1 pet": "1pe", "2 pet": "2pe", "1 john": "1jn", "2 john": "2jn", "3 john": "3jn", jude: "jud", rev: "rev"
  };
  function firstPassageId(text) {
    var re = /((?:[1-3]\s)?[A-Z][a-z]+)\.?\s(\d+):(\d+)/g, m;
    while ((m = re.exec(text))) {
      var id = BOOK[m[1].toLowerCase()];
      if (id) return id + "-" + m[2] + ":" + m[3];
    }
    return null;
  }
  // --- 2. "본문보기" above the detail panel: open the selected place's passage in the study page ---
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("#side-pane .entity-top-action-button");
    if (!btn || btn.textContent.trim() !== "본문보기") return;
    // note: the app keeps the previously opened place on this button (data-deep-place), so the selected card decides
    var card = null;
    if (selectedId) { var all = document.querySelectorAll("#search-results article.ee-card"); for (var i = 0; i < all.length; i++) if (all[i].dataset.entityId === selectedId) { card = all[i]; break; } }
    var row = card && card.querySelector("[data-levelb-search], [data-atlas90-search], [data-search], [data-place-open]");
    if (!row) return;
    ev.preventDefault(); ev.stopPropagation();
    // Level B places carry their cited verses on the card ("Acts 10:1, Acts 24:27"): open the first one in the study page
    if (row.hasAttribute("data-levelb-search")) {
      var id = firstPassageId(card.textContent);
      if (id) {
        // leave the search page and show the verse on the study page (a hash without view= is read as the study page)
        try { if (window.BVC && BVC.closeSearch) BVC.closeSearch(true); } catch (e) {}
        location.hash = "#" + id;
        setTimeout(function () {
          if (document.body.dataset.view !== "study" && window.BVC && BVC.setView) { try { BVC.setView("study"); } catch (e) {} }
          if (document.body.dataset.view !== "study") { var r = document.getElementById("rail-study"); if (r) r.click(); }
        }, 250);
        return;
      }
    }
    // other places: the same path as double-clicking the result row (opens the place's first verse in the study page)
    row.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 }));
  }, true);
})();
