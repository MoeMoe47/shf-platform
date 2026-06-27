# SHS Direct Connect Repo Scan V1

## 1. Executive Summary

At scan time, the repo did not contain a formal **SHS Direct Connect Layer V1**. The later architecture correction defines Direct Connect as direct-source proof, not bank account connection.

The repo does contain a strong adjacent connection/intake architecture:

- Adapter Layer V1
- API Gateway Layer V1
- Event / Webhook Layer V1
- Batch / Import Layer V1
- Warehouse Sync Layer V1
- Source Registry, Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Data Approval
- Audit & Verification, Verified Aggregation, Reports, Watchtower
- SHS Spine / SHF Spine / SHS-to-SHF Data Flow Boundary
- Hub Files & Imports UI with import lanes, mapping, validation, API-ready status, and Integration Fabric language

“SHS Integration Fabric” exists as product language/naming, not as a complete formal layer. It appears in Hub tour copy, a Solutions page offer, and an older readiness registry label. It is not currently a mounted service or official Master Layer Registry layer.

Recommendation: build **SHS Direct Connect V1** as a named child capability inside the existing integration/intake fabric. It should connect approved source-backed records from files, forms, analytics, CRM exports, client system exports, SHS systems, ClientOps, reports, manual verified entries, and approval workflows. It should not duplicate Adapter Layer, Batch / Import, Event / Webhook, API Gateway, Warehouse Sync, Data Approval, Audit & Verification, Reports, or Watchtower. V1 should be local-first, admin-only, no credentials, no live external calls, no production persistence, and no public approval mutation.

## 2. Search Method

Searches performed:

- Broad `rg` keyword search across `docs`, `src`, `services`, `scripts`, `tests`, and `package.json`.
- Targeted search for `SHS Integration Fabric`, `Integration Fabric`, `Direct Connect`, `direct-connect`, and `direct connect`.
- File-name inventory for connect/integration/adapter/webhook/event/import/export/sync/gateway/approval/aggregation/tracking/clientops/report/truth/oracle/audit.
- Router/service inspection for mounted Agent Fabric V1 layers.
- UI route/navigation inspection in `src/router/AdminRoutes.jsx`, `src/components/admin/AdminSidebar.jsx`, `src/system/identity/hubAccessControl.js`, and cross-app route bridge files.
- Storage and local-first pattern inspection in Production Ops, Reports, Hub, adaptive tracking, and report storage files.

Major directories inspected:

- `docs/`
- `src/data/`
- `src/pages/admin/`
- `src/pages/admin/ops/`
- `src/pages/hub/`
- `src/pages/foundation/`
- `src/components/`
- `src/system/`
- `src/shared/`
- `services/shf-agent-fabric/`
- `services/shf-audit-service/`
- `scripts/`
- `tests/`
- `package.json`

## 3. Existing Connection Architecture

Current closest architecture:

```text
SHS / partner / app / manual source
  -> Batch / Import, Event / Webhook, API Gateway, or Adapter review
  -> Source Registry
  -> Data Federation
  -> Data Aggregator
  -> Data Normalization
  -> Evidence Package
  -> Data Verification
  -> Truth Spine
  -> Oracle
  -> Data Approval
  -> Audit & Verification / Readiness Gate / Security-Privacy / Data Ownership-IP / Public Approval
  -> Data Approval Gateway
  -> SHF Impact Data Spine
  -> Reports / Watchtower / LOO / ClientOps / public-safe SHF outputs
```

Key observations:

- API Gateway, Adapter, Event/Webhook, Batch/Import, Warehouse Sync, Audit & Verification, Data Approval, Verified Aggregation, Reports, and Watchtower are formalized.
- These V1 layers are deterministic review/evaluation scaffolds. They intentionally do not call external systems, store credentials, ingest production files, send webhooks, write warehouse records, verify truth, approve public data, mutate SHF Impact Data Spine, or publish reports.
- Reports and Watchtower already include summary visibility for these adjacent layers.
- Hub Files & Imports already expresses the user-facing workflow for upload, templates, source connection, batch import, mapping, validation, API readiness, and integration methods.
- Direct Connect is missing as a dedicated connector registry/setup/status/audit workflow.

## 4. Relevant File Inventory

