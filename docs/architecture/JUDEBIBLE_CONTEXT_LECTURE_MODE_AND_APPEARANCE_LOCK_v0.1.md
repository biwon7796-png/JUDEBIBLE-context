# JUDEBIBLE_CONTEXT_LECTURE_MODE_AND_APPEARANCE_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_LECTURE_MODE_AND_APPEARANCE_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target:
  - JudeBible Context
  - Lecture Mode
  - Appearance Mode

purpose: >
  HARAM 성경지리에서 확인한 강의 모드와 밝게/어둡게 전환 원리를
  JudeBible Context의 발표·수업·화면공유 환경에 적용하기 위해
  세션 독립적인 제품 원칙으로 고정한다.

important:
  - HARAM의 시각 디자인과 컴포넌트를 복제하지 않는다.
  - 학습 대상은 presentation mode, context preservation,
    화면 확장, 테마 전환의 interaction grammar다.
```

## 1. 핵심 원칙

강의 모드는 별도 콘텐츠를 만드는 기능이 아니라,
현재 보고 있는 연구 맥락을 유지한 채
발표와 화면공유에 적합한 화면으로 전환하는 모드다.

```yaml
LECTURE_MODE_PRINCIPLE:

  preserve_context:
    - current_passage
    - selected_entity
    - selected_event
    - selected_story_step
    - active_routes
    - map_extent

  change_only:
    - presentation_layout
    - screen_density
    - nonessential_UI_visibility
```

## 2. 강의 모드의 목적

```yaml
LECTURE_MODE_USE_CASES:
  - Zoom_강의
  - 온라인_성경공부
  - 교실_강의
  - 프로젝터_발표
  - 화면공유
  - 설교_전_지도설명
```

## 3. 강의 모드 진입 시

```yaml
ON_LECTURE_MODE_ENTER:

  workspace:
    - expand_main_workspace
    - reduce_nonessential_navigation
    - keep_map_primary
    - keep_Guide_visible
    - keep_story_controls_available

  preserve:
    - current_story_step
    - current_routes
    - selected_entity
    - current_passage
    - map_camera

  avoid:
    - resetting_current_context
    - opening_unrelated_panels
    - changing_research_state
```

## 4. Guide 패널 유지

강의 모드에서도 Guide는 남긴다.

이유:
- 현재 주제와 단계 확인
- 이전/다음 단계 진행
- 짧은 설명 제공
- 관련 본문 확인
- 지도 경로 제어

```yaml
LECTURE_GUIDE:

  keep_visible: true

  prioritize:
    - topic_title
    - current_step
    - short_explanation
    - passage_ref
    - previous_next

  de_emphasize:
    - deep_research_metadata
    - internal_status
    - nonessential_tools
```

## 5. 종료 방식

```yaml
LECTURE_MODE_EXIT:

  supported:
    - explicit_exit_button
    - Esc_key

  on_exit:
    - restore_previous_workspace_layout
    - preserve_research_context
    - preserve_map_state_when_possible
```

강의 모드 종료 후
사용자가 보고 있던 사건·단계·지도 위치를 잃지 않는다.

## 6. 밝게 / 어둡게

JudeBible Context는 밝은 화면과 어두운 화면을 모두 지원하는 방향으로 고정한다.

```yaml
APPEARANCE_MODE:

  modes:
    - 밝게
    - 어둡게

  purpose:
    밝게:
      - 일반탐색
      - 낮시간
      - 인쇄준비
      - 밝은강의실

    어둡게:
      - 야간연구
      - 어두운강의실
      - 프로젝터
      - 화면공유
      - 시선집중
```

## 7. 테마 전환 시 상태 보존

```yaml
ON_APPEARANCE_CHANGE:

  preserve:
    - current_passage
    - selected_entity
    - selected_event
    - selected_story_step
    - map_extent
    - active_routes
    - visible_layers

  must_not:
    - reset_navigation
    - change_story_step
    - change_research_identity
    - alter_source_data
