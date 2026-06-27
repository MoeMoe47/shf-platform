# Agent Controlled Executor V1

Agent Controlled Executor V1 is the first controlled execution layer for the SHS Agent Workbench. It is human-approved, allowlisted, local-only, and simulation-first.

## Boundary

Controlled Executor V1 only performs approved local/internal actions. It does not execute production actions, publish reports, mutate SHF Impact Data Spine, mark public_approved, send external messages, write warehouse records, or modify auth.

## Allowed Local Actions

- `create_execution_record`
- `mark_task_simulated_complete`
- `add_operator_note`
- `attach_context_packet`
- `create_recommendation_packet`
- `mark_workflow_step_reviewed`
- `mark_coordination_handoff_reviewed`

## Blocked Actions

- `publish_report`
- `mark_public_approved`
- `mutate_shf_impact_data`
- `send_webhook`
- `send_notification`
- `write_warehouse_record`
- `mutate_auth`
- `mutate_production_record`
- `execute_shell`
- `call_external_api`
- `write_arbitrary_file`
- `bypass_approval`
- `bypass_governance`

## Eligibility

A request is eligible only when all of the following are true:

- The action type is allowlisted.
- The action type is not blocked.
- The agent exists in the canonical SHS Agent Workforce matrix.
- The request has task, workflow, or coordination context.
- An approved human approval ledger record exists.
- `human_approval_required` and `approval_required` are true.
- Risk is not `critical`.
- The agent capability matrix does not block the action.
- Context packets do not contain blocked items.
- Workflow and coordination contexts have no unresolved blockers.
- Dangerous execution flags remain false.
- The payload does not request production, public, external, warehouse, or auth mutation.

## Local Effects

V1 can write only browser-local Workbench state:

- Execution requests and records in localStorage.
- Simulated task completion in local task state.
- Operator notes on local task, workflow, and coordination state.
- Context packet links to local task or coordination state.
- Internal recommendation packets in localStorage.
- Workflow step review status in local Workflow Engine state.
- Coordination handoff review status in local Coordination Layer state.

## Backend Boundary

No backend executor endpoints are introduced in V1. There is no `/execute`, `/run`, or `/agent-executor/execute` route.

## UI

The Admin Agent Workbench exposes:

- Controlled Executor V1 panel.
- Allowlisted and blocked action types.
- Selected task, workflow, coordination, handoff, and context packet.
- Approval status.
- Eligibility blockers and warnings.
- Run Controlled Local Action button.
- Execution safety panel.
- Execution record table.
- Dangerous flags, all false.

## Validation

Run:

```bash
python3 scripts/check_agent_controlled_executor.py
npm run check:agent-controlled-executor
```
