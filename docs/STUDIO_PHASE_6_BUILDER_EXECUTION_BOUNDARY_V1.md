# SHF Studio Phase 6: Builder Execution Boundary

## Purpose

Phase 6 establishes the first durable, project-scoped student work state for Studio Website and AI Agent projects. It records work-in-progress without making a decision about completion, QA, review, delivery, Evidence, Portfolio, reporting, or credentials.

## Audit and ownership decision

The repository audit found no durable Studio builder workspace or student editor domain. SHF-Next builder-like surfaces are static, localStorage, or commercial prototype behavior. SHRV1 generic project submissions are downstream submission/review state and are not used for drafts. The new workspace table is therefore the smallest Studio-owned durable boundary, attached one-to-one to the canonical `projects` row.

## Durable work contract

`studio_builder_workspaces` stores `workspace_id`, canonical `project_id`, organization/tenant scope, server-derived project type, bounded `work_json`, monotonic `revision`, creator, and timestamps. A workspace is created on the first successful save; a GET with no saved draft returns a typed empty projection without writing. Website work currently supports bounded page path/title/content. AI Agent work currently supports bounded name/instructions/tool identifiers. Secrets, providers, models, manifests, registry data, and arbitrary files are excluded.

## API

* `GET /studio/projects/:projectId/workspace`
* `PATCH /studio/projects/:projectId/workspace` with `{ revision, work }`

The API authenticates through existing Studio permissions, derives organization/tenant from the actor, authorizes the project, derives project type from the canonical project row, validates the type-specific payload, and applies optimistic revision checks. Client authority fields are rejected. Student writes are owner-scoped; authorized admin access follows existing Studio permission policy.

## Boundaries

Build Packet remains read-only context. Workspace work is not a requirement result. Saving does not transition the Studio lifecycle and does not create submission, QA, review, delivery, Evidence, Portfolio, completion, Truth, metric, report, credential, or ClientOps state. The `studio.workspace.updated` event is operational only and is not an institutional achievement event.

## Website and AI Agent integration

Both project types use the same route and authorization boundary. The current student UI is a small draft editor: a Home page content draft for Website and name/instructions for AI Agent. Preview, arbitrary code execution, live agent execution, deployment, registry submission, standards approval, and AI-assisted writes are deferred because no inherited safe runtime was found.

## Safety and limitations

Paths must be relative URL paths beginning with `/` and cannot contain traversal or backslashes. Payloads are bounded server-side. The revision field prevents known stale writes. Real-time collaboration, files/object storage, richer version history, and conflict UX are deferred. Browser storage is not used for canonical work. Migration `070_studio_builder_workspace.sql` is additive; live PostgreSQL replay remains unavailable unless a safe disposable database is provided, and Migration 069's inherited replay limitation remains separate.

## Phase 7 entry contract

Phase 7 may build QA as a separate authoritative domain that consumes Build Packet and Builder Work State as inputs. It must preserve project authorization, revision lineage, and the rule that saving work is not QA passage or completion. It may add a safe preview/check boundary without granting the builder or browser downstream institutional authority.

## Phase 6.1 verification appendix

Verification used a fresh PostgreSQL 16.12 cluster at `127.0.0.1:55432` under `/private/tmp`; no developer or production database was used. The repository migration runner applied migrations 001 through 070 successfully. Final status was `pending: []`, `drift: []`, and `unknownApplied: []`. Strict schema integrity reported `checkedMigrations: 70`, `checkedObjects: 2391`, and `failures: []`.

The real service flow used disposable Org A/Website and Org B/AI_AGENT projects. First GET returned a typed revision-0 empty projection and did not insert a workspace row. Website save created one row at revision 1; a fresh service GET returned the saved content. A stale revision raised `WORKSPACE_REVISION_CONFLICT` and did not overwrite the saved content. Org A access to the Org B project raised `PROJECT_NOT_FOUND`. Website-shaped data was rejected for the AI Agent project and AI Agent-shaped data was rejected for the Website project. Both projects remained `DRAFT`, and Build Packet lineage remained unchanged.

The focused backend suite passed 18/18 and the focused frontend Studio suite passed 19/19. API typecheck, API build, frontend build, UI validation, manifest validation, and `git diff --check` passed. Browser-authenticated Website/AI Agent smoke, browser-level stale-tab conflict handling, mobile browser smoke, and accessibility browser smoke were not executed in this environment; they remain NOT VERIFIED rather than inferred from unit or service tests. No Phase 6.1 source fix was required.

Phase 6.2 found and fixed one PostgreSQL integration defect during authenticated browser setup: student-idea handoff creation attempted to insert a project foreign key before the project row existed. The handoff now starts with a null project reference and is linked after project insertion in the same transaction. This preserves atomicity and required no migration change.

## Phase 6.2 acceptance appendix

Authenticated browser acceptance used the repository's official disposable environment harness with a fresh PostgreSQL database (`shs_phase8_acceptance_1788372587808_pehroh`), API `http://127.0.0.1:55140`, frontend `http://127.0.0.1:55148`, and Chromium/Playwright. The harness applied migrations 001 through 070 with no pending, drift, or unknown migrations, seeded the documented development-only identities, and the test added only disposable Studio permission rows for the student fixture.

The authentication method was the repository's intended local/E2E development identity boundary: `Bearer dev-token:<fixture identity>` plus the existing `window.__user` bootstrap. No production authentication bypass was introduced.

The acceptance spec `tests/phase6.2-builder-browser.spec.mjs` passed 6/6. It verified an authenticated Website project opened its shell and builder, exposed Build Packet and Project Resources context, accepted edits, used the real PATCH workspace API, displayed truthful `Saved` text, and returned the edits after full page reload. It verified the equivalent AI Agent flow for name/instructions and rejected a Website-shaped payload with HTTP 400. A stale revision returned HTTP 409, did not overwrite the winning content, and the stale browser displayed an actionable conflict alert instead of `Saved`; a learner from the foreign organization received a denied workspace response. Website and AI Agent layouts passed the 390x900 mobile checks; the 768x1024 tablet check passed; labeled controls, keyboard focus on Save draft, and readable save status passed.

The Website save test compared counts before and after the browser save for the existing Evidence, lesson completion, project submission, competency review, and confirmed attendance stores; counts were unchanged. The browser request assertion confirmed workspace PATCH data contained work content and did not add client authority fields. No migration was changed. The only Phase 6.2 repair was the transaction ordering defect recorded above. Full screen-reader testing, production authentication, public deployment, preview/execution, and real-time collaboration remain outside this acceptance.
