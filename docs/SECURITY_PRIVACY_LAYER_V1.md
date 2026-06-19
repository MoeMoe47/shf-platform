# Security / Privacy Layer V1

## Executive Summary

Security / Privacy Layer V1 formalizes deterministic privacy and security exposure checks before records move toward Public Approval, SHF Impact Data Spine, Reports, Watchtower, LOO, or public-facing surfaces.

Security / Privacy does not verify truth. It does not create Truth Spine claims, approve public data, mark records public-approved, mutate SHF Impact Data Spine, publish reports, override Truth Spine or Oracle, replace Identity / Access Control, replace role/permission controls, or replace Data Approval Gateway.

V1 complete: yes.

## Layer Role

Security / Privacy receives candidate records or payloads and evaluates simple V1 exposure indicators.

It owns:

- Simple PII indicator detection.
- Sensitive category indicator detection.
- Secret/token/admin-key exposure detection.
- Privacy risk classification.
- Security risk classification.
- Public-safety blocker detection.
- Redaction recommendation.
- Access restriction recommendation.
- Privacy review requirement.
- Security review requirement.
- Public-safe candidate recommendation.
- Summary-only exposure to Reports and Watchtower.

## Position In Chain

Source Registry -> Data Federation -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Readiness Gate -> Public Approval -> Security / Privacy -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO / Public Impact.

Audit & Verification observes.

Readiness Gate controls forward movement.

Security / Privacy blocks unsafe exposure.

## Canonical Security Privacy Model

```json
{
  "review_id": "",
  "candidate_id": "",
  "canonical_type": "",
  "privacy_risk": "none|low|medium|high|blocked",
  "security_risk": "none|low|medium|high|blocked",
  "pii_detected": false,
  "sensitive_data_detected": false,
  "secret_detected": false,
  "redaction_required": false,
  "access_restriction_required": false,
  "privacy_review_required": false,
  "security_review_required": false,
  "public_safe_candidate": false,
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

## Deterministic V1 Detection

Potential PII indicators:

- `email`
- `phone`
- `address`
- `ssn`
- `date_of_birth`
- `dob`
- `student_name`
- `minor_name`
- `client_name`
- `patient_name`

Sensitive category indicators:

- `health`
- `diagnosis`
- `disability`
- `minor`
- `youth`
- `student`
- `criminal`
- `legal`
- `financial_account`
- `bank`
- `religion`
- `race`
- `ethnicity`
- `immigration`

Secret/security exposure indicators:

- `api_key`
- `admin_api_key`
- `token`
- `secret`
- `password`
- `private_key`
- `bearer`
- `session`

V1 uses deterministic local heuristics only. It does not use external calls, ML calls, or a production secret scanning system.

## Readiness Rules

- `secret_detected: true` blocks public-safe candidate status.
- High-risk PII requires privacy review.
- Sensitive data requires privacy review.
- Any PII or sensitive data requires redaction.
- Any PII, sensitive data, or secret exposure requires access restriction.
- `public_safe_candidate` can be true only when there are no secrets, blockers, high privacy risk, high security risk, redaction requirements, privacy review requirements, or security review requirements.

Even when `public_safe_candidate` is true, V1 never sets `public_approved`, never mutates public data, and never publishes reports.

## Owner

Security governance / privacy review preparation layer.

## Dependencies

Upstream:

- Governance Layer.
- Data Ownership/IP.
- Identity & Access.
- Data Approval Layer.
- Readiness Gate.
- Public Approval.
- Audit & Verification.

Downstream:

- Public Approval.
- Data Approval Gateway.
- SHF Impact Data Spine.
- Reports.
- Watchtower.
- LOO.
- Public Impact Map.
- Identity & Access.

## Boundaries

Allowed actions:

- Accept candidate records and payloads.
- Detect simple PII indicators.
- Detect sensitive category indicators.
- Detect secret/token/admin-key exposure indicators.
- Detect public-safety blockers.
- Classify privacy risk.
- Classify security risk.
- Recommend redaction.
- Recommend access restriction.
- Produce public-safe candidate status.
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
- Replace Identity / Access Control.
- Replace role/permission controls.
- Replace compliance layers.
- Bypass Public Approval.
- Bypass Data Approval Gateway.
- Create production persistence.

## Relationship To Truth Spine

Truth Spine remains the authority for verified claims, trust levels, public approval status, and report readiness. Security / Privacy may block or require review for unsafe exposure, but it cannot verify claims or write Truth Spine records.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. Security / Privacy cannot override Oracle rulings.

## Relationship To Identity / Access Control

Identity / Access Control remains the route, role, and permission authority. Security / Privacy may recommend access restriction, but it does not replace identity or role controls.

## Relationship To Public Approval

Public Approval remains the public release readiness layer. Security / Privacy supplies exposure-risk context and blockers only.

## Relationship To Data Approval Gateway

Data Approval Gateway remains a review control surface. Security / Privacy cannot bypass it.

## Relationship To SHF Impact Data Spine

Security / Privacy does not import, mutate, or replace SHF Impact Data Spine. Unsafe or sensitive records must be blocked or reviewed before any public impact visibility path.

## Relationship To Reports

Reports may expose `security_privacy` summary as privacy/security-readiness context only. Reports must not publish sensitive, private, or security-exposed data.

## Relationship To Watchtower

Watchtower may expose `security_privacy` summary as observation-only risk context. Watchtower remains the monitoring layer.

## Endpoints

- `GET /security-privacy/health`
- `GET /security-privacy/schema`
- `GET /security-privacy/summary`
- `POST /security-privacy/evaluate`
- `POST /security-privacy/batch-evaluate`
- `GET /security-privacy/readiness`

## Reports/Watchtower Visibility

Reports expose Security / Privacy as summary-only risk context.

Watchtower exposes Security / Privacy as observation-only risk context.

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/security_privacy_service.py services/shf-agent-fabric/routers/security_privacy_routes.py scripts/check_security_privacy_layer.py`
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
- `python3 -m pytest services/shf-agent-fabric/tests/test_security_privacy_routes.py`
- Adjacent focused pytest set for Public Approval, Readiness Gate, Audit & Verification, Data Approval, Truth Spine, and Oracle routes.
- API smoke for Security / Privacy, Reports snapshot, and Watchtower summary.
- `npm run build`

## Remaining Risks

- V1 has no production persistence by design.
- V1 is a deterministic heuristic scaffold, not a production secret scanning or compliance engine.
- Future Identity, role/permission, Compliance, and Data Approval Gateway work must preserve this layer's recommendation/blocker-only boundary.

## V1 Complete

Yes.
