# API Gateway Layer V1

## Executive Summary

API Gateway Layer V1 formalizes route exposure and gateway-readiness review across SHF/SHS APIs. It accepts API request review payloads, classifies route exposure, classifies method safety, identifies required admin protection, identity/role context, policy context, audit requirements, rate-limit recommendations, public exposure readiness, blockers, warnings, and gateway readiness.

V1 prepares future API gateway enforcement without changing existing FastAPI routing, production auth, admin API key checks, or proxy behavior.

API Gateway V1 does not forward requests, rewrite backend routing, enforce production auth, bypass admin key checks, expose protected routes, send external requests, mutate data, verify truth, approve public data, mutate SHF Impact Data Spine, publish reports, replace Identity / Access Control, replace Policy Engine, replace AI Guardrails, replace Watchtower, override Truth Spine, or override Oracle.

V1 complete: yes.

## Layer Role

API Gateway answers:

- What API route is being requested?
- Is the route internal, admin, public, or external-facing?
- Is the method allowed?
- Is admin/API-key protection required?
- Is identity/role context required?
- Is policy evaluation required?
- Is request logging/audit required?
- Is rate limiting recommended?
- Is this route safe for public exposure?
- Should this request be blocked, needs review, or gateway-ready?

It owns:

- API request review payloads.
- Route exposure classification.
- Method safety classification.
- Admin protection requirement detection.
- Identity/role requirement detection.
- Policy requirement detection.
- Audit requirement detection.
- Rate-limit recommendation.
- Public exposure readiness.
- Blockers and warnings.
- Deterministic V1 seeded examples.
- Summary-only visibility to Reports.
- Observation-only visibility to Watchtower.

## Canonical API Gateway Review Request

```json
{
  "request_id": "",
  "path": "",
  "method": "GET|POST|PUT|PATCH|DELETE|UNKNOWN",
  "route_owner": "",
  "exposure": "public|internal|admin|external|unknown",
  "actor": "",
  "role": "",
  "has_admin_key": false,
  "has_identity_context": false,
  "has_policy_context": false,
  "payload_ref": "",
  "metadata": {}
}
```

`metadata.has_audit_context` may be used by V1 review payloads to show audit context is present.

## Canonical API Gateway Result

```json
{
  "gateway_review_id": "",
  "request_id": "",
  "path": "",
  "method": "",
  "route_owner": "",
  "exposure": "",
  "gateway_status": "blocked|needs_review|gateway_ready",
  "method_allowed": false,
  "admin_protection_required": false,
  "identity_required": false,
  "policy_required": false,
  "audit_required": false,
  "rate_limit_recommended": false,
  "public_exposure_allowed": false,
  "warnings": [],
  "blockers": [],
  "recommended_action": "",
  "gateway_ready": false,
  "request_forwarded": false,
  "truth_verified": false,
  "public_approved": false,
  "mutated_public_data": false,
  "published_report": false
}
```

`request_forwarded` is always false in V1.

`truth_verified` is always false in V1.

`public_approved` is always false in V1.

`mutated_public_data` is always false in V1.

`published_report` is always false in V1.

## Deterministic V1 Rules

- Missing `request_id` blocks.
- Missing `path` blocks.
- Missing `method` blocks.
- Unknown method needs review.
- Unsupported destructive methods `DELETE`, `PATCH`, or `PUT` need review unless explicitly internal/admin and protected.
- Paths beginning `/admin` are admin exposure, require admin protection, and block without admin key.
- Routes containing `/truth`, `/oracle`, `/ai-guardrails`, `/game-theory`, `/agent`, `/registry`, or `/layers` are internal/admin governance routes and require admin or identity context.
- Routes containing `/reports` or `/watchtower` require audit context and policy context.
- Routes containing `/source-registry`, `/data-federation`, `/data-aggregator`, `/data-normalization`, `/evidence-package`, `/data-verification`, `/data-approval`, `/readiness-gate`, `/audit-verification`, `/security-privacy`, `/data-ownership-ip`, `/public-approval`, `/policy-engine`, or `/event-webhook` are internal governance routes and recommend identity, policy, and audit context.
- Public-safe `GET` routes may be gateway-ready when exposure is public, no admin/internal route indicators are present, and no blockers exist.
- Internal/admin routes may be gateway-ready only if required context is present.
- External exposure needs review unless policy context, identity context, and audit context are present.
- Even when gateway-ready, `request_forwarded` remains false.

## Position In Front Of APIs

API Gateway is a cross-cutting boundary layer in front of:

- Agent Fabric APIs.
- Truth Spine.
- Oracle.
- AI Guardrails.
- Game Theory.
- Source Registry.
- Data Federation.
- Data Aggregator.
- Data Normalization.
- Evidence Package.
- Data Verification.
- Data Approval.
- Readiness Gate.
- Audit & Verification.
- Security / Privacy.
- Data Ownership / IP.
- Public Approval.
- Policy Engine.
- Event / Webhook.
- Reports.
- Watchtower.
- LOO.
- Admin / Registry APIs.

