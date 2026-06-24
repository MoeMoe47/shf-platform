# Agent Workbench V1 + Agent Task Queue V1

Date: 2026-06-23

## Executive Summary

Agent Workbench V1 turns the Agent Fabric foundation into an operator-controlled command center for SHS agent visibility, safe local task review, approval status changes, audit history, and deterministic task metrics.

This V1 does not enable autonomous production execution. Approval changes task status only. No production records, public data, SHF Impact Data Spine records, report publication state, external messages, webhooks, notifications, or warehouse records are mutated.

## What Was Built

- New admin route: `admin.html#/ops/agents`
- SHS V1 workforce definitions for 8 required agents, aligned with `docs/AGENT_CANONICAL_WORKFORCE_CAPABILITY_MATRIX_V1.json`.
- Frontend localStorage-backed task queue.
- Task detail view with intended action, agent recommendation, governance checks, blockers, warnings, and allowed next actions.
- Human approval controls for safe status-only actions.
- Local audit timeline for task creation, approval changes, task status changes, and operator notes.
- Deterministic performance snapshot for task counts, approval rate, per-agent counts, and last activity.
- Sidebar navigation entry: `Agent Workbench`.
- SHS-admin-only route protection.

## Agent Workforce

The SHS Agent Workforce V1 is defined in `src/data/agents/shsAgentWorkforce.js` and formalized in `docs/AGENT_CANONICAL_WORKFORCE_CAPABILITY_MATRIX_V1.json`.

| Agent ID | Name | Risk | Owner |
| --- | --- | --- | --- |
| `shs_sales_agent` | SHS Sales Agent | medium | Silicon Heartland Solutions |
| `shs_project_agent` | SHS Project Agent | medium | Silicon Heartland Solutions |
| `shs_library_agent` | SHS Development Library Agent | low | Silicon Heartland Solutions |
| `shs_qa_agent` | SHS QA Agent | medium | Silicon Heartland Solutions |
| `shs_clientops_agent` | SHS ClientOps Agent | high | Silicon Heartland Solutions |
| `shs_report_agent` | SHS Report Agent | high | Silicon Heartland Solutions |
| `shs_governance_agent` | SHS Governance Agent | high | Silicon Heartland Solutions |
| `shs_executive_agent` | SHS Executive Agent | high | Silicon Heartland Solutions |

Every workforce agent has:

- `id`
- `name`
- `role`
- `owner`
- `risk_level`
- `status`
- `allowed_capabilities`
- `blocked_capabilities`
- `requires_human_approval_for`
- `default_task_types`
- `can_execute_production_actions: false`
- `can_publish_reports: false`
- `can_mutate_public_data: false`
- `can_mark_public_approved: false`
- `can_mutate_shf_impact_data: false`
- `can_send_external_messages: false`
- `can_send_webhooks: false`
- `can_write_warehouse_records: false`
- `can_modify_auth: false`
- `audit_required: true`
- `human_approval_required: true`

## Task Queue Model

The canonical V1 frontend model is implemented in `src/data/agents/agentTaskQueue.js` and persisted through `src/data/agents/agentTaskStorage.js`.

Fields:

- `task_id`
- `title`
- `task_type`
- `assigned_agent_id`
- `source_system`
- `priority`
- `risk_level`
- `status`
- `approval_status`
- `intended_action`
- `agent_recommendation`
- `operator_note`
- `created_at`
- `updated_at`
- `blockers`
- `warnings`
- `audit_events`

Allowed statuses:

- `draft`
- `queued`
- `in_review`
- `approved`
- `rejected`
- `completed`
- `blocked`

Approval statuses:

- `not_required`
- `required`
- `approved`
- `rejected`

## Approval Model

The UI allows operators to:

- Approve task
- Reject task
- Mark complete
- Return to review
- Add operator note

V1 rule: approval does not execute production action. Approval only changes local task queue state and appends an audit event.

## Audit Model

Each task carries local `audit_events`. V1 events include:

- `task_created`
- `approval_changed`
- `task_status_changed`
- `note_added`

Audit events include event ID, event type, actor, message, and timestamp.

## UI Routes

- `admin.html#/ops/agents`: Agent Workbench V1
- Existing related route preserved: `admin.html#/agent-fabric`

