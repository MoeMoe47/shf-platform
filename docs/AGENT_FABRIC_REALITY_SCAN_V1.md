# Agent Fabric Reality Scan V1

Date: 2026-06-23

## Executive Verdict

Agent Fabric V1 is real as a governed registry, admin visibility surface, dry-run/simulation surface, and audit ledger. It is not yet real as an end-to-end SHS agent workforce that receives operational tasks, assigns them to named SHS agents, executes real tools/actions, records task outcomes, retries failures, tracks performance, and exposes a complete workbench queue/approval flow.

The strongest implemented pieces are the canonical agent registry, backend admin routes, registry verification, hash-chained agent events, ON/LIMITED/OFF-style containment flags, layer gate checks, and the dedicated admin page at `admin.html#/agent-fabric`.

The main V1 gaps are:

- No canonical Agent Task Queue V1 for pending/assigned/running/failed/completed agent tasks.
- No real executor wired to `contracts/agents/agents.json`.
- No named SHS workforce agents for Sales, Project, Development Library, QA, ClientOps, Governance, or Executive operations.
- Human approval exists as policy metadata and `/runs/execute approved=true`, but not as a canonical agent approval workflow with reviewer/state/history per task.
- Agent memory exists as declared `memoryScope` fields, not as persisted per-agent memory retrieval.
- Agent performance is mostly readiness counts; there are no durable per-agent success/failure/duration/quality/approval-rate metrics.

## Files And Areas Scanned

- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/FINAL_MASTER_LAYER_REGISTRY_V1_COMPLETION_REAUDIT.md`
- `docs/AI_SWARM_GUARDRAILS_V1.md`
- `docs/AGENT_GOVERNANCE_FABRIC_AUDIT_V1.md`
- `docs/TRUTH_SPINE_GUARDRAILS.md`
- `docs/AGENT_FABRIC_ADMIN_PAGE_V1.md`
- `services/shf-agent-fabric/`
- `services/shf-agent-fabric/routers/`
- `services/shf-agent-fabric/services/`
- `services/shf-agent-fabric/contracts/`
- `services/shf-agent-fabric/contracts/agents/`
- `services/shf-agent-fabric/db/`
- `services/shf-agent-fabric/logs/`
- `src/pages/admin/`
- `src/pages/admin/agent-fabric/`
- `src/system/`
- `src/system/identity/`
- `src/system/routes/`
- `package.json`

Optional doc `docs/SHS_PRIVATE_BETA_OPERATOR_RUNBOOK_V1.md` was not present.

## 1. Agent Registry

Status: **PARTIAL**

What exists:

- Canonical registry: `services/shf-agent-fabric/contracts/agents/agents.json`
- Schema: `services/shf-agent-fabric/contracts/agents/agent_entity.schema.v1.json`
- Registry backend: `services/shf-agent-fabric/fabric/agent_canon.py`
- Admin routes: `services/shf-agent-fabric/routers/admin_agents_routes.py`
- Current canonical agent count: 11
- Registry fields include IDs, names, labels, layers, roles, lifecycle, version, visibility, capabilities, allowed tools, inputs, outputs, policy, memory scope, event logging, and health check.

Registered canonical agents found:

| Agent ID | Name | Human Approval | Visibility |
| --- | --- | --- | --- |
| `ai_analyst_agent` | AI Analyst Agent | no | user_visible |
| `oracle_truth_agent` | Oracle Truth Agent | no | internal |
| `verification_agent` | Verification Agent | yes | internal |
| `reconciliation_agent` | Reconciliation Agent | yes | internal |
| `watchtower_agent` | Watchtower Agent | no | internal |
| `impact_measurement_agent` | Impact Measurement Agent | no | internal |
| `impact_comparison_agent` | Impact Comparison Agent | no | internal |
| `hub_guide_agent` | Hub Guide Agent | no | user_visible |
| `hub_matching_agent` | Hub Matching Agent | yes | internal |
| `report_narrator_agent` | Report Narrator Agent | yes | user_visible |
| `adaptive_experience_agent` | Adaptive Experience Agent | no | internal |

Why not complete:

- The requested SHS Agent Workforce names do not exist as canonical registry entries.
- Risk levels are implicit through policy/approval and capabilities, not a clear per-agent risk-level field.
- There is a legacy separate registry under `services/shf-agent-fabric/registry/*.agent.json` with 3 agents used by older `/run` and `/plan` flows, creating a split from the canonical 11-agent registry.

## 2. Agent Governance / Guardrails

Status: **PARTIAL**

What exists:

- AI/Swarm guardrails document agent limits and Truth Spine/Oracle/Alignment requirements.
- Master Layer Registry bounds AI/Swarm, Alignment, Policy Engine, Governance, Layer Control, Production Automation, and Notification/Alert.
- AI Guardrails backend routes and local policy/decision JSON files exist.
- Containment flags exist at `services/shf-agent-fabric/db/alignment/containment_flags.json` with `treasury: LIMITED`, empty blocked agents, and empty blocked capabilities.
- Agent enable/disable and layer enable/disable overrides exist through `agent_store.py`.
- Global execution gate exists in `fabric/layers/global_gate.py`.
- Agent event ledger exists and verifies hash chaining.

What works:

- Admin agent routes require admin key.
- Agents can be enabled/disabled.
- Agent lifecycle can be changed.
- Ledger verification is implemented.
- AI guardrails and Truth Spine docs explicitly block AI from verifying, public-approving, issuing Oracle rulings, or executing without Alignment approval.

Why not complete:

- Guardrails are strong around registry/admin/dry-run behavior, but there is no canonical real agent executor wired through these controls.
- Human approval and Alignment requirements are policy statements plus local checks, not a full task approval pipeline.

## 3. Agent Execution

Status: **PARTIAL**

What exists:

- `/admin/agents/{agent_id}/dry-run` simulates an agent against supplied context.
- `/admin/agents/{agent_id}/page-context-dry-run` simulates page/context handoff.
- `/admin/agents/summary/execution-readiness` classifies agents as `auto_ready`, `approval_required`, or `blocked`.
- Legacy `/run` can execute deterministic/stub logic against `services/shf-agent-fabric/registry/*.agent.json`.
- `/runs/execute` can write draft artifacts from stored plans after admin key and approval.
- `/api/v1/execution/create` and `/api/v1/execution/execute` can queue/mark generic execution actions in a separate sqlite table path.

What is simulated:

- Canonical 11-agent admin dry-runs.
- Page-context dry-runs.
- Execution-readiness classification.
- Planner output.

What is deterministic:

- The older `Layer09CaseSupportAgent` path in `/run`.
- Plan validation and artifact-writing in `/runs/execute`.

What is real:

- Admin-approved `/runs/execute` can write draft artifacts to `db/artifacts`.
- Generic execution action service can mark an action as `executed`.

What is not real yet:

- No canonical task receiver assigns work to one of the 11 agents in `contracts/agents/agents.json`.
- No canonical agent tool executor executes each agent's declared `allowedTools`.
- No consistent result/failure handling for the canonical 11-agent fabric.
- The main admin route explicitly says execution-readiness does not execute agents.

## 4. Agent Task Queue

Status: **MISSING**

Adjacent pieces:

- `db/plans/*.json` stores plans.
- `/runs/recent` reads `db/runs/events.jsonl`.
- `services/execution_service.py` has generic `execution_actions` create/execute functions.
- Some operational UI surfaces have queues unrelated to canonical Agent Fabric.

Missing for Agent V1:

- Canonical `agent_tasks` model.
- Pending/assigned/running/completed/failed task status.
- Agent assignment.
- Retry count and retry history.
- Task history and task-level audit.
- Queue workbench UI.

## 5. Agent Workbench UI

Status: **PARTIAL**

What exists:

- Dedicated page: `src/pages/admin/agent-fabric/AgentFabricPage.jsx`
- Route: `admin.html#/agent-fabric`
- Admin route mounted in `src/router/AdminRoutes.jsx`
- Cross-app bridge entry in `src/system/routes/crossAppRouteBridge.js`
- Registry page includes secondary agent visibility.

UI can show:

- Total/ready/warning/blocked summary.
- Canonical agents table.
- Selected agent detail.
- Capabilities.
- Human approval policy flag.
- Allowed/disallowed tasks.
- Governance boundaries.
- Layer gate status.
- Audit trace note.

Missing:

- Task queue.
- Approval inbox.
- Full event log stream.
- Run history per agent.
- Performance metrics.
- Agent control actions beyond refresh/read-only display.

## 6. Human Approval

Status: **PARTIAL**

What exists:

- Agent policy field `policy.humanApproval`.
- Execution-readiness classifies approval-required agents.
- `/run` blocks human-approval agents and returns a plan.
- `/runs/execute` requires `approved=true` when a plan has `approvalRequired`.
- UI displays whether selected agent requires human approval.

Missing:

- Approval records with reviewer, approval status, timestamp, reason, and task/action reference.
- Dedicated approval queue.
- Review/approve/reject UI.
- Canonical per-agent action gate.
- Approval audit trail tied to canonical `agent_tasks`.

## 7. Agent Memory / Context

Status: **PARTIAL**

What exists:

- Canonical agents declare `memoryScope`.
- Agent dry-runs consume caller-supplied context.
- Page-context dry-runs normalize selected entity/county/region, Truth/Oracle context, drawer context, map context, and UI state.
- Some surrounding SHS systems have persistent context stores, report records, Truth Spine records, run logs, and plan/artifact stores.

Missing:

- Durable per-agent memory store.
- Context retrieval service keyed by agent/task/client/project/report.
- Agent run/task history attached back into future context.
- Memory retention boundaries beyond declared `memoryScope`.

## 8. Agent Audit Trail

Status: **PARTIAL**

What exists:

- `services/shf-agent-fabric/db/agent_events.jsonl`
- Hash-chained append/verify code in `fabric/agent_event_ledger.py`
- `/admin/agents/events`
- `/admin/agents/verify`
- Admin upsert/delete/lifecycle/attestation/dry-run/page-context-dry-run log events.
- Current ledger observed: 156 events.

Also adjacent:

- `db/runs/events.jsonl`
- `db/runs.jsonl`
- `feedback_events` SQLAlchemy model
- operator events and Watchtower audit exports

Missing:

- Canonical task-level audit with who/what/when/why, input hash, output hash, approval reference, failure reason, rollback reference, and result status.
- Workbench event stream for operators.

## 9. Agent Capabilities Matrix

Status: **PARTIAL**

What exists:

- Per-agent `capabilities` arrays.
- Per-agent `allowedTools` arrays.
- UI shows capabilities and allowed/disallowed task concepts.
- AI/Swarm and Truth Spine guardrails define denied behaviors.
- Alignment containment flags can block agents/capabilities, though currently no blocked entries are populated.

Missing:

- A first-class matrix of allowed actions, denied actions, safe/risky capabilities, risk tier, required approval, required governance layers, and enforcement status per agent.
- Capability-level gate before tool execution.

## 10. Agent Performance

Status: **MISSING**

Adjacent pieces:

- `/admin/agents/summary/health` counts ready/warning agents.
- `/admin/agents/summary/execution-readiness` counts auto-ready/approval-required/blocked.
- General event schemas elsewhere support durations and outcomes.

Missing:

- Per-agent success/failure counts.
- Duration metrics.
- Quality score.
- Approval rate.
- Blocked task count.
- Last run timestamp.
- Performance panel in Agent Fabric UI.

## 11. SHS Agent Workforce Mapping

Status: **MISSING**

| Target Agent | Exists | Registry Entry | Capabilities | Task Type | Execution | Approval Gate | Audit Trail | UI Visibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sales Agent | no | no | no | no | no | no | no | no |
| Project Agent | no | no | no | no | no | no | no | no |
| Development Library Agent | no | no | no | no | no | no | no | no |
| QA Agent | no | no | no | no | no | no | no | no |
| ClientOps Agent | no | no | no | no | no | no | no | no |
| Report Agent | partial via `report_narrator_agent` | partial | yes | no canonical task type | dry-run/readiness only | policy flag yes | registry/dry-run events only | yes |
| Governance Agent | no | no | no | no | no | no | no | no |
| Executive Agent | no | no | no | no | no | no | no | no |

Notes:

- SHS operational surfaces exist for sales, projects, QA/delivery, ClientOps, reports, governance, and executive-style reporting, but those are app/workflow surfaces, not registered agents with task execution.
- `report_narrator_agent` is adjacent to Report Agent but is not a complete SHS Report Agent workforce member because it has no canonical task queue, execution loop, or approval workflow.

## 12. Real vs Framework Classification

| Area | Verdict |
| --- | --- |
| Framework complete? | Partial. Registry, admin APIs, dry-runs, UI, and audit ledger exist. |
| Governance complete? | Partial/mostly strong for non-execution boundaries; incomplete for real task execution. |
| Registry complete? | Partial. Canonical 11-agent registry exists; SHS workforce registry is missing. |
| Workbench complete? | Partial. Read-only/admin visibility exists; queue/approval/log/performance workbench is missing. |
| Execution complete? | Missing for canonical agents. Legacy/stub/draft-artifact execution exists separately. |
| Human approval complete? | Partial. Policy and approved execution flag exist; approval workflow is missing. |
| Task queue complete? | Missing. |
| Agent workforce complete? | Missing. |

## 13. Agent V1 Completion Plan

### Phase 1: Agent Fabric Reality Lock

- Declare `contracts/agents/agents.json` as the only V1 canonical workforce registry.
- Decide whether to migrate or retire the legacy `services/shf-agent-fabric/registry/*.agent.json` path.
- Add explicit per-agent fields for `riskLevel`, `taskTypes`, `approvalMode`, `executionMode`, and `ownerLayer`.
- Create an Agent Capability Matrix document/data file from canonical registry fields.
- Define the SHS Agent V1 workforce:
  - Sales Agent
  - Project Agent
  - Development Library Agent
  - QA Agent
  - ClientOps Agent
  - Report Agent
  - Governance Agent
  - Executive Agent

### Phase 2: Agent Workbench V1

- Add canonical `agent_tasks` storage with task ID, agent ID, status, requester, input, approval state, result, failure, retry count, timestamps, and audit references.
- Add task creation/list/detail routes.
- Add assignment and status transition rules.
- Add human approval records with reviewer, decision, reason, and action gate.
- Extend Agent Fabric UI with queue, approvals, logs, and per-agent run/task history.

### Phase 3: Safe Execution Engine V1

- Wire canonical agents to a safe executor that checks:
  - agent enabled
  - lifecycle active
  - layer gate
  - policy engine
  - AI Guardrails
  - Alignment/containment flags
  - capability allowlist
  - human approval when required
- Start with no-side-effect draft/read-only tools.
- Record every run to a task-level audit ledger.
- Add success/failure/duration/quality/approval-rate/blocked-count metrics.
- Add rollback references for any write-capable action before enabling production writes.

## Final Decision

Agent Fabric V1 should not be marked "real" as an operational SHS agent workforce yet.

It can be marked "real framework present" and "governed registry/workbench foundation present." To become Agent V1, the repo needs the canonical SHS workforce definitions, task queue, approval workflow, safe executor, task-level audit trail, memory/context retrieval, and performance metrics.
