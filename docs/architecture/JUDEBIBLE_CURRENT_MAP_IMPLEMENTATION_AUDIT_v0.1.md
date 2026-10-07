# JUDEBIBLE_CURRENT_MAP_IMPLEMENTATION_AUDIT_v0.1

```yaml
document_id: JUDEBIBLE_CURRENT_MAP_IMPLEMENTATION_AUDIT
version: v0.1
status: INITIAL_CANONICAL_REPRESENTATIVE
owner: 09_앱기획_도이치리베_내부도구
canonical_path: F:\Projects\웹앱\docs\architecture\JUDEBIBLE_CURRENT_MAP_IMPLEMENTATION_AUDIT_v0.1.md
created_from_verified_implementation_evidence: true
production_code_mutation: NONE
research_truth_mutation: NONE
registry_creation: NONE
geometry_creation: NONE
baseline_reference: 5183808
```

## 1. Purpose and authority boundary

이 문서는 현재 JudeBible Context 지도 구현의 검증된 상태를 한 곳에 누적하는 최초 audit 대표본이다.
새 연구 사실을 만들거나 geometry를 승인하는 문서가 아니다.
구현·연구·제품 계약 사이의 현재 경계를 기록한다.

보존 원칙:
- 현재 코드와 연구자산에서 확인된 사실만 기록한다.
- fixture/sample renderer와 승인 연구자산을 구분한다.
- semantic relation과 spatial geometry를 구분한다.
- 누락된 geometry를 추론하지 않는다.
## 2. Baseline reference

```yaml
baseline:
  declared_reference: 5183808
  verification_source: F:\Projects\웹앱\QA_REPORT.md
  observed_note: >
    QA_REPORT는 IMPLEMENT_JUDEBIBLE_EXPLORE_WORKSPACE_v0.1의 brief가
    git checkpoint 5183808을 명시한다고 기록한다.
  repository_state_at_that_note: >
    해당 폴더는 git repository가 아니어서 checkpoint를 직접 검증하지 못했고,
    pre-change app.js / index.html / styles.css를 baseline/explore-pre/에 보존했다고 기록한다.
```

따라서 이 audit은 5183808을 기존 brief가 선언한 baseline reference로 기록하되,
현재 파일시스템에서 검증된 git commit이라고 승격하지 않는다.

## 3. Current map renderer / basemap audit

### 3.1 Abstract sample renderer

현재 app.js의 mapSvg()는 기존 sample SVG renderer를 유지한다.
장소 fixture의 x/y를 사용하며 실제 위도/경도로 해석하지 않는다.

Route sample line은 activeRoute().place_ids의 sample x/y를 연결하는 SVG polyline이다.
이는 승인 연구 Route geometry가 아니며 fixture/sample interaction에만 속한다.
### 3.2 Geographic renderer

현재 geographic map foundation은 실제 lat/lon을 Web Mercator로 투영한다.
샘플 SVG의 x/y를 lat/lon으로 변환하지 않는다.

```yaml
geographic_renderer:
  projection: WEB_MERCATOR
  input: real_lat_lon_only
  marker_source: research.spatial
  invalid_coordinate_behavior: DO_NOT_RENDER
  unknown_role_or_status_behavior: DO_NOT_RENDER
```

현재 marker 상태 규칙:
- VERIFIED_ARCHAEOLOGICAL_SITE → archaeology/site marker
- MODERN_CITY_REFERENCE → modern-context marker
- verified biblical primary coordinate → reader location status가 허용하는 경우 marker
- DISPUTED / VERIFY / LIKELY / PLAUSIBLE biblical place가 exact primary coordinate를 갖지 않아도, 이미 승인된 고고학 후보점 또는 source가 LEADING_LOCATION_HYPOTHESIS로 지정한 대표 후보점이 있으면 presentation-only inferred place marker를 허용한다.
- presentation-only inferred place marker는 일반 성경 지명과 같은 점 형태를 사용하되 지명 옆에 작은 `?`를 표시한다.
- 해당 점은 canonical primary coordinate가 아니며 source research coordinate/certainty를 변경하지 않는다.
- 대표 후보점조차 없거나 UNKNOWN / HOLD이면 marker를 만들지 않는다.

geoMarkers()는 모든 연구 장소에 동일한 코드 경로를 사용하고,
각 source marker를 markerSpec()으로 검증한다. presentation-only inferred place marker는 별도 display gate에서 후보점 자격을 검증하며 canonical spatial model로 역기록하지 않는다.

