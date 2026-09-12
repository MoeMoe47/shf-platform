# PR-5 Agent Fabric Controlled Production Pilot Report

## PR-5 Scoped Gap Ledger
| PR0 Gap ID | Starting Status | Work Performed | Final Status | Evidence |
|---|---|---|---|---|
| PR0-GAP-007 | INTENTIONAL SAFETY/POLICY LIMIT | Audited the existing bounded task/worker path, approval controls, scope checks, revocation, recovery, and execution gate; added focused regression coverage. No unrestricted executor was enabled. | INTENTIONAL SAFETY/POLICY LIMIT | `SYS-6A`, `SYS-6C`, migration `130_agent_task_approval_incident_control.sql`, `tests/pr5-controlled-pilot-acceptance.test.ts` |

## 1. Executive Result
PR-5 accepts the repository-local controlled-pilot evidence for its only scoped record. Agent Fabric supports explicit, scoped, read-only safe execution with governance events. WF-040 remains intentionally blocked; unrestricted autonomous production execution is not enabled.

## 2. Repository Baseline
Repository `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`; starting HEAD `9eaaa0cf7b54905ca5eaedcea542ed4c298cb061`; upstream `origin/studio-v1-plus-development`. Pre-existing PR-1 through PR-4 work, runtime artifacts, local data, and owner files were preserved.

## 3. PR-0 Gap IDs Owned by PR-5
Only `PR0-GAP-007`, unrestricted production Agent Fabric execution, is assigned to PR-5.

## 4. Scope Boundaries
This phase validates bounded governance and deterministic/local acceptance. It does not activate unrestricted autonomy, real-world irreversible effects, PR-6 work, or a real organization pilot.

## 5. WF-040 Preservation
WF-040 remains `BLOCKED — SAFETY/POLICY`. The safe runner is gated by `SHS_AGENT_SAFE_EXECUTION_ENABLED`; a disabled gate returns `EXECUTION_DISABLED`. No bypass was added.

## 6. Canonical Agent Fabric Authority
`ai-governance` owns agent identities, delegations, sessions, tasks, workers, attempts, approvals, and governance events. MCP, ARAG-1, Studio, CivicSure, Truth, Evidence, and Oracle retain their authorities.

## 7. Controlled Pilot Model
The existing bounded task runner is the controlled path. Workers are limited to `TEST_SAFE` and `SIMULATION`; safe task types are `safe_read`, `bounded_review_preparation`, and `simulation`.

## 8. Pilot Configuration
Canonical task, delegation, session, worker, policy snapshot, tool scope, resource scope, provider/model, idempotency, and expiry fields define configuration. There is no client-only pilot switch.

## 9. Pilot Eligibility
Eligibility requires permission, org/tenant context, active agent/delegation/session, bounded resources, registered task type, read-only consequence, policy evaluation, and the server-side safe-execution gate.

## 10. Agent Identity
Tasks bind agent identity, principal user, organization, tenant, session, delegation, and provider/model metadata.

## 11. Work Order Contract
The canonical task records purpose, requested action, input snapshot/hash, action hash, resource scope, tool scope, consequence class, policy snapshot, and lifecycle state.

## 12. Policy Binding
Policy evaluation is captured in `policy_snapshot`; action and policy bindings are checked during claim and approval transitions.

## 13. Human Authority
Non-read-only proposed actions use approval coordination. The Agent Fabric service cannot make itself the human approver.

## 14. Approval Integrity
Approval requests are scoped and bound to the exact task/action fingerprint. Stale, expired, mismatched, and replayed approvals are rejected or invalidated.

## 15. Self-Approval Prevention
The task principal cannot approve its own consequential action; the service emits `SELF_APPROVAL_DENIED`.

## 16. Tool Governance
Task tool scope and MCP governance remain canonical. No catch-all tool permission is available to the safe runner.

## 17. Resource Governance
Resources must be explicit and bounded; global resource scope is denied before claim.

## 18. MCP Governance
MCP lifecycle, tool side-effect class, policy, authority, resource, and simulated execution controls remain in the MCP domain. Arbitrary discovery or mutation is not exposed.

## 19. Provider / Model Governance
Provider/model metadata is captured on tasks and attempts. Model output is not Truth, Evidence, approval, or release authority.

## 20. Provider Neutrality
Policy, scope, approval, and evidence metadata are provider-independent. This acceptance used deterministic repository controls and makes no real-provider claim.

