/* Place detail (Level B / Atlas cards): fills the "연구 전 / 확인 중" rows and adds a "성경 속 이 장소" section, built only from data already in the app:
   OpenBible.info locations (CC BY 4.0), the Easton scripture list on the card, the timeline steps, and the KRV text. Marked as automatic / not reviewed. */
(function () {
  var BOOK = { "gen": "gen", "ex": "exo", "exod": "exo", "lev": "lev", "num": "num", "deut": "deu", "josh": "jos", "judg": "jdg", "ruth": "rut", "1 sam": "1sa", "2 sam": "2sa", "1 kings": "1ki", "2 kings": "2ki", "1 chron": "1ch", "2 chron": "2ch", "ezra": "ezr", "neh": "neh", "esth": "est", "job": "job", "ps": "psa", "prov": "pro", "eccl": "ecc", "song": "sng", "isa": "isa", "jer": "jer", "lam": "lam", "ezek": "ezk", "dan": "dan", "hos": "hos", "joel": "jol", "amos": "amo", "obad": "oba", "jonah": "jon", "mic": "mic", "nah": "nam", "hab": "hab", "zeph": "zep", "hag": "hag", "zech": "zec", "mal": "mal", "matt": "mat", "mark": "mrk", "luke": "luk", "john": "jhn", "acts": "act", "rom": "rom", "1 cor": "1co", "2 cor": "2co", "gal": "gal", "eph": "eph", "phil": "php", "col": "col", "1 thess": "1th", "2 thess": "2th", "1 tim": "1ti", "2 tim": "2ti", "titus": "tit", "philem": "phm", "heb": "heb", "james": "jas", "1 pet": "1pe", "2 pet": "2pe", "1 john": "1jn", "2 john": "2jn", "3 john": "3jn", "jude": "jud", "rev": "rev" };
  var ERA = { primitive: "원역사", patriarchal: "족장 시대", exodus: "출애굽·광야", conquest: "가나안 정복", judges: "사사 시대", "united-monarchy": "통일왕국", "divided-monarchy": "분열왕국", assyria: "앗수르 시대", exile: "바벨론·포로", "return": "페르시아·귀환", intertestamental: "신구약 중간기", jesus: "예수 시대", "early-church": "초대교회" };
  var idx = null, byName = null, lbIdx = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function stepIndex() {
    if (idx) return idx; idx = [];
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (o.id && typeof o.id === "string" && /^era\./.test(o.id) && o.track && o.range) idx.push(o);
      Object.keys(o).forEach(function (k) { walk(o[k]); });
    })(window.JBC_EXPLORATION);
    return idx;
  }
  function placeIdx() {
    if (byName) return byName; byName = {};
    var arr = window.JBC_REF_PLACES_OPENBIBLE; (Array.isArray(arr) ? arr : (arr && (arr.places || arr.features)) || []).forEach(function (r) { [r.en, r.n].forEach(function (k) { if (k && typeof k === "string") { var key = k.toLowerCase().replace(/\s+\d+$/, ""); if (!byName[key] || (r.s || 0) > (byName[key].s || 0)) byName[key] = r; } }); });
    return byName;
  }
  function candidate(id) {
    if (!lbIdx) { lbIdx = {}; [window.JBC_ATLAS_BC_CANDIDATES, window.JBC_ATLAS_BC_EXPANSION].forEach(function (src) { (function w(x) { if (!x || typeof x !== "object") return; if (x.candidate_id) { lbIdx[x.candidate_id] = x; return; } (Array.isArray(x) ? x : Object.values(x)).forEach(w); })(src); }); }
    return lbIdx[id];
  }
  function parseRefs(text) {   // "Matt. 4:13-16, Luke 4:16-31, Matt. 8:5"
    var out = [], re = /((?:[1-3]\s)?[A-Za-z]+)\.?\s+(\d+):(\d+)(?:\s*[-–]\s*(?:(\d+):)?(\d+))?/g, m;
    while ((m = re.exec(text || ""))) {
      var code = BOOK[m[1].toLowerCase().replace(/\s+/g, " ")]; if (!code) continue;
      var c1 = +m[2], v1 = +m[3], c2 = m[4] ? +m[4] : c1, v2 = m[5] ? +m[5] : v1; out.push({ b: code, c1: c1, v1: v1, c2: c2, v2: v2 });
    }
    return out;
  }
  function krv(code, c, v) { var bs = window.BVC_KRV && window.BVC_KRV.books; if (!bs) return ""; var b = bs.filter(function (x) { return x.id === code; })[0]; return b && b.chapters[c - 1] && b.chapters[c - 1][v - 1] || ""; }
  function bookName(code) { var bs = window.BVC_KRV && window.BVC_KRV.books; var b = bs && bs.filter(function (x) { return x.id === code; })[0]; return b ? b.name : code; }
  function refLabel(r) { return bookName(r.b) + " " + r.c1 + ":" + r.v1 + (r.c2 !== r.c1 ? "–" + r.c2 + ":" + r.v2 : (r.v2 !== r.v1 ? "–" + r.v2 : "")); }
  function region(lat, lon) {
    if (lat == null) return "";
    if (lon < 27 && lat > 36) return "그리스·에게해";
    if (lon < 20) return "이탈리아·서지중해";
    if (lat > 35.2 && lon < 38) return "소아시아·북시리아";
    if (lon > 38) return "메소포타미아·동방";
    if (lat < 31 && lon < 34.3) return "이집트·시나이";
    if (lat > 33.6) return lon > 36.1 ? "다메섹 일대(시리아)" : "베니게·레바논 해안";
    if (lon > 35.65 && lat > 32.9) return "바산·다메섹 남부(요단 동편)";
    if (lon > 35.65) return "요단 동편";
    if (lon < 34.95 && lat > 31.2) return "해안 평야";
    if (lat > 32.6) return "갈릴리";
    if (lat > 32.1) return "사마리아·에스드렐";
    if (lon > 35.35 && lat < 32.1) return "요단 골짜기·사해";
    if (lat > 31.3) return "유대 산지·쉐펠라";
    return "네게브·남부 광야";
  }
  function certainty(s) { return s >= 800 ? "높음" : s >= 500 ? "보통" : "낮음(후보 여럿 또는 추정)"; }
  function overlaps(step, refs) {
    var m = /^([1-3]?[a-z]+)-(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/i.exec(step.range || ""); if (!m) return false;
    var b = m[1].toLowerCase(), s = +m[2] * 1000 + +m[3], e = (m[4] ? +m[4] : +m[2]) * 1000 + (m[5] ? +m[5] : +m[3]);
    return refs.some(function (r) { return r.b === b && !(r.c2 * 1000 + r.v2 < s || r.c1 * 1000 + r.v1 > e); });
  }
  function enrich(article) {
    var id = article.getAttribute("data-place-key") || article.getAttribute("data-id") || ""; var m = /(?:levelb:|^)(ATLBC[\w-]+)$/.exec(id); var cid = m && m[1]; if (!cid) return;
    if (article.getAttribute("data-enriched") === cid) return;
    var rec = candidate(cid); if (!rec) return;
    var rp = placeIdx()[String(rec.name_en || "").toLowerCase().replace(/\s+\d+$/, "")];
    var refs = parseRefs(rec.source_text); var seenKey = {}; refs = refs.filter(function (r) { var k = r.b + r.c1 + ":" + r.v1 + "-" + r.c2 + ":" + r.v2; if (seenKey[k]) return false; seenKey[k] = 1; return true; });
    var steps = stepIndex().filter(function (s) { return overlaps(s, refs); });
    var eras = []; steps.forEach(function (s) { var e = ERA[(/^era\.([a-z-]+)\./.exec(s.id) || [])[1]]; if (e && eras.indexOf(e) < 0) eras.push(e); });
    if (!eras.length && refs.length) eras.push(refs[0].b && /^(mat|mrk|luk|jhn|act|rom|1co|2co|gal|eph|php|col|1th|2th|1ti|2ti|tit|phm|heb|jas|1pe|2pe|1jn|2jn|3jn|jud|rev)$/.test(refs[0].b) ? "신약 시대" : "구약 시대");
    var persons = []; var PP = window.JBC_TIMELINE_ERA_PERSONS && window.JBC_TIMELINE_ERA_PERSONS.steps || {};
    steps.forEach(function (s) { (PP[s.id] || []).forEach(function (p) { if (persons.indexOf(p.n) < 0) persons.push(p.n); }); });
    var loc = "", reg = "";
    if (rp) {
      reg = region(rp.lat, rp.lon);
      loc = (rp.mod ? "현대 지명: " + rp.mod + " · " : "") + "북위 " + (+rp.lat).toFixed(3) + "° 동경 " + (+rp.lon).toFixed(3) + "°" + (rp.m ? " · 정밀도 약 " + rp.m + " m" : "") + " · 식별 신뢰도 " + certainty(rp.s || 0) + " (" + (rp.s || 0) + "/1000, OpenBible.info)";
    }
    var meaning = ""; var mm0 = /[“"]([^”"]{1,24})[”"]\s*(?:라는|이라는|를 뜻|을 뜻|의 뜻)/.exec(String(rec.ko || "")); if (mm0) meaning = "“" + mm0[1] + "” (Easton 성서사전 기준)";
    var fill = { "이름의 뜻": meaning, "지역": reg, "위치": loc, "주요 시대": eras.join(" · "), "주요 인물·사건": steps.slice(0, 3).map(function (s) { return s.title; }).join(" · "), "주요 인물": persons.slice(0, 8).join(", "), "주요 사건": steps.slice(0, 4).map(function (s) { return s.title; }).join(" · ") };
    article.querySelectorAll(".qf").forEach(function (row) {
      var dt = row.querySelector("dt"), dd = row.querySelector("dd"); if (!dt || !dd) return;
      var k = dt.textContent.trim(), cur = dd.textContent.trim(); if (!fill[k] || !/^(연구 전|확인 중|위치 확인 중)/.test(cur)) return;
      dd.textContent = fill[k]; row.setAttribute("data-auto", "1");
    });
    // new section
    var html = "";
    if (refs.length) html += "<h5>본문에서 이 장소가 나오는 곳 <small>개역한글</small></h5><ul class=\"pe-verses\">" + refs.slice(0, 6).map(function (r) {
      var t = krv(r.b, r.c1, r.v1); return "<li><a href=\"#" + r.b + "-" + r.c1 + ":" + r.v1 + "\" data-pe-ref=\"" + r.b + "," + r.c1 + "," + r.v1 + "," + r.c2 + "," + r.v2 + "\" aria-expanded=\"false\">" + esc(refLabel(r)) + "</a>" + (t ? " <span>" + esc(t) + "</span>" : "") + "</li>"; }).join("") + "</ul>";
    if (steps.length) html += "<h5>연표에서 이 장소가 걸린 사건</h5><ul class=\"pe-steps\">" + steps.slice(0, 8).map(function (s) {
      var mm = /^([1-3]?[a-z]+)-(\d+):(\d+)/i.exec(s.range) || []; var e = ERA[(/^era\.([a-z-]+)\./.exec(s.id) || [])[1]] || "";
      return "<li><a href=\"#" + esc((mm[1] || "") + "-" + (mm[2] || "") + ":" + (mm[3] || "")) + "\">" + esc(s.title) + "</a> <span>" + esc(e) + " · " + esc(s.range.replace(/^([1-3]?[a-z]+)-/i, function (_, b) { return bookName(b.toLowerCase()) + " "; }).replace("-", "–")) + "</span></li>"; }).join("") + "</ul>";
    if (window.JBCResearch) refs.forEach(function (r) { if (window.JBCResearch.has(r.b) && !window.JBCResearch.loaded(r.b)) window.JBCResearch.ensure(r.b, function () { if (article.isConnected) { var o = article.querySelector(".pe-section"); if (o) o.remove(); article.removeAttribute("data-enriched"); enrich(article); } }); });
    var wl = []; var seenW = {};
    (window.BVC_PASSAGE_RESEARCH_CONTENT || []).forEach(function (d) {
      var p = d && d.passage; if (!p) return;
      var hit = refs.some(function (r) { if (r.b !== p.book) return false; var a1 = +p.chapter * 1000 + (+p.v1 || 1), z1 = +(p.chapterEnd || p.chapter) * 1000 + (+p.v2 || 999); return !(z1 < r.c1 * 1000 + r.v1 || a1 > r.c2 * 1000 + r.v2); });
      var key = p.book + p.chapter + ":" + p.v1; if (hit && !seenW[key]) { seenW[key] = 1; wl.push(d); }
    });
    if (wl.length) html += "<h5>이 장소가 나오는 본문연구 <small>WORBS</small></h5><ul class=\"pe-worbs\">" + wl.slice(0, 4).map(function (d) { var p = d.passage; return "<li><a href=\"#" + p.book + "-" + p.chapter + ":" + (p.v1 || 1) + "\">" + esc(d.title || p.ref) + "</a> <span>" + esc(p.ref) + "</span></li>"; }).join("") + "</ul>";
    if (persons.length) html += "<h5>같은 본문에 이름이 나오는 인물 후보</h5><p class=\"pe-ppl\">" + esc(persons.slice(0, 10).join(", ")) + "</p>";
    if (!html && !rp) return;
    var sec = document.createElement("section"); sec.className = "d-sec pe-section"; sec.setAttribute("data-part", "auto-place");
    sec.innerHTML = '<h4 class="d-h">성경 속 이 장소 <small>자동 정리 · 연구 승인 전</small></h4>' + html +
      '<p class="pe-credit">위치·지역: <a href="https://www.openbible.info/geo/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> (CC BY 4.0) · 본문 목록: Easton 성서사전(1897, 공개) 인용 · 연표 연결은 본문 범위가 겹치는 사건을 자동으로 고른 것으로, 확정된 사건 참여자가 아닙니다.</p>';
    var anchor = article.querySelector('[data-part="facts"]'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor.nextSibling); else article.appendChild(sec);
    article.setAttribute("data-enriched", cid);
  }
  window.addEventListener("jbc-krv-loaded", function () {
    document.querySelectorAll('article.detail[data-detail="l"]').forEach(function (a) { var o = a.querySelector(".pe-section"); if (o) o.remove(); a.removeAttribute("data-enriched"); try { enrich(a); } catch (e) {} });
  });
  var t = 0;
  new MutationObserver(function () {
    clearTimeout(t); t = setTimeout(function () { document.querySelectorAll('article.detail[data-detail="l"]').forEach(function (a) { try { if (!a.querySelector(".pe-section")) { a.removeAttribute("data-enriched"); enrich(a); } } catch (e) {} }); }, 80);
  }).observe(document.body, { childList: true, subtree: true });

  // Verse links under "성경 속 이 장소": open the passage text in place; a second link goes to the study page.
  (function () {
    var st = document.createElement("style");
    st.textContent = ".pe-verse-open{margin:6px 0 4px;padding:8px 10px;border-left:3px solid var(--accent,#a8662f);background:var(--paper,#fffaf0);border-radius:6px;font-size:13px;line-height:1.65}.pe-verse-open p{margin:0 0 4px}.pe-verse-open sup{color:var(--accent,#a8662f);font-weight:700;margin-right:4px}.pe-verse-open .pe-open-study{display:inline-block;margin-top:4px;font-weight:700}.pe-verses a[aria-expanded=true]{text-decoration:underline}";
    document.head.appendChild(st);
    function rangeHtml(p) {
      var b = p[0], c1 = +p[1], v1 = +p[2], c2 = +p[3], v2 = +p[4], bs = window.BVC_KRV && window.BVC_KRV.books, bk = bs && bs.filter(function (x) { return x.id === b; })[0], out = "";
      if (!bk) return "";
      for (var c = c1; c <= c2; c++) {
        var ch = bk.chapters[c - 1]; if (!ch) break;
        var from = c === c1 ? v1 : 1, to = c === c2 ? Math.min(v2, ch.length) : ch.length;
        for (var v = from; v <= to; v++) out += "<p><sup>" + (c !== c1 && v === from || (c === c1 && v === from && c1 !== c2) ? c + ":" : "") + v + "</sup>" + esc(ch[v - 1] || "") + "</p>";
      }
      return out;
    }
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[data-pe-ref]"); if (!a) return;
      ev.preventDefault(); ev.stopPropagation();
      var li = a.closest("li"), open = li && li.querySelector(".pe-verse-open");
      if (open) { open.remove(); a.setAttribute("aria-expanded", "false"); return; }
      var p = a.getAttribute("data-pe-ref").split(","), KL = window.JBC_KRV_LAZY; if (KL && !KL.loaded(p[0])) { KL.ensure([p[0]]).then(function (ok) { if (ok) a.click(); }); return; } var html = rangeHtml(p); if (!html) return;
      var box = document.createElement("div"); box.className = "pe-verse-open";
      box.innerHTML = html + '<a class="pe-open-study" href="#' + p[0] + "-" + p[1] + ":" + p[2] + '" data-pe-study="' + p[0] + "-" + p[1] + ":" + p[2] + '">본문연구에서 보기 ›</a>';
      li.appendChild(box); a.setAttribute("aria-expanded", "true");
    }, true);
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[data-pe-study]"); if (!a) return;
      ev.preventDefault(); ev.stopPropagation();
      var id = a.getAttribute("data-pe-study");
      try { if (window.BVC && BVC.closeSearch) BVC.closeSearch(true); } catch (e) {}
      location.hash = "#" + id;
      setTimeout(function () {
        if (document.body.dataset.view !== "study" && window.BVC && BVC.setView) { try { BVC.setView("study"); } catch (e) {} }
        if (document.body.dataset.view !== "study") { var r = document.getElementById("rail-study"); if (r) r.click(); }
      }, 250);
    }, true);
  })();
})();
