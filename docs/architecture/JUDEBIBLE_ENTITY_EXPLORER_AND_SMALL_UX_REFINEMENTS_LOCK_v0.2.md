# JUDEBIBLE_ENTITY_EXPLORER_AND_SMALL_UX_REFINEMENTS_LOCK

```yaml
document_id: JUDEBIBLE_ENTITY_EXPLORER_AND_SMALL_UX_REFINEMENTS_LOCK
version: v0.2
status: CANDIDATE_LOCK
update_task: UPDATE_JUDEBIBLE_INTERACTION_CONTRACT_WITH_MEDIA_AND_SCRIPTURE_BEHAVIOR_v0.2
owner: 09_앱기획_도이치리베_내부도구
implementation_owner: IMPLEMENTATION_PROJECT
change_type: UPDATE_EXISTING_DOCUMENT
external_release: NOT_AUTHORIZED
```

## FINAL_APP_REQUIREMENTS

`IMPLEMENT_PERSON_PLACE_ENTITY_EXPLORER_WITH_CARD_LIST_AND_SEARCH_v0.1`의 구현 계약을 확정했습니다.

현재 코드 점검에서 선행 변경점이 하나 확인됐습니다. 지금 `shared store`는 사실상 Place 중심이며 `PJ.places`만 projection으로 적용하고 `STORE.entity()`도 Place만 반환합니다. 따라서 Explorer를 하드코딩해서 붙이면 향후 Obsidian Person projection이 자동 반영되지 않습니다.

먼저 store를 Person/Place 공통 조회원으로 일반화한 뒤 Explorer가 오직 그 store를 읽도록 해야 합니다.

```yaml
ENTITY_EXPLORER:

  default_state:
    query: ""
    show_all_entities: true
    entity_type: ALL
    view_mode: CARD
    sorting: 가나다순

  entity_types:
    - Person
    - Place

  view_modes:
    - CARD
    - LIST

  source:
    shared_projection_store: REQUIRED
    manual_entity_catalog: PROHIBITED

  update_behavior:
    new_projection_record:
      explorer_manual_update_required: false
      visible_after_projection_load: true
```

기존 fixture를 한꺼번에 제거하지는 않습니다. 현재의 `record_level_fixture_replacement` 방식을 그대로 유지합니다.

```yaml
STORE_MIGRATION_RULE:

  sources:
    - projection.Person
    - projection.Place
    - existing_compatibility_fixture

  precedence:
    projection_record: HIGH
    compatibility_fixture: FALLBACK_ONLY

  replacement:
    same_existing_record:
      replace_record_level_only: true

    unrelated_fixture:
      preserve: true

  dedup:
    key: stable_id
    same_name_merge: PROHIBITED

  internal_origin:
    - projection
    - compatibility_fixture
```

즉 지금의 아브라함·이삭 등 기존 fixture를 갑자기 깨뜨리지 않으면서, 향후 Obsidian pipeline에서 Person/Place가 들어오면 동일한 Explorer에 자동 편입됩니다.


## PRODUCT_FLOW

검색 화면의 기본 동작을 다음처럼 변경합니다.

```text
Search Workspace 열기
        ↓
검색어 없음
        ↓
Person / Place 전체 탐색
        ↓
카드 또는 목록
        ↓
필터 / 정렬
        ↓
entity 선택
        ↓
같은 stable_id로 Detail 열기
        ↓
현재 Scripture context 유지
```

검색어가 입력되면 새 검색 결과 dataset을 만드는 것이 아니라 현재 Explorer entity set을 필터링합니다.

```yaml
SEARCH_BEHAVIOR:

  empty_query:
    show: ALL_CURRENT_ENTITIES

  non_empty_query:
    action: FILTER_CURRENT_ENTITY_SET

    fields:
      - display_label
      - aliases
      - role
      - region
      - period
      - short_summary

  does_not:
    - create_new_entity
    - infer_alias
    - search_against_manual_catalog
```

기존 성경 참조 이동과 본문 검색 기능은 제거하지 않습니다. Entity Explorer의 검색은 entity filtering으로 동작하고, 기존 Scripture/reference 검색 기능은 별도 기존 결과 흐름으로 보존해야 합니다.


