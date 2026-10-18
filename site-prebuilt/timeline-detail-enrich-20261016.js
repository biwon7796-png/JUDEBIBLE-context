/* Timeline detail card: adds an "이야기 흐름" section and "함께 읽기" links (JBC_TL_ENRICH, written for JudeBible) and
   an automatic excerpt of the Tyndale Open Study Notes (CC BY-SA 4.0, English) that overlap the step's passage. */
(function () {
  var w = window;
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
  // WORBS reader research (BVC_PASSAGE_RESEARCH_CONTENT): the part of the research that overlaps the step's passage
  function worbsFor(rg) {
    var all = window.BVC_PASSAGE_RESEARCH_CONTENT || [], s = rg.c1 * 1000 + rg.v1, e = rg.c2 * 1000 + rg.v2, seen = {}, out = [];
    all.forEach(function (d) {
      var p = d && d.passage; if (!p || p.book !== rg.book) return;
      var c1 = +p.chapter, c2 = +(p.chapterEnd || p.chapter), a = c1 * 1000 + (+p.v1 || 1), b = c2 * 1000 + (+p.v2 || 999);
      if (b < s || a > e) return; var key = p.book + c1 + ":" + p.v1 + "-" + c2 + ":" + p.v2; if (seen[key]) return; seen[key] = 1;
      var secs = (d.sections || []).filter(function (x) { var sc = +(x.chapter || x.c1 || c1), v1 = +x.v1, v2 = +x.v2, sc2 = +(x.chapterEnd || x.c2 || sc); return sc * 1000 + v1 <= e && sc2 * 1000 + v2 >= s; });
      out.push({ d: d, secs: secs, pericope: c1 === c2 && (+p.v2 - +p.v1) < 60, key: key, approved: /^JBC_/.test(d.researchId || "") });
    });
    out.sort(function (x, y) { return (y.approved ? 1 : 0) - (x.approved ? 1 : 0); });
    return out.slice(0, 2);
  }
  function worbsHtml(list, rg) {
    if (!list.length) return "";
    var h = '<h3>본문연구 <small>WORBS · 주드성경 본문연구 패널과 같은 연구</small></h3>';
    list.forEach(function (r) {
      h += '<article class="tl-worbs"><b>' + esc(r.d.title || r.d.passage.ref) + "</b>";
      if (r.pericope && r.d.centralMessage) h += "<p>" + esc(clip(r.d.centralMessage, 420)) + "</p>";
      else if (r.secs.length) r.secs.slice(0, 2).forEach(function (x) { h += "<p><strong>" + esc(x.title) + "</strong> " + esc(clip((x.paragraphs || [])[0] || "", 360)) + "</p>"; });
      else if (r.d.overview && r.d.overview[0]) h += "<p>" + esc(clip(r.d.overview[0], 360)) + "</p>";
      h += '<button type="button" class="tl-worbs-open" data-hash="' + esc(rg.book + "-" + rg.c1 + ":" + rg.v1) + '">본문연구 패널에서 전체 보기</button></article>';
    });
    return h + '<p class="tl-credit">이 연구는 공개 자료(Tyndale Open Study Notes, unfoldingWord Translation Notes · CC BY-SA 4.0)를 참고해 한국어 독자를 위해 선별·재구성·재서술한 것이며, 원출판사·기관이 승인한 번역이 아닙니다. 참고자료와 라이선스는 본문연구 패널 맨 아래 "연구 출처 및 저작권 안내"에 있습니다.</p>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".tl-worbs-open"); if (!b) return;
    location.hash = "#" + b.getAttribute("data-hash"); setTimeout(function () { var o = document.querySelector(".jb-research-edge-open,#panel-open"); if (o && document.body.dataset.panel !== "open") o.click(); }, 700);
  });
  function refName(rg) {
    var bs = window.BVC_KRV && window.BVC_KRV.books, b = bs && bs.filter(function (x) { return x.id === rg.book; })[0], nm = b ? b.name : rg.book;
    return nm + " " + rg.c1 + (rg.c2 !== rg.c1 ? "–" + rg.c2 : "") + "장";
  }
  function render(det, id) {
    var enr = window.JBC_TL_ENRICH && window.JBC_TL_ENRICH[id], step = buildIndex()[id], rg = step && parseRange(step.range);
    var box = document.createElement("section"); box.className = "tl-enrich"; box.setAttribute("data-for", id); var html = "";
    if (rg && w.JBCResearch && w.JBCResearch.has(rg.book) && !w.JBCResearch.loaded(rg.book)) {   // the book of this step is not loaded yet: load it, then draw again
      w.JBCResearch.ensure(rg.book, function () { var cur = det.querySelector(".tl-enrich"); if (det.isConnected && cur && cur.getAttribute("data-for") === id) { cur.remove(); render(det, id); } });
    }
    var wl = rg ? worbsFor(rg) : []; html += worbsHtml(wl, rg || {});
    if (enr && enr.flow && !wl.length) html += "<h3>이야기 흐름</h3>" + enr.flow.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
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
      }).join("") + '<div class="tl-credit tl-notice"><b>연구 출처 및 저작권 안내</b><br>Tyndale Open Study Notes — © 2022 Tyndale House Publishers. ' + esc(refName(rg)) + ' 관련 주석 발췌(일부 생략, 영어 원문). CC BY-SA 4.0.<br>The original work by Tyndale House Publishers is available for free at <a href="http://www.tyndaleopenresources.com" target="_blank" rel="noopener noreferrer">http://www.tyndaleopenresources.com</a>. 번역 버튼으로 보는 한국어는 브라우저의 기계 번역이며 원출판사가 승인한 번역이 아닙니다. 라이선스 전문: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">https://creativecommons.org/licenses/by-sa/4.0/</a></div>';
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

  // "함께 읽기": a verse link opens the passage text right below it; a second link continues to the study page.
  (function () {
    var st = document.createElement("style");
    st.textContent = ".tl-read-open{margin:6px 0 6px;padding:8px 10px;border-left:3px solid var(--accent,#a8662f);background:var(--paper,#fffaf0);border-radius:6px;font-size:13px;line-height:1.65}.tl-read-open p{margin:0 0 4px}.tl-read-open sup{color:var(--accent,#a8662f);font-weight:700;margin-right:4px}.tl-read-open .tl-read-study{display:inline-block;margin-top:4px;font-weight:700;color:var(--accent-ink,#7a3f14);text-decoration:underline}.tl-read a[aria-expanded=true]{background:var(--accent-soft,rgba(168,102,47,.12))}";
    document.head.appendChild(st);
    function esc2(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest(".tl-read a[href^='#']"); if (!a) return;
      var m = /^#([1-3]?[a-z]+)-(\d+):(\d+)$/.exec(a.getAttribute("href")); if (!m) return;
      e.preventDefault(); e.stopPropagation();
      var li = a.closest("li"), open = li.querySelector(".tl-read-open");
      if (open) { open.remove(); a.setAttribute("aria-expanded", "false"); return; }
      var bs = window.BVC_KRV && window.BVC_KRV.books, bk = bs && bs.filter(function (x) { return x.id === m[1]; })[0], ch = bk && bk.chapters[+m[2] - 1]; if (!ch) return;
      var v1 = +m[3], rm = /:(\d+)\s*[–—-]\s*(\d+)\s*$/.exec(a.textContent), v2 = rm ? +rm[2] : v1, html = "";
      v2 = Math.min(Math.max(v2, v1), ch.length);
      for (var v = v1; v <= v2; v++) html += "<p><sup>" + v + "</sup>" + esc2(ch[v - 1]) + "</p>";
      var box = document.createElement("div"); box.className = "tl-read-open";
      box.innerHTML = html + '<a class="tl-read-study" href="' + a.getAttribute("href") + '" data-tl-read-study="' + m[1] + "-" + m[2] + ":" + m[3] + '">본문연구에서 보기 ›</a>';
      li.appendChild(box); a.setAttribute("aria-expanded", "true");
    }, true);
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-tl-read-study]"); if (!a) return;
      e.preventDefault(); e.stopPropagation();
      location.hash = "#" + a.getAttribute("data-tl-read-study");
      setTimeout(function () {
        if (document.body.dataset.view !== "study" && window.BVC && BVC.setView) { try { BVC.setView("study"); } catch (x) {} }
        if (document.body.dataset.view !== "study") { var r = document.getElementById("rail-study"); if (r) r.click(); }
      }, 250);
    }, true);
  })();
})();
