"use strict";
// Stage 5 — Scripture Entity Index builder. Reads the (read-only) KRV text and the approved PassageLinks.
// A verse is indexed only when (a) it lies inside a DIRECT_MENTION range of the record and (b) the record's
// canonical Korean name literally occurs in the KRV verse. Spans (char offsets) are stored so the app can verify
// the surface against the live text before it tags anything. STRONGLY_RELATED / CONTEXTUAL links are never tagged.
function build(rec, krv, opts) {
  const surface = rec.display_label, entries = {}, stats = { direct_ranges: 0, verses_in_ranges: 0, verses_tagged: 0, verses_without_surface: [], related_links_not_tagged: [] };
  for (const l of rec.passage_links) {
    const book = krv.books.find((b) => b.id === l.book), ch = book && book.chapters[l.chapter - 1];
    if (l.group !== "direct") { stats.related_links_not_tagged.push(l.book + "-" + l.chapter + (l.v1 ? ":" + l.v1 + (l.v2 > l.v1 ? "-" + l.v2 : "") : "")); continue; }
    stats.direct_ranges++;
    const from = l.v1 || 1, to = l.v2 || (ch ? ch.length : 0);
    for (let v = from; v <= to; v++) {
      stats.verses_in_ranges++;
      const text = ch[v - 1] || "", spans = []; let at = -1;
      while ((at = text.indexOf(surface, at + 1)) >= 0) spans.push([at, at + surface.length]);
      const key = l.book + "-" + l.chapter + ":" + v;
      if (!spans.length) { stats.verses_without_surface.push(key); continue; }
      (entries[key] = entries[key] || []).push({ stable_id: rec.stable_id, group: "direct", surface, spans });
      stats.verses_tagged++;
    }
  }
  return { meta: { kind: "ScriptureEntityIndex", schema: "JUDEBIBLE_CONTEXT_SCRIPTURE_INDEX_v0.1", generated_by: "tools/pipeline/run.js", record: rec.stable_id, research_id: rec.source_refs[0].id, source_sha256: rec.source_refs[0].sha256, translation: (krv.meta && krv.meta.translation && krv.meta.translation.abbr) || null, surface_rule: "canonical_name_ko literal match inside DIRECT_MENTION ranges only", krv_modified: false }, entries, stats };
}
// One index for all projected records: entries are merged per verse (record order), each entry keeps its own stable_id; the app trusts
// an entry only when its record's source hash matches the projection (meta.records).
function combine(parts, krv) {
  const entries = {}, stats = {};
  for (const p of parts) { for (const k of Object.keys(p.entries)) (entries[k] = entries[k] || []).push(...p.entries[k]); stats[p.record] = p.stats || null; }
  return { meta: { kind: "ScriptureEntityIndex", schema: "JUDEBIBLE_CONTEXT_SCRIPTURE_INDEX_v0.2", generated_by: "tools/pipeline/run.js", records: parts.map((p) => ({ record: p.record, research_id: p.research_id, source_sha256: p.source_sha256 })), translation: (krv.meta && krv.meta.translation && krv.meta.translation.abbr) || null, surface_rule: "canonical_name_ko literal match inside DIRECT_MENTION ranges only", krv_modified: false }, entries, stats };
}
module.exports = { build, combine };
