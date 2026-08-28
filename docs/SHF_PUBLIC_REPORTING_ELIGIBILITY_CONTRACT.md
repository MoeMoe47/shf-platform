# SHF Public Reporting Eligibility Contract

## Purpose

This contract defines the gates required before a canonical report may feed a
public Impact Snapshot or another public SHF reporting surface. It does not
publish data, change `public_approved`, or create a publication endpoint.

The governed path is:

`canonical Truth -> approved metric -> canonical report -> public eligibility
decision -> privacy/disclosure decision -> public_approved -> public-safe
composition -> publication authority -> published`

Each stage is distinct and fail-closed.

## Internal approval is not public eligibility

Verified Source and internally approved Truth establish institutional
eligibility for internal reporting only. They do not establish public
eligibility. `public_approved` is a separate server-owned state and cannot be
inferred from report existence, metric calculation, artifact generation,
internal approval, frontend state, or Oracle output.

The existing Truth Spine model requires public approval to follow verification
and maintains separate public visibility fields. Existing migration and service
guards force migrated/public-facing records to remain non-public until an
explicit governed decision. Public approval must remain auditable and scoped.

## Minimum public eligibility requirements

A public report requires all of the following:

1. canonical producer, authenticated ingestion, Evidence, verified Source, and
   Truth Spine lineage;
2. a Metric Registry definition and canonical Reporting Service result;
3. current report and metric versions with canonical UTC time semantics;
4. internally approved Truth where required by the metric policy;
5. an explicit public eligibility decision for the exact report/metric scope;
6. an approved privacy/disclosure decision;
7. server-owned `public_approved` set through the existing approval authority;
8. tenant/org publication authority and append-only publication audit;
9. public-safe aggregate composition with no participant-level payloads; and
10. any required freshness, correction, and version controls.

Report generation, restricted distribution authorization, or `PUBLIC`
classification alone is insufficient.

For aggregate populations, claim-level `PUBLIC_POPULATION_ELIGIBLE` is a
separate upstream authority from raw Truth `public_approved`. It permits only
contribution to a governed aggregate and never exposes the claim or implies
report eligibility, disclosure approval, or publication.

## Privacy and disclosure decision

The approved `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` policy v1 governs the
initial curriculum report. The public disclosure gate still fails closed
unless that policy and an explicit exact-report decision exist. The policy
evaluates:

- minimum population/group and cohort size;
- program, category, and geography specificity;
- reporting period and longitudinal linkage risk;
- sensitive outcome type and rare-event disclosure;
- re-identification risk from combinations of metrics or filters; and
- whether the aggregate is safe for the intended public audience.

The decision result is `PUBLIC_DISCLOSURE_APPROVED` or
`PUBLIC_DISCLOSURE_BLOCKED`, bound to the exact report version and scope. No
threshold is invented by this contract.

## Public approval and publication authority

`PUBLIC_ELIGIBLE`, `PUBLIC_DISCLOSURE_APPROVED`, `public_approved`,
`PUBLICATION_AUTHORIZED`, and `PUBLISHED` are different authorities. The
frontend, Metric Registry, Reporting Service, Oracle, and generated narrative
may not set any approval or publication state. No publication mechanism is
authorized by this contract.

## Impact Data Spine boundary

The Impact Data Spine remains a public projection layer over approved canonical
Truth and metrics. It is not a competing Truth authority. It must not receive
direct browser, Oracle, static-map, report-builder, or internal-workflow writes.
Its public records must retain canonical provenance and the explicit public
visibility decision.

The current `src/data/shfImpactData.js` adapter contains public-filtering logic.
Its static records are retained as `Sample`/`Draft` demo data but are now
explicitly `publicApproved: false`, so they cannot satisfy the public filter.
They remain noncanonical fixtures and are not promoted into Truth, metrics, or
public-approved counts.

## Candidate report classifications

| Canonical report | Classification | Safe boundary |
| --- | --- | --- |
| `curriculum.lesson.completion_count.v1` | `PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY` | May report lesson completions as activity/progress only; never educational attainment, credentials, or learner success. |
| `hub.referral.created_count.v1` | `PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY` | May report referrals created as process activity; never service delivery, completion, or outcomes. |
| `exchange.funding.commitment_count.v1` | `INTERNAL_ONLY` | Financially sensitive commitment activity; never funding deployed, transferred, settled, received, ROI, or impact. |
| `workforce.employment.started_verified_count.v1` | `PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY` | May report historical verified employment starts; never current employment, retention, wages, placement rate, jobs created, or impact. |

These classifications are report-specific and do not authorize public release.
The curriculum and Hub reports remain blocked until their exact report scopes
pass disclosure review; Hub now has an approved domain policy but no automatic
disclosure approval.

## Public Impact Snapshot

