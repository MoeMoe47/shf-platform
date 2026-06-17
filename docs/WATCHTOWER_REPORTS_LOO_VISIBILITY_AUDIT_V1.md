# Watchtower / Reports / LOO Visibility Audit V1

Date: 2026-06-14

Status: V1 audit complete. No runtime behavior changes were made.

## Purpose

This audit checks whether SHS governance and truth signals are visible across Watchtower, Reports, LOO / Lord of Outcomes, and the current admin surfaces. It does not create new architecture, rebuild frozen layers, or change layer behavior.

## Signals Audited

- Truth Spine
- Oracle
- AI/Swarm Guardrails
- Game Theory
- Agent Fabric / Governance
- Master Layer Registry
- Duplicate cleanup / anti-drift
- Layer gate
- Trust metadata
- Audit trace metadata

## Backend Visibility

| Surface | Smoke Result | Visible Signals | Gaps |
| --- | --- | --- | --- |
| `GET /watchtower/summary` | PASS, 200 | Watchtower coverage/risk, Truth coverage, Oracle, AI Guardrails, Game Theory | Agent Fabric, layer gate, Master Layer Registry, duplicate cleanup are not included in the summary payload. |
| `GET /reports/snapshot` | PASS, 200 | Report snapshot, Truth readiness, Oracle, AI Guardrails, Game Theory | Agent Fabric, layer gate, Master Layer Registry, duplicate cleanup, and explicit audit trace metadata are not included in the snapshot payload. |
| `GET /loo/score` | EXPECTED GAP, 405 | None for GET | LOO scoring is implemented as `POST /loo/score`, not GET. |
| `POST /loo/score` | PASS, 200 | LOO score, decision, derived metrics, trust metadata supplied from Truth Spine fields | Oracle, layer gate, Agent Fabric, and audit trace metadata are not attached to the score response. |
| `GET /truth/health` | PASS, 200 | Truth Spine health, claim/source counts, verified/report-ready/public-approved counts | No visibility gap for this layer health check. |
| `GET /truth/coverage` | PASS, 200 | Truth coverage, package/federation counts, verified/report-ready/public-approved percentages | No visibility gap for this coverage endpoint. |
| `GET /oracle/health` | PASS, 200 | Oracle service health and ruling posture | No visibility gap for this layer health check. |
| `GET /oracle/rulings` | PASS, 200 | Oracle rulings list | No visibility gap for this endpoint. |
| `GET /ai-guardrails/health` | PASS, 200 | AI Guardrails health, blocked/review-required counts | No visibility gap for this layer health check. |
| `GET /ai-guardrails/decisions` | PASS, 200 | AI Guardrails decisions list | No visibility gap for this endpoint. |
| `GET /game-theory/health` | PASS, 200 | Game Theory service health and analysis counts | No visibility gap for this layer health check. |
| `GET /game-theory/strategy-playbook` | PASS, 200 | Game Theory strategy playbook | No visibility gap for this endpoint. |
| `GET /admin/agents/summary/health` | PASS, 200 with admin key | Agent Fabric summary, canonical health, readiness counts | Does not expose Watchtower / Reports / LOO payload state directly. |
| `GET /admin/agents/verify` | PASS, 200 with admin key | Agent Fabric verification ledger and event count | Does not expose Watchtower / Reports / LOO payload state directly. |
| `GET /admin/layers/gate/status` | PASS, 200 with admin key | Layer gate, Master Layer Registry gate blockers | Gate currently reports blockers for later layers that are not `enforced_ready`; this is governance signal visibility, not a route failure. |

## Frontend Visibility

| Admin route | Smoke Result | Rendered Surface | Visible Signals | Notes |
| --- | --- | --- | --- | --- |
| `admin.html#/agent-fabric` | PASS | Agent Fabric | Agent Fabric, canonical routing, allowed tasks, required layers, layer gate posture | Primary governance visibility surface. |
| `admin.html#/registry` | PASS | Registry | Master Layer Registry / app registry posture | Registry renders in the admin shell. |
| `admin.html#/truth-spine` | PASS | SHS Truth Spine V1 | Truth Spine, claim/source readiness, report readiness | Truth Spine V1 page renders. |
| `admin.html#/oracle` | PASS | Oracle Layer V1 | Oracle rulings and Truth Spine boundary | Oracle page renders. |
| `admin.html#/ai-guardrails` | PASS | AI Guardrails V1 | AI/Swarm Guardrails and publication gate posture | AI Guardrails page renders. |
| `admin.html#/game-theory` | PASS | Game Theory Layer V1 | Game Theory analysis/playbook posture | Game Theory page renders. |
| `admin.html#/reporting` | PASS WITH ACCESS/WORKFLOW BLOCKER | Reporting Command Surface | Reports, reporting readiness, Oracle/trust terminology, audit/export surfaces | Route is mounted and nonblank. Current seeded smoke identity shows blocker text. |
| `admin.html#/hub/reports` | PASS WITH ACCESS/WORKFLOW BLOCKER | Hub Reports | Truth Spine report readiness, audit coverage, verified reports | Route is mounted and nonblank. Current seeded smoke identity shows blocker text. |
| `admin.html#/lord-outcomes` | GAP | Redirects/falls back to Hub | None specific to LOO in admin shell | Sidebar links to `/lord-outcomes`, but `AdminRoutes.jsx` does not mount that route. |
| `admin.html#/watchtower` | GAP | Redirects/falls back to Hub | None specific to Watchtower in admin shell | No mounted admin Watchtower route found. |
| `admin.html#/loo` | GAP | Redirects/falls back to Hub | None specific to LOO in admin shell | No mounted admin LOO route found. |
| `admin.html#/reports` | GAP | Redirects/falls back to Hub | None specific to Reports | Mounted report surfaces are `/reporting` and `/hub/reports`, not `/reports`. |