### 3.3 Basemap

geographic view의 OSM raster tile은 opt-in이며 기본 OFF이다.
외부 tile loading은 사용자가 켠 경우에만 발생한다.
표기는 © OpenStreetMap contributors로 기록되어 있다.
기본 geographic view는 Web Mercator 좌표계의 grid/marker SVG이며,
OSM raster가 반드시 필요한 구조가 아니다.

```yaml
basemap_status:
  abstract_sample_map: PRESENT
  geographic_grid_renderer: PRESENT
  osm_raster_tiles: OPTIONAL_DEFAULT_OFF
  authoritative_historical_basemap: NOT_ESTABLISHED
```

## 4. Research spatial binding audit

현재 tools/pipeline/normalize.js는 structured research input에서
people / events / places / routes를 읽되 identity resolution 또는 geometry를 수행하지 않는다.

공통 spatial read model:
```yaml
schema: JBC_SPATIAL_READ_MODEL_v0.1
subject:
  stable_id: source_record_stable_id
  kind: Place
primary:
  coordinates: source_only
  marker: fail_closed
certainty:
  identity: preserved
  coordinate: preserved
  reader_location_status: preserved
```
spatial model 계속:
```yaml
sites: source_candidate_sites_only
region:
  boundary: null
routes:
  geometry: null
verify_hold:
  verify: preserved_ids
  hold: preserved_count
```

정규화 정책은 source에 없는 coordinate, boundary, route geometry를 계산하지 않는다.
candidate site는 primary place와 자동 등치하지 않는다.

## 5. Spatial read model verification evidence

validate.js의 V36은 다음을 강제한다.
- spatial identity는 research record stable_id와 정렬된다.
- identity certainty와 coordinate certainty는 분리되어 그대로 보존된다.
- primary coordinates는 source record와 동일해야 한다.
- verified coordinate/status/certainty 없이는 primary marker를 그리지 않는다.
- Region은 invented boundary/point/geometry를 가질 수 없다.
- Route는 invented geometry를 가질 수 없다.
- VERIFY/HOLD는 보존되어야 한다.
- marker가 0개이면 degradation reason이 필요하다.
- candidate site는 primary identity와 자동 등치되지 않는다.
검증 증거:
```yaml
pipeline_regression:
  node: 105/105 PASS
  spatial_suite: S01-S08 PASS
  negative_spatial_suite: N42-N50 PASS
browser_regression_recorded_in_QA_REPORT:
  geo: 12/12 PASS
  pl: 23/23 PASS
  bs: 17/17 PASS
```

실제 Jude_Research vault를 사용한 이전 검증에서
Beersheba와 Gerar는 각각 V36 35/35 checks를 통과했다.

Beersheba:
- primary biblical point는 좌표 미확정
- Tel Be'er Sheva는 승인된 archaeological candidate이며 presentation-only 대표 추정점으로 사용할 수 있음
- 지도에서는 `브엘세바 ?`로 표시하되 canonical primary coordinate는 계속 null
- modern Beersheba reference는 별도 참고 marker로 유지
- Region boundary 없음
- Route geometry 없음

Gerar:
- primary biblical point 없음
- Tel Haror / Tell Abu Hureira가 source에서 LEADING_LOCATION_HYPOTHESIS로 명시되어 presentation-only 대표 추정점으로 사용할 수 있음
- 지도에서는 `그랄 ?`로 표시하되 canonical primary coordinate는 계속 null
- competing candidates는 자동 대표점으로 승격하지 않음
- Region geometry NOT_ASSIGNED
- Route geometry NOT_ASSIGNED
## 6. Region / Route / Terrain renderer status

```yaml
renderer_status:
  Place:
    geographic_marker_renderer: IMPLEMENTED
    source: research.spatial
    fail_closed: true

  Route:
    sample_fixture_polyline_renderer: PRESENT
    approved_research_geometry_renderer: NOT_IMPLEMENTED
    approved_route_geometry_assets: 0

  Region:
    architecture_layer_defined: true
    authoritative_boundary_renderer: NOT_IMPLEMENTED
    approved_region_geometry_assets: 0

  Terrain:
    architecture_layer_defined: true
    authoritative_research_terrain_renderer: NOT_IMPLEMENTED
```

