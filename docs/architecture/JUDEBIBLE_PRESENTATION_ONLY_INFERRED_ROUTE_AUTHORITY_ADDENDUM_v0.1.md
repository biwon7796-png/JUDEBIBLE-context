# JUDEBIBLE PRESENTATION-ONLY INFERRED ROUTE AUTHORITY ADDENDUM v0.1

status: CAPTAIN_APPROVED_ACTIVE
date: 2026-10-04
task: REVISE_ROUTE_AUTHORITY_TO_ALLOW_PRESENTATION_ONLY_DOTTED_INFERRED_ROUTES_WITH_RESEARCH_GEOMETRY_RETAINED_HOLD
captain_authorization: EXPLICIT_IN_CHAT
authority_scope: PRESENTATION_ONLY_ROUTE_INFERENCE
research_truth_mutation: NONE
canonical_route_geometry_mutation: NONE
registry_effect: NONE
public_release_authority: NONE

## 1. Decision

JudeBible may render a dotted/dashed route for an existing research-supported movement relation even when exact historical route geometry is not established.

This permission applies only to the presentation layer.

The following remain distinct:

RESEARCH_ROUTE_GEOMETRY
- authoritative spatial claim
- remains null / NONE / NOT_ASSIGNED / HOLD unless separately researched and approved
- may not be synthesized from endpoints, narrative order, reference labels, or fixture coordinates

PRESENTATION_ONLY_INFERRED_ROUTE
- visual explanation of an already-supported movement relation
- may be synthesized from available display anchors
- MUST be visibly dotted/dashed
- MUST carry uncertainty language
- MUST NOT be written back into research truth, canonical Route geometry, Registry, or source assets

## 2. Reader language

Preferred reader label:
- 추정 이동 경로

Allowed supporting language:
- 본문에 이동 관계는 있으나 실제 이동 경로는 확정되지 않음
- 정확한 이동선은 미확정
- 연구 내용을 바탕으로 한 개략적 표시

Internal label:
- PRESENTATION_ONLY_INFERRED_ROUTE

Do not present it as:
- 확인된 경로
- 실제 고대 도로
- 확정 이동선
- verified route geometry

## 3. Visual grammar

Authoritative approved route geometry, if separately available in the future:
- solid line

Presentation-only inferred route:
- dotted or dashed line
- visually subordinate to research markers
- uncertainty label available in legend/detail
- no precision-implying intermediate bends unless independently supplied as presentation anchors

Unknown / unusable anchors:
- do not fabricate a line
- degrade to textual movement relation only

## 4. Eligibility gate

A presentation-only inferred route may render only when all are true:
1. an approved research asset explicitly states the movement relation, route label, narrative relation, or ordered sequence.
2. a source passage/evidence locator exists.
3. the route is not under a semantic HOLD that forbids the movement relation itself.
4. every declared presentation anchor for that route semantic can be resolved from already available map/reference data, with at least two anchors total. Partial-anchor route simplification is prohibited.
5. the renderer labels the output as inferred/presentation-only.
6. generated display coordinates are not persisted into research projection as route_geometry.

The route may use display anchors that are already present for map presentation, including:
- approved research marker coordinates;
- approved archaeological/modern/context markers when the display explicitly preserves their role;
- reference-layer place anchors when used only as cartographic context.

Use of a display anchor does not assert that the anchor is the exact ancient point.

## 5. Prohibited operations

This authorization does NOT allow:
- creating canonical route_geometry from the dotted line;
- promoting a display polyline to LINESTRING/MULTILINESTRING research evidence;
- changing Place identity or coordinate certainty;
- tracing historical maps into research geometry;
- converting fixture x/y into research coordinates;
- assigning global Route identity from a route label;
- same-name route merging;
- external publication/release approval.

## 6. Stable identity boundary

Stable Route identity and presentation-only route rendering are independent.

Therefore:
- an explicit stable Route ID is NOT required merely to draw a presentation-only inferred route;
- a presentation route must instead retain a deterministic source binding:
  - parent_asset_id
  - source route label / narrative_relation
  - source locator
  - passage/evidence
  - presentation status

If a stable Route identity is later approved, the presentation object may bind to it without changing the research geometry status.

## 7. Existing approved semantic assets covered

The current authorization covers existing explicit route semantics already present in approved parent research assets, including:
- Beersheba: Moriah_to_Beersheba_return
- Beersheba: Rehoboth_area_to_Beersheba
- Gerar: Abraham_Negev_context_to_Gerar
- Gerar: Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba
- Gerar: Abimelech_delegation_Gerar_to_Beersheba
- Achaia: Macedonia_to_Achaia
- Achaia: Athens_to_Corinth

This does not create seven canonical Route identities.

## 8. Geometry state after this approval

For all current routes:
- research route_geometry: RETAIN_HOLD
- approved authoritative geometry assets: 0
- presentation-only inferred geometry: ALLOWED_WHEN_ELIGIBILITY_GATE_PASSES
- map style: DOTTED_OR_DASHED
- registry effect: NONE

## 9. Implementation requirement

The renderer must keep a hard separation:

research object:
  spatial.routes[].geometry = null

presentation object:
  source = existing research semantic row
  mode = PRESENTATION_ONLY_INFERRED_ROUTE
  geometry = transient display polyline
  style = dotted
  reader_label = 추정 이동 경로
  persisted_to_research = false

QA must prove:
- source research geometry remains null;
- dotted line is presentation-only;
- line disappears when any declared route anchor is unavailable; no partial route is drawn;
- no source/registry files are mutated;
- no solid-line class is used for inferred routes;
- uncertainty label is visible or accessible.
