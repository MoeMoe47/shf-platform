# Public Approval Layer V1

## Executive Summary

Public Approval Layer V1 formalizes the public release readiness checkpoint after Data Approval and Data Approval Gateway review, before anything can be considered public-facing, report-published, or eligible for SHF Impact Data Spine public visibility.

Public Approval does not verify truth. It does not create Truth Spine claims, override Truth Spine or Oracle, mutate SHF Impact Data Spine, write final public-approved records, bypass Data Approval Gateway, bypass Readiness Gate, bypass human review, or publish reports.

V1 complete: yes.

## Layer Role

Public Approval receives public approval candidate payloads and evaluates whether they have enough reviewed, supported, and privacy-safe context to become a public release candidate.

It owns:

- Public approval candidate evaluation.
- Data Approval state inspection.
- Data Approval Gateway status inspection.
- Truth Spine status inspection.
- Oracle supportability inspection.
- Readiness Gate status inspection.
- Evidence/provenance completeness checks.
- Privacy review status checks.
- Security review status checks.
- Public release readiness scoring.
- Blocker and warning surfacing.
- Public-ready candidate recommendation.
- Summary-only exposure to Reports and Watchtower.

## Position In Chain

Source Registry -> Data Federation -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Data Approval Gateway -> Public Approval -> SHF Impact Data Spine -> Reports / Watchtower / LOO / Public Impact.

Audit & Verification observes the chain.

Readiness Gate controls forward movement between layers.

Public Approval controls public-facing release readiness.

## Canonical Public Approval Model

```json
{
  "public_approval_id": "",
  "candidate_id": "",
  "canonical_type": "",
  "public_release_state": "blocked|needs_review|public_ready_candidate",
  "readiness_score": 0,
  "truth_spine_status": "",
  "oracle_supportability": "",
  "data_approval_state": "",
  "gateway_status": "",
  "readiness_gate_status": "",
  "privacy_review_status": "",
  "security_review_status": "",
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "ready_for_public_release_candidate": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

`ready_for_public_release_candidate` is a recommendation only, never a persistent final approval.

## Readiness Rules

- Missing `candidate_id` blocks readiness.
- Missing Truth Spine status blocks readiness.
- Truth Spine status that is not trusted, verified, supported, public-approved, or report-ready blocks or needs review.
- Missing Oracle supportability needs review.
- Oracle unsupported blocks readiness.
- Missing Data Approval state blocks readiness.
- Data Approval state that is not `gateway_ready` or `public_ready_candidate` blocks or needs review.
- Missing Gateway status blocks readiness.
- Gateway status that is not `approved`, `review_complete`, `human_approved`, or `gateway_approved` blocks or needs review.
- Missing Readiness Gate status needs review.
- Readiness Gate status that is not ready needs review or blocks readiness.
- Missing evidence needs review.
- Missing provenance blocks readiness.
- Failed privacy review blocks readiness.
- Failed security review blocks readiness.
- Complete candidates can become `public_ready_candidate`.

Even when public-ready candidate, V1 never sets `public_approved` true, never mutates public data, and never publishes reports.

## Owner

Governance public release readiness layer.

## Dependencies

Upstream:

- Data Approval Layer.
- Data Approval Gateway.
- Truth Spine.
- Oracle Layer.
- Readiness Gate.
- Audit & Verification.
- Security/Privacy.
- Governance Layer.

Downstream:

- SHF Impact Data Spine.
- Reports.
- Watchtower.
- LOO.
- Public Impact Map.
- Narrative/Story.
- Governance Binder.

## Boundaries

Allowed actions:

- Accept public approval candidate payloads.
- Inspect Data Approval state.
- Inspect Data Approval Gateway status.
- Inspect Truth Spine status.
- Inspect Oracle supportability.
- Inspect Readiness Gate status.
- Inspect evidence/provenance completeness.
- Inspect privacy/security flags.
- Produce public release readiness.
- Produce blockers and warnings.
- Expose summary visibility to Reports.
- Expose summary visibility to Watchtower.

Disallowed actions:

- Verify truth.
- Create Truth Spine claims.
- Override Truth Spine.
- Override Oracle.
- Mutate SHF Impact Data Spine.
- Write final public-approved records.
- Bypass Data Approval Gateway.
- Bypass Readiness Gate.
- Bypass human review.
- Publish reports.
- Replace Data Approval Layer.
- Replace Data Approval Gateway.
- Create production persistence.

## Relationship To Truth Spine

Truth Spine remains the authority for verified claims, trust levels, public approval status, and report readiness. Public Approval may inspect Truth Spine status, but it cannot verify truth or write Truth Spine records.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. Public Approval may inspect Oracle supportability, but it cannot change Oracle rulings.

## Relationship To Data Approval Gateway

Data Approval Gateway remains the human/public approval control surface. Public Approval requires Gateway review state and cannot bypass Gateway or human review.

## Relationship To Readiness Gate

Readiness Gate controls forward movement between layers. Public Approval may require Readiness Gate readiness, but it does not replace cross-layer transition gating.

## Relationship To SHF Impact Data Spine

Public Approval does not import, mutate, or replace SHF Impact Data Spine. Public impact visibility remains governed by SHF Impact data rules and the existing public-approved data contract.

## Relationship To Reports

Reports may expose `public_approval` summary as public-readiness context only. Reports must still respect Truth Spine metadata, public approval state, and report readiness before communicating public facts.

## Relationship To Watchtower

Watchtower may expose `public_approval` summary as observation-only public-readiness context. Watchtower remains the monitoring and risk-observation layer.

## Endpoints

- `GET /public-approval/health`
- `GET /public-approval/schema`
- `GET /public-approval/summary`
- `POST /public-approval/evaluate`
- `POST /public-approval/batch-evaluate`
- `GET /public-approval/readiness`

## Reports/Watchtower Visibility

Reports expose Public Approval as summary-only public-readiness context.

Watchtower exposes Public Approval as observation-only public-readiness context.

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/public_approval_service.py services/shf-agent-fabric/routers/public_approval_routes.py scripts/check_public_approval_layer.py`
- `python3 scripts/check_public_approval_layer.py`
- `python3 scripts/check_readiness_gate_layer.py`
- `python3 scripts/check_audit_verification_layer.py`
- `python3 scripts/check_source_registry_layer.py`
- `python3 scripts/check_data_federation_layer.py`
- `python3 scripts/check_data_aggregator_layer.py`
- `python3 scripts/check_data_normalization_layer.py`
- `python3 scripts/check_evidence_package_layer.py`
- `python3 scripts/check_data_verification_layer.py`
- `python3 scripts/check_data_approval_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_public_approval_routes.py`
- Adjacent focused pytest set for Readiness Gate, Audit & Verification, Data Approval, Data Verification, Evidence Package, Truth Spine, and Oracle routes.
- API smoke for Public Approval, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- Final public approval, public data writes, and report publication remain outside this V1 scaffold.
- Future SHF Impact Data Spine publication workflows must preserve this layer's recommendation-only boundary.

## V1 Complete

Yes.
