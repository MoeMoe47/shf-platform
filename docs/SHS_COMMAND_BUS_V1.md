# SHS BOS Command Bus V1

## Executive Summary

SHS BOS Command Bus V1 is the official internal command execution-request layer for Silicon Heartland Business Operating System. It standardizes how SHS BOS layers receive, validate, permission-check, safety-check, policy-check, approve, queue, dispatch, preview, dry-run, and audit commands.

The Command Bus does not replace the Event Bus. Event Bus is communication. Command Bus is execution requests.

Command Bus V1 does not perform real autonomous execution. It does not execute shell commands, Python, external APIs, webhooks, OAuth, banking, Plaid-style aggregation, payment execution, report publishing, SHF Impact mutation, public-approved mutation, production writes, file deletion, network execution, recursive execution, self-modifying behavior, or command chaining without approval.

## Architecture

Command Bus V1 sits between:

1. UI
2. Agents
3. Workflow Engine
4. System Orchestrator
5. Command Bus
6. Approval Engine
7. Execution Router
8. Target Layer

In V1, the execution router is preview-only. Dispatch produces route previews and dry-run records, not production writes.

## Execution Lifecycle

Command pipeline:

1. Receive
2. Validate
3. Permission Check
4. Safety Check
5. Policy Check
6. Approval Check
7. Queue
8. Dispatch
9. Dry Run
10. Preview
11. Audit

## Command Model

Every command contains:

- `command_id`
- `command_type`
- `command_name`
- `source_layer`
- `target_layer`
- `requested_by`
- `requested_at`
- `risk_level`
- `approval_required`
- `execution_mode`
- `payload`
- `validation_status`
- `approval_status`
- `execution_status`
- `completion_status`
- `audit_status`
- `notes`

## Supported Command Types

- System
- Workflow
- Tracking
- Persistence
- Registry
- Governance
- Reports
- Agent
- ClientOps
- Website Studio
- Production
- Sales
- Direct Connect
- QA
- Scheduler
- Notifications
- Analytics
- Identity
- Security

## Execution Modes

Supported in V1:

- `preview`
- `dry_run`
- `manual`
- `approved`
- `blocked`

Not supported in V1:

- automatic
- autonomous
- background execution

## Approval Model

Approval levels:

- Safe
- Owner Review
- Governance Review
- Blocked

Safe commands may be previewed locally. Owner Review and Governance Review commands remain review-gated. Blocked commands are visible for safety proof and cannot proceed.

## Security Model

Route:

`admin.html#/ops/command-bus`

Access:

- `shs_admin` only
- `client_admin` blocked
- public blocked

The Command Bus stores local admin preview records only. It does not store credentials, tokens, API keys, OAuth material, private keys, or secrets.

## Risk Model

Low-risk commands may be queued for preview. Medium-risk commands require owner review. High-risk commands require governance review. Critical commands remain blocked in V1.

Blocked sample commands:

- Delete Database
- Publish Reports
- Mark Public Approved
- Mutate Truth Spine
- Execute Shell
- Run Python
- Send External Email
- Webhook Delivery
- OAuth Login
- Bank Connection
- Payment Processing
- API Token Creation

Safe sample commands:

- Generate Report Preview
- Run Governance Validation
- Refresh Registry Scan
- Preview Workflow
- Recalculate Readiness
- Refresh Tracking Metrics
- Dry-run Persistence Snapshot
- Queue Notification Preview
- Validate Route Access

## Admin UI

Route:

`admin.html#/ops/command-bus`

Page:

`src/pages/admin/command-bus/ShsCommandBusPage.jsx`

Sections:

- Overview
- Queue
- History
- Approvals
- Permissions
- Policies
- Safety
- Metrics
- Validation
- Audit
- Readiness
- Blocked Commands

## Files Created

