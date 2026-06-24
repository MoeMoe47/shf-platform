# Agent Backend Contract Bridge V1

Date: 2026-06-23

## Executive Summary

Agent Backend Contract Bridge V1 connects Agent Workbench visibility to the backend Agent Fabric contract registry in a safe, read-only way.

V1 answers whether the 8 canonical SHS agents exist in `services/shf-agent-fabric/contracts/agents/agents.json`, whether dangerous execution flags remain false, whether human approval and audit requirements are present, and whether the Workbench can show backend contract alignment without enabling execution.

V1 does not execute agents, mutate production records, publish reports, mutate SHF Impact Data Spine, mark `public_approved`, send webhooks, send notifications, write warehouse records, call external APIs, create production persistence, bypass human approval, or bypass Truth Spine, Oracle, Policy Engine, Readiness Gate, Audit & Verification, Production Automation, Notification / Alert, or Data Approval Gateway.

Machine-readable report: `docs/AGENT_BACKEND_CONTRACT_BRIDGE_V1.json`.

## What Was Built

- Read-only backend bridge service: `services/shf-agent-fabric/services/agent_contract_bridge_service.py`.
- Read-only backend bridge router: `services/shf-agent-fabric/routers/agent_contract_bridge_routes.py`.
- Backend route registration in `services/shf-agent-fabric/main.py`.
- Frontend local bridge comparator: `src/data/agents/agentContractBridge.js`.
- Workbench bridge panel: `src/pages/admin/agents/components/AgentContractBridgePanel.jsx`.
- Workbench integration on `admin.html#/ops/agents`.
- Focused route tests: `services/shf-agent-fabric/tests/test_agent_contract_bridge_routes.py`.
- Validator script: `scripts/check_agent_contract_bridge.py`.
- Package script: `npm run check:agent-contract-bridge`.

## Backend Contract Source

Backend Agent Fabric contracts are read from:

`services/shf-agent-fabric/contracts/agents/agents.json`

The bridge reads this file only. It does not write contracts, mutate files, create database rows, append audit ledgers, or call external services.

## Frontend Canonical Source

Frontend canonical SHS Agent Workbench definitions are read from:

`src/data/agents/shsAgentWorkforce.js`

The frontend bridge compares those canonical definitions to the backend-style contract snapshot imported from `contracts/agents/agents.json`.

## Alignment Rules

Alignment is `aligned` only if:

- All 8 required SHS agents exist in frontend canonical workforce data.
- All 8 required SHS agents exist in backend Agent Fabric contracts.
- All dangerous flags are false.
- `human_approval_required` and backend `policy.humanApproval` are true.
- `audit_required` and backend `policy.auditRequired` are true.
- `execution_enabled` is false.
- No required agent exposes publish, public approval, webhook, notification, warehouse, auth, SHF Impact Data Spine mutation, or production execution powers in allowed capabilities/tools.

Alignment is `needs_review` when non-blocking mismatches exist, including extra backend contracts. The current backend registry contains the 8 required SHS contracts plus 11 pre-existing non-SHS Agent Fabric contracts, so the bridge reports `needs_review` while confirming the required SHS set is present and safe.

Alignment is `blocked` if a required SHS agent is missing, a dangerous flag is true, execution is enabled, human approval/audit requirements are missing, or a required agent exposes public mutation or production execution power.

## Dangerous Flag Scan

The bridge scans these flags across frontend canonical data and backend SHS contract policy fields:

- `can_execute_production_actions`
- `can_publish_reports`
- `can_mutate_public_data`
- `can_mark_public_approved`
- `can_mutate_shf_impact_data`
- `can_send_external_messages`
- `can_send_webhooks`
- `can_write_warehouse_records`
- `can_modify_auth`
- `execution_allowed`
- `execution_enabled`
- `production_action_executed`
- `public_approved_mutated`
- `shf_impact_data_mutated`
- `webhook_sent`
- `notification_sent`
- `warehouse_write_performed`

Current enabled dangerous flag count: `0`.

## Workbench Integration

`AgentContractBridgePanel` now appears on `admin.html#/ops/agents` after the approval ledger.

It shows:

- canonical required agent count
- backend contract count
- matched SHS agents
- missing backend agents
- mismatch warnings
- dangerous flag scan count
- execution enabled: `false`
- bridge status and read-only note

Existing task queue, approval ledger, safe execution stub, task detail, and local reset behavior remain intact.

## Backend Endpoints

Read-only endpoints added:

- `GET /agent-contract-bridge/health`
- `GET /agent-contract-bridge/summary`
- `GET /agent-contract-bridge/agents`
- `GET /agent-contract-bridge/alignment`

No POST, PUT, PATCH, DELETE, executor, run, mutation, delivery, or production-action endpoint was added.

## What V1 Does Not Do

- Does not enable real agent execution.
- Does not add a production executor.
- Does not mutate production records.
- Does not publish reports.
- Does not mutate SHF Impact Data Spine.
- Does not mark `public_approved`.
- Does not send webhooks, notifications, external messages, or emails.
- Does not write warehouse records.
- Does not create production persistence, database migrations, or external API calls.
- Does not bypass human approval, Truth Spine, Oracle, Policy Engine, Readiness Gate, Audit & Verification, Production Automation, Notification / Alert, or Data Approval Gateway.

## Validation Results

| Check | Result |
| --- | --- |
| `python3 -m py_compile services/shf-agent-fabric/services/agent_contract_bridge_service.py services/shf-agent-fabric/routers/agent_contract_bridge_routes.py` | PASS |
| `python3 -m json.tool docs/AGENT_BACKEND_CONTRACT_BRIDGE_V1.json` | PASS |
| `python3 -m py_compile scripts/check_agent_contract_bridge.py` | PASS |
| `python3 scripts/check_agent_contract_bridge.py` | PASS |
| `npm run check:agent-contract-bridge` | PASS |
| `python3 -m pytest services/shf-agent-fabric/tests/test_agent_contract_bridge_routes.py` | PASS, 3 tests |
| `npm run check:governance` | PASS |
| `bash scripts/run_daily_governance_audit.sh` | PASS on solo rerun |
| `bash scripts/run_paid_launch_checks.sh` | PASS |
| `npm run build` | PASS with existing large chunk warning |

## Browser Smoke Results

| Smoke Check | Result |
| --- | --- |
| `admin.html#/ops/agents` loads | PASS |
| Contract Bridge panel visible | PASS |
| shows 8 canonical SHS agents | PASS |
| shows backend contract status | PASS |
| shows dangerous flag scan clean | PASS |
| shows execution enabled false | PASS |
| existing task queue still works | PASS |
| approval ledger still works | PASS |
| safe execution stub still works | PASS |
| `client_admin` blocked from Workbench | PASS, redirected to `#/hub` and bridge/stub panels absent |
| public/no-session blocked from Workbench | PASS, redirected to `#/login` and bridge/stub panels absent |

Local browser smoke note: Vite logged non-blocking `/auth/me` proxy errors because the local auth backend on `127.0.0.1:8091` was not running. The Agent Workbench route still rendered and smoke checks passed.

## Remaining Risks

- The Workbench bridge uses a local bundled contract snapshot at build time; it does not poll the backend endpoint at runtime in V1.
- The backend registry contains 11 pre-existing non-SHS Agent Fabric contracts in addition to the 8 required SHS contracts, so the alignment status is `needs_review` rather than `aligned`.
- Backend endpoints are read-only but not a production execution gate; future runtime integration must still pass Identity, Policy Engine, Readiness Gate, Audit & Verification, and Data Approval Gateway boundaries.

## V1 Complete

Yes.
