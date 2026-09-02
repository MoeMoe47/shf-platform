# Studio Phase 12 — Security + Accessibility + End-to-End Hardening

## 1. Executive result

Phase 12 hardens and verifies the existing Studio V1 chain without adding a new domain. The canonical Studio services continue to own project, workspace, QA, Review, Delivery, and institutional status boundaries. Assignment, Evidence, Completion, Truth, Portfolio, Registry, credentials, and ClientOps remain separate authorities.

## 2. Threat model

| Attack | Expected defense | Evidence |
|---|---|---|
| Cross-org project, assignment, review, delivery, or institutional-status IDOR | Active organization and tenant are derived server-side; project/assignment authorization is checked before data load | Existing Studio contract tests; Phase 9 and Phase 10.1 disposable browser flows |
| Cross-learner private project or Evidence read | Learner ownership or authorized staff relationship is required | Studio project/review tests and Phase 10.1 cross-learner checks |
| Forged workspace revision, QA, submission, decision, or delivery ID | Browser APIs send only bounded inputs; services join IDs to the authorized project and exact revision | Route/client audit and Studio contract tests |
| Destination escalation | Student creation requires `STUDENT`; commercial requires explicit permission; workspace cannot carry destination | Project contract tests and workspace hardening tests |
| Project-type tampering | Project type is loaded from canonical project state and drives validation/checker selection | Project, QA, and Phase 10.1 tests |
| Lifecycle/completion/Evidence tampering | Workspace, QA, Review, and Delivery writes do not accept downstream authority fields or call completion/Evidence writers implicitly | Workspace contract tests, Phase 10.1 side-effect assertions |
| Stale QA/review/delivery reuse | QA, Review, Delivery, and Evidence retain exact workspace revisions and mark older records stale | Phase 9 and Phase 10.1 browser regressions |
| Duplicate requests/races | Workspace optimistic revision checks; unique submission, delivery, and Evidence source identities | Studio contract tests and PostgreSQL acceptance harness |
| Malformed, oversized, or traversal payloads | Type-specific bounded validation and canonical storage keys | `studio-phase12-hardening.test.ts` |
| Reviewer impersonation/self-approval | Existing review permission plus organization/project authorization and submitter identity check | Review contract tests and Phase 8 browser regression |
| Companion authority escalation | Companion receives bounded read-only context and has no Studio mutation API | Companion contract tests/source audit |

## 3. Authorization matrix

| Action | Student owner | Same-org student | Authorized instructor/reviewer | Unrelated instructor | Org admin | Cross-org actor |
|---|---|---|---|---|---|---|
| Create student project | Allow | Own session only | Existing policy | Deny unless existing admin policy | Allow by existing admin scope | Deny |
| Read/update workspace | Own project | Deny | Read according to project scope; update not student-owned | Deny | Existing admin scope | Deny |
| Run QA | Own project | Deny | Authorized project scope | Deny | Existing admin scope | Deny |
| Submit review | Own project | Deny | Only where existing update policy permits | Deny | Existing admin scope | Deny |
| Read submission | Own project status; submitted-review route requires reviewer authority | Deny | Allow exact authorized submission | Deny | Existing admin scope | Deny |
| Approve/request changes | Deny self-approval | Deny | Allow exact authorized submission | Deny | Existing admin scope | Deny |
| Finalize | Own approved student project under existing finalize permission | Deny | Not implicitly granted | Deny | Existing admin scope | Deny |
| Prepare Evidence/status | Own authorized student project | Deny | Authorized project read only | Deny | Existing admin scope | Deny |
| Teacher progress | Deny unless existing staff permission | Deny | Authorized assignment/cohort scope | Deny | Existing admin scope | Deny |
| Assignment handoff | Entitled learner | Deny | Existing creator/admin handoff policy | Deny | Existing admin scope | Deny |

## 4. Security findings and remediation

No unresolved Critical or High defect was reproduced. The hardening pass added bounded validator coverage for authority-field injection, credential-shaped fields, traversal, oversized content, project-type checker selection, and non-pass QA failure. No production authority redesign was required.

## 5. IDOR, tenant, and forged-ID results

Existing service queries scope projects, workspaces, QA, Review, Delivery, and institutional status by active organization/tenant and verify learner or staff access. Assignment progress resolves the Assignment through the canonical entitlement service before reading targets. Phase 9/10.1 disposable PostgreSQL browser flows confirmed foreign status/project access fails closed. No cross-org metadata was returned.

## 6. Authority tampering and destination escalation

Workspace validation projects only the supported Website or Agent fields, dropping unknown authority and credential-shaped fields. Server routes derive organization, tenant, learner, project type, assignment lineage, QA, Review, Delivery, and Evidence context. Student commercial escalation remains denied by the existing explicit commercial permission boundary.

## 7. Concurrency and idempotency

