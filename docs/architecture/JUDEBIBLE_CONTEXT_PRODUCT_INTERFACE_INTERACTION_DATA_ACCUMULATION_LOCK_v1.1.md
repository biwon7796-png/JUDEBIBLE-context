# JUDEBIBLE CONTEXT — PRODUCT / INTERFACE / INTERACTION / DATA ACCUMULATION LOCK v1.1

```yaml
document_id: JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK
version: v1.1
status: CAPTAIN_APPROVED_IMPLEMENTATION_LOCK
date: 2026-09-30
project_owner:
  product_design: 09_앱기획_도이치리베_내부도구
  implementation: IMPLEMENTATION_PROJECT
control_owner: 00_운영관제실_Jude_Lee_OS
canonical_effect: IMPLEMENTATION_BASELINE_ONLY
external_release: NOT_AUTHORIZED
professional_registry_change: NONE
```

## -1. 공식 명칭 및 계보

```yaml
OFFICIAL_NAMING_LOCK:

  brand:
    master: JudeBible

  official_name:
    english: JudeBible Context
    korean: 주드-컨텍스트바이블

  feature_identity:
    former_name:
      - 성경맥락보기
      - Bible Context Viewer
    current_name:
      english: JudeBible Context
      korean: 주드-컨텍스트바이블

  migration_rule:
    user_facing_name:
      - JudeBible Context
      - 주드-컨텍스트바이블

    documentation_new:
      use: JUDEBIBLE_CONTEXT

    existing_code_identifiers:
      rule: >
        기존 Bible Context Viewer / BVC 계열 내부 식별자는
        회귀 위험이 있으면 즉시 일괄 개명하지 않는다.
        사용자 노출 명칭과 신규 문서부터 새 명칭을 사용한다.

    historical_aliases:
      searchable: true
      authority: LEGACY_ONLY
```

## 0. 목적

이 문서는 JudeBible Context의 다음 세 영역을 하나의 고정 기준으로 묶는다.

1. 앱 인터페이스와 화면 구조
2. 사용자 인터랙션과 상태 보존 방식
3. 연구자료의 수집·정제·검증·축적·Viewer 투영 방식

향후 구현은 이 Lock을 기준으로 진행하며, 구조를 바꾸는 변경은 별도 설계 검토 없이 임의 적용하지 않는다.

---

## 1. 제품 정체성

JudeBible Context(주드-컨텍스트바이블)는 단순한 지도 앱이나 성경 본문 뷰어가 아니다.

> 성경 본문을 읽는 동안 지도·지명·인물·사건·사진·연구근거·관련본문을 같은 연구 문맥 안에서 잃지 않고 탐색하는 Context-Preserving Bible Research Workspace다.

핵심 축은 다음 네 가지다.

```text
본문 ↔ 지도 ↔ 선택 대상 상세 ↔ 이야기/주제/레이어 가이드
```

HARAM에서 학습하는 것은 interaction grammar와 information architecture다. 시각 디자인·색·컴포넌트·브랜드를 복제하지 않는다.

---

## 2. 절대 보존 원칙

```yaml
DO_NOT_CHANGE_WITHOUT_REVIEW:
  - Persistent_Passage
  - passage_as_central_object
  - navigation_without_context_loss
  - stable_entity_identity
  - stable_relation_contract
  - progressive_disclosure
  - graceful_degradation
  - URL_state_without_private_data
  - scripture_scroll_anchor_preservation
  - selected_verse_preservation
  - map_failure_does_not_block_scripture
  - KRV_source_read_only_from_Viewer
```

Viewer는 KRV 정본 판정·교정 엔진이 아니다.

```yaml
KRV_RUNTIME_BOUNDARY:
  Viewer_may:
    - render_current_bound_working_text
    - consume_explicitly_approved_overlay_if_available
  Viewer_must_not:
    - decide_textual_variants
    - infer_corrections
    - rewrite_KRV_source
    - promote_candidate_to_canonical
```

---

## 3. 데스크톱 첫 화면 — 고정 레이아웃

첫 화면에서 본문과 지도와 정보 패널은 동시에 존재한다.

```text
[Rail] [선택 시 Detail] [          MAP          ↔      SCRIPTURE      ] [Guide]
```

### 3.1 왼쪽 Rail

```yaml
LEFT_RAIL:
  role: PERSPECTIVE_AND_UTILITY
  primary_perspectives:
    - 본문연구
    - 지도
    - 연표
  utilities:
    - 검색
    - 설정
```

