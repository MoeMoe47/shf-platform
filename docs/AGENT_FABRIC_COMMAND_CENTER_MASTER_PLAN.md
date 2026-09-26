# Agent Fabric Command Center Master Plan

Status: audit approved. AFCC-0, AFCC-1, AFCC-2, AFCC-2A and AFCC-2A.1 implemented (read-only) on `feature/agent-fabric-command-center-v1`, pending review. **AFCC Visual Experience V3 (operational topology) implemented, read-only, not committed** — see "AFCC Visual Experience V3 — Operational Topology" below. **AFCC-2A.2 (SHS→Fabric read auth bridge) implemented, read-only, not committed** — see "AFCC-2A.2 — SHS → Fabric Read Auth Bridge" below. **AFCC-2A.3 (remaining safe reads bridged + canonical SHS dev startup) implemented, not committed.** AFCC-2B proposed; AFCC-3 onward not started. **Fabric admin key rotation required** (see AFCC-2A.1).

Implementation record: `docs/AGENT_FABRIC_COMMAND_CENTER_V1_ACCEPTANCE.md`.

Audit date: 2026-09-25

Primary source surfaces:

- `services/shf-agent-fabric/`
- `src/pages/admin/agent-fabric/AgentFabricPage.jsx`
- `src/router/AdminRoutes.jsx`
- `src/system/fabric/fabricConfig.js`
- Fabric-adjacent admin pages under `src/pages/admin/`
- SHS system registry under `src/system/system-registry/`

## Executive Finding

Agent Fabric is not a single page. It is a FastAPI governance and execution service, plus a set of SHS admin projections, local agent-workbench stubs, reporting/Truth surfaces, Watchtower/LOO risk machinery, service identity ingestion, and registry contracts.

The current `/admin.html#/agent-fabric` page is a thin canonical-agent governance surface. It reads only:

- `GET /admin/agents`
- `GET /admin/agents/verify`
- `GET /admin/agents/summary/health`
- `GET /admin/layers/gate/status`

It does not represent the full Fabric capability. A top-tier Agent Fabric Command Center should be a projection and orchestration console over existing authorities, not a duplicate authority.

## Source Authority Rules

The Command Center must preserve these boundaries:

- Truth Spine verifies claims and owns public/internal approval state.
- Oracle decides what verified evidence supports; it does not verify or publish.
- AI Guardrails constrain AI/swarm output.
- Policy Engine, Readiness Gate, Security/Privacy, Data Ownership/IP, and Public Approval own governed eligibility checks.
- Watchtower observes cross-program risk, quarantine, integrity, drift, and alerts.
- LOO owns outcome scoring/ranking and uses Watchtower risk gating.
- Agent Fabric admin registry owns canonical Fabric agents and layer toggles.
- SHS Agent Workbench owns local-only task, memory, coordination, workflow, approval, and controlled-execution stubs.
- SHS API is a producer into Fabric ingestion through HMAC/service identity. Fabric must not trust browser-supplied service identity.
- Funding APIs are read-only/compute-only except simulation and replay endpoints explicitly allow writes.
- Operator/outcomes/treasury endpoints are high-authority and should not be exposed just because they exist.

## Agent Fabric Capability Registry

| Capability | Owning Module | API Routes | Data Authority | Input | Output | Security Boundary | Current Frontend | Current Status | Command Center Relevance |
|---|---|---|---|---|---|---|---|---|---|
| Canonical Fabric agents | `fabric/agent_store.py`, `fabric/agent_canon.py`, `routers/admin_agents_routes.py`, `contracts/agents/agents.json`, `registry/*.agent.json` | `/admin/agents*` | Fabric registry and overrides | agent id, lifecycle, enabled flag, attestations | registered agents, health, events, readiness | `X-Admin-Key` for mutations; frontend route requires SHS audit/admin access | `/admin.html#/agent-fabric` | Ready, but V1 page is narrow | Core Agent Fleet |
| Layer enablement and gate | `fabric/layers/*`, `routers/admin_layers_routes.py`, `routers/admin_gate_routes.py` | `/admin/layers*`, `/admin/gate/*` | Fabric layer registry and `db/agent_store_overrides.json` | layer id, enabled, reason, approval ref | layer state, coverage, gate status/history | admin control; do not expose as casual toggle | `/agent-fabric` reads gate status | Ready | Governance & Policy, Infrastructure |
| Plan generation/approval | `routers/plan_routes.py`, `fabric/plan_store.py` | `/plan`, `/plans/recent`, `/plan/{id}`, `/plan/{id}/approve`, `/plan/{id}/reject` | Fabric plan store | agentName, input, planId | plan JSON, status | no decorator seen in route; treat as sensitive until backend auth is added/confirmed | Alignment Switchboard | Partial | Authority & Approvals, Run Trace |
| Run execution | `routers/runs_routes.py`, `fabric/run_ledger.py` | `/runs/validate`, `/runs/dry-run`, `/runs/execute`, `/runs/recent` | Fabric run log and plan store | planId, approved flag | runId, artifacts, event JSONL | `X-Admin-Key`; global execution gate | Alignment Switchboard | Ready for plan execution, limited run state | Live Operations, Run Trace |
| Legacy simple run/simulation | `routers/run_routes.py` | `/run`, `/execute-intervention`, `/simulate-outcome` | Fabric runtime handlers | intervention/outcome payload | simulation/execution result | no route-level auth in decorator; must be reviewed before surfacing | SHF Impact Command uses `/simulate-outcome`; IEP uses `/run` | Partial | Candidate read/diagnostic only |
| Artifacts | `routers/artifacts_routes.py`, `db/artifacts` | `/artifacts/{artifact_id}` | Fabric artifact store | artifact id | artifact JSON | no route-level auth observed | none direct | Partial | Run Trace evidence/artifact panel |
| Tools registry/runtime | `fabric/tools.py`, `fabric/tools_registry.py`, `fabric/tool_runtime.py`, `routers/tools_routes.py` | `/tools` | Fabric tool registry | none | tool list | no route-level auth observed | none direct | Partial | Agent capability inspection |
| Alignment gateway | `routers/alignment/*` | `/align/run`, `/admin/align/*` | Alignment app manifest, L25 policy, L26 containment | app id, requested agents/capabilities, planId | allowed/blocked, limits, audit ref, run result | `/align/run` requires `APP_GATEWAY_KEY`; admin routes mutate containment | Alignment Switchboard | Ready | Governance, Authority, Policy explainability |
| Containment | `routers/alignment/containment.py`, `routes_admin.py` | `/admin/align/containment*` | Alignment containment store | app state, blocked agents/caps | effective containment | admin only | Alignment Switchboard | Ready | High-authority admin action |
| Admin force mode | `routers/admin_force_routes.py`, `fabric/force_mode.py` | `/admin/force/status` | Fabric mode/force ledger | none | force status | `X-Admin-Key` | none | Ready/read-only | Security & Recovery |
| Registry entities | `fabric/registry.py`, `fabric/registry_event_ledger.py`, `routers/admin_registry_routes.py` | `/admin/registry*`, `/registry/ping` | Fabric registry and append ledger | entity id, lifecycle, attest | registry entries, events, verification | admin routes mutate registry; ping public-ish | `/admin.html#/registry` separate | Ready | Registry projection |
| Agent Contract Bridge | `services/agent_contract_bridge_service.py`, `routers/agent_contract_bridge_routes.py` | `/agent-contract-bridge/*` | Contract bridge service | none | health, summary, agents, alignment | no auth decorator observed | Agent Workbench component imports static bridge summary; separate backend route exists | Partial | Ecosystem Graph |
| Admin infra verification | `routers/admin_infra_verify_routes.py` | `/admin/infra/verify` | Fabric infra verifier | none | infra verification | admin route | none | Ready | Infrastructure & Health |
| Admin observability verification | `routers/admin_observability_routes.py` | `/admin/observability/verify` | Fabric observability verifier | none | observability checks | admin route | none | Ready | Observability |
| Health/readiness/degraded | `routers/health_routes.py`, `routers/status_routes.py` | `/health/live`, `/health/ready`, `/health/degraded`, `/status` | Fabric app runtime | none | live/ready/degraded/status | operational endpoint | none | Ready | Top status strip |
| Auth/session | `auth/routes.py`, `auth/dependencies.py`, `auth/permissions.py` | `/auth/*` | Fabric auth session store | login/session requests | session, audit, matrices | cookie sessions, CSRF for recent auth, roles/permissions | not main admin login; SHS frontend has its own context | Ready | Security & Trust |
| Truth Spine | `services/truth_spine_service.py`, `routers/truth_routes.py`, optional postgres repo | `/truth/*` | Truth Spine | sources, claims, approvals, federation | claims, packages, readiness, replay, audit/history | permission split: read, create, verify, approve, revoke | `/truth-spine` | Ready | Truth/Evidence/Proof, Run Trace |
| Operational ingestion | `services/operational_event_service.py`, `routers/shf_ingestion_routes.py` | `/shf/ingestion/events*` | Operational event store | events scoped to actor tenant/org | accepted event, storage status, truth projection | Fabric auth/session for normal route | none direct | Ready, dev JSONL by default | Evidence lineage |
| Internal SHS ingestion | `services/internal_service_identity.py`, `services/internal_ingestion_rate_limit_service.py`, `routers/shf_internal_ingestion_routes.py` | `/shf/internal/ingestion/events` | Fabric operational event + evidence/Truth projection | HMAC-signed SHS service event | event, projection, idempotency | HMAC service identity, allowed event pairs, tenant binding, rate limit | none | Ready | Security & Trust, Infrastructure |
| Operational telemetry | `services/operational_telemetry.py` | exposed through rate limit telemetry snapshots, admin observability | runtime counters/log events | event name, severity, category, outcome | safe counter snapshot/log | safe metadata allowlist | none | Partial | Operational telemetry only |
| Evidence projection | `services/evidence_projection_service.py` | via ingestion truth projection | operational event id | evidence record, Truth source/claim projection | service principal or Truth permissions | none | Ready, persistence depends on mode | Evidence lineage |
| Source Registry | `services/source_registry_service.py`, `routers/source_registry_routes.py` | `/source-registry/*` | source registry layer | evaluate/batch payload | source readiness and summary | no route-level auth observed | Watchtower summary consumes | Ready | Governance & Evidence |
| Data Federation | `services/data_federation_service.py`, `routers/data_federation_routes.py` | `/data-federation/*` | federation layer | evaluate payload | federation readiness | no route-level auth observed | Watchtower summary consumes | Ready | Ecosystem connection |
| Data Aggregator | `services/data_aggregator_service.py`, `routers/data_aggregator_routes.py` | `/data-aggregator/*` | aggregator layer | classify payload | sources/intake/summary | no route-level auth observed | none direct | Ready | Evidence pipeline |
| Data Normalization | `services/data_normalization_service.py`, `routers/data_normalization_routes.py` | `/data-normalization/*` | normalization layer | normalize payload | normalized records | no route-level auth observed | none direct | Ready | Evidence pipeline |
| Evidence Package | `services/evidence_package_service.py`, `routers/evidence_package_routes.py` | `/evidence-package/*` | evidence package layer | package build payload | package/readiness | no route-level auth observed | none direct | Ready | Truth/Evidence/Proof |
| Data Verification | `services/data_verification_service.py`, `routers/data_verification_routes.py` | `/data-verification/*` | readiness-only data verification | evidence package payload | readiness score, blockers, recommendations | does not verify Truth | docs and Watchtower | Ready | Evidence review |
| Data Approval Gateway | `services/data_approval_service.py`, `routers/data_approval_routes.py` | `/data-approval/*` | data approval layer | evaluate payload | gateway status | cannot mutate public data by itself | none direct | Ready | Authority & Approvals |
| Audit Verification | `services/audit_verification_service.py`, `routers/audit_verification_routes.py` | `/audit-verification/*` | audit verification layer | evaluate payload | audit/readiness/replay context | no route-level auth observed | `/verification-audit` adjacent | Ready | Evidence/Incident replay |
| Readiness Gate | `services/readiness_gate_service.py`, `routers/readiness_gate_routes.py` | `/readiness-gate/*` | readiness layer | evaluate payload | proceed/block status | must not publish or verify | Watchtower summary consumes | Ready | Governance |
| Public Approval | `services/public_approval_service.py`, `routers/public_approval_routes.py`, Truth public approval endpoints | `/public-approval/*`, `/truth/*public*` | public approval layer and Truth | evaluate or claim mutation | approval eligibility/approval state | SHS admin-only Truth permissions for actual approve/revoke | Truth page has toggle | Ready, high-risk UI action | Authority & Publishing |
| Security/Privacy | `services/security_privacy_service.py`, `routers/security_privacy_routes.py` | `/security-privacy/*` | security/privacy layer | evaluate payload | privacy blockers | does not approve/publish | Watchtower summary consumes | Ready | Security & Trust |
| Data Ownership/IP | `services/data_ownership_ip_service.py`, `routers/data_ownership_ip_routes.py` | `/data-ownership-ip/*` | ownership/IP layer | evaluate payload | release rights/consent blockers | does not approve/publish | Watchtower summary consumes | Ready | Governance |
| Policy Engine | `services/policy_engine_service.py`, `routers/policy_engine_routes.py` | `/policy-engine/*` | policy layer | evaluate payload | policy decision/violations | no override by Command Center | Watchtower summary consumes | Ready | Policy explainability |
| Event Webhook | `services/event_webhook_service.py`, `routers/event_webhook_routes.py` | `/event-webhook/*` | webhook readiness layer | evaluate payload | webhook readiness | safety rules say no external messages by default | none | Ready/readiness only | Infrastructure |
| API Gateway | `services/api_gateway_service.py`, `routers/api_gateway_routes.py` | `/api-gateway/*` | gateway readiness layer | evaluate payload | gateway readiness | no route-level auth observed | none | Ready | Infrastructure |
| Adapter Layer | `services/adapter_layer_service.py`, `routers/adapter_layer_routes.py` | `/adapter-layer/*` | adapter readiness layer | evaluate payload | adapter readiness | no route-level auth observed | none | Ready | Infrastructure |
| Batch Import | `services/batch_import_service.py`, `routers/batch_import_routes.py` | `/batch-import/*` | batch import readiness | evaluate payload | import readiness | no route-level auth observed | none | Ready | Operations |
| Warehouse Sync | `services/warehouse_sync_service.py`, `routers/warehouse_sync_routes.py` | `/warehouse-sync/*` | warehouse sync readiness | evaluate payload | sync readiness | safety rules say no warehouse writes from command views | none | Ready/readiness only | Infrastructure |
| Production Automation | `services/production_automation_service.py`, `routers/production_automation_routes.py` | `/production-automation/*` | automation readiness | evaluate payload | automation readiness | local/review-first | Agent Workbench local Production Automation V2 | Partial | Operations |
| Notification Alert | `services/notification_alert_service.py`, `routers/notification_alert_routes.py` | `/notification-alert/*` | notification readiness | evaluate payload | alert readiness | safety says no external messages by default | none | Ready/readiness only | Incidents |
| Verified Aggregation | `services/verified_aggregation_service.py`, `routers/verified_aggregation_routes.py` | `/verified-aggregation/*` | aggregation layer | evaluate payload | aggregation readiness and report/public candidates | cannot replace aggregator/approval gateway | Watchtower summary consumes | Ready | Evidence, Metrics |
| SHS Launch Ledger | `services/shs_launch_ledger_service.py`, `routers/shs_launch_ledger_routes.py` | `/shs-launch-ledger/*` | launch ledger | record/signoff/version/recalculate | launch readiness/audit | mutations should be admin/operator-gated | none direct | Ready | Ecosystem launch readiness |
| SHF metrics/reports | `services/metric_registry_service.py`, `routers/shf_metric_routes.py`, `routers/shf_reporting_routes.py` | `/shf/metrics/*`, `/shf/reports/*` | metric/report registry | metric id | report projections | permissions for trusted reporting in auth | Reporting pages | Ready | Institutional metrics |
| Reporting/proof/publication | `fabric/reports/*`, `routers/run_report_routes.py` | `/runs/report/*`, `/runs/reports/{id}/policy`, `/runs/reports/{id}/publish`, `/runs/published/*`, `/runs/public/*` | run registry + report builders + published registry | run id | JSON/PDF/proof/public report | publish requires `X-Admin-Key`; policy check controls eligibility | Reporting pages fetch PDF/actions | Ready, publish high-risk | Truth/Evidence/Proof |
| Watchtower | `fabric/watchtower/*`, `routers/watchtower_routes.py`, `routers/watchtower_attestation_routes.py` | `/watchtower/*` | Watchtower sqlite store, risk snapshots, attestation chain | program id/reason, scoring windows | summary, programs, quarantine, risk history, attest root/verify | quarantine mutates Watchtower; protect as Security/Admin action | `/watchtower` redirects to Agent Fabric; no dedicated page | Ready | Watchtower & Risk |
| LOO | `fabric/loo/*`, `routers/loo_routes.py`, `routers/loo_rankings_routes.py`, `routers/loo_adapters_routes.py` | `/loo/*`, `/runs/{id}/loo_payload` | LOO program catalog/adapters/run payload | payload/run id | scores, rankings, adapter status | advisory scoring; Watchtower can quarantine | `/lord-outcomes` separate public/admin app | Ready | LOO integration |
| Oracle | `services/oracle_service.py`, `routers/oracle_routes.py` | `/oracle/*` | Oracle cases/rulings | case questions and claim ids | supportability ruling | cannot verify/publish | `/oracle` | Ready | Run Trace, Policy Explainability |
| AI Guardrails | `services/ai_guardrails_service.py`, `routers/ai_guardrails_routes.py` | `/ai-guardrails/*` | guardrail policies/decision log | output check payload | allow/block decision | cannot be bypassed | `/ai-guardrails` | Ready | Governance, Security |
| Game Theory | `services/game_theory_service.py`, `routers/game_theory_routes.py`, `services/ai_layer/game_theory.py` | `/game-theory/*` | game theory scenarios/analyses | scenario payload | analysis/playbook/audit | advisory analysis | `/game-theory` | Ready | Policy/decision support |
| AI optimizer/feedback | `services/ai_layer/*`, `routers/live_optimizer_routes.py`, `comparison_routes.py`, `rules_routes.py`, `decision_routes.py`, `ai_feedback_routes.py` | `/optimizer/*`, `/rules/*`, `/decisions/*`, `/feedback` | AI layer data files and decisions | scenario/allocation/priority payloads | optimizer comparison, rules, decisions | advisory unless connected to plan execution | none direct | Partial | Decision support |
| Arena / ARAG-like agent arena | `fabric/arena/*`, `routers/arena_routes.py`, `arena_rollup_routes.py` | `/arena/*` | Arena store/rollup | agent draft, release, round signal/finalize | observation, metrics, LOO payload | release/finalize are high-authority/dev endpoints | none direct | Partial | Agent Fleet/Risk |
| Prediction/LOE/BFE | `fabric/predict/*`, `fabric/loe/*`, `services/ai_layer/bfe_engine.py`, routers | `/predict/*`, `/loe/*`, `/bfe/*` | predictive/BFE service | forecast/decision/outcome payloads | predictions, signals, BFE summary | advisory | Metaverse BFE card/test page | Partial | Ecosystem graph and decision context |
| Funding APIs | `fabric/funding/*`, `routers/funding_*` | `/api/funding/*` | funding rulesets/simulator/replay | simulate/replay payload | rulesets, signed manifest, decision replay | middleware enforces read-only + compute-only except simulate/replay | none direct | Ready | Governance, external partner systems |
| Operator/outcomes/treasury | `api/routes/operator_*`, `routers/api_v1/*`, `fabric/outcomes`, `fabric/pools`, `fabric/treasury`, `fabric/payouts` | `/api/v1/*` | outcomes, pools, contracts, treasury, payouts | contracts, outcomes, entries, settlements | balances, proofs, settlements | high-authority; do not expose broadly | operator/capital APIs | Partial | Ecosystem graph, not default actions |
| Contract runtime command-center routes | `routers/contract_runtime_routes.py` | `/api/v1-command-center/contract-foundation/*` | contract runtime | read filters | overview, identities, traces, failures | read-only routes, not mounted in `main.py` currently | none | Missing mount | Data gap |
| Truth pipeline runtime command-center routes | `routers/truth_pipeline_runtime_routes.py` | `/api/v1-command-center/truth-pipeline/*` | truth pipeline runtime state | ids | transitions/entities/traces/failures | read-only routes, not mounted in `main.py` currently | none | Missing mount | Data gap |

