# SYS-4 Remaining Workflow Re-Audit and Final Gap Classification Report

## 1. Executive Result

SYS-4 CURRICULUM / STUDENT END-TO-END WORKFLOW WAVE INCOMPLETE.

The current SYS-4 assignment contains 11 explicitly listed workflows. Ten are complete from
later phase evidence, including the bounded learner-result, Portfolio/Career,
credential, and reviewed institutional Reporting slices. Two repository-local
acceptance gaps remain: WF-018 curriculum catalog/import consumer acceptance
and WF-026 career event/opportunity visibility acceptance. No confirmed
SYS-4 product gap was found in this audit.

## 2. Repository Baseline

Path: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`  
Worktree: 106 tracked dirty paths, 158 untracked paths, 264 total. Existing
owner work was preserved.  
Migration filename head: `124_credential_learner_result_policy.sql`.  
Applied migration head: current evidence through 124.  
PostgreSQL/API/frontend/Agent Fabric: not running at audit time; no live
runtime was started for this documentation-only re-audit.

## 3. Current SYS-4 Workflow Inventory

| Workflow ID | Domain | Workflow | Registry Status | Latest Evidence | Canonical Final Consumer | Actual Status | Remaining Gap |
|---|---|---|---|---|---|---|---|
| WF-018 | Curriculum | Catalog/import/document processing | COMPLETE | SYS-4C5 fresh PostgreSQL/API/browser import -> publication -> assignment -> mounted StudentUnit proof | Published Curriculum catalog / StudentUnit | COMPLETE | None |
| WF-019 | Curriculum | Lessons/activities/assessment completion | COMPLETE | SYS-4B3 fresh PostgreSQL/API/browser closure | Mounted StudentUnit and next-action resolver | COMPLETE | None |
| WF-020 | Enrollment | Enrollment/cohort membership | PARTIAL | SYS-4A fresh authenticated API/PostgreSQL slice; later consumers preserve scope | Enrollment/cohort services | COMPLETE | Registry label is stale |
| WF-021 | Assignments | Assignment targeting/submission/review | PARTIAL | SYS-4A and SYS-4B3 assignment/completion evidence | Assignment and StudentUnit | COMPLETE | Registry label is stale |
| WF-022 | Completion | Completion policy/evaluation/credential eligibility | PARTIAL | SYS-4B3 completion plus SYS-4C2/C4 policy and eligibility evidence | Completion/Credential policy | COMPLETE | Registry label is stale |
| WF-023 | Credentials | Credential definition/issuance/delivery | PARTIAL | SYS-4C4 credential policy, authorized issuance, provenance and duplicate protection | Credential/verifier consumer | COMPLETE | External provider delivery is not required by current local contract |
| WF-024 | Portfolio | Portfolio evidence/section publishing | PARTIAL | SYS-4C3 scoped learner-result projection and active Portfolio consumer | Student Portfolio / Skill Profile | COMPLETE | Registry label is stale |
| WF-025 | Career | Career pathway/opportunity planning | PARTIAL | SYS-4C3 Career augmentation preserves Enrollment -> Program -> Career | Career pathway consumer | COMPLETE | Broader readiness policy remains out of scope |
| WF-026 | Career | Career events/opportunity visibility | PARTIAL | Career-event/opportunity APIs and security tests exist | Student career event/opportunity API/projection | PARTIAL — ACCEPTANCE GAP | Fresh SYS-4 integrated visibility and final-consumer proof |
| WF-033 | Calendar | Calendar projection/scheduling | COMPLETE | SYS-2B projection and security evidence | Calendar projection | COMPLETE | None; shared-platform owner |
| WF-034 | Live Learning | Live learning/cohort/session workflow | COMPLETE | SYS-2B PostgreSQL/API/provider-boundary evidence | Live Learning service | COMPLETE | External provider credentials remain deployment configuration |

## 4. Evidence Sources Reviewed

Reviewed the current Workflow Registry, Dependency Graph, Completion Roadmap,
SYS-4A, SYS-4B, SYS-4B3, SYS-4C, SYS-4C2, SYS-4C3, and SYS-4C4 reports, plus
the import-job/document-processing services and routes, Curriculum route
registry, Portfolio/Career consumers, career-event/opportunity services, and
their focused tests.

## 5. Stale Status Corrections

The registry and roadmap rows for WF-020 through WF-025 retain pre-closure
`PARTIAL` labels. Later reports conclusively close those bounded slices. This
audit changes only those stale classifications; it does not claim unrelated
SYS-5, SYS-6, or future Career readiness work complete.

## 6. Curriculum Catalog / Import

WF-018 is implemented with authenticated import-job creation, preview,
candidate editing, execution, failure/retry, cancellation, raw-document
processing, resource/Arcade linkage, audit, and canonical catalog writes.
Focused tests cover these states and cross-organization access. A fresh
integrated acceptance artifact proving the complete job -> published catalog
-> active learner consumer path is absent. Classification: PARTIAL —
ACCEPTANCE GAP.

## 7. Enrollment / Cohort / Learning Path

WF-020 is complete for the current canonical enrollment/cohort slice. Learning
Path is represented where required by the learner-result and assignment
contracts; no separate unowned enrollment authority was found. Scope and
membership controls remain canonical.

## 8. Assignment

WF-021 is complete for targeting, activity submission, completion, isolation,
retry, and next-action handoff proven in SYS-4A/B3.

## 9. Lessons / Activities / Assessment

WF-019 is complete. SYS-4B3 proved the mounted StudentUnit path, canonical
activity state, failed assessment, retry, completion policy, refresh/fresh
session durability, isolation, and next-action consumption.

## 10. Outcome / Mastery / Progress

The SYS-4C2 foundation is complete: Curriculum owns immutable Outcome history,
policy-derived Mastery, and derived Progress with current/superseded
resolution, retry history, verification separation, scope, and idempotency.

## 11. Portfolio / Skill Profile

WF-024 is complete for the learner-result projection. SYS-4C3 preserves
Studio Portfolio authority, filters failed/unverified results, preserves
provenance, controls replay, and exposes the active Portfolio/Skill Profile
consumer.

## 12. Career

WF-025 is complete for learner-result augmentation. Enrollment -> Program ->
Career remains the pathway authority; current Mastery/Progress summaries are
read-only augmentation. WF-026 remains open only for fresh integrated
career-event/opportunity visibility acceptance.

## 13. Credentials

WF-022 and WF-023 are complete for the current repository-local contract.
Accepted-capstone eligibility remains valid; versioned learner-result policy,
verification requirements, authorized issuance, provenance, verification, and
duplicate protection are proven. No Azure or external issuer is required by
the current architecture.

## 14. MetricTruth / Verified Reporting

The bounded SYS-4C4 workflow is complete. SYS-4C4B proved authenticated
verified learner fact -> registered MetricTruth -> Truth lineage -> reviewed
Reporting draft -> approved internal Reporting API/projection, including
wrong-program, wrong-organization, revoked-membership, replay, and
supersession/recomputation behavior.

## 15. Calendar

WF-033 is shared-platform COMPLETE from SYS-2 evidence. SYS-4 consumes the
canonical projection and does not own a duplicate calendar authority.

## 16. Live Learning

WF-034 is shared-platform COMPLETE from SYS-2 evidence. Provider credentials
are deployment configuration and are not a repository-local SYS-4 blocker.

## 17. Instructor Consumer

Instructor operational routes and scoped APIs exist. No separate instructor
consumer is listed as an additional SYS-4 workflow beyond WF-020/WF-021 and the
completed learner-result/reporting slices. No new instructor implementation is
recommended by this audit.

## 18. Admin Consumer

Admin/institutional consumption is covered by scoped APIs and the approved
internal Reporting API/projection for the bounded learner-result reporting
slice. No additional SYS-4 admin workflow ID is assigned in the current
roadmap.

## 19. Parent Consumer

N/A — canonical justification. No active parent dashboard or parent result
workflow is assigned to SYS-4 in the current registry/roadmap.

## 20. Learning Arcade

Arcade is an activity/resource type within Curriculum import and lesson
workflow, not a separate current SYS-4 workflow ID. Its import linkage and
validation are implemented; WF-018 acceptance must include the consumer
boundary where Arcade content is part of the imported lesson.

## 21. Celebration / Milestones

Not a current SYS-4 workflow ID. The existing celebration policy is a
cross-cutting consumer and must remain canonical-fact gated, but it is not a
SYS-4 completion blocker in the current roadmap.

## 22. Accessibility

Accessibility is a cross-cutting requirement, not a separate SYS-4 workflow
ID. Existing StudentUnit and active consumer checks remain part of the closed
WF-019 evidence. No new accessibility blocker was found.

## 23. Active Frontend Routes

| Surface | Active Route | Classification |
|---|---|---|
| Student dashboard | `/curriculum/asl/dashboard` | LIVE |
| Student learning/assignments | `/curriculum/learning`, `/curriculum/asl/assignments` | LIVE |
| Student lesson | `/curriculum/lessons/:slug` | LIVE; WF-019 proven |
| Student progress | `/curriculum/courses/:courseId/progress` | LIVE route; consumer scope bounded |
| Student Portfolio/Skill Profile | `/curriculum/asl/portfolio`, `/career.html#/portfolio` | LIVE; SYS-4C3 proven |
| Career pathway/opportunities | `/career.html#/pathways`, `/career.html#/opportunities` | LIVE/API-backed; WF-026 fresh integrated proof remains open |
| Curriculum import | `/curriculum/import`, `/curriculum/import/:jobId` | LIVE/API-backed; WF-018 fresh integrated proof remains open |
| Instructor | `/curriculum/instructor/*` | LIVE/API-backed |
| Admin | `/curriculum/admin/*` | LIVE/API-backed |
| Calendar | `/curriculum/asl/calendar` | LIVE/shared Calendar consumer |
| Live Learning | `/curriculum/live-sessions/*` | LIVE/shared Live Learning consumer |

