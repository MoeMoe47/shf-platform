# Verified Aggregation Layer V1

## Executive Summary

Verified Aggregation Layer V1 formalizes the governance boundary that prepares deterministic aggregate previews from records that are traceable, verified or readiness-approved where applicable, policy-compliant, privacy-safe, ownership-clear, and public-approval-ready where public impact use is requested.

V1 does not write aggregate outputs to production stores. It does not verify truth, create Truth Spine claims, override Truth Spine, override Oracle, approve public data, mark records public-approved, mutate SHF Impact Data Spine, publish reports, replace Data Aggregator, replace Data Normalization, replace Reports, or replace Data Approval Gateway.

V1 complete: yes.

## Layer Role

Verified Aggregation answers:

- Can these records be aggregated?
- Are the records traceable?
- Are the records verified or readiness-approved enough for the requested aggregation purpose?
- Are policy, audit, privacy/security, ownership/IP, readiness, and public approval conditions present?
- Which records are included or excluded?
- What deterministic aggregate preview can be prepared?
- Is the preview ready for Reports, Watchtower, LOO, or Gateway review?

## Canonical Request

```json
{
  "aggregation_id": "",
  "aggregation_name": "",
  "aggregation_purpose": "internal_summary|report_summary|watchtower_summary|loo_summary|public_impact_candidate|unknown",
  "canonical_type": "",
  "records": [],
  "required_status": {
    "truth_spine": "",
    "oracle": "",
    "data_approval": "",
    "public_approval": "",
    "security_privacy": "",
    "data_ownership_ip": "",
    "policy_engine": "",
    "audit_verification": ""
  },
  "group_by": [],
  "metric_fields": [],
  "metadata": {}
}
```

## Canonical Result

```json
{
  "aggregation_review_id": "",
  "aggregation_id": "",
  "aggregation_name": "",
  "aggregation_purpose": "",
  "aggregation_status": "blocked|needs_review|aggregation_ready",
  "record_count": 0,
  "included_record_count": 0,
  "excluded_record_count": 0,
  "aggregate_preview": {},
  "excluded_records": [],
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "aggregation_ready": false,
  "reports_ready_candidate": false,
  "watchtower_ready_candidate": false,
  "loo_ready_candidate": false,
  "public_impact_ready_candidate": false,
  "records_written": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`records_written`, `truth_verified`, `public_approved`, `mutated_public_data`, and `published_report` are always false in V1.

## Deterministic V1 Rules

- Missing `aggregation_id` blocks.
- Missing `aggregation_name` creates `needs_review`.
- Missing `aggregation_purpose` blocks.
- Unknown `aggregation_purpose` creates `needs_review`.
- Missing or empty `records` blocks.
- Records missing traceability are excluded.
- Records with blocking supplied statuses are excluded.
- `internal_summary` can be aggregation-ready when records are traceable and have no blockers.
- `report_summary` expects audit and policy context when supplied; missing context creates review warnings.
- `watchtower_summary` expects risk or status context.
- `loo_summary` expects readiness or outcome context.
- `public_impact_candidate` requires Truth Spine, Oracle, Data Approval, Public Approval, Security/Privacy, Data Ownership/IP, Policy Engine, and Audit & Verification readiness when supplied.
- Public impact candidate readiness is only a recommendation; it does not mark records public-approved.
- Aggregate preview contains total, included, excluded, group counts, and simple numeric metric counts/sums.

## Endpoints

- `GET /verified-aggregation/health`
- `GET /verified-aggregation/schema`
- `GET /verified-aggregation/summary`
- `POST /verified-aggregation/evaluate`
- `POST /verified-aggregation/batch-evaluate`
- `GET /verified-aggregation/readiness`

## Reports And Watchtower Visibility

Reports receives summary-only `verified_aggregation` context.

Watchtower receives observation-only `verified_aggregation` context.

Neither integration publishes reports, writes records, mutates SHF Impact Data Spine, or changes truth/public approval status.

## Boundaries

Verified Aggregation may prepare aggregate previews from governed candidate records.

Verified Aggregation may not:

- perform raw data intake
- perform final normalization
- verify truth
- create Truth Spine claims
- override Truth Spine
- override Oracle
- approve public data
- mark records public-approved
- mutate SHF Impact Data Spine
- publish reports
- replace Reports
- replace Data Aggregator
- replace Data Normalization
- replace Data Approval Gateway
- create production persistence

## Validation

- `python3 scripts/check_verified_aggregation_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_verified_aggregation_routes.py`
- `npm run build`
