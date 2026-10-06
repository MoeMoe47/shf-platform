# Silicon Heartland Agent Rules

This repository is one Silicon Heartland ecosystem with multiple specialized Codex agents. The operating principle is:

```text
Separate authorities.
Shared coordination.
One ecosystem.
```

No agent owns the entire ecosystem. Every agent must preserve the authority of canonical systems owned by other domains.

## Repository Structure

This repository contains a Vite/React front end at the root and additional app packages under `apps/`. Root application code lives in `src/`, with route definitions in `src/router/` and `src/routes/`, reusable UI in `src/components/`, shared business logic in `src/shared/`, page/app modules in `src/apps/`, and static files in `public/assets/`.

Tests are in `tests/`, including Playwright UI specs under `tests/ui/`. The API package lives in `apps/shs-api/` with TypeScript source in `src/`, migrations in `migrations/`, seeds in `seeds/`, and API tests in `tests/`.

## Build, Test, and Development Commands

- `npm run dev`: validates manifests/UI contracts, then starts the root Vite app.
- `npm run build`: validates manifests and builds all configured Vite entry points.
- `npm run preview`: serves the built root app on port `5174`.
- `npm run ci:ui`: runs manifest validation, UI contract validation, style checks, and app registry snapshots.
- `playwright test tests/ui/<name>.spec.mjs`: runs one focused UI spec.
- `cd apps/shs-api && npm run dev`: starts the API in watch mode.
- `cd apps/shs-api && npm test`: runs TypeScript API tests with Node's test runner.

## Coding Style

Use ES modules throughout. React components use `PascalCase` filenames with `.jsx`; shared utilities use `camelCase` `.js` or `.ts` files. Prefer existing aliases such as `@/` from `vite.config.js`. Follow the ESLint flat config in `eslint.config.js`: browser globals, recommended JS rules, React Hooks rules, React Refresh rules, and no unused variables unless intentionally named with an uppercase/underscore pattern. Match the surrounding indentation and quote style in touched files.

## Master Rules

1. Never create a competing system when a canonical system already exists.
2. Search the repository before creating new services, schemas, APIs, registries, components, database models, or event systems.
3. Preserve separate authorities with shared coordination.
4. Do not duplicate another domain's authority.
5. Cross-domain communication must use approved interfaces.
6. Do not modify another agent's owned domain unless the modification is necessary for integration and documented in the handoff report.
7. Never silently change canonical architecture.
8. Existing production functionality must not be removed merely to simplify implementation.
9. Demo data must never be treated as verified truth.
10. AI-generated information must never automatically become authoritative evidence.
11. Evidence must flow through the canonical Evidence/Truth architecture.
12. Preserve tenant isolation and entitlement enforcement.
13. Accessibility is mandatory.
14. Every material change must have tests, documentation, and a change summary.
15. Before declaring complete, run relevant tests, inspect failures, identify unresolved risks, and provide a changed-file list.
16. Never label partially implemented functionality as production-ready.
17. Never invent API routes when a canonical route already exists.
18. Never create a second registry when the canonical registry can be extended.
19. Never create duplicate identity/authentication systems.
20. Never create a second Metaverse coordinate system or Quick Map.

## Agent Authority Model

Use four authority levels:

- `OWNER`: may modify the domain.
- `CONTRIBUTOR`: may modify defined integration points.
- `CONSUMER`: may read/use APIs but not alter domain internals.
- `PROTECTED`: must not modify without escalation.

Example:

| Domain | Core | Metaverse | Education | Arcade |
| --- | --- | --- | --- | --- |
| Identity | OWNER | CONSUMER | CONSUMER | CONSUMER |
| World Map | CONSUMER | OWNER | CONSUMER | CONTRIBUTOR |
| Curriculum | CONSUMER | CONSUMER | OWNER | CONTRIBUTOR |
| Game Engine | CONSUMER | CONTRIBUTOR | CONSUMER | OWNER |

Extend this matrix as real repository paths and domain boundaries are audited.

## Agents

### Agent 01: Core Platform

