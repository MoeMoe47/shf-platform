# GEO-1A Layer Contract

Layers group projected features for display and interaction. Layers must not become data authorities.

## Required Fields

- `layerId`
- `name`
- `owningDomain`
- `sourceAuthority`
- `supportedCoordinateSpaces`
- `visibilityPolicy`
- `publicPrivateEligibility`
- `requiredPermissions`
- `timeAwareCapability`
- `selectionCapability`
- `verificationCapability`
- `accessibilityBehavior`
- `lifecycleStatus`

## Visibility Policy

A layer may be visible by default, user-enabled, role-gated, time-gated, hidden, or unavailable. Visibility is not the same as publication approval.

## Public/Private Eligibility

Each layer must declare whether it can render public, authenticated, organization, operator, admin, restricted, or unpublished features. Spatial must filter at the projection boundary.

## Accessibility Behavior

Each layer must define text equivalents, keyboard selection behavior, reduced-motion equivalents, and fallback behavior for canvas, globe, SVG, or Mapbox surfaces.

## Lifecycle Status

Allowed lifecycle values:

- `ACTIVE`
- `ACTIVE_BUT_DEGRADED`
- `DISCONNECTED`
- `UNMOUNTED`
- `ARCHIVED`
- `FROZEN`
- `EXPERIMENTAL`
- `RESTORATION_CANDIDATE`
- `RETIREMENT_CANDIDATE`
- `UNKNOWN`

## Amendment: GEO1-WAVE3B-DEC-015 (Wave 3B Layer Policy Fields)

This amendment adds optional fields. The contract text above is unchanged. Full types, defaults, and validation rules are in `GEO-1_WAVE3B_RUNTIME_CONTRACT.md` §8.

| Field | Absent means |
|---|---|
| `stalePolicy` (`MARK_STALE` \| `SUPPRESS` \| `UNAVAILABLE`) | behave as `MARK_STALE` |
| `maxSourceAge` (ISO 8601 duration) + `freshnessAuthority` | no calculated freshness |
| `soonThreshold` (ISO 8601 duration) + `soonThresholdAuthority`, time-aware layers only | EVENT_SOON not calculable |
| `maskMode` (`HIDE` \| `NOTICE` \| `GENERALIZED`) | `HIDE` |

Invalid values reject the layer at registration (`LAYER_POLICY_INVALID`). These fields describe presentation policy declared by the named authorities. They do not make a layer a data authority.
