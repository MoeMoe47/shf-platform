# SHS System Orchestrator V1

## Executive Summary

SHS System Orchestrator V1 is the first official V1.1 layer. It creates a local/admin-safe control plane that coordinates completed SHRV1 systems without replacing them or bypassing governance, approvals, or safety gates.

The Orchestrator may recommend, prepare, route, create local records, and coordinate. It does not execute production changes, publish reports, mutate SHF public data, send external messages, write warehouse records, modify auth, call external APIs, enable live Direct Connect integrations, or perform autonomous agent execution.

## Purpose

The Orchestrator answers:

- What is the operator trying to do?
- Which SHS systems need to participate?
- Which agents are involved?
- Which workflow should be started?
- Which Direct Connect proof is needed?
- Which report surface is involved?
- Which approvals are required?
- Which governance gates apply?
- What blockers exist?
- What safe next action should the operator take?

## What Was Built

- Local orchestration request model.
- Local orchestration plan model.
- Exactly 8 orchestration templates.
- LocalStorage-backed request and plan storage.
- Deterministic readiness scoring.
- Dangerous-action safety defaults and scanner.
- Metrics helper.
- Local operator actions: create request, analyze request, mark ready for review, block request, complete local coordination, and add operator note.
- Admin page at `admin.html#/ops/orchestrator`.
- Seven admin UI components for templates, requests, plans, readiness, safety, layer map, and next actions.
- Protected route, sidebar entry, access-control entry, and route-bridge entry.
- Focused validator and package script.

## How It Connects V1 Layers

The Orchestrator represents these completed V1 systems as participating layers:

- Truth Spine
- Oracle
- Master Layer Registry
- SHS Spine
- Agent Workbench
- Agent Task Queue
- Agent Approval Ledger
- Agent Memory & Context
- Agent Coordination Layer
- Agent Workflow Engine
- Agent Controlled Executor
- Production Automation V2
- SHS Reports
- Direct Connect Batch 2 direct-source proof
- Daily Governance Audit
- Paid-Launch Checks
- System Registry & Dependency Intelligence
- Readiness Gate
- Policy Engine
- Audit / Verification Layer
- Security / Privacy
- Data Ownership / IP
- SHS / SHF boundary controls

## 8 Orchestration Templates

1. Client Premium Report Orchestration
2. Sales to Delivery Orchestration
3. Direct Source Proof Orchestration
4. Agent Workflow Orchestration
5. Launch Readiness Orchestration
6. ClientOps Review Orchestration
7. Governance Review Orchestration
8. Private Beta Demo Orchestration

## Request Model

Implemented in `src/data/orchestrator/shsOrchestratorRequests.js`.

The request model captures operator intent, request type, related client/project/report IDs, related agents, workflow/coordination references, Direct Connect proof references, task references, status, risk level, timestamps, and operator notes.

## Plan Model

Implemented in `src/data/orchestrator/shsOrchestratorPlans.js`.

The plan model captures participating layers and agents, recommended workflow and coordination templates, required context packets, Direct Connect proofs, reports, approvals, governance gates, readiness score, blockers, warnings, safe next actions, blocked dangerous actions, and all dangerous capability flags.

All dangerous flags default false:

- `execution_enabled = false`
- `production_mutation_enabled = false`
- `public_publish_enabled = false`
- `public_approved_mutation_enabled = false`
- `shf_impact_data_mutation_enabled = false`
- `external_delivery_enabled = false`
- `warehouse_write_enabled = false`
- `auth_mutation_enabled = false`

## Readiness Scoring

Implemented in `src/data/orchestrator/shsOrchestratorReadiness.js`.

Start at 100.

Subtract:

- 30 for critical risk
- 25 if no human approval path
- 20 if required governance gates are missing
- 20 if required source proof is missing
- 15 if required workflow is missing
- 15 if required context packet is missing
- 15 if blockers exist
- 10 if warnings exist
- 50 if any dangerous action is requested

Ready means:

- Score is at least 80.
- No blockers exist.
- Dangerous flags are false.
- Human approval path exists.
- Readiness Gate is required where relevant.
- Data Approval is required before public use.
- SHS/SHF boundary remains intact.

## Safety Rules

The Orchestrator blocks:

- production mutation
- public approval mutation
- SHF Impact Data mutation
- report publishing without approval
- external delivery
- webhook/notification sending
- warehouse write
- auth mutation
- live Direct Connect integration
- banking/account/OAuth/payment connection
- autonomous executor action

