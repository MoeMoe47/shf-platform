# Public Aggregate Hub Referral Activity Policy Decision Packet

## 1. Purpose

This packet records the institutional decisions for the first aggregate Hub
referral-creation disclosure policy. It approves policy governance values only;
it does not create a disclosure decision, generate a public snapshot, authorize
publication, publish Hub data, or connect the public UI.

## 2. Governed report identity

**Policy key:** `PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY`

**Policy version:** `1` (`APPROVED`; institutionally approved)

**Governed report:** `report.hub.referral.created_count.v1`, report version `1`.

**Metric:** `hub.referral.created_count.v1`, metric version `1`.

**Registration:** The server-owned public-governance registry records this
report as `POLICY_REQUIRED`, with semantic class
`REFERRAL_CREATION_ACTIVITY`, Truth public-population requirement enabled, and
the registered `HUB_REFERRAL_ACTIVITY_V1` disclosure evaluator.

The approved policy values are: minimum exact-count population `10`; positive
counts below `10` display as `<10`; safe canonical zero may display as `0`;
allowed geography is `ORGANIZATION_WIDE`, `STATE`, or `COUNTY`; allowed
program granularity is `FOUNDATION_WIDE` or `NAMED_HUB_PROGRAM`; allowed
periods are `QUARTERLY` or `ANNUAL`; display modes are `EXACT_COUNT`,
`SUPPRESSED_LT_10`, and `UNAVAILABLE`; freshness is `12` months; and
complementary suppression plus residual-risk review are required.

Referral category, service type, provider, partner, case, individual, and more
granular geography are blocked for v1. Registration and policy approval do not
publish data or create a snapshot.

## 3. Canonical semantic definition

Hub Referral Created means that a canonical referral creation event was
recorded. The aggregate is a count of canonical referral creation activity
within an approved scope and reporting period.

It does not establish service delivery, service completion, referral
acceptance, successful referral, participant service, outcome, placement,
benefit receipt, need resolution, or community impact.

## 4. Data lineage

The required lineage is:

`CaseService.createReferral() -> transactional outbox -> authenticated
ingestion -> Operational Event -> Evidence -> Source -> Truth Spine ->
hub.referral.created_count.v1 -> report.hub.referral.created_count.v1`

Public progression must additionally require the existing Truth
`public_approved` population gate, exact report-level public eligibility,
approved disclosure policy and decision, immutable snapshot, and later
publication authority. No browser, static fixture, localStorage value, Oracle
output, or mock may enter this path.

## 5. Privacy threat model

Referral activity can reveal participation in a service or need even when only
an aggregate is displayed. Review must cover small programs, counties, sites,
partners, providers, referral categories, sensitive service types, narrow time
windows, rare referral patterns, repeated releases, overlapping slices,
longitudinal differences, auxiliary public information, and combinations with
curriculum, workforce, demographic, or other Hub metrics.

The risk is not limited to exact counts. A suppressed value may be reconstructed
from totals, neighboring cells, repeated queries, or successive reporting
periods. Aggregate status alone is not a public-safety determination.

## 6. Comparison with curriculum policy v1

| Curriculum control | Classification for Hub | Decision status |
| --- | --- | --- |
| Minimum exact-count threshold | `REUSABLE_WITH_HUB_CONFIRMATION` | Approved Hub value is `10`; not inherited silently |
| Below-threshold representation | `REUSABLE_WITH_HUB_CONFIRMATION` | Approved positive suppressed value is `<10` |
| Complementary suppression | `DOMAIN_AGNOSTIC_REUSABLE` | Required for referral totals and related slices |
| Geography restrictions | `HUB_SPECIFIC_DECISION_REQUIRED` | Approved: organization-wide, state, county |
| Program specificity | `HUB_SPECIFIC_DECISION_REQUIRED` | Approved: foundation-wide, named Hub program |
| Reporting periods | `REUSABLE_WITH_HUB_CONFIRMATION` | Approved: quarterly and annual |
| Re-identification review | `DOMAIN_AGNOSTIC_REUSABLE` | Required; referral context may increase residual risk |
| Rare-event review | `DOMAIN_AGNOSTIC_REUSABLE` | Required |
| Reconstruction/repeated-query review | `DOMAIN_AGNOSTIC_REUSABLE` | Required |
| Longitudinal review | `DOMAIN_AGNOSTIC_REUSABLE` | Required |
| Cross-metric review | `HUB_SPECIFIC_DECISION_REQUIRED` | Required before combining referral counts |
| Freshness | `REUSABLE_WITH_HUB_CONFIRMATION` | Approved maximum age is `12` months |
| Display mode | `REUSABLE_WITH_HUB_CONFIRMATION` | Approved: exact, `<10`, unavailable; no ranges |
| Unknown conditions | `DOMAIN_AGNOSTIC_REUSABLE` | Fail closed |
| Institutional sign-offs | `DOMAIN_AGNOSTIC_REUSABLE` | Reuse privacy/data-governance, legal/privacy, and executive sign-offs unless changed by governance |

