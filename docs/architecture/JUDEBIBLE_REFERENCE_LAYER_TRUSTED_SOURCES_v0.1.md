# JudeBible — Reference Layer · trusted external map sources v0.1

Task: `CONNECT_TRUSTED_EXTERNAL_MAP_SOURCES_TO_JUDEBIBLE_REFERENCE_LAYER_v0.1`

## Model
Trust is decided **once per source**, not per feature. A validated source goes straight to the REFERENCE LAYER (presentation only, `research_authority: false`).
Reference features never edit, merge with, or upgrade the certainty of JudeBible research; research and reference coexist and are drawn in separate layers (research labels win collisions).

| File | Role |
|---|---|
| `data/reference/sources.registry.json` | Hand-authored trust declarations: identity, publisher, version, license, attribution, source URL, artifacts + **pinned sha256**, `enabled`. |
| `tools/reference/build.py` | Validate each source once → bulk-ingest features → write generated files. `--pin`, `--check`, `--disable ID`, `--enable ID`, `--rollback`. |
| `data/reference.sources.js` (generated) | Per-source status/license/attribution/version, `gates` consumed by the app, one-line footer attribution. |
| `data/reference.features.js` (generated) | Bulk Natural Earth populated places (bounds 8–52°E, 10–50°N): 867 features. |
| `data/reference/exceptions.queue.json` (generated) | The conflict-only exception queue (and source-level failures). |
| `data/reference/build.manifest.json`, `data/reference/_lkg/` | Output hashes; last-known-good copies for rollback. |

## Sources (initial)
Mapzen Terrain Tiles (AWS Open Data) · USGS SRTM (delivered via the Mapzen tiles) · Natural Earth: land/coastline/shaded relief, lakes + rivers, marine/region names, populated places.
Each carries version (including per-dataset `VERSION.txt` checks), license id (allowlist: `PUBLIC_DOMAIN`, `OPEN_ATTRIBUTION_REQUIRED`), full attribution, and a short footer attribution.
Source validation checks: required fields, license allowlist, https source URL, `research_authority=false`, every artifact present and equal to its pin, version files, meta role checks (`REFERENCE_BASEMAP_ONLY`, labels/roads/POI/admin = NONE), provider dependency (USGS follows Mapzen).
A failing source is excluded (its gate closes, its attribution disappears) and appears under `source_exceptions`; other sources are unaffected.

## Bulk ingest
Original Natural Earth identity is preserved on every feature: `id = NE-PP-<NE_ID>`, `src`, `fid`, `wd` (Wikidata), `gn` (GeoNames), `name_ne`, `cls`, `rank`, `minz`, `pop`. No `stable_id`, `status`, `certainty`, `same_as` or authority fields. Same-name features stay separate. Features the curated label layer already draws (same dataset feature: exact name **and** exact coordinates) are marked `cur` and skipped at render time — this is a display dedupe, not an identity merge.

## Conflicts (exception queue)
A feature is queued only when it disagrees with a research coordinate on an **explicit shared id** (wikidata / geonames / ne_id; > 5 km) or on an **exact name** (> 10 km). Nothing is resolved automatically; both records stay as they are. Current result: 0 conflicts over 10 research points (the research layer currently carries no external ids).

## App consumption
`app.js` reads `JBC_REFERENCE_SOURCES.gates` (`terrain`, `land`, `hydrology`, `names_physical`, `names_modern`); a closed gate removes that source from the map. Without the registry the app behaves as before. Bulk features are drawn inside the existing reference layer (`data-role="reference-names-not-research"`) under the existing "모든 지명 표시" toggle and semantic-zoom tiers (major cities tier 3, others tier 4), with `data-ref-source` / `data-ref-fid`. They are not selectable, searchable or part of the entity store. The map footer attribution is generated from the active sources.

## Operations
```
python tools/reference/build.py --pin all        # after a deliberate source update
python tools/reference/build.py                  # validate + regenerate
python tools/reference/build.py --check          # generated == fresh deterministic build
python tools/reference/build.py --disable NE-POPULATED-PLACES
python tools/reference/build.py --rollback
python tools/reference/test_reference.py         # 11 source/trust/determinism tests
index.html?qa=rf                                  # 6 app-side checks
```

## Notes / open items
- Mapzen/AWS license wording is taken from the repository's existing terrain meta; it was not re-fetched in this session (`license.text` says so).
- Natural Earth `ne_10m_land` is recorded as "current upstream snapshot" (no VERSION file locally).
- Terrain/hydrology/land/label assets themselves were not regenerated; they are registered and hash-pinned as delivered.
