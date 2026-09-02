# SHF Studio Phase 8 — Human Review / Submit for Review Boundary

## Purpose

Phase 8 adds a durable human-review authority for Studio projects. A student explicitly submits the current saved and QA-checked workspace; an authorized reviewer records `APPROVED` or `CHANGES_REQUESTED` against that exact revision. Review is separate from QA, delivery, Evidence, Portfolio, completion, credentials, and reporting.

## Ownership decision

The existing `project_submissions` domain was audited and not reused. Its accepted-review path emits `project.submission.reviewed` to the verified-evidence destination, and it requires legacy team semantics. Studio has a separate project-scoped revision/snapshot contract, so review is owned by the Studio domain while reusing the existing `project.submission.review` permission for reviewer authority.

## Persistence and submitted snapshot

Migration `072_studio_human_review.sql` adds `studio_review_submissions` and `studio_review_decisions`. Submissions retain project/org/tenant/type, the exact workspace revision, the exact QA run, submitter, status, and an immutable JSON snapshot of the saved builder work. Decisions are one-per-submission and retain the reviewer, decision, feedback, and timestamps. A later workspace edit cannot change the submitted snapshot; it makes the prior review non-current. Historical submissions are not overwritten.

## Submission and QA policy

`POST /studio/projects/:projectId/review-submissions` accepts an empty body. The server derives actor, project, organization, tenant, workspace revision, work snapshot, and QA association. A saved workspace and `PASSED` QA run for the exact current revision are required. Repeating the action for the same revision returns the existing submission rather than creating duplicates. A later revision requires a new QA run and explicit resubmission.

## Reviewer contract

`GET /studio/projects/:projectId/review-submissions/:submissionId` and `POST /studio/projects/:projectId/review-submissions/:submissionId/decision` require the existing `project.submission.review` permission plus the project organization/tenant scope. Reviewer responses show the submitted snapshot and the QA run for that submitted revision, never silently substituting current work. The decision body permits only `decision` and plain-text `feedback`; reviewer identity is server-derived. Submitters cannot self-approve, and a decision cannot be recorded twice.

## Status and downstream boundaries

Submission statuses are `SUBMITTED`, `CHANGES_REQUESTED`, and `APPROVED`; the decision is explicit and historical. Current student presentation is stale when the latest workspace revision differs from the submitted revision. Approval does not mutate the project lifecycle, Build Packet, QA, delivery, Evidence, Portfolio, completion, credentials, or reporting. Studio emits only `studio.review.submitted` and `studio.review.decision_recorded` operational events to `shs-studio`; it does not emit the legacy evidence-producing event.

## API and UI

Student endpoints:

* `GET /studio/projects/:projectId/review/current`
* `POST /studio/projects/:projectId/review-submissions`

Reviewer endpoints:

* `GET /studio/projects/:projectId/review-submissions/:submissionId`
* `POST /studio/projects/:projectId/review-submissions/:submissionId/decision`

The student builder presents `Submit for Review`, status, feedback, and stale-version guidance. `/studio/review/:projectId/:submissionId` is a minimal reviewer surface showing the immutable work snapshot, exact QA result, and accessible decision controls. Reviewer feedback is rendered as text, not unsafe HTML. Beginner mode hides IDs and internal state; Advanced mode remains presentation-only.

## Security and race behavior

All endpoints derive organization/tenant from authenticated context and scope project/submission queries by both. Foreign projects and wrong project/submission pairs fail closed. Student edit permission does not grant review permission. A submission is bound to the revision observed during the server transaction; edits immediately afterward remain newer work and do not rewrite the submission. The current implementation uses synchronous QA and does not introduce collaboration or reviewer reassignment.

## Deferred

Delivery/publishing, deployment, Agent Registry submission, Evidence/Portfolio projection, completion, credentials, notifications, rubric scoring, AI review, and ClientOps remain separate future phases. Phase 9 may consume an approved submitted revision, its QA result, and the Build Packet to introduce a distinct delivery/finalization boundary.

## Acceptance evidence

The disposable Phase 8 harness applied migrations `001` through `072` to PostgreSQL with `pending: []`, `drift: []`, and `unknownApplied: []`, then started the real API and Vite frontend. The final authenticated Chromium run used API `http://localhost:56926`, frontend `http://localhost:56934`, and a disposable database named `shs_phase8_acceptance_1788375605667_l4zsvg`; the environment was cleaned up after the run.

The Website browser flow saved and QA-checked a revision, submitted it, displayed the exact submitted snapshot to an authorized instructor, recorded `CHANGES_REQUESTED`, displayed feedback, saved and rechecked a newer revision, resubmitted, recorded `APPROVED`, and then marked that approval non-current after another edit. The AI Agent flow persisted and checked Agent work, submitted it, denied student self-approval and a foreign reviewer read, and allowed the same-organization authorized reviewer to approve the exact submission. Downstream Evidence, completion, credentials, Truth, and legacy submission counts were unchanged.

The browser acceptance spec ran at 390x900 for the AI Agent student flow and 1280x900/1440x900 for reviewer and Website flows. It verified accessible labels, visible review status text, reviewer feedback controls, and the shared project shell; the test suite reported `2 passed`. Full screen-reader conformance, production authentication, notifications, reviewer assignment, and downstream delivery remain outside this phase.
