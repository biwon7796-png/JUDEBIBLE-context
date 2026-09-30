# JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target: JudeBible Context
purpose: >
  JudeBible Context에 투입할 신규 연구자산의 형식,
  연구자산 간 연결 원리,
  Wikimedia 기반 미디어 연결,
  지도 레이어 구조,
  앱기획 결과 보고 수용/반려 기준을 고정한다.
```

## 1. 운영 원칙

기존 승인 연구자산이 있으면 우선 재사용한다.

기존 자산이 없거나 현재 Projection Contract를 충족하지 못하면,
새 연구를 수행할 수 있다.

신규 연구는 일반 보고서가 아니라
JudeBible Context가 바로 소비할 수 있는 연결형 연구자산으로 생산한다.

앱기획 프로젝트에서 결과 보고가 들어오면 운영관제는
본 문서와 기존 UI/Projection Contract에 대조한다.

- 합당하면 다음 단계로 흘려보낸다.
- 충돌하거나 필수 연구자산이 없으면 신규 연구로 라우팅한다.
- 앱기획이 부족한 연구 의미를 임의 생성하게 하지 않는다.

## 2. 핵심 연구 단위

신규 연구는 다음 객체를 중심으로 축적한다.

```yaml
core_objects:
  - Place
  - Person
  - Event
  - Relation
  - Claim
  - Evidence
  - PassageLink
  - MediaAsset

view_projection_objects:
  - GuideTopic
  - GuideStep
```

GuideTopic / GuideStep은 연구 원본의 truth object가 아니라
앱에서 연구자산을 순서화해 보여주는 view projection이다.

## 3. 공통 메타데이터

모든 연구객체는 가능한 범위에서 다음 메타데이터를 가진다.

```yaml
ResearchObjectBase:
  stable_id: required
  display_label: required
  aliases: []
  passage_refs: []
  source_refs: required
  source_locator: null_allowed
  certainty: null_allowed
  status: required
  authority: required
  VERIFY_HOLD:
    verify: false
    hold: false
    reason: null
```

원칙:

- 같은 entity는 Map / Detail / Guide / Scripture에서 같은 stable_id를 사용한다.
- 이름이 같다는 이유만으로 자동 merge하지 않는다.
- 누락된 값은 추론해 채우지 않는다.
- projection이 source보다 강한 상태를 만들 수 없다.
- VERIFY/HOLD를 보존한다.

## 4. 연구 방식

본문 중심으로 연구를 수행하면서 연결 객체를 함께 생성한다.

```text
본문 선택
  ↓
본문 문맥 연구
  ↓
Person / Place / Event 추출
  ↓
Relation 생성
  ↓
Claim 분리
  ↓
Claim별 Evidence + Source Locator
  ↓
PassageLink 생성
  ↓
Media 후보 연결
  ↓
Certainty / Status / VERIFY-HOLD
  ↓
승인 연구자산
  ↓
JudeBible Projection
```

Reader Layer와 Research Layer를 함께 만든다.

### Reader Layer
- 정체성
- 짧은 핵심 설명
- 관련 본문
- 관련 인물
- 관련 사건
- 관련 장소
- 대표 시각자료

### Research Layer
- Claim
- Evidence
- source
- source_locator
- certainty
- competing view
- VERIFY/HOLD

## 5. Obsidian 위치

Obsidian 통과는 필수가 아니다.

```yaml
Obsidian:
  required: false
  role:
    - human_research_workspace
    - review
    - navigation
```

연구자산의 연결성은 Obsidian이 아니라
공통 metadata와 stable identity 계약으로 보장한다.

연구자산은 Obsidian, Hezekiah, JudeBible Context,
Pastor Lab, Atlas 등 여러 소비처에서 재사용될 수 있다.

## 6. MediaAsset / Wikimedia Commons 연결

사진은 기본적으로 로컬 대량 다운로드를 요구하지 않는다.

Wikimedia Commons 등의 외부 미디어를
metadata reference로 연결할 수 있다.

```yaml
MediaAsset:
  stable_id: required
  media_type:
    - photo
    - archaeological_image
    - map_crop
    - illustration
  target_refs: required
  provider: Wikimedia_Commons
  source_url: required_if_used
  preview_url: optional
  attribution:
    creator: required_when_available
    license: required_when_available
    credit_line: required_when_available
    source_page: required
  media_rights:
    status: CLEARED | VERIFY | HOLD
    usage_scope: app_display
  certainty: CERTAIN | LIKELY | PLAUSIBLE | VERIFY
