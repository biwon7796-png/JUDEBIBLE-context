# THEOLOGICAL_SENSITIVE TBES gloss resolution — 2026-10-06

Task: `REVIEW_AND_RESOLVE_ALL_THEOLOGICAL_SENSITIVE_TBES_GLOSS_CANDIDATES_BY_FREQUENCY`

Verdict: `THEOLOGICAL_QUEUE_RESOLVED__STAGING_ONLY__PRODUCTION_NOT_BOUND`

## What was reviewed

All TBES entries routed to review for THEOLOGICAL_SENSITIVE: **Hebrew 346, Greek 285**. Every row was printed in token-frequency order with the TBES gloss, form, morph, legacy English/Korean, status and cross-check, and was decided one by one. Sheets: `inputs/review-log/theo-review-2026-10-06.{hebrew,greek}.sheet.tsv`; decisions: `….decisions.tsv`; the departures from the KEEP default are recorded in `inputs/review-log/_make_theo_decisions.js`.

Scope of a decision: the lemma-level basic meaning only. The TBES English `Gloss` is the source authority and is never edited. KEEP = gloss accepted and the existing Korean agrees. EDIT = gloss accepted, Korean re-aligned to the TBES gloss. HOLD = not promoted. No contextual or doctrinal interpretation was added; for example `ψυχή` is "생명, 영혼, 자신" and `θεόπνευστος` is "하나님이 숨을 불어넣은", not a theological reading.

The 19 rows that also sit in the reconciliation precise-review queue (Hebrew 17, Greek 2) were judged once and the decision is shared (`reconcileOverlap = yes` in the decision files). Hebrew: 1 HOLD, 13 EDIT, 3 KEEP. Greek: 2 KEEP.

## Result

| | Hebrew | Greek |
|---|---:|---:|
| reviewed | 346 | 285 |
| KEEP / EDIT / HOLD | 264 / 77 / 5 | 241 / 44 / 0 |
| tokens on the reviewed entries | 35,897 | 13,052 |
| tokens still held | 76 | 0 |
| **source-backed runtime candidates** | 8,024 → **8,365** (+341) | 4,120 → **4,405** (+285) |
| lemma-string coverage | 84.72% → **90.57%** | 75.85% → **81.13%** |
| **token coverage** | 72.15% → **83.83%** (+11.68 pt) | 54.78% → **64.30%** (+9.52 pt) |
| entries with Korean attached | 5,475 → 5,816 | 2,899 → 3,184 |

The held Hebrew entries are source-mismatch cases, not doctrine: H1389G (the common noun "hill" mapped to the name Gibeath-elohim), H4035 (TBES "fear" against OS "store-house"), H1784 (TBES "judge" on the gentilic Dinaite), H2309 (TBES "world" against OS "cessation") and H8293 (TBES "remnant" against OS "let loose").

Notable edits: H7541 רַקָּה is the temple of the head, so the earlier Korean 성전 would have been wrong (now 관자놀이). Several VERIFIED Korean glosses that did not match the TBES sense were re-aligned (for example H5633A סֶרֶן "tyrant" → "군주, 방백"; H0833 אָשַׁר "go straight" → "복되다고 하다, 인도하다"). The VERIFIED ledgers are unchanged: these edits live only in the decision files and the resolved export.

## Not done

No ledger write (sha256 of both `*-gloss-ko.review.json` unchanged), no `expected.json` change, no staging rebuild, no `build.js bind`; `data/original-language/` untouched. The 550 entries in the reconciliation queue outside this theological set are still pending. The reviewer is the model under Captain direction, not an independent human reviewer, so a human spot-check of the high-frequency rows (the top 30 per language) is advisable before any bind.

## Files

`lexicon/theo-resolve.js`, `tests/theo-resolve.test.js` (7 tests), `inputs/source-backed/{hebrew,greek}.theological-resolved.json`, `verification/theological-resolved-report.json`. Commands: `node lexicon/theo-resolve.js report|export`.
