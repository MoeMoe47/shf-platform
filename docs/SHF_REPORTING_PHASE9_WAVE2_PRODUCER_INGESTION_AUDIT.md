# SHF Reporting Phase 9 Wave 2 Producer/Ingestion Audit

## Selected producer

`hub.referral` is a real producer. `CaseService.createReferral()` creates a
backend case, persists referral details, and writes a `referral.created` audit
event with actor and organization context.

The Agent Fabric boundary now accepts the minimum handoff event:

`referral.created` → operational event → Evidence → unverified Source →
unapproved Truth claim.

The claim is limited to the operational fact that a referral was created. No
referral impact or completion metric was added.

## Contract

- Ingestion: `POST /shf/ingestion/events`
- Permission: `shf.event.create`
- Projection trigger: `POST /shf/ingestion/events/{event_id}/truth-projection`
- Producer: `hub.referral`
- Claim type: `hub_referral_created`
- Predicate: `referral_created`
- Evidence: `hub_referral_activity`
- Idempotency: tenant + organization + producer + idempotency key
- Scope: derived from the Agent Fabric verified session
- Persistence: JSONL repository abstraction, development-only, not approved production durability

## Wave 2C infrastructure checkpoint

The existing Hub UI calls `/api/cases/referrals` on the SHS API application.
Wave 2C adds a fail-closed service identity contract and a PostgreSQL outbox
foundation. Referral creation now composes business persistence, audit, and
outbox insertion through the existing transaction helper. Agent Fabric exposes
`POST /shf/internal/ingestion/events`, validates the signed service request,
and reuses operational ingestion plus Evidence/Truth projection.

The code-level contract and isolated local process handoff are tested with real
HMAC validation and isolated Truth stores. A synthetic referral reached Agent
Fabric through the PostgreSQL outbox worker and produced one operational event,
one Evidence record, one unverified Source, and one draft/unapproved Truth
claim; replay returned the existing projection. The Hub intake browser fallback
was then removed without changing the shared Truth adapter used by other Hub
readers. This is not a deployed production runtime and no approved production
secret provider has been exercised; the change does not claim production
deployment or production durability.

## Deferred candidates

Exchange workspace state, Grant Binder logs, Hub workspace state, placement,
attendance, IEP, public impact, employment, funding, and credential paths were
not canonicalized. They remain browser-only, mock/static, operational-only, or
lack a defensible Truth contract.

Historical browser records are retained as legacy client data and were not
backfilled or trusted.
