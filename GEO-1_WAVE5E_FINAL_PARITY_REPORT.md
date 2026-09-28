# GEO-1 Wave 5E Final Parity Report

## Parity

| Check | Result |
| --- | --- |
| Source counties | `88/88` |
| Spatial features | `88/88` |
| Client view models | `88/88` |
| Rendered counties | `88/88` |
| FIPS parity | exact; missing/duplicate/extra `0` |
| Geometry parity | exact; mismatch `0` |
| Label parity | exact; mismatch `0` |
| Static and dynamic joins | FIPS-only; unresolved identities excluded |
| Accessibility | keyboard, non-map equivalent, selected semantics, focus lifecycle, Escape, and reduced-motion-safe behavior pass |
| Privacy/publication | public geometry does not publish private or unpublished IEP records |
| Navigation | IEP/domain/router remains authoritative |

## Browser Evidence

- Default Spatial IEP route, rollback, and existing certification set: `10/10 PASS`.
- Wave 5E controlled failure and production-query gating: `2/2 PASS`.
- Production preview: `PASS`; React mounted and 88 paths rendered.
- Production query flags did not expose DEV rollback or dual-run diagnostics.

## Performance

No material regression was observed in the certified production-preview path.
The earlier dual-run measurement showed approximately `13.7 ms` additional
preparation overhead; the default cutover performs a single Spatial preparation
and does not carry that comparison overhead.

## Failure and Auth Classification

The controlled asset failure produced a visible `spatial-error` state and zero
paths, with no legacy fallback. Standalone preview `/api/auth/me` HTTP 500 is
`EXPECTED_MISSING_SERVICE` because no API service is attached; map boot and
county rendering remain correct.

## Integrity

The Census asset hash remains
`40c161c8b142b71e26f049e97c6644c9aaf0cbb1f2326ca2cfe365b3c288484f` and the
ODOT asset hash remains
`d562c4a4e424b6bceba03b35750a1846a6ed643c04437b28f631c9f0f485bf43`.

All Spatial regression suites remain green: `383/383 PASS`; IEP regression is
`6/6 PASS`; build is `PASS`.