| File path | Purpose | Status | Relevance to Direct Connect | Recommended action |
| --- | --- | --- | --- | --- |
| `docs/MASTER_LAYER_REGISTRY.md` | Canonical anti-drift architecture registry | Production | Lists official layers; no Direct Connect entry | Treat Direct Connect as child capability unless owner registers a new layer |
| `docs/ADAPTER_LAYER_V1.md` | Source format and mapping-readiness boundary | Production | Closest formal home for connector payload classification | Use as primary downstream boundary |
| `services/shf-agent-fabric/services/adapter_layer_service.py` | Deterministic adapter evaluator | Partial | Evaluates source system, format, mapping profile, provenance | Reuse schema and semantics |
| `services/shf-agent-fabric/routers/adapter_layer_routes.py` | `/adapter-layer/*` endpoints | Partial | Mounted review endpoints for adapter readiness | Call for backend smoke after Direct Connect exists |
| `docs/BATCH_IMPORT_LAYER_V1.md` | Bulk/file import readiness | Production | Owns CSV/JSON/manual/batch review | Use for file/import connector modes |
| `services/shf-agent-fabric/services/batch_import_service.py` | Deterministic import evaluator | Partial | Checks mapping, provenance, record counts, quarantine | Use for import/sync previews |
| `docs/EVENT_WEBHOOK_LAYER_V1.md` | Event and webhook readiness | Production | Owns event routing and external delivery blockers | Use for webhook connector type; no sends in V1 |
| `services/shf-agent-fabric/services/event_webhook_service.py` | Event/webhook evaluator | Partial | Evaluates queue readiness and external delivery context | Feed connector event previews here |
| `docs/API_GATEWAY_LAYER_V1.md` | API route exposure/readiness review | Production | Owns API connector exposure classification | Use for API connector setup status |
| `services/shf-agent-fabric/services/api_gateway_service.py` | API gateway evaluator | Partial | Classifies admin/internal/public/external and policy/audit needs | Reference for connection status logic |
| `docs/WAREHOUSE_SYNC_LAYER_V1.md` | Future warehouse sync eligibility | Production | Owns warehouse readiness without writes | Use for warehouse sync connector status only |
| `services/shf-agent-fabric/services/warehouse_sync_service.py` | Warehouse sync evaluator | Partial | Review-only warehouse sync logic | Defer real sync writes |
| `docs/AUDIT_VERIFICATION_LAYER_V1.md` | Audit completeness/replay readiness | Production | Direct Connect needs sync-run audit events | Mirror audit event model |
| `services/shf-agent-fabric/services/audit_verification_service.py` | Audit event evaluator | Partial | Checks event traceability and replay readiness | Use for connector audit events |
| `docs/DATA_APPROVAL_LAYER_V1.md` | Approval readiness before Gateway | Production | Connector data cannot become public-ready without this chain | Add connector approval metadata only |
| `docs/VERIFIED_AGGREGATION_LAYER_V1.md` | Verified aggregation previews | Production | Connector-fed summaries should wait for verified/readiness-approved status | Integrate after source readiness exists |
| `services/shf-agent-fabric/routers/reports_routes.py` | Reports snapshot and CSV exports | Production | Already exposes Adapter/API/Event/Batch/Warehouse summaries | Add Direct Connect summary later |
| `services/shf-agent-fabric/routers/watchtower_routes.py` | Watchtower risk/coverage summary | Production | Already watches adjacent layers | Add connector coverage risk later |
| `src/pages/hub/HubFilesImports.jsx` | Hub Files & Imports page | Mock | UI prototype for upload, connect source, batch import, mapping, validation | Use language/workflow as inspiration, not as final admin control |
| `src/pages/hub/shared/hubTourSteps.js` | Hub guided tour content | Docs Only | Explicitly says Integration Fabric connects, normalizes, verifies, reports | Treat as product requirement evidence |
| `src/pages/admin/ops/OpsProductionDashboard.jsx` | Production Ops local-first workflow | LocalStorage | Shows admin ops design and localStorage workflow style | Place Direct Connect under ops family |
| `src/pages/admin/ops/opsStorage.js` | Production Ops storage keys | LocalStorage | Shows local-first storage pattern | Use `shs.directConnect.*.v1` key family |
| `src/data/shsReports/shsReportStorage.js` | Report localStorage records | LocalStorage | Direct Connect report-source binding should not replace report storage | Integrate as source readiness metadata later |
| `src/data/shsReports/shsReportReadiness.js` | Report source readiness | Partial | Has source area statuses and export blocking logic | Add connector-fed source status later |
| `src/data/shsReports/shsReportTypes.js` | Report source area definitions | Partial | Contains source areas like data-binding, audit-trail, export-metadata | Consider connector-source area later |
| `src/system/identity/hubAccessControl.js` | Admin/client role route map | Production | Direct Connect route must be SHS-admin/internal | Add `/ops/direct-connect` only in implementation |
| `src/system/security/security-permissions.js` | Permission constants and role map | Production | Existing permissions cover uploads, audit, reports, aggregation | Avoid new permission unless owner approves |
| `src/system/routes/crossAppRouteBridge.js` | Cross-app route ownership and base URLs | Production | Direct Connect may later link to SHF-Next ops/clientops/data approval | Add route only after admin UI exists |
| `src/shared/integrations/importPlacementCsv.js` | Simple CSV parser | Partial | Shows older direct parse helper | Do not use for sensitive governed imports without wrappers |
| `src/shared/sync/syncQueue.js` | Offline event queue and fetch helper | Partial | Older sync concept that can call fetch | Avoid for V1 Direct Connect because V1 should not call external systems |
| `src/utils/webhooks.js` | Mock Slack/webhook/email notifications | Mock | Demonstrates mocked outbound integrations | Do not use for Direct Connect V1 external delivery |
| `src/pages/exchange/aggregation/ConnectorHealthPanel.jsx` | Placeholder connector health component | Stale | Connector naming exists but component returns null | Replace or ignore in new V1 after owner approval |
| `src/lib/aggregation/useConnectorHealth.js` | Placeholder connector health hook | Stale | Connector naming exists but hook returns null | Do not treat as implementation |
| `services/shf-audit-service/main.py` | Separate Postgres hash-chained audit service | Partial | Future durable audit option | Defer until production persistence decision |
| `package.json` | Scripts and governance commands | Production | Existing `check:governance` covers adjacent layers | Add check only if Direct Connect implementation formalizes docs/code |

