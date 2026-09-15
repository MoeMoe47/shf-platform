# MET-12 — Student Enterprise System

## 1. Scope

MET-12 adds a durable, educational/simulated Student Enterprise to the Silicon Heartland City metaverse: a governed, canonical-team-backed entity with a lifecycle, roles, a catalog, and integration into the existing Student Market (MET-9), Student Opportunity Exchange (MET-8), Work Passport (MET-10), and city orchestration (MET-11). It replaces the `SELLER_TYPE_P1` fail-closed guard MET-9 left in place for `STUDENT_ENTERPRISE` sellers now that this authority exists.

This document supersedes the earlier, narrower `docs/metaverse/MET-12_SYSTEM_WIDE_METAVERSE_ACCEPTANCE.md` (a reporting-focused acceptance sweep) as the canonical MET-12 scope. That reporting work is preserved unmodified as additive.

## 2. Authority Reuse Map

| Capability | Owner | MET-12's relationship |
|---|---|---|
| Team membership | `studio_teams` / `studio_team_members` (082) | Reused directly via `studio_team_id`; no enterprise-local roster exists |
| Market listings/orders | MET-9 (`market_listings`, `market_orders`) | Enterprise is a new `seller_type`; no new listing/order table |
| Opportunity bids/awards | MET-8 (`student_opportunity_bids/awards`) | Enterprise bids are plain `TEAM` bids; no new bid table |
| Project execution | Studio/`projects` via `opportunity-project-adapter.ts` | Untouched; award record remains the durable execution authority |
| Evidence | `verified-evidence` (`prepare_prove_evidence`, `curriculum_truth_facts`) | Untouched; accepted enterprise work is an evidence *candidate* only |
| Treasury/balance | MET-9 `InMemoryTreasuryAdapter` | Untouched; MET-12 never creates a balance, wallet, or ledger |
| Work Passport | MET-10 projection | Adds a read-only `ENTERPRISE_EXPERIENCE` claim type; no new passport storage |
| City orchestration | MET-11 | Adds enterprise items to the daily briefing's economy section only |
| Notifications | NCA (via `IntegrationOutboxRepo`) | Enterprise lifecycle events are enqueued through the same outbox every other MET domain uses |
| Communication | MET-6 rooms | Reuses `TEAM_ROOM` keyed by the enterprise's own `studio_team_id`; no new room type |
| Civic authority | SHF Civic (MET-1 boundary) | Not touched or referenced; enterprise is not a civic simulation |

## 3. Legal / Simulation Boundary

`STUDENT_ENTERPRISE_LEGAL_BOUNDARY_STATEMENT` (`enterprise-contract.ts`):

> Student Enterprise is educational/simulated. It is not a legal business, employer, payroll entity, tax entity, licensed contractor, registered company, or independent organization/tenant.

Formation (`formEnterprise`) requires `legalBoundaryAcknowledged: true` and fails closed (`LEGAL_BOUNDARY_ACK_REQUIRED`) otherwise. The boundary statement is rendered in the formation form and the enterprise profile so it is visible at every stage, not only at creation.

## 4. Enterprise Model & Persistence

Migration `146_student_enterprises.sql` adds four tables plus one additive `ALTER`:

- `student_enterprises` — the durable enterprise record: `studio_team_id` (FK, `UNIQUE` — one enterprise per team), `program_id`, `enterprise_category`, `operating_mode`, `lifecycle_status`, `visibility`, legal-boundary acknowledgment fields, and full lifecycle-transition audit columns (`approved_by_user_id`, `suspended_reason`, etc.). Optimistic-concurrency `version` column, same pattern as `student_opportunities`.
- `student_enterprise_roles` — additive to `studio_team_members`; grants enterprise-specific authority (who may sell/manage the catalog) without duplicating who is on the team.
- `student_enterprise_catalog_items` — catalog entries, optionally linked to a `market_listings.listing_id`.
- `student_enterprise_history` — append-only, source-backed event log.
- `ALTER TABLE market_listings ... seller_type CHECK (... 'STUDENT_ENTERPRISE')` — the only change to an existing table.

No table duplicates team membership, Market listings/orders, Opportunity bids/awards, Treasury balance, evidence, or Passport storage (verified in `tests/met-12-student-enterprise.test.ts`).

## 5. Lifecycle

`DRAFT → PENDING_APPROVAL → ACTIVE ⇄ PAUSED → SUSPENDED/CLOSED → ARCHIVED`, enforced by the pure `isAllowedLifecycleTransition` table in `enterprise-contract.ts` (independently unit-tested). Only `ACTIVE` is transactable (`canEnterpriseTransact`). `SUSPENDED`/`CLOSED` enterprises fail closed on every Market/Opportunity check via `assertAuthorizedEnterpriseActor` / `assertActiveEnterpriseForBidding`.

## 6. Operating Modes

`SIMULATED` (default), `EDUCATIONAL`, `PROGRAM_SANDBOX`, `EXTERNAL_REFERENCE_ONLY` — presentation/context metadata only; they do not change lifecycle or transaction authority in this pass.

