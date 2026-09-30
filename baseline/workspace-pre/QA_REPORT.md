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

---

# WAVE 2 — Persistent Center Context

- 착수 전 백업: `baseline/wave2-pre/`. `data/krv.js` 무수정(sha256 b09a58f1…), KRV 결속·Wave 1 구조 유지.
- 구현: (1) 본문 상시 마운트를 패널/시트/히스토리까지 확장 (2) 선택 절 보존 (3) 스크롤 앵커: 첫 걸친 절+오프셋, 패널 reflow·history 복귀·새로고침(history.state) 후 복원 (4) back/forward: history entry 마다 "떠날 때의 앵커"를 저장, 상태 복원은 새 entry 를 만들지 않음, UI 상태(패널/시트)는 history 로 되돌리지 않음 (5) 데스크톱 맥락 패널 `open|collapsed` (접기 버튼·"맥락 열기"·탭/엔티티 클릭 시 자동 재오픈·URL `&panel=collapsed`) (6) 모바일 맥락 시트 `peek|half|full` (핸들 버튼 순환·탭/엔티티 시 peek→half 자동·URL `&sheet=peek|full`·뷰포트 전환 시 상태 유지).
- URL 계약: 기존 형식 그대로 + 선택적 `&panel=` / `&sheet=`(기본값은 생략). 패널/시트 변경은 replaceState(히스토리 항목 추가 없음).
- 검증: `?qa=w2` 6/6 (공식 QA-W2 명세는 없어 구현 항목에서 도출한 QA-W2-IMPL), 회귀 `?qa=w1` 8/8 · `?qa=auth` 20/20 · `?qa=self` 20/20 · `?qa=krv` 9/9. 실제 클릭+브라우저 back/forward 수동 검증: back 시 탭·시트 상태 유지, 스크롤 앵커(7절) 복원, forward 시 heb-11:17 및 앵커 복원.
- 발견·수정: 앵커를 화면 전환 "후"에 계산해 history 앵커가 null 이던 문제(render 시작 시점으로 이동) · 앵커의 passage 를 state 가 아닌 마운트된 DOM 기준으로 · back/forward 로 떠나는 entry 앵커 미저장.
- 스크린샷: `screenshots/wave2-desktop-open.png`, `wave2-desktop-collapsed.png`, `wave2-mobile-half.png`, `wave2-mobile-peek.png`, `wave2-mobile-full.png`.

---

# 검색 작업공간 (인라인 결과 칩 → 전용 검색 화면)

- 제거: 인라인 결과 칩(`.sr`), 본문을 아래로 미는 결과 영역, 작은 결과 패널. 결과는 `#search-workspace`(role=dialog) 안의 `#search-results` 로만 렌더링.
- 데스크톱: 큰 오버레이 패널(폭 ≤1040px, 높이 ≤90vh), 다중 행 카드(참조 · 최대 4줄 본문 미리보기 · 검색어 `<mark>` 강조 · 클릭 시 본문 열기), 필터(종류: 전체/인물·장소/구절, 범위: 전체/구약/신약), "더 보기".
- 모바일: 전체 화면 결과 시트(세로 카드, 16px 입력), 닫기 → 이전 본문 그대로 복귀.
- 보존: 선택 절·스크롤 앵커·패널/시트 상태·본문 DOM(닫기 3경로 Escape/닫기 버튼/backdrop 모두 검증). 결과를 열면 이동 후 닫힘.
- 헤더가 화면 밖일 때만 보이는 "검색" 진입 버튼과 `/` 단축키: 본문 스크롤 위치를 잃지 않고 검색을 열기 위함(헤더 입력에 포커스하면 페이지가 맨 위로 스크롤되는 문제를 QA가 드러냄).
- 검증: `?qa=sw` 8/8(QA-SW-IMPL, 이번 요구에서 도출한 구현 QA), 회귀 `?qa=auth` 20/20 · `?qa=self` 20/20 · `?qa=krv` 9/9 · `?qa=w1` 8/8 · `?qa=w2` 6/6.
- 스크린샷: `screenshots/search-desktop.jpg`, `screenshots/search-mobile.jpg`.

---

# 참조 이동 상시 접근 (스크롤 리셋 없음)

- 고정(sticky) 헤더: 데스크톱은 브랜드+참조 입력+검색, 모바일은 컴팩트 1줄(참조 입력 + "검색" 버튼, 높이 ≈59px = 뷰포트 8%). 헤더가 항상 화면에 있으므로 입력창 포커스가 페이지를 움직이지 않는다. 이전에 넣었던 "검색 FAB"은 불필요해져 제거. `/` 단축키와 검색 작업공간은 유지.
- 스크롤 앵커는 고정 헤더 아래를 읽기 영역 상단으로 계산(`--hdr-h`, `scroll-margin-top`). 참조 입력: 잘못된 참조는 현재 본문·선택 절·스크롤을 유지하고 입력 텍스트도 유지, Esc 는 정규 표기로 되돌리고 포커스 해제, 성공하면 입력창을 정규 표기로 정리.
- 발견·수정: (1) 검색 창을 닫으면 포커스가 헤더 검색 입력으로 돌아가 그 `focus` 핸들러가 창을 다시 여는 결함 → 검색어를 닫을 때 비움. (2) 앵커 기록이 rAF/스크롤 이벤트에 의존 → 본문을 떠나는 순간 동기 기록, 새로고침 직전(beforeunload) history.state 저장. (3) 뷰포트 전환 시 패널/시트 모드 갱신을 resize 로도 수행.
- QA: `?qa=nav` 6/6 (QA-NAV-IMPL, 구현 요구에서 도출). 회귀 `?qa=w1` 8/8 · `?qa=w2` 6/6 · `?qa=sw` 8/8 · `?qa=auth` 20/20 · `?qa=self` 20/20 · `?qa=krv` 9/9 — **headless Chrome 로 실행**(`tools/run-qa-headless.sh`). 브라우저 패널이 숨김(visibilityState=hidden) 상태에서는 rAF/scroll 이벤트가 오지 않아 일부 QA가 왜곡되어 headless 러너를 병행 사용.
- QA 위생 수정: W2 의 history.length 단정은 iframe 의 joint history 가 50 에서 포화되어 사실상 무의미했음 → 측정 구간을 해당 조작만으로 좁혀 재작성(요구 완화 아님).
- 실제 클릭 검증(모바일 폭): 스크롤 1000px 후 참조 입력 실제 클릭 → 스크롤/앵커 불변, "히 11:17" 입력+Enter → 이동, 대상 절이 화면 안.
- 스크린샷: `screenshots/refnav-mobile.jpg`(스크롤한 상태에서 고정 헤더 + 컴팩트 참조 입력). 데스크톱은 headless 캡처가 스크롤 상태에서 왜곡되어 QA 측정치로 대체.
