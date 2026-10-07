# JUDEBIBLE RESEARCH OBJECT KNOWLEDGE GRAPH CONTRACT — RECONCILED v0.1

status: IMPLEMENTATION_RECONCILED
date: 2026-10-04
task: RECONCILE_AND_COMPLETE_EXISTING_JUDEBIBLE_RESEARCH_OBJECT_KNOWLEDGE_GRAPH_CONTRACT

## Authority boundary
This document does not create a new ontology. It reconciles the existing approved JudeBible objects and implementation locks.

Bible_Passage remains the center.

Existing research objects:
- Place
- Person
- Event
- Route
- Region
- Relation
- Claim
- Evidence
- PassageLink
- MediaAsset

View projection only:
- GuideTopic
- GuideStep

## Shared object base
All canonical/approved research objects use explicit stable identity and preserve source authority.

Required/common contract:
- stable_id
- display_label
- aliases when present
- passage_refs when present
- source_refs
- source_locator when present
- certainty when present
- status
- authority
- VERIFY/HOLD state when present

Rules:
- same_name != same_entity
- candidate != canonical
- missing values are not inferred
- projection may not strengthen source status
- VERIFY/HOLD is preserved
- relations are not created from wikilinks or keyword similarity

## Runtime projection contract
The JudeBible shared store consumes approved projection groups through one stable-id path:
- persons / people
- places
- regions
- events
- routes

Event and Route are now accepted by the same projection/store identity layer as Person/Place/Region. Their absence from current canonical data does not authorize synthetic records.

## Contextual research graph contract
Jude_Research ResearchNote assets remain contextual/candidate evidence unless separately promoted by existing authority.

contextual.research.js schema:
- JBC_CONTEXTUAL_RESEARCH_PROJECTION_v0.2

Added projections:
- object_index.person
- object_index.place
- object_index.event
- object_index.route
- relation_index
- timeline_bindings[].persons
- timeline_bindings[].places
- timeline_bindings[].events
- timeline_bindings[].routes

These retain CANDIDATE_ONLY_NO_PROMOTION and do not enter the canonical shared store automatically.

## Timeline boundary
Timeline data binding is ready from the same object graph.
Timeline UI design remains deferred.

## Adapter boundary
Current main canonical ingest remains authoritative for its implemented source adapters.

Event source authority was subsequently resolved from the existing approved Gerar research asset:
- source asset: JBC_GERAR_CONNECTED_WORBS_20260930_01
- source SHA256: 6f9933d413bc0d675767df52c94bdc72fadce835407054227007a059a6f75937
- approval: CAPTAIN_APPROVED via existing ingest.config.json override
- exact source section: §6.3 Event
- explicit Event identities: 6
- identity scope: ASSET_LOCAL
- registry_effect: NONE

The Event adapter projects only explicit event_id records from an already approved parent asset. It does not infer Event identities from labels, related_events prose, keywords, or routes. Parent approval is preserved as PARENT_ASSET_CONTENT scope; it is not converted into global Event Registry authority. Reader/public exposure remains blocked unless separately authorized.

Route authority was then explicitly re-resolved against the existing approved research assets and the current map contract. Route research data exists in Beersheba, Gerar, and Achaia as route labels / narrative relations with textual basis and geometry states such as NONE or NOT_ASSIGNED. However no source in Jude_Research declares route_id, route_stable_id, JBC-CR-ROUTE-* identity, or another approved stable Route identity.

The current approved map audit requires stable_id and route_identity for Route research input, and states that spatial.routes[].label is only PARTIAL, route_stable_id has current equivalent NONE with projection_status NOT_AUTHORIZED, and route_geometry must remain null / NOT_AUTHORIZED. Therefore route_label or narrative_relation cannot be promoted into canonical Route identity, and endpoints or narrative sequence cannot be used to synthesize geometry.

Route resolution result:
- existing Route semantic data: FOUND
- explicit stable Route identity: NOT_FOUND
- approved stable-id derivation rule from route_label: NOT_FOUND
- geometry approval: NOT_FOUND
- current canonical Route projection activation: HOLD_FAIL_CLOSED
- current spatial.routes[] semantic read model: PRESERVED_AS_NON_CANONICAL_ROUTE_DATA
- synthetic stable identity / inferred authoritative research geometry: PROHIBITED

Therefore:
- shared consumption adapter: COMPLETE for Person/Place/Region/Event/Route
- contextual candidate graph adapter: COMPLETE
- canonical Event source adapter: COMPLETE_FROM_APPROVED_PARENT_ASSET
- canonical Person source parser: HOLD_UNTIL_EXPLICIT_STRUCTURED_SOURCE_CONTRACT_OR_REAL_APPROVED_RECORD
- canonical Route source parser: HOLD_MISSING_EXPLICIT_STABLE_ROUTE_IDENTITY
- authoritative Route research geometry: RETAIN_HOLD
- presentation-only inferred dotted Route rendering: AUTHORIZED_2026_10_04_WHEN_DISPLAY_ANCHORS_RESOLVE
- synthetic identity or inferred promotion into research truth: PROHIBITED

## Verification
- Event adapter dedicated regression: 10/10 PASS
- contextual graph regression: 16/16 PASS
- main pipeline regression: 110/110 PASS
- relation binding regression: 8/8 PASS
- watcher regression: 12/12 PASS
- app.js syntax: PASS
- contextual-research.js syntax: PASS
- run.js / normalize.js / relation-binding.js syntax: PASS
