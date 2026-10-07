# VERIFIED Korean vs TBES — synonym-aware reconciliation — 2026-10-06

Task: `RECONCILE_EXISTING_VERIFIED_KOREAN_GLOSSES_AGAINST_TBES_WITH_SYNONYM_AWARE_CLASSIFICATION`

Verdict: `CLASSIFIED__LEDGERS_AND_PRODUCTION_UNCHANGED`

Principle adopted: a difference between the external source and the existing Korean does not trigger re-review. Only a case where meaning actually differs does.

## What was classified

Every already-VERIFIED entry whose legacy English gloss shares no word with the TBES gloss: **Hebrew 2,272, Greek 334**. The figures in the previous report (2,199 / 338) were counted before a stemming fix (`king` was being cut to `k`), so they were slightly off. No row was read by hand; the rules below decided every row.

## Rules (`lexicon/reconcile.js`, first match wins)

| class | evidence | action |
|---|---|---|
| `CONFLICT_KO_FORMAT`, `CONFLICT_POLARITY` | Korean malformed, or Korean adds/drops a negation that neither English side carries | precise review |
| `EQUIVALENT_EXPRESSION` | same word after normalization: spelling variant, compound, pronoun, name transliteration, function-word gloss | keep VERIFIED |
| `EQUIVALENT_SYNONYM` | WordNet same-synset or derivational/similar link; or listed together in ≥3 independent dictionary lists; or the Korean sense is already used by entries glossed with the TBES word | keep VERIFIED |
| `EQUIVALENT_NAME_KRV` | the Korean name appears in ≥50% of the KRV verses where the lemma occurs | keep VERIFIED |
| `RANGE_DIFFERENCE` | TBES word lies inside the same entry's extended definition (Strong's meaning/usage; TBESG Abbott-Smith; Dodson), or WordNet hypernym/sister, or a 2-list synonym | keep VERIFIED + review flag |
| `CONFLICT_CANDIDATE` | no link found by any of the above | precise review |

`CONFLICT_CANDIDATE` means "automation found no link", not "proven wrong". Some of those are still unmatched synonyms (for example comely/lovely, sight/visibility), so the precise queue is an upper bound.

## Result

| | Hebrew | Greek |
|---|---:|---:|
| diverging VERIFIED entries | 2,272 | 334 |
| **keep VERIFIED** (expression 348 / synonym 361 / name 12; Greek 74 / 87 / 0) | **721** | **161** |
| **keep VERIFIED + review flag** (range difference) | **1,076** | **98** |
| **precise review queue** (no link 449 + polarity 26 = 475; Greek 72 + 3) | **475** (20.9%) | **75** (22.5%) |
| tokens on the queue entries | 3,349 | 202 |
| tokens on kept entries (no flag / flagged) | 27,767 / 26,038 | 24,524 / 489 |
| of the queue: theological-sensitive / POS-class conflict | 17 / 12 | 2 / 0 |

The queue is mostly rare words (3,349 Hebrew tokens against 53,805 on the entries kept), so the remaining review load is small in practice. The 18 Hebrew polarity/theological-flagged rows deserve a first look.

## Evidence sources and limits

- Princeton WordNet 3.1 via npm `wordnet-db` 3.1.14 (MIT packaging), downloaded with Captain approval to `tools/original-language/_cache/wordnet/`, sha256 in `lexicon/wordnet.lock.json`. It is classification evidence only: not shipped, not a gloss source.
- Strong's definitions (`HebrewStrong.xml`, a reference-only file in the lock) and TBESG `Meaning` (Abbott-Smith) are read for classification only. TBESH `Meaning` is still not read.
- WordNet is English-general, so biblical and archaic senses are partly missed; function words and rare technical terms get the weakest coverage.

## Not changed

No ledger write (sha256 of both `*-gloss-ko.review.json` identical before and after), no `expected.json`, no staging rebuild, no bind; `data/original-language/` untouched. The review flag is recorded only in the output TSVs, not in the ledger.

## Files

`lexicon/reconcile.js`, `lexicon/wordnet.js`, `lexicon/wordnet.lock.json`, `tests/reconcile.test.js` (8 tests), `inputs/reconciliation/{hebrew,greek}.verified-vs-tbes.tsv` (id, tbes, headword, tbesGloss, legacyEn, koVerified, freq, class, action, posConflict, theological, evidence), `verification/reconcile-verified-vs-tbes-report.json`.

Commands: `node lexicon/reconcile.js report [--sample]|export`, `node tests/reconcile.test.js`.
