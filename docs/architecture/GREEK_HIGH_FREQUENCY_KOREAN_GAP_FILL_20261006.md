# Greek high-frequency Korean gloss gap fill — 2026-10-06

Task: `FILL_HIGH_FREQUENCY_GREEK_KOREAN_GLOSS_GAPS_TO_90_PERCENT_TOKEN_COVERAGE`

Verdict: `GREEK_KOREAN_COVERAGE_90_5_PERCENT__STAGING_ONLY__PRODUCTION_NOT_REBOUND`

## What was done

Starting point: production Greek runtime (build `136b1ad94935ef23`) with Korean on 56.00% of tokens (76,760 / 137,063 analysed tokens). Extracted every TBESG-mapped entry without a VERIFIED Korean gloss, in token-frequency order: 3,306 entries covering 56,806 tokens. 90% needed 46,597 more tokens, which the top 474 entries reach (frequency 15 and up). The top **520** were reviewed row by row (frequency 14 and up) to leave a margin.

Basis: the TBESG English gloss. The existing Korean proposal was kept only where it agreed with that gloss (467 KEEP); 53 were re-aligned to the TBESG gloss (EDIT, for example ἐντολή "규례, 명령" → "계명, 명령", τρεῖς → "셋, 세", ἀρχή → "시작, 처음, 통치", πῦρ "불, 시련" → "불", οὗτος → "이, 이것, 이 사람"). Lemma-level basic meaning only; no contextual or doctrinal reading.

Untouched: lemma strings that are variant / conflict / unmapped (Greek 535), TBESG English, corpus, lemma binding, morphology, Strong mapping, and production. A TBES entry without a ledger key (71 entries, 506 tokens, including οὕτως) cannot be written and was skipped. 23 of the 520 entries carry a TBES variant-relation or POS-class label; their Korean is approved and the ledger stores `source_variant = retained`, with the TBES review codes unchanged.

Reviewer in the ledger: `CLAUDE_MODEL_ASSISTED_LEXICAL_REVIEW__GREEK_HIGH_FREQUENCY_GAP_FILL__CAPTAIN_DIRECTED_2026-10-06` (a model-assisted review, not an independent human review).

## Result

| | before | after |
|---|---:|---:|
| Greek VERIFIED entries | 1,558 | **2,078** (+520) |
| tokens with Korean (of 137,063) | 76,760 | **124,046** |
| **Korean token coverage** | 56.00% | **90.50%** (+34.50 pt) |

Remaining Greek tokens without Korean: 13,017 (9.50%). They are the long tail (frequency 14 and below, 2,786 gap entries), the 71 unkeyable entries, and the unmapped / variant / conflict lemma strings.

Staging build `e6f1f8a5daee7a06`, 106 checks green; `expected.json` `lexical.greek_verified` = 2,078. `lexicon/qa.js` 20/20 and all test files pass (`tests/stepbible-runtime.test.js` now also accepts Korean differences stamped by this import). Token QA: Greek Korean 124,046 tokens, English 133,948, both 123,910.

Representative cards (staging data through the real word-card `describe()`): John 1:1 ἐν "~안에, ~위에, ~가운데", ἀρχή "시작, 처음, 통치", ἦν "있다, 이다, 존재하다"; Matt 6:9 οὖν, προσεύχεσθε, οὐρανοῖς, ὄνομα all show Korean; Rom 3:23 ὑστεροῦνται "부족하다, 궁핍하다". Still empty: οὕτως (no ledger key) and ἐπελθόντος (below the cut).

## Not done

Production `data/original-language/` is still `136b1ad94935ef23`. To promote this delta: set `expected.json` `bind.build_id` = `e6f1f8a5daee7a06`, `build_checks` = 106 and the predecessor to 136b…, then `node build.js bind` after preserving 136b1ad94935ef23 under `predecessors/`, on the Captain's go. The long tail can continue the same way: `node lexicon/greek-gap-import.js plan|apply` takes any decision TSV of this shape.

## Files

`lexicon/greek-gap-import.js`, `inputs/review-log/greek-gap-fill-2026-10-06.decisions.tsv`, `inputs/review-log/_make_greek_gap_decisions.js`, ledger backup `inputs/review-log/ledger-backups-pre-greek-gap-fill-20261006/`, `verification/greek-gap-import-{plan,apply}.json`.
