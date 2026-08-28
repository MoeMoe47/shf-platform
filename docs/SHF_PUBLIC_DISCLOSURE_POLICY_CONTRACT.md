# SHF Public Disclosure Policy Contract

## Purpose

This contract defines the governed policy authority used to evaluate public
disclosure of an exact canonical report/version. A policy is separate from
report data, public eligibility, disclosure decisions, Truth `public_approved`,
publication authorization, and publication.

The path remains:

`policy -> exact report eligibility -> disclosure decision -> public_approved -> publication authorization -> published`

## Initial scope

The registered scopes are `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` for the exact
curriculum report and `PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY` for the exact
Hub referral-created report. Neither governs workforce, financial commitments,
or all SHF reports.

## Authority and lifecycle

Policy records are PostgreSQL-backed, scoped, server-owned, and auditable.
Supported lifecycle states are `DRAFT`, `APPROVED`, and `RETIRED`. Approved
versions are immutable; substantive changes require a new policy version.
Policy management uses `reports.public_disclosure_policy.manage`, distinct
from report disclosure review and Truth public approval.

The policy schema is complete for the first decision packet's identified
representation needs. In addition to the baseline rule fields, structured
policy definitions require `display_mode`,
`complementary_suppression_required`, `reconstruction_risk`,
`freshness_rules`, and `combination_risk_rules`. Institutional approval is
represented separately by scoped sign-off records with an explicit authority
reference; the technical API actor is not treated as the institutional policy
authority. These structures do not supply substantive values or authorize
disclosure.

Policy v1 is now institutionally approved for the exact curriculum report and
the exact Hub referral-created report. Hub v1 uses the same three governed
sign-off categories
`PRIVACY_DATA_GOVERNANCE`, `LEGAL_PRIVACY_REVIEW`, and `EXECUTIVE_APPROVAL`.
Hub v1 allows only organization-wide, state, and county geography;
foundation-wide and named Hub program granularity; quarterly and annual
periods; exact counts at `10+`; `<10` for positive counts below the threshold;
and `0` only for a safe canonical zero. Category, service type, provider,
partner, case, individual, municipality, neighborhood, site, location, and
custom narrow slices are not authorized. Policy approval remains distinct from
report disclosure review and does not set Truth `public_approved` or authorize
publication.

## Governed rule dimensions

An approved policy must explicitly address minimum group/cohort size,
geography, program specificity, reporting period, re-identification, rare
events, sensitive outcomes, longitudinal linkage, cross-metric combination
risk, suppression/complementary suppression, repeated-query reconstruction,
staleness, and whether exact counts or ranges are allowed. For v1, the
approved minimum group size is `10`, allowed public geography is `COUNTY`,
`STATE`, and `ORGANIZATION_WIDE`, allowed program granularity is
`FOUNDATION_WIDE` and `NAMED_PROGRAM`, and allowed periods are `QUARTERLY`
and `ANNUAL`. Display modes are `EXACT_COUNT` and `SUPPRESSED_LT_10`.
Complementary suppression and residual-risk review remain required.

## Resolution and disclosure boundary

`resolveApprovedPublicDisclosurePolicy(reportId, reportVersion, tenantId,
organizationId)` returns the current exact-scope approved policy or no policy.
No policy resolves when the report is unknown, out of scope, unapproved, or
retired. Disclosure approval requires exact `PUBLIC_ELIGIBLE` lineage, the
approved policy reference/version, and the v1 machine and residual-risk gates.
A count below 10 is represented publicly as `<10`; the internal canonical
count remains unchanged.

Policy approval does not set Truth `public_approved`, publish data, or connect
the Impact Data Spine. Oracle, frontend, metric, report, and projection layers
cannot create or approve policies.

## Registered public reports

The server-owned public-governance registry contains only explicit report /
version registrations. The curriculum registration resolves
`PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` and preserves its existing evaluator,
snapshot, publication, and public-read behavior. The Hub registration resolves
`PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY` and has the
`HUB_REFERRAL_ACTIVITY_V1` evaluator. Registration alone cannot produce
`PUBLIC_DISCLOSURE_APPROVED`; the exact Hub report still requires
`PUBLIC_ELIGIBLE`, the approved policy, required sign-offs, Truth
`public_approved` population eligibility, and all residual-risk reviews.

Policy lookup is exact to the registered report and version. Unknown or
unregistered reports fail closed, and a policy for one registered report
cannot authorize another. The policy registry is configuration, not executable
policy code; substantive evaluation remains in the governed policy service.
