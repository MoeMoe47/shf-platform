# NCA-1 — CANONICAL NOTIFICATION CONTRACTS, CONSOLIDATION & POLICY

Implements the owner-approved decisions in `docs/architecture/NCA_OWNER_DECISION_LOCK.md` (NCA-D001 canonical infrastructure, NCA-D002 canonical user inbox) against the evidence in `docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md`. Backend-only, additive, no migration, no major UI.

## 1. Scope Executed

- Fixed the approved P0: notification-projection failure no longer risks rolling back the source domain event's own commit.
- Formalized the communication-event and notification-projection contracts as TypeScript types, mapped field-for-field onto the real `integration_outbox`/`notifications` schemas — no schema change.
- Built the mandatory/optional, urgency, and channel-eligibility classification as a static, read-time registry over the ~19 real, already-wired `notification_type` values — no new column, no migration.
- Implemented the canonical attention-item projection (actionRequired-filtered view of a user's notifications) as a new read-only endpoint, ready for EXR to place into `SeaAttention` or any future slot.
- Implemented the owner-approved multi-org inbox behavior: notifications keep their originating organization; the active-org-scoped view remains the default; a new aggregate, non-blocking cross-org unread signal is now available — no organization's notifications are silently hidden.
- Left transactional email, digests, quiet hours, retention, external channels (SMS/push/webhook), BOS/Agent Fabric wiring, and any UI/shell work untouched, per explicit instruction.

## 2. What Was NOT Done (explicit exclusions honored)

- No inbox visual redesign — every change is backend (types + one service file + one routes file + tests).
- No transactional email implementation.
- No SMS or push infrastructure.
- No BOS/Agent Fabric cross-program architecture resolution (NCA-D013 stays: keep both domain-local with canonical projection — unchanged, not touched this phase).
- No migration. Migration head remains `142`.
- No commit, no push.
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified.

## 3. P0 Fix — Failure Isolation (NCA-D001)

**File:** `apps/shs-api/src/domain/trusted-reporting/outbox-repo.ts`

**Before:** `IntegrationOutboxRepo.enqueue()` called `createNotificationFromEvent(...)` using the same `executor` the caller passed in (often a transaction-scoped client from `withTransaction`, confirmed by reading real callers: `credential-service.ts`, `reviewer-routing-service.ts`). If notification-projection creation threw — a bad recipient-lookup query, for example — the exception propagated out of `enqueue()`, and callers using `withTransaction` would roll back, undoing the source domain write (e.g. credential issuance) that had nothing to do with the notification failure.

**After:** the call is wrapped in try/catch. A notification-projection failure is logged (`console.error`, including `outbox_event_id`, `event_type`, `organization_id`, and the error message — no payload contents, consistent with the minimum-necessary logging practice already used elsewhere) and swallowed. The outbox insert — the source event — always returns successfully regardless of what happens downstream in the notification projection.

**Verified, not assumed:** a new test, `NCA-1 / NCA-D001: a notification-projection failure never fails or rolls back the source outbox event` (`apps/shs-api/tests/trusted-reporting-outbox.test.ts`), constructs an executor whose `INSERT INTO notifications` call throws, and asserts `enqueue()` still resolves with the stored outbox row and that exactly one error was logged. This test would have failed before the fix (the throw would have propagated out of `enqueue()`); it passes now.

**What this does not change:** the notification is still attempted synchronously, in the same executor, so it still benefits from being inside the caller's transaction in the success case (no new async infrastructure was introduced, consistent with NCA-0's finding that no general-purpose job queue exists to build on). Only the failure path changed. A lost notification projection is now a recoverable gap (the source event still exists on the outbox row), never a reason to lose the source event.

## 4. Canonical Contracts (formalized, not new infrastructure)

**File:** `apps/shs-api/src/domain/notifications/contracts/communication-contracts.ts` (new, types only)

Defines, field-for-field against the real schema:
- `CommunicationEventContract` — maps onto `integration_outbox` (migration `007`). Every field NCA-0 §28 found "already real" is documented as such; fields NCA-0 found missing (`severity`, `actionRequired`, `privacyClassification`, `expiresAt`) are marked `reserved`/optional, not persisted, and not fabricated.
- `NotificationProjectionContract` — maps onto `notifications` (migration `081`). Adds `category`, `actionRequired`, `urgency`, `channelEligibility`, `actionState` as documented **derived, read-time** fields (computed by the new classification registry, not stored).
- `AttentionItemContract` — the canonical shape NCA now owns and supplies to whatever slot EXR defines, per the locked EXR boundary.
- `RecipientResolutionContract<TEvent>` — names the real, working `recipient(event, db)` signature already used by all ~19 `EVENT_POLICIES` entries, verbatim, plus a **reserved, unenforced** `entitlementCheck` extension point explicitly deferred to NCA-2 (per the decision lock — NCA-1 does not add entitlement enforcement).

No existing `recipient()` implementation was changed. This file changes no runtime behavior by itself.

## 5. Notification vs. Attention / Mandatory-Optional / Urgency / Channel Eligibility (implemented, not just documented)