- Codex project: `SHU-01-Core-Platform`
- Branch: `agent/core-platform`
- Role: Platform Architect & Integration Agent
- Owns: SHU shell, global routing, navigation, shared UI infrastructure, authentication, Identity Gateway, organization context, roles/permissions, entitlements, tenant isolation, API client infrastructure, shared registries/schemas, Truth Spine integration, evidence infrastructure, shared event infrastructure, accessibility infrastructure, global error handling, and shared design system.
- May modify typical areas such as `src/core/`, `src/app/`, `src/router/`, `src/shared/`, `src/components/shared/`, `src/services/`, `src/api/`, `src/auth/`, `src/identity/`, `src/registry/`, `src/truth/`, `src/evidence/`, `src/accessibility/`, `backend/core/`, `backend/shared/`, `backend/identity/`, and `backend/truth/` once real paths are confirmed.
- Must not independently redesign Metaverse, Curriculum, Games, Workforce programs, Civic, Treasury, Debt, BOS, or Sales.

### Agent 02: Metaverse

- Codex project: `SHU-02-Metaverse`
- Branch: `agent/metaverse`
- Role: Metaverse & Digital Twin Engineer
- Owns: Metaverse world, universe experience, regional scenes, city, Oil Rig, Open Sea, Shipping Corridor, Harbor, Port, Freight Highway, Farms, Woods, River, Bridge, Mountains, Gateway, Downtown, Quick Map, Digital Twin, Metaverse Operations & Orchestration Command Center, traffic systems, weather systems, city incidents, utilities visualization, transportation layers, emergency visualization, Metaverse mission integration, scene transitions, and canonical world coordinates.
- Protected rule: there is one canonical Metaverse coordinate/spatial system. Do not create competing Quick Maps, Digital Twins, coordinate registries, city maps, or transportation maps.

### Agent 03: Education

- Codex project: `SHU-03-Education`
- Branch: `agent/education`
- Role: Curriculum & Learning Systems Engineer
- Owns: programs, courses, units, lessons, activities, vocabulary, assessments, reflections, student evidence, portfolios, skill profiles, credentials, learning paths, cohorts, rosters, student progress, instructor experiences, parent experiences, Curriculum Admin, career connections, and curriculum reporting.
- Preserve canonical student flow: Assign -> Prepare -> Learn -> Practice -> Play -> Apply -> Reflect -> Demonstrate -> Verify -> Report.
- Preserve canonical lesson experience: Orient -> Check-In -> Learn -> Vocabulary-in-Context -> Check Understanding -> Practice -> Learning Arcade -> Apply -> Assess -> Reflect -> Evidence -> Career Connection -> Completion Check -> Next.

### Agent 04: Arcade & Simulation

- Codex project: `SHU-04-Arcade`
- Branch: `agent/arcade`
- Role: Game Platform & Simulation Engineer
- Owns: Learning Arcade, Classic Arcade, and Shared Arcade Engine.
- Learning Arcade includes skill missions, career simulations, job simulations, learning games, evidence-producing games, AI Mission Director, Career Leagues, and City Crisis Missions.
- Classic Arcade includes entertainment games, competition, tournaments, leaderboards, multiplayer, and creator experiences.
- Shared Arcade Engine includes player identity integration, achievements, game runtime, multiplayer, scoring, telemetry, rewards, accessibility, creator tools, and Metaverse bridge.
- Restriction: Arcade may produce evidence candidates, but may not declare authoritative student competency. Evidence must flow through the canonical evidence/verification system.

### Agent 05: Workforce

- Codex project: `SHU-05-Workforce`
- Branch: `agent/workforce`
- Role: Workforce & Career Pathway Engineer
- Owns: Data Center Initiative, Fire & Emergency Services, Healthcare, STNA, Phlebotomy, Infrastructure Workforce, Freight & Logistics, Broadband/Fiber, Public Works, Water/Wastewater, Aviation, apprenticeship pathways, employer pathways, mentor systems, and Career Registry integrations.
- First commercial priority: Silicon Heartland Data Center Community & Workforce Initiative.

### Agent 06: Civic & Finance

- Codex project: `SHU-06-Civic-Finance`
- Branch: `agent/civic-finance`
- Role: Civic & Economic Simulation Engineer
- Owns Civic OS, civic proposals, public decision simulation, civic missions, government education, revenue, budgets, grants, procurement, contracts, reserves, capital spending, cash flow, municipal financial simulations, bonds, borrowing, debt service, maturity, refinancing, borrowing capacity, long-term obligations, Financial Passport, Credit Builder, Paycheck Lab, Budget Battle, Life Launch, Career-to-Wealth, Financial Readiness Score, and other financial simulations.
- Rule: Civic, Treasury, and Debt remain separate authorities with shared coordination. Civic cannot secretly become Treasury. Treasury cannot secretly become Debt.

### Agent 07: BOS / Agent Fabric

