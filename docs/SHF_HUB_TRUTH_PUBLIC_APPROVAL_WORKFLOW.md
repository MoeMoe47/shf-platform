# SHF Hub Truth Public Approval Workflow

## Status

This is a review of claim-level public approval for Hub referral Truth. No
real Hub claim was approved by this slice.

Classification: `HUB_PUBLIC_APPROVED_SEMANTICS_UNSAFE_FOR_PARTICIPANT_LINKED_TRUTH`.

## Claim identity and lineage

The Hub producer is `CaseService.createReferral()`. Its transactional
outbox event is authenticated into Agent Fabric and projected through:

`referral.created -> Operational Event -> Evidence -> Source -> Truth`.

The exact Truth identity is:

- claim type: `hub_referral_created`
- predicate: `referral_created`
- subject: the canonical referral/case subject identifier
- version: integer Truth claim version
- lineage: `lineage.hub.referral.created.v1`
- scope: server-derived `tenant_id` and `organization_id`

The Hub metric uses these claims for `hub.referral.created_count.v1` and
requires internal approval plus the separate aggregate population-eligibility
authority in public mode.

## Current claim lifecycle

The repository currently implements these states and transitions:

1. Agent Fabric creates a draft/unapproved claim with Evidence and Source
   references.
2. Source verification derives `verification_status = verified` when the
   Truth verification rules pass.
3. `approve-internal` records the separate
   `internal_approval_status = approved` transition for institutional
   reporting use.
4. `approve-public` sets `public_approved = true` for the current exact claim
   version when the Source is verified and the actor has
   `truth.claim.approve_public`.
5. `revoke-public` sets the current version back to false and appends history.
6. A substantive new claim version resets public approval to false and
   supersedes the prior version.

Source verification and internal approval do not set `public_approved`.
Report eligibility, disclosure approval, the Impact Data Spine, Oracle, and
the frontend cannot set it.

## Existing public-approval semantics

The canonical `is_publicly_visible()` predicate requires public approval,
current verified status, a non-superseded version, and valid scope. The
unauthenticated Truth routes `/truth/public/claims`,
`/truth/public/claims/{claim_id}`, `/truth/public/packages`, and
`/truth/public/package/{claim_id}` use that predicate.

Therefore, in the current implementation, `public_approved` means both:

- eligible for a public Truth claim/package route; and
- eligible to contribute to the current public metric population when the
  metric requires the public visibility predicate.

This is `C. BOTH`, not an aggregate-only flag. The repository has no separate
claim state meaning “eligible for an aggregate while remaining unavailable as
a raw public claim.”

## Safety finding for Hub claims

Hub claims are participant/case-linked Truth records. The claim object carries
`subject_id`, `claim_text`, `evidence_ids`, `source_ids`, timestamps, producer
and lineage identifiers, and tenant/organization scope. The public claim
routes return the claim object; the public package route also exposes the claim
inside the package, although it strips some source detail.

Approving a Hub claim under the current semantics would therefore expose a
participant-linked referral fact through the raw Truth public surface. An
aggregate disclosure decision cannot make that exposure safe, and Hub policy
suppression cannot redact a claim already admitted to those routes.

The safe public product is the governed aggregate report. It must not expose
participant IDs, referral/case IDs, Truth IDs, Evidence IDs, Source records,
verification metadata, or sensitive referral context. The current flag cannot
express that separation.

## Approval prerequisites that must remain

The existing technical transition fails closed for missing claims, unverified
Sources, legacy-unscoped records, wrong scope, and invalid reasons. The Hub
metric additionally requires internal approval, current verified lineage, and
exact scope. Any future Hub public-population workflow must preserve:

- exact claim ID and version binding;
- server-derived actor, tenant, and organization;
- no mock, seed, demo, or browser authority;
- explicit revocation and new-version invalidation;
- append-only claim history and audit;
- no automatic report eligibility, disclosure, snapshot, publication, or
  projection side effect.

It must also explicitly restrict the claim type/predicate to
`hub_referral_created` / `referral_created` for the intended aggregate
population.

## Institutional authority and granularity

The technical permission is `truth.claim.approve_public`, with the current
role map reserving it to `shs_admin`. Repository evidence does not provide a
separate institutional privacy/public-population sign-off reference for an
individual Hub claim. Possession of the technical permission is not proof of
institutional authority. No natural-person approver is introduced here.

The existing workflow is per claim/version and is the only safe granularity
currently present. There is no governed Hub batch-approval primitive. A future
batch operation would need a frozen exact claim/version set, independent
prerequisite checks, per-claim audit, scope enforcement, and no inheritance by
future claims. “Approve all Hub referrals” is not authorized.

## Decision and next prerequisite

No Hub claim may become raw-public `public_approved` under the current
public-visibility semantics. This is a safety stop, not a missing reason
string or permission.
The current real Hub population remains draft/unapproved and no real approval
records are fabricated.

The bounded correction is now documented in
`docs/SHF_TRUTH_PUBLIC_POPULATION_ELIGIBILITY_CONTRACT.md`: aggregate
population eligibility is a separate claim/version authority. It does not
grant raw public visibility. No real Hub population-eligibility records were
created. Approval now requires an active typed institutional authority and an
exact `PUBLIC_AGGREGATE_POPULATION_APPROVAL` sign-off.

The semantic split and governed sign-off capability are implemented. The next
authorized task is a controlled claim-level review; no real Hub claim may be
approved by this implementation slice.

Authority, sign-off, eligibility-transition, and governance-audit records now
have an explicit PostgreSQL production adapter and ordered migration. Hub
claims remain unapproved in this slice; deployment of the migrated durable
store and individual claim review are still required.

## Boundaries

Oracle/AI cannot create or approve Truth claims, choose scope, satisfy
institutional authority, or infer public approval. Report-level governance
cannot approve Truth. The Impact Data Spine remains projection-only. No Hub
eligibility, disclosure decision, snapshot, publication authorization,
publication, endpoint, or UI was created by this review.

## Controlled real-claim review result

The authorized local review enumerated the canonical Truth repository and
matched only the exact Hub predicate pair `hub_referral_created` /
`referral_created` with lineage `lineage.hub.referral.created.v1`. The store
contained zero matching real claim/version candidates. No candidate was
approvable, blocked, already eligible, or modified; no institutional sign-off
or `PUBLIC_POPULATION_ELIGIBLE` record was created. Synthetic test claims were
excluded from this count.

The review created no report-level eligibility or disclosure decisions,
snapshots, publication authorizations, publications, projections, endpoints,
or UI state. The next review requires a real canonical Hub Truth population
with the approved claim-level prerequisites and active institutional authority.
