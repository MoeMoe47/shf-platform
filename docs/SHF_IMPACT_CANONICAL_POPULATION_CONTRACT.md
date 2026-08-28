# SHF Impact Canonical Population Contract

## Purpose

This contract defines the upstream authority required before
`surface.reports.briefings` can consume institutional Impact reporting. Briefing
formats are presentation outputs; they do not define populations, formulas,
Truth, or public eligibility.

## Activity, outcome, and impact

- Activity records that something happened in a workflow. Lesson completion,
  referral creation, and funding commitment are not automatically outcomes.
- An outcome is a separately defined change for an identified subject, such as
  a verified placement or service result, with its own producer and evidence.
- Impact is a governed interpretation of approved outcome populations over a
  defined scope and period. It cannot be inferred from activity volume or
  Oracle recommendations.

`lesson.completed` means lesson activity, `referral.created` means a referral
was created, and `funding_commitment.committed` means an authorized commitment
entered `COMMITTED`. None proves employment, service success, recipient
receipt, program success, ROI, or public benefit.

## Existing canonical facts

| Fact | Producer / Truth | Metric/report | Impact use |
| --- | --- | --- | --- |
| Lesson completed | `curriculum.lesson` / `completed_lesson`; verified Source and approval required | `curriculum.lesson.completion_count.v1` and curriculum Reporting Service | `PUBLIC_ELIGIBLE_NOT_APPROVED` for aggregate use |
| Referral created | `hub.referral` / `referral_created`; verified Source and separate internal approval required | `hub.referral.created_count.v1` and Hub Reporting Service | `PUBLIC_ELIGIBLE_NOT_APPROVED` only through an approved aggregate |
| Funding commitment committed | `shs.exchange` / `funding_commitment_committed`; first-party canonical record, draft/unapproved by default | `exchange.funding.commitment_count.v1` and Exchange Reporting Service | `INTERNAL_ONLY`; not transfer or settlement |

These facts may be composed into a future approved report only while retaining
their original subjects, time semantics, scope, provenance, and claim meaning.
They must not be copied into a generic `ImpactRecord`.

## Public eligibility

Canonical, verified, or internally approved data is not automatically public.
Public use requires the existing explicit public-eligibility/public-approval
rule, appropriate aggregation and privacy review, and `public_approved` where
the governing contract requires it. Current Impact Center and Ohio map data is
suppressed or pending because those conditions are not satisfied. No public
state changes here.

## Missing Impact domains

| Domain | Current condition | First missing layer |
| --- | --- | --- |
| Verified workforce/service outcomes | Placement browser counters and mock/advisory outcomes; no authoritative outcome population | `BACKEND_AUTHORITY_REQUIRED` / `PRODUCER_REQUIRED` |
| Attendance/service participation | Dashboard/demo values without session, enrollment, status, or expected-opportunity authority | `PRODUCER_REQUIRED` / `POPULATION_REQUIRED` |
| Credential issuance | Credential-looking values without proven issuance record or producer | `BACKEND_AUTHORITY_REQUIRED` |
| County/community impact | Static county/map records without an approved producer/provenance chain | `PRODUCER_REQUIRED` |
| Funding transfer/settlement | Commitment authority exists, but no transfer or settlement domain exists | `BACKEND_AUTHORITY_REQUIRED` |

Oracle, simulation, forecast, and generated narrative outputs remain advisory;
they cannot create facts, metrics, approval, or public eligibility.

## Population strategy

Use multiple domain-specific populations composed later into reports:

1. learner activity and completion;
2. referral/process activity;
3. verified outcome or placement records;
4. funding commitments, with transfer/settlement kept separate.

Each population needs a stable subject, authoritative scope, event time,
producer, Evidence/Source/Truth policy, approval state, and metric definition.
Rates additionally require an authoritative denominator. No generic Impact
population is authorized.

## Impact Data Spine ownership

The Impact Data Spine is a public projection layer over approved canonical
Truth/metrics. It is not a competing Truth authority and must not be mutated by
the briefing panel, Oracle, reports, browser state, or static map data.

The first canonical publication writer writes only from an exact immutable
public snapshot into `shf_public_impact_projections`. It does not calculate a
metric, approve data, or merge retained static/sample map records. The public
projection uses the safe activity label `Verified Lesson Completions`; lesson
completion remains an activity count, not educational impact.

## Report-format separation

`canonical domain facts → approved metrics → canonical reports → presentation formats`

`Board Brief`, `Grant Narrative`, `Donor Summary`, `Public Impact Snapshot`,
and `Program Health Memo` are presentation formats only. The current panel
renders static `EXPORT_ITEMS`; it does not define a population or metric and
must not be connected to Reporting Service yet.

## Minimum viable Impact reporting set

The smallest defensible first set is the already-proven domain-specific
activity set: lesson completion, referrals created, and historical funding
commitments, each under its original semantics and approval rules. This is not
an outcome or impact claim. Verified outcomes require a separate backend
producer and population contract.

## Open blockers and next slice

`surface.reports.briefings` lacks a canonical producer and Impact population.
Its accurate registry status is `PRODUCER_REQUIRED`, not an actionable
Reporting Service migration. The next authorized slice is to define one real
impact/outcome domain and its backend-owned producer. Do not implement a
generic Impact Record, endpoint, metric, public projection, or briefing
 migration in this contract slice.

The first canonical publication writer writes only from an exact immutable
public snapshot into `shf_public_impact_projections`. It does not calculate a
metric, approve data, or merge retained static/sample map records. The public
projection uses the safe activity label `Verified Lesson Completions`; lesson
completion remains an activity count, not educational impact.

The public Foundation surface consumes that projection through
`GET /public/impact/curriculum-lesson-completions` for one field only. Empty,
unpublished, or unavailable projection data is shown as unavailable; it is not
replaced by retained static Impact fixtures. Other public claims remain outside
this canonical path.

## Hub referral public progression review

The canonical Hub metric `hub.referral.created_count.v1` and report
`report.hub.referral.created_count.v1` have an institutionally approved
`PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY v1` policy, but remain blocked from
public projection until an exact public disclosure decision passes. The metric
represents referral creation activity only. It must not be described as people
served, service delivery, referral completion, participant outcome, successful
placement, need resolution, or impact.

The curriculum policy `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY v1` does not govern
Hub referrals automatically. Referral-specific privacy review must address
program and partner/provider specificity, geography, narrow periods, repeated
releases, cross-metric combinations, rare events, and contextual
re-identification. No curriculum threshold, geography, or reporting-period
value is inherited without an explicit institutional governance decision.

The server now has an explicit multi-report public-governance registration
layer and a registered Hub referral evaluator. Hub v1 allows only approved
broad aggregate scopes and blocks sensitive referral dimensions; unknown or
unreviewed conditions fail closed. No Hub public snapshot, publication,
projection, or public UI connection is created automatically. The Hub referral
field remains canonical for internal Reporting Service use.

### Hub Truth public-approval boundary

Hub Truth claims are participant/case-linked and the Truth `public_approved`
flag controls unauthenticated raw Truth claim and package routes. The separate
aggregate-only population state requires an exact institutional sign-off and
must never expose Hub claim, participant, Evidence, or Source identifiers.

Registered aggregate metrics now resolve the separate
`PUBLIC_POPULATION_ELIGIBLE` authority. The Hub metric may use that authority
without making the participant-linked Truth claim raw-public; curriculum keeps
dual-read compatibility with existing legitimate `public_approved` records.
Population approval requires a typed institutional authority and exact
`PUBLIC_AGGREGATE_POPULATION_APPROVAL` claim/version sign-off.