**File:** `apps/shs-api/src/domain/notifications/contracts/notification-classification.ts` (new)

A static registry, `NOTIFICATION_CLASSIFICATION`, keyed by the real `notification_type` values already produced by `EVENT_POLICIES` (`REVIEW_ASSIGNED`, `CREDENTIAL_EARNED`, `DOCUMENTATION_SIGNATURE_REQUIRED`, etc. — all 19 covered), each mapped to `{ category, actionRequired, urgency, channelEligibility }` using the six-category model and four-level urgency scale locked in the owner decision package. `classifyNotificationType()` looks up this registry and falls back to a conservative default (`OPTIONAL_PRODUCT`, not action-required, `info`, `IN_APP` only) with a logged warning for any future type someone adds to `EVENT_POLICIES` without adding a matching classification — so a gap is visible in logs, never silently mis-triaged as more or less urgent than it should be.

**Wired into the real response path:** `mapNotification()` in `notification-service.ts` now calls `classifyNotificationType()` and includes `category`, `actionRequired`, `urgency`, `channelEligibility`, and a derived `actionState` (`NO_ACTION` or `ACTION_REQUIRED` only — `ACTION_COMPLETED`/`EXPIRED` are explicitly **not** derived from read/archive state, per the governing law that notification read state must never be treated as proof of underlying completion) in every `GET /notifications` response, effective immediately, with no migration.

## 6. Canonical Attention-Item Projection

**New function:** `listAttentionItems(actor)` in `notification-service.ts` — reuses `listNotifications` (inheriting its existing org/tenant/recipient scoping and security guarantees exactly, rather than re-implementing them) and filters to `actionRequired === true`, projecting the `AttentionItemContract` shape.

**New route:** `GET /notifications/attention-items` — the concrete data contract EXR (or any future consumer of `SeaAttention`) can call. This is the API-level answer to NCA-0 §33: `SeaAttention` remains a presentation-only primitive; this endpoint is the first canonical backend source for the `items` it renders, rather than each page computing its own list. No UI was built or changed.

## 7. Multi-Org Canonical Inbox Behavior (owner-approved)

**Approved requirement (verbatim from the owner approval):** notifications retain their originating organization identity; changing the active organization does not destroy or hide otherwise authorized notifications; the UI may default to current-organization context but must have a safe way to access other authorized organizations' notifications; organization context must remain understandable on every notification.

**What already satisfied this:** every `notifications` row already carries `organization_id`/`tenant_id` (unchanged), and switching the active organization (via the existing, already-authorization-checked `x-shs-organization-id` header path in `apps/shs-api/src/auth/organization-context.ts`) already gives full, correctly-scoped access to that other organization's notifications — nothing was silently destroying data. The actual gap NCA-0 found was **visibility**: no signal existed to tell a user they had unread, authorized notifications in a non-active organization.

