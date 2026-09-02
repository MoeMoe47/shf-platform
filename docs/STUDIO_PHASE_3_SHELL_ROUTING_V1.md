# Studio Phase 3: Shell + Student Routing

## Purpose

Phase 3 adds the authenticated student Studio shell and routing over the durable Phase 2 project and handoff APIs. It does not implement a Website editor, Agent Builder, Build Packet, QA, Delivery, Evidence, Portfolio, or ClientOps integration.

## Inherited contracts

Studio remains one product with `WEBSITE` and `AI_AGENT` project types. The Phase 2 API owns organization, learner, destination, origin, lifecycle, assignment, and release lineage. Student creation sends only user-facing project inputs; the server derives institutional values.

## Route architecture

The curriculum entry uses a `HashRouter`. Student routes are mounted as a sibling tree under `/studio` and share `CurriculumLayout`; they are not aliases for administrative BuilderHub surfaces.

| Route | Purpose |
| --- | --- |
| `/studio` | Studio home and creation choices |
| `/studio/new` | Student-idea project start |
| `/studio/projects` | Authorized project list |
| `/studio/projects/:projectId` | Reusable project shell |
| `/studio/assignments` | Canonical assignment handoff entry point |
| `/studio/templates` | Truthful template integration state |

## Experience

The shell uses student language: Website, AI Agent, My Projects, Start Project, Project Plan, and Continue Working. It provides simple guide/bridge mounting points without implementing a second next-action or progress engine. Beginner presentation is the default; raw manifests, provider configuration, registry internals, keys, and terminal controls are absent.

## API client and authority

`src/lib/studio/api.js` is the only Studio frontend API boundary. It uses the existing authenticated `dev-token` bridge and response envelope. Project listing and detail are server-scoped. Student creation calls `POST /studio/projects`; assignment handoff calls `POST /studio/handoffs/assignment`. The client does not submit organization, tenant, destination, origin, or authoritative lifecycle values.

## Assignment handoff

The assignment page consumes the canonical assignment list and offers `Start Project` as a thin adapter. The Phase 2 endpoint preserves assignment and release lineage and is idempotent. Assignment eligibility remains a backend decision; the UI does not invent eligibility.

## Templates

The page is a truthful integration point. If `VITE_SHF_NEXT_ORIGIN` is configured, it links to the existing Website template experience. No SHF-Next localStorage or project state is imported into SHRV1.

## Loading, errors, and empty states

Pages show loading status, student-readable alerts, unauthorized/not-found copy, and empty states. They do not fall back to sample projects or fake progress. Retry is left to the existing page reload/navigation behavior until the Student Experience Layer adds a shared retry affordance.

## Companion and Phase 3.5 seams

The shell is mounted inside the existing global Learning Companion provider. Future guidance can consume route-local project context, assignment context, lifecycle stage, and server-returned status without gaining mutation authority. Phase 3.5 may add guided kickoff, next action, requirement presentation, contextual help, Beginner/Advanced mode, and milestone mounting points without changing these routes or the API client.

## Accessibility and responsive behavior

The existing curriculum skip link, main landmark, focus-on-navigation behavior, keyboard-visible controls, accessibility profile, and reduced-motion infrastructure remain in force. Studio uses semantic headings, labels, fieldsets, alerts, links, and buttons. The grid collapses at small widths and does not require horizontal scrolling for the shell.

## ClientOps exclusion and truth boundary

No student Studio route or component contains a ClientOps action. Student projects remain `STUDENT` by server policy. Studio does not mark projects verified, assignments complete, QA passed, delivery complete, Evidence verified, or institutional progress. No Studio project state is stored in localStorage.

## Verification and limitations

Focused contract tests live in `tests/studio-shell-contract.test.mjs`. Frontend verification is performed with the root Vite build and UI validation. Migration `069_studio_handoff_project.sql` remains Phase 2 owner work; its static/strict schema verification passed previously, but live PostgreSQL replay was not available during Phase 2 and is not changed by this frontend phase.

## Phase 3.5 entry contract

Phase 3.5 may build guidance and presentation adapters on the stable `/studio` route tree and API client. It may consume project type, origin, assignment/release context, lifecycle status, and canonical errors. It must keep next action, progress explanation, Companion guidance, requirements, and milestones derived presentation concerns, never institutional truth or direct mutation authority.
