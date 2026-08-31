# SHF Credential Architecture — Phase 7

## Scope

Establishes the first canonical credential truth in this repository:
Credential Definitions (what a credential is), Learner Credentials (who
actually holds one and when it was issued), one real deterministic
eligibility rule, manual/institutional issuance and revocation authority,
real expiration/renewal semantics, Calendar projection of only legitimate
dated actions, a `CREDENTIAL_EARNED` Journey Milestone, and Tier 3
Celebration integration — all gated strictly on canonical issuance, never
on eligibility, registration, or date passage.

## Pre-Implementation Audit Findings

- **No credential domain existed anywhere** prior to this phase. Every
  "credential" hit in the pre-Phase-7 backend was either an OAuth/API
  credential (Zoom, Auth0) or an explicit disclaimer ("this is curriculum
  progression status, not... credential status").
- **`CredentialsBadges.jsx`** (`src/pages/career/portfolio-sections/`) was
  **UI-only/demo**: a hardcoded fallback array with an explicit code
  comment stating no canonical source existed, and a permanently
  `aria-disabled` "View credentials" button.
- **No QR/public-verification infrastructure exists anywhere** in the
  repository (confirmed by search — only coincidental substring matches
  in unrelated lesson content).
- **No blockchain/on-chain infrastructure is real.** `src/shared/ledger/badgeHooks.js`
  (`mintBadge()`) is a legacy, pre-SHF-Ecosystem prototype with its own
  `// TODO: replace with NFT or on-chain badge mint` comment and always
  returns `tokenId: null`; `proofStore.js` is plain `localStorage`.
  `src/pages/solutions/SHSBlockchainTransparencyPage.jsx` is static
  marketing copy with zero backend tie-in. None of this was reused or
  cited as real — Phase 7 makes no blockchain/immutability claim anywhere.
  The one genuinely reusable pattern found was Trusted Reporting's real
  SHA-256 content-hash binding (`report-public-snapshot-service.ts`) — a
  legitimate tokenless integrity technique, noted here for future
  reference but not used this phase (no public verifier was built — see
  Non-Goals).
- **No Assessment/exam domain exists.** No credential requirement in this
  phase depends on one.
- **No `CREDENTIAL_*` permissions or Program/Career→Credential
  relationship existed.**
- **Prepare/Prove** (migration 034, a real competency-evidence-review
  harness with `VERIFICATION_VIEW`/`VERIFICATION_REVIEW`) has zero
  credential tie-in — a plausible *future* eligibility input, not wired
  this phase.
- **No fake learner-credential seed data existed anywhere** — clean.

## Credential Definition

Global reference data (`credential_definitions`, migration `051_credentials.sql`)
— **no `organization_id`/`tenant_id`** — mirrors the existing
`careers`/`career_families` precedent (migration 033): a Credential
Definition describes what a credential *is*, not who has earned it, and
is visible to every organization identically. Fields: `slug` (unique),
`name`, `credential_type` (`INTERNAL`/`EXTERNAL`), `issuing_authority`,
optional `description`, optional `career_id` (a relevance/category tag
only, mirroring Career Events/Opportunities' own single nullable
`career_id` column — never an access-control or requirement rule by
itself), `requires_accepted_capstone` (the one real eligibility rule),
`validity_period_months` (`NULL` = lifetime), `renewal_window_days`
(only meaningful alongside a validity period — enforced by both a DB
`CHECK` and a service-level `RENEWAL_REQUIRES_VALIDITY_PERIOD` error),
and `status` (`active`/`inactive`).

Management (`POST /credentials/definitions`, `GET /credentials/definitions`)
is gated by `credential.definition.manage`, granted only to `org_admin`
and `program_manager` — identical scope to the existing Project domain's
own `project.create`/`project.team.manage`.

## Learner Credential (Issuance)

Org-scoped (`learner_credentials`): a specific learner actually issued a
specific credential by a specific organization. **Bounded stored
lifecycle is exactly `ISSUED`/`REVOKED`** — no persisted
`PENDING`/`ELIGIBLE`/`EXPIRED` row ever exists. `EXPIRED` and
`RENEWAL_DUE` are *derived* at read time from `expires_at`/
`renewal_window_days` (`deriveLearnerCredentialLifecycle()` in
`credential.ts`) — never written back to the row, so a later policy
correction can never leave a stale mutable status behind, and expiring
never deletes or mutates the original issuance fact (§ Expiration below).

A partial unique index (`learner_credentials_one_active_per_definition`,
`WHERE status = 'ISSUED'`) prevents a learner from holding two
simultaneously-active issuances of the same Credential, while still
allowing re-issuance after a revocation frees the slot.

`verification_id` (a `randomUUID()`, unguessable — never derived from
learner/credential identifiers) is generated at issuance and reserved for
a **future** public verifier. No such endpoint exists yet — see
Non-Goals.

## Internal vs External Credentials

`credential_type` preserves the distinction (`INTERNAL` = SHF-issued,
`EXTERNAL` = industry/third-party). This phase does not implement any
different issuance *mechanism* per type (both go through the same manual
`POST /credentials/issue` path) — it only preserves the label so a future
phase can add type-specific behavior (e.g., an external-provider
verification step) without a data migration. SHF never manufactures an
`EXTERNAL` issuance merely because a learner reports passing an outside
exam — issuance always requires the same explicit admin/program-manager
authority regardless of type.

## Eligibility ≠ Issuance

`GET /credentials/definitions/:id/eligibility/me` is a **pure read** — it
never creates a row. The one real, deterministic rule implemented this
phase: `requires_accepted_capstone` checks for an `ACCEPTED`
`project_submissions` row on any of the learner's own teams for any
`project_type = 'CAPSTONE'` Project in their organization — reusing
exactly the same completion-truth query already proven in
`journey-milestone-service.ts`'s `projectMilestones()`. A Credential with
`requires_accepted_capstone = false` reports `NO_REQUIREMENT_DEFINED`
(not a fabricated `false`-with-no-explanation) — issuance for it is
manual/institutional-approval-only, by design (see Requirement Model
below).

**Issuance never checks eligibility as a hard gate.** An authorized
issuer may issue a Credential to an ineligible learner — this follows the
phase's own explicit "prefer explicit/manual issuance" default: trusting
the human authority the permission system already vouches for is a
better failure mode than blocking on an unproven, necessarily-incomplete
automatic rule. Eligibility is advisory information for an issuer's own
UI, not an enforcement mechanism.

## Requirement Model (deliberately minimal)

Only one requirement source is implemented: accepted-Capstone. Course
completion, lesson completion, and external evidence requirements are a
**documented, deferred non-goal** — building a generic multi-source
requirements engine without a second real, evidenced use case would be
exactly the "unproven rules blob" the phase brief explicitly warns
against. Extending this later (e.g., a `credential_requirements` join
table over multiple requirement types) is straightforward and additive
when a second real requirement source is evidenced.

## Issuance Authority

`credential.issue`/`credential.revoke` are granted only to `org_admin`
and `program_manager` (plus `super_admin`, which holds every permission
automatically) — the exact same admin-tier scope as the Project domain's
own management permissions. **Students never receive `credential.issue`**
— there is no self-issuance code path at all, not merely a check.
**Instructors do not receive it either** — no existing Credential
reviewer/issuer relationship is evidenced anywhere in the codebase (unlike
Cohort staff or Project team roles), so granting it would be inventing an
authority relationship rather than reusing one. This mirrors the
identical, already-documented Project-domain gap (instructors have no
Project management permission either).

## Credential Lifecycle

```
ISSUED ──(expires_at reached)──▶ EXPIRED   (derived, not stored)
   │        (renewal_window_days before expires_at)──▶ RENEWAL_DUE (derived)
   └──(admin/program-manager revokes)──▶ REVOKED (stored)
```

## Expiration

`expires_at` is computed once, at issuance time, from the Credential
Definition's `validity_period_months` (`NULL` → the issued row's
`expires_at` is `NULL` forever — a lifetime credential can never
retroactively gain a fake expiration even if the definition's policy
changes later). `EXPIRED` is a read-time derivation
(`expires_at <= now()`), never a mutation — the row's `status` column
stays `ISSUED` through and past expiration. **Expiration never deletes or
alters issuance history** — an expired credential is still a real,
queryable fact that the learner once earned it (this is also why Journey
Milestones' `CREDENTIAL_EARNED` remains present after expiration — see
below).

