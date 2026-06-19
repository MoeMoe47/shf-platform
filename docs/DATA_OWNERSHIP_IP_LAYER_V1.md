# Data Ownership / IP Layer V1

## Executive Summary

Data Ownership / IP Layer V1 formalizes ownership, usage-rights, consent, attribution, licensing, reuse, reporting, and public-release readiness checks before records move toward Public Approval, SHF Impact Data Spine, Reports, Watchtower, LOO, client reporting, or public-facing surfaces.

Data Ownership / IP does not verify truth. It does not create Truth Spine claims, approve public data, mark records public-approved, mutate SHF Impact Data Spine, publish reports, override Truth Spine or Oracle, replace Security / Privacy, replace Source Registry, replace role/permission controls, replace Data Approval Gateway, or provide legal advice.

V1 complete: yes.

## Layer Role

Data Ownership / IP receives candidate records or payloads and evaluates whether ownership and usage-right information is sufficient for downstream review.

It owns:

- Ownership field inspection.
- Submitter field inspection.
- License field inspection.
- Consent field inspection.
- Attribution needs.
- Reuse and publication restrictions.
- Third-party IP indicators.
- Ownership risk classification.
- License risk classification.
- Reuse eligibility.
- Reporting eligibility.
- Public-release rights readiness.
- Blocker and warning surfacing.
- Ownership-clear candidate recommendation.
- Summary-only exposure to Reports and Watchtower.

## Position In Chain

Source Registry -> Data Federation -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Readiness Gate -> Security / Privacy -> Data Ownership / IP -> Public Approval -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO / Public Impact.

Audit & Verification observes.

Readiness Gate controls forward movement.

Security / Privacy blocks unsafe exposure.

Data Ownership / IP blocks unauthorized use, reuse, publication, or licensing.

## Canonical Data Ownership / IP Model

