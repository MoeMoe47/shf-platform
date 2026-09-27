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