## Renewal

`renewal_window_days` is only accepted on a Credential Definition that
also has `validity_period_months` set (enforced by both a DB `CHECK` and
a service-level error) — a lifetime credential can never be given a fake
renewal date. `renewalDueAt` is computed server-side
(`expiresAt - renewalWindowDays`) and returned on every Learner Credential
read; Calendar only projects it when it is genuinely present.

## Revocation

`POST /credentials/:id/revoke` sets `status = 'REVOKED'` and
`revoked_at = NOW()` — gated by `credential.revoke` (same admin-tier
scope as issuance). A revoked credential's Journey Milestone and any
Celebration are retroactively withdrawn from *future* reads (a revoked
row is simply excluded from both), but the row itself is never deleted —
`GET /credentials/:id` still returns it (with `lifecycle: "REVOKED"`) to
whoever remains entitled to see it.

## Assessment Relationship

No Assessment/exam domain exists in this codebase. No credential
requirement or Calendar producer in this phase depends on one. If a real
Assessment domain is built later, a second requirement type
(`requires_assessment_pass`, or similar) can be added additively without
touching the existing Capstone-based rule.

## Evidence / Truth Relationship

Prepare/Prove's real evidence-review harness (migration 034) has no
integration point with Credentials in this phase — it was audited and
found to have zero existing "credential" reference. Calendar and Journey
read canonical Credential facts; neither writes institutional Evidence.
No competing verification table was created — `learner_credentials` is
the sole ledger of issuance.

