# JUDEBIBLE_BIBLE_WORLD_EXPLORER_MAP_PRODUCTION_PLAN_v0.2

status: UPDATED_PRODUCTION_PLAN_PERSISTED
date: 2026-10-06
scope:
  - JudeBible Bible World Explorer
  - Era Map
  - Topic Overlay
  - Bible Navigation Panel
  - Timeline Synchronization
  - Geography Knowledge Layer
authority_effect: NONE
registry_effect: NONE
runtime_effect: NONE
supersedes_for_planning:
  - JUDEBIBLE_ERA_MAP_PRODUCTION_METHOD_v0.1

## 1. 목적

JudeBible의 성경세계탐색을 단순한 "주제 카드 모음"이 아니라,
**본문 · 지도 · 연표 · 인물 · 장소 · 연구를 함께 움직이는 성경 내비게이션 시스템**으로 재설계한다.

핵심 사용자 경험은 다음과 같다.

- 사용자는 같은 지도 위에서 시대를 전환한다.
- 90개 핵심 지명은 항상 동일한 기본 위계를 유지한다.
- 현재 시대와 주제에 관련된 지명만 추가 강조된다.
- 관련 장소는 경로선·관계선·사건 마커로 연결된다.
- 주제를 선택하면 지도가 해당 장면이 가장 잘 보이는 위치로 자동 정위치된다.
- 오른쪽 Bible Navigation Panel이 본문·지도·연표·인물·장소·연구 이동을 안내한다.
- 왼쪽 Research Panel은 깊은 WORBS/Person/Place 연구를 담당한다.

## 2. 화면 역할 분리

### Left — Research Panel
역할:
- WORBS
- Person Research
- Place Research
- 전문 주해
- evidence / provenance 기반 깊은 연구

하지 않는 것:
- 내비게이션 허브 역할
- 현재 지도 상태 설명의 중복

### Center — Scripture + Map Workspace
역할:
- 성경 본문 읽기
- 원어 보기
- 지도 탐색
- 시대/주제 overlay 시각화
- route / event scene 표시

### Right — Bible Navigation Panel
역할:
- 현재 탐색 위치 표시
- 본문으로 이동
- 지도 장면 전환
- 연표 위치 동기화
- 관련 인물/장소/사건/연구로 이동
- 이전/다음 사건 이동

원칙:
- 긴 연구문은 싣지 않는다.
- "지금 어디를 보고 있는가 / 어디로 갈 수 있는가"에 집중한다.

## 3. 성경세계탐색 상위 구조

기존의 "기초 지리 / 자연환경 / 구약 세계 / 신약 세계"는 다음 4축으로 재편한다.

### A. 시대 지도
- 원역사
- 족장 시대
- 출애굽·광야
- 가나안 정복
- 사사 시대
- 통일왕국
- 분열왕국
- 앗수르
- 바벨론·포로
- 페르시아·귀환
- 신구약 중간기
- 예수 시대
- 초대교회

### B. 인물·여정
예:
- 아브라함의 이동
- 이삭의 생애
- 야곱의 이동
- 출애굽 여정
- 다윗의 도피
- 예수의 갈릴리 사역
- 예루살렘 여정
- 바울 1·2·3차 전도여행

### C. 주제 오버레이
예:
- 언약의 장소
- 성전과 예배
- 왕국과 제국
- 전쟁과 정복
- 예언자 활동
- 복음서 주요 사건
- 교회 확장

### D. 기초 지리·자연환경
시대와 독립적으로 함께 켤 수 있는 reference layer이다.
- 지형 읽기
- 산맥·고원·평야
- 광야·계곡
- 강·하천·호수·바다
- 주요 수계
- 고대 근동 주요 지역

## 4. 지도 제작의 기본 철학

### 4.1 한 시대 지도씩 완성
Level A 90개를 한 번에 자동 지도화하지 않는다.
**시대별 지도 1장씩 정밀하게 제작·검수**한다.