## 24. API-Only Consumer Decisions

The approved institutional Reporting API/projection is the canonical terminal
consumer for the bounded SYS-4C4 workflow; no separate education-report browser
is required. Calendar and Live Learning also have canonical service/projection
boundaries. Browser absence is not being used to conceal WF-018 or WF-026,
which still require integrated consumer acceptance.

## 25. Failure / Recovery

Closed slices prove failure, retry, replay, supersession, revocation, or
fail-closed behavior where applicable. WF-018 still needs an integrated import
job failure/retry-to-consumer run. WF-026 still needs stale/unavailable event
or opportunity visibility acceptance. These are acceptance gaps, not confirmed
product defects.

## 26. Authorization / Isolation

Closed learner-result slices prove student, organization, program, and revoked
membership boundaries. Import and career-event/opportunity focused tests cover
scope behavior, but fresh SYS-4 integrated acceptance is still required for
WF-018 and WF-026.

## 27. Performance

No material structural SYS-4 performance defect was identified from the
available code and prior acceptance evidence. Exact query-count instrumentation
is not a required blocker for this audit; the two remaining gaps are consumer
acceptance gaps.

## 28. Azure

**N/A — NO AZURE-BACKED SYS-4 WORKFLOW PRESENT**.

## 29. Agent Fabric Boundary

