# SYS-6A Agent Fabric Production Execution & Governance Rebaseline / Safety Gap Audit Report

Date: 2026-09-10

## 1. Executive Result

SYS-6A rebaseline is complete; SYS-6 implementation remains incomplete. The repository has a substantial governed control plane and a deliberately non-production execution plane. WF-040 remains `BLOCKED — SAFETY/POLICY`. No production Agent Fabric execution was enabled.

## 2. Repository Baseline

| Item | Result |
|---|---|
| Path | `/Users/mikeslate/Projects/shrv1` |
| Branch / HEAD | `studio-v1-plus-development` / `0441aa4fe5f74d330a9f100f678d6353a6cac43b` |
| Dirty state | 290 total: 116 tracked, 174 untracked; owner work preserved |
| Migration head | `127_studio_release_foundation.sql` |
| PostgreSQL/API/frontend/Agent Fabric | Not running; no SYS-6 database mutation or service start |
| Flags/config | V1 execution disabled; alignment defaults to LIMITED; run execution is globally gated |
| External providers | No mandatory production model/MCP/Azure provider acceptance found |

## 3. SYS-6 Workflow Inventory

The current roadmap assigns seven workflows: WF-036, WF-037, WF-038, WF-039, WF-040, WF-041, and WF-043. WF-042 is assigned to SYS-1, although it is a dependency of MCP governance.

## 4. Status Classification

| ID | Workflow | Registry | Actual status | Final consumer | Remaining gap |
|---|---|---|---|---|---|
| WF-036 | Model/session/policy approval | PARTIAL | PARTIAL — ACCEPTANCE GAP | AI Governance API/admin | Full authenticated deny/approve/revoke matrix |
| WF-037 | Identity/session/delegation/policy | PARTIAL | PARTIAL — PRODUCT GAP | Agent governance/runtime | Durable production task/session/worker lifecycle |
| WF-038 | Tool/MCP authorization/execution | PARTIAL | PARTIAL — PRODUCT GAP | Governed Agent/MCP gateway | No production side-effect worker; simulation/read only |
| WF-039 | Agent to Evidence/Truth/Reporting | PARTIAL | PARTIAL — ACCEPTANCE GAP | Evidence/Truth/Reporting | Representative end-to-end consumer trace |
| WF-040 | Coordination/workbench | BLOCKED — SAFETY/POLICY | BLOCKED — SAFETY/POLICY | None in V1 | Intentional production workforce block |
| WF-041 | MCP governance | PARTIAL | PARTIAL — ACCEPTANCE GAP | MCP gateway/policy | Full scope/classification/secret/replay/recovery proof |
| WF-043 | Operational awareness/conductor | COMPLETE | COMPLETE | Scoped brief/outbox consumer | None for bounded awareness |

## 5. Canonical Authority Map

Agent definitions and registry are owned by Agent Fabric; human identity and delegated authority by Identity/AI Governance; sessions by AI Governance; tools/resources by MCP and owning domains; policies and containment by Alignment, AI Governance, MCP, and Input Security; Evidence by Evidence; Truth by Truth Spine; release assurance by ARAG/Studio; and final consequential actions by their owning domain and human authority. No duplicate Truth, Evidence, Metric, Studio, or release authority was found.

## 6. Control Plane

Identity, org/tenant scope, permissions, bounded delegation, model approval, resource classification, Input Security, MCP allowlisting, approval profiles, audit/outbox events, Evidence/Truth boundaries, ARAG release assurance, and a global execution gate are implemented. Broad authenticated and consumer-level acceptance is incomplete for several workflows.

## 7. Execution Plane

The durable production execution plane is absent or disabled. Workbench task/approval state is browser-local; simulations persist plans and proposed actions but never execute production mutations. `/runs/execute` is protected by the global gate and admin key and is not a production workforce engine.

## 8. Alignment Layer

`services/shf-agent-fabric/routers/alignment` implements `/align/run`, requiring `APP_GATEWAY_KEY`, resolving the canonical app registry, applying containment, capability allowlists, L25 policy, L26 blocks, and audit logging. The alignment store is a registry view.

## 9. Mode Semantics

OFF denies app execution. LIMITED permits only safe default capabilities (`read`, `summarize`, `draft_text`, `draft_report`) and blocks high-risk requests unless ON. ON still requires allowlists, containment, global gates, admin authorization, and downstream approval. Mode changes are registry/control changes; no production mode was enabled.

