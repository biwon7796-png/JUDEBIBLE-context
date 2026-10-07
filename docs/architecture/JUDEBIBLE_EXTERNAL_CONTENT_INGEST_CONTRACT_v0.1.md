# JUDEBIBLE_EXTERNAL_CONTENT_INGEST_CONTRACT_v0.1

status: DEFINED_AND_PERSISTED
date: 2026-10-06
task: DEFINE_JUDEBIBLE_EXTERNAL_CONTENT_INGEST_CONTRACT_FOR_BOOK_PROFILE_DICTIONARY_ATLAS_SOURCES

scope:
  - Bible introduction / Book Profile sources
  - Bible dictionary sources
  - Bible atlas / geography sources
  - AI-assisted structuring
  - canonical identity resolution
  - Source Pack / Evidence handoff
  - JudeBible projection

authority_effect: NONE
registry_effect: NONE
runtime_effect: NONE
new_runtime: NONE
new_registry: NONE
new_gate: NONE

related_plans:
  - JUDEBIBLE_BIBLE_WORLD_EXPLORER_MAP_PRODUCTION_PLAN_v0.2
  - existing Passage Source Pack 7-field contract
  - existing Project01 research / resolver boundary

## 1. 목적

JudeBible은 외부 성경개론·성경사전·아틀라스를 각각 별도 웹사전으로 복제하지 않는다.

대신 외부·보유 자료를 AI가 빠르게 구조화하여
**Book / Era / Person / Place / Region / Physical Feature / Route / Event / Scripture Ref**
후보를 추출하고,
기존 JudeBible identity와 resolve한 뒤,
검증된 fact와 evidence만 공용 지식층에 축적한다.

최종 목표는 하나의 자료를 여러 화면에 중복 복사하는 것이 아니라,
한 번 구조화·검증한 내용을 다음에 재사용하는 것이다.

- 성경개론
- 성경사전
- 시대 지도
- 주제 오버레이
- 연표
- Bible Navigation Panel
- WORBS / Person / Place Research

## 2. 이번에 도입하는 것과 도입하지 않는 것

### 도입하는 것

오승남 목사님의 Bible Atlas 방식에서 생산성이 높은 부분을 받아들인다.

1. 성경개론에서 주요 인물·지명·사건·시대·본문 참조 자동 추출
2. 성경사전/아틀라스에서 항목 단위 정보 자동 구조화
3. 지명·인물·사건을 clickable navigation candidate로 생성
4. 지도·연표·본문과 연결될 relation candidate 생성
5. 같은 source를 반복 읽지 않도록 Source Note / Source Pack으로 축적

### 도입하지 않는 것

1. AI가 이름이 같다는 이유만으로 canonical identity를 확정하는 방식
2. 상업 성경사전/아틀라스를 통째로 변형하여 공개 웹사전으로 복제하는 방식
3. AI가 만든 요약을 곧바로 Project01 전문 연구로 승격하는 방식
4. source-local 좌표/ID를 JudeBible canonical identity로 대체하는 방식
5. 자료 하나마다 별도 HTML 웹앱을 만드는 방식
6. 새 Runtime / Registry / Gate를 추가하는 방식

## 3. 기존 JudeBible 방식과의 관계

기존 구조를 갈아엎지 않는다.

기존:
External fact / internal approved asset
→ identity
→ research
→ projection

업데이트:
External / owned content
→ **AI STRUCTURING**
→ identity candidate
→ identity resolution
→ fact / evidence / relation separation
→ Project01 professional research where needed
→ approved projection

즉 새로 추가되는 핵심은 **AI STRUCTURING 입력층**이다.

## 4. Source 권리 등급

모든 입력 자료는 구조화 전에 권리 상태를 먼저 분류한다.

### A. OWNED
사용자가 직접 작성했거나 저작권을 보유한 자료.

허용:
- 전체 구조화
- 문장 재작성
- Reader Layer 생성
- 앱 콘텐츠 생성
- 공개 projection 후보

### B. LICENSED_REUSE
CC BY, public domain 등 재사용 조건이 명확한 자료.

