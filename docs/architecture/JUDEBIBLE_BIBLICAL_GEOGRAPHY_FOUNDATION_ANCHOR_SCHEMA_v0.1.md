# JUDEBIBLE_BIBLICAL_GEOGRAPHY_FOUNDATION_ANCHOR_SCHEMA_v0.1

status: DESIGN_ANCHOR
authority_effect: NONE
scope: JudeBible Biblical Geography Foundation
created: 2026-10-07

## 1. 목적

이 문서는 JudeBible Biblical Geography Foundation의 구조적 앵커이다.
개별 지리 연구의 전문 결론을 대신하지 않는다.
Holman Bible Atlas 및 기타 출처에서 생산된 연구 결과를 JudeBible의 shared entity / map / search / research / timeline / journey projection 구조에 일관되게 연결하기 위한 공통 스키마 기준이다.

Holman Bible Atlas는 주요 source package 중 하나이며 JudeBible의 canonical authority 자체가 아니다.
개별 claim은 sourceEvidence를 통해 출처와 범위를 보존한다.

## 2. 핵심 원칙

1. 먼저 재사용 가능한 지리 기반층을 구축하고 시대 연구는 이를 참조한다.
2. 물리 지리와 시대별 역사 해석을 분리한다.
3. 기존 Place / Person identity를 중복 생성하지 않는다.
4. 지도 geometry가 없는 개념에 가짜 point / polygon / route를 만들지 않는다.
5. 연구 source와 UI projection을 분리한다.
6. Foundation entity는 Map / Search / Research / Scripture / Timeline / Topic-Journey에서 재사용한다.
7. 별도 Registry / Runtime / Data Store를 새로 만들지 않고 기존 shared entity/index 구조를 확장한다.

## 3. Foundation Entity Types

### GEOGRAPHIC_REGION
고대근동, 메소포타미아, 이집트, 레반트 등 비교적 지속적인 지리 범위이다.

### HISTORICAL_REGION
앗수르, 바빌로니아처럼 역사적·정치적 경계가 시대에 따라 변할 수 있는 영역이다.

### LANDFORM
삼각주, 평야, 산지, 계곡, 고원, 사막 등 지형 단위이다.

### HYDROLOGY
강, 바다, 호수, 수계 등 물리적 수문 지리이다.

### HYDRO_FEATURE_SYSTEM
나일 cataracts와 같이 다수의 수문 지형이 하나의 기능적 체계로 작동하는 경우이다.

### ROUTE
King's Highway, International Coastal Highway처럼 재사용 가능한 고대 이동 회랑이다.

### ROUTE_NETWORK
여러 ROUTE를 묶는 국제 교역·군사 이동망이다.

### GEOGRAPHIC_RELATION
'Palestine as Land Bridge'처럼 독립 지형 물체보다 공간 사이의 기능적 관계를 표현한다.

## 4. Shared Entity Schema

```text
GeographyFoundationEntity

identity
- stableId
- entityType
- canonicalName
- alternateNames[]
- parentIds[]
- childIds[]

spatial
- geometryType
- coordinates
- geometryRef
- spatialCertainty
- modernReference

physical
- terrain
- elevationProfile
- geology
- hydrologyIds[]
- climateSummary
- rainfallPattern
- vegetation
- agriculturalPotential
- pastoralPotential

functional
- settlementRole
- agricultureRole
- pastoralRole
- tradeRole
- militaryRole
- boundaryRole
- culturalRole

biblical
- passageRefs[]
- placeIds[]
- personIds[]
- eventIds[]
- journeyIds[]

eraInteractions[]
- eraId
- role
- relatedEventIds[]
- sourcePassages[]
- evidenceRefs[]
- confidence

sourceEvidence[]
- sourceId
- sourceType
- section
- pageOrMapRef
- claimScope
- claimType
- confidence

projection
- mapLayer
- searchVisible
- researchPanelType
- scriptureEligible
- timelineEligible
- navigationEligible

researchStatus
- VERIFIED
- REVIEWED
- PARTIAL
- PENDING
```

## 5. Physical / Historical 분리 규칙

Foundation의 physical / functional 정보는 가능한 한 시대 불변의 지리 기반을 설명한다.
특정 시대에서 그 지리가 어떤 역할을 했는지는 eraInteractions에 기록한다.

예:
- Jezreel Valley physical: 평탄한 계곡, 교통 회랑, 농업 적합성
- Judges eraInteraction: 드보라·바락 전승과 관련된 군사 이동 맥락
- Monarchy eraInteraction: 므깃도 전략 거점 맥락

