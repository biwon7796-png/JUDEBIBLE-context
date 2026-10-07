# HANDOFF_FIRST_10_VERIFIED_DIRECT_GEOGRAPHY_FACTS_TO_JUDEBIBLE_WEBAPP_FOR_STAGING_IMPORT

status: HANDED_OFF_TO_WEBAPP_STAGING__NOT_IMPORTED
date: 2026-10-06
from_project: 01_목회연구_WORBS_BICS
to_project: JudeBible_WebApp
handoff_type: VERIFIED_EXTERNAL_DIRECT_GEOGRAPHY_FACTS_TO_STAGING
source_commit: 7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f

## Authoritative source notes

Source-note batch:
G:/내 드라이브/Projects/옵시디언/Jude_Research/01_소스들/성경위키_외부자료/02_지리_장소/LEVEL_A_FIRST_10/

Batch index:
- 00_BATCH_INDEX.md

Staging payload:
- docs/architecture/drafts/evidence/geography/LEVEL_A_FIRST_10_VERIFIED_DIRECT_GEOGRAPHY_FACTS_STAGING_v0.1.json

## Scope

Exactly 10 existing PLACE_ID values are handed off, unchanged:

1. BAT01-PLACE-0016 — Achaia — OpenBible aef4242
2. BAT01-PLACE-0059 — Amalek — OpenBible ab95484
3. BAT01-PLACE-0065 — Ammon — OpenBible a6046fa
4. BAT01-PLACE-0086 — Arabah — OpenBible a2bb5ef
5. BAT01-PLACE-0091 — Aram — OpenBible a3e66cd
6. BAT01-PLACE-0100 — Arnon — OpenBible a4cc324
7. BAT01-PLACE-0111 — Ashdod — OpenBible a30c937
8. BAT01-PLACE-0118 — Asia — OpenBible a197f19
9. BAT01-PLACE-0121 — Assyria — OpenBible a3d1321
10. BAT01-PLACE-0160 — Babylon 1 — OpenBible a217d18

## Allowed staging facts

Only VERIFIED OpenBible DIRECT_DATA is present in the staging payload:

- source-local ancient_id
- object type
- source-exact GeoJSON geometry
- source-exact Point feature(s), where present
- source-exact confidence values/bands, where present
- exact source locator
- exact Git blob SHA
- commit-pinned provenance and rights note

## Explicit exclusions

The staging payload excludes:

- modern identification as imported fact
- Pleiades POSSIBLE/HOLD crosswalk
- historical identity inference
- exact canonical-coordinate inference
- new Place/Region/Route identity
- Registry mutation
- professional-research promotion

Modern identification and all Pleiades POSSIBLE/HOLD material remain RESEARCH_EVIDENCE only in the Obsidian Source Notes.

## Geometry semantics

Source-exact geometry is transferred byte-semantically as parsed GeoJSON from the commit-pinned source file.

A source Point is not promoted to:
- canonical biblical coordinate
- region centroid
- capital
- exact historical center

Confidence bands remain source data and are not converted into new certainty claims.

## Source-lineage warning

The OpenBible match is VERIFIED_VIA_SOURCE_LINEAGE, not independent corroboration of S066.
The handoff must not double-count the same lineage as two independent authorities.

## WebApp boundary

This handoff authorizes staging import preparation only.

Not performed:
- live data/place projection write
- data/reference Registry mutation
- app.js change
- index.html change
- canonical crosswalk promotion
- external/public release

## Required staging regression

Before any production binding, verify:

1. 10/10 existing PLACE_ID values resolve unchanged.
2. 10/10 OpenBible ancient_id values match the source notes.
3. Object types match the Level A reference.
4. GeoJSON source blob SHA and commit locator remain traceable.
5. Point features remain source-point semantics only.
6. Confidence bands survive without reinterpretation.
7. No modern identification field enters the import layer.
8. No Pleiades POSSIBLE/HOLD becomes canonical.
9. Registry/stable identity diff is zero.
10. Production data diff is zero until explicit import approval.

## Result

handoff_status: COMPLETE
staging_payload_created: true
actual_import_executed: false
registry_changed: false
stable_identity_changed: false
live_projection_changed: false
external_release: NOT_AUTHORIZED

NEXT_TASK_ONE:
RUN_FIRST_10_DIRECT_GEOGRAPHY_STAGING_IMPORT_REGRESSION