## Route Inventory

Legend:

- Browser candidate: route may be shown in Command Center after auth/permission review.
- Internal only: do not expose directly in browser command controls.
- Action candidate: only if backend already enforces the matching authority.

### Runtime

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| POST | `/plan` | `routers/plan_routes.py` | create plan | not observed | Alignment Switchboard | yes, after auth hardening | no | yes |
| GET | `/plans/recent` | `routers/plan_routes.py` | recent plans | not observed | Alignment Switchboard | yes | no | yes |
| GET | `/plan/{plan_id}` | `routers/plan_routes.py` | plan detail | not observed | Alignment Switchboard | yes | no | yes |
| POST | `/plan/{plan_id}/approve` | `routers/plan_routes.py` | approve plan | not observed | Alignment Switchboard | action only after auth hardening | no | partial |
| POST | `/plan/{plan_id}/reject` | `routers/plan_routes.py` | reject plan | not observed | Alignment Switchboard | action only after auth hardening | no | partial |
| POST | `/runs/validate` | `routers/runs_routes.py` | validate executable plan | `X-Admin-Key` | Alignment Switchboard | yes | no | yes |
| POST | `/runs/dry-run` | `routers/runs_routes.py` | preview writes | `X-Admin-Key` | Alignment Switchboard | yes | no | yes |
| POST | `/runs/execute` | `routers/runs_routes.py` | execute approved plan | global execution gate + `X-Admin-Key` | Alignment Switchboard/alignment gateway | action with approval | no | yes |
| GET | `/runs/recent` | `routers/runs_routes.py` | recent run events | `X-Admin-Key` | none | yes | no | yes |
| POST | `/runs/validate` | `routers/runs_routes.py` | run plan validation | `X-Admin-Key` | Alignment Switchboard | yes | no | yes |
| POST | `/runs/loo/validate` | `routers/runs_routes.py` | validate LOO payload | none observed | none | read/diagnostic | no | partial |
| POST | `/run` | `routers/run_routes.py` | legacy run | none observed | IEP command page | no until governed | no | no |
| POST | `/simulate-outcome` | `routers/run_routes.py` | simulate outcome | none observed | SHF command page | yes as simulation | no | partial |
| POST | `/execute-intervention` | `routers/run_routes.py` | intervention execution | none observed | none | no until governed | no | no |
| GET | `/artifacts/{artifact_id}` | `routers/artifacts_routes.py` | artifact fetch | none observed | none | yes | no | yes |
| GET | `/tools` | `routers/tools_routes.py` | tool registry | none observed | none | yes | no | yes |

### Admin

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| GET | `/admin/agents` | `admin_agents_routes.py` | list agents | admin route | AgentFabricPage | yes | no | yes |
| GET | `/admin/agents/verify` | `admin_agents_routes.py` | registry/ledger verification | admin route | AgentFabricPage | yes | no | yes |
| GET | `/admin/agents/events` | `admin_agents_routes.py` | agent event feed | admin route | none | yes | no | yes |
| GET | `/admin/agents/summary/health` | `admin_agents_routes.py` | health summary | admin route | AgentFabricPage | yes | no | yes |
| GET | `/admin/agents/summary/execution-readiness` | `admin_agents_routes.py` | execution readiness | admin route | none | yes | no | yes |
| GET | `/admin/agents/{agent_id}` | `admin_agents_routes.py` | agent detail | admin route | none | yes | no | yes |
| POST | `/admin/agents/{agent_id}` | `admin_agents_routes.py` | upsert agent | admin route | none | controlled action | no | admin only |
| POST | `/admin/agents/{agent_id}/dry-run` | `admin_agents_routes.py` | agent dry run | admin route | none | yes | no | yes |
| POST | `/admin/agents/{agent_id}/page-context-dry-run` | `admin_agents_routes.py` | page context dry run | admin route | SHF AgentSyncStatus | yes | no | yes |
| DELETE | `/admin/agents/{agent_id}` | `admin_agents_routes.py` | delete agent | admin route | none | no by default | no | security/admin only |
| GET | `/admin/agents/{agent_id}/enabled` | `admin_agents_routes.py` | read enabled state | admin route | none | yes | no | yes |
| POST | `/admin/agents/{agent_id}/enabled` | `admin_agents_routes.py` | enable/disable agent | admin route | none | controlled action | no | admin/security |
| POST | `/admin/agents/{agent_id}/lifecycle` | `admin_agents_routes.py` | set lifecycle | admin route | none | controlled action | no | admin |
| POST | `/admin/agents/{agent_id}/attest` | `admin_agents_routes.py` | attest agent | admin route | none | controlled action | no | admin/security |
| GET | `/admin/agents/health-summary` | `admin_agents_routes.py` | alternate health summary | admin route | none | yes | no | yes |
| GET | `/admin/layers` | `admin_layers_routes.py` | layer list | admin route | none | yes | no | yes |
| GET | `/admin/layers/{layer}/enabled` | `admin_layers_routes.py` | read layer enabled | admin route | none | yes | no | yes |
| POST | `/admin/layers/{layer}/enabled` | `admin_layers_routes.py` | set layer enabled | admin route | none | controlled action | no | admin/security |
| GET | `/admin/layers/registry` | `admin_layers_routes.py` | layer registry | admin route | none | yes | no | yes |
| GET | `/admin/layers/by-id/{layer_id}` | `admin_layers_routes.py` | layer by id | admin route | none | yes | no | yes |
| GET | `/admin/layers/coverage` | `admin_layers_routes.py` | coverage | admin route | none | yes | no | yes |
| GET | `/admin/layers/gate/status` | `admin_layers_routes.py` | layer gate status | admin route | AgentFabricPage | yes | no | yes |
| GET | `/admin/gate/status` | `admin_gate_routes.py` | admin gate status | admin route | none | yes | no | yes |
| GET | `/admin/gate/history` | `admin_gate_routes.py` | gate history | admin route | none | yes | no | yes |
| GET | `/admin/force/status` | `admin_force_routes.py` | force mode status | `X-Admin-Key` | none | yes | no | yes |
| GET | `/admin/infra/verify` | `admin_infra_verify_routes.py` | infra verify | admin route | none | yes | no | yes |
| GET | `/admin/observability/verify` | `admin_observability_routes.py` | observability verify | admin route | none | yes | no | yes |

### Registry

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| GET | `/registry/ping` | `registry_routes.py` | registry ping | none observed | none | yes | no | yes |
| GET | `/runs/registry/ping` | `runs_registry_routes.py` | run registry ping | none observed | none | yes | no | yes |
| GET | `/admin/registry` | `admin_registry_routes.py` | list registry entries | admin route | registry pages | yes | no | yes |
| GET | `/admin/registry/events` | `admin_registry_routes.py` | registry events | admin route | registry pages | yes | no | yes |
| GET | `/admin/registry/events/ledger` | `admin_registry_routes.py` | ledger view | admin route | registry pages | yes | no | yes |
| GET | `/admin/registry/events/verify` | `admin_registry_routes.py` | verify ledger | admin route | registry pages | yes | no | yes |
| GET | `/admin/registry/{entity_id}` | `admin_registry_routes.py` | entity detail | admin route | registry pages | yes | no | yes |
| POST | `/admin/registry/upsert` | `admin_registry_routes.py` | upsert entity | admin route | registry pages | controlled action | no | admin |
| POST | `/admin/registry/{entity_id}/lifecycle` | `admin_registry_routes.py` | set lifecycle | admin route | registry pages | controlled action | no | admin |
| POST | `/admin/registry/{entity_id}/attest` | `admin_registry_routes.py` | attest entity | admin route | registry pages | controlled action | no | admin/security |
| GET | `/admin/registry/{entity_id}/verify` | `admin_registry_routes.py` | verify entity | admin route | registry pages | yes | no | yes |

