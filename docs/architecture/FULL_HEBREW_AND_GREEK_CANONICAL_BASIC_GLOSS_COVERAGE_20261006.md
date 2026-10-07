# Full Hebrew + Greek canonical basic-gloss coverage — 2026-10-06

Task: `BUILD_FULL_HEBREW_AND_GREEK_CANONICAL_BASIC_GLOSS_COVERAGE`

Verdict: `FULL_LEXICAL_BINDING_AND_REVIEW_QUEUE_READY__RUNTIME_STILL_FAIL_CLOSED`

- Every analysable lemma is classified (bound / UNMAPPED / CONFLICT) and every bound lexical entry has a Korean **proposal**.
- **No proposal was promoted to VERIFIED.** Per the task rules a model-written gloss is never auto-verified, and no reviewer decision exists for the new entries. Runtime therefore still ships only the 8 pilot Hebrew glosses; Greek ships none. Unreviewed lemmas keep the existing fail-closed text (`기본 뜻 정보는 아직 준비 중입니다.`).
- The user-facing completion criterion ("click a word → canonical lemma + Korean basic gloss across the corpus") is therefore **not yet met at runtime**; it is met at the binding / queue level, and the remaining step is reviewer promotion (below). The code path that shows promoted glosses (Hebrew and Greek) is built and tested.

## Final numbers (measured by `lexicon/qa.js`, 20/20 checks pass)

| | Hebrew (OSHB → HebrewLexicon) | Greek (MACULA/SBLGNT → Dodson) |
|---|---|---|
| runtime lemma strings | 21,070 | 5,495 |
| **linked (canonical resolve OK)** | **20,702** (98.25%) | **5,051** (91.92%) |
| distinct lexical entries bound | 9,256 | 4,989 |
| **VERIFIED gloss (entries)** | **8** (pilot, unchanged) | **0** |
| PROPOSED_UNREVIEWED (entries) | 9,220 | 4,989 |
| **HOLD** (no usable source gloss) | **28** entries | 0 |
| **CONFLICT** (lemma strings) | **9** | **425** |
| UNMAPPED (lemma strings) | 359 | 19 |
| tokens analysed | 306,785 (all) | 137,063 (+678 not analysed upstream) |
| tokens on a bound entry | 305,912 (99.72%) | 135,689 (98.99%) |
| tokens on a VERIFIED gloss | 9,076 (2.96%) | 0 |
| tokens on UNMAPPED / CONFLICT | 825 / 48 | 48 / 1,326 |

Remaining unresolved: Hebrew 368 lemma strings (359 + 9) + 28 HOLD entries; Greek 444 lemma strings (19 + 425). Plus **9,220 Hebrew proposals (+28 HOLD) and 4,989 Greek proposals awaiting review**.

Greek CONFLICT detail: 221 spelling-variant candidates (same Strong, headword differs in spelling, e.g. Μωϋσῆς/Μωσῆς), 201 same-Strong-different-headword (e.g. Πύρρος→πυρός, rejected), 3 ambiguous multi-Strong lemmas (βάτος, μήν, ἄπειμι). Hebrew UNMAPPED: 348 `NNNN+` lemmas (not in AugIndex, rejected by design) + 11 not in AugIndex; Hebrew CONFLICT: 9 (aug `2007`-class Strong xref disagreement). None of these is guessed.

## Sources and provenance