## SHARED PROJECTION STORE CONTRACT

구현의 핵심은 다음 API 계층입니다.

```yaml
SHARED_ENTITY_STORE:

  required_capabilities:

    get:
      input: stable_id
      output: Person | Place | null

    list:
      filters:
        - type
      output:
        - normalized_entity_record

    resolve_compatibility_key:
      input: stable_id
      output: legacy_key_or_null

  supported_projection_namespaces:
    - persons
    - places

  normalized_record:
    stable_id: required
    compatibility_key: optional

    entity_type:
      - Person
      - Place

    display_label: required
    aliases: []

    short_summary: optional

    passage_refs: []

    representative_media: optional

    Person:
      role: optional
      period: optional

    Place:
      region: optional
      reader_location_status: optional

    provenance:
      origin:
        - projection
        - compatibility_fixture
```

현재의 `STORE.entity()` Place-only 구현을 이 공통 계약으로 교체해야 합니다.

Person projection이 아직 0건이어도 API 자체는 처음부터 Person/Place 공통이어야 합니다.


## CARD_VIEW

사용자가 제안한 정보량이 적절합니다.

```yaml
CARD_VIEW:

  common:
    - representative_image_if_verified
    - display_label
    - entity_type
    - short_summary
    - related_passage_count

  Place:
    optional:
      - region
      - reader_location_status

  Person:
    optional:
      - period
      - role
```

대표 이미지는 현재 media safety gate를 그대로 재사용합니다.

```yaml
CARD_MEDIA_RULE:

  verified_representative_media:
    render_image: true

  missing_media:
    render_without_image: true

  VERIFY:
    render_without_image: true

  HOLD:
    render_without_image: true

  unverified_preview_url:
    render_without_image: true

  placeholder_image_generation:
    prohibited: true
```

따라서 카드 높이를 맞추기 위해 임의 placeholder 사진을 넣지 않습니다.


## LIST_VIEW

```yaml
LIST_VIEW:

  Place:
    columns:
      - name
      - type
      - region
      - related_passages
      - location_status

  Person:
    columns:
      - name
      - role
      - period
      - related_passages

  responsive:
    mobile:
      behavior:
        collapse_secondary_columns: true
        preserve:
          - name
          - type_or_role
          - related_passages
```

Card와 List는 별도 dataset이 아니라 반드시 동일한 entity set을 다른 presentation으로 표현합니다.

```yaml
VIEW_INVARIANT:

  CARD.entity_ids == LIST.entity_ids
```

## FILTER CONTRACT

```yaml
FILTERS:

  type:
    values:
      - 전체
      - 인물
      - 장소

  testament:
    values:
      - 전체
      - 구약
      - 신약

  period:
    options:
      generated_from_current_records: true

  region:
    options:
      generated_from_current_records: true
```

시대·지역 옵션을 수동 배열로 관리하면 안 됩니다.

### 구약/신약 판정

```yaml
TESTAMENT_FILTER:

  preferred_source:
    explicit_passage_refs

  secondary_source:
    validated_Scripture_Entity_Index

  rule:
    OT:
      include_when:
        at_least_one_explicit_or_validated_OT_passage

    NT:
      include_when:
        at_least_one_explicit_or_validated_NT_passage

  both_OT_and_NT:
    appears_in_both_filters: true

  no_passage_metadata:
    ALL_filter: visible
    OT_filter: excluded
    NT_filter: excluded

  inference_from_general_biography:
    prohibited: true
```

### 시대·지역

```yaml
PERIOD_REGION_FILTER:

  explicit_metadata_only: true

  missing_value:
    infer: false

  specific_filter_selected:
    unmatched_or_missing_records:
      hidden: true
```

Person의 지역도 연구자산에 명시적 region 관계가 있을 때만 사용합니다. 인물 이름이나 사건을 보고 자동으로 지역을 추정하지 않습니다.


## SORTING

