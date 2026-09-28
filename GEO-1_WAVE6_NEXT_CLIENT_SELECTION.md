# GEO-1 Wave 6A Next Client Selection

## Recommendation

**ODOT operational county geography** is the single recommended next
implementation candidate, subject to a qualification gate.

## Why This Candidate

- Official ODOT TIMS County source and publisher metadata are already identified.
- All 88 FIPS identities match the official service crosswalk.
- It provides a meaningful capability beyond the accepted small-scale Census
  base: higher-resolution operational county geography and a possible future
  operational overlay boundary.
- It can remain a separate ODOT source authority without collapsing Census
  geography or IEP domain authority.
- A narrow geometry-first adapter can avoid importing population, elevation,
  district, county-seat, or other ODOT attributes until a real use case exists.

## Conditions Before Implementation

1. Confirm ODOT reuse, redistribution, attribution, and modification terms.
2. Freeze the source service version or an approved repository snapshot.
3. Define the ODOT operational feature/layer contract separately from Census.
4. Identify the consuming operational client and regression surface.
5. Define publication and verification ownership for operational overlays.

Until these are complete, readiness remains `QUALIFIED_WITH_CONDITIONS`.

## Rejected as Next Candidate

Exchange/Capital has strategic value but is currently blocked by remote source
provenance, token/external-service dependency, and mixed domain identity.
SHF is blocked by publication state. Regional scenes are presentation-oriented
and do not yet exercise a governed new Spatial capability. Disconnected globes
lack mounted, authoritative client contracts.

## Capability Added

If qualified, ODOT would exercise REAL_WORLD high-resolution operational county
geography and source-specific operational metadata boundaries beyond the
existing METAVERSE point-marker and Census/IEP polygon clients.