이유:
- 지명 위치와 라벨 충돌을 사람이 실제 문맥에서 검수할 수 있음
- 시대별 밀도 조절 가능
- 경로와 사건 중심의 서사적 지도가 가능
- 대량 자동 배치로 인한 위치/가독성 오류를 줄임

### 4.2 같은 basemap 유지
시대가 바뀌어도:
- terrain
- sea / river
- mountain / desert
- physical geography

는 유지한다.

시대 전환은 "새 지도 이미지" 교체가 아니라 overlay 교체이다.

## 5. 지도 지식층 구조

### Layer 0 — Physical Base
- terrain
- 산맥
- 평야
- 고원
- 광야
- 계곡
- 해안

### Layer 1 — Hydrology
독립 연구 가능한 지리 객체로 관리한다.
- 강
- 하천
- 와디
- 샘
- 호수
- 바다

예:
- 요단강
- 유프라테스강
- 나일강
- 아르논강
- 얍복강
- 기손강
- 갈릴리호
- 사해
- 지중해

### Layer 2 — Level A Anchor Places
기존 핵심 90개 PLACE_ID이다.

원칙:
- 항상 동일한 기본 위계
- 시대/주제가 바뀌어도 base rank는 유지
- spatial anchor 역할
- 화면 축소 시 일부 숨을 수 있으나 상대적 rank는 변하지 않음

### Layer 3 — Level B Context Places
주요 2차 지명이다.

원칙:
- 시대·주제·zoom에 따라 노출
- 관련 scene에서 priority 상승 가능
- 연구가 늘어날수록 지속적으로 축적

### Layer 4 — Level C Local Places
세부 지명·마을·유적·소규모 지리 객체이다.

원칙:
- 상세 scene에서 선택적으로 노출
- 현재 주제의 핵심이면 Level A보다 시각적으로 더 강하게 강조될 수 있음

### Layer 5 — Era Overlay
- 그 시대에 중요한 지명
- 시대 영역
- 시대 경로
- 시대 사건
- 시대 라벨 우선순위

### Layer 6 — Active Topic / Route Overlay
현재 사용자가 선택한 주제 장면이다.
- FOCUS places
- RELATED places
- route / relation lines
- event markers
- scene viewport

## 6. 시각 위계 모델

지도 표시 위계는 단일 등급이 아니라 다음을 합성한다.

**Base Rank + Era Relevance + Topic Focus**

### Base Rank
- Level A
- Level B
- Level C

### Context State
- NORMAL
- RELATED
- FOCUS

예:
- Level A + NORMAL = 항상 보이는 핵심 지명
- Level B + RELATED = 현재 시대에 중요한 2차 지명
- Level C + FOCUS = 현재 사건의 핵심 무대이므로 가장 강하게 표시 가능

중요:
- 90개 Level A의 기본 서열은 주제로 인해 낮아지지 않는다.
- 현재 주제 지명은 "기본 위계를 교체"하지 않고 "추가 강조 상태"를 얻는다.

## 7. 경로·관계선 표현

경로선은 장식이 아니라 연구자산의 projection이다.

시각 문법 예:
- 높은 확실성 route = solid
- 추정 route = dashed
- 단순 관계 = thin connector
- disputed route = uncertainty style

금지:
- 정확한 경로가 없는 경우 실제 도로처럼 확정적으로 그림
- representative point를 실제 중심점처럼 사용
- source geometry를 연구 승인 geometry로 자동 승격

## 8. Topic Map Scene

주제 하나는 다음 장면 계약을 가진다.

```yaml
TOPIC_MAP_SCENE:
  topic_id:
  era_id:

  focus_places: []
  related_places: []
  related_regions: []

  routes: []
  relations: []
  events: []

  elevated_labels: []

  viewport:
    mode: FIT_RELATED_FEATURES
    padding:
      left:
      right:
      top:
      bottom:

  source_refs: []
  certainty_notes: []
```

