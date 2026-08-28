# SHF Truth Public Population Eligibility Contract

## Purpose

`PUBLIC_POPULATION_ELIGIBLE` is a claim-level governance decision that permits
one exact canonical Truth claim version to contribute to an approved aggregate
public metric population. It is separate from all other public gates.

`public_population_eligible != public_approved != PUBLIC_ELIGIBLE !=
PUBLIC_DISCLOSURE_APPROVED != PUBLICATION_AUTHORIZED != PUBLISHED`.

## Authority separation

`public_approved` remains the explicit authority for direct raw Truth public
visibility. Raw Truth routes continue to filter only with
`truth_spine_service.is_publicly_visible()`, which requires `public_approved`,
current verified status, non-superseded version, and valid scope.

`PUBLIC_POPULATION_ELIGIBLE` does not expose raw Truth, subject identifiers,
Evidence, Source, or private metadata. It does not create report eligibility,
disclosure approval, a snapshot, publication authorization, or publication.

## Predicate registration

Only explicitly registered predicates may enter review:

- `curriculum_completion` / `completed_lesson`;
- `hub_referral_created` / `referral_created`.

Registration permits governed review only. It does not grant eligibility.
Unregistered, mock, demo, seed, and browser-derived records fail closed.

## Claim/version binding and prerequisites

The authority is an append-only record bound to exact `truth_claim_id` and
`truth_version`, predicate, tenant, organization, actor, and institutional
authority reference. Approval requires:

1. current exact claim/version;
2. verified Source and complete canonical lineage;
3. current non-superseded Truth claim;
4. internal approval where the metric population requires it;
5. valid server-derived tenant/organization scope;
6. registered predicate;
7. no unresolved Source/Evidence conflict; and
8. dedicated `truth.public_population.approve` permission.

Institutional authority is represented by a server-owned governed authority
record of type `SHF_PRIVACY_DATA_GOVERNANCE_AUTHORITY`. Approval additionally
requires an exact active `PUBLIC_AGGREGATE_POPULATION_APPROVAL` sign-off bound
to the claim/version, predicate, tenant, organization, and authority. Clients
cannot create eligibility by submitting an authority string or boolean.
Optional delegated authority must reference an active primary authority.
Authority and sign-off management permissions are distinct from
`truth.public_population.approve`.

## Persistence, audit, and revocation

The production owner is the SHS PostgreSQL governance boundary. Migration
`027_truth_public_population_governance.sql` stores append-only authority,
claim sign-off, eligibility-transition, and governance-audit rows with exact
scope and claim/version indexes. The Truth claim payload remains file-backed
and owned by Agent Fabric; it is not duplicated in these tables. Development
and tests may use the explicit JSONL adapter. Production mode selects only
PostgreSQL and fails closed when its DSN, driver, or migrated schema is
unavailable; it never silently falls back to JSONL.

PostgreSQL uniqueness constraints make active claim/version sign-offs and
eligibility idempotent under concurrent retries. Current-state resolution
still revalidates the current Truth claim, Source, internal approval, active
authority, active sign-off, scope, and version. Governance audit rows are the
durable authority history; Truth history JSONL remains a secondary mirrored
history until its own production durability boundary is established.
Records use `PUBLIC_POPULATION_ELIGIBLE` and
`PUBLIC_POPULATION_REVOKED`; no mutable boolean is added to Truth.

Approval and revocation append `claim.public_population_approved` and
`claim.public_population_revoked` Truth history events. Revocation excludes a
claim from future aggregate populations, does not alter its value, internal
approval, or raw `public_approved`, and preserves history. A new substantive
Truth version never inherits eligibility.

Approval is per claim/version. No wildcard or batch approval is implemented.

## Curriculum compatibility

The current curriculum public path uses a dual-read compatibility adapter:
`public_population_eligible` may satisfy the aggregate population contract,
while existing legitimate `public_approved` curriculum claims remain accepted
until an explicit migration creates equivalent population records. Raw Truth
visibility remains controlled only by `public_approved`.

## Hub behavior

The intended safe Hub state is:

`internal_approval_status = approved`,
`public_population_eligible = true`, and
`public_approved = false`.

That state may contribute to a future governed Hub aggregate but must not be
returned by raw public Truth routes. Hub policy, report eligibility, disclosure,
snapshot, publication, and UI gates remain separate. No real Hub claims are
approved by this implementation slice.

## Metric and report boundaries

Registered public aggregate metrics use population eligibility rather than raw
Truth visibility. Curriculum is dual-read for compatibility; Hub requires the
new authority. The metric calculator never mutates claim values and only emits
aggregate results. Report-level public governance remains required downstream.

## AI, Oracle, and clients

Oracle, AI, frontend state, and request-body `public_approved` or scope fields
cannot create, approve, revoke, or infer population eligibility. The internal
API accepts only claim version and reason; actor, tenant, organization, and
institutional authority are server-derived.

## Migration strategy and next step

Strategy: `DUAL_READ_TRANSITION` for curriculum, with no silent historical
reinterpretation. Existing raw public Truth behavior is preserved. The next
bounded task is a controlled review of legitimate Hub claim population
approvals using these sign-off records, then Hub report eligibility/disclosure
separately.

Existing JSONL files are development/test fixtures only and are not imported
automatically. Curriculum dual-read compatibility remains in place; no
historical curriculum claim migration is performed here. Backup, restore,
retention, and monitoring for the PostgreSQL governance tables are deployment
obligations before production claim approval.

Runtime proof was completed against the explicitly configured local PostgreSQL
16.12 `shs_dev` database after applying migration 027. Synthetic scoped claim
IDs survived repository/process-boundary reads; concurrent duplicate sign-off
attempts produced one active row and returned its authoritative ID; eligibility
revocation persisted; raw public visibility remained false. Migration rerun
was idempotent. The proof did not modify real Hub or curriculum claims.
