# Learning Arcade System Audit

## Executive Status

Learning Arcade: PARTIAL.

The repository contains a live Learning Arcade shell/home, a real backend activity/attempt/result foundation, and curriculum/metaverse linkage points. The live frontend does not use the backend Arcade result API for actual game launches, and most Learning Arcade product concepts are preview-only or missing.

## 0A Repository Discovery

| Area | Paths | Status |
| --- | --- | --- |
| Frontend entry | `arcade.html`, `src/entries/arcade.main.jsx`, `src/router/ArcadeRoutes.jsx` | PARTIAL |
| Arcade pages | `src/pages/arcade/*` | PARTIAL |
| Arcade shell/components | `src/layouts/ArcadeLayout.jsx`, `src/layouts/arcade/ArcadeAppShell.jsx`, `src/components/arcade/*` | PARTIAL |
| Game/catalog data | `src/data/arcade.js`, `src/data/arcadeHomeFixtures.js`, `src/pages/arcade/games/index.js`, `src/pages/arcade/games/index.jsx` | DUPLICATE / PARTIAL |
| Backend Arcade service | `apps/shs-api/src/domain/arcade/*`, `apps/shs-api/migrations/052_arcade_activities.sql` | PARTIAL |
| Curriculum linkage | `src/components/curriculum/lesson/ArcadeMissionCard.jsx`, `apps/shs-api/migrations/064_curriculum_resource_arcade_linkage.sql`, `apps/shs-api/src/domain/curriculum-catalog/repo/curriculum-catalog-repo.ts` | PARTIAL |
| Evidence / truth projection | `apps/shs-api/src/domain/arcade/service/arcade-service.ts`, `apps/shs-api/src/domain/verified-evidence/service/verified-evidence-service.ts`, `apps/shs-api/migrations/067_verified_evidence_truth_projection.sql` | PARTIAL |
| Metaverse integration | `apps/shs-api/src/domain/metaverse/registry/city-registry.ts`, `apps/shs-api/src/domain/metaverse/missions/*`, `src/system/metaverse/*` | PARTIAL |
| Accessibility systems | `src/context/Accessibility*`, `src/system/accessibility/*`, `apps/shs-api/src/domain/accessibility-*` | PARTIAL |
| Tests | `tests/ui/arcade-learning-arcade.spec.mjs`, `tests/ui/classical-arcade-room-visual.spec.mjs`, `apps/shs-api/tests/arcade.security.test.ts` | PARTIAL |

## Entry And Navigation

| Item | Path | Status | Evidence |
| --- | --- | --- | --- |
| Canonical Learning Arcade entry | `/arcade.html#/dashboard` | PARTIAL | `src/router/ArcadeRoutes.jsx:29`; runtime loaded. |
| Landing/dashboard | `src/pages/arcade/ArcadeDashboard.jsx` | PARTIAL | Home page renders real shell plus many `Demo preview` fixtures. |
| Student access | Static Arcade shell | PARTIAL | Mock student profile in header; no real Arcade auth flow in frontend. |
| Instructor/admin access | Backend activity manage permission | PARTIAL | `arcade.activity.manage` is enforced by API; no instructor UI found. |
| Parent/reviewer access | N/A | MISSING | No Learning Arcade parent/reviewer route found. |

## Page Inventory

| Page/capability | Source | Status |
| --- | --- | --- |
| Home/dashboard | `src/pages/arcade/ArcadeDashboard.jsx` | PARTIAL |
| Catalog | `src/pages/arcade/ArcadeLibrary.jsx` | PARTIAL |
| Assignments | None in Arcade routes | MISSING |
| Missions | Curriculum card only: `src/components/curriculum/lesson/ArcadeMissionCard.jsx` | PARTIAL |
| Game detail | None | MISSING |
| Gameplay | None confirmed | MISSING |
| Results | Backend API only: `/arcade/results` | PARTIAL |
| Reflection | None in Arcade | MISSING |
| History | `src/pages/arcade/History.jsx` | PARTIAL |
| Rewards | `src/pages/arcade/Rewards.jsx` | PARTIAL |
| Leaderboards | `src/pages/arcade/Leaderboard.jsx` | PARTIAL / BROKEN AUTHORITY |
| Instructor controls | Backend create activity only | PARTIAL |
| Evidence | Outbox to verified evidence only | PARTIAL |
| Skill progress | Backend mastery boolean only | PARTIAL |
| Career connection | Static tags and cross-links | PARTIAL |
| Team play | None in Arcade | MISSING |
| Developer/testing pages | `#/metaverse/bfe-test`, dashboard dev buttons in dev | PARTIAL / LEGACY |

