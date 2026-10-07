# Combined Hebrew + Greek Korean-coverage candidate — freeze and validation — 2026-10-06

Task: `FREEZE_CONCURRENT_WRITES_AND_VALIDATE_COMBINED_HEBREW_GREEK_90PCT_CANDIDATE_fc4e2b338c78bc69`

Verdict: `CANDIDATE_FROZEN_AND_VALIDATED__PRODUCTION_136b_UNCHANGED__BIND_NOT_RUN`

## Freeze

- The only other writer was the session "STEPBible 어휘층 통합". It was asked by cross-session message to stop and acknowledged: no writes under `tools/original-language`, `.build`, `data/original-language`, no rebuild or bind. Its changes since 16:22 were the Hebrew gap fill (+99 Hebrew VERIFIED, `hebrew-gap-import.js`, `gap-extract.js`, decisions TSV, one source label added to the allowed list in `tests/stepbible-runtime.test.js`), the staging rebuild to `fc4e2b338c78bc69`, and its freeze tooling.
- Enforced freeze: `lexicon/freeze.js freeze` wrote `tools/original-language/FREEZE.json`. While it exists, `lib/freeze-guard.js` makes every ledger / `.build` writer (the five import scripts, `review.js import`, `build.js build`) refuse with exit 3. `bind` and read-only commands are not blocked. Release deliberately with `node lexicon/freeze.js release`. Fix made while freezing: `freeze.js` used `fs.cpSync`, which crashes node silently (exit 127) on this Windows/Node 24 setup; it now copies file by file.
- Frozen bytes: staging `.build/original-language` == immutable read-only copy `.build/candidate-fc4e2b338c78bc69` == my own copy `.build/frozen-fc4e2b338c78bc69`; combined sha256 over the 71 runtime files (excluding `reports/`) `bf2ec5a198ff4b1b…` (full value in `.build/frozen-fc4e2b338c78bc69.sha256`). Inputs hashed in FREEZE.json: Hebrew ledger `ef9d906614836349…`, Greek ledger `9b2593a5663f48db…`, `expected.json` `0f918fbde88edb2d…`, corpus and STEPBible locks. `freeze.js verify`: 0 drift.

## Production

`data/original-language/` is `136b1ad94935ef23` and identical to `tools/original-language/predecessors/136b1ad94935ef23` (71 files, combined hash `9afa56608f97fa15…`); `verifyDir` on production: 27 checks, 0 failed. `expected.json` `bind` is still `136b1ad94935ef23` (106 checks). The production directory was not emptied or moved during this task.

## Validation of the candidate (run against the frozen copy)

| check | result |
|---|---|
| build validation report | 106 checks, 0 failed, build `fc4e2b338c78bc69` |
| `verifyDir` on the frozen copy | 27 checks, 0 failed |
| manifest | 70 files listed, `runtime_candidate` true, `production_adopted` false |
| full token QA (`tests/stepbible-runtime.test.js`, every Hebrew and Greek token through the real word card) | pass |
| loader (`tests/loader.test.js`) | 13/13 |
| lexical QA (`lexicon/qa.js`) | 20/20 |

Coverage computed straight from the frozen dictionaries:

| | VERIFIED entries | tokens with Korean | coverage |
|---|---:|---:|---:|
| Hebrew | 6,490 | 283,628 / 306,785 | **92.45%** |
| Greek | 2,078 | 124,046 / 137,063 analysed (137,741 all) | **90.50%** (90.06% of all tokens) |

Both gap fills are in the same candidate. Note `tests/loader.test.js` compares production against `expected.json` `bind`, so it only passes while `expected.bind` equals the bound production build; keep them equal until the final promotion.

## Not done / next

No bind baseline change, no bind. To promote after Captain's go: release nothing yet; set `expected.json` `bind.build_id` = `fc4e2b338c78bc69` (106 checks, predecessor `136b1ad94935ef23` preserved at `predecessors/136b1ad94935ef23`), then run `node build.js bind`. `bind` requires the production path to be absent; if the directory cannot be renamed, move its files out and remove the empty directory, restore from the predecessor copy if bind refuses, and only do this when bind success is assured (for example by first confirming staging identity with `verifyDir`).

## Promotion (Captain go, same day)

`CAPTAIN_APPROVE_COMBINED_HEBREW_GREEK_90PCT_RUNTIME_PROMOTION_fc4e2b338c78bc69_WITH_136b1ad94935ef23_PREDECESSOR_PRESERVED`

Order followed: `freeze.js verify` drift 0; staging and the immutable candidate copy both equal the frozen hash `bf2ec5a198ff4b1b…` (71 files); production `136b1ad94935ef23` equal to `predecessors/136b1ad94935ef23`; only then `expected.json` `bind` was set to `fc4e2b338c78bc69` / 106 checks (predecessor `136b1ad94935ef23`; earlier: `63da92a1…`, `69e01ba0…`; the previous `expected.json` is kept in the session scratch directory). The production directory was removed only after that (it was renamed, into `.build/superseded-production-136b1ad94935ef23/original-language`, and equals the predecessor copy). `node build.js bind`: `RUNTIME_DATA_BOUND_READY_FOR_LOADER_IMPLEMENTATION`, 71 files, 33 post-bind checks, 0 failed, state before bind ABSENT; no retry was needed.

Post-bind, all on the production path: production == frozen candidate byte-identical (combined hash `bf2ec5a198ff4b1b…`); loader 13/13; lexical QA 20/20; full Hebrew + Greek token QA (Hebrew Korean 283,628 tokens, Greek 124,046) pass; run, hebrew-lexicon, greek-lexicon and stepbible tests pass. Representative cards from `data/original-language`: Gen 1:1 אֵת "목적격 표지, ~을/를" / "[Obj.]", Gen 1:2 הָיָה "있다, 되다, 일어나다" / "to be", John 1:1 καί "그리고, 또한, 곧" and λόγος "말, 말씀", Rom 3:23 and Matt 6:9 words with Korean, Acts 1:8 αὐτός/καί/δύναμις with Korean. Still empty, as known: οὕτως, ἐπελθόντος, Σαμαρεία and similar long-tail or unkeyable entries.

`fc4e2b338c78bc69` is the current production original-language runtime; previous builds preserved under `tools/original-language/predecessors/` (`136b1ad94935ef23`, `63da92a1d3306565`, `69e01ba0ef15b476`, `a8f15190ff7e32a6`). `FREEZE.json` is still in place, so ledger and `.build` writers still refuse. `freeze.js verify` now reports exactly one drift, `expected.json` (the intended bind baseline change). Release the freeze only after reviewing this record: `node lexicon/freeze.js release`. Rollback: replace `data/original-language` with `predecessors/136b1ad94935ef23` and restore the previous `bind` block.
