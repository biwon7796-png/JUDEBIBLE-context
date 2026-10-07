# JUDEBIBLE_DAILY_RELEASE_BASELINE_FREEZE_20261008

status: BASELINE_FREEZE_CANDIDATE
authority_effect: NONE
repository: biwon7796-png/JUDEBIBLE-context
branch: main
date: 2026-10-08

## Purpose

현재 로컬 JudeBible 구현을 일일 연구 자동 반영과 GitHub 배포의 기준선으로 동결한다.
이 문서는 전문 연구 authority를 승격하지 않으며 Registry pointer를 변경하지 않는다.

## Reconciliation

- origin/main: 5183808c775add6f6abdff7ede21f0be95a3db60
- pre-freeze local HEAD: 2888f854bfb7703dfcb9cb5a249df2aa918301c8
- 관계: local main은 origin/main보다 1 commit 앞선 fast-forward lineage이다.
- 기존 working tree에는 다수의 2026-10-01~07 JudeBible 구현 변경과 새 runtime/data/QA 파일이 존재한다.
- baseline freeze는 현재 앱 실행에 필요한 runtime/data, 현재 QA, 연구 projection pipeline, daily release pipeline, 관련 architecture docs를 commit 대상으로 삼는다.
- 임시 screenshots, baseline backups, PoC 작업물, tools/_tmp* 및 generated QA HTML은 baseline release 대상에서 제외한다.

## Validation Evidence

### Syntax
- top-level runtime JS
- data/*.js
- tools/pipeline/*.js
- tools/release/*.js
총 90개 파일: SYNTAX_ALL_PASS

### Browser targeted QA
- qa-linkage: 15/17
  - LK-11 Search PLACE global context sync PASS
  - LK-12 Search PERSON global context sync PASS
  - LK-16 primaryPassage/fallback/no-passage contract PASS
  - LK-17 shared media/Search/Map relation PASS
  - LK-06/LK-07은 기존 Timeline projection failure로 분류
- qa-w2: 2/6
  - W2-005 PASS
  - W2-006 PASS
  - W2-001~004는 기존 passage mount/scroll/history debt로 baseline-known failure
- qa-jn의 기존 JN-04/05/06/09 stale selector debt는 known debt로 유지
- MapLibre는 flag 기반 병렬 renderer이며 legacy SVG가 default이다.

## Freeze Boundary

포함:
- 현재 app/index/styles/runtime
- shared research projections and scripture index
- current navigation/search/research/map QA
- original-language runtime data
- legacy terrain tile runtime
- MapLibre local vendor + baked terrain runtime
- research projection/pipeline code
- daily validated release gate
- GitHub Pages deployment workflow
- architecture completion/contracts relevant to current runtime

제외:
- screenshots/
- baseline/ 작업 백업
- poc/ 실험 디렉터리
- tools/_tmp*, tools/_out*, probe/capture artifacts
- source-only Holman files and unrelated local scratch files

## Daily Release Rule

baseline push 이후 local HEAD == origin/main 이 성립해야 한다.
그 다음부터 daily release는 machine-readable research receipt가 지목하는 allowlisted projection 파일만 commit/push한다.
unrelated working-tree 파일은 자동 릴리스에 포함하지 않는다.

## Known Risk

- Timeline projection LK-06/LK-07 debt
- W2 passage mount/scroll/history debt
- qa-jn stale selector debt
- GitHub Pages repository setting이 GitHub Actions source를 허용하는지 push 후 workflow에서 확인 필요

## Promotion Boundary

이 baseline commit/push는 application delivery baseline이다.
Project01 professional representative promotion, Registry ACTIVE 전환, source authority 변경을 의미하지 않는다.
