# JUDEBIBLE_CONTEXT_HARAM_INTERACTION_GRAMMAR_AND_READER_LANGUAGE_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_HARAM_INTERACTION_GRAMMAR_AND_READER_LANGUAGE_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target:
  - JudeBible Context
  - JudeBible connected research assets
  - Bible Atlas 90 Region shared research program
purpose: >
  HARAM 성경지리에서 확인한 유용한 interaction grammar와
  독자 친화적 정보 표현 원리를 JudeBible Context에 적용하기 위해
  현재 합의된 원칙을 세션 독립적인 고정 문서로 보존한다.

important:
  - HARAM의 시각 디자인, 색상, 컴포넌트를 복제하지 않는다.
  - 학습 대상은 정보 구조, 탐색 흐름, 쉬운 사용자 언어, 연결 방식이다.
```

## 1. 최상위 원칙

JudeBible Context는 내부 연구 상태를 사용자에게 그대로 노출하지 않는다.

내부에서는 정밀하게 관리하고, 사용자에게는 쉽게 설명한다.

```yaml
principle:
  internal: precise_and_structured
  user_facing: simple_natural_korean
```

예:

```yaml
internal:
  certainty: VERIFY
  coordinate_status: NOT_CONFIRMED

user_facing:
  label: 추정지
```

내부의 `VERIFY`, `HOLD`, `authority`, `source_locator`, `stable_id`,
`Registry`, `projection`, 기타 운영 상태 코드는 일반 사용자 화면에
그대로 노출하지 않는다.

## 2. 위치 불확실성의 사용자 표현

장소의 연구 상태는 내부 구조를 유지하되,
화면에서는 쉬운 한국어로 번역한다.

```yaml
PLACE_STATUS_DISPLAY:

  VERIFIED:
    user_label: 확인된 위치

  LIKELY:
    user_label: 유력한 위치

  PLAUSIBLE:
    user_label: 가능성 있는 위치

  VERIFY:
    user_label: 추정지

  DISPUTED:
    user_label: 여러 후보지

  UNKNOWN:
    user_label: 위치 미상

  HOLD:
    user_label: null
    note: 내부 운영 상태로만 유지
```

필요할 때 짧은 자연어 설명을 덧붙인다.

예:
- "정확한 위치는 확정되지 않았으며, 이 일대가 유력한 후보로 여겨집니다."
- "정확한 위치에 대해서는 여러 견해가 있습니다."
- "성경에 등장하지만 현재 정확한 위치는 알려져 있지 않습니다."

## 3. 장소 Detail의 독자 흐름

장소 하나를 열었을 때 사용자가 여러 페이지를 이동하지 않고
한 흐름 안에서 충분한 맥락을 이해할 수 있게 한다.

권장 흐름:

```yaml
PLACE_READER_FLOW:

  1_identity:
    - 이름
    - 영문명
    - 다른_이름
    - 현재_위치
    - 좌표
    - 거리
    - 이름의_뜻
    - 관련_인물

  2_photos:
    - 대표사진
    - 고고학사진
    - 지형사진

  3_reader_explanation:
    - 성경에서의_의미
    - 지리적_역할
    - 주요_사건
    - 역사적_흐름

  4_related_passages:
    - 핵심본문
    - 바로_열기

  5_location_view:
    user_label: 위치 가설
    status_language:
      - 확인된 위치
      - 유력한 위치
      - 추정지
      - 여러 후보지
      - 위치 미상

  6_ministry_points:
    user_label: 묵상·강의 포인트
    target_count: 2

  7_notes:
    - 내_메모

  8_related_scenes:
    - 관련_장면
    - 관련_사건
    - 관련_이동
    - 관련_인물

  9_sources:
    - 사진_출처
    - 연구_상세
