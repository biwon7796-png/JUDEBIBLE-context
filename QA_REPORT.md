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

---

# INTEGRATED_WORKSPACE_v0.2 (IMPLEMENT_LOCKED_BIBLE_CONTEXT_VIEWER_INTEGRATED_WORKSPACE_v0.2)

- 배치(데스크톱 ≥1100px): `[관점 레일 | 상세 패널] [지도 | 분할선 | 본문] [안내 패널]`. 1100px 미만은 안내가 상단 한 줄, 760px 이하는 안내 → 지도(접기) → 본문 + 기존 하단 맥락 시트.
- 문서 스크롤은 window 하나로 유지(스크롤 앵커·history 복원 보존), 좌우 패널은 sticky. DOM 순서는 본문 → 모듈 → 안내(QA-BVC-018 키보드 순서 유지).
- 기존 id(`#tabs`, `#panel`, `#side-pane`, `#panel-toggle`, `#panel-open`, `#text-pane`) 유지. 관점 레일 = 기존 8개 탭(세로 배치), 상세 패널 = 기존 `#panel` + 선택 항목 `.detail` 블록.
- 지도 창은 `svg.smap`(탭 안의 `svg.map` 과 클래스를 분리해 기존 QA 셀렉터 보존). 안내 경로 = `placeLinks[passage]` 순서. 이전/다음 = 경로 위 place selection(→ 지도 핀·상세·본문 태그 동기화, history entry 생성).
- 분할선: 포인터 드래그·키보드(←/→, Home/End, Enter=40% 초기화)·더블클릭 초기화, 본문 ≥340px/지도 ≥180px 클램프, 비율은 localStorage(`bvc.split.v1`)에만 저장(URL·workspace state 불변), 조작 전후 읽던 절 앵커 고정.
- 신규 QA: `?qa=ws` **10/10** (QA-WS-IMPL). 회귀(headless): auth 20/20 · self 20/20 · krv 9/9 · w1 8/8 · w2 6/6 · sw 8/8 · nav 6/6.
- 수정한 기존 QA: `qa-auth.js` QA-020 의 자체 파일 허용 목록에 `qa-ws.js` 추가(외부 자산 금지 검사는 그대로).
- 스크린샷: `screenshots/workspace-desktop.png`, `screenshots/workspace-mobile.png`. 수정 전 코드: `baseline/workspace-pre/`.

---

# IA_ALIGNMENT_v0.2.1

- 1차 관점 레일 = 3개(**문맥·인물·장소**). 지도·사진·관련 본문·외부 자료·내 메모는 상세 패널 위 "관련 도구" 줄(`#modules`)로 이동: 현재 관점 소속 모듈이 앞에, 나머지는 흐리게 뒤에(접근은 항상 가능). 소속: 지도·사진→장소, 관련 본문·외부 자료·내 메모→문맥. 레일 선택 표시는 모듈 활성 시 소속 관점.
- state.tab 값 8종·URL(`tab=map` 등) 그대로 → 기존 딥링크·history 호환.
- 안내 이전/다음(및 단계 클릭)은 접힌 상세 패널/시트를 강제로 열지 않음. 지도 핀·안내·본문 태그만 동기화하고 URL 은 `panel=collapsed` 유지; 사용자가 열면 상세가 준비되어 있음. (지도 핀·카드·본문 태그 클릭은 기존처럼 패널을 연다.)
- `placeLinks` = `FIXTURE_SAMPLE`: `fixture.js` 의 `placeLinksStatus` + 주석, 안내 패널 배지("샘플 경로 · 실제 지리 데이터 아님", `data-route-source`), 지도 안내문.
- 수정한 기존 QA: `self-qa.js` 004(탭 8개 → 레일 3 + 관련 도구 5, 명세 변경에 따른 것), `qa-ws.js` 008(안내가 패널을 여는 기대 → 열지 않음). 신규 `qa-ws.js` 011·012.
- 결과(headless): auth 20/20 · self 20/20 · krv 9/9 · w1 8/8 · w2 6/6 · sw 8/8 · nav 6/6 · ws 12/12. 수정 전: `baseline/ia-pre/`. 스크린샷: `screenshots/ia-desktop.png`, `screenshots/ia-mobile.png`.

---

# LOCK_v1.1_ALIGNMENT (JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1)

