# STANDARD_REVIEW promotion — Hebrew + Greek basic gloss — 2026-10-06

Task: `REVIEW_AND_PROMOTE_STANDARD_HEBREW_GREEK_BASIC_GLOSS_BATCHES`

Verdict: `STANDARD_REVIEW_PROMOTED_STAGING_ONLY__PRODUCTION_NOT_REBOUND`

## Who reviewed, and what that means

The reviewer recorded in the ledgers is `CLAUDE_MODEL_ASSISTED_LEXICAL_REVIEW__CAPTAIN_DIRECTED_2026-10-06`. This is a **model-assisted review directed by the Captain**, not an independent human review (same status as the earlier 8 pilot entries). Nothing was auto-promoted by rule: every STANDARD row was printed with headword, POS, cleaned upstream English, Korean proposal and frequency, and was read in frequency order; rows were then approved, edited, or held out. Only then was `lexicon/review.js import` run (all-or-nothing). Because the proposals were also written by the model, a human spot-check is recommended: `tools/original-language/inputs/review-log/standard-review-2026-10-06.human-spotcheck.tsv` (top-100 by frequency + 100 random per language, with an `OK/FIX` column).

## Result

| | Hebrew | Greek |
|---|---|---|
| STANDARD_REVIEW rows read | 6,127 | 1,267 |
| approved unchanged | 6,000 | 1,235 |
| edited, then verified | 113 | 23 |
| held out (stay PROPOSED) | 14 | 9 |
| **VERIFIED entries now** | **6,121** (8 pilot + 6,113) | **1,258** |
| still PROPOSED (ENHANCED + held out) | 3,107 | 3,731 |
| HOLD (no usable source gloss) | 28 | 0 |
| lemma strings UNMAPPED / CONFLICT | 359 / 9 | 19 / 425 |
| tokens on a VERIFIED gloss | 182,078 / 306,785 (59.4%) | 37,251 / 137,063 (27.2%) |

Greek token share is low because the most frequent Greek lemmas carry a multi-sense Dodson gloss (`and, even, also…`) or are theological, so they sit in `ENHANCED_REVIEW` and were not promoted here.

What the review changed: some Hebrew rows still carried weak upstream first-homonym glosses that the proposal had copied. Examples fixed: חֲזִיז "bolt" → 번개, חָרוּל "chickpea" → 가시덤불, אוֹב "skin-bottle" → 신접한 자, שְׁכָבָה "lying" (not "거짓") → 누움, תָּאַר "incline" → 윤곽을 그리다, מִשְׁבְּצוֹת "chequered" → 보석 받침, and in Greek κεραία "apostrophe" → 획, 한 획, ἀποκαταλλάσσω/καταλλάσσω held out as theological. Those 113 + 23 edits are listed with before/after in `inputs/review-log/standard-review-2026-10-06.edits.tsv`; held-out rows in `…heldout.tsv` (theological terms such as 2643/2644 καταλλαγή/καταλλάσσω, 4416 πρωτότοκος, 0500 ἀντίχριστος, 5548 χρίω, 4267 προγινώσκω, 0342 ἀνακαίνωσις, Hebrew תּוֹרָה duplicate `nqb`, גְּאֻלָּה, אוּרִים, עֲזָאזֵל, סְגֻלָּה, חָסִיד, …).

## Runtime

- Ledgers: `inputs/hebrew-gloss-ko.review.json` (6,121 VERIFIED) and `inputs/greek-gloss-ko.review.json` (1,258 VERIFIED). Every row passes the drift gate (headword + upstream gloss unchanged, VERIFIED, non-empty Korean).
- `expected.json` → `lexical: { hebrew_verified: 6121, greek_verified: 1258 }` (deliberate two-key bump). `lib/validate.js` no longer hard-codes "8": it checks the expected counts for both languages, that Greek `lexical` is absent when 0, and that every emitted gloss is a non-empty string and every `lemma_to_id` entry points at an emitted entry.
- Staging build `BUILD_OK_STAGING_ONLY`, 98 checks, build id `b01c2f62fc5cdfda` (previous production id `69e01ba0ef15b476`). Word card `describe()` on staged data: Gen 1:1 → רֵאשִׁית 시작, אֱלֹהִים 하나님, 신(들), אֶרֶץ 땅 = VERIFIED; בָּרָא (enhanced) stays `기본 뜻 준비 중`. John 1:1 → ὁ 정관사(그) VERIFIED; θεός, λόγος, εἰμί stay pending (ENHANCED).
- Unreviewed, held-out, UNMAPPED and CONFLICT lemmas remain fail-closed. No proposal is emitted.

## Production / predecessor

`data/original-language/` was **not** touched or rebound (build id still `69e01ba0ef15b476`, Hebrew gloss = 8 pilot only in production). Predecessor `a8f15190ff7e32a6` preserved. Original-language corpus, reference map, morphology, KRV and WORBS untouched. Rebind requires separate Captain approval.

## QA (all re-run after promotion)

`lexicon/qa.js --write` 20/20 (coverage, token→lemma→entry→gloss buckets, source drift, duplicate/orphan proposals, non-Korean gloss, VERIFIED set == ledger, proposals never emitted, representative passages); unit tests greek 10/10, hebrew 10/10, run.js 16/16, loader 13/13, research-evidence 12/12; `build.js --check` OK. Report: `verification/full-gloss-coverage-report.json`.

## Next (unchanged order)

1. `ENHANCED_REVIEW` — highest-frequency first (Greek καί/ἐν/λέγω/θεός/λόγος…; Hebrew override and theological rows) with stricter per-row decisions.
2. HOLD (28 Hebrew) / CONFLICT / UNMAPPED, and `BUILD_AND_REVIEW_GREEK_CANONICAL_VARIANT_BINDING_TABLE` (221 spelling-variant candidates; table of `source lemma → canonical Dodson headword`, Strong number, variant type, review status — never auto-merged on Strong equality).
3. Human spot-check sample, then Captain-approved rebind of the staging build.
