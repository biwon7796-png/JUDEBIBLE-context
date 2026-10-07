# JudeBible Map — Regression Isolation & Visual Evidence Report v0.1

Status: **PASS_READY_FOR_REVIEW for isolation/evidence; 4 legacy suites remain RED by design of an earlier (uncommitted) task and need an owner decision — no check was deleted or weakened.**

## 1. Isolation method (three states, same browser, same QA runner)
| State | Definition | bs | ws | self | krv | ee | geo |
|---|---|---|---|---|---|---|---|
| A. HEAD (commit 5183808) | sample map still present | 17/17 | 25/25 | 20/20 | 9/9 | — | — |
| B. Working tree **before** zoom/label/notice task | built in scratchpad by reverting only this task's edits | 15/17 | 13/25 | 17/20 | 8/9 | 39/40 | 82/82 |
| C. Working tree now | | 15/17 | 13/25 | 17/20 | 8/9 | 39/40 | 85/85 |
| B′. B + only `mapModeNow()` and `ui.mapMode` default restored to HEAD | proof of cause | **17/17** | **25/25** | **20/20** | **9/9** | 39/40 | – |

* B == C for every legacy suite → **the wheel/label/notice task introduced zero failures.**
* B′ restores bs/ws/self/krv completely → **the failures are caused exclusively by the sample-map removal** (`mapModeNow()` now always returns `"geo"`, `ui.mapMode` defaults to `"geo"`, `#map-mode` switch removed from `index.html`).
* Logs: `screenshots/map-unify/logs/` (`B_*`, `Bs_*`, `C_*`, `pipeline_test.txt`, `run-qa-port.sh`).

## 2. Per-check disposition (nothing deleted/weakened)
| Check | Why it fails | Keep / change | Basis |
|---|---|---|---|
| QA-BVC-011/012/013 (self) | assert sample-map pin `svg.smap .pin[data-id=moriah]` | **Keep as-is; owner decision** — obsolete only if the sample map is permanently removed, then rewrite as geo-equivalent | Moriah has no coordinate, so a geographic map can never draw it; the assertion is sample-map-only |
| QA-WS-003/004/005/006/008/009/013/014/016/019/020/021 (ws) | all drive/read `#map-body .pin[data-id=moriah]` / `svg.smap` camera | Keep; owner decision as above. WS-019/020 (Guide reads fixture; map/guide/detail share one entity source) express a still-valid contract and must be **rewritten** (not dropped) against geo markers | same |
| BS-03 | "nothing drawn for Beersheba/Tel/modern city" — contradicted by GEO-03 (approved research coordinates now drawn) | **Superseded by GEO-03; rewrite** BS-03/05 second clauses to "only the two approved coordinates; no marker for the biblical place" (already asserted by GEO-03/MAP_UNIFY_03) | conflict between two spec generations |
| BS-05 | same + `svg.smap` | same | same |
| K07 (krv) | `svg.smap .pin[moriah]` | Keep; owner decision | sample-map-only |
| EE-39 | `#map-mode` missing (switch removed in `index.html`) | Keep; rewrite to drop only the `#map-mode` clause | the stable_id equality across Explorer/Detail/Scripture/Map remains valid |
| PL-01 / PL-09 (+ node `test.js` P08, N19, N41, N12, M01, M03, M04, M10, I01) | pipeline/media tests; unchanged at 9 failures with this task and with tracked changes stashed; unrelated to map | Out of scope; separate pipeline ticket | `data/projection.*` untouched |

## 3. V36
Definition: `tools/pipeline/validate.js:118-134` — spatial read model (kinds apart, certainty dimensions separate, nothing invented, VERIFY/HOLD preserved). Enforced by positive check `V36_spatial_read_model` inside P01, and nine negatives in `tools/pipeline/test.js:101-109`:
N42 model missing · N43 primary marker without coordinate · N44 disallowed candidate marker · N45 invented region boundary · N46 invented route geometry · N47 certainty dimensions merged · N48 VERIFY/HOLD dropped · N49 candidate coordinate altered · N50 region given a point.
Individual result from `out/test-results.json`: **N42–N50 = 9/9 PASS**. (`node test.js` prints failures only; overall 96/105, the 9 failures are the non-V36 pipeline/media items above.)

## 4. Visual evidence (`screenshots/map-unify/`, produced by `tools/capture_map_evidence.js`, 1600×900; data in `evidence.json`)
Files: `{study,perspective}-{1-first-entry,2-max-zoom-out,3-max-zoom-in,4-regional-zoom}.png`

| Surface | Pane px | Initial span | Max-out | Max-in | Terrain z (in) | Tile screen px (in) vs 256 |
|---|---|---|---|---|---|---|
| 본문연구 split map | 452×819 | 10.5° | 40° | 3.25° | z10 | 88.8 px → 0.35× |
| 지도 perspective | 1585×837 | 10.5° | 40° | 3.25° | z10 | 171.7 px → 0.67× |

* Camera contract identical (same span limits, wheel step 1.15×). Span is measured along the pane's **long side**, so a tall split pane shows 3.25° vertically but less horizontally — equal contract, not equal rectangle.
* Terrain blur: at max zoom-in the native z10 tiles are displayed at 0.35–0.67× of their 256 px, i.e. **downsampled, not upscaled → sharp**. Upscale (>1×) would only begin on displays wider than ≈2400 px long side (z10 is the deepest generated level, ~131 m/px).
* Wide/regional views pick z6/z8/z10 by span (`terrainWantedZoom`); `basemap_mode=terrain` in all 8 shots, notice banner absent in all.

## 5. Label pixel sizes
| Tier / style | Target | Before (≈, 1600 px wide) | After (code `labelPx`) | Measured on screen |
|---|---|---|---|---|
| tier 1 major | 13–14 | ≈9.9 | 13.5 | (no fixture marker) |
| tier 2 normal | 12–13 | ≈9.9 | 12.5 | (no fixture marker) |
| tier 3 minor | 11–12 | ≈9.9 | 11.5 | (no fixture marker) |
| tier 4 / archaeological site | 11–12 | ≈9.3 | 11.5 | **11.5 px (Tel Be'er Sheva, both surfaces)** |
| modern reference | 10–11 | ≈8.2 | 10.5 | (hidden by collision in captured views) |
Honest limit: the fixture exposes only the site and modern markers, so tiers 1–3 are verified through the shared conversion path (`labelFs = labelPx(m) × upx`, identical for every marker) and the exported `BVC.geo.labelPx` table (`evidence.json → label_px_targets`), not by on-screen measurement. Size is constant across spans 3.25°/6°/10.5° (MAP_UNIFY_02).

## 6. Changed files (this task + evidence)
`app.js` (wheel guard removed, `labelPx`/`mapPixelSpan`, ResizeObserver, notice removed, `BVC.geo.labelPx` export), `styles.css` (earlier basemap tokens), `qa-geo.js` (+MAP_UNIFY_01–03, SCREEN_STYLE_02 range 11–12 px), `qa-bs.js`/`qa-pl.js`/`qa-ws.js`/`self-qa.js` (only the banner-presence assertions inverted), new `tools/capture_map_evidence.js`, evidence folder, this report.
Research data, VERIFY/HOLD, Region/Route geometry untouched.
