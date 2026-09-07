# SHU U6A: Program Completion + Certificate Delivery Finalization

## Decision

U6A keeps the existing U6 certificate authority and closes the three remaining
boundaries with bounded additions:

`Program Authority -> Program Completion Evaluation -> Certificate Eligibility -> Certificate Issuance -> Certificate Presentation -> PDF / Download / Print / Email -> Verification`

Completion, issuance, rendering, delivery, and verification remain separate.

## Program completion authority

`program_completion_records` is the canonical durable completion decision for
the implemented Data Center pathway. It is separate from
`issued_certificates`. Requirements are server-side and versioned. The first
supported definition is `data-center-specialization-11` with the existing
specialization assignment, shared-core lessons, specialization lessons, and
demonstrated competency decisions from the Grade 11 policy. The evaluator is
deterministic, scoped by organization and tenant, fail-closed, and emits the
existing integration-outbox event `program.completed` on the first transition
to `COMPLETED`.

The existing Grade 12 eligibility service remains an educational progression
authority. U6A does not relabel that service as credential issuance. The
bounded completion authority consumes the same canonical requirements and
facts while storing its own completion decision.

Summer STEM currently has a `programs` row but no canonical requirements,
learner completion facts, or completion evaluator. Its program certificate
profile therefore remains registered but blocked with
`PROGRAM_COMPLETION_REQUIREMENTS_UNAVAILABLE`; no fabricated completion rule
was added.

## Certificate eligibility and issuance

Program certificate eligibility now consumes the program-completion service.
Certificate issuance still requires `credential.issue`, remains idempotent by
qualification reference, and persists an immutable certificate record. A
completion record never creates a certificate by itself.

## Email delivery

There was no outbound mail provider in the repository. U6A uses the existing
integration outbox as the canonical request boundary and the existing
`certificate_delivery_events` ledger for delivery history. The certificate
service resolves the learner email from the users authority, never accepts a
caller recipient, renders the already-issued certificate, enqueues a bounded
`certificate.email.requested` event, and records the provider result.

The repository-safe transport is `SHS_CERTIFICATE_EMAIL_TRANSPORT=test` (also
the non-production default). It records a deterministic test provider
reference and attachment hash. Production defaults to fail-closed until a
real provider is configured. Retries reuse the certificate identity and create
new delivery events; delivery failure never changes issuance validity.

## QR verification

The repository had no QR encoder. U6A adds the local `qrcode` encoder package.
The renderer encodes only the existing privacy-safe verification URL, never
learner data, database IDs, evidence, or secrets. The human-readable
verification reference and URL remain on the certificate, so scanning is not
required. QR generation does not create or mutate certificate records.

Verification remains `/certificates/verify/:reference` and returns the existing
minimal public projection. Revoked and replaced records retain their history
and report non-valid status.

## Deferred capabilities

Summer STEM completion remains deferred until canonical requirements exist.
Verified competency credential issuance remains deferred unless a distinct
credential authority supplies that fact. A production mail provider and
automatic event worker remain deployment responsibilities; the domain
contract and test transport are complete without creating a second mail
authority.

## Migration

Migration `109_program_completion_authority.sql` adds only the bounded
`program_completion_records` authority. Migrations 108 and all Reporting
tables remain unchanged.

## U7 readiness

The next wave should recheck Registry compatibility, Solutions compatibility,
Legal canonical API authority, and cross-product composition authority. It
must not weaken fail-closed behavior where those authorities are absent.