- 권위 문서: `docs/architecture/JUDEBIBLE_CONTEXT_PRODUCT_INTERFACE_INTERACTION_DATA_ACCUMULATION_LOCK_v1.1.md` (프로젝트 루트 원본과 동일 복사). 정렬 전 코드: `baseline/lock-pre/`.
- 충돌 → 정렬: (1) 1차 레일이 문맥·인물·장소(추정) → **본문연구·지도·연표 + 유틸리티 검색·설정**, (2) 8개 탭이 레일 → **Detail 안의 맥락 도구**(기존 컴포넌트 재사용), (3) Detail 기본 열림 → **기본 CLOSED**(명시적 객체 선택 시 열림; URL 은 `panel=open` 만 표기), (4) Guide 단계가 Detail 을 열지 않음(v0.2.1 유지)+카메라 이동·레이어·범례·하단 고정 이전/다음(§7 순서), (5) 지도 관점 = 전체 캔버스 + 오버레이(Detail/Guide 가 지도를 밀지 않음), (6) 연표 관점 = 전체 작업공간(passage·선택 대상 이어받기, 데이터 미생성), (7) 지도 pan/zoom/grab 커서, (8) Detail 열림/닫힘 시 본문 폭 유지·지도가 공간 수용, (9) Detail 내용 §6 순서(정체·핵심사실·요약·관련구절(본문에서 보기)·연구상세 기본 접힘), (10) 제품명 표시 주드-컨텍스트바이블 / JudeBible Context (내부 식별자·BVC 는 유지), (11) `placeLinks` = FIXTURE_SAMPLE + NON_AUTHORITATIVE 표기.
- 기존 QA 를 바꾼 곳(명세 변경에 따른 것만): W2-002/003 은 Detail 을 연 상태에서 시작, W2-005 는 기본 닫힘·`panel=open` 기준으로 재작성, W1-002/004 는 픽셀 scrollY 대신 읽던 절 앵커(verse+offset)로 판정(Detail 을 여는 첫 클릭이 줄바꿈을 바꿀 수 있어서), self-qa 004 는 8탭+레일 3관점 확인, ws 001/008/011 갱신. 신규 ws 013–017.
- history 이동은 화면 상태(panel/sheet/view)를 덮어쓰지 않음(사용자가 닫아 둔 Detail 을 되살리지 않는다). URL 이 화면 상태만 바꾼 경우와 최초 로드에서만 반영.
- 결과(headless): auth 20/20 · self 20/20 · krv 9/9 · w1 8/8 · w2 6/6 · sw 8/8 · nav 6/6 · ws 17/17.
- 스크린샷: `screenshots/lock-desktop-study.png`, `lock-desktop-detail.png`, `lock-desktop-map.png`, `lock-mobile.png`.

## HOLD_AND_REPORT (문서가 침묵 → 구현하지 않음/최소 처리)
1. 설정 유틸리티의 내용: 저장되는 유일한 화면 설정(분할 비율 초기화)만 제공. 그 외 항목 미정.
2. 문맥(주제·구조)·관련 본문·외부 자료·내 메모 같은 **본문 단위 도구**의 위치: Lock §3.1 은 "선택 객체의 detail 또는 contextual tool"만 규정 → 현재는 Detail 의 도구 탭에서 접근(객체 없이 "맥락 열기"로 열 수 있음). 최종 배치는 설계 결정 필요.
3. 모바일 매핑: 기본 시트 half 유지(Detail 기본 CLOSED 의 모바일 대응 미정), 관점 바·지도 접기는 임시 배치.
4. 연표 관점의 Guide/Detail 표시 여부와 데이터·컨트롤: 숨김 + "데이터 미연결" 안내만.
5. 관점(view)·지도 카메라·레이어의 URL/history 처리: view 는 `&view=`(기본 생략, history entry 를 만들지 않음), 카메라·레이어는 메모리 전용.
6. GuideTopic/GuideStep·Entity/Relation/Claim/Evidence 데이터: fixture 에 없음 → Guide 는 `placeLinks`(샘플)에서 파생한 임시 projection. region/terrain/historical 레이어, 거리, 중요 인물·사건은 데이터가 없어 생략.
7. §12–19 데이터 축적 파이프라인·외부 소스(STEP/OpenBible/Pleiades/OSM): 범위 밖(HOLD_UNTIL_RUNTIME_AUTHORITY_RESOLVED). 배경지도는 여전히 SVG 스케치.
8. "본문 독립 세로 스크롤": 현재는 window 스크롤 + sticky 지도(스크롤 앵커·history 복원 QA 보존 목적). 본문 내부 스크롤 컨테이너 전환은 별도 검토.

---

# QA_INTEGRITY_VERIFICATION (v1.1 정렬 후 검증)

- 원본 대비 diff(qa-auth·qa-krv·qa-nav·qa-sw 변경 없음, self-qa 004·qa-w1·qa-w2 만 변경). **약화 1건 발견·수정**: qa-w1 002 에서 삽입한 `//` 주석이 같은 줄의 `ok(__errs.length === 0); clean(x)` 를 무력화했고, W1-002/004 의 픽셀 scrollY 단정을 앵커 단정으로 대체해 강도가 낮아져 있었음. → 원래 단정(scrollY ±1/±2, 오류 0, clean)을 그대로 복원하고 "Detail 열린 상태에서 시작"이라는 선행 조건만 추가. 좁은 폭에서 닫힘→열림 시 줄바꿈이 바뀌어도 읽던 절 앵커·선택 절이 유지됨은 신규 ws 018 로 별도 보장.
- 명세 변화에 따른 변경으로 인정: W2-005(기본 닫힘·`panel=open` 표기; 기존 explicit `panel=collapsed`·잘못된 값 거부 단정은 유지), W2-002/003 선행 조건(setPanel open), self-qa 004(8탭 단정 유지 + 레일 3관점 단정 추가).

---

# GUIDE_TOPIC_STEP_FIXTURE_LAYER_v0.1

- 스키마/데이터: `data/guide.fixture.js` (`window.BVC_GUIDE_FIXTURE`) — Lock v1.1 §13 GuideTopic·GuideStep 필드 전부 + `status: FIXTURE_SAMPLE`, `authority: NON_AUTHORITATIVE`(meta·topic·step 각각). `source_research_asset_ids: []`.
- Guide 는 이제 topic(`passage_refs` 매칭) → step(`sequence` 순) 만 읽음: 진행·단계 제목·현재 단계 설명·지도 대상·중요 장소/인물·범례(route_id)·이전/다음 순서. 단계 진입 시 `camera_target` 으로 카메라 이동, `layer_state` 로 레이어 초기화, 선택 대상은 `place_ids[0]`(없으면 `person_ids[0]`). 지도 경로선·핀 번호도 단계/route 에서 옴.
- `placeLinks` 는 더 이상 Guide 를 구동하지 않음(지도의 장소 핀 집합·기존 "지도" 도구 탭용 fixture 로만 남음, `mapModel`). placeLinks 를 지워도 Guide 동작(ws 019).
- 검증: ws 19/19(신규 019: 스키마·표식, placeLinks 삭제 후 동작, fixture 의 sequence/zoom/layer_state/person_ids 를 바꾸면 Guide·카메라·레이어·대상이 따라감, 닫힌 Detail 유지), auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6.
- 기존 QA 변경: qa-auth QA-020 허용 파일 목록에 `guide.fixture.js` 추가(외부 자산 금지 검사 그대로), ws 007(빈 상태 문구)·017(objects 파트 추가)은 본 구조에 맞춰 갱신.