인물·장소·사진·관련본문·외부자료·메모는 primary perspective가 아니다. 선택 객체의 detail 또는 contextual tool로 제공한다.

### 3.2 왼쪽 Detail Panel

```yaml
LEFT_DETAIL_PANEL:
  default: CLOSED
  opens_when:
    - place_selected_by_explicit_user_action
    - person_selected_by_explicit_user_action
    - event_selected_by_explicit_user_action
    - scene_selected_by_explicit_user_action
  role: SELECTED_OBJECT_DEPTH
```

사용자가 직접 지도 pin, 장소 카드, 인물/사건 항목을 눌러 상세를 요청할 때 열린다. Guide step 변경만으로 사용자가 닫아둔 패널을 강제 reopen하지 않는다.

### 3.3 중앙 Map

지도는 본문 왼쪽에 둔다.

```yaml
CENTER_MAP:
  position: LEFT_OF_SCRIPTURE
  role: PRIMARY_SPATIAL_WORKSPACE
  flexible_width: true
  expands_when_left_detail_closes: true
  interaction:
    - pan
    - zoom
    - grab_cursor
    - grabbing_cursor
```

지도는 폭 증가의 효용이 크므로 Detail이 접히거나 divider가 이동할 때 우선적으로 공간을 회수한다.

### 3.4 중앙 Scripture

```yaml
CENTER_SCRIPTURE:
  position: RIGHT_OF_MAP
  role: PRIMARY_READING_WORKSPACE
  scroll: INDEPENDENT_VERTICAL
  preserve:
    - selected_verse
    - passage_scroll_anchor
    - passage_state
  width_policy:
    - stable_reading_width
    - avoid_excessive_line_length
```

본문과 지도는 독립적으로 조작된다. 본문 스크롤이 지도를 움직이지 않고, 지도 pan/zoom이 본문 위치를 바꾸지 않는다.

### 3.5 Map ↔ Scripture Divider

```yaml
MAP_SCRIPTURE_SPLIT:
  draggable: true
  keyboard_accessible: true
  persist_ratio: local_only
  url_state: false
  workspace_semantic_state: false
  rule: preserve_scripture_anchor_during_resize
```

분할 비율은 사용자 편의 상태로 저장하되, 연구 의미 상태나 공유 URL의 일부로 취급하지 않는다.

### 3.6 오른쪽 Guide Panel

```yaml
RIGHT_GUIDE_PANEL:
  default: OPEN
  desktop_persistent: true
  role:
    - story_progress
    - topic_progress
    - map_layer_control
    - previous_next_navigation
```

오른쪽 Guide는 모든 정보를 담는 탭 컨테이너가 아니다. “지금 어떤 이야기/주제를 따라가며 지도에서 무엇을 보고 있는가”를 제어한다.

---

## 4. 지도 Perspective — Full Canvas Lock

지도 집중 perspective에서는 split 레이아웃을 유지하지 않는다.

```yaml
MAP_PERSPECTIVE:
  map:
    role: FULL_BACKGROUND_CANVAS
    fills_workspace: true
    continues_behind_panels: true
  left_detail_panel:
    overlay: true
    default: CLOSED
  right_guide_panel:
    overlay: true
    persistent: true
```

양쪽 패널은 지도를 밀어내지 않는다. 지도는 최하단에서 workspace 전체를 계속 차지한다.

---

## 5. 연표 Perspective

```yaml
TIMELINE_PERSPECTIVE:
  role: FULL_TIMELINE_WORKSPACE
  preserve_context:
    - passage_ref
    - selected_entity_id
    - selected_place_id_if_relevant
  primary_objects:
    - person
    - event
    - era
    - dynasty
    - related_passage
```

연표는 별도 페이지로 문맥을 초기화하지 않고 현재 passage/entity context를 이어받는다.

---

## 6. 왼쪽 Detail Panel — 정보 배치 고정

위에서 아래로 깊어지는 progressive disclosure를 적용한다.

