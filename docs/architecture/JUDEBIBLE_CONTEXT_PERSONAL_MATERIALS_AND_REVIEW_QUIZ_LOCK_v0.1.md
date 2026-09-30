# JUDEBIBLE_CONTEXT_PERSONAL_MATERIALS_AND_REVIEW_QUIZ_LOCK_v0.1

```yaml
document_id: JUDEBIBLE_CONTEXT_PERSONAL_MATERIALS_AND_REVIEW_QUIZ_LOCK
version: v0.1
status: CONTROL_LOCK
project: 00_운영관제실_Jude_Lee_OS
target:
  - JudeBible Context
  - Personal Materials
  - Review Quiz

purpose: >
  HARAM 성경지리의 자료 관리와 복습 퀴즈에서 확인한
  개인 자료층, 백업/복원, 지도 기반 복습 상호작용을
  JudeBible Context에 적용하기 위해 세션 독립적으로 고정한다.

important:
  - HARAM의 시각 디자인과 컴포넌트를 복제하지 않는다.
  - 학습 대상은 개인 자료 분리, 백업/복원, 지도 기반 학습 흐름이다.
```

## 1. 핵심 원칙

JudeBible Context는 공용 연구자산과 개인 자료를 분리한다.

```yaml
DATA_SEPARATION:

  shared_research:
    examples:
      - Place
      - Region
      - Person
      - Event
      - Route
      - PassageLink
      - MediaAsset
    role: 공용 연구자산

  personal_materials:
    examples:
      - 내_사진
      - 내_메모
      - 개인_강의포인트
      - 개인_자료첨부
    role: 사용자 개인 자료
```

개인 자료는 공용 연구 authority나 canonical research identity를 변경하지 않는다.

---

## 2. 개인 자료 관리

사용자는 장소·인물·사건·본문 맥락에
자신의 자료를 붙일 수 있어야 한다.

```yaml
PERSONAL_MATERIALS:

  supported:
    - 내_사진
    - 내_메모
    - 개인_강의포인트
    - 개인_자료첨부

  attach_to:
    - Place
    - Region
    - Person
    - Event
    - Passage

  visibility:
    default: PRIVATE
```

개인 자료는 해당 entity의 stable identity에 연결하되,
공용 연구 데이터와 별도 저장층을 유지한다.

---

## 3. 사진 업로드

```yaml
PERSONAL_PHOTO:

  capabilities:
    - 사진_한장_올리기
    - 여러장_선택_업로드
    - 관련_entity에_연결

  metadata:
    may_include:
      - filename
      - linked_entity
      - user_caption
      - created_at

  rule: >
    개인 사진은 공용 Wikimedia MediaAsset이나
    연구용 대표 미디어와 혼합하지 않는다.
```

---

## 4. 오프라인 자료 준비

필요한 경우 사용자가
지명·사진·관련 자료를 미리 내려받아
인터넷 연결이 불안정한 환경에서도 사용할 수 있는 방향을 허용한다.

```yaml
OFFLINE_SUPPORT:

  candidate:
    - selected_place_metadata
    - selected_region_metadata
    - approved_public_media_preview
    - personal_notes

  principle:
    - 필요한_범위만_저장
    - 전체_대량다운로드를_기본값으로_하지_않음
    - rights_and_attribution_preserved
```

구체적인 오프라인 저장 구조는 별도 앱기획에서 결정한다.

---

## 5. 백업과 복원

개인 자료는 사용자 소유 데이터로 취급하고,
한 파일 또는 패키지로 백업·복원할 수 있어야 한다.

```yaml
BACKUP_RESTORE:

  export:
    - 개인사진
    - 개인메모
    - 개인자료연결정보

  import:
    - 기존_백업_불러오기

  requirements:
    - 기존_연구자산을_덮어쓰지_않음
    - personal_and_shared_data_separation_preserved
    - entity_linkage_preserved_when_possible
```

---

## 6. 복습 퀴즈의 역할

복습 퀴즈는 별도 지식 체계를 만들지 않는다.

이미 승인된 연구자산을
학습과 기억 강화 방식으로 다시 사용한다.

```yaml
QUIZ_ROLE:

  source:
    - existing_approved_research_assets

  reuse:
    - Place
    - Region
    - Event
    - PassageLink
    - Person_when_supported

  prohibited_conceptually:
    - quiz_only_truth_creation
    - unsupported_answer_generation
```

---

## 7. 지도에서 찾기 퀴즈

핵심 복습 방식 중 하나는
사용자가 지도를 직접 보며 지명을 찾는 것이다.

```yaml
MAP_FIND_QUIZ:

  flow:
    1:
      prompt: 지명을_찾아보세요

    2:
      user_action:
        - 지도에서_장소선택

    3_correct:
      - 정답_확인
      - 짧은_설명
      - 다음문제

    3_wrong:
      - 오답_표시
      - 다시_시도
      - 정답_위치_보기

  answer_source:
    - stable_place_identity
    - approved_map_location
```

위치가 추정지인 경우
퀴즈도 확정 위치처럼 다루지 않는다.

