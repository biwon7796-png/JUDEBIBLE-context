# JUDEBIBLE_CONTEXT_NAVIGATION_AND_HIERARCHICAL_BIBLE_EXPLORATION_LOCK_v0.1

status: APPROVED_LOCK
scope: JudeBible Context / 오른쪽 Navigation Panel / 성경 전체 탐색 정보구조
date: 2026-09-30

---

## 1. 목적

JudeBible Context의 오른쪽 패널을 단순한 `안내` 패널이 아니라,
현재 본문·장소·인물·사건에서 다음 맥락으로 이동시키는
`네비게이션` 패널로 정의한다.

이 패널은 현재 본문과 직접 연결된 이야기나 주제가 있을 때에는
그 맥락을 우선 보여주고,
직접 연결된 항목이 없을 때에는 빈 상태를 표시하지 않고
더 넓은 성경 지리·역사·사건 탐색으로 전환한다.

핵심 원칙:

> 현재 맥락이 있으면 좁게 연결하고,
> 직접 연결된 맥락이 없으면 성경 전체 탐색으로 넓힌다.

---

## 2. 명칭 고정

기존:
- 안내
- Guide

변경:
- 네비게이션
- Navigation

역할 정의:

`Navigation = JudeBible Context의 맥락 이동 컨트롤러`

단순 도움말, 설명 패널, 빈 상태 안내문이 아니다.

---

## 3. 기본 동작 우선순위

Navigation 패널은 아래 우선순위로 내용을 결정한다.

1. 현재 선택 본문과 직접 연결된 이야기 / 주제
2. 현재 장소·인물과 연결된 사건 / 이동
3. 현재 지역과 연결된 주요 여정 / 사건
4. 직접 연결이 없으면 성경 전체 주요 지리·역사·사건 탐색

금지:
- "이 본문에는 안내할 이야기·주제가 없습니다."
- 연결 데이터 부재를 오류처럼 노출
- 빈 패널 유지

직접 연결된 콘텐츠가 없을 때는 자동으로 더 넓은 탐색 계층으로 확장한다.

---

## 4. 성경 전체 탐색 상위 분류

JudeBible의 지도·역사 탐색은 다음 상위 분류를 기본 구조로 사용한다.

- 기초 지리
- 자연환경
- 구약 역사
- 중간기
- 신약

이 구조는 특정 시각 디자인을 복제하기 위한 것이 아니라,
성경 전체를 탐색 가능한 계층으로 조직하기 위한 정보구조 원칙이다.

---

## 5. 시대별 하위 분류

특히 `구약 역사`는 시대 단위로 하위 분류한다.

예시:

- 족장 시대
- 출애굽과 광야
- 정복과 정착
- 사사 시대
- 통일왕국
- 분열왕국과 선지자
- 포로와 귀환

`중간기`, `신약`도 동일 원리로 시대·역사적 범주를 하위 계층으로 가질 수 있다.

정확한 전체 분류 목록은 후속 설계에서 확정하되,
다음 계층 원칙은 고정한다.

`성경 전체 분류 → 시대 → 이야기/주제 → 사건/여정 → 장면 → 본문/인물/장소`

---

## 6. 현재 맥락이 있을 때의 Navigation

현재 본문·장소·인물·사건에 직접 연결된 이야기나 여정이 존재하면,
Navigation은 해당 흐름을 우선 보여준다.

예:

```text
네비게이션

아브라함의 여정
창 12–22장

1. 하란에서 가나안
2. 세겜과 벧엘
3. 헤브론
4. 그랄과 브엘세바
5. 모리아
6. 브엘세바로 돌아옴
```

각 Step은 동일한 underlying entity / event / route / passage identity를 참조해야 한다.

---

## 7. 직접 연결이 없을 때의 Navigation

현재 본문에 직접 연결된 이야기나 주제가 없으면
Navigation은 성경 전체 탐색 모드로 전환한다.

예:

```text
네비게이션

성경 지도 탐색

기초 지리
자연환경
구약 역사
중간기
신약

구약 역사
  족장 시대
  출애굽과 광야
  정복과 정착
  사사 시대
  통일왕국
  분열왕국과 선지자
  포로와 귀환
```

그 하위에서는 실제 지도 이동·사건 단위로 내려간다.

예:

```text
출애굽과 광야

- 출애굽 전체 경로
- 라암셋에서 시내산
- 가데스 바네아와 정탐
- 광야 방황
- 요단 동편 이동
```