```yaml
SORTING:

  가나다순:
    key:
      display_label
    deterministic: true

  성경순:
    key:
      earliest_explicit_passage_ref
    missing_passage:
      position: LAST

  시대순:
    source:
      explicit_chronology_or_period_sort_value

    missing_sortable_period:
      position: LAST

    inference_from_name_or_passage:
      prohibited: true
```

`시대순`을 위해 연구 의미를 새로 만들면 안 됩니다. 연대 범위 등 명시적 자료가 있는 경우에만 projection 단계에서 정렬값을 파생할 수 있습니다.


## SELECTION_BEHAVIOR

카드 전체 또는 목록 행 선택의 primary action은 새 페이지 이동이 아닙니다.

```yaml
SELECTION_BEHAVIOR:

  on_entity_select:
    - resolve_entity_by_stable_id
    - set_selected_entity
    - open_existing_Detail

  preserve:
    - current_passage
    - selected_verse
    - passage_scroll_anchor
    - browser_history_context
    - current_Guide_context

  prohibited:
    - navigate_to_new_entity_page
    - replace_current_Scripture_automatically
```

즉 브엘세바 카드를 클릭했다고 창 21장으로 강제로 이동하면 안 됩니다. 현재 읽던 본문은 그대로 있고 Detail만 열립니다.

### Place actions

```yaml
PLACE_ACTIONS:

  본문_보기:
    behavior:
      if_current_passage_contains_entity:
        preserve_current_passage: true

      else:
        navigate_to:
          earliest_explicit_or_validated_passage

  지도에서_보기:
    - keep_selected_entity
    - switch_to_map_perspective

    exact_coordinate_missing:
      exact_marker: false
      controlled_degradation: preserve
```

브엘세바처럼 위치 미확정인 Place도 Explorer에서 선택할 수 있지만 `지도에서 보기`가 확정 핀을 만들어서는 안 됩니다.

### Person actions

```yaml
PERSON_ACTIONS:

  본문_보기:
    same_rule_as_place: true

  관련_사건_보기:
    available_when:
      explicit_event_relations_exist: true

    absent:
      hide_action: true

    relation_inference:
      prohibited: true
```


## ENTITY RELATED PASSAGE → SCRIPTURE CONTRACT

Entity Detail의 관련 본문을 선택할 때 사용자는 두 번째 Scripture 클릭 없이 즉시 해당 본문을 읽는 위치로 이동해야 한다. 다만 선택된 Entity Detail과 Map/Navigation 맥락은 유지하며 Passage Detail은 명시적 요청이 있을 때만 연다.

```yaml
ENTITY_RELATED_PASSAGE_TO_SCRIPTURE_CONTRACT:

  trigger:
    Entity_Detail_related_passage_click

  must:
    - navigate_Scripture_to_target_passage
    - bring_target_into_reading_position
    - highlight_target_passage
    - preserve_selected_entity
    - preserve_ENTITY_DETAIL
    - preserve_Map_context
    - preserve_Navigation_context

  must_not:
    - require_second_click_on_Scripture
    - replace_ENTITY_DETAIL_with_PASSAGE_DETAIL
    - clear_selected_entity
    - open_new_page

  PASSAGE_DETAIL:
    open_only_when:
      - explicit_passage_detail_action

    role:
      - passage_context
      - structure
      - key_terms
      - persons
      - places
      - research
      - commentary_and_sources
```

## COUNT CONTRACT

`related_passage_count`도 단순 문자열 검색으로 계산하지 않습니다.

```yaml
RELATED_PASSAGE_COUNT:

  source_priority:
    1: explicit_passage_refs
    2: validated_Scripture_Entity_Index

  deduplicate:
    by_passage_ref: true

  contextual_related_passage:
    count_when_explicit_PassageLink: true

  guessed_relation:
    count: false
```


## CURRENT IMPLEMENTATION DELTA

현재 코드 상태에서 필요한 변경은 명확합니다.

