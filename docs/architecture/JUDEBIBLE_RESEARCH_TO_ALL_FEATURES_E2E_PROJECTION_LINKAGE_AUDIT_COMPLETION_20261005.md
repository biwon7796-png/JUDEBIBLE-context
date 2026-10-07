# JUDEBIBLE_RESEARCH_TO_ALL_FEATURES_E2E_PROJECTION_LINKAGE_AUDIT_COMPLETION_20261005

status: COMPLETE_WITH_AUTHORITY_BOUNDED_INACTIVE_SURFACES
date: 2026-10-05
task: AUDIT_AND_COMPLETE_RESEARCH_TO_ALL_JUDEBIBLE_FEATURES_END_TO_END_PROJECTION_LINKAGE
project: JudeBible_WebApp

## 1. Completion definition

This audit distinguishes three states:

- COMPLETE
  Approved research data exists and the current app consumes it end-to-end.
- CONNECTED_NONPUBLIC
  Approved research data is connected internally, but reader publication remains explicitly false.
- INACTIVE_NO_AUTHORITY
  The runtime path exists, but there is no current approved professional object to project. No object is invented.

The audit does NOT treat "runtime code exists" as equivalent to "professional research data exists".

## 2. Current live research inventory

### Place
count: 2
- JBC-CR-PLACE-BEERSHEBA-001
- JBC-CR-PLACE-GERAR-001

state: COMPLETE

### Region
count: 2
- JBC-CR-PLACE-ACHAIA-001
- JBC-CR-PLACE-AMALEK-001

state: CONNECTED_NONPUBLIC
reason:
- research identity/detail exists
- reader.published remains false
- no geometry is invented

### Event
count: 6
all are asset-local Gerar Event objects:
- JBC-CR-EVENT-GERAR-ABRAHAM-SARAH-01
- JBC-CR-EVENT-GERAR-ISAAC-SOJOURN-01
- JBC-CR-EVENT-GERAR-ISAAC-PROSPERITY-CONFLICT-01
- JBC-CR-EVENT-GERAR-WELLS-01
- JBC-CR-EVENT-GERAR-BEERSHEBA-DELEGATION-01
- JBC-CR-EVENT-GERAR-ASA-01

state: CONNECTED_NONPUBLIC
reason:
- exact stable IDs exist
- exact AUTO_BIND linkage from approved Gerar parent asset exists
- reader.published=false
- activation.publishable=false
- no public search exposure is permitted

### Person
current professional projection count: 0
state: INACTIVE_NO_AUTHORITY

The generic Person projection/detail/search runtime remains available.
No Person professional object is created by this audit.

### Canonical Route
current professional projection count: 0
state: INACTIVE_NO_AUTHORITY

No canonical Route stable ID or geometry is created.

### Presentation-only Route
count: 7
state: COMPLETE_WITHIN_PRESENTATION_AUTHORITY

Current presentation-only routes remain separate from canonical Route entities:
- Moriah_to_Beersheba_return
- Rehoboth_area_to_Beersheba
- Abraham_Negev_context_to_Gerar
- Isaac_Gerar_to_Valley_to_Rehoboth_to_Beersheba
- Abimelech_delegation_Gerar_to_Beersheba
- Macedonia_to_Achaia
- Athens_to_Corinth

## 3. Feature-by-feature linkage matrix

### Scripture text / Scripture Entity Index
state: COMPLETE

- stable-id based Scripture Entity Index remains source-hash gated
- reader-facing tags remain publication-gated
- Place identities resolve correctly
- Region identity remains separate from Place
- unpublished Event objects are not injected into reader Scripture tags

### Full Place Detail
state: COMPLETE

- Beersheba current Full Canonical Place Profile
- Gerar current Full Canonical Place Profile
- internal passage links
- media rights gate
- map uncertainty policy
- Research layer
- exact stable identity
- professional representative source SHA

### Region Detail
state: COMPLETE_NONPUBLIC

- separate Region renderer
- related Scripture
- VERIFY/HOLD preservation
- no guessed coordinate
- no guessed polygon
- no Place conversion
- reader publication remains off

### Event Detail
state: COMPLETE_NONPUBLIC

Added:
- projectedEventFlow()
- exact stable Event selection
- related passage ranges
- scope / certainty / status
- event location / origin / destination when source provides them
- parent research asset link
- source SHA / source ID
- retained VERIFY/HOLD
- explicit "internal research object / non-public" boundary
- explicit no-canonical-promotion note

