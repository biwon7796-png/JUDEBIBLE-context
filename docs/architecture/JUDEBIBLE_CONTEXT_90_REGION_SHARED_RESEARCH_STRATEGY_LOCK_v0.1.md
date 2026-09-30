# JUDEBIBLE_CONTEXT_90_REGION_SHARED_RESEARCH_STRATEGY_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_90_REGION_SHARED_RESEARCH_STRATEGY_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target:
  - JudeBible Context
  - 말씀의숲 성경아틀라스
purpose: >
  채팅 세션이 종료되어도 JudeBible Context 콘텐츠 축적 전략과
  성경아틀라스 90개 Region 우선 연구 방향을 지속적으로 복구할 수 있도록
  핵심 결정을 단일 고정 문서로 보존한다.
```

## 1. 최상위 결정

성경아틀라스 시리즈에서 이미 정의된 90개 Region을
JudeBible Context와 성경아틀라스가 함께 사용하는
공용 연결형 연구자산의 우선 연구 축으로 삼는다.

목표는 "JudeBible Context용 별도 콘텐츠 100개"와
"성경아틀라스용 별도 연구 90개"를 따로 만드는 것이 아니다.

하나의 Region 연구자산을 깊고 구조적으로 만든 뒤
여러 제품이 동일한 연구자산을 재사용한다.

## 2. 대표 연구 소유권

```yaml
primary_research_owner:
  project: 01_목회연구_WORBS_BICS
  role: >
    범용·재사용 가능한 성경 본문 및 연결형 연구자산의 의미·근거·품질 책임

downstream_consumers:
  - 09_앱기획_도이치리베_내부도구
  - 말씀의숲 성경아틀라스 관련 제작 흐름
  - Pastor Lab
  - 기타 성경연구 소비 프로젝트

not_primary_owner:
  말씀의숲 본문 연구:
    reason: >
      주제호·기사 등 특정 발행 목적의 본문 연구가 중심이므로
      본 공용 90 Region 연구의 대표 소유 프로젝트로 두지 않는다.
```

## 3. 연구 단위

각 Region은 단순 설명문이 아니라 연결형 연구자산으로 생산한다.

```yaml
RegionResearchAsset:
  identity:
    - stable_id
    - canonical_name
    - aliases
    - region_type

  geography:
    - geographic_extent
    - boundary_status
    - terrain
    - coordinates_or_geometry_if_supported

  time:
    - historical_periods
    - period_specific_boundaries_if_supported

  connections:
    - related_places
    - related_people
    - related_events
    - related_routes
    - passage_links

  research:
    - claims
    - evidence
    - source_refs
    - source_locator
    - certainty
    - status
    - authority
    - VERIFY_HOLD

  media:
    - Wikimedia_media_refs
    - creator
    - license
    - attribution
    - depicts
    - media_identity_certainty
    - rights_status

  reader_layer:
    - identity
    - concise_summary
    - quick_facts
    - related_scripture
    - related_people
    - related_events
    - related_places
    - representative_media

  research_layer:
    - claims
    - evidence
    - sources
    - locators
    - certainty
    - competing_views
    - VERIFY_HOLD
```

## 4. 앱 연결 원칙

같은 연구 대상은 Map / Detail / Guide / Scripture에서
하나의 stable identity를 공유한다.

```text
Region / Place / Person / Event
          ↓
shared stable identity
          ↓
Projection
          ↓
