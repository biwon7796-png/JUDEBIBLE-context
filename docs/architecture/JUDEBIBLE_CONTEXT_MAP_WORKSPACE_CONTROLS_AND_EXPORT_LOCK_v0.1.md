# JUDEBIBLE_CONTEXT_MAP_WORKSPACE_CONTROLS_AND_EXPORT_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_MAP_WORKSPACE_CONTROLS_AND_EXPORT_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target:
  - JudeBible Context
  - Map Workspace
purpose: >
  HARAM 성경지리 지도 화면에서 확인한
  보기 범위 전환, 지도 설정, 저장, 출력 기능을
  JudeBible Context 지도 관점에 적용하기 위해
  핵심 interaction grammar와 제품 원칙을 고정한다.

important:
  - HARAM의 시각 디자인과 컴포넌트를 복제하지 않는다.
  - 학습 대상은 지도 작업공간의 기능 구조와 사용자 흐름이다.
```

## 1. 핵심 원칙

JudeBible Context의 지도는 단순한 보기 화면이 아니라
연구·탐색·설교 준비에 직접 활용할 수 있는 작업공간으로 설계한다.

```yaml
MAP_WORKSPACE_ROLE:
  - spatial_context_viewer
  - research_navigation_surface
  - story_route_viewer
  - teaching_preparation_tool
  - exportable_map_workspace
```

## 2. 보기 범위 전환

사용자는 현재 사건이나 지역에 갇히지 않고
큰 맥락과 작은 맥락을 빠르게 오갈 수 있어야 한다.

```yaml
VIEW_SCOPE_CONTROLS:

  available:
    - 성경세계_전체보기
    - 현재지역_전체보기
    - 현재사건_맞춤보기

  behavior:
    성경세계_전체보기:
      purpose: >
        현재 선택을 유지한 채 성경 세계 전체 맥락을 보여준다.

    현재지역_전체보기:
      purpose: >
        현재 선택한 Region 또는 관련 지역 전체가 보이도록
        지도 범위를 맞춘다.

    현재사건_맞춤보기:
      purpose: >
        현재 Event/Story Step과 관련된 장소와 경로가
        가장 잘 보이도록 지도 범위를 맞춘다.
```

범위 변경은 연구 identity나 현재 사건 선택을 초기화하지 않는다.

## 3. 지도 설정

지도 화면 요소는 사용자가 필요에 따라 켜고 끌 수 있다.

```yaml
MAP_SETTINGS:

  toggles:
    - 모든_지명_표시
    - 지역_바다_이름
    - 강과_호수
    - 지형_음영
    - 현대지도_참조
    - 장면_경로_범위_전체

  principle: >
    지도 설정은 표현 상태를 바꾸는 기능이며
    source research, stable identity, story context를
    변경하지 않는다.
```

## 4. 지도 설정과 연구 상태 분리

```yaml
SEPARATION_OF_CONCERNS:

  research_state:
    examples:
      - selected_entity
      - selected_event
      - selected_story_step
      - related_route_ids
      - place_identity

  presentation_state:
    examples:
      - show_all_labels
      - show_region_names
      - show_rivers
      - show_terrain_shading
      - show_modern_reference
      - show_all_story_routes

  rule: >
    presentation_state 변경이 research_state를
    자동 수정하거나 승격하지 않는다.
```

## 5. 현재 맥락 보존

지도 설정이나 범위 전환 중에도
사용자가 보던 연구 맥락을 가능한 한 유지한다.

```yaml
PRESERVE_CONTEXT:

  keep:
    - selected_entity
    - selected_event
    - selected_story_step
    - current_passage
    - active_routes

  map_camera:
    may_change_when:
      - user_selects_world_view
      - user_selects_region_view
      - user_selects_event_fit
```

## 6. 저장 기능

현재 지도 상태를 이미지로 저장할 수 있어야 한다.

```yaml
MAP_EXPORT:

  image:
    format:
      - PNG

    include_when_possible:
      - current_map_extent
      - visible_labels
      - visible_routes
      - visible_regions
      - current_story_highlights
      - attribution

  purpose:
    - 설교자료
    - 강의자료
    - 성경공부자료
    - 개인연구기록
```

지도 이미지 저장 시
표시된 지도/데이터 소스의 attribution 요구를 보존한다.

## 7. 인쇄 기능

```yaml
PRINT:

  supported_output:
    - A4_single_page

  print_view:
    should_prioritize:
      - map_readability
      - visible_story_routes
      - place_labels
      - attribution
      - selected_topic_title_if_available
