# Wave 1 착수 전 상태 기록 (읽기 전용 스냅샷)

기록 시각: 2026-09-30T06:58:28

## 파일 해시 (sha256)
- `index.html` — 1377 bytes — fdbca419afdcb8c9a523cea0672a4d1194c45b96e54b2578ac8e445fcb0cf4b4
- `app.js` — 30337 bytes — 17bbb0fe4dafc73e902c35f11fdc5fca18ab2dd9cebd1ee5a76326337aef05b2
- `styles.css` — 14157 bytes — cd45e1e9e2ec95234106646fa62ef4635c320372e01c659bc5f9bac31aca0bfd
- `self-qa.js` — 7478 bytes — 27e7a9a1eb9f1223c2cde29b843fc6019643b6e858cd191dc0960ca769c9783d
- `qa-auth.js` — 25429 bytes — d31559e528f807478b454beff010e96e1c33f0f5a0a301f603bf369cf07e4e2b
- `qa-krv.js` — 12673 bytes — 0bb300c91d50e902986e538a147fc4223e5566a181e94943d054373df11e83c7
- `data/krv.js` — 4501053 bytes — b09a58f1527bb32ccc554d5208736a3c797ba9b7ab1a87d50e9c577372518896
- `data/fixture.js` — 4710 bytes — e6ff78aa8a5afe2e1032036755588e948b1559aabbbb8bef01d7eae30b7c1bf5
- `data/krv.provenance.json` — 29894 bytes — 36bd3dbde77a905f2c7cc8c2cf28ecd3f67999c62b1004f523e6932137cdd676

## 런타임 상태
- 서빙 경로: `F:\Projects\웹앱` (http://localhost:8765, preview server = python -m http.server 8765, .claude/launch.json)
- 서버 응답 index.html == 디스크 index.html: True

## prototype label 존재 여부
- "샘플 프로토타입" 라벨 in index.html: True
- passage-nav(샘플 본문 선택기) in index.html: True
- QA 패널 마크업 in index.html(일반 모드 노출): False
- QA 패널은 ?qa=self|auth|krv 에서만 JS가 생성
- KRV 메타 상태: UNVERIFIED_TRANSCRIPTION (krv.js meta.quality.status)
