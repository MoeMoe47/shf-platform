# Warehouse Sync Layer V1

## Executive Summary

Warehouse Sync Layer V1 formalizes the safe review boundary for future warehouse and analytics sync eligibility. It reviews whether prepared records, batch outputs, reports, summaries, audit events, and approved operational/impact data are eligible to sync into a future warehouse or analytics store.

V1 does not actually sync data anywhere. It produces deterministic readiness, blocker, and warning metadata only.

Warehouse Sync V1 does not connect to a warehouse, write warehouse records, create production persistence, export files, call external services, mutate SHF Impact Data Spine, mark records public-approved, verify truth, approve public data, publish reports, replace Reports, replace Watchtower, replace Batch / Import, replace Adapter Layer, replace Data Approval Gateway, bypass Security / Privacy, bypass Data Ownership / IP, bypass Public Approval, override Truth Spine, or override Oracle.

V1 complete: yes.

## Layer Role

Warehouse Sync answers:

- Is this record eligible for warehouse sync?
- What source layer produced it?
- What target warehouse domain would it belong to?
- Is the record public, internal, private, or restricted?
- Is privacy/security review clear?
- Is ownership/IP review clear?
- Is approval state sufficient?
- Is public approval candidate context sufficient when needed?
- Is audit trace present?
- Is schema/mapping present?
- Should this be blocked, needs review, or warehouse-sync-ready?

It owns:

- Warehouse sync review payloads.
- Source layer classification.
- Target warehouse domain classification.
- Data sensitivity classification.
- Schema readiness inspection.
- Mapping readiness inspection.
- Audit trace reference checks.
- Security / Privacy status inspection.
- Data Ownership / IP status inspection.
- Approval/public-status inspection.
- Warehouse sync readiness.
- Blockers and warnings.
- Summary-only visibility to Reports.
- Observation-only visibility to Watchtower.

## Canonical Warehouse Sync Review Request

```json
{
  "sync_review_id": "",
  "record_id": "",
  "source_layer": "",
  "source_system": "",
  "target_domain": "ops|client_reporting|foundation_impact|audit_trace|watchtower|reports|loo|analytics|unknown",
  "data_classification": "public|internal|private|restricted|unknown",
  "schema_profile": "",
  "mapping_profile": "",
  "audit_ref": "",
  "security_privacy_status": "",
  "ownership_ip_status": "",
  "approval_status": "",
  "public_approval_status": "",
  "metadata": {}
}
```

## Canonical Warehouse Sync Result