허용:
- license 범위 내 구조화
- fact extraction
- 필요 시 문장 변환
- attribution 보존
- 공개 projection 후보

### C. REFERENCE_ONLY
상업 출판물, 사용권이 불명확한 성경사전·아틀라스·주석서 등.

허용:
- 연구 참고
- fact / claim 후보 추출
- source locator 기록
- 독립적 표현으로 재작성할 evidence 사용
- 다른 source와 교차검증

금지:
- 장문 복제
- 항목별 대량 paraphrase로 사실상 대체판 제작
- 원문 구조를 그대로 유지한 공개 웹사전 생성
- 권리 확인 없이 이미지 재사용

### D. RIGHTS_HOLD
권리나 source identity가 불명확함.

처리:
- import 금지
- 공개 projection 금지
- private research evidence 후보로만 HOLD

## 5. Source Manifest 최소 계약

모든 ingest 입력은 최소한 다음 정보를 가진다.

```yaml
SOURCE_MANIFEST:
  source_id: REQUIRED
  title: REQUIRED
  source_type: BOOK_PROFILE | DICTIONARY | ATLAS | GAZETTEER | OTHER
  owner_or_publisher: REQUIRED
  edition_or_version: REQUIRED_IF_AVAILABLE
  source_locator: REQUIRED
  rights_class: OWNED | LICENSED_REUSE | REFERENCE_ONLY | RIGHTS_HOLD
  license_or_rights_note: REQUIRED
  language: REQUIRED
  ingestion_date: REQUIRED
  file_sha256: REQUIRED_IF_LOCAL_FILE
  allowed_use:
    extraction: true|false
    reader_layer: true|false
    public_projection: true|false
```

Source Manifest는 authority를 만들지 않는다.
source provenance와 허용 범위만 잠근다.

## 6. 공통 AI Structuring 출력

자료 유형에 관계없이 AI가 먼저 다음 후보를 추출한다.

```yaml
EXTRACTED_CONTENT_UNIT:
  source_id:
  source_locator:
  unit_id:
  source_span:
  raw_label:
  normalized_label_candidate:

  entity_type:
    BOOK | ERA | PERSON | PLACE | REGION |
    RIVER | SEA | LAKE | SPRING | WADI |
    MOUNTAIN | VALLEY | DESERT | PLAIN |
    ROUTE | EVENT | ARCHAEOLOGICAL_SITE |
    SCRIPTURE_REF | THEME | OTHER

  scripture_refs: []
  era_candidates: []
  relation_candidates: []

  extracted_facts: []
  extracted_claims: []

  confidence:
    extraction: HIGH | MEDIUM | LOW
    identity: UNRESOLVED

  import_status: CANDIDATE
```

이 단계의 결과는 **후보**일 뿐 canonical fact가 아니다.

## 7. 자료 유형별 추출 규칙

### 7.1 성경개론 / Book Profile 자료

자동 추출 대상:
- 책 이름
- 저자/저작 관련 주장
- 시대
- 구조/개요
- 주요 인물
- 주요 지역
- 주요 사건
- 핵심 본문
- 여정
- 역사적 배경
- 읽기 길잡이
- 주제
- 연구 쟁점

특히 다음 relation을 적극 추출한다.

```
BOOK → PERSON
BOOK → PLACE
BOOK → EVENT
BOOK → ERA
BOOK → SCRIPTURE_REF
EVENT → PLACE
EVENT → PERSON
EVENT → SCRIPTURE_REF
```

중요:
- 주요 지역 목록은 곧바로 지도 link 후보로 만들 수 있음
- 그러나 실제 link는 canonical identity resolution 후 생성
- 개론의 해석적 문장은 Project01 전문 결론으로 자동 승격 금지

### 7.2 성경사전

자동 추출 대상:
- 표제어
- alias / transliteration
- category
- 짧은 정의
- 주요 본문
- 관련 인물/장소/사건
- 역사·문화 fact
- 사진/지도 reference
- 관련 단어
- 시대

사전 항목의 최종 Reader Layer는 rights class에 따라 처리한다.

