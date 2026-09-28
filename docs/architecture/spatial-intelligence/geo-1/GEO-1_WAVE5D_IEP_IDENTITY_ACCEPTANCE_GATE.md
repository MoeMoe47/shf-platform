# GEO-1 Wave 5D IEP Identity Acceptance Gate

## Passed conditions

- [x] Neutral qualified Ohio county FIPS validator exists.
- [x] Qualified set contains 88 unique Ohio FIPS values.
- [x] Static county profiles retain existing labels and keys.
- [x] All 88 static profiles receive validated additive FIPS identity.
- [x] Canonical join requires exact FIPS equality.
- [x] Name-only, missing, unknown, and mismatched identity remain unresolved.
- [x] Canonical identity path does not import `entityToCounty`.
- [x] Identity does not mutate records or geometry.
- [x] Publication and privacy fields remain independent.

## Remaining conditions

- [ ] Dynamic IEP/domain record families expose explicit `countyFips`.
- [ ] Any remaining active IEP resolver dependency is removed or isolated.
- [ ] Browser certification gaps are resolved separately.
- [ ] IEP Spatial client adapter contract is implemented and tested.
- [ ] Legacy and Spatial map paths pass dual-run parity.

## Decision

Current identity phase: `COMPLETE_WITH_CONDITIONS`.

IEP client-adapter entry remains `READY_WITH_CONDITIONS` for static profile
data, but dynamic onboarding must not proceed until explicit domain identity is
available for every record family that will be projected.