## Game / Experience Inventory

| ID | Name | Route | Source | Runtime | Playable? | Status | Learning / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| debt-hunter | Debt Hunter | data says `/arcade/games/debt-hunter`; no route | `src/data/arcade.js` | Metadata/UI card | No; Play alert only | PLACEHOLDER | Claims XP/on-chain badge; no backend result. |
| career-rush | Career Match Rush | data says `/arcade/games/career-rush`; no route | `src/data/arcade.js` | Metadata/UI card | No | PLACEHOLDER | Static workforce tags. |
| client-sim | Client Service Simulator | data says `/arcade/games/client-sim`; no route | `src/data/arcade.js` | Metadata/UI card | No | PLACEHOLDER | Static SEL/workforce tags. |
| resume-quest | Resume Builder Quest | data says `/arcade/games/resume-quest`; no route | `src/data/arcade.js` | Metadata/UI card | No | PLACEHOLDER | Static workforce tags. |
| classic/fingerspelling | Fingerspelling Speed | external `example.com` | `src/pages/arcade/games/index.js` | Metadata | Not product-playable | LEGACY / PLACEHOLDER | No evidence. |
| classic/vocab-match | Vocabulary Match | none | `src/pages/arcade/games/index.js` | Metadata | No | PLACEHOLDER | No evidence. |
| classic/gesture-memory | Gesture Memory | none | `src/pages/arcade/games/index.js` | Metadata | No | PLACEHOLDER | No evidence. |
| transport/cdl-driver | CDL Driver Trainer | external `example.com` | `src/pages/arcade/games/index.js`; leaderboard default | Metadata | Not product-playable | LEGACY | `localStorage` leaderboard only. |
| eco-city-agent-challenge | Eco City Agent Challenge | none | `src/data/arcadeHomeFixtures.js` | Demo display | No | PLACEHOLDER | Explicit demo only. |
| ai-game-development-i | AI Game Development I | none | `src/data/arcadeHomeFixtures.js` | Demo display | No | PLACEHOLDER | Explicit demo only. |

## Curriculum Integration

| Flow element | Current evidence | Status |
| --- | --- | --- |
| Organization Program | Backend program/assignment domains exist outside Arcade | PARTIAL |
| Student Learning Path | Career/curriculum systems exist; no Arcade-driven learning path | PARTIAL |
| Course / Unit / Lesson | Curriculum app exists; lesson card can display Arcade mission data | PARTIAL |
| Activity / Arcade Assignment | Backend `arcade_activities`; lesson link table | PARTIAL |
| Assessment | Curriculum assessment domain exists; not Arcade result-driven | PARTIAL |
| Evidence | Arcade result outbox to `shs-verified-evidence` | PARTIAL |
| Outcome | `curriculum_learner_outcomes` exists; no direct Arcade frontend flow | PARTIAL |
| Portfolio / Skill Profile | Portfolio consumes canonical results; Arcade not directly writing portfolio | PARTIAL |
| Reporting | Outbox and reporting adapters exist; no Arcade report UI authority | PARTIAL |

`ArcadeMissionCard` intentionally routes lessons to `/arcade.html#/games` because lesson game routes do not resolve (`src/components/curriculum/lesson/ArcadeMissionCard.jsx:3`). This is correct fail-safe behavior but means lesson-to-specific-game launch is missing.

## Assignment System

| Teacher/instructor capability | Status | Evidence |
| --- | --- | --- |
| Assign a game/mission | PARTIAL | Curriculum assignment and completion policy systems exist; no Arcade instructor UI found. |
| Choose students/cohorts | MISSING in Arcade | Assignment systems outside Arcade. |
| Set prerequisites | PARTIAL outside Arcade | Metaverse mission requirements can include ARCADE, but no Arcade UI. |
| Establish due dates | PARTIAL outside Arcade | Assignments domain; no Arcade-specific assignment route. |
| Track attempts | PARTIAL | Backend `arcade_attempts`; no frontend consumption found. |
| Review results | PARTIAL | `/arcade/results` API supports admin org view; no UI found. |
| See evidence | PARTIAL | Outbox to verified evidence; not surfaced in Arcade UI. |
| Provide feedback | MISSING | No Arcade feedback/review UI found. |

