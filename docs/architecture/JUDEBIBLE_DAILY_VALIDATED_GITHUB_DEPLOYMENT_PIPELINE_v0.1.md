# JUDEBIBLE_DAILY_VALIDATED_GITHUB_DEPLOYMENT_PIPELINE_v0.1

status: IMPLEMENTED_FAIL_CLOSED
authority_effect: NONE
created: 2026-10-08
repository: biwon7796-png/JUDEBIBLE-context

## 목적
Project01 자동 연구 결과가 JudeBible canonical projection에 반영되고 QA를 통과한 경우에만 하루 단위로 GitHub main에 반영하고 GitHub Pages 배포와 smoke test까지 수행하는 release pipeline이다.

## 흐름
Project01 Research → JudeBible Projection → Targeted QA → Daily Receipt → Release Gate → exact allowlist staging → Git commit → GitHub push → GitHub Pages → smoke test

## Daily Receipt
경로: docs/receipts/daily-research/YYYY-MM-DD_<task>.json

필수:
- researchStatus: PASS | PASS_WITH_VERIFY
- projectionStatus: APPLIED
- qa.status: PASS
- files[]: { path, sha256 }

HOLD 또는 QA 실패 작업은 releasable receipt를 만들지 않는다.

## Release Gate
node tools/release/daily-validated-release.js [YYYY-MM-DD]

조건:
1. branch=main
2. local HEAD == origin/main
3. staged changes 없음
4. validated receipt 존재
5. receipt status/QA 통과
6. 파일이 allowlist 안에 있음
7. current sha256 == receipt sha256
8. generated JS syntax PASS

통과 시 receipt가 지목한 projection 파일과 receipt만 commit/push한다. unrelated working-tree 파일은 자동 포함하지 않는다.

## Current Bootstrap Hold
현재 local working tree에는 기존 미커밋 변경이 다수 있고 local HEAD와 origin/main도 동일하지 않다. 따라서 release script는 현재 의도적으로 HOLD한다. 먼저 JudeBible baseline reconciliation이 필요하다.

## GitHub Pages
.github/workflows/deploy-pages.yml은 main의 app/data 변경 push에서 실행한다. GitHub Settings에서 Pages source가 GitHub Actions로 활성화되어 있어야 한다. 비활성 상태면 deploy job은 fail-closed한다.

## 경계
- 전문 연구 의미를 생성/수정하지 않는다.
- candidate 자동 promotion 금지
- Registry pointer 변경 금지
- unrelated refactoring/commit 금지
- push 실패는 자동 retry하지 않음
