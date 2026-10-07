# Original-language: freeze released, final state recorded — 2026-10-06

Verdict: `PRODUCTION_fc4e2b338c78bc69_CONFIRMED__FREEZE_RELEASED__NORMAL_OPERATION`

## Final state (record: `verification/final-state-fc4e2b338c78bc69.json`)

- Production `data/original-language/` = **fc4e2b338c78bc69**, 71 files, byte-identical to the frozen candidate `.build/candidate-fc4e2b338c78bc69`.
- Predecessor **136b1ad94935ef23** preserved at `tools/original-language/predecessors/136b1ad94935ef23/` (71 files; older: 63da92a1…, 69e01ba0…, a8f15190…).
- `expected.json bind` = fc4e2b338c78bc69 / 106 checks. Both ledgers' sha256 still equal the frozen record (only `expected.json` differs from the freeze snapshot, by the bind update).
- Bind record `RUNTIME_DATA_BOUND_READY_FOR_LOADER_IMPLEMENTATION` (33 post-bind checks); re-verify `ALREADY_BOUND_VERIFIED`. Post-bind QA: loader 13/13, lexical QA 20/20, full Hebrew/Greek token QA 4/4, 106 build checks.
- Coverage (Korean VERIFIED tokens): Hebrew **92.45%** (6,490 entries), Greek **90.50%** (2,078); English (STEPBible) 98.24% / 97.24%.
- Freeze archived as `verification/freeze-record-fc4e2b338c78bc69.json`, then `FREEZE.json` removed with `node lexicon/freeze.js release` (that command deletes only that file; no ledger, `.build`, production or bind baseline write).

## NORMAL_OPERATION

Writers (imports, `build.js`, `review.js import`) are unblocked again; the guard in `lib/freeze-guard.js` stays and is inert without a `FREEZE.json`. Rules for parallel sessions: `plan` modes are read-only except that they overwrite their own `verification/*-plan.json`; check ledger sha + `expected.json` before any apply/build; any promotion needs Captain approval and `bind` baseline update.

## Long-tail maintenance queue (not blocking)

| | Hebrew | Greek |
|---|---:|---:|
| TBES-mapped entries without VERIFIED Korean | 2,732 entries / 21,944 tokens (frequency < 100) | ≈13,017 tokens (frequency ≤ 14, incl. 71 unkeyable entries + G4957) |
| unresolved TBES exceptions (variant/homonym/unmapped) | 523 lemmas / 5,388 tokens | 535 lemmas / 3,115 tokens |
| source conflicts (retained, not auto-resolved) | 378 lemmas / 5,465 tokens | 256 lemmas / 1,968 tokens |
| review-routed TBES entries | 1,166 | 775 |
| HOLD | H0639I, H1389G, H4035, H1784, H2309, H8293 | — |

Continue with `lexicon/{hebrew,greek}-gap-import.js` plus a decision TSV per batch; re-promote only via the Captain gate.

## Process notes

Two of my read-only-intended commands rewrote their own report files: `build.js bind` re-verify (`bind-reverify-latest.json`) and `hebrew-gap-import.js plan` (`verification/hebrew-gap-import-plan.json`, regenerated from the apply report with a note). Ledgers, `.build`, production and bind baseline were not changed.
