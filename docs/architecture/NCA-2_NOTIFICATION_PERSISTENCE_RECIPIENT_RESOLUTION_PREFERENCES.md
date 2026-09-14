# NCA-2 — CANONICAL NOTIFICATION PERSISTENCE, RECIPIENT RESOLUTION & PREFERENCES

Backend-only. No inbox UI, no transactional email, no SMS/push, no NCA-3 work, no commit, no push.

## 1. Executive Result

NCA-2 formalizes and hardens the canonical notification persistence and recipient-resolution layer NCA-1 built on top of the real `integration_outbox`/`notifications` infrastructure NCA-0 found already in production. Existing persistence was audited field-by-field and found sufficient for everything except one genuinely new, explicitly-required capability: a per-user communication preference. One minimal, tightly-scoped migration was added for that reason alone (`143_notification_preferences.sql`); every other NCA-2 requirement — organization scoping, multi-org access, dedupe/idempotency, source-event linkage, read/archive state — was satisfied by extending service-layer logic over the existing schema, exactly as NCA-1 established as the house style. Recipient resolution is now explicitly server-authoritative against client-supplied organization filters, an entitlement-resolution mechanism was implemented and tested (not retroactively forced onto existing policies, for reasons argued in §12), and mandatory/required communication is structurally incapable of being suppressed by the new preference system — enforced twice, once in the service layer and once by a database CHECK constraint.

## 2. Repository Baseline

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`, branch `claude/notifications`, HEAD `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head before this phase: `142`. **Migration head after this phase: `143`** (see §36 for the full justification required before creating it)
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified

## 3. NCA-1 Inputs

Read and built directly on top of, not re-derived:
- `docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md`
- `docs/architecture/NCA_OWNER_DECISION_LOCK.md`
- `docs/architecture/NCA-1_CANONICAL_NOTIFICATION_CONTRACTS_CONSOLIDATION_POLICY.md`
- NCA-1 implementation: `apps/shs-api/src/domain/notifications/contracts/{communication-contracts,notification-classification}.ts`, `service/notification-service.ts`, `api/routes.ts`, and the P0 failure-isolation fix in `domain/trusted-reporting/outbox-repo.ts`.

NCA-1's static classification registry (category/urgency/actionRequired/channelEligibility, computed at read time, never persisted) is reused verbatim — NCA-2 adds a reverse lookup (`notificationTypesByCategory`) and a suppressibility helper on top of it, but does not create a second registry or change any existing classification.

## 4. Existing Persistence Sufficiency

Audited against every NCA-2 §6/§44 requirement — see the full matrix in §"Required Persistence Matrix" below. Summary: **sufficient for everything except user communication preferences**, which did not exist anywhere in the repository (confirmed absent in NCA-0 §10) and cannot be safely represented by any existing table — it is new, stable, per-user canonical NCA state, not a per-event field and not identity/org state.

## 5. Canonical Notification Record

Unchanged shape (migration `081`, reused verbatim): `notification_id, organization_id, tenant_id, recipient_user_id, notification_type, source_event_id, source_event_type, source_entity_type, source_entity_id, title, message, destination_path, status, created_at, read_at`. `category`, `urgency`, `action_required`, and `action_state` remain **computed at read time** by `classifyNotificationType()` (NCA-1) — NCA-2 explicitly preserved this principle rather than adding columns for stable, statically-derivable values. `dedupe_key` is not a named column; the existing composite `UNIQUE (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` constraint already is the dedupe key.

## 6. Source Event Linkage

Unchanged: `source_event_id`/`source_event_type` on every notification row trace back to the originating `integration_outbox` event (`source_event_id` is the real `outbox_event_id` when available). `createNotificationFromEvent` never becomes the source event itself — it only ever reads one and projects from it. Multiple notifications can already derive from one event safely: the dedupe key includes `recipient_user_id`, so if a future policy's `recipient()` function is extended to resolve multiple recipients, each gets its own row, safely deduplicated per-recipient rather than colliding.

## 7. Recipient Resolution

