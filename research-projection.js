/* JudeBible verified-research projection (reader-facing; NOT an authority, NOT a Registry, NOT a classifier).
 * window.BVCResearchProjection = { verse, token, load, render, cta, ready }
 * Source of truth: the Project01 professional representative JBC_ISAAC_PERSON_PROFILE_WORBS_20261005_01 v1.0 (PROFESSIONAL_RESEARCH_PASS,
 * APPROVED_DOWNSTREAM_PROJECTION). data/research.projection.js is a locator index (research id + version + sha256 + per-verse class);
 * data/research.isaac.reader.js holds the display-safe reader text copied verbatim from the asset and is loaded only on demand.
 * - Fail closed: any mismatch of research id / version / sha256 / professional status / representative state -> no projection, no CTA.
 * - Relation class comes from the index only (WORBS). A lemma match alone never creates a CTA: a token is bound only when it is listed for a DM_NAME verse.
 * - Overlap (downstream rule): DM_NAME > DM_PRONOUN_CONTINUATION > STRONGLY_RELATED, one class per verse.
 * - Registry physical write stays HOLD; no stable_id is used or issued; external release is NOT_AUTHORIZED (this is in-app reading only).
 */
(function (root) {
  "use strict";
  var PIN = {
    researchId: "JBC_ISAAC_PERSON_PROFILE_WORBS_20261005_01", version: "v1.0",
    sha256: "e75c9378dab8794728edf4021aecb986cf285ec63818afa067330a059bc2bf66",
    assetType: "PERSON_PROFILE_WORBS", entityType: "PERSON", entityId: "ISAAC", primaryProjection: "PERSON_CARD",
    professionalStatus: "PROFESSIONAL_RESEARCH_PASS", representative: "CURRENT_PROJECT01_PROFESSIONAL_REPRESENTATIVE", downstream: "APPROVED_DOWNSTREAM_PROJECTION"
  };
  var LABEL = {   // reader wording for the three classes (paraphrase of the asset's section 3.1 definitions; UI labels, not research text)
    DM_NAME: "이삭의 이름이 직접 나오는 절",
    DM_PRONOUN_CONTINUATION: "이삭 서사가 이어지는 절",
    STRONGLY_RELATED: "이삭을 이해하는 데 깊이 관련된 절"
  };
  var FACT = { parents: "부모", spouse: "배우자", children: "자녀", half_brother: "이복형제", major_activity_regions: "주요 활동 지역", major_events: "주요 사건", theological_role: "신학적 역할" };
  var loading = null;

  function index() {
    var d = root.BVC_RESEARCH_PROJECTION, s = d && d.source;
    if (!s || !d.verses) return null;
    if (s.researchId !== PIN.researchId || s.version !== PIN.version || String(s.sha256).toLowerCase() !== PIN.sha256) return null;
    if (s.assetType !== PIN.assetType || s.entityType !== PIN.entityType || s.entityId !== PIN.entityId || s.primaryProjection !== PIN.primaryProjection) return null;
    if (!d.projection || d.projection.assetType !== "PERSON_PROFILE_WORBS" || d.projection.primary !== "PERSON_CARD" || d.projection.verseWorbsEligible !== false) return null;
    if (s.professionalStatus !== PIN.professionalStatus || s.representative !== PIN.representative || s.downstream !== PIN.downstream) return null;
    return d;
  }
  function verse(krvRef) {   // -> { cls, label, tokens[] } | null
    var d = index(), r = d && Object.prototype.hasOwnProperty.call(d.verses, krvRef) ? d.verses[krvRef] : null;
    if (!r || !LABEL[r.c]) return null;
    return { ref: krvRef, cls: r.c, label: LABEL[r.c], tokens: r.t || [] };
  }
  function token(krvRef, srcRef, i) {   // bound only for a listed token of a DM_NAME verse
    var v = verse(krvRef);
    if (!v || v.cls !== "DM_NAME" || !srcRef || i == null) return null;
    return v.tokens.indexOf(srcRef + "#" + i) >= 0 ? v : null;
  }
  function content() {
    var c = root.BVC_RESEARCH_CONTENT;
    if (!c || c.researchId !== PIN.researchId || c.version !== PIN.version || String(c.sha256).toLowerCase() !== PIN.sha256 || typeof c.summary !== "string") return null;
    return c;
  }
  function load() {   // static-script lazy load (same pattern as the original-language loader); resolves content or null
    if (!index()) return Promise.resolve(null);
    if (content()) return Promise.resolve(content());
    if (loading) return loading;
    loading = new Promise(function (res) {
      var s = document.createElement("script");
      s.src = "data/research.isaac.reader.js"; s.async = true;
      s.onload = function () { loading = null; res(content()); };
      s.onerror = function () { loading = null; res(null); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function renderPerson(box, relatedRef) {   // primary projection: Person Card. relatedRef is context metadata only.
    var d = index(), v = relatedRef ? verse(relatedRef) : null; box.textContent = "";
    if (!d) { box.hidden = true; return Promise.resolve(false); }
    box.hidden = false; box.setAttribute("data-state", "LOADING");
    box.appendChild(el("p", "rp-msg", "인물 연구를 불러오는 중입니다…"));
    return load().then(function (c) {
      if (!box.isConnected && !document.contains(box)) return false;
      box.textContent = "";
      if (!c || !index()) { box.hidden = true; box.setAttribute("data-state", "UNAVAILABLE"); return false; }
      var head = el("div", "rp-head"), dl = el("dl", "rp-facts"), i, f, row, d2 = index();
      head.appendChild(el("span", "rp-kind", "인물 · WORBS"));
      head.appendChild(el("strong", "rp-title", d2.subject.ko));
      box.appendChild(head);
      if (v) box.appendChild(el("p", "rp-rel", "관련 본문 " + relatedRef.replace(/^([a-z0-9]+)-(\d+):(\d+)$/, function (m, b, c2, v2) { return c2 + ":" + v2; }) + "절 · " + v.label));
      box.appendChild(el("p", "rp-summary", c.summary));
      for (i = 0; i < c.facts.length; i++) {
        f = c.facts[i]; if (!FACT[f.k]) continue;
        row = el("div", "rp-fact"); row.appendChild(el("dt", null, FACT[f.k])); row.appendChild(el("dd", null, Array.isArray(f.v) ? f.v.join(" · ") : f.v)); dl.appendChild(row);
      }
      box.appendChild(dl);
      if (c.note) box.appendChild(el("p", "rp-note", c.note));
      box.appendChild(el("p", "rp-src", "PERSON_PROFILE_WORBS · " + d2.source.researchId + " " + d2.source.version + " · 앱 내부 열람용(외부 공개 아님)"));
      box.setAttribute("data-state", "SHOWN");
      return true;
    });
  }
  function cta(krvRef) {   // related-verse/token access opens the Person Card; it never renders as verse WORBS.
    if (!verse(krvRef)) return null;
    var b = el("button", "btn ghost rp-cta", "이삭 인물카드 보기");
    b.type = "button"; b.setAttribute("data-research-id", PIN.researchId); b.setAttribute("data-projection-target", "PERSON_CARD");
    b.addEventListener("click", function () { if (root.BVC && root.BVC.selectRpPerson) root.BVC.selectRpPerson(krvRef); });
    return b;
  }
  function subject() { var d = index(); return d && d.subject && d.subject.ko || null; }
  root.BVCResearchProjection = { PIN: PIN, subject: subject, verse: verse, relation: verse, token: token, load: load, renderPerson: renderPerson, cta: cta, ready: function () { return !!index(); } };
})(typeof window !== "undefined" ? window : globalThis);