```

`연구 상세`는 필요할 때 펼쳐보는 심화 영역으로 둔다.

## 4. 묵상·강의 포인트

장소/지역 연구는 단순 백과사전 정보에 그치지 않고
성경 읽기와 목회적 활용으로 이어질 수 있어야 한다.

```yaml
MINISTRY_POINT_RULE:

  target_count:
    default: 2

  style:
    - 짧게
    - 자연스러운_한국어
    - 본문과_직접_연결
    - 연구근거에서_도출
    - 설교문으로_확장하지_않음
    - 억지_적용_금지

  purpose:
    - 성경읽기_연결
    - 묵상_단서
    - 강의_단서
    - 설교준비_실마리
```

사용자 화면에는 내부 추론 절차나 연구 상태를 설명하지 않는다.

## 5. 지명 사전 / Place Explorer

본문에서 장소를 클릭하는 흐름 외에
전체 장소 연구자산을 독립적으로 탐색할 수 있어야 한다.

```yaml
PLACE_EXPLORER:

  capabilities:
    - 지명검색
    - 구절검색
    - 전체지명탐색
    - 카드보기
    - 목록보기

  filters:
    testament:
      - 전체
      - 구약
      - 신약

    place_type:
      - 성읍·도시
      - 지역
      - 산
      - 물
      - 광야
      - 길·경로
      - 기타

    availability:
      - 사진_있음

    location_state:
      - 확인된_위치
      - 유력한_위치
      - 추정지
      - 여러_후보지
      - 위치_미상

  card_summary:
    - 대표사진
    - 이름
    - 영문명
    - 유형
    - 짧은설명
    - 관련본문
    - 사진수
    - 위치가설수
    - 묵상포인트_유무

  on_select:
    - 동일_identity로_Detail_열기
    - 지도에서_보기
    - 관련본문으로_이동
```

현재 JudeBible Rail의 1차 관점
`본문연구 / 지도 / 연표`를 자동 변경하지 않는다.

지명 사전은 검색/탐색 workspace 또는 별도 explorer로 설계 검토한다.

## 6. 인물 탐색 / Person Explorer

인물 역시 개별 상세만 제공하지 않고
전체 인물군을 탐색할 수 있는 구조를 허용한다.

```yaml
PERSON_EXPLORER:

  browse:
    group_by:
      - 시대
      - 역할
      - 성경책
      - 주요_사건

  person_item:
    may_show:
      - 이름
      - 연결_장소_수
      - 연결_사건_수

  detail:
    show:
      - 시대
      - 이름
      - 짧은_소개
      - 핵심본문
      - 관련_장소
      - 관련_사건
      - 관련_인물

  related_place_actions:
    - 지명_사전에서_보기
    - 지도에서_보기
```

핵심은 Person / Place / Event / Passage를
각각 고립된 설명문이 아니라 연결된 연구 그래프로 취급하는 것이다.

## 7. 연결 탐색 원칙

```text
본문
 ↓
인물 / 장소 / 사건 선택
 ↓
Detail
 ↙    ↓     ↘
지도  관련본문  관련인물·사건·장소
 ↓
다른 entity로 자연스럽게 이동
```

모든 화면은 같은 stable identity를 사용한다.

```yaml
shared_identity_surfaces:
  - Scripture
  - Detail
  - Map
  - Guide
  - Place Explorer
  - Person Explorer
```

사용자는 `entity_ref`, `relation_endpoint` 같은 내부 용어를 보지 않는다.

화면에서는:
- 관련 장소
- 관련 인물
- 관련 사건
- 지도에서 보기
- 본문에서 보기

같은 쉬운 표현을 사용한다.

## 8. Reader Layer 언어 품질

```yaml
READER_LANGUAGE:

  required:
    - 자연스러운_한국어
    - 짧고_명확한_문장
    - 독자_중심
    - 무엇인지_왜_중요한지_중심

  avoid:
    - 과도한_학술문체
    - 기계번역형_문장
    - 내부_운영설명
    - 반복적_주의문
    - 상태코드_직접노출
    - 쓸데없는_경계_금지_문구

  internal_terms_not_for_normal_UI:
    - VERIFY
    - HOLD
    - authority
    - source_locator
    - stable_id
    - Registry
    - projection
    - internal_status_codes
