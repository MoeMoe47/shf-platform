# SHF Verified Outcome Authority Contract

## Purpose

This contract defines the minimum authority required before a workforce or
service outcome can support canonical Impact reporting. It does not create an
outcome domain, producer, metric, Evidence, Truth claim, or report.

## Candidate domains reviewed

| Candidate | Repository evidence | Classification |
| --- | --- | --- |
| Referral created | Canonical Hub case/referral record and `referral.created` lineage | `OPERATIONAL_ONLY` activity; not a service outcome |
| Lesson completed | Canonical curriculum completion lineage | `OPERATIONAL_ONLY` activity/progress fact for this review |
| Funding commitment | Canonical Exchange commitment and `funding_commitment.committed` lineage | `OPERATIONAL_ONLY` financial activity; not an outcome |
| Placement KPI | `src/pages/admin/PlacementKPIs.jsx` and `src/shared/integrations/metricsClient.js` localStorage counters | `DEMO_ONLY` / `BACKEND_AUTHORITY_REQUIRED` |
| Career proof outcomes | `src/components/ProofOutcomesSection.jsx` props and client calculations | `DEMO_ONLY` / `BACKEND_AUTHORITY_REQUIRED` |
| Outcome submission `JOB_90D` | Agent Fabric `/api/v1/outcomes/submit`, `outcome_submissions`, artifact hash, and proof routes | `CANONICAL_DOMAIN_CAN_BE_HARDENED`, not institutionally canonical yet |
| Credential earned | Dashboard/card and mock/client arrays; no proven issuance authority | `BACKEND_AUTHORITY_REQUIRED` |
| Attendance/service participation | SHS live-session attendance records exist, but no Impact outcome contract | `OPERATIONAL_ONLY` / `POPULATION_REQUIRED` |

## Strongest candidate and decision

The strongest existing candidate is a workforce outcome submission carrying
`participant_id`, `program_id`, `outcome_type`, artifact references, and an
evidence hash. It is not safe to name that fact `employment_started`,
`employment_retained_90d`, or `verified_placement` because `JOB_90D` is not
defined by a governed SHF lifecycle and the current verifier accepts every
submission under an MVP rule.

The selected candidate is therefore **not yet a canonical outcome fact**. The
first required slice is backend authority hardening, followed by an explicit
external verification decision for the employment claim.

## Exact semantic boundary

The current submission proves only:

“An outcome submission payload for participant P, program G, and outcome type X
was received with an artifact/evidence hash.”

It does not prove:

- a job application;
- a job offer;
- offer acceptance;
- employment started;
- employment retained for 90 days;
- wage or income improvement;
- service delivery or service success;
- program completion;
- community impact or public benefit.

`referral.created`, `lesson.completed`, and `funding_commitment.committed`
retain their existing activity/process meanings and cannot be relabeled as
outcomes.

## Required canonical subject and ownership

Before a workforce outcome is canonical, the backend must own:

- `outcome_id` and an immutable version/history identity;
- participant/learner subject reference, with privacy-safe indirection;
- tenant and organization derived from the authenticated principal;
- responsible recorder/actor derived server-side;
- related program/cohort/enrollment reference;
- precisely defined outcome type and occurrence timestamp;
- lifecycle and correction status;
- verification status and source reference;
- audit identity and timestamps;
- deterministic idempotency.

The current Agent Fabric submission store has participant and program IDs but
does not establish tenant/org ownership, authenticated actor authority, or an
approved PostgreSQL persistence boundary. Its SQLite fallback and JSONL proof
stores are development abstractions, not canonical institutional persistence.

## Lifecycle and verification

No new lifecycle is authorized by this document. At minimum, the future domain
decision must distinguish receipt of a submission from verification of the
underlying fact. `RECEIVED` and `VERIFIED` in the current MVP code must not be
treated as an institutional state machine because the verifier currently
accepts submissions without the required evidence policy.

For an employment outcome, the business owner must choose one precise fact:
application, offer, acceptance, employment start, or retention interval. Each
requires its own event meaning and allowed transitions. Employment start or
retention may require employer or other external confirmation; a first-party
submission alone is not automatically sufficient.

## Correction and reversal

The future record must preserve prior states and audit history. Corrections
must create an immutable version or linked corrective record. Destructive
overwrite, silent status changes, and reusing a submission ID for a different
participant or outcome are prohibited. Retraction of a mistaken outcome must
not erase the original audit trail.

## Privacy boundary

Producer payloads must use stable privacy-safe subject references and omit
names, contact details, employer details, health/service details, wages, and
document contents unless a separately approved policy requires them. Artifact
hashes and evidence references are not a substitute for a defined verification
authority.

## Future producer candidate

No producer is implemented or authorized in this slice. A future candidate
could be repository-native `shf.workforce` with a precisely defined event such
as `employment_started.v1` or `employment_retained.v1`, but the event name,
subject, external verifier, scope, idempotency, and transaction relationship
require business-owner approval first. `JOB_90D` must not be promoted by name
alone.

## Impact and public boundary

The candidate is an **OUTCOME** only if the underlying business fact is
precisely defined and verified. It is not automatically IMPACT. Impact claims
such as improved income, community benefit, ROI, or program success require
separate evidence and interpretation.