## 5. Existing Data Flow Map

```text
External / partner / client systems
  -> files, CSV/XLSX, JSON, manual uploads, API exports, webhook-style events, future warehouse feeds
  -> Hub Files & Imports mock UI or SHS operational surfaces
  -> Batch / Import review
  -> Adapter Layer review
  -> Source Registry / Data Federation / Data Aggregator
  -> Data Normalization / Evidence Package / Data Verification
  -> Truth Spine / Oracle / Data Approval
  -> Audit & Verification / Readiness Gate / Security-Privacy / Data Ownership-IP / Public Approval
  -> Data Approval Gateway
  -> SHF Impact Data Spine
  -> Reports / Watchtower / LOO / ClientOps / public-safe SHF outputs
```

The requested conceptual chain:

```text
External Systems
  -> SHS Integration Fabric
  -> SHS Direct Connect Layer
  -> Verified Aggregation / Audit / Approval
  -> Tracking + Intelligence Layer
  -> ClientOps / Reports / Command Center
  -> SHF Data Approval Gateway / Public Impact Outputs
```

Closest repo-supported chain:

```text
External Systems
  -> Batch / Import + Event / Webhook + API Gateway + Adapter Layer
  -> Source Registry + Data Aggregator + Data Normalization + Evidence Package + Data Verification
  -> Truth Spine + Oracle + Data Approval + Audit & Verification + Verified Aggregation
  -> Reports + Watchtower + LOO + ClientOps / Command Center
  -> Data Approval Gateway + SHF Impact Data Spine + public-safe SHF outputs
```

## 6. Recommended Target Architecture

```text
External Systems
  Files / forms / analytics / CRM exports / client system exports / SHS systems / ClientOps / reports / manual verified entries / approval workflows
  (source-trust registry only in V1)

Deferred sensitive-data boundary examples
  banking_future / Plaid / Finicity / live QuickBooks / live payment processor sync
  (not included in V1; placeholder-only)

SHS Direct Connect V1
  ConnectorSource registry
  ConnectorConnection status
  ConnectorFieldMapping preview
  ConnectorSyncRun preview log
  ConnectorAuditEvent local log
  ConnectorApprovalStatus metadata
  ReportSourceBinding metadata

Existing formal layers
  API Gateway for API exposure review
  Event / Webhook for event/webhook readiness
  Batch / Import for CSV/Excel/JSON/manual import review
  Adapter Layer for source/format/mapping readiness
  Warehouse Sync for future sync eligibility
  Audit & Verification for trace/replay readiness
  Data Approval / Public Approval / Gateway for public movement

Consumers
  ClientOps
  Reports
  Watchtower
  Command Center
  SHF Data Approval Gateway
```