Map / Detail / Guide / Scripture
```

앱 계층은 연구 의미를 새로 만들지 않는다.

누락된 identity, relation, coordinates, certainty, source locator를
앱이 추측해서 채우지 않는다.

## 5. 지도 레이어

### Base
- 일반 basemap

### Research Overlay
- Place
- Region
- Route
- Event
- Terrain / Physical Geography
- Historical / Political
- Archaeology / Site

### Interaction
- Selected Entity
- Guide Step
- Related Context

1차 핵심 레이어:
- Place
- Region
- Route
- Event

2차 확장 레이어:
- Archaeology
- Historical / Political
- Terrain / Physical Geography

## 6. Wikimedia 미디어 원칙

사진은 기본적으로 로컬에 대량 저장하지 않는다.

Wikimedia Commons를 우선 외부 미디어 참조원으로 사용하고
source page, preview reference, creator, license, attribution,
depicts, rights status를 metadata로 보존한다.

대표 사진/고고학 사진/지형 사진/역사 사진 등을 구분할 수 있다.

미디어의 대상 동일성이 불확실하면
그 불확실성을 연구 레이어에 보존한다.

## 7. Reader Layer 언어 품질

사용자 화면에는 연구 내부 언어가 그대로 노출되면 안 된다.

Reader Layer는:
- 자연스러운 한국어
- 짧고 명확한 문장
- 무엇인지 / 왜 중요한지 중심
- 과도한 학술 문체 회피
- 기계 번역 같은 표현 회피

일반 사용자 화면에 직접 노출하지 않는 내부 표현:
- VERIFY
- HOLD
- authority
- source_locator
- stable_id
- Registry
- projection
- internal status code
- 운영상 금지/경계 문구

불확실성은 자연어로 표현한다.

예:
- LIKELY → "대체로 이곳으로 보는 견해가 강합니다."
- DISPUTED → "정확한 위치에 대해서는 여러 견해가 있습니다."
- VERIFY → "현재 확인 가능한 자료만으로는 정확히 확정하기 어렵습니다."

내부 연구 레이어에서는 certainty / VERIFY_HOLD / source locator /
competing view를 그대로 보존한다.

## 8. 90 Region 롤아웃

```yaml
rollout:

  phase_1:
    count: 5_to_10
    purpose: >
      연구 형식, stable identity, 지도 연결,
      Reader Layer 품질, Wikimedia media,
      JudeBible projection을 실제 검증한다.

  phase_2:
    count: remaining_regions
    target_total: 90

  scaling_rule:
    >
      첫 배치에서 구조가 검증되기 전
      90개 전체를 일괄 생산하지 않는다.
```

## 9. 앱기획 보고 수용 게이트

앱기획 보고가 들어오면 다음 문서와 대조한다.

```yaml
compare_against:
  - JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1
  - JUDEBIBLE_CONTEXT_MINIMUM_RESEARCH_PROJECTION_CONTRACT_v0.1
  - JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK_v0.1
  - this_document
```

### 그대로 진행
- stable identity 보존
- source authority 보존
- VERIFY/HOLD 보존
- Map/Detail/Guide/Scripture identity 공유
- media rights 보존
- Reader Layer 자연어 품질 충족
- UI 회귀 없음

### 연구로 반환
- 연구 의미 부족
- entity identity 미확정
- 좌표 근거 부족
- relation을 추측해야 함
- media identity/rights 불충분
- source authority 부족
- Reader Layer가 지나치게 학술적이거나 내부 운영어를 노출함

### HOLD
- lineage 불명확
- 승인 경계 불명확
- 서로 충돌하는 source identity

## 10. 세션 재개 규칙

새 채팅 또는 다른 모델/도구에서 작업을 재개할 때
이 문서를 먼저 읽고 아래 결정을 복원한다.

```yaml
resume_decisions:
  - first_content_axis_is_Bible_Atlas_90_Regions
  - primary_research_owner_is_WORBS_BICS
  - research_is_shared_not_product_specific
  - Obsidian_is_not_required
  - stable_metadata_connectivity_is_required
  - Wikimedia_is_reference_based_not_bulk_download
  - map_layers_are_shared_research_projections
  - Reader_Layer_must_be_natural_and_non_internal
  - first_validate_5_to_10_then_scale_to_90
```

## 11. 다음 작업 규칙

운영관제에서 NEXT_TASK_ONE을 줄 때는 항상 함께 명시한다.

```yaml
required_execution_metadata:
  - owner
  - execution_environment
  - recommended_model
  - thinking_level
```

모델은 실행 도구일 뿐 권위 주체가 아니다.

## 12. 현재 상태

```yaml
current_state:
  JudeBible_UI:
    status: MOSTLY_STABILIZED

  projection_contract:
    status: DEFINED

  connected_research_contract:
    status: DEFINED

  reusable_projection_ready_region_assets:
    status: TO_BE_RESEARCHED

  content_strategy:
    status: LOCKED_TO_90_REGION_FIRST

  next_gate:
    >
      첫 5~10개 Region 연구 배치를 선정하고
      그중 첫 Region부터 연결형 연구자산으로 실제 생산한다.
```
