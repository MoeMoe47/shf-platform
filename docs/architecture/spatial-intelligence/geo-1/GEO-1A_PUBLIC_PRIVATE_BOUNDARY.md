# GEO-1A Public / Private Boundary

Spatial must not expose a record simply because coordinates exist. Publication and authorization are separate concerns.

## Publication Levels

- `PUBLIC`
- `AUTHENTICATED`
- `ORGANIZATION`
- `OPERATOR`
- `ADMIN`
- `RESTRICTED`
- `NOT_PUBLISHED`

## Boundary Rules

1. `PUBLIC` features may be displayed to unauthenticated users only when the owning publication authority allows it.
2. `AUTHENTICATED` features require a signed-in identity and any domain-required checks.
3. `ORGANIZATION` features require organization context and authorization.
4. `OPERATOR` features require operator permissions.
5. `ADMIN` features require admin permissions.
6. `RESTRICTED` features may be hidden, masked, generalized, or replaced by a restricted notice.
7. `NOT_PUBLISHED` features must not be exposed on public surfaces.

## Projection Boundary

Spatial enforces eligibility at projection time and again at render time where practical. Domain and identity systems remain the source of authorization and publication decisions.
