# SHF Public Publication Authority Contract

## Purpose

This contract defines the boundary between approval to publish a public SHF
report and the later action that makes a public projection accessible. It
applies first to `report.curriculum.lesson_completion_count.v1` version `1`.

`PUBLICATION_AUTHORIZED` is permission for a specific public-safe snapshot. It
is not `PUBLISHED`, does not create a URL, and does not connect the Public
Impact Snapshot.

## Current decision

**`PUBLICATION_AUTHORITY_READY` for authorization only.**

No reusable canonical publication authority currently exists. The current
Report Service produces a result on demand from mutable Truth inputs. Its
report definition/version and period are not, by themselves, an immutable
public result identity: later Truth changes can change the value while the
definition remains version `1`, and the result does not carry a durable
public-snapshot record with data-as-of and integrity identity.

The immutable public-safe snapshot authority exists as metadata-only
PostgreSQL data. The approved v1 institutional model is `SHF_EXECUTIVE_AUTHORITY`,
with explicit delegation to `PUBLIC_REPORTING_RELEASE_AUTHORITY` where used.
Each authorization requires a current `PUBLIC_REPORTING_RELEASE_APPROVAL`
bound to the exact snapshot.

## Existing publication candidates

| Candidate | Classification | Finding |
|---|---|---|
| `services/shf-agent-fabric/routers/run_report_routes.py` publish route | `PARTIAL_AUTHORITY_REQUIRES_HARDENING` | Admin-key/legacy run publication writes local JSON/PDF files, supports force headers, and creates public URLs. It is not linked to SHF `report_artifacts`, exact report governance decisions, scoped public-safe snapshots, or the SHF publication permission. |
| `services/shf-report-engine` renderers and local `outputs/*.pdf` | `PRESENTATION_ONLY` / `DEMO_ONLY` | Renderer/local output paths are not durable, scoped, immutable SHF public artifacts. |
| `apps/shs-api` `reports.publish` permission | `PARTIAL_AUTHORITY_REQUIRES_HARDENING` | A technical permission is registered, but no canonical publication authorization service, snapshot binding, institutional approver model, or publication audit exists. |
| Impact Data Spine/static public records | `PUBLIC_ROUTE_ONLY` / projection | It may project approved data later; it cannot authorize publication. |

The legacy route must not be promoted or used as the initial curriculum
publication path. Its existence is not evidence of governed publication
authority.

## Required authority chain

The future chain is:

`Truth public_approved -> canonical metric/report -> PUBLIC_ELIGIBLE ->
PUBLIC_DISCLOSURE_APPROVED -> immutable public-safe snapshot ->
PUBLICATION_AUTHORIZED -> publication action -> PUBLISHED`

Each stage is distinct. Publication authorization cannot replace Truth claim
approval, report eligibility, disclosure approval, or the approved disclosure
policy.

## Snapshot identity and immutability

The future snapshot must be server-owned and bind, at minimum, to:

- exact report ID and report definition version;
- exact evaluated result/snapshot ID and snapshot version;
- canonical period and UTC semantics;
- data-as-of timestamp and freshness evaluation;
- exact `PUBLIC_ELIGIBLE` and `PUBLIC_DISCLOSURE_APPROVED` decision IDs;
- approved policy key/version;
- public-safe representation, including `<10` when suppression applies;
- source population/public-approval attestation from the canonical Reporting
  Service;
- tenant/organization scope, generating actor/service, and generation time;
- immutable content identity once actual bytes or a durable projection exists.

Changing the public value, source population, period, policy, or rendered
representation requires a new snapshot/version and new authorization. The
canonical internal metric remains unchanged by suppression.

## Truth and upstream gates

For the curriculum report, the current Metric Registry requires contributing
Truth claims to satisfy `public_approved`. Publication authorization must
obtain a server-owned assertion from the canonical reporting path or an
equivalent governed snapshot manifest; it must not trust a frontend boolean or
duplicate an ad hoc Truth query.

The current exact report gates remain mandatory:

1. registered report and version;
2. valid contributing Truth/public metric population;
3. current `PUBLIC_ELIGIBLE` decision;
4. current `PUBLIC_DISCLOSURE_APPROVED` decision;
5. approved `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` policy and sign-offs;
6. suppression, residual-risk, and freshness checks;
7. valid tenant/org scope and publication authority.

