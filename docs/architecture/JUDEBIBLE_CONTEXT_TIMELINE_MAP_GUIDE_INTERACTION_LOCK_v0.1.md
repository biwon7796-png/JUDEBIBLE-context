# JUDEBIBLE_CONTEXT_TIMELINE_MAP_GUIDE_INTERACTION_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_TIMELINE_MAP_GUIDE_INTERACTION_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target:
  - JudeBible Context
  - JudeBible Context Timeline
  - JudeBible Context Map
  - JudeBible Context Guide Panel

purpose: >
  HARAM 성경지리의 연표·지도·우측 네비게이션 패널에서 확인한
  유용한 interaction grammar를 JudeBible Context에 적용하기 위해
  시간·공간·본문·인물·사건 연결 원칙을 세션 독립적으로 고정한다.

important:
  - HARAM의 시각 디자인, 색상, 지도 스타일, 컴포넌트를 복제하지 않는다.
  - 학습 대상은 시간과 공간의 연결 방식, 단계형 탐색, 맥락 보존, 정보 구조다.
```

## 1. 핵심 제품 원칙

JudeBible Context의 `본문연구 / 지도 / 연표`는
서로 떨어진 별도 기능이 아니라 동일한 연구 그래프를 보는 세 가지 관점이다.

```text
본문
 ↕
지도
 ↕
연표
```

인물·장소·사건·경로·본문은 같은 identity와 relation graph를 통해 연결한다.

```yaml
shared_context:
  - passage
  - person
  - place
  - event
  - route
  - period
  - selected_entity
  - selected_story_step
```

관점을 전환해도 가능한 한 현재 읽던 맥락을 잃지 않는다.

---

## 2. 연표의 역할

연표는 단순한 역사 목록이 아니다.

연표는 시간축에서 사건·인물·시대를 선택하고,
그 선택을 곧바로 지도와 본문 맥락으로 이어주는 탐색 허브다.

```yaml
TIMELINE_ROLE:

  primary:
    - chronological_orientation
    - event_discovery
    - person_discovery
    - period_discovery
    - jump_to_spatial_context

  timeline_item:
    may_represent:
      - Event
      - Person
      - Period
      - StoryArc

  selection_result:
    - preserve_current_context
    - resolve_related_places
    - resolve_related_routes
    - resolve_related_passages
    - offer_map_transition
```

---

## 3. 연표 → 지도 전환

연표에서 인물이나 사건을 선택하면
해당 시기와 사건에 맞는 지도 상태로 바로 이어질 수 있어야 한다.

예:

```text
연표
  ↓
"여호수아의 가나안 정복"
  ↓
지도
  ↓
요단 도하 → 여리고 → 아이 → 남부 정복 → 북부 정복
```

또는:

```text
연표
  ↓
"사울을 피한 다윗"
  ↓
지도
  ↓
도피 초기 → 유다 광야 → 블레셋 땅
```

```yaml
TIMELINE_TO_MAP:

  on_event_select:
    - switch_or_link_to_map_perspective
    - highlight_related_places
    - activate_related_routes
    - set_relevant_map_extent
    - synchronize_guide_topic
    - synchronize_current_story_step

  on_person_select:
    - preserve_person_selection
    - highlight_related_places
    - highlight_related_events
    - expose_relevant_routes_if_supported

  preserve:
    - prior_passage
    - timeline_selection
    - navigation_history
```

연표에서 지도 이동 시 전체 앱 상태를 초기화하지 않는다.

---

## 4. 시간-공간 단계형 스토리

성경 사건은 한 장면이 아니라 시간에 따라 공간이 변하는 경우가 많다.

따라서 JudeBible Context는
`Story / Topic → Step 1 → Step 2 → Step 3...`
형식의 시간-공간 탐색을 지원한다.

```yaml
SPATIOTEMPORAL_STORY:

  Topic:
    examples:
      - 아브라함의 이동
      - 여호수아의 가나안 정복
      - 언약궤의 이동
      - 사울을 피한 다윗
      - 바울의 선교여행

  Step:
    required_when_supported:
      - order
      - title
      - short_reader_explanation
      - passage_refs
      - target_places
      - target_events
      - route_refs
```

각 Step은 독립적인 새 진실을 만드는 객체가 아니라
승인 연구자산을 시간순으로 묶어 보여주는 view projection이다.

---

## 5. Guide 패널의 역할

Guide는 단순 설명 패널이나 탭 모음이 아니다.

Guide는 사용자가 성경 이야기를
시간과 공간을 따라 탐색하도록 돕는 `story controller`다.

```yaml
GUIDE_PANEL:

  topic_header:
    show:
      - period
      - topic_title
      - passage_range

  topic_overview:
    default: compact_or_collapsible

  story_steps:
    show:
      - step_number
      - step_title
      - passage_refs

  selected_step:
    expand:
      - short_explanation
      - route_or_layer_controls_if_available

  footer:
    - previous
    - current_step_indicator
    - next