## 7. Team Authority

An enterprise is created by an active `studio_team_members` member of the linked `studio_team_id` (`assertCanManageTeam`). One enterprise per canonical team (`UNIQUE (studio_team_id)`). Every downstream check (formation, roles, selling, bidding) re-derives team membership from `studio_team_members`, never from client input.

## 8. Roles

`FOUNDER`, `OPERATIONS_LEAD`, `CATALOG_MANAGER`, `MEMBER`. The founder is granted automatically at formation. Only `FOUNDER`/`OPERATIONS_LEAD`/`CATALOG_MANAGER` may sell on the Market or manage the catalog (`ENTERPRISE_SELLER_AUTHORIZED_ROLES`); plain `MEMBER` cannot. Roles may only be granted to real active canonical team members.

## 9. Formation & Approval

`formEnterprise` → `submitForApproval` → instructor/program-manager/admin (`assertReviewer`, never STUDENT) → `approveEnterprise` (→ `ACTIVE`) or `returnEnterprise` (→ `DRAFT`, with a reason). `pauseEnterprise`/`resumeEnterprise`/`closeEnterprise` are owner/manager self-service; `suspendEnterprise` is reviewer-only.

## 10. Profile & Catalog

The profile (`GET /metaverse/enterprise/enterprises/:id`) returns the enterprise plus its active roles and catalog. Catalog items (`PRODUCT`/`SERVICE`/`SHOWCASE_ITEM`/`COMMUNITY_OFFERING`) are rejected if they claim to sell verified skill, credentials, grades, or admission (`isProhibitedEnterpriseCatalogClaim`).

## 11. Market Integration (MET-9)

`market-policy.ts`'s `deriveSeller` now handles `STUDENT_ENTERPRISE` by calling `assertAuthorizedEnterpriseActor(enterpriseId, ...)`, which re-reads the durable record and requires ACTIVE lifecycle, real team membership, and an authorized role — never trusting client-supplied enterprise state. `listing-service.ts` records a best-effort `MARKET_LISTING_PUBLISHED` history entry; the listing itself remains a plain `market_listings` row.

## 12. Opportunity Integration (MET-8)

`opportunity-service.ts` now validates `STUDENT_ENTERPRISE` `source_ref` against a real, ACTIVE, org-scoped enterprise (`getEnterpriseOrThrow`) instead of accepting an orphan string. `bid-service.ts` requires, for enterprise-sourced opportunities, that the bidding team *is* the enterprise's own `studio_team_id` (`ENTERPRISE_TEAM_MISMATCH` otherwise) and that the enterprise is ACTIVE (`assertActiveEnterpriseForBidding`). The bid is still a plain `TEAM` row in `student_opportunity_bids` — no separate enterprise bid exists.

## 13. Project Integration

Unmodified. Acceptance flows through the existing MET-8 award → `opportunity-project-adapter.ts` best-effort schedule projection, exactly as for any other opportunity source.

## 14. Treasury Boundary