## 10. Agent Identity

AI Governance records agent identifier, human principal, org, tenant, delegation, model, and session. A durable production identity spanning task, worker, retry, and final action is not implemented.

## 11. Human Principal / Delegation

Delegation is finite, same-principal, same-org/tenant, explicit-resource/action, permission-subset constrained, non-redelegable, and revocable. It is implemented and tested, but does not create an executor.

## 12. Agent Sessions

`ai_agent_sessions` persists principal, agent, org/tenant, delegation, purpose, autonomy profile, provider/model, status, timestamps, and security metadata. Expiry/revocation/close behavior is tested. Active work restart semantics are absent.

## 13. Durable Work State

No canonical durable worker/queue/resume state exists. This is a P1 product gap for future production execution.

## 14. Work Request / Task Authority

Workbench is a local operator model; `ai_agent_simulations` is durable but simulation-only. Neither is a production task authority with leases, workers, cancellation, and terminal delivery outcomes.

## 15. Task Lifecycle

Simulation/proposed-action states are persisted. A complete production request-to-terminal lifecycle is absent.

## 16. Tool Authorization

Tools are permission-, delegation-, session-, resource-, classification-, allowlist-, risk-, and side-effect-aware. Mutating MCP actions require approval and remain simulation-only.

## 17. Governed MCP

Server approval/lifecycle, discovery, tool policy, resource policy, Input Security scanning, context admission, read-result provenance, and safe failure recording exist. Full production MCP side effects are disabled.

## 18. Resource Access

Agent requests use owning-domain scope, org/tenant predicates, explicit resource lists, and classifications. Agent Fabric is not a superuser bypass.

## 19. Classification-Aware Access

PUBLIC, INTERNAL, SENSITIVE, and RESTRICTED ceilings are implemented in AI Governance/MCP. Cross-domain live acceptance remains open.

## 20. Input Security

The Input Security gateway scans content, detects injection/tool/privilege manipulation, supports review and context admission, and fails closed for unscanned or blocked input. Downstream production execution enforcement is not yet applicable.

## 21. Secrets Boundary

MCP uses credential references and read-result contracts do not return provider secrets. Production secret-manager rotation and worker isolation are not established.

## 22. Provider / Model Abstraction

The approved model catalog records provider/model lifecycle, approval, classification ceiling, and constraints. No production provider execution was accepted.

## 23. Development Environment Adapters

Codex, Claude, and Cursor references are development/documentation context, not accepted production adapters. No external-provider claim is made.

## 24. Consequence Classification

MCP side-effect classes and risk levels distinguish read-only and consequential proposals. Simulation marks external, deployment, permission, and delegation proposals high/critical and never executes them. A universal taxonomy is not complete.

## 25. Human Approval Gates

Domain permissions and approval profiles exist for AI governance, MCP, simulations, ARAG, reporting, credentials, and other owning domains. Approval is not blanket autonomy.

## 26. Stale Approval Protection

ARAG binds approval to a subject hash and simulations bind proposed actions to simulation context. A universal stale-approval contract is not present.

## 27. Execution Containment

Alignment containment, global layer gate, mode guard, capability allowlists, admin checks, MCP bounds, and simulation-only restrictions are enforced. A production sandbox/worker isolation contract is absent.

## 28. Command Execution

No accepted production shell executor exists. Run routes are admin-key protected, plan-validated, and globally gated.

## 29. Network Access

MCP HTTP transport rejects unsafe endpoints and oversized/timeout responses. Arbitrary production internet access is not accepted.

## 30. External Side Effects

Messages, webhooks, public approval, warehouse writes, auth mutation, financial actions, and deployment remain blocked or owned by separate human-authorized domains. Simulation proposes only.

## 31. Revocation

Delegation revocation, session close/expiry, app/layer containment, and permission checks exist. Active worker propagation is N/A because no production worker exists.

## 32. Cancellation

Workbench can change local task status; no canonical active-worker cancellation operation exists.

## 33. Emergency Stop

Layer disable, global gate, and app containment provide operator blocking. Per-worker kill semantics are absent because workers are disabled.

## 34. Failure Handling