### Reporting / Evidence / Publishing

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| GET | `/runs/reports/{run_id}/policy` | `run_report_routes.py` | report policy check | none observed | reporting pages | yes | no | yes |
| POST | `/runs/reports/{run_id}/publish` | `run_report_routes.py` | publish report/proof | `X-Admin-Key` | none direct | controlled action | no | approver/admin |
| GET | `/runs/published/{run_id}` | `run_report_routes.py` | published JSON | public-ish | none | yes if public | no | yes |
| GET | `/runs/published/{run_id}/pdf` | `run_report_routes.py` | published PDF | public-ish | none | yes if public | no | yes |
| GET | `/runs/published/{run_id}/proof` | `run_report_routes.py` | published proof | public-ish | none | yes | no | yes |
| GET | `/runs/public/{run_id}` | `run_report_routes.py` | public report index/detail | public-ish | none | yes | no | yes |
| GET | `/runs/report/{run_id}` | `run_report_routes.py` | run report JSON | none observed | reporting pages | yes | no | yes |
| GET | `/runs/report/{run_id}/pdf` | `run_report_routes.py` | run PDF | none observed | reporting pages | yes | no | yes |
| GET | `/runs/report/{run_id}.pdf` | `run_report_routes.py` | legacy PDF | none observed | reporting pages | yes | no | yes |
| GET | `/runs/report/{run_id}/platypus-preview` | `run_report_routes.py` | institutional PDF preview | none observed | none | yes | no | yes |
| GET | `/reports/snapshot` | `reports_routes.py` | reports snapshot | none observed | ReportsDashboard | yes | no | yes |
| GET | `/reports/usage.csv` | `reports_routes.py` | usage CSV | none observed | none | yes | no | yes |
| GET | `/reports/containment.csv` | `reports_routes.py` | containment CSV | none observed | none | yes | no | yes |
| GET | `/reports/outcomes.csv` | `reports_routes.py` | outcomes CSV | none observed | none | yes | no | yes |
| GET | `/reports/system.csv` | `reports_routes.py` | system CSV | none observed | none | yes | no | yes |
| GET | `/evidence-package/*` | `evidence_package_routes.py` | package health/schema/summary/readiness | none observed | Watchtower | yes | no | yes |
| POST | `/evidence-package/build` | `evidence_package_routes.py` | build package | none observed | none | action after auth review | no | partial |
| POST | `/evidence-package/batch-build` | `evidence_package_routes.py` | batch package build | none observed | none | action after auth review | no | partial |
| GET/POST | `/data-verification/*` | `data_verification_routes.py` | readiness eval | none observed | docs/Watchtower | yes | no | yes |
| GET/POST | `/audit-verification/*` | `audit_verification_routes.py` | audit eval | none observed | VerificationAuditSurface adjacent | yes | no | yes |

### Truth

Routes from `routers/truth_routes.py`: `GET /truth/health`, `GET /truth/public/claims`, `GET /truth/public/claims/{claim_id}`, `GET /truth/public/packages`, `GET /truth/public/package/{claim_id}`, `GET /truth/coverage`, `GET /truth/drift`, `GET /truth/federation`, `GET /truth/federation/systems/{system_id}`, `GET /truth/claims`, `GET /truth/claims/{claim_id}`, `GET /truth/claims/{claim_id}/versions`, `GET /truth/packages`, `GET /truth/package/{claim_id}`, `GET /truth/sources`, `GET /truth/envelope/{claim_id}`, `GET /truth/readiness/{claim_id}`, `GET /truth/replay/{claim_id}`, `POST /truth/sources`, `POST /truth/sources/{source_id}/verify`, `POST /truth/claims`, `PATCH /truth/claims/{claim_id}`, `POST /truth/claims/{claim_id}/approve-public`, `POST /truth/claims/{claim_id}/approve-internal`, `POST /truth/claims/{claim_id}/revoke-internal`, `POST /truth/claims/{claim_id}/revoke-public`, `POST /truth/claims/{claim_id}/public-population-eligibility`, `POST /truth/public-population-authorities`, `GET /truth/public-population-authorities`, `POST /truth/public-population-authorities/{authority_id}/revoke`, `POST /truth/claims/{claim_id}/public-population-signoff`, `GET /truth/claims/{claim_id}/public-population-signoffs`, `POST /truth/public-population-signoffs/{signoff_id}/revoke`, `GET /truth/claims/{claim_id}/public-population-eligibility`, `POST /truth/claims/{claim_id}/public-population-eligibility/{eligibility_id}/revoke`, `PATCH /truth/public-approval/{claim_id}`, `POST /truth/federation/systems`, `GET /truth/audit-feed`, `GET /truth/history`, `GET /truth/history/{entity_id}`.

Browser rule: read routes are candidates. Mutation routes are existing Truth authority actions only and must map to Truth permissions (`truth.source.create`, `truth.source.verify`, `truth.claim.create`, `truth.claim.update`, public/internal approve/revoke, authority/signoff management). Do not reimplement Truth approval in Command Center.

### Watchtower

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| GET | `/watchtower/summary` | `watchtower_routes.py` | cross-program summary | none observed | none | yes | no | yes |
| GET | `/watchtower/programs` | `watchtower_routes.py` | program rows | none observed | none | yes | no | yes |
| GET | `/watchtower/quarantine` | `watchtower_routes.py` | quarantine map | none observed | none | yes | no | yes |
| POST | `/watchtower/quarantine/{program_id}` | `watchtower_routes.py` | set quarantine | none observed | none | controlled action only after auth review | no | security/admin |
| DELETE | `/watchtower/quarantine/{program_id}` | `watchtower_routes.py` | clear quarantine | none observed | none | controlled action only after auth review | no | security/admin |
| GET | `/watchtower/risk/history` | `watchtower_routes.py` | risk history | none observed | none | yes | no | yes |
| GET | `/watchtower/attest/root` | `watchtower_attestation_routes.py` | attestation root | none observed | none | yes | no | yes |
| POST | `/watchtower/attest/verify` | `watchtower_attestation_routes.py` | verify attestation | none observed | none | yes | no | yes |

### LOO

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| GET | `/loo/health` | `loo_routes.py` | health | none observed | LOO/Watchtower | yes | no | yes |
| POST | `/loo/validate` | `loo_routes.py` | schema validate | none observed | none | yes | no | yes |
| POST | `/loo/score` | `loo_routes.py` | score payload | none observed | none | yes | no | yes |
| POST | `/loo/score_run` | `loo_routes.py` | score using run targets | none observed | none | yes | no | yes |
| GET | `/loo/programs` | `loo_routes.py` | program catalog | none observed | Watchtower | yes | no | yes |
| GET | `/loo/rankings` | `loo_rankings_routes.py` | rankings with risk gating | none observed | Watchtower | yes | no | yes |
| GET | `/loo/adapters` | `loo_adapters_routes.py` | adapter status | none observed | none | yes | no | yes |
| GET | `/runs/{run_id}/loo_payload` | `runs_loo_payload_routes.py` | run LOO payload | none observed | none | yes | no | yes |
| POST | `/runs/{run_id}/loo_payload` | `runs_loo_payload_routes.py` | set LOO payload | none observed | none | action after auth review | no | partial |

### Oracle / Game Theory / AI Guardrails / Alignment

Oracle routes: `GET /oracle/health`, `GET /oracle/cases`, `POST /oracle/cases`, `GET /oracle/cases/{case_id}`, `POST /oracle/cases/{case_id}/rule`, `GET /oracle/rulings`, `GET /oracle/rulings/{ruling_id}`, `GET /oracle/cases/{case_id}/ruling`. Current consumer: `/admin.html#/oracle`. Command Center should read cases/rulings and link out or embed read panels; create/rule actions require Oracle authority.

AI Guardrails routes: `GET /ai-guardrails/health`, `GET /ai-guardrails/policies`, `POST /ai-guardrails/check-output`, `GET /ai-guardrails/decisions`, `GET /ai-guardrails/decisions/{decision_id}`, `GET /ai-guardrails/audit-feed`. Current consumer: `/admin.html#/ai-guardrails`. Command Center should surface decision/audit history and allow check-output as diagnostic only.

Game Theory routes: `GET /game-theory/health`, `GET /game-theory/scenarios`, `POST /game-theory/scenarios`, `GET /game-theory/scenarios/{scenario_id}`, `POST /game-theory/scenarios/{scenario_id}/analyze`, `GET /game-theory/analyses`, `GET /game-theory/analyses/{analysis_id}`, `GET /game-theory/scenarios/{scenario_id}/analysis`, `GET /game-theory/strategy-playbook`, `GET /game-theory/audit-feed`. Current consumer: `/admin.html#/game-theory`. Command Center should embed scenario/risk context but leave strategy authority with Game Theory.

Alignment routes: `POST /align/run`, `GET/PATCH /admin/align/apps`, `GET/PATCH /admin/align/containment`, `POST/DELETE /admin/align/containment/apps/{app_id}`, `GET /admin/align/plans`, `POST /admin/align/plans/{plan_id}/validate`, `POST /admin/align/plans/{plan_id}/dry-run`, `POST /admin/align/plans/{plan_id}/approve-execute`. Gateway route requires `APP_GATEWAY_KEY`; admin containment routes are high-authority.

### Security / Health / Operations

Security/readiness routes: `/security-privacy/*`, `/data-ownership-ip/*`, `/policy-engine/*`, `/readiness-gate/*`, `/public-approval/*`, `/adapter-layer/*`, `/api-gateway/*`, `/batch-import/*`, `/warehouse-sync/*`, `/production-automation/*`, `/notification-alert/*`, `/verified-aggregation/*`, `/source-registry/*`, `/data-federation/*`, `/data-aggregator/*`, `/data-normalization/*`.

Each follows the common pattern:

- `GET /health`
- `GET /schema`
- `GET /summary`
- `POST /evaluate`
- `POST /batch-evaluate`
- `GET /readiness`

Exceptions:

- Data Aggregator exposes `/sources`, `/intake-queue`, `/classify`.
- Data Normalization exposes `/normalize`, `/batch-normalize`.
- Source Registry exposes `/sources`.

Browser rule: health/summary/readiness are first-class candidates; evaluation endpoints can power diagnostic tools if permissions are added or confirmed.

### Ingestion / Events

| Method | Path | Router | Purpose | Auth/Role | Consumer | Browser? | Internal? | Candidate? |
|---|---|---|---|---|---|---|---|---|
| POST | `/events/ingest` | `events_routes.py` | ingest normalized event | none observed | none | no until auth reviewed | yes-ish | no |
| POST | `/events/normalize` | `events_routes.py` | normalize only | none observed | none | diagnostic | no | partial |
| POST | `/shf/ingestion/events` | `shf_ingestion_routes.py` | create operational event | Fabric auth/actor checks in service | SHS/Fabric | no direct | yes | no |
| GET | `/shf/ingestion/events` | `shf_ingestion_routes.py` | read scoped events | auth/actor scope | none | yes, scoped | no | yes |
| GET | `/shf/ingestion/storage` | `shf_ingestion_routes.py` | storage status | auth/actor scope | none | yes | no | yes |
| POST | `/shf/ingestion/events/{event_id}/truth-projection` | `shf_ingestion_routes.py` | project event to Truth | auth/permission | none | controlled action | no | approver/admin |
| POST | `/shf/internal/ingestion/events` | `shf_internal_ingestion_routes.py` | HMAC SHS service ingestion | service identity + rate limit | SHS API outbox/producer | no | yes | no direct |

### Funding / Operator / Outcomes

Funding routes under `/api/funding/*` include health, partner capabilities, SDK/examples/schemas/postman/version/changelog/manifest, rulesets, lock triggers, discovery, `POST /api/funding/simulate`, and replay record/read endpoints. Middleware enforces read-only + compute-only except simulate and replay. Show as read/diagnostic; do not turn replay into casual browser write controls.

Operator/outcomes/treasury routes under `/api/v1/*` include AAL events/health/risk/feedback/priority queue, control hold/release, outcomes submit/verify/replay/chain/proof/signature, pools, payouts, treasury, contracts, contract issuances, allocations, ledger, disputes, overrides, approvals, and execution. These are ecosystem/high-authority routes. The Command Center should show their presence and health/dependencies, not expose write actions by default.

## Ecosystem Connection Matrix

