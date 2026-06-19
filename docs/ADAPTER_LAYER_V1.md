# Adapter Layer V1

## Executive Summary

Adapter Layer V1 formalizes the safe preparation boundary for external and internal source formats before they enter SHF/SHS governance intake. It accepts adapter review payloads, classifies source system, input format, payload domain, adapter profile, mapping readiness, provenance/source metadata completeness, target intake layer, blockers, warnings, and adapter readiness.

V1 is intentionally deterministic and non-invasive. It prepares payloads for Source Registry, Data Federation, Data Aggregator, Event/Webhook, Batch/Import, API Gateway, Reports, Watchtower, and governance pipelines without creating production connectors or changing existing runtime authority.

Adapter Layer V1 does not call external systems, create production persistence, perform final normalization, verify truth, approve public data, mark records public-approved, mutate SHF Impact Data Spine, publish reports, replace Source Registry, replace Data Aggregator, replace Data Normalization, replace API Gateway, replace Event/Webhook, bypass Security / Privacy, bypass Data Ownership / IP, override Truth Spine, or override Oracle.

V1 complete: yes.

## Layer Role

Adapter Layer answers:

- What external or internal system produced this payload?
- What input format is this payload using?
- Which adapter profile applies?
- Is the payload ready for Source Registry, Data Federation, Data Aggregator, Event/Webhook, or Batch/Import?
- Is mapping needed before intake?
- Is source metadata present?
- Is provenance present?
- Is this SHS private operational data?
- Is this SHF public-impact candidate data?
- Should this payload be blocked, needs review, or adapter-ready?

It owns:

- Adapter review payloads.
- Source system classification.
- Input format classification.
- Payload domain classification.
- Adapter profile identification.
- Required mapping field visibility.
- Missing source/provenance metadata detection.
- SHS private operational warnings.
- SHF public-impact candidate warnings.
- Target intake layer recommendation.
- Deterministic V1 blockers and warnings.
- Summary-only visibility to Reports.
- Observation-only visibility to Watchtower.

## Canonical Adapter Review Request

```json
{
  "adapter_review_id": "",
  "source_system": "",
  "source_system_type": "shs_spine|shf_next|clientops|production_ops|website_studio|webmaker|builderhub|partner_feed|api|webhook|csv|json|manual|unknown",
  "input_format": "json|csv|form|api_payload|webhook_event|document|unknown",
  "payload_domain": "operational|impact|reporting|event|client_private|public_candidate|unknown",
  "payload_ref": "",
  "source_metadata": {},
  "provenance": {},
  "mapping_profile": "",
  "metadata": {}
}
```

## Canonical Adapter Result