```json
{
  "warehouse_sync_id": "",
  "sync_review_id": "",
  "record_id": "",
  "source_layer": "",
  "target_domain": "",
  "data_classification": "",
  "sync_status": "blocked|needs_review|sync_ready",
  "schema_ready": false,
  "mapping_ready": false,
  "audit_ready": false,
  "security_privacy_clear": false,
  "ownership_ip_clear": false,
  "approval_clear": false,
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "sync_ready": false,
  "warehouse_write_performed": false,
  "external_call_made": false,
  "export_created": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`warehouse_write_performed` is always false in V1.

`external_call_made` is always false in V1.

`export_created` is always false in V1.

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

## Deterministic V1 Rules

- Missing `sync_review_id` blocks.
- Missing `record_id` blocks.
- Missing `source_layer` blocks.
- Missing `target_domain` blocks.
- Unknown `target_domain` needs review.
- Missing `data_classification` needs review.
- Restricted data classification blocks.
- Private data needs review unless target domain is `ops`, `audit_trace`, or `analytics` and Security / Privacy plus Data Ownership / IP are clear.
- Missing `schema_profile` needs review.
- Missing `mapping_profile` needs review.
- Missing `audit_ref` needs review.
- Security / Privacy status `blocked` or `failed` blocks.
- Data Ownership / IP status `blocked` or `restricted` blocks.
- `foundation_impact` requires `public_approval_status` `public_ready_candidate` or `approved_gateway_candidate`.
- `reports` and `client_reporting` require approval status or ownership/reporting rights context.
- Complete safe candidates with schema, mapping, audit, Security / Privacy clearance, Data Ownership / IP clearance, and required approval context may be sync-ready.
- Even when sync-ready, V1 performs no warehouse writes, external calls, export creation, truth verification, public approval, public data mutation, or report publishing.

## Endpoints

- `GET /warehouse-sync/health`
- `GET /warehouse-sync/schema`
- `GET /warehouse-sync/summary`
- `POST /warehouse-sync/evaluate`
- `POST /warehouse-sync/batch-evaluate`
- `GET /warehouse-sync/readiness`

## Architecture Position

Warehouse Sync sits after governed records and summaries are prepared and before future analytics, warehouse, reporting, Watchtower, LOO, and funding intelligence use.

Primary upstream sources:

- SHF Impact Data Spine.
- Data Approval Gateway.
- Public Approval.
- Security / Privacy.
- Data Ownership / IP.
- Readiness Gate.
- Data Approval Layer.
- Audit & Verification.
- Reports.
- Watchtower.
- LOO.
- Batch / Import.
- Adapter Layer.
- Verified Aggregation.

Primary downstream consumers:

- Reports.
- Watchtower.
- LOO.
- Analytics.
- Funding Intelligence.

Warehouse Sync is not a real warehouse writer in V1, Reports publisher, Watchtower, Batch / Import, Adapter Layer, Data Approval Gateway, Truth Spine, Oracle, or SHF Impact Data Spine.

## Relationship To Reports And Watchtower

Reports receive Warehouse Sync summary context only under `warehouse_sync`. Reports must not treat sync readiness as truth verification, public approval, export creation, or report publication approval.

Watchtower receives Warehouse Sync observation context only under `warehouse_sync`. Watchtower can flag blocked or review-needed sync eligibility.

## Relationship To Batch / Import And Adapter Layer

Batch / Import controls bulk intake readiness. Adapter Layer prepares format/profile mapping. Warehouse Sync only reviews future warehouse/analytics sync eligibility after governed data has moved through the required downstream controls.

## Relationship To Data Approval Gateway And SHF Impact Data Spine

Warehouse Sync may inspect approval/public candidate context, but it does not replace Data Approval Gateway and does not mutate SHF Impact Data Spine.

## Relationship To Security / Privacy And Data Ownership / IP

Warehouse Sync requires Security / Privacy and Data Ownership / IP clearance for sync readiness. Private data remains private and only eligible for internal domains when clearance is present.

## Relationship To Truth Spine And Oracle

Truth Spine verifies what is true. Oracle decides what evidence supports. Warehouse Sync only classifies sync eligibility and cannot verify truth, override Truth Spine, override Oracle, approve public data, or publish reports.

## Owner

Data operations warehouse/analytics readiness boundary.

## Dependencies

Upstream:

- SHF Impact Data Spine.
- Data Approval Gateway.
- Public Approval.
- Security / Privacy.
- Data Ownership / IP.
- Readiness Gate.
- Data Approval Layer.
- Audit & Verification.
- Reports.
- Watchtower.
- LOO.
- Batch / Import.
- Adapter Layer.
- Verified Aggregation.

Downstream:

- Reports.
- Watchtower.
- LOO.
- Analytics.
- Funding Intelligence.

## Boundaries

Allowed actions:

- Accept sync review payloads.
- Classify source layer.
- Classify target warehouse domain.
- Classify data sensitivity.
- Inspect schema/mapping readiness.
- Inspect audit trace references.
- Inspect Security / Privacy status.
- Inspect Data Ownership / IP status.
- Inspect approval/public status.
- Produce warehouse sync readiness.
- Identify blockers and warnings.
- Expose summary visibility to Reports.
- Expose observation-only visibility to Watchtower.

Disallowed actions:

- Connect to a warehouse.
- Write warehouse records.
- Export files.
- Call external systems.
- Create production persistence.
- Verify truth.
- Approve public data.
- Mark records public-approved.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Replace Reports.
- Replace Watchtower.
- Replace Batch / Import.
- Replace Adapter Layer.
- Replace Data Approval Gateway.
- Bypass Security / Privacy.
- Bypass Data Ownership / IP.
- Bypass Public Approval.
- Override Truth Spine.
- Override Oracle.

## Validation Status

Required V1 validation:

- `python3 -m py_compile services/shf-agent-fabric/services/warehouse_sync_service.py services/shf-agent-fabric/routers/warehouse_sync_routes.py scripts/check_warehouse_sync_layer.py`
- `python3 scripts/check_warehouse_sync_layer.py`
- `python3 scripts/check_batch_import_layer.py`
- `python3 scripts/check_adapter_layer.py`
- `python3 scripts/check_api_gateway_layer.py`
- `python3 scripts/check_event_webhook_layer.py`
- `python3 scripts/check_policy_engine_layer.py`
- `python3 scripts/check_readiness_gate_layer.py`
- `python3 scripts/check_audit_verification_layer.py`
- `python3 scripts/check_security_privacy_layer.py`
- `python3 scripts/check_data_ownership_ip_layer.py`
- `python3 scripts/check_public_approval_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_warehouse_sync_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_batch_import_routes.py services/shf-agent-fabric/tests/test_adapter_layer_routes.py services/shf-agent-fabric/tests/test_api_gateway_routes.py services/shf-agent-fabric/tests/test_event_webhook_routes.py services/shf-agent-fabric/tests/test_policy_engine_routes.py services/shf-agent-fabric/tests/test_public_approval_routes.py`
- `npm run build`

## Remaining Risks

- V1 is deterministic and summary-only.
- V1 does not connect to a warehouse.
- V1 does not write warehouse records.
- V1 does not create exports.
- V1 does not persist sync review history.
- V1 does not verify truth, approve public data, mutate SHF Impact Data Spine, or publish reports.
