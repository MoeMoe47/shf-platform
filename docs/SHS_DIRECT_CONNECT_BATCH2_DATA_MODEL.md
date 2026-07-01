# SHS Direct Connect Batch 2 Data Model

## 1. Executive Summary

Batch 2 creates the local-first SHS Direct Connect data foundation. It adds a stable mock connector registry, connection records, field mappings, sync runs, audit events, approval statuses, report source bindings, and read-only helper functions for future Admin UI, Reports, ClientOps, Tracking + Intelligence, and SHF approval workflows.

This batch does not build UI, routes, backend services, live integrations, OAuth, credential storage, bank feeds, scheduled external sync, external webhook processing, production persistence, client-facing connector setup, or a paid integration marketplace.

## 2. Files Created

- `src/data/shsDirectConnectData.js`: local mock registry and helper functions.
- `docs/SHS_DIRECT_CONNECT_BATCH2_DATA_MODEL.md`: human-readable Batch 2 documentation.
- `docs/SHS_DIRECT_CONNECT_BATCH2_DATA_MODEL.json`: machine-readable Batch 2 record.
- `scripts/check_shs_direct_connect_batch2.py`: governance check for the Batch 2 artifacts.

## 3. Data Model Overview

`ConnectorSource` defines a local or future-capable connector source with category, provider type, mock/import support, data sensitivity, allowed destinations, and deferred live features.

`ConnectorConnection` tracks a client or project connection posture without credentials. It records status, environment, approval status, report eligibility, public impact eligibility, credential mode, and notes.

`ConnectorFieldMapping` maps source fields to SHS target fields. It records the target domain, whether the mapping is required, mapping status, transform rule, and notes.

`ConnectorSyncRun` records a mock import or placeholder run. It captures run type, status, record counts, errors, approval requirements, and audit event linkage.

`ConnectorAuditEvent` records connector registration, mock import completion, mapping requirements, approval requirements, report binding approval, financial public-impact blocking, SHF boundary checks, and banking placeholder deferral.

`ConnectorApprovalStatus` records allowed use, denied use, public impact eligibility, financial public-impact blocking, reviewer, review time, and notes.

`ReportSourceBinding` binds connector data to future report usage. It records report identity, trust-panel visibility, approval status, last verification, data use, and notes.

## 4. Mock Connector Registry

- CSV File Import: local file-import source for client, project, and report seed data.
- Website Analytics Mock: mock website sessions, conversions, and demo-request metrics.
- CRM Mock: mock lead, opportunity, and client lifecycle records.
- Payment Processor Mock: mock/import-only payment summaries with no live Stripe or Square integration.
- Accounting Mock: mock/import-only accounting summaries with no live QuickBooks integration.
- Banking Future Placeholder: deferred `banking_future` placeholder with `placeholder_only` mode and no live banking integration in V1.
- Client OS Mock: mock client operations records for support, version, and lifecycle status.
- SHS Internal Ops: internal readiness, QA, launch, and support operations signals.
- SHF Approval Gateway: approval boundary representation, not a bypass.
- Manual Entry: future operator-entered source records.

## 5. Status States

- `not_configured`: setup has not started.
- `available`: source is listed for future setup.
- `draft`: setup is being drafted.
- `pending_review`: operator or governance review is required.
- `connected_mock`: mock or local data is available.
- `import_ready`: local import is ready for mapping or approval.
- `needs_mapping`: source fields need mapping review.
- `needs_approval`: source use needs approval.
- `approved_internal`: source is approved for internal SHS use.
- `approved_report_source`: source is approved for report trust-panel use.
- `rejected`: source use was rejected for the requested purpose.
- `disabled`: source is disabled or deferred.
- `error`: source has an error state that blocks use.

## 6. Source Categories

- `file_import`: CSV or local file intake.
- `website_analytics`: website traffic and conversion metrics.
- `crm`: lead, opportunity, and client lifecycle records.
- `payments`: mock/import-only payment summaries.
- `accounting`: mock/import-only accounting summaries.
- `banking_future`: deferred banking placeholder.
- `client_os`: client operations records.
- `shs_internal`: internal SHS operations signals.
- `shf_approval`: SHF approval boundary status.
- `manual_entry`: operator-entered source records.

