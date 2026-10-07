# HANDOFF_2026-10-04_BEERSHEBA_FULL_PLACE_PROFILE_TO_WEBAPP

status: ACCEPTED_INPUT_READY_FOR_IMPLEMENTATION
date: 2026-10-04
from_project: 01_목회연구_WORBS_BICS
to_project: JudeBible_WebApp
handoff_type: APPROVED_PROFESSIONAL_RESEARCH_TO_READER_PROJECTION
stable_identity: JBC-CR-PLACE-BEERSHEBA-001

## Authoritative input

research_id: JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01
source_path: G:/내 드라이브/Projects/옵시디언/Jude_Research/02_연구물/브엘세바/JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01.md
sha256: ca65d402d5685455107b50c1dfc652bd04efd96c1815205ca075ed5a1ec1a07f
professional_status: CURRENT_REPRESENTATIVE
project01_adoption_evidence:
- G:/내 드라이브/Jude_Lee_OS/01_PROJECTS/01_목회연구_WORBS_BICS/PROJECT01_BEERSHEBA_FULL_PLACE_PROFILE_PROFESSIONAL_ADOPTION_20261004.md
- sha256: cb47576b8cd66740c14dc91c8a060bd21a0350e7be0c2a1c8f59c545a0784705

predecessor:
- research_id: JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01
- sha256: c02853f748254bf22a9de5ac0258c66475b85b6ea172b95b494f32bf878e5e39
- role: LINEAGE_ANCESTOR_ONLY
- delete: false

## Required reader projection

Default reader order:
1. identity header
2. one-line identity
3. quick facts
4. representative photos
5. 성경 속 브엘세바 — chronological narrative
6. 왜 브엘세바가 중요한가
7. related people / events / places / routes
8. 위치는 어디인가
9. archaeology and history
10. related passages
11. map action
12. collapsed Research section

Do not flatten the complete research asset into one long text wall.

## Quick facts

Project from approved profile:
- category
- region
- Hebrew name / pronunciation
- name meaning
- location status
- major periods
- major people
- representative passages

Location display:
- exact biblical coordinate remains null
- reader display may use representative research anchor
- label: 브엘세바 ?
- ? means inferred/representative location, not exact coordinate

## Inline passage links

All inline scripture references in explanatory prose must become JudeBible internal actions.

Action:
- openRelatedPassage(passage,start,end)

Required behavior:
- single verse opens and highlights target verse
- range opens and highlights contiguous range
- contiguous range renders as one visual selection block
- preserve Place detail context
- preserve map context
- browser navigation remains coherent

Do not send inline links to an external Bible site.

## Map projection

Allowed:
- normal Place dot with small ? for inferred biblical location
- representative display anchor: approved research candidate / leading hypothesis only
- presentation-only dotted inferred Route when the approved route-display eligibility gate passes
- expand location hypotheses separately

Not allowed:
- persisting representative display anchor as canonical exact coordinate
- authoritative route_geometry synthesis
- partial-anchor route shortening
- automatic Route stable IDs
- treating modern Beersheba as biblical Beersheba identity

## Archaeology reader rules

Clearly distinguish:
- verified archaeological site fact
- scholarly identification
- disputed interpretation
- prohibited direct equation

Examples:
- Tel Be'er Sheva Iron Age city / water system / dismantled horned altar may be described from approved research.
- excavated Tel well must not be called Abraham's or Isaac's well.
- dismantled altar must not be presented as direct proof of Hezekiah's reform.
- Tel Be'er Sheva must not be declared the exact patriarchal coordinate.

## Effective metadata delta

Use:
- direct Beersheba mentions: 33

Do not copy the stale single prose occurrence of 32 from the exact-byte research candidate.

## Research layer

Collapsed by default:
- Claim–Evidence matrix
- A01/A02/A03 evidence classes
- competing location views
- source register
- certainty
- retained VERIFY/HOLD

Internal code words need not appear in normal reader prose.

## Retained VERIFY / HOLD

Preserve downstream:
- exact patriarchal coordinate unresolved
- all-period Tel equation unresolved
- Abimelech identity merge unresolved
- authoritative Route geometry unresolved
- Genesis wells exact attribution blocked
- exact patriarchal archaeological stratum blocked
- Route stable identity blocked
- Hezekiah direct-proof claim disputed
- external release blocked

## Existing app compatibility

Existing compatibility key:
- beersheba