| System | Fabric -> System | System -> Fabric | API Routes / Events | Data Exchanged | Authority Boundary | Auth/Tenant Boundary | Evidence Produced | Failure Behavior | Current UI Visibility |
|---|---|---|---|---|---|---|---|---|---|
| SHF Impact Command | Provides `/simulate-outcome`, agent page-context dry run, Oracle/Fabric base | SHF command consumes Fabric simulation and agent sync | `/simulate-outcome`, `/admin/agents/ai_analyst_agent/page-context-dry-run` | simulation payload, page context, agent health | SHF command cannot bypass Fabric agent policy | frontend uses Fabric base/admin headers | run-like simulation output, page dry-run | UI falls back/errors | `/admin.html#/command` |
| SHS API | Receives internal events via HMAC; may create Truth projections | Emits signed operational events/outbox into Fabric | `/shf/internal/ingestion/events` | lesson/referral/report/grant/funding/workforce/GPA events | SHS owns source events; Fabric owns ingestion/evidence/Truth projection | HMAC `service:shs-api`, tenant `tenant:{organization_id}`, idempotency | operational event, evidence record, Truth source/claim if eligible | 401/403 auth rejection, 429 rate limit, 503 projection failure | no dedicated UI |
| BOS / Executive Command | Provides system registry, agent/workbench, reports posture | BOS pages navigate/link to Fabric surfaces | frontend registry/executive pages, no direct Fabric-only route | readiness, risks, dependencies | BOS observes; does not replace Fabric authorities | SHS permissions | registry/readiness evidence | local UI warnings | `/ops/executive-command`, `/ops/system-registry` |
| CivicSure / Hub / ClientOps | Fabric can ingest referral-created and reporting events | Hub systems can feed events through SHS API | producer `hub.referral`, event `referral.created` | referral operational event, tenant/org, evidence refs | Hub owns referral lifecycle; Fabric owns evidence projection | service identity and org scope | event/evidence/Truth draft if lineage eligible | non-projectable or projection failure | Hub pages; reports |
| Truth Spine | Fabric services write/read Truth | Truth is Fabric-owned authority | `/truth/*`, projection service | sources, claims, packages, readiness, replay, audit | Truth verifies and approves; Command Center observes/actions only through Truth API | role/permission split, tenant/global scope | Truth packages, claim versions, audit | permission denied/fail closed | `/truth-spine` |
| Oracle | Fabric exposes cases/rulings | Oracle consumes Truth packages | `/oracle/*` | claim ids, questions, rulings, confidence, warnings | Oracle decides supportability only | admin route/SHS route protection | ruling packages | insufficient evidence | `/oracle` |
| AI Guardrails | Fabric exposes policies/decisions | Agents/output checks use guardrails | `/ai-guardrails/*` | output payloads, decisions, audit | Guardrails constrain output; no Truth/publish authority | admin route/SHS route protection | audit-feed decisions | block/warn | `/ai-guardrails` |
| Game Theory | Fabric exposes scenario analysis | Operators create/analyze scenarios | `/game-theory/*` | scenarios, analyses, playbook | advisory decision support | admin route/SHS route protection | audit feed | analysis error | `/game-theory` |
| Autonomous Registry | Fabric registry/entity ledger | Admin registry upserts/attests | `/admin/registry*`, contracts/registry | entity metadata, lifecycle, attestations | Registry owns entity truth | admin authority | ledger events/proofs | ledger verify fail | `/registry`, `/app-registry` |
| Autonomous Trust Bureau | Inferred from Truth/Public Approval/Watchtower trust layers | Trust posture consumed by reports | Truth, Watchtower, Public Approval | trust/readiness/approval state | no separate backend module found; do not fabricate | inherited | packages/attestations | unavailable | represented indirectly |
| Agent Reporting Agency | Reports/proof generation | Reports consume run/evidence/Truth | `/runs/report/*`, `/reports/*`, `/shf/reports/*` | run reports, PDFs, proof, metrics | Reports communicate, do not verify | publish `X-Admin-Key`; read routes vary | report proof, PDF hash | policy blocks publish | reporting pages |
| Watchtower | Consumes LOO, Truth, layer summaries | Stores risk/quarantine/attestations | `/watchtower/*` | risk bands, alerts, quarantine, chain roots | Watchtower observes/quarantines; does not rank authority beyond risk gate | should be security/admin for quarantine | risk snapshots/attestations | startup hard-fails on store/risk lock if configured | redirect only; no dedicated page |
| LOO | Scores/ranks programs | Uses run payloads/program adapters | `/loo/*`, `/runs/{id}/loo_payload` | program scores, targets, trust metadata | LOO ranks/advises; Watchtower gates quarantines | no route auth observed | ranking evidence | adapter failures lead quarantine | `/lord-outcomes` |
| ARAG-1 / Arena | Provides agent arena metrics and LOO payload | Arena writes rollup | `/arena/*` | agent drafts, round signals, metrics | release/finalize are high-authority/dev | no route auth observed | LOO payload, metrics | adapter errors | no direct admin page found |
| Career Center / Curriculum / Learning Arcade | SHS API emits lesson/progress proof events | Fabric ingests lesson events | `curriculum.lesson`, `lesson.completed`, prepare/prove evidence via SHS API | learning progress, evidence refs | Curriculum owns learner progress; Fabric owns institutional evidence projection | service identity + tenant | op event/evidence/Truth draft | unsupported event rejected | curriculum/progress pages |
| Metaverse | BFE status and market/opportunity systems can consume Fabric | Metaverse BFE UI reads Fabric | `/bfe/summary`, `/bfe/decision`, `/bfe/outcome` | BFE intelligence/decision/outcome | BFE advisory | no route auth observed | BFE outcome | fetch failure | Metaverse BFE pages |
| OAS | No direct code connection found in audited files | none confirmed | none confirmed | none confirmed | do not fabricate | none | none | n/a | OAS pages only |
| Treasury / Capital Operator | Fabric owns treasury/pools/operator allocations | Capital/operator UI consumes operator APIs | `/api/v1/treasury/*`, `/api/v1/operator/*`, `src/lib/capital/operatorApi.js` | pool balances, contracts, allocations, ledger | Treasury/operator routes are financial authority | auth not observed in route decorators; must be hardened before UI actions | ledger/proof | settlement/validation errors | capital/operator pages |
| Identity / Organization/Tenant | Fabric auth sessions and service tenant scope | SHS frontend route protection and internal ingestion scopes org | `/auth/*`, internal ingestion `tenant:{org}` | users, role, permissions, tenant/org ids | Identity owns access; Fabric services enforce scoped reads/writes | session cookies, permissions, HMAC | auth audit events | 401/403 | login/identity pages |
| Reporting / Impact systems | Fabric reports and metrics feed reporting | Reporting pages request PDFs/actions | `/runs/report/*`, `/shf/reports/*` | metric reports, PDFs, proof | Reporting cannot verify or approve | reports permissions/admin publish | proof packs | policy block | `/reporting`, `/ops/reports` |
| Studio/Web Builder | No direct backend Fabric route confirmed | System registry depends on production automation/readiness | production automation/readiness routes | launch readiness | Studio owns builds; Fabric can observe readiness | SHS permissions | readiness evidence | unavailable | `/builder`, `/ops/*` |
| Universe | Frontend registry references Agent Workbench | none confirmed | none confirmed | destination links/context | Universe is presentation/projection | route bridge only | none | n/a | `/universe` |
| Admin systems | Admin routes project Fabric authorities | Admin pages consume Fabric | many `/admin/*`, `/truth/*`, `/oracle/*` | health, registry, agents, reports | Admin UI must not create new authority | SHS permissions + Fabric admin/session headers | audits/ledgers | access restricted/errors | admin shell |

## Canonical Run Lifecycle

Actual persisted lifecycle from code:

1. Identity/session or admin/service key is presented.
2. Organization/tenant is resolved for session-scoped ingestion or supplied through internal service event scope.
3. Work order is represented as a plan or local Agent Workbench task, not as one unified backend `WorkOrder` entity.
4. Policy/containment is checked by alignment (`/align/run`) using app manifest state, blocked/allowed agents, blocked/allowed capabilities, safe capabilities in LIMITED mode, and L26 containment.
5. Agent metadata is loaded from Fabric registry (`registry/*.agent.json`) or current admin agent registry.
6. Model/provider constraints are not first-class in the run execution code audited; mark missing.
7. Tool calls are represented in plan steps. Current concrete executor writes `save_draft_artifact` artifacts only.
8. Resource constraints are implicit in plan/tool args and policy; no first-class resource permission graph found.
9. Approval is enforced by `approvalRequired` on plan and `approved` payload flag in `/runs/execute`; `/align/run` can force `approved=false` unless app swarm state is `ON`.
10. Execution writes draft artifacts, marks plan `DONE`, writes run event to `db/runs/events.jsonl`.
11. Events are normalized through `fabric/events/schema.py` where applicable and operational events can be ingested separately.
12. Evidence can be projected from operational events through `evidence_projection_service.py`.
13. Truth projection creates/links Truth sources and claims only when lineage says `TRUTH_ELIGIBLE`.
14. Outcome is stored as artifacts/run event or outcome/LOO payload depending on route.
15. Report is generated from run id using `fabric/reports/funder_report.py` and PDF builder.
16. Publication uses `/runs/reports/{run_id}/publish` after policy checks: run mode `PILOT` or `SYSTEM`, `app_id`, `site`, `start_ts`, `end_ts`, `publish_allowed`, `data_allowed`, visibility `PUBLIC` or `PRIVATE`.

Prompt states vs code:

- `AUTHORIZED`: represented by plan approved flag, alignment allowed decision, admin key/session, but not as canonical run state.
- `RUNNING`: not found as persisted run state.
- `WAITING`: not found as persisted run state.
- `DENIED`: represented as alignment `blocked`, HTTP errors, policy blockers; not canonical run state.
- `FAILED`: not found as persisted run state except errors/audit events.
- `TIMED_OUT`: timeout policy fields not found as run state.
- `REVOKED`: exists in Truth/public approvals/session revocation/credential revocation, not run lifecycle.
- `SUCCEEDED`: represented as event outcome `ok`, plan status `DONE`, not canonical run state.

Authority enforcement points:

- Route access: SHS frontend `PermissionGuard` and `hubAccessControl`.
- Fabric sessions/permissions: `auth/dependencies.py`, `auth/permissions.py`.
- Admin key: `fabric/admin_auth.py`, `fabric/security.py`, route headers.
- Service identity: `services/internal_service_identity.py`.
- Rate limit: `services/internal_ingestion_rate_limit_service.py`.
- Global execution gate: `fabric/layers/global_gate.py` via `/runs/execute`.
- Alignment containment/policy: `routers/alignment/routes_gateway.py`, `policy.py`, `containment.py`.
- Truth permissions: create/verify/approve/revoke separated in `auth/permissions.py`.
- Watchtower startup locks: registry ledger, snapshot store, risk engine hash lock.
- Funding policy guard middleware blocks unauthorized funding mutations.

## Governance Map

| Governance Area | Current Mechanism | Operator View | Operator Action | Admin/Security Action | Gaps |
|---|---|---|---|---|---|
| Alignment Layer | app manifests, L25 policy, L26 containment | app state, blocked agents/caps, audit refs | validate/dry-run plans | force app containment, approve-execute | richer relationship graph |
| Policy manifests | `complianceProfiles`, funding rulesets, policy engine | active policies, policy decisions | evaluate diagnostic payloads | policy edits only where backend supports | no central policy catalog API |
| Containment | `/admin/align/containment*`, layer/agent disable | current containment | request review | disable/enable, force OFF/LIMITED | auth review on admin routes |
| Approval requirements | plan `approvalRequired`, Agent Workbench approval ledger | queue, required approvals | approve/deny where backend supports | override only through existing endpoints | no unified approval API |
| Publish eligibility | run report policy check, Truth readiness/public approval | can publish, blockers, fixes | request publish | publish via `/runs/reports/{id}/publish` | stronger permission than admin key desired |
| Public/private visibility | run report policy `visibility`, Truth public approval | visibility badges | none | publish/revoke via existing APIs | visibility not unified across all artifacts |
| Tool permissions | agent allowedTools, plan step tool names | inspect allowed tools | dry-run | mutate agent registry only via admin APIs | no backend resource permission matrix |
| Resource permissions | partial in policy/readiness layers | blockers | none | none until API exists | missing explicit resource graph |
| Model/provider constraints | not first-class in audited code | show missing | none | none | missing model/provider registry |
| Revocation | auth session revoke, Truth public/internal revoke, Watchtower quarantine | revoked/quarantined state | propose/review | revoke session/approval, quarantine | run revocation missing |
| Timeout | no canonical run timeout | show missing | none | none | missing timeout state/API |
| Human override | plan approval, Truth approve/revoke, containment overrides | audit trail | approve/deny | admin/security controls | unified override audit missing |
| Fail-closed | startup Gate G, ledger verify, Watchtower store/lock, auth config, production key requirements | status strip | none | fix config | surface startup-block reasons |

## Observability Map

Operational telemetry:

- `services/operational_telemetry.py` emits safe event counters/logs with metadata allowlist.
- Internal ingestion emits auth rejections, rate-limit decisions, backend failures, operational event accept/reject, persistence failure.
- Health routes expose live/ready/degraded.
- Admin infra and observability verification routes exist.
- Watchtower startup verification can hard-fail on ledger/snapshot/risk-engine lock.
- Rate limit telemetry snapshot is available through service-level function, not a dedicated route.
- Operational event storage status reports JSONL vs production-ready posture.

Evidence / Truth / institutional metrics:

- Operational events are source records, not telemetry.
- Evidence records and projection results are institutional evidence.
- Truth claims/packages/readiness/replay are verification authority.
- LOO scores/rankings are institutional outcome metrics.
- Watchtower risk snapshots/attestations are governance evidence, not runtime logs.
- SHF reports and PDFs are institutional reporting outputs.

Do not combine these in one chart. The Command Center should have separate lanes:

- Operations health: process, route, storage, rate limit, degraded state, latency/failure if available.
- Evidence/Truth: lineage, claim/source/package/readiness/replay.
- Institutional metrics: LOO, reports, public approval candidates, verified aggregation.

## Watchtower + LOO Integration

Watchtower:

- Builds summary from LOO rankings plus Truth, source registry, data federation, aggregator, normalization, evidence, verification, approval, readiness, public approval, security/privacy, ownership/IP, policy, API gateway, adapter, batch import, warehouse sync, production automation, notification alert, verified aggregation.
- Stores manual quarantine, risk history, risk snapshots, attestations, enforcement flags in sqlite.
- Risk bands: `GREEN`, `YELLOW`, `RED`, `QUARANTINE`.
- Actions: `ALLOW`, `DEGRADE`, `QUARANTINE`.
- Quarantine triggers include `ok=false`, `adapter_ok=false`, contract errors, missing/no ranking row.
- Startup can verify snapshot store and risk engine hash lock.

LOO:

- Validates/scoring payloads.
- `score_run` injects targets from Run Registry.
- Rankings use program catalog/adapters, health, delta, volume, quality.
- Applies Watchtower risk fields and manual quarantine; quarantined programs get score `0.0` and cannot win.
- Advisory note: LOO ranks outcomes; Truth Spine metadata gates reporting readiness.

Command Center presentation:

- Show Watchtower as risk/integrity/quarantine authority.
- Show LOO as outcome ranking/scoring authority.
- In a combined view, display "LOO rank after Watchtower gate" and "raw factors" separately.
- Do not allow LOO score editing.
- Quarantine/release should be Security/Admin only and routed to Watchtower endpoints after auth review.

## Registry Map

| Registry | Owner | Owns | Current Source | Command Center Rule |
|---|---|---|---|---|
| Agent Registry | Agent Fabric | canonical Fabric agents, lifecycle, policy, tools | `contracts/agents/agents.json`, `registry/*.agent.json`, `/admin/agents` | project truth, allow admin actions only through Fabric |
| App Registry | Alignment / frontend app registry | apps and alignment states | `registry/alignment/app_registry.json`, frontend AppRegistry | do not merge with agent registry |
| Data Registry / Source Registry | Source Registry layer | known/unknown/blocked sources, eligibility | `/source-registry/*`, contracts/data | show source trust/eligibility |
| Autonomous Registry | Fabric registry ledger | generic entities, lifecycle, attestations | `/admin/registry*`, `fabric/registry_event_ledger.py` | project ledger truth |
| Master Layer Registry | SHS system registry/docs | SHS layers, dependencies, readiness, anti-duplicate doctrine | `src/system/system-registry/shsSystemRegistryEntries.js`, docs | use for ecosystem topology, not runtime authority |
| Run Registry | Fabric runs registry | registered run metadata and targets | `registry/runs/*.json`, `fabric/runs_registry` | use for run trace/report policy |
| Metric/Reporting Registry | Reporting contracts | metrics/reports/producer lineage | `contracts/reporting/*.json`, SHF reports routes | use for report lineage |
| Watchtower Store | Watchtower | quarantine, risk history, snapshots, attestations | `var/watchtower_store.sqlite` via store API | show risk truth, no duplicate store |

## Reporting & Proof Model

Flow:

`run registry / run event -> report object -> PDF -> proof hashes -> published registry -> public/private route`

Routes:

- Policy/readiness: `GET /runs/reports/{run_id}/policy`
- JSON report: `GET /runs/report/{run_id}`
- PDF report: `GET /runs/report/{run_id}/pdf` and legacy `.pdf`
- Preview: `GET /runs/report/{run_id}/platypus-preview`
- Publish: `POST /runs/reports/{run_id}/publish`
- Published JSON/PDF/proof: `GET /runs/published/{run_id}`, `/pdf`, `/proof`
- Public: `GET /runs/public/{run_id}`

