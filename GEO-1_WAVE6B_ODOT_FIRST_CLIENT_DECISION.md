# GEO-1 Wave 6B ODOT First Client Decision

## Candidate Audit

| Candidate | Current evidence | ODOT-specific value | Decision |
| --- | --- | --- | --- |
| SHS Operational Map | `capital.html#/exchange/unified-truth`, `SHSOperationalMapboxMap.jsx`; Mapbox token, Plotly remote county GeoJSON, hardcoded points, county-name selection | Could need operational boundary context, but current identity/provenance/publication contract is unresolved | `BLOCKED` |
| Traffic | Metaverse traffic corridor and authoring/review systems; normalized scene route points | No REAL_WORLD county consumer; presentation-only/dev-gated route system | `NOT_JUSTIFIED` |
| Water Mobility | Metaverse river/water route registries and review layers | METAVERSE scene paths, not ODOT county geography | `NOT_JUSTIFIED` |
| Infrastructure / data center | Conceptual/domain presentation surfaces; no approved operational county client | No concrete ODOT-dependent map contract | `NOT_JUSTIFIED` |
| Existing SHF Ohio map | Uses local ODOT-like asset but county-name matching and mock metrics | Legacy dependency, not a regression-protected ODOT operational client | `BLOCKED` |

## First Client Decision

`NO_JUSTIFIED_CLIENT`

No current or near-term client satisfies the standard of a real use case,
approved surface, coordinate compatibility, authority boundary, publication
scope, and regression-testable ODOT-specific value.

## Consequence

The ODOT source remains a qualified future authority, but adapter work is
`BLOCKED_BY_CLIENT`. Exchange/Capital must not be selected merely because it
uses Mapbox; its separate source and identity blockers remain active.
