# Classic Arcade System Audit

## Executive Status

Classic Arcade: PLACEHOLDER / PARTIAL.

The current Classic Arcade surface is the Classical Arcade Room at `/arcade.html#/classical-arcade`. It is visually built, tested, and intentionally honest about preview-only capabilities, but no classic game runtime was confirmed playable.

## Entry / Routes / Pages

| Surface | Route | Source | Status |
| --- | --- | --- | --- |
| Classical Arcade Room | `/arcade.html#/classical-arcade` | `src/pages/arcade/ClassicalArcadeRoom.jsx` | PARTIAL |
| Game catalog | `/arcade.html#/games` | `src/pages/arcade/ArcadeLibrary.jsx` | PARTIAL / LEGACY |
| Player profile | Header mock only | `src/components/arcade/ArcadeHeader.jsx` | PLACEHOLDER |
| Leaderboards | `/arcade.html#/leaderboard` | `src/pages/arcade/Leaderboard.jsx` | PARTIAL / BROKEN AUTHORITY |
| Tournaments | `/arcade.html#/tournaments` | `src/pages/arcade/Tournaments.jsx` | PLACEHOLDER |
| Creator/community/showcase | Dialog previews | `src/components/arcade/ArcadeTopNav.jsx`, `ClassicalArcadeRoom.jsx` | PLACEHOLDER |
| Spectator pages | None | N/A | MISSING |
| Developer/testing | Metaverse/BFE routes in Arcade shell | `src/router/ArcadeRoutes.jsx` | LEGACY / UNKNOWN |

## Game Catalog

| Category requested | Discovered implementation/reference | Status |
| --- | --- | --- |
| Pac-Man-style | None found | MISSING |
| Tetris-style | `mono-blocks` metadata in `src/data/arcade.js` section only | PLACEHOLDER |
| Snake | None found | MISSING |
| Breakout | None found | MISSING |
| Racing | `grid-runner`, `rail-drift` metadata; no route/runtime | PLACEHOLDER |
| Platformers | None found | MISSING |
| Puzzle games | `neon-shift`, `mono-blocks`, `Vocabulary Match` metadata | PLACEHOLDER |
| Shooters | Orbit Defender preview only | PLACEHOLDER |
| Retro/classic games | Orbit Defender, Pixel Foundry, Circuit Runner, Eco Stack demo fixtures | PLACEHOLDER |

No game was confirmed playable. Classical room "Play" buttons open informational dialogs or navigate to the non-playable catalog. Workforce catalog Play buttons call `alert()`.

## Runtime

| Capability | Current state | Status |
| --- | --- | --- |
| Common runtime | None found | MISSING |
| Canvas/WebGL game runtime | None in Arcade games | MISSING |
| DOM game runtime | None confirmed | MISSING |
| Physics/audio/controller/touch | No shared systems found for Arcade games | MISSING |
| Pause/resume/fullscreen | No game runtime | MISSING |
| Save/session state | Browser `localStorage` only in ledger/leaderboard | PARTIAL / BROKEN AUTHORITY |

## Player Identity / Profile

The shell displays a static student profile label and local sidebar XP from `useArcadeHistory`. No shared player profile, avatar, account game history, achievement authority, or stats backend is wired to the Classic Arcade UI. Status: PARTIAL.

## Scores

`src/pages/arcade/Leaderboard.jsx` reads and writes score rows directly to `localStorage` (`safeRead`, `safeWrite`) and accepts free-text names. Status: BROKEN for trusted scores; PARTIAL for toy local display.

## Leaderboards

| Type | Status | Evidence |
| --- | --- | --- |
| Global | MISSING | No backend leaderboard. |
| School/classroom/cohort/friends | MISSING | No segmentation. |
| Game-specific | PARTIAL | Query param `game`; browser storage only. |
| Seasonal | MISSING | No seasonal leaderboard authority. |

## Tournament System

`src/pages/arcade/Tournaments.jsx` explicitly renders "(Placeholder)" and links to `/tournaments/weekly`. `src/pages/arcade/Tournament.jsx` exists but is not wired by `ArcadeRoutes.jsx`; `/tournaments/weekly` still renders the parent placeholder. Brackets, registration, seeding, match tracking, persistence, spectator support, and backend authority are missing.

## Multiplayer / Matchmaking / Spectator

No Classic Arcade networking stack, rooms, WebSocket gameplay, matchmaking, PvP/co-op, rejoin, or spectator mode was found. Status: MISSING.

## Seasons

Upcoming challenges and challenge labels are preview content. No season entity, reset, progression, or seasonal rewards authority found. Status: MISSING.

## Student Game Studio / Community Arcade

Preview buttons exist for Create, My Studio, Showcase, Build, Publish, and How Was This Built. Publishing is intentionally fail-closed. Studio/agent infrastructure exists elsewhere, but no Classic Arcade game studio, asset manager, moderation, publishing queue, ratings, or versioning is implemented in Arcade. Status: PLACEHOLDER.

## How Was This Built

Classical room contains preview buttons for game logic, art/assets, AI behavior, code exploration, and similar projects. These open dialogs and do not expose source walkthroughs or curriculum/career mapping. Status: PLACEHOLDER.

## AI Rivals / Coaches

No AI opponent, bot, coach, commentator, or Agent Fabric-connected rival in Classic Arcade. Status: MISSING.

## Rewards / Economy

XP, badge, credit, token, and on-chain language appears in legacy Arcade data/rules. `src/shared/arcade/arcadeRules.js` defines local wallet/credit rules; `src/utils/creditLedger.js` stores entries in browser `localStorage`. Treasury is not the authority for these values. Status: PARTIAL with governance risk.

## Metaverse Connection

Metaverse registry includes Arcade Hub, Simulation Hall, and Skills Challenge Center app-route destinations (`apps/shs-api/src/domain/metaverse/registry/city-registry.ts:326`). No in-world kiosk launch/return flow for a playable game was confirmed. Status: PARTIAL.

## Replayability

Achievements, daily/weekly objectives, procedural content, social challenges, and seasons are preview/static. No runtime replayability system found. Status: MISSING.

## Accessibility / Performance

Positive: many UI tests validate focus, keyboard, responsive containment, and honest dialogs. Broken: focused UI tests failed notification button touch target at 36px width below desktop and Classical room page height exceeded visual contract. Build produced large bundle warnings (`arcade` CSS about 60 kB, `arcade` JS about 95.5 kB; larger ecosystem bundles also warned). Status: PARTIAL / BROKEN.