---

# UNIFY_MAP_AND_GUIDE_FIXTURE_PLACE_IDENTITY_v0.1

- 단일 출처: `data/fixture.js` 의 `places` (장소 Entity). 항목 형태: `{ id, type:"place", label, name(=label, 기존 코드용 별칭), aliases, x, y(=FIXTURE_POSITION), status:"FIXTURE_SAMPLE", authority:"NON_AUTHORITATIVE", position_status:"FIXTURE_POSITION", note, photos }`.
- 지도 핀 집합 = `placeIdsFor(passage)` = GuideStep.place_ids(단계 순) + 본문에 실제 출현하는 장소(어휘 인식) — 전부 `D.places` 의 id. Guide `place_ids`, Detail(`state.entity`), 지도 핀 선택, 본문 태그가 같은 id 를 공유(ws 020 로 지도핀→Detail→Guide→태그, Guide 이전→Detail·핀, 상세 카드→Guide·핀 확인).
- `placeLinks`: fixture 의 독립 표 제거. `D.placeLinks` 는 app.js 가 만드는 **읽기 전용 호환 뷰**(파생값)이며 앱 기능은 읽지 않음(값을 바꿔도 지도 불변, ws 020). `placeLinksStatus = "DERIVED_COMPAT_VIEW"`.
- QA: auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 20/20. 변경한 기존 검증: ws 012 의 표식 확인 대상(placeLinks 표 → 장소 Entity status/authority).
- HOLD 유지: 경로·region·terrain·historical 레이어 스키마, 실제 거리 데이터, Atlantis/Hezekiah.

---

# FULL_WIDTH_AND_CONNECTED_DETAIL_PANEL_v0.1

- **전체 폭**: `--wrap: 100vw`, 워크스페이스 max-width 제거, 데스크톱 바깥 여백 24px→14px. 1920px 기준 콘텐츠 폭 ≈1632px(좌우 여백 각 144px) → 1905px(14px). 열: Rail 68 · 지도(flex) · 분할선 · 본문(읽기 폭 ≤720px 상한, 남는 폭은 지도가 흡수) · Guide 280(≥1600px: 320).
- **Detail = 지도 캔버스 위 overlay(레이아웃 열 아님)**: `#side-pane` 이 `#map-pane` 안에 있고 `position:absolute`(z1), 지도 캔버스는 z0 로 pane 전체를 채움, 확대/축소 컨트롤 z2. 폭 300~340px, 자체 세로 스크롤. 열고 닫아도 지도 폭·본문 위치/폭·분할 비율·카메라·레이어·스크롤 불변(ws 001/008). 지도 관점에서도 같은 overlay(레일 오른쪽에서 시작).
- **탭 UI 제거**: `#tabs`/`role=tab`/`data-tab` 없음, 지도 탭·Detail 안 지도 UI 없음. Detail 은 선택 Entity 의 세로 정보 흐름: identity → quick facts → summary → 관련 구절 → 관련 인물 → 관련 장소 → 사진 → 연구 상세(기본 접힘). fixture 에 없는 사건/시대/지역은 섹션 숨김. 선택 대상이 없으면 "본문 개요"(문맥·인물·장소·사진·관련 본문·외부 자료·내 메모를 접이식 섹션으로 나열: 기존 기능 보존).
- **연결 이동**: 관련 구절→오른쪽 본문 이동(같은 본문은 스크롤, 다른 본문은 본문 전환+선택 대상 유지+history entry), 관련 인물/장소→같은 Detail 에서 대상 교체(장소는 지도 카메라·활성 핀·Guide 단계 동기화), "‹ 본문 개요"로 복귀. 연결 근거는 GuideStep fixture 만 사용(추론 없음).
- **QA 변경(명세 변경에 따른 것)**: 탭 클릭 → `B.setTab(...)`(개요 섹션 열기), 지도 탭 검사 → 상시 지도(`svg.smap`)로, 지도 패널 예외 시험 → 좌표 getter 예외로, QA-018 탭 순서 → 본문<지도 컨트롤<상세, self-qa 004 → 탭 부재·3관점, W1-008 은 `#map-pane` 제거로 대체, ws 001/002/004/008/011/013/020 갱신. 기존 보호 단정(앵커·history·선택 절·오류 0)은 유지.
- 결과(headless): auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 20/20. 스크린샷: `screenshots/fullwidth-desktop-detail.png`, `fullwidth-desktop-closed.png`, `fullwidth-mobile.png`.

---

# PASSAGE_OVERVIEW_CONNECTED_FLOW_v0.1

