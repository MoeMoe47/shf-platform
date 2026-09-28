# GEO-1 Wave 5D IEP Client Acceptance Gate

This gate governs future implementation. It does not authorize implementation
in the current planning pass.

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
- [ ] development dual-run passes
- [ ] Chromium certification passes

## Decision statuses

Current status: `BLOCKED_BY_DOMAIN_IDENTITY`.

The base geography adapter is complete, but the current IEP path lacks an
explicit stable domain join and imports the unsafe county fallback module.
Wave 5D must not be marked ready until those facts are resolved by evidence.