Policy denial, unsafe input, MCP disable/revoke, invalid endpoint, timeout, and simulation failures are safely represented. Durable production worker failure handling is absent.

## 35. Retry

Outbox and domain patterns record retry/quarantine; a production work retry contract preserving approval and side-effect identity is absent.

## 36. Resume / Recovery

Simulation records can be read back, but production work cannot safely resume after worker/API/provider restart. P1 product gap.

## 37. Idempotency

Governance, simulation, MCP, and outbox records use stable IDs/keys. End-to-end external side-effect idempotency is not accepted because no production side-effect worker exists.

## 38. Operational Events

Governance, simulation, MCP, Input Security, and awareness services emit scoped events. The Python operational event service explicitly sets `production_ready: false` and `PRODUCTION_DURABILITY_APPROVED = False`.

## 39. Audit Logging

Applicable logs record principal, agent, org/tenant, policy decision, resource/tool, status, and time. Unified production trace coverage is incomplete.

## 40. Evidence Boundary

Agent logs and simulations are provenance inputs only; they do not automatically become verified Evidence.

## 41. Truth Spine Boundary

Truth Spine remains authoritative. Agent Fabric cannot directly create accepted Truth claims.

## 42. Oracle Boundary

Oracle provides interpretation/decision support; Agent Fabric cannot override its rulings or convert recommendations into authority.

## 43. ARAG-1 Boundary

Studio artifact, QA, Review, ARAG approval, and release remain separate. Agent assistance cannot bypass subject-hash approval.

## 44. Studio Boundary

Agents may assist with governed preparation/simulation, while Project, Workspace, Artifact, QA, Review, and Release remain their canonical authorities.

## 45. CivicSure Boundary

Agents may summarize, flag anomalies, and support awareness. Assurance, funding, public, and provider decisions remain domain/human authorized.

## 46. Education Boundary

Agents cannot arbitrarily set grades, mastery, credentials, verified outcomes, or institutional reports.

## 47. Funding Boundary

Funding services remain canonical. Agent recommendations cannot disburse funds or change obligations.

## 48. Production Workforce Execution

WF-040 would require durable request/session/task state, governed worker/provider/tools, approval, revocation, recovery, and terminal outcomes. Current V1 has no accepted production worker.

## 49. WF-040 Safety Block

WF-040 remains `BLOCKED — SAFETY/POLICY`. The V1 lock/readiness documents prohibit real executor behavior, and the global execution gate protects `/runs/execute`.

## 50. Fail-Closed Enforcement

Focused tests verify simulation-only behavior. `/runs/execute` invokes `assert_global_execution_allowed` before execution; missing, disabled, or unready required layers block the request.

## 51. Development / Test Execution

Alignment evaluation, dry-run, Workbench local state, AI simulation, MCP simulation, and bounded reads are test/development surfaces, not production execution.

## 52. Autonomy Levels

AI Governance uses bounded profiles such as `LEVEL_1_RECOMMEND`; Alignment uses ON/LIMITED/OFF. No unrestricted autonomy exists.

## 53. Admin Controls

Admin routes cover agent registry, lifecycle/readiness/dry-run/health, layer control, and observability. Workbench task/approval state remains local V1 state.

## 54. Frontend Surfaces

`admin.html#/registry`, `admin.html#/agent-fabric`, `admin.html#/ops/agents`, and `/alignment` are internal governance surfaces. Public Agent Fabric surface: N/A.

## 55. Authorization / Isolation

Permissions, actor scope, org/tenant predicates, delegation, classification, and MCP scope checks are implemented. Full authenticated consumer acceptance remains open.

## 56. Cross-Org Access

Delegation requires same org/tenant and resource queries are scoped. No implicit cross-org access exists.

## 57. Persistence

| Store | Owner | Purpose | Durable/scoped |
|---|---|---|---|
| `ai_delegated_authorities` | AI Governance | Delegation | PostgreSQL, org/tenant, revocation/version |
| `ai_agent_sessions` | AI Governance | Session authority | PostgreSQL, org/tenant, lifecycle |
| `ai_approved_models` | AI Governance | Model policy | PostgreSQL, global/org scope |
| `ai_resource_classifications` | AI Governance | Classification | PostgreSQL, org/tenant, supersession |
| `ai_agent_simulations` and children | Simulation | Proposed work | PostgreSQL, org/tenant, immutable history |
| MCP tables | MCP | Governed MCP activity | PostgreSQL, org/tenant, provenance |
| Workbench queue | Agent Workbench | Operator visibility | localStorage, not shared durable |
| Agent JSONL ledgers | SHF Agent Fabric | V1 local audit | local, production durability unapproved |

