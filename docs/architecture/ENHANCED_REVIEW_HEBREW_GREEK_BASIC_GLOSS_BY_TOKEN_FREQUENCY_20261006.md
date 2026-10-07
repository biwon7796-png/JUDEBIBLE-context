# ENHANCED_REVIEW — Hebrew + Greek basic gloss by token frequency — 2026-10-06

Task: `BEGIN_ENHANCED_REVIEW_HEBREW_GREEK_BASIC_GLOSS_BY_TOKEN_FREQUENCY`

Status: `STARTED__FREQUENCY_SORTED_BATCH01_MATERIALIZED__NO_VERIFIED_PROMOTION_YET`

## Basis

- Continues after `STANDARD_REVIEW_PROMOTED_STAGING_ONLY__PRODUCTION_NOT_REBOUND`.
- Review source is the existing canonical lexical binding + proposal queue.
- `ENHANCED_REVIEW` rows are already frequency-sorted and contain the higher-risk flags: proper nouns, theological sensitivity, polysemy/compound glosses, upstream fragments, accent/case variants, and proposal-overrides-source-gloss.
- Runtime remains fail-closed for rows that are not VERIFIED.

## Batch 01 materialized

Two bounded working sheets were generated from `lexicon/review.js sheet`, highest token frequency first:

- `tools/original-language/inputs/review-log/enhanced-review-2026-10-06.hebrew.top100.tsv`
- `tools/original-language/inputs/review-log/enhanced-review-2026-10-06.greek.top100.tsv`

Each contains exactly 100 still-PROPOSED `ENHANCED_REVIEW` rows and preserves headword, POS, cleaned upstream English, Korean proposal, flags, token frequency, and empty decision/finalKo fields.

## Frequency front

Hebrew begins with:
1. אֵת — 10,979
2. יהוה — 6,521
3. עַל — 5,770
4. אֶל — 5,516
5. כֹּל — 5,417
6. לֹא — 5,191
7. הָיָה — 3,575
8. עָשָׂה — 2,636
9. בּוֹא — 2,592
10. מֶ֫לֶךְ — 2,526

Greek begins with:
1. καί — 8,947
2. αὐτός — 5,033
3. δέ — 2,764
4. ἐν — 2,725
5. εἰμί — 2,452
6. λέγω — 2,333
7. εἰς — 1,754
8. οὐ — 1,617
9. ὅς — 1,399
10. οὗτος — 1,384

## Enhanced-review decision rule

Per row, do not bulk-approve merely because the Korean proposal is plausible.

1. Check canonical headword identity and source-bound lexical entry.
2. Compare cleaned upstream English against Korean proposal.
3. Inspect risk flags.
4. For `PROPOSAL_OVERRIDES_SOURCE_GLOSS`, require the override to be lexically defensible rather than copying a weak fragment.
5. For `THEOLOGICAL_SENSITIVE`, prefer a short dictionary gloss and avoid importing a contextual/theological interpretation into the basic gloss.
6. For `POLYSEMOUS_OR_COMPOUND`, keep only compact high-value senses suitable for a lemma-level basic gloss.
7. For `PROPER_NOUN`, preserve established Korean biblical naming.
8. For `HEADWORD_ACCENT_CASE_VARIANT` / `UPSTREAM_FRAGMENT`, fail closed when the lexical identity or gloss remains unclear.
9. Decision values remain `APPROVE | EDIT | REJECT`; empty stays untouched.
10. No ledger import, expected-count bump, staging rebuild, production bind, or runtime rebind occurs in this BEGIN step.

## Current boundary

- Hebrew VERIFIED before Batch 01: 6,121
- Greek VERIFIED before Batch 01: 1,258
- No new VERIFIED entries have been written by this BEGIN step.
- `expected.json` remains unchanged.
- Production `data/original-language/` remains unchanged.
- Existing predecessor and current staging/production boundary remain preserved.

## Next task one

`REVIEW_ENHANCED_BATCH01_TOP100_HEBREW_AND_GREEK_WITH_ROW_LEVEL_APPROVE_EDIT_REJECT_DECISIONS`
