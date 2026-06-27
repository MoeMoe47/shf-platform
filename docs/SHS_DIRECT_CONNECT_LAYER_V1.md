# SHS Direct Connect Layer V1

## 1. Executive Summary

SHS already has partial connection infrastructure: Adapter Layer, API Gateway, Event / Webhook, Batch / Import, Warehouse Sync, Data Aggregator, Audit & Verification, Data Approval, Reports, Watchtower, Hub Files & Imports, and SHS-to-SHF public approval guardrails.

SHS Direct Connect Layer V1 formalizes the missing connector architecture lock. It does not build live integrations yet. It defines how SHS will represent connector sources, connection status, field mapping, sync/import previews, audit events, approval posture, report-source bindings, and public/private boundaries before any future live integration work.

Architecture decision: SHS Direct Connect Layer V1 is a child layer inside the broader SHS Integration Fabric.

## 2. Layer Definition

SHS Direct Connect is the source-trust layer that connects approved records from client systems, SHS systems, files, forms, analytics, reports, manual verified entries, ClientOps records, SHS internal operations, and approval workflows into Silicon Heartland OS for ClientOps, reporting, governance, QA, ROI proof, and SHF-approved impact workflows.

In V1, Direct Connect is local-first and architecture-locked only. It may define source-trust models, statuses, and boundaries. It must not create live external connections, store credentials, run OAuth, pull bank data, mutate public data, or approve public impact use.

Direct Connect gives SHS source-backed proof for reports, ClientOps, governance, QA, ROI evidence, and approval workflows without requiring live bank access or credential handling.

Direct Connect owns source setup state and source-readiness metadata. It does not own verification, public approval, report publication, public impact mutation, external delivery, or production persistence.

## Direct-Source Proof Clarification

Direct Connect does not mean bank account connection in V1. Direct Connect means approved source-backed records.

The purpose is to reduce manual reporting, increase trust, and connect verified records to Reports, ClientOps, QA, governance, and ROI proof. Direct Connect V1 prioritizes CSV/file imports, website form records, website analytics, CRM exports, client system exports, SHS internal ops records, ClientOps records, report usage records, manual verified entries, SHF approval status records, and approved source-backed report evidence.

Banking and financial-account connection are deferred and placeholder-only. For checker clarity: banking and financial-account connection are deferred. There is no live banking integration in V1, no bank account connection in V1, no bank login handling, no transaction-level financial syncing, and no credential vault. The only allowed banking reference in V1 is `banking_future` as a deferred, `placeholder_only`, sensitive-data boundary example.

Financial data remains private by default and blocked from public impact use by default. Financial data must never become public impact data by default. Source-backed proof does not automatically equal public approval. Direct Connect does not bypass SHF approval.

## 3. What This Layer Is Not

- Not a bank connector in V1.
- Not a credential vault in V1.
- Not live QuickBooks/Plaid/Finicity integration in V1.
- Not live Stripe/Square integration in V1.
- Not OAuth handling in V1.
- Not a replacement for Tracking + Intelligence.
- Not a replacement for SHF Data Approval Gateway.
- Not a replacement for Truth Spine, Oracle, Adapter Layer, Batch / Import, Event / Webhook, API Gateway, Warehouse Sync, Data Approval, Reports, Watchtower, or ClientOps.
- Not public-impact approval by itself.
- Not production persistence.
- Not a client-facing connector marketplace.

## 4. Placement in SHS Architecture

Locked hierarchy:

```text
External Systems
  -> SHS Integration Fabric
  -> SHS Direct Connect Layer
  -> Verified Aggregation / Audit / Approval
  -> Tracking + Intelligence Layer
  -> ClientOps / Reports / Command Center
  -> SHF Data Approval Gateway / Public Impact Outputs
```

Interpretation:

- SHS Integration Fabric is the broader connection approach.
- SHS Direct Connect Layer is the connector setup/status capability inside that fabric.
- Verified Aggregation, Audit & Verification, and Approval layers decide whether connected data is usable downstream.
- Tracking + Intelligence Layer may observe readiness and operational signals.
- ClientOps, Reports, and Command Center consume approved source readiness metadata.
- SHF Data Approval Gateway and Public Impact Outputs remain downstream public-release gates.

## 5. Existing Repo Foundation

The repo scan found these foundations:

