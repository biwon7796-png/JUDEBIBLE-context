# BEERSHEBA_WEB_PROJECTION_E2E — receipt

```yaml
receipt_id: BEERSHEBA_WEB_PROJECTION_E2E
date: 2026-09-30
verdict: PASS            # targeted 11/11 + full regression PASS
gate: docs/architecture/BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1.md
source_research: docs/architecture/브엘세바/JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md   # v0.2, STAGE_APPROVED_WITH_VERIFY, unchanged
stable_id: JBC-CR-PLACE-BEERSHEBA-001
legacy_runtime_key: beersheba   # explicit compatibility alias
projection_file: data/projection.beersheba.js
external_release: NOT_AUTHORIZED
```

## Full regression (headless Chrome)
| suite | result |
|---|---|
| ?qa=auth (AUTHORITATIVE QA-BVC) | 20/20 |
| ?qa=self | 20/20 |
| ?qa=krv | 9/9 |
| ?qa=w1 | 8/8 |
| ?qa=w2 | 6/6 |
| ?qa=sw | 8/8 |
| ?qa=nav | 6/6 |
| ?qa=ws | 21/21 |
| ?qa=bs (targeted, new) | 11/11 |

## Targeted report (?qa=bs, verbatim)
```
BEERSHEBA_WEB_PROJECTION_E2E PASS 11/11
PASS BS-01 source_authority_preserved_and_values_traceable_to_the_approved_research_file
   · checked 60 projected values against the source file; missing=[]
PASS BS-02 stable_id_preserved_via_explicit_alias_only_one_record_replaced
   · place keys=["moriah","beersheba","haran"] beersheba.id=JBC-CR-PLACE-BEERSHEBA-001 legacy_key=beersheba resolveKey(stable)=beersheba
PASS BS-03 no_fabricated_metadata_no_coordinates_no_person_event_ids
   · x/y present=false/false location_state=unlocated
   · dots=1 pins=1
PASS BS-04 same_stable_id_across_Scripture_Detail_Guide_Map
   · surfaces={"scripture":"JBC-CR-PLACE-BEERSHEBA-001","detail":"JBC-CR-PLACE-BEERSHEBA-001","state":"JBC-CR-PLACE-BEERSHEBA-001","guide_step":"1","map_note":"JBC-CR-PLACE-BEERSHEBA-001","url":"#gen-22:19&tab=places&e=l.beersheba&panel=open"}
   · deep link by stable_id → #gen-22:19&e=l.beersheba&panel=open
PASS BS-05 map_no_pin_no_route_natural_language_note_no_projection_of_candidates
   · note=브엘세바 — 정확한 위치에 대해서는 여러 견해가 있어 지도에 점으로 표시하지 않습니다.
PASS BS-06 guide_departure_removed_return_step_from_Genesis_22_19_no_route
   · steps=["1:모리아 땅에 이르러 (샘플)@gen-22:2","2:모리아 사건 후 브엘세바로 돌아옴@gen-22:19"]
PASS BS-07 detail_reader_layer_natural_language_research_layer_folded_verify_hold_kept
   · parts=identity,facts,summary,location,scripture,media,research
PASS BS-08 related_passages_from_PassageLink_open_scripture_without_duplicating_identity
   · rows=["gen-21:14","gen-21:31","gen-22:19","gen-26:23","gen-28:10","gen-46:1","gen-20:","gen-26:1"]
   · open gen-21:31 → #gen-21:31&tab=places&e=l.beersheba&panel=open
PASS BS-09 media_shows_attribution_metadata_only_no_payload_no_rights_claim
   · figures=3
   · external resources=0
PASS BS-10 projection_failure_falls_back_safely_to_the_fixture_stub
   · projection missing → research=false status=FIXTURE_SAMPLE x=undefined
   · invalid stable_id → research=false status=FIXTURE_SAMPLE x=undefined
   · coordinates present (not allowed this round) → research=false status=FIXTURE_SAMPLE x=undefined
PASS BS-11 no_ui_regression_locked_structure_intact
   · 
```

## Screen evidence
- `screenshots/beersheba-e2e-a.png` — Genesis 22:19 → Beersheba tag selected → Detail (identity, quick facts with 위치 상태 "여러 후보지", summary, 위치 가설) + Guide step 2 "모리아 사건 후 브엘세바로 돌아옴" (no route, no pin).
- `screenshots/beersheba-e2e-b.png` — Detail scrolled to related passages / photo attribution boxes.
- `screenshots/beersheba-e2e-c.png` — research detail expanded (candidates, remaining verify items, held items).
- `screenshots/beersheba-e2e-mobile.png` — narrow-viewport state.

## Gate compliance
- DECISION_02: `beersheba → JBC-CR-PLACE-BEERSHEBA-001` mapping only; no duplicate place, no name merge, no mass rename (BS-02).
- DECISION_03: no Beersheba pin, no Tel/modern marker, no lat/lon→SVG conversion; Detail explains the candidate location in natural Korean (BS-03, BS-05).
- DECISION_04: departure claim removed; return step from Genesis 22:19; route line removed (BS-06).
- DECISION_05: attribution metadata only, no image payload, no rights-status claim, no external load (BS-09).
- Change set: one fixture record replaced (stub kept as safe fallback, BS-10); Person/Event links without research IDs hidden (BS-03).

## Deviations / notes
1. The Guide steps were re-ordered (Moriah = step 1, Beersheba return = step 2) so the return follows the event it returns from; step ids unchanged.
2. Attribution lines for JBC-MEDIA-BS-002/003 are composed from the research's creator / file title / license (flag `attribution_composed`); BS-001's line is verbatim.
3. "중요한 인물" quick-fact row and the related_people / related_events / related_places paragraphs are not shown (no research IDs, Gate).
4. The Commons source page is shown as the file title text only (no hyperlink), because the research gives titles, not URLs.
