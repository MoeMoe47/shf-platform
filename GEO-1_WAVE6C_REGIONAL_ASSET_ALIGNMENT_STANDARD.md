# GEO-1 Wave 6C Regional Asset Alignment Standard

## Sharing Rule

One geometry may be shared across DAY/DUSK/NIGHT only when the variants are
registered as `ALIGNED` or an explicitly approved `ALIGNED_WITH_TOLERANCE`.
Evidence must compare camera angle, crop, horizon, major landmarks, framing,
aspect ratio, and scene composition. File dimensions alone are insufficient.

## Current Results

| Scene | Result | Evidence |
| --- | --- | --- |
| Oil Rig | `UNKNOWN` | Variants share `1536x1024` dimensions and visibly preserve the rig composition, but no measured landmark registration or alignment manifest exists. |
| Open Sea | `UNKNOWN` | Variants depict the same ocean/horizon composition, but dimensions differ: `1584x993`, `1580x995`, `1578x997`; no registration manifest exists. |

Neither scene is approved for shared production geometry yet.

## Alignment Identifier

Future approved geometry must reference a deterministic composition identity
containing the scene ID, variant family, and hashes of the approved asset
variants. A semantic version is not invented when the repository has no such
source version.

## Invalidation

Geometry becomes `NEEDS_REVIEW` when crop, camera, framing, aspect ratio, or a
key landmark changes. Compression or color-only changes do not invalidate it
when measured spatial alignment is unchanged.
