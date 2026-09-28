# GEO-1 Wave 5D Dynamic IEP Identity Acceptance Gate

## Passed

- [x] Dynamic identity validator accepts only the qualified 88-county FIPS set.
- [x] Missing, malformed, non-Ohio, and unknown FIPS remain unresolved.
- [x] County names and entity text cannot join geometry.
- [x] Canonical IEP path has zero `entityToCounty` dependencies.
- [x] Franklin fallback cannot assign canonical dynamic identity.
- [x] Static/demo labels remain unchanged.
- [x] County-owned derived priority cases propagate explicit parent FIPS only.
- [x] Private and unpublished records retain their original state.
- [x] Unresolved records do not receive geometry.
- [x] IEP map component and GeoJSON path remain unchanged.

## Remaining conditions

- [ ] Dynamic production/API record sources provide authoritative
  `countyFips: string | null`.
- [ ] All future production record families pass source-level identity
  validation.
- [ ] Existing Chromium certification gaps are resolved separately.
- [ ] Dedicated IEP Spatial client adapter is implemented and parity-tested.

## Decision

`READY_WITH_CONDITIONS` for client-adapter planning. The repository-controlled
dynamic/demo path is safe: records are explicit-valid or unresolved and
excluded. Production onboarding remains conditional on an API/domain source
contract.
