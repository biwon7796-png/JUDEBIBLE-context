# HANDOFF — Genesis 22:1–19 Source Pack v2 → Project01 WORBS (E2E pilot input)

date: 2026-10-06 · owner of research: 01_목회연구_WORBS_BICS · assembler: JudeBible WebApp
status: `HANDOFF_READY__E2E_RUN_PENDING_PROJECT01_EXECUTION`
base pack: `PASSAGE_SOURCE_PACK_PILOT_GENESIS_22_1_19_20261006.md` (still authoritative for TARGET / EXISTING_RESEARCH / ENTITIES / EVIDENCE / UNCERTAINTY / PROVENANCE). This file **supersedes only its TEXT.lexical_layer and runtime-build items**, which went stale after the STEPBible promotion.

Input-assembly only: no interpretation, no new identity, no registry/gate/pipeline change.

## 1. What changed since the pilot pack

| Pack item | Was | Now |
|---|---|---|
| OL runtime build | `69e01ba0ef15b476` (candidate) | **`63da92a1d3306565`** bound to `data/original-language/` (Captain-approved 2026-10-06; predecessor preserved). U-RUNTIME-BUILD → resolved as "bound build is 63da92a1…"; the manifest file still carries the builder's `production_adopted:false` flag, so Project01 should cite the Captain approval, not that flag. |
| `gen.js` sha256 | `326d5dab…` | `26ba6f83ff7cb601675617f3a592a22699636780606d850ff4a26700bc592f3f` (text/analysis content identical; only build_id header differs) |
| `dict.js` sha256 | `5ae664c6…` | `d362c9e4ee03f969ab4403ba56fd3468a412107a86b595e5a0f6b3a841371d36` |
| `manifest.js` / `attribution.js` sha256 | — | `f9c73183d9e65f3e700fc72981c92fadb9b194f9e535954e0af1f5d958b57d57` / `29a6b1330d990da52fc446d5c759a0f64f5d048a60f5a0e3219417c3dcad46f0` |
| KRV `data/krv.js` sha256 | `b09a58f1…` | unchanged `b09a58f1527bb32ccc554d5208736a3c797ba9b7ab1a87d50e9c577372518896` (KRV still UNVERIFIED_TRANSCRIPTION / RIGHTS_VERIFY) |
| Lexical layer | 8 VERIFIED Hebrew glosses; 41 tokens mapped | VERIFIED Korean ledger **6,121 H** + **STEPBible TBESH English Gloss layer** (commit `1f3423d42400f59f1f30fe08f74e38fcd3bbf7bc`, CC BY 4.0, Gloss column only) |

## 2. Lexical coverage of Gen 22:1–19 (production data, measured)

- 19 verses, **307 tokens**, 142 distinct lemma strings, 0 tokens without analysis.
- VERIFIED Korean basic gloss: 186 tokens / 93 lemmas.
- STEPBible English gloss: 300 tokens / 137 lemmas (35 lemmas are review-flagged: T theological, V variant, M markup).
- Both: 181 tokens. Korean only (TBES exception, e.g. אֱלֹהִים ×5): 5 tokens; English only: 119. Neither: 2 tokens.
- Per-lemma table (frequency order, Korean + English + Strong + review codes): `tools/original-language/verification/gen22_1-19_lexical_table.json`.

Semantics: **short lexical gloss only**. Korean is shown only where VERIFIED; no Korean is invented for English-only lemmas. TBES glosses are Tyndale's wording, not contextual meaning; flagged entries (e.g. 3068 "LORD", בֵּן "son: child", "God") are not research conclusions. The 475 H / 75 G VERIFIED-vs-TBES precise-review rows are not resolved (a Korean/English difference ≠ proven error).

Required credits when any of this is quoted: STEPBible/Tyndale House (CC BY 4.0), OSHB (CC BY 4.0), Open Scriptures Hebrew Lexicon (CC BY 4.0) — see `data/original-language/attribution.js`.

## 3. Retained VERIFY items (unchanged unless noted)

Abraham reference asset exact id/SHA and stable identity not established · Isaac stable identity not issued · legacy Drive WORBS Gen 22 doc = prior work only · KRV rights/transcription · Moriah location / 2 Chr 3:1 / route = HOLD or Project01 exegesis.

## 4. E2E pilot — what Project01 should do and what counts as pass

Input to give Project01 (in this order): this file → the base pack → the lexical table JSON. Project01 runs its approved WORBS/BICS end-to-end runtime (`PROJECT01_WORBS_BICS_END_TO_END_RUNTIME_v1.0_APPROVED`, minimum handoff schema v1.0) on Genesis 22:1–19.

Pass criteria (checkable without judging theology):
1. Starts without asking WebApp to re-find any source (completion question of the base pack).
2. Output carries the seven handoff fields and cites the production build `63da92a1d3306565` and KRV sha.
3. Uses Isaac / Beersheba assets with their retained VERIFY; does **not** issue Abraham / Isaac / Moriah identities.
4. Lexical glosses quoted only from the table; no contextual meaning attributed to the table; Moriah/route stay HOLD.
5. Legacy Drive document used only as prior work.
6. Returns a result that the WebApp projection pipeline can ingest **unchanged** (no new gate).

After Project01 returns the result, WebApp side: run the existing research→projection pipeline in staging and report what binds; nothing is promoted without Captain approval.

## 5. What was NOT done

- WORBS itself was **not executed**: Project01 lives outside this repository, and the only local path I found is the live-provider gateway scripts in `F:/Projects/PROJECT13_*` (8790/8792), which spend provider calls and were not invoked without your go-ahead.
- No change to the base pack file, registries, runtime, gates, or production data.
