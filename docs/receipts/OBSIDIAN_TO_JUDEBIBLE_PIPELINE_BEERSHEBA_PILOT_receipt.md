# OBSIDIAN_TO_JUDEBIBLE_SINGLE_RECORD_PIPELINE — Beersheba pilot receipt

```yaml
receipt_id: OBSIDIAN_TO_JUDEBIBLE_PIPELINE_BEERSHEBA_PILOT_v0.1
verdict: PASS            # node pipeline tests 21/21 · browser E2E (?qa=pl) 8/8 · full existing regression PASS
source_note: docs/architecture/브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md
source_sha256: 7e3af9f6a78bc7d6c21814c7bfccd36545105d7df8cbc1dd9f1bf98df8aef0f5
stable_id: JBC-CR-PLACE-BEERSHEBA-001
research_mutation: NONE          # the note is opened read-only; its hash is checked in every stage
external_release: NOT_AUTHORIZED
```

## Pipeline (`node tools/pipeline/run.js`)
1. **parse** (`tools/pipeline/parse.js`, `yaml-lite.js`) — 29 sections, 8 fenced yaml blocks, 5 tables; optional YAML frontmatter and Obsidian `[[wikilink|alias]]` / `![[embed]]` handled (the Beersheba note has no frontmatter).
2. **validate** (`validate.js`) — fail-closed: 24 checks, errors 0, warnings 2 (media rights not normalized to the app contract → attribution-only; note has no navigation metadata → none generated).
3. **normalize** (`normalize.js`) — note → existing projection record shape; app-side reader fields come only from `data/projection.overlay.beersheba.json` (declared in `meta.overlay_fields`).
4. **projection** → `data/projection.beersheba.js` (generated; the existing adapter in `app.js` consumes it unchanged).
5. **Scripture Entity Index** (`scripture-index.js`) → `data/scripture.index.js`: 10 verses tagged out of 23 in the 6 DIRECT_MENTION ranges; verses without the name and the STRONGLY_RELATED passages (gen-20, gen-26:1-22) are not tagged.
6. **shared store** (`BVC.store` in `app.js`) — resolves legacy key ↔ stable_id, returns verified index spans, trusts the index only when its source hash equals the projection's.

## Evidence
- parsed note: `tools/pipeline/out/01-parsed.json`
- validation result: `tools/pipeline/out/02-validation.json`
- normalized record: `tools/pipeline/out/03-normalized.json`
- generated projection: `tools/pipeline/out/04-projection.json` (= `data/projection.beersheba.js`)
- Scripture Entity Index: `tools/pipeline/out/05-scripture-index.json` (= `data/scripture.index.js`)
- node test results: `tools/pipeline/out/test-results.json`
- browser E2E report: below

Indexed verses: gen-21:14, gen-21:31, gen-21:32, gen-21:33, gen-22:19, gen-26:23, gen-26:33, gen-28:10, gen-46:1, gen-46:5

## Browser E2E report (verbatim)
```
OBSIDIAN_TO_JUDEBIBLE_PIPELINE_E2E PASS 8/8
PASS PL-01 pipeline_artifacts_exist_validation_passed_and_hashes_trace_to_the_source_note
   · source sha256=7e3af9f6a78bc7d6… bytes=19568
   · validation ok=true checks=24 errors=0 warnings=2
   · node pipeline tests=21/21
PASS PL-02 the_app_runs_the_generated_projection_and_index_not_hand_written_data
   · store.provenance={"record":"JBC-CR-PLACE-BEERSHEBA-001","source_sha256":"7e3af9f6a78bc7d6c21814c7bfccd36545105d7df8cbc1dd9f1bf98df8aef0f5","index_ok":true,"projection_source":{"path":"docs/architecture/브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md","sha256":"7e3af9f6a78bc7d6c21814c7bfccd36545105d7df8cbc1dd9f1bf98df8aef0f5"}}
PASS PL-03 scripture_entity_index_matches_live_KRV_and_tags_only_direct_mention_verses
   · indexed verses=10 → gen-21:14, gen-21:31, gen-21:32, gen-21:33, gen-22:19, gen-26:23, gen-26:33, gen-28:10, gen-46:1, gen-46:5
PASS PL-04 each_indexed_verse_shows_a_tag_and_nothing_else_in_those_chapters_is_tagged
   · tagged verses=gen-21:14, gen-21:31, gen-21:32, gen-21:33, gen-26:23, gen-26:33, gen-28:10, gen-46:1, gen-46:5
PASS PL-05 clicking_a_newly_linked_verse_resolves_one_stable_id_across_scripture_detail_map_guide
   · surfaces={"scripture":"JBC-CR-PLACE-BEERSHEBA-001","detail":"JBC-CR-PLACE-BEERSHEBA-001","state":"JBC-CR-PLACE-BEERSHEBA-001","guide_step":null,"map_note":"JBC-CR-PLACE-BEERSHEBA-001","url":"#gen-21:31&tab=places&e=l.beersheba&panel=open"}
   · dimmed verses (not linked)=30
PASS PL-06 overview_and_map_for_a_newly_linked_chapter_use_the_same_place_without_new_data
   · gen-26 overview places=beersheba/JBC-CR-PLACE-BEERSHEBA-001
PASS PL-07 index_and_projection_failures_fall_back_safely
   · index script missing → tags in gen-21=0 index_ok=false
   · index source hash mismatch → tags in gen-21=0 index_ok=false
   · projection missing (index must be ignored too) → tags in gen-21=0 index_ok=false
   · index span no longer matches KRV text → tags in gen-21=3 index_ok=true
PASS PL-08 no_invention_relations_hidden_navigation_absent_registry_untouched
   · 
```

## Modified / new files
- new: `tools/pipeline/{yaml-lite,parse,validate,normalize,scripture-index,run,test}.js`, `tools/pipeline/out/*`, `data/projection.overlay.beersheba.json`, `data/scripture.index.js`, `qa-pl.js`
- regenerated (previously hand-written): `data/projection.beersheba.js` (old copy: `baseline/projection.pre-pipeline.js`)
- edited: `app.js` (entitiesAt, shared store, index-driven tags), `index.html`, `qa-auth.js` (allowed-file list only), `QA_REPORT.md`

## Differences from the hand-written projection (all toward the source)
competing view is now the note's own sentence (one, verbatim); candidate notes and VERIFY items are verbatim (`consequence` added); `source_refs` carries the source hash; `relations` (12, all unresolved) and `navigation: null` added; VERIFY_HOLD.reason is generated from the retained ids.

## Remaining risks
- The parser targets the connected-research note layout (headings, yaml blocks, pipe tables); a differently structured note needs its own mapping and the validator will reject what it cannot map.
- Reader-facing fields (`reader_type`, captions, glance rows, location sentences) are an app overlay, not source data, and must be maintained per record.
- Navigation candidates cannot be generated until notes carry `domain / period / story / scene` metadata (lock §9).