이 둘을 하나의 서술 필드에 섞지 않는다.

## 6. Source Evidence Contract

모든 중요 claim은 가능하면 sourceEvidence를 가진다.

```text
sourceEvidence
- sourceId
- sourceType
- section
- pageOrMapRef
- claimScope
- claimType
- confidence
```

confidence 예:
- SOURCE_EXPLICIT
- MULTI_SOURCE_CONFIRMED
- STRONG_INFERENCE
- TENTATIVE
- UNRESOLVED

Holman에서 직접 확인되지 않은 page/section은 추정 입력하지 않는다.
페이지 단위 검증 전에는 pageOrMapRef를 비워둘 수 있다.

## 7. Projection Contract

### Map
- Region: polygon / label
- River: line / label
- Route: corridor / line
- Geographic Relation: 보통 직접 geometry를 만들지 않음
- Historical Region: era-sensitive geometry만 허용

### Search
- canonicalName / alternateNames / type / summary / related biblical context
- selected-state는 기존 JudeBible 공통규격을 사용

### Research
- Geography Research Panel projection
- Physical Geography와 Biblical/Historical interaction을 분리해 보여준다.

### Scripture
- relatedPassages를 통해 현재 본문과 결속
- geography entity가 본문연구 자체를 대체하지 않는다.

### Timeline
- 시대별 eraInteractions만 projection
- 지리 자체의 물리 정의는 중복 작성하지 않는다.

### Topic / Journey
- route / corridor / region context를 shared relation으로 제공
- 가짜 이동 경로나 좌표를 만들지 않는다.

## 8. Map Layer Contract

```text
MapLibre / legacy basemap
↓
Physical terrain
↓
Foundation semantic geography
↓
Era overlays
↓
Journey / Event overlays
```

Foundation semantic geography는 terrain tile 자체와 분리한다.
역사 사건 overlay가 Foundation geometry를 덮어쓰지 않는다.

## 9. Chapter Boundary Rule

Chapter 1은 Ancient Near East macro geography 중심이다.
Palestine/Canaan의 세부 자연지형은 Chapter 2 이후의 전문 단위로 넘긴다.

Chapter 1에서 조기 흡수하지 않을 대표 항목:
- Coastal Plain
- Jezreel Valley
- Central Highlands
- Jordan Rift Valley
- Shephelah
- Negev
- Arabah
- Judean Wilderness
- Palestine rainfall zones

## 10. Reuse Rule

```text
FOUNDATION GEOGRAPHY
        ↓
Patriarchal
        ↓
Exodus
        ↓
Conquest
        ↓
Judges
        ↓
Monarchy
        ↓
Exile
        ↓
Second Temple / NT
```

시대별 연구는 Foundation entity를 다시 정의하지 않는다.
해당 시대에서의 의미만 eraInteractions에 추가한다.

## 11. Identity / Geometry Safety

- 동일 장소/지역 identity를 source별로 중복 생성하지 않는다.
- Historical Region은 시대별 경계 변화가 있으므로 영구 고정 polygon으로 취급하지 않는다.
- Person entity에 지리 좌표를 직접 부여하지 않는다.
- Route가 source에서 불확실하면 certainty를 낮추고 추정 경로를 authoritative geometry처럼 표시하지 않는다.
- 'land bridge' 같은 관계 개념은 GEOGRAPHIC_RELATION으로 표현한다.

## 12. Research Package Contract

하나의 연구 package가 여러 Foundation entity를 생산할 수 있다.
entity 하나마다 별도 중복 연구를 수행하지 않는다.

예:
HBA01-02 MESOPOTAMIA_TIGRIS_EUPHRATES
→ Mesopotamia
→ Northern Mesopotamia
→ Southern Mesopotamia
→ Assyria
→ Babylonia
→ Tigris
→ Euphrates
→ Ur/Haran existing place relations

## 13. DoD

- Foundation Entity Type이 명확하다.
- physical geography와 era interaction이 분리되어 있다.
- sourceEvidence 필드가 존재한다.
- 기존 Place/Person identity 중복 생성이 없다.
- Map/Search/Research/Scripture/Timeline/Journey projection 규칙이 있다.
- 가짜 geometry / passage / route가 없다.
- Chapter boundary가 유지된다.
- 기존 shared entity/index 구조에 얇게 결속된다.

## 14. Lifecycle

이 문서는 구조적 설계 앵커이며 전문 연구 결과의 승인 문서가 아니다.
후속 연구 package가 이 스키마를 사용하되, 개별 전문 결론의 authority와 approval은 rightful professional research workflow를 따른다.