Route/Region/Terrain은 architecture lock에서 지도 레이어로 정의되어 있다.
그러나 layer definition은 현재 authoritative renderer 구현 증거와 동일하지 않다.

현재 app.js에서 lay.route는 sample mapSvg() polyline에 사용된다.
lay.region 또는 lay.terrain에 대응하는 authoritative renderer는 확인되지 않았다.
terrain은 architecture requirement/미디어 맥락에서 존재하지만
현재 map geometry renderer 근거는 없다.

## 7. Approved Region / Route geometry asset audit

감사 범위:
- G:\내 드라이브\Projects\옵시디언\Jude_Research
- F:\Projects\웹앱

결과:
```yaml
approved_geometry_assets:
  region_polygon: 0
  region_multipolygon: 0
  route_linestring: 0
  route_multilinestring: 0
  geojson_authoritative_assets: 0
```

확인된 semantic assets:
- Beersheba: Region identity + 2 Route semantic relations, geometry NOT_ASSIGNED
- Gerar: Region description + 3 Route semantic relations, geometry NOT_ASSIGNED
- Achaia: Region identity exists; polygon NOT_CREATED, centroid NOT_CREATED, exact boundary VERIFY

Achaia의 AD 125 Wikimedia map은 historical-context media이며
바울 시대 exact boundary geometry로 승인되지 않았다.
따라서:
```yaml
semantic_region_route_assets: EXIST
approved_spatial_geometry_assets: NONE
geometry_inference_from_semantics: PROHIBITED
historical_map_tracing: PROHIBITED
fixture_conversion: PROHIBITED
```

## 8. Minimum approved Region geometry research input contract

```yaml
REGION_MINIMUM_INPUT_CONTRACT:
  required:
    - stable_id
    - region_identity
    - period_or_temporal_scope
    - geometry_type
    - boundary_geometry
    - geometry_precision
    - geometry_basis
    - source
    - source_locator
    - geometry_certainty
    - identity_certainty
    - VERIFY_HOLD
    - approval_status
```

Allowed geometry types: POLYGON, MULTIPOLYGON.
geometry_precision은 EXACT / APPROXIMATE / GENERALIZED를 구분한다.
identity certainty와 geometry certainty를 합치지 않는다.
source locator는 null일 수 없으며 실제 근거 위치로 resolve되어야 한다.

## 9. Minimum approved Route geometry research input contract

```yaml
ROUTE_MINIMUM_INPUT_CONTRACT:
  required:
    - stable_id
    - route_identity
    - start_end_semantics
    - period_or_event_context
    - geometry_type
    - route_geometry
    - geometry_precision
    - geometry_basis
    - source
    - source_locator
    - geometry_certainty
    - VERIFY_HOLD
    - approval_status
```

Allowed geometry types: LINESTRING, MULTILINESTRING.

start/end semantics 또는 place sequence만으로 authoritative research route geometry를 계산하지 않는다.
semantic relation의 존재는 spatial geometry 승인과 동일하지 않다.

Captain approval dated 2026-10-04 adds one presentation-only exception:
- an existing approved movement semantic may be shown as a dotted/dashed PRESENTATION_ONLY_INFERRED_ROUTE when at least two already-available display anchors resolve;
- this transient display polyline is not route_geometry, is not persisted into research projection, and does not weaken geometry HOLD;
- reader language must identify it as 추정 이동 경로 / 실제 이동 경로 미확정.
## 10. Geometry source and certainty gates

Historical reference map은 evidence/context가 될 수 있으나
자동으로 authoritative geometry가 되지 않는다.

```yaml
certainty_dimensions:
  identity_certainty: object_identity_confidence
  geometry_certainty: supplied_shape_confidence
  geometry_precision: exact_vs_approximate_vs_generalized
```

ACCEPT research input only when:
- stable identity가 명시됨
- temporal/event scope가 명시됨
- 허용된 geometry type과 실제 payload가 존재함
- geometry basis가 존재함
- source와 resolvable locator가 존재함
- identity/geometry certainty가 분리됨
- VERIFY/HOLD가 명시됨
- approval scope가 geometry 자체를 포함함

REJECT as authoritative research geometry when:
- endpoint에서 route_geometry를 계산함
- region name 또는 center point에서 polygon을 계산함
- fixture x/y를 research geometry로 변환함
- historical image를 승인 없는 tracing으로 geometry화함
- app이 누락 coordinate/geometry를 채움
HOLD when:
- competing geometry가 해소되지 않음
- temporal boundary가 불명확함
- source authority 또는 approval lineage가 불명확함
- geometry certainty가 정의되지 않음

