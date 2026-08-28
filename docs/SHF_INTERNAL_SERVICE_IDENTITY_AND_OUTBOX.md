# SHF Internal Service Identity and Outbox Foundation

## Scope

Phase 9 Wave 2C adds reusable backend primitives for the existing Hub referral
producer only. It does not add producers, metrics, report migration, or public
publication authority.

## Trust model

`apps/shs-api` is represented as `service:shs-api`. It signs a canonical
request body with an HMAC key identified by `kid`. Agent Fabric validates the
key ID, signature, bounded lifetime, fixed path, and exact binding:

`service:shs-api` + `shf.event.create` + `hub.referral` + `referral.created`

The service identity is separate from the originating human actor. Actor,
tenant, and organization are included in the signed event context and are
validated by Agent Fabric. The service has no Truth verification, approval,
metric, or report administration authority.

## Configuration and rotation

`SHF_INTERNAL_SERVICE_KEYS_JSON` and `SHF_INTERNAL_SERVICE_ACTIVE_KID` are
test/local configuration only. Production requires an approved secret-manager
reference in `SHF_INTERNAL_SERVICE_KEYS_REF`; the signer fails closed in
production when that provider contract is absent. Multiple key IDs are
accepted by the verifier, allowing rotation without changing the protocol.
No real credential is committed.

## Outbox

`apps/shs-api/migrations/007_integration_outbox.sql` defines a PostgreSQL
outbox with a uniqueness constraint on organization, producer, and idempotency
key. Referral creation, referral details, audit event, and outbox insertion use
the existing `withTransaction` boundary. The event is minimized to referral
identity and trusted scope; case notes and referral need details are excluded.

Statuses are `PENDING`, `DELIVERING`, `DELIVERED`, `RETRYABLE`, and
`FAILED_FINAL`. The dispatcher acknowledges delivery only when Agent Fabric
returns an authenticated successful response. Network/5xx/timeout failures
remain retryable; schema and authorization failures are final.

## Canonical handoff

The internal Agent Fabric route calls the existing operational ingestion and
Evidence/Truth projection services. Successful delivery results in an
unverified Source and draft/unapproved Truth claim. It does not verify, approve,
or publish the claim.

## Limitations

The local runtime checkpoint was verified against PostgreSQL 16 database
`shf_trusted_reporting_local_20260825`. Migration `007_integration_outbox.sql`
was applied only to that isolated database, and `npm run
worker:trusted-reporting` delivered one synthetic event through a local Agent
Fabric process using temporary HMAC configuration. Agent Fabric stores were
redirected to `/private/tmp/shf-trusted-reporting-runtime-20260825`; JSONL
operational/Evidence/Truth storage remains development-only and is not
approved production durability.

Production readiness still requires approved secret-manager integration,
production migration execution, backup/restore and monitoring, and managed
worker scheduling. The Hub intake browser Truth fallback has now been removed;
the shared Truth adapter remains because other Hub readers still depend on it.
The Hub browser Truth fallback remains until a deployed cross-service runtime
test proves the full handoff; browser history is not trusted or backfilled.
