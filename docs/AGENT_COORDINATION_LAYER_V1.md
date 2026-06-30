# Agent Coordination Layer V1

## Executive Summary

Agent Coordination Layer V1 turns the eight SHS Agent V1 roles into an operator-visible, human-supervised digital team. It adds safe coordination plans, workflow templates, agent handoff records, next-best-agent recommendations, dependency visibility, and coordination safety checks inside the Agent Workbench.

This is a planning, assignment, sequencing, handoff, summary, and review layer only. It does not add autonomous execution, executor endpoints, backend persistence, production mutation, report publishing, SHF Impact Data Spine mutation, public approval, webhooks, notifications, warehouse writes, external delivery, or auth changes.

## What Was Built

Created safe local data helpers:

- `src/data/agents/agentCoordinationPlans.js`
- `src/data/agents/agentCoordinationStorage.js`
- `src/data/agents/agentCoordinationTemplates.js`
- `src/data/agents/agentHandoffRecords.js`
- `src/data/agents/agentCoordinationMetrics.js`
- `src/data/agents/agentCoordinationSafety.js`

Created Workbench UI panels:

- `src/pages/admin/agents/components/AgentCoordinationPanel.jsx`
- `src/pages/admin/agents/components/AgentCoordinationPlanDetail.jsx`
- `src/pages/admin/agents/components/AgentHandoffTrail.jsx`
- `src/pages/admin/agents/components/AgentWorkflowTemplatePanel.jsx`
- `src/pages/admin/agents/components/AgentCoordinationSafetyPanel.jsx`

Updated:

- `src/pages/admin/agents/AgentWorkbenchPage.jsx`
- `src/pages/admin/agents/components/AgentSafeExecutionPanel.jsx`
- `src/pages/admin/agents/agentWorkbench.css`
- `src/data/agents/agentSafeExecutionStub.js`
- `package.json`

Created validator:

- `scripts/check_agent_coordination_layer.py`

## Coordination Plan Model

The canonical coordination plan model includes:

- `coordination_plan_id`
- `title`
- `workflow_type`
- `status`
- `priority`
- `risk_level`
- `owner_agent_id`
- `participating_agent_ids`
- `related_task_ids`
- `related_memory_ids`
- `related_context_packet_ids`
- `coordination_summary`
- `next_best_agent_id`
- `next_best_action`
- `human_review_required`
- `approval_required`
- `execution_enabled_v1`
- `created_at`
- `updated_at`
- `blockers`
- `warnings`
- `audit_events`
- dangerous execution flags, all false

All dangerous flags remain false:

- `execution_enabled_v1`
- `production_action_executed`
- `report_published`
- `public_data_mutated`
- `public_approved_mutated`
- `shf_impact_data_mutated`
- `external_message_sent`
- `webhook_sent`
- `warehouse_write_performed`

## Agent Handoff Model

The canonical handoff model includes:

- `handoff_id`
- `coordination_plan_id`
- `from_agent_id`
- `to_agent_id`
- `handoff_type`
- `handoff_summary`
- `included_task_ids`
- `included_memory_ids`
- `included_context_packet_ids`
- `status`
- `operator_note`
- `created_at`
- `updated_at`
- `audit_events`
- `human_review_required`
- `execution_enabled_v1`

Handoffs are internal review records only.

## Workflow Templates

Six safe workflow templates were added:

1. Sales to Delivery
2. Report Generation
3. QA Delivery
4. ClientOps Review
5. Governance Review
6. Launch Readiness

Each template defines:

- `workflow_type`
- `display_name`
- `default_owner_agent_id`
- `participating_agent_ids`
- `recommended_sequence`
- `required_context_types`
- `required_approval_points`
- `blocked_actions`
- `produces`
- `cannot_produce`

## Workbench Integration

The Agent Workbench now displays:

- Coordination plans.
- Workflow templates.
- Plan detail.
- Participating agents.
- Next best agent.
- Handoff trail.
- Blockers and warnings.
- Coordination metrics.
- Safety boundary flags.
- `execution_enabled_v1: false`.

Supported local actions:

- Create coordination plan from template.
- Mark plan in review.
- Approve plan status.
- Block plan.
- Complete plan.
- Create handoff between agents.
- Accept handoff.
- Reject handoff.
- Add operator note.

