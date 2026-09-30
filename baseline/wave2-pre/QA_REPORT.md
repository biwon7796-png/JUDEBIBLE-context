# QA 보고

- `?qa=auth` → **AUTHORITATIVE QA-BVC-001~020** (원본 spec 번호 그대로, `qa-auth.js`) — 최종 **20/20 PASS**
- `?qa=self` → IMPLEMENTATION_SELF_QA (구 자체 정의 QA, 보존) — 20/20
- `baseline/` — 수정 전 코드·이전(임시 매핑) qa-auth 보존
- 증거: 실행 시 `#auth-qa-report` / `window.BVC_AUTH_QA`

원본 spec 기준 첫 실행(수정 전): 17/20 — FAIL 014(side panel sheet 미변환), 017(대소문자/영문 표기 변형 미회수), 018(detail 닫은 뒤 본문으로 focus 회귀 안 됨).
최소 수정: 모바일 CSS bottom sheet, 인물·장소 `aliases` + 검색 반영, Escape 시 본문 태그로 focus 회귀. 이후 20/20.

| ID | 결과 | 핵심 증거 |
|---|---|---|
| 001 | PASS | text-pane top=90/viewport 420, Context·지도·사진 데이터 제거 후에도 3절 렌더, 오류 0 |
| 002 | PASS | context→people→places→photos 모두 passage/ref/verse 4, scrollY 120 유지 |
| 003 | PASS | 엔티티 열기/닫기 후 상태 동일(tab=crossref, verse 4), scrollY 100→100 |
| 004 | PASS | Places 선택 moriah → 지도 active pin `l.moriah` |
| 005 | PASS | 지도 핀 클릭 → Places 상세 `l.moriah` |
| 006 | PASS | preview 후 상태·본문 HTML·hash 불변 |
| 007 | PASS* | 명시적 열기 → heb-11:17(hash 변경), back(hashchange) → gen-22:2 crossref 복구 |
| 008 | PASS | 3종 잘못된 참조 모두 heb-11:18 유지 + 오류 문구 표시 |
| 009 | PASS | 사진 실패 시 Photos만 degraded, Context·본문 사용 가능 |
| 010 | PASS | 좌표 오류/지도 패널 예외 시에도 장소 텍스트 목록·상세 사용 가능 |
| 011 | PASS | reload 및 공유 URL fresh load 모두 `gen-22:2&tab=map&e=l.moriah` 복원 |
| 012 | PASS | reload·새 로드 후 note 복원 |
| 013 | PASS | 네트워크 호출 0, URL·공개 데이터·소스 파일에 note 없음 |
| 014 | PASS | side-pane static→fixed(bottom 0), 상태·ID 동일 |
| 015 | PASS | 누락 필드 0, figure에 source/rights/license 표시, 필드 누락 시 렌더 0 |
| 016 | PASS | rights=VERIFY / RIGHTS_VERIFY 모두 figure·이미지 본체·ID/제목 DOM 없음 |
| 017 | PASS | 이삭/NFD/공백/Isaac/ISAAC/전각 등 변형 모두 첫 결과가 canonical target |
| 018 | PASS | 탭 순서 본문(10)<모듈(25)<detail(26), Enter로 detail, Escape 후 focus가 본문 tag로 복귀 |
| 019 | PASS | 패널 전부 예외/선택 데이터 전부 부재에도 본문 정상, 오류 0 |
| 020 | PASS | HARAM 언급 0, 외부 로드 0, 이미지 요소 0 |

\* 007: 합성 클릭은 user activation이 없어 Chrome이 history entry를 back에서 건너뛰므로, 자동 테스트는 back이 일으키는 hashchange로 구동. 실제 클릭 후 브라우저 back은 수동 검증 완료(이전 코드 기준: 지도→인물→문맥 순 복원).

---

# VISUAL_POLISH_v0.1 검증

- 변경: `styles.css` 전면 재작성(semantic token · 타이포 위계 · 밑줄형 탭 · 공통 entity 피드백 · 모바일 sheet), `index.html`(QA 패널 마크업 제거), `app.js`(클래스/섹션 마크업만, state·entity·URL 계약 불변), fixture 사진 placeholder 색상만 조정. 이전 버전은 `baseline/*before-visual-polish*` 에 보존.
- QA selector: visible text 의존 제거 → `data-section`, `aria-current`, `.empty`, `data-state`, `data-places`, `data-id` 사용.
- 일반 모드: QA 패널/스크립트 결과 DOM 0개 (`?qa=auth` / `?qa=self`에서만 생성).
- 재실행: `?qa=auth` 20/20, `?qa=self` 20/20.
- 스크린샷(`screenshots/`): before-/after- desktop(문맥, 지도+entity), mobile(문맥, 장소+entity), after-desktop-people-entity. 모바일은 `_frame.html`(390px iframe)로 촬영(headless Chrome 최소 창 폭 회피).

---

# KRV 본문 결속 (BIND_VERIFIED_KRV_BIBLE_TEXT v0.1)

