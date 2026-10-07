# JudeBible — Obsidian approved-research auto-discovery v0.1

Task: `IMPLEMENT_OBSIDIAN_APPROVED_RESEARCH_AUTO_DISCOVERY_TO_JUDEBIBLE_v0.1` · first real fixture: **Achaia** (existing research, no new research).

## Flow (all in `tools/pipeline`, run by `node tools/pipeline/run.js`)

```
Obsidian 02_연구물/ (whole root, recursive; 01_소스들 · 03_산출물 · 99_운영문서 excluded)
  → discovery            every .md is parsed read-only (``` and ~~~ yaml fences)
  → eligibility gate     research header + entity identity block + durable approval record (found BY ASSET ID, no config entry)
  → entity-type dispatch Place → existing Place path · Region → region adapter (2 note profiles) · route/person/event → reported "no adapter"
  → deterministic generation  data/projection.research.js + data/scripture.index.js (+ lineage / media sync as before)
  → app: next load       (Region attaches only in the controlled non-public mode — unchanged)
```

## What "no manual registration" means now
| Before | Now |
|---|---|
| `include` listed one folder per asset | `include: ["02_연구물/"]` — any sub-folder |
| `records[id]` entry required (`expected_identity`, approval ref) | optional (identity pin / overlay / approval override). Region approval record is located by `approved_asset`; Place pins to the note's own `Place.stable_id` |
| unknown note shapes ignored silently | every candidate is reported in `run-summary.json → assets[]`: `ingested` / `awaiting_approval` / `failed_closed` / `no_adapter` |

The **approval record is still required** (the gate is preserved): `tools/pipeline/approvals/*.json`, scope `IDENTITY_BINDING_ONLY`, all coordinate / geometry / reader / live-activation / registry / crosswalk / merge limits false. A note without one is discovered, reported `awaiting_approval`, and generates nothing.

## Region note profiles (one normalized record, one validator `R01–R17`)
* `app_ready_metadata` (Amalek) — unchanged; output is byte-identical to before.
* `worbs_sections` (Achaia) — `FINAL_RESEARCH_RESULT` + `Region:` block + `DIRECT_MENTION` / `STRONGLY_RELATED` / `map_ready` / `retained_VERIFY` / `retained_HOLD` blocks. The note has no binding block, so the viewer id comes **only** from the approval record (`JBC-CR-PLACE-ACHAIA-001`; `BAT01-PLACE-0016` stays `REFERENCE_ONLY`, `NOT_AUTOMATIC_CROSSWALK`). Validator differences for this profile (nothing relaxed otherwise): R05 requires the attested mutation facts (all NONE) + `BAT01_REG_crosswalk: NOT_INFERRED`; R06 requires id + sha256 and never invents a predecessor.

## Achaia result
`JBC-CR-PLACE-ACHAIA-001` · `regions` container only (never a Place) · approval `CAPTAIN_APPROVED` via `APR-JBC-ACHAIA-IDBIND-20261002-001` (note value `PENDING_CAPTAIN_REVIEW` kept as `note_approval_status`) · VERIFY 4 / HOLD 6 · 12 claims · 10 direct refs → 10 verses tagged, 4 related links never tagged · no coordinate, centroid, boundary, marker, route · `reader.published=false`, `activation.publishable=false`.

## Parser / safety changes
* `parse.js`: `~~~` fences are parsed like ``` fences (closed only by their own marker). Existing notes use only ```, so their parse is unchanged.
* Duplicate research ids: byte-identical copy → ignored; differing copies → both fail closed (last known good kept) — no guessing.
* Repo-mirror fallback: for a root include only sub-folders of the mirror count (the mirror root holds locks/gates/stale flat copies).
* Processing order depends on the research id (not folder layout) → deterministic output, existing key order preserved.

## Verification
* `test-autodiscovery.js` 14/14 · `test.js` 109/109 · `test-region.js` 12/12 · `test-promotion.js` all PASS.
* Regeneration: two independent runs byte-identical; Beersheba / Gerar / Amalek records and their index entries equal the previous live data.
* Changed pins (consequence of this task, not regressions): `test.js` I01 (root include semantics) and I12 (index meta now lists 4 records), `qa-rg.js` RG-13 (live files carry the two approved Regions instead of exactly one), `test-region.js` RG10 (approval authority removal now also needs an empty approvals dir).

## Not done (by design)
No Region→Place conversion, claim upgrade, geometry/coordinate invention, automatic crosswalk, Registry mutation or Reader publication. Route / Person / Event adapters are future work: such notes are reported `no_adapter` and never coerced.

## Save trigger (`tools/pipeline/watch.js`) — IMPLEMENT_OBSIDIAN_SAVE_TRIGGER_TO_JUDEBIBLE_CANONICAL_RUN_v0.1
`JBC_VAULT=<vault> node tools/pipeline/watch.js [--initial-run]` watches `<vault>/02_연구물/` (create · change · rename-into-scope; deletes ignored) and runs the canonical `node tools/pipeline/run.js` with that vault. It refuses to start without a bound, existing vault (no mirror fallback; never passes `--allow-mirror` / `--accept-source-change`) and holds `out/watch.lock` so only one watcher runs.
* **Debounce** 1500 ms. **Single flight**: events during a run only set a dirty flag → exactly one follow-up run afterwards, never parallel.
* **Duplicate suppression**: sha256 per note, seeded at start; identical bytes never trigger. **Ignored**: temp/swap/backup/hidden/sync-conflict files, non-`.md`, `.obsidian`, `.git`, `node_modules`, `out`, `approvals`, anything inside the repo. run.js never writes into the vault, so generated files cannot re-trigger.
* **Eligibility** is the existing gate inside run.js (approval record by asset id, identity, entity type, VERIFY/HOLD). Unapproved / no-adapter notes appear in `out/watch-status.json → last_run.assets[]` as `awaiting_approval` / `no_adapter` and generate nothing; last known good stays.
* **Failure**: outcome `ok` / `completed_with_issues` (exit 1 with summary: per-record fail-closed, LKG kept) / `failed` (guard, crash). Recorded in `watch-status.json` (+ last 20 failures); **no retry** — only a new save triggers again.
* **Atomic write** (run.js): projection + index are staged as `.tmp` pair, then replaced together; if a replace fails the already-replaced file is restored from `.prev`. If Windows keeps a file locked (dev server/browser), the finished `.tmp` is copied over it.
* **stable_id collision** now fails closed: two Place notes, two Regions, or a Region and a Place claiming one viewer id are all rejected (`STABLE_ID_COLLISION` / `R18`), last known good kept.
* Tests: `test-watch.js` 11/11 (real `fs.watch` on temp vaults + fake runner; real run.js only via `--dry`). Live generated files unchanged (same sha256) after all suites.
* Note: Google Drive for desktop may not emit events for changes synced from another device; local Obsidian saves do.