```

연구의 깊이는 줄이지 않는다.
대신 깊은 연구 결과를 독자용 언어로 변환한다.

## 9. 연구자산 저장

90개 Region 및 연결 Place/Person/Event 연구는
채팅에만 남기지 않고 Markdown 파일로 저장한다.

```yaml
RESEARCH_PERSISTENCE:

  primary_format:
    extension: .md

  structure:
    - YAML_frontmatter
    - Reader_Layer
    - Research_Layer
    - Relations
    - Sources
    - Media_refs
    - Map_fields

  reusable_by:
    - Obsidian
    - JudeBible Context
    - 말씀의숲 성경아틀라스
    - Hezekiah
    - future_research_tools
```

Obsidian은 필수 gateway가 아니라
후속 탐색/연결/정리용 workspace로 사용할 수 있다.

## 10. 90 Region 공용 연구 전략과의 결속

이 문서는 다음 전략을 보완한다.

```yaml
linked_lock:
  JUDEBIBLE_CONTEXT_90_REGION_SHARED_RESEARCH_STRATEGY_LOCK_v0.1
```

90개 Region 연구부터 아래 사항을 기본 적용한다.

```yaml
apply_to_all_90_regions:
  - Reader_Layer_쉬운_우리말
  - 위치불확실성_쉬운_표현
  - 묵상강의포인트_최대2개_우선
  - 관련_Place_Person_Event_Passage_연결
  - 지도_연결
  - Wikimedia_media_metadata
  - Markdown_파일_저장
```

Region 연구에서 파생되는 Place 연구에도 동일한 표현 원칙을 적용한다.

## 11. 앱기획 적용 규칙

09_앱기획_도이치리베_내부도구에서
JudeBible Context UX를 검토/구현할 때
다음 항목을 확인한다.

```yaml
APP_PLANNING_CHECK:

  reader_language:
    - 내부코드가_사용자에게_보이지_않는가
    - 쉬운_한국어로_상태가_표현되는가

  place_detail:
    - 긴_연속형_정보흐름을_지원하는가
    - 사진_설명_본문_위치가설_묵상_연결장면이_자연스럽게_이어지는가

  exploration:
    - 전체_지명_탐색이_가능한가
    - 카드_목록_전환이_가능한가
    - 인물_전체탐색_구조를_수용할_수_있는가

  graph_navigation:
    - 인물_장소_사건_본문_지도_사이_왕복이_가능한가
    - 같은_identity가_유지되는가

  ministry_value:
    - 묵상강의포인트가_연구근거에서_짧게_제공되는가
```

이 문서는 앱 자체를 수정하라는 구현 명령이 아니다.
제품·연구 설계에 적용할 고정 기준이다.

## 12. 기존 고정 문서와의 관계

이 문서는 아래 문서를 대체하지 않고 보완한다.

```yaml
related_documents:
  - JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1
  - JUDEBIBLE_CONTEXT_MINIMUM_RESEARCH_PROJECTION_CONTRACT_v0.1
  - JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_90_REGION_SHARED_RESEARCH_STRATEGY_LOCK_v0.1
```

충돌 시:
- 연구 권위/identity/status는 기존 projection/research lock을 따른다.
- 사용자 표현/탐색 interaction grammar는 본 문서를 따른다.
- 앱 구조 자체의 변경은 별도 앱기획 검토 후 적용한다.

## 13. 현재 고정 결정

```yaml
LOCKED_DECISIONS:

  - HARAM의_시각디자인은_복제하지_않음
  - interaction_grammar와_information_architecture는_학습
  - 내부연구어와_사용자언어를_분리
  - VERIFY를_그대로_보이지_않고_추정지_등으로_표현
  - 장소_Detail은_연속형_독자흐름을_지원
  - 묵상강의포인트를_연구기반으로_1~2개_제공
  - 전체_지명_사전_탐색을_지원
  - 전체_인물_탐색_구조를_지원
  - Person_Place_Event_Passage_Map의_왕복연결을_지향
  - 90개_Region_연구에_동일_원칙을_적용
  - 모든_연구결과는_MD로_저장
```