## QR / Verification

**Deferred, not faked.** No QR code, no public verifier endpoint, no
verification UI exists in this repository, and none was built this
phase — building a verifier surface with nothing real to point it at
would itself be a form of fabrication. `verification_id` is generated and
stored now specifically so a future verifier needs no additional
migration, but until that surface exists, verification claims remain
internal-only (an admin/the learner themselves reading `GET /credentials/:id`
or `GET /credentials/me`).

## Hash / Blockchain Reality

**None used, none claimed.** See the audit findings above. This
implementation makes no "blockchain," "immutable," or "on-chain" claim
anywhere in code, API responses, or UI copy.

## Calendar Projection

Only two legitimate dated actions project, both from real Learner
Credential fields — never a fabricated exam/registration date (no
Assessment domain exists to source one from), and never the issuance date
itself (a past fact, already surfaced via Journey Milestones'
`CREDENTIAL_EARNED`, not a Calendar deadline):

- `credential:<learnerCredentialId>:renewal` — only when `renewalDueAt`
  is present.
- `credential:<learnerCredentialId>:expiration` — only when `expiresAt`
  is present; rendered with `status: "cancelled"` once the credential's
  derived lifecycle is `EXPIRED` (still visible, honestly marked, not
  hidden).

A `REVOKED` credential (by derived lifecycle) projects nothing into
Calendar. Both event types were added via the *existing*, already-
registered `"credential"` `CalendarEventType`/filter group in
`eventContract.js` (present since before this phase, unused until now) —
no new filter-architecture change was needed. `useLearningCalendarEvents.js`
adds `listMyCredentials` as a sixth `Promise.allSettled` source with its
own `unavailableSources` entry — one source failing never blanks the
others (Today, Upcoming Deadlines, and dedup all continue to work exactly
as before, since they operate on the shared, already-generic merged event
array and require zero changes of their own).

## Journey Milestone Integration

`CREDENTIAL_EARNED` is added to `journey-milestone-service.ts`'s
projection. It requires the row's own stored `status = 'ISSUED'` —
**never** `REVOKED`, and never merely eligible (eligibility never creates
a row at all, so there is nothing to project). `occursAt` is the
credential's real `issued_at`. The milestone **remains present after
expiration** (expiration doesn't delete issuance history) but disappears
immediately upon revocation (a revoked credential is excluded from the
underlying query entirely, matching "revoked credential not treated as
valid").

## Celebration (Tier 3) Integration

`credential.issued` was added to `celebrationPolicy.js`'s
`POLICY_BY_ACHIEVEMENT` map at `CELEBRATION_TIER.MAJOR_MILESTONE` —
identical tier to `capstone.accepted`, reusing the same
`COMPANION_EVENTS.MAJOR_MILESTONE` reaction (no new Companion event type
was created). `achievementFromJourneyMilestone()` maps a
`CREDENTIAL_EARNED` milestone to this achievement **only when the
milestone's own `status` is `"completed"`** — which, per the Journey
integration above, only ever happens for a canonically-`ISSUED`,
non-revoked credential. `credential.eligible`/`credential.registered`/
`credential.submitted`/`credential.expired`/`credential.revoked` are
explicitly named in `NO_CELEBRATION_EVENT_TYPES` to document (and test)
that none of them may ever celebrate, even though no code path in this
repository currently calls `evaluateCelebration()` with any of them —
this is a defensive, tested invariant, not dead code.

## Tenant / Security

Credential Definitions are intentionally *not* tenant-scoped (global
reference data, matching Careers). Learner Credentials are strictly
org-scoped: `GET /credentials/me` returns only the caller's own issuances
(or every organization issuance for admin-tier actors); `GET /credentials/:id`
returns `404` — not `403` — for a credential belonging to a different
learner, a different organization, or a non-existent id, so no response
ever confirms or denies existence to an unentitled caller. Issuance
itself validates the target learner belongs to the issuer's own
organization (`LEARNER_NOT_FOUND` otherwise) — a cross-org issuance
attempt is rejected before any row is written.

## Non-Goals (this phase)

- A public credential verifier / QR surface (deferred — no infrastructure
  exists to build it on truthfully; `verification_id` is reserved for it).
- Any blockchain, on-chain, or "immutable ledger" claim of any kind.
- Automatic issuance of any kind — all issuance is explicit/manual.
- Course-completion, lesson-completion, or external-evidence eligibility
  rules (only accepted-Capstone is implemented; the requirement model is
  deliberately not a generic rules engine).
- A Program/Career → required-Credential relationship (only a Credential
  → optional relevant-Career tag exists, mirroring Career Events/
  Opportunities' own precedent).
- Any UI redesign — `CredentialsBadges.jsx`'s existing markup/styles were
  reused; only its data source changed from a hardcoded array to
  `GET /credentials/me`.
- Assessment/exam domain, Portfolio backend, Arcade mastery — all remain
  out of scope, unchanged by this phase.
