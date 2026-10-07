# JUDEBIBLE_ERA_MAP_PRODUCTION_METHOD_v0.1

status: OPERATING_METHOD_LOCKED
date: 2026-10-06
scope: JudeBible geography map production
authority_effect: NONE
registry_effect: NONE
runtime_effect: NONE

## 1. 핵심 결정

JudeBible 지리 지도는 장소 90개를 한 번에 지도화하는 방식이 아니라,
**시대별 지도 1장을 고품질로 완성하고 이를 순차적으로 확장하는 방식**으로 제작한다.

앱에서는 시대마다 다른 지도 이미지를 교체하는 것이 아니라,
**하나의 공통 basemap 위에서 시대별 overlay만 교체**한다.

사용자 경험:
- 같은 지형과 공간 감각은 유지
- 시대 버튼을 누르면 그 시대의 지명, 영역, 경로, 사건 표시만 변경
- 시대가 바뀌어도 사용자가 위치 감각을 잃지 않음

## 2. 기본 구조

COMMON BASEMAP
- terrain
- sea / river
- mountain / desert
- physical geography
- optional modern reference

ERA OVERLAY
- visible places
- region boundaries
- routes
- events
- period labels
- label priority
- default view / zoom / center
- uncertainty-aware display

즉, 지도 엔진은 공통이고 시대별 편집판은 overlay asset으로 관리한다.

## 3. 제작 원칙

1. **시대별로 한 장씩 완성**
   - 대량 자동 생성보다 품질 우선
   - 시대별 문맥을 보면서 지명, 경로, 라벨을 직접 검수
   - 첫 1~2개 시대에서 표현 규칙을 충분히 검증한 뒤 확장

2. **공통 basemap 유지**
   - 시대가 바뀌어도 지형, 강, 바다, 산맥 등 기본 공간 맥락 유지
   - 화면 전체를 새로운 이미지로 교체하지 않음

3. **overlay만 변경**
   - 시대별 핵심 지명
   - 시대별 경로
   - 시대별 정치/지역 영역
   - 시대별 사건 포인트
   - 시대별 라벨 우선순위

4. **External Fact와 Research Meaning 분리**
   - 좌표, geometry, source-local id, object type 등은 검증된 외부 fact layer에서 가져옴
   - 시대적 의미, 사건 연결, 경로 해석, 중요도는 Project01 전문 연구 및 승인 자산을 사용
   - 지도 UI가 연구 의미를 새로 만들지 않음

5. **정확도 우선**
   - 지명 표기 위치가 부정확하면 자동 배치보다 수동 조정 허용
   - 동일 지명/다중 후보/시대별 범위 차이는 certainty와 HOLD를 보존
   - representative point를 실제 역사적 중심점으로 오인하지 않음

6. **경로는 별도 연구자산**
   - 경로선은 단순한 장식이 아니라 연구 근거를 가진 overlay
   - exact route가 불확실하면 inferred/display-only와 research geometry를 구분
   - 불확실한 경로는 시각적으로도 확정 경로와 구분 가능해야 함

## 4. 시대 버튼 동작

예시 시대:
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
- 예수 그리스도
- 초대교회

버튼 선택 시:
- basemap 유지
- visible place set 교체
- route set 교체
- region overlay 교체
- event marker 교체
- label priority 교체
- 기본 zoom/center는 필요 시 시대별 값 적용

## 5. 시대 Overlay 최소 계약

ERA_MAP_OVERLAY:
  era_id: REQUIRED
  title: REQUIRED
  period_label: REQUIRED
  visible_places: []
  visible_regions: []
  routes: []
  events: []
  label_priority:
    primary: []
    secondary: []
    tertiary: []
  default_view:
    center: OPTIONAL
    zoom: OPTIONAL
  source_refs: []
  certainty_notes: []
  approval_status: REQUIRED

새 stable identity를 overlay가 발급하지 않는다.
모든 Place / Region / Route / Event identity는 기존 canonical research asset을 재사용한다.

## 6. 첫 fixture

첫 시대 지도 fixture는 **족장 시대**로 한다.

이유:
- Abraham, Isaac, Beersheba, Gerar 등 기존 연구자산이 상대적으로 풍부함
- 이동 경로와 장소 연결이 지도 UX 검증에 적합함
- 기존 External Geography Source Notes와 결합 가능
- 시대별 overlay 방식의 장점을 가장 분명히 보여줄 수 있음

첫 fixture에서 검증할 것:
- 지명 정확도
- 라벨 충돌
- 지도 밀도
- 경로 가독성
- 시대 버튼 전환
- 공통 basemap 유지
- uncertain route / place 표현
- Reader Layer 문장 품질
- research/source provenance 보존

## 7. 생산 방식

Map Production Track:
External verified geography
→ approved place/region/route research
→ era overlay selection
→ manual visual QA
→ staging map
→ regression QA
→ approved projection

원칙:
- 자동화는 자료 연결과 재사용에 사용
- 시각적 배치와 시대별 편집은 사람 검수 중심
- 한 번 검증한 장소/경로 자산은 다음 시대 지도에서 재사용
- 같은 좌표/지형 데이터를 다시 연구하지 않음

## 8. 하지 않는 것

- Level A 90개를 한 번에 자동 지도화하지 않음
- 시대마다 별도 raster 지도 이미지를 새로 만들어 교체하지 않음
- 이름 유사성만으로 장소를 자동 결속하지 않음
- 외부 좌표를 canonical research coordinate로 자동 승격하지 않음
- 불확실한 경로를 실선 확정 경로처럼 표시하지 않음
- 지도 UI가 시대적/신학적 의미를 추론하지 않음

## 9. 성공 기준

JudeBible 시대 지도 제작 방식은 다음 상태를 성공으로 본다.

- 같은 basemap에서 시대 전환이 자연스럽게 동작
- 시대별 지명과 경로가 정확하고 과밀하지 않음
- 사용자가 시대가 바뀌어도 공간 감각을 유지
- 연구된 장소/경로가 반복 재사용됨
- 외부 fact와 전문 연구 의미가 분리됨
- VERIFY/HOLD가 지도 표현에서도 손실되지 않음
- 한 시대 지도 완성 후 다음 시대로 같은 방식 확장 가능

## 10. 운영 경계

이 문서는 JudeBible 지리 지도 제작방식을 고정하는 운영 문서이다.
새 Runtime, Registry, Gate를 생성하지 않는다.
전문 지리/본문 의미는 Project01 승인 자산을 따른다.
앱 구현은 기존 지도 엔진과 projection 구조를 재사용한다.

NEXT_TASK_ONE:
  DESIGN_PATRIARCHAL_ERA_MAP_OVERLAY_AS_FIRST_JUDEBIBLE_ERA_MAP_FIXTURE