**What was added:**
- `resolveAuthorizedOrganizationIds(actor)` (new, pure, exported function) — derives the full set of organizations a user is authorized to see notifications for, from `actor.memberships` (already resolved and verified as active by the auth layer's `ProductionIdentityRepo.getActiveIdentity` / `organization-context.ts` — this function does **not** re-implement or second-guess that authorization, it only reads it) plus the current active organization as a safety net.
- `unreadCountsByOrganization(actor)` — returns `{ organizationId, isActive, unreadCount }` for every organization the user is authorized in, computed with one aggregate query scoped to `recipient_user_id` and `organization_id = ANY(...)`.
- **New route:** `GET /notifications/organizations` — the concrete aggregate, non-blocking cross-org signal. It does **not** merge other organizations' notification content into the active view (that would make organization context harder to understand, the opposite of what was approved) — it only tells the caller which other authorized organizations have unread notifications, so a UI can render something like "2 unread in another organization" without silently hiding it and without dumping unrelated organizations' content into one undifferentiated list.

**Verified by test**, not assumed: `resolveAuthorizedOrganizationIds` is unit-tested directly (no DB required) for: including every membership organization plus the active one, deduplication, graceful handling of missing/malformed input, and — the specific regression this exists to prevent — that an authorized non-active organization is never dropped from the result.

## 8. Mandatory vs. Optional / Privacy / Security — confirmed unchanged, not touched

- No preference/suppression enforcement was added (correctly deferred to NCA-2 — no preference table exists, and none was created here).
- No notification message string was changed; the existing minimum-necessary practice NCA-0 verified (generic references, never document/case/release content) is untouched.
- No entitlement/permission check was added to any `recipient()` function (deferred to NCA-2 per the decision lock; the reserved contract field exists so this is additive later, not a breaking change).
- No new security surface: the two new routes reuse the existing `requireNotificationContext` middleware verbatim (401 with no `req.user`, 403 with no valid active org/tenant) and the same parameterized, org/tenant/recipient-scoped query pattern as every existing route.

## 9. Read / Action-State Semantics

`actionState` is now a real, computed field: `"NO_ACTION"` when the classification says no action is required, `"ACTION_REQUIRED"` otherwise. `"ACTION_COMPLETED"` and `"EXPIRED"` are defined in the type (`NotificationActionState`) but never produced today — per the governing law, completion must be derived from source-domain workflow state, and no source-domain completion signal is wired back into notifications yet. Producing a false `ACTION_COMPLETED` from `status === 'READ'` was considered and explicitly rejected — that is precisely the conflation NCA-0 warned against (a user opening/reading a notification must never be treated as proof the underlying work is done).

## 10. Deduplication / Idempotency — reused verbatim, not re-implemented

No change. The existing `(organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` unique constraint and the outbox's own `(organization_id, producer_id, idempotency_key)` constraint remain the entire dedupe/idempotency model, exactly as NCA-0 recommended reusing them.

## 11. EXR Shell Interface Contract

The two new endpoints (`GET /notifications/attention-items`, `GET /notifications/organizations`) and the `AttentionItemContract`/`NotificationProjectionContract` types are the concrete "data NCA supplies" half of the locked EXR boundary. Nothing about shell placement, header structure, navigation, or the organization-context switcher UI was touched — those remain entirely EXR's, consistent with `docs/architecture/NCA_OWNER_DECISION_LOCK.md` §16.

## 12. Disconnected Mechanisms Requiring Later Adapters (carried forward, not resolved here)

Unchanged from NCA-0/decision lock, restated for continuity — none of these were touched in NCA-1:
- `StoreHeader.jsx`, `ArcadeHeaderExtras.jsx`, `CivicTopBar.jsx` fake bells — targeted for NCA-3 adaptation to the real bell/inbox, once EXR's shell slot convention exists.
- `src/system/notification-fabric/*` (BOS, localStorage) and `services/shf-agent-fabric/services/notification_alert_service.py`/`event_webhook_service.py` (Python classification) — remain domain-local per NCA-D013, unchanged; their eventual canonical-projection adapter is NCA-5 scope.
- `src/shared/inbox/inbox.js` (employer/sales) — low priority, unchanged.
- DGAL, Accessibility Accommodations, and Organization Onboarding still do not emit real domain events — their classification entries exist now (`DOCUMENTATION_*` types) so the moment each domain's own program adds `enqueue()` calls (per NCA-D002/ownership decision — NCA does not add that emission itself), the existing policy and the new classification both activate with no further NCA work required.

## 13. Testing

All new/changed logic is covered without requiring a live database connection (consistent with the existing test suite's pattern — live-DB tests are a separate `.live.test.ts` convention not exercised in this environment):
- `apps/shs-api/tests/trusted-reporting-outbox.test.ts` — added 1 test proving the P0 fix (14 → 15 tests in file, all passing).
- `apps/shs-api/tests/nca1-notification-contracts.test.ts` — new file, 7 tests covering the classification registry (known types, channel-eligibility invariant, unknown-type fallback) and `resolveAuthorizedOrganizationIds` (dedup, fallback, malformed input, the specific "never drop an authorized org" regression).
- `npx tsc --noEmit` passes cleanly against `src/**/*` (exit 0).
- Full suite: `1154` tests total (`1146` baseline + `8` new), `680` passing (`672` baseline + `8` new), `448` failing — identical failing count to the pre-change baseline, confirmed by running the baseline first; all failures are pre-existing `.live.test.ts` files requiring a real Postgres connection unavailable in this environment, unrelated to this change.

## 14. Files Created

- `apps/shs-api/src/domain/notifications/contracts/communication-contracts.ts`
- `apps/shs-api/src/domain/notifications/contracts/notification-classification.ts`
- `apps/shs-api/tests/nca1-notification-contracts.test.ts`
- `docs/architecture/NCA-1_CANONICAL_NOTIFICATION_CONTRACTS_CONSOLIDATION_POLICY.md` (this file)

## 15. Files Modified

- `apps/shs-api/src/domain/trusted-reporting/outbox-repo.ts` (P0 fix)
- `apps/shs-api/src/domain/notifications/service/notification-service.ts` (classification wiring, `listAttentionItems`, `resolveAuthorizedOrganizationIds`, `unreadCountsByOrganization`)
- `apps/shs-api/src/domain/notifications/api/routes.ts` (two new read-only routes)
- `apps/shs-api/tests/trusted-reporting-outbox.test.ts` (P0-fix test)

## 16. Git State

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`
- Branch: `claude/notifications`
- HEAD before and during this phase: `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head: `142` (unchanged; no migration added)
- No commit, no push, no merge performed
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified

## 17. Exact Next Step

NCA-1's contract/consolidation/policy scope, as defined by the owner approval, is implemented and tested. Remaining owner decisions not yet approved (transactional email timing, retention window, mandatory-category assignment for future event types, BOS/Agent Fabric wiring) continue to gate their respective later phases (NCA-2 through NCA-5) per `docs/architecture/NCA_OWNER_DECISION_LOCK.md` §20 — none of them block further NCA-1 work. This phase is not committed or pushed; awaiting instruction before any git action.