```

원칙:

- 사진은 target_refs로 Place/Person/Event에 연결한다.
- 예: 브엘세바 사진은 PLACE-BEERSHEBA를 참조한다.
- Wikimedia source page를 보존한다.
- creator / license / attribution을 보존한다.
- 권리가 불명확하면 media payload를 확정 표시하지 않는다.
- 현대 도시, 고고학 유적, 성경 지명 추정지를 구분한다.
- 대표 사진과 관련 사진을 구분할 수 있다.

## 7. 지도 연결 원칙

지도는 별도 truth data를 만들지 않는다.

Place 연구자산의 stable_id와 좌표/위치 상태를 지도에 투영한다.

```yaml
PlaceMapFields:
  stable_id: required
  coordinates:
    lat: optional
    lon: optional
  coordinate_status:
    status: VERIFIED | VERIFY | HOLD | UNKNOWN
    source_ref: optional
    source_locator: optional
  location_type:
    - ancient_city
    - modern_city
    - archaeological_site
    - mountain
    - river
    - region
    - route_node
```

원칙:

- 좌표가 없으면 Detail은 허용하지만 marker는 만들지 않는다.
- VERIFY/HOLD 좌표는 확정 위치처럼 렌더링하지 않는다.
- 지도 클릭, Detail, Guide, Scripture는 같은 stable_id를 공유한다.

## 8. 지도 레이어 구조

### Base Layer
- 일반 basemap
- 도로/지형/하천/현대지명 등 배경

### Research Overlay Layers
1. Place
2. Region
3. Route
4. Event
5. Terrain / Physical Geography
6. Historical / Political
7. Archaeology / Site

### Interaction Layers
8. Selected Entity
9. Guide Step
10. Related Context

레이어 우선순위:

```text
TOP
Selected Entity Highlight
Guide Step Highlight
Related Context

Archaeology
Events
Routes
Places
Regions
Historical Boundaries
Terrain / Physical Geography

Base Map
BOTTOM
```

초기 사용자 컨트롤은 단순하게 유지한다.

```text
장소
경로
지역
사건
고고학
시대 경계
지형
```

Selected Entity / Guide Step은 시스템 상태 레이어로 자동 제어한다.

1차 핵심 레이어:
- Place
- Route
- Region
- Event

2차 확장 레이어:
- Archaeology
- Historical / Political
- Terrain / Physical Geography

## 9. 연결 예시

```text
PLACE-BEERSHEBA
  ├─ Scripture PassageLink
  ├─ Map marker
  ├─ Route endpoint
  ├─ Event location
  ├─ Guide target
  ├─ Detail entity
  ├─ Related Person / Event / Place
  └─ Wikimedia MediaAsset
```

이 구조에서 브엘세바를 한 번 연구하면
본문, 지도, 인물, 사건, 관련본문, 사진, Guide가 같은 identity로 연결된다.

## 10. 앱기획 결과 보고 처리 규칙

앱기획 결과가 들어오면 다음 순서로 대조한다.

```yaml
APP_PLANNING_REPORT_GATE:
  compare_against:
    - current_UI_lock
    - minimum_research_projection_contract
    - this_connected_research_lock
    - current_QA_lineage

  PASS_when:
    - stable_id_identity_preserved
    - source_authority_preserved
    - VERIFY_HOLD_preserved
    - map_detail_guide_scripture_share_identity
    - media_rights_preserved
    - no_invented_research_meaning
    - no_UI_regression

  RETURN_TO_RESEARCH_when:
    - required research meaning missing
    - entity identity unresolved
    - coordinates unsupported
    - relation requires invention
    - media identity/rights unsupported
    - source authority insufficient

  HOLD_when:
    - approval boundary unclear
    - lineage unclear
    - conflicting source identities
```

앱기획이 연구 내용을 만들어서 결손을 메우는 것은 금지한다.
연구가 부족하면 rightful research project에서 새 연구를 수행한다.

## 11. 현재 다음 경계

현재 앱 인터페이스/interaction은 거의 정돈된 상태다.

다음 핵심 단계는:
1. 앱기획에서 현재 결과 보고 수신
2. 본 문서/Projection Contract와 대조
3. 합당하면 그대로 다음 구현/검증으로 진행
4. 불충분하면 신규 연구 단위를 정의하여 연구 프로젝트로 라우팅

## 12. 금지

```yaml
PROHIBITED:
  - auto_truth_promotion
  - same_name_auto_merge
  - invented_coordinates
  - invented_source_locator
  - invented_relation
  - invented_media_rights
  - app_layer_theological_research
  - app_layer_historical_research
  - UI_driven_truth_creation
  - bulk_fixture_replacement_without_validation
```
