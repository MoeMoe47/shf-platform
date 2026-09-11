# SYS-5A Studio / Builder / QA / Review / Release Workflow Rebaseline and Gap Audit

Date: 2026-09-10  
Repository: `/Users/mikeslate/Projects/shrv1`  
Branch: `studio-v1-plus-development`  
HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`

## 1. Executive Result

**SYS-5 INCOMPLETE.** The current registry assigns five workflows: WF-027,
WF-028, WF-029, WF-030, and WF-049. No workflow is complete under the
trigger-to-terminal-consumer standard. WF-027 and WF-029 are acceptance gaps;
WF-028 and WF-030 are product gaps; WF-049 is blocked by its unavailable
production Registry provider.

## 2. Repository Baseline

There are 111 tracked dirty paths and 162 untracked paths, 273 total. They were
preserved. Migration filename head is `125_curriculum_lesson_content.sql`.
PostgreSQL, API, frontend, and Agent Fabric were stopped during this audit; no
release provider was running. No database or external provider was mutated.

## 3. SYS-4 Stale Count Correction

The artifacts explicitly enumerate 11 SYS-4 IDs (`WF-018`-`WF-026`, `WF-033`,
`WF-034`), despite older prose saying 12. That count-label inconsistency was
corrected only; SYS-4 semantics were not reopened.

## 4. SYS-5 Workflow Inventory

| Workflow ID | Domain | Workflow | Registry Status | Canonical Owner | Final Consumer | Current Evidence |
|---|---|---|---|---|---|---|
| WF-027 | Studio | Project/team/workspace lifecycle | PARTIAL | Studio services | Student/operator Studio project | Contract coverage for creation, scope, teams, revisions; fresh terminal recovery absent |
| WF-028 | Studio | Build packet/builder execution boundary | COMPLETE | Studio Build Artifact | QA input and canonical artifact | Migration 126 and SYS-5B fresh PostgreSQL/API acceptance prove durable immutable artifact materialization and QA/Review binding |
| WF-029 | Studio | QA/review/delivery/finalize | PARTIAL | Studio QA, Review, Delivery | Approved/finalized handoff | Revision-bound QA, immutable review, rejection, and finalize contracts exist; full live chain absent |
| WF-030 | Studio | Website deployment/public publish | PARTIAL | Deployment / Disclosure | Released website or governed handoff | `local_mock` TEST deployment and retry exist; production/public release and rollback absent |
| WF-049 | Registry | Registry submission/provider adapter | PARTIAL | Registry Submission | Registry/provider status | Local test Registry scope/failure/retry contracts exist; production provider unavailable |

## 5. Canonical Authority Map

| Responsibility | Canonical Domain | Persistence | Consumer |
|---|---|---|---|
| Project/handoff | Studio over canonical `projects` | `projects`, `studio_handoffs` | Student/operator Studio |
| Requirements/resources | Studio Build Packet and curriculum release snapshot | release tables and JSON projections | Builder |
| Workspace/revision | Studio Builder Workspace | `studio_builder_workspaces`, `studio_project_revisions` | QA and Review |
| QA/findings | Studio QA | `studio_qa_runs` | Review/delivery eligibility |
| Review/approval | Studio human Review and ARAG-1 release assurance | `studio_review_*`, ARAG tables | Delivery/release gate |
| Delivery | Studio finalized delivery | `studio_delivery_records` | Deployment/Evidence boundary |
| Deployment | Website Deployment authority | `website_deployment_records` | TEST provider |
| Registry | Registry Submission authority | `agent_registry_submissions` | Local test Registry/future provider |
| Evidence/Truth | Existing Evidence and Truth Spine | existing canonical stores | Institutional consumers |

## 6. Project / Work Request

Assignment and student-idea routes create scoped records on canonical `projects`
and `studio_handoffs`. Assignment lineage, learner, organization, tenant,
destination, and curriculum references persist. Assignment handoff creation is
idempotent. WF-027 remains **PARTIAL - ACCEPTANCE GAP** because fresh
multi-user PostgreSQL terminal/recovery evidence is absent.

## 7. Requirements

Assignment requirements enter through the handoff and are preserved in the
Build Packet. Independent student ideas intentionally have no fabricated
assignment context. No separate competing requirements authority was found.

## 8. Project Resources

Assignment resources are read from the published curriculum release snapshot;
foreign projects fail closed. Focused project contract tests cover this path.

## 9. Build Packet

`GET /studio/projects/:projectId/build-packet` returns requirements, resources,
templates, tools, lineage, and artifact references. It is a bounded projection,
not a persisted build artifact.

## 10. Builder Workspace

Workspace writes are durable, type-specific, revisioned, optimistic-concurrency
checked, organization-scoped, and idempotent by supplied key. Revision history
is stored in `studio_project_revisions`.

## 11. Builder Write Authority

Students mutate only eligible student projects; team members require active
membership; administrators require scoped permissions. Authority-shaped fields
are rejected by workspace validation.

## 12. Build Artifact

**PARTIAL - PRODUCT GAP.** No durable canonical build-artifact object or
artifact-storage/package identity exists. QA evaluates workspace JSON and
website deployment derives a transient package from it. QA, Review, deployment,
and Registry therefore do not share one immutable artifact handoff.

## 13. QA Authority

`studio_qa_runs` is the QA authority. It binds project, workspace revision,
ruleset version, actor, organization, status, summary, findings, and times.
Deterministic Website and AI Agent checks fail closed.

## 14. QA Findings

Findings are retained in the QA snapshot with pass/fail/warn/error semantics.
Focused tests cover missing required Website content and stale latest-QA
behavior.

## 15. Remediation

Remediation is represented by a new workspace revision and new QA run; no
separate finding-to-remediation work-item authority was found. This is a
bounded current model, but its live failure loop remains unaccepted.

## 16. QA Re-run

New revisions receive independent QA runs and old QA becomes stale when the
workspace advances. Prior QA history is not overwritten. A fresh fail ->
remediate -> rerun -> pass trace remains an acceptance gap.

## 17. Review Submission

Review submissions are immutable per project/revision and bind the exact QA run
and submitted-work snapshot. Submission requires a current passed QA run.

## 18. Review Gating

Missing/stale QA, revision mismatch, invalid actor scope, and unauthorized
review conditions fail closed. Review cannot accept an unverified revision.

## 19. Review Decision

Human decisions persist with actor, feedback, timestamp, tenant, project, and
submission. Students cannot decide reviews; review is not completion authority.

## 20. Review Rejection Loop

`CHANGES_REQUESTED` and later revision submissions preserve history. The
contract exists, but a fresh rejection -> remediation -> QA -> resubmission ->
approval trace is not proven. WF-029 remains **PARTIAL - ACCEPTANCE GAP**.

## 21. Approval Authority

Permission-guarded human roles and tenant scope govern Studio review. ARAG-1
rejects requester self-approval and binds approval to an exact release subject.
Production Agent Fabric execution remains disabled.

## 22. Release Gate

ARAG-1 provides release assurance when supplied with exact QA, review,
simulation, policy, and approval references. The ordinary Studio finalize path
creates a delivery record but has not been proven as one connected Studio ->
ARAG -> deployment gate.

## 23. ARAG-1 Boundary

ARAG-1 remains the release-assurance authority; Studio does not duplicate its
policy engine. Production execution requires approved authority and a
production-capable provider.

## 24. Release Provider / Deployment

Website deployment has a provider-neutral service and explicit `local_mock`
provider restricted to `TEST`. It records REQUESTED/DEPLOYING/LIVE/FAILED and
supports retry. This is not a production/public deployment consumer.

## 25. Release Terminal State

Studio delivery reaches `FINALIZED`; deployment can reach `LIVE` or `FAILED`;
ARAG has release and rollback states. A canonical production/public release
terminal consumer is absent.

## 26. Release Failure

Website provider failure records `FAILED` and supports retry. ARAG provider
failure records a failed result and emits an event. Integrated Studio release
failure/recovery is not live-proven.

## 27. Rollback

ARAG supports rollback when the provider reports it. Website deployment has no
production rollback/unpublish route and is TEST-only. This is part of the
WF-030 product gap.

## 28. Delivery / Handoff

Finalization creates an exact-revision `studio_delivery_record` and emits
`studio.delivery.finalized`. Student TEST deployment is the current bounded
handoff; customer/operator production delivery is not connected.

## 29. Evidence Packet

ARAG creates an immutable assurance packet containing exact subject, QA,
review, approval, policy, actors, and result references. Studio does not create
a competing Evidence or Truth authority.

## 30. Evidence / Truth Boundary

Studio operational events and delivery records are operational facts. Existing
Evidence, Truth, Metric, and Reporting authorities remain canonical.

## 31. Final Consumer

Current repository-local consumers are Studio student/operator state, QA,
Review, TEST deployment, ARAG assurance packet, and local test Registry status.
The intended production customer/public release consumer is not connected.

## 32. Active Frontend Routes

Studio pages exist for projects, resources, Build Packet, workspace, QA,
review, delivery, deployment, and institutional status. They are mounted in
the curriculum/admin surfaces. No active browser run in this audit proves the
full chain through a production release consumer.

## 33. API Surfaces

Canonical APIs cover assignment handoff, project/workspace/revisions, QA,
review submission/decision, finalize, Evidence projection, website deployment
request/read/retry, ARAG release assurance, and Registry submission/read/retry.

## 34. Authorization / Isolation

Focused evidence proves organization/tenant checks, learner/team scope,
permission guards, revision binding, requester self-approval rejection, and
foreign-project/QA/finalization denial. Broad fresh isolation across all Studio
stages remains acceptance work.

## 35. Revoked Membership

Team checks require active status and no `left_at`. No fresh end-to-end revoked
membership run covers every Studio stage; classify this as acceptance, not a
permission-design gap.

## 36. Idempotency

Stable keys or uniqueness protect assignment handoff, workspace revisions,
review submission per revision, delivery finalization, deployment identity,
Registry submission, and ARAG authorization. Full cross-stage replay remains
unaccepted.

## 37. Failure / Recovery Matrix

| Stage | Failure State | Retry? | Recovery | History | Consumer Impact |
|---|---|---|---|---|---|
| Builder | validation/revision conflict | yes | submit current revision | yes | no false workspace state |
| QA | FAILED/ERROR | yes | remediate and rerun | yes | review gated |
| Review | CHANGES_REQUESTED | yes | new revision and QA | yes | no stale approval |
| Delivery | stale/ineligible | after correction | finalize exact approved revision | yes | no invalid handoff |
| Deployment | FAILED | yes | provider retry | yes | no false LIVE state |
| Registry | FAILED | yes | resubmission lineage | yes | package unchanged |

## 38. Event / Handoff Matrix

| Producer | Event/Handoff | Consumer | Side Effect | Terminal State |
|---|---|---|---|---|
| Studio | handoff/project created | Studio outbox path | operational lineage | active project |
| Studio | revision/workspace updated | QA/Review | revision state | working revision |
| Studio | `studio.qa.completed` | Review | QA result | PASSED/FAILED |
| Studio | review submitted/decision | Review routing/Studio | human decision | APPROVED/CHANGES_REQUESTED |
| Studio | `studio.delivery.finalized` | Deployment/Evidence boundary | exact delivery input | FINALIZED |
| Deployment | live/failed | deployment consumer | TEST result | LIVE/FAILED |
| Registry | submission events | local test Registry | provider status | ACCEPTED/FAILED/etc. |

## 39. Agent Fabric Boundary

No production Agent Fabric execution was enabled. WF-040 remains systemwide
**BLOCKED - SAFETY/POLICY**.

## 40. External Provider Boundary

Website deployment uses `local_mock` TEST and Registry submission uses
`local_test_registry`. Neither is a production provider.

## 41. Azure

**N/A - NO AZURE-BACKED SYS-5 WORKFLOW PRESENT.** No Azure provisioning was
attempted.

## 42. Database / Migration Review

Migrations 069-083 establish Studio handoff, workspace, QA, Review, delivery,
team, and revision persistence. Migrations 076-079 establish website
deployment, governed package, Registry submission, and credential integration.
Current head is 125. No migration was added or rewritten.

## 43. Existing Acceptance Evidence

Focused contract tests cover Studio lifecycle, projects, workspace, QA, Review,
delivery, deployment, Registry, ARAG, and hardening. The attempted aggregate
test command failed before test execution because the local `tsx` IPC pipe
returned `EPERM`; this is **HARNESS/ENVIRONMENT**, not product evidence.

## 44. Performance

Studio tables have scope/project/revision indexes and deployment/Registry reads
use scoped identities. No material N+1 defect was established. Artifact and
production-release lineage will require indexed persistence in later work.

## 45. Accessibility

Shared UI validation and existing Studio components provide a baseline. No
material accessibility completion blocker was established; focused browser
accessibility belongs with the next acceptance phase.

## 46. Workflow Completion Matrix

| Workflow ID | Trigger | Canonical Owner | Final Consumer | Success Terminal | Failure Terminal | Status / Missing Gap |
|---|---|---|---|---|---|---|
| WF-027 | project/assignment handoff | Studio | Student/operator | active project/revision | rejected/conflict | PARTIAL - ACCEPTANCE GAP: fresh multi-user recovery |
| WF-028 | workspace/build request | Build Packet/Workspace | QA artifact input | revision ready | validation/QA failure | PARTIAL - PRODUCT GAP: durable artifact absent |
| WF-029 | QA/review/finalize | QA/Review/Delivery | approved handoff | FINALIZED | FAILED/CHANGES_REQUESTED | PARTIAL - ACCEPTANCE GAP: full live loop |
| WF-030 | finalized Website delivery | Deployment/Disclosure | released website | LIVE/RELEASED | FAILED/ROLLED_BACK | PARTIAL - PRODUCT GAP: production release/rollback absent |
| WF-049 | valid agent package | Registry Submission | Registry/provider | ACCEPTED | FAILED/REJECTED | BLOCKED - EXTERNAL DEPENDENCY: production provider |

## 47. Architecture Connection Matrix

| Connection | Status | Evidence |
|---|---|---|
| Project -> Requirements | CONNECTED | assignment handoff/Build Packet |
| Requirements -> Resources | CONNECTED | release snapshot |
| Resources -> Build Packet | CONNECTED | canonical service |
| Build Packet -> Workspace | CONNECTED | workspace/revision APIs |
| Workspace -> QA | CONNECTED | revision-bound QA |
| QA -> Remediation | PARTIAL | new revision model; no finding work item |
| Remediation -> Review | CONNECTED | fresh revision requires QA |
| Review -> Approval | CONNECTED | immutable submission/decision |
| Approval -> Release Gate | PARTIAL | ARAG exists; ordinary path not connected |
| Release Gate -> Release | PARTIAL | TEST/local provider only |
| Release -> Evidence | PARTIAL | bounded projection; no delivery consumer proof |
| Evidence -> Handoff | PARTIAL | production handoff absent |

## 48. Remaining Product Gaps

P1: WF-028 needs a durable canonical build artifact shared by QA, Review,
deployment, and Registry. P0: WF-030 needs a canonical production/public
release consumer and website rollback/unpublish path.

## 49. Remaining Acceptance Gaps

WF-027 needs fresh PostgreSQL/API multi-user scope and terminal recovery proof.
WF-029 needs a live fail -> remediation -> QA rerun -> review rejection /
resubmission -> approval -> finalize trace, including revoked membership and
replay.

## 50. P0 / P1 / P2 / P3 Gap Ranking

| Priority | Gap |
|---|---|
| P0 | WF-030 production/public release gate, provider, rollback |
| P1 | WF-028 durable build artifact |
| P1 | WF-027 multi-user lifecycle/recovery acceptance |
| P1 | WF-029 full QA/review/delivery acceptance |
| P1/external | WF-049 production Registry provider |

## 51. Remaining Risks

CRITICAL: none established. HIGH: canonical artifact and production/public
release/rollback. MEDIUM: live multi-user/rejection/recovery acceptance and
external Registry provider. LOW: frontend polish and exact query measurements.

## 52. SYS-5 Final Rebaseline Status

Assigned: 5. COMPLETE: 0. PARTIAL - PRODUCT GAP: 2 (WF-028, WF-030).
PARTIAL - ACCEPTANCE GAP: 2 (WF-027, WF-029). N/A: 0. BLOCKED - EXTERNAL
DEPENDENCY: 1 (WF-049). BLOCKED - SAFETY/POLICY: 0.

## 53. Recommended SYS-5B Phase

**SYS-5B - Durable Build Artifact and Project/Workspace Acceptance** should
begin with WF-027 fresh lifecycle acceptance and the WF-028 artifact seam,
then proceed to WF-029 release-assurance acceptance and WF-030 provider/
rollback decisions. WF-049 production provider work remains dependency-bound
and separate. No SYS-5B or SYS-6 work started.

## 55. Final Rebaseline Result

SYS-5 contains substantial product implementation and is not acceptance-only.
The smallest next phase is SYS-5B as above. The required result is:

**SYS-5 STUDIO / BUILDER / QA / REVIEW / RELEASE WORKFLOW REBASELINE INCOMPLETE**

Do not begin SYS-5B or SYS-6.
