# GEO-1 Wave 6B ODOT Client Qualification

## Current Consumer Decision

`NONE` is approved as the first consuming client in Wave 6B. The repository
contains ODOT-like consumers, but they are legacy SHF map paths and do not
provide a justified operational client contract:

| Consumer | Evidence | Decision |
| --- | --- | --- |
| `src/pages/shf-command/SHFOhioMap.jsx` | Fetches `/geo/ohio-counties.geojson`, uses county-name matching and mock state | Not approved; legacy dependency |
| `src/components/maps/OhioBaseMap.jsx` | Same ODOT asset and presentation behavior | Not approved; legacy dependency |
| Traffic / mobility candidates | Domain names appear in the estate registry, but no mounted, source-qualified consumer requiring ODOT geometry was confirmed | Future candidate only |
| Exchange / Capital | Mapbox/external-source path with unresolved provenance and identity | Blocked; not an ODOT consumer |

No current client demonstrates a need for ODOT's higher-resolution geometry,
has a protected regression contract, and has a settled publication boundary.

## Legitimate Future Use

A future transportation, mobility, or infrastructure operational map could use
ODOT county geometry as higher-resolution boundary context for operational
overlays. The domain overlay would need its own authority, identity,
publication, and verification contract.

## Client Gate

Before adapter implementation, identify one mounted or approved client with:

- a concrete high-resolution geometry requirement;
- protected route and interaction behavior;
- explicit domain record identity;
- publication and authorization rules;
- a safe failure state; and
- a regression surface.

Until then, readiness is `BLOCKED_BY_CLIENT` for implementation, even though
the source itself is `QUALIFIED_WITH_CONDITIONS`.
