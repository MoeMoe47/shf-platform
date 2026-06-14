# AI/Swarm Guardrails V1

AI/Swarm Guardrails V1 prevents AI outputs and agent actions from bypassing Truth Spine, Oracle, Alignment, Watchtower, LOO, and Reports.

## Role

AI/Swarm may draft, summarize, inspect, and recommend. It may not publish verified claims, public claims, Oracle rulings, reports, or execution decisions without passing through the proper infrastructure layers.

## What AI May Do

- Draft internal text
- Summarize verified or unverified material as draft
- Inspect operator-provided context
- Recommend next steps for human or infrastructure review
- Request Truth Spine, Oracle, Alignment, Watchtower, LOO, or Reports review

## What AI May Not Do

- Mark anything verified
- Mark anything public-approved
- Mark anything report-ready
- Issue final Oracle rulings
- Execute, approve, reject, or escalate actions without Alignment
- Export reports without Truth metadata
- Publish public claims without Truth Spine public approval

## Truth Spine Requirements

AI output that uses words like `verified`, `proven`, `guaranteed`, `public-approved`, `official`, or `report-ready` requires verified Truth Spine claim packages.

Public publishing requires Truth Spine `public_approved`.

Report export requires Truth Spine `report_ready` or public-approved Truth metadata.

## Oracle Requirements

AI cannot issue final rulings. Requested actions such as `rule`, `decide`, or `reject` require Oracle review.

## Alignment Requirements

AI execution requests require Alignment L25/L26 approval. Requested actions such as `execute`, `approve`, `escalate`, or `send` are gated by Alignment.

## Reports Requirements

AI may draft report text, but Reports must carry Truth Spine metadata. AI cannot export report output as final without the Reports layer.

## Public Publishing Rule

Public AI output is blocked or routed to Truth Spine review unless all referenced claim packages are public-approved.

## Report Export Rule

Report export is blocked or routed to Truth Spine/Reports review unless all referenced claim packages are report-ready.

## Allowed Decisions

- `allowed`
- `allowed_with_limits`
- `blocked`
- `requires_truth_review`
- `requires_oracle_review`
- `requires_alignment_approval`

## Backend Endpoints

- `GET /ai-guardrails/health`
- `GET /ai-guardrails/policies`
- `POST /ai-guardrails/check-output`
- `GET /ai-guardrails/decisions`
- `GET /ai-guardrails/decisions/{decision_id}`
- `GET /ai-guardrails/audit-feed`

## Persistence

V1 uses local JSON files before any database migration:

- `services/shf-agent-fabric/db/ai_guardrails/policies.json`
- `services/shf-agent-fabric/db/ai_guardrails/decisions.json`
- `services/shf-agent-fabric/logs/ai_guardrails.audit.log`

## Admin UI

The admin page lives at:

`/admin.html#/ai-guardrails`

It shows:

- AI Guardrails health
- Policy cards
- Output checker form
- Decision result panel
- Decisions table
- Warnings panel
- Truth Spine + Oracle + Alignment Required badge

## Future Game Theory Integration

Future Game Theory work may consume AI guardrail decisions as safety signals, but it must not let AI bypass Truth Spine, Oracle, Alignment, Watchtower, LOO, or Reports.