## 58. Migrations

SHS migration head is 127. No SYS-6 migration was added. Existing governance schemas are additive and scoped.

## 59. Performance

Governance/MCP/simulation repositories use scoped lookups. No production queue scan exists; no new N+1 defect was identified.

## 60. Observability

Health/readiness, admin summaries, operational awareness, outbox status, denial codes, audit/event ledgers, and provider/error metadata exist. Worker SLOs are N/A.

## 61. Security Events

Denied authority/tools, blocked input, MCP failures, simulation policy denials, and operational events are recorded in applicable stores. A unified incident model is incomplete.

## 62. Incident Response

Admins can inspect governance, MCP, simulation, Input Security, and awareness records. Worker quarantine and kill-by-task are not implemented.

## 63. Existing Acceptance Evidence

Fresh focused evidence: 73 Python Agent Fabric governance/security tests passed; 36 API AI Governance/MCP/Input Security/Simulation tests passed; alignment/runtime Python entrypoints compiled. Existing V1 reports provide browser proof for admin visibility and safe simulation. Production autonomy was not attempted.

## 64. External Dependencies

Model providers, MCP servers, cloud execution, queues, and secret managers are provider/configuration dependencies. No external dependency was used to mask repository-local control gaps. WF-049 remains separate.

## 65. Azure

`N/A — NO MANDATORY AZURE-BACKED SYS-6 WORKFLOW PRESENT`. No Azure provisioning occurred.

## 66. Product Gap vs Safety Block

WF-037/WF-038 are product gaps for durable production runtime and side-effect execution. WF-036/WF-039/WF-041 are acceptance gaps for broad live proof. WF-040 is a deliberate safety/policy block.

## 67. Control-Plane Matrix

| Capability | Implemented | Live-proven | Production-safe | Gap |
|---|---|---|---|---|
| Identity/scope | Yes | Focused | Bounded | Broad HTTP matrix |
| Delegation | Yes | API tests | Bounded | Worker propagation |
| Policy/containment | Yes | Focused/static | Yes for V1 | Runtime acceptance |
| Approval | Yes | Domain tests | Bounded | Universal stale/replay proof |
| Tool/resource governance | Yes | MCP tests | Simulation/read safe | Production runner |
| Revocation/audit | Yes | Focused | V1 bounded | Active worker/trace |
| Evidence/Truth | Separate | Boundary tests | Yes | Consumer trace |

## 68. Execution-Plane Matrix

| Capability | Exists | Durable | Restart-safe | Production-enabled | Gap |
|---|---|---|---|---|---|
| Task | Local/simulation | Partial | No | No | Durable task authority |
| Session | Governance record | Yes as record | No active work | No | Worker binding |
| Worker/queue | No accepted worker | No | No | No | P1 product gap |
| Tool execution | Simulation/read | Partial | No side-effect runner | No | Governed runner |
| Retry/recovery | Domain/outbox only | Partial | No workforce resume | No | Durable contract |
| Cancellation/final outcome | Local/simulation | Partial | No | No | Worker lifecycle |

## 69. Safety Matrix

| Risk | Current control | Enforced | Gap |
|---|---|---|---|
| Unauthorized/cross-org action | permissions, delegation, scoped SQL | Yes | Broad acceptance |
| Prompt injection | Input Security/admission | Yes | Production pipeline integration |
| Tool abuse | allowlist/classification/approval | Yes | Side-effect runner absent |
| Secret exposure | credential references | Partial | Production secret manager |
| Deployment bypass | Studio/ARAG/global gate | Yes | Agent release execution remains off |
| Financial/Truth corruption | owning authority/human gates | Yes | Unified consequence model |

## 70. Workflow Completion Matrix

