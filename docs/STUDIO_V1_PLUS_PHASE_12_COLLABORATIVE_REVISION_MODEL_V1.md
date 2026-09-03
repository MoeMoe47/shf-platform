# Studio V1+ Phase 12: Collaborative Revision Model

## Executive Result

Phase 12 adds durable, actor-attributed revision snapshots around the existing Studio workspace compare-and-swap boundary. A fresh disposable PostgreSQL 16 acceptance passed for Team revision lineage, concurrent stale-save rejection, idempotent save processing, exact Review binding, cross-tenant revision denial, and removed-member write denial.

The mutable workspace remains the current working state. `studio_project_revisions` is the durable revision authority for accepted save boundaries. Review and QA continue to own their institutional outcomes.

## Current Revision Audit

Before Phase 12, `studio_builder_workspaces` stored mutable JSON work and an integer `revision`. Its update service already used a row lock and compare-and-swap check, while QA, Review, and Delivery retained numeric `workspace_revision` values. Review also stored `submitted_work_json`. There was no durable immutable revision identity, parent lineage, content hash, revision history API, or explicit revision foreign key on the source-of-truth downstream rows.

## Canonical Revision Authority

Migration 083 creates `studio_project_revisions`. Each accepted save creates one immutable snapshot with project, organization, tenant, project type, revision number, parent revision, status, validated work JSON, SHA-256 content hash, authenticated creator, timestamp, and optional idempotency key. `studio_builder_workspaces.current_revision_id` points to the current snapshot.

The workspace is `WORKING` presentation state. Revision snapshots use `WORKING`, `SUBMITTED`, `SUPERSEDED`, or `FINALIZED`. Review approval finalizes the exact submitted revision; a changes-requested revision remains historical and the next accepted save creates a child revision.

## Lineage and Attribution

Revision numbers are unique per project and parent IDs form the chain. The server derives creator identity from the authenticated actor. Team ownership remains on the Studio project; the Team is never recorded as the human actor. Team members are reauthorized on every project operation. Individual projects continue to use the existing learner ownership path.

## Concurrency and Idempotency

Workspace updates require the caller's expected current revision. A stale request returns `409 WORKSPACE_REVISION_CONFLICT` and cannot update either the workspace or revision table. A duplicate idempotency key returns the existing current workspace without creating another revision. A database unique-key race during initial or concurrent revision creation is converted to the same bounded conflict response.

The conflict response exposes only the bounded API error code. It does not expose another contributor's session or private content.

## QA, Review, and Downstream Binding

QA rows, Review submissions, and Delivery rows now retain the nullable `studio_revision_id` alongside their existing numeric revision fields. Review submissions continue to store their own immutable `submitted_work_json`. Review and QA remain separate authorities; revision creation does not create decisions, Evidence, Completion, Credentials, Portfolio artifacts, Deployments, Agent Packages, or Registry outcomes.

Delivery, Agent Package, Registry, Evidence, and Completion continue to consume their existing exact revision/provenance contracts. An approved historical revision is not rewritten when a later revision is created. Existing mature domain acceptance evidence was reused where Phase 12 did not change that authority; directly exercised Review binding passed.

## APIs and UI

The existing Studio project API remains the project/workspace entry point. Phase 12 adds:

- `GET /studio/projects/:projectId/revisions`
- `GET /studio/projects/:projectId/revisions/:revisionId`

The Studio builder loads revision history from the backend and presents revision number, status, date, and a privacy-safe contributor-attribution indicator. Internal user IDs are not shown as labels. The existing bounded stale-save alert remains the conflict UI. Revision history uses the existing Studio surface and responsive shell; no real-time collaboration behavior was added.

## Acceptance Evidence

Fresh command executed:

`node scripts/run-phase8-acceptance-env.mjs tests/phase12-collaborative-revision-live.spec.mjs`

The harness replayed migrations 001 through 083 with zero pending, drift, or unknown migrations and ran one live Playwright test to completion. Evidence included:

- Team project creation and active-member access.
- Forged authority fields rejected by workspace validation.
- Initial save creating revision 1.
- Two authenticated contributors loading revision 1, with one save succeeding and the stale save returning 409.
- Current content remaining the winning contributor's content.
- Revision list ordered `[2, 1]`, parent lineage preserved, revision 1 snapshot and hash verified.
- Repeated idempotent save producing one revision row.
- QA and Review submission bound to the current durable revision ID and exact workspace revision.
- Cross-tenant revision listing denied.
- Removed Team member stale save denied.
- Review decision, Evidence, and Completion counts unchanged by the denied write path.

The first run found and repaired a test-only evidence-table column typo (`source_id` versus canonical `source_record_id`); the rerun passed.

## Database Containment

Revision creation changes only the revision snapshot, current workspace pointer/state, and bounded revision/workspace events. A rejected stale write changes no authoritative revision state. Review submission changes Review authority and routing only according to its existing contract. Revision operations do not manufacture institutional results.

## Deferred Boundary

Phase 13 owns presence, live editing, concurrent session UX, synchronization, and reconnect behavior. Chat, comments, tasks, and full assistive-technology certification remain deferred. Phase 12 does not implement them.

## Phase 13 Entry Contract