No superseding ineligible, blocked, expired, or revoked decision may be
ignored.

## Permission and institutional authority

Publication authorization requires a distinct narrow technical permission
such as `reports.publication.authorize`; existing `reports.publish` must not be
assumed to have that meaning without an explicit contract decision. It must not reuse
Truth approval, eligibility, disclosure, policy, distribution, or export
permissions.

Technical permission is not proof of institutional authority. The distinct
technical permission is `reports.publication.authorize`; it is necessary but
not sufficient. The exact snapshot must also reference an active executive or
explicitly delegated release authority and a current
`PUBLIC_REPORTING_RELEASE_APPROVAL`. No employee, title, or free-text human
identity is stored as institutional proof.

## Suppression and privacy

Publication authorization must authorize the public-safe representation from
the approved disclosure decision. A canonical count of `9` may authorize only
`<10`; publication metadata must not reveal the suppressed exact value.

The report remains activity-only: lesson completion activity count. It must not
be described as graduation, mastery, credential attainment, educational
success, workforce readiness, or impact. No participant, Evidence, Source, or
Truth detail belongs in a public snapshot.

The approved policy's 12-month freshness rule remains binding. Stale data
requires renewed disclosure review before a new authorization.

## Authorization record and audit

PostgreSQL `report_publication_authorizations` now binds exact
snapshot/report/version/hash, eligibility decision, disclosure decision,
policy reference, institutional authority, release approval, tenant/org,
authorized actor, timestamp, status, purpose, and idempotency key. It supports
`PUBLICATION_AUTHORIZED` and does not create `PUBLISHED`.

Authorization and revocation require append-only audit events. These records
must contain governance references and no report contents. A later publication
action needs a separate factual `PUBLISHED` audit event. Revocation blocks
future use and does not claim to erase an already public copy.

## Impact Data Spine and public snapshot

Impact Data Spine remains projection-only. It cannot approve publication,
change Truth approval, or turn a report into a public record. Public Impact
Snapshot remains blocked until a public-safe snapshot, publication authority,
and actual publication path exist.

## Oracle, AI, and Agent Fabric boundaries

Oracle and AI cannot approve Truth, eligibility, disclosure, publication,
override suppression, or create values from unavailable data. Agent Fabric
remains upstream of Truth and cannot create a publication shortcut.

## Canonical publication action

The bounded publication action is now implemented for the curriculum report.
It requires the exact `PUBLICATION_AUTHORIZED` record, immutable snapshot ID,
version, and SHA-256 metadata hash. It rechecks current eligibility,
disclosure, policy v1, public-population attestation, freshness, and scope,
then writes one append-only `report_publications` row and one
`shf_public_impact_projections` row from the snapshot only.

The action uses distinct `reports.publication.execute`; possession of
`reports.publication.authorize` or legacy `reports.publish` is insufficient.
The factual audit event is `report.published`. This `PUBLISHED` state means
actual publication separately from authorization: the exact snapshot has been
written to the canonical public projection.
only that the exact public-safe snapshot was written to the canonical SHF
public Impact read projection. It does not mean email, file delivery, a public
URL, or external publication.

The public read path is `GET /public/impact/curriculum-lesson-completions`.
It returns only `PUBLISHED` rows with `source_type = CANONICAL_PUBLICATION`;
static/sample records are never merged into this projection. The writer does
not query Truth or recompute metrics, and a suppressed `<10` value remains
`<10`.

## Remaining boundary

The legacy Agent Fabric publish route and hard-coded Foundation page remain
noncanonical presentation paths. The public projection writer is available,
but the existing Foundation page has not been connected in this slice. The
next authorized task is the bounded public read-surface cutover for the single
`Verified Lesson Completions` field. No other metric is included.

Any future publication delivery or file-rendering concern remains a separate
implementation and governance review.

## Registered report boundary

Publication authorization and publication action resolve report identity,
policy key, and public semantic label through the server-owned public-governance
registry. The existing curriculum endpoint and label remain an intentional
public-read adapter. The Hub report is registered for future governance but
cannot reach disclosure, snapshot, authorization, publication, or a public
projection until its referral-specific policy and evaluator exist.