No Korean event title is invented from model inference.
The source event label is retained and only underscore formatting is normalized visually.

### Route Detail runtime
state: READY_INACTIVE_NO_AUTHORITY

Added:
- projectedRouteFlow()
- generic canonical Route consumer path

But:
- there are currently zero canonical Route records
- no stable Route identity is invented
- no geometry is promoted from presentation-only routes

### Relation graph / related objects
state: COMPLETE_FOR_EXACT_BINDINGS

Before:
- relations
- connected.places

After:
- relations
- connected.places
- connected.people
- connected.events
- connected.routes

Strict gate remains:
- binding.state === AUTO_BIND
- resolved === true
- exact binding.target_id
- no self-link

Result:
- Gerar exact relation graph now contains all 6 bound Event objects internally
- unresolved people remain unbound
- unresolved route labels do not become canonical Route objects
- public related-object display still applies reader visibility

### Place Research layer → internal Event objects
state: COMPLETE_NONPUBLIC

Gerar Full Profile Research details now expose:
- six exact-bound Event stable IDs

This internal list is deliberately restricted to Event / Route research objects.
Non-public Region objects are not injected into Place Detail, preserving Region isolation.

### Reader-facing quick search
state: COMPLETE_WITH_VISIBILITY_GATE

Now future-safe for:
- Person
- Place
- Region
- Event
- Route

But it consumes STORE.list(), so current unpublished Events/Regions remain absent.

Validation:
- unpublished Event does not appear
- in QA only, temporarily changing one Event to published+publishable caused it to enter quick search automatically
- production values were restored immediately

### Dedicated Search Workspace
state: COMPLETE_WITH_VISIBILITY_GATE

Modes supported by runtime:
- Place/Region
- Person
- Event
- Route

Behavior:
- Event/Route mode buttons remain hidden when no reader-visible records exist
- if a professional Event later becomes published+publishable, Event mode appears without adding another search adapter
- entitySet() now accepts event and route modes directly
- no current unpublished Event is exposed

### Map
state: COMPLETE_WITHIN_CURRENT_AUTHORITY

- approved Place spatial projection consumed
- uncertain Place presentation remains uncertainty-marked
- Region without geometry stays unlocated
- presentation-only inferred routes stay separate
- no canonical Event or Route geometry is invented

### Timeline
state: COMPLETE_FOR_CURRENT_RESEARCH_PROJECTIONS

Before:
- timeline UI said no data was connected
- JBC_CONTEXTUAL_RESEARCH.timeline_bindings already existed but was not consumed

After:
- current-passage asset-local Event objects are shown as internal research events
- current Contextual Research timeline bindings are rendered
- candidate/local identity status is preserved
- canonical_entity_id=null is preserved
- DATA_READY_UI_NOT_DESIGNED / candidate status is not silently promoted
- UI explicitly states no automatic canonical promotion

Validated examples:
- Genesis 26 → 4 Gerar Event research objects
- Joshua 19:15 → RN-PART05-CH26-v1 contextual binding

### Navigation / Guide
state: COMPLETE_FOR_AVAILABLE_CONTEXTUAL_RESEARCH

Existing contextualGuideHtml() already consumes approved Contextual Research in the Guide surface.

Canonical Guide source:
state: INACTIVE_NO_AUTHORITY

No canonical Guide object is invented because current approved canonical Guide data is absent.

### Contextual Research
state: COMPLETE_ACROSS_CURRENT_CONSUMERS

Consumed in:
- passage/detail research
- map notice
- Guide/navigation
- related passage/cross-reference surface
- Timeline (added by this task)

### Media / rights
state: COMPLETE

No change to rights authority.
Media continues to require:
- source
- creator
- license
- verified source URL / app-side rights gate

### Search / Detail / Scripture / Map stable identity
state: COMPLETE_FOR_CURRENT_PUBLIC_OBJECTS

Place stable identities remain common across:
- Scripture
- Search
- Detail
- Map
- internal PassageLink

Internal Event stable identities remain common across:
- parent Research relation
- Event Detail
- Timeline
- related Scripture

without reader publication.

## 4. Material code changes