```yaml
LEFT_DETAIL_PANEL_CONTENT_ORDER:

  1_IDENTITY:
    - 이름
    - 영문명_원어명_if_available
    - 객체유형
    - 별칭
    - 시대_if_relevant

  2_QUICK_FACTS:
    place:
      - 위치
      - 지역
      - 좌표_if_verified
      - 식별_확실성
    person:
      - 시대
      - 역할
      - 주요관계
    event:
      - 시대
      - 장소
      - 관련인물

  3_READER_SUMMARY:
    - 핵심_설명
    - 왜_중요한가

  4_RELATED_SCRIPTURE:
    - 주요_관련구절
    - 관련_본문_장면
    - 본문에서_보기

  5_RELATED_SCENES:
    - 등장_장면
    - 사건
    - 여정

  6_RELATED_OBJECTS:
    place:
      - 가까운_지명
      - 연결_지역
      - 관련_도로_경로
    person:
      - 관련_인물
      - 관련_장소

  7_PHOTOS:
    - 대표사진
    - 추가사진
    - source
    - creator
    - license
    - credit

  8_RESEARCH_DETAIL:
    default: COLLAPSED
    contents:
      - research_note
      - evidence
      - certainty
      - source_locator
      - competing_view_if_any
      - external_reference
```

왼쪽 Detail에 전체 성경 장을 복제하지 않는다. 관련구절은 참조와 짧은 맥락을 제공하고 명시적 동작으로 중앙 본문을 연다.

---

## 7. 오른쪽 Guide Panel — 정보 배치 고정

```yaml
RIGHT_GUIDE_CONTENT_ORDER:

  1_TOPIC_HEADER:
    - 상위_주제
    - 현재_이야기_또는_연구주제
    - 관련_핵심본문

  2_PROGRESS:
    - current_step
    - total_steps
    - step_titles

  3_CURRENT_STEP:
    - 단계_제목
    - 짧은_설명
    - 현재_지도에서_볼_대상

  4_MAP_LAYER_CONTROL:
    - route_toggle
    - place_toggle
    - region_toggle
    - terrain_or_relief_toggle_if_available
    - historical_layer_if_available

  5_ACTIVE_LEGEND:
    - 현재_경로
    - 선_색_의미
    - 거리_if_available
    - 주요_포인트

  6_STEP_OBJECTS:
    - 중요_장소
    - 중요_사건
    - 중요_인물

  7_NAVIGATION:
    fixed_bottom: true
    - previous
    - step_indicator
    - next
```

Guide 설명은 짧게 유지한다. 긴 연구 보고서는 Guide에 넣지 않는다.

Guide step 변경 시:

```yaml
GUIDE_STEP_BEHAVIOR:
  - update_guide_step
  - select_relevant_entity
  - move_map_camera
  - update_route_or_layer
  - highlight_related_place_or_route
  - optionally_highlight_related_scripture
  left_detail_panel:
    if_open: refresh_selected_entity
    if_closed: remain_closed
```

---

## 8. 객체 간 동기화 규칙

공유 상태의 핵심은 다음과 같다.

```yaml
SHARED_CONTEXT_STATE:
  - passage_ref
  - selected_verse
  - selected_entity_id
  - selected_place_id
  - guide_topic_id
  - guide_step_id
  - map_camera_state
  - map_layer_state
  - passage_scroll_anchor
```

주요 인터랙션:

```yaml
map_pin_click:
  - select_place
  - open_left_detail_panel
  - move_or_keep_map_focus
  - preserve_passage
  - preserve_guide_context

scripture_entity_click:
  - select_entity
  - update_map_if_spatial
  - open_left_detail_panel
  - preserve_scripture_scroll_anchor

related_place_click_in_detail:
  - select_new_place
  - move_map
  - refresh_detail
  - preserve_passage_unless_explicit_open

guide_next_previous:
  - update_guide_step
  - synchronize_map
  - synchronize_selection
  - preserve_closed_detail_state

explicit_related_passage_open:
  - change_passage
  - preserve_history
  - create_restorable_previous_context
```

---

## 9. 검색 고정 원칙

```yaml
SEARCH:
  type: DEDICATED_SEARCH_WORKSPACE
  must_not:
    - push_scripture_down
    - push_map_down
    - destroy_workspace_state
  preserve:
    - passage_ref
    - selected_verse
    - passage_scroll_anchor
    - selected_entity
    - map_state
    - panel_state
    - guide_state
```

---

## 10. 본문 조판 위계

본문은 연구 UI보다 시각적으로 우선한다.