Phase 13 may consume the revision ID, immutable snapshot, parent lineage, actor attribution, membership recheck, and conflict response defined here. It must not bypass revision CAS, mutate submitted snapshots, or replace exact Review/QA/Delivery bindings with latest-draft state.

## Student Learning Context Experience

The Studio shell now exposes a read-only `GET /studio/projects/:projectId/learning-context` projection. It composes canonical Project, Assignment, immutable Curriculum Release, Completion Policy, QA, Review, Team, and revision records; it does not persist a second workflow, checklist, completion, or assignment authority. Browser storage is not used for institutional state.

Assignment-origin projects show the Assignment title and available course, unit, and lesson titles resolved from the immutable release snapshot. Student-initiated projects show `Personal Project` and do not fabricate assignment or curriculum context. Team-owned projects retain both Team Project and Team name alongside the individual actor and project type.

The presentation model derives five stages: Build, QA, Submit, Review, and Complete. The deterministic next-action priority is completion, changes requested, failed QA, QA required, ready to submit, review in progress, then continue building. A changes-requested review names the reviewed revision and directs the learner to create the next revision, run QA again, and resubmit. Requirements are displayed only when supplied by the bound Completion Policy and their statuses are mapped from the canonical evaluator; absent requirements remain an honest empty state.

The same context is rendered in the project shell and builder. It includes the current durable revision number/status, readable requirement statuses, semantic progress state, and bounded context errors. Desktop uses a compact three-column context band, tablet reflows it, and mobile stacks it. Labels, headings, list semantics, textual statuses, keyboard focus, and reduced-motion behavior are covered by the Studio acceptance baseline. Curriculum return navigation remains the existing canonical route where available; no synthetic route was added.

Completion remains Completion authority, and the UI only exposes its verified complete state. Portfolio remains an explicit downstream action and is never auto-added. Learning Context is not a source for QA, Review, Evidence, Completion, Credential, Deployment, Registry, or Team truth.

### Learning Context Acceptance

The Phase 12 live revision acceptance now verifies a real Team-owned project returns backend-derived Team context, reports Personal Project when no assignment lineage exists, exposes the canonical initial review state, and provides no fabricated requirements. Pure presentation tests cover assignment-independent context, QA-required, QA-ready Submit, changes-requested recovery, and verified completion mapping. API typecheck, API build, frontend build, UI validation, manifest validation, and diff validation pass after this addition.

## Phase 12.1 Student Learning Context Final Certification

The assignment-origin fixture was repaired to use the disposable Phase 8 canonical Course A, Release 1, Lesson A, and Assignment A records. A temporary policy version and Studio requirement are seeded only in the acceptance database. The original timeout was a test-fixture defect caused by applying assignment-only assertions in a shared helper used by student-idea projects; those assertions were isolated to the assignment test. A second timing defect was corrected by waiting for the visible QA/save result and performing a real browser reload after Completion evaluation.

The live acceptance command was:

`node scripts/run-phase8-acceptance-env.mjs tests/phase10.1-independent-acceptance.spec.mjs`

It passed 3/3 tests against disposable PostgreSQL 16 with migrations 001 through 083 applied, zero pending migrations, zero drift, and zero unknown applied migrations. The assignment-origin browser path passed through:

`Assignment handoff -> Revision 1 save -> QA PASS -> Review submission -> REQUEST_CHANGES -> Revision 2 -> QA PASS -> Review submission -> APPROVED -> Finalize -> canonical Completion check.`

The projection reported Assignment context, Course/Unit/Lesson context from the immutable release snapshot, exact Revision 1 and Revision 2 state, QA and Review transitions, changes-requested recovery, and Completion only after the canonical Completion endpoint succeeded. Revision 1 remained historical while Revision 2 became the working/finalized revision. The refreshed browser surface displayed the verified `Assignment complete` next action and Complete progress stage. Requirements were mapped from the bound Completion Policy; an added unrelated requirement remained unsatisfied without changing the satisfied Studio requirement.

The focused Studio browser command was:

`node scripts/run-phase8-acceptance-env.mjs tests/phase6.2-builder-browser.spec.mjs`

It passed 7/7 tests, including Assignment and Personal Project context, responsive builder coverage at desktop/tablet/mobile widths, semantic context snapshot coverage, keyboard builder controls, stale-save conflict behavior, and a failure-injection case proving a Learning Context API failure leaves the workspace usable with a bounded alert and no demo fallback. Phase 11.4's certified browser acceptance remains the source for Team-owned and Individual-owned project ownership ARIA snapshots and keyboard Team management/project navigation; no production Team source changed in this phase.

The Team assignment-targeting combination remains intentionally deferred because the current Assignment architecture does not provide a canonical Team handoff. The certified Team Personal Project context remains honest: it exposes Team Project, Team name, revision, workflow projection, and no fabricated Assignment. Curriculum return navigation is `DEFERRED / NON-BLOCKING`: the source does not expose a stable authorized Assignment/Lesson/Course destination contract, so no guessed route was added. Portfolio remains an explicit downstream action and Learning Context persists no Assignment, QA, Review, Evidence, Completion, Credential, or Portfolio truth.

Phase 12.1 verdict: COMPLETE. Phase 13 may consume the immutable revision, lineage, exact source bindings, and read-only learning projection; it must not replace those authorities with client-side progress or realtime session state.