## Access Control

- `src/router/AdminRoutes.jsx` mounts `/ops/agents`.
- `src/system/identity/hubAccessControl.js` restricts `/ops/agents` to `shs_admin`.
- `src/components/admin/AdminSidebar.jsx` adds the Agent Workbench sidebar item.
- `client_admin` and public users are not allowed by route access rules.

## V1 Safety Boundaries

Agent Workbench visibly states:

> Agent Workbench V1 is operator-controlled. Agents do not execute production actions in V1. Human approval changes task status only.

Hard V1 boundaries:

- No autonomous production execution.
- No production record mutation.
- No report publishing.
- No SHF Impact Data Spine mutation.
- No `public_approved` mutation.
- No external API calls.
- No webhooks.
- No notifications.
- No warehouse writes.
- No database migrations.

## Files Created

- `src/data/agents/shsAgentWorkforce.js`
- `src/data/agents/agentTaskQueue.js`
- `src/data/agents/agentTaskStorage.js`
- `src/data/agents/agentTaskMetrics.js`
- `src/pages/admin/agents/AgentWorkbenchPage.jsx`
- `src/pages/admin/agents/components/AgentOverviewPanel.jsx`
- `src/pages/admin/agents/components/AgentTaskQueue.jsx`
- `src/pages/admin/agents/components/AgentTaskDetail.jsx`
- `src/pages/admin/agents/components/AgentApprovalPanel.jsx`
- `src/pages/admin/agents/components/AgentActivityTimeline.jsx`
- `src/pages/admin/agents/components/AgentPerformanceSnapshot.jsx`
- `src/pages/admin/agents/agentWorkbench.css`
- `docs/AGENT_WORKBENCH_TASK_QUEUE_V1.md`
- `docs/AGENT_WORKBENCH_TASK_QUEUE_V1.json`
- `docs/AGENT_CANONICAL_WORKFORCE_CAPABILITY_MATRIX_V1.md`
- `docs/AGENT_CANONICAL_WORKFORCE_CAPABILITY_MATRIX_V1.json`

## Files Modified

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`

## Validation Results

| Check | Result |
| --- | --- |
| `python3 -m json.tool docs/AGENT_WORKBENCH_TASK_QUEUE_V1.json` | PASS |
| `npm run check:governance` | PASS |
| `bash scripts/run_daily_governance_audit.sh` | PASS |
| `bash scripts/run_paid_launch_checks.sh` | PASS |
| `npm run build` | PASS, with existing large chunk warning |
| Manual browser smoke: `admin.html#/ops/agents` loads | PASS |
| Manual browser smoke: Agent Workbench title visible | PASS |
| Manual browser smoke: Agent Overview visible | PASS |
| Manual browser smoke: Task Queue visible | PASS |
| Manual browser smoke: Task Detail visible | PASS |
| Manual browser smoke: Approval Panel visible | PASS |
| Manual browser smoke: Activity Timeline visible | PASS |
| Manual browser smoke: Performance Snapshot visible | PASS |
| Manual browser smoke: approve simulated status change | PASS |
| Manual browser smoke: reject simulated status change | PASS |
| Manual browser smoke: complete simulated status change | PASS |
| Manual browser smoke: localStorage survives refresh | PASS |
| Manual browser smoke: client_admin blocked/redirected | PASS, redirected to `/hub` |
| Manual browser smoke: public/no-session blocked | PASS, redirected to login during initial route access |

Build note: Vite reported the pre-existing large chunk warning.
Local browser smoke note: Vite logged non-blocking `/auth/me` proxy errors because the local auth backend on `127.0.0.1:8091` was not running. The Agent Workbench route still rendered and task actions passed.

## Remaining Risks

- V1 queue persistence is browser localStorage, not shared backend persistence.
- Approval history is local to the browser profile.
- The workbench still consumes frontend data directly; the backend canonical `contracts/agents/agents.json` now includes matching SHS V1 agent IDs for registry alignment.
- There is no real executor, by design.
- Browser-local smoke state may persist in the local browser until the queue is reset.
- Local dev may log non-blocking `/auth/me` proxy errors when the auth backend is not running.

## V1 Complete

Yes.