```yaml
IMPLEMENTATION_CHANGE_SET:

  app.js:

    shared_store:
      - generalize_Place_only_store_to_Person_and_Place
      - add_listEntities
      - add_getEntityByStableId
      - preserve_legacy_key_resolution

    search_workspace:
      - empty_query_no_longer_empty_message
      - empty_query_renders_Entity_Explorer
      - entity_query_filters_store_set
      - preserve_existing_Scripture_search
      - preserve_reference_jump

    selection:
      - select_by_stable_id
      - preserve_current_scripture_context

  index.html:
    add:
      - CARD_LIST_view_toggle
      - Entity_type_filters
      - testament_filter
      - period_filter
      - region_filter
      - sorting_control

  styles.css:
    add:
      - explorer_card_grid
      - explorer_list
      - responsive_rules

  QA:
    preferred_new_suite:
      qa-ee.js

    existing:
      qa-sw.js:
        preserve_existing_search_regressions
```

새 수동 데이터 파일은 만들지 않습니다.

```yaml
PROHIBITED_IMPLEMENTATION:

  - entity.catalog.js
  - people-list.json
  - places-list.json
  - hardcoded_filter_options
  - hardcoded_entity_cards
```

## AUTO-GROWTH CONTRACT

이 부분이 이번 기능의 가장 중요한 acceptance criterion입니다.

```yaml
AUTO_GROWTH:

  given:
    new_Obsidian_projection_record:
      stable_id: JBC-CR-PLACE-NEW-001

  when:
    projection_pipeline_generates_record: true

  then:
    explorer:
      manual_code_change: false
      manual_catalog_change: false
      record_visible_after_load: true

  same_for:
    - Person
    - Place
```

따라서 Explorer가 `["beersheba", "moriah", ...]` 같은 배열을 갖는 구현은 QA FAIL입니다.

```yaml
INTERACTION_CONTRACT_GROWTH_RULE:

  for_each_new_research_asset:
    - ingest
    - project
    - exercise_real_UI_paths
    - compare_against_interaction_contract
    - patch_only_if_contract_gap_found
    - add_regression_QA
    - do_not_create_asset_specific_behavior_without_need
```

브엘세바·그랄 등 개별 연구자산은 공통 작동법을 검증하는 실제 시험 사례로 사용한다. 특정 자산만을 위한 UI/interaction 분기를 기본값으로 만들지 않는다.


## QA_CONTRACT

```yaml
ENTITY_EXPLORER_QA:

  EE_01:
    empty_search_opens_all_entity_explorer

  EE_02:
    explorer_records_come_from_shared_store_only

  EE_03:
    no_manual_entity_catalog_exists

  EE_04:
    Person_and_Place_use_same_store_contract

  EE_05:
    CARD_and_LIST_have_identical_entity_set

  EE_06:
    search_filters_current_entity_set

  EE_07:
    type_filter_person_place_all

  EE_08:
    OT_NT_filter_uses_explicit_or_validated_passages_only

  EE_09:
    period_options_generated_from_records

  EE_10:
    region_options_generated_from_records

  EE_11:
    가나다_sort_deterministic

  EE_12:
    Bible_order_sort_uses_earliest_passage

  EE_13:
    period_sort_does_not_infer_missing_period

  EE_14:
    verified_representative_image_may_render

  EE_15:
    missing_VERIFY_HOLD_media_renders_without_image

  EE_16:
    entity_select_resolves_same_stable_id

  EE_17:
    selecting_entity_opens_existing_Detail

  EE_18:
    entity_select_preserves_current_passage

  EE_19:
    entity_select_preserves_selected_verse_and_scroll_anchor

  EE_20:
    Place_map_action_preserves_controlled_degradation

  EE_21:
    Person_related_event_action_only_when_explicit

  EE_22:
    new_projection_entity_appears_without_explorer_code_change

  EE_23:
    duplicate_name_does_not_merge_stable_ids

  EE_24:
    existing_reference_and_scripture_search_preserved

  EE_25:
    all_existing_search_workspace_QA_PASS

  EE_26:
    all_existing_regression_suites_PASS

  EE_27:
    zero_new_console_errors
```

## TECHNICAL_HANDOFF

