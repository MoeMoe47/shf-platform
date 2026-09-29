# Wave 6C Oil Rig Authoring Gate

## Decision

`OIL_RIG_READY_WITH_ALIGNMENT_CONDITION`

The production DAY/DUSK/NIGHT plates are aligned with tolerance and can share a
composition family. Authoring remains conditioned on the future tracer using
the frozen coordinate, registry, approval, and validation contracts. No
geometry has been authored or approved.

## Evidence

- all three production background assets are registry-backed
- all three are 1536×1024 with the same declared camera aspect
- eight distributed structural landmarks remain within the pre-declared 1.0
  scene-normalized-unit sharing tolerance
- no structural crop, scale, horizon, or perspective change was observed
- illumination and atmospheric changes do not invalidate spatial alignment

## Semantic Gate

`GEOMETRY_SEMANTICALLY_JUSTIFIED`.

The Polygon will represent owner-approved scene coverage for Spatial scene
identity, selection/hit testing, and future scene-level containment. It will
not represent a mobility or route layer.

## Remaining Conditions

- implement the DEV-only tracer under the explicit two-part gate
- create and review a DRAFT Polygon
- validate and approve it through the Regional Geometry Registry
- retain geometry eligibility at zero until approval

## Adapter Status

`BLOCKED_BY_COORDINATES` remains correct until an APPROVED Oil Rig Polygon
exists.

## Open Sea

`DEFER_UNTIL_OIL_RIG`. Its alignment audit is intentionally not expanded in
this phase.
