# SHF Public Snapshot Authority Contract

## Purpose

This contract defines the server-owned immutable data snapshot between an
approved public disclosure decision and any future publication authorization.
It initially supports only `report.curriculum.lesson_completion_count.v1`
version `1`.

`public_snapshot` is an evaluated public-safe representation, not Truth,
Evidence, a live report definition, a file, publication authorization, a URL,
or publication.

## Required gates and identity

Creation requires the exact current `PUBLIC_ELIGIBLE` decision, exact current
`PUBLIC_DISCLOSURE_APPROVED` decision, approved policy
`PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` version `1`, the current public-approved
population assertion from the canonical Reporting Service result, valid scope,
and `reports.public_snapshot.generate`. The input result must identify the
report, metric, result reference, period, data-as-of, allowed geography and
program granularity. There is no `latest` or arbitrary report path.

The record binds the exact report/version, opaque evaluated result reference,
reporting period, data-as-of, eligibility decision, disclosure decision, policy
key/version, public representation, tenant/org, actor, and server timestamp.
The existing Reporting Service `report_result_id` is the source-result
reference. It is not treated as a file hash or as a mutable live definition.

## Public-safe representation

Only the representation returned by the approved disclosure evaluator is
stored. A canonical count of `27` stores `27`; a suppressed positive count of
`9` stores `<10` and never stores the exact `9` in the snapshot payload. A safe
canonical zero may store `0`; suppression is not converted to zero and the
canonical metric is never mutated.

Only `EXACT_COUNT` and `SUPPRESSED_LT_10` are persisted for this policy. Periods
are `QUARTERLY` or `ANNUAL`; geography is `COUNTY`, `STATE`, or
`ORGANIZATION_WIDE`; program granularity is `FOUNDATION_WIDE` or
`NAMED_PROGRAM`. Unknown or stale safety metadata fails closed through the
existing disclosure evaluator, including the 12-month freshness rule and all
residual-risk reviews.

## Persistence, integrity, and immutability

PostgreSQL table `report_public_snapshots` is scoped by tenant and
organization. It stores governance-safe metadata and no participant, Truth,
Evidence, source-document, or suppressed exact value. `snapshot_hash` is a
server-computed SHA-256 integrity identity over the snapshot metadata and
public representation. It is a data-snapshot hash, not a PDF/file hash.

Rows are append-only in the API: content, period, policy, decisions, and
representation are never edited. A changed result, period, or governance
decision requires a new snapshot. An explicit request idempotency key is
unique per scope; retrying the same key and semantic request returns the same
row, while conflicting reuse fails.

## Permission and API boundary

`reports.public_snapshot.generate` is distinct from eligibility, disclosure,
policy, export, distribution, and publication permissions. Reads require
`reports.public_snapshot.view`; both are server-scoped. The API is limited to
authenticated `POST /reporting/public-snapshots`, scoped list, and scoped
read-by-ID routes. Client input cannot choose tenant, actor, policy, public
value, or publication state.

## File and publication boundary

No canonical PDF or file bytes are created here. This snapshot is the
immutable public-safe data authority that a later renderer may consume. It
does not create `PUBLICATION_AUTHORIZED`, `PUBLISHED`, a public URL, or an
Impact Data Spine record. The separate publication authority now binds this
snapshot only after institutional release approval and the distinct technical
permission; publication itself remains a later action.

Snapshot generation resolves report identity and policy requirements through
the server-owned public-governance registry. The curriculum registration keeps
the existing `CURRICULUM_PUBLIC_SNAPSHOT` compatibility semantics. The Hub
registration is explicit but remains blocked: its referral policy is not
approved and no snapshot evaluator is registered. A Hub report therefore
cannot create a snapshot merely because it is registered.

## Trust and privacy boundary

The snapshot must originate from the Producer -> Agent Fabric -> Operational
Event -> Evidence -> verified Source -> Truth Spine -> Metric Registry ->
Reporting Service chain. Oracle, frontend state, localStorage, mock/demo data,
and browser calculations cannot create or override it. The current curriculum
path preserves the contributing Truth `public_approved` requirement; snapshot
creation does not mutate Truth. Public Impact Snapshot remains unconnected.

After a separate exact-snapshot publication action, the snapshot may be copied
as-is into the canonical `shf_public_impact_projections` read model. That
projection stores only the public representation and remains distinct from
the snapshot, publication authorization, and any future public UI.
