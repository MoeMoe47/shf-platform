# SHS Durable Persistence Layer V1

## Executive Summary

SHS Durable Persistence Layer V1 is the first V1.1 persistence foundation for SHRV1. It creates a safe abstraction layer for moving selected SHS operating records away from browser-only state over time without replacing existing Agent Workbench, Orchestrator, Reports, Direct Connect, or Production Automation behavior in one pass.

This layer is additive. It provides local repository wrappers, adapter boundaries, transaction history, version history, session snapshots, dry-run migration planning, and admin visibility. It does not add production database credentials, external calls, public publishing, autonomous execution, public approval mutation, or SHF Impact Data mutation.

## Why This Layer Exists

SHRV1 V1 uses a mix of localStorage, mock data, browser state, and feature-specific storage helpers. V1.1 needs a governed bridge that can gradually move records into durable persistence while preserving existing workflows and safety gates.

The first migration candidates are:

- Agent Workbench local records
- SHS System Orchestrator requests and plans
- Direct Connect direct-source proof records
- SHS Reports draft/history records
- Production Automation V2 local planning records
- System Registry & Dependency Intelligence local review notes and export summaries

The systems that must remain unchanged in V1 are the existing feature modules, route guards, governance checks, Direct Connect direct-source proof framing, and SHS / SHF public boundary controls.

## What Was Built

- Persistence service API
- Repository factory
- Five feature repositories
- LocalStorage adapter
- In-memory adapter
- Disabled database placeholder adapter
- Append-only transaction history
- Version history metadata
- Session snapshot helpers
- Dry-run migration registry
- Persistence metrics helper
- Safety scanner for blocked persistence payloads
- Admin Persistence Center at `admin.html#/ops/persistence`
- Focused validator and package script

## What It Does Not Do

This layer does not:

- replace all localStorage usage
- connect to a production database
- require production credentials
- store credentials or API keys
- persist OAuth tokens
- store banking/account secrets
- mutate SHF Impact Data Spine
- mark `public_approved`
- publish reports
- call external APIs
- enable autonomous execution
- bypass Truth Spine, Oracle, Policy Engine, Readiness Gate, Data Approval Gateway, Security / Privacy, or Data Ownership / IP

## Persistence Service

Implemented in `src/system/persistence/persistenceService.js`.

The service provides repository reads, writes, archive operations, safety scanning, transaction recording, and version creation. Every save path runs through the safety scanner before writing. The default adapter is local and can be swapped for an in-memory adapter during tests or previews.

## Repository Layer

Implemented in `src/system/persistence/repositoryFactory.js` and:

- `src/system/persistence/repositories/agentRepository.js`
- `src/system/persistence/repositories/orchestratorRepository.js`
- `src/system/persistence/repositories/directConnectRepository.js`
- `src/system/persistence/repositories/reportsRepository.js`
- `src/system/persistence/repositories/productionAutomationRepository.js`

Each repository supports list, getById, save, update, archive, restore, getHistory, createSnapshot, and validateRecord.

## Adapter Strategy

Implemented in `src/system/persistence/persistenceAdapters.js`.

Adapters:

- LocalStorage adapter: enabled for V1 local/admin use.
- In-memory adapter: enabled for tests and previews.
- Database placeholder adapter: disabled in V1 and throws `Database adapter is not enabled in Persistence V1.`

No external database connection, secret, vendor-specific credential, or backend dependency is introduced.

## Transaction History

Implemented in `src/system/persistence/transactionHistory.js`.

Transactions are append-only in V1 and include:

- `transaction_id`
- `entity_type`
- `entity_id`
- `operation`
- `repository`
- `actor`
- `timestamp`
- `schema_version`
- `before_hash`
- `after_hash`
- `safety_result`
- `status`
- `notes`

## Version History

Implemented in `src/system/persistence/versionHistory.js`.

Versions track revision metadata, record hashes, previous hashes, snapshot references, and change summaries. Rollback apply is blocked in V1 unless future code passes explicit local confirmation; current UI exposes preview-only behavior.

## Session Save / Restore

Implemented in `src/system/persistence/sessionSnapshots.js`.

Snapshot scopes:

- agents
- orchestrator
- direct_connect
- reports
- production_automation
- all_safe

Default restore is dry-run. Real local restore requires `{ confirmRestore: true }`. Snapshot validation runs the safety scanner and blocks unsafe payloads.

## Migration Support

Implemented in `src/system/persistence/migrationRegistry.js`.

Initial dry-run migrations:

- agents_local_v1_to_persistence_v1
- orchestrator_local_v1_to_persistence_v1
- direct_connect_local_v1_to_persistence_v1
- reports_local_v1_to_persistence_v1
- production_automation_v2_to_persistence_v1