- Adapter/API/Event/Import/Warehouse review layers exist as formal V1 documentation, services, routers, and governance checks.
- Hub Files & Imports UI already communicates upload, template, connect-source, batch import, mapping, validation, API sync, webhook listener, warehouse sync, and audit trace workflows.
- Reports/Watchtower visibility already includes adjacent layer summaries for Adapter, API Gateway, Event / Webhook, Batch / Import, Warehouse Sync, Audit & Verification, Data Approval, and Verified Aggregation.
- SHS-to-SHF approval boundary is formalized through SHS Spine, SHF Spine, SHS-to-SHF Data Flow Boundary, Truth Spine guardrails, Public Approval, Security / Privacy, Data Ownership / IP, and Data Approval Gateway.
- Data Approval Gateway remains the human/review surface before public SHF impact visibility.
- Reports and ClientOps are destination surfaces for source readiness, monthly review, system health, and report-source trust metadata.

## 6. V1 Responsibilities

SHS Direct Connect Layer V1 formalizes:

- Source registry.
- Connector source categories.
- Connection status.
- Import readiness.
- Field mapping.
- Sync run history.
- Audit trail.
- Approval status.
- Report binding.
- ClientOps visibility.
- Governance visibility.
- Trust and public/private data boundaries.

V1 responsibilities are metadata and readiness responsibilities only. V1 does not execute external sync, store credentials, or write production data.

## 7. V1 Data Models

### ConnectorSource

Purpose: defines an external or internal source that may provide records to SHS Direct Connect.

Required fields:

```ts
type ConnectorSource = {
  source_id: string;
  display_name: string;
  category: ConnectorSourceCategory;
  vendor: string;
  domain: "operations" | "clientops" | "reports" | "website" | "financial" | "impact";
  supported_methods: Array<"csv" | "excel" | "json" | "api_export" | "webhook" | "warehouse_sync" | "manual_entry">;
  data_sensitivity: "public" | "internal" | "client_private" | "financial" | "pii_sensitive";
  owner: string;
  status: ConnectionStatusState;
  created_at: string;
  updated_at: string;
};
```

Field purpose:

- `source_id`: stable local identifier.
- `display_name`: operator-facing source name.
- `category`: source category such as `crm`, `payments`, or `file_import`.
- `vendor`: vendor or system family.
- `domain`: business domain the source supports.
- `supported_methods`: allowed intake methods.
- `data_sensitivity`: privacy/security posture.
- `owner`: SHS/client/operator owner.
- `status`: current source readiness state.
- `created_at` / `updated_at`: audit timestamps.

### ConnectorConnection

Purpose: tracks one client's or project's connection posture for a source without storing credentials in V1.

```ts
type ConnectorConnection = {
  connection_id: string;
  source_id: string;
  client_id: string;
  project_id: string;
  auth_mode: "none" | "manual_export" | "api_key_placeholder" | "oauth_future";
  credential_status: "not_required" | "not_configured" | "placeholder_only" | "blocked";
  consent_status: "not_required" | "missing" | "recorded" | "needs_review";
  connection_status: ConnectionStatusState;
  last_checked_at: string;
  allowed_scopes: string[];
  blocked_reasons: string[];
};
```

Field purpose:

- `connection_id`: stable connection identifier.
- `source_id`: linked ConnectorSource.
- `client_id` / `project_id`: SHS context.
- `auth_mode`: describes future auth shape without implementing it.
- `credential_status`: confirms no credential storage in V1.
- `consent_status`: tracks consent posture.
- `connection_status`: setup/readiness state.
- `last_checked_at`: last review timestamp.
- `allowed_scopes`: non-secret scope labels.
- `blocked_reasons`: blockers preventing use.

### ConnectorFieldMapping

Purpose: maps source fields to SHS canonical fields and records review confidence.

```ts
type ConnectorFieldMapping = {
  mapping_id: string;
  source_id: string;
  connection_id: string;
  source_field: string;
  shs_field: string;
  canonical_type: string;
  confidence: number;
  mapping_status: "mapped" | "needs_review" | "missing" | "blocked";
  sample_value: string;
  requires_review: boolean;
};
```

Field purpose:

- `mapping_id`: stable mapping identifier.
- `source_id` / `connection_id`: source linkage.
- `source_field`: field name from the source.
- `shs_field`: SHS field target.
- `canonical_type`: entity/data type.
- `confidence`: mapping confidence from 0 to 1.
- `mapping_status`: review posture.
- `sample_value`: redacted/example value only.
- `requires_review`: operator review flag.

### ConnectorSyncRun

Purpose: records a local/mock import or sync preview run and its target governance layer.

```ts
type ConnectorSyncRun = {
  sync_run_id: string;
  connection_id: string;
  mode: "manual_preview" | "csv_import_preview" | "api_export_preview" | "webhook_event_preview" | "warehouse_sync_preview";
  started_at: string;
  finished_at: string;
  records_seen: number;
  records_accepted: number;
  records_blocked: number;
  sync_status: "not_run" | "preview_ready" | "needs_review" | "blocked" | "error";
  target_layer: "adapter_layer" | "batch_import" | "event_webhook" | "api_gateway" | "warehouse_sync";
  audit_event_ids: string[];
};
```

