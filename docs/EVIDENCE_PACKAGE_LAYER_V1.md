# Evidence Package Layer V1

## Executive Summary

Evidence Package Layer V1 formalizes the required packaging boundary between Data Normalization and Truth Spine. It bundles normalized records with source metadata, provenance, and evidence references, then calculates completeness and review readiness.

Evidence Package does not determine truth. It does not verify claims, public-approve records, create verified claims, override Truth Spine, override Oracle, mutate SHF Impact Data Spine, publish reports, bypass Data Approval Gateway, bypass Identity, or create a production database.

V1 complete: yes.

## Layer Role

Evidence Package receives normalized records and prepares review-ready packages for Truth Spine review.

It owns:

- Normalized record bundling.
- Source metadata attachment.
- Provenance metadata attachment.
- Evidence reference attachment.
- Completeness scoring.
- Missing evidence warnings.
- Missing provenance blockers.
- Missing source reference blockers.
- Truth Spine readiness flags.
- Review readiness flags.

## Position In Chain

Source -> Data Aggregator -> Data Normalization -> Evidence Package -> Truth Spine -> Oracle -> Reports / Watchtower / LOO -> Data Approval Gateway -> SHF Impact Data Spine.

## Canonical Package Model

```json
{
  "package_id": "",
  "canonical_type": "",
  "normalized_record": {},
  "source_metadata": {},
  "provenance": {},
  "evidence_refs": [],
  "warnings": [],
  "blockers": [],
  "completeness_score": 0,
  "ready_for_truth_spine": false,
  "ready_for_public_approval": false
}
```

`ready_for_public_approval` is always false in V1.

## Readiness Rules

- Missing source metadata blocks readiness.
- Missing provenance blocks readiness.
- Missing normalized record blocks readiness.
- Missing evidence references creates a warning.
- Complete packages can be `ready_for_truth_spine: true`.
- Truth verification is always false.
- Public approval readiness is always false.

## Owner

Data Operations / Governance preparation layer.

## Dependencies

Upstream:

- Data Normalization.
- Data Aggregator.
- Source Registry, when formalized.

Downstream:

- Truth Spine.
- Oracle.
- Reports.
- Watchtower.
- LOO.
- Data Approval Gateway.
- SHF Impact Data Spine.

## Boundaries

Allowed actions:

- Bundle normalized records.
- Attach provenance metadata.
- Attach source metadata.
- Attach evidence references.
- Calculate completeness score.
- Identify blockers and warnings.
- Prepare Truth Spine review submissions.

Disallowed actions:

- Verify truth.
- Approve public data.
- Create verified claims.
- Override Truth Spine.
- Override Oracle.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Bypass Data Approval Gateway.
- Bypass Identity.
- Create a duplicate Data Aggregator.
- Create a duplicate Data Normalization layer.
- Create a duplicate Source Registry.
- Create a production database.

## Relationship To Data Normalization

Data Normalization prepares canonical preview shapes. Evidence Package wraps those normalized records with source, provenance, and evidence context. It does not replace normalization.

## Relationship To Truth Spine

Evidence Package is the final preparation step before Truth Spine review. Truth Spine remains the authority for verification status, trust level, report readiness, public approval, packages, replay, federation, and audit feed.

## Relationship To SHF Impact Data Spine

Evidence Package does not import, mutate, or replace SHF Impact Data Spine. Any public impact use still flows through Data Approval Gateway and SHF Impact data rules.

## Reports/Watchtower Visibility

Reports may expose `evidence_package` summary as review-readiness context only.

Watchtower may expose `evidence_package` summary as observation-only coverage context.

## Endpoints

- `GET /evidence-package/health`
- `GET /evidence-package/schema`
- `GET /evidence-package/summary`
- `POST /evidence-package/build`
- `POST /evidence-package/batch-build`
- `GET /evidence-package/readiness`

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/evidence_package_service.py services/shf-agent-fabric/routers/evidence_package_routes.py scripts/check_evidence_package_layer.py`
- `python3 scripts/check_evidence_package_layer.py`
- `python3 scripts/check_data_aggregator_layer.py`
- `python3 scripts/check_data_normalization_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_evidence_package_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_normalization_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_truth_routes.py`
- `npm run build`

API smoke passed for `/evidence-package/health`, `/evidence-package/schema`, `/evidence-package/summary`, `/evidence-package/build`, `/evidence-package/readiness`, `/reports/snapshot`, and `/watchtower/summary`.

## Remaining Risks

- V1 has no production persistence by design.
- Future Source Registry and Data Approval Gateway integration must preserve this layer's preparation-only boundary.

## V1 Complete

Yes.
