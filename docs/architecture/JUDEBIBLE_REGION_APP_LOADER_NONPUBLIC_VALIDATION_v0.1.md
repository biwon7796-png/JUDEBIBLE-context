# JudeBible — Region App Loader · controlled non-public validation v0.1

Task: `IMPLEMENT_AND_VALIDATE_REGION_APP_LOADER_IN_CONTROLLED_NONPUBLIC_MODE_v0.1` · pilot region `JBC-CR-PLACE-AMALEK-001`
Inputs (isolated, unchanged): `tools/pipeline/staging/isolated/projection.research.js` (sha256 `1f9a5b27…`), `…/scripture.index.js` (`04fca9e4…`).
Live `data/projection.research.js` / `data/scripture.index.js` are **not modified** (no live projection commit).

## What changed (app.js)
| Area | Change |
|---|---|
| `projectionGroups()` | third group `{ kind: "rgn", type: "Region", records: PJ.regions, dict: D.regions }`. `rgn` is used because `r` is already the search "reference" result kind. |
| Controlled mode | Regions attach **only** when `window.BVC_NONPUBLIC_REGION_MODE === true`. Without it `PJ.regions` is ignored (public loading cannot show an unpublished Region). |
| Region store | projection-native: `D.regions[stable_id]` (own dict). Never written to `D.places` → no Region→Place conversion. `entity_type` "Region" is kept through `STORE` (`list/get/entity`). |
| `regionRecordOk()` | fail-closed contract per record: `entity_type=Region`, id = key, `authority.approval=CAPTAIN_APPROVED` + `approval_record_id` + `registry_effect=NONE`, `identity_binding` (viewer id = id, no automatic merge, no BAT01 crosswalk/reuse), `reader.published===false`, `verify`/`hold` arrays present and equal to `spatial.verify_hold` counts, no coordinate/centroid without an approved marker, no boundary / geometry type / non-`OMIT` polygon without `geometry.approved===true`, source sha256 present. |
| Scripture Index | `seiRecordOk` / `indexAt` resolve by `stable_id` through the attached kind (`STABLE_KIND`) instead of `PJ.places`/`D.places`; entries return their own kind; `entitiesAt` collects per kind (`g` never leaks into `l`). Per-record sha256 check and per-span surface check unchanged. |
| Scripture tag | `data-kind`/class come from the entity kind (`tag rgn`, dashed underline like `tag l`). |
| Detail | `projectedRegionFlow`: identity, certainty rows, semantic note, direct-passage pills, "지도에서는" (states that no approved coordinate/boundary exists), relations/people/events shown as **unlinked** text, VERIFY/HOLD list, source + approval record, `data-published`, `data-geometry`. Works with no geometry. |
| Map | No marker/label/polygon code path for kind `rgn` (no coordinates, `markers` stay Place-only). No polygon renderer was added: no approved geometry exists. |
| Explorer / search | Region appears in the shared store listing and search as "지역", "지도 표시 없음", Scripture action only (no "지도에서 보기"). The 대상 type filter is unchanged (Place filter excludes Regions). |
| URL | `#…&e=rgn.<stable_id>` restores the Region Detail; unknown ids / public mode are rejected by the existing `entityValid`. |

## Validation
`index.html?qa=rg` (`qa-rg.js`) builds in-memory variants of `index.html` that load the isolated staging files + the mode flag; 33 cases:
RG-01…RG-13 flow/contract, RG-F01…RG-F20 fail-closed (18 invalid Region mutations + stale index hash + mismatching span).
Result: **33/33 PASS**. Pipeline Node suites unchanged: `tools/pipeline/test.js` 109/109, `test-region.js` all PASS.

Preserved/verified: approval record (id/scope/note value), VERIFY 7 / HOLD 10, `reader.published=false`, `activation.publishable=false`, Detail without geometry, no marker/polygon, Beersheba/Gerar Detail HTML + markers + tags identical in live vs staging+mode.

## Not done (by design)
No Region→Place conversion, coordinate/polygon creation, automatic crosswalk/merge, Registry mutation, Reader Layer publication, bulk rollout, unrelated UI redesign, or live projection commit. Promoting Amalek to the live files remains a separate gated step.
