# Source-backed basic gloss rebase on STEPBible TBESH / TBESG — 2026-10-06

Task: `REBASE_FULL_HEBREW_GREEK_BASIC_GLOSS_ON_VERIFIED_EXTERNAL_LEXICONS`

Verdict: `SOURCE_BACKED_CANDIDATES_BUILT__STAGING_ONLY__PRODUCTION_NOT_BOUND`

This replaced the earlier `RECLASSIFY_ALL_PROPOSED_GLOSSES_BY_REVIEW_RISK…` request (not executed; no ledger was changed).

## Sources and licence

- STEPBible/STEPBible-Data, commit `1f3423d42400f59f1f30fe08f74e38fcd3bbf7bc`, `Lexicons/TBESH` (3,288,045 B) and `TBESG` (4,736,912 B), CC BY 4.0 (Tyndale House Cambridge / STEPBible.org). Downloaded with Captain approval to `tools/original-language/_cache/stepbible/` (git-ignored); sha256 in `lexicon/stepbible.lock.json`.
- **Only the `Gloss` column is used.** TBESH `Meaning` is the Online Bible abridged BDB and the file itself says permission is required before use; it is deliberately not read.
- Attribution (in the lock) must be added to `data/original-language/attribution.js` at bind time. Not done now because production data is untouched.

## Mapping contract (fail-closed, `lexicon/stepbible.js`)

- Hebrew: OSHB lemma → existing OS canonical binding (kept) → Strong key → TBESH `eStrong`, then **normalized consonantal headword** match (points, cantillation, final letters, comma-listed alternates). Single-letter prefix lemmas map to the `H90xx` prefix rows.
- Greek: SBLGNT/MACULA lemma → MACULA Strong set → TBESG `eStrong`, then **accent/case-folded headword**; an exact accented match beats a folded one (τίς vs τις). This no longer depends on Dodson, so it also reaches lemmas Dodson left as CONFLICT.
- Row choice: POS-compatible rows only; one eStrong; the base row (`dStrong` = eStrong or eStrong+`G`) among unlabelled rows. Rows reachable only through a relation label (a Name of / Spelling of / the Greek of …) are used only if they agree on one gloss, and are always routed to review.
- Model-written Korean is never authority. It is attached to a candidate only if it agrees with the TBES gloss (English token overlap, or support from the reviewed English→Korean map). `glossKoOrigin` records `REVIEWED_LEDGER` or `MODEL_PROPOSAL_CROSSCHECKED_AGAINST_TBES`.

## Result

| | Hebrew | Greek |
|---|---:|---:|
| lemma strings / tokens | 21,070 / 306,785 | 5,495 / 137,063 |
| **directly mapped to TBES** | **20,547 (97.52%)**, 98.24% of tokens | **4,960 (90.26%)**, 97.73% of tokens |
| TBES entries mapped | 8,972 | 4,895 |
| **auto-adopted runtime candidates** (no review reason) | 8,024 entries · 17,851 lemmas (84.72%) · 72.15% of tokens | 4,120 entries · 4,168 lemmas (75.85%) · 54.78% of tokens |
| mapped but routed to review queue (entries) | 1,166 | 775 |
| &nbsp;&nbsp;theological-sensitive / variant relation / non-standard gloss markup / POS class conflict | 346 / 629 / 121 / 161 | 285 / 261 / 251 / 19 |
| **unresolved exceptions** (lemma strings / tokens) | **523 / 5,388** | **535 / 3,115** |
| **source conflicts** (exceptions + POS-class conflicts) | **378 lemmas / 5,465 tokens** | **256 lemmas / 1,968 tokens** |
| Korean attached (all / on auto-adopted) | 6,145 / 5,475 | 3,550 / 2,899 |

Unresolved exceptions by reason — Hebrew: lemma shape outside the AugIndex contract 348, variant headword (Strong agrees) 47, homonym with no base row 50, variant rows disagree 46, OS-vs-Strong xref conflict 9, not in AugIndex 11, headword differs 8, Strong not in TBESH 3, multiple Strong 1. Greek: variant headword (Strong agrees) 282, headword differs (mostly deponent -ομαι vs TBES -ω) 236, variant rows disagree 4, multiple Strong 7, Strong not in TBESG 5, multiple base rows 1.

## What "auto-adopted" means here

The English `Gloss` of an auto-adopted entry comes from an external source and needed no manual review. Korean is a translation of it, not source authority; about a third of TBES entries have no Korean yet because the legacy proposal did not agree with the Tyndale gloss (synonyms such as earth/land, or different senses). Those 2,938 Hebrew and 1,274 Greek diverging entries carry `crossCheck: DIVERGE`. Among them, 2,199 Hebrew and 338 Greek already-VERIFIED Korean glosses are marked `VERIFIED_KO_VS_TBES_DIVERGE` for precise review. The overlap heuristic is crude, so some of these are synonym agreements.

## Not done

- No ledger write, no `expected.json` change, no staging rebuild, no `build.js bind`; `data/original-language/` untouched (production still build `69e01ba0ef15b476`).
- The 200 Batch01 row-level decisions remain recorded but not imported.
- Candidates are not wired to any loader or UI.

## Files

`lexicon/stepbible.js` (+ `stepbible.lock.json`), `tests/stepbible.test.js` (15 tests; existing 16 + 10 + 10 still pass), `inputs/source-backed/{hebrew,greek}.{source-backed,exceptions}.json`, `verification/stepbible-source-backed-report.json`. `lexicon/coverage.js` only gained a `THEO` export.

Commands: `node lexicon/stepbible.js report|export`, `node tests/stepbible.test.js`.
