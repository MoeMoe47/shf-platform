# Studio V1+ Phase 9 — Reviewer Routing Engine V1

## 1. Executive result

Phase 9 adds a durable, provider-neutral routing boundary for Studio review submissions. A valid submission is routed to one server-selected eligible reviewer, while Studio Review remains the authority for the review decision. Routing does not approve work, create Evidence, alter Completion, issue Credentials, change Portfolio or Deployment, or alter Agent Package/Registry state.

## 2. Current-state audit

`studio_review_submissions` and `studio_review_decisions` are the canonical Studio Review records. Submission creation already validates the project owner, exact workspace revision, and current QA pass. Decision creation remains in the Studio service and is bound to the submitted revision. Before Phase 9 there was no durable reviewer assignment, queue, deterministic reviewer selection, reassignment history, or routing event. Existing review permissions and institutional memberships are reused.

## 3. Routing authority

Reviewer Routing owns assignment lifecycle, eligibility calculation, routing policy, queue reads, reassignment records, routing timestamps/reasons, and routing events. It does not own the review submission or decision.

## 4. Review authority boundary

Studio Review remains the authority for `APPROVED`, `REJECTED`, `CHANGES_REQUESTED`, feedback, reviewer identity at decision time, decision timestamp, and exact revision binding. A reviewer must have a current active assignment unless they hold the canonical routing-management permission. Decision-time authorization is rechecked; an old assignment does not survive revoked membership or permission.

## 5. Routing entity

Migration `080_studio_reviewer_routing.sql` adds `studio_review_assignments`. Each row references one review submission, organization, tenant, reviewer, lifecycle status, policy, bounded reason, timestamps, and optional reassignment lineage. Historical rows are retained.

## 6. Status model

The routing lifecycle is `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REASSIGNED`, or `CANCELLED`. Review decision status remains a separate Studio Review value. Only `ASSIGNED` and `IN_PROGRESS` count as active assignments.

## 7. Eligibility

Eligibility is server-derived from active organization membership, active user state, reviewer/instructor role, `project.submission.review`, tenant/org context, and cohort staffing. Assignment-origin work requires active `cohort_staff` membership for the submission cohort. Student-idea work uses the organization’s active cohort-staff reviewer pool because no assignment context is fabricated.

## 8. Self-review

The submitting learner is excluded by user identity, including when that identity has multiple roles. Reassignment uses the same eligibility calculation and therefore cannot target the learner.

## 9. Organization and tenant scope

The service derives tenant scope as `tenant:<organization_id>` and rejects inconsistent actor context. All reads and writes constrain organization and tenant. Cross-organization and mismatched-tenant callers fail closed without metadata or routing side effects.

## 10. Assignment, cohort, and program context

Assignment-origin project and cohort identifiers are read from canonical project/handoff records and are preserved in queue responses where available. Program context remains in the upstream assignment/cohort domain; routing does not reconstruct or duplicate it.

## 11. Student-idea routing

Student-idea projects with no cohort use the organization-level active cohort-staff pool. If the institution has no eligible member, the submission remains valid and receives a bounded `UNROUTED` result with `studio.review.routing_failed`; it is never assigned to the student or an unauthorized user.

## 12. Reviewer pools

Pools are logical, derived sets rather than a second pool-configuration domain. The current pool is the organization/tenant’s active instructor/reviewer memberships with review permission and the required cohort-staff relationship.

## 13. Routing policy

The implemented policy is `LEAST_ACTIVE_LOAD`. No random or client-selected routing policy is accepted.

## 14. Load model

Active load is the count of assignments for the reviewer in `ASSIGNED` or `IN_PROGRESS` state. Completed, reassigned, and cancelled history does not count.

## 15. Deterministic tie-breaking

Candidates are ordered by active load ascending, oldest `assigned_at`/no prior assignment first, then stable user ID ascending. The same pool and load state therefore produce deterministic selection.

## 16. Transactional concurrency

Route and reassign operations use a PostgreSQL transaction and transaction-scoped advisory lock keyed by organization and submission/assignment. A partial unique index permits at most one active assignment per submission. Repeated route requests return the current active assignment.

## 17. Unrouted state

No eligible reviewer produces `UNROUTED` at the service boundary and a bounded routing-failure outbox event. The Studio submission remains a legitimate submitted item; routing never auto-approves or changes Review authority.

## 18. Reviewer queue

`GET /studio/reviews/queue` is a reviewer-scoped read model of active assignments. It includes safe project, learner, revision, project type/title, review status, and assignment context. It does not expose load counts, internal membership IDs, unrelated learners, or routing secrets.

## 19. Decision-time authorization

The existing Studio decision endpoint calls routing authorization before recording a decision. The assigned reviewer must still be active and correctly scoped. A routing manager may decide under the existing institutional manage permission; routing itself never creates a decision.

