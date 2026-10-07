# JUDEBIBLE_HOLMAN_ATLAS_CH01_FOUNDATION_ENTITY_INVENTORY_v0.1

status: WORKING_INVENTORY
authority_effect: NONE
source_scope: Holman Bible Atlas Chapter 1 as a primary source package
created: 2026-10-07

## 1. 목적

이 문서는 Holman Bible Atlas Chapter 1을 JudeBible Biblical Geography Foundation에 연결하기 위한 working inventory이다.
개별 항목의 전문 연구 결론을 확정하는 문서가 아니다.
모든 항목은 후속 source-evidence 연구에서 page / section / map 단위로 검증되어야 한다.

## 2. Chapter 1 Research Boundary

Chapter 1의 기본 범위:
- Ancient Near East macro geography
- Fertile Crescent
- Mesopotamia
- Egypt
- Levant
- major river systems
- international highways / trade corridors

Palestine/Canaan의 세부 자연지형, 세부 강수량, 세부 농업권은 Chapter 2 이후로 넘긴다.

## 3. Canonical Working Inventory

| Stable ID | Entity | Type | Parent | JudeBible Role | Map Projection | Research Status |
|---|---|---|---|---|---|---|
| geo.ane | Ancient Near East | GEOGRAPHIC_REGION | — | 최상위 macro-region | macro region/extent | PENDING |
| geo.fertile_crescent | Fertile Crescent | GEOGRAPHIC_REGION | geo.ane | 농경·정착·문명 회랑 | semantic region | PENDING |
| geo.mesopotamia | Mesopotamia | GEOGRAPHIC_REGION | geo.fertile_crescent | 족장·앗수르·바벨론 재사용 | region | PENDING |
| geo.mesopotamia.north | Northern Mesopotamia | GEOGRAPHIC_REGION | geo.mesopotamia | 북부 메소포타미아 맥락 | region | PENDING |
| geo.mesopotamia.south | Southern Mesopotamia | GEOGRAPHIC_REGION | geo.mesopotamia | 남부 충적평야·도시권 | region | PENDING |
| geo.assyria | Assyria | HISTORICAL_REGION | geo.mesopotamia | 왕국·앗수르 시대 참조 | era-sensitive region | PENDING |
| geo.babylonia | Babylonia | HISTORICAL_REGION | geo.mesopotamia | 포로기·바빌론 연구 참조 | era-sensitive region | PENDING |
| hydro.tigris | Tigris River | HYDROLOGY | geo.mesopotamia | 수계·농업·도시·교역 | river line | PENDING |
| hydro.euphrates | Euphrates River | HYDROLOGY | geo.mesopotamia | 수계·농업·도시·교역 | river line | PENDING |
| geo.egypt | Egypt | GEOGRAPHIC_REGION | geo.ane | 족장·출애굽·왕국 재사용 | region | PENDING |
| geo.egypt.upper | Upper Egypt | GEOGRAPHIC_REGION | geo.egypt | Two Lands 구조 | region | PENDING |
| geo.egypt.lower | Lower Egypt | GEOGRAPHIC_REGION | geo.egypt | Delta/고센 맥락 | region | PENDING |
| hydro.nile | Nile River | HYDROLOGY | geo.egypt | 농업·정착·국가 안정성 | river line | PENDING |
| landform.nile_delta | Nile Delta | LANDFORM | geo.egypt.lower | 하이집트·고센 지형 맥락 | polygon | PENDING |
| hydro.nile_cataracts | Nile Cataracts | HYDRO_FEATURE_SYSTEM | hydro.nile | 남부 경계·방어 맥락 | feature system | PENDING |
| geo.levant | Levant | GEOGRAPHIC_REGION | geo.ane | 성경 세계 land bridge | region | PENDING |
| geo.syria | Syria | GEOGRAPHIC_REGION | geo.levant | 북부 Levant·아람 맥락 | region | PENDING |
| geo.lebanon | Lebanon | GEOGRAPHIC_REGION | geo.levant | 산악·목재·연안 교역 맥락 | region | PENDING |
| geo.canaan_macro | Canaan / Palestine Macro Region | GEOGRAPHIC_REGION | geo.levant | Chapter 2 상세지리 parent | region | PENDING |
| relation.levant_land_bridge | Levant / Palestine as Land Bridge | GEOGRAPHIC_RELATION | geo.levant | 군사·교역·문화 통과 기능 | usually no direct geometry | PENDING |
| route.international_coastal | International Coastal Highway | ROUTE | geo.levant | 국제 교역·군사 회랑 | corridor | PENDING |
| route.kings_highway | King's Highway | ROUTE | geo.levant | 동부 고원 이동축 | corridor | PENDING |
| route.network.ane | Ancient Near East International Route Network | ROUTE_NETWORK | geo.ane | 상위 교통망 | aggregate overlay | PENDING |

## 4. Supporting Biblical Anchors

아래는 Chapter 1 Foundation 자체가 아니라 기존 JudeBible Place / Passage entity와 연결할 anchor이다.

| Anchor | Foundation Link | Intended Use |
|---|---|---|
| Ur | Southern Mesopotamia | Abraham migration context |
| Haran | Northern Mesopotamia | Abraham migration context |
| Goshen | Lower Egypt / Nile Delta | Israel in Egypt context |
| Canaan | Levant / macro Canaan | patriarchal / conquest context |
| Assyria | Mesopotamia / historical region | monarchy / imperial context |
| Babylon | Babylonia | exile context |