```

Guide의 설명은 짧고 자연스러운 한국어로 작성한다.

연구 보고서 문체나 내부 상태 코드는 보여주지 않는다.

---

## 6. Step 선택 시 동기화

오른쪽 Guide에서 단계 번호를 선택하면
왼쪽 지도와 관련 맥락이 즉시 동기화되어야 한다.

```yaml
ON_GUIDE_STEP_SELECT:

  guide:
    - mark_current_step
    - expand_current_explanation
    - keep_other_steps_visible_as_context

  map:
    - move_camera_to_relevant_extent
    - highlight_step_places
    - show_step_routes
    - emphasize_step_events
    - de_emphasize_unrelated_routes

  scripture:
    - preserve_current_passage_when_possible
    - expose_related_passage_link
    - optionally_highlight_related_verses

  detail:
    - do_not_force_open
    - keep_selected_entity_if_compatible
```

특히 Guide가 Detail 패널을 강제로 열거나
사용자가 닫은 Detail을 다시 열지 않는다.

---

## 7. 점진적 공개

전체 사건의 모든 이동 경로를 처음부터 한꺼번에 표시하지 않는다.

```yaml
PROGRESSIVE_DISCLOSURE:

  default:
    - show_topic_context
    - show_current_step
    - show_only_relevant_routes_or_layers

  user_may:
    - show_all_routes
    - hide_all_routes
    - toggle_individual_route

  goal:
    - reduce_visual_noise
    - preserve_story_sequence
    - keep_map_readable
```

예를 들어 `사울을 피한 다윗` 단계에서는
그 단계에 해당하는 도피 경로를 우선 보여주고,
다른 시기의 이동은 약화하거나 숨긴다.

---

## 8. 지도에서의 표현

지도는 단순 위치 확인용이 아니라
성경 이야기의 공간적 전개를 이해하는 중심 화면이다.

```yaml
MAP_STORY_LAYERS:

  core:
    - Place
    - Region
    - Route
    - Event

  secondary:
    - Archaeology
    - Historical_Political
    - Terrain

  interaction:
    - Selected_Entity
    - Guide_Step
    - Related_Context
```

시각적 우선순위:

```text
Selected Entity
Guide Step
Related Context
Archaeology
Event
Route
Place
Region
Historical Boundary
Terrain
Base Map
```

Guide Step과 Selected Entity는 시스템 상태에 따라 자동 강조될 수 있다.

---

## 9. Route의 의미

Route는 단순 선이 아니다.

각 Route는 특정 사건·단계·본문과 연결된 연구자산이어야 한다.

```yaml
Route:
  should_reference:
    - source_place
    - target_place
    - related_event
    - related_passage
    - story_step

  reader_facing:
    may_show:
      - route_label
      - approximate_distance_if_supported
      - route_character
```

정확한 고대 이동 경로가 확인되지 않은 경우
확정 경로처럼 표현하지 않는다.

사용자 화면에는 필요에 따라:
- 이동 경로
- 추정 경로
- 대략적인 이동
같은 쉬운 표현을 사용한다.

---

## 10. 시간 정보의 불확실성

연표의 연대는 항상 절대적으로 확정된 값이 아닐 수 있다.

내부에서는 세밀한 상태를 유지하되
사용자에게는 쉬운 언어로 표현한다.

```yaml
TIMELINE_UNCERTAINTY_DISPLAY:

  approximate:
    user_label: 대략 이 시기

  disputed:
    user_label: 연대에 여러 견해가 있음

  relative_only:
    user_label: 사건 순서는 확인되지만 정확한 연대는 알기 어려움
```

`VERIFY`, `HOLD`, `authority` 같은 내부 용어는
일반 연표 화면에 노출하지 않는다.

---

## 11. 시간과 공간의 양방향 이동

탐색은 한 방향이 아니다.

```text
연표 → 사건 → 지도
지도 → 장소 → Detail
Detail → 관련 인물
인물 → 관련 사건
사건 → 연표
연표 → 관련 본문
본문 → 장소 → 지도
```

```yaml
BIDIRECTIONAL_NAVIGATION:

  Timeline_to_Map: true
  Map_to_Timeline: true
  Map_to_Detail: true
  Detail_to_Scripture: true
  Person_to_Place: true
  Person_to_Event: true
  Event_to_Timeline: true
  Passage_to_Map: true