OWNED / LICENSED_REUSE:
- 직접 Reader Layer 후보 생성 가능

REFERENCE_ONLY:
- fact/evidence만 추출
- 최종 설명문은 별도로 새로 작성
- 원문 항목 구조와 문장을 복제하지 않음

### 7.3 Bible Atlas / Geography Source

자동 추출 대상:
- place / region name
- source-local ID
- feature type
- ancient / modern names
- coordinates / geometry
- confidence
- route
- terrain / hydrology
- historical geography
- map period
- source bibliography

분류:
- source-exact 좌표·geometry·ID → DIRECT_DATA 후보
- 고대↔현대 동일성 → RESEARCH_EVIDENCE
- route reconstruction → RESEARCH_EVIDENCE
- 시대별 경계 → RESEARCH_EVIDENCE

## 8. Identity Resolution 계약

AI가 추출한 이름은 바로 지도에 연결하지 않는다.

```yaml
IDENTITY_RESOLUTION:
  extracted_label:
  entity_type:
  candidate_existing_ids: []

  evidence:
    name_match:
    scripture_context:
    era_context:
    geography_context:
    source_crosswalk:
    existing_research:

  result:
    VERIFIED_EXISTING
    POSSIBLE_EXISTING
    NEW_CANDIDATE
    CONFLICT
    HOLD

  canonical_id:
    ALLOWED_ONLY_IF_VERIFIED_EXISTING

  new_identity_issue:
    PROHIBITED_BY_INGEST
```

ingest 단계는 새 stable identity를 발급하지 않는다.

## 9. Fact / Claim / Draft 분리

외부 자료에서 추출된 내용은 세 종류로 분리한다.

### FACT
원문에서 직접 확인 가능한 단순 자료.

예:
- 특정 책 개론이 브엘세바를 주요 지역으로 열거함
- atlas source가 특정 source-local coordinate를 제공함
- 특정 사전 항목이 해당 본문을 참조함

### CLAIM
해석·역사·지리적 동일성·연대·신학적 의미 등이 포함된 주장.

예:
- 특정 유적이 성경의 그랄이라는 주장
- 모리아가 현대 특정 좌표라는 주장
- 특정 이동 경로가 실제 고대 도로였다는 주장

CLAIM은 evidence로 유지하며 Project01 판정이 필요할 수 있다.

### READER_DRAFT
사용자에게 보여주기 위한 설명 초안.

Reader Draft는:
- authority 없음
- rights boundary 준수
- Project01 승인 연구와 충돌 시 폐기/수정
- source 문장의 장문 재생산 금지

## 10. 공용 External Content Packet

각 source에서 추출한 결과를 다음 최소 묶음으로 저장한다.

```yaml
EXTERNAL_CONTENT_PACKET:
  TARGET:
    source_id:
    source_type:
    intended_use:

  SOURCE:
    manifest_ref:
    exact_version:
    rights_class:

  ENTITIES:
    extracted:
    resolved:
    unresolved:

  FACTS:
    direct_data: []

  EVIDENCE:
    claims: []
    source_refs: []

  RELATIONS:
    book_person: []
    book_place: []
    book_event: []
    event_place: []
    event_person: []
    event_scripture: []

  UNCERTAINTY:
    possible_matches: []
    conflicts: []
    holds: []

  PROVENANCE:
    source_spans: []
    extraction_record:
    reviewer:

  PROJECTION_CANDIDATES:
    book_profile: []
    dictionary: []
    map: []
    timeline: []
    navigation: []
```

이 Packet은 기존 Passage Source Pack을 대체하지 않는다.
외부 콘텐츠 ingest 전용 입력 묶음이다.

## 11. Projection 규칙

### Book Profile
허용:
- 검증된 주요 인물/지역/사건 relation
- 사용 권리가 있는 Reader Layer
- Project01 승인 연구 link

### Bible Dictionary
허용:
- canonical entity
- verified fact
- approved Reader Layer
- scripture refs
- related entities
- research links