```json
{
  "adapter_result_id": "",
  "adapter_profile": "",
  "source_system": "",
  "source_system_type": "",
  "input_format": "",
  "payload_domain": "",
  "adapter_status": "blocked|needs_review|adapter_ready",
  "target_layer": "",
  "required_fields": [],
  "missing_fields": [],
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "adapter_ready": false,
  "external_call_made": false,
  "normalized_final": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`external_call_made` is always false in V1.

`normalized_final` is always false in V1.

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

## Deterministic V1 Rules

- Missing `adapter_review_id` blocks.
- Missing `source_system` blocks.
- Missing `source_system_type` blocks.
- Missing `input_format` blocks.
- Unknown `source_system_type` needs review.
- Unknown `input_format` needs review.
- Missing `payload_domain` needs review.
- Missing `source_metadata` needs review.
- Missing `provenance` needs review.
- Missing `mapping_profile` needs review.
- `payload_domain` `client_private` routes toward Security / Privacy first.
- SHS operational source systems are private by default.
- SHS operational source systems with impact or public-candidate payloads require SHS-to-SHF eligibility review.
- Partner feed, API, and webhook source systems require Source Registry evaluation.
- Impact and public-candidate payloads do not receive public approval from Adapter Layer.
- JSON, CSV, form, and API payloads may be adapter-ready when source metadata, provenance, and mapping profile are present and no blockers exist.
- Even when adapter-ready, Adapter Layer performs no external calls, final normalization, truth verification, public approval, public data mutation, or report publishing.

## Supported Adapter Profiles

- `shs_clientops_record`
- `shs_production_ops_record`
- `shs_website_studio_record`
- `shs_webmaker_record`
- `shf_next_foundation_record`
- `partner_feed_record`
- `api_payload_record`
- `webhook_event_record`
- `csv_import_record`
- `json_import_record`
- `manual_entry_record`
- `unknown_review_required`

## Endpoints

- `GET /adapter-layer/health`
- `GET /adapter-layer/schema`
- `GET /adapter-layer/summary`
- `POST /adapter-layer/evaluate`
- `POST /adapter-layer/batch-evaluate`
- `GET /adapter-layer/readiness`

## Architecture Position

Adapter Layer sits between SHS Spine, SHF-Next, ClientOps, Production Ops, Website Studio, WebMaker, BuilderHub, partner feeds, API payloads, webhook events, CSV imports, JSON imports, and manual records on one side, and governed intake layers on the other side.

Primary downstream targets:

- Source Registry.
- Data Federation.
- Data Aggregator.
- Event/Webhook.
- Batch/Import.
- API Gateway summary context.
- Reports summary context.
- Watchtower observation context.

Adapter Layer is not Source Registry, Data Aggregator, Data Normalization, API Gateway, Event/Webhook, Truth Spine, Oracle, SHF Impact Data Spine, or a Reports publisher.

## Relationship To SHS Spine

SHS Spine is upstream operational/private source context. Adapter Layer prepares SHS Spine outputs for governed intake by classifying source system, input format, payload domain, mapping readiness, provenance completeness, SHS private-data warnings, and target intake layer.

SHS operational/private data remains private unless downstream governance allows transfer.

## Relationship To SHF Spine And SHF Impact Data Spine

Adapter Layer may identify public-impact candidate payloads, but it does not mutate SHF Impact Data Spine and does not mark public data approved. Candidate impact records still require Source Registry, Data Federation, Data Aggregator, Data Normalization, Evidence Package, Data Verification, Truth Spine, Oracle, Data Approval, Readiness Gate, Security / Privacy, Data Ownership / IP, Public Approval, and Data Approval Gateway controls as applicable.

## Relationship To Source Registry

Adapter Layer can recommend Source Registry evaluation when a payload comes from partner feeds, API payloads, webhook events, SHS operational records, or public-impact candidates. It does not replace source identity, source ownership, canonical source registration, or evidence verification.

## Relationship To Data Aggregator And Data Normalization

Adapter Layer may identify mapping readiness and target intake. It does not aggregate records and does not perform final normalization. Data Aggregator and Data Normalization remain responsible for their own layer-specific transformations and readiness semantics.

## Relationship To API Gateway And Event/Webhook

API Gateway reviews API exposure and request gateway readiness. Event/Webhook prepares event routing. Adapter Layer may classify API payloads and webhook events for source-format readiness, but it does not forward API requests, create external connectors, or replace event routing.

## Relationship To Security / Privacy And Data Ownership / IP

Client-private and SHS operational records are marked with private-data warnings and routed toward safety review where appropriate. Adapter Layer does not bypass Security / Privacy or Data Ownership / IP.

## Relationship To Truth Spine And Oracle

Truth Spine verifies what is true. Oracle decides what evidence supports. Adapter Layer only prepares source-format and mapping-readiness context. It cannot verify truth, override Truth Spine, override Oracle, approve public data, or produce report-ready authority.

## Reports And Watchtower Visibility

Reports receive Adapter Layer summary context only under `adapter_layer`. Reports must not treat Adapter Layer readiness as truth verification, public approval, or report publication approval.

Watchtower receives Adapter Layer observation context only under `adapter_layer`. Watchtower can flag blocked or review-needed adapter coverage, but Adapter Layer does not create Watchtower enforcement authority.

## Owner

Platform governance intake preparation boundary.

## Dependencies

Upstream:

- SHS Spine.
- Apps/Programs.
- Partner / Institution.
- ClientOps.
- Production Ops.
- Website Studio.
- WebMaker.
- BuilderHub.
- SHF-Next.
- API Gateway.
- Event/Webhook.
- Batch/Import.

Downstream:

- Source Registry Layer.
- Data Federation Layer.
- Data Aggregator Layer.
- Event/Webhook.
- Batch/Import.
- API Gateway.
- Reports.
- Watchtower.
- Policy Engine.
- Security / Privacy.
- Data Ownership / IP.

## Boundaries

Allowed actions:

- Accept adapter review payloads.
- Classify source system.
- Classify input format.
- Classify payload domain.
- Identify adapter profile.
- Identify required mapping fields.
- Identify missing source/provenance metadata.
- Identify SHS private operational context.
- Identify SHF public-impact candidate context.
- Recommend target intake layer.
- Identify blockers and warnings.
- Produce adapter readiness result.
- Expose summary visibility to Reports.
- Expose observation-only visibility to Watchtower.

Disallowed actions:

- Call external systems.
- Create production connectors.
- Create production database persistence.
- Perform final normalization.
- Verify truth.
- Approve public data.
- Mark records public-approved.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Replace Source Registry.
- Replace Data Aggregator.
- Replace Data Normalization.
- Replace API Gateway.
- Replace Event/Webhook.
- Bypass Security / Privacy.
- Bypass Data Ownership / IP.
- Override Truth Spine.
- Override Oracle.

## Validation Status

Required V1 validation:

- `python3 -m py_compile services/shf-agent-fabric/services/adapter_layer_service.py services/shf-agent-fabric/routers/adapter_layer_routes.py scripts/check_adapter_layer.py`
- `python3 scripts/check_adapter_layer.py`
- `python3 scripts/check_api_gateway_layer.py`
- `python3 scripts/check_event_webhook_layer.py`
- `python3 scripts/check_policy_engine_layer.py`
- `python3 scripts/check_source_registry_layer.py`
- `python3 scripts/check_data_federation_layer.py`
- `python3 scripts/check_data_aggregator_layer.py`
- `python3 scripts/check_data_normalization_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_adapter_layer_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_api_gateway_routes.py services/shf-agent-fabric/tests/test_event_webhook_routes.py services/shf-agent-fabric/tests/test_policy_engine_routes.py services/shf-agent-fabric/tests/test_source_registry_routes.py services/shf-agent-fabric/tests/test_data_federation_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_data_normalization_routes.py`
- `npm run build`

## Remaining Risks

- V1 is deterministic and summary-only.
- V1 does not call external APIs or validate live third-party connector behavior.
- V1 does not persist adapter review history.
- V1 does not perform final normalization.
- V1 does not verify truth, approve public data, or publish reports.
