# JudeBible continuation handoff — 2026-10-04

status: ACTIVE_CONTINUATION
purpose: Continue JudeBible design/implementation in a new chat without redoing recovery.

## Authoritative / working roots
- Jude_Research vault: G:\내 드라이브\Projects\옵시디언\Jude_Research
- JudeBible app working tree: F:\Projects\웹앱
- Atlantis runtime: F:\Projects\Atlantis
- Hezekiah Lite runtime: F:\Projects\Hezekiah_Lite
- Hezekiah Google Drive live mirror: G:\내 드라이브\Projects\Hezekiah_Lite\workspace\live

## Local preview
- http://127.0.0.1:8765/
- server root: F:\Projects\웹앱
- current server command: python -m http.server 8765 --bind 127.0.0.1

## Recovered research-to-app route
Approved research + Captain approval
→ Jude_Research
→ JudeBible pipeline
→ projection.research.js + scripture.index.js + contextual.research.js
→ implemented JudeBible surfaces.
Timeline UI is not designed; only timeline data binding is prepared.

## Recovered research-to-knowledge route
Approved research + Captain approval
→ Atlantis
→ research asset / RUN_PASS
→ Hezekiah candidate
→ embedding / indexing
→ F live
→ additive automatic copy to Google Drive live.

## CH26 status
- Atlantis ingest: PASS
- Hezekiah candidate/live: PASS
- F→G live sync: PASS
- live doc: doc_bc56dba5194b
- contextual projection preserves candidate != canonical and same_name != same_entity.
- CH26 passage bindings: Joshua 19:15; Judges 12:8–10.
- canonical_promotion: PROHIBITED
- public_projection: BLOCKED
- internal JudeBible contextual projection is enabled; external/public release remains separate.

## JudeBible automation restored
Added/connected:
- tools/pipeline/contextual-research.js
- data/contextual.research.js
- tools/pipeline/test-contextual.js
- main pipeline auto-refresh of contextual projection
- contextual consumption in Detail/overview, Related Scripture, Navigation, Search
- map HOLD notice for non-canonical place candidates
- Timeline data binding only; no Timeline UI design

Regression state:
- Contextual projection: 11/11 PASS
- Promotion: 8/8 PASS
- Relation binding: 8/8 PASS
- Watcher: 12/12 PASS
- Main pipeline: 110/110 PASS

## Existing approved design direction confirmed
Do not invent a new ontology. Reconcile and complete the existing approved objects:
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
View projection:
- GuideTopic
- GuideStep
Bible_Passage remains the center.
All implemented surfaces should consume the same graph/store.
Timeline is a later UI design task but should consume the same Event/Period/Route/Passage data.

## Important design docs already reviewed
- F:\Projects\웹앱\docs\architecture\JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1.md
- F:\Projects\웹앱\docs\architecture\JUDEBIBLE_CONTEXT_CONNECTED_RESEARCH_AND_MAP_MEDIA_LOCK_v0.1.md
- F:\Projects\웹앱\docs\architecture\JUDEBIBLE_CONTEXT_NAVIGATION_AND_HIERARCHICAL_BIBLE_EXPLORATION_LOCK_v0.1.md
- F:\Projects\웹앱\docs\architecture\JUDEBIBLE_CONTEXT_TIMELINE_MAP_GUIDE_INTERACTION_LOCK_v0.1.md
- F:\Projects\웹앱\docs\architecture\JUDEBIBLE_ENTITY_EXPLORER_AND_SMALL_UX_REFINEMENTS_LOCK_v0.2.md
- G:\내 드라이브\Projects\옵시디언\Jude_Research\99_운영문서\JUDE_RESEARCH_AUTOMATIC_KG_ACCUMULATION_PIPELINE_v0.1_BIBLE_CENTERED_CONTEXTUAL_ADDITIVE_REQUIREMENT.md
- G:\내 드라이브\Projects\옵시디언\Jude_Research\99_운영문서\JUDE_RESEARCH_AUTOMATIC_KG_ACCUMULATION_PIPELINE_v0.1_BIBLE_CENTERED_THREE_LAYER_CONTEXT_HIERARCHY_ADDITIVE_REQUIREMENT.md

## Current next design task
RECONCILE_AND_COMPLETE_EXISTING_JUDEBIBLE_RESEARCH_OBJECT_KNOWLEDGE_GRAPH_CONTRACT

Meaning:
Do not create a new Unified Knowledge Model. Complete the already-approved JudeBible research object / graph contract and align current code to it, then implement missing adapters in priority order, especially Event, Route, Person/shared store, with Timeline data kept ready but UI design deferred.