Visible safety copy:

> SHS System Orchestrator V1 coordinates approved internal workflows only. It does not execute production changes, publish reports, mutate SHF public data, send external messages, write warehouse records, or modify auth.

## Admin UI

Route:

`admin.html#/ops/orchestrator`

Page:

`src/pages/admin/orchestrator/ShsSystemOrchestratorPage.jsx`

Components:

- `OrchestratorTemplatePanel`
- `OrchestratorRequestList`
- `OrchestratorPlanDetail`
- `OrchestratorReadinessPanel`
- `OrchestratorSafetyPanel`
- `OrchestratorLayerMap`
- `OrchestratorNextActions`

The UI shows templates, request list, selected plan, participating layers, participating agents, governance gates, required approvals, Direct Connect proof requirements, report/workflow/automation references, readiness score, blockers/warnings, safety flags, safe next actions, and dangerous actions blocked.

## Route / Access Control

Files modified:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`

Access:

- `/ops/orchestrator` is protected.
- `shs_admin` is the only allowed role.
- `client_admin` and public users remain blocked.

## SHS / SHF Boundary

The Orchestrator preserves the existing SHS / SHF boundary:

- SHS remains private/operational coordination.
- SHF public surfaces require public approval and Data Approval Gateway.
- Direct Connect remains direct-source proof only.
- `public_approved` mutation remains disabled.
- SHF Impact Data Spine mutation remains disabled.

## What It Does Not Do

The Orchestrator does not:

- execute production changes
- mutate production data
- mark `public_approved`
- mutate SHF Impact Data Spine
- publish reports automatically
- send webhooks
- send notifications
- write warehouse records
- modify auth
- call external APIs
- add banking/account/OAuth/payment connections
- add live Direct Connect integrations
- bypass human approval
- bypass Truth Spine, Oracle, Policy Engine, Readiness Gate, Data Approval Gateway, Security / Privacy, or Data Ownership / IP

## Validation Results

Validation results from this environment:

- `python3 -m json.tool docs/SHS_SYSTEM_ORCHESTRATOR_V1.json`: PASS
- `PYTHONPYCACHEPREFIX=/tmp/codex_pycache python3 -m py_compile scripts/check_shs_system_orchestrator.py`: PASS
- `python3 scripts/check_shs_system_orchestrator.py`: PASS
- `npm run check:shs-orchestrator`: BLOCKED_BY_ENVIRONMENT_NPM_NOT_FOUND
- `npm run check:governance`: BLOCKED_BY_ENVIRONMENT_NPM_NOT_FOUND
- `bash scripts/run_daily_governance_audit.sh`: BLOCKED_BY_ENVIRONMENT_NPM_NOT_FOUND
- `bash scripts/run_paid_launch_checks.sh`: BLOCKED_BY_ENVIRONMENT_NPM_NOT_FOUND
- `npm run build`: BLOCKED_BY_ENVIRONMENT_NPM_NOT_FOUND

## Browser Smoke

Manual browser smoke status: BLOCKED_BY_ENVIRONMENT_NPM_NOT_FOUND.

The local dev server could not be started from this environment because npm is not available. Required checks when npm is available:

- `admin.html#/ops/orchestrator` loads.
- Orchestrator page is visible.
- 8 templates are visible.
- Create request works.
- Analyze request works.
- Readiness score is visible.
- Safety panel is visible.
- Dangerous flags are false.
- SHS/SHF boundary copy is visible.
- `client_admin` and public users are blocked.
- Existing `/ops/agents`, `/ops/reports`, and `/ops/direct-connect` still work.

## Remaining Risks

- Orchestrator state is local/browser storage only.
- No backend persistence exists for orchestration requests or plans.
- Browser smoke depends on a local dev server and npm availability.
- Broad npm-backed governance and build checks depend on npm availability.
- Future production orchestrator work must add durable auth, audit, persistence, monitoring, and CI gates without bypassing governance.

## V1 Complete

Status: **complete with documented environment blockers**.

The focused Python validator passed and confirms the V1.1 Orchestrator layer shape, route/access wiring, safety defaults, exactly 8 templates, no dangerous enabled flags, no public approval mutation, and no SHF Impact Data mutation. Browser smoke and npm-backed validation remain environment-blocked until npm is available.
