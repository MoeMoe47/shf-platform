# SYS-6E Generic Agent Task Human Approval / Incident Control Foundation Report

## 1. Executive Result
**COMPLETE for WF-036's generic approval foundation.** Migration 130 adds scoped proposed actions, approval requests, immutable decisions, and security events. Approval is bound to the task action hash and deterministic fingerprint. No production side effects were enabled.

## 2. Repository Baseline
`/Users/mikeslate/Projects/shrv1`; `studio-v1-plus-development`; HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`; baseline worktree 120 tracked/180 untracked dirty entries, preserved. Migration 130 applied to fresh `shs_sys6e_20260910`; pending/drift/unknown empty; schema integrity PASS. API/frontend were stopped except local API 8106 for HTTP checks. WF-040 gate remained disabled.

## 3. WF-036 Entering Product Gap
Generic `Agent Task` had consequence/action hashes and `WAITING_APPROVAL`, but no durable task-level approval/decision authority or consumer.

## 4. Existing Approval Primitive Audit
Simulation owns proposal approval state; MCP owns side-effect policy evaluation; ARAG owns release approval bound to release subject hash. None is generic. They remain reusable domain controls, not duplicated.

## 5. Canonical Ownership
Agent Fabric owns generic approval coordination. Studio/ARAG, CivicSure, Education, Funding, Evidence, and Truth retain final domain authority.

## 6. Proposed Action
`ai_agent_task_proposed_actions` stores bounded task/action/domain/target/parameter-hash/consequence/scope/provenance.

## 7. Action Fingerprint
SHA-256 stable JSON binds task, task action hash, action type, owner, target, parameter hash, consequence, organization, and tenant.

## 8. Approval Request
`ai_agent_task_approval_requests` is durable, scoped, idempotent by task/fingerprint, and records required permission and expiry where supplied.

## 9. Approval Lifecycle
Bounded states: `PENDING`, `APPROVED`, `DENIED`, `CANCELLED`, `EXPIRED`, `INVALIDATED`.

## 10. Human Decision
`ai_agent_task_approval_decisions` records approver, decision, reason, fingerprint, and timestamp.

## 11. Decision Immutability
Decisions are append-only; replay returns prior decision and does not create a duplicate.

## 12. Approver Authorization
Decision routes require existing `ai.governance.manage` permission and current authenticated organization scope.

## 13. Wrong Org
Org B direct lookup/decision receives safe `404 APPROVAL_NOT_FOUND`.

## 14. Unauthorized Approver
Existing permission middleware denies actors without governance manage permission.

## 15. Revoked Approver
Current membership/identity resolution is rechecked by authentication; revoked identities cannot reach the protected route. Full revocation matrix remains regression evidence, not a new authority.

## 16. Self-Approval
Self-approval is denied for non-read-only task consequences (`SELF_APPROVAL_DENIED`).

## 17. Approval Binding
Approval requires current task action hash and request fingerprint to match.

## 18. Stale Action Invalidation
Changing the task action hash causes `STALE_APPROVAL`, invalidates the request, and records a HIGH security event.

## 19. Request Replay
Unchanged task/fingerprint request replay reuses the canonical request.

## 20. Decision Replay
Unchanged approved/denied decision replay returns historical decision without a second decision.

## 21. Expiration
`expires_at` is supported and checked before authorization; no arbitrary default window is imposed.

## 22. Denial
Denial persists and does not authorize task progression.

## 23. Cancelled Task
Task cancellation invalidates pending/approved requests; late approval cannot reactivate the task.

## 24. Delegation Revocation
SYS-6C delegation revocation remains authoritative before execution and overrides approval.

## 25. Agent Disable
Disabled/revoked agents remain ineligible despite prior approval.

## 26. Membership Revocation
Current identity/membership checks remain authoritative before protected operations.

## 27. Global / App OFF
Global/app execution disable and WF-040 safety block override any generic approval.

## 28. Owning-Domain Recheck
Generic approval is necessary but not sufficient; resource and owning-domain gates remain separate.

## 29. Consequence-Aware Requirement
Read-only tasks do not create approval requests. Reversible, external, and consequential classes can require approval; safe runner still admits only bounded read-only work.

## 30. Waiting Approval State
Requesting approval transitions eligible nonterminal tasks to `WAITING_APPROVAL`.

## 31. Approved Task
Valid approval transitions a waiting task to `AUTHORIZED`; it does not grant production execution.

## 32. Denied Task
Denied requests remain historical and non-executable without a new request/state change.

## 33. Retry Approval Binding
Existing SYS-6C retry preserves task identity; the approval binding remains valid only while the current action hash remains unchanged.

## 34. Incident Authority
Agent Fabric owns the bounded governance security-event record; it is not a second general SOC authority.

## 35. Incident Model
`ai_governance_security_events` stores scoped event type, severity, task/session/agent/actor/request references, policy/fingerprint, bounded metadata, status, and time.

## 36. Incident Consumer
Authenticated `GET /ai-governance/security-events` is the current operator/API consumer.

## 37. Audit Correlation
The flow correlates principal, agent, session, delegation, task, proposed action, request, decision, and later attempt identifiers.

## 38. Tool / MCP Boundary
Approval does not bypass MCP allowlists, side-effect policy, or input-security admission.

## 39. Resource Authorization
Approval does not expand task resource scope.

## 40. Secret Boundary
Only hashes/references and bounded metadata are stored; secret values are not accepted as approval payloads.

## 41. Studio / ARAG Boundary
Generic approval cannot approve Review, bypass ARAG, or release an artifact.

## 42. CivicSure Boundary
It cannot sanction providers, authorize payments, or make final assurance decisions.

## 43. Education Boundary
It cannot create verified Outcome, Mastery, Credential, or institutional grade/report state.

## 44. Funding Boundary
It cannot award, disburse, approve, or alter funding obligations.

## 45. Evidence Boundary
Approval and security events are governance records, not automatically verified Evidence.

## 46. Truth Boundary
No generic approval permits arbitrary Truth Spine writes.

## 47. Oracle Boundary
Recommendations are not approvals.

## 48. WF-040 Safety Block
**WF-040 BLOCKED — SAFETY/POLICY.** Unchanged.

## 49. Persistence
Migration 130 adds three task approval tables and one scoped security-event table; no existing authority was replaced.

## 50. Database Constraints
Foreign keys, tenant/org checks, bounded status checks, unique request identity/fingerprint, and append-only decision uniqueness are present.

## 51. APIs
Added authenticated request, list/read, decision, and security-event routes under existing AI Governance permissions. No unrestricted execute route was added.

## 52. Fresh PostgreSQL
`shs_sys6e_20260910` applied 001–130; pending/drift/unknown none; schema integrity PASS.

## 53. Happy Path
Live service proof: principal → agent/session/task → external-side-effect proposed action → pending request → authorized approver → APPROVED → AUTHORIZED task. No side effect ran.

## 54. Denial Path
Live proof: high-risk request → authorized human DENIED; denial persisted.

## 55. Wrong Org
Live service and HTTP proof: Org B cannot read/decide Org A request.

## 56. Unauthorized Actor
Self-approval denied; permission middleware remains the role boundary.

## 57. Revoked Approver
Canonical database identity resolution fails closed after membership revocation; no bypass was added.

## 58. Stale Action
Live proof: approved task action hash changed → `STALE_APPROVAL`; request invalidated and HIGH security event persisted.

## 59. Cancel After Approval
Cancellation path invalidates approval records through the existing task cancellation service.

## 60. Delegation Revoke
Existing SYS-6C revocation blocks subsequent protected execution; approval does not override it.

## 61. Agent Disable
Existing SYS-6C agent disable propagation remains green.

## 62. Global OFF
Existing SYS-6C global disable remains green and overrides approval.

## 63. Retry
Exact unchanged retry retains task/action identity under SYS-6C bounded retry rules.

## 64. Changed Retry
Changed action hash fails approval binding and records stale-approval security history.

## 65. Incident Acceptance
Live stale-action event was consumed through authenticated HTTP. Wrong-org access was safe-not-found; no protected event leakage occurred.

## 66. Restart
Approval, decision, request status, fingerprint, task, and security-event data are PostgreSQL-backed and reconstructable; API route read was exercised after service startup.

## 67. HTTP Acceptance
Authenticated `GET /ai-governance/approval-requests`, decision replay, wrong-org decision, and `GET /ai-governance/security-events` were exercised. Full pending/revocation browser matrix remains outside this bounded closure.

## 68. Admin Consumer Decision
**AUTHENTICATED API IS THE CANONICAL CURRENT CONSUMER — UI DEFERRED.**

## 69. Performance
Approval and incident indexes cover scoped pending/task/severity lookups. No structural N+1 issue was introduced.

## 70. Security
Mass assignment is bounded by server-derived task/org/fingerprint values; direct-ID scope, replay, stale substitution, self-approval, and secret boundaries are enforced.

## 71. Regression
API typecheck/build, focused governance/MCP/simulation tests (27/27), root build, manifests, UI validation, migration status, schema integrity, and `git diff --check` passed. Root build retained existing chunk-size warnings.

## 72. Failure Classification
The initial uppercase fixture status and autonomy value failures were **FIXTURE** issues. The initial missing executor default was a **PRODUCT DEFECT** and was fixed. Sandbox socket denials were **ENVIRONMENT**. No external production provider was invoked.

## 73. Files Created
- `apps/shs-api/migrations/130_agent_task_approval_incident_control.sql`
- `docs/architecture/SYS-6E_GENERIC_AGENT_TASK_HUMAN_APPROVAL_INCIDENT_CONTROL_FOUNDATION_REPORT.md`

## 74. Files Modified
- `apps/shs-api/src/domain/ai-governance/model/ai-governance.ts`
- `apps/shs-api/src/domain/ai-governance/repo/ai-governance-repo.ts`
- `apps/shs-api/src/domain/ai-governance/service/ai-governance-service.ts`
- `apps/shs-api/src/domain/ai-governance/api/routes.ts`
- systemwide workflow artifacts and SYS-6D report

## 75. Owner Work Preservation
All pre-existing dirty work was preserved. No reset, stash, cleanup, commit, push, cloud provisioning, production execution, or external side effect occurred.

## 76. WF-036 Decision
**WF-036 COMPLETE** for the generic durable task approval/incident control contract.

## 77. WF-039 Status
**PARTIAL — ACCEPTANCE GAP**. Evidence/Truth/Reporting consumer acceptance remains separate.

## 78. WF-041 Status
**PARTIAL — ACCEPTANCE GAP**. Full MCP governance matrix remains separate.

## 79. WF-040 Safety Decision
**WF-040 BLOCKED — SAFETY/POLICY.**

## 80. Remaining SYS-6 Work
WF-039 and WF-041 remain open acceptance workflows. WF-040 remains intentionally blocked.

## 81. Recommended Next Phase
**SYS-6F — Agent-to-Evidence / Truth / Reporting Acceptance**, dependency-ranked ahead of the remaining MCP acceptance where the current roadmap permits. It was not started.

**SYS-6E GENERIC AGENT TASK HUMAN APPROVAL / INCIDENT CONTROL FOUNDATION COMPLETE**