```yaml
SCRIPTURE_TYPOGRAPHY_HIERARCHY:
  1: Scripture_body
  2: passage_title
  3: selected_verse_or_entity
  4: section_heading
  5: contextual_detail
  6: controls
  7: metadata

rules:
  - restrained_font_weights
  - readable_line_length
  - generous_line_height
  - clear_paragraph_and_section_spacing
  - subordinate_verse_numbers
  - quiet_metadata
  - research_chrome_must_not_overpower_scripture
```

---

## 11. 연구 정보 위계

```yaml
RESEARCH_HIERARCHY:
  LEVEL_1_READER:
    - 핵심_이해
    - 왜_중요한가

  LEVEL_2_CONTEXT:
    - 인물
    - 장소
    - 장면
    - 관련본문

  LEVEL_3_PROFESSIONAL_DETAIL:
    - 역사적_배경
    - 지리
    - 고고학
    - 원어
    - 연대
    - 해석_쟁점

  LEVEL_4_EVIDENCE:
    - claim
    - evidence
    - source
    - locator
    - certainty
    - competing_source
    - VERIFY_HOLD
```

---

## 12. 데이터 축적의 핵심 원칙

Viewer용 데이터를 별도로 수작업 축적하지 않는다.

> 연구할수록 Entity·Relation·Claim·Evidence가 축적되고, 승인된 지식이 본문·지도·상세·연표·Guide에 반복 사용되는 구조를 만든다.

```text
원자료
  ↓
정제 / 메타데이터 / locator / rights
  ↓
연구자산
  ↓
Entity + Relation + Claim + Evidence + Passage Link + Media
  ↓
검증 / 승인 / VERIFY-HOLD 보존
  ↓
검색·회수 인덱스
  ↓
Viewer Projection
  ↓
본문 ↔ 지도 ↔ 상세 ↔ 연표 ↔ Guide
```

---

## 13. 공통 연구 데이터 모델

최소 공통 모델은 기존 Viewer Entity/Relation 계약을 보존하며 확장한다.

```yaml
Entity:
  required:
    - id
    - type
    - label
    - aliases
    - summary
    - source_refs
  optional:
    - external_ids
    - coordinates
    - chronology
    - certainty
    - rights

Relation:
  required:
    - source_id
    - relation
    - target_id
    - source_refs
  optional:
    - passage_refs
    - certainty
    - chronology

Claim:
  - id
  - statement
  - subject_entity_ids
  - passage_refs
  - evidence_refs
  - certainty
  - status

Evidence:
  - id
  - source_id
  - locator
  - excerpt_or_note
  - evidence_type
  - strength

MediaAsset:
  - id
  - entity_id
  - source_url_or_local_ref
  - creator
  - license
  - credit
  - caption
  - depicts
  - certainty

GuideTopic:
  - id
  - title
  - passage_refs
  - source_research_asset_ids

GuideStep:
  - id
  - topic_id
  - sequence
  - title
  - short_explanation
  - passage_ref
  - place_ids
  - person_ids
  - event_ids
  - route_id
  - layer_state
  - camera_target
```

GuideTopic/GuideStep은 독립 연구 결론을 생성하는 데이터가 아니라 승인 연구자산의 reader-facing projection이다.

---

## 14. 자료를 어디서 확보할 것인가

### 14.1 우선순위 1 — 기존 내부 연구자산 재사용

먼저 Jude Lee OS 내부의 이미 검증되었거나 진행 중인 자산을 사용한다.

```yaml
INTERNAL_FIRST:
  - 말씀의숲_본문연구
  - Bible_Atlas_연구자산
  - WORBS_BICS_연구
  - Pastor_Lab_Personal_Research_Library
  - 기존_ResearchNote_Claim_Evidence_Entity_Relation
```

새 자료를 찾기 전에 기존 성공 자산과 verified candidate를 검색한다.

### 14.2 외부 기본 데이터 후보

