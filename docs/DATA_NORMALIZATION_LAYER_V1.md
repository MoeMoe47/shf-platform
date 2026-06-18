# Data Normalization Layer V1

## Executive Summary

Data Normalization Layer V1 formalizes the existing normalization boundary between Data Aggregator and downstream evidence, verification, decision, reporting, approval, and public impact systems.

It receives aggregated intake-style records, standardizes field names and basic data types, classifies canonical entity type, preserves source/provenance metadata, and produces deterministic normalized previews with readiness signals. It does not verify claims, public-approve data, create final claims, mutate SHF Impact Data Spine, override Oracle, publish reports, or create a new production database.

V1 complete: yes.

## Layer Role

Data Normalization converts aggregated intake data into consistent canonical shapes before Evidence Package, Truth Spine, Oracle, Reports, Watchtower, LOO, SHF Impact Data Spine, or Data Approval Gateway consume it.

It owns:

- Field alias normalization.
- Basic data type normalization.
- Canonical entity type classification.
- Missing required field detection.
- Ambiguous entity match detection.
- Provenance preservation.
- Normalized preview generation.
- Readiness flags for Evidence Package and Truth Spine review.

## Upstream Dependencies

- Data Aggregator.
- Source Registry, when formalized.
- Batch/Import.
- Apps/Programs.

## Downstream Targets

- Evidence Package.
- Truth Spine.
- Oracle.
- Reports.
- Watchtower.
- LOO.
- SHF Impact Data Spine.
- Data Approval Gateway.

## Supported Canonical Entity Types

- `county`
- `program`
- `metric`
- `story`
- `organization`
- `source`
- `evidence`
- `unknown`

## Alias Mapping Rules

V1 maps common aliases into canonical field names:

- `countyName`, `county`, `county_name` -> `county_name`
- `programName`, `program`, `program_name` -> `program_name`
- `metricName`, `metric`, `metric_name` -> `metric_name`
- `sourceUrl`, `source_url`, `url` -> `source_url`
- `sourceName`, `source_name` -> `source_name`
- `value`, `metricValue`, `metric_value` -> `value`
- `status`, `approvalStatus` -> `status`
- `updatedAt`, `lastUpdated`, `last_updated` -> `last_updated`

Additional V1 aliases:

- `storyText`, `story`, `story_text`, `narrative` -> `story_text`
- `organizationName`, `organization`, `orgName`, `org_name`, `organization_name` -> `organization_name`
- `evidenceType`, `evidence_type` -> `evidence_type`
- `sourceId`, `source_id` -> `source_id`

## Provenance Rules

Normalized previews must preserve:

- `source_id`
- `source_name`
- `source_url`
- `provenance`

If `source_name` or `source_url` is missing:

- `ready_for_evidence_package` is false.
- `ready_for_truth_spine` is false.
- Warnings and blockers are returned.

Missing `provenance` creates a warning. The layer does not create a Source Registry or verify source authority.

## Readiness Rules

A normalized preview is ready for Evidence Package and Truth Spine review only when:

- A supported canonical type can be determined.
- No ambiguous entity match blocker exists.
- `source_name` is present.
- `source_url` is present.

`ready_for_public_approval` is always false in V1.

## Boundary Rules

Data Normalization must not:

- Verify truth.
- Public-approve data.
- Mark records verified.
- Mark records report-ready.
- Create public-approved records.
- Mutate SHF Impact Data Spine.
- Override Truth Spine.
- Override Oracle.
- Publish reports.
- Create final claims without evidence/source references.
- Bypass Data Aggregator or Source Registry.
- Create a production database.

## Relationship To Data Aggregator

Data Aggregator gathers and classifies intake. Data Normalization receives that intake shape and prepares a canonical preview. Data Normalization does not replace Data Aggregator and does not own intake collection.

## Relationship To Source Registry

Data Normalization preserves source metadata and flags missing source fields. It does not create a duplicate Source Registry or decide source authority.

## Relationship To Evidence Package

Data Normalization can indicate whether a normalized preview is ready for Evidence Package preparation. It does not create final Evidence Packages in V1.

## Relationship To Truth Spine

Truth Spine remains the authority for claims, sources, verification status, trust level, report readiness, public approval, packages, replay, federation, and audit feed.

Data Normalization only indicates readiness for Truth Spine review.

## Relationship To SHF Impact Data Spine

SHF Impact Data Spine remains the public impact data contract. Data Normalization does not import, mutate, or replace `src/data/shfImpactData.js`.

## Reports/Watchtower Visibility

Reports snapshots may include a `data_normalization` summary as readiness context.

Watchtower may include a `data_normalization` summary to observe blocked normalized previews or missing provenance. Watchtower observations are not truth decisions.

## Endpoints

- `GET /data-normalization/health`
- `GET /data-normalization/schema`
- `GET /data-normalization/summary`
- `POST /data-normalization/normalize`
- `POST /data-normalization/batch-normalize`

## Validation Results

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/data_normalization_service.py services/shf-agent-fabric/routers/data_normalization_routes.py scripts/check_data_normalization_layer.py`
- `python3 scripts/check_data_normalization_layer.py`
- `python3 scripts/check_data_aggregator_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_normalization_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py services/shf-agent-fabric/tests/test_ai_guardrails_routes.py services/shf-agent-fabric/tests/test_game_theory_routes.py services/shf-agent-fabric/tests/test_agent_canon_basics.py`
- `npm run build`

API smoke passed for `/data-normalization/health`, `/data-normalization/schema`, `/data-normalization/summary`, `/data-normalization/normalize`, `/data-normalization/batch-normalize`, `/reports/snapshot`, and `/watchtower/summary`.

## Remaining Risks

- V1 is deterministic preview-only and has no production persistence.
- Future Evidence Package and Source Registry layers must preserve these boundaries.
- Existing historical aggregation/admin surfaces remain separate and were not changed.

## V1 Complete

Yes.
