# GEO-1 Wave 6B Acceptance Gate

## Evidence Captured

- Official ODOT TIMS County layer and service metadata retrieved.
- Official publisher/credit: `ODOT Office of Technical Services`.
- Official coverage: 88 counties; annual update statement.
- Stable candidate identity: `FIPS_COUNTY_CD`.
- Local asset remains unchanged at SHA-256
  `d562c4a4e424b6bceba03b35750a1846a6ed643c04437b28f631c9f0f485bf43`.
- Current analysis response hash:
  `221566f91bcf2f35ff1490e6307433aa66f02684e07b8583924d19ca51e14691`.
- Local/live crosswalk: 88/88 FIPS; 82/88 non-service-managed attributes;
  85/88 exact geometries.

## Gates

| Gate | Status |
| --- | --- |
| Official source and publisher | Confirmed |
| Stable identity | Confirmed, 88 unique Ohio FIPS |
| Geometry type/coordinate evidence | Confirmed for analysis export |
| Rights/use | Conditional; no complete reuse license |
| Governed snapshot/version | Design defined; not implemented |
| Minimal feature contract | Designed |
| Publication boundary | Defined |
| Justified consuming client | Not identified |

## Qualification Decision

`QUALIFIED_WITH_CONDITIONS` for source qualification. Adapter implementation
readiness is `NOT_READY` because rights clarification, approved snapshot
governance, and a justified first consuming client remain open.

## Explicit Non-Goals

Wave 6B does not create an adapter, change the ODOT asset, replace Census,
merge authorities, change Exchange or SHF, add a coordinate transform, or
fetch ODOT at runtime.