Migration apply is blocked by default in V1. Dry-run planning reports readiness, warnings, safety scan results, and planned record counts without mutation.

## Safety Scanner

Implemented in `src/system/persistence/persistenceSafety.js`.

Visible safety copy:

> SHS Durable Persistence Layer V1 stores approved local operational records only. It does not store credentials, API keys, OAuth tokens, banking secrets, public approval mutations, or SHF Impact Data mutations.

The scanner blocks persistence of credentials, API keys, OAuth tokens, banking/account secrets, private keys, auth secrets, unsafe public approval mutation, and SHF Impact Data mutation markers.

All dangerous flags remain false:

- `public_approved_mutation_enabled = false`
- `shf_impact_data_mutation_enabled = false`
- `credential_persistence_enabled = false`
- `external_database_enabled = false`
- `external_api_enabled = false`
- `token_persistence_enabled = false`

## Admin UI

Route:

`admin.html#/ops/persistence`

Page:

`src/pages/admin/persistence/ShsPersistenceCenterPage.jsx`

Components:

- `PersistenceOverviewPanel`
- `PersistenceRepositoryPanel`
- `PersistenceTransactionHistory`
- `PersistenceVersionHistory`
- `PersistenceSessionSnapshots`
- `PersistenceMigrationPanel`
- `PersistenceSafetyPanel`

The UI shows persistence readiness, repository list, adapter status, transaction history, version history, session snapshots, migration dry-run status, safety scanner results, blocked dangerous persistence types, and database placeholder status.

Local/admin-safe actions:

- create local snapshot
- dry-run restore
- dry-run migration
- view transaction history
- view version history
- run safety scan

## Route / Access Control

Files modified:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`

Access:

- `/ops/persistence` is protected.
- `shs_admin` is the only allowed role.
- `client_admin` and public users remain blocked.

## Migration Path From localStorage

V1 does not refactor existing modules. It creates a bridge for future migrations:

1. Identify feature-specific local records.
2. Run dry-run migration readiness.
3. Safety-scan candidate payloads.
4. Create local snapshot before migration.
5. Save records through feature repositories.
6. Preserve transaction and version metadata.
7. Keep Data Approval Gateway and SHS / SHF boundaries intact.

## Validation Results

Validation results from this environment:

- `python3 -m json.tool docs/SHS_DURABLE_PERSISTENCE_LAYER_V1.json`: PASS
- `PYTHONPYCACHEPREFIX=/tmp/codex_pycache python3 -m py_compile scripts/check_shs_persistence_layer.py`: PASS
- `python3 scripts/check_shs_persistence_layer.py`: PASS
- `npm run check:shs-persistence`: PASS
- `npm run check:shs-orchestrator`: PASS
- `npm run check:governance`: PASS
- `bash scripts/run_daily_governance_audit.sh`: PASS
- `bash scripts/run_paid_launch_checks.sh`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

Build emitted existing non-blocking Vite circular-chunk and large-chunk warnings while exiting successfully.

## Browser Smoke

Browser smoke result: PASS_WITH_SOURCE_BACKED_PUBLIC_GUARD.

Verified in local browser:

- `admin.html#/ops/persistence` loads for SHS admin.
- Overview panel is visible.
- Repository panel is visible.
- Transaction history is visible.
- Version history is visible.
- Session snapshots are visible.
- Migration panel is visible.
- Safety panel is visible.
- Create local snapshot works.
- Dry-run restore works.
- Dry-run migration works.
- Safety scan works.
- Dangerous persistence types are blocked.
- Database adapter shows disabled/placeholder.
- `client_admin` is blocked and redirected to `/hub`.
- Existing Orchestrator, Agents, Reports, and Direct Connect routes still load.

Public/no-session access is source-verified through `ProtectedHubRoute`: unauthenticated users return `<Navigate to="/login" replace />`, and `/ops/persistence` is `shs_admin` only in `hubAccessControl`. The browser automation sandbox did not expose localStorage for clearing the active demo session, so the no-session live check is documented as source-backed rather than browser-cleared.

## Remaining Risks

- Persistence V1 is a bridge layer; existing systems still use their current local stores.
- The database adapter is intentionally disabled until owner-approved backend scope exists.
- Browser smoke depends on an available local dev server.
- Future migrations must remain dry-run first and pass safety review before any real data movement.

## V1 Complete

Status: **complete**.

Durable Persistence Layer V1 passed focused validation, governance validation, paid-launch checks, build, git diff hygiene, and browser smoke with the public/no-session guard source-verified.
