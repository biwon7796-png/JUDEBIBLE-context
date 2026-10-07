# JUDEBIBLE_WIKI_CONTENT_POPULATION_STRATEGY_v0.1

status: OPERATING_STRATEGY_PERSISTED
date: 2026-10-06
scope: JudeBible content population / external evidence / WORBS / Obsidian accumulation
authority_effect: NONE
registry_effect: NONE
runtime_effect: NONE

## 1. 목적

JudeBible 성경 위키를 빠르고도 전문적으로 채우기 위한 공통 운영 전략이다.
핵심은 외부에서 이미 검증된 사실을 다시 연구하지 않고 넓게 수입하고, 해석이 필요한 영역만 Project01 WORBS가 깊게 연구하며, 승인된 연구를 기존 projection pipeline으로 재사용하는 것이다.

핵심 문장:
- 검증된 사실은 IMPORT한다.
- 해석이 필요한 것은 RESEARCH한다.
- 사실과 해석이 섞인 것은 HYBRID로 분리한다.
- 승인된 연구는 여러 기능으로 PROJECT한다.

## 2. 전체 생산 구조

External Verified Base
→ Source / Evidence normalization
→ Passage Source Pack
→ Project01 WORBS professional research
→ Review / Stage candidate / approval
→ Person / Place synthesis
→ JudeBible projection
→ Obsidian long-term accumulation

새 Runtime, Registry, Gate를 기본 해결책으로 만들지 않는다.
기존 Project01 연구 E2E와 JudeBible projection pipeline을 재사용한다.

## 3. 콘텐츠 분류

### IMPORT
외부 검증자료를 그대로 또는 정규화하여 사용하는 영역이다.
- Hebrew / Greek 원문
- morphology
- lemma / lexical base gloss
- 지명 좌표와 현대 지역
- 고도 / 지형
- 객관적 고고학 기본정보
- chronology reference
- media metadata / license
- 직접 본문 출현 / 관계 fact

### RESEARCH
Project01 전문 연구가 필요한 영역이다.
- 본문 구조
- 문학적 흐름
- 문맥적 원어 의미
- competing interpretations
- canonical / theological synthesis
- 본문 중심 메시지
- Person / Place의 성경적 의미

### HYBRID
사실층과 해석층을 분리하여 결합한다.
대표 영역:
- Place
- Person
- Chronology
- Archaeology
- Event / Route context

## 4. 외부자료 우선 채우기 전략

외부 기반층은 넓게 구축하고 WORBS는 깊게 진행한다.

우선순위:
1. 원어 / 형태론 / 사전
2. 장소 지리 facts
3. 인물 fact graph
4. 고고학 / 역사 facts
5. 연대 / 시대 reference
6. 미디어 / 라이선스
7. 학술 주석·논문 metadata / pointer

학술 주석과 논문은 JudeBible 해석으로 직접 수입하지 않는다.
External Scholarship → Evidence Pack → WORBS → JudeBible Research 순서를 유지한다.

## 5. Source Pack 최소 계약

Passage Source Pack은 연구 결과가 아니라 연구 입력이다.

필수 7필드:
- TARGET
- TEXT
- EXISTING_RESEARCH
- ENTITIES
- EVIDENCE
- UNCERTAINTY
- PROVENANCE

Source Pack 금지사항:
- 중심 메시지 작성
- 신학적 결론 확정
- contextual lexical meaning 확정
- new canonical identity 발급
- Registry pointer 변경
- 외부 주석을 JudeBible 해석으로 자동 승격

Genesis 22:1-19 E2E Pilot에서 위 7필드 계약은 생산성 기준을 통과하였다.
재탐색, authority 재탐색, 필수 입력 누락으로 인한 중단이 발생하지 않았다.

## 6. Person / Place 성장 방식

Person / Place Profile은 매번 처음부터 새 문서를 쓰는 방식보다 승인된 Passage 연구가 누적되어 성장하는 구조를 우선한다.

예:
창 21 WORBS
창 22 WORBS
창 24 WORBS
창 26 WORBS
→ Isaac Person synthesis

창 21 WORBS
창 22 WORBS
창 26 WORBS
왕상 19 WORBS
→ Beersheba Place synthesis

자동화 가능한 것은 관계 누적과 evidence 연결이다.
전문 synthesis의 문장과 해석은 Project01이 담당한다.

## 7. 한 연구의 다중 재사용

하나의 승인된 WORBS 연구는 다음으로 projection될 수 있다.
- Scripture research panel
- related Person relations
- related Place relations
- lexical evidence links
- related passage links
- map context
- search / explorer context

새 연구자산을 자동 생성하는 것이 아니라 승인된 연구에서 projection과 relation을 파생한다.

## 8. Obsidian 장기 축적 원칙

Obsidian Jude_Research는 장기 연구 서재와 human review workspace이다.
Obsidian 자체가 authority를 만들지는 않는다.

기본 축적 위치:
- 01_소스들: 외부 검증자료 / evidence / source notes
- 02_연구물: WORBS / Person / Place / 전문 연구
- 03_산출물: 승인된 downstream 산출물
- 99_운영문서: 전략 / 계약 / QA / 운영 기록

외부 자료는 원문 전체 복제보다 pointer / provenance / 필요한 excerpt 중심을 우선한다.
저작권·라이선스·판본·retrieval date·source identity를 기록한다.

## 9. 외부자료 서재 분류

01_소스들/성경위키_외부자료/
- 01_원어_사전
- 02_지리_장소
- 03_고고학_역사
- 04_연대_시대
- 05_인물_사실
- 06_미디어_라이선스
- 07_학술문헌_포인터

각 source note 최소 metadata:
- source_id
- title
- author / organization
- source_type
- url / locator
- edition / version / commit
- retrieved_at
- license / rights
- scope
- canonical_key candidates
- certainty
- use_mode: DIRECT_DATA | RESEARCH_EVIDENCE
- related passages / entities
- notes / unresolved issues

## 10. 생산 운영 방식

Track A — External Coverage
- 객관적 기반 데이터를 성경 전체에 넓게 채운다.
- IMPORT 가능한 것은 batch ingest와 QA로 처리한다.

Track B — WORBS Depth
- 기반자료가 준비된 본문부터 Project01이 깊게 연구한다.
- Source Pack을 통해 재탐색 비용을 줄인다.

두 Track은 병렬로 진행한다.
External 전체가 끝날 때까지 WORBS를 기다리지 않는다.
WORBS 전체가 끝날 때까지 외부 기반층을 미루지도 않는다.

## 11. 완료 기준

JudeBible 콘텐츠 채우기 전략은 다음 상태를 목표로 한다.
- 외부 검증 fact layer가 넓게 구축됨
- Source Pack이 자동 조립 가능함
- Project01이 재탐색 없이 WORBS를 시작할 수 있음
- 승인 연구가 Obsidian에 누적됨
- 승인 연구가 JudeBible에 자동 projection됨
- VERIFY / HOLD / provenance가 projection 후에도 보존됨
- rare / disputed long-tail이 전체 생산을 막지 않음

## 12. 운영 경계

이 문서는 운영 전략을 영속화하는 문서이며 새로운 전문 authority, Registry, Runtime, Gate를 생성하지 않는다.
Project01의 전문 의미, current representative, lifecycle promotion은 각 승인 authority를 따른다.
외부 공개·출판·판매는 별도 Captain Gate이다.