- 본문 개요(선택 Entity 없음)는 아코디언 선택기가 아니라 하나의 세로 흐름(`.ov-flow`): 본문 문맥 → 등장 인물 → 등장 장소 → 관련 본문 → 대표 사진 → (접힘 허용) 외부 자료 · 내 메모 · 연구 상세.
- 기본 펼침(데이터 있을 때만): 문맥·인물·장소·관련 본문·사진. 기본 접힘: 외부 자료(세부 목록, 개수 표시)·내 메모·연구 상세. 데이터가 없는 섹션은 숨김(빈 아코디언 없음). 사건/장면은 fixture 데이터가 없어 섹션을 만들지 않음.
- 인물/장소 카드는 그대로 링크(인물→같은 Detail, 장소→Detail+카메라+핀+Guide), 관련 본문 링크→본문 pane 이동. 선택 Entity Detail 은 핵심 관계 자동 노출·연구 상세만 접힘(변경 없음).
- QA 변경(명세 변경): K07·self-qa 015 의 "빈 상태 문구 존재" → "해당 섹션 숨김". 신규 ws 021. 결과: auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 21/21.

---

# BEERSHEBA_APPROVED_PROJECTION_v0.1

- 게이트 저장: `docs/architecture/BEERSHEBA_PRE_IMPLEMENTATION_GATE_v0.1.md`. 승인된 최소 Change Set 만 구현. 영수증: `docs/receipts/BEERSHEBA_WEB_PROJECTION_E2E_receipt.md` (BEERSHEBA_WEB_PROJECTION_E2E = PASS).
- 신규: `data/projection.beersheba.js`(승인 연구 투영 1건), `qa-bs.js`(?qa=bs 11/11). 수정: app.js(투영 어댑터·stable id 해석·미확정 장소 지도 처리·연구 Detail 흐름), fixture.js(브엘세바 stub·placeholder 사진 제거), guide.fixture.js(귀환 단계·경로 제거), styles.css, index.html, qa-auth(허용 파일 목록), qa-ws/self-qa(명세 변경 반영).
- 회귀: auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 21 · bs 11.

---

# BEERSHEBA_DETAIL_FULL_SURFACE_INFORMATION_HIERARCHY_v0.1

- Detail(브엘세바 투영)를 카드 없는 한 장의 편집면으로 재구성. 순서: 이름(ko/en·유형·위치 상태) → 대표 사진(자리: attribution-only 대체) → 한 줄 훅 → 한눈에 보기(2열 4행) → 이 장소는 왜 중요한가 → 관련 본문(가벼운 pill) → 위치는 어디인가 → (구분선) 사진 출처 · 연구 상세(접힘). 위계는 글자 크기·굵기·여백·정렬로만.
- 대표 사진 관문 `BVC.mediaGate`: https://upload.wikimedia.org/ 미리보기 URL + creator/license/source page + 앱 측 rights 검증(validated·CLEARED)이 모두 있을 때만 이미지를 그린다. 현재 데이터는 미충족 → attribution-only(캡션 "브엘세바의 유력한 고고학 후보지" + 출처)가 첫 화면 상단에 보임. 외부 로딩 0.
- 투영 데이터는 기존 값 보존, 핸드오프가 정한 독자용 필드만 추가(`reader_type`, `hero_caption`, `reader.glance`, `location.lead`). 연구 원본·stable_id·지도(핀 없음)·Guide(경로 없음)·Detail 닫힘 기본·분할/앵커/history 불변.
- QA: bs 15/15(기존 11 + BS-12 위계·순서·접기 전 노출·제목·한눈에 보기, BS-13 카드/중첩 테두리 없음·글자 위계·간격, BS-14 미디어 관문 10 케이스, BS-15 좁은 데스크톱/모바일 무오버플로). 회귀: auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 21. 수정한 기존 단정: BS-04(안내 단계 문구 제거), BS-07(새 순서·이름 정보 위치).
- 증거: `screenshots/hierarchy-desktop-top.png`, `hierarchy-desktop-mid.png`, `hierarchy-narrow-desktop.png`, `hierarchy-mobile.png`.

---

# BEERSHEBA_READER_LOCATION_DEDUPE_v0.1

- 독자용 요약("이 장소는 왜 중요한가")에서 위치 문장("정확한 고대 도시의 위치는 … 고고학 후보로 연구되고 있습니다.")을 렌더 시점에 뺐다. 같은 문장은 "위치는 어디인가"에만 남는다. 연구 원문·투영 데이터·Claim/Evidence 는 그대로(재배치만).
- 결과: 왜 중요한가 = 우물·언약·하나님의 임재, 아비멜렉과의 맹세와 예배, 모리아 사건 뒤 귀환, 이삭의 재현현·우물·평화의 맹세. 위치는 어디인가 = 정확한 위치 미확정 · 텔 브엘세바(고고학 후보) · 현대 브엘세바와의 구분. 경쟁 견해는 "필요할 때" 항목이라 독자 층에는 넣지 않았다(연구 상세에 유지).
- 신규 BS-16(위치 talk 미중복·의미 talk 미중복·문장 중복 0·순서 유지·콘솔 오류 없음). bs 16/16, 회귀 auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 21.

- 미디어 출처 링크 규칙(MEDIA_SOURCE_LINK_RULE): 검증된 Commons URL(`source_url` + `source_url_verified: true`, https, commons.wikimedia.org)이 있을 때만 클릭 링크, 파일 제목뿐이면 일반 텍스트. 파일명에서 URL 을 만들지 않음. 브엘세바 미디어는 제목뿐이라 현재 표시 변화 없음. bs 17/17(BS-17), 회귀 유지.

---

# OBSIDIAN_TO_JUDEBIBLE_SINGLE_RECORD_PIPELINE (Beersheba pilot)