```yaml
EXTERNAL_SOURCE_CLASSES:

  BIBLE_NAMES_AND_ENTITIES:
    candidate: STEP_Bible_Data
    use:
      - proper_names
      - person_place_type
      - aliases
      - original_language_forms
      - passage_occurrences
      - relationship_candidates

  BIBLE_GEOCODING:
    candidate: OpenBible_Geocoding
    use:
      - place_coordinate_seed
      - confidence_candidate
      - occurrence_link

  ANCIENT_GAZETTEER:
    candidate: Pleiades
    use:
      - ancient_place_external_id
      - ancient_names
      - place_connections
      - location_candidates

  BASE_MAP:
    candidate: OpenStreetMap_or_equivalent
    use:
      - map_rendering
    requirement:
      - license_and_attribution_compliance

  CROSS_REFERENCES:
    candidate: OpenBible_CrossReferences_or_equivalent
    use:
      - candidate_related_passage
    rule:
      - never_auto_promote_to_interpretive_truth

  PHOTOS:
    candidate: Wikimedia_Commons_and_other_rights_clear_sources
    requirement:
      - creator
      - license
      - credit
      - source

  ARCHAEOLOGY_HISTORY:
    candidate_classes:
      - academic_books
      - journal_articles
      - excavation_reports
      - museum_university_institutional_sources
    rule:
      - claim_evidence_locator_certainty_required
```

외부 데이터는 seed 또는 evidence 후보로 사용하며, 논쟁적 식별·연대·역사지리·신학적 의미를 자동 확정하지 않는다.

---

## 15. 자동 축적 파이프라인

```yaml
ACCUMULATION_PIPELINE:

  1_INGEST:
    automatic:
      - detect_new_or_changed_source
      - hash
      - source_metadata
      - rights_status
      - source_locator

  2_CLEAN:
    automatic:
      - encoding_normalization
      - chunking
      - duplicate_detection
      - passage_reference_normalization

  3_EXTRACT_CANDIDATES:
    automatic_candidate:
      - Person
      - Place
      - Event
      - Passage
      - Date
      - Relation
      - Claim
      - Evidence
      - Media

  4_LINK_CANDIDATES:
    automatic_candidate:
      - existing_entity_match
      - external_id_match
      - passage_link
      - coordinate_candidate
      - chronology_candidate

  5_VERIFY:
    professional_or_human:
      - identity_collision
      - disputed_location
      - historical_identification
      - chronology
      - theological_claim
      - source_quality
      - certainty

  6_PROMOTE:
    only_after_approval:
      - approved_entity
      - approved_relation
      - approved_claim
      - approved_media_link

  7_INDEX:
    automatic:
      - embedding
      - keyword_index
      - entity_index
      - passage_index

  8_PROJECT_TO_VIEWER:
    automatic:
      - map_projection
      - left_detail_projection
      - timeline_projection
      - related_passage_projection
      - guide_projection
```

자동화는 후보 생성·연결·검색·projection을 담당한다. 의미 확정과 승인 권한은 자동화하지 않는다.

---

## 16. Atlantis / Hezekiah 역할 경계

현재 통합 문서는 CANDIDATE이며 실제 active runtime/build 권위가 확정되지 않은 상태를 보존한다.

따라서 아래는 TARGET ROLE이며, 즉시 ACTIVE 선언이 아니다.

```yaml
TARGET_ROLE:

  Atlantis:
    - source_cleaning
    - chunking
    - merge
    - metadata
    - chunk_to_source_locator_binding
    - rights_privacy_classification
    - duplicate_prevention

  Hezekiah_Tunnel_Lite:
    - local_embedding
    - keyword_search
    - entity_retrieval
    - passage_retrieval
    - research_packet_retrieval

  Professional_Research_Project:
    - interpretation
    - claim_validation
    - evidence_judgment
    - certainty
    - VERIFY_HOLD

  Bible_Context_Viewer:
    - projection
    - exploration
    - synchronization
    - no_independent_research_conclusion
```

```yaml
CURRENT_RUNTIME_BINDING_STATUS:
  Atlantis_active_runtime: UNRESOLVED
  Hezekiah_active_runtime: UNRESOLVED
  automatic_promotion: PROHIBITED
  actual_pipeline_binding: HOLD_UNTIL_RUNTIME_AUTHORITY_RESOLVED
```

---

## 17. VERIFY / HOLD 보존

불확실한 자료를 빈칸으로 덮거나 하나의 값으로 강제 합치지 않는다.

```yaml
UNCERTAINTY_MODEL:
  preserve:
    - competing_identifications
    - alternative_coordinates
    - chronology_ranges
    - source_disagreement
    - certainty
    - VERIFY
    - HOLD
```

Viewer의 기본 사용자 층에는 과도한 내부 검증 큐를 노출하지 않되, 전문 연구 상세에서는 certainty와 source disagreement를 progressive disclosure로 확인할 수 있게 한다.

---

## 18. Passage-Driven Accumulation

전체 성경을 한 번에 채우려 하지 않는다.