Agent Fabric remains a safe shared dependency only. WF-040 remains
**BLOCKED — SAFETY/POLICY**. No production Agent execution was enabled or
changed.

## 30. Workflow Final Classification Matrix

| Workflow ID | Domain | Final Status | Product Gap? | Acceptance Gap? | Final Consumer | Next Action |
|---|---|---|---:|---:|---|---|
| WF-018 | Curriculum | PARTIAL — ACCEPTANCE GAP | No | Yes | Catalog/StudentUnit | Fresh import-to-consumer acceptance |
| WF-019 | Curriculum | COMPLETE | No | No | StudentUnit/next action | Preserve |
| WF-020 | Enrollment | COMPLETE | No | No | Enrollment service | Correct stale label |
| WF-021 | Assignments | COMPLETE | No | No | Assignment/StudentUnit | Correct stale label |
| WF-022 | Completion | COMPLETE | No | No | Completion/Credential policy | Correct stale label |
| WF-023 | Credentials | COMPLETE | No | No | Credential/verifier | Correct stale label |
| WF-024 | Portfolio | COMPLETE | No | No | Portfolio/Skill Profile | Correct stale label |
| WF-025 | Career | COMPLETE | No | No | Career pathway consumer | Correct stale label |
| WF-026 | Career | PARTIAL — ACCEPTANCE GAP | No | Yes | Career event/opportunity consumer | Fresh visibility acceptance |
| WF-033 | Calendar | COMPLETE | No | No | Calendar projection | Preserve |
| WF-034 | Live Learning | COMPLETE | No | No | Live Learning service | Preserve |

## 31. Remaining-Gap Matrix

| Workflow ID | Exact Missing Step | Why It Matters | Product vs Acceptance | Dependency | Recommended Phase |
|---|---|---|---|---|---|
| WF-018 | Fresh authenticated import job -> published catalog -> learner/StudentUnit consumer run, including failure/retry | Proves imported content is usable by the canonical student workflow | Acceptance | Curriculum catalog, source ingestion, WF-019 | SYS-4C5 or equivalent catalog/import closure phase |
| WF-026 | Fresh authenticated career event/opportunity visibility run through the active student/API consumer, including scope/stale-state behavior | Proves career visibility is a real terminal consumer rather than service-only implementation | Acceptance | Career events, opportunities, Calendar/shared identity | SYS-4C6 or equivalent Career visibility closure phase |

## 32. Remaining Risks

CRITICAL: none.  
HIGH: none confirmed. WF-018 and WF-026 are repository-local acceptance gaps
and should be closed before declaring the entire SYS-4 wave complete.  
MEDIUM: broad combined regression evidence is distributed across focused suites
rather than one SYS-4 run.  
LOW: external provider credentials and Azure remain deployment/future
configuration, not current SYS-4 blockers.

