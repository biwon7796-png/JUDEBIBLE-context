# STEPBible source-backed lexical layer → JudeBible runtime (staging) — 2026-10-06

Task: `INTEGRATE_STEPBIBLE_SOURCE_BACKED_LEXICAL_LAYER_INTO_JUDEBIBLE_RUNTIME_WITH_VERIFIED_KO_ONLY`

Verdict: `INTEGRATED_IN_STAGING__KO_VERIFIED_ONLY__PRODUCTION_NOT_BOUND__AWAITING_CAPTAIN_GATE`

## What changed

| Area | Change |
|---|---|
| `tools/original-language/lexicon/stepbible.js` | new `emitRuntime(lang, lemmaArr)`: every mapped TBES entry (auto-adopted **and** review-routed) + lemma→entry index. Entry = `[dStrong, English Gloss, reviewCodes]`; codes `T` theological, `V` variant relation, `M` non-standard markup, `P` POS-class conflict, `L` legacy multi-id merge; `""` = adopted by external-source match. |
| `lib/pipeline.js` | `dict.step = {source_commit, entries, lemma_to_step}` in `hebrew/dict.js` and `greek/dict.js`; `stepbible` corpus in attribution and manifest; fails closed if the TBES cache does not match `stepbible.lock.json`. |
| `lib/validate.js` + `expected.json` | +8 checks (98 → **106**): layer shape/commit pin, exact counts, English-only (no Hangul, no Korean key), VERIFIED-Korean counts unchanged, Hebrew/Greek fixtures, VERIFIED-lemma co-resolution, STEPBible attribution. |
| `original-language-word-card.js`, `styles.css` | card shows a labelled **영어 뜻** row (`· 출처 STEPBible (CC BY 4.0)`, `(검토 중)` for review-routed entries). Korean "기본 뜻" stays VERIFIED-only; otherwise "한국어 뜻은 검수 후 제공됩니다." (no Korean invented). A dictionary without `step` renders exactly as before. |
| `tests/stepbible-runtime.test.js` | full-corpus lexical QA (below). |

Not changed: the VERIFIED ledgers, `expected.json lexical` counts (6,121 H / 1,258 G), text/analysis/reference-map files, `app.js`, `krv.js`, `index.html`, **production `data/original-language/` (still build `69e01ba0ef15b476`)**.

## Builds

- New staging: `.build/original-language/` = **`63da92a1d3306565`** (106 checks, reproducible: two builds → same id).
- Previous staging preserved: `.build/original-language.prev-b01c2f62fc5cdfda/`.
- Production: `69e01ba0ef15b476` untouched.
- Size: Hebrew `dict.js` 336 KB → 1,012 KB raw (gzip 301 KB); Greek 152 KB → 372 KB raw (gzip 100 KB). Loaded once per corpus. If this is too heavy for first paint, split `step` into its own lazily loaded asset before binding.

## Coverage (all tokens, real `describe()` on every token of all 66 books)

| | Hebrew | Greek |
|---|---:|---:|
| tokens | 306,785 | 137,741 |
| English (STEPBible) | 301,397 (98.24%) | 133,948 (97.24%) |
| Korean (VERIFIED) | 182,078 (59.35%) | 37,251 (27.04%) |
| both | 177,903 | 37,115 |
| English only (Korean pending, nothing invented) | 123,494 | 96,833 |
| Korean only (TBES exception lemma) | 4,175 | 136 |
| neither / no analysis | 1,213 | 3,657 |
| tokens on review-routed entries | 80,051 | 58,871 |
| entries / mapped lemmas | 9,190 / 20,547 | 4,895 / 4,960 |

VERIFIED ledger linkage: 14,075 Hebrew + 1,231 Greek VERIFIED lemmas co-resolve with a STEPBible entry; 105 H / 40 G VERIFIED lemmas are TBES exceptions (e.g. אֱלֹהִים) and keep their Korean with no English source row. None are dropped.

## QA

- `tests/stepbible-runtime.test.js`: per token — Korean present ⇔ VERIFIED ledger entry and text equals ledger; English present ⇔ STEPBible mapping; no Hangul in English; Korean never equals English; no-`step` dictionary renders as before; Korean layer, lemma/morph tables, every book file and the reference map are identical to the preserved previous build (modulo build_id); attribution complete. 4/4.
- Other suites unchanged and green: run 16, stepbible 15, hebrew-lexicon 10, greek-lexicon 10, reconcile 8, loader 13, research-evidence 12, `lexicon/qa.js` 20/20.
- Real UI on a scratch copy of the app with the staging data (production data not used): OT gen-21:3 (אברהם → 아브라함 / Abraham; הנולד → 낳다 / to beget; לו → ~에게 / to/for (검토 중)), NT jhn-3:16 (ἠγάπησεν / θεός / κόσμον → English only + "한국어 뜻은 검수 후 제공됩니다.").
- `?qa=ol` in the preview pane still reads 12/29 with the identical failure pattern as the documented environmental baseline (hidden pane); it cannot be used as signal here.

## Things the Captain should know

1. English glosses are Tyndale's, shown as-is, with theological/variant entries marked "검토 중" (e.g. God, love, Christ). Korean glosses are not touched by this task.
2. 475 H / 75 G VERIFIED Korean entries are in the VERIFIED-vs-TBES precise-review queue (`inputs/reconciliation/*.tsv`). They still show their VERIFIED Korean as instructed; "no link found" ≠ wrong.
3. Sample worth a look: gen-1:1 הָאָרֶץ → 땅 beside "land: country/planet" (M-flag).

## Captain Gate — production promotion (not done)

1. In `tools/original-language/expected.json` set `bind.build_id` = `63da92a1d3306565` and `bind.build_checks` = `106` (deliberately **not** done now: `bind` compares staging against these and, as is, refuses the new build — production stays verifiably on `69e01ba0ef15b476`).
2. Run:

```bash
node tools/original-language/build.js bind
```

`bind` copies staging byte-for-byte into `data/original-language/`, which also puts the STEPBible attribution into production. The loader/UI need no further change; the old production build is the git-untracked `data/original-language/` today, so copy it aside first if a rollback copy is wanted.

## PROMOTED — Captain approval received (same day)

Verdict: `STEPBIBLE_RUNTIME_PROMOTED__PRODUCTION_63da92a1d3306565__PREDECESSOR_69e01ba0ef15b476_PRESERVED`

- Predecessor 69e01ba0ef15b476 (71 files, sha256-identical copy) preserved at `tools/original-language/predecessors/69e01ba0ef15b476/`; rollback = move it back to `data/original-language/` after setting `expected.json bind` back (record in `bind.predecessor`).
- `expected.json bind` = `63da92a1d3306565` / 106 checks; `build.js bind` verdict `RUNTIME_DATA_BOUND_READY_FOR_LOADER_IMPLEMENTATION`, 33 post-bind checks, production byte-identical to staging, protected app files unchanged; re-run = `ALREADY_BOUND_VERIFIED`.
- Re-verified on production: full-token QA (`JBC_OL_QA_DIR=data/original-language node tools/original-language/tests/stepbible-runtime.test.js`) 4/4 with the same coverage numbers; loader 13/13, research-evidence 12/12; real app cards gen-21:3, mat-1:2, jhn-3:16 show VERIFIED Korean only where it exists, STEPBible English with source credit, and no invented Korean.
- Caveat: a browser holding the old cached `dict.js` can briefly show an original-language load error (BUILD_MISMATCH fail-closed) until its cache refreshes.
