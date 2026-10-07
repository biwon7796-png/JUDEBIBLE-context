# MapLibre 병행 렌더러 (feature flag) — 2026-10-07

상태: **병행 이행 단계(NOT ACTIVE)**. 기본은 `legacy`(기존 SVG 렌더러). 레거시 렌더러는 삭제하지 않았고, 승격/기본값 전환은 하지 않았다. Captain 검토 대기.

## 플래그
`JBC_MAP_RENDERER = "legacy" | "maplibre"` (기본 `legacy`)
- URL: `?mapRenderer=maplibre` (또는 `legacy`) / 전역 `window.JBC_MAP_RENDERER` / `localStorage["jbc.mapRenderer"]` (개발용)
- 플래그는 mapPrefs 가 아니다(`jbc.mapPrefs.v1` 와 별개). 바꿔도 데이터·사용자 지도 설정은 변하지 않는다.
- MapLibre 로드/WebGL 초기화 실패 시 자동으로 레거시로 되돌아간다(`ML.failed`).
- 롤백 = 플래그를 끄고(또는 URL 파라미터 제거) 새로고침. 데이터 이행·삭제 불필요.

## 역할 분담
| MapLibre 소유 | 공유 JudeBible(그대로) |
|---|---|
| 지형 래스터(구워 둔 WebP, 라이트/다크), 바다/육지, 수계(JBC_HYDROLOGY), 카메라(pan/zoom/easeTo), 타일 수명주기·캐시·부모 타일 대체, 컨테이너 크기 변화 | `geoSvg()` 오버레이 전부(성경 지명 라벨·번호 경유지·경로·거리·호버/클릭·범례·축척), PLACE_INDEX/PlaceCard, 여정 패널, 본문·연표·연구 동기화, mapPrefs/mapScene |

핵심 아이디어: MapLibre 카메라를 매 프레임 `ui.gcam = {x:경도, y:메르카토르 y, w:화면 스케일}`로 반영한다. 같은 `geoSvg()`가 그 시점의 viewBox 로 오버레이를 그려 지도와 정확히 겹친다(표식 크기는 화면 px 고정, 2–3배 확대 현상 없음). 바탕(지형·바다/육지·수계)은 `mlActive()` 일 때 SVG 에서 생략한다.

## 파일
- `app.js` — `ML` 블록(`mlActive/mlLoad/mlStyle/mlEnsureMap/mlOnRender/mlSyncFromGcam/mlMount/mlEase/mlCompose/mlExport/mlPrintSheet`), `geoSvg`·`geoCam`·`renderGeoOnly`·`geoFly`·`renderMapPane`·`saveMapSvg`·휠 핸들러의 ML 분기, `BVC.mapRenderer`
- `styles.css` — `.ml-map/.ml-ovl` 오버레이 규칙, 인쇄 시트
- `annotate.js` — 지도 SVG 가 `#ml-ovl` 안에서 교체되므로 MutationObserver 에 `subtree:true`
- `vendor/maplibre/` — MapLibre GL JS 6.13.0 (BSD-3, 로컬, ESM 전용; 플래그가 `maplibre`일 때만 지연 로드)
- `data/terrain_baked/{light,dark}/{z}/{x}/{y}.webp` — `tools/bake_production_terrain.py` 로 구움(원본 `data/terrain_tiles` 불변). 13,648장 × 2테마, WebP q85, 알파=육지 마스크
- `qa-ml.js` — 렌더러 매개 시맨틱 QA(`?qa=ml` 레거시 / `?qa=ml&mapRenderer=maplibre`)
- `poc/maplibre/tools/` — 실앱 검증 도구(`mlapp.js`, `testApp.js`, `parityApp.js/.py`, `runQAboth.js`, …)

## 다크 튜닝(검증값)
`raster-resampling: nearest`, `raster-contrast: 0.20`, `raster-brightness-min: 0.00`, `raster-brightness-max: 0.95`.
