# Arcade Runtime Validation

Phase: 0
Status: UNKNOWN / REQUIRES RUNTIME VERIFICATION for untested branches; PARTIAL for routes smoke-tested below.

## Commands Used

| Command | Result | Notes |
| --- | --- | --- |
| `npm run dev` | PASS | Started the root Vite app at `http://127.0.0.1:5173/` after manifest and UI-contract prechecks. |
| `node --input-type=module ... Playwright smoke` | PASS WITH FINDINGS | Browser automation required macOS permission escalation. Routes below were smoke-tested in Chromium. |
| `npm run build` | PASS WITH WARNINGS | Build completed; warnings included duplicate dynamic/static import for `CareerConsultantPanel.jsx` and large chunks/assets. |
| `npx playwright test tests/ui/arcade-learning-arcade.spec.mjs tests/ui/classical-arcade-room-visual.spec.mjs --reporter=line` | FAILING | 158 passed, 4 failed. Failures are documented below. |

## Route Smoke Results

| Route Tested | Observed Result | Status |
| --- | --- | --- |
| `#/` | Redirected to `#/dashboard`; dashboard rendered. | PARTIAL |
| `#/dashboard` | Dashboard rendered with hero heading. | PARTIAL |
| `#/classical-arcade` | Classical Arcade Room rendered. | PARTIAL |
| `#/games` | Workforce Arcade library rendered. | PARTIAL |
| `#/leaderboard` | CDL leaderboard rendered. | PARTIAL |
| `#/rewards` | Rewards page rendered. | PARTIAL |
| `#/tournaments` | Placeholder tournaments page rendered. | PLACEHOLDER |
| `#/tournaments/weekly` | Same placeholder tournaments page rendered through wildcard route. | PLACEHOLDER |
| `#/history` | History route rendered. | PARTIAL |
| `#/help` | Help route rendered. | PARTIAL |
| `#/notifications` | Notifications route rendered. | PARTIAL |
| `#/metaverse/growth-observatory` | Growth Observatory page rendered. | PARTIAL |
| `#/metaverse/bfe-test` | BFE test page rendered. | PARTIAL |
| `#/arcade` | Fell back to dashboard through wildcard redirect. | BROKEN |
| `#/arcade/games` | Fell back to dashboard through wildcard redirect. | BROKEN |
| `#/games/leaderboard` | Fell back to dashboard through wildcard redirect. | BROKEN |

## Feature Runtime Findings

| Capability | Runtime Evidence | Status |
| --- | --- | --- |
| Learning Arcade launch | Dashboard and library load. No individual game route was confirmed playable. | PARTIAL |
| Classic Arcade entry | Classical Arcade Room loads. Catalog/demo buttons exist, but no canonical playable classic game was confirmed. | PLACEHOLDER |
| Representative games | No game/experience was confirmed as an actual complete playable runtime during Phase 0. | UNKNOWN / REQUIRES RUNTIME VERIFICATION |
| Direct URL navigation | Canonical hash routes load; legacy `/arcade` patterns fall back to dashboard. | PARTIAL / BROKEN |
| Refresh/deep link | Hash routes survived direct navigation during smoke testing. Full server rewrite behavior outside hash mode was not exhaustively tested. | PARTIAL |
| Game completion | Not confirmed for any game. | MISSING |
| Score/result handling | Frontend leaderboard/localStorage behavior exists; backend authoritative Arcade APIs exist but were not exercised end-to-end from the UI. | PARTIAL |
| Leaderboard | `#/leaderboard` renders CDL localStorage leaderboard. | PARTIAL |
| Tournament | `#/tournaments` renders placeholder content only. | PLACEHOLDER |
| Lesson to Arcade link | `ArcadeMissionCard.jsx` intentionally routes lesson-linked cards to `/games` because older per-game lesson routes are unresolved. | PARTIAL |
| Return navigation | Basic route navigation works for canonical hash routes. Metaverse return behavior was not end-to-end validated. | UNKNOWN / REQUIRES RUNTIME VERIFICATION |
| Runtime API dependencies | Vite repeatedly logged proxy refusals for `/notifications`, `/notifications/unread-count`, `/notifications/organizations`, `/companion/context/me`, `/calendar/events/me`, and `/bfe/summary` against local backend ports such as `127.0.0.1:8091` and `127.0.0.1:8090`. | BROKEN |

## Test Failures Observed

| Test | Failure | Status |
| --- | --- | --- |
| `tests/ui/classical-arcade-room-visual.spec.mjs:155` | Page height expected `< 1750`, received `2044`. | BROKEN |
| `tests/ui/arcade-learning-arcade.spec.mjs:983` | Notification control touch target was `36px`, expected at least `44px`, at `390x844`. | BROKEN |
| `tests/ui/arcade-learning-arcade.spec.mjs:983` | Notification control touch target was `36px`, expected at least `44px`, at `768x1024`. | BROKEN |
| `tests/ui/arcade-learning-arcade.spec.mjs:983` | Notification control touch target was `36px`, expected at least `44px`, at `1024x768`. | BROKEN |

## Runtime Caveats

- Phase 0 intentionally did not normalize routes, repair links, implement games, or alter production behavior.
- Backend Arcade APIs were audited from source and migrations, but not fully exercised through an authenticated end-to-end browser flow.
- Several non-Arcade ecosystem calls failed during local Arcade page runtime because dependent local APIs were not running. This affects runtime confidence for notifications, companion context, calendar, and BFE-adjacent integrations.
- No screenshots were added because the observed defects are captured by route smoke output and existing Playwright assertions.
- Playwright needed escalated permission on macOS for browser launch in this environment; the initial sandboxed attempt failed before page interaction.
