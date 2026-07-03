# SHS System Registry & Dependency Intelligence V1

## Executive Summary

SHS System Registry & Dependency Intelligence V1 is the V1.1 architecture intelligence layer for SHS OS. It maps layers, dependencies, dependents, routes, validators, docs, source files, repositories, reports, agents, lifecycle state, version history, health score, readiness, architecture timeline, and blast radius.

This layer describes the system. It does not run the system. It does not execute workflows, execute agents, mutate data, publish reports, change public approval, send external messages, write warehouse records, modify auth, store credentials, or call external APIs.

## Purpose

The registry answers:

- What layer owns this file or route?
- Which layers does a layer depend on?
- Which layers depend on it?
- Which validator protects it?
- Which docs define it?
- What safety rules apply?
- What lifecycle/version state is current?
- What is the likely blast radius if it changes?

## What Was Built

- Static registry entries for 32 layers.
- Registry entry type/default model.
- Dependency graph helpers.
- Blast-radius logic.
- Safety scanner.
- Readiness scoring.
- Metrics helpers.
- Lifecycle model.
- Version history model.
- Architecture timeline.
- Local review note storage.
- Local registry summary export.
- Admin UI at `admin.html#/ops/system-registry`.
- Focused validator and package script.

## Registry Entry Model

Each entry includes:

- `layer_id`
- `name`
- `category`
- `release_status`
- `production_status`
- `lifecycle_status`
- `current_version`
- `version_history`
- `release_commit`
- `release_tag`
- `release_date`
- `owner`
- `purpose`
- `owner_surface`
- `admin_route`
- `public_route`
- `docs`
- `validators`
- `package_scripts`
- `source_files`
- `data_contracts`
- `repositories`
- `agents`
- `reports`
- `dependencies`
- `dependents`
- `safety_rules`
- `health`
- `dangerous_capabilities`
- `readiness_score`
- `notes`

All dangerous capability flags default false.

## Initial Layer Entries

The initial registry includes 32 layers:

1. Master Layer Registry
2. Truth Spine
3. Oracle Layer
4. AI / Swarm Guardrails
5. Policy Engine
6. Readiness Gate
7. Public Approval
8. Security / Privacy
9. Data Ownership / IP
10. SHS Spine
11. SHS System Orchestrator
12. Durable Persistence Layer
13. Tracking Intelligence Layer
14. Agent Workbench
15. Agent Task Queue
16. Agent Approval Ledger
17. Agent Memory & Context
18. Agent Coordination
19. Agent Workflow Engine
20. Agent Controlled Executor
21. Production Automation V2
22. Direct Connect Batch 2
23. SHS Reports
24. ClientOps Center
25. Sales Command Center
26. Production Projects
27. QA + Delivery
28. Development Team Library
29. Daily Governance Audit
30. Paid Launch Checks
31. Watchtower / Audit Visibility
32. System Registry & Dependency Intelligence

## Dependency Graph

Implemented in `src/system/system-registry/shsSystemDependencyGraph.js`.

Functions:

- `getLayerById`
- `listLayers`
- `listByCategory`
- `listByReleaseStatus`
- `getDependencies`
- `getDependents`
- `getTransitiveDependencies`
- `getTransitiveDependents`
- `detectCircularDependencies`
- `detectMissingDependencies`
- `detectMissingDocs`
- `detectMissingValidators`
- `calculateLayerReadiness`
- `calculateSystemReadiness`

## Blast Radius Analysis

Implemented in `src/system/system-registry/shsSystemBlastRadius.js`.

Risk levels:

- Low: docs-only, no route, no shared contract.
- Medium: admin UI or local data only.
- High: route/access/shared system integration.
- Critical: governance, auth, public approval, SHF Impact, Truth Spine, Policy Engine, persistence, tracking, orchestrator, data ownership, or registry.

Blast-radius output includes direct dependents, transitive dependents, shared routes, shared files, validators to run, manual reviews required, risk level, and safe change guidance.

## Lifecycle Model

Implemented in `src/system/system-registry/shsSystemLifecycle.js`.

Lifecycle statuses:

- draft
- in_development
- validation
- governance_review
- release_candidate
- released
- deprecated
- archived

## Version History

Implemented in `src/system/system-registry/shsSystemVersionHistory.js`.

Version history records include version, status, date, and commit.

## Health Score

Health fields:

- validation
- documentation
- coverage
- governance
- smoke_tests
- dependencies
- performance
- security
- technical_debt
- overall

## Architecture Timeline

Implemented in `src/system/system-registry/shsSystemArchitectureTimeline.js`.

Timeline:

- Foundation / Governance
- Truth Spine
- Oracle
- Agent Fabric
- Production Automation
- Orchestrator
- Persistence
- Tracking Intelligence
- System Registry
- Future: Capability Registry
- Future: Event Bus / Message Spine
- Future: Scheduler
- Future: Observability V2
- Future: AI Decision Engine

## Safety Scanner

Implemented in `src/system/system-registry/shsSystemRegistrySafety.js`.

Visible safety copy:

> SHS System Registry & Dependency Intelligence V1 maps internal layer relationships only. It does not execute workflows, mutate data, publish reports, change public approval, send external messages, write warehouse records, or modify auth.

Scanner flags:

- missing docs
- missing validator
- missing route guard
- missing package script
- dangerous capability true
- public route with internal layer
- SHF Impact mutation risk
- public approval mutation risk
- credential storage risk
- external delivery risk
- warehouse write risk
- auth mutation risk
- dependency cycles
- orphaned layer
- unknown owner surface

## Admin UI

Route:

`admin.html#/ops/system-registry`

Page:

`src/pages/admin/system-registry/ShsSystemRegistryPage.jsx`

Components:

- `SystemRegistryOverviewPanel`
- `SystemLayerList`
- `SystemLayerDetail`
- `SystemDependencyGraphPanel`
- `SystemBlastRadiusPanel`
- `SystemReadinessPanel`
- `SystemRegistrySafetyPanel`
- `SystemValidatorMatrix`
- `SystemLifecyclePanel`
- `SystemArchitectureTimeline`

Actions:

- select layer
- filter by category
- filter by release status
- run local registry safety scan
- generate blast radius preview
- mark local review note
- export local registry summary to console/local data only

## Route / Access Control

Files modified:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`
- `src/system/routes/crossAppRouteBridge.js`

Access:

- `/ops/system-registry` is protected.
- `shs_admin` is the only allowed role.
- `client_admin` and public users remain blocked.

## Integration With Orchestrator, Persistence, Tracking

- Orchestrator static templates now include System Registry & Dependency Intelligence as a governance/readiness awareness layer.
- Tracking docs identify System Registry as a source for ownership, validator, and blast-radius awareness.
- Persistence docs identify System Registry local review notes and export summaries as future safe persistence candidates.

No existing V1.1 infrastructure layer was deeply refactored.

## What It Does Not Do

System Registry & Dependency Intelligence V1 does not:

- execute workflows
- execute agents
- mutate production data
- mutate SHF Impact Data Spine
- mark `public_approved`
- publish reports
- call external APIs
- send webhooks
- send notifications
- write warehouse records
- modify auth
- store credentials, tokens, OAuth data, API keys, private keys, or secrets
- scan the filesystem live from the browser
- add third-party analytics

## Validation Results

Validation passed in this environment:

- `python3 -m json.tool docs/SHS_SYSTEM_REGISTRY_DEPENDENCY_INTELLIGENCE_V1.json` - PASS
- `PYTHONPYCACHEPREFIX=/tmp/codex_pycache python3 -m py_compile scripts/check_shs_system_registry.py` - PASS
- `python3 scripts/check_shs_system_registry.py` - PASS
- `npm run check:shs-system-registry` - PASS
- `npm run check:shs-tracking` - PASS
- `npm run check:shs-persistence` - PASS
- `npm run check:shs-orchestrator` - PASS
- `npm run check:governance` - PASS
- `bash scripts/run_daily_governance_audit.sh` - PASS
- `bash scripts/run_paid_launch_checks.sh` - PASS after isolated rerun; the first concurrent run collided with another build clearing `dist`
- `npm run build` - PASS with existing Vite circular-chunk and large-chunk warnings
- `git diff --check` - PASS

## Browser Smoke

Browser smoke passed against `http://127.0.0.1:5174/admin.html#/ops/system-registry`:

- SHS admin can load `admin.html#/ops/system-registry`.
- Total layers are visible.
- Readiness score is visible.
- Layer health is visible.
- Lifecycle is visible.
- Version history is visible.
- Timeline is visible.
- Layer list is visible.
- Layer detail is visible.
- Dependency graph panel is visible.
- Blast radius panel is visible.
- Safety panel is visible.
- Validator matrix is visible.
- Category filter works.
- Release status filter works.
- Safety scan works.
- Blast radius preview works.
- Local review note works.
- Dangerous flags remain false.
- Local export summary works.
- `client_admin` is redirected to `admin.html#/hub` and cannot see the internal System Registry surface.

## Remaining Risks

- Registry entries are static declared metadata and must be updated as future layers change.
- Browser UI does not scan the filesystem live.
- Some older V1 layers have partial metadata until future package-specific audits enrich them.
- Future capability registry, event bus, scheduler, observability V2, and AI decision engine remain future-gated.

## V1 Complete

Status: complete after validation and browser smoke.
