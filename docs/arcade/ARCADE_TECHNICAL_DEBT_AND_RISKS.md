# Arcade Technical Debt And Risks

| Risk area | Finding | Status | Evidence |
| --- | --- | --- | --- |
| Duplicated implementations | Multiple game catalogs (`src/data/arcade.js`, `src/pages/arcade/games/index.js`, fixtures) | DUPLICATE | No canonical registry. |
| Dead files | `src/pages/arcade/Tournament.jsx` is not routed | LEGACY / BROKEN | `/tournaments/weekly` renders parent placeholder. |
| Legacy routes | `#/arcade/games`, `#/games/leaderboard` fall back to dashboard | BROKEN | Runtime smoke. |
| Route authority conflicts | Dev index references `/arcade` nested routes no longer canonical | LEGACY | `src/pages/Arcade.jsx`. |
| Localhost assumptions | Universe/registry code references local ports; Vite proxy assumes API 8091/Fabric 8090 | PARTIAL | `vite.config.js`, cross-app route bridge. |
| API client mismatch | Arcade UI does not call Arcade backend | BROKEN | No frontend `arcade` API usage found. |
| Browser-only state | Credit ledger and leaderboards use `localStorage` | BROKEN | `src/utils/creditLedger.js`, `Leaderboard.jsx`. |
| Insecure scores | Free-text leaderboard submission from local best score | BROKEN | `Leaderboard.jsx:58`. |
| Missing authorization | Frontend routes mostly ungated preview | PARTIAL | Backend gated, frontend not. |
| Cross-tenant risks | Backend scopes attempts/results; local frontend ignores tenants | PARTIAL | API good; UI local. |
| Inaccessible experiences | Notification button below 44px in focused UI test | BROKEN | 3 test failures. |
| Unbounded AI calls | No Arcade AI calls found | MISSING | AI features preview only. |
| Unmoderated publishing | Publishing fail-closed | PLACEHOLDER | No current violation, but capability missing. |
| Stale assets | Classic assets static; no asset registry | PARTIAL | `public/assets/arcade/*`. |
| Missing tests | No actual game runtime, backend-to-frontend result, leaderboard authority tests | MISSING | Test inventory. |
| Oversized assets/bundles | Build warns large chunks and image assets | PARTIAL | `npm run build` warnings. |
| Runtime errors | Smoke saw no route page errors | COMPLETE for smoke scope | Playwright smoke. |
| Broken imports | Build succeeded | COMPLETE for build scope | `npm run build`. |
| Broken deep links | Unknown Arcade hashes redirect to dashboard | BROKEN | Runtime smoke. |
| Undocumented dependencies | Game runtime absent; external example links | UNKNOWN | Catalog metadata. |