```json
{
  "ownership_review_id": "",
  "candidate_id": "",
  "canonical_type": "",
  "owner": "",
  "submitted_by": "",
  "license_type": "unknown|internal_use|reporting_allowed|public_release_allowed|restricted|third_party",
  "usage_rights": [],
  "attribution_required": false,
  "consent_required": false,
  "consent_confirmed": false,
  "third_party_ip_detected": false,
  "reuse_allowed": false,
  "reporting_allowed": false,
  "public_release_rights": false,
  "ownership_risk": "unknown|low|medium|high|blocked",
  "license_risk": "unknown|low|medium|high|blocked",
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "ownership_clear_candidate": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

`ownership_clear_candidate` is a readiness recommendation only, never final approval or legal clearance.

## Deterministic V1 Rules

- Missing `candidate_id` blocks readiness.
- Missing `owner` blocks readiness.
- Missing `submitted_by` needs review.
- Missing or unknown `license_type` needs review.
- `license_type: restricted` blocks readiness.
- `license_type: third_party` needs review and blocks if explicit rights are missing.
- `attribution_required: true` without attribution text/source needs review.
- `consent_required: true` with `consent_confirmed: false` blocks readiness.
- Missing `usage_rights` needs review.
- `usage_rights` including `public_release` supports public-release rights.
- `usage_rights` including `reporting` supports reporting eligibility.
- `usage_rights` including `reuse` supports reuse eligibility.
- Missing public-release rights prevents `ownership_clear_candidate`.

V1 uses deterministic readiness flags only. It does not make legal conclusions.

## Owner

Governance ownership and usage-right readiness layer.

## Dependencies

Upstream:

- Source Registry.
- Security / Privacy.
- Data Approval Layer.
- Readiness Gate.
- Public Approval.
- Governance Layer.

Downstream:

- Public Approval.
- Data Approval Gateway.
- SHF Impact Data Spine.
- Reports.
- Watchtower.
- LOO.
- ClientOps.
- Governance Binder.

## Boundaries

Allowed actions:

- Accept candidate records and payloads.
- Inspect ownership fields.
- Inspect submitter fields.
- Inspect license fields.
- Inspect consent fields.
- Inspect attribution needs.
- Inspect reuse/publication restrictions.
- Inspect third-party IP indicators.
- Classify ownership risk.
- Classify license risk.
- Classify reuse eligibility.
- Classify reporting eligibility.
- Classify public-release rights.
- Produce blockers and warnings.
- Expose summary visibility to Reports.
- Expose summary visibility to Watchtower.

Disallowed actions:

- Verify truth.
- Create Truth Spine claims.
- Approve public data.
- Mark records public-approved.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Override Truth Spine.
- Override Oracle.
- Replace Security / Privacy.
- Replace Source Registry.
- Replace role/permission controls.
- Replace Data Approval Gateway.
- Provide legal advice.
- Bypass Public Approval.
- Bypass Data Approval Gateway.
- Create production persistence.

## Relationship To Truth Spine

Truth Spine remains the authority for verified claims, trust levels, public approval status, and report readiness. Data Ownership / IP can block or require review for ownership and rights issues, but it cannot verify claims or write Truth Spine records.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. Data Ownership / IP cannot override Oracle rulings.

## Relationship To Security / Privacy

Security / Privacy remains the exposure-risk layer. Data Ownership / IP evaluates ownership and usage rights only.

## Relationship To Source Registry

Source Registry remains the source identity and provenance eligibility layer. Data Ownership / IP can inspect owner and submitter fields, but it does not replace source registration.

## Relationship To Public Approval

Public Approval remains the public release readiness layer. Data Ownership / IP supplies ownership and usage-right readiness context only.

## Relationship To Data Approval Gateway

Data Approval Gateway remains a review control surface. Data Ownership / IP cannot bypass it.

## Relationship To SHF Impact Data Spine

Data Ownership / IP does not import, mutate, or replace SHF Impact Data Spine. Records without sufficient rights must be blocked or reviewed before any public impact visibility path.

## Relationship To Reports

Reports may expose `data_ownership_ip` summary as ownership/readiness context only. Reports must not publish records without proper ownership, usage rights, consent, attribution, and public-release readiness.

## Relationship To Watchtower

Watchtower may expose `data_ownership_ip` summary as observation-only risk context. Watchtower remains the monitoring layer.

## Endpoints

- `GET /data-ownership-ip/health`
- `GET /data-ownership-ip/schema`
- `GET /data-ownership-ip/summary`
- `POST /data-ownership-ip/evaluate`
- `POST /data-ownership-ip/batch-evaluate`
- `GET /data-ownership-ip/readiness`

## Reports/Watchtower Visibility

Reports expose Data Ownership / IP as summary-only ownership/readiness context.

Watchtower exposes Data Ownership / IP as observation-only ownership/readiness context.

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/data_ownership_ip_service.py services/shf-agent-fabric/routers/data_ownership_ip_routes.py scripts/check_data_ownership_ip_layer.py`
- `python3 scripts/check_data_ownership_ip_layer.py`
- `python3 scripts/check_security_privacy_layer.py`
- `python3 scripts/check_public_approval_layer.py`
- `python3 scripts/check_readiness_gate_layer.py`
- `python3 scripts/check_audit_verification_layer.py`
- `python3 scripts/check_data_approval_layer.py`
- `python3 scripts/check_data_verification_layer.py`
- `python3 scripts/check_evidence_package_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_data_ownership_ip_routes.py`
- Adjacent focused pytest set for Security / Privacy, Public Approval, Readiness Gate, Audit & Verification, Data Approval, Truth Spine, and Oracle routes.
- API smoke for Data Ownership / IP, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- V1 is a deterministic rights-readiness scaffold, not legal advice or a contract management system.
- Future Source Registry, role/permission, Public Approval, Data Approval Gateway, and SHF Impact Data Spine workflows must preserve this layer's recommendation/blocker-only boundary.

## V1 Complete

Yes.