It remains only a runtime compatibility alias for:
- JBC-CR-PLACE-BEERSHEBA-001

All surfaces must resolve to the same stable identity:
- Scripture
- Detail
- Map
- Guide
- internal PassageLink

## Implementation boundary

This handoff authorizes implementation against the approved representative.
It does not authorize external/public release.

Before replacing current generated projection, implementation must:
- ingest or explicitly project the approved representative without changing source bytes
- preserve exact SHA lineage
- update Beersheba-specific QA from predecessor assumptions
- retain global regression
- preserve safe fallback if the new detail projection fails

## Completion definition

Implementation is complete when:
- new Full Place Profile reader hierarchy renders
- 107 inline passage-link intentions are representable under the internal link contract
- location hypothesis UI and ? marker follow current map policy
- existing photo rights remain traceable
- predecessor is not used as current Beersheba professional content except lineage/fallback evidence
- all material VERIFY/HOLD survive projection
- app regression passes

external_release: NOT_AUTHORIZED


## Implementation completion — 2026-10-04

status: IMPLEMENTED_AND_VALIDATED

### Implemented projection split
- Existing data/projection.research.js remains the compatibility/spatial/media projection for JBC-CR-PLACE-BEERSHEBA-001.
- The approved Full Place Profile is routed as DETAIL_ONLY and projected through data/place.profile.beersheba.js.
- This separation prevents the older generic spatial/media schema from flattening or discarding the approved Full Place Profile while retaining existing map/media lineage and safe fallback.
- The Full Place Profile exact source SHA remains ca65d402d5685455107b50c1dfc652bd04efd96c1815205ca075ed5a1ec1a07f.

### Reader implementation
Implemented:
- identity header with Korean / English / Hebrew / Korean pronunciation.
- quick facts.
- representative photo plus secondary photo gallery under the existing rights gate.
- 13 chronological 성경 속 브엘세바 sections.
- 5 왜 브엘세바가 중요한가 sections.
- related people and events.
- 위치는 어디인가? plus map action and expandable hypotheses.
- geography and archaeology/history.
- related-passage explorer.
- collapsed Research layer with current representative lineage and retained uncertainty.

### Internal scripture links
- 107 inline passage-link intentions are projected as JudeBible internal actions.
- 107/107 resolve to existing local Scripture ranges.
- range navigation preserves Place detail context and map context.
- contiguous ranges use one refTarget range and render as one contiguous scripture selection.
- no external Bible-site dependency is used.

### Map and uncertainty
- canonical biblical coordinate remains null.
- inferred presentation marker renders as normal Place dot with small ?.
- browser validation: 브엘세바?.
- presentation-only inferred Route remains dotted.
- browser validation on Genesis 26: one eligible display-only inferred Route.
- research route_geometry remains null.
- partial-anchor Route shortening remains prohibited.

### Archaeology boundary
Reader projection omits internal FACT/HOLD control notation from normal prose and keeps the approved natural-language boundary:
- Tel Be'er Sheva remains an archaeological research candidate/display anchor.
- the excavated well is not identified as Abraham's or Isaac's well.
- the site is not declared the exact patriarchal coordinate.
- altar dismantling is not presented as direct proof of Hezekiah's reform.

### QA
Core pipeline regression:
- PASS 110/110

Dedicated Beersheba Full Profile browser E2E:
- PASS 12/12

Validated:
- exact Full Profile SHA and Project01 adoption SHA.
- stable identity / compatibility alias.
- reader hierarchy.
- 13 story sections / 5 significance sections.
- inline range navigation and context preservation.
- all 107 internal passage links.
- uncertain-place ? marker with canonical coordinate still null.
- display-only dotted Route with research geometry null.
- archaeology overstatement boundary.
- media rights/lightbox.
- collapsed Research layer.
- mobile horizontal-overflow safety.

### Files
- data/place.profile.beersheba.js
- tools/pipeline/full-place-profile-stage.js
- tools/pipeline/ingest.config.json
- tools/pipeline/run.js
- app.js
- styles.css
- index.html
- qa-bs.js

Pre-Full-Profile Beersheba QA retained for audit:
- docs/architecture/qa-bs.pre-full-profile.20261004.js

### Remaining boundary
- external/public release remains NOT_AUTHORIZED.
- physical individual-research Registry pointer remains outside this implementation because no authorized Registry source exists.
