# SYS-6D Consequence-Aware Human Approval / Incident / Revocation Control Acceptance Report

## 1. Executive Result
**INCOMPLETE.** Bounded classification, containment, revocation, and safe execution are implemented. Generic consequential `Agent Task` approval is not: there is no durable task-level approval record, exact action binding, approver lifecycle, or authenticated approve/deny consumer. Simulation, MCP, and ARAG approvals are domain-specific and cannot close WF-036.

## 2. Repository Baseline
Path `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`; HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`; 120 tracked and 179 untracked dirty entries (299 total), all preserved. Migration head 129, fresh `shs_sys6d_20260910` applied 001–129, pending/drift/unknown empty, schema integrity PASS. PostgreSQL was available on 55445; API/frontend were stopped. Production Agent Fabric execution remained disabled; only bounded test/simulation paths exist.

## 3. Workflow Inventory
| Workflow | Trigger | Owner | Final consumer | Success | Failure | Status | Gap |
|---|---|---|---|---|---|---|---|
| WF-036 | consequential model/session/policy action | AI Governance / Agent Fabric | governed runtime boundary | approved governed action | denied/cancelled/revoked/blocked | **PARTIAL — PRODUCT GAP** | generic durable task approval/binding absent |
| WF-037 | agent identity/delegation/session/task | Agent Fabric | bounded runtime | scoped durable state | denied/revoked | COMPLETE | SYS-6B evidence |
| WF-038 | governed tool/task execution | Agent Fabric | safe runner | bounded task success | failed/cancelled/revoked | COMPLETE | SYS-6C evidence |
| WF-039 | agent fact proposed to Evidence/Truth/Reporting | owning domains + Agent Fabric | Evidence/Truth/Reporting | accepted projection | rejected/not accepted | **PARTIAL — ACCEPTANCE GAP** | representative consumer proof |
| WF-040 | production workforce execution | Agent Fabric safety contract | none | N/A | safety blocked | **BLOCKED — SAFETY/POLICY** | intentional prohibition |
| WF-041 | MCP server/resource/tool access | MCP governance | MCP gateway | governed read/simulation | denied/audited | **PARTIAL — ACCEPTANCE GAP** | full scope/resource/replay matrix |
| WF-043 | operational awareness | Operations | bounded brief/outbox | persisted brief | policy-disabled execution | COMPLETE | unchanged |

## 4. Status Classification
WF-036 is a product gap, not an acceptance-only gap: current code has `WAITING_APPROVAL`, `action_hash`, and policy snapshots, but no generic approval authority. WF-039 and WF-041 remain acceptance gaps. WF-040 remains safety/policy blocked.

## 5. Canonical Authority Map
Agent identity, delegation, sessions, tasks, attempts, leases, cancellation, and revocation belong to AI Governance/Agent Fabric. Consequence classification is in AI Governance, Agent Simulation, and MCP. Simulation proposal approval is simulation-owned; release approval is ARAG-owned; Evidence and Truth remain separate owning authorities. No Agent Fabric task may write domain Truth, grades, credentials, funding decisions, or release state directly.

## 6. Control Plane
Identity, scope, policy, containment, safe-runner allowlists, MCP policy, input security, revocation, audit/events, and Studio/ARAG/Evidence/Truth boundaries are implemented for bounded paths. Generic durable human approval and unified incident correlation are missing.

## 7. Execution Plane
SYS-6C provides durable tasks, workers, atomic claims, leases, attempts, checkpoints, bounded retry, cancellation, revocation, and restart reconstruction. Production side effects remain disabled.

## 8. Alignment Layer
The existing alignment/policy boundary remains authoritative. No flags or safety gates were changed.

## 9. Mode Semantics
OFF denies execution; LIMITED remains policy/tool bounded; test ON does not grant consequential authority. Changes remain administrative/configuration state.

## 10. Agent Identity
Bounded task/attempt records retain agent, principal, organization, tenant, session, delegation, worker, and policy/action binding context.

## 11. Human Principal / Delegation
SYS-6B delegation is scoped, durable, organization-bound, and revocable. Generic task approval is not a separate durable human authority.

## 12. Agent Sessions
Sessions are durable and bound to task/agent scope. Full approval/incident correlation is not proven.

## 13. Durable Work State
Safe task state survives restart/lease expiry. Consequential approval-wait state cannot safely progress without the missing approval authority.

## 14. Work Request / Task Authority
`ai_agent_tasks` is canonical for tasks and carries consequence class, action hash, policy snapshot, scope, and idempotency. It is not an approval record.

## 15. Task Lifecycle
Native states include `REQUESTED`, `VALIDATED`, `AUTHORIZED`, `WAITING_APPROVAL`, `READY`, `RUNNING`, `PAUSED`, `SUCCEEDED`, `FAILED`, `CANCELLED`, and `REVOKED`. SYS-6C proved bounded transitions; generic approval transitions remain open.

## 16. Tool Authorization
Registered task types, safe-runner allowlists, MCP policies, side-effect classes, and resource scope govern tools. Unknown/consequential runner work is denied.

## 17. Governed MCP
MCP has server/tool/resource policy, classification ceilings, secret boundaries, and approval-required simulation. WF-041 acceptance remains open.

## 18. Resource Access
Owning resource domains remain authoritative; Agent Fabric is not a superuser bypass.

## 19. Classification-Aware Access
MCP supports PUBLIC/INTERNAL/SENSITIVE/RESTRICTED ceilings and tasks have explicit consequence classes. A unified approval binding is absent.

## 20. Input Security
Existing deterministic input-security scanning blocks or flags unsafe/prompt-injection patterns. Full incident correlation remains open.

## 21. Secrets Boundary
Governed MCP paths do not return secret values. Production secret/provider execution was not enabled.

## 22. Provider / Model Abstraction
Provider/model metadata is retained in policy/task context; production provider execution is disabled.

## 23. Development Environment Adapters
Codex/Claude/Cursor-like development adapters are not promoted to production authority; no adapter was activated.

## 24. Consequence Classification
Current task classes are `READ_ONLY`, `REVERSIBLE_CHANGE`, `EXTERNAL_SIDE_EFFECT`, and `CONSEQUENTIAL_HIGH_RISK`, with simulation/MCP risk and side-effect classes.

## 25. Human Approval Gates
Simulation and ARAG approvals exist. Generic consequential task approval is absent.

## 26. Stale Approval Protection
ARAG binds release approval to subject hash and expiry. Generic task action hashes have no approval record to bind.

## 27. Execution Containment
Safe execution is scoped, allowlisted, leased, globally/app gated, and limited to non-consequential work.

## 28. Command Execution
No arbitrary command-string runner is admitted by the safe runner.

## 29. Network Access
Arbitrary production network/provider access is disabled; governed MCP read/simulation is bounded.

## 30. External Side Effects
External communication, deployment, financial, release, and consequential work remains blocked without owning-domain authorization.

## 31. Revocation
SYS-6C proved task cancellation, delegation revocation, agent disable, and global disable. Approval-specific and full membership matrices remain unaccepted.

## 32. Cancellation
Durable task cancellation is complete for bounded tasks; waiting-approval cancellation is not proven generically.

## 33. Emergency Stop
Global/app OFF and agent disable fail closed for bounded execution.

## 34. Failure Handling
Safe task failures, lease expiry, retry, cancellation, and revocation are durable. Generic approval failure lifecycle is missing.

## 35. Retry
Bounded retries preserve attempt history. Approval-bound retry cannot be proven without an approval object.

## 36. Resume / Recovery
Safe execution resumes/retries after restart. Consequential approval-wait recovery is incomplete.

## 37. Idempotency
Task creation, claim, completion, and safe retry are protected. Generic approval replay is absent.

## 38. Operational Events
Task, denial, revocation, MCP, and outbox events are used for bounded operations; no generic approval event chain was added.

## 39. Audit Logging
Bounded execution records task, attempt, worker, principal, agent, delegation, policy/action binding, and timestamps. Generic approval/incident correlation is incomplete.

## 40. Evidence Boundary
Operational logs do not automatically become verified Evidence.

## 41. Truth Spine Boundary
Generic tasks cannot write arbitrary Truth facts.

## 42. Oracle Boundary
Recommendations do not become approval or final authority.

## 43. ARAG-1 Boundary
ARAG remains release assurance authority with exact subject binding; Agent Fabric cannot bypass it.

## 44. Studio Boundary
Builder, Artifact, QA, Review, and Release Gate remain canonical.

## 45. CivicSure Boundary
Agents may analyze/recommend; provider, funding, and assurance decisions remain domain/human controlled.

## 46. Education Boundary
Agents cannot create verified outcomes, mastery, grades, credentials, or institutional claims.

## 47. Funding Boundary
Agents cannot award, disburse, approve, or alter funding obligations.

## 48. Production Workforce Execution
WF-040 would require durable workers, governed tools/providers, approvals, and bounded final actions. Only bounded coordination exists and no production terminal action is permitted.

## 49. WF-040 Safety Block
**WF-040 BLOCKED — SAFETY/POLICY.** Unchanged.

## 50. Fail-Closed Enforcement
SYS-6C proved execution-disabled denial, consequential denial, cancellation, revocation, agent disable, and global OFF. No production autonomy was attempted.

## 51. Development / Test Execution
Deterministic safe execution is TEST/SIMULATION only.

## 52. Autonomy Levels
ON/LIMITED/OFF plus consequence/tool policy provide bounded controls; unrestricted autonomy is not enabled.

## 53. Admin Controls
Governance is API/domain/configuration based. No complete mounted SYS-6D approval/incident UI was identified.

## 54. Frontend Surfaces
The canonical SYS-6D consumer is API/domain; no public Agent Fabric surface is canonical.

## 55. Authorization / Isolation
Core task/org isolation and bounded revocation passed in SYS-6B/C. Generic approval and incident direct-ID matrices remain open.

## 56. Cross-Org Access
Org/tenant predicates and bounded wrong-org safe-not-found exist; broader MCP acceptance remains WF-041.

## 57. Persistence
Durable identities, delegations, sessions, tasks, attempts, workers, and events exist. No generic approval or unified incident table exists.

## 58. Migrations
Fresh DB applied 001–129; no SYS-6D migration was created.

## 59. Performance
Existing bounded task/attempt/lease indexes are adequate; approval/incident performance is not applicable until those authorities exist.

## 60. Observability
Task/attempt/lease/denial states are inspectable. Approval backlog and unified incident workflow are absent.

## 61. Security Events
MCP, input-security, simulation, task, and operational denial records exist; unified incident lifecycle is not proven.

## 62. Incident Response
Existing audit/security projections provide bounded inspection; no generic task incident consumer was identified.

## 63. Existing Acceptance Evidence
SYS-6B/C fresh PostgreSQL and authenticated HTTP evidence proves identity, delegation, tasks, leases, attempts, cancellation, revocation, safe runner denial, retry, and restart reconstruction. Focused governance/MCP/simulation tests passed 27/27. Generic task approval HTTP acceptance cannot pass because its product surface is absent.

## 64. External Dependencies
Production model/provider/MCP integrations are unavailable or intentionally disabled. No external dependency explains the WF-036 gap.

## 65. Azure
**N/A — NO MANDATORY AZURE-BACKED SYS-6 WORKFLOW PRESENT.** No provisioning attempted.

## 66. Product Gap vs Safety Block
WF-036 is a product gap. WF-039/WF-041 are acceptance gaps. WF-040 is a deliberate safety/policy block, not a defect.

## 67. Control-Plane Matrix
| Capability | Implemented | Live-proven | Production-safe | Gap |
|---|---:|---:|---:|---|
| identity/delegation/policy/containment | yes | yes, bounded | yes, bounded | generic approval correlation |
| approval | partial | simulation/ARAG only | no generic task approval | P0 WF-036 |
| tools/resources/providers | partial | focused | bounded | WF-041 acceptance/provider limits |
| revocation/audit | yes | bounded | yes, bounded | unified incident matrix |
| Evidence/Truth | separate | boundary tests | yes | WF-039 acceptance |

## 68. Execution-Plane Matrix
| Capability | Exists | Durable | Restart-safe | Production-enabled | Gap |
|---|---:|---:|---:|---:|---|
| task/session/worker/attempt | yes | yes | yes | bounded only | none for WF-038 |
| retry/recovery/cancellation | yes | yes | yes | safe only | approval-wait path |
| external side effects | denied | N/A | N/A | no | WF-040 safety block |
| final consequential outcome | no | no | no | no | owning-domain approval |

## 69. Safety Matrix
| Risk | Control | Enforced | Evidence | Gap |
|---|---|---:|---|---|
| unauthorized/cross-org action | scope, policy, safe runner | yes, bounded | SYS-6B/C | full approval matrix |
| stale approval | ARAG subject hash | release only | ARAG tests | generic task binding |
| prompt/tool/secret abuse | input/MCP policy | bounded | MCP/input tests | incident correlation |
| external side effect/deployment | consequence denial and Studio/ARAG | yes | SYS-6C/release tests | production remains blocked |
| Truth corruption | Truth acceptance boundary | yes | Truth tests | WF-039 acceptance |

## 70. Workflow Completion Matrix
| ID | Status | Basis |
|---|---|---|
| WF-036 | PARTIAL — PRODUCT GAP | generic durable human approval absent |
| WF-037 | COMPLETE | SYS-6B |
| WF-038 | COMPLETE | SYS-6C |
| WF-039 | PARTIAL — ACCEPTANCE GAP | consumer proof remains |
| WF-040 | BLOCKED — SAFETY/POLICY | intentional production block |
| WF-041 | PARTIAL — ACCEPTANCE GAP | governance matrix remains |
| WF-043 | COMPLETE | bounded operational awareness |

## 71. P0/P1/P2/P3 Gaps
P0: generic task-level approval/binding/approver/HTTP authority (WF-036). P1: WF-039 consumer acceptance and WF-041 MCP matrix. P1 safety: WF-040 block. P2: unified incident correlation and operational hardening. No P3 gap was material to this audit.

## 72. Minimum Safe Production Architecture
Before reconsidering production execution: durable task-level approval bound to task/action/resource/hash/consequence/org/policy; approver expiry/revocation; governed tools/resources/secrets; durable recovery/cancellation/emergency stop; incident correlation; audit; domain handoffs; and bounded final actions. Initial use must be supervised, not unrestricted.

## 73. Recommended SYS-6 Phasing
Next phase: **SYS-6E — Generic Agent Task Human Approval / Incident Control Foundation**. It was not started. WF-039 and WF-041 remain separate acceptance work; WF-040 remains blocked.

## 74. Files Created
This report only.

## 75. Files Modified
Workflow Registry, Dependency Graph, Completion Roadmap, and SYS-6A report received evidence/status notes only.

## 76. Owner Work Preservation
All pre-existing tracked/untracked changes were preserved. No production code, migration, flag, provider, external system, or non-disposable database was changed.

## 77. SYS-6 Rebaseline Decision
**SYS-6 INCOMPLETE.** WF-036 product gap; WF-039/WF-041 acceptance gaps; WF-040 safety blocked; WF-037/WF-038/WF-043 bounded complete.

## 78. Recommended SYS-6B
The requested SYS-6B successor was not started. Recommended next phase is SYS-6E as stated above.

## Final Verdict
Classification and bounded enforcement: **YES**. Owning-domain, Evidence, Truth, Studio/ARAG, CivicSure, Education, and Funding boundaries: **YES**. Durable identity/tasks/attempts, claims, leases, retries, cancellation, revocation, emergency OFF, restart reconstruction, tool/resource denial, and safe-runner containment: **YES for bounded SYS-6C paths**. Generic human approval, stale approval binding, approval replay/expiry/revocation, end-to-end incident correlation, and full authenticated SYS-6D approval consumer: **NO / PRODUCT GAP**. Unrestricted production path reachable: **NO**. WF-040: **BLOCKED — SAFETY/POLICY**. WF-036: **PARTIAL — PRODUCT GAP**. WF-039/WF-041: **PARTIAL — ACCEPTANCE GAP**.

**SYS-6D CONSEQUENCE-AWARE HUMAN APPROVAL / INCIDENT / REVOCATION CONTROL ACCEPTANCE INCOMPLETE**

## SYS-6E Follow-up Evidence - 2026-09-10

Migration 130 closes the generic task approval product gap identified by this
report. WF-036 now has durable proposed actions, exact fingerprints, approval
requests, immutable decisions, stale-action invalidation, cancellation
invalidation, and scoped security events with authenticated API consumers.
