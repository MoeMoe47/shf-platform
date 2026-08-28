# Public Aggregate Education Activity Policy Decision Packet

## 1. Purpose

This packet records the institutionally approved v1 values for the first public
disclosure policy. It does not approve any individual report disclosure, set
Truth `public_approved`, authorize publication, or publish data.

## 2. Scope

**Policy key:** `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY`

**Initial policy version:** `1` (`APPROVED`; institutionally approved)

**Governed report:** `report.curriculum.lesson_completion_count.v1`, report
version `1`, metric `curriculum.lesson.completion_count.v1`.

The scope is limited to aggregate lesson-completion activity. It does not
govern workforce outcomes, referrals, financial commitments, health data, or
all SHF reports.

## 3. Canonical semantic meaning

The report means: **lesson completion activity count**.

It does not mean course completion, graduation, credential attainment, mastery,
educational success, workforce readiness, participant success, or impact.
Any public wording must preserve that boundary.

## 4. Data-risk profile

Although the report is aggregate, disclosure risk can increase with small
cohorts, narrow programs or lessons, county/site filters, short reporting
periods, rare activity patterns, repeated releases, public auxiliary data,
and combinations with other metrics. Suppressing one cell may still permit
inference from totals or neighboring cells. Aggregate status alone is not
public safety.

## 5. Required institutional decisions

The values below are the institutionally approved v1 decisions. A blank or
unresolved safety input at report-review time still blocks disclosure.

| Decision | Risk addressed | Available options | Recommendation (not approved policy) | Approved value/status | Policy field | Approving authority |
|---|---|---|---|---|---|---|
| Minimum exact-count population | Small-cell identification | Set a threshold; require suppression; use ranges | Suppress when uncertain | **10** | `minimum_group_size` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Cohort-size treatment | Tiny cohort disclosure | Same threshold as population; stricter rule; manual review | Use the stricter applicable rule | **minimum 10** | `cohort_size` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Small-group handling | Meaning of a suppressed result | Suppress; show below-threshold; broaden cohort; range; other approved mode | Suppression or broader aggregation | **Suppress below 10 as `<10`** | `suppression_required`, `exact_count_allowed` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Display mode | Misleading representation of small results | Exact count; range; suppressed; aggregate only | Do not default an unset mode to exact count | **EXACT_COUNT, SUPPRESSED_LT_10** | `display_mode` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Geography granularity | Local re-identification | Organization; state; county; municipality; site | Broadest useful level; no automatic county approval | **COUNTY, STATE, ORGANIZATION_WIDE** | `allowed_geography_levels` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Program specificity | Distinctive program/lesson patterns | All programs; program; pathway; course; lesson | Broad aggregation until risk is reviewed | **FOUNDATION_WIDE, NAMED_PROGRAM** | `allowed_program_granularity` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Reporting period | Narrow-window reconstruction | Annual; quarterly; monthly; custom | Longest useful period | **QUARTERLY, ANNUAL** | `reporting_period` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Exact counts vs ranges | Precision disclosure | Exact count above threshold; ranges; suppression; aggregation | Prefer suppression or aggregation when uncertain | **Exact counts at 10+; `<10` below threshold; no ranges** | `exact_count_allowed`, `suppression_required` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Re-identification review | Known participants and auxiliary data | Automated rules; mandatory manual review; blocked release | Manual review for residual risk | **Required; PASS required** | `reidentification_risk` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Rare events | Distinctive low-frequency activity | Always suppress; manual review; broader aggregation | Manual review or suppression | **Required; PASS required** | `rare_event_risk` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Sensitive outcome class | Extra protection for education activity | Ordinary; sensitive; restricted subcategories | Treat unknown sensitivity as sensitive | **ORDINARY_EDUCATION_ACTIVITY** | `sensitive_outcome_type` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Longitudinal linkage | Reconstruction across releases | Minimum interval; aggregation; suppression; manual review | Require linkage review and aggregation | **Required; PASS required** | `longitudinal_linkage` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Cross-metric combination | Inference from multiple reports | Manual review; allowed combinations; blocked combinations | Manual combination-risk review | **Required before narrow-population combination** | `cross_metric_combination_risk`, `combination_risk_rules` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Complementary suppression | Inference from totals/neighboring cells | Apply complementary suppression; aggregate; manual review | Apply complementary suppression where needed | **Required** | `complementary_suppression_required` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Repeated-query reconstruction | Rebuilding suppressed values through filters | Restrict query granularity; rate-limit/review; publication-only batches | Do not expose reconstructable slices | **Required; PASS required** | `reconstruction_risk` | SHF institutional privacy/data-governance authority + SHF executive authority |
| Staleness/freshness | Outdated public information | Maximum age; period label; expiration/review; refresh requirement | Require explicit period labeling and review | **12 months; renewed review when stale** | `freshness_rules` | SHF institutional privacy/data-governance authority + SHF executive authority |