## 11. Mapping to current spatial read model

현재 JBC_SPATIAL_READ_MODEL_v0.1은 approved Region/Route geometry를
직접 소비하도록 승인된 계약이 아니다.

```yaml
mapping:
  region_stable_id:
    current_equivalent: spatial.region.stable_ref
    status: PARTIAL
  region_boundary_geometry:
    current_equivalent: spatial.region.boundary
    current_required_value: null
    projection_status: NOT_AUTHORIZED
  route_identity:
    current_equivalent: spatial.routes[].label
    status: PARTIAL
  route_stable_id:
    current_equivalent: NONE
    projection_status: NOT_AUTHORIZED
  route_geometry:
    current_equivalent: spatial.routes[].geometry
    current_required_value: null
    projection_status: NOT_AUTHORIZED
  presentation_only_inferred_route:
    current_equivalent: TRANSIENT_DISPLAY_ONLY
    research_persistence: PROHIBITED
    style: DOTTED_OR_DASHED
    reader_label: 추정 이동 경로
    projection_status: PRESENTATION_ALLOWED_BY_CAPTAIN_2026_10_04
```
따라서 future approved geometry research asset이 생겨도
현재 spatial model과 V36에 즉시 주입하거나 map에 렌더링하지 않는다.

runtime consumption 전에 별도 제품 요구사항/implementation handoff가 필요하며,
V36 successor 또는 명시적 확장 계약이 별도로 승인되어야 한다.

## 12. VERIFY / HOLD preservation boundary

```yaml
VERIFY:
  research_asset_allowed: true
  authoritative_geometry_rendering: false
  behavior: FAIL_CLOSED_OR_NON_AUTHORITATIVE

HOLD:
  research_asset_allowed: true
  geometry_projection: prohibited
  authoritative_rendering: prohibited
```

identity가 확정되어도 geometry가 VERIFY/HOLD이면 geometry는 비워 둔다.
geometry가 있어도 identity 또는 approval lineage가 해결되지 않으면 소비하지 않는다.

현재 parent research record의 VERIFY/HOLD 의미를 spatial projection이 약화시키면 안 된다.
현재 spatial model은 verify id들과 hold count를 보존한다.
## 13. Runtime preservation boundary

```yaml
PRESERVE:
  - JBC_SPATIAL_READ_MODEL_v0.1
  - stable_id
  - V36
  - S01_S08
  - fail_closed_marker_rules
  - no_inferred_geometry
  - Beersheba_semantics
  - Gerar_semantics
  - Achaia_semantics
  - current_geographic_marker_renderer

DO_NOT_CHANGE_BY_THIS_AUDIT:
  - production_code
  - research_truth
  - registry
  - geometry_assets
  - current_V36_behavior
```

## 14. Explicit non-goals

이 audit은 다음을 하지 않는다.
- Region polygon 생성
- Route polyline 생성
- coordinate 추론
- semantic relation에서 geometry 생성
- historical map tracing
- fixture를 research asset으로 승격
- Terrain geometry 설계 또는 생성
- 현재 spatial schema redesign
- 연구 상태 upgrade
- BAT01 PLACE/REG namespace 임의 해결

## 15. Current decision

```yaml
audit_result:
  current_place_geographic_renderer: VERIFIED_PRESENT
  current_basemap:
    geographic_grid: PRESENT
    osm_raster: OPTIONAL_DEFAULT_OFF
    sample_svg: PRESENT

  current_research_spatial_binding: VERIFIED_PRESENT
  spatial_read_model_QA: PASS

  region_renderer:
    authoritative_geometry: NOT_IMPLEMENTED
  route_renderer:
    fixture_sample: PRESENT
    authoritative_geometry: NOT_IMPLEMENTED
  terrain_renderer:
    authoritative_research_geometry: NOT_IMPLEMENTED

  approved_region_route_geometry_assets: 0
  geometry_research_input_contract: DEFINED

  runtime_action: PRESERVE_CURRENT_IMPLEMENTATION
  production_code_change: NONE
```

## 16. Next authorization boundary

실제 Region/Route geometry 연구는 명시적으로 승인될 때에만
01_목회연구_WORBS_BICS 관할에서 수행한다.

그 전까지 JudeBible Context는 현재 fail-closed spatial behavior를 유지한다.