규칙:
- 기존 stable identity가 있으면 관계만 추가한다.
- Chapter 1 연구 때문에 duplicate Place / Person identity를 만들지 않는다.

## 5. Source Evidence Requirements

각 entity는 후속 연구에서 최소 다음 evidence를 확보한다.

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

현재 inventory 단계에서는 exact page를 추정 입력하지 않는다.
직접 확인된 source page / map evidence가 생길 때 채운다.

## 6. Projection Mapping

| Entity Type | Map | Search | Research | Scripture | Timeline | Topic/Journey |
|---|---|---|---|---|---|---|
| GEOGRAPHIC_REGION | polygon/label | YES | Geography Panel | related passages | era interaction | YES |
| HISTORICAL_REGION | era-sensitive polygon | YES | Region Panel | related passages | HIGH | YES |
| LANDFORM | polygon/relief overlay | YES | Geography Panel | related passages | limited | YES |
| HYDROLOGY | line/water label | YES | Geography Panel | related passages | optional | optional |
| HYDRO_FEATURE_SYSTEM | grouped feature | YES | Geography Panel | related passages | optional | optional |
| ROUTE | corridor/line | YES | Route Panel | route passages | HIGH | HIGH |
| ROUTE_NETWORK | aggregate overlay | limited | Network Summary | — | era-based | YES |
| GEOGRAPHIC_RELATION | usually no geometry | YES | Explanatory Panel | YES | YES | YES |

## 7. Foundation Map Layer Mapping

```text
FOUNDATION.ANE.REGIONS
FOUNDATION.ANE.MAJOR_RIVERS
FOUNDATION.ANE.NILE_SYSTEM
FOUNDATION.ANE.FERTILE_CRESCENT
FOUNDATION.ANE.INTERNATIONAL_ROUTES
FOUNDATION.ANE.HISTORICAL_MACRO_REGIONS
```

Layer stack:

```text
BASEMAP
↓
PHYSICAL TERRAIN
↓
FOUNDATION SEMANTIC GEOGRAPHY
↓
ERA OVERLAYS
↓
JOURNEY / EVENT OVERLAYS
```

## 8. Chapter 2 / Later Reserved Items

이번 Chapter 1 inventory에서 의도적으로 제외한다.

- Coastal Plain
- Jezreel Valley
- Western / Central Highlands
- Galilee
- Samaria Highlands
- Judah Highlands
- Shephelah
- Negev
- Judean Wilderness
- Jordan Rift Valley
- Arabah
- detailed Transjordan subdivisions
- Palestine rainfall zones
- detailed Palestine agricultural zones

이 항목들은 후속 chapter-specific inventory에서 별도 검토한다.

## 9. First-pass Research Packages

### HBA01-01
ANCIENT_NEAR_EAST_AND_FERTILE_CRESCENT

생산 대상:
- geo.ane
- geo.fertile_crescent

### HBA01-02
MESOPOTAMIA_TIGRIS_EUPHRATES

생산 대상:
- geo.mesopotamia
- geo.mesopotamia.north
- geo.mesopotamia.south
- geo.assyria
- geo.babylonia
- hydro.tigris
- hydro.euphrates
- Ur / Haran relation updates

### HBA01-03
EGYPT_NILE_AND_TWO_LANDS

생산 대상:
- geo.egypt
- geo.egypt.upper
- geo.egypt.lower
- hydro.nile
- landform.nile_delta
- hydro.nile_cataracts
- Goshen relation update

### HBA01-04
LEVANT_AS_LAND_BRIDGE

생산 대상:
- geo.levant
- geo.syria
- geo.lebanon
- geo.canaan_macro
- relation.levant_land_bridge

### HBA01-05
INTERNATIONAL_COASTAL_HIGHWAY

생산 대상:
- route.international_coastal
- route.network.ane relation update

### HBA01-06
KINGS_HIGHWAY

생산 대상:
- route.kings_highway
- route.network.ane relation update

## 10. Research Package Output Contract

각 package는 다음을 생산한다.

- source-backed research note
- entity records
- sourceEvidence entries
- shared relation updates
- map projection mapping
- search metadata
- research panel projection data
- eraInteraction candidates
- unresolved / certainty notes
- QA / consistency check

## 11. Safety / Non-fabrication Rules

- exact page / map reference를 추정으로 넣지 않는다.
- historical boundary를 현대 고정 경계처럼 취급하지 않는다.
- route geometry를 source evidence 없이 임의 확정하지 않는다.
- biblical significance를 source보다 과장하지 않는다.
- foundation layer와 시대별 overlay를 혼합하지 않는다.
- existing place/person identity를 duplicate하지 않는다.

## 12. Current Status

inventory_status: DESIGNED
schema_binding: JUDEBIBLE_BIBLICAL_GEOGRAPHY_FOUNDATION_ANCHOR_SCHEMA_v0.1
professional_research: NOT_YET_EXECUTED
promotion_status: NONE
next_research_candidate: HBA01-01 ANCIENT_NEAR_EAST_AND_FERTILE_CRESCENT