No outcome is public-eligible in this contract. Future public use requires
canonical Evidence, Source verification, Truth, internal approval, privacy
review, explicit public eligibility, and `public_approved` where required.
The Impact Data Spine remains a public projection layer over approved
Truth/metrics and is not an outcome source.

## Open blockers and next bounded slice

1. Establish an authenticated, tenant/org-scoped backend outcome record in an
   approved durable store.
2. Define whether `JOB_90D` means employment start or retention and identify
   the authoritative verifier.
3. Define lifecycle, correction, audit, and idempotency rules.
4. Only then review a narrow producer event and its Evidence/Truth eligibility.

The immediate next authorized task is backend outcome authority hardening for a
single explicitly chosen employment fact. Do not create a generic
`ImpactRecord`, producer, metric, public projection, or Reporting Service
endpoint before that decision.

## Employment-start authority implementation

The first authorized workforce fact is `EMPLOYMENT_STARTED`: a participant
began employment on an explicit `employment_started_at` date, supported by an
authorized verification source. It is an `OUTCOME`, not an impact claim, and
does not establish retention, wages, job quality, ROI, or community benefit.

The SHS API now owns this fact in PostgreSQL table
`workforce_employment_outcomes`, via migration
`011_workforce_employment_outcomes.sql`. The record is tenant/org scoped and
contains privacy-safe participant and optional program references, the explicit
employment-start timestamp, lifecycle and verification fields, optional opaque
proof reference/hash, server-owned actor/timestamps, and an optimistic version.
No names, contacts, employer narrative, wage, health data, or document contents
are persisted.

Authenticated routes support submit, scoped read, verify, reject, and withdraw.
Client identity, scope, lifecycle, verification, timestamps, IDs, and versions
are not authoritative. Records begin in `verification_pending`; only employer
confirmation, official employer records, payroll/employment documents, or
external system confirmation may transition to `verified`. Participant or staff
attestations remain pending. Withdrawals and rejections preserve the record and
append-only audit history.

Every mutation is transaction-wrapped with audit. Stale versions and
cross-tenant/cross-organization access are rejected or concealed. The legacy
Agent Fabric SQLite/fallback submission and `JOB_90D` paths remain
legacy/operational input only; neither is canonical, and `JOB_90D` is not
retention or employment-start proof. No Evidence, Truth, metric, report, or
public projection is emitted by this implementation.

The future producer boundary is verified employment start, not submission:
repository-native `shf.workforce` with a narrowly defined
`employment_started.verified` event. That producer is now implemented only on
the canonical `verification_pending` -> `verified` transition, with the
existing SHS transactional outbox. The event uses `employment_started_at` as
business occurrence time, keeps verification time separate, is idempotent by
outcome ID, and has no downstream ingestion, Evidence, Truth, metric, report,
or public projection.
## Authenticated ingestion boundary

The verified producer now reuses the existing
`/shf/internal/ingestion/events` HMAC service-authenticated path and
`worker:trusted-reporting` outbox delivery. The exact binding is
`shf.workforce` + `employment_started.verified` v1. Agent Fabric validates the
service identity, binding, strict minimized payload, canonical subject, strong
verification source, and deterministic idempotency key before persisting one
Operational Event. Replays return the existing event and do not duplicate it.

The event now uses the existing bounded Evidence/Source/Truth projector. It
creates minimized Evidence, an unverified first-party canonical-record Source,
and a narrow historical `employment_started_verified` Truth claim. The claim
starts draft, internally unapproved, and non-public; no approval or public
eligibility is inferred. `occurred_at` remains the employment start date;
ingestion time is not substituted. Invalid signatures, service identity, scope,
bindings, schema, and pending participant/staff attestations fail closed.

## Verified employment-start metric boundary

The first and only workforce metric authorized after this lineage is
`workforce.employment.started_verified_count.v1`. It counts distinct canonical
`workforce_employment_outcome` subject IDs whose historical
`employment_started_verified` claims have verified Source metadata and
authorized internal approval, using `occurred_at = employment_started_at` in an
inclusive UTC window. It counts outcomes rather than unique participants, and
replays, Evidence rows, Source rows, and Truth versions do not create extra
starts.

This metric does not establish current employment, placement rate, 90-day
retention, wages, transfer, settlement, ROI, impact, or public benefit. The
Metric Registry returns unavailable when required eligibility cannot be
evaluated and returns zero only for a successfully evaluated empty eligible
population. No Reporting Service endpoint, report, or public exposure is part
of this metric slice; the next task is a Reporting Service review for this
metric only.

## Verified employment-start Reporting Service

The registered metric is exposed through the single internal report
`report.workforce.employment.started_verified_count.v1` at
`GET /shf/reports/workforce.employment-started-verified-count`. The report
contains one metric binding and no formula; calculation authority remains the
Metric Registry. It requires the existing `shf.report.read` permission and
derives organization scope from the authenticated actor.

The service preserves verified Source and internally approved Truth
eligibility, historical UTC `occurred_at` windows, distinct outcome-ID
counting, and fail-closed unavailable behavior. It is internal-only and does
not create placement, current-employment, retention, wage, transfer,
settlement, ROI, impact, or public-reporting semantics. Reports & Briefings
still requires an explicit composition decision before this report is used by
that presentation surface.
