# GEO-1 Wave 5D IEP Client Acceptance Gate

This gate records the controlled Wave 5D cutover. The legacy renderer remains
in place and the legacy geometry path remains available as an explicit
development rollback.

## Entry gate

- [ ] explicit IEP `countyFips` source identity is available and validated
- [ ] `entityToCounty` is not used by the Spatial join or client
- [ ] current IEP route and renderer behavior are regression-protected
- [ ] Census adapter remains registered-compatible and unchanged
- [ ] publication rules for attached IEP records are explicit
- [ ] privacy behavior is covered by fixtures

## Client gate

- [ ] dedicated IEP client adapter consumes only safe Spatial results
- [ ] no raw domain/Census object reaches the renderer
- [ ] no ODOT attributes or private provenance leak into the view model
- [ ] coordinate space remains `real-world.county-geojson`
- [ ] no coordinate transform or geometry repair exists
- [ ] no navigation authority moves into Spatial

## Parity gate

- [ ] 88 counties and FIPS set match
- [ ] geometry is unchanged and matches the qualified source
- [ ] labels and current selection behavior match
- [ ] hover/detail behavior matches or is explicitly improved
- [ ] publication filtering is no weaker
- [ ] error state never fabricates county data
- [ ] accessibility is not regressed
- [x] development dual-run passes
- [x] Chromium certification passes
- [x] Spatial path is the default county preparation path
- [x] explicit development rollback renders the legacy path
- [x] Spatial preparation fails closed without silent legacy fallback

## Decision statuses

Current status: `WAVE_5D_COMPLETE_WITH_ROLLBACK_CONDITION`.

The dedicated client adapter is now the default county preparation path behind
the existing renderer. The legacy path is retained for explicit development
rollback and is not silently selected on Spatial failure. Final legacy-path
retirement remains a Wave 5E decision.

Wave 5E disposition: the legacy default is retired, while the direct loader is
retained as an explicit DEV-only rollback and the dual-run is retained as a
DEV-only diagnostic. No silent fallback exists. IEP migration is
`IEP_MIGRATION_COMPLETE_WITH_ROLLBACK`.
