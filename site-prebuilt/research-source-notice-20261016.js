/* Research panel: shows the "연구 출처 및 저작권 안내" of the research that is on screen.
   - a record that carries its own notice (sourceNotice, from the manuscript) is shown as written
   - otherwise, a record that lists Tyndale / unfoldingWord in readerSources gets the standard notice built from those sources */
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function link(s) { return esc(s).replace(/(https?:\/\/[^\s<)]*[^\s<).,;])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); }
  function renderNotice(text) {
    var lines = String(text || "").replace(/\r/g, "").split("\n"), out = "", depth = -1, para = [];
    function flushPara() { if (para.length) { out += "<p>" + link(para.join(" ")) + "</p>"; para = []; } }
    function closeTo(d) { while (depth > d) { out += "</ul>"; depth--; } }
    lines.forEach(function (raw, i) {
      var l = raw.replace(/\s+$/, ""); if (!l.trim()) { flushPara(); return; }
      if (i === 0 && /^연구 출처 및 저작권 안내$/.test(l.trim())) return;
      var m = /^(\s*)[*\-•]\s+(.*)$/.exec(l);
      if (m) { flushPara(); var d = m[1].length >= 2 ? 1 : 0; if (d > depth) { while (depth < d) { out += "<ul>"; depth++; } } else closeTo(d); out += "<li>" + link(m[2]) + "</li>"; return; }
      closeTo(-1);
      if (/^(연구 참고자료|연구 및 재서술 안내|라이선스)$/.test(l.trim())) { flushPara(); out += "<h5>" + esc(l.trim()) + "</h5>"; return; }
      para.push(l.trim());
    });
    flushPara(); closeTo(-1); return out;
  }
  function standard(rec) {
    var ref = (rec.passage && rec.passage.ref) || "", src = rec.readerSources || [], hasT = false, hasU = false;
    src.forEach(function (s) { if (/Tyndale/i.test(s.name || "")) hasT = true; if (/unfoldingWord/i.test(s.name || "")) hasU = true; });
    var ov = window.JBC_RESEARCH_SOURCE_OVERRIDES && window.JBC_RESEARCH_SOURCE_OVERRIDES[rec.researchId];   // 일괄 적용 목록(data/research-source-overrides.js)
    if (ov) { if (ov.tyndale) hasT = true; if (ov.unfoldingword) hasU = true; }
    if (!hasT && !hasU) return "";
    var h = "<h5>연구 참고자료</h5><ul>";
    if (hasT) h += "<li>Tyndale Open Study Notes — © 2022 Tyndale House Publishers. " + esc(ref) + " 관련 주석. CC BY-SA 4.0.<ul><li>Adapted from Tyndale Open Study Notes. The original work by Tyndale House Publishers is available for free at " + link("http://www.tyndaleopenresources.com") + ".</li></ul></li>";
    if (hasU) h += "<li>unfoldingWord Translation Notes — unfoldingWord, English v91, " + esc(ref) + " 관련 번역 주석. CC BY-SA 4.0.<ul><li>Original work available at unfoldingWord.org.</li></ul></li>";
    h += "</ul><h5>연구 및 재서술 안내</h5><p>이 연구는 성경 본문에 대한 WORBS 원어·문학·역사·신학 연구를 바탕으로 작성한 한국어 심층 주석입니다. 연구 과정에서 위 공개 자료를 참고하였으며, 해당 자료의 내용을 한국어 독자를 위해 선별·분석·재구성·재서술하였습니다. 이 원고는 원자료의 공식 한국어 번역이나 해당 출판사 및 기관이 승인한 주석이 아닙니다.</p>" +
      "<h5>라이선스</h5><p>이 원고가 위 CC BY-SA 4.0 자료의 파생 저작물에 해당하는 범위에서는 동일한 CC BY-SA 4.0 조건을 적용합니다. 라이선스 전문: " + link("https://creativecommons.org/licenses/by-sa/4.0/") + " 원자료 및 저작권에 관한 상세 정보는 각 제공 기관의 공식 안내를 따릅니다. JudeBible 전체의 출처·저작권 안내는 화면 맨 아래 \"연구 출처 및 저작권 안내\"에서 볼 수 있습니다.</p>";
    return h;
  }
  function currentRecord(panel) {
    var txt = panel.innerText.replace(/\s+/g, " "), best = null;
    [].concat(window.BVC_PASSAGE_RESEARCH_CONTENT || [], window.BVC_APPROVED_PASSAGE_RESEARCH_CONTENT || [], window.BVC_VERSE_RESEARCH_CONTENT || []).forEach(function (r) {
      var ti = (r.title || "").replace(/\s+/g, " ").trim(); if (!ti || txt.indexOf(ti) < 0) return;
      if (!best || ti.length > best.ti.length || (ti.length === best.ti.length && r.sourceNotice && !best.r.sourceNotice)) best = { r: r, ti: ti };
    });
    return best && best.r;
  }
  function run() {
    var panel = document.getElementById("panel"); if (!panel) return;
    var host = panel.querySelector(".rp-deep-research") || panel.querySelector(".rp-commentary") || null; if (!host) return;
    var rec = currentRecord(panel); if (!rec) return;
    var id = rec.researchId || rec.title, cur = panel.querySelector(".rp-source-notice");
    if (cur && cur.getAttribute("data-for") === id) return; if (cur) cur.remove();
    var body = rec.sourceNotice ? renderNotice(rec.sourceNotice) : standard(rec); if (!body) return;
    var sec = document.createElement("section"); sec.className = "rp-reader-section rp-source-notice"; sec.setAttribute("data-for", id);
    sec.innerHTML = '<h4 class="rp-subhead">연구 출처 및 저작권 안내</h4>' + body;
    host.parentNode.insertBefore(sec, host.nextSibling);
  }
  var t = 0; new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { try { run(); } catch (e) {} }, 120); }).observe(document.body, { childList: true, subtree: true });
})();
