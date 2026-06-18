# Data Approval Layer V1

## Executive Summary

Data Approval Layer V1 formalizes the checkpoint after Truth Spine, Oracle, and Data Verification, and before records can move toward Data Approval Gateway review, SHF Impact Data Spine use, public reports, or public impact surfaces.

Data Approval does not verify truth. It does not override Truth Spine or Oracle, mutate SHF Impact Data Spine, publish public reports, create public-approved records, or replace the Data Approval Gateway.

V1 complete: yes.

## Layer Role

Data Approval receives approval candidate records and evaluates public-readiness posture.

It owns:

- Approval candidate evaluation.
- Truth Spine status inspection.
- Oracle supportability inspection.
- Data Verification readiness inspection.
- Evidence/provenance presence inspection.
- Approval state assignment.
- Approval readiness scoring.
- Blocker and warning surfacing.
- Preparation for Data Approval Gateway review.

## Position In Chain

Source -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO / Public Impact.

## Canonical Approval Model

```json
{
  "approval_id": "",
  "candidate_id": "",
  "canonical_type": "",
  "approval_state": "blocked|needs_review|gateway_ready|public_ready_candidate",
  "readiness_score": 0,
  "truth_spine_status": "",
  "oracle_supportability": "",
  "data_verification_status": "",
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "ready_for_data_approval_gateway": false,
  "ready_for_public_approval": false,
  "public_approved": false,
  "mutated_public_data": false
}
```

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`ready_for_public_approval` may only mean candidate recommendation. It is not final approval.

## Readiness Rules

- Missing `candidate_id` blocks readiness.
- Missing Truth Spine status blocks readiness.
- Truth Spine status that is not verified, trusted, or supported blocks readiness.
- Missing Oracle supportability needs review.
- Oracle unsupported blocks readiness.
- Missing Data Verification status needs review.
- Missing evidence or provenance needs review.
- Complete candidates can return `ready_for_data_approval_gateway: true`.

Even when gateway-ready, V1 never sets `public_approved` true and never mutates public data.

## Owner

Data Operations / Governance approval preparation layer.

## Dependencies

Upstream:

- Truth Spine.
- Oracle Layer.
- Data Verification Layer.
- Evidence Package.

Downstream:

- Data Approval Gateway.
- SHF Impact Data Spine.
- Reports.
- Watchtower.
- LOO.
- Public Impact Map.

## Boundaries

Allowed actions:

- Evaluate approval candidate readiness.
- Inspect Truth Spine status.
- Inspect Oracle supportability.
- Inspect Data Verification status.
- Inspect evidence/provenance presence.
- Assign readiness-only approval states.
- Surface blockers and warnings.
- Recommend next approval action.
- Prepare candidates for Data Approval Gateway review.

Disallowed actions:

- Verify truth.
- Create Truth Spine claims.
- Override Truth Spine.
- Override Oracle.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Create final public-approved records.
- Bypass human review.
- Bypass Data Approval Gateway.
- Bypass Identity.
- Replace Data Approval Gateway.
- Replace SHF Impact Data Spine.
- Create production persistence.

## Relationship To Truth Spine

Truth Spine remains the authority for verified claims, trust levels, public approval status, and report readiness. Data Approval only evaluates whether a candidate has enough trusted metadata to move toward gateway review.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. Data Approval reads Oracle supportability and cannot override Oracle rulings.

## Relationship To Data Approval Gateway

Data Approval prepares records for Data Approval Gateway review. The Gateway remains the human/public approval control surface.

## Relationship To SHF Impact Data Spine

Data Approval does not import, mutate, or replace SHF Impact Data Spine. Public impact use still flows through Data Approval Gateway and SHF Impact data rules.

## Reports/Watchtower Visibility

Reports may expose `data_approval` summary as approval-readiness context only.

Watchtower may expose `data_approval` summary as observation-only approval coverage context.

## Endpoints

- `GET /data-approval/health`
- `GET /data-approval/schema`
- `GET /data-approval/summary`
- `POST /data-approval/evaluate`
- `POST /data-approval/batch-evaluate`
- `GET /data-approval/readiness`

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/data_approval_service.py services/shf-agent-fabric/routers/data_approval_routes.py scripts/check_data_approval_layer.py`
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
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_approval_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_verification_routes.py services/shf-agent-fabric/tests/test_evidence_package_routes.py services/shf-agent-fabric/tests/test_data_normalization_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py`
- API smoke for Data Approval, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- Future Data Approval Gateway workflow must preserve this layer's recommendation-only boundary.

## V1 Complete

Yes.