## 33. SYS-4 Final Decision

**SYS-4 CURRICULUM / STUDENT END-TO-END WORKFLOW WAVE INCOMPLETE**

## 34. Next Phase Recommendation

The smallest dependency-ranked next phase is a focused **SYS-4C5 Curriculum
Catalog / Import Final Consumer Acceptance** phase for WF-018. WF-026 should
follow as a separate Career visibility acceptance slice unless the roadmap
explicitly groups both. No implementation or next phase was started in this
audit.

## Final Verdict

1. SYS-4 workflows assigned: 12.
2. COMPLETE: 10.
3. PARTIAL — PRODUCT GAP: 0.
4. PARTIAL — ACCEPTANCE GAP: 2.
5. N/A: 0 workflow IDs; parent is N/A by canonical justification.
6. Externally blocked: 0.
7. Safety/policy blocked: 0 SYS-4 IDs; WF-040 remains systemwide safety-blocked.
8. Genuinely open: WF-026.
9. Curriculum Catalog/Import remains open: no; SYS-4C5 closed WF-018.
10. Enrollment/Cohort/Learning Path: complete for current assigned scope.
11. Assignment: complete.
12. Lessons/Activities/Assessment: complete.
13. Outcome/Mastery/Progress: complete.
14. Portfolio/Skill Profile: complete for the proven consumer slice.
15. Career integration: WF-025 complete; WF-026 visibility acceptance open.
16. Credentials: complete for current repository-local contract.
17. MetricTruth/Verified Reporting: complete for bounded SYS-4C4B slice.
18. Calendar: shared-platform complete.
19. Live Learning: shared-platform complete.
20. Instructor: existing scoped consumer, no separate open SYS-4 ID.
21. Admin: covered by scoped institutional Reporting API/projection.
22. Parent: not required by current SYS-4 roadmap.
23. Learning Arcade: not a separate blocker; included in WF-018 acceptance boundary.
24. Celebration/Milestones: not a SYS-4 workflow ID.
25. Accessibility: no current blocker found.
26. Active routes: classified above; WF-026 remains acceptance-open.
27. API-only terminal consumers: correctly recognized where canonical.
28. Failure/recovery: closed for completed slices; WF-026 visibility acceptance remains.
29. Isolation: closed for completed slices; WF-026 visibility acceptance remains.
30. Performance: no material defect found.
31. Azure: N/A.
32. Agent Fabric: boundary preserved; WF-040 remains safety-blocked.
33. CRITICAL repository-local SYS-4 gaps: none.
34. HIGH repository-local SYS-4 gaps: none confirmed; two acceptance gaps remain.
35. SYS-4 complete: no.
36. Exact next phase: separate **WF-026 Career visibility closure acceptance**; SYS-4C5 closed WF-018.

## SYS-4C5 evidence correction — 2026-09-10

WF-018 changed from `PARTIAL — ACCEPTANCE GAP` to `COMPLETE` after fresh
disposable `shs_sys4c5_20260910` acceptance. The source job reached
`COMPLETED`, the catalog passed review/approval/publication, the release was
bound to a Student A assignment, and the learner API plus fresh browser
context displayed the imported lesson. Invalid source, cross-organization
access, and completed-job replay were also proven. Acceptance found a concrete
source-content persistence defect, fixed additively in migration 125; no
duplicate authority was introduced. WF-026 remains `PARTIAL — ACCEPTANCE GAP`.
## WF-026 final acceptance correction — 2026-09-10

WF-026 is `COMPLETE`. Fresh disposable PostgreSQL `shs_wf026_20260910` and
authenticated API calls proved current Student A visibility, Program B and
cross-organization denial, direct-ID fail-closed behavior, cancellation,
expired-state suppression, and revoked-membership denial. The mounted
`career.html#/calendar` consumer made the canonical `/calendar/events/me` call
and displayed the current event and opportunity; a fresh browser context
restored the same state. Acceptance exposed and corrected one concrete stale
visibility defect: student-tier Career Events and Opportunities lacked date
predicates. The correction was limited to the canonical repository queries.

## Final SYS-4 closure correction — 2026-09-10

The current SYS-4 assignment contains 11 explicitly listed workflows: WF-018 through WF-026,
WF-033, and WF-034. All 12 are now `COMPLETE` for their assigned repository-
local contracts. No SYS-4 workflow is `PARTIAL`, externally blocked, or
safety/policy blocked. Parent and public disclosure statements remain
canonical N/A where previously documented; WF-040 remains systemwide
`BLOCKED — SAFETY/POLICY` and is outside SYS-4. SYS-4 is complete. The next
dependency-ranked systemwide wave is SYS-5; no SYS-5 work started in this
acceptance.
