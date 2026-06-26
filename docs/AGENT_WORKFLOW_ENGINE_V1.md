# Agent Workflow Engine V1

## Executive Summary

Agent Workflow Engine V1 turns Agent Coordination Layer V1 plans and templates into visible, operator-controlled multi-step workflow runs. Operators can create, activate, pause, resume, block, complete, and annotate workflow runs, and can review, complete, or skip ordered workflow steps.

This is a local planning and review engine only. It does not add autonomous execution, executor endpoints, backend persistence, production mutation, report publishing, SHF Impact Data Spine mutation, public approval, webhooks, notifications, warehouse writes, external delivery, or auth changes.

## What Was Built

Created safe local data helpers:

- `src/data/agents/agentWorkflowRuns.js`
- `src/data/agents/agentWorkflowSteps.js`
- `src/data/agents/agentWorkflowTemplates.js`
- `src/data/agents/agentWorkflowStorage.js`
- `src/data/agents/agentWorkflowMetrics.js`
- `src/data/agents/agentWorkflowSafety.js`

Created Workbench UI panels:

- `src/pages/admin/agents/components/AgentWorkflowEnginePanel.jsx`
- `src/pages/admin/agents/components/AgentWorkflowRunDetail.jsx`
- `src/pages/admin/agents/components/AgentWorkflowStepList.jsx`
- `src/pages/admin/agents/components/AgentWorkflowProgress.jsx`
- `src/pages/admin/agents/components/AgentWorkflowSafetyPanel.jsx`

Updated:

- `src/pages/admin/agents/AgentWorkbenchPage.jsx`
- `src/pages/admin/agents/components/AgentSafeExecutionPanel.jsx`
- `src/pages/admin/agents/agentWorkbench.css`
- `src/data/agents/agentSafeExecutionStub.js`
- `package.json`

Created validator:

- `scripts/check_agent_workflow_engine.py`

## Workflow Run Model

The canonical workflow run model includes:

- `workflow_run_id`
- `title`
- `workflow_type`
- `source_coordination_plan_id`
- `status`
- `priority`
- `risk_level`
- `owner_agent_id`
- `participating_agent_ids`
- `current_step_id`
- `step_ids`
- `related_task_ids`
- `related_memory_ids`
- `related_context_packet_ids`
- `related_approval_ids`
- `related_handoff_ids`
- `progress_percent`
- `next_recommended_step_id`
- `human_review_required`
- `approval_required`
- `execution_enabled_v1`
- `created_at`
- `updated_at`
- `blockers`
- `warnings`
- `audit_events`
- dangerous execution flags, all false

## Workflow Step Model

The canonical workflow step model includes:

- `workflow_step_id`
- `workflow_run_id`
- `sequence_index`
- `title`
- `description`
- `owning_agent_id`
- `step_type`
- `status`
- `risk_level`
- `required_before_start`
- `required_before_complete`
- `related_task_id`
- `related_memory_ids`
- `related_context_packet_ids`
- `related_approval_id`
- `related_handoff_id`
- `operator_note`
- `human_review_required`
- `safe_execution_stub_allowed`
- `execution_enabled_v1`
- `created_at`
- `updated_at`
- `completed_at`
- `blockers`
- `warnings`
- `audit_events`
- dangerous execution flags, all false

## Workflow Templates

Six safe workflow templates were added:

1. Sales to Delivery
2. Report Generation
3. QA Delivery
4. ClientOps Review
5. Governance Review
6. Launch Readiness

## Step Sequences

Sales to Delivery:

- Sales intake review
- Project setup review
- Library packet review
- QA readiness review
- Report readiness review
- Governance boundary review
- Executive handoff summary

Report Generation:

- Report readiness review
- Premium preview review
- Governance boundary review
- Executive summary review

QA Delivery:

- QA checklist review
- Project blocker review
- ClientOps handoff review
- Governance readiness review

ClientOps Review:

- Client health review
- Upgrade opportunity review
- Report summary review
- Executive briefing

Governance Review:

- Daily audit review
- Policy boundary review
- Executive signoff summary

Launch Readiness:

- Readiness overview
- Governance audit review
- QA smoke review
- Report handoff review
- ClientOps readiness review
- Owner approval packet

## Workbench Integration

The Agent Workbench now displays:

- Workflow templates.
- Workflow runs.
- Selected workflow run detail.
- Ordered workflow steps.
- Current step.
- Progress percent.
- Next recommended step.
- Related coordination plan.
- Blockers and warnings.
- Safety boundary flags.
- `execution_enabled_v1: false`.