Publish policy currently checks:

- run metadata exists
- mode is `PILOT` or `SYSTEM`
- `app_id`, `site`, `start_ts`, `end_ts` present
- policy `publish_allowed`
- policy `data_allowed`
- visibility `PUBLIC` or `PRIVATE`

Command Center actions:

- View report policy and blockers.
- View JSON/PDF/proof.
- Copy verification link.
- Publish report only for approver/admin with backend admin key and ideally a future permission-specific backend control.
- Never mark Truth public-approved from report UI unless using existing Truth endpoints/permissions.

## Existing UI Audit

| Surface | Exists | Works / Role | Duplicate? | Missing | Reuse / Retire |
|---|---|---|---|---|---|
| `/agent-fabric` | yes | canonical agent list, verify, health, layer gate | no | run trace, Watchtower, LOO, approvals, evidence, ecosystem graph | reuse data-fetch/header patterns; evolve into Command Center shell or link from it |
| `/ops/agents` Agent Workbench | yes | local-only agent tasks, approval ledger, memory, coordination, workflow, controlled executor, production automation stubs | overlaps conceptually with Agent Fabric but different authority | backend Fabric integration | reuse components for Agent Fleet/Approvals; do not retire |
| `/truth-spine` | yes | claims/sources/audit/coverage/drift/federation/envelope/readiness/package/replay; creates seed data and public approval toggle | not duplicate | safer action gating needed | reuse as Truth detail drawer/tab |
| `/oracle` | yes | cases/rulings, create/rule | not duplicate | route permissions not visible in UI | reuse Oracle detail panels |
| `/ai-guardrails` | yes | policies/decisions/check-output/audit | not duplicate | none for Command Center overview | reuse decisions feed |
| `/game-theory` | yes | scenario analysis and audit | not duplicate | none | reuse as advisory panel |
| `/reporting`, `/ops/reports` | yes | reporting/proof/PDF/export surfaces | overlap with future proof tab | run trace integration | reuse report/proof components |
| `/ops/system-registry` | yes | SHS registry/dependency/readiness panels | overlap with ecosystem graph | live Fabric route overlay | reuse dependency graph |
| `/ops/executive-command` | yes | BOS executive health/agent/system summaries | adjacent | Fabric-specific run detail | reuse high-level status ideas |
| `/watchtower` | redirect | currently redirects to `/agent-fabric` | missing dedicated risk UI | all Watchtower specifics | Command Center should fill, not duplicate |
| `/lord-outcomes` | yes | LOO app/shell | separate product surface | Fabric risk integration | link/embed ranking summaries |

## Command Center Information Architecture

Recommended shell:

- Left sidebar: persistent sections.
- Top status strip: live/ready/degraded, active runs, approvals, alerts, quarantine count.
- Center canvas: current operational view.
- Right context drawer: selected run, agent, alert, policy decision, relationship, or proof.
- Progressive disclosure: overview first, expandable route/evidence/policy details.
- Avoid a wall of KPI cards.

### 1. Command Overview

Purpose: one-screen operational posture.
Primary user: operator/admin.
Data sources: `/health/*`, `/status`, `/admin/agents/summary/health`, `/admin/layers/gate/status`, `/watchtower/summary`, `/runs/recent`, `/admin/infra/verify`, `/admin/observability/verify`.
Components: status strip, risk lane, recent run lane, agent readiness lane, evidence/publishing lane.
Actions: refresh, open drawer, navigate to authority page.
Restrictions: read-only except links.
Empty/error: show unconfigured Fabric base and route-level failures separately.
Mobile: single-column lanes with sticky status strip.

### 2. Live Operations

Purpose: track current/recent plans/runs/events.
User: operator.
Data sources: `/runs/recent`, `/plans/recent`, `/admin/agents/events`, `/shf/ingestion/events`.
Components: run/event table, filters, timeline drawer.
Actions: validate/dry-run/execute only through existing `/runs/*` or alignment admin routes.
Restrictions: execute requires approver/admin.
Gaps: no canonical RUNNING/WAITING/TIMED_OUT state.
Mobile: timeline-first cards.

### 3. Agent Fleet

Purpose: inspect canonical agents, tools, policy, health, readiness.
User: operator/admin.
Data sources: `/admin/agents*`, `/tools`, Agent Workbench data/components.
Components: fleet table, capability inspector, policy/tool detail, health events.
Actions: dry-run, page-context dry-run, enable/disable/lifecycle/attest only for admin/security.
Restrictions: no delete by default.
Mobile: list plus drawer.

### 4. Authority & Approvals

Purpose: show approvals and human decision points.
User: approver/operator.
Data sources: `/plan/*`, `/runs/reports/{id}/policy`, Agent Workbench approval ledger, Truth approvals, alignment plan admin routes.
Components: approval queue, blocker explainer, decision history.
Actions: approve/deny plan, publish report, Truth approve/revoke only through existing endpoints.
Restrictions: role-specific.
Gaps: no unified backend approval queue.
Mobile: queue cards.

### 5. Ecosystem Graph

Purpose: show Fabric connections without duplicating authority.
User: admin/architect/operator.
Data sources: SHS system registry, `/agent-contract-bridge/*`, `/watchtower/summary`, route inventory.
Components: dependency graph, source/consumer matrix, relationship highlighting.
Actions: open related surface.
Restrictions: read-only.
Mobile: searchable list + focused graph.

### 6. Governance & Policy

Purpose: explain why work can/cannot proceed.
User: operator/approver/security.
Data sources: `/policy-engine/*`, `/readiness-gate/*`, `/public-approval/*`, `/security-privacy/*`, `/data-ownership-ip/*`, alignment containment, funding rulesets.
Components: policy decision cards, containment map, rule manifests.
Actions: evaluate diagnostic payloads; containment actions for admin/security.
Restrictions: no policy editing unless backend supports.
Mobile: accordions.

### 7. Truth / Evidence / Proof

Purpose: lineage from operational event to evidence to Truth to proof.
User: verifier/reporter/approver.
Data sources: `/truth/*`, `/evidence-package/*`, `/data-verification/*`, `/audit-verification/*`, `/runs/report/*`, `/runs/published/*`.
Components: lineage timeline, claim package detail, proof viewer, PDF preview.
Actions: create/verify/approve only in Truth authority controls; publish in reporting controls.
Restrictions: strong permission split.
Mobile: stepper.

### 8. Watchtower & Risk

Purpose: integrity, drift, quarantine, alerts.
User: security/operator.
Data sources: `/watchtower/*`, `/loo/rankings`, `/loo/adapters`.
Components: risk bands, quarantine table, alert feed, attestation verifier, risk history.
Actions: quarantine/release only Security/Admin after auth review.
Restrictions: Watchtower owns risk; Command Center explains.
Mobile: risk list and drilldown.

### 9. Security & Trust

Purpose: auth, service identity, HMAC, rate limits, tenant scope, audit.
User: security/admin.
Data sources: `/auth/*`, internal ingestion telemetry/status, `/security-privacy/*`, `/admin/infra/verify`.
Components: permission matrix, route access, service key posture, rate-limit posture, auth audit.
Actions: session revoke via auth endpoints; no key management in UI unless backend added.
Restrictions: security role.
Mobile: audit cards.

### 10. Infrastructure & Health

Purpose: readiness/degraded state, persistence/outbox/storage.
User: operator/SRE.
Data sources: `/health/*`, `/status`, `/admin/infra/verify`, `/admin/observability/verify`, storage status, Watchtower store verify, startup lock reports.
Components: service health, storage posture, durable vs dev mode, degraded reasons.
Actions: none beyond refresh/export.
Restrictions: read-only.
Mobile: condensed health list.

### 11. Incident & Recovery

Purpose: incident replay, audit trails, containment recovery.
User: security/operator.
Data sources: Watchtower risk history/attestations, Truth replay/history, audit verification, auth audit, gate history.
Components: incident timeline, replay compare, affected systems, recovery checklist.
Actions: quarantine/release, revoke sessions, disable agent/layer where existing backend supports.
Restrictions: security/admin.
Mobile: timeline.

## Run Trace Experience

The first-class Run Trace should answer:

| Question | Available Fields | Source | Status |
|---|---|---|---|
| Who initiated this? | actor/user when operational event; `requested_by` in Oracle/Workbench; run event lacks canonical actor | operational events, local workbench, run events | Partial |
| Which organization? | `organization_id`, `tenant_id` for operational events; absent in plan execution | operational ingestion | Partial |
| What work order? | `planId`, Agent Workbench `task_id`; no unified `work_order_id` | plans/workbench | Partial |
| Which agent? | `agentName`, `agentId`, `layer` in plan/run event | plan/run registry | Ready |
| Which model/provider? | no first-class fields found | none | Missing |
| Which policy? | plan `policy`, alignment decision, report policy, policy-engine evaluations | plans/alignment/report policy | Partial |
| Which tools? | plan `steps[].tool`, agent `allowedTools`, `/tools` | plans/admin agents/tools | Ready |
| Which resources? | implicit args/body, no first-class resource permission | plans/artifacts | Partial |
| Which approvals? | plan `approved`, `approvalRequired`, Agent Workbench ledger, alignment approve-execute | plans/workbench/alignment | Partial |
| What happened step-by-step? | plan steps, artifacts written, run event, operational events | plan/run logs | Partial |
| What evidence was generated? | artifacts, operational evidence, evidence projection | artifacts/evidence | Partial |
| What Truth verification occurred? | Truth source/claim ids and projection result; Truth package/readiness/replay | Truth/evidence projection | Ready when projected |
| What was the outcome? | run event `outcome: ok`, artifacts, LOO score, report | run event/LOO/report | Partial |
| Can it be verified? | report proof, Truth package hash, Watchtower attestations | report/proof/Truth/Watchtower | Ready for published reports |
| Was it published? | report policy `published`, proof exists, `/runs/published/*` | run report routes | Ready |

Missing fields to not invent:

- canonical run status enum
- run initiator and org for `/runs/execute`
- model/provider
- resource permission graph
- timeout/deadline
- cancellation/revocation of run
- unified approval object linking plan, report, Truth, Watchtower

## Visual System

Direction: institutional mission control, premium, calm, high-information, not sci-fi neon, not generic dashboard.

Layout:

- Left sidebar with sections above.
- Top status strip with health, runs, approvals, alerts, quarantines.
- Center canvas with dense operational views.
- Right context drawer with selected entity.

Interaction principles:

- Use progressive disclosure and drilldown drawers.
- Use tables for operational data, graphs for dependencies, timelines for traces.
- Avoid huge hero sections and oversized KPI cards.
- Use restrained color: neutral base with status colors for health/risk.
- Keep cards only for repeated items/modals/tool surfaces.

## Top-1-Percent Interactions

- Live run state changes by polling/SSE later; initial phase can poll `/runs/recent`, Watchtower, health.
- Relationship highlighting from selected run to agent, policy, Truth, report, Watchtower risk.
- Run timeline with raw event drawer and normalized event view.
- Policy explainability: show exact blocker, source endpoint, authority owner.
- Approval queue with role-aware actions and reason capture.
- Agent capability inspection: tools, policy notes, allowed capabilities, dry-run.
- Risk/quarantine interactions: separate raw LOO score, Watchtower gate, manual quarantine.
- Evidence lineage: operational event -> evidence -> Truth source/claim -> package -> report/proof.
- Incident replay: Truth replay, Watchtower risk history, auth audit, gate history.
- Dependency health: graph node status from registry/Watchtower summaries.
- Keyboard navigation: sidebar shortcuts, table row arrows, drawer close/focus trap.
- Reduced motion: no animated dependency graph unless user allows motion.
- Responsive: mobile list/detail split; desktop three-pane command shell.

## Security / Authority Matrix

| Action | Classification | Backend Support | Notes |
|---|---|---|---|
| View Fabric health/status | READ ONLY | `/health/*`, `/status` | safe |
| View run/recent events | READ ONLY / OPERATOR | `/runs/recent` with admin key | use admin/session gating |
| Validate/dry-run plan | OPERATOR | `/runs/validate`, `/runs/dry-run`, alignment admin validate/dry-run | no mutation except audit |
| Execute run | APPROVER / ADMIN | `/runs/execute`, `/admin/align/plans/{id}/approve-execute` | requires approval/admin key/global gate |
| Cancel run | MISSING | none found | do not show action |
| Revoke run | MISSING | none found | do not show action |
| Approve plan | APPROVER | `/plan/{id}/approve`, alignment approve-execute | route auth needs review |
| Deny/reject plan | APPROVER | `/plan/{id}/reject` | route auth needs review |
| Enable/disable agent | ADMIN / SECURITY | `/admin/agents/{id}/enabled` | high-authority |
| Delete agent | SECURITY | `DELETE /admin/agents/{id}` | hide by default |
| Change agent lifecycle | ADMIN | `/admin/agents/{id}/lifecycle` | audit required |
| Attest agent | SECURITY / ADMIN | `/admin/agents/{id}/attest` | audit required |
| Enable/disable layer | SECURITY / ADMIN | `/admin/layers/{layer}/enabled` | high blast radius |
| Quarantine program | SECURITY | `POST /watchtower/quarantine/{program_id}` | auth hardening recommended before UI |
| Release quarantine | SECURITY | `DELETE /watchtower/quarantine/{program_id}` | auth hardening recommended |
| Publish report | APPROVER / ADMIN | `POST /runs/reports/{id}/publish` | admin key; should add permission-specific backend control |
| View proof | READ ONLY | `/runs/published/{id}/proof` | safe if report visibility allows |
| Change Truth claim/source | APPROVER / ADMIN / VERIFIER | `/truth/*` mutation endpoints | must use Truth permissions |
| Public approve/revoke Truth | APPROVER / SECURITY | `/truth/claims/{id}/approve-public`, revoke, `PATCH /truth/public-approval/{id}` | high-risk |
| Change policy | MISSING/PARTIAL | evaluation endpoints exist, not clear edit API | do not fabricate |
| Change agent permissions/tools | ADMIN | agent upsert | high-risk |
| Ingest internal service event | SYSTEM ONLY | `/shf/internal/ingestion/events` | never browser |
| Record funding replay decision | SYSTEM/ADMIN ONLY | `/api/funding/replay/*` | not default browser action |
| Treasury/settlement actions | SYSTEM/OPERATOR SPECIAL | `/api/v1/treasury`, operator routes | not default Command Center |
| Session revoke | SECURITY | `/auth/session/revoke*` | only in Security & Trust |

## Data Gap Report

