# GEO-1 Wave 5D IEP Client Contract

Planning contract only. No runtime onboarding is implemented in Wave 5D.

## Inputs

The client consumes only safe results produced by the production Spatial
Projection Pipeline from the qualified Census county adapter. It does not
accept raw domain records, raw Census files, `InternalProjectionResult`, or
unvalidated objects.

Accepted coordinate contract:

```text
coordinateFamily = REAL_WORLD
coordinateSpaceId = real-world.county-geojson
```

No coordinate transform, reprojection, normalization, or geometry repair is
permitted in the client.

## Output view model

```text
{
  id,
  countyFips,
  label,
  geometry,
  presentation,
  accessibility,
  interaction
}
```

The model is allowlisted. It contains no source record internals, evidence,
private provenance, viewer authorization, ODOT attributes, or IEP domain data.

## Authority separation

| Concern | Authority |
| --- | --- |
| County base geometry | U.S. Census Bureau qualified dataset |
| Geometry projection contract | Spatial Engine |
| IEP program/domain records | IEP/domain system |
| County-to-record join | Explicit validated `countyFips` only |
| Publication of IEP records | IEP/domain publication policy |
| Rendering | IEP client/map |
| Navigation and record opening | IEP router/domain owner |

Public geometry never grants publication eligibility to an attached record.

## Identity contract

The client requires a validated five-digit Ohio FIPS value. It must not join
by label or use `entityToCounty`. An absent or invalid value produces an
unresolved association, not a default county.

## Interaction contract

Selection, hover, and highlight remain presentation concerns. A future client
may emit request-only `SELECT`, `DESELECT`, `FOCUS`, `HIGHLIGHT`, or
`OPEN_RECORD` interactions through the existing runtime where justified.
`OPEN_RECORD` does not authorize navigation. The IEP router remains the
decision-maker.

## Failure behavior

If pipeline/client conversion fails, the preferred onboarding behavior is fail
closed for the Spatial path. A development-only or temporary legacy rendering
path may remain during migration, but it must be explicit, observable, and
must never fabricate a county or silently invoke the Franklin fallback.

## Non-goals

This contract does not replace the current IEP map, attach IEP data, fix
`entityToCounty`, add accessibility behavior, or retire the legacy geometry
consumer. Those require later implementation and acceptance work.