## 20. Reassignment

Authorized routing managers can create a new assignment with a bounded reason. The prior row becomes `REASSIGNED` and remains immutable as history; the new target is revalidated against the current reviewer pool and retains `reassigned_from_id`.

## 21. Escalation and SLA

No canonical availability, leave, SLA, or escalation authority existed in the audited repository. Active eligible membership is treated as available for this phase. Due dates, escalation levels, calendar integration, and notification delivery are deferred rather than invented.

## 22. Revision behavior

Each assignment belongs to its exact `studio_review_submission`, which carries its exact workspace revision. Request Changes followed by a new revision creates a new submission and a new routing assignment. Approval or routing history is never carried silently to a later revision.

## 23. Events

Routing emits `studio.review.routed`, `studio.review.reassigned`, and bounded `studio.review.routing_failed` events through the existing integration outbox. Completion of an assignment is a routing record update after the canonical Review decision. Routing does not emit Review decision, Completion, Evidence, Credential, Deployment, Portfolio, Agent Package, or Registry authority events.

## 24. API

Implemented routes are:

- `GET /studio/reviews/queue`
- `GET /studio/reviews/assignments/:assignmentId`
- `POST /studio/review-submissions/:submissionId/route`
- `POST /studio/review-assignments/:assignmentId/reassign`

Automatic routing runs after successful Studio submission creation. Explicit route and reassignment endpoints require their dedicated permissions and reject unrecognized routing fields.

## 25. UI

The existing instructor operations surface links to `Needs Review` at `/studio/reviewer-queue`. The queue reuses the existing Studio review workspace for the `Review Work` action and provides an honest loading, error, and empty state. Student submission UI remains a submission/status surface and does not offer reviewer selection.

## 26. Privacy

Student-facing surfaces do not expose reviewer identity or other reviewers’ work. Reviewer queue access is assignment-scoped. Administrative reads remain organization/tenant-scoped and permission-gated.

## 27. Database side effects

Routing writes only `studio_review_assignments` and routing outbox records, except for the existing Review submission status/decision writes performed by Studio Review itself. It does not write QA, Delivery, Evidence, Completion, Credential, Portfolio, Deployment, Agent Package, Registry, runtime, or ClientOps state.

## 28. Responsive and accessibility baseline

The queue uses existing operations styles and semantic headings, links, buttons, visible text statuses, focusable native controls, and an honest empty state. It is intended to remain usable at desktop, tablet, and mobile widths. Full assistive-technology certification remains outside Phase 9 and belongs to the later accessibility program.

## 29. Security

Client-supplied reviewer, organization, tenant, policy, load, eligibility, and assignment-status claims are not trusted. Submission IDs are insufficient for review decisions. Cross-scope reads, routes, reassignments, and decisions fail closed. Reassignment target eligibility is evaluated server-side.

## 30. Phase 10 entry contract

Phase 10 is Notification Integration. It may consume canonical routing and Review events to deliver notifications, but Notification remains presentation/delivery infrastructure and must not become institutional routing, Review, Completion, Credential, or other domain truth.

## Phase 9.1 final certification

The live disposable acceptance flow covered valid Studio submission, automatic least-load routing, exact revision binding, reviewer queue visibility, three simultaneous explicit route requests, canonical Review decision completion, and cross-organization denial. Migration replay through `080` remained clean and the migration-runner contract passed.

The remaining certification scenarios are intentionally tracked separately: no-reviewer routing, controlled load/tie fixtures, reassignment and revoked-reviewer decision checks, full cross-tenant route/read/reassign/decision coverage, outbox idempotency inspection, routing-only table snapshots, and dedicated queue responsive/accessibility traversal. The current implementation has the required server-side controls and bounded persistence, but this repository turn does not claim those scenarios as executed. Prior-domain acceptance environments are isolated and the repository-wide API test command remains environment-sensitive; its unrelated failures are not treated as routing evidence.

## Final routing verdict

Phase 9 implementation is **PARTIAL** until the dedicated Phase 9.1 acceptance matrix is executed successfully. Phase 10 remains Notification Integration and must consume routing events without becoming routing or Review authority.

## Phase 9.3 mandatory live final certification

Fresh disposable PostgreSQL execution completed for the Phase 9 master journey (`1/1`) and the Phase 9 security/UX suite (`7/7`). Those runs covered the canonical learning journey, authenticated browser authorization, foreign-ID isolation, responsive behavior at desktop/tablet/mobile widths, practical accessibility checks, and the browser authority audit. The focused routing browser acceptance also passed (`1/1`) and migration replay/schema validation through `080` remained clean.

