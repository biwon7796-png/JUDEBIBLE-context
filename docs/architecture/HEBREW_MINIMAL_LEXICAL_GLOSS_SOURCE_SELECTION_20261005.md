# Hebrew minimal lexical gloss source — selection and binding (2026-10-05)

Verdict: `HEBREW_MINIMAL_LEXICAL_GLOSS_SOURCE_SELECTED_AND_BINDABLE`

## Source
- `openscriptures/HebrewLexicon`, commit `21c9add13bc727d3a951361778e97e3ff7afd1ce` (2019-09-02; still upstream master head as of 2026-10-05).
- Used: `AugIndex.xml`, `LexicalIndex.xml`. Cross-check only: `HebrewStrong.xml`. Not used: BDB, TWOT, Strong definitions.
- License: CC BY 4.0, stated in upstream `readme.md` (GitHub shows no LICENSE file — the readme is the only statement; Strong's/BDB texts themselves are public domain). Credit: Open Scriptures Hebrew Bible Project.
- Lock + sha256: `tools/original-language/lexicon/hebrew-lexicon.lock.json` (files cached outside git in `_cache/hebrewlex`).

## Measured: what the OSHB runtime `lemma` is
It is the OSHB *augmented Strong number*, not a plain Strong number: values like `1121 a`, `c/7121` (prefix particles split by `/`; the word's own lemma is the last segment), and `1009+`. It maps to the lexicon **only through `AugIndex.xml`** (`aug="1121a"` → lexical-index id `bss`, spaces removed). Number equality alone is never used.

## Measured: mapping quality (all 306,785 analysed Hebrew tokens)
| result | tokens | note |
|---|---|---|
| OK (AugIndex → LexicalIndex, entry's own Strong xref agrees) | 305,912 (99.72%) | 20,702 distinct lemma strings |
| UNMAPPED | 825 | 801 are `NNNN+` lemmas (not in AugIndex, rejected by design), 24 not in AugIndex |
| CONFLICT | 48 | one key: aug `2007` → entry whose xref says Strong 2004 → excluded |

Fixtures (all verified through AugIndex and by the entry's own Strong xref): `1642`=גְּרָר Gerar (Np); `3327`=יִצְחָק (Np); `3446`=יִשְׂחָק (Np); `7121`=קָרָא call (V); `85` Abraham; `1121 a` בֵּן son (N); `430` אֱלֹהִים "gods".

## Quality caveats (why Korean glosses need review)
- LexicalIndex `<def>` is a short English BDB-style word, but not clean: `3327`/`3446` read "Isaac. Compare", others carry fragments ("Sirah. See also"). English is kept only as the review source.
- 61 entries differ substantively from the Strong headword of the same number (BDB-based index vs Strong; e.g. aug 15 `bnx` "entreat" vs Strong H15 אָבֶה). The AugIndex bridge is OSHB's own, so it is the binding authority; Strong text is not used.
- `אֱלֹהִים` = "gods" is theologically sensitive; display gloss must be a reviewer decision.

## Korean gloss structure (no AI runtime translation, nothing auto-authoritative)
`tools/original-language/inputs/hebrew-gloss-ko.review.json`, keyed by lexical id: `{headword, glossEn (upstream), glossKo, review:{status,reviewer,date}}`. Only `VERIFIED` entries pass `emitRuntime()`; drift from upstream headword/def, missing Korean, or unreviewed status is rejected. Currently 8 fixture entries are `PROPOSED_UNREVIEWED` → **0 entries ship**. Unreviewed lemmas keep `기본 뜻 준비 중`.

## Code and tests
`tools/original-language/lexicon/hebrew-lexicon.js` (`verify`, `report`, `resolve`, `emitRuntime`), `tests/hebrew-lexicon.test.js` (10/10): valid mapping, prefixed lemma, unknown/`+` → UNMAPPED, wrong mapping and forged AugIndex → CONFLICT, Korean gate. Existing: loader 13/13, research-evidence 12/12, build 16/16, `build.js --check` OK. App, runtime data, Greek card unchanged.

## Next
`IMPLEMENT_HEBREW_BASIC_GLOSS_IN_WORD_CARD` — after a reviewer marks entries `VERIFIED`; emit a runtime lexicon (id → headword, glossKo) plus the OSHB-lemma→id table for verified entries only, and show 표제어/품사/기본 뜻 in the Hebrew card.