Field purpose:

- `sync_run_id`: stable run identifier.
- `connection_id`: linked connection.
- `mode`: preview method.
- `started_at` / `finished_at`: run timestamps.
- `records_seen` / `records_accepted` / `records_blocked`: preview counts.
- `sync_status`: run readiness state.
- `target_layer`: downstream review layer.
- `audit_event_ids`: audit event references.

### ConnectorAuditEvent

Purpose: captures connector setup, mapping, sync, approval, and report-binding decisions for audit review.

```ts
type ConnectorAuditEvent = {
  event_id: string;
  connection_id: string;
  sync_run_id: string;
  event_type: "connector_created" | "mapping_reviewed" | "sync_previewed" | "approval_reviewed" | "report_binding_updated";
  layer: "direct_connect";
  actor: string;
  subject_id: string;
  decision_before: string;
  decision_after: string;
  warnings: string[];
  blockers: string[];
  timestamp: string;
};
```

Field purpose:

- `event_id`: stable audit event identifier.
- `connection_id` / `sync_run_id`: connector context.
- `event_type`: what changed.
- `layer`: fixed as Direct Connect context.
- `actor`: operator/system actor.
- `subject_id`: affected entity.
- `decision_before` / `decision_after`: review trace.
- `warnings` / `blockers`: governance posture.
- `timestamp`: event time.

### ConnectorApprovalStatus

Purpose: tracks readiness signals from Truth Spine, Data Approval, Security/Privacy, Data Ownership/IP, Public Approval, and Gateway review without approving public use itself.

```ts
type ConnectorApprovalStatus = {
  approval_id: string;
  connection_id: string;
  truth_status: "not_submitted" | "draft" | "verified";
  data_approval_status: "not_ready" | "needs_review" | "gateway_ready";
  security_privacy_status: "needs_review" | "clear_candidate" | "blocked";
  ownership_ip_status: "needs_review" | "clear_candidate" | "blocked";
  public_approval_status: "not_public" | "public_ready_candidate" | "blocked";
  gateway_status: "not_ready" | "gateway_review_required" | "gateway_ready";
  report_ready: boolean;
};
```

Field purpose:

- `approval_id`: stable approval status identifier.
- `connection_id`: linked connection.
- `truth_status`: Truth Spine posture.
- `data_approval_status`: Data Approval posture.
- `security_privacy_status`: privacy/security posture.
- `ownership_ip_status`: ownership/IP posture.
- `public_approval_status`: public release candidate posture only.
- `gateway_status`: SHF Data Approval Gateway posture.
- `report_ready`: report-source readiness flag.

### ReportSourceBinding

Purpose: binds a connector source to a report source area and shows source readiness, approval, and visibility safety.

```ts
type ReportSourceBinding = {
  binding_id: string;
  report_id: string;
  source_id: string;
  connection_id: string;
  source_area: string;
  readiness_status: "missing" | "sample" | "draft" | "approved" | "verified";
  last_sync_run_id: string;
  visibility_safe: boolean;
  blocking_reason: string;
};
```

Field purpose:

- `binding_id`: stable binding identifier.
- `report_id`: linked report.
- `source_id` / `connection_id`: connector context.
- `source_area`: report source area.
- `readiness_status`: report-source readiness.
- `last_sync_run_id`: latest run preview.
- `visibility_safe`: whether source can be shown for the report mode.
- `blocking_reason`: why it is not usable.

## 8. Connection Status States

- `not_configured`: source exists but no connection setup has started.
- `available`: source is available as a selectable connector option.
- `draft`: setup has started but is incomplete.
- `pending_review`: ready for operator/governance review.
- `connected_mock`: mock connection is present for V1 demo/local use.
- `import_ready`: import preview has enough metadata to move to Batch / Import or Adapter review.
- `needs_mapping`: field mapping is incomplete.
- `needs_approval`: approval/security/ownership/gateway status is missing or incomplete.
- `approved_internal`: approved for internal SHS use only.
- `approved_report_source`: approved as a report source for the defined visibility mode.
- `rejected`: reviewed and rejected.
- `disabled`: intentionally turned off.
- `error`: setup or preview failed.

## 9. Connector Source Categories

- `file_import`: CSV, Excel, JSON, or document-style manual file intake.
- `website_analytics`: website behavior, traffic, conversion, and campaign analytics.
- `crm`: client/customer relationship systems.
- `payments`: payment/import summary records treated as financial and private by default; no live payment processor syncing in V1.
- `accounting`: accounting/export summary records treated as financial and private by default; no live QuickBooks connection in V1.
- `banking_future`: deferred, placeholder-only sensitive-data boundary example; no live banking integration in V1.
- `client_os`: client operating systems or case management platforms.
- `shs_internal`: internal SHS operational systems.
- `shf_approval`: SHF approval/gateway-adjacent records.
- `manual_entry`: operator-created local/manual source records.

