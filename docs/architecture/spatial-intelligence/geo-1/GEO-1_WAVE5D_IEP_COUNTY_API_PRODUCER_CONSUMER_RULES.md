# GEO-1 Wave 5D IEP County Producer / Consumer Rules

## Producer Authority

Allowed producers are:

- domain source
- validated administrative input
- canonical import
- explicit relationship guaranteed by the owning domain

Forbidden producers are frontend inference, Spatial inference, name guesses,
address guesses, entity guesses, fuzzy matches, defaults, and Franklin
fallbacks.

## Consumer Authority

Consumers may validate `countyFips`, retain `countyName` for display, join an
IEP record to a Census feature by exact FIPS, or keep the record geographically
unresolved. Consumers may not create identity or promote county geometry into
domain publication authority.

## Privacy and Publication

Adding or serializing `countyFips` does not change authorization, visibility,
`publicApproved`, publication state, ownership, or workflow state. Public
Census geometry does not make an attached private or unpublished IEP record
public.

## Resolver Isolation

The canonical production/domain contract has no dependency on
`src/system/resolvers/entityToCounty.js`. The legacy resolver remains available
only to unrelated legacy consumers until separately remediated.

## Current Repository Boundary

The repository contains frontend IEP demo/static/derived records and no
verified API-backed IEP county producer. This contract therefore defines the
future producer obligation without adding a speculative endpoint, DTO, table,
or migration.
