# GEO-1 Wave 5D IEP Browser Parity Certification

## Scope

Chromium certification covers the real `capital.html#/iep-command-v2` route with the development-only `iepSpatialDualRun=1` hash query. The default route remains on the legacy IEP map path.

## Results

- Legacy route: 88 SVG county paths and 88 native county controls rendered.
- Spatial dual-run: 88 legacy counties versus 88 Spatial counties.
- FIPS parity: exact, with no missing or extra identities.
- Label parity: exact.
- Geometry parity: exact structured GeoJSON equality.
- Selection: native county control updates the existing IEP county state using qualified FIPS-backed profile data.
- Navigation: URL remains on the IEP route during selection.
- Unresolved identity safety: no inference path was added; null county identities remain excluded from geographic joins.
- Privacy: browser assertions found no internal resolver, provenance, or authorization fields in the rendered surface.

## Browser Command

```text
SHS_TEST_FRONTEND_URL=http://127.0.0.1:5174 npx playwright test tests/ui/spatial-iep-county-dualrun.spec.mjs --project=chromium
```

Result: `4/4 PASS`.

## Production Gate

The dual-run requires both `import.meta.env.DEV` and the `iepSpatialDualRun=1` query in the hash route. Production preview now boots successfully after removing stale Vite development-client injections and correcting the production chunk graph. Chromium verified both `/capital.html#/iep-command-v2?iepSpatialDualRun=1` and the default route: 88 county paths rendered, no dual-run diagnostics or fixture content appeared, and the query flag did not activate Spatial dual-run behavior. Production gating: `PASS`.

## Accessibility

County selection has a native button equivalent with `aria-pressed`, Enter/Space activation, and one shared selection callback. The county details overlay is a semantic dialog outside the SVG namespace; it receives focus on open, closes with Escape, and returns focus to the initiating county control.

## Remaining Condition

This certifies the dual-run and accessibility boundary only. The production/default IEP rendering switch remains intentionally unperformed.