## Skill Mission Capability

Backend concepts exist for `Activity`, `Attempt`, `Result`, `masteryRule`, score thresholds, and deterministic mastery. Mission concepts exist in Metaverse assignment projections, not as a complete Learning Arcade Skill Mission product. Status: PARTIAL.

## Results And Evidence

| Finding | Status | Evidence |
| --- | --- | --- |
| Server activity/attempt/result tables exist | PARTIAL | `apps/shs-api/migrations/052_arcade_activities.sql:16` |
| Server derives mastery | PARTIAL | `apps/shs-api/src/domain/arcade/service/arcade-service.ts:159` |
| Score validation exists | PARTIAL | `apps/shs-api/src/domain/arcade/service/arcade-service.ts:150` |
| Outbox event emitted | PARTIAL | `apps/shs-api/src/domain/arcade/service/arcade-service.ts:175` |
| Frontend uses backend for game results | MISSING | No `fetch("/arcade/...")` use found in Arcade UI. |
| Browser/localStorage ledger exists | BROKEN GOVERNANCE RISK | `src/utils/creditLedger.js:5`, `src/pages/arcade/Leaderboard.jsx:19` |
| Truth Spine connection | PARTIAL | Through verified evidence projection, not direct Arcade authority. |

Governance risk: the old UI surfaces "on-chain", XP, leaderboard, and credit-like claims backed by browser state or static numbers.

## Career Center

Career integration is mostly navigational and tag-based. Sidebar and top nav link to `career.html#/learn`, `career.html#/dashboard`, and `career.html#/portfolio`. Static workforce tags appear in `src/data/arcade.js`. No actual career unlock or certification flow from Arcade was found. Status: PARTIAL.

## Metaverse Job Simulator

Metaverse mission and simulation infrastructure exists outside Arcade. The Metaverse city registry includes Learning Arcade destinations and data center hooks (`apps/shs-api/src/domain/metaverse/registry/city-registry.ts:326`). Arcade-specific job simulator gameplay is missing. Status: PARTIAL / MISSING for Arcade.

## Living Data Center Simulation

Reusable work exists: data-center curriculum docs, Career pathway record, Metaverse data-center district hooks, and future facility nodes for power, cooling, security, and AI compute (`city-registry.ts:320`). No Arcade Living Data Center Simulation exists. Status: reusable infrastructure PARTIAL; Arcade product MISSING.

## AI Mission Director

Agent Fabric, input security, agent simulation, and BFE pages exist. No Learning Arcade AI Mission Director that adapts gameplay, logs decisions, and respects evidence authority was found. Status: MISSING, with reusable Agent Fabric infrastructure PARTIAL.

## Team Missions

Team/studio systems and Metaverse communication contexts exist outside Arcade. No Arcade co-op/team mission runtime was found. Status: MISSING.

## Civic Simulations

SHF Civic app and Metaverse civic routes exist separately. CivicSure is separate. No accidental CivicSure coupling to Arcade found in live Arcade routes. Status: PARTIAL integration potential; Arcade civic simulation MISSING.

## Evidence Replay

Attempts/results and Metaverse event APIs provide raw history primitives. No Arcade evidence replay timeline/playback/after-action review exists. Status: MISSING.

## Build-The-Game Learning

Home and Classic room show Creator Studio, Student-Made, How Was This Built, and Build Agent Game previews. Studio/agent package systems exist outside Arcade. No Arcade build workflow exists. Status: PLACEHOLDER in Arcade; reusable Studio infrastructure PARTIAL.

## Accessibility

Strengths: dedicated shell, keyboard dialogs, focus restoration, route tests. Confirmed failures: `tests/ui/arcade-learning-arcade.spec.mjs` failed for notification button width 36px at 390, 768, and 1024 viewports against 44px requirement. Status: PARTIAL / BROKEN.

## Telemetry

Local analytics hooks and credit ledger events exist (`useArcadeLedger`, `track("arcade.result")` in game index). Backend API emits outbox for server results. No robust launch/start/completion/error/crash telemetry across actual games exists. Status: PARTIAL.