## 10. Data Trust Rules

- External data is not trusted by default.
- Connected data is private by default.
- Report use requires approval.
- Public SHF use requires SHF Data Approval Gateway approval.
- Financial data must never become public impact data by default.
- Mock connections must be labeled clearly.
- Every sync/import must create an audit event.
- Every report binding must show source and approval status.
- Truth Spine remains the authority for verified claims, public approval status, and report readiness.
- Direct Connect does not bypass SHF approval.
- Direct Connect cannot mutate SHF Impact Data Spine.
- Direct Connect cannot mark `public_approved` true.

## 11. V1 UI Placement Recommendation

Recommended future routes/pages, not built in Batch 1:

- Admin Direct Connect overview: `admin.html#/ops/direct-connect`
- Connector registry: `admin.html#/ops/direct-connect/connectors`
- Connection detail: `admin.html#/ops/direct-connect/connections/:connectionId`
- Import/mapping: `admin.html#/ops/direct-connect/mapping`
- Sync log: `admin.html#/ops/direct-connect/sync-log`
- Approval review: `admin.html#/ops/direct-connect/review`
- Report source bindings: `admin.html#/ops/reports`

Recommended navigation:

- Admin sidebar under Production Ops near Data Binding, Reports Command, and Launch Workflow.
- `shs_admin` only in V1.
- Client-visible `/hub/imports` may remain the client import education/workflow surface, while `/ops/direct-connect` is the SHS-admin control surface.

## 12. Deferred Scope

- QuickBooks live API.
- Plaid.
- Finicity.
- Stripe/Square live API.
- OAuth.
- Credential vault.
- Live bank data.
- Automatic scheduled sync.
- External webhook processing.
- Production database migration.
- Client-facing connector setup.
- Paid integration marketplace.

## 13. Security and Compliance Boundaries

- No credential storage in V1.
- no credential storage in V1.
- No bank login handling in V1.
- No live banking connectors in V1.
- No public exposure of private financial data.
- No OAuth token, API key, secret, bank credential, account number, or live financial payload may be stored in Direct Connect V1.
- Role/permission requirements must be defined before live connectors.
- Audit logging is required for every sync/import preview.
- Data retention policy is required before live financial integrations.
- Security / Privacy and Data Ownership / IP review are required before any public-facing use.
- Financial data must remain private unless a future owner-approved design explicitly allows a derived, non-sensitive, public-safe aggregate through the full approval chain.

## 14. Report and ClientOps Integration

Direct Connect will feed:

- ClientOps records as internal source readiness metadata.
- Monthly reviews through source status, blocked data, and sync-readiness signals.
- System health through connection status, mapping gaps, approval blockers, and sync preview health.
- Upgrade opportunities when a client is using manual imports that could later move to approved integration.
- Premium reports through report-source trust panels.
- Report-source trust panels through ReportSourceBinding records that show source, readiness, approval status, and visibility safety.

Direct Connect does not make reports verified, public-approved, or export-ready by itself. Reports must still obey Truth Spine, Data Approval, Public Approval, Security / Privacy, Data Ownership / IP, and SHF Data Approval Gateway constraints.

## 15. SHF Boundary

- SHS operational data can only flow to SHF public outputs through approval.
- Direct Connect does not bypass SHF approval.
- SHF Impact Data Spine remains public-approved only.
- Data Approval Gateway remains the approval surface.
- SHF Data Approval Gateway remains required before public SHF impact visibility.
- Direct Connect cannot mutate SHF Impact Data Spine.
- Direct Connect cannot mark `public_approved` true.
- Financial/private/client data from Direct Connect remains private by default.

## 16. V1 Build Batches After This Lock

- Batch 2: data model and mock registry.
- Batch 3: admin UI.
- Batch 4: ClientOps and Reports connection.
- Batch 5: audit/approval checks.
- Batch 6: tests/build verification.

## 17. Verification Requirements

Required Batch 1 checks:

- JSON validates.
- `scripts/check_shs_direct_connect_layer.py` passes.
- Existing governance checks remain untouched.
- No app code is required for Batch 1.
- No git staging/commit performed.

Recommended commands:

```bash
python3 -m json.tool docs/SHS_DIRECT_CONNECT_LAYER_V1.json
python3 scripts/check_shs_direct_connect_layer.py
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_runtime_log_hygiene.py --strict
```