주제를 선택하면:
1. 관련 지명 priority 상승
2. 관련 경로/관계선 표시
3. 사건 마커 표시
4. scene 전체가 가장 잘 보이도록 자동 정위치
5. Bible Navigation Panel 동기화
6. Scripture / Timeline 동기화

## 9. 자동 정위치 규칙

주제를 선택했을 때 단순한 지도 중심 이동이 아니라 **scene framing**을 한다.

고려 요소:
- focus places
- related places
- route extent
- region extent
- event markers
- 오른쪽 Bible Navigation Panel이 차지하는 폭
- 왼쪽 Research Panel 열림 여부
- 모바일/데스크톱 viewport

원칙:
- 실제 보이는 지도 영역의 중앙에 장면이 오도록 padding을 적용
- 관련 feature 전체가 한눈에 보이도록 fit
- 지나친 zoom-out으로 문맥이 사라지지 않도록 min/max zoom 제한

## 10. Bible Navigation Panel 설계

오른쪽 패널은 Context Information Panel이 아니라 **Bible Navigation Panel**이다.

### 구성

#### A. Current Location
예:
족장 시대 > 아브라함 > 그랄 체류

#### B. Scripture
- 현재 본문
- 관련 본문
- 본문으로 이동

#### C. Map
- 현재 활성 overlay
- 핵심 장소
- 관련 장소
- 경로 보기
- 전체 장면 보기

#### D. Timeline
- 시대
- 인물 생애 내 위치
- 사건
- 연표에서 보기

#### E. Related Entities
- People
- Places
- Events

#### F. Research
- WORBS
- Person research
- Place research

Research 버튼은 왼쪽 Research Panel을 연다.

#### G. Sequence Navigation
- 이전 사건
- 다음 사건
- 같은 시대 더 보기

## 11. Topic Navigation Preset

```yaml
TOPIC_NAV_PRESET:
  topic_id:
  title:
  category:
  era_id:

  scripture_refs: []

  map:
    places: []
    regions: []
    routes: []
    events: []

  timeline:
    event_ids: []

  related:
    people: []
    places: []
    events: []
    research: []

  navigation:
    previous:
    next:

  reader_summary:
```

이 객체는 전문 의미를 새로 만들지 않는다.
기존 승인 자산을 묶어 Navigation projection만 제공한다.

## 12. Timeline 연결

지도와 연표는 별도 데이터로 중복 작성하지 않는다.

공통 identity를 사용한다.

```
EVENT / PLACE / PERSON
        ↓
shared identity
        ↓
Scripture / Map / Timeline / Navigation
```

예:
창 22 사건 identity 하나를
- 본문
- 지도
- 연표
- 아브라함 인물
- 모리아 장소
가 함께 참조한다.

## 13. 외부 지리자료와 연구자료의 경계

### DIRECT_DATA
- source-local id
- object type
- source-exact geometry
- source-exact point
- confidence band
- external URI
- 물리 지형 facts

### RESEARCH_EVIDENCE
- 고대 장소 ↔ 현대 장소 identification
- 역사적 동일성
- 시대별 경계 해석
- route reconstruction
- Pleiades / 다른 gazetteer crosswalk

JudeBible canonical identity는 외부 source-local id로 대체하지 않는다.

## 14. 지리 연구 확장 전략

90개 Level A는 전체 지리 연구의 끝이 아니라 **Anchor Layer**이다.

장기 확장:
- Level A → Level B → Level C
- Place
- Region
- River
- Sea
- Mountain
- Valley
- Desert
- Route
- Event
- Archaeological Site

원칙:
**연구 데이터는 풍부하게, 지도 화면은 절제해서** 표현한다.

예상 projection:
전체 연구자산 1,500+
→ 현재 zoom에 필요한 대상
→ 현재 시대 관련 대상
→ 현재 주제 핵심 대상
순으로 줄여 화면에 표시한다.

## 15. 시대별 지도 제작 단위

각 시대 지도는 "지명 DB를 새로 만드는 것"이 아니라
공용 지리 지식층에서 무엇을 보여줄지 선택하는 편집판이다.

