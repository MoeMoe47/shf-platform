# Agent Approval Ledger + Safe Execution Stub V1

Date: 2026-06-23

## Executive Summary

Agent Approval Ledger + Safe Execution Stub V1 adds the next safe bridge after Agent Workbench, Task Queue, and Canonical Workforce V1.

It records local approval decisions, shows approval/execution-readiness visibility in the Agent Workbench, and allows a safe stub to simulate readiness checks. It does not enable autonomous execution or perform real production work.

This V1 does not mutate production records, publish reports, mutate SHF Impact Data Spine, mark `public_approved`, send webhooks, send notifications, write warehouse records, call external APIs, create backend persistence, bypass human approval, bypass Truth Spine, bypass Oracle, bypass Policy Engine, or bypass Data Approval Gateway.

Machine-readable report: `docs/AGENT_APPROVAL_LEDGER_SAFE_EXECUTION_STUB_V1.json`.

## What Was Built

- Canonical frontend-local approval ledger data model.
- Canonical safe execution stub data model.
- Local approval ledger storage in `src/data/agents/agentApprovalLedger.js`.
- Local safe execution stub storage and eligibility checks in `src/data/agents/agentSafeExecutionStub.js`.
- Workbench Approval Ledger table.
- Workbench Safe Execution Panel for the selected task.
- Task Detail ledger/stub readiness fields.
- Task audit events for approval ledger creation and stub runs.
- Validator script: `scripts/check_agent_approval_safe_execution.py`.
- Package script: `npm run check:agent-approval-stub`.

## Approval Ledger Model

```json
{
  "approval_id": "approval_001",
  "task_id": "",
  "agent_id": "",
  "requested_action": "",
  "approval_status": "pending|approved|rejected|revoked",
  "approved_by": "",
  "approved_at": "",
  "risk_level": "low|medium|high|critical",
  "requires_human_approval": true,
  "governance_refs": [],
  "operator_note": "",
  "safe_execution_stub_status": "not_checked|eligible|blocked|simulated",
  "execution_allowed_v1": false,
  "production_action_executed": false,
  "report_published": false,
  "public_data_mutated": false,
  "public_approved_mutated": false,
  "shf_impact_data_mutated": false,
  "external_message_sent": false,
  "webhook_sent": false,
  "warehouse_write_performed": false,
  "created_at": "",
  "updated_at": "",
  "audit_events": []
}
```

All dangerous execution flags are forced false.

## Safe Execution Stub Model

```json
{
  "stub_run_id": "stub_001",
  "task_id": "",
  "agent_id": "",
  "requested_action": "",
  "approval_id": "",
  "stub_status": "blocked|eligible|simulated",
  "eligibility_checks": [],
  "blocked_reasons": [],
  "simulated_steps": [],
  "operator_message": "",
  "execution_allowed_v1": false,
  "production_action_executed": false,
  "report_published": false,
  "public_data_mutated": false,
  "public_approved_mutated": false,
  "shf_impact_data_mutated": false,
  "external_message_sent": false,
  "webhook_sent": false,
  "warehouse_write_performed": false,
  "created_at": ""
}
```

The stub records readiness simulation only. It never executes the requested action.

## Workbench Integration

- Route remains `admin.html#/ops/agents`.
- Approval actions still change local task status only.
- Approving a task creates an approval ledger record.
- Rejecting a task creates a rejected ledger record and keeps stub readiness blocked.
- Running the safe stub creates a local stub result and appends a task audit event.
- The approval ledger shows approval ID, task ID, agent, approval status, risk, approver, approval timestamp, stub status, and dangerous flag summary.
- The safe execution panel shows approval presence, stub eligibility, blocked reasons, simulated steps, and all dangerous flags as false.
- Reset Queue clears the task queue, approval ledger, and stub results from localStorage.

## Eligibility Rules

Safe Execution Stub V1 can simulate only when:

- Task exists.
- Agent exists.
- Task approval status is `approved`.
- Approval ledger has an approved record.
- Agent dangerous flags are false.
- Task risk level is not `critical`.
- Requested action is not in the agent blocked capability list.
- Requested action does not request publish/public approval/webhook/notification/warehouse/auth mutation.

The stub blocks when:

- Approval is missing.
- Approval is rejected.
- Risk is critical.
- Agent is not found.
- Requested action is blocked.
- Task requests publishing, public approval, webhook, notification, warehouse, SHF Impact Data Spine, or auth mutation.

## Safety Boundaries

Every approval and stub record includes:

- `execution_allowed_v1: false`
- `production_action_executed: false`
- `report_published: false`
- `public_data_mutated: false`
- `public_approved_mutated: false`
- `shf_impact_data_mutated: false`
- `external_message_sent: false`
- `webhook_sent: false`
- `warehouse_write_performed: false`

The Workbench displays:

> Safe Execution Stub V1 simulates readiness only. No production action, report publishing, public data mutation, webhook, notification, warehouse write, or SHF Impact Data Spine mutation occurs.

## What V1 Does Not Do

- Does not enable autonomous production execution.
- Does not mutate production records.
- Does not publish reports.
- Does not mutate SHF Impact Data Spine.
- Does not mark `public_approved`.
- Does not send external messages.
- Does not send webhooks.
- Does not send notifications.
- Does not write warehouse records.
- Does not modify auth or permissions.
- Does not add external API calls.
- Does not add backend persistence, database tables, or migrations.
- Does not bypass Truth Spine, Oracle, Policy Engine, Readiness Gate, Audit & Verification, Production Automation, Notification / Alert, or Data Approval Gateway.

## Validation Results

| Check | Result |
| --- | --- |
| `python3 -m json.tool docs/AGENT_APPROVAL_LEDGER_SAFE_EXECUTION_STUB_V1.json` | PASS |
| `python3 -m py_compile scripts/check_agent_approval_safe_execution.py` | PASS |
| `python3 scripts/check_agent_approval_safe_execution.py` | PASS |
| `node_modules/.bin/tsx` module eligibility smoke | PASS |
| `npm run check:governance` | PASS |
| `bash scripts/run_daily_governance_audit.sh` | PASS |
| `bash scripts/run_paid_launch_checks.sh` | PASS |
| `npm run build` | PASS with existing large chunk warning |

## Browser Smoke Results

| Smoke Check | Result |
| --- | --- |
| `admin.html#/ops/agents` loads | PASS |
| Approval Ledger section visible | PASS |
| Safe Execution Panel visible | PASS |
| Approve task creates approval record | PASS |
| Rejected task does not become eligible | PASS |
| Approved low/medium task can run safe stub simulation | PASS |
| Critical risk task blocks stub | PASS in module eligibility smoke; browser storage seeding unavailable |
| Blocked requested action blocks stub | PASS in module eligibility smoke; browser storage seeding unavailable |
| All dangerous flags remain false | PASS |
| Refresh preserves approval ledger in localStorage | PASS |
| No execution button exists other than safe stub simulation | PASS |
| client_admin/public route access | Not rerun; route/access files unchanged in this task |

## Remaining Risks

- Approval ledger and stub results are localStorage-only.
- Approval history is browser-local and not shared across operators.
- Safe Execution Stub V1 is deterministic frontend simulation only.
- No real executor exists by design.
- Route access guards were not changed in this task.

## V1 Complete

Yes.
