# JudeBible map — Reference / Research dual-layer contract v0.1

Status: DEFINED (implementation of the settings footer included). Applies to the single map in the 본문연구 workspace.

## 1. Two layers, two authorities
| | Reference layer (참고 배경) | Research layer (연구 표시) |
|---|---|---|
| Content | terrain relief, coastline, rivers & lakes, modern place names | place/site markers, region (개략 범위), routes (추정 경로) |
| Authority | presentation only: public datasets, makes **no** claim about biblical places | approved research projection; each item carries its own certainty |
| Sources | Mapzen Terrain Tiles / USGS SRTM · Natural Earth (coastline, hydrology, modern names) | 주드성경 연구 자료 (research notes) |
| May never | become evidence, create/move a research marker, imply a location | be drawn without approved data; be promoted by styling, zoom or settings |
| Toggles | 지형 음영, 강과 호수, 지명 표시, 모든 지명 표시 (presentation state) | layer visibility only; settings never change research state |

Rules: (1) a Reference item and a Research item are never merged or re-labelled into each other; (2) research items fail closed (no coordinate → no marker; region/route geometry stays on hold until approved); (3) modern names are always "현대 지명 / 참고", never the biblical identification; (4) presentation settings (labels, theme, shading) never alter research data or its status.

## 2. Reader language (map surfaces)
Use: **참고 위치 · 추정 · 개략 범위 · 추정 경로 · 정확한 위치 미확정**.
Never show to readers: VERIFY, HOLD, stable_id, projection, registry (internal terms stay in data/QA only).
Mapping: exact point confirmed → 확인된 위치; candidate/modern reference → 참고 위치; unverified → 추정; region without boundary → 개략 범위 (only when approved) ; route without geometry → 추정 경로 (only when approved); location not fixed → 정확한 위치 미확정 (no dot).

## 3. Map settings information footer (implemented)
Bottom of the map settings panel, compact (small type, panel scrolls internally, map stays visible):
* 지형 — Mapzen Terrain Tiles, USGS SRTM (external links)
* 해안선·강과 호수 — Natural Earth (external link)
* 현대 지명 — Natural Earth populated places (external link)
* 참고 위치 — 주드성경 연구 자료 (button that expands an in-panel explanation; internal source has no URL)
* Educational disclaimer: background layers are reference only; 참고 위치·추정·개략 범위 are not confirmed facts.
Source names are links/controls (`target=_blank rel=noopener` for external). The footer does not change layer state, the panel's other options or the map's visibility.

## 4. Preserved
Compact panel; map visibility while the panel is open; research-vs-reference distinction; existing layer behaviour; save/print flows.

## 5. Addendum v0.2 — controlled promotion path & final information structure
**Authority lifecycle (per claim/feature, never per source):** REFERENCE_ONLY → ELIGIBLE_FOR_VALIDATION → VALIDATION_IN_PROGRESS → VALIDATED_PROMOTION_READY → PROMOTED_RESEARCH_EVIDENCE; terminal alternatives CONFLICTING_EVIDENCE · RIGHTS_OR_PROVENANCE_HOLD · REJECTED_FOR_PROMOTION. No automatic transition. A provider name (Natural Earth, OpenBible, …) is never proof of authority.

**Path:** External Reference Feature → ValidationResult (machine checks X01–X09) → Human Review → PromotionRecord → existing JudeBible stable identity → research evidence link. The reference record survives; a reference coordinate is never copied into a research coordinate; promotion cannot clear VERIFY/HOLD, erase competing views, overwrite stronger research, create an identity from a name, or merge/crosswalk entities. Reference de-duplication is limited to provably identical external features (same provider + dataset + original locator).

**Implemented as an isolated dry run:** `tools/pipeline/promotion.js` (+ `test-promotion.js`, 8/8). Pilot = Natural Earth `ne_10m_populated_places` "Beer Sheva" vs the existing research modern-city reference `JBC-CR-PLACE-BEERSHEBA_MODERN-001`. Result: **HOLD** — machine evidence is real (provenance re-hashed, 3.69 km to the research point) but rights are only declared locally (not independently verified), competing views and certainty are unreviewed, and no human review exists. No live data is written.

**Map information structure (implemented):** map surface = one-line minimal attribution only; map settings panel bottom = 연구 표시 / 참고 표시 / 위치·범위 불확실성 legends, short authority note, 자료 출처 links, 자세히 보기. The former large `geoLegend` overlay is removed; the 도구상자 button now opens the panel at that section. SVG export appends the attribution + reference/uncertainty statement; print keeps a compact attribution line.

**Render contract for future data (not drawn today — no approved geometry exists):** research route solid / educational route dashed; research region only with supported geometry / educational region soft or broken boundary with approximation wording; exports must not present approximate routes or regions as verified.