- app.js
  - entity type labels expanded
  - exact relation consumer expanded to all connected arrays
  - internal research relationship consumer added
  - Event detail renderer added
  - Route detail runtime added
  - evt/rt entity validation added
  - evt/rt panel tab routing corrected
  - timeline now consumes projected Events + Contextual Research bindings
  - quick search generalized for Event/Route under existing visibility gate
  - dedicated search generalized for Event/Route under existing visibility gate
  - entitySet type routing generalized

- index.html
  - hidden Event/Route search modes added
  - generic Search Workspace accessibility label
  - search placeholder expanded to event/route terminology
  - qa-linkage.js installed

- qa-linkage.js
  - current-contract Research-to-All-Features E2E gate

- qa-rg.js
  - Region regression comparison updated so unrelated, separately audited internal Event research links do not make the Region isolation test falsely fail

## 5. QA results

Global pipeline regression:
- PASS 110/110

Research-to-All-Features Linkage E2E:
- PASS 10/10

Gerar Full Profile:
- PASS 11/11

Beersheba Full Profile:
- PASS 12/12

Region loader / fail-closed / non-public isolation:
- PASS 35/35

Linkage E2E verifies:
- Gerar → 6 exact Event AUTO_BIND relations
- public relation surface hides unpublished Events
- Gerar Research layer exposes 6 internal Event objects
- exact Event stable ID opens Event Detail
- Event passage range preserved
- no Place map semantics leak into Event Detail
- unpublished Event absent from reader quick search
- temporary QA-only publication makes Event auto-enter entitySet/quick search/Event tab
- Genesis 26 Timeline consumes 4 Event research objects
- Joshua 19:15 Timeline consumes contextual candidate binding
- Region flow preserved
- canonical Route count remains zero
- presentation Route layer remains separate
- Place stable IDs continue to resolve

## 6. Legacy QA finding

qa-ee.js is a legacy Explorer QA suite tied to superseded UI contracts.

Observed:
- it expects removed #search DOM
- it expects an older primary type-filter layout
- it expects an older Detail section order

Therefore:
legacy_qa_ee_status: STALE_NOT_CURRENT_RELEASE_GATE

It is not used as evidence that the current Explorer is broken.
The current Search/Explorer linkage relevant to research projection is covered by qa-linkage.js plus the global pipeline regression.

Modernizing or retiring the old Explorer QA is QA maintenance, not a professional research linkage blocker.

## 7. Authority boundaries preserved

Not performed:
- professional candidate auto-promotion
- Project01 physical Registry write
- Person identity invention
- Route stable identity invention
- Region promotion to Place
- unpublished Event reader publication
- exact ancient route geometry invention
- BAT01 inferred crosswalk
- external/public release

## 8. Final state

research_to_scripture: COMPLETE_FOR_READER_VISIBLE_OBJECTS
research_to_place_detail: COMPLETE
research_to_region_detail: COMPLETE_NONPUBLIC
research_to_event_detail: COMPLETE_NONPUBLIC
research_to_person_detail: READY_NO_CURRENT_PROFESSIONAL_DATA
research_to_route_detail: READY_NO_CURRENT_CANONICAL_DATA
research_to_search: COMPLETE_WITH_VISIBILITY_GATE
research_to_map: COMPLETE_WITH_CURRENT_SPATIAL_AUTHORITY
research_to_relations: COMPLETE_FOR_EXACT_AUTO_BIND
research_to_timeline: COMPLETE
research_to_contextual_guide: COMPLETE
research_to_media: COMPLETE
research_to_presentation_routes: COMPLETE_WITH_PRESENTATION_ONLY_AUTHORITY

overall_status:
COMPLETE_WITH_AUTHORITY_BOUNDED_INACTIVE_SURFACES

external_release: NOT_AUTHORIZED
registry_physical_write: OUTSIDE_WEBAPP_SCOPE_AND_REMAINS_HOLD


## 9. Final exact implementation checksums

app.js:
0daede3ec219998379c701c4b24ecf04fa9d9614ac7e10cdc78c46d6c3f37fda

index.html:
a6bcc0934a12c534cea07d507361668ccbffa0736df961146bb4688651790a41

qa-linkage.js:
de39e2a08b3f2b6fbcf50a425e3f9a4e1742bb54adfbd06d5a078a5af92ccb2c

qa-rg.js:
92d5b86a2fcf80387818e6f9abddcb708fd02beb2509a2290e396213b4a0be6a