```

인쇄 기능은 현재 지도 표현을
강의·설교·연구용으로 꺼내 쓰는 실용 기능으로 취급한다.

## 8. 지도 제어 UI

지도 도구는 왼쪽 또는 지도 위의 compact control stack처럼
작은 공간에서 빠르게 접근할 수 있도록 한다.

```yaml
MAP_TOOLBAR:

  may_include:
    - zoom_in
    - zoom_out
    - fit_view
    - focus_current_context
    - map_settings
    - export_or_print

  requirement:
    - 지도 내용을 과도하게 가리지 않을 것
    - 쉬운 아이콘 또는 짧은 한국어 label 사용
    - hover-only 기능에 의존하지 않을 것
```

## 9. Timeline / Guide와의 결속

본 문서의 지도 제어는
기존 Timeline–Map–Guide interaction lock과 함께 적용한다.

```yaml
INTEGRATION:

  from_guide_step:
    - highlight_current_routes
    - fit_to_current_story_when_requested

  from_timeline:
    - preserve_event_selection
    - allow_region_or_world_zoom_out

  export:
    - current_story_context_may_be_included
```

## 10. 사용자 언어

지도 설정에는 내부 GIS/시스템 용어보다
바로 이해할 수 있는 쉬운 한국어를 우선한다.

예:

```yaml
reader_labels:
  show_all_labels: 모든 지명 표시
  show_regions_and_seas: 지역·바다 이름
  show_rivers_and_lakes: 강과 호수
  terrain_shading: 지형 음영
  modern_reference_map: 현대 지도
  fit_story_routes: 장면 경로·범위 전체
  export_png: 이미지(PNG)로 저장
  print_a4: 인쇄(A4 한 장)
```

## 11. 데이터·출처 표시

지도 데이터의 출처와 저작권 정보는
사용자를 방해하지 않으면서도 확인 가능해야 한다.

```yaml
ATTRIBUTION:

  preserve:
    - basemap_source
    - terrain_source
    - place_name_source
    - route_basis_if_required

  display:
    - compact_footer_or_settings_note
```

연구 내부의 authority/status 코드를
일반 사용자 attribution 문장에 노출하지 않는다.

## 12. 앱기획 적용 체크

```yaml
APP_PLANNING_CHECK:

  scope_controls:
    - 성경세계_전체보기_지원
    - 현재지역_전체보기_지원
    - 현재사건_맞춤보기_지원

  map_settings:
    - labels_toggle
    - region_names_toggle
    - water_features_toggle
    - terrain_toggle
    - modern_reference_toggle
    - all_story_routes_toggle

  export:
    - PNG_export
    - A4_print

  state:
    - map_setting_changes_do_not_mutate_research_state
    - selected_event_entity_step_are_preserved_when_possible

  usability:
    - controls_do_not_cover_critical_map_area
    - labels_are_easy_Korean
```

## 13. 기존 고정 문서와의 관계

이 문서는 아래 문서를 대체하지 않고 보완한다.

```yaml
related_documents:
  - JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1
  - JUDEBIBLE_CONTEXT_HARAM_INTERACTION_GRAMMAR_AND_READER_LANGUAGE_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_TIMELINE_MAP_GUIDE_INTERACTION_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK_v0.1
```

충돌 시:
- 연구 identity와 authority는 기존 research/projection lock을 따른다.
- Timeline/Guide 동기화는 Timeline–Map–Guide lock을 따른다.
- 지도 표현 제어·범위·저장·출력은 본 문서를 따른다.
- 실제 UI 구현은 09_앱기획_도이치리베_내부도구에서 수행한다.

## 14. 현재 고정 결정

```yaml
LOCKED_DECISIONS:

  - 지도는_단순보기화면이_아닌_작업공간
  - 성경세계_전체보기_지원
  - 현재지역_전체보기_지원
  - 현재사건_맞춤보기_지원
  - 지명_지역명_강호수_지형음영_현대지도_등을_설정가능
  - 지도설정과_연구상태를_분리
  - 현재_story_entity_event_context를_가능한_보존
  - PNG_저장_지원
  - A4_인쇄_지원
  - export시_attribution_보존
  - 지도제어는_쉽고_간결한_한국어로_표현
```
