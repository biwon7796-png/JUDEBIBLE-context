/* 정경적 연결 reference buttons: open the verses inline, below the row. Does not change the passage or the commentary panel. */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function html(b, c, v1, v2) {
    var bs = window.BVC_KRV && window.BVC_KRV.books, bk = bs && bs.filter(function (x) { return x.id === b; })[0], ch = bk && bk.chapters[c - 1], out = "", v;
    if (!ch) return "";
    v2 = Math.min(Math.max(v2, v1), ch.length);
    for (v = v1; v <= v2; v++) out += "<p><sup>" + v + "</sup>" + esc(ch[v - 1] || "") + "</p>";
    return out;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".rp-canonical-ref"); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    var row = btn.closest(".rp-canonical-row"), m = /^([a-z0-9]+)-(\d+):(\d+)-(\d+)$/.exec(btn.getAttribute("data-open-range") || ""); if (!row || !m) return;
    var old = row.querySelector(".rp-canonical-open"), same = old && old.getAttribute("data-range") === btn.getAttribute("data-open-range");
    if (old) { old.remove(); [].forEach.call(row.querySelectorAll(".rp-canonical-ref"), function (b) { b.setAttribute("aria-expanded", "false"); }); if (same) return; }
    var KL = window.JBC_KRV_LAZY;
    if (KL && !KL.loaded(m[1])) { KL.ensure([m[1]]).then(function (ok) { if (ok) btn.click(); }); return; }
    var body = html(m[1], +m[2], +m[3], +m[4]); if (!body) return;
    var box = document.createElement("div"); box.className = "rp-canonical-open"; box.setAttribute("data-range", btn.getAttribute("data-open-range")); box.innerHTML = body;
    var strong = btn.closest("strong"); strong.parentNode.insertBefore(box, strong.nextSibling);
    btn.setAttribute("aria-expanded", "true");
  }, true);
})();
