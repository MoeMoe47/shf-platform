# Event / Webhook Layer V1

## Executive Summary

Event / Webhook Layer V1 formalizes event routing and webhook-readiness evaluation across the SHF/SHS layer system. It accepts event-style payloads, classifies event type and source layer, identifies internal and external targets, evaluates queue readiness, blocks unsafe external delivery, and exposes summary-only readiness context to Reports and Watchtower.

V1 does not send external webhooks, call external network services, create production event bus persistence, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, create Truth Spine claims, override Truth Spine, override Oracle, replace Audit & Verification, replace Watchtower, replace Reports, replace Policy Engine, replace Notification / Alert, or replace Production Automation.

V1 complete: yes.

## Layer Role

Event / Webhook answers:

- What event happened?
- Which layer emitted it?
- What subject or resource is affected?
- Who should receive it?
- Is it safe to queue?
- Is webhook delivery allowed later?
- Is external delivery blocked?
- Should Reports, Watchtower, Audit & Verification, Policy Engine, notifications, production automation, or client reporting observe it?
- Is policy, security/privacy, or ownership context required?

It owns:

- Event-style payload acceptance.
- Event type classification.
- Source layer classification.
- Delivery scope classification.
- Internal target identification.
- External target identification.
- Blocked target identification.
- Queue readiness.
- External delivery readiness.
- Warnings and blockers.
- Deterministic V1 seeded examples.
- Summary-only visibility to Reports.
- Observation-only visibility to Watchtower.

## Position In Chain

Source Registry -> Data Federation -> Data Aggregator -> Data Normalization -> Evidence Package -> Data Verification -> Truth Spine -> Oracle -> Data Approval -> Readiness Gate -> Security / Privacy -> Data Ownership / IP -> Public Approval -> Data Approval Gateway -> SHF Impact Data Spine -> Reports / Watchtower / LOO.

Cross-cutting:

- Audit & Verification observes event traceability.
- Policy Engine evaluates policy compliance.
- Event / Webhook prepares event routing and delivery readiness.
- Production Automation may consume approved events later.

## Canonical Event Payload

```json
{
  "event_id": "",
  "event_type": "layer_status|data_ready|approval_ready|public_ready_candidate|watchtower_observation|report_snapshot|policy_violation|security_privacy_warning|ownership_warning|agent_action|integration_request|unknown",
  "source_layer": "",
  "subject_id": "",
  "subject_type": "",
  "actor": "",
  "payload_ref": "",
  "audit_ref": "",
  "policy_ref": "",
  "security_privacy_ref": "",
  "ownership_ref": "",
  "delivery_scope": "internal|external|both|unknown",
  "requested_targets": [],
  "timestamp": "",
  "metadata": {}
}
```

## Canonical Event/Webhook Result

