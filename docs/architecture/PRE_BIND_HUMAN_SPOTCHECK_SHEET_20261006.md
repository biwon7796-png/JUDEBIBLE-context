# Pre-bind human spot-check sheet — 2026-10-06

Task: `BUILD_PRE_BIND_HUMAN_SPOTCHECK_SHEET_FOR_TOP_FREQUENCY_HEBREW_GREEK_GLOSSES`

File: `tools/original-language/inputs/review-log/pre-bind-human-spotcheck-2026-10-06.tsv` (UTF-8 with BOM, opens in Excel; 550 rows). Stats: `tools/original-language/verification/pre-bind-spotcheck-stats.json`. Generator: `node lexicon/spotcheck.js [--top N] [--random N]` (read-only; the VERIFIED ledgers and `data/` are unchanged).

## Contents

| | Hebrew | Greek |
|---|---:|---:|
| TBES-mapped entries (universe) | 9,190 | 4,895 |
| rows | 299 | 251 |
| TOP 150 by token frequency | 150 (57.18% of tokens) | 150 (70.57%) |
| TARGETED: Korean changed against a VERIFIED gloss / HOLD | 44 / 5 | 1 / 0 |
| RANDOM, seeded, stratified by frequency (10+, 3–9, 2, 1) | 100 | 100 |

Columns: `tbesEnglish` (the STEPBible gloss, shipped at bind), `koreanShown` and `koreanSource` (`VERIFIED_LEDGER`, `THEO_KEEP`, `THEO_EDIT`, `PROPOSAL_AGREES_WITH_TBES`, `NONE`), `koreanShipsAtBind` (yes only for VERIFIED-ledger Korean), `route` (`AUTO`, `RESOLVED_BY_REVIEW`, `HOLD`, `QUEUE_PENDING`), `legacyEnglish`, `reviewFlags`, `freq`, `cumTokenPct`, `note`. Fill the last three columns: `human_check` (OK / FIX / UNSURE), `fixKo`, `comment`.

## What to look at first

- Of the Hebrew top 150, 143 have a Korean gloss and only 97 are VERIFIED-ledger Korean that would ship; 20 are `QUEUE_PENDING` (no Korean yet, e.g. אֵת, אֶל). Greek: 130 have Korean, only 20 ship, 32 are `QUEUE_PENDING` (function words such as ὁ, αὐτός, ἐν).
- `THEO_EDIT` rows are model decisions not yet in any ledger; `THEO_KEEP` and `PROPOSAL_AGREES_WITH_TBES` Korean is model-written and agreed with the TBES English only by the automatic cross-check.
- The reviewer of all of these was the model, so this sheet is the first independent human look.

## Not covered

Lemma strings that did not map to TBES (Hebrew 523, Greek 535) and the 550-entry reconciliation precise-review queue are outside this sheet.

## Captain priority 60

`tools/original-language/inputs/review-log/pre-bind-captain-priority-60-2026-10-06.tsv`: 30 Hebrew + 30 Greek rows taken from the master sheet, all from the top-frequency band (about 30% to 45% of tokens), with a `pick` and `why` column. Quotas per language: 10 model theological decisions (`THEO`), 8 VERIFIED Korean that ships at bind (`SHIPS`), changed-against-VERIFIED or HOLD rows (`CHANGED`; Greek has only 1), 4 rows still in the review queue (`PENDING`), 3 model Korean agreed only by the automatic cross-check (`AUTO`), and top-ups from the next highest-frequency rows so each language reaches 30. Fill `captain_check`, `fixKo`, `comment`.
