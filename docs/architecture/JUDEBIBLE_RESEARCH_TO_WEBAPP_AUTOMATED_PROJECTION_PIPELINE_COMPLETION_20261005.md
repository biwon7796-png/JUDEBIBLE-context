# JUDEBIBLE_RESEARCH_TO_WEBAPP_AUTOMATED_PROJECTION_PIPELINE_COMPLETION_20261005

status: COMPLETE_AND_VALIDATED
date: 2026-10-05
task: COMPLETE_JUDEBIBLE_RESEARCH_TO_WEBAPP_AUTOMATED_PROJECTION_PIPELINE_WITH_BEERSHEBA_AND_GERAR_AS_REFERENCE_FIXTURES
project: JudeBible_WebApp

## Result

The research-to-webapp projection path is now one common automated pipeline.

Canonical one-shot command:
JBC_VAULT=<authoritative vault> node tools/pipeline/sync.js

Verified command with regression:
JBC_VAULT=<authoritative vault> node tools/pipeline/sync.js --verify

Dry-run:
JBC_VAULT=<authoritative vault> node tools/pipeline/sync.js --dry

Watcher:
JBC_VAULT=<authoritative vault> node tools/pipeline/watch.js

The watcher now invokes sync.js, not run.js directly.

## Automated order

1. FULL_PROFILE_CHECK
2. SHARED_INGEST
3. FULL_PROFILE_WRITE
4. optional REGRESSION (--verify)

If an approved Full Profile exact SHA, stable identity or contract count fails, the pipeline stops before shared ingest/write.

## Authority / configuration

Approved Full Place Profiles are declared only in:
- tools/pipeline/ingest.config.json

A DETAIL_ONLY record carries:
- expected_identity
- approval evidence
- detail_contract.source_rel
- detail_contract.expected_sha256
- output
- expected structural counts
- reader defaults required by the current profile contract
- approval/adoption evidence hashes
- correction delta where required

The generator no longer contains Beersheba/Gerar names, SHAs or counts as hardcoded pipeline branches.

Professional approval remains explicit; the pipeline does not auto-promote candidates.

## Common Full Place Profile generator

Generator:
- tools/pipeline/full-place-profile-stage.js

Input:
- all configured records with projection_mode: DETAIL_ONLY

Reference fixtures:
- JBC_BEERSHEBA_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261004_01
- JBC_GERAR_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261005_01

Validated metrics:

Beersheba:
- source SHA: ca65d402d5685455107b50c1dfc652bd04efd96c1815205ca075ed5a1ec1a07f
- inline refs: 107
- unique ranges: 59
- story sections: 13
- significance sections: 5
- direct mentions: 33

Gerar:
- source SHA: d07b08ab20a46fd7ea0022d1a23234cd80ed86fcfd651326e6471c2e1dddb24e
- inline refs: 61
- unique ranges: 41
- story sections: 9
- significance sections: 5
- direct mentions: 10

## Automatic app loader

Generated combined loader:
- data/place.profiles.js

index.html loads only:
- data/place.profiles.js

It no longer requires one script tag per Place profile.

Current profiles in combined loader:
- JBC-CR-PLACE-BEERSHEBA-001
- JBC-CR-PLACE-GERAR-001

Per-profile generated files remain as traceable generated artifacts:
- data/place.profile.beersheba.js
- data/place.profile.gerar.js

A future approved Full Place Profile can join the combined loader without editing index.html or adding a record-specific stage.

## Shared compatibility projection

The existing common pipeline remains responsible for:
- approved connected research
- stable identities
- compatibility aliases
- spatial/media projection
- Scripture Entity Index
- Region/Event adapters
- relation binding
- media rights gates
- contextual research
- source lineage

Full Profile DETAIL_ONLY assets do not collide with predecessor compatibility/spatial/media records.

## Safe regeneration / failure behavior

Preserved:
- exact source SHA verification
- stable identity check
- expected structural counts
- direct mention count
- no mirror write without explicit override in run.js
- last-known-good behavior for shared records
- atomic projection/index writes
- Windows rename retry + copy fallback
- watcher debounce
- watcher single-flight
- no automatic retry loop after failures
- failure-visible watch status

Additional Full Profile fail-closed verification:
- a byte-modified Gerar source produced DETAIL_SOURCE_SHA_MISMATCH
- sync exited non-zero
- live data/place.profiles.js remained byte-identical

Observed live combined loader SHA during fail-closed test:
ffe48aa3d7dbea9d86a2c58471229cdc9db1f28d066a96c2242ec1baefbe061e

## Tests

Shared pipeline regression:
- PASS 110/110

Watcher:
- PASS 12/12

Auto-discovery:
- PASS 14/14

Gerar browser Full Profile E2E:
- PASS 11/11

Beersheba browser Full Profile E2E:
- PASS 12/12

Combined loader browser verification:
- only data/place.profiles.js loaded
- contains both approved stable identities

Sync dry-run:
- PASS
- wrote: false
- authoritative vault used

Sync --verify:
- PASS
- FULL_PROFILE_CHECK
- SHARED_INGEST
- FULL_PROFILE_WRITE
- REGRESSION
- shared regression exit 0

## Files materially changed

- tools/pipeline/ingest.config.json
- tools/pipeline/full-place-profile-stage.js
- tools/pipeline/sync.js
- tools/pipeline/watch.js
- tools/pipeline/test-watch.js
- index.html
- data/place.profiles.js
- generated per-profile detail projections

Existing common run.js remains the shared ingest authority and was not replaced.

## Boundaries retained

Not authorized / not performed:
- Project01 physical Registry write
- automatic professional representative promotion
- new global Place/Route/Region identity creation
- BAT01 inferred crosswalk
- exact biblical coordinate invention
- authoritative ancient route geometry invention
- external/public release

The watcher is wired and tested but this completion record does not assert that a persistent watcher process has been started on the host.

## Completion

automation_pipeline: COMPLETE
common_full_profile_generator: COMPLETE
combined_loader: COMPLETE
watcher_routing_to_sync: COMPLETE
safe_regeneration: PASS
fail_closed_exact_source: PASS
beersheba_fixture: PASS
gerar_fixture: PASS
external_release: NOT_AUTHORIZED
registry_physical_write: HOLD_OUTSIDE_WEBAPP_PIPELINE

NEXT_TASK_ONE:
RESUME_COMMON_PLACE_PERSON_PANEL_UI_REFINEMENT_ON_TOP_OF_COMPLETED_AUTOMATED_PIPELINE
