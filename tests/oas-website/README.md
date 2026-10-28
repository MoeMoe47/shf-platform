# OAS website regression commands

Run from the repository root with existing Node/Vite/React/Playwright dependencies. Chromium must be installed for Playwright. The accessibility gate requires axe-core: resolve the local package by default, or set OAS_AXE_PATH to an approved local axe.min.js copy. Missing accessibility tooling fails the suite rather than skipping it. This batch used the same read-only axe copy as the audit; no dependencies or root package scripts were changed.

```sh
node scripts/verify-oas-website-source.mjs
node_modules/.bin/tsc -p tests/oas-website/tsconfig.json
node_modules/.bin/vite build --config vite.oas-website.config.mjs
node --test tests/oas-website/website.test.mjs
```

Optional: OAS_WEBSITE_BUILD_DIR selects a different compiled output; OAS_WEBSITE_EVIDENCE_DIR saves JSON and ten screenshots; OAS_AXE_PATH selects the axe source. The suite starts/stops a loopback-only, random-port static HTTP server with strict 404s and no SPA fallback. Public artifact content types are application/json and text/markdown. Hosting must preserve them.

The build configuration is deliberately independent of the unrelated root Vite/package changes. It packages five OAS HTML entries, shared application code and only existing OAS public assets/files. It does not deploy, merge applications, rewrite normative artifacts or provision external infrastructure.