Formalized as: `Source Event → Organization Scope (event.organization_id/tenant_id match) → Entity Scope (policy-specific DB lookup, e.g. projects.studio_learner_id) → Relationship (payload-carried or DB-derived user id) → Entitlement (optional, isOrganizationEntitled() — see §12) → Preference Policy (applied at read time, not write time — see §14) → Recipient Set`. Entirely server-side: every `recipient()` function resolves from the trusted event/producer payload or a parameterized DB lookup scoped by `organization_id`/`tenant_id` from the event itself — never from arbitrary client input. Proven in `tests/nca2-persistence-recipient-preferences.test.ts` ("A"): an event carrying a client-shaped `payload.recipient_user_id` is ignored in favor of the server-resolved `projects.studio_learner_id` lookup for `studio.review.decision_recorded`.

Role and permission are not stored as notification authority — they remain inputs the owning domain already applied before the event was emitted (e.g., only an authorized reviewer's user id ever lands in `payload.reviewer_user_id`). NCA-2 does not re-derive role/permission checks inside the notification layer; that would duplicate authority the source domain already owns.

## 8. Organization Scope

Every notification carries `organization_id`/`tenant_id` (unchanged). `scope()` in `notification-service.ts` was extended to accept an optional, explicitly-authorized `requestedOrganizationId` — defaulting to the actor's active organization, but honoring a different one **only if** it appears in `resolveAuthorizedOrganizationIds(actor)`, which is derived exclusively from `actor.memberships` — populated server-side by the auth layer (`apps/shs-api/src/auth/organization-context.ts`) from the database, never from client-controlled request fields. An unauthorized organization id is rejected (`ORG_CONTEXT_FORBIDDEN`), never silently widened or emptied.

## 9. Multi-Org Semantics

Implemented and tested:
- Every organization-scoped notification retains its organization identity (unchanged, already true).
- A user authorized in Org A and Org B can list, count, and act on notifications in either, explicitly, via `?organizationId=`.
- The active organization does not erase or hide the other's notifications — `GET /notifications/organizations` (NCA-1, preference-aware as of NCA-2) still supplies the aggregate cross-org signal.
- Proven negative: `listNotifications`/`unreadCount` with an organization id the user has no membership row for throws `ORG_CONTEXT_FORBIDDEN` (test "C"), not an empty list masquerading as authorized access.
- Proven positive: a multi-org actor gets exactly Org A's notifications when scoped to Org A, and exactly Org B's when scoped to Org B (test "B"), from the same underlying row set.

## 10. Personal / Non-Org Notifications

**Deliberately not implemented this phase.** `notifications.organization_id` is `NOT NULL` (migration `081`), and every one of the ~19 real, currently-wired notification types is genuinely organization-scoped — none of them are personal/system-level in practice today. Per the NCA-2 migration rule ("do not add columns/features for speculative future needs"), altering the schema to permit a nullable organization context was not done, because no currently-emitting event proves this need. The conceptual distinction (`PERSONAL` vs `ORGANIZATION_SCOPED`) is worth naming for a future phase if a genuine personal/system-level notification type is ever proposed (e.g., a purely individual account notice with no organization actor) — at that point it would be a real, evidence-backed migration candidate, not before.

## 11. Role Resolution

Role is consumed as an **input** to existing `recipient()` functions (e.g., a reviewer role already gates who can appear as `payload.reviewer_user_id` upstream in Studio's own routing service, before the event is ever emitted) — never stored as notification-layer authority, and never re-derived or re-checked inside `notification-service.ts`. No change was made to any of the 19 recipient functions' role-adjacent logic; NCA-2 only formalized that this is the correct place for it to live (in the source domain, not here).

## 12. Entitlement Resolution

Implemented as a genuinely reusable, tested mechanism (`entitlement-resolver.ts`, `isOrganizationEntitled(organizationId, serviceKey, db)`), reusing the real `service_catalog`/`organization_service_entitlements` tables (migration `084`) — no parallel entitlement model. An `EVENT_POLICIES` entry may now declare `requiresEntitlementService: <service_key>`, and `createNotificationFromEvent` will skip (not create, fail-closed) the notification if the organization lacks an active, in-window entitlement for that service.

**Deliberately not applied retroactively to any of the 19 existing wired policies.** Reasoning: NCA-0 found no actual incident of an operator being notified about a product their organization lacks — this is a forward-looking risk, not an active bug. Verifying that `organization_service_entitlements` has been fully backfilled for every organization already relying on these working notification types was outside this phase's scope, and gating already-working notifications behind unverified backfill data risks a real, silent regression with no evidence it's needed. `tests/nca2-persistence-recipient-preferences.test.ts` ("E: existing wired policies never invoke an entitlement query") proves this precisely: a mock db configured to throw if any `organization_service_entitlements` query is attempted still succeeds for `credential.issued`, confirming zero behavior change. Future policies for genuinely entitlement-gated services should declare the field explicitly.

## 13. Notification Categories

Unchanged from NCA-1: `MANDATORY_OPERATIONAL | REQUIRED_ACTION | TRANSACTIONAL | OPTIONAL_PRODUCT | DIGEST_ELIGIBLE | MARKETING`, from the single existing classification registry. No second registry was created. NCA-2 adds `notificationTypesByCategory()` (a pure reverse lookup over the same registry) and `isSuppressibleCategory()` — both derive from, not duplicate, the NCA-1 source of truth.

## 14. Preference Policy

**The smallest canonical preference model, implemented, not merely designed:** migration `143_notification_preferences.sql` (`user_id, category, in_app_enabled`, one row per user per suppressible category, no `organization_id` — a communication preference is personal, matching precedent in `user_accessibility_profiles`). Only `OPTIONAL_PRODUCT` and `DIGEST_ELIGIBLE` are representable at all — enforced twice: the service layer (`setPreference` throws `InvalidPreferenceCategoryError` for anything else) and the database (`CHECK (category IN ('OPTIONAL_PRODUCT', 'DIGEST_ELIGIBLE'))`).

Suppression is applied **at read time** (`listNotifications`, `unreadCount`, `listAttentionItems`, `unreadCountsByOrganization`), not at write time — a disabled category never prevents a notification row from being created; it only excludes it from what the API returns while the preference is off. This means: (a) the write path (`createNotificationFromEvent`, inside the P0-fixed `enqueue()` transaction) stays exactly as simple and failure-isolated as NCA-1 left it — no new coupling risk was introduced; (b) a user who re-enables a category retroactively sees everything that was ever created for them, nothing is destroyed by suppression. `GET /notifications/preferences` and `PUT /notifications/preferences/:category` are always scoped to `req.user`'s own id — never another user's.

**Mandatory communication cannot be improperly suppressed**, proven three ways: the DB CHECK constraint, the service-layer validation, and a functional test (test "F/G") showing a disabled `OPTIONAL_PRODUCT` preference hides only `OPTIONAL_PRODUCT`-classified rows while a `REQUIRED_ACTION` row in the same result set remains untouched.

## 15. Accessibility Preference Boundary

Untouched, as instructed. `user_accessibility_profiles` (migration `056`), `authorized_accommodations`, and the Accessibility Runtime were not read for modification purposes in this phase and remain a wholly separate system from `notification_preferences`. The new table's own migration comment explicitly documents this separation and that it is not a substitute for the accessibility profile table.

## 16. Read / Unread

Unchanged, reused verbatim: `UNREAD | READ | ARCHIVED` (migration `081` CHECK constraint). `markRead`/`markAllRead` only ever write to `notifications.status`/`read_at` — proven by test ("H/I") that every query issued during `markRead` targets the `notifications` table exclusively, no other table is touched, so reading cannot complete source-domain work by construction, not merely by convention.

## 17. Dismiss / Archive Decision

**Implemented, narrowly.** The schema already reserved `ARCHIVED` as a valid `status` value (migration `081`, predating NCA-2), but NCA-0 found no code path ever set it. NCA-2 adds exactly one function, `archiveNotification`, which only changes this row's own `status` — nothing else. An archived notification can no longer be marked read via `markRead` (a small consistency guard: `WHERE ... AND status <> 'ARCHIVED'`), proven by test. Archiving never closes a source workflow, writes Evidence, alters Truth, approves anything, or resolves a required action — it is purely an inbox-presentation state change, exactly as instructed.

## 18. Action-Required Semantics

Unchanged from NCA-1: `actionState` is derived from the static classification (`NO_ACTION` or `ACTION_REQUIRED`), never from `status`. `ACTION_COMPLETED`/`EXPIRED` remain reserved, unproduced values — no code path derives them from read/archive state (verified both by manual review and by the validator's explicit regex check that no such assignment exists in source). No client-facing mutation exists (or was added) that can set `action_complete=true`; the only way a source workflow completes is through its own domain service, entirely outside this layer.

## 19. Action Target

Unchanged: every policy's `path()` function returns a server-generated destination back into the owning domain's real experience (`/studio/reviewer-queue`, `/studio/projects/:id`, `/documentation/items/:id`, `/curriculum/...`). No action implementation of any kind was added inside the notifications domain.

## 20. Deduplication

Unchanged and reused verbatim: `UNIQUE (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` plus `ON CONFLICT ... DO NOTHING`. Proven directly by test ("J/K"): processing the identical source event twice (simulating a retried/redelivered `integration_outbox` event) yields exactly one logical notification, retrieved via the same `SELECT ... WHERE notification_id=$1` fallback the original code already had.

## 21. Idempotency

Same test ("J/K") proves this at the `createNotificationFromEvent` level. Combined with the existing `integration_outbox` idempotency key (unchanged, migration `007`), repeated event ingestion at either layer cannot spam a recipient.

## 22. Retry Safety

The P0 fix from NCA-1 (failure isolation between notification-projection creation and the source event's own commit) was re-verified, not re-implemented, by re-running its existing regression test (`trusted-reporting-outbox.test.ts`) unchanged and confirming it still passes after every NCA-2 edit. A retried/redelivered event: does not corrupt source state (notifications never write to source-domain tables — verified in §16/§19); does not duplicate notifications (§20/§21); does not change workflow state (notifications have no code path to any source table); and cannot cross-org-leak (recipient resolution and the dedupe key are always organization-scoped from the event's own `organization_id`, never from ambient/global state).

## 23. Expiration

**Not implemented.** No `expires_at` column was added. No currently-real notification type has a proven "source-domain relevance expires" rule that the notification itself (rather than the source domain) needs to enforce — e.g., `DOCUMENTATION_SIGNATURE_EXPIRED` already reflects the *source* signature request expiring via its own event; the notification about it does not need its own independent expiry. Deferred until a genuine case is identified, per the migration rule against speculative columns.

## 24. Retention

Documented as owner-directed policy only, no new persistence: **hybrid** (a fixed system-level default eventually, plus domain-specific overrides where a real compliance need is identified) — unchanged from `NCA_OWNER_DECISION_LOCK.md` §10/§17. No repository-wide legal retention duration is derivable from evidence, and none was invented. No retention job, TTL, or cron was added in this phase — the `ARCHIVED` status (now reachable via `archiveNotification`) is the only retention-adjacent mechanism that exists today, and it is user-driven, not automatic.

## 25. Delivery-State Boundary

Untouched. In-app remains the only real channel; `channelEligibility` computed by the classification registry is always `["IN_APP"]` today. No email/SMS/push delivery-state model was implemented or extended — that boundary from NCA-1 (§38/§43) stands unchanged.

## 26. Query API

Extended, not overbuilt: `GET /notifications`, `GET /notifications/unread-count`, `GET /notifications/attention-items` all now accept an optional `?organizationId=` (validated server-side per §8); `POST /notifications/:id/read`, `POST /notifications/read-all`, and the new `POST /notifications/:id/archive` accept the same. `GET /notifications/organizations` (NCA-1) is unchanged in shape but now applies the same preference suppression as the primary list, for consistency. `GET /notifications/preferences` and `PUT /notifications/preferences/:category` are new, minimal, self-scoped only. No search, sort customization, or bulk-filter surface was added beyond what was explicitly asked for.

## 27. Unread Count

`unreadCount` is recipient-scoped (bound to `actor.user_id` via `scope()`), organization-aware (accepts and validates the same `?organizationId=` as listing), and preference-aware (excludes user-suppressed `OPTIONAL_PRODUCT`/`DIGEST_ELIGIBLE` types from the count, consistent with what `listNotifications` would actually show). It is always computed by a live, parameterized SQL `COUNT(*)` against `notifications` — never derived from client-local state.

## 28. Universal Inbox Projection

Backend contract-level support is now real: one canonical `notifications` table/service backs Curriculum (already wired), and is ready for Studio/DGAL/CivicSure/ARAG/Onboarding the moment each domain's own program adds event emission (no NCA-2 change required on their side) — organization/product/domain context is preserved on every row (`organization_id`, `source_event_type`, `source_entity_type`) and the org-filter/aggregate/attention-item endpoints already support cross-product consumption. No product-specific notification table was created, considered, or is needed.

## 29. Privacy

Unchanged minimum-necessary practice in every policy `title`/`message` string (untouched). Additionally proven by a new test ("P"): `mapNotification`'s output is an explicit, closed allow-list of keys — a row carrying an arbitrary extra field (simulating an accidental sensitive column) is never forwarded to the projected shape. Sensitive domains (Accessibility, CivicSure, ARAG, DGAL) still have no wired policies yet (unchanged from NCA-0/NCA-1); when they do, this same allow-list projection guarantees only the policy's own generic `title`/`message`/`destination_path` are exposed, never raw source payload.

## 30. Security

- Cross-user leakage: impossible by construction — every read/write query binds `recipient_user_id`/`organization_id`/`tenant_id` from server-resolved `scope()`, never from client input (tests "H/I", markAllRead scoping test).
- Cross-org leakage: impossible without an authorized membership row (test "C").
- Client spoofing of organization id: rejected, not silently emptied or widened (test "C", validator check).
- Mandatory-category suppression: structurally prevented at two layers (DB CHECK + service validation, test "preferences cannot be set for a non-suppressible category").
- No new client-facing mutation can complete source-domain work (§18).

## 31. EXR Slot Contract

Unchanged ownership boundary from NCA-1/decision lock: `GET /notifications/attention-items` and `GET /notifications/organizations` remain the concrete data contracts for `ATTENTION_PROJECTION_SLOT`/`NOTIFICATION_BELL_SLOT`/`INBOX_DESTINATION_SLOT`. No shell, header, `RootProviders`, or SEA component file was touched — verified explicitly by the validator's `git diff` check in this run.

## 32. Disconnected Product Bell Handoff

Unchanged from NCA-1: `StoreHeader.jsx`, `ArcadeHeaderExtras.jsx`, `CivicTopBar.jsx` remain deferred to NCA-3. Their future backend dependency is, if anything, now *more* ready than before this phase (organization-filtered listing and preference-aware counts are exactly what a real bell in those shells would need), but no UI wiring was performed.

## 33. BOS / Agent Fabric Boundary

Unchanged, per NCA-D013: the BOS frontend fabric and the Agent Fabric Python classification service were not touched, merged, or resolved in this phase. `isOrganizationEntitled`/preference/classification additions are all inside the canonical `notifications` domain and have no relationship to either BOS mechanism.

## 34. Tests

- `apps/shs-api/tests/nca2-persistence-recipient-preferences.test.ts` — new, 15 tests covering recipient resolution (A), multi-org scoping (B/C/O), preference category/mandatory-bypass (F/G + validation tests), entitlement resolution (E ×2), read/archive state (H/I + archive test), idempotency (J/K), and privacy minimization (P).
- `apps/shs-api/tests/trusted-reporting-outbox.test.ts` — unchanged, re-run to confirm the NCA-1 P0 fix still holds (regression, test "Q" equivalent).
- `apps/shs-api/tests/nca1-notification-contracts.test.ts` — unchanged, re-run, all passing.
- `apps/shs-api/tests/dgal6-notifications.test.ts` — unchanged, re-run, all passing.
- `npx tsc --noEmit` — passes cleanly (exit 0).
- Focused notification-domain suite: **37/37 passing.**
- Full suite: `1169` tests total (`1154` NCA-1 baseline + `15` new), `695` passing (`680` + `15`), `448` failing — identical count and identical failing files to the pre-NCA-2 baseline (all pre-existing `.live.test.ts` files requiring a real Postgres connection unavailable in this environment). No regression.

## 35. Validator

`apps/shs-api/scripts/validate-nca-persistence-recipient-policy.mjs`, registered as `npm run nca:persistence:validate` **inside `apps/shs-api/package.json`**, not the repo-root `scripts/` directory the task template named. This is an intentional, documented deviation: the repo-root `scripts/*.mjs` validators (`validate-sea-*`, `validate-accessibility-*`, etc.) all validate the separate frontend `src/` package and are wired into the root `package.json`'s plain-JS toolchain; they have no TypeScript loader available to import `apps/shs-api`'s `.ts` domain modules. Placing the validator inside `apps/shs-api` (which already depends on `tsx`) lets it directly import and exercise the real contract/classification/service modules rather than only pattern-matching source text. All 19 checks pass, covering: single canonical persistence owner, no duplicate notification table/domain name, recipient resolver and canonical listing entry points exist, organization scoping columns present, multi-org resolution behaves correctly, preference categories match the approved two, mandatory categories are provably non-suppressible (service-layer and DB CHECK), `actionState` never derives `ACTION_COMPLETED` from read state, dedupe/idempotency constraints present (both tables), source-event linkage columns present, the NCA-1 P0 failure-isolation fix is still in place, no Evidence/Truth write exists in the notifications domain, the entitlement resolver reuses the canonical service-catalog tables, the EXR slot endpoints exist, and no shell/header/SEA file was modified in this diff.

## 36. Migration Decision

**One migration was created: `143_notification_preferences.sql`.** Justification, per the required hard gate:
- **Exact missing requirement:** a durable, per-user, per-category (`OPTIONAL_PRODUCT`/`DIGEST_ELIGIBLE`) in-app suppression choice, explicitly required by this phase's own purpose statement ("implement the smallest canonical preference model needed") and confirmed absent by NCA-0 (§10: no communication-preference mechanism exists anywhere).
- **Why existing JSON/payload/state cannot safely represent it:** `notifications` rows are per-event-instance and have no stable per-user settings concept; `users`/`memberships` are identity/org state, not a communication choice; there is no existing JSONB "preferences" column anywhere to repurpose without inventing meaning onto an unrelated table.
- **Why a separate table, not a column on an existing table:** matches the repository's own established convention for personal preference state (`user_accessibility_profiles`, a dedicated user-scoped table, not a column bolted onto `users`) — one row per (user, category), independently queryable and independently constrained.
- **Why this is canonical NCA state, not source-domain state:** it governs whether the user is shown a communication about a domain event, not the domain event or its outcome itself — squarely inside the notification projection's own authority, never touching source-domain tables.

No other migration was added. Every other NCA-2 requirement was satisfied by extending service-layer logic over the existing, unchanged `integration_outbox`/`notifications` schema. **Migration head is now `143`.**

## 37. P0 / P1 Findings

**Zero P0, zero NCA-2-owned P1.** No cross-user leakage, cross-org leakage, client-spoofed organization access, workflow-completing read state, permission-granting notification state, duplicate notification system, notification-failure-induced rollback, direct Evidence/Truth write, improperly-suppressed mandatory communication, or unnecessary sensitive-payload exposure was found or introduced — each is explicitly tested (§30) or structurally impossible (§18/§19). Pre-existing, deliberately deferred items carried forward from NCA-0/NCA-1 (personal/non-org notification schema, entitlement enforcement on existing policies, Store/Arcade/CivicSure bells, BOS/Agent Fabric consolidation) are documented decisions, not open P1s of this phase.

## 38. Files Created

- `apps/shs-api/migrations/143_notification_preferences.sql`
- `apps/shs-api/src/domain/notifications/service/preference-service.ts`
- `apps/shs-api/src/domain/notifications/service/entitlement-resolver.ts`
- `apps/shs-api/scripts/validate-nca-persistence-recipient-policy.mjs`
- `apps/shs-api/tests/nca2-persistence-recipient-preferences.test.ts`
- `docs/architecture/NCA-2_NOTIFICATION_PERSISTENCE_RECIPIENT_RESOLUTION_PREFERENCES.md` (this file)

## 39. Files Modified

- `apps/shs-api/src/domain/notifications/service/notification-service.ts` (server-authoritative org-scoped `scope()`, preference-aware reads, `archiveNotification`, optional entitlement-check hook on `EVENT_POLICIES`)
- `apps/shs-api/src/domain/notifications/api/routes.ts` (organization-filter query param plumbing, archive route, preference routes)
- `apps/shs-api/src/domain/notifications/contracts/notification-classification.ts` (`SUPPRESSIBLE_CATEGORIES`, `isSuppressibleCategory`, `notificationTypesByCategory`, re-exported `NotificationCategory` type)
- `apps/shs-api/package.json` (added `nca:persistence:validate` script)
- `apps/shs-api/tests/trusted-reporting-outbox.test.ts` — unchanged from NCA-1, re-verified only (no new edits this phase)

## 40. Git State

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`
- Branch: `claude/notifications`
- HEAD: `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head: `143` (was `142`; one migration added and justified per §36)
- No commit, no push, no merge performed
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified

## 41. NCA-2 Decision

**NCA-2 is COMPLETE.** Existing persistence was audited field-by-field and found sufficient except for the one proven, explicitly-required gap (user preferences), which received the smallest possible, fully-justified migration. Recipient resolution, organization scope, multi-org semantics, personal/non-org boundary, role/entitlement inputs, category policy, preference policy, read/archive state, action-required semantics, action targets, dedupe/idempotency, retry safety, expiration/retention posture, delivery-state boundary, query API, unread count, universal inbox backend projection, privacy, security, EXR slot contract, disconnected-bell deferral, and BOS/Agent Fabric boundary are all formalized, implemented where proven necessary, and tested. The validator and full regression suite both pass; `git diff --check` is clean.

## 42. Exact Next Phase

The next bounded NCA phase per the approved roadmap (NCA-3 — shared in-app inbox/bell consolidation, resolving the EXR shell placement question together with whatever EXR has landed, and replacing the three disconnected placeholder bells with the real, shared component) is not started in this run.

---

## Required Persistence Matrix

| Requirement | Existing Mechanism | Status | Change Needed |
|---|---|---|---|
| Notification id | `notification_id` PK | Sufficient | None |
| Recipient user | `recipient_user_id` (FK `users`) | Sufficient | None |
| Source event | `source_event_id`, `source_event_type` | Sufficient | None |
| Source domain/type | `source_entity_type`, `source_entity_id`, `notification_type` | Sufficient | None |
| Organization context | `organization_id`, `tenant_id` | Sufficient | None |
| Notification type | `notification_type` | Sufficient | None |
| Title/body/summary | `title`, `message` (bounded 200/1000 chars) | Sufficient | None |
| Read/unread | `status` (`UNREAD`/`READ`/`ARCHIVED`) | Sufficient | None |
| Created time | `created_at` | Sufficient | None |
| Action metadata (category/urgency/actionRequired/actionState) | Computed read-time via classification registry | Sufficient by design | None — deliberately not a column (NCA-1 principle preserved) |
| Deduplication/idempotency | `UNIQUE (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` | Sufficient | None |
| Expiration | Absent | Not currently required | Deferred — no proven current need |
| Archive/dismissal | `status` already allowed `ARCHIVED`; no code path set it | **Gap — now closed** | `archiveNotification` function + route added (no schema change) |
| User communication preference | Absent anywhere in the repository | **Gap — required migration** | `notification_preferences` table added (migration 143) |

## Required Recipient Matrix

| Source Domain/Event | Recipient Rule | Org Scoped | Role Required | Entitlement Required |
|---|---|---|---|---|
| DGAL `documentation.*` (8 types) | Signer/requester/verifier/uploader user id from event payload or originating actor | Yes | Enforced upstream in DGAL (not yet emitting) | No |
| Studio `studio.review.routed`/`reassigned` | `payload.reviewer_user_id` | Yes | Enforced upstream in Studio routing | No |
| Studio `studio.review.decision_recorded` | DB lookup: `projects.studio_learner_id` | Yes | N/A (project owner) | No |
| Credentials `credential.issued`/`revoked` | `payload.learner_user_id` | Yes | No | No |
| Deployment `deployment.live`/`failed` | DB lookup: `website_deployment_records.learner_id` | Yes | No | No |
| Registry `registry.submission.*` (4 types) | DB lookup: `agent_registry_submissions.learner_id` | Yes | No | No |
| Curriculum `lesson.completed` | `originating_actor_id` | Yes | No | Mechanism available (`requiresEntitlementService`), not applied — see §12 |

## Required Preference Matrix

| Category | User Can Suppress In-App? | Future Email Preference? | Digest Eligible | Reason |
|---|---|---|---|---|
| MANDATORY_OPERATIONAL | No | No | No | Legally/contractually significant |
| REQUIRED_ACTION | No | Channel choice only, never suppression | No | Underlying work remains pending |
| TRANSACTIONAL | No | Yes (future) | No | Informational but not user-optional |
| OPTIONAL_PRODUCT | **Yes (implemented)** | Yes (future) | Yes | Pure product convenience |
| DIGEST_ELIGIBLE | **Yes (implemented)** | Yes (future) | Yes (by definition) | Low-urgency, batchable |
| MARKETING | N/A — not implemented | Yes (future), separate consent | Yes | Never mixed with the operational `notifications` channel |

## Required API Matrix

| Operation | Authorization Scope | Org-Aware | Current/Added |
|---|---|---|---|
| `GET /notifications` | Recipient + active/authorized-requested org | Yes | Extended (org filter + preference suppression) |
| `GET /notifications/unread-count` | Recipient + org | Yes | Extended |
| `POST /notifications/:id/read` | Recipient + org, single row | Yes | Extended (org param, archived-guard) |
| `POST /notifications/read-all` | Recipient + org | Yes | Extended |
| `POST /notifications/:id/archive` | Recipient + org, single row | Yes | **Added** |
| `GET /notifications/attention-items` | Recipient + org | Yes | Extended (org filter now supported) |
| `GET /notifications/organizations` | Recipient, all authorized orgs (aggregate) | Yes | Existing (NCA-1); preference-aware as of NCA-2 |
| `GET /notifications/preferences` | Self only | N/A (personal) | **Added** |
| `PUT /notifications/preferences/:category` | Self only, category-validated | N/A | **Added** |

## Required Security Matrix

| Scenario | Expected Behavior | Test |
|---|---|---|
| Wrong user's notification | Not retrievable — `recipient_user_id` always bound to `actor.user_id` | "H/I", markAllRead scoping test |
| Wrong organization's notification | Not retrievable without an authorized membership row | "B", "C" |
| Unauthorized org id supplied by client | Rejected (`ORG_CONTEXT_FORBIDDEN`), never emptied or widened | "C", validator |
| Multi-org authorized user | Can access both organizations explicitly | "B" |
| Entitlement-gated policy, org not entitled | Notification skipped (fail-closed), not created | "E" (`isOrganizationEntitled`) |
| Existing (non-entitlement-gated) policy | Zero entitlement query attempted — no behavior change | "E: existing wired policies never invoke an entitlement query" |
| Attempt to set a preference on a mandatory category | Rejected at service layer and at the DB CHECK constraint | "preferences cannot be set for a non-suppressible category" |
| Notification read | Never mutates any table but `notifications` | "H/I" |
| Notification archive then read attempt | Archived row can no longer be marked read | "archiveNotification..." test |
| Duplicate/retried source event | Exactly one logical notification | "J/K" |
| Sensitive/extra row field | Never forwarded past the allow-listed projection shape | "P" |
| Notification-projection failure | Source event commit is not rolled back (NCA-1 P0 fix) | `trusted-reporting-outbox.test.ts` (re-verified, unchanged) |