## 21. Input Security
Existing simulation and Agent Fabric input-security/policy boundaries remain upstream of execution; no bypass was introduced.

## 22. Session Governance
Sessions are active, scoped records bound to agent, delegation, and acting user. Inactive or mismatched sessions deny task authority.

## 23. Execution State Machine
Canonical task/attempt states cover validation, authorization, approval waiting, readiness, running, success, failure, cancellation, revocation, and expiry.

## 24. State Transition Authority
Service/repository transition methods own state changes. Agents cannot self-set approved, succeeded, verified, or released states.

## 25. Execution Limits / Budgets
Bounded task types, explicit scopes, finite leases, and retry limits constrain execution. The safe runner is read-only.

## 26. Timeouts
Worker leases are bounded to 5–300 seconds and expired leases are recovered. Delegation/session expiry also denies authority.

## 27. Revocation
Delegation, agent, task, attempt, and MCP lifecycle revocation paths are present and scoped.

## 28. Emergency Stop
The server-side safe-execution gate is the emergency-stop equivalent for new bounded claims. With it off, claim returns `EXECUTION_DISABLED`.

## 29. Retry / Idempotency
Task idempotency keys and bounded attempt/retry handling preserve replay safety. Consequential external execution is outside the safe runner.

## 30. Failure Atomicity
Claim and attempt creation are transactional. Failure and recovery states remain explicit; no distributed side effect is presented as globally atomic.

## 31. Provider Outage Behavior
Provider success is never inferred. Unavailable providers cannot authorize unrestricted execution.

## 32. High-Risk Action Restrictions
Non-read-only consequences, unknown tasks, unbounded scope, inactive workers, and revoked authority are denied. Deployment, secret access, deletion, identity changes, financial action, and arbitrary shell execution remain prohibited.

## 33. Read-Only Pilot Acceptance
The accepted baseline is an explicit safe-read/review-preparation/simulation task on a safe worker with bounded resources and no external side effect.

## 34. Approval-Required Acceptance
Approval request and decision contracts are action-bound. Consequential execution remains prohibited by the safe runner pending a future explicit policy decision.

## 35. Denied-Action Acceptance
Unknown task, non-read-only consequence, unbounded scope, wrong org/tenant, inactive worker, revoked authority, and disabled gate produce denial before claim or side effect.

## 36. Revocation Acceptance
Revocation is checked before authorization/claim, and active attempts have cancellation/revocation lifecycle support.

## 37. Cross-Org Isolation
Task, worker, delegation, session, approval, event, and attempt operations require matching organization and canonical tenant. Direct IDs do not bypass scope.

## 38. Policy Versioning
The evaluated policy is retained in the task policy snapshot and action binding; privilege expansion is not implicit.

## 39. Agent Configuration Versioning
Agent identity and provider/model references are captured per task/session/attempt rather than relying on a mutable current-agent lookup.

## 40. Evidence
Governance, security, and outbox events provide attributable operational evidence without replacing canonical Evidence authority.

## 41. Truth Boundary
Agent tasks/events cannot mint arbitrary Truth Spine facts; domain verification/projection remains required.

## 42. Oracle Boundary
Oracle remains interpretive/derived and cannot approve or authorize Agent Fabric actions.

## 43. Audit Events
Creation, authorization, claim, attempt, approval, denial, failure, retry, cancellation, revocation, expiry, and security events carry actor, scope, correlation, and idempotency metadata.

## 44. Pilot Operational State
Task and attempt responses expose governed lifecycle states; no fake production-success state is shown.

## 45. Agent Fabric Admin UI
`/admin.html#/agent-fabric` remains an administrative surface. Frontend state is not execution authority; broad UI redesign was out of scope.

## 46. Evidence Packet
Task, session, delegation, attempt, approval, security event, policy, action, and provider/model references form the bounded audit packet without a duplicate Evidence store.

## 47. Deterministic Pilot Scenario
One scoped actor creates a safe-read task, an active safe worker claims it under the enabled gate, the bounded attempt completes, and governance events are attributable. Wrong-org, unknown-task, non-read-only, revoked, and disabled-gate variants deny.

## 48. Real Provider vs Test Adapter
No real provider or irreversible target was used. Evidence is deterministic repository acceptance, not real production execution.

## 49. WF-040 Negative Acceptance
Focused regression coverage confirms the global `EXECUTION_DISABLED` gate, safe worker modes, registered safe task types, and absence of production worker mode.