## 7. Data Trust Rules

- External data is not trusted by default.
- Connected data is private by default.
- Report use requires approval.
- Public SHF use requires SHF Data Approval Gateway approval.
- Financial data must never become public impact data by default.
- Mock connections must be labeled clearly.
- Every sync/import must create an audit event.
- Every report binding must show source and approval status.
- No credential storage in V1.
- Direct Connect does not bypass SHF approval.

These rules keep Direct Connect as an intake/readiness layer. It can describe source status and future report readiness, but it cannot mark data verified, public-approved, or public-impact safe by itself.

## 8. Helper Functions

- `getDirectConnectConnectorSources()`: returns connector source copies.
- `getDirectConnectSourceById(sourceId)`: finds one source by ID.
- `getDirectConnectSourcesByCategory(category)`: filters sources by category.
- `getDirectConnectConnections()`: returns connection copies.
- `getDirectConnectConnectionById(connectionId)`: finds one connection by ID.
- `getDirectConnectConnectionsByClientId(clientId)`: filters by client.
- `getDirectConnectConnectionsByStatus(status)`: filters by status.
- `getDirectConnectMappingsByConnectionId(connectionId)`: returns mappings for one connection.
- `getDirectConnectSyncRunsByConnectionId(connectionId)`: returns sync runs for one connection.
- `getDirectConnectAuditEventsByConnectionId(connectionId)`: returns audit events for one connection.
- `getDirectConnectApprovalByConnectionId(connectionId)`: finds approval status for one connection.
- `getDirectConnectReportBindings()`: returns report source binding copies.
- `getDirectConnectReportBindingsByConnectionId(connectionId)`: filters report bindings by connection.
- `getDirectConnectReportEligibleConnections()`: returns connections eligible for approved report use.
- `getDirectConnectPublicImpactEligibleConnections()`: returns non-financial connections that have SHF boundary eligibility.
- `getDirectConnectBlockedFinancialPublicImpactConnections()`: returns financial connections blocked from public impact.
- `isDirectConnectStatusValid(status)`: validates a status ID.
- `isDirectConnectSourceCategoryValid(category)`: validates a category ID.
- `isDirectConnectConnectionReportEligible(connection)`: safely checks report eligibility.
- `isDirectConnectConnectionPublicImpactEligible(connection)`: safely checks SHF boundary/public impact eligibility.
- `summarizeDirectConnectReadiness()`: returns source, connection, eligibility, mapping, approval, error, mock, and deferred counts.

## 9. Report and ClientOps Readiness

Batch 2 prepares future Reports and ClientOps integration by exposing report eligibility, approval status, trust-panel visibility, report source binding status, ClientOps readiness signals, and internal-only financial summary boundaries.

Reports can later consume `ReportSourceBinding` records to show which source is being used, whether it is visible in a trust panel, when it was last verified, and whether it is blocked. ClientOps can later consume connection status, sync run status, mapping status, and internal operations readiness without treating connector data as verified or public-approved.

## 10. SHF Boundary Protection

Public impact eligibility is blocked unless the correct SHF approval boundary is involved. The SHF Approval Gateway source represents the boundary, not a shortcut around it.

Financial data is blocked by default. Payment, accounting, and banking placeholder records are not public-impact eligible. Financial data must never become public impact data by default, and Direct Connect does not bypass SHF approval.

## 11. Deferred Scope

Deferred scope includes live integrations, OAuth, credentials, bank feeds, scheduled sync, external webhook processing, database persistence, client-facing setup, and a paid integration marketplace.

The Banking Future Placeholder remains disabled/deferred. It lists future Plaid, Finicity, OAuth, consent, security review, credential vault, data retention, and permission requirements only as future review topics.

## 12. Verification

Run:

```bash
python3 -m json.tool docs/SHS_DIRECT_CONNECT_BATCH2_DATA_MODEL.json
python3 scripts/check_shs_direct_connect_batch2.py
python3 scripts/check_shs_direct_connect_layer.py
python3 scripts/check_master_layer_registry.py
python3 scripts/check_truth_spine_freeze.py
python3 scripts/check_duplicate_layer_cleanup.py
python3 scripts/check_runtime_log_hygiene.py --strict
npm run build
```
