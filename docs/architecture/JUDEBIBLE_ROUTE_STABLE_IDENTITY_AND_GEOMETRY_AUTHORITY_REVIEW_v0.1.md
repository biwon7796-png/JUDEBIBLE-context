# JUDEBIBLE ROUTE STABLE IDENTITY AND GEOMETRY AUTHORITY REVIEW v0.1

status: PARTIALLY_SUPERSEDED_BY_CAPTAIN_PRESENTATION_ROUTE_APPROVAL
date: 2026-10-04
task: PREPARE_ROUTE_STABLE_IDENTITY_AND_GEOMETRY_AUTHORITY_REVIEW_FROM_EXISTING_APPROVED_ROUTE_SEMANTICS
authority_effect: NONE_UNTIL_CAPTAIN_APPROVAL
production_code_mutation: NONE
research_truth_mutation: NONE
geometry_creation: NONE
registry_mutation: NONE

## 1. Decision requested

This review separates two authorities that must not be conflated:

1. ROUTE_IDENTITY_AUTHORITY
   - whether an explicit route semantic row in an approved parent research asset may receive a stable JudeBible Route identity.

2. ROUTE_GEOMETRY_AUTHORITY
   - whether an identified Route may carry/render authoritative LINESTRING or MULTILINESTRING geometry.

Recommended decision:
- APPROVE ROUTE_IDENTITY_AUTHORITY for the seven explicit route semantic rows below, as ASSET_LOCAL canonical Route objects.
- RETAIN HOLD on ROUTE_GEOMETRY_AUTHORITY for all seven.
- Do not infer authoritative research geometry from endpoint names, place sequences, narrative order, fixture coordinates, or historical maps. Presentation-only dotted inference is separately authorized under its own display gate.

This review itself did not grant either authority. On 2026-10-04, Captain separately approved PRESENTATION_ONLY_INFERRED_ROUTE rendering with dotted/dashed styling while retaining research geometry HOLD. Stable Route identity remains a separate decision and is not created by that presentation approval.

## 2. Existing source inventory

### 2.1 Beersheba — 2 explicit route semantics
Parent asset:
- JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
- parent stable identity: JBC-CR-PLACE-BEERSHEBA-001

Source semantics:
1. Moriah_to_Beersheba_return
   - evidence/context: Genesis 22:19
   - research relation: Moriah episode route_returns_to_place Beersheba
   - narrative certainty: HIGH narrative
   - geometry certainty: LOW / exact intermediate geometry not fixed
   - source map state: geometry NOT_ASSIGNED

2. Rehoboth_area_to_Beersheba
   - evidence/context: Genesis 26:22-23
   - research relation: Rehoboth area route_connects_places Beersheba
   - narrative certainty: HIGH narrative
   - geometry certainty: LOW
   - source map state: geometry NOT_ASSIGNED

Source explicitly states:
- reason: exact intermediate ancient locations insufficiently fixed

### 2.2 Gerar — 3 explicit route semantics
Parent asset:
- JBC_GERAR_CONNECTED_WORBS_20260930_01
- parent stable identity: JBC-CR-PLACE-GERAR-001
- existing parent approval: CAPTAIN_APPROVED via ingest.config.json override

Source semantics:
1. Abraham_Negev_context_to_Gerar
   - basis: Genesis_20_1
   - ordered_relation: supported
   - geometry: NOT_ASSIGNED

2. Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba
   - basis: Genesis_26_17_23
   - ordered_relation: supported
   - geometry: NOT_ASSIGNED

3. Abimelech_delegation_Gerar_to_Beersheba
   - basis: Genesis_26_23_26
   - ordered_relation: supported
   - geometry: NOT_ASSIGNED

Source geometry policy:
- invented_geometry: prohibited

### 2.3 Achaia — 2 explicit route semantics
Parent asset:
- JBC_ACHAIA_CONNECTED_WORBS_20260930_01
- parent stable identity: BAT01-PLACE-0016
- existing identity approval record: APR-JBC-ACHAIA-IDBIND-20261002-001

Source semantics:
1. Macedonia_to_Achaia
   - evidence: Acts 19:21
   - geometry: NONE

2. Athens_to_Corinth
   - evidence: Acts 18:1
   - geometry: NONE

The parent asset separately retains HOLD on inferred_route_geometry.

## 3. Current authority boundary

The current approved map audit states:
- semantic Route assets exist.
- approved Route geometry assets: 0.
- spatial.routes[].label is only a PARTIAL route identity equivalent.
- route_stable_id current equivalent: NONE.
- route_stable_id projection_status: NOT_AUTHORIZED.
- route_geometry current required value: null.
- route_geometry projection_status: NOT_AUTHORIZED.
- endpoint / place sequence must not be converted into a line.
- semantic relation is not geometry approval.

Therefore the seven source rows are valid route semantics but are not yet independently authorized stable Route identities.

## 4. Proposed minimal stable identity policy — CANDIDATE ONLY

The following policy is proposed for Captain approval; it is not active until approved.

RULE R1 — Source-row identity
A Route stable identity may be created only for an explicit route semantic row already present in an approved parent asset.

RULE R2 — ASSET_LOCAL scope
The first Route identity is ASSET_LOCAL to the approved parent asset. It does not imply a global cross-asset merge.