| Workflow | Trigger | Owner | Consumer | Success | Failure | Status | Gap |
|---|---|---|---|---|---|---|---|
| WF-036 | Governance request | AI Governance | API/admin | governed decision | deny/revoke | PARTIAL — ACCEPTANCE GAP | Live matrix |
| WF-037 | Authority/session request | AI Governance | runtime policy | bounded session | denied/expired | PARTIAL — PRODUCT GAP | Durable runtime |
| WF-038 | Tool/MCP request | MCP/AI Governance | gateway | simulation/read | denied/quarantined | PARTIAL — PRODUCT GAP | Production runner |
| WF-039 | Result handoff | adapters/Evidence/Truth | canonical consumers | accepted fact | unverified/rejected | PARTIAL — ACCEPTANCE GAP | End-to-end trace |
| WF-040 | Workforce request | Agent Fabric | none in V1 | N/A | blocked | BLOCKED — SAFETY/POLICY | Intentional block |
| WF-041 | MCP use | MCP | gateway | governed read | denied/revoked | PARTIAL — ACCEPTANCE GAP | Full matrix |
| WF-043 | Operational signal | Operations | brief/outbox | scoped brief | bounded failure | COMPLETE | None |

## 71. P0/P1/P2/P3 Gaps

P0: no new control-plane P0 defect found. P1: durable task/session/worker state, governed side-effect runner, restart/resume, cancellation/revocation propagation, and broad acceptance. P2: unified incident/trace hardening and provider/secret operations. P3: Workbench UX and local duplicate-key cleanup.

## 72. Minimum Safe Production Architecture

Before reconsidering WF-040: durable task/session authorities, delegation/action hashes, classification-aware resources, governed tools/MCP, isolated secrets, consequence classes, human approval, leases/idempotency, retry/quarantine, restart/resume, cancellation/revocation, emergency stop, immutable audit/Evidence, incidents, provider contracts, and bounded final actions. Initial use should be supervised and reversible.

## 73. Recommended SYS-6 Phasing

1. SYS-6B: durable identity/delegation/session/task foundation, still non-production.
2. SYS-6C: governed tools/MCP/resources/secrets/input-security execution boundary.
3. SYS-6D: durable worker retry/recovery/cancellation/revocation and incidents.
4. SYS-6E: consequence-aware approval and bounded pilot acceptance.
5. Reconsider WF-040 only after separate safety/policy approval.

## 74. Files Created

`docs/architecture/SYS-6A_AGENT_FABRIC_PRODUCTION_EXECUTION_GOVERNANCE_REBASELINE_SAFETY_GAP_AUDIT_REPORT.md`

## 75. Files Modified

Workflow Registry, Dependency Graph, and Completion Roadmap received SYS-6A documentation rebaseline notes only. No production code, migration, flag, or provider configuration changed.

## 76. Owner Work Preservation

No reset, stash, clean, rebase, checkout, commit, push, deletion, migration rewrite, deployment, cloud provisioning, or production execution occurred.

## 77. SYS-6 Rebaseline Decision

**SYS-6A AGENT FABRIC PRODUCTION EXECUTION / GOVERNANCE REBASELINE COMPLETE — SYS-6 IMPLEMENTATION INCOMPLETE**

## 78. Recommended SYS-6B

**SYS-6B — Durable Agent Identity / Delegation / Session / Task Foundation**. This phase was not started.

## SYS-6C Evidence Update - 2026-09-10

SYS-6C implemented and authenticated-HTTP proven the bounded durable execution
foundation associated with WF-038: scoped workers, atomic claims, leases,
attempt/checkpoint history, retry and expiry recovery, cancellation, authority
revocation propagation, safe task allowlisting, idempotency, and the disabled
execution gate. WF-038 is complete for this bounded contract. WF-036, WF-039,
and WF-041 remain acceptance work. WF-040 remains `BLOCKED — SAFETY/POLICY` and
no unrestricted production execution was enabled. SYS-6D consequence-aware
approval/incident/revocation acceptance is recommended next.

## SYS-6D Rebaseline Evidence - 2026-09-10

Fresh SYS-6D audit confirms bounded execution evidence and finds generic
consequential Agent Tasks lack a durable approval record, exact action binding,
approver decision lifecycle, and authenticated approval consumer. WF-036 is
`PARTIAL — PRODUCT GAP`; WF-039 and WF-041 remain `PARTIAL — ACCEPTANCE GAP`;
WF-040 remains `BLOCKED — SAFETY/POLICY`. No production execution was enabled.
