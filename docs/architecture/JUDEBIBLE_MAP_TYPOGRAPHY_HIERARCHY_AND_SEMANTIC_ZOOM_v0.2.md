# JudeBible — Map Typography Hierarchy & Semantic Zoom v0.2

Implementation record for `IMPLEMENT_JUDEBIBLE_MAP_TYPOGRAPHY_HIERARCHY_AND_SEMANTIC_ZOOM_v0.2`.
Code: `app.js` (`LABEL_LEVELS`, `markerLevel`, `refLevel`, `referenceLabelsSvg`, `visibleGeoMarkers`), `styles.css` (`data-label-level` block), evidence in `screenshots/map-typography/` (`tools/capture_typography_hierarchy.js`).

## 1. One level table for every map label

Research labels (`g.gm text`) and reference labels (`.gm-ref text`) read the same table (`BVC.geo.labelLevels`). Size is a **screen px** value (`font-size = px × upx`), so labels do not scale with map zoom or browser zoom. Weight / letter-spacing / colour live in CSS keyed by `data-label-level`.

| Level | Role | px | weight | tracking | Used for |
|---|---|---|---|---|---|
| L0 | major region | 15.5 | 400 | .18em | reference regions tier ≤ 2 (아나톨리아, 메소포타미아, 키프로스섬 …) — largest, lightest, widest-spaced, opacity .82 |
| L1 | major place / selected | 14.5 | **600** | 0 | research tier-1 places and any **selected** research marker (the only bold level) |
| L2 | secondary place | 13.5 | 520 | 0 | research tier-2 places |
| L3 | minor region / site | 12.5 | 480 | .06em | reference regions tier ≥ 3, archaeological sites, minor research places |
| L4 | modern reference | 11.5 | 400 | 0 | modern cities tier ≤ 2, research `modern_context` markers (secondary colour) |
| L5 | modern detail | 11 | 400 | 0 | modern cities tier ≥ 3 (reference colour) |
| WM | major water | 13.5 | 450 italic | .12em | seas / gulfs tier ≤ 2, `--map-label-water` |
| Wm | minor water | 11.5 | 400 italic | .05em | lakes / small gulfs |

Bold was reduced: previously tier-1 and *active* markers were 650 and every research label 540; now only L1 is 600 and L2–L5 step down to 400.

## 2. Semantic zoom

`semanticTierLimit(w)`: `w ≥ 26 → 1`, `≥ 10 → 2`, `≥ 5.5 → 3`, else `4` (the 18° threshold became 26° so the eastern-Mediterranean view, w≈20, already shows tier-2 seas/regions instead of two labels). Zoom changes **which** labels appear, never how large they are.

Passage-related research markers get a one-tier lead (capped at tier 3): Beersheba (tier 3) is labelled at the initial Levant view; tier-4 detail still waits for deep zoom. A **selected** marker is always labelled.

## 3. Collision priority (no global font shrink)

Placement order, each label taking space only if its box is free:

1. research marker dots and visible research labels (selected → passage tier order)
2. WM major water → L0 major regions → L4 modern (tier ≤ 2) → Wm minor water → L3 minor regions → L5 modern detail; ties by tier, then population
3. modern reference labels are budgeted per view (`refBudget`: 6 / 10 / 16 / 22 by zoom) so dense areas cannot turn into a text mass

Boxes include tracking, a per-class pad, and the real left/right side of marker labels (`labelSides`, shared by drawing and collision). Reference labels are also rejected when they would be clipped by the map edge or sit under the attribution line, the map-title chip or the left tool bar. Dropping a lower level is the only overlap remedy — font sizes never change.

## 4. Research vs. reference semantics (unchanged)

Reference names stay in `<g class="gm-ref-layer" data-role="reference-names-not-research">`, are not selectable, never enter search or the research store, and lose collisions to research labels. Modern reference names remain weaker (L4/L5, thinner, secondary/reference colour tokens); `data-semantic-tier` colour rules and the contrast tokens are untouched.

## 5. QA

Evidence (`screenshots/map-typography/`, `metrics*.json`): 4 views (full world w=40, eastern Mediterranean w=20, Israel/Levant w=10.5, dense Jerusalem area w=3.25) × browser zoom 100 % (1600×900) and 125 % (1280×720 @1.25), plain and with Beersheba selected. Measured per view: 0 overlapping label boxes in all 16 captures, at most 1 bold label (the selected one), label px constant across zoom/browser-zoom.

Test changes (`qa-geo.js`): old fixed sizes (12.6 / 12.4 / 12 / 13 / 14) and "tier-3/4 hidden at Levant view" assertions were rewritten for the level table and the passage-lead rule (SCREEN_STYLE_02, ZOOM_SEMANTIC_04, ZOOM_SEMANTIC_09, MAP_UNIFY_02, MAP_REFINE_03).

Notes
- The legacy `smap` sample-map pin text (`.pin text`) is not reachable in geographic mode and was not changed.
- `tools/run-qa-headless.sh` (virtual time) intermittently loads the reference registry too late; suites were run in real time instead.