V1 must remain:

- Local-first.
- Admin-only.
- Mock connector registry only.
- No OAuth.
- No credentials.
- No live banking, Plaid, Finicity, QuickBooks, Stripe, Square, or external API calls.
- No external webhook sends.
- No production persistence.
- No SHF Impact Data Spine mutation.
- No public approval mutation.

## 7. Direct Connect Placement Decision

Recommended placement: **a child capability inside the existing integration/intake fabric**, not a standalone official layer yet.

Why:

- The Master Layer Registry already has API Gateway, Event/Webhook, Batch/Import, Warehouse Sync, Adapter Layer, Source Registry, Data Aggregator, Data Approval, Audit & Verification, Verified Aggregation, Reports, Watchtower, ClientOps, and SHS-to-SHF boundary layers.
- A new standalone layer risks duplicating those boundaries.
- Direct Connect’s unique V1 job is narrower: connector registry, setup status, mapping preview, sync-run preview, audit event preview, approval metadata, and report-source binding.
- If owner wants Direct Connect to be an official layer later, it should be registered with explicit boundaries: it owns connector setup/status but must not own data verification, source registry, external calls, credentials, public approval, reports publishing, or SHF Impact mutation.

Not recommended:

- **ClientOps-only module:** too narrow; connectors feed Reports, Watchtower, Data Approval, and Ops.
- **Reports-only module:** too late in the chain; source setup happens before reporting.
- **Foundation Data Approval module:** too public-facing and downstream.
- **Tracking + Intelligence-only feature:** tracking is a consumer/observer, not the connector authority.

## 8. UI Placement Recommendation

Best admin location:

- `admin.html#/ops/direct-connect`
- Sidebar section: Production Ops, near Data Binding, Reports Command, and Launch Workflow.
- Access: `shs_admin` only.

Recommended routes:

| Surface | Route | Navigation placement |
| --- | --- | --- |
| Admin overview | `admin.html#/ops/direct-connect` | Admin sidebar under Production Ops |
| Connector setup | `admin.html#/ops/direct-connect/connectors` | Child tab/section inside Direct Connect |
| Import/mapping | `admin.html#/ops/direct-connect/mapping` | Child tab or link from Hub Files & Imports |
| Sync log | `admin.html#/ops/direct-connect/sync-log` | Child tab inside Direct Connect |
| Approval/review | `admin.html#/ops/direct-connect/review` | Child tab linking to Truth/Data Approval |
| Report-source status panel | `admin.html#/ops/reports` | Panel inside Reports Command |

Existing UI surfaces to reuse conceptually:

- `src/pages/hub/HubFilesImports.jsx` for import lane language.
- `src/pages/admin/ops/OpsProductionDashboard.jsx` for dark ops style/local-first pattern.
- `src/pages/admin/reports/ShsReportsCommandPage.jsx` for report-source readiness integration.
- `src/pages/admin/reporting/ReportingCommandSurface.jsx` for audit/export/readiness style.

## 9. Data Model Recommendation

Keep V1 compatible with localStorage and deterministic governance checks.

### ConnectorSource

```js
{
  sourceId: "source_client_records_mock",
  displayName: "Client Records Export",
  systemType: "file_import|form_record|analytics|crm_export|client_system|shs_internal|clientops|report_usage|manual_verified|approval_workflow|banking_future",
  vendor: "client_export|shs_system|analytics_export|crm_export|custom",
  domain: "clientops|reports|impact|operations|approval|financial_sensitive_deferred",
  supportedMethods: ["csv", "manual_entry", "form_export", "analytics_export", "api_export_future", "webhook_future"],
  dataSensitivity: "public|internal|client_private|financial|pii_sensitive",
  owner: "SHS",
  status: "draft|available|needs_review|blocked",
  governanceNotes: []
}
```

### ConnectorConnection