```json
{
  "event_review_id": "",
  "event_id": "",
  "event_type": "",
  "source_layer": "",
  "routing_status": "blocked|needs_review|queue_ready",
  "delivery_scope": "",
  "internal_targets": [],
  "external_targets": [],
  "blocked_targets": [],
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "queue_ready": false,
  "external_delivery_allowed": false,
  "webhook_sent": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`webhook_sent` is always false in V1.

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

## Deterministic V1 Rules

- Missing `event_id` blocks.
- Missing `event_type` blocks.
- Missing `source_layer` blocks.
- Unknown `event_type` needs review.
- Unknown `source_layer` needs review.
- Missing `subject_id` needs review.
- Missing `timestamp` needs review.
- External or both-scope delivery requires `policy_ref`, `security_privacy_ref`, and `ownership_ref`.
- External targets require `policy_ref`, `security_privacy_ref`, and `ownership_ref`.
- Empty `requested_targets` needs review.
- Internal-only events with known source layer and internal targets can become queue-ready.
- External delivery may be allowed only when required refs are present and no blockers exist.
- External targets are never called in V1.
- Webhooks are never sent in V1.

## Recognized Internal Targets

- `reports`
- `watchtower`
- `audit_verification`
- `readiness_gate`
- `policy_engine`
- `notification_alert`
- `production_automation`
- `client_reporting`

## Recognized External Target Types

- `webhook`
- `partner_system`
- `client_callback`
- `public_status_feed`

## Owner

Cross-cutting event routing and webhook-readiness layer.

## Dependencies

Upstream:

- Apps/Programs.
- Partner/Institution.
- Audit & Verification.
- Policy Engine.
- Security / Privacy.
- Data Ownership / IP.
- Public Approval.
- Readiness Gate.
- Reports.
- Watchtower.

Downstream:

- Adapter Layer.
- Batch/Import.
- Watchtower.
- Reports.
- Audit & Verification.
- Policy Engine.
- Notification / Alert.
- Production Automation.
- ClientOps.

## Boundaries

Allowed actions:

- Accept event-style payloads.
- Classify event types.
- Classify source layers.
- Identify routing targets.
- Evaluate internal delivery readiness.
- Evaluate future external delivery readiness.
- Block external delivery when policy/security/privacy/ownership context is missing.
- Identify downstream consumers.
- Produce warnings and blockers.
- Expose summary visibility to Reports.
- Expose observation-only visibility to Watchtower.

Disallowed actions:

- Send external webhooks in V1.
- Call external network services.
- Create production event bus persistence.
- Verify truth.
- Approve public data.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Create Truth Spine claims.
- Override Truth Spine.
- Override Oracle.
- Replace Audit & Verification.
- Replace Watchtower.
- Replace Reports.
- Replace Policy Engine.
- Replace Notification / Alert.
- Replace Production Automation.

## Relationship To Audit & Verification

Audit & Verification remains the traceability and replay-readiness layer. Event / Webhook may require `audit_ref` or route internal events to Audit & Verification, but it does not replace audit validation.

## Relationship To Policy Engine

Policy Engine remains the policy compliance layer. Event / Webhook may require `policy_ref` before external delivery readiness, but it does not evaluate policy compliance beyond presence/absence of the required reference in V1.

## Relationship To Security / Privacy

Security / Privacy remains the exposure-risk layer. Event / Webhook may require `security_privacy_ref` before external delivery readiness, but it does not clear privacy or security risk.

## Relationship To Data Ownership / IP

Data Ownership / IP remains the ownership and usage-right readiness layer. Event / Webhook may require `ownership_ref` before external delivery readiness, but it does not grant ownership clearance.

## Relationship To Truth Spine

Truth Spine remains the authority for claims, sources, verification status, trust level, public approval status, report readiness, packages, replay, federation, and audit feed.

Event / Webhook may classify events related to Truth Spine, but events that become claims must be routed into Truth Spine or remain unverified.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. Event / Webhook cannot override Oracle rulings.

## Relationship To Reports

Reports may expose `event_webhook` summary as event routing and webhook-readiness context only. Reports must not treat Event / Webhook as truth verification, public approval, or publishing authority.

## Relationship To Watchtower

Watchtower may expose `event_webhook` summary as observation-only event routing context. Watchtower remains the monitoring layer.

## Endpoints

- `GET /event-webhook/health`
- `GET /event-webhook/schema`
- `GET /event-webhook/summary`
- `POST /event-webhook/evaluate`
- `POST /event-webhook/batch-evaluate`
- `GET /event-webhook/readiness`

## Reports/Watchtower Visibility

Reports expose Event / Webhook as summary-only event routing and webhook-readiness context.

Watchtower exposes Event / Webhook as observation-only event routing and webhook-readiness context.

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/event_webhook_service.py services/shf-agent-fabric/routers/event_webhook_routes.py scripts/check_event_webhook_layer.py`
- `python3 scripts/check_event_webhook_layer.py`
- `python3 scripts/check_policy_engine_layer.py`
- `python3 scripts/check_data_ownership_ip_layer.py`
- `python3 scripts/check_security_privacy_layer.py`
- `python3 scripts/check_public_approval_layer.py`
- `python3 scripts/check_readiness_gate_layer.py`
- `python3 scripts/check_audit_verification_layer.py`
- `python3 scripts/check_master_layer_registry.py`
- `python3 scripts/check_truth_spine_freeze.py`
- `python3 scripts/check_oracle_layer.py`
- `python3 scripts/check_ai_guardrails_layer.py`
- `python3 scripts/check_game_theory_layer.py`
- `npm run check:governance`
- `python3 -m pytest services/shf-agent-fabric/tests/test_event_webhook_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_policy_engine_routes.py services/shf-agent-fabric/tests/test_data_ownership_ip_routes.py services/shf-agent-fabric/tests/test_security_privacy_routes.py services/shf-agent-fabric/tests/test_public_approval_routes.py services/shf-agent-fabric/tests/test_readiness_gate_routes.py services/shf-agent-fabric/tests/test_audit_verification_routes.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py`
- `npm run build`

API smoke passed for `/event-webhook/health`, `/event-webhook/schema`, `/event-webhook/summary`, `/event-webhook/evaluate`, `/event-webhook/batch-evaluate`, `/event-webhook/readiness`, `/reports/snapshot`, and `/watchtower/summary`.

## Remaining Risks

- V1 is deterministic and summary-only.
- V1 has no production event bus persistence.
- V1 does not send external webhooks.
- Future webhook delivery must add signed event manifests, retry policy, delivery logs, opt-in outbound transport, and governance approval before external calls are enabled.

## V1 Complete

Yes.