Supported local actions:

- Create workflow run from template.
- Create workflow run from coordination plan.
- Activate workflow.
- Pause workflow.
- Resume workflow.
- Block workflow.
- Complete workflow.
- Mark step in review.
- Mark step completed.
- Skip step with operator note.
- Add operator note.

All actions are local/browser state only and append audit-style events.

## Coordination Integration

Workflow runs can be created from coordination plans. The run preserves the source coordination plan ID, workflow type, owner agent, participating agents, related task IDs, memory IDs, context packet IDs, and coordination blockers.

## Memory / Context / Task / Approval / Handoff Integration

Workflow steps can show:

- Related task ID.
- Related memory IDs.
- Related context packet IDs.
- Related approval ID.
- Related handoff ID.
- Safe execution stub allowed status.

The Safe Execution Stub can now read workflow runs linked to the selected task. Blocked workflow runs add `workflow_run_blocked_items` to stub evaluation and keep the stub non-executing.

## Safety Rules

Workflow is blocked or marked for review when:

- Workflow or step risk is critical.
- A participating or owning agent is missing.
- Requested actions include public approval, publishing, external delivery, notification, webhook, warehouse write, auth mutation, SHF Impact Data Spine mutation, or production execution.
- Any linked context packet has blocked items.
- Any workflow or step dangerous flag is not false.
- Completion is requested before all required steps are completed or skipped.

Completion requires all required steps completed or skipped with operator note and no unresolved blockers.

## SHS / SHF Boundary Rules

Visible Workbench copy:

> Agent Workflow Engine V1 structures multi-agent workflows only. It does not execute production actions, publish reports, create public-approved SHF impact data, send external messages, or write warehouse records.

Workflow Engine V1 never:

- Executes production actions.
- Publishes reports.
- Mutates SHF Impact Data Spine.
- Marks `public_approved`.
- Sends webhooks or notifications.
- Writes warehouse records.
- Bypasses Truth Spine, Oracle, Policy Engine, Readiness Gate, or Data Approval Gateway.

## What V1 Does Not Do

Agent Workflow Engine V1 does not:

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

- `python3 -m json.tool docs/AGENT_WORKFLOW_ENGINE_V1.json`
- `python3 -m py_compile scripts/check_agent_workflow_engine.py`
- `python3 scripts/check_agent_workflow_engine.py`
- `npm run check:agent-workflow`
- `npm run check:agent-coordination`
- `npm run check:agent-memory-context`
- `npm run check:agent-approval-stub`
- `npm run check:agent-contract-bridge`
- `npm run check:governance`
- `bash scripts/run_daily_governance_audit.sh`
- `bash scripts/run_paid_launch_checks.sh`
- `npm run build`

Build completed with the known Vite large-chunk warning.

Note: an initial `bash scripts/run_daily_governance_audit.sh` invocation overlapped a separate build and failed during Vite public asset copying. The referenced asset existed on disk, and the daily governance audit passed when rerun by itself.

## Browser Smoke Results

Passed in this run:

- `admin.html#/ops/agents` loads.
- Workflow Engine panel visible.
- Workflow templates visible.
- Create workflow run from template works.
- Workflow detail visible.
- Ordered steps visible.
- Progress percent visible.
- Next recommended step visible.
- Activate/pause/resume/block workflow works.
- Mark step in review works.
- Mark step completed works.
- Skip step with note works.
- Workflow completion blocked if blockers remain.
- Workflow completion works when required steps are completed/skipped.
- Create workflow run from coordination plan works and preserves the source coordination plan link.
- Coordination panel still works.
- Memory panel still works.
- Task queue still works.
- Approval ledger still works.
- Safe execution stub remains non-executing and blocks on `workflow_run_blocked_items`.
- Dangerous flags remain false.
- `client_admin` redirects from `#/ops/agents` to `#/hub`.
- Public/no-session access redirects from `#/ops/agents` to `#/login`.

Browser console noted the expected identity blocked-route warning during the access-control smoke.

## Remaining Risks

- V1 workflow runs and steps use browser localStorage rather than shared backend persistence.
- Next-step logic is deterministic and template based.
- Workflow step records are operator review aids, not delivery actions.
- Real executor, durable workflow service, production mutation, report publishing, external sends, warehouse writes, and public approval remain Future Execution Phase work.

## V1 Complete

Agent Workflow Engine V1 is complete and validated for operator-supervised, local-only workflow runs and workflow steps.
