# SHF Truth Public Approval and Report Governance Boundary

## Purpose

This contract records the relationship between Truth Spine claim public
approval and report-level public governance. It prevents a valid aggregate
disclosure decision from being treated as approval of participant-linked
Truth records, and prevents Truth approval from being treated as publication
authority.

## Current Truth `public_approved` semantics

Truth Spine stores `public_approved` on an individual claim version. A claim
is effectively publicly visible only when the stored flag is true, the claim
is currently verified, is not superseded, and has valid ownership scope. The
canonical predicate is `truth_spine_service.is_publicly_visible()` and the
Truth public-claim routes use that predicate.

The state is an explicit Truth decision, not a consequence of Source
verification, internal approval, report generation, Metric Registry presence,
Oracle output, or frontend state. Claim creation and creation of a new claim
version reset it to false. Public approval and revocation are separate
authenticated transitions using `truth.claim.approve_public` and
`truth.claim.revoke_public`, with scope, verification, reason, and append-only
Truth history/audit checks.

`internal_approval_status` is separate and is used for internal institutional
eligibility. It never changes `public_approved`.

## Report-level public governance

| Authority | Granularity | Meaning | Does not mean |
|---|---|---|---|
| `PUBLIC_ELIGIBLE` | exact report/version/scope | The canonical report may enter disclosure review | privacy approval, Truth approval, or publication |
| `PUBLIC_DISCLOSURE_APPROVED` | exact report/version/scope | The aggregate report passed the approved disclosure policy and residual-risk review | Truth claim approval, publication, or public URL |
| `public_approved` | exact Truth claim version | The individual canonical claim may pass the Truth public-visibility predicate | aggregate privacy clearance or publication |
| `PUBLICATION_AUTHORIZED` | future public artifact/projection | A separately authorized public release may be made | any earlier decision by itself |
| `PUBLISHED` | future public delivery state | A governed publication actually exists | Truth or report approval |

The curriculum disclosure service requires exact `PUBLIC_ELIGIBLE` linkage and
the approved disclosure policy. It does not write Truth records or mutate
`public_approved`.

## Chosen architecture: C, two distinct public gates

**Classification: `TWO_DISTINCT_PUBLIC_GATES`.**

The current curriculum public path has two different public gates:

1. Truth public approval controls whether a contributing canonical claim
   version is eligible for the public metric population. The active curriculum
   Metric Registry definition explicitly declares
   `claim_approval_requirement: public_approved`, and its calculator excludes
   claims that do not satisfy that requirement.
2. Report eligibility and disclosure approval control whether the exact
   aggregate report/version may proceed through public privacy governance,
   including suppression and contextual disclosure risk.

These are not duplicate approvals. Claim approval is a Truth/public-visibility
decision; disclosure approval is an aggregate report/privacy decision. Neither
grants publication authority.

The claim-approval requirement is metric-definition-specific. It must not be
generalized into a rule that every future aggregate must expose or publicly
approve its participant-linked source claims. Any future aggregate population
that intentionally keeps source Truth private requires an explicit versioned
population/report contract.

## Granularity and aggregate-report problem

For the current curriculum metric, the public calculator's source population
is claim-level and the registry requires each included claim to be
`public_approved`. The flag is version-sensitive: new claim versions start
unapproved and prior versions may be superseded.

That requirement does not authorize exposing claim detail. The safe public
product is the approved aggregate report, not a participant-level Truth dump.
A public disclosure approval must never copy or expose `subject_id`,
participant references, Evidence IDs, Source records, Truth IDs, or
verification documents. If a future report is intended to aggregate private
Truth without making individual claims public, it requires an explicit
population-contract review that removes the current curriculum metric's claim
requirement without weakening report-level privacy review.

One hundred internally approved and verified lesson-completion claims do not
become public merely because they produce a count. Under the current
curriculum public metric definition they also require explicit claim-level
public approval before entering the public metric population; the aggregate
still requires report eligibility and disclosure approval. The aggregate path
never mutates those claims or promotes them to a public payload.

## Privacy and suppression

Truth `public_approved` performs no small-n, suppression, re-identification,
repeated-release, longitudinal, or cross-metric analysis. Those checks belong
to the approved report disclosure policy and its exact report/version
decision. Suppression changes only the public representation; it does not
change the canonical metric result or Truth records.

For curriculum v1, a public representation such as `<10` may be returned
while the internal canonical count remains unchanged.

## Impact Data Spine

The current frontend Impact Data Spine adapter filters static records through
`publicApproved === true`; retained records are explicitly `Sample`/`Draft`
with `publicApproved: false`. The adapter does not call Truth approval, set
`public_approved`, or act as approval authority.

The public projection boundary remains:

