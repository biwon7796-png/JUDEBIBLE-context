# Navigation Post-Implementation Integration Audit — 2026-10-05

Status: PASS_WITH_RETAINED_LEGACY_QA_DEBT
Authority effect: NONE. Presentation/UI integration audit only.

## Scope
- Bible World Navigation desktop contract
- Mobile topic-board and topic-active navigation
- Research/map/timeline linkage regression
- Legacy QA contract classification
- Region pipeline regression isolation

## Mobile finding and fix
A real mobile usability defect was found: after selecting a Topic Card, the board closed and the topic/step state applied correctly, but the page retained the board scroll position, leaving #guide-pane above the visible viewport (measured top about -675px).

Minimal fix:
- app.js / navOpenTopic()
- On mobile only, after the first topic step is applied, scroll #guide-pane into view.
- No research, route, geometry, Registry, lifecycle, or visibility authority changed.

Post-fix measurement at the mobile viewport:
- IDLE guide visible
- Topic board fits viewport without horizontal page overflow
- TOPIC_ACTIVE guide returns to the viewport top (about 0px)
- current step, next button, 본문 보기 / 본문연구 / 연표에서 보기 all present
- step 2 transition succeeds
- body/document horizontal overflow not introduced

## Regression results after fix
- pipeline tools/pipeline/test.js: 110/110 PASS
- qa-jn: 9/9 PASS
- qa-ee: 18/18 PASS
- qa-bs: 12/12 PASS
- qa-gr: 11/11 PASS

## Legacy QA
The legacy workspace/navigation suites still contain pre-current-layout assertions such as old reference/search/header and old Guide structures. They are not used as authority for the new Bible World Navigation contract. They must be modernized rather than forcing the product back to their old DOM contract.

## Region pipeline isolation
tools/pipeline/test-region.js = 8/13 PASS.
Failures:
- RG01 old assumption of exactly two discovered Place files; current discovery sees predecessor + Full Canonical successors.
- RG03 dry-run expected old place count/output shape.
- RG05 live-vs-isolated Place projection differs at Gerar authority.approval_source.
- RG07 idempotency bytes differ under the stale expected projection baseline.
- RG08 last-known-good assertion fails under the same stale region/place projection assumptions.

The failures are outside the Navigation code path and the main research projection pipeline remains 110/110. They are retained as QA debt and are not auto-rewritten in this audit.

## Verdict
NAVIGATION_POST_IMPLEMENTATION_INTEGRATION_AUDIT = PASS_WITH_RETAINED_LEGACY_QA_DEBT
Mobile blocker = FIXED
Navigation release blocker from this audit = NONE
External release remains separately gated.
