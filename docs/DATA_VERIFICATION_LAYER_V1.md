# Data Verification Layer V1

## Executive Summary

Data Verification Layer V1 formalizes the checkpoint between Evidence Package and Truth Spine. It evaluates whether an Evidence Package is ready for Truth Spine review by inspecting package completeness, source/provenance quality, evidence references, warnings, blockers, and recommended next action.

Data Verification does not become Truth Spine. It does not verify truth as final authority, create Truth Spine claims, create verified claims, approve public data, mark records public-approved, override Truth Spine, override Oracle, mutate SHF Impact Data Spine, publish reports, or create production persistence.

V1 complete: yes.

## Layer Role

Data Verification receives Evidence Package-style records and evaluates review readiness.

It owns:

- Evidence Package readiness evaluation.
- Evidence completeness inspection.
- Source metadata presence inspection.
- Provenance quality inspection.
- Evidence reference count inspection.
- Readiness score calculation.
- Warning and blocker surfacing.
- Recommended next review action.
- Preparation for Truth Spine review.

## Position In Chain

Source -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Reports / Watchtower / LOO -> Data Approval Gateway -> SHF Impact Data Spine.

## Canonical Verification Model

```json
{
  "verification_id": "",
  "package_id": "",
  "canonical_type": "",
  "readiness_score": 0,
  "verification_status": "blocked|needs_review|ready_for_truth_spine",
  "source_quality": "missing|weak|acceptable|strong",
  "evidence_quality": "missing|weak|acceptable|strong",
  "provenance_quality": "missing|weak|acceptable|strong",
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "ready_for_truth_spine": false,
  "truth_verified": false,
  "ready_for_public_approval": false
}
```

`truth_verified` is always false in V1.

`ready_for_public_approval` is always false in V1.

## Readiness Rules

- Missing `package_id` blocks readiness.
- Missing source metadata blocks readiness.
- Missing provenance blocks readiness.
- Missing normalized record blocks readiness.
- Missing evidence references returns `needs_review`.
- Complete package with source metadata, provenance, and evidence refs can return `ready_for_truth_spine: true`.

## Owner

Data Operations / Governance review preparation layer.

## Dependencies

Upstream:

- Evidence Package.
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

- Evaluate Evidence Package readiness.
- Inspect evidence completeness.
- Inspect source metadata and provenance quality.
- Calculate readiness score.
- Surface blockers and warnings.
- Recommend next review action.
- Prepare package for Truth Spine review.

Disallowed actions:

- Verify truth as final authority.
- Create Truth Spine claims.
- Create verified claims.
- Write into Truth Spine persistence.
- Approve public data.
- Mark records public-approved.
- Override Truth Spine.
- Override Oracle.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Replace Evidence Package.
- Replace Truth Spine.
- Create production persistence.

## Relationship To Evidence Package

Evidence Package builds the review package. Data Verification evaluates whether that package is ready to move to Truth Spine review. It does not replace Evidence Package.

## Relationship To Truth Spine

Truth Spine remains the authority for verification status, trust level, report readiness, public approval, packages, replay, federation, and audit feed. Data Verification only recommends readiness for Truth Spine review.

## Relationship To SHF Impact Data Spine

Data Verification does not import, mutate, or replace SHF Impact Data Spine. Any public impact use still flows through Data Approval Gateway and SHF Impact data rules.

## Reports/Watchtower Visibility

Reports may expose `data_verification` summary as review-readiness context only.

Watchtower may expose `data_verification` summary as observation-only coverage context.

## Endpoints

- `GET /data-verification/health`
- `GET /data-verification/schema`
- `GET /data-verification/summary`
- `POST /data-verification/evaluate`
- `POST /data-verification/batch-evaluate`
- `GET /data-verification/readiness`

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/data_verification_service.py services/shf-agent-fabric/routers/data_verification_routes.py scripts/check_data_verification_layer.py`
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
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_verification_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_evidence_package_routes.py services/shf-agent-fabric/tests/test_data_normalization_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_truth_routes.py`
- API smoke for Data Verification, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- Future Truth Spine submission workflow must preserve this layer's readiness-only boundary.

## V1 Complete

Yes.
