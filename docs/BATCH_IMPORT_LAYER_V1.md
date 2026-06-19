# Batch / Import Layer V1

## Executive Summary

Batch / Import Layer V1 formalizes the safe bulk-intake review boundary for CSV/JSON uploads, multi-record payloads, import batches, file-style records, SHS Spine exports, SHF-Next exports, ClientOps exports, Website Studio exports, WebMaker exports, partner datasets, and future bulk intake jobs.

V1 answers whether an import batch has enough source, provenance, mapping, record-count, and row-level context to move toward Adapter Layer or another governed intake layer. It is deterministic, summary-only, and intentionally non-invasive.

Batch / Import Layer V1 does not parse large real files, ingest production files, create production persistence, write imported records into SHF Impact Data Spine, mark records public-approved, verify truth, approve public data, publish reports, call external services, replace Adapter Layer, replace Source Registry, replace Data Aggregator, replace Data Normalization, bypass Security / Privacy, bypass Data Ownership / IP, override Truth Spine, or override Oracle.

V1 complete: yes.

## Layer Role

Batch / Import Layer answers:

- What batch/import is being submitted?
- What source system produced it?
- What file/input type is it?
- How many records are present?
- Are required batch fields present?
- Is mapping/profile metadata present?
- Is source metadata present?
- Is provenance present?
- Are row-level warnings or blockers detected?
- Should bad rows be quarantined?
- Can valid rows move to Adapter Layer?
- Is the batch blocked, needs review, or import-ready?

It owns:

- Batch/import review payloads.
- Batch source system classification.
- Import type classification.
- Input format classification.
- Record counts from provided metadata or small inline lists.
- Required mapping/profile metadata checks.
- Missing source/provenance metadata detection.
- Row-level warnings and blockers.
- Quarantine needs.
- Import readiness.
- Target intake layer recommendation.
- Summary-only visibility to Reports.
- Observation-only visibility to Watchtower.

## Canonical Batch / Import Review Request

```json
{
  "batch_id": "",
  "batch_name": "",
  "source_system": "",
  "source_system_type": "shs_spine|shf_next|clientops|production_ops|website_studio|webmaker|partner_feed|api_export|manual_upload|unknown",
  "import_type": "csv|json|api_export|manual_entry|partner_dataset|unknown",
  "input_format": "csv|json|inline_records|file_reference|unknown",
  "record_count": 0,
  "records": [],
  "mapping_profile": "",
  "source_metadata": {},
  "provenance": {},
  "metadata": {}
}
```

## Canonical Batch / Import Result

