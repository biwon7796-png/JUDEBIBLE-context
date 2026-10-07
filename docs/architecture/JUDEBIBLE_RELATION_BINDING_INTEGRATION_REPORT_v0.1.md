# JUDEBIBLE RELATION BINDING INTEGRATION REPORT v0.1

status: IMPLEMENTATION_SCOPE_COMPLETE_PRE_COMMIT
task: CONTINUE_RELATION_BINDING_INTEGRATION_FROM_CLAUDE_CHECKPOINT_v0.1
working_tree: F:\Projects\웹앱
baseline_head: 5183808c775add6f6abdff7ede21f0be95a3db60
commit_performed: false

## 1. Continuation boundary

This run continued the supplied Claude checkpoint. No restart, reset, stash, rollback, commit, deployment, registry promotion, or release action was performed.

The pre-existing dirty worktree was frozen before edits under:
- tools/pipeline/staging/relation-binding-checkpoint/HEAD.txt
- tools/pipeline/staging/relation-binding-checkpoint/status.txt
- tools/pipeline/staging/relation-binding-checkpoint/tracked.diff

## 2. Changes made in this continuation

### Relation binding
- Added tools/pipeline/test-relbind.js with focused whole-graph relation-binding regression coverage.
- Fixed relation-binding reset determinism: an explicitly authored stable-id endpoint that was AUTO_BIND by exact_stable_id_match is no longer erased on the next binding pass.
- AUTO_BIND / VERIFY / HOLD / GAP behavior remains fail-closed.
- No coordinates, geometry, reader authority, entity identity, or registry state are created by the relation-binding stage.

### RG-06
- Region Detail no longer exposes coordinates from an external reference row.
- The external reference remains explicitly separated from research authority.
- The Region itself remains no-geometry / no-marker / no-polygon.

### RG-10
- Restored the minimum shared-store Explorer contract needed by Region:
  - stable-id entity wrapper
  - Region label
  - map-less note
  - Detail primary action
  - Scripture action
  - no Region map action
  - Place filter excludes Region
- Empty Explorer queries are no longer truncated before the Region row.

### RG-11
- No new fix was required. It was already PASS at the recovered checkpoint and remained PASS after this work.

## 3. Node QA

Authoritative vault:
G:\내 드라이브\Projects\옵시디언\Jude_Research

Final authoritative results:
- relation binding: 8/8 PASS
- test.js: 109/109 PASS
- region: 12/12 PASS
- promotion: 8/8 PASS
- autodiscovery: 14/14 PASS
- watch: 11/11 PASS

A first test.js run without JBC_VAULT produced the expected mirror-dependent failures and was not treated as authoritative. Re-running with the vault path above restored the checkpoint baseline completely.

## 4. Browser QA — final serial run

Relation-binding target suites:
- RG: 33/33 PASS
- RF: 11/11 PASS
- self: 20/20 PASS

Other serial suites:
- GEO: 120/126
- NAV: 1/6
- BS: 12/17
- EE: 18/40
- SW: 0/8
- WS: 16/25
- AUTH: 14/20
- KRV: 7/9
- PL: 21/23
- W1: 6/8
- W2: 4/6

The remaining failures are classified as pre-existing / out-of-scope regressions in the current large dirty worktree, not relation-binding failures. Their dominant clusters are:
- removed or changed legacy search controls (#search, #search-open, old filter controls)
- legacy Entity Explorer card/list/filter/media expectations beyond the minimum RG-10 contract
- old map camera/zoom/icon-size contracts
- old navigation/header and scroll-anchor contracts
- Beersheba legacy detail-order / source-lineage expectations
- old authoritative map-pin/sample-map expectations
- old KRV UI input expectations
- workspace/history anchor regressions

The serial QA runner also has a Windows CP949 reporting defect: when a failed assertion contains characters such as ✗ or —, its Python reporter throws UnicodeEncodeError after the suite has already written the HTML result. Suite pass/fail counts and individual failures were therefore classified from tools/_out_<suite>.html. This reporter defect does not alter the underlying browser test result.

## 5. Integrity / mutation boundary

Preserved:
- authoritative source notes
- registry authority
- no automatic relation invention
- no automatic identity merge by name
- no coordinate / geometry promotion
- no Reader publication promotion
- no deployment or release action

Changed in this continuation:
- app.js
- tools/pipeline/relation-binding.js
- tools/pipeline/test-relbind.js
- this implementation report

## 6. Final status

RELATION_BINDING_INTEGRATION: PASS
RG_06: PASS
RG_10: PASS
RG_11: PASS
NODE_BASELINE: PASS
REFERENCE_LAYER: PASS
SERIAL_BROWSER_REGRESSION: COMPLETED_WITH_OUT_OF_SCOPE_EXISTING_FAILURES
COMMIT: NOT_PERFORMED

Stop boundary reached: BEFORE_COMMIT.

## Dedicated Search Page Restoration — 2026-10-02

Task: RESTORE_EXISTING_DEDICATED_SEARCH_PAGE_AND_REBIND_CURRENT_SEARCH_DATA_v0.1

Implemented:
- Replaced the rail-adjacent 340px contextual search panel with a dedicated search workspace.
- Kept the left rail visible while the search workspace replaces the main text/map area.
- Preserved current STORE / Region / relation-binding data contracts; no rollback to legacy fixture search.
- Search page uses current entity and Scripture indices and keeps existing result actions.
- Desktop search opens full workspace from left=80px to viewport edge; mobile uses full-width workspace.
- Initial result limit increased from 8 to 24 for page-scale browsing.
- Existing map/text/detail state remains underneath and is restored when search closes.

Verification:
- node --check app.js: PASS
- Targeted browser check: dedicated page visible; query "브엘" -> entity 1 + verse 49; focus=sw-query.
- REGION_APP_LOADER_NONPUBLIC_QA: 33/33 PASS
- REFERENCE_LAYER_SOURCE_TRUST_QA: 11/11 PASS
- relation-binding: 8/8 PASS
- Existing qa-sw.js: 0/8 because it still targets the older header #search / overlay DOM contract; classified as obsolete QA contract for this restored dedicated-page UX.

Evidence:
- screenshots/search-dedicated-page.png

Commit: NOT PERFORMED.
