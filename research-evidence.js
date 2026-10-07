/* JudeBible research-evidence consumer (thin integration layer; no UI, no data of its own).
 * One namespace: window.BVCResearchEvidence = { resolve, RELATIONS, HOLD_REASONS, EVIDENCE_HIERARCHY }.
 * Authority: WORBS decides the relation; Hebrew/Greek tokens are lexical evidence; this module only checks that the evidence the relation needs is present and usable,
 * then returns a projection CANDIDATE. It never classifies, upgrades, downgrades or invents a relation, never searches tokens, never writes the Scripture Index.
 * Source evidence is read only through window.BVCOriginalLanguage.getVerse (no second loader, no second read path).
 * EVIDENCE_HOLD is a status, not a relation: { status:"EVIDENCE_HOLD", relation:null, evidenceStatus:"HOLD", reason }.
 */
(function (root) {
  "use strict";
  var RELATIONS = ["DM_NAME", "DM_PRONOUN_CONTINUATION", "STRONGLY_RELATED", "DIRECT_EVENT"];
  var EVIDENCE_HIERARCHY = ["RAW_SURFACE_MATCH", "NORMALIZED_SURFACE_MATCH", "LEMMA_MATCH", "BASIC_LEXICAL_CLASS", "WORBS_RESEARCH_CLASSIFICATION"];
  var HOLD_REASONS = ["BAD_INPUT", "RELATION_NOT_IN_VOCABULARY", "NO_WORBS_CLASSIFICATION", "WORBS_NOT_APPROVED", "UPSTREAM_HOLD", "REFERENCE_MAP_HOLD", "UNRESOLVED_SPLIT_MERGE", "SOURCE_UNAVAILABLE", "SOURCE_NAME_TOKEN_MISSING", "SOURCE_TOKEN_UNAVAILABLE", "MACULA_X", "GREEK_U", "ANALYSIS_UNAVAILABLE", "NOT_PROPER_NAME_EVIDENCE", "LEMMA_MISMATCH"];

  function create(env) {
    function hold(input, reason, extra) {
      var o = { status: "EVIDENCE_HOLD", relation: null, evidenceStatus: "HOLD", reason: reason, entityId: input && input.entityId != null ? input.entityId : null, scriptureRef: input && typeof input.scriptureRef === "string" ? input.scriptureRef : null, evidence: [], productionWrite: false };
      if (extra) for (var k in extra) o[k] = extra[k];
      return o;
    }
    // basic lexical class only (proper name or not); no morphology decoding beyond that
    function properName(corpus, lemma, morph) {
      var i, segs, ls;
      if (corpus === "OSHB") {                                      // OSHB morph "HNp", "HR/Np": one segment per prefix, lemma segments aligned
        segs = String(morph).replace(/^[HA]/, "").split("/"); ls = String(lemma).split("/");
        for (i = 0; i < segs.length; i++) if (segs[i] === "Np") return { yes: true, lemma: ls.length === segs.length ? ls[i] : lemma };
        return { yes: false, lemma: ls[ls.length - 1] };
      }
      var c = String(lemma).charAt(0);                              // SBLGNT: noun morph + capitalised lemma (N-PRI, or declined names such as Ἰούδας)
      return { yes: /^N-/.test(morph) && c !== c.toLowerCase(), lemma: lemma };
    }
    // one evidence ref "gen-21:3:12" (source verse + 1-based token index) -> entry; blocking problems are returned as .hold
    function inspect(ref, res) {
      var tokenId = typeof ref === "string" ? ref : ref && ref.tokenId, want = ref && typeof ref === "object" ? ref.lemma : null;
      var m = typeof tokenId === "string" && /^([a-z0-9]+-\d+:\d+):(\d+)$/.exec(tokenId);
      if (!m) return { hold: "SOURCE_TOKEN_UNAVAILABLE", tokenId: tokenId };
      var at = res.sourceRefs.indexOf(m[1]);
      if (at < 0) return { hold: "SOURCE_TOKEN_UNAVAILABLE", tokenId: tokenId };          // token is not in the verse the reference map resolved to
      var v = res.verses[at], i = +m[2] - 1, t = v.t[i], a = v.a[i];
      if (!t) return { hold: "SOURCE_TOKEN_UNAVAILABLE", tokenId: tokenId };
      var entry = { tokenId: tokenId, sourceRef: m[1], surface: t[0], corpus: res.corpus };
      if (!a) {                                                    // no analysis: MACULA X / Greek U / otherwise unavailable
        var st = v.x && v.x[i + 1];
        entry.analysis = st === "X" || st === "U" ? st : "UNAVAILABLE";
        return { hold: st === "X" ? "MACULA_X" : st === "U" ? "GREEK_U" : "ANALYSIS_UNAVAILABLE", tokenId: tokenId, entry: entry };
      }
      var lemma = res.dict.lemma[a[0]], morph = res.dict.morph[a[1]], pn = properName(res.corpus, lemma, morph);
      entry.analysis = "AVAILABLE"; entry.lemma = lemma; entry.morph = morph; entry.lexicalClass = pn.yes ? "PROPER_NAME" : "OTHER";
      entry.reachedLevel = pn.yes ? "BASIC_LEXICAL_CLASS" : "RAW_SURFACE_MATCH";
      if (want != null) {
        if (String(want).normalize("NFC") !== String(pn.lemma).normalize("NFC") && String(want).normalize("NFC") !== String(lemma).normalize("NFC")) return { hold: "LEMMA_MISMATCH", tokenId: tokenId, entry: entry };
        if (!pn.yes) entry.reachedLevel = "LEMMA_MATCH";
      }
      return { entry: entry };
    }
    function resolve(input) {
      try {
        if (!input || typeof input !== "object" || typeof input.scriptureRef !== "string" || !/^[a-z0-9]+-\d+:\d+$/.test(input.scriptureRef)) return Promise.resolve(hold(input, "BAD_INPUT"));
        var rel = input.relation == null ? null : input.relation, refs = Array.isArray(input.evidenceRefs) ? input.evidenceRefs : [];
        if (input.hold) return Promise.resolve(hold(input, "UPSTREAM_HOLD", { upstream: String(input.hold) }));     // an upstream HOLD is carried, never overridden
        if (rel === null) return Promise.resolve(hold(input, "NO_WORBS_CLASSIFICATION"));                           // lexical evidence alone never creates a relation
        if (RELATIONS.indexOf(rel) < 0) return Promise.resolve(hold(input, "RELATION_NOT_IN_VOCABULARY"));
        if (input.approved !== true) return Promise.resolve(hold(input, "WORBS_NOT_APPROVED"));
        var needs = rel === "DM_NAME";                              // only DM_NAME needs source-language evidence; the other three are WORBS classification as is
        if (!needs && !refs.length) return Promise.resolve(ready(input, rel, [], "NOT_REQUIRED"));
        if (needs && !refs.length) return Promise.resolve(hold(input, "SOURCE_NAME_TOKEN_MISSING"));               // e.g. KRV names the entity but the source has no name token
        var OL = env.original && env.original();
        if (!OL || typeof OL.getVerse !== "function") return Promise.resolve(needs ? hold(input, "SOURCE_UNAVAILABLE") : ready(input, rel, [], "NOT_REQUIRED"));
        return OL.getVerse(input.scriptureRef).then(function (res) {
          var out = [], blocked = null, i, r;
          if (!res || res.status !== "OK") {
            if (!needs) return ready(input, rel, [], "NOT_REQUIRED", [{ note: "SOURCE_EVIDENCE_NOT_USED", source: res && res.status, detail: res && (res.reason || res.code) }]);
            return hold(input, res && res.status === "HOLD" ? "REFERENCE_MAP_HOLD" : "SOURCE_UNAVAILABLE", { source: res && (res.reason || res.code) || null });
          }
          if (res.boundary === "UNRESOLVED" && res.sourceRefs.length > 1) {
            if (needs) return hold(input, "UNRESOLVED_SPLIT_MERGE", { sourceRefs: res.sourceRefs.slice() });
            return ready(input, rel, [], "NOT_REQUIRED", [{ note: "SOURCE_EVIDENCE_NOT_USED", detail: "UNRESOLVED_SPLIT_MERGE" }]);
          }
          for (i = 0; i < refs.length; i++) { r = inspect(refs[i], res); if (r.entry) out.push(r.entry); if (r.hold && !blocked) blocked = r; }
          if (!needs) return ready(input, rel, out, "NOT_REQUIRED");        // supporting evidence is reported, never used to remove or alter a WORBS relation
          if (blocked) return hold(input, blocked.hold, { evidence: out, tokenId: blocked.tokenId });
          for (i = 0; i < out.length; i++) if (out[i].lexicalClass !== "PROPER_NAME") return hold(input, "NOT_PROPER_NAME_EVIDENCE", { evidence: out, tokenId: out[i].tokenId });
          return ready(input, rel, out, "VERIFIED");
        });
      } catch (e) { return Promise.resolve(hold(input, "BAD_INPUT", { message: e.message })); }
    }
    function ready(input, rel, evidence, evidenceStatus, diagnostics) {
      var o = { status: "READY", relation: rel, evidenceStatus: evidenceStatus, entityId: input.entityId != null ? input.entityId : null, scriptureRef: input.scriptureRef, authority: "WORBS", evidence: evidence, productionWrite: false };
      if (diagnostics) o.diagnostics = diagnostics;
      return o;
    }
    return { resolve: resolve, RELATIONS: RELATIONS.slice(), HOLD_REASONS: HOLD_REASONS.slice(), EVIDENCE_HIERARCHY: EVIDENCE_HIERARCHY.slice() };
  }

  if (root && root.document) root.BVCResearchEvidence = create({ original: function () { return root.BVCOriginalLanguage; } });
  if (typeof module !== "undefined" && module.exports) module.exports = { create: create };
})(typeof window !== "undefined" ? window : null);
