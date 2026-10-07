# Captain priority review — ledger import and staging rebuild — 2026-10-06

Task: `IMPORT_CAPTAIN_REVIEWED_PRIORITY_60_GLOSSES_TO_LEDGER_AND_REBUILD_STAGING`

Verdict: `CAPTAIN_DELTA_IMPORTED__STAGING_REBUILT_AND_GREEN__PRODUCTION_NOT_BOUND`

## What was imported

Source: the Captain's returned sheet (`inputs/review-log/captain-review-2026-10-06.decisions.tsv`, provenance in `_make_captain_decisions.js`). 53 decisions: 33 FIX with the Captain's `fixKo`, and 20 OK (2 listed explicitly, 18 named by code in the Captain's message). Every code and form matched the master spot-check sheet. Importer: `lexicon/captain-import.js plan|apply` (ledgers backed up to `inputs/review-log/ledger-backups-pre-captain-import-20261006/`).

Rules applied:
- FIX: the Captain's Korean is the basic gloss, `status VERIFIED`, reviewer `CAPTAIN_LEXICAL_REVIEW__PRE_BIND_PRIORITY_SPOTCHECK_2026-10-06`, replaced entries kept in `review.history`. Square brackets in the Korean were written as parentheses (the ledger alphabet has none).
- OK: the current Korean is kept. Entries already VERIFIED by the model keep their original review and gain `captain_spotcheck` plus a confirmation; model-proposal-only entries become VERIFIED with the Captain as reviewer.
- Source conflicts are not cleared: the five former TBES HOLD entries (גִּבְעָה, מְגוּרָה, דִּינָיֵא, חֶדֶל, שֵׁרוּת) and one Greek POS-class conflict carry `source_conflict = retained` and `review_note = Captain lexical localization decision`. The TBES review codes in the runtime step layer are unchanged.
- Untouched: TBES English, corpus, lemma binding, morphology, Strong mapping, `data/original-language/` (production).

## Result

| | Hebrew | Greek |
|---|---:|---:|
| TBES entries decided (FIX / OK) | 13 / 9 | 20 / 11 |
| ledger ids written | 22 | 30 |
| **newly VERIFIED** | **10** | **24** |
| VERIFIED Korean replaced by FIX (history kept) | 5 | 0 |
| OK confirmations of existing VERIFIED | 7 | 6 |
| VERIFIED entries total | 6,381 → **6,391** | 1,534 → **1,558** |
| **Korean token coverage** | 68.85% → **78.17%** (+9.32 pt) | 36.68% → **56.00%** (+19.32 pt) |

Coverage counts tokens on VERIFIED ledger entries over all tokens (Hebrew 306,785, Greek 137,063). The Greek jump comes from καί, αὐτός, δέ, εἰμί, εἰς, πρός, γίνομαι, τις, ὡς, μέν and other function words that had no VERIFIED Korean.

Staging: build `136b1ad94935ef23`, 106 checks green. `expected.json` lexical counts bumped to 6,391 / 1,558. `lexicon/qa.js` 20/20, and the existing test files all pass. `tests/stepbible-runtime.test.js` needed one change: it now accepts Korean differences stamped by either the theological import or this Captain import (it still rejects anything unstamped).

Representative cards (staging data run through the real word-card `describe()`): Gen 1:1 אֵת → "(목적격 표제어), ~을/를" / EN "[Obj.]"; Gen 1:2 הָיָה → "있다, 되다, 일어나다" / "to be"; Gen 12:1 אֶל → "~로, ~에게(향하여)"; Ps 23:1 יהוה → "여호와" / "LORD"; John 1:1 καί → "그리고, 또한, 곧" / "and", λόγος → "말, 말씀" / "word", θεός → "하나님, 신"; John 1:3 αὐτός → "그, 그 자신, 바로 그".

## Things to confirm

1. `אֵת` is stored as "(목적격 표제어), ~을/를" exactly as written. "표제어" means headword; "목적격 표지" (accusative marker) may have been meant. One-line change if so.
2. `οὕτως` (G3779) could not be written: its lemma has no ledger key (MACULA/Dodson headword mismatch) and lemma binding may not change. Its Korean stays unimported.
3. The Captain's list covers only 12 of the 60 rows in the priority-60 file I sent (the Captain worked from other master-sheet rows). The 48 other rows (e.g. ὁ, σύ, ἐν, λέγω, οὐ, אָמַר, עַל) were not mentioned in the reply and were not assumed OK; they are unchanged.

## Not done

Production `data/original-language/` is still `69e01ba0ef15b476`. To promote only the localization delta: the build id to bind is `136b1ad94935ef23` (`expected.json` `bind.build_id` / `build_checks` must be set to match, then `node build.js bind`), on the Captain's go.

## Correction (same day)

H0853 אֵת (ledger id `bhu`): Korean corrected from "(목적격 표제어), ~을/를" to "목적격 표지, ~을/를" (표제어 = headword was a slip for 표지 = marker). Review status, reviewer and source are unchanged; the change is recorded in `review.corrections`. No other ledger entry, TBES English, binding, morphology or corpus file changed. Final staging build: **136b1ad94935ef23**, 106 checks; token QA (`stepbible-runtime.test.js`), `lexicon/qa.js` 20/20 and the other test files pass. Counts unchanged: VERIFIED 6,391 / 1,558, Korean token coverage 78.17% / 56.00%. This build id replaces f921dfe86f9ef051 as the one to bind.

## Promotion (Captain go, same day)

`CAPTAIN_APPROVE_FINAL_ORIGINAL_LANGUAGE_RUNTIME_PROMOTION_136b1ad94935ef23_WITH_63da92a1d3306565_PREDECESSOR_PRESERVED`

`data/original-language/` was holding build `63da92a1d3306565` (a byte-identical copy already existed at `tools/original-language/predecessors/63da92a1d3306565`, verified before the swap). `expected.json` `bind` was set to `136b1ad94935ef23` / 106 checks with predecessor `63da92a1d3306565` (and `69e01ba0ef15b476` kept under `earlier_predecessors`). The previous production directory was moved aside to `.build/superseded-production-63da92a1d3306565` (not deleted), then `node build.js bind` ran: verdict `RUNTIME_DATA_BOUND_READY_FOR_LOADER_IMPLEMENTATION`, 71 files, 33 post-bind checks, 0 failed, production byte-identical to staging, protected app files unchanged. The earlier bind record is kept as `verification/bind-record.63da92a1d3306565.json`; the new one is `verification/bind-record.json`. Token QA re-run against the bound data passes. Predecessors preserved: 63da92a1d3306565, 69e01ba0ef15b476, a8f15190ff7e32a6.