```json
{
  "batch_review_id": "",
  "batch_id": "",
  "batch_name": "",
  "source_system": "",
  "import_type": "",
  "input_format": "",
  "batch_status": "blocked|needs_review|import_ready",
  "record_count": 0,
  "accepted_record_count": 0,
  "quarantined_record_count": 0,
  "row_warning_count": 0,
  "row_blocker_count": 0,
  "target_layer": "",
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "import_ready": false,
  "records_written": false,
  "external_call_made": false,
  "normalized_final": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`records_written` is always false in V1.

`external_call_made` is always false in V1.

`normalized_final` is always false in V1.

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

## Deterministic V1 Rules

- Missing `batch_id` blocks.
- Missing `source_system` blocks.
- Missing `source_system_type` blocks.
- Missing `import_type` blocks.
- Unknown `import_type` needs review.
- Missing `input_format` blocks.
- Unknown `input_format` needs review.
- Missing `mapping_profile` needs review.
- Missing `source_metadata` needs review.
- Missing `provenance` needs review.
- `record_count <= 0` with no inline records blocks.
- Inline records are counted directly.
- Inline rows missing `source_id`, `source_name`, or `canonical_type` are quarantined.
- Inline rows with obvious PII or secret fields create Security / Privacy review warnings.
- SHS operational source systems are private by default and target Adapter Layer.
- Partner feeds, API exports, and manual uploads target Adapter Layer for mapping/profile preparation.
- Complete batches with required fields, mapping profile, source metadata, provenance, and records or record count may be import-ready.
- Even when import-ready, V1 writes no records and performs no external calls, final normalization, truth verification, public approval, public data mutation, or report publishing.

## Endpoints

- `GET /batch-import/health`
- `GET /batch-import/schema`
- `GET /batch-import/summary`
- `POST /batch-import/evaluate`
- `POST /batch-import/batch-evaluate`
- `GET /batch-import/readiness`

## Architecture Position

Batch / Import Layer sits before Adapter Layer for bulk/file/multi-record intake.

Primary upstream sources:

- SHS Spine exports.
- SHF-Next exports.
- ClientOps exports.
- Production Ops exports.
- Website Studio exports.
- WebMaker exports.
- Partner datasets.
- CSV/JSON uploads.
- API exports.
- Manual imports.

Primary downstream targets:

- Adapter Layer.
- Source Registry Layer.
- Data Federation Layer.
- Data Aggregator Layer.
- Data Normalization Layer.
- Reports summary context.
- Watchtower observation context.

Batch / Import is not Adapter Layer, Source Registry, Data Aggregator, Data Normalization, Truth Spine, Oracle, SHF Impact Data Spine, or a Reports publisher.

## Relationship To Adapter Layer

Batch / Import controls bulk intake readiness before Adapter Layer receives payloads for source-format and mapping-profile preparation. It may recommend Adapter Layer as the target intake layer but does not replace Adapter Layer.

## Relationship To Source Registry

Batch / Import may identify whether a partner dataset or file-style import appears ready for governed intake. Source Registry still owns source identity, source ownership, provenance expectations, and source eligibility decisions.

## Relationship To Data Aggregator And Data Normalization

Batch / Import may count records, quarantine row-level issues, and classify readiness. It does not aggregate records and does not perform final normalization.

## Relationship To Security / Privacy And Data Ownership / IP

Rows with obvious PII or secret-looking fields are flagged for Security / Privacy review. Batch / Import does not bypass Security / Privacy or Data Ownership / IP.

## Relationship To Truth Spine And Oracle

Truth Spine verifies what is true. Oracle decides what evidence supports. Batch / Import only reviews bulk intake readiness. It cannot verify truth, override Truth Spine, override Oracle, approve public data, or create report-ready authority.

## Reports And Watchtower Visibility

Reports receive Batch / Import summary context only under `batch_import`. Reports must not treat import readiness as truth verification, public approval, or report publication approval.

Watchtower receives Batch / Import observation context only under `batch_import`. Watchtower can flag blocked batches, review-needed batches, and quarantine needs.

## Owner

Data operations bulk-intake readiness boundary.

## Dependencies

Upstream:

- SHS Spine.
- Partner / Institution.
- Apps/Programs.
- ClientOps.
- Production Ops.
- Website Studio.
- WebMaker.
- SHF-Next.
- API Gateway.
- Event/Webhook.
- Manual uploads.
- CSV/JSON uploads.

Downstream:

- Adapter Layer.
- Source Registry Layer.
- Data Federation Layer.
- Data Aggregator Layer.
- Data Normalization Layer.
- Reports.
- Watchtower.
- Security / Privacy.
- Data Ownership / IP.

## Boundaries

Allowed actions:

- Accept batch/import review payloads.
- Classify batch source system.
- Classify import type.
- Classify input format.
- Count records from provided metadata or small inline lists.
- Identify required mapping/profile metadata.
- Identify missing source/provenance metadata.
- Identify row-level warnings and blockers.
- Classify quarantine needs.
- Classify import readiness.
- Recommend target intake layer.
- Expose summary visibility to Reports.
- Expose observation-only visibility to Watchtower.

Disallowed actions:

- Parse large real files in V1.
- Ingest production files.
- Create production database persistence.
- Write production records.
- Perform final normalization.
- Verify truth.
- Approve public data.
- Mark records public-approved.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Call external services.
- Replace Adapter Layer.
- Replace Source Registry.
- Replace Data Aggregator.
- Replace Data Normalization.
- Bypass Security / Privacy.
- Bypass Data Ownership / IP.
- Override Truth Spine.
- Override Oracle.

## Validation Status

Required V1 validation:

- `python3 -m py_compile services/shf-agent-fabric/services/batch_import_service.py services/shf-agent-fabric/routers/batch_import_routes.py scripts/check_batch_import_layer.py`
- `python3 scripts/check_batch_import_layer.py`
- `python3 scripts/check_adapter_layer.py`
- `python3 scripts/check_api_gateway_layer.py`
- `python3 scripts/check_event_webhook_layer.py`
- `python3 scripts/check_policy_engine_layer.py`
- `python3 scripts/check_source_registry_layer.py`
- `python3 scripts/check_data_aggregator_layer.py`
- `python3 scripts/check_data_normalization_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_batch_import_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_adapter_layer_routes.py services/shf-agent-fabric/tests/test_api_gateway_routes.py services/shf-agent-fabric/tests/test_event_webhook_routes.py services/shf-agent-fabric/tests/test_policy_engine_routes.py services/shf-agent-fabric/tests/test_source_registry_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_data_normalization_routes.py`
- `npm run build`

## Remaining Risks

- V1 is deterministic and summary-only.
- V1 does not parse large real files.
- V1 does not ingest production files.
- V1 does not persist batch review history.
- V1 does not write records.
- V1 does not perform final normalization.
- V1 does not verify truth, approve public data, or publish reports.
