# Bible World Navigation Redesign — Completion (2026-10-05)

Authority: PRESENTATION_ONLY. No research asset, Registry, lifecycle, geometry, or reader-visibility rule was changed.

## Structure
- `data/exploration.topics.js` — `ExplorationCategory → ExplorationTopic → ExplorationStep` (declarative, record-agnostic).
  Step: `passage_refs, place_ids, region_ids, route_ids, map_preset{space|fit|layers}, short_description, uncertainty`.
  Ids are *requests*: the runtime (`navResolveStep` in `app.js`) keeps only existing passages, reader-visible places/regions,
  and routes that exist in `data/presentation.routes.js` **and** resolve to an approved research source.
- Wide Exploration Board `#topic-board` (tabs: 기초 지리 / 자연환경 / 구약 세계 / 중간기 세계 / 신약 세계). Card click = immediate preset, board closes. Empty category says so (중간기 has no approved topic).
- Right panel `#guide-pane`: `idle` (current passage/area, `주제 탐색하기`, map layers, `연표에서 보기`; 66-book list removed) and `topic-active` (topic, key passages, numbered steps, only the current step expanded, 본문 보기 / 본문연구 / 연표에서 보기, prev/next).

## Reused (no new runtime/registry)
`go` (keepContext), `geoFit`/`clampGeoCam`/`ui.gcam`, `ui.mapDisplay` layers, `presentationRouteStates` (+ one filter line `ui.navRouteIds`),
`openPassageResearchFromEntity`, `setView("timeline")`, `viewVerse`, `closeEntity`, existing entity selection by stable place id (Detail is not forced open).

## Behavior notes
- Step applies: passage → route filter → layers (snapshot/restore) → entity → camera. Ending a topic, brand-home, or navigating elsewhere (top search, chapter buttons) restores layers and route filtering.
- Route contract unchanged: approved/inferred route → existing dotted `.gm-route-inferred`; unresolved anchors → nothing drawn. Currently `Athens_to_Corinth`, `Macedonia_to_Achaia` and `Moriah_to_Beersheba_return` have no drawable geometry, so those steps draw no line (same as before this change).
- `uncertainty:"inferred"` only adds a small `?` note in the step; map `?` markers still come from the existing marker contract.

## QA (headless Chrome, 127.0.0.1:8765)
- `?qa=jn` rewritten for the new contract: **9/9 PASS** (idle, board tabs, card→preset, steps 1→2→3 map change, passage/research/timeline links, dotted/unknown route, unpublished-entity non-exposure, restore, stable identity).
- `?qa=ee` 18/18, `?qa=bs` 12/12, `?qa=gr` 11/11, pipeline `tools/pipeline/test.js` 110/110.
- Legacy suites (`ws`, `sw`, `nav`, `ni`, `pl`, `geo` partly, `fa`) still fail on pre-existing old-layout assertions (`#guide-next`, `#search`, `NAV_TOP_5`, …); `tools/pipeline/test-region.js` RG01/03/05/07/08 fail on place-discovery changes from the Full Place Profile work. None touch this change.

## Files
`data/exploration.topics.js` (new), `app.js`, `index.html`, `styles.css`, `qa-jn.js`.