## Owner

Cross-cutting API exposure and route governance boundary.

## Dependencies

Upstream:

- Identity & Access.
- Role / Permission Layer.
- Policy Engine.
- AI Guardrails.
- Security / Privacy.
- Data Ownership / IP.
- Public Approval.
- Event / Webhook.
- Alignment Layer.

Downstream:

- Apps/Programs.
- Agent Fabric APIs.
- Truth Spine.
- Oracle Layer.
- AI/Swarm Layer.
- Reports.
- Watchtower.
- LOO.
- Admin / Registry APIs.

## Boundaries

Allowed actions:

- Accept API request review payloads.
- Classify route exposure.
- Classify method safety.
- Identify whether admin protection is required.
- Identify whether identity/role context is required.
- Identify whether policy context is required.
- Identify whether audit logging is required.
- Recommend rate limiting.
- Identify blockers and warnings.
- Produce gateway readiness result.
- Expose summary visibility to Reports.
- Expose observation-only visibility to Watchtower.

Disallowed actions:

- Forward requests in V1.
- Rewrite backend routing.
- Change production auth logic.
- Bypass existing admin key checks.
- Expose protected routes publicly.
- Create external API publishing.
- Create production gateway/proxy service.
- Send external requests.
- Mutate data.
- Verify truth.
- Approve public data.
- Mutate SHF Impact Data Spine.
- Publish reports.
- Replace Identity / Access Control.
- Replace Role / Permission Layer.
- Replace Policy Engine.
- Replace AI Guardrails.
- Replace Watchtower.
- Override Truth Spine.
- Override Oracle.

## Relationship To Identity / Access Control

Identity / Access Control remains the authority for actors, sessions, roles, and permissions. API Gateway may identify that identity context is required, but it does not authenticate actors or grant access in V1.

## Relationship To Policy Engine

Policy Engine remains the policy compliance layer. API Gateway may identify that policy context is required, but it does not replace policy evaluation.

## Relationship To AI Guardrails

AI Guardrails remains the AI containment and safety layer. API Gateway may classify AI route exposure but cannot replace AI Guardrails.

## Relationship To Truth Spine

Truth Spine remains the authority for claims, sources, verification status, trust level, public approval status, report readiness, packages, replay, federation, and audit feed.

API Gateway may classify Truth Spine route exposure and required protection but cannot verify truth, create claims, change trust, or approve public release.

## Relationship To Oracle

Oracle remains the supportability reasoning layer. API Gateway cannot override Oracle rulings.

## Relationship To Reports

Reports may expose `api_gateway` summary as route exposure and gateway-readiness context only. Reports must not treat API Gateway as truth verification, public approval, or publishing authority.

## Relationship To Watchtower

Watchtower may expose `api_gateway` summary as observation-only API route risk context. Watchtower remains the monitoring layer.

## Endpoints

- `GET /api-gateway/health`
- `GET /api-gateway/schema`
- `GET /api-gateway/summary`
- `POST /api-gateway/evaluate`
- `POST /api-gateway/batch-evaluate`
- `GET /api-gateway/readiness`

## Reports/Watchtower Visibility

Reports expose API Gateway as summary-only API route exposure and gateway-readiness context.

Watchtower exposes API Gateway as observation-only API route exposure and gateway-readiness context.

## Validation Status

Passed:

- `python3 -m py_compile services/shf-agent-fabric/services/api_gateway_service.py services/shf-agent-fabric/routers/api_gateway_routes.py scripts/check_api_gateway_layer.py`
- `python3 scripts/check_api_gateway_layer.py`
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
- `python3 -m pytest services/shf-agent-fabric/tests/test_api_gateway_routes.py`
- `python3 -m pytest services/shf-agent-fabric/tests/test_event_webhook_routes.py services/shf-agent-fabric/tests/test_policy_engine_routes.py services/shf-agent-fabric/tests/test_data_ownership_ip_routes.py services/shf-agent-fabric/tests/test_security_privacy_routes.py services/shf-agent-fabric/tests/test_public_approval_routes.py services/shf-agent-fabric/tests/test_truth_routes.py services/shf-agent-fabric/tests/test_oracle_routes.py`
- `npm run build`

API smoke passed for `/api-gateway/health`, `/api-gateway/schema`, `/api-gateway/summary`, `/api-gateway/evaluate`, `/api-gateway/batch-evaluate`, `/api-gateway/readiness`, `/reports/snapshot`, and `/watchtower/summary`.

## Remaining Risks

- V1 is deterministic and summary-only.
- V1 does not enforce production auth.
- V1 does not forward requests.
- V1 does not implement a proxy, rate limiter, or external API publishing.
- Future enforcement must preserve existing backend auth, admin key checks, Identity / Access Control, Policy Engine, Watchtower, Reports, Truth Spine, and Oracle boundaries.

## V1 Complete

Yes.