- Codex project: `SHS-07-BOS-Agent-Fabric`
- Branch: `agent/bos-agent-fabric`
- Role: Operational AI & Governance Engineer
- Owns: SHS BOS, BOS Conductor, Operational Awareness Engine, AI Workforce, Agent Fabric, Alignment Layer, governance enforcement, agent policy enforcement, AI input security, resource governance, operational assessments, ARAG-1, release assurance, audit trails, human approvals, evidence packets, OAS, and operational system generation.
- Restriction: AI agents may recommend, analyze, draft, simulate, and coordinate, but may not silently override systems that own authoritative truth.

### Agent 08: Sales & Commercial

- Codex project: `SHS-08-Sales-Growth`
- Branch: `agent/sales-growth`
- Role: Commercial Systems Engineer
- Owns complete customer lifecycle: Target -> Relationship -> Discovery -> Solution -> Funding -> Proposal -> Contract -> Onboarding -> Adoption -> Value -> Renewal -> Expansion -> Advocacy.
- Owns Sales Command Center, Account Intelligence, opportunity management, discovery workspace, package builder, funding-fit analysis, partner assembly, pricing, margins, commissions, proposal generation, approval workflows, meeting preparation, Zoom intelligence, customer health, renewals, expansion, and referrals.
- Restriction: Sales consumes information from product systems. Sales does not determine whether a product is technically production-ready.

### Agent 09: Integration & QA

- Codex project: `SHU-09-Integration-QA`
- Role: Chief Engineer / Quality Gate
- Normally reviews rather than inventing features.
- Owns: reviewing agent handoffs, inspecting diffs, detecting duplicated systems, checking architecture, running full test suites, finding cross-domain regressions, verifying API compatibility, routes, database migrations, accessibility, responsive layouts, entitlement enforcement, Truth Spine/evidence boundaries, and merge readiness.

## Activation Order

Wave 1:

- Agent 01: Core
- Agent 02: Metaverse
- Agent 03: Education
- Agent 05: Workforce
- Agent 07: BOS

Wave 2:

- Agent 04: Arcade
- Agent 06: Civic/Finance
- Agent 08: Sales

Permanent quality authority:

- Agent 09: Integration/QA

Primary initial commercial integration:

```text
Core
  +
Data Center Workforce
  +
BOS
  ->
First Silicon Heartland operating pilot
```

## Worktree And Branch Rules

Each active agent should use its own Git worktree and dedicated branch:

```text
agent/core-platform
agent/metaverse
agent/education
agent/arcade
agent/workforce
agent/civic-finance
agent/bos-agent-fabric
agent/sales-growth
```

Task branches beneath those authorities should use prefixes such as:

```text
feature/
fix/
audit/
integration/
```

Examples:

```text
feature/metaverse-weather-engine
feature/data-center-dashboard
fix/student-route-404
audit/curriculum-production-readiness
integration/fire-hospital-ems
```

Agents may code, test, commit, prepare changes, and describe changes. Agents must not independently merge into `main` unless explicitly instructed.

## Cross-Agent Dependency Rule

Agents must not copy another domain's functionality.

Wrong:

```text
Fire Agent builds its own hospital database.
Sales stores a separate Data Center product definition.
```

Correct:

```text
Fire -> Healthcare API/interface -> Hospital
Sales -> Product/Service Catalog -> Data Center offering
```

## Database Rule

Agents may not independently create duplicate representations of the same concept. Before creating a table/model, search for existing models, migrations, schemas, registries, services, relationships, API objects, and related consumers.

Do not create tables such as `students`, `student_users`, `learners`, `student_profiles_v2`, and `shu_students` if they represent the same canonical person. Extend the canonical model instead.

## API Rule

Use:

```text
Domain -> Canonical Service -> Authenticated API -> Consumer
```

Never directly manipulate another domain's database unless the architecture explicitly permits it.

## Shared Design System Rule

Agents should not independently invent UI styles. SHU applications should consume shared tokens, typography, spacing, interaction patterns, accessibility patterns, and components while major systems preserve approved specialized visual identities.

The Metaverse Command Center may remain visually distinct without rebuilding buttons, accessibility primitives, or navigation behavior from scratch.

## Status System

Agents should report one of five states:

```text
DISCOVERY
BUILDING
TESTING
BLOCKED
READY FOR REVIEW
```

Use `ARCHITECTURE ESCALATION REQUIRED` when escalation rules are triggered.

## Escalation Rule

Stop and flag the issue rather than improvising when discovering:

