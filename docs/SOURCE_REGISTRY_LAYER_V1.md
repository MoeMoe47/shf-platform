# Source Registry Layer V1

## Executive Summary

Source Registry Layer V1 formalizes the upstream authority for source identity, source type, ownership/submission metadata, provenance expectations, source eligibility, and allowed downstream use before records enter Data Aggregator, Data Normalization, Evidence Package, Data Verification, Truth Spine, Oracle, Data Approval, Reports, Watchtower, LOO, or SHF Impact Data Spine.

Source Registry does not verify truth. It does not create Truth Spine claims, approve public data, mark records public-approved, override Truth Spine, override Oracle, mutate SHF Impact Data Spine, publish reports, or replace Data Aggregator, Evidence Package, Data Approval Gateway, Truth Spine, or SHF Impact Data Spine.

V1 complete: yes.

## Layer Role

Source Registry receives source metadata and evaluates source identity and downstream eligibility.

It owns:

- Deterministic V1 source metadata registration shape.
- Source type classification.
- Source ownership/submission metadata inspection.
- Provenance expectation inspection.
- Source warnings and blockers.
- Intake eligibility.
- Evidence Package eligibility.
- Truth Spine review eligibility.
- Public approval consideration eligibility as candidate-only status.

## Position In Chain

Source Registry -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO / Public Impact.

## Canonical Source Model

```json
{
  "source_id": "",
  "source_name": "",
  "source_type": "manual_entry|document|dataset|api|partner_feed|public_record|user_submission|unknown",
  "owner": "",
  "submitted_by": "",
  "source_url": "",
  "provenance": {},
  "trust_tier": "unknown|low|standard|high|official",
  "allowed_downstream_targets": [],
  "warnings": [],
  "blockers": [],
  "eligible_for_aggregator": false,
  "eligible_for_evidence_package": false,
  "eligible_for_truth_spine": false,
  "eligible_for_public_approval_consideration": false,
  "truth_verified": false,
  "public_approved": false
}
```

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

## Readiness Rules

- Missing `source_id` blocks readiness.
- Missing `source_name` blocks readiness.
- Missing `source_type` is treated as `unknown`.
- Missing provenance blocks Evidence Package and Truth Spine eligibility.
- Missing owner/submitted-by creates warnings, and blocks external source types that require accountable ownership.
- Unknown source type may be eligible for Data Aggregator intake quarantine only.
- Public record and partner feed sources with source URL, provenance, and owner/submitted-by may be eligible for Aggregator, Evidence Package, Truth Spine review, and public approval consideration as candidate-only status.

Even when eligible, V1 never sets `truth_verified` true and never sets `public_approved` true.

## Owner

Data Operations / Source governance preparation layer.

## Dependencies

Upstream:

- Batch/Import.
- Partner/Institution.
- Apps/Programs.
- Manual source intake.

Downstream:

- Data Aggregator.
- Data Normalization.
- Evidence Package.
- Data Verification.
- Truth Spine.
- Oracle.
- Data Approval.
- Reports.
- Watchtower.
- LOO.
- Data Approval Gateway.
- SHF Impact Data Spine.

## Boundaries

Allowed actions:

- Register deterministic V1 source metadata shape.
- Classify source type.
- Inspect source owner/submitted-by fields.
- Inspect provenance presence.
- Assign source trust tier.
- Define allowed downstream targets.
- Surface warnings and blockers.
- Recommend source eligibility for downstream review.

Disallowed actions:

- Verify truth.
- Create Truth Spine claims.
- Approve public data.
- Mark records public-approved.
- Override Truth Spine.
- Override Oracle.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Bypass Data Aggregator.
- Bypass Evidence Package.
- Bypass Data Approval Gateway.
- Act as final source of truth for claims.
- Create production persistence.

## Relationship To Data Aggregator

Source Registry establishes source identity and eligibility before Data Aggregator intake. It does not collect data streams or replace aggregation workflows.

## Relationship To Evidence Package

Source Registry determines whether a source has enough identity and provenance for evidence packaging. Evidence Package still owns evidence bundling.

## Relationship To Truth Spine

Truth Spine remains the authority for claim verification, trust levels, public approval status, and report readiness. Source Registry only says whether a source can be considered for Truth Spine review.

## Relationship To Data Approval Gateway

Source Registry can mark a source eligible for public approval consideration, but the Data Approval Layer, Data Approval Gateway, and human review remain required before any public approval.

## Relationship To SHF Impact Data Spine

Source Registry does not import, mutate, or replace SHF Impact Data Spine. Public impact use still flows through Data Approval Gateway and SHF Impact data rules.

## Reports/Watchtower Visibility

Reports may expose `source_registry` summary as source-eligibility context only.

Watchtower may expose `source_registry` summary as observation-only source coverage context.

## Endpoints

- `GET /source-registry/health`
- `GET /source-registry/schema`
- `GET /source-registry/summary`
- `GET /source-registry/sources`
- `POST /source-registry/evaluate`
- `POST /source-registry/batch-evaluate`
- `GET /source-registry/readiness`

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/source_registry_service.py services/shf-agent-fabric/routers/source_registry_routes.py scripts/check_source_registry_layer.py`
- `python3 scripts/check_source_registry_layer.py`
- `python3 scripts/check_data_approval_layer.py`
- `python3 scripts/check_data_verification_layer.py`
- `python3 scripts/check_evidence_package_layer.py`
- `python3 scripts/check_data_normalization_layer.py`
- `python3 scripts/check_data_aggregator_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_source_registry_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_approval_routes.py services/shf-agent-fabric/tests/test_data_verification_routes.py services/shf-agent-fabric/tests/test_evidence_package_routes.py services/shf-agent-fabric/tests/test_data_normalization_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py`
- API smoke for Source Registry, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- Future source intake workflows must preserve Source Registry as source metadata authority without letting it become Truth Spine.

## V1 Complete

Yes.