The specifically requested no-reviewer, controlled-load/tie-break, reassignment and revoked-reviewer matrix, multi-submission concurrency, direct outbox-count inspection, routing-only before/after table matrix, and dedicated queue keyboard/ARIA suite were not executed in this certification turn. They remain material evidence gaps; this section intentionally does not represent them as proven.

## Phase 9.4 acceptance fixture + final live certification

The Phase 9.4 test-only fixture was expanded in `tests/phase9.4-reviewer-routing-final.spec.mjs`. It creates canonical Organization A/B users and memberships, independently controls reviewer staffing and active/inactive state, establishes exact assignment loads and timestamps with canonical `studio_review_assignments` rows, supports a dual-role learner, and queries `integration_outbox` plus scoped authority-table snapshots. No production schema or routing feature was added.

Fresh disposable PostgreSQL execution passed `1/1` for the complete Phase 9.4 live specification. The executed evidence covered zero eligible reviewers with bounded `studio.review.routing_failed`, controlled least-load routing with A=3/B=1/C=0 and C selected, updated load selection, isolated timestamp tie-breaking, dual-role self-review exclusion, reassignment and lineage preservation, denial of invalid reassignment targets, revoked-reviewer decision denial with authorized reassignment, cross-tenant queue/detail/reassign/decision denial, forged routing-input resistance, six-submission concurrent routing, direct outbox inspection, and bounded repeated/concurrent route consequences.

Routing-only snapshots showed only one `studio_review_assignments` row and one routing event delta; projects, handoffs, workspaces, QA, Review submissions/decisions, Evidence, Completion, Portfolio, Deployment, Agent Package, Registry, and learner credentials were unchanged. Reviewer queue browser checks passed at 1440x900, 768x1024, and 390x900 with no horizontal overflow. Named queue and empty-state ARIA snapshots, keyboard Refresh/Review Work activation, and reduced-motion rendering passed.

The first live attempts exposed and repaired only test-fixture defects: a duplicate existing enrollment, an empty SQL `IN` list, an incomplete zero-row load query, an unisolated tie fixture, an event namespace filter, and an empty-queue identity lacking queue permission. No production routing defect was reproduced. Migration replay through `080` and the existing API/build/UI validation remained clean.

## Phase 9.4 final sufficiency result

All material routing categories have direct live evidence: eligibility, self-review, least-load selection, deterministic tie-breaking, active-assignment uniqueness, PostgreSQL concurrency, reassignment/history, permission revocation, tenant isolation, forged-input resistance, event idempotency, bounded database mutation, Review decision separation, and responsive/accessibility queue behavior. SLA, calendar/PTO availability, escalation, notifications, and full assistive-technology certification remain deferred by design.

Phase 9 reviewer routing is **COMPLETE**. Phase 10 remains Notification Integration and must consume routing events without becoming routing or Review authority.

## Phase 9.4 regression sweep and sufficiency record

The final isolated regression sweep was executed against disposable PostgreSQL environments. Studio/Review (`tests/phase9/master-journey.spec.mjs`) passed `1/1`; Completion coverage in the Phase 9 master journey passed; Portfolio (`tests/phase3.2-portfolio-final-acceptance.spec.mjs`) passed `4/4` with the required Phase 9 master fixture; Website Deployment (`tests/phase4.2-deployment-final-acceptance.spec.mjs`) passed `1/1` with its documented non-production `SHS_DEPLOYMENT_TEST_FAIL_ONCE=1` seam; Agent Package (`tests/phase6-agent-package-live.spec.mjs`) passed `1/1` on its original isolated fixture; Autonomous Registry (`tests/phase7.2-registry-final-acceptance.spec.mjs`) passed `1/1`; Credential (`tests/phase8-credential-live.spec.mjs`) passed `1/1`; and the complete Phase 9.4 routing acceptance passed `1/1`.

Two initial regression attempts failed because of harness invocation/configuration, not product behavior: Portfolio was first run without the master fixture and lacked `phase9_release_2`; Deployment was first run without the documented fail-once adapter seam and therefore correctly returned `201` instead of the legacy test's expected initial `400`. Both passed after the smallest harness configuration correction. The selected API contract run passed `66/69`; its three failures are stale Credential unit-test expectations (legacy provenance shape, legacy event-count expectation, and legacy ineligible-response expectation) contradicted by the current live Credential contract. They do not touch Reviewer Routing ownership and the fresh live Credential acceptance passed. No production routing defect was found.

Final validation passed: API typecheck, API build, frontend build, `ui:validate`, `manifests:validate`, `git diff --check`, and fresh migration replay `001–080` with `80 applied`, no pending migrations, no drift, and no unknown applied migrations. These results are sufficient for the Phase 9 risk-based certification; the remaining unit-test expectation drift is recorded as non-routing test debt, not a material Reviewer Routing risk.
