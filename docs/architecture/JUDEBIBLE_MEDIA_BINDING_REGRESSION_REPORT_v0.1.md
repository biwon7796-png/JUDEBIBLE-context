# Beersheba media binding regression — exact cause & repair (v0.1)

## Break point
`data/projection.research.js` / `data/scripture.index.js` were regenerated (file time 2026-10-01 18:11) by the pipeline **without `JBC_VAULT` bound**, so ingest read the repo *mirror* `docs/architecture/브엘세바/…20260930_01.md` (19,568 B, 09-30 11:26) instead of the authoritative vault note (`G:/내 드라이브/Projects/옵시디언/Jude_Research/02_연구물/브엘세바/…`, 23,720 B). The mirror lacks the `structured_media_rights` block (per-asset `rights_status: CLEARED`). Without it the resolver cannot clear display → `rights.display_clearance=false`, `display_mode="attribution_only"`, `preview_url=null` → Detail correctly fails closed → photo gone. Media metadata, `target_ref` stable-id bindings, rights, VERIFY/HOLD were all still present; the Detail UI renderer and `mediaGate` were NOT at fault.

Contributing: the same session edited `tools/pipeline/test.js` (N19, N41, M01, M03, M04, M10, I01) so the tests expected the degraded state (`attribution_only`, `preview_urls: 0`), hiding the regression (pipeline suite showed 105/105 on the broken data).

## Repair (minimal)
1. Re-ran `JBC_VAULT="G:/내 드라이브/Projects/옵시디언/Jude_Research" node tools/pipeline/run.js` → projection/index regenerated from the vault note. Diff vs. the last committed projection: only the source sha (`ff3bd3…` → `c02853…`); media (3 assets, CLEARED, previews), claims, VERIFY/HOLD identical.
2. Restored `tools/pipeline/test.js` to HEAD (the weakened expectations reverted). Previous version kept in the session scratchpad as `test.js.other-session-version`. With the vault bound: `PASS 105/105`.
3. No code change in app/Detail; no Beersheba hard-code; no name matching.

## Open item (needs owner decision)
`BS-01` pins `CANONICAL_SHA = ff3bd3…`; the vault note is now `c02853…` (edited 2026-10-01 00:02; projected values unchanged). Test left red on purpose — approve the new canonical hash or restore the old note. The repo mirror is still stale; any ingest without `JBC_VAULT` will reproduce the regression (consider syncing the mirror or failing when the mirror lacks the structured rights block).

## Generic binding path (verified by `MEDIA_BIND_01–04` in `qa-geo.js`)
Obsidian note → pipeline → `BVC_PROJECTION.places[stable_id].media[]` (each asset `target_ref.ref` = stable id, `binding: overlay_explicit`) → `findMedia/mediaGate` → Detail `[data-part=media]`. Gerar (second record) gets only its own media; a record under a different stable_id with the same display name is not merged; a place without research media has no photo area; toggling map labels doesn't affect Detail.

---
# Addendum — source hash lineage & stale-ingest guard (2026-10-02)

## Lineage (Beersheba note `JBC_BEERSHEBA_CONNECTED_WORBS_20260930_01.md`) — also in `tools/pipeline/lineage/source-lineage.json`
| # | Source | Bytes | sha256 (full) | Content |
|---|---|---|---|---|
| 1 | repo mirror `docs/architecture/브엘세바/…` (HEAD 5183808, 09-30 11:26) | 19,568 | `7e3af9f6a78bc7d6c21814c7bfccd36545105d7df8cbc1dd9f1bf98df8aef0f5` | no `media_metadata_enrichment`, no `structured_media_rights` |
| 2 | vault Drive conflict copy `…01 1.md` (09-30 16:44; skipped by discovery: header id ≠ file name) | 22,371 | `102a8b3e4f9dc40e500f8a07d2ddb806f723d149f5d657265d45a6d7cb497081` | #1 + media enrichment (source URL, creator/license/attribution MATCH); no structured rights |
| 3 | vault note, source of the committed projection (≤ 09-30 21:48) | **not recoverable** | `ff3bd3789f737b7eaac65cb6eab1fdf303d21bb57379c71d3f48b46599966d90` | had CLEARED rights (HEAD projection shows them) |
| 4 | vault note now (10-01 00:02, `G:/내 드라이브/Projects/옵시디언/Jude_Research/02_연구물/브엘세바/…`) | 23,720 | `c02853f748254bf22a9de5ac0258c66475b85b6ea172b95b494f32bf878e5e39` | #2 + `structured_media_rights` (CLEARED ×3, CC BY-SA 4.0 / 3.0 / CC BY 4.0, BS-002 discrepancy note kept) |

Verified diffs: #1→#4 adds only media blocks (enrichment, structured rights, per-asset URL/creator/license/attribution lines, attribution quotes) — "research_claims_changed: false", "stable_ids_changed: false", "identity_certainty_changed: false" are stated in the blocks; no claim/VERIFY/HOLD text changed. #2→#4 adds exactly the 39-line `structured_media_rights` block. #3 (`ff3bd…`) bytes cannot be diffed (not in git, vault, or any local cache; no Drive revision API here). Evidence it equals #4 in meaning: regenerating from #4 changes only the three sha lines of the committed projection/index — claims, VERIFY/HOLD, media, rights and `source_locator` are identical. The differing bytes are therefore in non-projected text; this stays **UNVERIFIED** until someone with Drive version history compares them. `BS-01` pin stays `ff3bd…` (unchanged, awaiting approval).

## Guard (`tools/pipeline/run.js`)
* Write run on the real `data/` without `JBC_VAULT` → refused, exit 3, nothing written.
* `--allow-mirror` permits a mirror run only if it reproduces the recorded sha; a mirror that would change the recorded lineage needs `--accept-source-change` too.
* A bound-but-missing vault fails loudly (existing behaviour, now tested).
* Dry runs and temp-dir ingests (tests) are unguarded. Vault runs report `source_changes` and append to the lineage log (never approves a hash).

## Verified
| Scenario | Result |
|---|---|
| vault bound, write run | exit 0, projection byte-identical (no source change), lineage deduped |
| `JBC_VAULT` unset, write run | exit 3 STALE_SOURCE_GUARD, projection/index/run-summary hashes unchanged |
| unset + `--allow-mirror` | exit 3 (c02853… → 7e3af9… lineage change refused), unchanged |
| `JBC_VAULT` → missing path | exit 1 "bound but unavailable" |
| unset, `--dry` | exit 0, wrote:false |
| pipeline tests, vault bound | PASS 109/109 (105 + G01–G04) |
| pipeline tests, no vault | 100/109 — nine mirror-dependent checks fail as designed and now print a NOTE |