```

## 8. 지도 가독성

밝게/어둡게는 지도와 Guide 모두에서 읽기 쉬워야 한다.

```yaml
MAP_THEME_REQUIREMENTS:

  light:
    - terrain_readable
    - route_contrast_clear
    - labels_legible

  dark:
    - terrain_not_overpowering
    - route_and_selected_place_high_contrast
    - labels_legible
    - water_and_boundary_distinguishable
```

단순히 전체 색을 반전하는 방식보다
지도 요소별 가독성을 유지하는 방향을 우선한다.

## 9. 강의 모드와 지도 설정의 관계

강의 모드에서도 기존 지도 설정을 보존한다.

```yaml
LECTURE_MAP_SETTINGS:

  preserve:
    - all_place_labels_setting
    - region_name_setting
    - rivers_and_lakes_setting
    - terrain_setting
    - modern_reference_setting
    - story_route_setting

  user_may_change_during_lecture:
    - true
```

설정 변경은 발표 상태에만 영향을 주고
연구 truth나 identity를 변경하지 않는다.

## 10. Timeline / Map / Guide 연동

강의 모드는 기존 Timeline–Map–Guide interaction을 그대로 유지한다.

```yaml
LECTURE_CONTEXT_FLOW:

  timeline_select:
    - event_or_person
    - switch_to_map
    - guide_sync

  guide_step_select:
    - map_route_update
    - short_explanation_update

  lecture_mode:
    - preserves_same_flow
```

강의 모드 때문에
시간-공간 내비게이션 기능이 축소되지 않는다.

## 11. Reader Language

강의 화면에서도 쉬운 한국어를 사용한다.

```yaml
LECTURE_READER_LANGUAGE:

  use:
    - 짧은_단계제목
    - 쉬운_설명
    - 관련본문
    - 이동경로_라벨

  avoid:
    - VERIFY
    - HOLD
    - authority
    - projection
    - source_locator
    - stable_id
    - 내부운영문구
```

## 12. 앱기획 적용 체크

```yaml
APP_PLANNING_CHECK:

  lecture_mode:
    - workspace_expands
    - nonessential_UI_reduced
    - map_remains_primary
    - Guide_remains_visible
    - Esc_exit_supported
    - explicit_exit_supported

  context:
    - passage_preserved
    - selected_entity_preserved
    - selected_event_preserved
    - story_step_preserved
    - active_routes_preserved
    - map_extent_preserved_when_possible

  appearance:
    - light_mode
    - dark_mode
    - state_preserved_across_switch

  usability:
    - Zoom_screen_share_readable
    - projector_readable
    - Guide_text_not_too_small
```

## 13. 기존 고정 문서와의 관계

본 문서는 아래 문서를 대체하지 않고 보완한다.

```yaml
related_documents:
  - JUDEBIBLE_CONTEXT_TIMELINE_MAP_GUIDE_INTERACTION_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_MAP_WORKSPACE_CONTROLS_AND_EXPORT_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_HARAM_INTERACTION_GRAMMAR_AND_READER_LANGUAGE_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_PERSONAL_MATERIALS_AND_REVIEW_QUIZ_LOCK_v0.1
```

충돌 시:
- Timeline–Map–Guide 상태 연동은 기존 interaction lock을 따른다.
- 지도 설정·저장·출력은 map workspace lock을 따른다.
- Reader Language는 reader language lock을 따른다.
- 강의 모드와 밝게/어둡게 전환은 본 문서를 따른다.
- 실제 UI 구현은 09_앱기획_도이치리베_내부도구에서 수행한다.

## 14. 현재 고정 결정

```yaml
LOCKED_DECISIONS:

  - 강의모드_지원
  - Zoom_교실_프로젝터_화면공유를_주요사용사례로_봄
  - 강의모드에서_지도는_주화면으로_유지
  - Guide는_강의모드에서도_유지
  - 비필수_UI는_축소
  - Esc와_명시적_종료버튼_지원
  - 강의모드_진입종료시_현재맥락_보존
  - 밝게_어둡게_모드_지원
  - 테마전환시_본문_인물_사건_step_route_map_state_보존
  - 단순색반전보다_지도요소별_가독성_우선
```