The current Public Impact Snapshot item is a static presentation selector in
`ReportsBriefingsPanel.jsx`; it has no canonical public composition, approved
public report binding, or publication authority. It remains
`PUBLIC_APPROVAL_REQUIRED` and must not consume static values, browser
calculations, localStorage, Oracle estimates, or unapproved Impact Data Spine
records.

Safe wording must preserve source report semantics. Activity metrics must be
described as activity, employment starts as historical verified outcomes, and
funding commitments as commitments. None may be labeled generic “impact”
without a separately governed impact population and metric.

## Agent Fabric and Truth Spine lineage

The public path must remain:

`producer -> Agent Fabric -> Operational Event -> Evidence -> Source -> Truth
Spine -> Metric Registry -> Reporting Service -> public eligibility/disclosure
-> Impact projection`

No public shortcut may read operational records, audit rows, page-local
selectors, report builders, or Oracle summaries as Truth.

## Oracle and AI boundary

Oracle, forecasts, simulations, and generated narrative may summarize eligible
canonical results only. They cannot create values, change formulas, infer
impact, approve disclosure, set `public_approved`, publish, or turn unavailable
data into an estimate.

## Failure rules and next slice

Missing lineage, Source verification, internal approval, public eligibility,
privacy decision, public approval, scope, freshness, or publication authority
returns unavailable/blocked rather than zero or an estimate. Public and
restricted external distribution remain separate paths.

The static Impact Data Spine drift is resolved. A server-owned,
report/version-bound eligibility authority now supports only
`report.curriculum.lesson_completion_count.v1` version 1 through the SHS API.
It records `PUBLIC_ELIGIBLE` or `PUBLIC_INELIGIBLE` with scoped actor, reason,
policy reference, timestamps, immutable history, and audit. This decision means
only that the curriculum activity report may proceed to later disclosure review.
It is not privacy approval, `public_approved`, publication authorization, or
publication. Privacy approval and publication remain separate gates. Public
Impact Snapshot is still not connected.

The report-level authority uses `reports.public_eligibility.manage`, which is
distinct from viewing, exporting, distributing, and Truth claim public
approval. Unsupported reports, versions, noncanonical lineage, missing policy
references, and out-of-scope actors fail closed. The next bounded slice is a
separate disclosure/public approval review; no numeric small-n threshold is
defined by this contract.

## Public disclosure authority status

Public disclosure is a separate exact-report/version-bound authority. The SHS
API models `PUBLIC_DISCLOSURE_APPROVED` and `PUBLIC_DISCLOSURE_BLOCKED`, linked
to a current `PUBLIC_ELIGIBLE` decision and requiring a privacy policy
reference and policy version. The curriculum v1 evaluator additionally
enforces the approved threshold, allowed slices, freshness, suppression, and
residual-risk review. A disclosure decision does not set `public_approved`,
authorize publication, or publish data.

The policy authority is separately implemented for the scoped policy key
`PUBLIC_AGGREGATE_EDUCATION_ACTIVITY`, initially targeting only the curriculum
lesson-completion report. It stores versioned `DRAFT`/`APPROVED`/`RETIRED`
policy records, and v1 is approved only after the required institutional
sign-offs. The policy explicitly governs
group size, geography, program specificity, reporting period,
re-identification, rare events, sensitive outcomes, longitudinal linkage,
cross-metric risk, suppression, repeated-query reconstruction, and freshness.

The curriculum public-safe snapshot authority is now implemented separately.
It requires the exact report result plus current eligibility, disclosure, and
approved policy gates, and stores only the governed representation (`27` or
`<10`, with a safe `0` preserved). It is immutable, scoped, idempotent, and
audited; it does not create a file, publication authorization, public URL, or
Impact Data Spine record.

## Hub referral public review status

`hub.referral.created_count.v1` is canonically registered and may be reviewed
for public use only as referral-creation process activity. It means that a
canonical Hub referral record was created during the reporting period. It does
not mean service delivery, referral acceptance or completion, participant
outcome, successful placement, need resolution, or community impact.

The current classification remains `PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY`,
not public approval. No curriculum education-activity policy is implicitly
reused. A referral-specific policy scope, such as
`PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY`, requires an explicit institutional
decision before any `PUBLIC_DISCLOSURE_APPROVED` decision may be considered.
Threshold, geography, period, category, partner/provider, repeated-release,
combination, rare-event, and re-identification values remain
`GOVERNANCE_DECISION_REQUIRED`; the curriculum v1 values do not transfer by
convenience.

The server now contains an explicit public-governance registration layer for
the curriculum and Hub reports. Eligibility decisions resolve only registered
report/version pairs. Hub registration is not public approval: its required
policy is `PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY`, no approved policy exists,
and its disclosure evaluator is intentionally unavailable. Hub cannot create a
public disclosure decision, snapshot, publication, projection, or public
endpoint until a domain policy and report-specific evaluator are governed.