`Producer -> Agent Fabric -> Operational Event -> Evidence -> Source -> Truth
Spine -> Metric Registry -> Reporting Service -> report eligibility/disclosure
-> future publication authority -> public projection`

No static fixture, browser state, report generator, or Impact Data Spine write
may bypass that chain.

## Reporting Service

The canonical curriculum report can be generated in internal or public mode.
Public metric calculation applies the Metric Registry's
`public_approved` claim requirement and the Truth public-visibility predicate;
report generation itself does not set approval state. Report-level eligibility
and disclosure decisions are exact report ID/version records and do not
recalculate or mutate Truth.

The public report must preserve activity semantics: lesson completion activity
count only. It must not become graduation, mastery, credential, educational
success, workforce readiness, or impact.

## Permission and audit boundaries

The repository has distinct permissions:

- `truth.claim.approve_public` / `truth.claim.revoke_public`: claim-level Truth
  transitions;
- `reports.public_eligibility.manage`: exact report eligibility decisions;
- `reports.public_disclosure.manage`: exact report privacy/disclosure
  decisions;
- `reports.public_disclosure_policy.manage`: policy and sign-off governance;
- `reports.publish`: future publication authority.

Viewing, exporting, metric calculation, Impact projection, and Oracle access
do not imply these mutations.

Truth transitions are recorded as claim-level public approval/revocation
history and audit events, including claim version, actor, scope, reason, and
state. Report eligibility and disclosure have separate exact report/version
audit events. Policy approval has separate policy/sign-off events. A future
publication requires a distinct publication audit.

## Required invariants

- Internal Truth approval and Source verification never imply
  `public_approved`.
- `PUBLIC_ELIGIBLE` and `PUBLIC_DISCLOSURE_APPROVED` never mutate Truth.
- Aggregate disclosure approval never exposes participant-level Truth.
- Report suppression never mutates the canonical metric or Truth.
- Public claim visibility always uses the canonical Truth predicate.
- Impact Data Spine remains projection-only and cannot approve anything.
- Frontend, report generation, Metric Registry, Oracle, and AI cannot set
  public approval or publication state.
- `public_approved` and report disclosure approval never imply
  `PUBLICATION_AUTHORIZED` or `PUBLISHED`.
- Unavailable, noncanonical, superseded, or out-of-scope inputs fail closed.

## Migration implications

No Truth migration or mass approval is authorized by this review. Existing
curriculum public metric behavior remains claim-approval-gated until a
separate population-contract review determines whether a privacy-safe
aggregate can use non-public participant Truth. That review must also prevent
public Truth routes from exposing participant-linked claim detail.

Any change to the curriculum metric's claim-approval requirement must be a
versioned Metric Registry/report contract change with new eligibility and
disclosure tests.

## Publication and Oracle boundaries

Even when curriculum inputs satisfy public metric, eligibility, and disclosure
requirements, publication remains blocked until a separate server-owned
`PUBLICATION_AUTHORIZED` authority, public-safe artifact/projection, and
publication audit exist. No Public Impact Snapshot connection is made here.

Oracle and AI may provide advisory analysis or bounded presentation text. They
cannot approve Truth claims, approve report eligibility or disclosure, set
`public_approved`, authorize publication, or turn unavailable data into an
estimate.

Agent Fabric remains an upstream ingestion/projection path into Truth Spine;
it does not become public approval authority. No public path may bypass
Producer, Operational Event, Evidence, Source, or Truth Spine lineage.

## Recommended next bounded slice

Review the future publication-authority boundary for the approved curriculum
aggregate. That review should define how a public-safe aggregate artifact is
linked to `PUBLIC_DISCLOSURE_APPROVED` and whether the current curriculum
claim-level public metric requirement remains appropriate, without exposing
participant Truth or changing `public_approved` in that slice.

## Hub referral limitation

The current Truth predicate also gates unauthenticated raw Truth claim and
package routes. Hub `hub_referral_created` / `referral_created` claims carry
participant/case-linked identifiers and Evidence/Source references. Under the
current implementation, approving one for the Hub aggregate would also make
the raw claim eligible for `/truth/public/claims` and related package routes.
The separate population-contract authority now provides an aggregate-only
state. Hub claim approval under the raw `public_approved` semantics remains
blocked; aggregate contribution uses `PUBLIC_POPULATION_ELIGIBLE` instead.
Population approval requires a typed institutional authority and exact
`PUBLIC_AGGREGATE_POPULATION_APPROVAL` claim/version sign-off; development
persistence remains file-backed.

The population-contract refactor is now implemented with a separate
`PUBLIC_POPULATION_ELIGIBLE` authority. It does not change raw Truth route
filtering or historical `public_approved` semantics. Hub approvals remain
fail-closed until server-side institutional authority configuration exists.
