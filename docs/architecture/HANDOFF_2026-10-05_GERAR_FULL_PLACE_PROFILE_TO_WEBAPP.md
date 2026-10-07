# HANDOFF_2026-10-05_GERAR_FULL_PLACE_PROFILE_TO_WEBAPP

status: ACCEPTED_INPUT_READY_FOR_IMPLEMENTATION
date: 2026-10-05
from_project: 01_목회연구_WORBS_BICS
to_project: JudeBible_WebApp
handoff_type: APPROVED_PROFESSIONAL_RESEARCH_TO_READER_PROJECTION
stable_identity: JBC-CR-PLACE-GERAR-001

## Authoritative input

research_id: JBC_GERAR_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261005_01
source_path: G:/내 드라이브/Projects/옵시디언/Jude_Research/02_연구물/그랄/JBC_GERAR_FULL_CANONICAL_PLACE_PROFILE_WORBS_20261005_01.md
sha256: d07b08ab20a46fd7ea0022d1a23234cd80ed86fcfd651326e6471c2e1dddb24e
professional_status: CURRENT_REPRESENTATIVE

captain_approval_evidence:
- G:/내 드라이브/Jude_Lee_OS/01_PROJECTS/01_목회연구_WORBS_BICS/PROJECT01_GERAR_FULL_CANONICAL_PLACE_PROFILE_CAPTAIN_LIFECYCLE_APPROVAL_20261005.md
- sha256: 3ae0553d511a1f0abce19fc1bf02c85b4a22097d2481703462cb2f2e29e86436

professional_validation_evidence:
- G:/내 드라이브/Jude_Lee_OS/01_PROJECTS/01_목회연구_WORBS_BICS/PROJECT01_GERAR_FULL_PLACE_PROFILE_PROFESSIONAL_VALIDATION_20261005.md
- sha256: 9aa827ad440be30f394cba04c702f15cf32227830485140f1340cad73c4a0dc9

predecessor:
- research_id: JBC_GERAR_CONNECTED_WORBS_20260930_01
- sha256: 6f9933d413bc0d675767df52c94bdc72fadce835407054227007a059a6f75937
- role: LINEAGE_ANCESTOR_ONLY
- delete: false

## Current app state before implementation

The current generated generic projection still points Gerar to:
- research_id: JBC_GERAR_CONNECTED_WORBS_20260930_01
- compatibility key: gerar
- stable identity: JBC-CR-PLACE-GERAR-001

The existing generic/spatial/media projection must not be silently treated as current professional prose after this handoff.

Implementation should follow the same split used for Beersheba unless a safer generalized pipeline is available:
- preserve compatibility/spatial/media projection where still valid
- project the approved Full Canonical Place Profile as the current reader Detail source
- preserve one stable identity across Scripture / Detail / Map / Explorer

## Required reader projection

Default reader order:
1. identity header
2. one-line identity
3. quick facts
4. representative candidate media
5. 성경 속 그랄 — chronological narrative
6. 왜 그랄이 중요한가
7. related people / events / places / routes
8. 위치는 어디인가
9. geography
10. archaeology and history
11. related passages
12. map action
13. collapsed Research section

Do not flatten the complete research asset into one long text wall.

## Header / quick facts contract

Short header type:
- 성읍·도시

Header fields:
- 그랄
- Gerar
- גרר
- 그라르

Do not repeat location uncertainty in the fixed identity header.

Quick facts detailed type:
- 성읍·정착지·족장 체류지

Quick facts may include:
- region
- name meaning status
- location status
- major periods
- major people
- representative passages

Name meaning:
- do not invent an etymology
- reader-safe value: 어원 확정 보류

## Chronological reader narrative

Required story order:
1. 가나안의 남서 경계 표지 — 창 10:19
2. 아브라함과 사라 — 창 20:1–18
3. 그랄에서 브엘세바로 이어지는 서사 — 창 21:22–34 relation only
4. 이삭 — 기근 가운데 머물라는 명령 — 창 26:1–6
5. 이삭과 리브가 — 창 26:7–11
6. 번성과 갈등 — 창 26:12–17
7. 그랄 골짜기와 우물 분쟁 — 창 26:17–22
8. 브엘세바로의 이동과 평화 제안 — 창 26:23–31
9. 아사 시대 — 대하 14:13–14

Do not relocate Genesis 21:22–34 from Beersheba to Gerar.

## Why Gerar matters

Project the five approved significance themes:
- promise preserved amid vulnerability
- prosperity and conflict coexist
- water as survival resource and conflict center
- movement is not reducible to failure
- Gerar and Beersheba are connected narrative spaces, not one place

## Direct mention index

Local JudeBible KRV direct mentions:
count: 10

References:
- 창 10:19
- 창 20:1
- 창 20:2
- 창 26:1
- 창 26:6
- 창 26:17
- 창 26:20
- 창 26:26
- 대하 14:13
- 대하 14:14

LXX/version-specific extra mentions must not be added to the local KRV count.

## Inline passage links

All inline scripture references in reader prose must become JudeBible internal actions.

Action:
- openRelatedPassage(passage,start,end)