새로운 passage research가 완료될 때마다 다음을 추출·축적한다.

```text
Passage Research
   │
   ├─ Person
   ├─ Place
   ├─ Event / Scene
   ├─ Claim
   ├─ Evidence
   ├─ Relation
   ├─ Media Link
   └─ Related Passage
```

예:

```text
Genesis 21
 ├─ Abraham
 ├─ Abimelech
 ├─ Beersheba
 ├─ Covenant_at_Beersheba
 ├─ located_at → Beersheba
 ├─ participant → Abraham
 ├─ participant → Abimelech
 ├─ appears_in → Genesis 21
 └─ related_passage → Genesis 26
```

한 번 승인된 객체는 이후 지도·본문·연표·Guide·Pastor Lab·Bible Atlas 등에서 다시 사용한다.

---

## 19. Projection 원칙

Viewer는 공통 연구자산 Graph의 소비자다.

```text
                    ┌→ JudeBible Context
Common Research Graph ─┼→ Pastor Lab
                    ├→ Bible Atlas
                    ├→ Sermon Research
                    ├→ Publication
                    └→ Personal Research Library
```

Viewer-specific fixture는 UI 개발용 임시 데이터로만 허용한다. 실제 제품 데이터는 승인 연구자산에서 projection한다.

---

## 20. 현재 구현 상태와 정렬 요구

`IMPLEMENT_LOCKED_BIBLE_CONTEXT_VIEWER_INTEGRATED_WORKSPACE_v0.2` 구현은 회귀검증을 통과했으나, Architecture Lock 미전달로 일부 추론 구현이 존재한다.

고정된 정렬 요구:

```yaml
REQUIRED_ALIGNMENT:
  - rail_primary_perspectives_must_be_3
  - existing_8_tabs_must_not_remain_primary_perspectives
  - guide_step_must_not_force_closed_detail_open
  - placeLinks_must_be_marked_fixture_sample
  - map_left_scripture_right_preserved
  - draggable_split_preserved
  - right_guide_preserved
  - left_contextual_detail_preserved
```

---

## 21. 변경 통제

다음 항목은 별도 설계 검토 없이 변경하지 않는다.

```yaml
LOCKED_DECISIONS:
  - first_screen_contains_map_scripture_and_information_panels_together
  - map_left_scripture_right
  - draggable_center_split
  - left_detail_contextual_not_permanent
  - right_guide_persistent_on_desktop
  - map_perspective_full_canvas
  - panels_overlay_map_in_map_perspective
  - rail_three_primary_perspectives
  - search_is_dedicated_workspace
  - entity_identity_shared_across_map_panel_scripture
  - guide_is_projection_not_research_authority
  - internal_research_assets_reused_before_new_creation
  - uncertainty_VERIFY_HOLD_preserved
  - automated_candidate_generation_but_no_automatic_truth_promotion
```

변경이 필요할 경우:

```text
문제 증거 → Lock 충돌 확인 → 설계 검토 → Captain 승인 → 구현
```

구현 중 편의 또는 임시 데이터 부족만으로 Lock을 변경하지 않는다.

---

## 22. 운영 경계

- 이 문서는 전문 Registry를 수정하지 않는다.
- Atlantis/Hezekiah 후보 구조를 ACTIVE로 승격하지 않는다.
- KRV source를 변경하지 않는다.
- 외부 공개를 승인하지 않는다.
- UI fixture를 검증 연구자산으로 승격하지 않는다.
- 구현 프로젝트는 이 문서를 입력 baseline으로 사용한다.

---

## 23. 구현 규율 — Claude / Implementation Project 공통

이 문서는 구현 전에 반드시 전체를 읽어야 하는 단일 제품 권위 입력이다.

