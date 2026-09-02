# Studio Phase 11 — Assignment + Teacher Review Integration

## 1. Purpose

Phase 11 connects the canonical Assignment and Completion Policy domains to the existing Studio handoff, workspace, QA, Review, Delivery, Evidence, and completion services. Teacher progress is a read projection over those facts. It is not a new source of assignment, review, completion, or Evidence truth.

## 2. Inherited contracts

The phase preserves assignment/release lineage, idempotent assignment handoff, project-type authority, tenant and learner authorization, durable revisioned work, revision-bound QA and Review, immutable submitted snapshots, Delivery finalization, Evidence boundaries, the Student Experience Layer, Beginner/Advanced presentation boundaries, read-only Companion context, and the exclusion of Portfolio, credentials, Truth Spine direct writes, and ClientOps behavior.

## 3. Audit findings

Assignments, targets, cohorts, enrollments, releases, and completion policies are canonical and already support assignment creation, targeting, release binding, and requirement declaration. `STUDIO_PROJECT` is an existing completion-policy requirement type. Studio Review submissions and decisions already own exact-revision review, feedback, reviewer authorization, and history. Instructor Operations is the existing teacher shell, but it had no assignment-scoped Studio progress projection. `StaffProjectReview` is a legacy project-submission surface and was not reused. No durable Portfolio authority exists; Portfolio remains `NOT_CONNECTED`.

## 4. Assignment authoring model

No duplicate Studio Assignment model was added. Instructors declare a Studio requirement through the existing Completion Policy requirement API. The requirement carries its canonical key, required flag, target reference, and optional configuration such as `projectType` or `allowedProjectType`; the Assignment continues to own the policy binding, release, targets, due date, and instructor/cohort relationships.

## 5. Project-type enforcement

The completion-policy Studio adapter reads the canonical requirement configuration and compares it with the finalized Delivery's server-derived project type. A Website requirement cannot be satisfied by an AI Agent project, and vice versa. The frontend does not decide interchangeability.

## 6. Assignment-to-Studio handoff

The existing `POST /studio/handoffs/assignment` path remains the handoff authority. Student assignment work now exposes `studioEligible` and the configured Studio `projectType` from the canonical policy, allowing the existing Studio Assignments page to show `Start Project` only for Studio-enabled assignments. Handoff identity and project creation remain deterministic and idempotent.

## 7. Teacher progress read model

`GET /studio/assignments/:assignmentId/progress` derives eligible learners from canonical `assignment_targets`, active users, enrollments, and cohort/program scope. It joins the assignment-linked project, workspace revision, latest revision-matched QA, Review submission, Delivery, and canonical completion-policy evaluation. It returns minimal teacher states: Not started, Started, Building, Ready for review, Changes requested, Approved, or Finalized, plus separate Studio-requirement and whole-assignment completion facts. No `teacher_*_status` table was created.

## 8. Reviewer routing and exact revision

Review access continues to use existing assignment creator/cohort staff/admin authorization and existing `PROJECT_SUBMISSION_REVIEW` decision authority. The progress projection exposes only a server-built link to the exact current submitted Studio Review route. Reviewer pages continue to load the immutable submitted snapshot and its matching QA result; newer workspace revisions do not retarget history.

## 9. Feedback and resubmission

The existing Studio Review decision API persists reviewer identity, decision, feedback, timestamp, and immutable submission history. `CHANGES_REQUESTED` remains attached to the submitted revision. A learner's later save creates a new workspace revision, and a later submission creates a new Review submission. Prior decisions are not overwritten.

## 10. QA and Delivery boundaries

Current Studio policy still enforces QA for the exact revision before submission. Instructor approval records Review only; it does not bypass QA or directly finalize Delivery. Finalization remains a separate authorized action requiring the exact approved submission and matching QA. No hidden lifecycle transition was added.

## 11. Evidence and completion boundaries

Review and Delivery remain separate from Evidence. Studio Evidence and assignment completion remain owned by the existing institutional service and completion evaluator. A Studio requirement can satisfy only its declared `STUDIO_PROJECT` requirement. The evaluator still evaluates the complete policy, so reflection, assessment, Arcade, attendance, or other requirements remain independently authoritative. No direct lesson or assignment completion write was added.

## 12. Student feedback experience

Existing Studio student pages remain the student-facing review surface for Submitted, Changes Requested, Approved, and Finalized states. The progress projection is teacher-facing. Beginner Mode uses ordinary assignment and review language; internal requirement IDs, policy evaluators, tenant IDs, and event names are not added to the student presentation. Advanced Mode remains presentation-only.

## 13. Companion, Portfolio, Registry, and ClientOps

Companion may explain canonical requirements, QA findings, and teacher feedback through the existing read-only path. It cannot submit, decide Review, finalize Delivery, or complete work. Portfolio remains unavailable because no durable Portfolio authority exists. AI Agent approval does not imply Registry acceptance or certification. Website approval does not imply hosting. ClientOps and commercial operations remain excluded.

## 14. Authorization and IDOR safety

The progress route requires existing `STUDIO_PROJECT_VIEW` and resolves the Assignment through `getAssignmentForActor`, preserving creator, cohort-staff, admin, organization, and active membership rules. Learner rows come only from organization-scoped canonical targets. Review links are generated server-side. Project, assignment, submission, organization, and tenant IDs are not accepted as teacher authority overrides.

## 15. Events and notifications

No new event vocabulary or notification system was added. Existing Studio handoff, QA, Review, Delivery, Evidence, and completion operational events remain the respective domain authorities. A future notification integration may reuse an existing notification service if one is available.

## 16. Accessibility and responsive behavior

The new progress page uses semantic headings, text status labels, accessible links/buttons, and an alert region for load failures. Its roster changes from a desktop grid to a single-column layout at narrow widths, with wrapping text and usable review links. Existing Studio review controls retain their established accessible labels, keyboard behavior, and status language. This phase does not claim full WCAG or screen-reader certification.

## 17. Verification

Focused Studio API contracts pass `39/39`; focused Studio UI contracts pass `22/22`. The disposable PostgreSQL-backed authenticated Chromium acceptance `tests/phase10.1-independent-acceptance.spec.mjs` passes `3/3`, including the assignment flow's instructor progress states (`STARTED`, `READY_FOR_REVIEW`, and `FINALIZED`) and the rendered instructor progress page. API typecheck/build, frontend build, UI validation, manifest validation, and `git diff --check` pass. The existing Phase 9 and Phase 10 browser regressions were previously passing and the Phase 10.1 run also covers the assignment-origin completion path.

## 18. Known limitations

There is no separate assignment-authoring screen dedicated to Studio; canonical policy authoring remains the existing assignment/completion-policy API surface. The teacher progress endpoint evaluates whole-assignment completion per learner through the canonical evaluator and may perform multiple reads for a large roster; it is intentionally a read projection and should be optimized only if measured scale requires it. The new progress page was browser-rendered in the authenticated assignment acceptance flow, but dedicated visual tablet/mobile teacher-roster acceptance was not added. Portfolio remains a documented future domain.

## 19. Phase 12 entry contract

Phase 12 should harden the existing chain with adversarial authorization and IDOR tests, forged assignment/submission/project IDs, stale revision and concurrency checks, malformed payloads, completion-policy edge cases, keyboard and screen-reader validation, responsive acceptance, failure/retry behavior, rate/abuse review, and operational-event integrity. It should not create another Assignment, Review, Completion, Evidence, or Portfolio authority.