Required behavior:
- single verse opens/highlights target verse
- range opens/highlights one contiguous range
- preserve current Place detail context
- preserve map context
- preserve coherent browser navigation
- no external Bible-site dependency

The approved Full Profile contains 61 inline link intentions / 41 unique passage ranges, all previously validated against local Scripture ranges.

## Map / location projection

Canonical biblical Gerar coordinate:
- null

Allowed:
- normal Place dot plus small ? for a presentation-only representative location
- label: 그랄 ?
- representative display anchor may use Tel Haror only as a research candidate
- competing candidate sites may be expanded separately
- inferred routes may render dotted only under the current presentation-only route authority

Not allowed:
- persisting Tel Haror coordinate as canonical biblical Gerar coordinate
- collapsing Gerar city and Valley of Gerar into one exact point
- authoritative ancient route geometry synthesis
- automatic Route stable IDs
- treating a candidate archaeological site as certain biblical identity

Candidate hierarchy:
1. Tel Haror / Tell Abu Hureira — leading candidate
2. Tell Jemmeh — historical/revived competing candidate
3. Tel Sera / Tell esh-Sharia — older competing candidate
4. Tell el-Far'a South — scholarly proposal

## Archaeology reader rules

Clearly distinguish:
- verified site fact
- scholarly identification
- disputed interpretation
- prohibited direct equation

Allowed:
- Tel Haror is an important multi-period archaeological site
- substantial Middle Bronze urban/cultic remains exist
- Tel Haror is a leading candidate for Gerar

Blocked:
- Tel Haror = biblical Gerar with certainty
- Abraham/Isaac physically verified at Tel Haror
- excavated feature = Isaac's well
- specific stratum proves Genesis 20 or Genesis 26

## Person / identity boundary

Do not automatically merge:
- Abimelech in Genesis 20–21
- Abimelech in Genesis 26

The two cycles remain separate references until a separate Person authority resolves identity.

## Media

Reuse predecessor media rights metadata:
- JBC-MEDIA-GR-001 — Tel Haror representative archaeological candidate
- JBC-MEDIA-GR-002 — Tel Haror landscape context
- rights: CC0 1.0

Caption boundary:
- describe images as Tel Haror / candidate-site media
- do not caption them as photographs of the biblical Gerar with certainty

Existing app overlay:
- data/projection.overlay.gerar.json
- legacy_key: gerar
- current media bindings may be reused only if they remain consistent with this handoff

## Research layer

Collapsed by default:
- Claim–Evidence matrix
- evidence classes
- competing location views
- source register
- certainty
- textual/version-specific mentions
- retained VERIFY/HOLD

Do not expose raw internal status codes in normal Reader prose.

## Retained VERIFY / HOLD

Preserve downstream:
- exact biblical Gerar coordinate unresolved
- Tel Haror exact equivalence unresolved
- Gerar city / Valley formal entity relationship unresolved
- two Abimelech identities unresolved
- exact route geometry unresolved
- exact connected Drive lineage unresolved
- direct patriarchal archaeological attribution blocked
- Philistine terminology / chronology unresolved
- BAT01 inferred crosswalk blocked
- new global Region identity blocked
- external publication blocked

## Existing app compatibility

Existing compatibility key:
- gerar

It remains a runtime compatibility alias for:
- JBC-CR-PLACE-GERAR-001

All surfaces must resolve to one stable identity:
- Scripture
- Detail
- Map
- Explorer
- internal PassageLink

When switching from another Place/Person to Gerar Detail:
- panel scrollTop must reset to 0

Panel interaction contract:
- Search workspace action: 본문보기
- Study workspace entity action: 본문연구
- Passage Research return action: automatic previous entity label
- fixed first-tier header height follows the common Place/Person contract

## Implementation boundary

This handoff authorizes implementation against the approved current professional representative.

It does NOT authorize:
- external/public release
- physical Project01 Registry mutation
- canonical exact coordinate assignment
- BAT01 crosswalk
- new Route/Region authority

Before replacing current Gerar reader Detail projection, implementation must:
- verify exact source SHA
- preserve stable identity
- preserve predecessor lineage
- preserve safe fallback
- retain current generic spatial/media fields only where semantically compatible
- add/update Gerar-specific regression
- retain global regression

## Completion definition

Implementation is complete when:
- Full Place Profile reader hierarchy renders
- header type is 성읍·도시
- quick facts use detailed type
- all 61 inline link intentions are representable
- all 41 unique passage ranges resolve locally
- direct mention index remains 10
- canonical coordinate remains null
- map uncertainty marker follows current policy
- Tel Haror remains candidate-only
- competing candidates remain available
- no Abimelech auto-merge occurs
- media rights remain traceable
- Research layer retains uncertainty boundaries
- predecessor is no longer used as current Gerar professional prose except lineage/fallback evidence
- dedicated and global regression pass

external_release: NOT_AUTHORIZED

NEXT_TASK_ONE:
IMPLEMENT_GERAR_FULL_PLACE_PROFILE_DETAIL_AND_INTERNAL_PASSAGE_LINKS_FROM_APPROVED_HANDOFF