```yaml
IMPLEMENTATION_DISCIPLINE:

  authority_document:
    file_name: JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1.md
    role:
      - PRODUCT_INTERFACE_LOCK
      - INTERACTION_LOCK
      - INFORMATION_ARCHITECTURE_LOCK
      - DATA_ACCUMULATION_LOCK
      - IMPLEMENTATION_BASELINE

  before_coding:
    required:
      - read_this_document_completely
      - inspect_current_implementation
      - identify_current_implementation_vs_lock_conflicts
      - preserve_existing_passed_regressions
      - reuse_existing_successful_components_before_rebuilding

  decision_rule:
    if_current_UI_conflicts_with_this_lock:
      action: ALIGN_TO_THIS_LOCK

    if_document_is_silent_on_product_decision:
      action: HOLD_AND_REPORT
      prohibited: GUESS_AND_IMPLEMENT

  prohibited:
    - infer_product_architecture_from_legacy_UI_when_lock_is_explicit
    - redesign_locked_architecture
    - add_new_primary_perspectives_without_review
    - convert_fixture_or_sample_data_into_authoritative_research_data
    - reopen_user_closed_detail_panel_only_because_guide_step_changed
    - backend_first_rearchitecture
    - KRV_source_mutation
    - automatic_truth_promotion
    - HARAM_visual_clone

  implementation_freedom_within_lock:
    allowed:
      - spacing_refinement
      - visual_polish
      - responsive_tuning
      - accessibility_improvement
      - performance_improvement
      - internal_refactor_without_behavior_change

  regression_preservation:
    required:
      - Wave_1
      - Wave_2
      - Search_Workspace
      - Navigation
      - KRV_read_only_boundary
      - selected_verse
      - passage_scroll_anchor
      - browser_history
      - map_scripture_split
      - current_authorization_and_self_tests
```

### Claude 구현 시작 블록

다음 지시를 새 Claude Code 세션 또는 현재 구현 세션의 첫 입력으로 사용한다.

```text
먼저 docs/architecture/JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1.md를
처음부터 끝까지 읽어라.

이 문서를 현재 JudeBible Context / 주드-컨텍스트바이블의
제품 구조, 인터페이스, 인터랙션, 정보 위계, 데이터 축적 방식의
단일 구현 기준선으로 사용한다.

현재 UI나 기존 샘플 코드에서 이 문서와 다른 제품 결정을 추론하지 않는다.
문서가 명시한 Lock과 현재 구현이 충돌하면 Lock에 정렬한다.
문서가 침묵하는 제품 결정은 임의로 만들지 말고 HOLD_AND_REPORT한다.

기존 PASS 회귀와 현재 작동하는 성공 자산은 보존하고 재사용한다.
KRV source는 수정하지 않는다.
fixture/sample data를 승인 연구데이터로 취급하지 않는다.
HARAM의 interaction grammar는 참고하되 시각 디자인을 복제하지 않는다.

먼저 현재 구현을 이 문서와 대조하여 필요한 최소 정렬 변경만 식별한 뒤,
NEXT_TASK_ONE만 실행한다.
```

```yaml
NEXT_TASK_ONE:

  task:
    ALIGN_AND_CONTINUE_JUDEBIBLE_CONTEXT_FROM_v1_1_LOCK

  owner:
    IMPLEMENTATION_PROJECT

  target:
    F:\Projects\웹앱

  first_action:
    - save_this_lock_under_docs_architecture
    - read_lock_completely
    - compare_current_implementation_to_lock
    - apply_only_minimum_required_alignment

  required_alignment:
    - rail_primary_perspectives_are_본문연구_지도_연표
    - 검색_설정_are_utilities_not_primary_perspectives
    - map_left_scripture_right
    - draggable_map_scripture_split
    - left_detail_opens_on_explicit_object_selection
    - guide_does_not_force_user_closed_detail_panel_open
    - right_guide_role_is_story_topic_layer_progress
    - map_perspective_is_full_canvas_with_overlay_panels
    - fixture_placeLinks_is_marked_non_authoritative
    - product_name_visible_as_주드-컨텍스트바이블_or_JudeBible_Context

  preserve:
    - existing_passed_QA
    - current_working_lineage
    - search_workspace
    - selected_verse
    - scroll_anchor
    - browser_history
    - KRV_binding
    - successful_map_scripture_split_behavior

  return_required:
    - lock_file_path
    - conflicts_found
    - changed_files
    - QA_results
    - desktop_screenshot
    - mobile_screenshot
    - remaining_risk
```

---

## 24. 승인 선언

```yaml
APPROVAL:
  approved_by: Captain
  approval_scope:
    - official_product_naming
    - interface_architecture
    - interaction_grammar
    - information_hierarchy
    - data_accumulation_principles
    - viewer_projection_boundary
  status: LOCKED_FOR_IMPLEMENTATION
  product_name_lock: ACTIVE

NEXT_CHANGE_RULE:
  architecture_change_requires_review: true
  implementation_may_refine_visual_details_within_lock: true
```

