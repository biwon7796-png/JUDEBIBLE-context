# ENHANCED_REVIEW Batch 01 — row-level decisions — 2026-10-06

Task: `REVIEW_ENHANCED_BATCH01_TOP100_HEBREW_AND_GREEK_WITH_ROW_LEVEL_APPROVE_EDIT_REJECT_DECISIONS`

Verdict: `BATCH01_REVIEWED__DECISIONS_RECORDED__NO_LEDGER_IMPORT__NO_PROMOTION`

## Scope

Reviewed the first 100 still-PROPOSED `ENHANCED_REVIEW` rows for each language, in descending token-frequency order, using the existing canonical lexical binding, cleaned upstream English gloss, Korean proposal, flags, and frequency as the review basis.

Decision files:

- `inputs/review-log/enhanced-review-2026-10-06.hebrew.top100.tsv`
- `inputs/review-log/enhanced-review-2026-10-06.greek.top100.tsv`

## Result

| language | rows | APPROVE | EDIT | REJECT |
|---|---:|---:|---:|---:|
| Hebrew | 100 | 95 | 5 | 0 |
| Greek | 100 | 88 | 12 | 0 |

No row was rejected in this batch because each of the 200 lexical identities was already canonically bound and the remaining issues could be resolved either by retaining the proposal or by a bounded Korean gloss edit. This does **not** promote the rows; import remains a separate step.

## Hebrew edits

| id | headword | frequency | proposal | finalKo | reason |
|---|---|---:|---|---|---|
| ikq | נֶ֫פֶשׁ | 757 | 영혼, 생명 | 생명, 목숨 | avoids making “soul” the controlling basic gloss; keeps the concrete life/self range represented by the source-bound entry |
| ldt | קֹ֫דֶשׁ | 467 | 거룩함, 성소 | 거룩함, 성물, 성소 | preserves the abstract + sacred-thing/place range rather than collapsing the noun to sanctuary |
| fhz | יָרֵא | 329 | 두려워하다 | 두려워하다, 경외하다 | theological-sensitive row; retains fear while adding the established reverential range without contextualizing a verse |
| ecp | חֶ֫סֶד | 249 | 인자, 사랑 | 인애, 인자 | keeps a compact covenantal-kindness gloss without expanding into a theological interpretation |
| gzb | מַלְאָךְ | 213 | 사자(使者) | 사자(使者), 천사 | source gloss is messenger; biblical lexical use also requires the conventional angel rendering, kept as a second basic sense |

## Greek edits

| id | headword | frequency | proposal | finalKo | reason |
|---|---|---:|---|---|---|
| 0846 | αὐτός | 5033 | 그, 그녀, 그것, 같은 것 | 그, 그녀, 그것, 바로 그 | replaces awkward “같은 것” with the intensive/basic pronominal value |
| 3756 | οὐ | 1617 | 아니, 않다 | 아니다, ~않다 | normalizes the negative gloss into Korean dictionary/use form |
| 3739 | ὅς | 1399 | ~하는 자, 어느, 무엇, ~것 | 누구, 어느 것, ~하는 자/것 | clarifies the relative-pronoun range without adding contextual interpretation |
| 3778 | οὗτος | 1384 | 이, 이것, 그, 그녀 | 이, 이것, 이 사람 | keeps the proximal demonstrative value; removes distal/personal renderings that obscure the headword |
| 3361 | μή | 1032 | ~않도록, 아니 | 아니, ~하지 않도록 | restores the basic negative value before the “lest” use |
| 1096 | γίνομαι | 661 | 되다, 태어나다 | 되다, 생겨나다, 태어나다 | preserves “come into being” as a lemma-level basic sense |
| 3708 | ὁράω | 475 | 보다, 주목하다, 경험하다 | 보다, 바라보다, 경험하다 | “look upon” is better represented by 바라보다 than 주목하다 |
| 2596 | κατά | 468 | ~에 따라, ~에 대하여, ~동안, ~를 통하여 | ~에 따라, ~에 대하여, ~동안, ~전체에 걸쳐 | removes “through,” which is not supported by the cleaned source gloss; restores “throughout” |
| 4183 | πολύς | 413 | 많은, 자주 | 많은, 많이, 자주 | restores both adjectival/adverbial quantity values |
| 3056 | λόγος | 330 | 말, 말씀, 이야기 | 말, 말씀, 발언 | “speech/divine utterance” is better captured by 발언 than 이야기 for a basic lexeme gloss |
| 3551 | νόμος | 194 | 율법 | 법, 율법 | retains generic law + Mosaic-law range in the source gloss |
| 4396 | προφήτης | 144 | 선지자, 시인 | 선지자 | removes a low-value secondary source gloss that would mislead a Bible-reader basic card |

## Boundary

- No `review.js import` was executed.
- Hebrew VERIFIED remains 6,121.
- Greek VERIFIED remains 1,258.
- `expected.json` was not changed.
- No staging rebuild or production bind was performed.
- `data/original-language/` was not changed.
- All 200 rows now have explicit row-level `APPROVE` or `EDIT` decisions ready for the next promotion/import step.

## Next task one

`IMPORT_AND_QA_ENHANCED_BATCH01_HEBREW_GREEK_DECISIONS_STAGING_ONLY`