```yaml
MINIMUM_HANDOFF:

  from_project:
    09_앱기획_도이치리베_내부도구

  to_project:
    IMPLEMENTATION_PROJECT

  asset_id:
    PERSON_PLACE_ENTITY_EXPLORER

  version:
    v0.2_CANDIDATE

  status:
    READY_FOR_IMPLEMENTATION

  target:
    "F:\\Projects\\웹앱"

  preserve:
    - context_preserving_workspace
    - current_Scripture_state
    - Detail
    - Guide
    - Map_controlled_degradation
    - browser_history
    - media_rights_gate
    - record_level_fixture_replacement
    - existing_search_reference_navigation
    - all_existing_QA

  required_first_change:
    GENERALIZE_SHARED_PROJECTION_STORE_FOR_PERSON_AND_PLACE

  then:
    IMPLEMENT_ENTITY_EXPLORER_FROM_STORE

  prohibited:
    - manual_entity_catalog
    - same_name_auto_merge
    - inferred_period
    - inferred_region
    - inferred_related_event
    - unverified_image_display
    - UI_page_navigation_for_entity_selection
    - source_research_mutation
    - Registry_mutation
    - external_release
```

현재 가장 중요한 구현 순서는 **`shared store 일반화 → Explorer dataset → CARD/LIST → 필터/정렬 → stable_id 선택 → QA`**입니다. 이 순서를 지키면 이후 Obsidian pipeline에서 그랄, 아브라함, 이삭 등 새 Person/Place projection이 추가될 때 Explorer가 별도 수정 없이 자연스럽게 커집니다.

---

# ADDITIVE_SMALL_UX_REFINEMENTS

The following refinements are additive to the Entity Explorer contract above and do not replace its existing behavior.

## A. Scripture chapter navigation accessibility

The current previous/next chapter controls must remain at the bottom, but equivalent quick controls must also be available near the top of the Scripture pane without requiring a scroll to the end.

```yaml
SCRIPTURE_CHAPTER_NAVIGATION:
  controls:
    - previous_chapter
    - next_chapter

  primary_placement:
    - Scripture_header
    - sticky_within_Scripture_pane

  bottom_controls:
    preserve: true

  behavior:
    visible_without_scrolling_to_bottom: true
    on_chapter_change:
      - navigate_to_adjacent_chapter
      - reanchor_Scripture_to_top

    preserve_when_valid:
      - selected_entity
      - Map_context
      - Navigation_context
      - browser_history

    selected_verse:
      clear_if_not_present_in_new_chapter: true

  mobile:
    compact_controls: true
    reachable_near_top: true
```

The intended reading grammar is: top controls for quick navigation, bottom controls for natural continuation after finishing a chapter.

## B. Media display and connection contract

Inline Detail은 검증된 이미지와 짧은 캡션만 우선 표시하고, 상세 출처·라이선스·원문 링크는 이미지 클릭 후 Lightbox에서 progressive disclosure한다. 이 계약은 기존 MediaAsset projection과 media rights gate를 재사용하며 별도 media truth를 만들지 않는다.

```yaml
MEDIA_DISPLAY_AND_CONNECTION_CONTRACT:

  source_of_truth:
    - MediaAsset_projection
    - existing_media_rights_gate
    - verified_source_metadata

  inline_detail:
    show:
      - verified_image
      - short_caption

    do_not_repeat:
      - long_attribution_block
      - full_source_url
      - full_license_explanation

  image_click:
    open: MEDIA_LIGHTBOX

  MEDIA_LIGHTBOX:
    show:
      - large_image
      - caption
      - creator
      - license
      - source_name
      - verified_source_link

    source_link:
      allowed_only_when:
        source_url_verified: true
      open_new_tab: true
      rel:
        - noopener
        - noreferrer

  display_gate:
    require:
      - preview_url_verified
      - rights_validated
      - display_allowed_rights_status

  failure:
    image_load_failure:
      fallback: attribution_only

  prohibited:
    - filename_based_url_guessing
    - invented_preview_url
    - unverified_media_display
    - VERIFY_or_HOLD_payload_exposure
```

`display_allowed_rights_status`는 기존 media rights gate의 허용 상태를 그대로 따른다. 본 계약은 새 권리 상태를 정의하거나 `VERIFY/HOLD`를 승격하지 않는다.

