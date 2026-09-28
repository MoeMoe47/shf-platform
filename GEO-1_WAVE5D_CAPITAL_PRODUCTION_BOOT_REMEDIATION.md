# GEO-1 Wave 5D Capital Production Boot Remediation

## Original failure

The Capital production preview failed before React mounted with:

```text
ReferenceError: __DEFINES__ is not defined
```

The first failing generated location was `dist/assets/vendor-CH_-0t41.js`, reached from the Capital page at `http://127.0.0.1:5180/capital.html#/iep-command-v2?iepSpatialDualRun=1`. The root element had no mounted children.

## Root cause

Four secondary HTML entrypoints contained stale development-only `/@vite/client` and, in three cases, `/@react-refresh` scripts. Those scripts pulled Vite's development environment/HMR module into the shared production dependency graph. The Capital entry consumed that graph, leaving Vite's `__DEFINES__` placeholder unresolved in the production bundle. Development worked because the Vite dev server supplies and transforms those modules at runtime.

After that defect was removed, production exposed a second temporal-dead-zone failure caused by the existing manual source chunk partition: `components`, `pages`, and `shared` chunks imported one another eagerly. The production-only cycle attempted to read an API binding before initialization. The source/config-level remediation leaves dependency vendor chunks explicit and lets Rollup preserve the application module graph rather than forcing those cross-layer source chunks apart.

## Remediation

- Removed stale Vite client and React refresh injections from `foundation.html`, `sales.html`, `employer.html`, and `solutions.html`.
- Retained dependency vendor chunking, but removed manual chunk forcing for application `pages`, `components`, and `shared` modules so production initialization follows the source module graph.
- No runtime global, broad `define` replacement, secret, or authorization value was added.

## Regression protection

`tests/capitalProductionBootWave5D.test.mjs` verifies that production HTML has no development-client injections and that built JavaScript contains no unresolved `__DEFINES__` token.

Result: `2/2 PASS`.

## Production preview certification

Build:

```text
npm run build: PASS
```

Preview:

```text
npm run preview -- --host 127.0.0.1 --port 5180
```

Chromium verified the Capital IEP route in production preview. React mounted and 88 county SVG paths rendered. With `iepSpatialDualRun=1`, dual-run diagnostics and fixture content were absent because the production build has `import.meta.env.DEV === false`. The default route also rendered the same 88-county legacy map without diagnostics.

## Security review

The fix does not expose secrets or private configuration. It removes development tooling from production HTML and does not add a runtime global or compile-time define. No internal provenance, authorization context, or fixture data appeared in the production DOM.

## Scope

The IEP default map remains unchanged. The Spatial production cutover, legacy-path retirement, backend/API work, Census source changes, ODOT adapter, and `entityToCounty` remediation remain out of scope.