```js
{
  connectionId: "conn_mock_001",
  sourceId: "source_client_records_mock",
  clientId: "client_demo",
  projectId: "project_demo",
  authMode: "none|manual_export|api_key_placeholder|oauth_future",
  credentialStatus: "not_required|not_configured|placeholder_only|blocked",
  consentStatus: "not_required|missing|recorded|needs_review",
  connectionStatus: "not_connected|draft|needs_mapping|ready_for_review|blocked|mock_connected",
  lastCheckedAt: "",
  allowedScopes: [],
  blockedReasons: []
}
```

### ConnectorFieldMapping

```js
{
  mappingId: "map_001",
  sourceId: "source_client_records_mock",
  sourceField: "customer_name",
  shsField: "organization_name",
  canonicalType: "organization",
  confidence: 0.92,
  status: "mapped|needs_review|missing|blocked",
  sampleValue: "Example Client",
  requiresReview: false
}
```

### ConnectorSyncRun

```js
{
  syncRunId: "sync_001",
  connectionId: "conn_mock_001",
  mode: "manual_preview|csv_import_preview|api_export_preview|webhook_event_preview|warehouse_sync_preview",
  startedAt: "",
  finishedAt: "",
  recordsSeen: 0,
  recordsAccepted: 0,
  recordsBlocked: 0,
  status: "not_run|preview_ready|needs_review|blocked",
  targetLayer: "adapter_layer|batch_import|event_webhook|api_gateway|warehouse_sync",
  auditEventIds: []
}
```

### ConnectorAuditEvent

```js
{
  eventId: "audit_direct_connect_001",
  connectionId: "conn_mock_001",
  syncRunId: "sync_001",
  eventType: "connector_created|mapping_reviewed|sync_previewed|approval_reviewed|report_binding_updated",
  layer: "direct_connect",
  actor: "shs_admin",
  subjectId: "conn_mock_001",
  decisionBefore: "",
  decisionAfter: "",
  warnings: [],
  blockers: [],
  timestamp: ""
}
```

### ConnectorApprovalStatus

```js
{
  approvalId: "approval_conn_001",
  connectionId: "conn_mock_001",
  truthStatus: "not_submitted|draft|verified",
  dataApprovalStatus: "not_ready|needs_review|gateway_ready",
  securityPrivacyStatus: "needs_review|clear_candidate|blocked",
  ownershipIpStatus: "needs_review|clear_candidate|blocked",
  publicApprovalStatus: "not_public|public_ready_candidate|blocked",
  gatewayStatus: "not_ready|gateway_review_required|gateway_ready",
  reportReady: false
}
```

### ReportSourceBinding

```js
{
  bindingId: "binding_report_001",
  reportId: "SHS-REPORT-DEMO",
  sourceId: "source_client_records_mock",
  connectionId: "conn_mock_001",
  sourceArea: "clientops_summary",
  readinessStatus: "missing|sample|draft|approved|verified",
  lastSyncRunId: "sync_001",
  visibilitySafe: false,
  blockingReason: "source_requires_approval"
}
```

## 10. V1 Scope

Include:

- `docs/SHS_DIRECT_CONNECT_LAYER_V1.md`
- `docs/SHS_DIRECT_CONNECT_LAYER_V1.json`
- Local connector registry.
- Mock connector sources.
- Connection status states.
- Mapping preview data.
- Sync-run preview log.
- Connector audit event model.
- Approval/readiness status model.
- Report-source binding model.
- Admin UI surface under `/ops/direct-connect`.
- Reports/Watchtower metadata integration after the model exists.
- Governance check script if Direct Connect gets formal docs/code.

Defer:

- Real OAuth.
- Real credentials.
- API keys.
- Secrets storage.
- QuickBooks/Plaid/Finicity/Stripe/Square live calls.
- External webhook delivery.
- Production persistence.
- Warehouse writes.
- SHF Impact Data Spine mutation.
- Public approval mutation.
- Self-service client connector setup.
- Scheduled sync jobs.

## 11. Risks and Blockers

Security/privacy:

- Financial connectors and banking data require strict consent, privacy, credential, and audit controls.
- No V1 code should store live credentials in localStorage.
- No V1 code should log secrets, tokens, OAuth codes, account numbers, or financial payloads.

Compliance:

- Plaid/Finicity/Stripe/Square/QuickBooks integrations imply regulated financial data handling.
- Owner approval is needed before any live financial connector work.

Architecture drift:

