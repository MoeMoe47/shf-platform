# Data Federation Layer V1

## Executive Summary

Data Federation Layer V1 formalizes the coordination checkpoint between Source Registry and Data Aggregator. It groups approved source records, evaluates source compatibility, preserves lineage, detects conflicts, and routes eligible source groups toward Data Aggregator.

Data Federation does not verify truth. It does not create Truth Spine claims, approve public data, mark records public-approved, override Truth Spine, override Oracle, mutate SHF Impact Data Spine, publish reports, or replace Source Registry, Data Aggregator, Truth Spine, Data Approval Gateway, or SHF Impact Data Spine.

V1 complete: yes.

## Layer Role

Data Federation receives Source Registry-style records and evaluates whether source groups can move toward Data Aggregator.

It owns:

- Source grouping.
- Federation set readiness.
- Cross-source compatibility checks.
- Cross-source provenance completeness checks.
- Lineage presence checks.
- Source conflict warnings.
- Trust-tier mismatch warnings.
- Aggregator routing readiness.

## Position In Chain

Source Registry -> Data Federation -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO / Public Impact.

## Canonical Federation Model

```json
{
  "federation_id": "",
  "federation_name": "",
  "canonical_type": "",
  "sources": [],
  "source_count": 0,
  "source_types": [],
  "trust_tiers": [],
  "lineage": {},
  "conflicts": [],
  "warnings": [],
  "blockers": [],
  "federation_status": "blocked|needs_review|aggregator_ready",
  "ready_for_aggregator": false,
  "ready_for_truth_spine": false,
  "ready_for_public_approval": false,
  "truth_verified": false,
  "public_approved": false
}
```

`ready_for_truth_spine` is always false in V1 because federation routes to Data Aggregator first.

`ready_for_public_approval` is always false in V1.

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

## Readiness Rules

- Missing `federation_id` blocks readiness.
- Missing sources blocks readiness.
- Fewer than two sources needs review unless `single_source_candidate` is explicitly true.
- Any source missing `source_id` blocks readiness.
- Any source not eligible for Data Aggregator blocks readiness.
- Missing lineage needs review.
- Conflicting canonical types need review.
- Compatible eligible source groups with lineage can return `ready_for_aggregator: true`.

Even when aggregator-ready, V1 never sets Truth Spine readiness, public approval readiness, truth verification, or public approval.

## Owner

Data Operations / Federation preparation layer.

## Dependencies

Upstream:

- Source Registry.
- Batch/Import.
- Partner/Institution.
- Apps/Programs.

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

- Accept Source Registry-style records.
- Group related sources into federation sets.
- Evaluate source compatibility.
- Evaluate cross-source provenance completeness.
- Detect source conflicts.
- Detect missing lineage.
- Detect Source Registry eligibility gaps.
- Detect trust-tier mismatches.
- Produce federation readiness.
- Route eligible source groups toward Data Aggregator.

Disallowed actions:

- Verify truth.
- Create Truth Spine claims.
- Approve public data.
- Mark records public-approved.
- Override Truth Spine.
- Override Oracle.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Replace Source Registry.
- Replace Data Aggregator.
- Bypass Evidence Package.
- Bypass Truth Spine.
- Bypass Data Approval Gateway.
- Act as final source of truth for claims.
- Create production persistence.

## Relationship To Source Registry

Source Registry owns source identity, type, provenance expectations, and source eligibility. Data Federation consumes Source Registry-style records and does not replace source registration.

## Relationship To Data Aggregator

Data Federation routes compatible source groups to Data Aggregator. Data Aggregator still owns intake collection and aggregation.

## Relationship To Truth Spine

Truth Spine remains the authority for claim verification, trust levels, public approval status, and report readiness. Data Federation never routes directly to Truth Spine in V1.

## Relationship To SHF Impact Data Spine

Data Federation does not import, mutate, or replace SHF Impact Data Spine. Public impact use still flows through Data Approval Gateway and SHF Impact data rules.

## Reports/Watchtower Visibility

Reports may expose `data_federation` summary as federation-readiness context only.

Watchtower may expose `data_federation` summary as observation-only source federation context.

## Endpoints

- `GET /data-federation/health`
- `GET /data-federation/schema`
- `GET /data-federation/summary`
- `POST /data-federation/evaluate`
- `POST /data-federation/batch-evaluate`
- `GET /data-federation/readiness`

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/data_federation_service.py services/shf-agent-fabric/routers/data_federation_routes.py scripts/check_data_federation_layer.py`
- `python3 scripts/check_data_federation_layer.py`
- `python3 scripts/check_source_registry_layer.py`
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
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_federation_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_source_registry_routes.py services/shf-agent-fabric/tests/test_data_aggregator_routes.py services/shf-agent-fabric/tests/test_data_normalization_routes.py services/shf-agent-fabric/tests/test_evidence_package_routes.py services/shf-agent-fabric/tests/test_data_verification_routes.py services/shf-agent-fabric/tests/test_data_approval_routes.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py`
- API smoke for Data Federation, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- Future federation workflows must preserve Data Federation as a route-to-aggregator layer, not a Truth Spine or approval authority.

## V1 Complete

Yes.