- 파이프라인: tools/pipeline (parse → validate → normalize → projection → Scripture Entity Index), `node tools/pipeline/run.js`, 테스트 `node tools/pipeline/test.js` 21/21 (골든·출처 추적·음성 11+fail-closed·Obsidian 문법). 브라우저 `?qa=pl` 8/8. 회귀 auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · ws 21 · bs 17. 영수증: docs/receipts/OBSIDIAN_TO_JUDEBIBLE_PIPELINE_BEERSHEBA_PILOT_receipt.md

---

# NAVIGATION_PANEL_RENAME_AND_DATA_DRIVEN_FALLBACK_v0.1

- 오른쪽 패널 이름 안내 → **네비게이션**(제목·aria·관련 문구·샘플 배지). 빈 문구 "이 본문에는 안내할 이야기·주제가 없습니다." 제거.
- 우선순위: 1 현재 본문의 직접 이야기(CONTEXT, 기존 단계·지도·레이어 유지) → 2 선택한 장소·인물이 단계에 실제로 들어 있는 이야기(RELATED: 단계를 본문 링크로, 선택 대상 유지) → (3 지역 연결: 연결 데이터가 없어 해당 없음) → 4 성경 전체 탐색(EXPLORE: 기초 지리·자연환경·구약 역사·중간기·신약 5개 상위 분류만). 같은 패널의 깊이 전환이며 "성경 전체 탐색 ›"/"‹ 현재 이야기로" 로 오갈 수 있다(본문·절·선택 대상·닫힌 Detail·앵커 불변).
- 하위 계층은 명시적 navigation 메타데이터(연구 투영 record.navigation, GuideTopic.navigation)에서만 domain → period → story → scene 으로 만들어진다. 현재 데이터에는 없어 상위 5개만 표시(시대 목록·사건·경로 미생성, Genesis 22 이야기도 분류에 배정하지 않음). 잠금된 상위 분류 밖의 domain 은 배치하지 않는다.
- QA: ws 25/25(신규 022–025: 이름·빈 문구 없음, 우선순위 1/2/4, 탐색 전환 시 맥락 보존, 메타데이터 구동·추정 금지), 회귀 auth 20 · self 20 · krv 9 · w1 8 · w2 6 · sw 8 · nav 6 · bs 17 · pl 8. 수정한 기존 단정: ws 007/019(빈 문구·이전/다음 → 탐색 상태), 019 배지(내부 코드는 data 속성으로만).
- 증거: screenshots/nav-explore-desktop.png, nav-related-desktop.png, nav-explore-narrow.png.

## IMPLEMENT_REAL_GEOGRAPHIC_MAP_FOUNDATION_AND_LOCATION_STATUS_MARKERS_v0.1