- Direct Connect could duplicate Adapter, Event/Webhook, Batch/Import, API Gateway, Warehouse Sync, or Data Approval if not bounded.
- Direct Connect should not become a new layer without Master Layer Registry owner decision.

Report trust:

- Report source bindings must not imply verified or public-ready status.
- Reports must still defer to Truth Spine, Data Approval, Public Approval, Security/Privacy, and Data Ownership/IP.

Mock/stale code:

- `ConnectorHealthPanel.jsx` and `useConnectorHealth.js` are placeholders.
- `HubFilesImports.jsx` is mock UI.
- `src/shared/sync/syncQueue.js` and `src/utils/webhooks.js` should not be used to bypass no-external-send V1 rules.

Persistence:

- localStorage is acceptable for V1 UI state and mock registry.
- Production connector state, sync runs, credentials, consent, and audit must wait for owner-approved persistence.

## 12. Implementation Plan

### Batch 1: Documentation and architecture lock

Create:

- `docs/SHS_DIRECT_CONNECT_LAYER_V1.md`
- `docs/SHS_DIRECT_CONNECT_LAYER_V1.json`
- `scripts/check_shs_direct_connect_layer.py`

Modify only if owner approves:

- `docs/MASTER_LAYER_REGISTRY.md`
- `docs/TRUTH_SPINE_GUARDRAILS.md`
- `package.json`

Goal:

- Lock Direct Connect as connector setup/status capability.
- Declare no external calls, no credentials, no public approval, no SHF Impact mutation.

### Batch 2: Data model and mock registry

Create:

- `src/data/direct-connect/directConnectTypes.js`
- `src/data/direct-connect/directConnectRegistry.js`
- `src/data/direct-connect/directConnectStorage.js`
- `src/data/direct-connect/directConnectAudit.js`
- `src/data/direct-connect/directConnectApproval.js`

Use:

- localStorage keys such as `shs.directConnect.sources.v1`, `shs.directConnect.connections.v1`, `shs.directConnect.syncRuns.v1`, `shs.directConnect.audit.v1`.

### Batch 3: Admin UI

Create:

- `src/pages/admin/ops/OpsDirectConnectPage.jsx`
- `src/styles/opsDirectConnect.css`

Modify:

- `src/router/AdminRoutes.jsx`
- `src/components/admin/AdminSidebar.jsx`
- `src/system/identity/hubAccessControl.js`

Route:

- `/ops/direct-connect`

### Batch 4: ClientOps/Reports connection

Modify:

- `src/data/shsReports/shsReportReadiness.js`
- `src/data/shsReports/shsReportTypes.js` if a connector source area is needed
- `src/pages/admin/reports/components/ShsReportDashboard.jsx` if a report-source status panel is needed

Rules:

- Metadata only.
- Do not mark reports verified/public-ready from connector state.

### Batch 5: Audit/approval checks

Create or modify:

- `src/data/direct-connect/directConnectAudit.js`
- `src/data/direct-connect/directConnectApproval.js`
- optional backend summary after owner approval

Rules:

- Mirror Audit & Verification and Data Approval semantics.
- No public approval mutation.

### Batch 6: Tests/build verification

Add if implementation exists:

- `scripts/check_shs_direct_connect_layer.py`
- package script `check:direct-connect`
- optional focused tests for data helpers.

Keep final verification:

- governance checks
- build
- strict runtime log hygiene
- git safety

## 13. Verification Commands

After Direct Connect implementation:

```bash
python3 -m json.tool docs/SHS_DIRECT_CONNECT_LAYER_V1.json
python3 scripts/check_shs_direct_connect_layer.py
npm run check:governance
npm run build
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_runtime_log_hygiene.py --strict
git status --short
git diff --name-status
```

For this scan report:

```bash
python3 -m json.tool docs/SHS_DIRECT_CONNECT_REPO_SCAN_V1.json
git status --short
git diff --name-status
git diff --stat
```

## 14. Open Questions for Owner

1. Should Direct Connect be registered as its own official layer, or remain a named child capability inside the existing integration/intake fabric?
2. Which connector families are approved for V1 mock registry: finance, CRM, payroll, case management, analytics, or all as non-live examples?
3. Should clients ever see connector status later, or should `/ops/direct-connect` remain SHS-admin-only while `/hub/imports` stays the client-visible import surface?
