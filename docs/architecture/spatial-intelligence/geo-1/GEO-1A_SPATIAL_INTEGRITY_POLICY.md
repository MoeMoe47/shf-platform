# GEO-1A Spatial Integrity Policy

Spatial Intelligence must not fabricate geography, state, authority, verification, or transforms.

## Explicit Prohibitions

- unknown entity to Franklin County fallback
- invented latitude/longitude
- invented geometry
- invented coordinate transforms
- demo coordinates presented as real
- registry metadata presented as engine state
- route presence presented as authority
- unverified data presented as verified
- textual jurisdiction presented as geometry
- coordinates presented as publication approval

## Known Remediation Target

GEO-0 confirmed that `src/system/resolvers/entityToCounty.js` returns Franklin County for unknown entities after temporary mappings. This is a spatial integrity risk and a later implementation-phase remediation target.

GEO-1A does not fix this behavior.

## Integrity Requirement

Unknown, unapproved, demo, stale, or unverified spatial data must be labeled, suppressed, or kept unavailable according to its source and publication state.