**상태: 본문은 결속됐지만 "검증된 원문"이 아니다 — `UNVERIFIED_TRANSCRIPTION`.** 외부 공개 금지(CAPTAIN_ONLY).

- 본문: `data/krv.js` (성경전서 개역한글판, 대한성서공회 1961; 66권·1189장·31102절). 출처 = ko.wikisource.org 개역한글판 전사본(책별 revid·wikitext sha256 고정). 상세: `data/krv.provenance.json`.
- 원문 처리: `{{절}}` 마커 제거, 시적 줄바꿈(`<br>`) 29건을 앞 절에 `\n`으로 연결한 것 외 무수정. 화면 DOM 본문 == 데이터 원문(K03에서 전 절 대조).
- 권리 경계: 본문 = `PD_CLAIMED_NOT_CONFIRMED_BY_PUBLISHER` (위키문헌·BLB는 만료/PD 표기, 대한성서공회 사이트는 "ALL RIGHTS RESERVED" 표기, 공식 저작권 안내 페이지는 403으로 미확인). 데이터 파일 = `RIGHTS_VERIFY` (위키 기여물 CC BY-SA 가능성). 출처 불명 GitHub JSON은 canonical로 사용하지 않음.
- 교차 대조(BLB Korean Holy Bible, 비교 전용): 31102절 중 exact 21173, 공백만 5228, 문장부호만 609, 위키문헌 괄호 표제 110, **어휘 차이 1121**, 비교 불가(BLB 파싱 실패 장) 2861. 어휘 차이에는 비교원의 정렬 오류·"(앞절과 동일)"류 자리표시가 섞여 있고, 위키문헌 쪽 누락 의심(요나 1:4)도 있다 → `data/source/xcheck/krv_vs_blb_lexical_differences.json`. 두 자료 모두 비공식 전사본이므로 공인 사본 대조 전까지 미검증.
- 관계 데이터(문맥·인물·장소·사진·관련 본문·자료)는 여전히 샘플이며 featured 3개 장(창 22, 히 11, 창 12)에만 있다. 나머지 장은 순수 본문 + "문맥 정보 없음" 안내.
- 추가된 최소 이동 수단: 이전/다음 장 버튼, 검색창의 성경 참조 입력(예: `창 22:2`, `요 3:16`, `시편 23편`). URL 계약은 확장(책 id에 숫자 허용, 예 `#1co-13:4`)만 하고 기존 형식 그대로 유효.
- 재실행 결과: `?qa=auth` 20/20, `?qa=self` 20/20, `?qa=krv`(KRV 결속 추가 스위트) 9/9.
- QA 기대값 조정(요구 완화 아님): 실제 본문으로 절 수·등장 인물이 달라져 하드코딩 값(8절·3절·이삭만)을 데이터 기반 값으로 교체, 020 HARAM 스캔에서 성경 본문의 지명 "벧 하람"(수 13:27) 오탐 제외(라틴 `haram`만 검사).

---

# WAVE 1 — 텍스트 작업공간 (현재 결속 KRV 작업본 위)

- 착수 전 백업·상태 기록: `baseline/wave1-pre/` (파일 사본 + `WAVE1_PRE_EDIT_STATE.md`: sha256, 서빙 경로 = `F:\Projects\웹앱` @ localhost:8765, 서버 응답 == 디스크, "샘플 프로토타입" 라벨·`#passage-nav` 존재 기록).
- KRV: `data/krv.js` 무수정(sha256 b09a58f1…), meta·provenance 그대로, **verified 주장 없음**(`canonical_final: false`, UNVERIFIED_TRANSCRIPTION). Viewer는 KRV를 deep-freeze 한 읽기 전용으로만 사용.
- 변경: 참조 입력(`#ref-form`) + 참조 정규화/파서(영문명·`-` 범위·전각/공백 변형) + `openReference`, 본문 상시 마운트(문맥 상호작용은 클래스만 갱신, 통과 시 `#verses` childList 변이 0), 선택 절 상태 유지(URL 왕복), passage scroll anchor(첫 걸친 절, 본문 재방문 시 복원), 미해결 KRV 이형 hook(`window.BVC_KRV_VARIANTS` → `data-krv-variant`, 표시 비차단), ContextSurface 실패 격리(탭·패널 DOM 제거까지), 샘플 본문 선택기·프로토타입 라벨 제거, 참조 오류는 레이아웃을 밀지 않는 고정 토스트.
- QA: `?qa=w1` QA-W1-001~008 = 8/8, 회귀 `?qa=auth` 20/20 · `?qa=self` 20/20 · `?qa=krv` 9/9.
- QA 조정(요구 완화 아님): 제거된 샘플 선택기 selector를 참조 입력으로 교체(self 002, auth 019), auth 001은 "verse 없는 URL은 본문 상단 · verse 있는 URL은 선택 절이 화면 안"으로 분리, auth 020 개발용 스크립트 화이트리스트에 qa-w1.js 추가.
- 스크린샷: `screenshots/wave1-desktop.png`, `screenshots/wave1-mobile.png`.