사용자에게는:
- 추정지
- 유력한 위치
- 여러 후보지

같은 쉬운 표현을 사용한다.

---

## 8. 설명 보고 맞히기

지도형 문제 외에도
짧은 설명을 읽고 지명이나 대상을 맞히는 방식을 허용한다.

```yaml
DESCRIPTION_QUIZ:

  prompt_sources:
    - reader_summary
    - quick_facts
    - related_passages
    - related_events

  answer_types:
    - Place
    - Region
    - Person
    - Event
```

학술 용어나 내부 메타데이터를 문제 문장에 노출하지 않는다.

---

## 9. 퀴즈 범위

```yaml
QUIZ_SCOPE:

  selectable:
    - 현재_주제
    - 주요_지명
    - 구약_지명
    - 신약_지명
    - 현재_Region
    - 현재_Story

  future_candidate:
    - 특정_성경책
    - 특정_시대
    - 특정_인물
```

현재 사용자가 보고 있는 Timeline/Map/Guide 맥락에서
즉시 복습을 시작할 수 있는 방향을 우선한다.

---

## 10. 오답 처리

틀렸을 때 단순 실패 표시로 끝내지 않는다.

```yaml
WRONG_ANSWER_BEHAVIOR:

  offer:
    - 다시_시도
    - 정답_위치_보기
    - 짧은_설명_보기
    - 관련본문_보기

  principle:
    - penalize_less
    - teach_immediately
    - preserve_context
```

정답 공개는 학습용으로 명확하고 쉬운 언어를 사용한다.

---

## 11. Timeline / Map / Guide와의 연결

복습 퀴즈는 현재 학습 맥락에서 자연스럽게 이어질 수 있다.

```yaml
QUIZ_CONTEXT_INTEGRATION:

  from_timeline:
    - current_period
    - current_event

  from_map:
    - current_region
    - visible_places

  from_guide:
    - current_topic
    - current_story_steps

  resulting_quiz:
    - scope_can_follow_current_context
```

예:
`사울·다윗 이야기 → 현재 주제 복습 → 지도에서 관련 지명 찾기`

---

## 12. Reader Language

```yaml
QUIZ_READER_LANGUAGE:

  use:
    - 쉬운_한국어
    - 짧은_문제
    - 직접적인_피드백

  avoid:
    - VERIFY
    - HOLD
    - stable_id
    - authority
    - projection
    - source_locator
    - 내부상태코드
```

---

## 13. 연구자산과 학습자산의 관계

```text
승인 연구자산
    ↓
Reader Layer
    ↓
Map / Detail / Guide / Timeline
    ↓
Review Quiz
```

퀴즈는 이 흐름의 최종 소비자다.

퀴즈가 원 연구자산을 수정하거나
새로운 research truth를 생성하지 않는다.

---

## 14. 앱기획 적용 체크

```yaml
APP_PLANNING_CHECK:

  personal_materials:
    - 내사진_지원
    - 내메모_지원
    - shared_research와_private_data_분리

  backup:
    - export_supported
    - import_supported

  quiz:
    - 지도에서_찾기
    - 설명_보고_맞히기
    - 현재주제_범위
    - 주요지명_범위
    - 구약_신약_범위

  wrong_answer:
    - retry
    - show_answer_location
    - short_explanation

  context:
    - Timeline_Map_Guide와_현재맥락_연결

  language:
    - 쉬운한국어
    - 내부운영어_미노출
```

---

## 15. 기존 고정 문서와의 관계

본 문서는 다음 문서를 대체하지 않고 보완한다.

```yaml
related_documents:
  - JUDEBIBLE_CONTEXT_HARAM_INTERACTION_GRAMMAR_AND_READER_LANGUAGE_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_TIMELINE_MAP_GUIDE_INTERACTION_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_MAP_WORKSPACE_CONTROLS_AND_EXPORT_LOCK_v0.1
  - JUDEBIBLE_CONTEXT_90_REGION_SHARED_RESEARCH_STRATEGY_LOCK_v0.1
```

충돌 시:
- 공용 연구 identity/authority는 기존 research/projection lock을 따른다.
- 개인 자료는 본 문서의 private separation 원칙을 따른다.
- Quiz는 기존 승인 연구자산만 소비한다.
- 실제 UI 구현은 09_앱기획_도이치리베_내부도구에서 수행한다.

---

## 16. 현재 고정 결정

```yaml
LOCKED_DECISIONS:

  - 공용연구와_개인자료를_분리
  - 사용자_사진과_메모를_entity에_연결가능
  - 개인자료_백업과_복원_지원
  - 필요한_경우_오프라인_자료사용_방향_허용
  - 복습퀴즈는_기존연구자산을_재사용
  - 지도에서_지명찾기_퀴즈_지원
  - 틀리면_다시시도와_정답위치보기_지원
  - 현재주제_주요지명_구약_신약_등_범위선택_지원
  - Timeline_Map_Guide_현재맥락에서_복습으로_연결
  - 퀴즈도_쉬운한국어를_사용
```