## 50. ARAG-1 Boundary
Agent Fabric cannot self-release or bypass ARAG-1 policy, gate, approval, repository scope, or evidence authority.

## 51. Studio Boundary
Agent Fabric cannot bypass Studio revision, QA, review, or release authority.

## 52. CivicSure Boundary
Agent Fabric may assist analysis/proposals but cannot unilaterally make protected assurance decisions or public projections.

## 53. Payment Boundary
Agent Fabric does not gain payment authority; PR-3 payment and entitlement controls remain canonical.

## 54. Identity Boundary
Agent Fabric cannot alter identity, roles, or memberships through the bounded runner.

## 55. Regression Tests
Added `apps/shs-api/tests/pr5-controlled-pilot-acceptance.test.ts`; existing Agent Fabric, MCP, simulation, conductor, ARAG-1, security, Truth, Evidence, and frontend/runtime tests remain applicable.

## 56. PR-0 Gap Closure Matrix
| PR0 Gap ID | Gap | Starting Classification | Work Performed | Tests | Final Classification | Remaining Dependency |
|---|---|---|---|---|---|---|
| PR0-GAP-007 | Unrestricted production Agent Fabric execution | INTENTIONAL SAFETY/POLICY LIMIT | Verified bounded safe runner and governance controls; preserved WF-040; added negative contract coverage | `pr5-controlled-pilot-acceptance.test.ts` and existing Agent Fabric suites | INTENTIONAL SAFETY/POLICY LIMIT | Future explicit policy decision and separately authorized production-worker design |

## 57. P0 / P1 Status
P0 discovered: 0. Repository-local PR-5 P1 remaining: 0. The scoped item remains an intentional safety/policy limit.

## 58. External Blockers
None for this repository acceptance. Real provider/account activation and any future production execution authorization remain outside this phase and do not change WF-040.

## 59. Files Created
- `apps/shs-api/tests/pr5-controlled-pilot-acceptance.test.ts`
- `docs/architecture/PR-5_AGENT_FABRIC_CONTROLLED_PRODUCTION_PILOT_REPORT.md`

## 60. Files Modified
- `docs/architecture/PR-0_HISTORICAL_GAP_CLOSURE_AUDIT.md` updated only with PR-5 evidence and next phase.

## 61. Owner Work Preservation
Pre-existing PR-1 through PR-4 changes, dirty files, untracked owner work, runtime artifacts, and local data were preserved. No reset, clean, stash, commit, push, or PR-6 work occurred.

## 62. Validation
Focused PR-5 and relevant existing governance tests passed. Required repository checks and `git diff --check` were run and are recorded with this phase result.

## 63. PR-5 Decision
PR-5 is complete for its authoritative scope: bounded controlled-pilot governance is accepted, repository-local P0/P1 gaps are zero, and WF-040 remains intact.

## 64. Exact Next Phase
PR-6 — Performance, Observability & Disaster Recovery

## Final Verdict Questions
1. PR-5 ID: `PR0-GAP-007`; RESOLVED 0, OPEN 0, BLOCKED 0.
2. P0 appeared: No; repository-local P1 remains: No.
3. WF-040 blocks unrestricted production Agent Fabric execution and consequential autonomous side effects; it is intact and unrestricted autonomy cannot execute through the governed path.
4. Controlled authority is the server-side `ai-governance` task/session/delegation/worker service and safe-execution gate. Activation requires an authorized, scoped actor and canonical records; eligibility is server-authoritative.
5. Agent identity, agent configuration, work order, policy, policy version, org/tenant, tools, resources, provider/model, input security, audit, and evidence bindings are explicit.
6. Self-approval and incorrect approval replay are denied; timeout, revocation, and emergency stop are enforced. Denied actions have no protected side effect and are auditable.
7. Cross-org access, Truth writes, ARAG-1/Studio/CivicSure/payment/identity bypasses are denied or remain under their canonical authorities. MCP and provider neutrality are preserved.
8. Deterministic, denied-action, revocation, and WF-040 negative scenarios passed; approval coordination passed where supported. No real provider was used.
9. External blockers: none for repository acceptance; real production accounts/providers and future unrestricted policy authorization remain outside scope.
10. PR-5 tests, FE/runtime regressions, build, manifests, UI, Layer, Truth, Oracle, and diff checks passed. P0 and repository-local P1 defects are zero.
11. PR-5 is complete. PR-6 was not started. Exact next phase: PR-6 — Performance, Observability & Disaster Recovery.
