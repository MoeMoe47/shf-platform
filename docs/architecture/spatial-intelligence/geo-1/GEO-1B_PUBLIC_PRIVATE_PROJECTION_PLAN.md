# GEO-1B Public / Private Projection Plan

Spatial must not become authorization authority. It enforces projection eligibility using decisions supplied by identity, domain, and publication systems.

## Levels

- `PUBLIC`
- `AUTHENTICATED`
- `ORGANIZATION`
- `OPERATOR`
- `ADMIN`
- `RESTRICTED`
- `NOT_PUBLISHED`

## Defense in Depth

| Enforcement point | Role |
|---|---|
| Server adapter | Prefer filtering sensitive records before transport when backend projection exists |
| Shared projection layer | Apply eligibility and publication-state checks consistently |
| Client render layer | Final suppression/masking for UI safety and stale client state |

## Rules

Coordinates do not make records public. Authorization and publication are separate. Restricted and unpublished records should be hidden, masked, generalized, or replaced with an explicit unavailable state according to source policy.
