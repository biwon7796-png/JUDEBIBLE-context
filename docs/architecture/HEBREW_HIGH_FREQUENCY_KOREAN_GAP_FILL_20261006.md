# Hebrew high-frequency Korean gloss gap fill — 2026-10-06

Task: `FILL_HIGH_FREQUENCY_HEBREW_KOREAN_GLOSS_GAPS_TO_90_PERCENT_TOKEN_COVERAGE`

Verdict: `HEBREW_KOREAN_COVERAGE_92_45_PERCENT__STAGING_ONLY__PRODUCTION_NOT_REBOUND`

## What was done

Starting point (current ledgers, i.e. theological + Captain-priority imports already included): Korean on 239,823 / 306,785 Hebrew tokens = **78.17%**. TBESH-mapped entries without a VERIFIED Korean: **2,831 entries / 65,749 tokens** (`lexicon/gap-extract.js`). 90% needed 36,284 more tokens, which the **top 44** entries reach; the top 62 reach 91%. With a margin, the **top 100 (frequency ≥ 100)** were reviewed row by row.

Basis: the TBESH English `Gloss` (the Meaning column is not read). The existing Korean proposal was kept only where it agrees with the Gloss: **83 KEEP**; **16 EDIT** re-aligned to the Gloss (e.g. טוֹב "pleasant" → 좋은, 즐거운; חֶסֶד "kindness" → 인자, 친절; סֵפֶר "scroll: document" → 두루마리, 문서, 책; קָטַר "offer: burn" → 사르다, 태우다; בָּבֶל → 바벨론, the KRV form); **1 HOLD** (H0639I אַף "face": one sense row of the nose/face/anger family, single-row binding unclear — not written). Lemma-level basic meaning only; no contextual or doctrinal reading.

Untouched: TBESH English, OSHB tokens/lemmas/morphology, Open Scriptures HebrewLexicon binding, Strong mapping, and every variant/homonym/source-conflict/unmapped lemma string outside the 100. 99 ledger ids written; 7 of them carry a TBES POS-class source conflict → `review.source_conflict = "retained"`, 4 carry a variant relation → `review.source_variant = "retained"`; TBES review codes are not cleared.

Reviewer in the ledger: `CLAUDE_MODEL_ASSISTED_LEXICAL_REVIEW__HEBREW_HIGH_FREQUENCY_GAP_FILL__CAPTAIN_DIRECTED_2026-10-06` (model-assisted, not an independent human review).

## Result

| | before | after |
|---|---:|---:|
| Hebrew VERIFIED entries | 6,391 | **6,490** (+99) |
| tokens with Korean | 239,823 (78.17%) | **283,628 (92.45%)** (+14.28 pt) |
| English (STEPBible) | 98.24% | 98.24% (unchanged) |

Remaining Hebrew tokens without Korean: 23,157 (7.55%) — the long tail (frequency < 100, 2,731 gap entries), the HOLD entry, and unmapped/variant/conflict lemma strings.

Staging build **`fc4e2b338c78bc69`**, 106 checks green, `expected.json lexical.hebrew_verified` = 6,490 (Greek 2,078 unchanged). This staging also contains the Captain-priority and Greek gap-fill imports made in parallel sessions; it replaced the earlier staging `e6f1f8a5daee7a06` (= this build minus the Hebrew delta). `lexicon/qa.js` 20/20, tests pass (`stepbible-runtime.test.js` now also accepts Korean differences stamped by this import: Hebrew +369 newly VERIFIED / 50 EDIT-replaced vs the 63da92a1 baseline, all source-stamped).

Representative verses (real word-card `describe()`): Gen 1:1 7/7 tokens with Korean; Gen 22:2 24/25; Exod 3:14 15/15; Ps 23:1 5/6; Isa 53:5 11/11.

## Not done

Production `data/original-language/` is untouched (currently `136b1ad94935ef23`). To promote: set `expected.json bind.build_id` = `fc4e2b338c78bc69`, `build_checks` = 106, preserve 136b… under `predecessors/`, then `node build.js bind`, on the Captain's go. Observed but not mine: `tests/loader.test.js` has 1 failing assertion (BUILD_MISMATCH case) against the current production build.

The long tail can continue the same way: `node lexicon/hebrew-gap-import.js plan|apply` takes any decision TSV of this shape.

## Files

`lexicon/gap-extract.js`, `lexicon/hebrew-gap-import.js`, `inputs/review-log/hebrew-gap-fill-2026-10-06.decisions.tsv`, `inputs/review-log/_make_hebrew_gap_decisions.js`, ledger backup `inputs/review-log/ledger-backups-pre-hebrew-gap-fill-20261006/`, `verification/hebrew-gap-import-{plan,apply}.json`.