## Signal Matrix

| Signal | Watchtower Summary | Reports Snapshot | LOO Score | Admin Visibility |
| --- | --- | --- | --- | --- |
| Truth Spine | Visible | Visible | Visible when submitted in score payload | Visible at `/truth-spine`, `/reporting`, `/hub/reports` |
| Oracle | Visible | Visible | Not attached | Visible at `/oracle`, referenced in reporting surfaces |
| AI/Swarm Guardrails | Visible | Visible | Not attached | Visible at `/ai-guardrails` |
| Game Theory | Visible | Visible | LOO scoring is adjacent but not the Game Theory layer payload | Visible at `/game-theory` |
| Agent Fabric / Governance | Not visible | Not visible | Not visible | Visible at `/agent-fabric` |
| Master Layer Registry | Not visible | Not visible | Not visible | Visible at `/registry` and `/agent-fabric` |
| Duplicate cleanup / anti-drift | Not visible | Not visible | Not visible | Visible through governance docs/checks, not through these UI routes |
| Layer gate | Not visible | Not visible | Not visible | Visible through `/admin/layers/gate/status` and `/agent-fabric` |
| Trust metadata | Partial through Truth coverage | Partial through Truth readiness counts | Visible in `trust` object | Visible in Truth Spine / Reporting / Hub Reports |
| Audit trace metadata | Partial Watchtower risk/audit feed | Partial in reporting UI surfaces, not backend snapshot | Not visible | Visible in Agent Fabric verification and reporting audit surfaces |

## Boundary Findings

- Watchtower observes coverage, alerts, and risk. It is not presented as the authority that verifies claims.
- Reports expose Truth Spine readiness and explicitly keep Oracle as decision support, not publication authority.
- LOO ranks outcomes and exposes Truth Spine trust metadata when provided; it does not verify claims.
- Agent Fabric and Layer Gate are visible through admin-gated endpoints and the Agent Fabric page, not through Watchtower / Reports / LOO payloads.
- The Master Layer Registry is visible in the registry/admin governance surfaces, not embedded in Watchtower / Reports / LOO responses.

## Gaps

1. `GET /loo/score` is not an active score endpoint; the implemented scoring contract is `POST /loo/score`.
2. The admin sidebar exposes `Lord of Outcomes` at `/lord-outcomes`, but the admin router does not mount that route.
3. Watchtower summary and Reports snapshot do not include Agent Fabric, Layer Gate, Master Layer Registry, or duplicate-cleanup status.
4. There is no dedicated mounted admin Watchtower route found in the current admin shell.
5. There is no dedicated mounted admin `/reports` route; the active report routes are `/reporting` and `/hub/reports`.

## Fixes Applied

No source-code or runtime behavior fixes were applied in this audit. The identified gaps are visibility/routing follow-up candidates and should be handled in a separate owner-approved implementation pass.

## Validation Summary

Backend smoke checks passed for the active Watchtower, Reports, Truth Spine, Oracle, AI Guardrails, Game Theory, and admin governance endpoints. `GET /loo/score` returned 405 because LOO scoring is currently POST-only; `POST /loo/score` passed and returned trust metadata.

Frontend smoke checks confirmed the primary governance/admin pages render. The unmounted route gaps redirect/fall back to the Hub rather than rendering dedicated Watchtower/LOO/Reports pages.

## V1 Conclusion

Watchtower / Reports / LOO Visibility Audit V1 is complete as an audit report. The current system has strong visibility for frozen governance layers in their dedicated admin surfaces and partial visibility inside Watchtower, Reports, and LOO payloads. It is not yet complete as unified cross-surface visibility because Agent Fabric, Layer Gate, Master Layer Registry, duplicate cleanup, and dedicated LOO/Watchtower admin routes are not exposed across all audited surfaces.
