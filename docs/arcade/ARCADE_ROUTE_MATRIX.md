# Arcade Route Matrix

Phase 0 forensic audit. Status labels use the required vocabulary. Runtime validation used `npm run dev` on `http://127.0.0.1:5173/` and Playwright smoke navigation on September 30, 2026.

## Canonical Host

| Host / entry | Source | Status | Evidence |
| --- | --- | --- | --- |
| `/arcade.html` | `arcade.html`; `vite.config.js`; `src/entries/arcade.main.jsx` | PARTIAL | Vite input includes `arcade.html`; entry mounts `HashRouter` and `ArcadeRoutes`. Runtime loaded. |
| `/arcade.html#/` | `src/router/ArcadeRoutes.jsx:27` | COMPLETE | Redirects to `#/dashboard`; runtime hash became `#/dashboard`. |

## Live Hash Routes

| Route | Source file | Application | Target | Status | Runtime result | Canonical / legacy | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/arcade.html#/dashboard` | `src/router/ArcadeRoutes.jsx:29` | Arcade | `ArcadeDashboard` | PARTIAL | Loaded H1 `PLAY WHAT'S POSSIBLE...` | Canonical Learning Arcade entry | Real shell and preview-heavy home; backend Arcade API not consumed. |
| `/arcade.html#/classical-arcade` | `src/router/ArcadeRoutes.jsx:38` | Arcade | `ClassicalArcadeRoom` | PARTIAL | Loaded H1 `CLASSICAL ARCADE ROOM` | Canonical Classic entry | Preview controls; no confirmed playable classic game. |
| `/arcade.html#/games` | `src/router/ArcadeRoutes.jsx:56` | Arcade | `ArcadeLibrary` | PARTIAL | Loaded H1 `Workforce Arcade` | Legacy/current mixed | Claims XP/on-chain badges; Play button is `alert()` only. |
| `/arcade.html#/leaderboard` | `src/router/ArcadeRoutes.jsx:65` | Arcade | `Leaderboard` | PARTIAL | Loaded H1 `Leaderboard - CDL Driver Trainer` | Legacy/current mixed | `localStorage` scoreboard; not server-authoritative. Back link points to `to="/arcade"` which falls to dashboard. |
| `/arcade.html#/rewards` | `src/router/ArcadeRoutes.jsx:74` | Arcade | `Rewards` | PARTIAL | Loaded H1 `Rewards` | Legacy/current mixed | Wallet UI; authority unresolved. |
| `/arcade.html#/tournaments` | `src/router/ArcadeRoutes.jsx:83`; `src/pages/arcade/Tournaments.jsx` | Arcade | `Tournaments` | PLACEHOLDER | Loaded H1 `Tournaments` | Current placeholder | Source explicitly says `(Placeholder)`. |
| `/arcade.html#/tournaments/weekly` | `src/router/ArcadeRoutes.jsx:83` | Arcade | `Tournaments` | PLACEHOLDER | Loaded H1 `Tournaments`; no weekly detail | Broken/partial nested route | `Tournament.jsx` exists but is not routed. |
| `/arcade.html#/history` | `src/router/ArcadeRoutes.jsx:47` | Arcade | `History` | PARTIAL | Loaded H1 `Arcade Impact History` | Current | Reads browser credit ledger; export works only for local ledger rows. |
| `/arcade.html#/help` | `src/router/ArcadeRoutes.jsx:101` | Arcade | `Help` | PARTIAL | Loaded H1 `Help` | Current | Help page loads; not evaluated as support system. |
| `/arcade.html#/notifications` | `src/router/ArcadeRoutes.jsx:92` | Arcade | `ArcadeNotifications` | PARTIAL | Loaded H1 `Notifications` | Current | Notification button failed touch target tests. |
| `/arcade.html#/metaverse/growth-observatory` | `src/router/ArcadeRoutes.jsx:110` | Arcade | `GrowthObservationTower` | UNKNOWN / REQUIRES RUNTIME VERIFICATION | H1 loaded | Cross-domain/legacy | Metaverse page mounted inside Arcade shell; functional depth not audited. |
| `/arcade.html#/metaverse/bfe-test` | `src/router/ArcadeRoutes.jsx:119` | Arcade | `BFETestPage` | UNKNOWN / REQUIRES RUNTIME VERIFICATION | H1 loaded | Dev/legacy | BFE page mounted inside Arcade shell; not an Arcade product route. |

## Broken Or Legacy Deep Links

| Route / reference | Source | Status | Runtime result | Notes |
| --- | --- | --- | --- | --- |
| `/arcade.html#/arcade` | Dev index / historical pattern | LEGACY | Fell to `#/dashboard` | Wildcard redirects; no canonical nested `/arcade` route. |
| `/arcade.html#/arcade/games` | `src/pages/Arcade.jsx` dev index | BROKEN | Fell to `#/dashboard` | Historical route reference no longer resolves. |
| `/arcade.html#/games/leaderboard` | `src/pages/Arcade.jsx` dev index | BROKEN | Fell to `#/dashboard` | No nested games leaderboard route. |
| `/arcade/asl/greeting-match` style routes | `src/components/curriculum/lesson/ArcadeMissionCard.jsx:3` | BROKEN | Not linked intentionally | Source comment says lesson `games[]` routes do not resolve and would fall to dashboard. |
| `/arcade.html#/tournaments/weekly` detail | `src/pages/arcade/Tournament.jsx` | DUPLICATE / BROKEN | Parent placeholder rendered | `Tournament.jsx` is unused by current route config. |
| `/help` from Classical "Report an Issue" | Runtime link from `ClassicalArcadeRoom` | BROKEN | Points outside Arcade hash host | Browser saw `http://127.0.0.1:5173/help`, not `/arcade.html#/help`. |

## Navigation Findings

- Direct hash navigation and refresh worked for the live routes above.
- Unknown Arcade hashes silently redirect to `#/dashboard` through `src/router/ArcadeRoutes.jsx:128`, which hides broken deep links.
- The current route config contains no fullscreen game route, no individual game route, no results/reflection route, no assignment route, no tournament detail route, no profile route, and no creator route.