---

## 8. Navigation의 두 동작 상태

동일한 하나의 Navigation 패널 안에서 다음 두 상태를 사용한다.

### CONTEXT_NAVIGATION
현재 본문·인물·장소·사건과 직접 연결된
이야기·주제·여정이 있을 때 사용한다.

### EXPLORE_NAVIGATION
직접 연결이 없거나 사용자가 더 넓게 탐색하려 할 때 사용한다.

두 상태는 별도 패널이 아니다.
동일한 Navigation 패널의 탐색 깊이만 달라진다.

---

## 9. Knowledge Graph 연계 원칙

Navigation은 장기적으로 수동 메뉴가 아니라
구조화된 연구 메타데이터와 Knowledge Graph를 소비해야 한다.

기본 관계:

```text
Event
 ↕
Place
 ↕
Route
 ↕
Passage
 ↕
Person
```

연구자산에 아래 메타데이터가 명시되어 있으면
Navigation 후보를 자동 생성할 수 있어야 한다.

```yaml
domain: 구약 역사
period: 족장 시대
story: 아브라함의 여정
scene: 브엘세바와 아비멜렉의 맹세
passage_refs:
  - Gen 21:22-34
places:
  - JBC-CR-PLACE-BEERSHEBA-001
people:
  - JBC-CR-PERSON-ABRAHAM-001
events:
  - JBC-CR-EVENT-ABRAHAM_ABIMELECH_COVENANT-001
```

---

## 10. 자동화 방향

향후 구조:

```text
승인 연구자산
→ Obsidian 구조화 노트
→ Entity / Relation / Passage / Event / Route metadata
→ Validator
→ Knowledge Graph / Projection
→ Navigation
→ Map / Scripture / Detail / Timeline / Explorer
```

Navigation은 같은 그래프를 소비하는 여러 Surface 중 하나다.

따라서 Navigation만을 위한 별도 truth source나
별도 수동 Registry를 만들지 않는다.

---

## 11. Surface 동기화 원칙

Navigation에서 특정 이야기·사건·여정·장면을 선택하면
필요한 범위에서 다음 Surface가 함께 동기화될 수 있어야 한다.

- Map
- Scripture
- Detail
- Timeline
- Person / Place Explorer

단,
각 Surface는 동일 `stable_id`와 명시적 Relation을 사용해야 한다.

금지:
- 이름만 같은 entity 자동 병합
- 관계 없는 본문 자동 연결
- 추정 경로 생성
- 연구에 없는 사건 생성

---

## 12. HARAM 참조 경계

HARAM에서 학습하는 것은 다음이다.

- 상위 분류 체계
- 시대별 하위 분류
- 주제 / 이야기 / 장면 계층
- 지도와 경로가 Navigation과 함께 움직이는 interaction grammar
- 현재 맥락을 잃지 않는 탐색 방식

복제하지 않는 것:

- 시각 디자인
- 색상
- 카드 모양
- 컴포넌트 외형
- 레이아웃 자체

JudeBible은 HARAM의 시각 복제가 아니라
정보구조와 interaction grammar를 자체 시스템에 맞게 재구성한다.

---

## 13. 고정 원칙 요약

```yaml
NAVIGATION_LOCK:

  panel_name:
    ko: 네비게이션
    en: Navigation

  role:
    CONTEXTUAL_BIBLE_NAVIGATION_HUB

  hierarchy:
    - 성경_전체_분류
    - 시대
    - 이야기_주제
    - 사건_여정
    - 장면
    - 본문_인물_장소

  top_categories:
    - 기초_지리
    - 자연환경
    - 구약_역사
    - 중간기
    - 신약

  empty_state:
    prohibited: true

  fallback:
    no_direct_context:
      action: EXPAND_TO_BROADER_BIBLE_EXPLORATION

  graph_driven:
    required: true

  same_identity_across_surfaces:
    required: true

  manual_duplicate_navigation_data:
    prohibited: true

  visual_reference_copy:
    prohibited: true
```

---

## 14. 상태

이 문서는 JudeBible Context의
Navigation Panel 역할과
성경 전체 계층형 탐색 구조에 대한
현재 고정 기준이다.

후속 구현은 이 문서를 보존하면서
Obsidian → Knowledge Graph → JudeBible 자동 투영 구조와 연결한다.