- **Hebrew** (reused, unchanged): `OSHB lemma → AugIndex.xml → LexicalIndex.xml` (openscriptures/HebrewLexicon @ `21c9add1…`, CC BY 4.0). Only an AugIndex-mapped entry whose own Strong xref agrees is bound.
- **Greek** (new, selected here): **Dodson Greek-English Lexicon** (`biblicalhumanities/Dodson-Greek-Lexicon` @ `74f70358d4acfaf2f980bf2feb58ab7115cbbcbc`, 2018-01-11). License: repository `LICENSE` = **CC0 1.0**; README states public domain; derived from Jeffrey Dodson's public-domain lexicon. Lock + sha256: `tools/original-language/lexicon/greek-lexicon.lock.json` (`dodson.xml` `39c6cb80…`). Only `dodson.xml` headword + brief gloss are used (the CSV has beta-code headwords and is not used).
- **Greek sources evaluated and rejected** (not adopted merely because they are in the runtime):
  - MACULA `english` (Cherith, CC BY 4.0): per-token, inflected/contextual (λέγω → said/saying/say/tell…, Καῖσαρ → Caesar/Caesar's). Not lemma-level.
  - MACULA `gloss` (Berean Interlinear): contextual, token-level.
  - OpenGNT / Berean: token-level; not selected.
- **Bridge**: runtime lemma → MACULA TSV `strong` column (build-time only, never emitted; the existing "excluded columns never emitted" validation still passes) → Dodson entry by Strong number. A lemma binds only if (a) it has exactly one Strong number, or several where **exactly one** Dodson entry carries the lemma itself as headword (suppletive/inflectional splits: ὁ, ἐν, λέγω, εἰμί…), and (b) the Dodson headword equals the lemma (NFC) or differs only in accents/case. Everything else is an explicit exception. This recovered the 20 most frequent lemmas (32% of Greek tokens) that a strict single-Strong rule would have rejected.
- Provenance preserved per entry: source identity/commit (lock files), lexical id, lemma list, headword, upstream gloss (`glossEn`, raw), Korean proposal, tier/flags, review status. The VERIFIED ledgers (`inputs/{hebrew,greek}-gloss-ko.review.json`) additionally carry reviewer + date and are drift-checked against upstream on every build.

## What "기본뜻" is here

Lemma-level lexical gloss only. No context sense, no WORBS interpretation. Korean is short dictionary form (verbs in `-다`, nouns bare, a few comma-separated senses). Names use established Korean biblical forms; the KRV text is used **only as a reviewer check** (never emitted).

## Korean proposals — how they were produced and why none is VERIFIED

- Authored by the model from the (cleaned) upstream English gloss, in batches, into `inputs/proposals/{hebrew,greek}.ko.*.tsv` (9,220 + 4,989 rows after overrides; 28 Hebrew entries have none).
- **Weak upstream glosses were overridden, not copied.** The HebrewLexicon `<def>` is often a homonym-first or BDB-index fragment (הָיָה "fall out", בָּרַךְ "kneel", כָּבוֹד "abundance", תּוֹרָה "direction", אֲרוֹן "chest"…). A frequency audit of the top ~1,600 Hebrew entries produced 226 overrides, each carrying an `OVERRIDE:` note, a `PROPOSAL_OVERRIDES_SOURCE_GLOSS` flag and mandatory enhanced review (`zz-headword-corrections.tsv`). The long tail (hapax names/words) was not audited this way.
- **KRV evidence pass for proper nouns:** 2,494 Hebrew / 485 Greek name proposals checked against the KRV chapters where the lemma occurs; 102 Hebrew + 14 Greek corrected to the KRV spelling (`zz-krv-evidence-corrections.tsv`). Still not attested (reviewer hint list): 226 Hebrew, 23 Greek — `verification/full-gloss-coverage-report.json` → `R.*.properNouns.notAttestedAll` (chapter-level heuristic; offsets/suffix forms cause false hits).
- Tiers (generated, never VERIFIED): `STANDARD_REVIEW` = single plain sense (Hebrew 6,145 / Greek 1,267); `ENHANCED_REVIEW` = any flag (Hebrew 3,111 / Greek 3,722). Flags: `PROPER_NOUN` (2,500 / 485), `THEOLOGICAL_SENSITIVE` (304 / 427; the only Hebrew ones VERIFIED are the pre-existing `bss`, `arn`), `POLYSEMOUS_OR_COMPOUND`, `UPSTREAM_FRAGMENT`, `HEADWORD_ACCENT_CASE_VARIANT`, `PROPOSAL_OVERRIDES_SOURCE_GLOSS` (226 / 2).
- 28 Hebrew entries stay `HOLD_NO_PROPOSAL`: upstream gloss is a bare cross-reference ("see"), a garbled fragment, or a phrase gloss with no safe reading.

## Reviewer workflow (the only writer of VERIFIED)

```bash
node tools/original-language/lexicon/review.js sheet  --lang greek --tier STANDARD_REVIEW --out sheet.tsv
# edit the `decision` column: APPROVE | EDIT (+ finalKo) | REJECT ; empty = untouched
node tools/original-language/lexicon/review.js import --lang greek --in sheet.tsv --reviewer "<name>" [--date YYYY-MM-DD]
```

Ready-made sheets: `inputs/queue/review-sheets/{hebrew,greek}.{STANDARD,ENHANCED}_REVIEW.tsv` (sorted by token frequency). `import` is all-or-nothing, requires a named reviewer, rejects empty/non-Korean gloss, and records `REJECTED` rows that never emit. After import: bump `expected.json` → `lexical.hebrew_verified / greek_verified`, `node tools/original-language/build.js`, run tests, and only then (on explicit instruction) `build.js bind`.

## Runtime emission (built, gated)

- `lib/pipeline.js`: emits `greek/dict.js.lexical` (`entries`, `lemma_to_id`) **only if ≥1 Greek entry is VERIFIED**; adds the Dodson credit to `attribution.js` in that case. With 0 VERIFIED the build is byte-identical to the current one. The old hard-coded "exactly 8 Hebrew" gate now reads `expected.json lexical.*`, so a promotion is a deliberate two-key change.
- `original-language-word-card.js`: the Greek branch now reads `d.lexical` the same way the Hebrew branch does (gloss only; the lemma text is already shown).
- Integration test (temporary, reverted): promoted 3 Greek entries with a test reviewer → build emitted `lexical` + `greeklex` attribution, 96 build checks passed, `describe()` returned `ὁ → 정관사(그) VERIFIED` and left unreviewed tokens pending → files restored → rebuild returned to build id `69e01ba0ef15b476`.

## QA performed

`node tools/original-language/lexicon/qa.js --write` (20/20) → `verification/full-gloss-coverage-report.json`:
lemma coverage (both), token→lemma→lexical→gloss buckets (both), source drift (both locks + ledgers vs upstream), duplicate/conflicting proposals (none; corrections are intentional overrides), orphan proposals (none), empty/non-Korean gloss (none; Hanja in parentheses allowed for disambiguation, e.g. `해, 연(年)`), theological and proper-noun tiers, unmapped/conflict lists (`hebrewExceptions`, `greekExceptions`), runtime emission gate (proposals never emitted), representative passages (Gen 1:1, 22:2, 26:1, Ps 23:1, Isa 53:5; John 1:1, 3:16, Rom 3:23, Matt 1:1, Jude 1:1 — every token resolves to a lexical id or an explicit exception).
Unit tests: `tests/greek-lexicon.test.js` 10/10 (new), `hebrew-lexicon` 10/10, `run.js` 16/16, `loader` 13/13, `research-evidence` 12/12; `build.js --check` OK; full staging build `BUILD_OK_STAGING_ONLY`, 96 checks, build id unchanged.
Browser `?qa=ol` in this session's preview pane: 12/29 **with and without** the word-card edit (A/B), pane state — not a regression from this work; the existing baseline note about hidden-pane QA applies. The `describe()` behavior was verified directly instead.

## Production / predecessor status

- Production data `data/original-language/`: **unchanged** — staging build is byte-identical to it (71 files, build id `69e01ba0ef15b476`); not re-bound.
- Applied to the repo (code, not data): Greek lexicon module + lock, coverage/qa/review tools, pipeline Greek-lexical emission (inert until a Greek entry is VERIFIED), word-card Greek gloss read path.
- Runtime VERIFIED glosses: Hebrew 8 (pilot reused, not duplicated), Greek 0.
- Predecessor `tools/original-language/predecessors/a8f15190ff7e32a6` preserved, untouched. Original-language corpus, reference-map, morphology, KRV and WORBS projection untouched.

## Files

- `tools/original-language/lexicon/greek-lexicon.js`, `greek-lexicon.lock.json`, `coverage.js`, `qa.js`, `review.js`
- `tools/original-language/inputs/greek-gloss-ko.review.json` (empty VERIFIED ledger), `inputs/proposals/*.tsv`, `inputs/queue/{hebrew,greek}-gloss-ko.queue.json`, `inputs/queue/review-sheets/*.tsv`
- `tools/original-language/tests/greek-lexicon.test.js`, `verification/full-gloss-coverage-report.json`
- Cache (git-ignored): `tools/original-language/_cache/greeklex/` (re-acquire from the locked commit; sha256 in the lock)

## Next

1. Reviewer pass: `STANDARD_REVIEW` sheets first (Greek 1,267 rows, Hebrew 6,145), then `ENHANCED_REVIEW` (theological, names, overrides) — highest-frequency rows first; the top ~300 entries per language cover most tokens.
2. Decide policy for the 221 Greek spelling-variant candidates (a reviewer-signed variant table would bind them without guessing).
3. `IMPLEMENT_FULL_GLOSS_RUNTIME_PROMOTION`: after promotion, bump `expected.json`, rebuild, run tests, bind on explicit instruction.
