/* Timeline detail card: adds an "이야기 흐름" section and "함께 읽기" links (JBC_TL_ENRICH, written for JudeBible) and
   an automatic excerpt of the Tyndale Open Study Notes (CC BY-SA 4.0, English) that overlap the step's passage. */
(function () {
  var MAP = { gen: "Gen", exo: "Exod", lev: "Lev", num: "Num", deu: "Deut", jos: "Josh", jdg: "Judg", rut: "Ruth", "1sa": "ISam", "2sa": "IISam", "1ki": "IKgs", "2ki": "IIKgs", "1ch": "IChr", "2ch": "IIChr", ezr: "Ezra", neh: "Neh", est: "Esth", job: "Job", psa: "Ps", pro: "Pr", ecc: "Eccl", sng: "Song", isa: "Isa", jer: "Jer", lam: "Lam", ezk: "Ezek", dan: "Dan", hos: "Hos", jol: "Joel", amo: "Amos", oba: "Obad", jon: "Jon", mic: "Mic", nam: "Nah", hab: "Hab", zep: "Zeph", hag: "Hagg", zec: "Zech", mal: "Mal", mat: "Matt", mrk: "Mark", luk: "Luke", jhn: "John", act: "Acts", rom: "Rom", "1co": "ICor", "2co": "IICor", gal: "Gal", eph: "Eph", php: "Phil", col: "Col", "1th": "IThes", "2th": "IIThes", "1ti": "ITim", "2ti": "IITim", tit: "Titus", phm: "Phlm", heb: "Heb", jas: "Jas", "1pe": "IPet", "2pe": "IIPet", "1jn": "IJn", "2jn": "IIJn", "3jn": "IIIJn", jud: "Jude", rev: "Rev" };
  var cache = {}, stepIndex = null, busy = false;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function buildIndex() {
    if (stepIndex) return stepIndex; stepIndex = {};
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (o.id && o.range && typeof o.id === "string" && /^era\./.test(o.id) && o.track) stepIndex[o.id] = o;
      Object.keys(o).forEach(function (k) { walk(o[k]); });
    })(window.JBC_EXPLORATION);
    return stepIndex;
  }
  function parseRange(r) {   // "gen-1:1-31" | "act-21:27-23:22"
    var m = /^([1-3]?[a-z]+)-(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/i.exec(r || ""); if (!m) return null;
    var c1 = +m[2], v1 = +m[3], c2 = m[4] ? +m[4] : c1, v2 = m[5] ? +m[5] : v1;
    return { book: m[1].toLowerCase(), c1: c1, v1: v1, c2: c2, v2: v2 };
  }
  function load(book) {
    var f = MAP[book]; if (!f) return Promise.resolve(null);
    if (!cache[f]) cache[f] = fetch("open-reference/tyndale/" + f + ".json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return cache[f];
  }
  function notesFor(rg) {
    return load(rg.book).then(function (data) {
      if (!data) return [];
      var s = rg.c1 * 1000 + rg.v1, e = rg.c2 * 1000 + rg.v2, out = [];
      for (var c = rg.c1; c <= rg.c2; c++) (data[String(c)] || []).forEach(function (it) {
        var m = /^[^.]+\.(\d+)\.(\d+)(?:-(?:(\d+)\.)?(\d+))?/.exec(it.ref || ""); if (!m) return;
        var a = +m[1] * 1000 + +m[2], b = (m[3] ? +m[3] : +m[1]) * 1000 + (m[4] ? +m[4] : +m[2]);
        if (b < s || a > e) return; out.push({ it: it, span: b - a, a: a });
      });
      out.sort(function (x, y) { return (x.span < 60 ? 0 : 1) - (y.span < 60 ? 0 : 1) || x.a - y.a; });
      var seen = {};
      return out.filter(function (x) { if (seen[x.it.ref]) return false; seen[x.it.ref] = 1; return true; }).slice(0, 3).map(function (x) { return x.it; });
    });
  }
  function clip(t, n) {
    t = String(t || "").replace(/\s+/g, " ").trim(); if (t.length <= n) return t;
    var cut = t.slice(0, n), i = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
    return (i > n * 0.5 ? cut.slice(0, i + 1) : cut.replace(/\s+\S*$/, "")) + " …";
  }
  function render(det, id) {
    var enr = window.JBC_TL_ENRICH && window.JBC_TL_ENRICH[id], step = buildIndex()[id], rg = step && parseRange(step.range);
    var box = document.createElement("section"); box.className = "tl-enrich"; box.setAttribute("data-for", id); var html = "";
    if (enr && enr.flow) html += "<h3>이야기 흐름</h3>" + enr.flow.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    if (enr && enr.read && enr.read.length) html += '<h3>함께 읽기</h3><ul class="tl-read">' + enr.read.map(function (r) {
      return "<li>" + (r.hash ? '<a href="#' + esc(r.hash) + '">' + esc(r.ref) + "</a>" : "<b>" + esc(r.ref) + "</b>") + " <span>" + esc(r.why) + "</span></li>";
    }).join("") + "</ul>";
    box.innerHTML = html;
    var act = det.querySelector(".tl-detail-actions"); if (act) det.insertBefore(box, act); else det.appendChild(box);
    if (rg) notesFor(rg).then(function (notes) {
      if (!notes.length || !box.isConnected) return;
      var h = "<h3>주석 발췌 <small>Tyndale Open Study Notes · 영어 원문</small></h3>" + notes.map(function (n) {
        var full = String(n.text || "").trim(), short = clip(full, 340);
        return '<article class="tl-note"><b>' + esc((n.ref || "").replace(/\./g, " ").replace(/ (\d+) (\d+)/, " $1:$2")) + "</b><p>" + esc(short) + "</p>" +
          (full.length > short.length ? "<details><summary>전문 보기</summary><p>" + esc(full) + "</p></details>" : "") + "</article>";
      }).join("") + '<p class="tl-credit">Tyndale Open Study Notes © Tyndale House Publishers, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a> · 본문 범위와 겹치는 주석을 자동으로 골랐습니다.</p>';
      var sec = document.createElement("div"); sec.className = "tl-enrich-notes"; sec.innerHTML = h; box.appendChild(sec);
    });
  }
  function scan() {
    if (busy) return; busy = true;
    try {
      var det = document.querySelector(".tl-detail"); if (!det) return;
      var b = det.querySelector("[data-tl-study]"), id = b && b.getAttribute("data-tl-study"); if (!id) return;
      var cur = det.querySelector(".tl-enrich"); if (cur && cur.getAttribute("data-for") === id) return; if (cur) cur.remove();
      render(det, id);
    } finally { busy = false; }
  }
  var t = 0;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 60); }).observe(document.body, { childList: true, subtree: true });
})();