The approved curriculum policy `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY v1` is not
applicable to Hub referrals by registration, policy resolver, or disclosure
service.

## 7. Threshold options

| Option | Privacy benefit | Utility | Complexity and risk | Status |
| --- | --- | --- | --- | --- |
| A. Reuse minimum exact-count threshold `10` | Familiar baseline; limits the smallest exact cells | Comparable to curriculum | May understate referral sensitivity or fail for sensitive categories | **SELECTED FOR V1** |
| B. Use a higher referral threshold | More conservative for service-participation inference | More suppression and less granularity | Requires a future institutional change | `NOT SELECTED` |
| C. Category-sensitive threshold model | Addresses higher-risk referral categories differently | Preserves more low-risk activity detail | Requires a governed category taxonomy and more evaluator logic | `NOT SELECTED; FUTURE POLICY` |

The selected v1 threshold is `10`. Category-sensitive thresholds are not part
of v1. Any future change requires a new policy version.

## 8. Suppression options

V1 suppresses positive counts below `10` as `<10`; a safe canonical zero may
remain `0`. Category, provider, partner, and service-type slices are blocked,
and complementary suppression is required where related slices could permit
reconstruction.

This preserves the approved boundary: do not expose an exact low count and
never replace a suppressed value with zero or an estimate.

## 9. Geography decision matrix

| Geography | Primary risk | Approved v1 status |
| --- | --- | --- | --- |
| Organization-wide | Lowest relative granularity, but small total populations remain possible | `ALLOW_WITH_REVIEW` |
| State | Cross-program and population-size variation | `ALLOW_WITH_REVIEW` |
| County | Small service populations and local participation inference | `ALLOW_WITH_REVIEW` |
| Municipality | Narrower populations and auxiliary-data risk | `BLOCK_V1` |
| Site/location | Direct service-participation inference | `BLOCK_V1` |

The institution must approve the allowed geography set; no county or state
scope is inherited from curriculum policy.

## 10. Program and service granularity matrix

| Dimension | Approved v1 status |
| --- | --- | --- |
| Foundation-wide | `ALLOW_WITH_REVIEW` |
| Named Hub program | `ALLOW_WITH_REVIEW` after population and sensitivity review |
| Referral category | `BLOCK_V1` |
| Service type | `BLOCK_V1` |
| Provider | `BLOCK_V1` |
| Partner | `BLOCK_V1` |
| Case/individual | `BLOCK_V1`; no case-level public output |

The repository may contain referral category, program, provider, partner, and
service metadata. Those values must not be placed in a public aggregate until
their sensitivity classification is governed.

## 11. Reporting-period matrix

| Period | Risk | Approved v1 status |
| --- | --- | --- | --- |
| Annual | Lowest reconstruction pressure | `ALLOW_WITH_REVIEW` |
| Quarterly | Useful transparency with moderate risk | `ALLOW_WITH_REVIEW` |
| Monthly | Narrow-window and repeated-release risk | `BLOCK_V1` |
| Weekly | High small-cell and longitudinal risk | `BLOCK_V1` |
| Daily | Direct activity-timing inference | `BLOCK_V1` |
| Custom | Arbitrary reconstruction and query risk | `BLOCK_V1` |

The permitted v1 set is annual and quarterly. These values are approved for Hub
v1 and are not inherited from curriculum.

## 12. Risk controls

The policy must require explicit review of:

- rare referral categories or unusually distinctive values;
- contextual re-identification using known participant populations or public auxiliary data;
- repeated releases and overlapping geography/program/time slices;
- longitudinal differences that reveal suppressed participation;
- complementary suppression where totals or neighboring cells permit subtraction;
- combinations with workforce, curriculum, geography, age/cohort, partner, provider, or other Hub metrics; and
- stale data and changes in referral taxonomy or sensitivity.

**Recommendation — not approved policy:** use hybrid governed review, with
objective controls enforced by the server and residual contextual,
rare-event, reconstruction, longitudinal, and combination risks requiring an
authorized reviewer.

## 13. Freshness options

Hub v1 uses a maximum data age of `12` months. Policy effective dates, report
data freshness, and disclosure decision expiration remain distinct.

Reporting-period and data-as-of metadata are required, with renewed review when
the approved freshness condition is not met.

## 14. Public display modes

Candidate modes are `EXACT_COUNT`, `SUPPRESSED_BELOW_THRESHOLD`, and
`UNAVAILABLE`. A `RANGE` mode should be added only if institutionally useful
and explicitly supported. Unset safety-sensitive display mode must fail closed;
it must never default to an exact count.

## 15. Sensitive-category handling

