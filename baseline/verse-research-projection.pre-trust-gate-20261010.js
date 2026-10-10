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

  function parseRef(ref) {
    var m = /^([a-z0-9]+)-(\d+)(?::(\d+))?$/.exec(String(ref || ""));
    return m ? { pid: m[1] + "-" + m[2], book: m[1], chapter: +m[2], verse: m[3] == null ? null : +m[3] } : null;
  }

  function valid(d) {
    if (!d || !d.researchId || !d.sourceSha256 || !d.passage) return false;
    if (d.projectionStatus !== "INTERNAL_READER_PROJECTION" || d.externalRelease !== "NOT_AUTHORIZED") return false;
    var stageApproved = d.professionalStatus === "STAGE_APPROVED_WITH_VERIFY" || d.professionalStatus === "STAGE_APPROVED";
    // Current Project01 decision: Genesis 1-5 remains HOLD_STAGE_APPROVAL.
    // Keep candidate reader bytes for traceability, but suppress unapproved projection.
    // Captain authorized local JudeBible display of these existing WORBS drafts on 2026-10-09.
    // DISPLAY ONLY: professional HOLD/Registry/representative status remains unchanged.
    var localDraftDisplay = (d.researchId === "JBC_GENESIS_01_05_WORBS_20261008_01" ||
      d.researchId === "JBC_GENESIS_06_08_WORBS_20261009_01" ||
      d.researchId === "JBC_GENESIS_09_11_WORBS_20261009_01") &&
      d.passage.book === "gen" && +d.passage.chapter >= 1 && +d.passage.chapter <= 11 &&
      (d.professionalStatus === "QUALITY_PASS_WITH_VERIFY_STAGE_HOLD" || d.professionalStatus === "CANDIDATE_REVIEW_ONLY");
    var verifiedDownstream = d.professionalStatus === "PROFESSIONAL_RESEARCH_PASS" &&
      d.professionalReviewStatus === "APPROVED_DOWNSTREAM_PROJECTION" &&
      d.professionalAuthorityOwner === "01_목회연구_WORBS_BICS" &&
      d.approvalSourceSha256 === d.sourceSha256 && !!d.approvalRecord;
    if (!stageApproved && !localDraftDisplay && !verifiedDownstream) return false;
    var fromPromptFactory = d.generatedByProject === "04_목회프롬프트_하네스제작" || d.promptFactoryProject === "04_목회프롬프트_하네스제작";
    if (fromPromptFactory && !(d.professionalAuthorityOwner === "01_목회연구_WORBS_BICS" && /^APPROVED/.test(d.professionalReviewStatus || ""))) return false;
    if (d.researchId === PIN.researchId && String(d.sourceSha256).toLowerCase() !== PIN.sourceSha256) return false;
    return true;
  }

  // 승인 등급(연결층·표시용): 기존 valid() 규칙 위에서, 'STAGE_APPROVED' 문자열만으로는 승인으로 보지 않는다(stage flag alone is not approval evidence).
  //   APPROVED       = valid() + 하류 투영 승인의 근거(PROFESSIONAL_RESEARCH_PASS + APPROVED_DOWNSTREAM_PROJECTION + 승인 기록 + 승인 원본 SHA 일치)
  //   STAGE_PINNED   = 단계 승인 + 이미 코드에 고정된 Pilot 원본 SHA(PIN) 일치 — 정식 하류 투영 승인은 아님(검증 유보)
  //   STAGE_FLAG_ONLY= 단계 승인 문자열만 있고 근거 없음 / DRAFT_DISPLAY = 로컬 초안 표시(HOLD·후보) / NONE = 표시 불가
  //   새 허용목록을 만들지 않는다: PIN 은 기존 valid() 가 이미 쓰던 값이다.
  function approvalClass(d) {
    if (!valid(d)) return "NONE";
    var down = d.professionalStatus === "PROFESSIONAL_RESEARCH_PASS" && d.professionalReviewStatus === "APPROVED_DOWNSTREAM_PROJECTION" && !!d.approvalRecord && d.approvalSourceSha256 === d.sourceSha256;
    if (down) return "APPROVED";
    var stage = d.professionalStatus === "STAGE_APPROVED_WITH_VERIFY" || d.professionalStatus === "STAGE_APPROVED";
    if (stage) return d.researchId === PIN.researchId && String(d.sourceSha256).toLowerCase() === PIN.sourceSha256 ? "STAGE_PINNED" : "STAGE_FLAG_ONLY";
    return "DRAFT_DISPLAY";
  }

  function records() {
    var all = [], seen = {};
    if (root.BVC_VERSE_RESEARCH_CONTENT) all.push(root.BVC_VERSE_RESEARCH_CONTENT);
    (root.BVC_PASSAGE_RESEARCH_CONTENT || []).forEach(function (d) { all.push(d); });
    return all.filter(function (d) {
      if (!valid(d)) return false;
      var key = d.passage.book + "-" + d.passage.chapter + ":" + (d.passage.v1 || "") + "-" + (d.passage.chapterEnd || d.passage.chapter) + ":" + (d.passage.v2 || "");
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  // 연구 범위는 단락(pericope) 단위다: passage = {book, chapter, v1, v2} 이고, 장 경계를 넘으면 chapterEnd 를 더한다(v2 는 chapterEnd 의 끝 절).
  function endChapter(d) { return +d.passage.chapterEnd || +d.passage.chapter; }
  function touchesChapter(d, p) { return d.passage.book === p.book && p.chapter >= +d.passage.chapter && p.chapter <= endChapter(d); }
  function coversVerse(d, p) {
    if (!touchesChapter(d, p) || p.verse == null) return touchesChapter(d, p);
    if (p.chapter === +d.passage.chapter && p.verse < +d.passage.v1) return false;
    if (p.chapter === endChapter(d) && p.verse > +d.passage.v2) return false;
    return true;
  }
  // 성경 순서(시작 장 → 시작 절)로 정렬한다. 입력 순서에 의존하지 않는다.
  function biblicalOrder(a, b) { return (+a.passage.chapter - +b.passage.chapter) || (+a.passage.v1 - +b.passage.v1) || (endChapter(a) - endChapter(b)) || (+a.passage.v2 - +b.passage.v2); }
  function recordsForChapter(p) { return p ? records().filter(function (d) { return touchesChapter(d, p); }).sort(biblicalOrder) : []; }
  function recordsForVerse(p) { return p && p.verse != null ? records().filter(function (d) { return coversVerse(d, p); }).sort(biblicalOrder) : []; }
  // 같은 절을 둘 이상의 연구가 덮는 경우를 보고한다(읽기 전용). 자동으로 어느 쪽도 승인·우선하지 않는다.
  function conflicts() {
    var rs = records().sort(biblicalOrder), out = [];
    for (var i = 0; i < rs.length; i++) for (var j = i + 1; j < rs.length; j++) {
      var a = rs[i], b = rs[j];
      if (a.passage.book !== b.passage.book) continue;
      var aS = +a.passage.chapter * 1000 + +a.passage.v1, aE = endChapter(a) * 1000 + +a.passage.v2;
      var bS = +b.passage.chapter * 1000 + +b.passage.v1, bE = endChapter(b) * 1000 + +b.passage.v2;
      if (aS <= bE && bS <= aE) out.push({ a: a.researchId, b: b.researchId, book: a.passage.book });
    }
    return out;
  }
  function dataFor(p) {
    if (!p) return null;
    var rs = records();
    if (p.verse != null) {   // 절이 지정되면 그 절을 정확히 덮는 단락 연구만. 범위 밖이면 null, 둘 이상이 덮으면(충돌) 임의 선택하지 않고 null.
      var cov = recordsForVerse(p);
      if (cov.length === 1) return cov[0];
      if (cov.length > 1) return null;
    } else {
      var chap = recordsForChapter(p);
      if (chap.length) return chap[0];
    }
    // Explicit local review preview: same approved Reader UI, but no candidate is added to records()/Registry.
    // Default JudeBible remains approved-only. This branch is never a professional approval.
    if (/[?&]qa=research-review(?:&|$)/.test(root.location && root.location.search || "")) {
      var candidates = root.BVC_PASSAGE_RESEARCH_CONTENT || [];
      for (var j=0; j<candidates.length; j++) {
        var c=candidates[j];
        if (c && c.passage && c.passage.book===p.book && +c.passage.chapter===p.chapter && (p.verse==null || coversVerse(c,p)) &&
            c.projectionStatus==="INTERNAL_READER_PROJECTION" && c.externalRelease==="NOT_AUTHORIZED" &&
            (c.professionalStatus==="CANDIDATE_REVIEW_ONLY" || c.professionalStatus==="QUALITY_PASS_WITH_VERIFY_STAGE_HOLD")) return c;
      }
    }
    return null;
  }

  function sectionFor(d, v, chapterOf) {
    if (!d) return null;
    chapterOf = chapterOf == null ? +d.passage.chapter : chapterOf;
    var sections = readerModel(d).commentary.sections;
    for (var i = 0; i < sections.length; i++) {
      if (v >= sections[i].v1 && v <= sections[i].v2 && (sections[i].c1 == null || sections[i].c1 === chapterOf)) return sections[i];
    }
    return null;
  }

  // Existing chapter records keep their current fields. Optional Project04 output may add
  // readerLayers, but it is accepted only after Project01 professional approval (valid()).
  // This adapter changes presentation shape only and deliberately retains every source array.
  function readerModel(d) {
    var layers = d && d.readerLayers || {}, glance = layers.glance || {}, commentary = layers.commentary || {}, deep = layers.deepResearch || {};
    return {
      glance: {
        overview: glance.overview || d.overview || [],
        centralMessage: glance.centralMessage || d.centralMessage || "",
        quickFacts: glance.quickFacts || [],
        structure: glance.structure || d.literaryStructure || []          // [{v1,v2,title,summary?}] 본문의 문학적 구조·앞뒤 문맥
      },
      commentary: { sections: commentary.sections || d.sections || [] },
      deepResearch: {
        discoveries: deep.discoveries || d.discoveries || [],
        lexicalCards: deep.lexicalCards || d.lexicalCards || [],
        cautions: deep.cautions || d.cautions || [],
        canonicalLinks: deep.canonicalLinks || d.canonicalLinks || [],
        synthesis: deep.synthesis || d.theologicalSynthesis || [],         // 정경적 연결 및 신학적 종합 (문단 배열)
        alternatives: deep.alternatives || d.alternativeReadings || [],     // [{title, paragraphs[]}] 실제 중요한 대안 해석/불확실성
        related: deep.related || d.relatedResearch || []                    // [{kind:"passage|person|era|place", label, ref?}] 관련 연구 이동(표시용 포인터)
      },
      sourceRelation: {
        researchId: d.researchId,
        sourceSha256: d.sourceSha256,
        projectionStatus: d.projectionStatus,
        professionalStatus: d.professionalStatus,
        qualityStatus: d.qualityStatus || "",
        externalRelease: d.externalRelease,
        generatedByProject: d.generatedByProject || d.promptFactoryProject || "01_목회연구_WORBS_BICS",
        professionalAuthorityOwner: d.professionalAuthorityOwner || "01_목회연구_WORBS_BICS"
      }
    };
  }

  function preservationAudit(d) {
    var m = readerModel(d), layers = d && d.readerLayers || {}, deep = layers.deepResearch || {};
    var src = {
      overview: layers.glance && layers.glance.overview || d.overview || [],
      sections: layers.commentary && layers.commentary.sections || d.sections || [],
      discoveries: deep.discoveries || d.discoveries || [],
      lexicalCards: deep.lexicalCards || d.lexicalCards || [],
      cautions: deep.cautions || d.cautions || [],
      canonicalLinks: deep.canonicalLinks || d.canonicalLinks || []
    };
    var dst = { overview:m.glance.overview, sections:m.commentary.sections, discoveries:m.deepResearch.discoveries, lexicalCards:m.deepResearch.lexicalCards, cautions:m.deepResearch.cautions, canonicalLinks:m.deepResearch.canonicalLinks };
    var fields = Object.keys(src), lost = fields.filter(function(k){ return JSON.stringify(src[k]) !== JSON.stringify(dst[k]); });
    var counts = {}; fields.forEach(function(k){ counts[k] = src[k].length; });
    return { ok: lost.length === 0 && !!m.sourceRelation.researchId && !!m.sourceRelation.sourceSha256, lost: lost, counts: counts, sourceRelation: m.sourceRelation };
  }

  function verse(ref) {
    var p = parseRef(ref), d = dataFor(p);
    if (!d || p.verse == null || !coversVerse(d, p)) return null;
    return { type: "VERSE_WORBS", ref: ref, verse: p.verse, section: sectionFor(d, p.verse, p.chapter), researchId: d.researchId };
  }

  function passage(pid) {
    var p = parseRef(pid), d = dataFor(p);
    return d && p.verse == null ? { type: "PASSAGE_WORBS", ref: pid, researchId: d.researchId } : null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // 연구 원문을 변환하는 과정에서 섞인 마크다운 잔재(구분선 ---, "# 제목" 줄, Project01 내부 메모 줄)는 독자 화면에 내지 않는다.
  function isDocArtifact(t) {
    var s = String(t == null ? "" : t).trim();
    return !s || /^([-*_]\s*){3,}$/.test(s) || /^#{1,6}\s/.test(s) || (/Project01/.test(s) && /(내부|비노출|QA 데이터)/.test(s));
  }
  function readerParagraphs(items) { return (items || []).filter(function (t) { return !isDocArtifact(t); }); }

  function addParagraphs(parent, items, cls) {
    readerParagraphs(items).forEach(function (t) { parent.appendChild(el("p", cls || "rp-commentary-p", t)); });
  }

  function addHeading(parent, title) {
    parent.appendChild(el("h4", "rp-subhead", title));
  }

  function renderOverview(box, d, model) {
    var sec = el("section", "rp-reader-section rp-overview");
    sec.setAttribute("data-reader-tier", "glance");
    addHeading(sec, "훑어보기");
    addParagraphs(sec, model.glance.overview);
    var center=String(model.glance.centralMessage||"").trim();
    var overviewText=(model.glance.overview||[]).join(" ").trim();
    if(center && center!==overviewText && !(overviewText.indexOf(center)>=0)){
      var core=el("div","rp-central");
      core.appendChild(el("strong","rp-central-label","핵심 메시지"));
      core.appendChild(el("p","rp-commentary-p",center));
      sec.appendChild(core);
    }
    box.appendChild(sec);
  }

  function rangeLabel(x) { return x.v1 == null ? "" : (x.v1 === x.v2 ? x.v1 + "절" : x.v1 + "–" + x.v2 + "절") + " · "; }
  function renderStructure(box, model) {
    var rows = (model.glance.structure || []).filter(function (x) { return x && (x.title || x.summary); });
    if (!rows.length) return;
    var sec = el("section", "rp-reader-section rp-structure");
    sec.setAttribute("data-reader-tier", "glance");
    addHeading(sec, "문학적 구조");
    var ol = el("ol", "rp-structure-list");
    rows.forEach(function (x) { var li = el("li", null); li.appendChild(el("strong", null, rangeLabel(x) + (x.title || ""))); if (x.summary) li.appendChild(el("span", "rp-lex-meta", " " + x.summary)); ol.appendChild(li); });
    sec.appendChild(ol); box.appendChild(sec);
  }
  // 설계서 섹션용 문단 정리: 기존 readerParagraphs(잔재 제거)가 있으면 그것을, 없으면 빈 문단만 거른다.
  function blueprintParas(a) { return typeof readerParagraphs === "function" ? readerParagraphs(a) : (a || []).filter(function (t) { return String(t == null ? "" : t).trim(); }); }
  function renderSynthesis(box, model) {
    var ps = blueprintParas(model.deepResearch.synthesis);
    if (!ps.length) return;
    var sec = el("section", "rp-reader-section rp-synthesis");
    addHeading(sec, "신학적 종합");
    ps.forEach(function (t) { sec.appendChild(el("p", "rp-commentary-p", t)); });
    box.appendChild(sec);
  }
  function renderAlternatives(box, model) {
    var rows = (model.deepResearch.alternatives || []).filter(function (x) { return x && (x.title || blueprintParas(x.paragraphs).length); });
    if (!rows.length) return;
    var sec = el("section", "rp-reader-section rp-alternatives");
    addHeading(sec, "다른 해석과 불확실성");
    rows.forEach(function (x) { var c = el("article", "rp-discovery"); if (x.title) c.appendChild(el("h5", "rp-section-title", x.title)); blueprintParas(x.paragraphs).forEach(function (t) { c.appendChild(el("p", "rp-commentary-p", t)); }); sec.appendChild(c); });
    box.appendChild(sec);
  }
  function renderRelated(box, model) {
    var rows = (model.deepResearch.related || []).filter(function (x) { return x && x.label; }), kinds = { passage: "본문", person: "인물", era: "시대", place: "장소" };
    if (!rows.length) return;
    var sec = el("section", "rp-reader-section rp-related");
    addHeading(sec, "이어서 연구하기");
    var ul = el("ul", "rp-caution-list");
    rows.forEach(function (x) { var li = el("li", null, (kinds[x.kind] ? kinds[x.kind] + " · " : "") + x.label + (x.ref ? " (" + x.ref + ")" : "")); li.setAttribute("data-related-kind", x.kind || ""); ul.appendChild(li); });
    sec.appendChild(ul); box.appendChild(sec);
  }

  function renderSection(box, s, currentVerse) {
    if (!s) return;
    var sec = el("section", "rp-reader-section rp-commentary");
    sec.setAttribute("data-reader-tier", "commentary");
    addHeading(sec, "살펴보기");
    var title = s.v1 === s.v2 ? s.v1 + "절 · " + s.title : s.v1 + "–" + s.v2 + "절 · " + s.title;
    sec.appendChild(el("h5", "rp-section-title", title));
    addParagraphs(sec, s.paragraphs);
    if (currentVerse != null && (currentVerse < s.v1 || currentVerse > s.v2)) sec.hidden = true;
    box.appendChild(sec);
  }

  function renderAllSections(box, d) {
    var sec = el("section", "rp-reader-section rp-commentary");
    sec.setAttribute("data-reader-tier", "commentary");
    addHeading(sec, "살펴보기");
    readerModel(d).commentary.sections.forEach(function (s, i) {
      var unit = el("div", "rp-unit");
      unit.appendChild(el("span", "rp-unit-number", String(i + 1)));
      unit.appendChild(el("h5", "rp-section-title", (s.v1 === s.v2 ? s.v1 + "절" : s.v1 + "–" + s.v2 + "절") + " · " + s.title));
      addParagraphs(unit, s.paragraphs);
      sec.appendChild(unit);
    });
    box.appendChild(sec);
  }

  function renderDiscoveries(box, d) {
    var rows = readerModel(d).deepResearch.discoveries, labels = { original_language:"핵심 원어", literary:"문학적 발견", history:"역사·문화", geography:"지리", canonical:"정경적 연결", theology:"신학적 발견" };
    if (!rows.length) return;
    var sec = el("section", "rp-reader-section rp-discoveries");
    // Topic titles carry the meaning; do not repeat generic discovery headings.
    rows.forEach(function(x){
      var rawBody = x.paragraphs || x.body || (x.note ? [x.note] : []); if (!Array.isArray(rawBody)) rawBody = [rawBody];
      if (!x.title && !readerParagraphs(rawBody).length) return;   // 잔재 문단뿐인 카드는 만들지 않는다
      var card = el("article", "rp-discovery");
      card.setAttribute("data-discovery-id", x.id || ""); card.setAttribute("data-discovery-domain", x.domain || "");
      if (!x.title) card.appendChild(el("p", "rp-discovery-domain", labels[x.domain] || x.domain || "연구"));
      if (x.title && !/^(더 깊은 연구|심화 설명|신학적 발견|핵심 연구 발견)$/.test(x.title)) card.appendChild(el("h5", "rp-section-title", x.title));
      var body = x.paragraphs || x.body || (x.note ? [x.note] : []); if (!Array.isArray(body)) body = [body];
      addParagraphs(card, body);
      var evidence = x.evidence || []; if (!Array.isArray(evidence)) evidence = [evidence];
      if (evidence.length) card.appendChild(el("p", "rp-lex-meta", "근거 · " + evidence.join(" · ")));
      if (x.certainty) card.appendChild(el("p", "rp-lex-meta", "확실성 · " + x.certainty));
      sec.appendChild(card);
    });
    box.appendChild(sec);
  }

  function renderLexical(box, d, currentVerse, currentChapter) {
    var cards = (d.lexicalCards || []).filter(function (c) { return currentVerse == null || (+c.verse === currentVerse && (c.chapter == null || currentChapter == null || +c.chapter === currentChapter)); });
    if (!cards.length) return;
    var sec = el("section", "rp-reader-section rp-lexical");
    addHeading(sec, "핵심 원어 카드");
    cards.forEach(function (c) {
      var card = el("article", "rp-lex-card");
      var head = el("div", "rp-lex-head");
      head.appendChild(el("span", "rp-lex-form", c.form || c.lemma || ""));
      var info = el("div", "rp-lex-info");
      if (c.pronunciation || c.transliteration) info.appendChild(el("span", "rp-lex-reading", c.pronunciation || c.transliteration));
      if (c.gloss) info.appendChild(el("strong", "rp-lex-gloss", c.gloss));
      head.appendChild(info);
      card.appendChild(head);
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

  function renderSourceRelation(box, d) {
    var m = readerModel(d), s = m.sourceRelation, details = el("details", "rp-source-relation");
    details.setAttribute("data-research-id", s.researchId); details.setAttribute("data-source-sha256", s.sourceSha256);
    details.appendChild(el("summary", null, "연구 원본과 Reader 관계"));
    var body = el("div", "rp-source-relation-body");
    body.appendChild(el("p", "rp-lex-meta", "연구 원본 · " + s.researchId));
    body.appendChild(el("p", "rp-lex-meta", "Reader · " + (d.professionalStatus === "STAGE_APPROVED" || d.professionalStatus === "STAGE_APPROVED_WITH_VERIFY" ? "승인된 연구 의미를 보존하는 앱 내부 투영" : "검수용 후보 연구 미리보기 · 정식 승인 대표본 아님")));
    body.appendChild(el("p", "rp-lex-meta", "전문 의미 권위 · " + s.professionalAuthorityOwner));
    body.appendChild(el("p", "rp-lex-meta", "승인 범위 · " + (s.externalRelease === "NOT_AUTHORIZED" ? "앱 내부 사용 · 외부 공개 미승인" : s.externalRelease)));
    details.appendChild(body); box.appendChild(details);
  }

  function render(box, ref) {
    var p = parseRef(ref), d = dataFor(p);
    box.textContent = "";
    if (!d || !p || (p.verse != null && !coversVerse(d, p))) {
      box.hidden = true;
      box.setAttribute("data-state", "UNAVAILABLE");
      return Promise.resolve(false);
    }

    box.hidden = false;
    box.setAttribute("data-state", "SHOWN");
    box.setAttribute("data-research-id", d.researchId);
    box.setAttribute("data-projection-status", d.projectionStatus);
    box.setAttribute("data-quality-status", d.qualityStatus || "");
    box.setAttribute("data-reader-contract", "THREE_TIER_WORBS_READER_v1");
    box.setAttribute("data-preservation-audit", preservationAudit(d).ok ? "PASS" : "FAIL_CLOSED");

    box.classList.add("rp-editorial-reader");
    var head = el("div", "rp-head rp-reader-head");
    head.appendChild(el("strong", "rp-title", d.title));
    box.appendChild(head);



    var model = readerModel(d);
    var nav = el("nav", "rp-reading-nav"); nav.setAttribute("aria-label", "본문연구 목차");
    var targets=[["overview","훑어보기",".rp-overview"],["commentary","살펴보기",".rp-commentary"],["deep","깊게보기",".rp-deep-research"]];
    targets.forEach(function(t,i){var btn=el("button","rp-reading-link");btn.type="button";btn.dataset.readerTarget=t[0];btn.setAttribute("aria-label",t[1]+"로 이동");btn.setAttribute("aria-current",i===0?"location":"false");btn.appendChild(el("span","rp-reading-horizontal",t[1]));btn.addEventListener("click",function(){var dest=box.querySelector(t[2]);if(dest){var host=box.closest("#panel");if(host){var pos=host.scrollTop+dest.getBoundingClientRect().top-host.getBoundingClientRect().top-10;host.scrollTo({top:pos,behavior:"smooth"});}else dest.scrollIntoView({behavior:"smooth",block:"start"});nav.querySelectorAll(".rp-reading-link").forEach(function(b){b.setAttribute("aria-current",b===btn?"location":"false");});}});nav.appendChild(btn);});
    var scrollHost=box.closest("#panel")||box.parentElement;
    if(scrollHost){var ticking=false;scrollHost.addEventListener("scroll",function(){if(ticking||!box.isConnected)return;ticking=true;requestAnimationFrame(function(){ticking=false;var chosen=0,edge=scrollHost.getBoundingClientRect().top+85;targets.forEach(function(t,i){var sec=box.querySelector(t[2]);if(sec&&sec.getBoundingClientRect().top<=edge)chosen=i;});nav.querySelectorAll(".rp-reading-link").forEach(function(b,i){b.setAttribute("aria-current",i===chosen?"location":"false");});});},{passive:true});}
    var chapterRecs = p.verse == null ? recordsForChapter(p) : [d];
    if (p.verse == null && chapterRecs.length > 1) {   // 한 장에 단락 연구가 여럿이면 장 보기는 단락 순서대로 이어 붙인다(장 메시지는 단락 관계로 읽는다)
      chapterRecs.forEach(function (rd) { var rm = readerModel(rd); box.appendChild(el("h3", "rp-pericope-title", (rd.passage.ref || rd.title))); renderOverview(box, rd, rm); renderStructure(box, rm); renderAllSections(box, rd); });
    } else {
    renderOverview(box, d, model);
    renderStructure(box, model);
    if (p.verse == null) renderAllSections(box, d);
    else {
      renderSection(box, sectionFor(d, p.verse, p.chapter), p.verse);
      model.commentary.sections.forEach(function(s) {
        if (s.id === 'gen' + d.passage.chapter + '-depth-delta') renderSection(box, s, p.verse);
      });
    }
    }
    // 깊게보기는 장 보기에서도 모든 단락 연구의 것을 빠짐없이 보여 준다(성경 순서).
    function renderDeep(rd, titled) {
      var rm = readerModel(rd);
      var deep = el("section", "rp-deep-research");
      deep.setAttribute("data-reader-tier", "deep-research");
      deep.setAttribute("data-research-id", rd.researchId);
      deep.appendChild(el("h4", "rp-deep-summary", "깊게보기"));
      if (titled) deep.appendChild(el("h5", "rp-pericope-title", rd.passage.ref || rd.title));
      var deepBody = el("div", "rp-deep-body");
      renderDiscoveries(deepBody, rd);
      renderLexical(deepBody, { lexicalCards: rm.deepResearch.lexicalCards }, p.verse, p.chapter);
      renderCanonical(deepBody, { canonicalLinks: rm.deepResearch.canonicalLinks });
      renderSynthesis(deepBody, rm);
      renderCautions(deepBody, { cautions: rm.deepResearch.cautions });
      renderAlternatives(deepBody, rm);
      renderRelated(deepBody, rm);
      deep.appendChild(deepBody); box.appendChild(deep);
    }
    if (p.verse == null && chapterRecs.length > 1) chapterRecs.forEach(function (rd) { renderDeep(rd, true); });
    else renderDeep(d, false);
    // Reader source/QA lineage is retained in data attributes, never displayed to readers.
    // Reuse the current panel stack as the navigation host, never add a standalone UI.
    var stack=box.closest(".panel-stack");
    if(stack){var old=stack.querySelector(":scope > .rp-reading-nav");if(old)old.remove();stack.appendChild(nav);}else box.appendChild(nav);

    if (d.qualityStatus === "PASS_WITH_VERIFY") {
      var note = el("p", "rp-verify-note", "이 연구에는 해석이 나뉘거나 추가 확인이 필요한 부분이 있습니다. 해당 내용은 본문 설명에서 구분하여 안내합니다.");
      note.setAttribute("data-quality-status", "PASS_WITH_VERIFY");
      box.appendChild(note);
    }

    return Promise.resolve(true);
  }

  root.BVCVerseResearchProjection = {
    PIN: PIN,
    records: records,
    passage: passage,
    verse: verse,
    render: render,
    ready: function () { return records().length > 0; },
    recordFor: function (ref) { return dataFor(parseRef(ref)); },
    conflicts: conflicts,
    readerModel: readerModel,
    preservationAudit: preservationAudit,
    valid: valid,
    approvalClass: approvalClass
  };
})(typeof window !== "undefined" ? window : globalThis);