All actions are local/browser state only and append audit-style events.

## Memory / Context Integration

Coordination plans support:

- Included memory IDs.
- Included context packet IDs.
- Context packet count in plan detail.
- Blockers when linked context packets have blocked items.
- Warning when no context packet exists.

The memory/context layer remains unchanged and local-safe.

## Task Queue Integration

Coordination plans support:

- Related task IDs.
- Task counts in plan detail.
- Task-linked coordination visibility in the Safe Execution panel.

No production tasks, backend writes, or executor work are created.

## Approval / Safe Stub Integration

Coordination plans expose:

- `approval_required: true`
- Plan status such as draft, in review, approved, blocked, and completed.
- `execution_enabled_v1: false`

The Safe Execution Stub can see coordination plans linked to the selected task. Blocked coordination plans add a blocked reason to the stub evaluation. This does not enable execution.

## Safety Rules

Coordination is blocked or marked for review when:

- Workflow risk is critical.
- Any participating agent is missing.
- Requested actions include public approval, publishing, external delivery, webhook, warehouse write, auth mutation, SHF Impact Data Spine mutation, or production execution.
- Any linked context packet has blocked items.

## SHS / SHF Boundary Rules

Visible Workbench copy:

> Agent Coordination V1 coordinates internal SHS agent work only. It does not execute production actions, publish reports, create public-approved SHF impact data, send external messages, or write warehouse records.

Coordination V1 never:

- Publishes reports.
- Mutates SHF Impact Data Spine.
- Marks `public_approved`.
- Sends webhooks or notifications.
- Writes warehouse records.
- Executes production actions.
- Bypasses Truth Spine, Oracle, Policy Engine, Readiness Gate, or Data Approval Gateway.

## What V1 Does Not Do

Agent Coordination Layer V1 does not:

- Enable autonomous execution.
- Add real executor endpoints.
- Add production database/migrations.
- Mutate production records.
- Publish reports.
- Mutate SHF Impact Data Spine.
- Mark `public_approved`.
- Send webhooks or notifications.
- Write warehouse records.
- Bypass human approval or governance gates.
- Store real client PII or secrets.

## Validation Results

Passed in this run:

- `python3 -m json.tool docs/AGENT_COORDINATION_LAYER_V1.json`
- `python3 -m py_compile scripts/check_agent_coordination_layer.py`
- `python3 scripts/check_agent_coordination_layer.py`
- `npm run check:agent-coordination`
- `npm run check:agent-memory-context`
- `npm run check:agent-approval-stub`
- `npm run check:agent-contract-bridge`
- `npm run check:governance`
- `bash scripts/run_daily_governance_audit.sh`
- `bash scripts/run_paid_launch_checks.sh`
- `npm run build`

Build completed with the known Vite large-chunk warning. No new execution capability was added.

## Browser Smoke Results

Passed in this run:

- `admin.html#/ops/agents` loads.
- Coordination panel visible.
- Workflow templates visible.
- Create plan from template works and recommends the next non-owner agent.
- Plan detail visible.
- Next best agent visible.
- Handoff trail visible.
- Create handoff works.
- Accept/reject handoff works, and completed/rejected handoffs no longer show review buttons.
- Block/complete plan works. Completion is blocked when unresolved blockers remain.
- Memory/context warnings visible.
- Task queue remains functional.
- Approval ledger remains functional.
- Safe execution stub remains non-executing and now treats blocked coordination plans as a visible blocked reason.
- Dangerous flags remain false.
- `client_admin` redirects from `#/ops/agents` to `#/hub`.
- Public/no-session access redirects from `#/ops/agents` to `#/login`.

Browser console noted the expected identity blocked-route warning during the access-control smoke.

## Remaining Risks

- V1 coordination uses browser localStorage rather than shared backend persistence.
- Deterministic next-best-agent logic is template based, not AI.
- Handoff records are operator review aids, not delivery actions.
- Real executor, durable coordination service, production mutation, report publishing, external sends, warehouse writes, and public approval remain Future Execution Phase work.

## V1 Complete

Agent Coordination Layer V1 is complete and validated for operator-supervised, local-only coordination.
