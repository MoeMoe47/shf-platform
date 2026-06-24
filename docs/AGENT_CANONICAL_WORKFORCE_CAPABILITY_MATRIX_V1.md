# Agent Canonical Workforce Capability Matrix V1

Date: 2026-06-23

## Executive Summary

Agent Canonical Workforce Capability Matrix V1 makes the 8 SHS Agent V1 agents official for Agent Workbench, Task Queue, Agent Registry, Agent Fabric, governance layers, and future executor planning.

This is a formalization layer only. It does not enable autonomous agent execution, production mutation, report publishing, public approval, SHF Impact Data Spine mutation, external messaging, webhooks, notifications, warehouse writes, auth changes, or production persistence.

The machine-readable matrix is `docs/AGENT_CANONICAL_WORKFORCE_CAPABILITY_MATRIX_V1.json`.

## V1 Execution Boundary

All SHS Agent V1 entries carry these hard flags:

| Field | Value |
| --- | --- |
| `can_execute_production_actions` | `false` |
| `can_publish_reports` | `false` |
| `can_mutate_public_data` | `false` |
| `can_mark_public_approved` | `false` |
| `can_mutate_shf_impact_data` | `false` |
| `can_send_external_messages` | `false` |
| `can_send_webhooks` | `false` |
| `can_write_warehouse_records` | `false` |
| `can_modify_auth` | `false` |
| `audit_required` | `true` |
| `human_approval_required` | `true` |

Human approval in V1 changes simulated task state only. It does not authorize real execution.

## Canonical Allowed Capabilities

- `read_context`
- `summarize_context`
- `recommend_next_action`
- `draft_internal_note`
- `create_simulated_task`
- `update_task_status`
- `prepare_review_packet`
- `prepare_report_preview`
- `prepare_qa_summary`
- `prepare_governance_summary`
- `prepare_operator_briefing`

## Canonical Blocked Capabilities

- `execute_production_action`
- `mutate_production_record`
- `publish_report`
- `mark_public_approved`
- `mutate_shf_impact_data`
- `send_external_webhook`
- `send_notification`
- `write_warehouse_record`

## Required Human Approval Rules

Every SHS Agent V1 entry requires human approval for:

- `production_action_request`
- `production_record_change`
- `report_publication_request`
- `public_approval_request`
- `shf_impact_data_change`
- `external_message_request`
- `webhook_delivery_request`
- `notification_delivery_request`
- `warehouse_write_request`
- `auth_or_permission_change`

These requests remain blocked from execution in V1 even if an operator changes task approval status.

## Canonical Workforce

| Agent ID | Name | Risk | Primary Role |
| --- | --- | --- | --- |
| `shs_sales_agent` | SHS Sales Agent | medium | Lead intake, opportunity summary, sales handoff preparation, proposal support, demo readiness suggestions. |
| `shs_project_agent` | SHS Project Agent | medium | Project setup support, production handoff organization, readiness review, blocker identification. |
| `shs_library_agent` | SHS Development Library Agent | low | Development Library support, template/package recommendation, build packet support, reusable asset recommendations. |
| `shs_qa_agent` | SHS QA Agent | medium | QA checklist review, delivery readiness review, defect/blocker summary, browser smoke preparation. |
| `shs_clientops_agent` | SHS ClientOps Agent | high | Client record review, support/maintenance summary, renewal/upgrade support, client health review. |
| `shs_report_agent` | SHS Report Agent | high | Report readiness review, draft/preview support, export metadata review, premium report workflow support. |
| `shs_governance_agent` | SHS Governance Agent | high | Governance check summary, daily audit review, boundary/risk warning, policy/readiness support. |
| `shs_executive_agent` | SHS Executive Agent | high | Executive summary support, portfolio overview, owner briefing, launch readiness summary. |

## Agent Task Types

### `shs_sales_agent`

- `lead_intake_review`
- `opportunity_summary`
- `sales_handoff_preparation`
- `proposal_support`
- `demo_readiness_suggestions`

### `shs_project_agent`

- `project_setup_support`
- `production_handoff_organization`
- `project_readiness_review`
- `project_blocker_identification`

### `shs_library_agent`

- `development_library_support`
- `template_package_recommendation`
- `build_packet_preparation_support`
- `reusable_asset_recommendation`

### `shs_qa_agent`

- `qa_checklist_review`
- `delivery_readiness_review`
- `defect_blocker_summary`
- `browser_smoke_preparation`

### `shs_clientops_agent`

- `client_record_review`
- `support_maintenance_summary`
- `renewal_upgrade_opportunity_support`
- `client_health_review`

### `shs_report_agent`

- `report_readiness_review`
- `report_draft_preview_support`
- `export_metadata_review`
- `premium_report_workflow_support`

### `shs_governance_agent`

- `governance_check_summary`
- `daily_audit_review`
- `boundary_risk_warning`
- `policy_readiness_review_support`

### `shs_executive_agent`

- `executive_summary_support`
- `portfolio_overview`
- `owner_briefing`
- `launch_readiness_summary`

## Source Boundaries

Common allowed source systems:

- `agent_workbench`
- `manual`
- `shs_ops`
- `task_queue`
- `governance`

Agent-specific source systems are listed in the JSON matrix. They include SHS-owned surfaces such as `shs_sales`, `production_ops`, `development_library`, `qa_delivery`, `clientops`, `shs_reports`, `policy_engine`, `readiness_gate`, `audit_verification`, and `executive_ops`.

Blocked source systems:

- `shf_impact_data_spine`
- `public_impact_map`
- `external_messaging`
- `external_webhook_delivery`
- `notification_delivery`
- `warehouse`
- `auth_system`

## Alignment Notes

- `src/data/agents/shsAgentWorkforce.js` mirrors this matrix for Agent Workbench.
- `src/data/agents/agentTaskQueue.js` uses canonical V1 task-type values for seeded simulated tasks.
- `services/shf-agent-fabric/contracts/agents/agents.json` includes the 8 SHS agents using the existing Agent Fabric registry shape, with `policy.humanApproval: true` and safe dry-run style capabilities only.
- Existing Agent Fabric dry-run, admin registry, and audit-ledger foundations remain intact.
- No real executor, external delivery, production persistence, or public data mutation is enabled.

## Governance Relationship

The canonical workforce follows the existing SHS governance stack:

- AI/Swarm may draft, summarize, inspect, and recommend, but may not verify, public-approve, publish, or execute.
- Policy Engine evaluates policy context but does not approve public data or mutate records.
- Readiness Gate evaluates forward movement but does not verify truth or publish reports.
- Audit & Verification checks traceability but does not replace Agent Fabric event ledger.
- Production Automation and Notification / Alert remain review-only in V1.
- SHS private/client/ops context remains inside SHS unless downstream governance explicitly allows movement.

## V1 Complete Criteria

V1 is complete when:

- All 8 SHS agents are present in the matrix.
- Every agent has all canonical fields.
- All dangerous flags are false.
- Human approval and audit requirements are true.
- Agent Workbench data uses the same agent IDs, task types, capabilities, and blocked actions.
- Agent Fabric contract registry includes the SHS agents without enabling autonomous execution.