The numeric value `10` and the freshness value `12 months` are institutionally
approved v1 values; no additional thresholds are implied.

## 6. Available decision postures

**Conservative:** suppress or broaden uncertain results, use broad geography and
program groupings, require manual review for residual and combination risk, and
fail closed when any rule is unset.

**Balanced:** publish exact counts only when approved thresholds and release
dimensions pass objective checks, with manual review for exceptions.

**Permissive:** allow finer-grained exact counts or ranges under approved
controls, accepting greater disclosure risk and review burden.

The conservative posture is a recommendation only, not an approved policy.

## 7. Machine-policy field mapping

The implemented `policy_definition` contains these fields for the approved v1
policy and requires them for policy approval:

`minimum_group_size`, `cohort_size`, `allowed_geography_levels`,
`allowed_program_granularity`, `reporting_period`, `reidentification_risk`,
`rare_event_risk`, `sensitive_outcome_type`, `longitudinal_linkage`,
`cross_metric_combination_risk`, `suppression_required`, and
`exact_count_allowed`, `display_mode`,
`complementary_suppression_required`, `reconstruction_risk`, `freshness_rules`,
and `combination_risk_rules`.

The outer policy record also requires `policy_key`, `policy_version`, exact
`report_id`/`report_version`, `policy_type`, scoped ownership, and lifecycle
metadata. The disclosure decision separately requires the policy reference and
policy version.

### Schema closure status

The previously identified representation gaps are now closed without changing
the approved institutional values. `display_mode` is an explicit enum
(`EXACT_COUNT`, `RANGE`, `SUPPRESSED`, `AGGREGATE_ONLY`),
`complementary_suppression_required` is an explicit boolean,
`reconstruction_risk`, `freshness_rules`, and `combination_risk_rules` are
required structured objects, and institutional approval is
represented separately by scoped sign-off records with a stable
`authority_reference`. A sign-off reference does not invent or imply an
institutional approver.

Former `POLICY_SCHEMA_GAP` findings are **RESOLVED** at the representation
level and the approved v1 values are recorded in the decision table above.
Approved policies remain immutable, and arbitrary executable policy code is
not supported.

## 8. Approval authority and sign-off

The technical permission is `reports.public_disclosure_policy.manage`, enforced
server-side. That permission identifies who may call the API; it does not prove
institutional authority to define SHF privacy policy.

The v1 institutional model requires sign-off records for
`PRIVACY_DATA_GOVERNANCE`, `LEGAL_PRIVACY_REVIEW`, and `EXECUTIVE_APPROVAL`.
The policy governance owner is the SHF institutional privacy/data-governance
authority and final approval is by SHF executive authority. No natural-person
identity is hard-coded. `reports.public_disclosure_policy.manage` is only the
technical API permission and does not itself establish institutional authority.

## 9. Versioning and change control

Policy key plus version is the governance identity. Version `1` is approved and
immutable. Substantive rule changes require a new version. Retiring a policy
blocks new use and preserves history. An approved policy must have an effective
date and a traceable approval record.

## 10. Consequences after approval

With institutional values and sign-off requirements resolved:

`APPROVED policy -> resolveApprovedPublicDisclosurePolicy(...) -> exact
curriculum disclosure evaluation -> PUBLIC_DISCLOSURE_APPROVED may become
possible for a compliant report review`

This still does not set Truth `public_approved`, authorize publication, or
publish. Those are separate gates.

## 11. Explicitly out of scope

This packet does not approve an individual report disclosure, set
`public_approved`, create a public route, connect Public Impact Snapshot, add
workforce/referral policies, change curriculum metric semantics, or authorize
Oracle/AI participation in governance. AI may assist drafting but cannot choose
thresholds, approve policy, override suppression, approve disclosure, or
publish.

## Decision status

**POLICY STATUS:** `APPROVED`

**DECISION:** **INSTITUTIONALLY APPROVED POLICY v1**

**PUBLIC_DISCLOSURE_APPROVED:** available only after exact report-review gates

**Next decision:** preserve the separate Truth `public_approved` and
publication-authority reviews; do not infer them from this policy or a
`PUBLIC_DISCLOSURE_APPROVED` decision.
