# THEOLOGICAL_SENSITIVE KEEP/EDIT/HOLD decisions → review ledgers → runtime staging refresh — 2026-10-06

Task: `IMPORT_VERIFIED_THEOLOGICAL_GLOSS_DECISIONS_AND_REFRESH_JUDEBIBLE_ORIGINAL_LANGUAGE_RUNTIME`

Verdict: `THEOLOGICAL_DECISIONS_IMPORTED__STAGING_d574e41c82b84a06_VERIFIED__PRODUCTION_STILL_63da92a1d3306565`

## Import (`lexicon/theo-import.js plan|apply`)

Decisions: `inputs/review-log/theo-review-2026-10-06.{hebrew,greek}.decisions.tsv` (346 H + 285 G rows, decided at TBES-entry level). Each KEEP/EDIT entry is written to **every legacy lexical id** of that TBES entry (the ledger is keyed by OS / Dodson id). TBES English is never edited.

| | Hebrew | Greek |
|---|---:|---:|
| KEEP / EDIT / HOLD | 264 / 77 / 5 | 241 / 44 / 0 |
| ledger ids written | 341 | 284 |
| newly VERIFIED | 260 | 276 |
| VERIFIED Korean replaced (EDIT) | 45 | 1 |
| already VERIFIED and equal (confirmation recorded only) | 36 | 7 |
| not importable (no legacy lexical id) | 0 | 1 (G4957 συσταυρόομαι "to crucify with", 5 tokens — not invented, stays English-only) |
| VERIFIED entries before → after | 6,121 → **6,381** | 1,258 → **1,534** |

Provenance on every written entry: `review.source = THEOLOGICAL_SENSITIVE_TBES_GLOSS_RESOLUTION_20261006`, `tbes`, `tbesGlossEn`, `decision`, reviewer `CLAUDE_MODEL_ASSISTED_LEXICAL_REVIEW__THEOLOGICAL_SENSITIVE_RESOLUTION__CAPTAIN_DIRECTED_2026-10-06`. EDIT replacements carry append-only `review.history[]` with the replaced Korean/status/reviewer/date; already-equal VERIFIED entries keep their original reviewer and gain `review.confirmations[]`. Pre-import ledger copies: `inputs/review-log/ledger-backups-pre-theo-import-20261006/` (sha256 before/after in `verification/theological-import-apply.json`).

**HOLD (5, fail-closed, nothing written):** H1389G Gibeath-elohim / hill (71 tokens), H4035 fear, H1784 judge, H2309 world, H8293 remnant (1–2 tokens each). Their existing ledger/runtime state is unchanged.

## Staging rebuild

- New staging **`d574e41c82b84a06`**, 106 checks (expected.json `lexical` = 6,381 H / 1,534 G). Two deliberate fixture updates: בֵּן Korean "아들" → "아들, 자식" (EDIT); YHWH now resolves to "여호와" (KEEP) instead of English-only.
- Previous staging (= production 63da92a1…) preserved at `.build/original-language.prev-63da92a1d3306565/` and `tools/original-language/predecessors/63da92a1d3306565/`; 69e01ba0… predecessor from the last promotion is still in `predecessors/`.
- **Production `data/original-language/` untouched (63da92a1d3306565); `expected.json bind` untouched.**

## QA

- Full token QA, all 66 books (real card `describe()`): Korean ⇔ VERIFIED ledger, English ⇔ STEPBible, never mixed; text/analysis/step layers identical to previous build; Korean differs only in source-stamped decision ids (Hebrew +260 new / 45 replaced, Greek +276 / 1) — 4/4.
- Token coverage with Korean: Hebrew 59.35% → **68.85%** (211,229), Greek 27.04% → **36.50%** (50,275); English unchanged (98.24% / 97.24%).
- Suites: stepbible 15, hebrew-lexicon 10, greek-lexicon 10, reconcile 8, theo-resolve 7, loader 13, research-evidence 12, run 16, `lexicon/qa.js` 20/20.
- Real UI (scratch app copy on staging data): gen-21:3, gen-12:1, jhn-3:16, mat-1:1 — יהוה 여호와 / LORD(검토 중), θεός 하나님, 신, Ἰησοῦς 예수, χριστός 그리스도, υἱός 아들, 자손, κόσμος 세상, 우주; unreviewed words show English only with "한국어 뜻은 검수 후 제공됩니다."

## Promotion (not done — awaiting Captain)

Set `expected.json bind` to `d574e41c82b84a06` / 106, move current `data/original-language/` aside (already copied to `predecessors/63da92a1d3306565/`), `node tools/original-language/build.js bind`. The model-made decisions still deserve the human spot-check sheet before promotion.
