# Arcade Test Inventory

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm run dev` | PASS | Vite served `http://127.0.0.1:5173/`. |
| Playwright route smoke via Node | PASS with findings | Required escalation because sandbox blocked Chromium. |
| `npm run build` | PASS with warnings | Large bundle warnings and duplicate dynamic/static import warning. |
| `npx playwright test tests/ui/arcade-learning-arcade.spec.mjs tests/ui/classical-arcade-room-visual.spec.mjs --reporter=line` | FAIL | 158 passed, 4 failed. |

## Existing Tests

| Test path | Type | Coverage | Pass/fail observed | Status |
| --- | --- | --- | --- | --- |
| `tests/ui/arcade-learning-arcade.spec.mjs` | Playwright UI | Routes, shell, placeholders, theme, accessibility, responsive | 3 failures in touch target section | PARTIAL / BROKEN |
| `tests/ui/classical-arcade-room-visual.spec.mjs` | Playwright UI | Classical room visual/layout/assets/capability honesty | 1 failure in page-height contract | PARTIAL / BROKEN |
| `apps/shs-api/tests/arcade.security.test.ts` | API integration | Activity/attempt/result auth, score validation, scoping | Not run in Phase 0 | UNKNOWN / REQUIRES RUNTIME VERIFICATION |
| `tests/metaverseMissionIntegration.test.mjs` | Static/source test | Metaverse missions and Arcade relations | Not run | PARTIAL |
| `tests/metaverseSimulation.test.mjs` and API metaverse tests | Node/API | Simulation primitives outside Arcade | Not run | PARTIAL |
| `tests/ax*Accessibility*.test.mjs` | Accessibility systems | Shared AX layers | Not Arcade-specific | PARTIAL |

## Missing Critical Coverage

- Real game launch and completion.
- Frontend Arcade attempt/result API integration.
- Server-authoritative leaderboard.
- Tournament registration/bracket/results.
- Assignment-to-specific-game launch.
- Evidence replay.
- Treasury-authorized rewards.
- Agent Fabric Arcade integration.
- Metaverse kiosk launch and return.
- Mobile/touch gameplay input.