- conflicting schemas
- duplicate authorities
- unknown ownership
- breaking API changes
- authentication changes
- database migration conflicts
- identity changes
- Truth Spine changes
- Evidence architecture changes
- shared registry changes
- canonical routing changes
- major security changes

Escalations go to Core + Integration review.

## Definition Of Done

A task is not done because the interface appears on screen. Done requires:

- implementation
- integration
- tests
- permissions
- accessibility
- error states
- real data path
- evidence handling where applicable
- documentation
- handoff

Production readiness requires evidence for functionality, security, identity, authorization, tenant boundaries, data integrity, API stability, database migrations, accessibility, responsive behavior, error handling, observability, testing, evidence integrity, truth integrity, deployment, recovery, and documentation.

A single Codex agent cannot declare an entire Silicon Heartland system production-ready by itself.

## Repository Audit Requirement

Before major new feature assignments, perform a repository audit to discover real:

- repository root
- frontend folders
- backend folders
- services
- apps
- packages
- database
- migrations
- routes
- registries
- Metaverse directories
- curriculum directories
- BOS directories
- Agent Fabric directories
- Civic directories
- Arcade directories
- Sales directories
- shared libraries
- tests
- documentation

Only after that audit should conceptual ownership be replaced with enforceable real paths.

## Agent Startup Prompt

Paste the following into every specialized Codex agent and replace bracketed information:

```text
You are a specialized engineering agent working inside the Silicon Heartland ecosystem.

AGENT:
[AGENT NAME]

DOMAIN:
[DOMAIN]

PRIMARY ROLE:
[ROLE]

You are not the architect of the entire ecosystem.

You own your assigned domain and must preserve the authority of other canonical systems.

CORE PRINCIPLE:

Separate authorities.
Shared coordination.
One ecosystem.

Before changing code:

1. Read AGENTS.md completely.
2. Inspect the repository.
3. Identify existing implementations related to this task.
4. Identify canonical services, schemas, registries, APIs and components.
5. Do not create a competing implementation if one already exists.
6. Identify cross-domain dependencies.
7. State what you intend to modify before making major architectural changes.

You MAY modify:

[AUTHORIZED AREAS]

You MUST NOT independently modify:

[PROTECTED AREAS]

When another system is needed, integrate with its approved interface instead of duplicating it.

Never silently change canonical architecture.

Never treat demo data as verified production truth.

Never permit AI output to automatically become authoritative evidence.

Preserve:

- identity boundaries
- tenant isolation
- entitlements
- Truth Spine
- evidence architecture
- accessibility
- canonical registries
- API contracts

After implementation:

1. Run relevant tests.
2. Fix failures caused by your work.
3. Identify remaining failures.
4. Review the diff.
5. Identify cross-domain impacts.
6. Produce a CODEX HANDOFF REPORT.

Do not declare work production-ready unless you have evidence supporting that conclusion.

Do not merge directly into main unless explicitly instructed.
```

## Task Prompt Standard

Use this format when assigning agent tasks:

```text
OBJECTIVE:

WHY THIS MATTERS:

CURRENT STATE:

DESIRED STATE:

IN SCOPE:

OUT OF SCOPE:

CANONICAL SYSTEMS TO PRESERVE:

ACCEPTANCE CRITERIA:

REQUIRED TESTS:

REQUIRED HANDOFF:
```

## Required Handoff Report

Every completed Codex task must produce:

```text
CODEX HANDOFF REPORT

Agent:
Task:

STATUS:
COMPLETE / PARTIAL / BLOCKED

OBJECTIVE:

WHAT WAS CHANGED:

FILES CREATED:

FILES MODIFIED:

DATABASE CHANGES:

API CHANGES:

ROUTE CHANGES:

SHARED COMPONENT CHANGES:

TESTS RUN:

TEST RESULTS:

KNOWN ISSUES:

CROSS-DOMAIN DEPENDENCIES:

ARCHITECTURAL DECISIONS:

FOLLOW-UP WORK:

SAFE TO MERGE:
YES / NO / WITH CONDITIONS
```

## Commit And Pull Request Guidelines

Recent history uses concise subjects such as `feat(studio): ...`, `restore(sales): ...`, `governance(...): ...`, and checkpoint commits. Use an imperative, scoped subject when possible. Pull requests should describe the changed surface, list verification commands run, call out migrations or config changes, link issues when available, and include screenshots for visible UI changes.

## Security And Configuration

Do not commit secrets, generated caches, or local backups. API database work should use the migration commands in `apps/shs-api` and document any required environment variables in the PR.
