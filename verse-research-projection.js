/* JudeBible passage/verse WORBS reader projection.
 * Reader-facing projection only. It neither edits Project01 research nor changes Registry/representative authority.
 */
(function (root) {
  "use strict";
  var PIN = {
    researchId: "JBC_GENESIS_22_1_19_WORBS_E2E_PILOT_20261006_01",
    sourceSha256: "9744ce891eaa5c6ff8f27691f1eb07a7eff3652391907d21fe22f1f6a2354545",
    passage: "gen-22",
    v1: 1,
    v2: 19,
    projectionStatus: "INTERNAL_READER_PROJECTION",
    professionalStatus: "STAGE_APPROVED_WITH_VERIFY"
  };

  function data() {
    var d = root.BVC_VERSE_RESEARCH_CONTENT;
    if (!d || d.researchId !== PIN.researchId) return null;
    if (String(d.sourceSha256 || "").toLowerCase() !== PIN.sourceSha256) return null;
    if (!d.passage || d.passage.book !== "gen" || +d.passage.chapter !== 22 || +d.passage.v1 !== PIN.v1 || +d.passage.v2 !== PIN.v2) return null;
    if (d.projectionStatus !== PIN.projectionStatus || d.professionalStatus !== PIN.professionalStatus || d.externalRelease !== "NOT_AUTHORIZED") return null;
    return d;
  }

  function parseRef(ref) {
    var m = /^([a-z0-9]+)-(\d+)(?::(\d+))?$/.exec(String(ref || ""));
    return m ? { pid: m[1] + "-" + m[2], verse: m[3] == null ? null : +m[3] } : null;
  }

  function sectionFor(v) {
    var d = data();
    if (!d) return null;
    for (var i = 0; i < d.sections.length; i++) {
      if (v >= d.sections[i].v1 && v <= d.sections[i].v2) return d.sections[i];
    }
    return null;
  }

  function verse(ref) {
    var p = parseRef(ref), d = data();
    if (!d || !p || p.pid !== PIN.passage || p.verse == null || p.verse < PIN.v1 || p.verse > PIN.v2) return null;
    return { type: "VERSE_WORBS", ref: ref, verse: p.verse, section: sectionFor(p.verse), researchId: d.researchId };
  }

  function passage(pid) {
    var d = data();
    return d && pid === PIN.passage ? { type: "PASSAGE_WORBS", ref: pid, researchId: d.researchId } : null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function addParagraphs(parent, items, cls) {
    (items || []).forEach(function (t) { parent.appendChild(el("p", cls || "rp-commentary-p", t)); });
  }

  function addHeading(parent, title) {
    parent.appendChild(el("h4", "rp-subhead", title));
  }

  function renderOverview(box, d) {
    var sec = el("section", "rp-reader-section rp-overview");
    addHeading(sec, "전체 본문 개관");
    addParagraphs(sec, d.overview);
    var core = el("div", "rp-central");
    core.appendChild(el("strong", "rp-central-label", "중심 메시지"));
    core.appendChild(el("p", "rp-commentary-p", d.centralMessage));
    sec.appendChild(core);
    box.appendChild(sec);
  }

  function renderSection(box, s, currentVerse) {
    if (!s) return;
    var sec = el("section", "rp-reader-section rp-commentary");
    addHeading(sec, "절·단락별 주석");
    var title = s.v1 === s.v2 ? s.v1 + "절 · " + s.title : s.v1 + "–" + s.v2 + "절 · " + s.title;
    sec.appendChild(el("h5", "rp-section-title", title));
    addParagraphs(sec, s.paragraphs);
    if (currentVerse != null && (currentVerse < s.v1 || currentVerse > s.v2)) sec.hidden = true;
    box.appendChild(sec);
  }

  function renderAllSections(box, d) {
    var sec = el("section", "rp-reader-section rp-commentary");
    addHeading(sec, "절·단락별 주석");
    (d.sections || []).forEach(function (s) {
      var unit = el("div", "rp-unit");
      unit.appendChild(el("h5", "rp-section-title", (s.v1 === s.v2 ? s.v1 + "절" : s.v1 + "–" + s.v2 + "절") + " · " + s.title));
      addParagraphs(unit, s.paragraphs);
      sec.appendChild(unit);
    });
    box.appendChild(sec);
  }

  function renderLexical(box, d, currentVerse) {
    var cards = (d.lexicalCards || []).filter(function (c) { return currentVerse == null || +c.verse === currentVerse; });
    if (!cards.length) return;
    var sec = el("section", "rp-reader-section rp-lexical");
    addHeading(sec, "핵심 원어 카드");
    cards.forEach(function (c) {
      var card = el("article", "rp-lex-card");
      var head = el("div", "rp-lex-head");
      head.appendChild(el("span", "rp-lex-form", c.form));
      head.appendChild(el("strong", "rp-lex-gloss", c.gloss));
      card.appendChild(head);
      card.appendChild(el("p", "rp-lex-meta", c.lemma + " · " + c.transliteration + " · " + c.pronunciation + " · " + c.morphology + " · " + c.verse + "절"));
      card.appendChild(el("p", "rp-commentary-p", c.note));
      sec.appendChild(card);
    });
    box.appendChild(sec);
  }

  function renderCautions(box, d) {
    if (!d.cautions || !d.cautions.length) return;
    var sec = el("section", "rp-reader-section rp-cautions");
    addHeading(sec, "해석 주의");
    var ul = el("ul", "rp-caution-list");
    (d.cautions || []).forEach(function (t) { var li = el("li", null, t); ul.appendChild(li); });
    sec.appendChild(ul);
    box.appendChild(sec);
  }

  function renderCanonical(box, d) {
    if (!d.canonicalLinks || !d.canonicalLinks.length) return;
    var details = el("details", "rp-canonical");
    details.appendChild(el("summary", null, "정경적 연결"));
    var list = el("div", "rp-canonical-list");
    d.canonicalLinks.forEach(function (x) {
      var row = el("div", "rp-canonical-row");
      row.appendChild(el("strong", null, x.ref));
      row.appendChild(el("p", "rp-commentary-p", x.note));
      list.appendChild(row);
    });
    details.appendChild(list);
    box.appendChild(details);
  }

  function render(box, ref) {
    var d = data(), p = parseRef(ref);
    box.textContent = "";
    if (!d || !p || p.pid !== PIN.passage || (p.verse != null && (p.verse < PIN.v1 || p.verse > PIN.v2))) {
      box.hidden = true;
      box.setAttribute("data-state", "UNAVAILABLE");
      return Promise.resolve(false);
    }

    box.hidden = false;
    box.setAttribute("data-state", "SHOWN");
    box.setAttribute("data-research-id", d.researchId);
    box.setAttribute("data-projection-status", d.projectionStatus);

    var head = el("div", "rp-head rp-reader-head");
    head.appendChild(el("strong", "rp-title", d.title));
    box.appendChild(head);
    box.appendChild(el("p", "rp-rel", p.verse == null ? d.passage.ref : "창세기 22:" + p.verse));

    renderOverview(box, d);
    if (p.verse == null) renderAllSections(box, d);
    else renderSection(box, sectionFor(p.verse), p.verse);
    renderLexical(box, d, p.verse);
    renderCautions(box, d);
    renderCanonical(box, d);

    return Promise.resolve(true);
  }

  root.BVCVerseResearchProjection = {
    PIN: PIN,
    passage: passage,
    verse: verse,
    render: render,
    ready: function () { return !!data(); }
  };
})(typeof window !== "undefined" ? window : globalThis);
