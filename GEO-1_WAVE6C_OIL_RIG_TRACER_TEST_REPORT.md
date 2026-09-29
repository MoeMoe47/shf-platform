# Wave 6C Oil Rig Tracer Test Report
## Unit Contracts

- coordinate/Polygon validator: `20/20 PASS`
- tracer, draft, gate, authority, and immutability contract: `36/36 PASS`
- Regional adapter red contract remains separate: `20/20 EXPECTED_MISSING_ADAPTER`

## Safety Results

- production gate rejects the authoring flag outside DEV
- normal Oil Rig route has no tracer overlay or panel
- DRAFT status is preserved
- APPROVED input is read-only and can only seed a new DRAFT
- no registry write or mutation API exists
- no Regional adapter or Spatial eligibility path was added