Workspace writes use locked revision checks and reject stale revisions. Assignment handoff is deterministic. Review submissions are unique per project/revision. Delivery is unique per submission and idempotent. Evidence uses the existing source/rule identity. QA runs are historical revision-bound operations; repeated checks do not mutate project truth.

## 8. Stale revision behavior

New workspace revisions do not inherit QA, Review, Delivery, Evidence, or completion facts from earlier revisions. Existing Phase 9 and Phase 10.1 tests verify that finalized delivery and Evidence remain historical after a newer save.

## 9. QA, Review, Delivery, Evidence, and Completion bypasses

Review submission requires current saved work and a passing QA run for that exact revision. Delivery requires the exact approved submission and matching QA. Evidence requires finalized student delivery. Completion remains owned by the canonical Completion Policy evaluator and cannot be asserted by browser payloads. Teacher progress reports these facts without writing status.

## 10. Failure and retry behavior

Workspace and Review UI expose truthful error states. Revision conflicts are reported as conflicts rather than saved success. Existing idempotent handoff, Review, Delivery, Evidence, and completion paths permit safe retry without duplicate institutional records. External deployment and runtime execution are not present, so no execution failure path was introduced.

## 11. Operational events and database integrity

Studio mutations use the existing Integration Outbox conventions. Events carry server-derived organization, actor, project, revision, and correlation context. No browser route writes Truth directly or emits completion, credential, Portfolio, Registry, deployment, or ClientOps facts. Fresh disposable PostgreSQL replay through migration `074` remains clean with no pending, drift, or unknown migrations.

## 12. Accessibility and responsive audit

Studio pages use semantic headings, labeled form fields, text statuses, alert regions, keyboard-operable buttons and links, and non-color-only state language. Existing browser acceptance covers desktop, tablet, and 390px Website/Agent workspace flows; the new assignment progress page was rendered in authenticated acceptance. Full screen-reader certification was not claimed. A dedicated automated axe suite was not present in the repository.

## 13. Student Experience hardening

Beginner Mode keeps the user-facing sequence understandable: build, check, submit, respond to feedback, finish, and view proof. It does not expose tenant IDs, raw event payloads, policy internals, or authority IDs. Advanced Mode remains presentation-only and does not grant bypasses.

## 14. Companion, privacy, and deferred boundaries

Companion remains read-only and cannot mutate QA, Review, Delivery, Evidence, Completion, Truth, credentials, Portfolio, or Registry state. Student responses remain project-scoped and teacher responses remain assignment/cohort-scoped. Portfolio remains `NOT_CONNECTED`; Website finalization does not imply hosting; Agent finalization does not imply Registry approval; ClientOps remains excluded.

## 15. Golden-path verification

- Website student-idea path: Phase 9 browser regression passed `1/1` Website scenario.
- AI Agent student-idea path: Phase 9 browser regression passed `1/1` Agent scenario.
- Assignment-origin path: Phase 10.1 authenticated PostgreSQL/browser acceptance passed `1/1`, including handoff, progress states, Review, finalization, and canonical completion evaluation.
- Phase 10.1 complete acceptance: `3/3 PASS`.

## 16. Tests

Added `apps/shs-api/tests/studio-phase12-hardening.test.ts`. It covers authority-field projection, credential-shaped input exclusion, path traversal, payload bounds, project-type checker selection, deterministic QA failure, and browser API authority-field contracts. Existing Studio API contracts pass `39/39`; Studio UI contracts pass `22/22`.

## 17. Phase 13 entry contract

Phase 13 may inventory and clean migration/documentation history, reconcile deprecated local/demo paths, and perform final certification. It should not discover basic authorization or authority-boundary defects for the first time. Keep canonical Assignment, Completion, Evidence, Truth, and Studio services; retain fixed hardening tests; defer Portfolio, public deployment, Registry submission, credentials, and ClientOps integration.

## 18. Verification record

- Fresh disposable PostgreSQL migration replay through `074`: PASS; no pending, drift, or unknown migrations.
- Studio-focused API contracts, including Phase 12 hardening: `44/44 PASS`.
- Serial authenticated browser regression for Phases 6.2, 7, 8, 9, and 10: `8/8 PASS`.
- Serial Phase 10.1 independent acceptance: `3/3 PASS`.
- The first combined browser attempt produced two false-negative assertions: one matched truthful explanatory text containing “approved version”, and one counted the expected review submission row as downstream state. Those assertions were narrowed; no production defect was reproduced.
- The repository-wide API suite was also run. It reported unrelated pre-existing failures in calendar-intelligence fixture expectations, external-secret tests without `EXTERNAL_SECRET_ACTIVE_KID`, and a migration-runner test still expecting 68 migrations while the protected worktree contains 74. No Studio Phase 12 path was implicated, and those systems were not modified.