- `src/system/command-bus/shsCommandTypes.js`
- `src/system/command-bus/shsCommandSchemas.js`
- `src/system/command-bus/shsCommandRegistry.js`
- `src/system/command-bus/shsCommandBus.js`
- `src/system/command-bus/shsCommandRouter.js`
- `src/system/command-bus/shsCommandQueue.js`
- `src/system/command-bus/shsCommandDispatcher.js`
- `src/system/command-bus/shsCommandHandlers.js`
- `src/system/command-bus/shsCommandApprovals.js`
- `src/system/command-bus/shsCommandValidator.js`
- `src/system/command-bus/shsCommandPolicies.js`
- `src/system/command-bus/shsCommandPermissions.js`
- `src/system/command-bus/shsCommandHistory.js`
- `src/system/command-bus/shsCommandMetrics.js`
- `src/system/command-bus/shsCommandReadiness.js`
- `src/system/command-bus/shsCommandSafety.js`
- `src/system/command-bus/shsCommandStorage.js`
- `src/pages/admin/command-bus/ShsCommandBusPage.jsx`
- `src/pages/admin/command-bus/components/CommandOverviewPanel.jsx`
- `src/pages/admin/command-bus/components/CommandQueuePanel.jsx`
- `src/pages/admin/command-bus/components/CommandHistoryPanel.jsx`
- `src/pages/admin/command-bus/components/CommandApprovalPanel.jsx`
- `src/pages/admin/command-bus/components/CommandPreviewPanel.jsx`
- `src/pages/admin/command-bus/components/CommandMetricsPanel.jsx`
- `src/pages/admin/command-bus/components/CommandPolicyPanel.jsx`
- `src/pages/admin/command-bus/components/CommandSafetyPanel.jsx`
- `src/pages/admin/command-bus/components/CommandPermissionsPanel.jsx`
- `src/pages/admin/command-bus/components/CommandValidatorPanel.jsx`
- `src/pages/admin/command-bus/components/CommandAuditPanel.jsx`
- `src/pages/admin/command-bus/components/CommandReadinessPanel.jsx`
- `src/pages/admin/command-bus/shsCommandBus.css`
- `scripts/check_shs_command_bus.py`
- `docs/SHS_COMMAND_BUS_V1.md`
- `docs/SHS_COMMAND_BUS_V1.json`

## Files Modified

- `package.json`
- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`

## Validation Results

Validation results from this environment:

- `python3 -m json.tool docs/SHS_COMMAND_BUS_V1.json` - PASS
- `python3 scripts/check_shs_command_bus.py` - PASS
- `npm run check:shs-command-bus` - PASS
- `npm run check:shs-event-bus` - PASS
- `npm run check:shs-job-scheduler` - PASS
- `npm run check:shs-notification-fabric` - PASS
- `npm run check:shs-tracking` - PASS
- `npm run check:shs-persistence` - PASS
- `npm run check:governance` - PASS
- `bash scripts/run_daily_governance_audit.sh` - PASS
- `bash scripts/run_paid_launch_checks.sh` - PASS
- `npm run build` - PASS with existing Vite circular-chunk and large-chunk warnings
- `git diff --check` - PASS

## Browser Smoke

Browser smoke results from local dev server `http://127.0.0.1:5174`:

- `admin.html#/ops/command-bus` - PASS
- Queue visible - PASS
- Approvals visible - PASS
- Preview works - PASS
- Safety blocks dangerous commands - PASS
- Blocked command examples visible - PASS
- Permissions visible - PASS
- Audit visible - PASS
- Readiness visible - PASS
- Client admin redirected - PASS
- Public/unauthenticated blocked - PASS
- Event Bus still loads - PASS
- Scheduler still loads - PASS
- Notifications still load - PASS
- Tracking still loads - PASS
- Persistence still loads - PASS
- Registry still loads - PASS

## Future V2 Roadmap

V2+ may make the Command Bus the only supported execution path for SHS BOS commands, but only after separate owner-approved packages add durable persistence, hardened approval engine, command signing, audit event export, role-specific command permissions, rollback rules, rate limits, production execution adapters, monitoring, incident controls, and governance review.

## Remaining Risks

- Command Bus V1 is local/browser storage only.
- Dispatch is preview/dry-run only.
- Approval engine is a local review model, not a production approval service.
- Future execution adapters must be separately reviewed and must preserve all safety guardrails.

## V1 Complete

Status: complete.
