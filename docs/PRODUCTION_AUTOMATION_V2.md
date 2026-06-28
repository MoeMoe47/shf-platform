# Production Automation V2

## Executive Summary

Production Automation V2 upgrades the V1 readiness scaffold into a governed SHS-internal automation planning layer. It creates local automation recipes, local automation run records, operator checklists, task/workflow/coordination references, readiness scores, and safety visibility inside the Agent Workbench.

V2 remains non-executing. It does not execute production changes, publish reports, mutate SHF public data, send messages, write warehouse records, modify auth, deploy code, call external APIs, or bypass human approval.

## What Was Built

- Canonical V2 automation recipe model.
- Canonical V2 automation run model.
- Seven safe automation recipes.
- Deterministic readiness scoring.
- LocalStorage-backed automation run storage.
- Workbench recipe, run, detail, and safety panels.
- Validator script and package check.

## V1 To V2 Difference

Production Automation V1 evaluates automation readiness payloads through backend summary/evaluate endpoints. V2 adds operator-visible local run planning in the Agent Workbench and connects recipes to local Agent Workflow, Coordination, Memory, Approval Ledger, Controlled Executor, SHS Reports, and governance context.

V2 still does not create a production executor.

## Automation Recipe Model

The canonical recipe model is implemented in `src/data/agents/productionAutomationV2Runs.js` and the seven recipe definitions live in `src/data/agents/productionAutomationV2Recipes.js`.

All recipe dangerous enablement flags remain false:

- `execution_enabled_v2`
- `external_delivery_enabled`
- `production_mutation_enabled`
- `public_publish_enabled`
- `warehouse_write_enabled`
- `auth_mutation_enabled`

## Automation Run Model

The canonical run model includes task, workflow, coordination, memory, context packet, report, approval, readiness, blocker, warning, planned-action, completed-action, and audit-event fields.

All run dangerous flags remain false:

- `production_action_executed`
- `report_published`
- `public_data_mutated`
- `public_approved_mutated`
- `shf_impact_data_mutated`
- `external_message_sent`
- `webhook_sent`
- `notification_sent`
- `warehouse_write_performed`
- `auth_modified`

## V2 Recipes

1. Sales to Delivery Automation
2. Report Readiness Automation
3. QA Delivery Automation
4. ClientOps Review Automation
5. Launch Handoff Automation
6. Daily Governance Automation
7. Private Beta Demo Automation

Each recipe defines allowed local actions, blocked actions, approval points, participating agents, context requirements, outputs, and cannot-output boundaries.

## Readiness Scoring

V2 starts from 100 and subtracts:

- 30 for critical risk.
- 20 for no approval record linked.
- 20 for no workflow or context linked.
- 15 for blockers.
- 10 for warnings.
- 25 for dangerous action requests.
- 50 for public, SHF, external, warehouse, or auth mutation requests.

Readiness floors at zero. A run is ready only when the score is at least 80, there are no blockers, human approval is required, dangerous flags are false, `execution_enabled_v2` is false, and no public/external mutation is requested.

## Workbench / Admin Integration

`admin.html#/ops/agents` now shows:

- Production Automation V2 recipes.
- Production Automation V2 runs.
- Selected run detail.
- Readiness score.
- Blockers and warnings.
- Related task/workflow/coordination/memory/context/report/approval IDs.
- Planned and completed local actions.
- Safety flags.
- `execution_enabled_v2: false`.

Supported UI actions are local-only:

- Create automation run from recipe.
- Mark run in review.
- Approve local run status.
- Block run.
- Complete run.
- Add operator note.
- Create local checklist/action record.
- Create internal recommendation packet.
- Attach existing context packet.

## Agent Workflow / Coordination / Memory Integration

Creating a run from a recipe creates local task queue, workflow run, and coordination plan references using existing Agent Workbench helpers. It links available memory/context packet/approval context where present. These actions write browser-local Workbench state only.

## Approval And Controlled Executor Boundary

Production Automation V2 requires a human approval path and displays approval linkage. Controlled local actions remain bounded by Agent Controlled Executor V1 where executor behavior is needed. Production Automation V2 does not bypass the Approval Ledger, Safe Execution Stub, Controlled Executor, Policy Engine, Readiness Gate, Audit & Verification, or Data Approval Gateway.

## Backend Boundary

The existing backend Production Automation V1 endpoints remain summary/evaluation only. V2 did not add backend persistence, `/run`, `/execute`, shell execution, external API calls, database writes, webhooks, notifications, report publishing, or auth mutation.

## Safety Rules

V2 blocks automation runs for critical risk, blocked requested actions, unsafe payload flags, related blocked workflow/context, missing human approval path, non-false dangerous flags, or any public/SHF/external/warehouse/auth mutation request.

Visible UI copy:

> Production Automation V2 creates approved local/internal automation records only. It does not execute production changes, publish reports, mutate SHF public data, send messages, write warehouse records, or modify auth.

## SHS / SHF Boundary Rules

V2 never writes to `src/data/shfImpactData.js`, never marks `public_approved`, never publishes SHF impact records, never exposes SHS private data publicly, and never bypasses Data Approval Gateway.

## What V2 Does Not Do

- No shell commands.
- No deployment.
- No production database writes.
- No report publishing.
- No public approval mutation.
- No SHF Impact Data Spine mutation.
- No external API calls.
- No webhooks.
- No notifications.
- No warehouse writes.
- No auth or permission changes.
- No governance bypass.

## Validation Results

Run the V2 validator with:

```bash
python3 scripts/check_production_automation_v2.py
npm run check:production-automation-v2
```

Full validation results are recorded in `docs/PRODUCTION_AUTOMATION_V2.json`.

## Browser Smoke Results

Browser smoke verified `admin.html#/ops/agents` on `http://127.0.0.1:5174/` after starting the Vite dev server with approved localhost binding.

Verified:

- Agent Workbench loaded.
- Production Automation V2 panel was visible.
- Seven recipe create buttons were visible.
- A run was created from the Sales to Delivery Automation recipe.
- Run detail displayed readiness, workflow, coordination, task, approval, blocker, warning, checklist, and local action fields.
- Mark In Review, Add Note, Create Checklist Record, Create Recommendation Packet, Approve Status, Block Run, and Complete Run controls were present and exercised.
- The run remained local-only and blocked when workflow/context blockers were present.
- Safety panel displayed zero flag violations.
- `EXECUTION_ENABLED_V2` remained `false`.
- Warehouse write and other dangerous action flags remained `false`.
- Public launcher route did not expose Production Automation V2 or Agent Workbench copy.
- Browser console error log was empty.

Note: the dev server logged a non-blocking `/auth/me` proxy connection warning because the local backend was not running during UI smoke. The page still loaded and the Production Automation V2 flow completed.

## Remaining Risks

- V2 state is browser-local.
- Approval linkage depends on existing local approval records.
- Backend remains V1 summary/evaluation only by design.
- Browser smoke used Vite dev server only; backend auth proxy was not running.
- Vite large-chunk warning remains known and non-blocking.

## V2 Complete

Yes for implementation, browser smoke, and command validation.