The policy must define whether referral category, service type, provider, and
partner are ordinary activity dimensions, sensitive dimensions, categorically
blocked dimensions, or separate policy scopes. No category-level or provider-
level public disclosure is authorized by this packet.

## 16. Unknown and unresolved conditions

Unknown, unset, unresolvable, stale, noncanonical, or conflicting safety
conditions must block disclosure. Missing policy, missing Truth
`public_approved` population eligibility, missing sign-off, missing exact
report/version binding, or missing residual-risk review cannot become approval,
zero, an estimate, or a public projection.

## 17. Institutional governance and sign-offs

Reuse the established institutional model unless SHF changes it through
governance:

- `PRIVACY_DATA_GOVERNANCE`
- `LEGAL_PRIVACY_REVIEW`
- `EXECUTIVE_APPROVAL`

Technical permission `reports.public_disclosure_policy.manage` identifies who
may operate the governance API; it does not establish institutional authority.
No natural-person approver is named. Sign-off records must be scoped to the
policy key/version and remain auditable.

## 18. Policy schema support and gaps

| Requirement | Classification | Existing representation |
| --- | --- | --- |
| Exact report/version and policy key | `SUPPORTED_WITH_REGISTRATION` | Registry binding plus policy record |
| Minimum group/cohort threshold | `SUPPORTED` | `minimum_group_size`, `cohort_size` |
| Suppression and display mode | `SUPPORTED` | `suppression_required`, `exact_count_allowed`, `display_mode` |
| Geography/program scope | `SUPPORTED` | `allowed_geography_levels`, `allowed_program_granularity` |
| Reporting period | `SUPPORTED` | `reporting_period` |
| Re-identification and rare-event review | `SUPPORTED` | `reidentification_risk`, `rare_event_risk` |
| Complementary suppression | `SUPPORTED` | `complementary_suppression_required` |
| Reconstruction/repeated release | `SUPPORTED` | `reconstruction_risk` |
| Longitudinal linkage | `SUPPORTED` | `longitudinal_linkage` |
| Cross-metric combination | `SUPPORTED` | `cross_metric_combination_risk`, `combination_risk_rules` |
| Freshness | `SUPPORTED` | `freshness_rules` |
| Referral category/service sensitivity taxonomy | `SCHEMA_EXTENSION_REQUIRED` | Not currently represented as a governed structured taxonomy |
| Provider/partner disclosure restrictions | `SCHEMA_EXTENSION_REQUIRED` | Not currently represented as a governed structured rule |
| Category-specific thresholds | `SCHEMA_EXTENSION_REQUIRED` | Current scalar threshold cannot express category-specific values |
| Multiple policy sign-offs | `SUPPORTED_WITH_REGISTRATION` | Separate scoped sign-off records |

No schema extension is implemented by this packet. The generic fields are
structurally available, but substantive Hub values and any domain-specific
taxonomy/rule extensions require later governance and implementation work.

## 19. Recommended SHF v1 posture

**RECOMMENDATION — NOT APPROVED POLICY:** Use a narrow aggregate-only public
scope, fail closed on unknowns, prohibit case/provider/partner/service-type
slices until separately governed, use broad geography and reporting periods,
require suppression and complementary suppression, require manual review for
re-identification, rare events, reconstruction, longitudinal linkage, and
cross-metric combinations, and preserve the exact process-only wording
`Hub Referrals Created`.

This recommendation does not select a threshold, authorize a period or
geography, approve a policy version, or enable public disclosure.

## 20. Approved institutional decisions

SHF approved the following for v1:

1. threshold `10`, positive below-threshold display `<10`, and safe-zero preservation;
2. organization-wide, state, and county geography;
3. foundation-wide and named Hub program granularity;
4. annual and quarterly periods;
5. blocked sensitive referral dimensions and mandatory residual-risk review;
6. 12-month freshness with reporting-period and data-as-of metadata; and
7. privacy/data-governance, legal/privacy, and executive sign-offs.

## 21. Consequences after approval

With the approved policy and registered evaluator:

`approved Hub policy -> resolveApprovedPublicDisclosurePolicy(...) -> exact
Hub disclosure evaluation -> PUBLIC_DISCLOSURE_APPROVED may become possible ->
public snapshot/publication gates remain separate`

Registration alone cannot create disclosure approval, a snapshot, publication
authorization, publication, or a public endpoint. Curriculum public behavior
and the Donor Summary restricted path remain unchanged.

## Decision status

**POLICY STATUS:** `APPROVED`

**DECISION:** `INSTITUTIONALLY APPROVED POLICY v1`

**PUBLIC_DISCLOSURE_APPROVED:** available only after exact report review,
Truth public-population eligibility, and all v1 privacy gates pass.

**Next authorized task:** execute the bounded Hub disclosure review against an
exact `PUBLIC_ELIGIBLE` report/version. Snapshot and publication remain later
separate gates.