## C. Additional implementation delta

```yaml
ADDITIVE_IMPLEMENTATION_DELTA:
  app.js:
    - add_sticky_previous_next_chapter_controls
    - preserve_existing_bottom_chapter_navigation
    - add_image_click_lightbox
    - move_full_attribution_to_lightbox_for_verified_images
    - reuse_existing_media_safety_gate
    - related_passage_click_activates_and_repositions_Scripture
    - preserve_selected_entity_and_ENTITY_DETAIL_during_related_passage_navigation

  index.html:
    - sticky_scripture_chapter_navigation
    - media_lightbox_container

  styles.css:
    - sticky_chapter_navigation
    - media_lightbox_styles
```

## D. Additional QA

```yaml
SMALL_UX_QA:
  CHAPTER_NAV_01: sticky_previous_next_visible_without_bottom_scroll
  CHAPTER_NAV_02: bottom_previous_next_preserved
  CHAPTER_NAV_03: chapter_change_reanchors_scripture
  CHAPTER_NAV_04: context_preserved_when_valid
  CHAPTER_NAV_05: mobile_controls_reachable

  MEDIA_LIGHTBOX_01: verified_image_click_opens_large_view
  MEDIA_LIGHTBOX_02: creator_license_source_visible_in_lightbox
  MEDIA_LIGHTBOX_03: verified_source_link_opens_new_tab
  MEDIA_LIGHTBOX_04: unverified_source_link_not_clickable
  MEDIA_LIGHTBOX_05: inline_Detail_does_not_repeat_long_attribution
  MEDIA_LIGHTBOX_06: image_load_failure_degrades_safely

  RELATED_PASSAGE_01: one_click_navigates_Scripture_to_target_without_forcing_pane_activation
  RELATED_PASSAGE_02: target_passage_brought_into_reading_position
  RELATED_PASSAGE_03: target_passage_highlighted
  RELATED_PASSAGE_04: selected_entity_preserved
  RELATED_PASSAGE_05: Entity_Detail_preserved_not_replaced_by_Passage_Detail
  RELATED_PASSAGE_06: Map_and_Navigation_context_preserved
  RELATED_PASSAGE_07: Passage_Detail_opens_only_by_explicit_action

  REGRESSION:
    - existing_media_gate_PASS
    - existing_Scripture_QA_PASS
    - existing_search_QA_PASS
    - all_existing_regression_suites_PASS
    - zero_new_console_errors
```

## E. Combined handoff note

```yaml
MINIMUM_HANDOFF_ADDITIVE:
  asset_id: JUDEBIBLE_ENTITY_EXPLORER_AND_SMALL_UX_REFINEMENTS
  version: v0.2_CANDIDATE
  status: READY_FOR_IMPLEMENTATION
  target: 'F:\\Projects\\웹앱'

  required_order:
    1: GENERALIZE_SHARED_PROJECTION_STORE_FOR_PERSON_AND_PLACE
    2: IMPLEMENT_ENTITY_EXPLORER_FROM_STORE
    3: IMPLEMENT_CARD_LIST_FILTER_SORT
    4: IMPLEMENT_STABLE_ID_SELECTION
    5: IMPLEMENT_ENTITY_RELATED_PASSAGE_NAVIGATION_WITHOUT_FORCED_SCRIPTURE_ACTIVATION
    6: ADD_STICKY_SCRIPTURE_CHAPTER_NAVIGATION
    7: ADD_MEDIA_LIGHTBOX_AND_PROGRESSIVE_SOURCE_DISCLOSURE
    8: RUN_QA

  preserve:
    - context_preserving_workspace
    - current_Scripture_state
    - Detail
    - Navigation
    - Map_controlled_degradation
    - browser_history
    - media_rights_gate
    - record_level_fixture_replacement
    - existing_search_reference_navigation
    - existing_bottom_chapter_navigation
    - selected_entity_during_related_passage_navigation
    - ENTITY_DETAIL_during_related_passage_navigation
    - Map_context
    - Navigation_context
    - all_existing_QA
```