```

모든 이동에서 가능하면 기존 passage/entity/story context를 보존한다.

---

## 12. Navigation History

사용자가 여러 관점을 이동해도
이전에 보던 연구 맥락으로 돌아갈 수 있어야 한다.

```yaml
NAVIGATION_HISTORY:

  preserve_when_possible:
    - previous_passage
    - previous_entity
    - previous_timeline_item
    - previous_story_step
    - previous_map_extent

  user_actions:
    - back_to_previous_context
    - return_to_passage
    - return_to_timeline
```

브라우저 수준의 단순 뒤로 가기만 의존하지 않고
앱 내부 context history를 유지할 수 있다.

---

## 13. Reader Language

Guide/Timeline/Map의 사용자 문장은
연구 결과를 쉽게 이해하도록 편집한다.

```yaml
READER_LANGUAGE:

  use:
    - 자연스러운_한국어
    - 짧은_설명
    - 사건의_흐름
    - 공간의_변화
    - 본문과의_직접연결

  avoid:
    - 학술보고서_문체
    - 내부_상태코드
    - projection
    - Registry
    - authority
    - VERIFY
    - HOLD
    - source_locator
```

Guide Step 설명은
"무슨 일이 일어났는가 / 어디로 이동했는가 / 어떤 본문과 연결되는가"를
짧게 이해하게 하는 수준을 목표로 한다.

---

## 14. 90 Region 연구와의 결속

Bible Atlas 90 Region 연구는
향후 Timeline–Map–Guide를 지원할 수 있도록
Region 자체뿐 아니라 연결 데이터를 축적한다.

```yaml
REGION_RESEARCH_SHOULD_CAPTURE_WHEN_SUPPORTED:

  - related_places
  - related_events
  - related_people
  - related_routes
  - passage_links
  - historical_periods
  - event_sequence
  - route_sequence
```

단, Region 연구 하나에 모든 성경 사건을 억지로 채우지 않는다.

근거가 있는 연결만 축적한다.

---

## 15. 연구 파일 저장

시간-공간 스토리와 Route/Event 연구도
Markdown 연구자산으로 저장할 수 있어야 한다.

```yaml
PERSISTENCE:

  format: .md

  frontmatter_may_include:
    - stable_id
    - type
    - period
    - passage_refs
    - related_places
    - related_events
    - related_routes

  body:
    - Reader_Layer
    - Story_Steps
    - Claims
    - Evidence
    - Sources
    - Uncertainty
```

Obsidian에서도 Person / Place / Event / Route / Passage 관계를
후속 탐색할 수 있게 한다.

---

## 16. 앱기획 적용 체크

```yaml
APP_PLANNING_CHECK:

  timeline:
    - 사건과_인물에서_지도까지_연결되는가
    - 연표가_단순목록이_아닌_탐색허브인가

  guide:
    - 숫자_단계_선택이_지도와_동기화되는가
    - 짧은_설명과_본문이_함께_보이는가
    - 이전_다음으로_시간순_탐색이_가능한가

  map:
    - 현재_step의_장소와_route가_강조되는가
    - unrelated_context가_과도하게_표시되지_않는가

  context:
    - Timeline_Map_Guide_Scripture가_같은_identity를_공유하는가
    - 관점_전환으로_본문_맥락이_불필요하게_사라지지_않는가

  reader_language:
    - 설명이_쉽고_짧은가
    - 내부운영어가_노출되지_않는가
```

---

## 17. 기존 고정 문서와의 관계

본 문서는 다음 문서를 대체하지 않고 보완한다.

```yaml
related_documents:
  - JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1
  - JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_90_REGION_SHARED_RESEARCH_STRATEGY_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_HARAM_INTERACTION_GRAMMAR_AND_READER_LANGUAGE_LOCK_v0.1
```

충돌 시:
- 연구 권위와 identity는 기존 research/projection lock을 따른다.
- Reader Language는 HARAM interaction/reader language lock을 따른다.
- Timeline–Map–Guide 상호작용은 본 문서를 따른다.
- 실제 UI 변경은 앱기획 프로젝트에서 검토·구현한다.

---

## 18. 현재 고정 결정

```yaml
LOCKED_DECISIONS:

  - Timeline_Map_Guide는_같은_연구그래프의_서로다른_관점
  - 연표의_사건과_인물을_지도와_직접연결
  - Guide는_story_controller
  - 단계번호를_누르면_지도상태와_설명이_동기화
  - 사건의_시간흐름을_공간변화로_보여줌
  - current_step에_필요한_route를_우선표시
  - 전체경로_동시노출보다_progressive_disclosure_우선
  - Guide가_Detail을_강제로_열지_않음
  - passage_entity_story_context를_가능한_보존
  - 시간과_공간을_양방향으로_탐색
  - 사용자언어는_쉽고_자연스러운_한국어
  - 90_Region_연구가_Event_Route_Passage_연결을_지원하도록_축적
```