| Proposed Feature | Status | Missing API/Data/Relationship |
|---|---|---|
| Command overview health strip | READY | none |
| Active run list | PARTIAL | no live RUNNING state, only recent run events |
| Canonical run state machine | MISSING | backend run status enum and transitions |
| Run initiator/org trace for `/runs/execute` | PARTIAL | actor/org fields in plan execution events |
| Work order entity | MISSING | unified `work_order_id` linking plan/task/run/report |
| Model/provider inspection | MISSING | model/provider registry and run fields |
| Tool/resource permission graph | PARTIAL | tool names exist; resource permissions missing |
| Approval queue | PARTIAL | plan approval and local workbench ledger exist; no unified backend queue |
| Report publish readiness | READY | `/runs/reports/{id}/policy` |
| Proof viewer | READY | `/runs/published/{id}/proof` |
| Evidence lineage | PARTIAL | operational event/evidence/Truth projection exists; not linked to plan execution by default |
| Truth package/replay | READY | `/truth/package`, `/truth/replay` |
| Watchtower risk | READY | `/watchtower/summary`, `/programs`, `/risk/history` |
| Watchtower quarantine action | PARTIAL | endpoint exists; route auth should be hardened/confirmed |
| LOO rankings | READY | `/loo/rankings` |
| Ecosystem graph | PARTIAL | system registry exists; needs Fabric route overlay and live data mapping |
| Policy explainability | PARTIAL | policy/readiness/security evaluation summaries exist; no unified decision object |
| Security/service identity dashboard | PARTIAL | service identity code and telemetry exist; no dedicated route for HMAC key posture/rate counters |
| Rate limit dashboard | PARTIAL | telemetry snapshot function exists; no dedicated route |
| Outbox visibility | PARTIAL | SHS API docs/tests mention outbox; Fabric side sees ingested events, not outbox queue state |
| Persistence state | PARTIAL | storage status for op/evidence; Watchtower sqlite; not centralized |
| Incident replay | PARTIAL | Truth replay, Watchtower risk history, auth audit; no unified incident id |
| Contract runtime command-center routes | MISSING | router file exists but is not mounted in `main.py` |
| Truth pipeline command-center routes | MISSING | router file exists but is not mounted in `main.py` |
| Cancel/revoke run | MISSING | no endpoints found |
| Timeout handling | MISSING | no run deadline/timeout state found |
| Public/private global visibility matrix | PARTIAL | report policy and Truth public approval exist; not unified across all artifacts |

## AFCC Visual Experience V3 — Operational Topology

Implemented 2026-09-26 on `feature/agent-fabric-command-center-v1` (not committed). Read-only. No new endpoint, adapter, fetch path or backend behavior: V3 is a presentation and interaction layer over the frozen AFCC-0 contract and the AFCC-2A safe read projections.

### Why the cinematic hero was removed

An earlier visual direction put decorative city artwork at the centre of the page. It was never implemented in code (this plan already said "avoid huge hero sections"), and the approved V3 mock replaces it. The largest element on the page must do operational work, so the centre is now a functional topology that answers: where is the issue, what does it touch, and what should I inspect next. No decorative image, screenshot or illustration is used as live UI.

### Workflow

Prioritize (Priority strip) → Locate (map highlights matching systems) → Inspect (Context drawer, Overview) → Understand authority (Authority view) → Review evidence (Evidence view) → Understand dependencies (Dependencies view + highlighted path on the map) → Navigate to the owning authority (navigation / drawer links; the Command Center performs no actions) → Confirm recovery (re-read on the shared poll or "Refresh sources"; ages stay visible).

### Page regions

1. **Command navigation** — primary list (Command Center, Priority & Alerts, Ecosystem Map, Agent Fleet, Operations, Governance & Alignment, Truth & Evidence, Watchtower & Risk, Infrastructure, Observability, Security & Trust, Incidents, Reports & Insights, Settings) and **Ecosystem Authorities** (Registry, Oracle, LOO, SHS, SHF, BOS, CivicSure, Curriculum, Career & Workforce, Metaverse, OAS, Treasury). Each entry is this page, a region on this page (scroll + focus), an existing admin route (`/truth-spine`, `/reporting`, `/registry`, `/oracle`, `/lord-outcomes`, `/ops/system-registry`, `/command`, `/ops/executive-command`), an existing app route (`/index.html#/civicsure`, `/curriculum.html#/`, `/career.html#/dashboard`, `/arcade.html#/metaverse/growth-observatory`, `/oas.html`, `/treasury.html#/dashboard`), or disabled with its reason (Security & Trust AFCC-10, Incidents AFCC-12, Settings). No placeholder pages were created. Tested: every admin route exists in `AdminRoutes.jsx`; every app href points to an existing HTML entry.
2. **Priority + global health** — see below.
3. **Ecosystem Operations Map** — the centrepiece.
4. **Operational panels** — Recent operations, Watchtower & LOO, Infrastructure, Observability, Agent fleet, Governance & alignment, Known data gaps.
5. **Context drawer** — Overview / Authority / Timeline / Evidence / Dependencies.

### Topology (`ecosystemTopology.js`)

Nodes and edges are transcribed from the Ecosystem Connection Matrix above; each edge cites its matrix row, and a test asserts that row exists in this document. 16 nodes (Agent Fabric hub + 15 systems) and 19 directed edges. Direction: A → B means B depends on A.

| Edge | Flow | Matrix row |
|---|---|---|
| CivicSure → SHS API | EVENTS (`referral.created`) | CivicSure / Hub / ClientOps |
| Curriculum → SHS API, Career & Workforce → SHS API | EVENTS | Career Center / Curriculum / Learning Arcade |
| SHS API → Agent Fabric | EVENTS (HMAC internal ingestion) | SHS API |
| Agent Fabric → Truth Spine | EVIDENCE (evidence and Truth projection) | Truth Spine |
| Truth Spine → Oracle / Watchtower / Reporting | EVIDENCE | Oracle / Watchtower / Agent Reporting Agency |
| Agent Fabric → Watchtower | RISK (layer summaries) | Watchtower |
| LOO → Watchtower, Watchtower → LOO | RISK (rankings; risk gating and quarantine) | Watchtower / LOO |
| Agent Fabric → LOO, Agent Fabric → Reporting | RUNS (LOO payloads; run reports) | LOO / Agent Reporting Agency |
| Agent Fabric → SHF Impact, Metaverse, Registry, AI Guardrails, Treasury | SERVICE (hosted route or service) | SHF Impact Command / Metaverse / Autonomous Registry / AI Guardrails / Treasury / Capital Operator |
| Agent Fabric → BOS | OBSERVES (links only; no Fabric-only route confirmed) | BOS / Executive Command |

**Not drawn:** OAS ("No direct code connection found"). Drawing an unconnected node would imply a relationship was checked and found healthy; it is listed in navigation and named in the map legend instead. Autonomous Trust Bureau, Game Theory, ARAG/Arena, Identity, Studio and Universe are matrix rows the V3 map does not include (not requested for this surface); nothing about them is implied.

**Typed lineage traversal.** Selecting a system highlights its upstream and downstream paths, but a path only continues along flows its arriving flow feeds: EVENTS → EVENTS/EVIDENCE, EVIDENCE → EVIDENCE/RISK, RISK → RISK, RUNS → RISK, SERVICE and OBSERVES are terminal. So CivicSure → SHS API → Agent Fabric → Truth Spine → {Oracle, Watchtower, Reporting} → LOO, and never Treasury or Metaverse (which merely share the hub). Displayed chains are real allowed paths (the traversal tracks parents per edge; tested).

### Status on the map (`operationalModel.js`)

Status comes only from an admitted Command Center source and is never inferred across authorities:

| Node | Source | Status mapping |
|---|---|---|
| Agent Fabric | public health probes (posture) | Operational / Degraded / Unavailable (liveness failed) / Checking |
| Watchtower | AFCC-2A persisted read | Watchtower's own recorded actions: any QUARANTINE → Blocked; any DEGRADE → Degraded; all ALLOW → Healthy; no action recorded → Not published; NOT_YET_EVALUATED → Unavailable ("Not yet evaluated"); 401/403/auth bridge → Restricted |
| Every other system | none admitted | **Not published** (gap vocabulary), dashed outline. Never "Healthy" because Fabric is healthy |

Healthy is not verified; ready is not approved; running is not safe. Operational means live + ready + not degraded — nothing more.

**Edges.** An edge's state comes from its upstream end: upstream Unavailable/Blocked → blocked; upstream Degraded → degraded; upstream observed healthy and downstream observed → observed; anything else → **not observed** (never "normal"). No edge is shown as actively flowing: flow telemetry is not published.

