# BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1

```yaml
document_id: BEERSHEBA_PRE_IMPLEMENTATION_GATE
version: v0.1
status: APPROVED_SCOPE_GATE
project: 09_앱기획_도이치리베_내부도구
target_asset: JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
implementation_approval: APPROVED_WITHIN_THIS_GATE_ONLY
external_release: NOT_AUTHORIZED

purpose: >
  승인된 브엘세바 연구자산을 변경하지 않고,
  기존 JudeBible Context의 Beersheba fixture record 하나만
  실제 public-safe projection으로 교체하기 위한
  최소 구현 범위와 금지 경계를 고정한다.
```

## 1. Identity decision

```yaml
identity:
  canonical_research_identity:
    stable_id: JBC-CR-PLACE-BEERSHEBA-001

  existing_runtime_key:
    value: beersheba

  decision:
    keep_existing_runtime_key_as_compatibility_alias: true

  mapping:
    beersheba: JBC-CR-PLACE-BEERSHEBA-001

  meaning: >
    beersheba는 별도의 연구 Place identity가 아니다.
    기존 코드와 QA 회귀를 깨지 않기 위한 compatibility key로만 유지한다.
    실제 연구 identity는 JBC-CR-PLACE-BEERSHEBA-001 하나다.

  required:
    - Map resolves to the same stable_id
    - Detail resolves to the same stable_id
    - Guide resolves to the same stable_id
    - Scripture resolves to the same stable_id

  prohibited:
    - name_based_merge
    - duplicate_Beersheba_identity
    - bulk_runtime_id_rename
    - BAT01_crosswalk_inference
```

## 2. Map decision

```yaml
map:
  biblical_Beersheba:
    exact_coordinate: NONE
    exact_marker: false
    fixture_pin: REMOVE
    detail_available: true
    reader_location_label: "추정지"

  Tel_Beer_Sheva:
    role: archaeological_candidate
    coordinates:
      lat: 31.245000
      lon: 34.840556

    current_runtime_marker:
      status: DEFERRED

    reason: >
      현재 웹앱 지도는 lat/lon 지리 투영이 없는 abstract SVG fixture map이다.
      좌표를 기존 x/y에 임의 변환해서 표시하지 않는다.

    current_UI:
      show_in_detail: true
      show_as_candidate: true
      reader_label: "유력한 고고학 후보지"

  modern_Beersheba:
    role: modern_context
    separate_identity: true
    current_runtime_marker:
      status: DEFERRED

  prohibited:
    - invent_lat_lon_to_svg_projection
    - add_new_basemap_in_this_change
    - create_archaeology_layer_in_this_change
    - assign_fake_exact_point_to_biblical_Beersheba
```

## 3. Guide decision

```yaml
guide:
  existing_fixture_claim:
    text: "브엘세바에서 출발"
    status: UNSUPPORTED_BY_APPROVED_RESEARCH
    action: REMOVE

  approved_replacement:
    text: "모리아 사건 후 브엘세바로 돌아옴"
    basis: Genesis_22_19

  route_line:
    existing_fixture_route_through_Beersheba:
      action: REMOVE

    replacement_geometry:
      action: NONE

    reason: >
      연구자산은 본문상 귀환을 지원하지만
      실제 이동 경로 geometry는 승인하지 않는다.

  required:
    - Guide never forces Detail open
    - current_story_context is preserved

  prohibited:
    - inferred_route_geometry
    - unsupported_departure_claim
```

## 4. Media decision

```yaml
media:
  current_change_scope:
    show_image_payload: false

  render:
    - source_title
    - creator
    - license
    - source_page_link
    - attribution
    - natural_reader_caption

  rights:
    research_metadata_exists: true
    app_media_rights_contract_normalized: false

  therefore:
    external_preview_image: HOLD
    attribution_only: APPROVED

  required:
    - no image without explicit usable payload
    - no image when app-side rights status is unresolved
    - preserve creator/license/source page

  prohibited:
    - guessing_preview_url
    - downloading_media_in_bulk
```

## 5. Detail decision

```yaml
detail:
  structure:
    mode: single_vertical_flow

  order:
    - identity
    - quick_facts
    - representative_media_metadata
    - reader_summary
    - related_scripture
    - related_places
    - location_hypothesis
    - notes_if_supported
    - collapsed_research_detail

  person_event_sections:
    rule: >
      research global stable IDs가 없는 Person/Event은
      이름만으로 fixture entity와 연결하지 않는다.
    action: HIDE_UNRESOLVED_LINKS

  ministry_points:
    rule: >
      승인 연구자산에 명시적 ministry points가 없으면
      이번 구현에서 새로 작성하지 않는다.
    action: HIDE

  research_detail:
    default: COLLAPSED

  prohibited:
    - Reader_Research_tabs
    - internal_status_jargon_in_normal_UI
```