### Map
허용:
- VERIFIED existing identity
- approved / source-exact geography layer
- certainty-aware display
- 시대/주제 overlay relation

### Timeline
허용:
- verified event identity
- scripture ref
- era relation
- approved date/range or uncertainty

### Bible Navigation Panel
허용:
- 이미 승인된 identity와 relation의 projection
- 본문 / 지도 / 연표 / Research Panel 이동

Navigation Panel은 새 전문 의미를 만들지 않는다.

## 12. 자동화 허용 범위

자동 허용:
- source text parsing
- heading/section extraction
- scripture reference extraction
- named entity candidate extraction
- relation candidate extraction
- source-local key 보존
- duplicate candidate detection
- existing canonical ID 후보 검색
- rights metadata 전달
- Source Note 생성
- review queue 생성

검증 후 자동 projection 가능:
- 이미 VERIFIED_EXISTING identity와 정확히 결속되고
- DIRECT_DATA이며
- source/version/rights가 잠겨 있고
- 기존 approved fact와 conflict가 없는 항목

사람/전문 검수 필수:
- identity ambiguity
- theological meaning
- historical reconstruction
- ancient-modern identification
- disputed chronology
- route reconstruction
- uncertain geography
- Reader Layer 최종 문장
- source conflict

## 13. 성경개론을 넣었을 때의 실제 흐름

예: Genesis introduction에서
"우르, 하란, 세겜, 벧엘, 헤브론, 브엘세바, 소돔, 모리아, 애굽, 고센"을 추출한 경우.

1. Book = Genesis 확인
2. "주요 지역" section의 place candidate 추출
3. 각 이름을 existing Place/Region knowledge와 대조
4. VERIFIED_EXISTING만 canonical ID 연결
5. unresolved / ambiguous는 HOLD
6. Genesis → Place relation candidate 생성
7. Book Profile / Bible Navigation에서 사용
8. 해당 장소 선택 시 지도 scene으로 이동
9. 지도는 그 장소의 canonical geography를 사용
10. 개론 자체의 장소 설명이 Project01 Place 연구를 override하지 않음

즉:
**개론은 무엇을 연결할지 알려 주고,
지리 연구층은 그것이 어디인지 판정한다.**

## 14. 성경사전·아틀라스 책을 통째로 넣는 정책

### 캡틴 소유 자료
가능:
- 통째로 ingest
- 구조화
- 자체 Reader Layer 생성
- 검색/사전 UI에 projection

### 공개/라이선스 허용 자료
가능:
- license 조건 준수
- attribution과 version 고정
- 필요한 field 추출

### 상업 출판물
기본값:
REFERENCE_ONLY

권장 방식:
- 필요한 항목/주장을 연구 evidence로 사용
- 사실 단위로 추출
- source locator 기록
- 다른 신뢰 source와 교차검증
- 최종 JudeBible 설명은 독립 작성

비권장:
- 책 전체를 넣고 모든 항목을 같은 목차·설명 구조로 다시 만들어 공개
- 원문을 조금씩 paraphrase해 사실상 온라인 대체판 생성

## 15. 외부 신뢰자료 전략

JudeBible은 외부자료를 두 계열로 병행한다.

### Structured External Data
예:
- STEPBible
- OpenBible.info
- Pleiades
- 기타 라이선스 명확한 gazetteer / corpus

역할:
- 대량 fact layer
- source-local ID
- coordinates / geometry
- lexical / geographic base

### Scholarly / Reference Sources
예:
- 권위 있는 Bible Dictionary
- Bible Atlas
- Commentary
- 전문 monograph
- 사용자가 보유한 Bible Introduction

역할:
- evidence
- context
- competing interpretation
- Reader Layer input
- Project01 전문 연구 input

원칙:
Structured data는 넓게,
전문 reference는 필요한 주장에 깊게 사용한다.

## 16. 품질 기준

External ingest 성공 조건:

- source identity가 명확함
- version/edition을 추적할 수 있음
- rights class가 명확함
- 원문 span 또는 source locator가 남음
- entity extraction과 identity resolution이 분리됨
- canonical identity는 VERIFIED만 사용
- fact / claim / reader draft가 섞이지 않음
- uncertainty가 보존됨
- 동일 정보를 map/timeline/dictionary에 중복 작성하지 않음
- 전문 연구 owner가 필요한 판단은 Project01에 남김

## 17. 저장 전략

Obsidian:
```
Jude_Research/
  01_소스들/
    성경위키_외부자료/
      01_성경개론/
      02_지리_장소/
      03_성경사전/
      04_아틀라스/
      05_주석_학술/
```

각 source는:
- Source Manifest
- Source Note
- extracted entity/relation list
- unresolved queue
를 가진다.

WebApp repository:
- 전문 원문 서재 역할을 하지 않음
- projection에 필요한 normalized output과 provenance pointer만 유지
- source book 전체를 앱 코드에 embed하지 않음

## 18. 권위와 관할

Project01:
- 본문·역사·문학·신학 전문 판단
- Person / Place / Event 전문 연구
- competing claims 판정
- 전문 Reader Layer 근거

JudeBible / WebApp:
- approved fact/relation 조립
- map/timeline/navigation projection
- search / card / interaction

00 Control Tower:
- authority / jurisdiction conflict가 있을 때만 resolve

AI ingest:
- 추출·정규화·후보 연결
- authority 생성 금지

## 19. 기존 Bible Atlas HTML 참고에서 확인한 생산성 패턴

참고 HTML은 성경개론의 "주요 지역"을 구조화된 places 목록으로 만들고,
UI에서는 clickable place button으로 렌더링한 뒤 지도 선택 이벤트를 발생시키는 패턴을 사용한다.

또 성경사전은 ENTRIES 배열에 표제어·요약·본문·관련 정보·사진/위치 정보를 구조화하고,
같은 데이터에서 카드 목록과 상세 패널을 렌더링한다.

JudeBible은 이 패턴의 **구조화와 relation extraction**은 채택하되,
canonical identity 검증·provenance·rights·professional research boundary를 추가한다.

## 20. 최소 구현 순서

Phase 1 — Contract
- 본 문서로 고정

Phase 2 — Owned Book Profile Pilot
- 캡틴이 소유한 성경개론 1개를 선택
- AI structuring
- Person / Place / Event / Scripture relation 추출
- 기존 identity resolve
- no app import

Phase 3 — Navigation Projection Pilot
- 검증된 relation만
- Book Profile → Place click → Map
- Book Profile → Event → Timeline
- Book Profile → Research link
- staging

Phase 4 — Dictionary / Atlas Pilot
- OWNED 또는 LICENSED_REUSE 자료 1종
- fact/evidence 분리
- Reader Layer 여부 결정

Phase 5 — Scale
- source별 adapter를 새 runtime으로 만들지 않고
- 같은 contract를 반복 적용
- 검증된 relation을 점진적으로 축적

## 21. 최종 결정

```yaml
DECISION:
  replace_existing_pipeline: NO
  add_ai_structuring_ingest_layer: YES

  copy_whole_commercial_dictionary_to_web: NO
  ingest_owned_material_whole: YES
  ingest_licensed_material_with_conditions: YES
  use_commercial_reference_as_evidence: YES

  identity_resolution_required: YES
  provenance_required: YES
  rights_classification_required: YES
  project01_professional_boundary_preserved: YES

  external_verified_data_strategy:
    keep: YES

  map_timeline_navigation_reuse:
    required: YES
```

## 22. NEXT_TASK_ONE

`PILOT_AI_STRUCTURING_WITH_ONE_OWNED_BIBLE_INTRODUCTION_AND_RESOLVE_PERSON_PLACE_EVENT_RELATIONS`

목표:
- 새 시스템을 만들지 않는다.
- 캡틴 소유 성경개론 한 권/한 책 분량을 실제 입력으로 사용한다.
- AI가 주요 인물·지역·사건·본문 관계를 얼마나 정확히 구조화하는지 본다.
- 기존 JudeBible identity와 resolve한다.
- 앱 import 전 review packet까지만 만든다.
