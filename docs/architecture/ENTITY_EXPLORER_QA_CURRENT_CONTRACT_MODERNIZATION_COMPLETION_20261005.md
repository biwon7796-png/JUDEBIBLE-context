# ENTITY_EXPLORER_QA_CURRENT_CONTRACT_MODERNIZATION_COMPLETION_20261005

status: COMPLETE
date: 2026-10-05
task: MODERNIZE_ENTITY_EXPLORER_QA_TO_CURRENT_SEARCH_DETAIL_AND_RESEARCH_LINKAGE_CONTRACT
project: JudeBible_WebApp

## Purpose
Replace the stale Entity Explorer QA suite that was bound to removed UI contracts with a current-contract suite.

## Superseded legacy assumptions
The former qa-ee.js expected:
- removed #search input
- old 전체/인물/장소 primary type filter
- older dialog/workspace semantics
- older Detail section ordering
- old fixed panel placement assumptions

Those expectations are no longer release authority.

## Current contract validated
The modern suite validates:
1. current Search Workspace structure
2. Explore perspective + Scripture context retention
3. current Place/Region visible dataset
4. visibility-gated Person/Event/Route modes
5. query filtering within active mode
6. Card/List stable-id invariance
7. sort stable-id invariance
8. result click -> exact stable_id Detail
9. Scripture passage/verse preservation
10. successive Detail replacement without closing Explore
11. Gerar Research -> six exact AUTO_BIND internal Event objects
12. direct internal Event -> Event Detail boundary
13. unpublished Event absent from reader Explore/quick search
14. Event mode auto-appears when publication authority exists (QA-only temporary mutation; restored)
15. Explore Detail -> Study handoff with exact stable identity
16. reader-first discovery cards; no duplicate action footer/raw VERIFY/HOLD
17. stable identity common across Explorer/Detail/Store
18. zero uncaught browser errors in current Explorer flow

## Results
Entity Explorer current-contract QA:
- PASS 18/18

Authoritative shared pipeline regression with JBC_VAULT bound:
- PASS 110/110

## Runtime note
After Remote Desktop account repair, the local QA web server on 127.0.0.1:8766 had stopped.
It was restarted before browser QA.
This was an environment interruption, not a JudeBible product regression.

## Files changed
- qa-ee.js

No professional research asset, Registry, lifecycle state, map authority, publication permission, or product semantics were changed.

## Current release gate
qa-ee.js contract:
ENTITY_EXPLORER_CURRENT_20261005

legacy_qa_ee_status:
SUPERSEDED_BY_CURRENT_CONTRACT

external_release:
NOT_AUTHORIZED

NEXT_TASK_ONE:
RESUME_JUDEBIBLE_FEATURE_DEVELOPMENT_WITH_CURRENT_QA_GATES_AND_DRIVE_FIRST_REMOTE_EXECUTION_ONLY_WORKFLOW