## 6. Scripture decision

```yaml
scripture:
  related_passages_from_research:
    - Genesis 21:14
    - Genesis 21:31-34
    - Genesis 22:19
    - Genesis 26:23-33
    - Genesis 28:10
    - Genesis 46:1-5

  implementation_rule: >
    현재 Scripture tagging 구조에서 안전하게 지원 가능한 범위만 연결한다.
    미지원 구절을 위해 새로운 tagging system을 이번 변경에서 설계하지 않는다.

  required:
    - all supported Beersheba links resolve to JBC-CR-PLACE-BEERSHEBA-001

  prohibited:
    - inventing_passage_entity_links
```

## 7. Reader language

```yaml
reader_language:
  allowed:
    - "추정지"
    - "유력한 고고학 후보지"
    - "현대 브엘세바"
    - natural_Korean

  hidden_from_normal_UI:
    - VERIFY
    - HOLD
    - stable_id
    - authority
    - source_locator
    - projection
    - Registry
    - FIXTURE_SAMPLE
    - internal_status_codes
```

## 8. Approved minimal change set

```yaml
approved_change_set:
  allowed:
    - replace_only_the_Beersheba_fixture_record_with_research_projection
    - add_explicit_legacy_key_to_stable_id_mapping
    - remove_biblical_Beersheba_exact_fixture_pin
    - remove_existing_fixture_route_through_Beersheba
    - remove_unsupported_"브엘세바에서 출발"_Guide_text
    - use_"모리아 사건 후 브엘세바로 돌아옴"_where_applicable
    - show_natural_Korean_location_state
    - expose_supported_related_scripture
    - render_Wikimedia_attribution_metadata_without_image_payload
    - render_collapsed_research_detail
    - hide_unresolved_Person_Event_links
    - run_targeted_QA
    - run_full_existing_regression_QA
    - produce_visual_evidence
    - produce_BEERSHEBA_WEB_PROJECTION_E2E_receipt

  not_allowed:
    - source_research_mutation
    - bulk_fixture_migration
    - UI_redesign
    - new_basemap
    - new_geographic_projection_system
    - new_archaeology_layer
    - inferred_route_geometry
    - Person_Event_name_based_merge
    - BAT01_crosswalk
    - Registry_mutation
    - external_release
```

## 9. QA gate

```yaml
qa:
  required:
    - same_stable_id_across_supported_Map_Detail_Guide_Scripture_paths
    - no_exact_marker_for_biblical_Beersheba
    - no_inferred_route_geometry
    - unsupported_departure_claim_removed
    - Tel_Beer_Sheva_not_asserted_as_exact_biblical_location
    - modern_Beersheba_not_merged_with_biblical_place
    - Reader_UI_contains_no_internal_jargon
    - Person_Event_name_only_links_not_created
    - attribution_metadata_preserved
    - Detail_remains_single_vertical_flow
    - Detail_default_closed_behavior_preserved
    - Guide_does_not_force_Detail_open
    - existing_layout_split_scroll_history_preserved
    - existing_KRV_untouched
    - targeted_QA_PASS
    - full_regression_QA_PASS
    - zero_new_console_errors
```

## 10. E2E receipt requirements

```yaml
BEERSHEBA_WEB_PROJECTION_E2E_RECEIPT:
  required_fields:
    - source_asset_identity
    - source_asset_hash_if_available
    - projection_artifact_identity
    - exact_modified_files
    - legacy_key_mapping_result
    - stable_id_trace
    - scripture_binding_result
    - detail_render_result
    - map_degradation_result
    - guide_result
    - media_attribution_result
    - Reader_language_result
    - targeted_QA_result
    - full_regression_QA_result
    - visual_evidence_paths
    - remaining_risks
    - final_status

  final_status_allowed:
    - PASS
    - HOLD
```

## 11. Completion boundary

```yaml
completion:
  PASS_when:
    - all_required_QA_passes
    - no_source_research_mutation
    - no_scope_expansion
    - E2E_receipt_materialized

  HOLD_when:
    - any_identity_conflict_remains
    - any_unsupported_research_claim_would_be_required
    - any_new_map_projection_is_required
    - any_existing_QA_regresses

  external_release:
    NOT_AUTHORIZED
```