Unmodified. Treasury remains `InMemoryTreasuryAdapter` (MET-9's own documented gap: no durable ledger exists yet for *any* seller type, not just enterprises). MET-12 introduces no balance, wallet, or ledger table and performs no payment settlement itself — Market/Treasury remain the sole authority.

## 15. Enterprise History

Append-only `student_enterprise_history`, populated on lifecycle transitions, catalog additions, Market listing publication, and Opportunity bid/award. Plain timeline — no score, ranking, or leaderboard is derived from it.

## 16. Work Passport Integration (MET-10)

A new `ENTERPRISE_EXPERIENCE` claim type / `STUDENT_ENTERPRISE` source authority. `projectPassportFromSources` builds one claim per active `student_enterprise_roles` row with `verificationLevel: SOURCE_CONFIRMED` (or `ACTIVITY_COMPLETED`) — **never `VERIFIED`**, because membership/role alone is not verified skill. Purely a read-only projection; no new passport persistence.

## 17. Evidence Boundary

Unchanged. `opportunity-evidence-adapter.ts` still marks accepted work as an evidence *candidate* only (`isVerifiedEvidence: false`); it never calls `projectAuthoritativeFact`/`createEvidenceRule` itself.

## 18. Career Connection

The Passport claim's `metadata.notEmploymentNotVerifiedSkill: true` and the legal boundary statement together ensure enterprise participation is presented as educational history, never employment or a job offer.

## 19. Program Mission / Side Mission Support

Reused, not rebuilt: `student_opportunities.opportunity_type` already includes `STUDENT_ENTERPRISE_CONTRACT`, and setting `programId` on an enterprise-sourced opportunity places it in the same Program/Side Mission surface MET-7/MET-8 already project. No mission-sequencing was added — MET-7's lack of canonical mission-chain ordering (already an open MET-11 P1) is unaffected and not claimed to be solved here.

## 20. Arcade Boundary

Untouched. Arcade remains a practice/mastery signal only; no enterprise-specific gating was added or needed.

## 21. City Orchestration (MET-11)

`city-orchestration-service.ts`'s `loadCityOrchestrationSources` best-effort-fetches the actor's enterprises (never throws if the domain is unavailable) and `buildDailyBriefing` appends them to the **economy** briefing section only, with next-action-style labels (`COMPLETE_ENTERPRISE_SETUP`, `SUBMIT_ENTERPRISE_FOR_APPROVAL`, `CONTINUE_ENTERPRISE_PROJECT`, `REVIEW_ENTERPRISE_OPPORTUNITY`). These are informational briefing items only — they never become `learner_next_action` and cannot outrank a required mission in the `today` section. No new district was created; enterprise items surface contextually wherever Treasury/Market/Opportunity items already appear.

## 22. Notifications (NCA)

`enterprise-service.ts` enqueues `metaverse.enterprise.proposal_submitted` / `.approved` / `.returned` / `.suspended` through the same `IntegrationOutboxRepo` every other MET domain uses — no bespoke notification table. Bid/award/order/fulfillment notifications are already covered generically by MET-8/MET-9's own existing outbox events, since enterprise activity flows through those same tables.

## 23. Communication (MET-6)

No new room type. An enterprise's `TEAM_ROOM` is reachable via its own `studio_team_id`, the same id MET-6 already keys team rooms on. No enterprise DM system exists or was added.

## 24. Visibility

`PRIVATE`/`PROGRAM`/`ORGANIZATION`/`NETWORK`/`CITY`, defaulting to `PROGRAM`. `listDiscoverableEnterprises` excludes `PRIVATE` visibility and any lifecycle status other than `ACTIVE`/`PAUSED` — suspended, closed, archived, and pending/draft enterprises never appear in discovery.

## 25. Privacy / Student Safety

The model carries no personal contact fields (no email/phone/address column or field anywhere in the contract or migration). No enterprise DM system exists. Catalog items cannot claim institutional outcomes. All reads are org/tenant-scoped; cross-org enterprise existence is never leaked (`NOT_FOUND` on mismatch, not a distinct "forbidden" signal).

## 26. Accessibility

The frontend hub/profile/catalog/history components use semantic sections, `aria-label`s, real `<button>`/`<form>`/`<label>` elements (no `onClick` divs), and inherit the existing `.met-*` panel mobile-responsive convention (full-width bottom sheet under 720px, same as Market/Opportunity/Passport panels).

## 27. Security

- Every mutating route requires `METAVERSE_ENTERPRISE_PROPOSE` (owner/manager self-service) or `METAVERSE_ENTERPRISE_APPROVE` (instructor/program-manager/admin review only — never granted to `STUDENT`).
- `formEnterprise`, role grants, and lifecycle transitions all re-derive identity, org/tenant, and team membership from the authenticated actor and the database — never from request-body claims.
- Optimistic concurrency (`version`) prevents lost-update races on lifecycle transitions.
- Full invariant coverage: `apps/shs-api/tests/met-12-student-enterprise.test.ts` (24 tests covering all 51 build-brief security properties in grouped assertions) and `tests/metaverseStudentEnterprise.test.mjs` (10 frontend tests).

## 28. Persistence

Migration head advances from 145 to 146. No existing table's rows are migrated or reinterpreted; the only existing-table change is the additive `market_listings.seller_type` CHECK constraint.

## 29. Browser Acceptance

**Not run.** This environment has no live Postgres/browser harness (consistent with how MET-8/MET-9's own test suites are written — static source assertions and pure-function tests, never a live end-to-end run). Documented as an explicit P1, not fabricated:

- P1: full live-browser journey (propose → approve → catalog → listing → opportunity → bid → award → project → evidence candidate → Passport claim) has not been executed against a running instance.

## 30. P0 / P1 Gaps

**P0:** none identified.

**P1 (explicitly deferred, consistent with the completion gate's allowed carry-forward list):**
- Durable Treasury ledger/balance accounts (pre-existing MET-9 gap; unchanged by MET-12 by design — no shadow balance was created instead).
- Full live-browser acceptance run (§29).
- The shared camera-controls toolbar (`MetaverseCameraControls.jsx`) does not yet have a dedicated enterprise toggle; the panel is reachable via its own page-level toggle button for this pass, to avoid an unbounded change to that shared, separately-tested component.
- `canReview` is hardcoded `false` on the immersive city page (a student-facing surface); instructor/admin review is expected to happen through an admin-facing surface, not built in this pass.
- Real legal-business graduation, external merchant/payment integration, payroll, taxes, licensing, physical commerce, advanced dispute resolution, a richer public enterprise directory, true Program/Side Mission sequencing (blocked on MET-7, pre-existing), and richer multi-user browser fixtures all remain future work, per the build brief's own allowed-P1 list.
- **Student enterprise identity as a distinct legal/organizational authority does not exist and was not fabricated** — `StudentEnterprise` is a governed simulation record scoped to an existing organization/team, not a new tenant.