- Gate: the pipeline supplies real lat/lon (Tel Be'er Sheva, modern Beersheba), so implemented (not HOLD_MARKER_RENDERING). The projection is a standard Web Mercator computed from lat/lon; no lat/lon→abstract-SVG mapping was invented. The abstract sample map is unchanged and is still selectable.
- Status contract: VERIFIED_ARCHAEOLOGICAL_SITE → "site" marker; MODERN_CITY_REFERENCE → "modern" marker; unknown status/role or invalid coordinates → not drawn. Biblical Beersheba has no exact point (a note says so in the map). Fixture places without coordinates never appear on the geographic view.
- Tiles: OSM raster is opt-in, default off, attribution "© OpenStreetMap contributors".
- Polish: labels split left/right, stronger grid, larger markers, map-note moved so it does not overlap the legend.
- Regression: geo 8/8, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25, bs 17/17, pl 8/8, node 22/22. No existing assertion weakened.
- Remaining risk: the geo view needs Detail closed to be visible; tiles are unverified offline; there is only one real-coordinate case so far.

## IMPLEMENT_MEDIA_BINDING_RIGHTS_VALIDATION_AND_INCREMENTAL_SYNC_WITH_BEERSHEBA_3_RECORD_PILOT_v0.1

- Extended: `normalize.js` (MediaAsset contract, LICENSES table, explicit target_ref, representative resolution, per-media `content_hash`), `validate.js` (V27 target binding, V28 rights, V29 source URL, V30 no payload/unsafe, V31 representative, V32 hash; exported `mediaErrors`), `run.js` (per-asset quarantine, `out/media-sync.json` hash manifest with added/changed/unchanged/removed/quarantined, `out/06-media-report.json`). Overlay gained `media_bindings` (explicit target refs, no note-level target exists yet).
- Result: discovered 3, bound 3, rights validated 3, attribution-only 3, image payloads 0, invented URLs 0, unsafe payloads 0, source mutations 0. Representative = JBC-MEDIA-BS-001.
- Reused unchanged: app Detail media renderer, `mediaGate`, `mediaSourceHtml`, shared store, existing Beersheba QA.
- Spec-driven test edits (reported, none weakening): P01 now requires 31/31 checks passing (was 25 with one open warning); P04 exempts derived media fields (rights.status/license_code, content_hash, display_mode, binding); V21 no longer bans a source_url outright, it requires it to be explicit and verified (V29 checks host and file match), while preview_url stays banned (N07 still rejects); qa-pl expects 31 checks and 28 negatives (was 13).
- New tests: N14–N28 (15 media negatives), M01–M10 (golden, explicit binding, rights, no URL, accepted explicit URL, representative, failure isolation, incremental hash, no source mutation, payload-free projection), PL-09.
- Regression: node 47/47; pl 9/9, bs 17/17, geo 8/8, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25.
- Risks: `media_bindings` are overlay-declared (pending approval; a note-level `Target ref:` field takes precedence when added). Rights status is REUSE_WITH_ATTRIBUTION with no display clearance, so images stay off until a payload and CLEARED review exist. The sync manifest lives in `tools/pipeline/out/`, so a fresh checkout reports all 3 as "added" once.

## IMPLEMENT_MULTI_RECORD_OBSIDIAN_INGEST_WITH_BEERSHEBA_AND_GERAR_v0.1

- One pipeline, extended in place: `parse.js` unchanged; `normalize.js` (layout-tolerant extraction: header `research_id|document_id`, yaml `candidate_sites`, `PassageLink` nested/underscore refs, yaml `MediaAsset`, structured people/events/places/routes as `connected`), `validate.js` (V12/V26 explicit-null candidates, V27 candidate-only depiction rule, V29 validator-generated verification, new V33 approval, V34 expected identity), `scripture-index.js` (`combine`), `run.js` (`discover`, `ingest`, per-record `run`), `test.js`. No Gerar- or Beersheba-specific file. Added only `tools/pipeline/ingest.config.json` (include/exclude, expected identity, approval) and `data/projection.overlay.gerar.json` (legacy key + explicit media target bindings).
- Discovery: include `02_연구물/브엘세바/`, `02_연구물/그랄/` (vault via `JBC_VAULT`, otherwise the repo mirror `docs/architecture/<name>/`); exclude `01_소스들/ 03_산출물/ 99_운영문서/`; the gate document next to the Beersheba note is skipped as a non-record.
- Shared output: `data/projection.research.js` (both places) + `data/scripture.index.js` (per-record hash trust). Beersheba record equals the pre-ingest baseline (additive keys only: `hero_subject`, `connected`); Beersheba index entries equal baseline.
- Gerar: 33/33 checks; 4 candidate sites kept (3 with coordinates exactly as written, Tell el-Far'a South without); no invented candidate id/status, so no geographic marker; no primary coordinate; 10 literal "그랄" tags in direct-mention verses only; 2 media, source pages explicit in the note and verified by the validator, attribution-only, no payload; Navigation null with warning.
- Decisions to confirm: (1) the Gerar note says `PENDING_CAPTAIN_REVIEW`; approval `CAPTAIN_APPROVED` comes from the control instruction via the ingest config and both values are recorded. (2) The app now creates a place from an approved projection when no fixture stub exists (was: replace existing stub only). (3) Media bindings come from the overlay. (4) Gerar candidate sites have no status word in the note, so they are not drawn on the geographic map.
- Spec-driven test edits (none weakening): checks 31→33 (V33, V34); negatives count 13→28; BS-02 place keys now include `gerar`; QA-WS-012 research status check compares to the record's own status and approval; QA-AUTH-020 allowed file renamed `projection.research.js`; PL-07 index hash case sets every record's hash; manifest format `records:{stable_id:{media_id:hash}}`; per-record artifacts under `tools/pipeline/out/records/<stable_id>/`; author-supplied `source_url_verified` removed (lock §5: generated by the validator).
- Tests: node 60/60 (I01–I13 new); pl 14/14, bs 17/17, geo 8/8, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25.

## IMPLEMENT_WIKIMEDIA_SOURCE_RESOLVER_AND_VERIFIED_PREVIEW_URL_PIPELINE_v0.1

- New stage module `tools/pipeline/media-resolver.js` (called from `run.js`; not a second pipeline). `refreshCache` (online, only with `node tools/pipeline/run.js --resolve-media`) asks the official Commons API (`action=query&prop=imageinfo`, by the research file title) and stores the raw JSON answer under `tools/pipeline/cache/wikimedia/`; `resolveFromCache` (every run, offline) applies the cached answer. Only assets with an explicit, validator-verified `source_url` are queried (Beersheba has none: 0 requests). No image bytes are downloaded.
- An answer enables an image only if all agree: API title == research file, API description page == research source_url, thumbnail is an https Wikimedia Commons thumbnail host/path, raster mime (jpeg/png/gif/webp), API license code == research license, API creator matches the research creator, no API restrictions, and the note's declared rights status is one that clears display (`PUBLIC_DOMAIN_DEDICATION_CC0` / `CLEARED`). Then `preview_url` = the API thumbnail verbatim, `rights.status` CLEARED with `clearance_basis`, `display_mode` image, `attribution_derived` from the API. Any failure → attribution-only with the reason in `resolution.reasons`; the record and sibling assets are unaffected.
- Validation: V35 (preview resolution) added (34 checks); V21/V28/V30 relaxed only to allow a preview/CLEARED that carries a complete resolver basis. App gate accepts Wikimedia `upload.` and `thumb.` hosts under `/wikipedia/commons/` (the API now returns `thumb.wikimedia.org`), https only; load failure removes the image and falls back to attribution-only.
- Result: Gerar GR-001 and GR-002 resolved (2 previews, 2 images enabled; GR-001 is the hero); Beersheba unchanged (3 attribution-only, no resolution). image bytes in projection 0; invented URLs 0; invented preview URLs 0.
- Test edits driven by the spec (none weakening): check counts 33→34; negatives 28→40 (N29–N40: foreign/http/mismatching/svg/restricted/uncleared previews, basis not clearable, eligible-but-not-applied); M10 and I09 rewritten for resolver-derived previews; I13 exempts resolver fields (verified in R tests); media report `image_payloads` now counts only image bytes (previews counted in `preview_urls`).
- New: R01–R15 (injected API answers: success, missing file, license/creator/title/page mismatch, foreign thumbnail host, svg mime, restrictions, non-clearable declared rights, no cache, corrupt cache, incremental hash, refresh behavior, no downloads), PL-14 (image gate in the app, load-failure fallback, tampered preview never renders, Beersheba stays attribution-only).
- Regression: node 87/87; pl 15/15, bs 17/17, geo 8/8, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25. Screenshot: `screenshots/gerar-image.png`.
- Confirm: (1) the image loads straight from Wikimedia's thumbnail host when the Gerar Detail opens (no proxy; `referrerpolicy=no-referrer`) — say if you want it opt-in like the map tiles; (2) mapping the note's `PUBLIC_DOMAIN_DEDICATION_CC0` to "clearable" is my rule; (3) the cache JSON files should be committed so offline runs stay deterministic.

## UX_FIXES: BEERSHEBA_MEDIA_SOURCE_URLS + RELATED_PASSAGE_INTERACTION

- Beersheba media: the three media records now carry explicit Commons source pages (`data/projection.overlay.beersheba.json` → `media_bindings[*].source_url`, provenance noted in the file). The URLs are the `fullurl` the official Commons API returned for each research file title on 2026-09-30 (this also confirmed each file exists); none was built from a file name. The source notes are untouched. The existing resolver ran (`--resolve-media`): all 3 verified (page, license, creator match), cache files added.
- Result: source links are now clickable for Beersheba, but the images stay hidden. The rights gate is unchanged and requires a clearable declared rights status; BS-001 declares only free text ("reusable with attribution and ShareAlike obligations") and BS-002/003 declare nothing, so `eligible_for_display` is false with that reason recorded. To show the Beersheba photo, control must declare/approve a clearable rights status for the asset.
- Related passage click (Detail pills and verse rows): new `openRelatedPassage` keeps the selected entity, map camera/layers/guide/navigation state and the open Detail, moves the Scripture to the target, un-inerts the Scripture pane, scrolls the target verse (or the passage start for whole-chapter links) into view, focuses it and highlights it for ~2.4 s; on mobile the context sheet steps to "peek" so the Scripture is in front. No new page, history back still works. Guide links and search keep their previous behavior.
- Test edits driven by the change: Beersheba media tests now expect verified links (N07→V35, N23 mutation, M04/M05/R11/R14, I03 media fields, BS-09/BS-17, PL-09); none of the protective assertions (no image, no derived URL, no preview, gate unchanged) was weakened. New: PL-15 (desktop + mobile).
- Regression: node 87/87; pl 16/16, bs 17/17, geo 8/8, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25.

## PATCH_RELATED_PASSAGE_TO_SCRIPTURE_ACTIVATION_AND_DETAIL_CONTEXT_SEPARATION_v0.1

- Detail context model (`DETAIL_MODEL`, `detailContext()`, `body[data-detail-context]`): ENTITY_DETAIL (Person/Place/Event/Route) and PASSAGE_DETAIL (Verse/Passage/Pericope) are separate. Entity related-passage click → target Scripture, Detail context unchanged. Passage Detail opens only by an explicit action (selecting a verse, or "‹ 본문 개요").
- `openRelatedPassage`: moves the Scripture, brings it to the front in the same click (un-inerts the pane, leaves map/timeline perspectives), scrolls the target to the reading position just under the header (above the context sheet on mobile), focuses and highlights it (`ui.refTarget`, persistent until the next navigation). It no longer selects the verse (no `state.verse`, not in the URL), so no Passage Detail scope appears. Selected entity, Entity Detail, map camera/layers, navigation state and browser history are preserved. Mobile: the sheet stays open (a full sheet is reduced to half).
- Changed expectation (contract change, reported): QA-BS-08 previously asserted `state.verse === 31` after a related-passage click; it now asserts `verse === null` with `ui.refTarget = {gen-21, 31}`. Earlier PL-15 replaced by RP-01…RP-06 and PD-01/PD-02 (desktop and mobile).
- Regression: node 87/87; pl 23/23, bs 17/17, geo 8/8, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25.

## IMPLEMENT_AND_VALIDATE_GENERIC_JUDEBIBLE_MAP_BINDING_WITH_BEERSHEBA_PILOT_v0.1

- Basis: the named documents `MAP_BINDING_CONTRACT` and `SPATIAL_PROJECTION_MODEL` are not in the project or in the Obsidian vault (searched `docs/` and `Jude_Research`). The implementation therefore follows the controlling text that is present (Connected Research & Map/Media lock §7–§9: PlaceMapFields, marker rules, layer kinds, identity sharing) and the PRESERVE list of the control decision. Field names of the spatial read model are mine and need confirming against the contract text when it is supplied.
- Pipeline (same files, no new pipeline): `normalize.js` adds a generic `spatial` read model per record (`<spatial-binding>`): subject, primary (never drawn without a verified coordinate), certainty dimensions kept apart (identity / coordinate / reader status), candidate sites with per-site identification certainty and marker eligibility, region (no boundary), routes (no geometry), VERIFY/HOLD pointers, degradation reason. `validate.js` V36 enforces it (35 checks). The spatial code names no record.
- App: `geoMarkers` now reads only `research.spatial` (same code for every place) and still re-checks every marker with `markerSpec`; markers are interactive (click/Enter → select the same stable_id, never toggled away, reopens a collapsed Detail); an unlocated place gets a natural-language note; a place whose primary coordinate is verified is accepted and drawn only on the geographic view (`location_state geo_only`), otherwise a record with a coordinate is still refused.
- Pilot E2E (Beersheba, then Gerar as the no-drawable-coordinate case): Map marker → Detail → related Scripture → Scripture tag, in both directions, one stable_id; Gerar: no marker, note, Detail and Scripture intact, certainty dimensions shown separately, corrupted coordinate fails closed.
- Terminology: no "90 Region" wording was introduced; nothing crosswalks PLACE to REG ids or treats LEVEL_A as certainty. The existing `90_REGION_SHARED_RESEARCH_STRATEGY_LOCK` document still uses the old wording and was not edited.
- Test edits driven by the change: checks 34→35; GEO-08 now corrupts `spatial.sites` (the model the app consumes) with the same protective expectations; P04/I13 exempt the derived `spatial.*` strings (verified by S01–S08); I03 treats `spatial` as an additive key; PL negatives count 41→50.
- New: node S01–S08 and N42–N50; browser GEO-09…GEO-12 (GEO-12 uses injected test data for a verified primary coordinate, never shipped).
- Environment note: pipeline tests and ingest were run with `JBC_VAULT=G:/내 드라이브/Projects/옵시디언/Jude_Research` (the real vault, matching the earlier generated projection); without it the repo mirror of an older Beersheba note is used and media tests that expect the enriched note fail.
- Regression: node 105/105; pl 23/23, bs 17/17, geo 12/12, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25, ee 27/27.

## FIX_SEARCH_INPUT_TO_ENTITY_EXPLORER_CONNECTION_REGRESSION_v0.1

- Reproduced: clicking the header search input opened the Explorer and closed it in the same click, leaving `#…&e=undefined.undefined` in the URL and `state.entity = {}` (no console error, so nothing was thrown).
- Root cause: `openSearch()` sets `body[data-search="open"]`. The same click then bubbled to the document delegate, whose result-row selector was `[data-search]`; `t.closest("[data-search]")` matched `<body>` itself, so `openSearchResult(undefined, undefined)` ran (`selectEntity(undefined, undefined)` + `closeSearch`). Same class of collision as the earlier `data-view` / `data-nav-mode` container attributes. `qa=ee` never caught it because it opened the Explorer through `B.openSearch()` and never clicked the real input.
- Fix (one line, `app.js` click delegate): result rows only, `t.closest('[data-search="1"]')` (result rows are the only elements that carry `data-search="1"`). No UI, dataset or Explorer change.
- Regression tests added to `qa-ee.js` (real input events): EE-28 click opens the Explorer with the whole dataset, clean hash, no errors; EE-29 body attribute does not hijack clicks; EE-30 typing filters the same dataset and clearing restores it; EE-31 choosing an entity uses the existing stable_id Detail and keeps the Scripture context; EE-32 other entry points (toolbar, rail, slash) still open the same Explorer. With the fix temporarily removed EE-28/29/30 fail (29/32), with it 32/32.
- Regression: ee 32/32 (27 original + 5), node 105/105, pl 23/23, bs 17/17, geo 12/12, auth 20/20, self 20/20, krv 9/9, w1 8/8, w2 6/6, sw 8/8, nav 6/6, ws 25/25.

## IMPLEMENT_JUDEBIBLE_EXPLORE_WORKSPACE_v0.1

- Baseline: the brief names git checkpoint 5183808, but this folder is not a git repository, so the pre-change `app.js`, `index.html`, `styles.css` are kept in `baseline/explore-pre/`.
- Search is now the `explore` perspective (`state.view === "explore"`, `#…&view=explore`, rail 검색 `aria-current`). The floating dialog is gone: no `role=dialog`/`aria-modal`, no backdrop, no close button, no focus trap, no `body[data-search]` (the attribute that caused the earlier click regression). `swState.open` is derived from the view. The workspace fills the central area between the rail and the Navigation; the existing Detail (`#side-pane`, unchanged renderer) sits to its right only while an entity is selected and the Detail is open; closing the Detail (접기 / '본문 개요' / Esc) gives the space back to the results. Mobile: full-width below the rail, Detail as a sheet under the results.
- Selection: a result row selects the existing stable_id (`selectEntityStable`, no toggle-off) and only marks the row (`is-selected`/`aria-current`); the result list DOM is not re-rendered, so query, filters, sort, card/list view and result scroll survive; successive clicks replace only the Detail. The workspace is left only by choosing another perspective or an explicit action (`본문 보기`, `지도에서 보기`, a verse/reference result). Esc closes the Detail only. Re-entering resumes the query and filters.
- Filters: primary 전체/인물/장소 (type), 카드/목록 as a separate control, everything else (종류, 구약·신약, 시대, 지역, 정렬) under a folded `필터` disclosure. Same `entitySet`/`search` dataset, no new Explorer or Detail code.
- Tests: qa-ee 27 → 40 (EE-28…EE-32 regression via the real input, EE-33…EE-40 workspace contract incl. scroll/state survival, Detail close, exit rules, stable_id across Explorer/Detail/Scripture/Map, mobile). Tests that encoded the modal design were rewritten, keeping their intent and stating the change: qa-sw 002 (central workspace width instead of dialog width), 004 (state preserved when leaving via the rail; Esc no longer leaves), 005 (mobile workspace instead of full-screen overlay; leave via the rail), 006 (an entity row keeps the workspace open), 007 (labelled workspace, no dialog role, no focus trap, Esc leaves nothing); qa-nav 002/005 leave the workspace through `closeSearch()` instead of the removed close button; EE-28/EE-31 expectations (`body[data-view]`, workspace stays).
- Regression: ee 40/40, sw 8/8, nav 6/6, ws 25/25, w1 8/8, w2 6/6, auth 20/20, self 20/20, krv 9/9, geo 12/12, bs 17/17, pl 23/23, node 105/105. Screenshots: `screenshots/explore-a.png`, `explore-b.png`, `explore-mobile.png`.