예:

```yaml
PATRIARCHAL_ERA:
  anchor_places: []
  context_places: []
  local_places: []
  physical_features: []
  hydrology: []
  routes: []
  events: []
  label_priority: {}
  default_view: {}
```

## 16. 첫 E2E Fixture

첫 지도 제작 fixture:
**족장 시대**

첫 UI/navigation fixture:
**아브라함의 그랄 체류**

검증 대상:
- Level A 90 기본 위계 유지
- Gerar/Beersheba/Negev 등 관련 지명 강조
- 아브라함 관련 이동/관계선
- 창 20 본문 동기화
- 족장 시대 연표 동기화
- 오른쪽 Bible Navigation Panel 갱신
- 왼쪽 Research Panel WORBS/Place/Person 연결
- scene auto-fit
- uncertainty 표현
- label collision / readability

## 17. 제작 운영 원칙

자동화:
- 외부 fact 수집
- source normalization
- identity candidate 연결
- Source Note 축적
- relation 재사용
- projection 준비

사람 검수 중심:
- 시대별 지명 구성
- 지명 label placement
- route 시각 표현
- scene framing
- 밀도 조절
- readability
- uncertain/disputed 표현

즉:
**자료 연결은 자동화하고, 지도 편집은 정밀 검수한다.**

## 18. 금지사항

- 90개만 연구하고 끝내는 방식
- 90개 전체를 항상 같은 강도로 모두 노출
- Level B/C를 단순히 제거
- 시대마다 별도 raster 지도 제작
- 이름 유사성만으로 entity binding
- source point를 실제 역사적 중심점으로 승격
- 불확실한 route를 확정 실선처럼 표현
- UI가 연구 의미를 추론
- Timeline/Map/Event identity를 중복 생성

## 19. 성공 기준

- 90개 핵심 지명의 기본 위계가 시대/주제 전환에도 안정적
- 2차·3차 지명 연구가 늘어나도 화면이 과밀해지지 않음
- 수계와 지형이 독립 research/reference object로 축적됨
- 현재 주제 지명이 명확하게 강조됨
- 경로/사건이 자연스럽게 연결됨
- 선택 시 장면이 정확하게 자동 framing됨
- 본문·지도·연표·인물·장소가 같은 identity로 동기화됨
- 오른쪽 패널이 명확한 Bible Navigation 역할 수행
- 왼쪽 Research Panel과 역할 중복 없음
- 외부 fact / 전문 연구 / uncertainty 경계가 보존됨

## 20. 현재 고정 결정

```yaml
CURRENT_DECISIONS:
  map_model: COMMON_BASEMAP_PLUS_LAYERED_OVERLAYS
  level_a_90_role: ANCHOR_LAYER
  level_a_90_base_hierarchy: FIXED
  secondary_places: EXPAND_CONTINUOUSLY
  hydrology: INDEPENDENT_RESEARCH_LAYER
  terrain: INDEPENDENT_RESEARCH_LAYER
  era_maps: PRODUCE_ONE_BY_ONE
  topic_selection: ELEVATES_RELATED_FEATURES
  route_rendering: CERTAINTY_AWARE
  scene_positioning: AUTO_FIT_WITH_UI_PADDING
  right_panel: BIBLE_NAVIGATION_PANEL
  timeline_sync: REQUIRED
  scripture_sync: REQUIRED
  first_era_fixture: PATRIARCHAL
  first_topic_fixture: ABRAHAM_GERAR_SOJOURN
```

## 21. 다음 단일 작업

NEXT_TASK_ONE:
  DESIGN_PATRIARCHAL_GERAR_BIBLE_NAVIGATION_E2E_FIXTURE

목표:
- 새 시스템을 만드는 것이 아니라
- 기존 지도/본문/연표/Research Panel/Navigation Panel을
- 하나의 실제 사건 fixture로 연결하여
- 위 제작 문법의 첫 E2E를 검증한다.