RULE R3 — No name-based merge
Same/similar route labels in two assets are not the same Route unless a later explicit crosswalk approves equivalence.

RULE R4 — Stable ID assignment
Stable IDs are assigned as opaque JudeBible identities, not calculated from geography and not inferred as global identity from the label.

Candidate ID set for review only:
- JBC-CR-ROUTE-BEERSHEBA-001  ← Moriah_to_Beersheba_return
- JBC-CR-ROUTE-BEERSHEBA-002  ← Rehoboth_area_to_Beersheba
- JBC-CR-ROUTE-GERAR-001       ← Abraham_Negev_context_to_Gerar
- JBC-CR-ROUTE-GERAR-002       ← Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba
- JBC-CR-ROUTE-GERAR-003       ← Abimelech_delegation_Gerar_to_Beersheba
- JBC-CR-ROUTE-ACHAIA-001      ← Macedonia_to_Achaia
- JBC-CR-ROUTE-ACHAIA-002      ← Athens_to_Corinth

These IDs are CANDIDATE_ONLY and MUST NOT enter projection/registry until Captain approval.

RULE R5 — Parent authority preservation
Each Route preserves:
- parent_asset_id
- parent source_refs and exact source hash
- source_locator
- passage/evidence as written
- certainty / VERIFY / HOLD as written
- parent approval lineage

Parent approval is not automatically broadened into geometry approval.

## 5. Proposed canonical Route object — identity only

If Captain approves identity-only activation, the minimal object contract is:

```yaml
Route:
  stable_id: <approved candidate id>
  type: Route
  scope: ASSET_LOCAL
  parent_asset_id: <approved parent>
  display_label: <exact source route_label or narrative_relation>
  passage_refs: <source basis/evidence only>
  source_refs: <parent exact source refs>
  source_locator: <exact route row>
  authority:
    approval_scope: ROUTE_IDENTITY_ONLY
    registry_effect: NONE
  geometry:
    type: null
    coordinates: null
    status: NOT_AUTHORIZED
  reader:
    published: false
  activation:
    publishable: false
```

No route line is produced.

## 6. Geometry review

### Current result
All seven routes: GEOMETRY_HOLD.

Reason by group:
- Beersheba: exact intermediate ancient locations insufficiently fixed.
- Gerar: source explicitly says NOT_ASSIGNED and invented_geometry prohibited.
- Achaia: source explicitly says geometry NONE and retains inferred_route_geometry HOLD.

### Geometry may be reconsidered only with a separate approved research input containing
- stable_id
- route_identity
- start_end_semantics
- period_or_event_context
- LINESTRING or MULTILINESTRING payload
- geometry_precision
- geometry_basis
- source
- resolvable source_locator
- geometry_certainty
- VERIFY_HOLD
- approval_status whose scope explicitly includes geometry

No current asset satisfies this geometry contract.

## 7. Captain decision options

### OPTION A — RECOMMENDED
APPROVE_IDENTITY_ONLY_FOR_7_ASSET_LOCAL_ROUTES_AND_RETAIN_ALL_GEOMETRY_HOLD

Effect:
- creates seven stable Route identities from existing explicit semantic rows.
- allows Knowledge Graph linkage and future Timeline/Detail use.
- does not draw route lines.
- does not create global cross-asset equivalence.
- does not alter research truth.

### OPTION B
APPROVE_ONLY_BEERSHEBA_AND_GERAR_ROUTE_IDENTITIES_RETAIN_ACHAIA_HOLD

Use only if Achaia narrative_relation is judged too broad for Route object identity at this stage.

### OPTION C
RETAIN_ALL_ROUTE_IDENTITY_HOLD

Effect:
- current spatial.routes[] semantic read model remains unchanged.
- no canonical Route objects are created.

### PRESENTATION AUTHORITY — NOW APPROVED SEPARATELY
PRESENTATION_ONLY_INFERRED_ROUTE is allowed for existing approved movement semantics when the display eligibility gate resolves at least two existing presentation anchors. It must be dotted/dashed and labeled as uncertain. It is not canonical route_geometry and is never persisted as research geometry.

### NOT AN AVAILABLE OPTION IN THIS REVIEW
APPROVE_AUTHORITATIVE_ROUTE_GEOMETRY

Reason:
- approved geometry payloads do not exist.

## 8. Recommended Captain approval token

If OPTION A is intended, the explicit approval token should be:

CAPTAIN_APPROVE_ROUTE_IDENTITY_ONLY_FOR_7_EXISTING_ASSET_LOCAL_ROUTE_SEMANTICS_WITH_ALL_GEOMETRY_RETAINED_HOLD

This approval must be interpreted narrowly:
- identity only
- seven listed source rows only
- ASSET_LOCAL
- registry_effect NONE
- no geometry
- no public release
- no cross-asset merge

## 9. Post-approval implementation boundary

Only after the approval token above:
1. add an explicit Route identity binding record / approval evidence for the seven rows.
2. implement the canonical Route source adapter using those exact bindings.
3. bind Route → parent asset and explicit passage/evidence.
4. keep geometry null and status NOT_AUTHORIZED.
5. run dedicated Route adapter regression plus the full existing pipeline regression.

No map renderer change is authorized by identity-only approval.
