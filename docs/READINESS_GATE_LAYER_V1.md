# Readiness Gate Layer V1

## Executive Summary

Readiness Gate Layer V1 formalizes the cross-layer checkpoint that decides whether an output can move forward, must be blocked, or needs review before entering the next layer.

Readiness Gate does not verify truth. It does not create Truth Spine claims, approve public data, mark records public-approved, override Truth Spine or Oracle, mutate SHF Impact Data Spine, publish reports, replace Data Approval Gateway, replace Audit & Verification, or replace Watchtower.

V1 complete: yes.

## Layer Role

Readiness Gate receives transition request payloads and evaluates whether the producer layer has supplied the minimum required references and readiness checks for the consumer layer.

It owns:

- Cross-layer transition request evaluation.
- Producing layer identification.
- Target layer identification.
- Required readiness field checks.
- Supported transition classification.
- Blocker and warning surfacing.
- Blocker owner layer assignment.
- Next-action recommendation.
- Forward-movement eligibility.
- Summary-only exposure to Reports and Watchtower.

## Position In Chain

Source Registry -> Data Federation -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO.

Audit & Verification observes the chain.

Readiness Gate controls forward movement between layers.

## Canonical Gate Request

```json
{
  "gate_id": "",
  "from_layer": "",
  "to_layer": "",
  "subject_id": "",
  "subject_type": "",
  "readiness_inputs": {},
  "audit_ref": "",
  "evidence_ref": "",
  "truth_ref": "",
  "oracle_ref": "",
  "approval_ref": ""
}
```

## Canonical Gate Result

```json
{
  "gate_id": "",
  "from_layer": "",
  "to_layer": "",
  "subject_id": "",
  "gate_status": "blocked|needs_review|ready",
  "readiness_score": 0,
  "required_checks": [],
  "passed_checks": [],
  "failed_checks": [],
  "warnings": [],
  "blockers": [],
  "blocker_owner_layer": "",
  "recommended_action": "",
  "can_move_forward": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false
}
```

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

## Supported Transitions

- `source_registry -> data_federation`
- `data_federation -> data_aggregator`
- `data_aggregator -> data_normalization`
- `data_normalization -> evidence_package`
- `evidence_package -> data_verification`
- `data_verification -> truth_spine`
- `truth_spine -> oracle`
- `oracle -> data_approval`
- `data_approval -> data_approval_gateway`
- `data_approval_gateway -> shf_impact_data_spine`
- `reports -> watchtower`
- `watchtower -> reports`

## Readiness Rules

- Missing `gate_id` blocks readiness.
- Missing `from_layer` blocks readiness.
- Missing `to_layer` blocks readiness.
- Missing `subject_id` blocks readiness.
- Unknown `from_layer` or `to_layer` needs review.
- Unsupported transitions need review.
- Missing `audit_ref` for post-evidence-package transitions needs review.
- Missing `evidence_ref` for evidence, data verification, and Truth Spine transitions blocks or needs review depending on transition.
- Missing `truth_ref` for `truth_spine -> oracle` and `oracle -> data_approval` blocks readiness.
- Missing `oracle_ref` for `oracle -> data_approval` blocks readiness.
- Missing `approval_ref` for `data_approval -> data_approval_gateway` needs review.
- Complete supported transitions with required refs/checks are `ready` and `can_move_forward: true`.

## Owner

Governance transition-control layer.

## Dependencies

Upstream:

- Source Registry.
- Data Federation.
- Data Aggregator.
- Data Normalization.
- Evidence Package.
- Data Verification.
- Truth Spine.
- Oracle Layer.
- Data Approval Layer.
- Data Approval Gateway.
- Audit & Verification.
- Reports.
- Watchtower.

Downstream:

- Data Federation.
- Data Aggregator.
- Data Normalization.
- Evidence Package.
- Data Verification.
- Truth Spine.
- Oracle Layer.
- Data Approval Layer.
- Data Approval Gateway.
- SHF Impact Data Spine.
- Reports.
- Watchtower.
- LOO.
- Verified Aggregation.

## Boundaries

Allowed actions:

- Accept layer output and transition request payloads.
- Identify producing layer.
- Identify target layer.
- Evaluate required readiness fields.
- Classify transition status.
- Surface blockers and warnings.
- Recommend next action.
- Assign blocker owner layer.
- Expose gate summary to Reports.
- Expose gate summary to Watchtower.
- Preserve deterministic V1 examples.

Disallowed actions:

- Verify truth.
- Create Truth Spine claims.
- Approve public data.
- Mark records public-approved.
- Mutate SHF Impact Data Spine.
- Override Truth Spine.
- Override Oracle.
- Replace Data Approval Gateway.
- Replace Audit & Verification.
- Replace Watchtower.
- Publish reports.
- Create production persistence.

## Relationship To Truth Spine

Truth Spine remains the authority for verified claims, trust levels, public approval status, and report readiness. Readiness Gate can require a `truth_ref` for transitions, but it cannot verify truth or write Truth Spine records.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. Readiness Gate can require an `oracle_ref` for transitions into Data Approval, but it cannot change Oracle rulings.

## Relationship To Data Approval Gateway

Data Approval Gateway remains the human/public approval control surface. Readiness Gate can require approval references, but it cannot public-approve data.

## Relationship To Audit & Verification

Audit & Verification observes audit completeness, traceability, and replay readiness. Readiness Gate can require an `audit_ref`, but it does not replace audit evaluation.

## Relationship To Watchtower

Watchtower remains the monitoring and risk-observation layer. Readiness Gate exposes transition readiness as context only and does not replace Watchtower observation.

## Relationship To Reports

Reports may expose `readiness_gate` summary as transition-readiness context only. Reports must still use Truth Spine metadata for verified/public/report-ready claims.

## Relationship To SHF Impact Data Spine

Readiness Gate does not import, mutate, or replace SHF Impact Data Spine. Any public impact use remains governed by Truth Spine, Data Approval Gateway, and SHF Impact data rules.

## Endpoints

- `GET /readiness-gate/health`
- `GET /readiness-gate/schema`
- `GET /readiness-gate/summary`
- `POST /readiness-gate/evaluate`
- `POST /readiness-gate/batch-evaluate`
- `GET /readiness-gate/readiness`

## Reports/Watchtower Visibility

Reports expose Readiness Gate as summary-only transition-readiness context.

Watchtower exposes Readiness Gate as observation-only transition coverage context.

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/readiness_gate_service.py services/shf-agent-fabric/routers/readiness_gate_routes.py scripts/check_readiness_gate_layer.py`
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
- `python3 -m pytest services/shf-agent-fabric/tests/test_readiness_gate_routes.py`
- Adjacent focused pytest set for Audit & Verification, source registry, data federation, aggregator, normalization, evidence package, data verification, data approval, truth, and oracle routes.
- API smoke for Readiness Gate, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- Future Data Approval Gateway, Replay Engine, Signed Manifest, and SHF Impact Data Spine work must preserve this layer's transition-only boundary.

## V1 Complete

Yes.
