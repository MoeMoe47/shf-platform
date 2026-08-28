# SHF Reports & Briefings Composition Contract

## Purpose

This contract governs whether `surface.reports.briefings` may present an
existing canonical report. It does not create a population, metric, Truth
claim, public eligibility decision, or report endpoint.

The permitted architecture is:

`canonical facts -> canonical metrics -> canonical reports -> presentation format`

Generated artifact metadata is now governed separately by
`docs/SHF_REPORT_DISTRIBUTION_AUTHORITY_CONTRACT.md`; artifact registration
does not authorize distribution or publication.

Briefing formats may select, label, arrange, and narrate approved report
results. They may not define formulas, recompute values, change scope or time
windows, bypass eligibility, or infer a different outcome.

## Authorized workforce report input

The only workforce input reviewed here is
`report.workforce.employment.started_verified_count.v1`, backed by
`workforce.employment.started_verified_count.v1`.

Its meaning is: the historical count of distinct canonical employment-start
outcome IDs that passed the strong verification policy, have verified Source
eligibility and internally approved Truth, and occurred in the canonical UTC
window using `employment_started_at`. It is not a placement rate, current
employment count, retention, wage, transfer, settlement, ROI, impact, or public
benefit measure.

## Format decisions

| Format | Decision | Boundary |
| --- | --- | --- |
| Board Brief | `INTERNAL_CANONICAL_ALLOWED` | May show `Historical Verified Employment Starts` as an internal governance statistic. |
| Grant Narrative | `INTERNAL_CANONICAL_ALLOWED` | May use the deterministic factual sentence for the exact count and canonical period; narrative must not claim long-term employment or program success. |
| Donor Summary | `RESTRICTED_EXTERNAL_CANONICAL` | The server-authoritative composition path registers a `RESTRICTED_EXTERNAL` artifact with composition version `1` and the exact workforce report manifest. This does not authorize distribution, imply delivery, or make the result public; recipient, disclosure, and authorization remain separate gates. |
| Public Impact Snapshot | `PUBLIC_APPROVAL_REQUIRED` | Requires explicit public eligibility, privacy review, aggregate approval, and `public_approved`; current report is internal-only. |
| Program Health Memo | `INTERNAL_CANONICAL_ALLOWED` | May show the count only as a bounded historical workforce outcome indicator, not overall program health, current employment, retention, or success rate. |

No format is authorized to relabel the report as placement, employment rate,
active jobs, retained jobs, workforce impact, or employment success.

## Availability and privacy

An unavailable report remains `Unavailable` or the existing institutional
equivalent. It must not become zero, a mock value, a previous browser value, or
an Oracle estimate. Valid zero remains zero.

Underlying employment records are participant-linked and sensitive. This
contract does not establish a small-n threshold, cohort protection rule, or
geographic disclosure policy. Public aggregate use therefore remains blocked
until a privacy/public-disclosure policy is explicitly approved. No participant
PII, employer details, verification artifacts, or raw Truth/Evidence payloads
may enter a briefing output.

## Donor Summary authority review

The `/foundation/impact` route is authenticated by the surrounding application,
but that view authority does not establish generation, export, external
distribution, or publication authority. The Donor Summary item now opens a
bounded authority-selection drawer. It reuses the workforce Reporting Service
result, creates the server-owned restricted artifact, lists only `AUTHORIZED`
recipients and exact-version `APPROVED` disclosures, and calls the existing
generic authorization action. Its only success state is
`AUTHORIZED_FOR_DISTRIBUTION`; no delivery or publication is implied.

The workforce report is semantically suitable only with factual context for a
future authorized donor audience: `X verified employment starts were recorded
during the reporting period.` It must remain aggregate-only and historical.
No external privacy/small-n policy, recipient-specific authorization,
distribution audit, revocation/version contract, or public publication policy
is established by this review. Public Impact Snapshot remains separately
blocked by explicit public eligibility and `public_approved` requirements.

## Other canonical report candidates

Curriculum lesson completion and Hub referrals created are potential internal
composition inputs only when their existing report contracts and semantics are
preserved. They are not automatically public-approved. Exchange funding
commitment count is an internal candidate only and must not be presented as
funding deployed, transferred, or settled. None is added to the panel by this
slice.

## Current panel and Oracle boundary

`ReportsBriefingsPanel.jsx` renders `EXPORT_ITEMS` supplied by
`SHFImpactCommandCenter.jsx`; Board Brief, Grant Narrative, and Program Health
Memo are report-backed through the same workforce Reporting Service client.
Grant Narrative and Program Health Memo use the deterministic sentence `X
verified employment starts were recorded during the reporting period.` for an
eligible value and an explicit unavailable sentence when the report cannot be
evaluated. Program Health Memo labels the value `Historical Workforce Outcome`
and does not treat it as a health score. The other selectors remain
presentation/demo state, and no selector or export action may define a metric.
Oracle and generated narrative tools may summarize an eligible canonical
report, but cannot create numbers, change semantics, bypass unavailable status,
approve Truth, or authorize public disclosure.

## Grant Narrative and Program Health Memo composition boundary

Grant Narrative and Program Health Memo are internal-only and consume only the
aggregate Reporting Service response for
`report.workforce.employment.started_verified_count.v1`. They preserve valid
zero, do not add a browser period selector, and do not expose participant,
employer, verification, Evidence, or Truth identifiers. Program Health Memo
must present the value as one historical workforce indicator and never as an
overall health score. Unavailable or failed report retrieval remains
unavailable; it never becomes a positive narrative, zero, mock value, prior
browser value, or Oracle estimate.

## Next composition process

Each additional frontend connection requires an authorized composition
definition naming the report IDs, audience, scope, period, semantic label,
unavailable behavior, and distribution/public-eligibility policy. Donor
 Summary remains connected only through its bounded authority UX; Public Impact
 Snapshot remains unconnected by this slice.
