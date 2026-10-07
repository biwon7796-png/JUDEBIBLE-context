# ALIGN_LEGACY_MAP_QA_WITH_SINGLE_GEOGRAPHIC_MODE_v0.1

Status: PASS_READY_FOR_REVIEW
Date: 2026-10-01
Scope: QA contract alignment only; no research-data or map-product rollback.

## Preserved contracts
- User-facing sample-map mode remains removed: no `#map-mode`, no `svg.smap` restoration.
- Moriah remains without an approved geographic coordinate; legacy fixture x/y is never promoted to a geographic marker.
- Research projection, stable_id bindings, certainty, VERIFY/HOLD, and fail-closed semantics are unchanged.
- GEO-03 remains the authority for Beersheba map rendering: no exact biblical-place marker; only the approved Tel Be'er Sheva archaeological candidate and modern Beersheba reference markers may render.
- No route geometry is inferred from legacy fixture data.

## Legacy QA alignment
- BS-03: replaced the obsolete “Moriah sample pin is the only point” assertion with single-geographic-surface + no exact Beersheba marker + GEO-03 approved-marker assertions.
- BS-05: retained no exact biblical pin/no route/no degraded-error checks; allowed only the two GEO-03 approved contextual coordinates, both bound to the same Beersheba stable_id.
- SELF 011–013: replaced sample-pin existence/click/activation checks with gmap-only, no-Moriah-marker, Scripture/Detail/entity synchronization checks.
- KRV K07: preserved real-text/entity/context regression coverage; selection now enters through the Scripture place entity instead of a removed sample pin.
- WS-003/004/005/006/008/009/013/014/016/021: replaced removed sample-map mechanics with current geographic-map interaction or explicit unlocated-Moriah behavior while retaining state/history/layout/anchor synchronization coverage.
- QA-WS-019: GuideTopic/GuideStep independence, mutation-driven camera/layer/object behavior, ordering, and closed-Detail behavior remain; only the obsolete sample-pin restoration assertion became a single-geographic-surface/layer-state assertion.
- QA-WS-020: one shared place-entity source remains enforced; GuideStep IDs must resolve, Moriah cannot gain a marker from fixture x/y or placeLinks, and approved Beersheba markers must bind to the same stable_id.
- EE-39: stable_id continuity across Explorer, Detail, Scripture, and Map remains; the removed mode-switch click is replaced by an explicit no-switch + geo-mode assertion.

## Verification
- bs 17/17 PASS
- ws 25/25 PASS
- self 20/20 PASS
- krv 9/9 PASS
- ee 40/40 PASS
- geo 85/85 PASS