**Map modes.** Operations View (status-first). Dependency View (direction arrows on every edge; the focused system's relationships listed as text under the map — labels drawn on converging edges collided, so they were moved to an accessible list). Geography: disabled (`aria-disabled`, focusable, explains "no canonical geographic data is published").

**Layout (`topologyLayout.js`).** Deterministic, width-driven; status changes never move nodes. Frame layout (map ≥ 860px): hub centre, SHS API left-middle (the only ingestion path), LOO right-middle, other systems on a top and bottom row. Hub dependencies are straight spokes aimed at each node's facing edge; other edges bow toward the hub row with computed clearance. A geometry test samples every edge at six widths and fails if any edge passes behind an unrelated node (it caught two real collisions during development). Grid layout below 860px: 2–3 columns, no drawn edges, path membership labelled on each node ("Upstream" / "Downstream").

### Priority workflow

Critical, Needs Review, Degraded, Stale and Normal are filters. Counts are computed per category from **only the sources that can place an item in that category**, and show their coverage ("3/5 sources"). A category whose own sources are all unreadable shows the reason instead of a number (e.g. Needs Review → "Auth bridge required" today, because the agent registry is admin-key only). Nothing is classified from missing data.

| Category | Classified from |
|---|---|
| Critical | liveness failed; recorded verification FAIL; Watchtower QUARANTINE / quarantined / manual quarantine; layer gate blocked |
| Needs Review | agent registry health `warning` or execution `blocked`. **Approval-required is a per-agent policy, not a pending queue, and is not counted** (the approval queue is Not published) |
| Degraded | readiness/degraded-probe problem; recorded verification DEGRADED; Watchtower DEGRADE |
| Stale | only when an authority publishes a freshness threshold. Every AFCC read reports `threshold: NOT_DEFINED`, so Stale shows "No threshold" — ages are shown, never judged. The adapters now read `threshold_seconds` through, so Stale starts working without UI changes when a threshold is published |
| Normal | Fabric operational; verification PASS; Watchtower ALLOW; gate pass; registry-ready agent |

Selecting a filter highlights matching systems, dims the rest, and lists the matching items (each opens the drawer).

### Context drawer

Five views, each filled only from admitted sources, the canonical topology, or an explicit gap: **Overview** (status, health/risk, last evaluated, last verified, freshness, summary, alerts, recent operations for the hub), **Authority** (owner, auth boundary, required route permission, governance layer, approval requirement, containment/gate, read/write statement, source system — informational only), **Timeline** (run events, recorded verifications, Watchtower evaluations/quarantines/attestations — never fabricated), **Evidence** (evidence produced per the matrix, marked as documentation not a live read; Truth relationship; verification state; run artifact hashes, marked "not a Truth verification"), **Dependencies** (direct relationships with edge state, upstream and downstream chains, each system clickable). WAI-ARIA tabs with arrow/Home/End keys.

Drawer mode by Command Center width: ≥1760 docked (non-modal, map keeps full width); 1180–1759 overlay; 780–1179 overlay; <780 full-screen sheet. Overlays are modal (focus trap, background `inert`, Escape returns focus) with a light scrim so the highlighted path stays readable.

### Search (⌘K / Ctrl+K)

Command palette over what the page has loaded plus the topology: systems, agents, runs, current alerts. It states that it does not search the backend. Combobox + listbox, arrow keys, Enter opens the selection in the drawer, Escape returns focus.

### Freshness and staleness

Every recorded state carries its age where one exists: Watchtower "Evaluated 23 days ago" (and "23d ago" on its map node), Infrastructure "Verified 3 hours ago", Observability "Not yet verified". No state is judged stale without a published threshold.

### Responsive

1920: full layout, docked drawer. 1600/1440: full nav + canvas, overlay drawer. 1280: slimmer nav (180px). 1024: collapsible navigation. 768 and below: collapsible nav, grid map, full-screen drawer sheet, priority and health rows scroll horizontally inside themselves. No page-level horizontal scroll at any tested width (asserted).

At 1440×900 (measured from the Command Center's top edge): map canvas 226px (25% of 900; whole map section 371px), Recent operations and Watchtower & LOO start at y≈609, no clipped node labels (asserted).

### Accessibility

Labelled regions (the admin shell owns `<main>`), one `h1`, `h2` per region, map nodes are native buttons with full accessible names (name, domain, status, freshness, attention count, path role, filter match) and `aria-pressed`, tooltip via `aria-describedby`, status always in text, drawer tabs pattern, modal focus trap and return focus, polite live regions (posture change, map selection), `prefers-reduced-motion` disables all animation and transition, 44px minimum targets (asserted at eight widths), semantic tables for run events.

### Performance

No graph library: React + SVG edges + absolutely positioned HTML node buttons. Layout is O(nodes) and memoised on width; the operational model is memoised on the snapshot. Still one shared coordinator with per-group polling paused while the tab is hidden; V3 adds no request (tested: V3 modules contain no fetch path). Dashboard rendering triggers no verification, evaluation or write.

### Screenshot matrix

`docs/agent-fabric-command-center/v3/` (Chromium, mocked `/fabric-api` with the acceptance fixtures; the unstyled admin shell above the Command Center is pre-existing and outside AFCC, so captures are scrolled to the Command Center's top edge):

- `AFCC-V3_command_{1920,1600,1440,1280,1024,768,430,390}.png`, `AFCC-V3_command_1440_fullpage.png`
- `AFCC-V3_workflow_review_civicsure_1440.png` (filter → select → drawer), `AFCC-V3_priority_degraded_1440.png`
- `AFCC-V3_drawer_watchtower_dependencies_1440.png`, `AFCC-V3_drawer_docked_1920.png`, `AFCC-V3_drawer_overlay_1024.png`, `AFCC-V3_drawer_sheet_390.png`
- `AFCC-V3_dependency_view_1440.png`, `AFCC-V3_search_1440.png`, `AFCC-V3_hover_truth_1440.png`

### Future incident mode (structure only)

`dependencyPaths()` already returns impact radius (downstream set), affected paths (`chainTo`), and depth, and every node/edge carries a stable id. Incident mode can add related runs, containment state, evidence preservation and recovery checkpoints on top without changing the topology contract. No incident mutation exists.

## AFCC-2A.2 — SHS → Fabric Read Auth Bridge

Implemented 2026-09-26 on `feature/agent-fabric-command-center-v1` (not committed). Read only.

### Architecture

```
Browser ── GET /api/agent-fabric/command/{agents/health|agents/readiness|gate/status|runs/recent}
  │         SHS session cookie + preferred-org header. No credential header.
  ▼
SHS API (apps/shs-api/src/domain/agent-fabric-command)
  │  requirePermission("bos.governance.read")  → 401 / 403 before anything else
  │  fixed source map (request path/query/headers/body are never forwarded)
  │  signInternalRequest("GET", <fixed Fabric path>, {})  ← existing service:shs-api HMAC signer
  ▼
Agent Fabric GET /api/v1-command-center/agent-fabric/{agents/health|agents/readiness|gate|runs/recent}
  │  require_command_read: Fabric session with bos.governance.read, OR
  │  authenticate_internal_read_request: service:shs-api HMAC, GET only, 4-path allow-list
  │  projection = existing read logic → only AFCC fields → sanitize()
  ▼
SHS re-validates contract/kind/read_only, re-minimizes to a field allow-list, re-sanitizes strings
  ▼
Browser receives an afcc.read.v1 envelope (access: "shs_bridge") — nothing else
```

Why this shape (audit): SHS authenticates browsers with the `shs_session` cookie and `requirePermission()`; the only existing server-side SHS→Fabric credential is the `service:shs-api` HMAC identity (trusted-reporting outbox ↔ `services/internal_service_identity.py`), with a keyring both services already read (`SHF_INTERNAL_SERVICE_KEYS_JSON`, `SHF_INTERNAL_SERVICE_ACTIVE_KID`). Reusing it — rather than giving SHS the Fabric admin key — means no process gains mutation authority: the admin key grants every admin write, the read audience grants four GETs.

### Permission

- **SHS:** new `bos.governance.read` (`SHS_SECURITY_PERMISSIONS.AGENT_FABRIC_COMMAND_READ`), same name and meaning as Agent Fabric's permission, which Fabric grants only to its global `shs_admin` role. Granted to `super_admin` (all permissions) and `shs_admin` only. Referenced by no other SHS route (asserted).
- **Not `audit.view`:** it is also held by org-scoped roles (Reviewer/Verifier, Auditor, Partner Org Admin, Org Admin); fleet, gate and run data are platform-wide. The frontend route guard stays `audit.view`, so such users can open the page and see "Access restricted · Failed at: Browser → SHS API" on the four lanes.
- **Org context:** `requirePermission` still requires a valid active organization (403 `ORG_CONTEXT_REQUIRED` otherwise). The projections contain no tenant data; authorization is by platform role.
- **Grants nothing else:** no SHS route runs, publishes, quarantines, mutates agents, layers or policy, or runs verification under this permission. The Fabric read audience rejects every other path and method (tests below).
- Memberships that store explicit permission lists (instead of deriving from the role map) will not have the new permission until granted; they fail closed with 403.

### Server-held credential

- SHS signs with the existing keyring through `signInternalRequest` (60 s validity; Fabric rejects > 300 s, clock skew > 30 s, wrong service id, unknown key id, bad signature). The signature binds method, path, empty-body digest, times and key id, so a signature for one read cannot be used for another path or method.
- The Fabric admin key is not read, held or sent by SHS (asserted by a source test) and is not accepted by the new reads.
- Missing configuration fails closed as `BRIDGE_NOT_CONFIGURED` with a reason code (e.g. `INTERNAL_SERVICE_CREDENTIALS_MISSING`); values are never echoed.
- **Local dev today:** `apps/shs-api/.env` has `SHF_AGENT_FABRIC_INTERNAL_URL` and the key id set but an **empty keyring**, and Fabric's `.env` has no keyring. Until both are configured with the same keyring, the lanes correctly show "Bridge not configured · Failed at: SHS API". Production requires `SHF_INTERNAL_SERVICE_KEYS_REF` (existing rule).
- **Not forwarded:** user and org identity are not passed to Fabric (the earlier proposal said "carrying user and org context"). Authorization happens in SHS and these projections are platform-wide. Forwarding a signed actor id for Fabric-side audit is a recommended follow-up.

### Routes bridged

| SHS route (browser: `/api` + route) | Fabric read | Source logic reused |
|---|---|---|
| `GET /agent-fabric/command/agents/health` | `GET /api/v1-command-center/agent-fabric/agents/health` | `admin_agent_health_summary_safe()` |
| `GET /agent-fabric/command/agents/readiness` | `GET …/agents/readiness` | `admin_agent_execution_readiness()` |
| `GET /agent-fabric/command/gate/status` | `GET …/gate` | `gate_status()` (read only) |
| `GET /agent-fabric/command/runs/recent` | `GET …/runs/recent` | `read_recent_run_events()` (extracted from `/runs/recent`; window fixed at 25 server-side) |

The original admin routes are unchanged and still require `X-Admin-Key`. POST/PUT/PATCH/DELETE on the SHS prefix return 405 before authentication.

### Sanitization

Fabric returns only AFCC fields and runs `sanitize()`: it blocks keys such as `path`, `error`, `stdout` and `key`, and redacts path-, traceback-, exception- and secret-like strings. New in this phase: exact 64-hex values under `sha256` / `snapshotSha256` survive, so evidence hashes are no longer wiped by the long-hex rule. SHS re-checks the envelope, keeps a per-kind field allow-list and applies the same string rules. Run artifacts carry only `artifactId` and `sha256`; server file paths never leave Fabric.

### Error model (which hop failed)

| State | HTTP | Layer shown |
|---|---|---|
| Auth required | SHS 401 | Browser → SHS API |
| Access restricted | SHS 403 | Browser → SHS API |
| Network error / timeout | — | Browser → SHS API (or gateway → Fabric for direct reads) |
| Backend unavailable | SHS 502/504 `BACKEND_UNAVAILABLE`, or an empty non-JSON 5xx from a proxy | SHS API → Agent Fabric (or Browser → gateway) |
| Bridge not configured | SHS 503 | SHS API |
| Bridge rejected | SHS 502 (Fabric 401/403 to the service) | SHS API → Agent Fabric |
| Fabric error | SHS 502 (Fabric 5xx / projection `BACKEND_ERROR`), or a JSON 5xx on a direct read | Agent Fabric handler |
| Invalid response | SHS 502, or a contract mismatch in the adapter | Agent Fabric handler / SHS API |

Only UPPER_SNAKE reason codes are shown; free text from any service is never rendered.

### Frontend migration

Same client, coordinator and adapters. The four endpoints in `commandContracts.js` now carry `transport: "shs"`, `auth: SHS_BRIDGE` and their SHS/Fabric routes. `commandClient.js` resolves the SHS base like `authConfig.js` (`/api` locally), sends cookies plus the preferred-org header only, and classifies failures by hop (`failedLayer`). Adapters accept these sources only as `afcc.read.v1` envelopes of the right kind. Source notices and the drawer show "Failed at: …". No AFCC source references an admin-key route, the header name, or a key name (asserted).

### Result with live data (isolated stack, real registry/gate/run ledger)

- **Agent Fabric:** Operational (health probes); hub flags 1 item (gate blocked).
- **Agent fleet:** 19 registered, 19 enabled, 19 healthy, 0 health warnings, 0 execution blocked, 12 approval required by policy (not a queue), 7 auto-ready.
- **Recent operations:** 25-event window; real run ids, plan snapshot and artifact hashes; no paths.
- **Governance:** gate blocked; 32 required layers, all enabled; 25 `not_enforced_ready` blockers (L08 onward).
- **Priority:** Critical 1 (gate) · Needs Review **0 with both sources readable** (a real zero, not a missing one) · Degraded 0 · Stale "No threshold" · Normal 20.

### Topology after 2A.2

Only nodes with an admitted source changed. Agent Fabric now also carries fleet, gate and run items. **Still Not published:** SHS API, CivicSure, Curriculum, Career & Workforce, SHF Impact, BOS, Metaverse, Truth Spine, Registry, AI Guardrails, Treasury, Oracle, LOO, Reporting. **Watchtower, Infrastructure, Observability:** bridged in AFCC-2A.3 (see below).

### Admin shell (Phase 8)

Cause: `admin.html` boots `src/entries/admin.main.jsx`, which has never imported the admin rail and shell stylesheets (`admin.sidebar.css`, `shell.css`); only the unused `src/main.jsx` does. So `AdminHeader` and `AdminSidebar` render as raw lists on every admin page. This is pre-existing and was not introduced by AFCC. Fix, scoped: `AdminLayout` renders `/agent-fabric/command` full-bleed (no admin header or rail, same `data-shell-family="operator"`, still `<main>`). The Command Center navigation gains "← Admin home" (`/hub`). Every other admin route is unchanged, and the global admin CSS gap is left as a separate decision.

### Fabric 500 diagnosis (Phase 9)

All four reported failures shared one cause: **Agent Fabric was not running on :8090.** Vite's dev proxy answers `ECONNREFUSED` with an empty `text/plain` 500. The client reported that as a Fabric HTTP error, which produced Fabric Offline / HTTP 500 and "backend error" on Watchtower, Infrastructure and Observability. Per source:

- **Fabric health:** service unavailable (local dev process not running).
- **Watchtower:** same, not a projection failure.
- **Infrastructure:** same, not a verifier failure.
- **Observability:** same, not a verifier failure.

Fixed in scope: an empty or non-JSON 5xx now reads as **Backend unavailable · Browser → gateway → Agent Fabric**. A JSON 5xx is **Fabric error · Agent Fabric handler**. When Fabric runs, the three AFCC-2A reads return 401 without a Fabric session ("Auth bridge required"), which is expected.

## AFCC-2A.3 — Complete Safe Read Bridge + Canonical SHS Dev Startup

Implemented 2026-09-26 (not committed). Read only. No page redesign.

### Remaining bridge routes

| SHS route (browser: `/api` + route) | Fabric projection (unchanged handler) | Truthful states |
|---|---|---|
| `GET /agent-fabric/command/watchtower` | `GET /api/v1-command-center/agent-fabric/watchtower` | `AVAILABLE` (persisted risk state, staleness age + `threshold: NOT_DEFINED`) · `NOT_YET_EVALUATED` |
| `GET /agent-fabric/command/infrastructure` | `GET …/infrastructure` | `AVAILABLE` (last recorded verdict + age) · `NOT_YET_VERIFIED` |
| `GET /agent-fabric/command/observability` | `GET …/observability` | `AVAILABLE` · `NOT_YET_VERIFIED` |

- **Fabric:** the three paths join `COMMAND_READ_PATHS` for the `service:shs-api` read audience. The handlers and their guarantees are unchanged: persisted and last-recorded state only, no evaluation, no verifier run, no writes.
- **SHS:** the bridge accepts only the truthful states per kind, minimizes to the fields the AFCC adapters read (dropping, for example, `source` implementation metadata and any `stdout`-like key), and redacts path-, traceback- and secret-like strings. Unknown states are `INVALID_RESPONSE`.
- **Frontend:** `watchtower`, `infrastructure` and `observability` now carry `transport: "shs"` and `auth: SHS_BRIDGE`. All six operational lanes read through the bridge; only the public health probes remain on `/fabric-api`.
- **Posture:** a failure before a verifier read reaches Fabric (Browser → SHS, or inside SHS: not configured, unreachable SHS) is listed as "not included", not as a Fabric fault. A Fabric-side failure still degrades posture.

### Canonical SHS dev startup

- `apps/shs-api/package.json` `dev` is now `tsx watch --env-file-if-exists=.env src/server.ts`.
- **Canonical command:** `cd apps/shs-api && npm run dev`.
- It loads the gitignored local `apps/shs-api/.env`. Process environment still wins over the file, and a missing file is tolerated.
- `start` (`node dist/server.js`, production) is unchanged, and no values are in `package.json` (asserted by a test).
- Agent Fabric: `cd services/shf-agent-fabric && .venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8090`. It loads its `.env` via `load_dotenv()`; `python main.py` is equivalent but binds `0.0.0.0` by default.

### Security behavior (tested)

- **Browser:** receives no keyring secret, key id, admin key or HMAC material. Checked in 378 built files and in all 7 live responses (bodies and headers).
- **GET-only:** POST, PUT, PATCH and DELETE on `/api/agent-fabric/command/*` return 405 before auth.
- **Watchtower read does not mutate:** the store dump and audit log are byte-identical across repeated service reads (Fabric test) and across 15 live bridged reads on the real local store.
- **Verifier reads do not launch the verifier:** subprocess is patched to raise, no verification record is created (Fabric test), and there are zero verify, summary or quarantine hits in the live Fabric log.
- **The read permission cannot reach privileged actions:**
  - SHS has no verify, summary, quarantine or attest route under the bridge prefix (404, and 405 for writes).
  - The service identity gets 401 on `/admin/infra/verify` and `/admin/observability/verify` (GET and POST) and on every admin mutation route.
- **No raw traceback or path leakage:** nested leaks in programs and check reason codes are redacted or neutralized.

### Live results (local SHS via `npm run dev`, Fabric :8090, Vite :5173)

- **Fleet:** 19 registered, 19 enabled, 19 healthy; 7 auto-ready, 12 approval required by policy, 0 blocked.
- **Runs:** 25-event window.
- **Gate:** blocked; 32 required layers, 25 not enforced.
- **Watchtower:** at the time, available with worst band RED and both catalog programs DEGRADE. That state was later found to be written by Fabric test runs. After the test-isolation fix and local store reset, Watchtower reads `NOT_YET_EVALUATED` until a legitimate evaluation runs (see the V1 acceptance doc, "Watchtower test isolation + local state cleanup").
- **Infrastructure and Observability:** Not yet verified (`NO_VERIFICATION_RECORDED`).
- **Priority:** Critical 1 (gate), Needs Review 0, Degraded 2 (Watchtower DEGRADE), Stale "No threshold", Normal 20.
- **Map:** Agent Fabric Operational, Watchtower Degraded, 14 systems Not published.
- **No lane shows "Auth bridge required".**
- **Every width 1920–430:** no overflow, no clipped labels, no console errors. Each load makes exactly 7 bridge GETs; there are no admin Fabric calls and no non-GET requests.

**Watchtower data provenance** (resolved: the tests are now isolated and the local store was reset; see the V1 acceptance doc). Seven pre-existing Fabric test files (adapter layer, API gateway, batch import, event webhook, notification alert, production automation, verified aggregation, warehouse sync) call the legacy evaluating `GET /watchtower/summary` without isolating `SHF_WATCHTOWER_STORE_PATH` or `SHF_WATCHTOWER_AUDIT_PATH`. Running the Fabric suite therefore writes real risk snapshots into the gitignored local `var/watchtower_store.sqlite` and appends to the tracked `var/watchtower_audit.jsonl` (restored after each run). The Watchtower state shown locally is read faithfully, but its most recent evaluations come from those test runs, not from an operator. Recommended fix: an autouse test fixture that isolates Watchtower storage for the whole suite.

### Responsive label fix

Map node names may wrap to two lines (clamped, 12px / line-height 1.05; node row gap removed so two lines plus status fit the 44px node) with a `title` tooltip. Strip values and priority names wrap instead of clipping. Strip detail lines keep their ellipsis with a `title` tooltip. A browser test asserts no clipped node name, strip value or priority name at every tested width.

### Remaining unsupported systems

Not published (no admitted source): SHS API, CivicSure, Curriculum, Career & Workforce, SHF Impact, BOS, Metaverse, Truth Spine, Registry, AI Guardrails, Treasury, Oracle, LOO, Reporting. OAS is not drawn.

## Build Sequence

### AFCC-0 — Audit and Contracts

Scope: freeze route inventory, authority matrix, data contracts, and no-duplicate-authority rules.
Dependencies: this report.
Files: docs only, then optional contract test fixtures.
APIs: read-only probes.
Tests: route contract snapshot, frontend route permission smoke.
Acceptance: approved master plan; no backend behavior changed.

Implementation status (2026-09-25): **IMPLEMENTED — pending review.** Frozen read-only endpoint contract, backend-auth findings, source-state and missing-data vocabulary, and projection adapters in `src/pages/admin/agent-fabric-command/commandContracts.js`, `commandClient.js`, `commandAdapters.js`. No backend behavior changed. Backend auth review rejected `/watchtower/summary`, `/admin/infra/verify` and `/admin/observability/verify` (no backend authorization; the first also writes Watchtower risk history on every GET) — shown as AUTH HARDENING REQUIRED.

### AFCC-1 — Shell + Routing

Scope: create Command Center route/shell with sidebar, status strip, center canvas, right drawer.
Dependencies: AFCC-0.
Files: new `src/pages/admin/agent-fabric-command-center/*`, `AdminRoutes.jsx`, sidebar route.
APIs: `/health/*`, `/status`.
Tests: render route, auth guard, responsive shell.
Acceptance: shell loads, no high-authority actions.

Implementation status (2026-09-25): **IMPLEMENTED — pending review.** Route `/admin.html#/agent-fabric/command` (same access rule and `audit.view` permission as `/agent-fabric`, which is preserved unchanged). Section sidebar (Command implemented; Agents links to the existing page; others marked "Coming next" with their phase), status strip, center canvas, reusable context drawer (docked / overlay / full-screen sheet with focus trap and focus return).

### AFCC-2 — Command Overview

Scope: health, agent summary, gate status, Watchtower summary, recent runs.
Dependencies: AFCC-1.
Files: overview components/hooks.
APIs: `/admin/agents/summary/health`, `/admin/layers/gate/status`, `/watchtower/summary`, `/runs/recent`.
Tests: mock API success/failure, empty states.
Acceptance: current Fabric posture visible.

Implementation status (2026-09-25): **IMPLEMENTED — pending review.** System posture (view-level composition, sources preserved), Recent operations (`/runs/recent`, no invented run states), Agent readiness (`/admin/agents/summary/health` + `/execution-readiness`), Governance gate (`/admin/layers/gate/status`), Watchtower risk and Infrastructure/Observability lanes (superseded by AFCC-2A safe read projections), Known data gaps. Shared polling coordinator with independent per-source failure.

### AFCC-2A — Safe Read Projection Hardening

Scope: replace unsafe dashboard sources with side-effect-free, server-authoritative read projections, and separate READ from privileged ACTION.
Dependencies: AFCC-2.
Files: `services/shf-agent-fabric/routers/command_read_routes.py`, `fabric/watchtower/read_projection.py`, `fabric/command/{sanitize,verification_results}.py`, `routers/admin_{infra_verify,observability}_routes.py`, `main.py`; frontend contracts/adapters/lanes.
APIs: `GET /api/v1-command-center/agent-fabric/{watchtower,infrastructure,observability}`.
Tests: auth (401/403/session/transitional key), no-side-effect and no-subprocess/no-network reads, Watchtower before/after invariants, sanitization, not-yet-verified, staleness age, action→read round trip.
Acceptance: Command Center never calls `/watchtower/summary`, `/admin/infra/verify` or `/admin/observability/verify`; reads never mutate Watchtower or launch subprocesses.

Implementation status (2026-09-25): **IMPLEMENTED — pending review.**
- Old endpoints (measured): `/watchtower/summary` writes a snapshot, a history row and an audit line per program on every GET; `/admin/infra/verify` had no auth and a doubled script path that made 4 of 5 checks always fail and leaked paths; `/admin/observability/verify` had no auth and always failed with a returned `TypeError` (so, contrary to the AFCC-0 note, it did not write snapshots).
- Read projections: Watchtower reads latest persisted snapshots, quarantine and attestation read-only (alerts and integrity are `NOT_PUBLISHED`, since Watchtower does not persist them); infra and observability read the last sanitized result recorded by their privileged actions, or `NOT_YET_VERIFIED`.
- Auth: Fabric session with `bos.governance.read`. (The model B transitional `X-Admin-Key` read was removed in AFCC-2A.1.)
- Actions: both verify routes now require `X-Admin-Key`; both bugs fixed; the fixed observability probe now performs one Watchtower evaluation per admin run. Actions are not in the UI.
- Staleness: age only, `threshold: NOT_DEFINED` (no canonical threshold exists).
- Details and new out-of-scope security findings: `docs/AGENT_FABRIC_COMMAND_CENTER_V1_ACCEPTANCE.md`.

### AFCC-2A.1 — Browser Secret Removal

Implementation status (2026-09-25): **IMPLEMENTED — pending review.**
- **Vulnerability:** the Fabric admin key reached browsers through `VITE_SHF_AGENT_ADMIN_KEY` (inlined into production chunks by whole-object `import.meta.env` references in 31 files, and served by the dev server), through `localStorage` keys sent as `X-Admin-Key` (Agent Fabric page, Registry, registry client, AFCC), and through `VITE_ADMIN_KEY` / `VITE_APP_GATEWAY_KEY` reads. The value was also committed (`91ded67`) to a public GitHub repo.
- **Fix:** no browser code holds or sends a Fabric admin key. Admin-key-only routes fail closed ("Auth bridge required"). AFCC reads accept only a Fabric session with `bos.governance.read` (verified live). Env reads use member access or the `src/system/env/publicEnv.js` allowlist. The variable was removed from `.env.local`, and the committed value was redacted in the working tree (history not rewritten).
- **Guard:** `tests/afccBrowserSecretScan.test.mjs` builds the app with sentinel secrets and asserts the browser bundle privileged secret count is 0.
- **Rotation:** REQUIRED (public git history). Not performed automatically.
- Details: `docs/AGENT_FABRIC_COMMAND_CENTER_V1_ACCEPTANCE.md`.

### AFCC-2A.2 — SHS→Fabric Auth Bridge (implemented for the four AFCC lanes; see the dedicated section)

Delivered: the four AFCC admin lanes. Still fail closed, not bridged: the Agent Fabric page, Registry, Alignment Switchboard, AI Analyst sync, and the three AFCC-2A Fabric-session reads.

Original scope: restore browser-safe access for AFCC admin lanes and the admin pages that now fail closed (Agent Fabric page, Registry, Alignment Switchboard, AI Analyst sync).
Design: an SHS-owned `/api` read proxy authorized by the SHS session and permission. It signs Fabric requests with a new, separately reviewed HMAC **read** scope (GET-only allowlist, mapped to `bos.governance.read`), carrying user and org context. Mutations get separately scoped actions with approval semantics. The browser never receives a credential.
Dependencies: AFCC-2A.1; review of the widened SHS service-identity authority.

### AFCC-2B — Health Probe Hardening (proposed)

Scope: `/health/ready` and `/health/degraded` are active verification (per call: 2× `git rev-parse` + 2 verification scripts, ~200ms). Make them cheap probes, or split them into a recorded verification action plus a read projection, following the AFCC-2A pattern. `/health/live` is already a cheap probe.
Dependencies: AFCC-2A.

### AFCC-3 — Live Operations

Scope: run/event timeline and filters.
Dependencies: AFCC-2.
Files: live operations view, run drawer.
APIs: `/runs/recent`, `/plans/recent`, `/admin/agents/events`.
Tests: timeline mapping, malformed event handling.
Acceptance: selected run opens trace drawer with real fields/missing markers.

### AFCC-4 — Agent Fleet

Scope: canonical agents plus capability inspector.
Dependencies: AFCC-2.
Files: agent fleet view; reuse `AgentFabricPage` logic and Workbench components where suitable.
APIs: `/admin/agents*`, `/tools`.
Tests: agent normalization, selection keyboard navigation.
Acceptance: no duplicate agent authority; actions disabled unless role allows.

### AFCC-5 — Authority + Approvals

Scope: approval queue projection and report publish policy.
Dependencies: AFCC-3.
Files: approvals view/components.
APIs: `/plans/recent`, `/runs/reports/{id}/policy`, Workbench ledger data.
Tests: policy blockers, role gates.
Acceptance: approve/publish controls map only to existing backend endpoints.

### AFCC-6 — Ecosystem Graph

Partially delivered by AFCC Visual V3: a read-only topology of the Ecosystem Connection Matrix with typed lineage traversal. Remaining: per-system live status for authorities that have no admitted source yet (each needs a backend-authorized read, as in AFCC-2A).

Scope: dependency graph and connection matrix UI.
Dependencies: AFCC-2.
Files: graph components; reuse system registry graph patterns.
APIs/data: SHS system registry, `/agent-contract-bridge/*`, Watchtower summaries.
Tests: graph node/edge generation, reduced motion.
Acceptance: graph distinguishes authority owners.

### AFCC-7 — Governance

Scope: policy/readiness/security/ownership/alignment panels.
Dependencies: AFCC-5.
Files: governance view.
APIs: `/policy-engine/*`, `/readiness-gate/*`, `/security-privacy/*`, `/data-ownership-ip/*`, `/admin/align/*`.
Tests: evaluate summaries and containment states.
Acceptance: no policy editor unless backend exists.

### AFCC-8 — Evidence + Truth

Scope: lineage explorer and Truth/package/proof projection.
Dependencies: AFCC-3.
Files: evidence view; reuse TruthSpine detail logic.
APIs: `/truth/*`, `/evidence-package/*`, `/data-verification/*`, `/audit-verification/*`.
Tests: claim/package/replay mapping.
Acceptance: missing links shown explicitly.

### AFCC-9 — Watchtower + Risk

Scope: risk bands, quarantine view, LOO rank gated explanation.
Dependencies: AFCC-2.
Files: Watchtower view.
APIs: `/watchtower/*`, `/loo/rankings`, `/loo/adapters`.
Tests: quarantine/gating explanations.
Acceptance: no quarantine action unless security/admin gating is proven.

### AFCC-10 — Security

Scope: auth matrices, service identity posture, rate limit status, audit.
Dependencies: AFCC-1.
Files: security view.
APIs: `/auth/*`, `/security-privacy/*`, internal ingestion status if route added.
Tests: permission display, access-denied states.
Acceptance: system-only endpoints not callable from browser.

### AFCC-11 — Infrastructure

Scope: health/readiness/degraded, storage/persistence posture, outbox visibility if available.
Dependencies: AFCC-2.
Files: infrastructure view.
APIs: `/health/*`, `/admin/infra/verify`, `/admin/observability/verify`, storage status.
Tests: degraded status rendering.
Acceptance: dev JSONL vs production durable state is obvious.

### AFCC-12 — Incidents

Scope: incident timeline and recovery checklist.
Dependencies: AFCC-8/9/10.
Files: incident view.
APIs: Truth replay/history, Watchtower risk history/attestations, auth audit, gate history.
Tests: replay timeline, empty incidents.
Acceptance: recovery actions map to existing backend only.

### AFCC-13 — Run Trace

Scope: polished end-to-end run trace.
Dependencies: AFCC-3/5/8/9.
Files: RunTrace component and drawer.
APIs: `/runs/recent`, `/plan/{id}`, `/admin/agents/{id}`, `/truth/*`, `/runs/report/*`, `/loo/*`.
Tests: complete trace, partial trace, missing field markers.
Acceptance: answers the required WHO/ORG/WORK ORDER/AGENT/MODEL/POLICY/TOOLS/RESOURCES/APPROVALS/EVIDENCE/TRUTH/OUTCOME/PROOF/PUBLISHED questions using actual data.

### AFCC-14 — Accessibility / Performance / Mobile

Scope: keyboard, reduced motion, responsive, performance.
Dependencies: all UI phases.
Files: CSS/tests.
APIs: none new.
Tests: Playwright accessibility/responsive checks.
Acceptance: no overlap, focus traps work, mobile is usable.

### AFCC-15 — System Acceptance

Scope: end-to-end acceptance matrix.
Dependencies: all.
Files: tests/docs.
APIs: all read routes and gated action smoke mocks.
Tests: `npm run ci:ui`, focused Playwright specs, route contract tests.
Acceptance: no internal-only endpoint exposed; no duplicate authorities; all data gaps documented.

## Top Risks

1. Exposing high-authority endpoints too early: Watchtower quarantine, Truth public approval, agent/layer disable, publish report, operator/treasury settlements.
2. Treating frontend route guard as backend authorization. Several Fabric routes show no decorator-level auth in the static audit.
3. Inventing a run lifecycle richer than backend persistence supports.
4. Collapsing operational telemetry, evidence, Truth, and institutional metrics into one misleading metric model.
5. Duplicating Watchtower/LOO/Truth/Oracle authority inside a new UI.
6. Production persistence ambiguity: several stores are JSONL/dev by default while Truth can use Postgres.
7. Internal service identity misuse: HMAC routes must remain system-only.
8. Route sprawl: more than 150 routes need grouping and action discipline.

## Recommended First Implementation Phase

Start with AFCC-0 then AFCC-1 and AFCC-2 only.

First build should be read-only:

- shell/routing
- health/status strip
- agent summary
- layer gate status
- Watchtower summary
- recent runs
- right drawer with "missing data" markers

No publish, approval, quarantine, Truth mutation, layer/agent mutation, internal ingestion, funding replay, operator, treasury, or settlement actions should ship in the first implementation.
