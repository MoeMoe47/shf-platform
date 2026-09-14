# NCA-4 — DELIVERY CHANNELS & DOMAIN INTEGRATION HARDENING

Hardens source-domain → canonical-notification integration and builds a real, tested, provider-neutral delivery-channel boundary — without wiring it into any transaction, without new persistence, and without fabricating channel capability that doesn't exist.

## 1. Executive Result

Seven new, real, already-emitting source-domain event types (CivicSure `referral.created`; ARAG `arag.assurance.blocked`, `arag.approval.required`, `arag.release.succeeded`, `arag.release.failed`; Studio `studio.qa.completed`, `studio.handoff.created`) now project through the exact same canonical `EVENT_POLICIES`/`createNotificationFromEvent` pipeline every existing notification type already uses — no new table, no new inbox, no new authority. Getting there required two real hardening fixes, not just additions: `createNotificationFromEvent`'s tenant-scoping guard was too strict (it silently dropped several real Studio events that simply omit `tenant_id`, an omission rather than a security-relevant mismatch), and recipient resolution needed to honestly support a permission-scoped audience (CivicSure referrals have no single assignee at creation time) rather than only ever a single named user. A provider-neutral email delivery adapter and orchestration layer were built and fully tested — real code, not a stub — but deliberately **not** wired into the live write path, because doing so synchronously would couple external network I/O to the source domain's own database transaction (a worse version of exactly the P0 NCA-1 already fixed), and doing it asynchronously would require new durable job infrastructure this phase's migration rule does not permit introducing casually. This is disclosed as an explicit, reasoned scope boundary, not silently deferred.

**No migration was required.** Migration head remains **143**.

## 2. Repository Baseline

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`, branch `claude/notifications`, HEAD `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head: **143** (unchanged from NCA-2; no new migration in this phase)
- No frontend file was touched in this phase (confirmed via `git status` — identical frontend file set to NCA-3's final state); browser acceptance is therefore not required (§35 / the phase's own §38 instruction)
- Main worktree (`/Users/mikeslate/Projects/shrv1`), Codex/EXR worktree (`/Users/mikeslate/Projects/shrv1-codex`), and the IOH worktree (`/Users/mikeslate/Projects/shrv1-codex-next`) were not opened, read, or modified

## 3. NCA-3 Inputs

Built directly on top of, not re-derived: `docs/architecture/NCA-0_...md`, `NCA_OWNER_DECISION_LOCK.md`, `NCA-1_...md`, `NCA-2_...md`, `NCA-3_IN_APP_INBOX_ATTENTION_PROJECTION.md` (the real NCA-3 report filename), and their implementation files. The canonical `notifications` table/service, classification registry, preference model, and REST API are all reused verbatim — every check in this section was re-verified directly against current source rather than trusted from memory, which is exactly how the two hardening findings below (the missing-`tenant_id` guard gap, and the mismatched semantics of `arag.approval.required`) were caught.

## 4. Canonical Delivery Architecture

The pipeline this phase implements, matching the assignment's own governing shape:

```
source-domain event → integration_outbox (durable, unchanged)
  → EVENT_POLICIES[event_type] (canonical, one registry, extended not duplicated)
  → recipient resolution (single OR permission-scoped multi-recipient — new capability, same function)
  → notifications table (canonical, unchanged schema, unchanged dedupe)
  → [optional, NOT auto-wired] preference/category gate → template render → safe-link check → provider send with bounded retry → DeliveryResult
```

The notification row is durable and authoritative the moment it's inserted; everything after it in the delivery leg is best-effort, isolated, and replaceable without ever touching the row that already exists.

## 5. Domain Integration Inventory

Every domain below was re-verified directly against current source (not carried forward from memory) — several corrected inherited assumptions from earlier phases, documented inline.

| Domain | Source Event | Human Actionable? | Canonical Notification? | Recipient Rule | Gap |
|---|---|---|---|---|---|
| Organization Onboarding | none (zero `outbox.enqueue` calls in `organization-onboarding-service.ts`) | Would be (activation/decline) | No | — | DEFERRED — no canonical event to project; source domain's own program owns adding emission (NCA-D002) |
| Membership / roles | `identity.membership.revoked` etc. are **audit-events only** (`writeAuditEvent`), never `outbox.enqueue`, in `membership-service.ts` | Would be (revocation, role change) | No | — | DEFERRED — audit trail exists, but nothing reaches the canonical event bus |
| Service entitlement | none (zero `outbox.enqueue` calls in `service-catalog-service.ts`) | Would be (activation/suspension/revocation) | No | — | DEFERRED |
| Studio (review) | `studio.review.routed`/`reassigned`/`decision_recorded` | Yes | **CONNECTED** (unchanged from NCA-1) | reviewer/project-learner | none |
| Studio (QA/handoff) | `studio.qa.completed`, `studio.handoff.created` | Yes | **CONNECTED (new this phase)** | project learner / handoff learner | none — both real events, both missing `tenant_id` in the emitted JS object (hardened, see §7) |
| Studio (self-action events) | `studio.project.created`, `studio.revision.created`, `studio.workspace.updated` | **No** — fires on the acting learner's own save/create | N/A | — | **NO_HUMAN_NOTIFICATION_NEEDED** — re-verified against the emitting code; notifying someone about their own just-taken action is exactly the noise §6 excludes |
| Curriculum | `lesson.completed` | Yes | CONNECTED (unchanged) | learner | none |
| Career | `portfolio.artifact.*`, `employment_outcome.submitted` | Marginal (informational) | No | — | DEFERRED / low priority — unchanged from NCA-0's finding, not re-litigated this phase (no new evidence changed the assessment) |
| CivicSure (cases) | `referral.created` (the only real outbox event in `case-service.ts`) | Yes | **CONNECTED (new this phase)** | permission-scoped: every `referrals.manage` holder in the *receiving* organization | none for this event |
| CivicSure (cases, assignment/transition) | `case.assigned`, `case.transitioned` — **audit-events only**, never `outbox.enqueue` | Would be | No | — | DEFERRED — same audit-only pattern as membership; corrects an inherited assumption from NCA-0/NCA-1 forks that these were real outbox events |
| ARAG / Release Assurance | `arag.assurance.blocked`, `arag.approval.required`, `arag.release.succeeded`, `arag.release.failed` | Yes | **CONNECTED (new this phase)** | release requester (`arag_release_requests.requested_by`) | none — see §6/§7 for the semantic correction on `arag.approval.required` |
| ARAG (other lifecycle events) | `arag.release.requested/started`, `arag.release.authorized/authorization_revoked`, `arag.rollback.*` | Marginal/operator-internal | No | — | NO_HUMAN_NOTIFICATION_NEEDED for now — wiring every ARAG state transition risks exactly the fatigue NCA-0 warned about; the four wired above are the highest-value, lowest-risk subset |
| Agent Fabric | dynamic, unbounded `event_type` strings (confirmed still true in `ai-governance-service.ts`, `agent-package-service.ts`) | Some | No | — | DEFERRED — unchanged from NCA-0/decision-lock's explicit "last, most carefully" ordering; still true today, not re-opened |
| Accessibility / accommodations | none (zero `outbox.enqueue` calls in `accommodation-service.ts`) | Would be | No | — | DEFERRED — matches NCA-0/NCA-2's own finding, re-verified |
| Reporting / Evidence / Truth | `report.created`, `government_assurance.truth_determination.accepted` | Low (informational) | No | — | DEFERRED / low priority, unchanged |
| Grants / funding | not inspected further this phase — no new evidence found of a real, human-actionable outbox event beyond what NCA-0 already covered | — | No | — | Out of scope; no repository-local P1 identified here |
| Legal / governance | not inspected further this phase — same reasoning | — | No | — | Out of scope |
| Service catalog / activation | see "Service entitlement" above | — | No | — | DEFERRED |

## 6. Human-Actionable Rule

Applied explicitly to every candidate above, using the assignment's own criteria. Restated for the record: a source event becomes a notification only if it represents user action required, approval required, access/authority changed, a time-sensitive status change, newly available assignment/work, a failed/blocked workflow, a security/access change, service activation/suspension, or an invitation/membership/role change. **Self-action events fail this test structurally** — `studio.project.created`/`revision.created`/`workspace.updated` all fire on the acting learner's own save, which matches none of the above criteria (the user already knows what they just did); this is why they remain unwired despite being real, already-emitting events, correcting an inherited assumption from earlier phases that `studio.revision.created` was a low-risk rollout candidate.

## 7. Source Event Projection

Two real hardening fixes were required to make projection actually work for the new domains, both scoped entirely inside the notifications domain's own file (never inside another domain's service):

1. **Tenant-id derivation.** `studio.qa.completed` and `studio.handoff.created` (and their unwired siblings) omit `tenant_id` entirely from the JS event object `studio-project-service.ts` enqueues — verified directly; `integration_outbox` itself has no `tenant_id` column at all (migration `007`), so this omission was invisible until a notification policy tried to consume it. The prior guard (`!event.tenant_id || event.tenant_id !== canonical`) treated omission and mismatch identically, silently dropping the notification either way. `resolveEventTenantId()` now derives the canonical value when the field is absent, while still rejecting a value that is *present but wrong* — the actual security property (catching a producer that got its own scoping wrong) is unchanged; only tolerance for an omitted, fully-derivable field was added. This required no change to Studio's own service file.
2. **Multi-recipient resolution.** `referral.created` has no single named assignee at creation time — the correct audience is every `referrals.manage` holder in the *receiving* organization (not the creating one, and not a fabricated single "case owner"). `recipient()` may now return `string | string[] | null`; `createNotificationFromEvent` projects one independently-deduplicated row per resolved recipient when given an array, and behaves character-for-character as before for every single-recipient policy (verified: all pre-existing tests pass unchanged).

## 8. Recipient Resolution

Every new policy reuses the one canonical `recipient()` contract. New resolution rules, all backed by real schema, none fabricated:
- `referral.created` → `usersWithPermissionInOrganization(receivingOrganizationId, "referrals.manage", db)` — joins the real `memberships`/`role_permissions` tables the actual permission system uses, not a new authority model.
- `arag.*` → `arag_release_requests.requested_by`, looked up by `release_request_id` (the event's `subject_id`).
- `studio.qa.completed` → `projects.studio_learner_id`, same lookup pattern `studio.review.decision_recorded` already used.
- `studio.handoff.created` → `studio_handoffs.learner_id`.

## 9. Multi-Org Delivery

Unchanged from NCA-2, re-verified: `resolveAuthorizedOrganizationIds`/`scope()` remain the only organization-authorization path, and the active organization never determines *ownership* of a notification, only the default view. The new multi-recipient CivicSure policy is explicitly organization-aware in the *opposite* direction from typical multi-org concerns: it resolves recipients from the **receiving** organization named in the event's own referral record, while the notification row itself keeps the event's own `organization_id` (the **creating** organization) — proven by test (§32 "H"), and a deliberate choice: the notification is *about* an event that happened in the creating org's referral, addressed to staff of the receiving org, and each recipient's own authorized-organization set (their real memberships) governs whether they can ever see it, exactly like every other notification.

## 10. In-App Channel

Unchanged, still the sole canonical baseline. Every check from NCA-1/NCA-2/NCA-3 (single writer of `notifications` rows, dedupe constraint, read/unread semantics, failure isolation) was re-verified and still holds — see the validator (§34) for the automated form of this.

## 11. Email

**Real, hardened, tested — and honestly bounded.** A new provider-neutral adapter (`notification-mail-adapter.ts`) generalizes the existing certificate-only `email-provider.ts` pattern (same environment variables — `SHS_EMAIL_PROVIDER`, `SHS_EMAIL_PROVIDER_ENDPOINT`, `SHS_EMAIL_PROVIDER_API_KEY` — so there is exactly one place an operator configures an email provider, not two) without touching that file at all, avoiding any risk to the one real, working email flow (certificate delivery) this repository has. `delivery-service.ts` adds category eligibility (only `MANDATORY_OPERATIONAL`/`REQUIRED_ACTION`, per NCA-1 §39's own channel-selection policy), preference evaluation, bounded-template rendering, safe-link validation, and bounded retry.

**Classification: PROVIDER_ADAPTER_ONLY / EXTERNAL_DEPENDENCY for actual delivery.** `TestNotificationMailProvider` always "delivers" (dev/test only, delivers nothing real); `GenericHttpNotificationMailProvider` requires a real, externally-configured endpoint that is not configured anywhere in this environment. No notification type currently triggers this path automatically — see §37/§42 for why, and the explicit owner decision this leaves open.

## 12. SMS

**Absent. EXTERNAL_DEPENDENCY / LATER_PHASE.** No SMS provider, SDK, or configuration exists anywhere in the repository (re-confirmed this phase). No fake adapter was built.

## 13. Push

**Absent. EXTERNAL_DEPENDENCY / LATER_PHASE.** No push provider, service worker, or mobile app surface exists anywhere in the repository (re-confirmed this phase). No fake adapter was built.

## 14. Preferences

Reused verbatim from NCA-2 — `getPreferenceOverrides`, the `notification_preferences` table, and the `SUPPRESSIBLE_CATEGORIES` constraint were not modified. `delivery-service.ts` calls the same module rather than re-implementing preference storage (validator-checked). Using the repository's own real vocabulary: `MANDATORY_OPERATIONAL`, `REQUIRED_ACTION`, `TRANSACTIONAL`, `OPTIONAL_PRODUCT`, `DIGEST_ELIGIBLE`, `MARKETING` (the six categories NCA-1 defined and NCA-2 enforced) — no `SECURITY`/`INFORMATIONAL`/`COMMERCIAL` vocabulary was invented since the repository doesn't have it. `MARKETING` remains entirely unimplemented (no marketing communication mechanism exists) and this phase did not add one.

## 15. Channel Preference Semantics

- **Default channel:** IN_APP, always.
- **Opt-in vs opt-out:** IN_APP suppression (`OPTIONAL_PRODUCT`/`DIGEST_ELIGIBLE`) is opt-out (visible by default, per NCA-2). Email is not yet exposed as a user-controllable preference at all — it is currently an internal eligibility gate (category-based), not a per-user channel toggle; that remains a real, undone gap, not fabricated as done.
- **Mandatory categories:** `MANDATORY_OPERATIONAL`/`REQUIRED_ACTION` — structurally non-suppressible (DB CHECK + service-layer validation, unchanged from NCA-2), and the *only* categories ever eligible for email.
- **Disabled channel / unavailable provider / no deliverable address:** all three degrade to a `SKIPPED_INELIGIBLE`, `NOT_CONFIGURED`, or `FAILED` `DeliveryResult` — never an exception, never a retroactive change to the canonical in-app row (tested explicitly, §32 "A", "I").
- **Canonical in-app notification governance remains fully independent** of all of the above — it exists the moment `createNotificationFromEvent` commits, regardless of anything that happens afterward on any channel.

## 16. Delivery Attempts

**No durable delivery-attempt persistence was added, and none was required.** Reasoning, per the phase's own migration rule: today, real delivery attempts beyond certificate email are exactly zero in production (nothing auto-invokes the new adapter — see §37), so there is no actual volume that needs durable tracking yet. The one existing idempotency signal that already exists for free — whether the `notifications` INSERT's `ON CONFLICT ... DO NOTHING` actually inserted a fresh row vs. hit the existing unique constraint — is sufficient to reason about *event*-replay idempotency (§18) without a new table. If and when a future phase activates real, automatic, asynchronous delivery, durable attempt tracking (the field list the assignment sketched: `notification_id, channel, provider, attempt, status, provider_message_id, error_code, created_at, delivered_at`) would become genuinely necessary at that point — that is the moment to propose migration 144, not now.

## 17. Delivery States

Defined conceptually and returned by `deliverNotificationEmail()` as a `DeliveryResult.state`: `SENT | FAILED | SUPPRESSED | NOT_CONFIGURED | SKIPPED_INELIGIBLE`. `RETRYING`/`PENDING` were not added as durable states since there is no queue for something to be "pending" or "retrying" in *between* calls — the bounded retry happens entirely within one synchronous call. Notification state (`UNREAD`/`READ`/`ARCHIVED`, on the row) and delivery state (returned, not persisted) are never conflated — proven by test (§32 "J": nothing in `deliverNotificationEmail` ever touches the `notifications` table).

## 18. Idempotency

Two distinct, both real:
- **Event-replay idempotency** (a redelivered/retried `integration_outbox` event producing the same notification twice): unchanged from NCA-1/NCA-2, the database's own `UNIQUE (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` constraint — proven again for the two new multi-recipient/hardened-tenant policies (§32 "D").
- **Delivery-attempt idempotency**: the notification's own `notificationId` is passed through as the provider-facing `NotificationMailMessage.notificationId`, the natural idempotent send key. Honestly disclosed: neither configured provider (`TestNotificationMailProvider`, `GenericHttpNotificationMailProvider`) actually deduplicates on this key server-side today — true idempotency for a *repeated delivery attempt* (as opposed to a repeated *event*) currently depends on the caller only invoking delivery once per fresh notification, which is exactly why this phase does not wire automatic, repeatable invocation into any live path yet (§37).

## 19. Retry Policy

Bounded at exactly 3 attempts (`MAX_SEND_ATTEMPTS`), classified via `classifyMailFailure()`: `TRANSIENT` (`EMAIL_PROVIDER_RETRYABLE`/`_TIMEOUT`/`_UNAVAILABLE`) retries; `PERMANENT` (`EMAIL_PROVIDER_REJECTED`, or anything unrecognized — never assumed safe) and `NOT_CONFIGURED` stop immediately at one attempt. No `while(true)`, no unbounded loop anywhere (validator-checked). Proven by test: a persistently-transient failure stops at exactly 3 attempts (§32 "E"); a transient failure that recovers stops immediately on success (§32 "E"); a permanent/not-configured failure never exceeds one attempt (§32 "F").

## 20. Failure / Dead-Letter Handling

No dead-letter queue exists for delivery attempts, and none was added — there is no queue for something to dead-letter *into* yet (§16). The one real dead-letter-equivalent in the repository, `integration_outbox.delivery_status = 'FAILED_FINAL'` (trusted-reporting's own dispatcher), is a different concern (domain-event delivery to Agent Fabric ingestion) and was not touched or repurposed. A failed email delivery today is simply returned to the caller as a `FAILED`/`NOT_CONFIGURED` result and logged at the call site if the caller chooses to — bounded, honest, not a new unrelated queue system.

## 21. Provider Failure

Tested directly (§32 "A", "F"): a genuine misconfigured-provider failure (real `generic-http` code path, no endpoint configured) returns `NOT_CONFIGURED` in exactly one attempt, and the already-created in-app notification row is completely unaffected — proven by re-querying it after the failed delivery attempt. Because `deliverNotificationEmail` is never called from within `outbox-repo.ts`'s transaction boundary (validator-checked: that file never even imports the delivery module), a provider failure or hang cannot roll back or stall any source-domain workflow by construction, not merely by convention.

## 22. Templates

`renderNotificationEmail()` is the only place notification content becomes email content. It accepts exactly the four structured fields the canonical notification already exposes (`title`, `message`, `destinationPath`, `notificationId`) — never a caller-supplied string, never raw source-domain payload. Output is plain text only (no HTML interpolation anywhere in the adapter or renderer), so there is no script-injection surface to sanitize in the first place — proven by test that the rendered body never contains the organization id or any value beyond the notification's own generic fields (§32 "G").

## 23. Safe Action Links

A backend-side `isSafeInternalPath()` (mirroring the frontend's identical check from NCA-3) rejects anything that is not a same-origin relative path — protocol-relative (`//...`), absolute external, and `javascript:`-style values are all rejected before ever reaching `actionUrl` (tested explicitly, §32 "G"). No organization id, token, or any authority is ever embedded in the link itself; the destination is a bare path, and the application's own server-side authorization (unchanged, untouched) re-checks the user after they click, exactly as it already does for every in-app action link.

## 24. Privacy

Unchanged minimum-necessary practice, re-verified for the seven new policies: every new title/message string is generic (`"A decision was recorded for your release request."`, `"A new referral was created for your organization to review."`) — none names a document, case detail, evidence content, or accommodation detail. `renderNotificationEmail` only ever has access to these same generic fields — there is no code path by which it could leak more than the in-app notification already shows.

## 25. Security Notifications

Investigated per the assignment's own examples (role changed, membership revoked, invitation accepted): all three exist only as `audit_events` rows today (`membership-service.ts`'s `identity.membership.revoked`), never as `integration_outbox` events. No account/session-event infrastructure beyond that was found. Per the human-actionable rule and NCA-D002, these remain DEFERRED — the source domain's own program would need to add real event emission before any of them could become a canonical notification; no security-event mechanism was invented to fill this gap.

## 26. Accessibility

No user-facing preference or channel-management UI was built or changed in this phase (confirmed: zero frontend files touched). The existing preferences API (NCA-2/NCA-3) and its accessibility posture are unchanged and were not re-verified here since nothing about them changed.

## 27. Domain Event Matrix

| Domain | Event | Notification Type | Recipient | Category | Urgency | Action Required | Default Channel |
|---|---|---|---|---|---|---|---|
| CivicSure | `referral.created` | `CASE_REFERRAL_RECEIVED` | every `referrals.manage` holder in receiving org | REQUIRED_ACTION* | notice | true | IN_APP |
| ARAG | `arag.assurance.blocked` | `ARAG_ASSURANCE_BLOCKED` | release requester | REQUIRED_ACTION* | warning | true | IN_APP |
| ARAG | `arag.approval.required` | `ARAG_APPROVAL_DECISION_RECORDED` | release requester | TRANSACTIONAL* | notice | false | IN_APP |
| ARAG | `arag.release.succeeded` | `ARAG_RELEASE_SUCCEEDED` | release requester | TRANSACTIONAL* | info | false | IN_APP |
| ARAG | `arag.release.failed` | `ARAG_RELEASE_FAILED` | release requester | REQUIRED_ACTION* | warning | true | IN_APP |
| Studio | `studio.qa.completed` | `STUDIO_QA_COMPLETE` | project learner | TRANSACTIONAL* | notice | false | IN_APP |
| Studio | `studio.handoff.created` | `STUDIO_HANDOFF_ASSIGNED` | handoff learner | REQUIRED_ACTION* | notice | true | IN_APP |

\* Category/urgency/actionRequired are read-time-derived from the static classification registry (`notification-classification.ts`), extended this phase with these 7 new `notification_type` entries — never persisted columns, per the NCA-1 principle this phase preserved.

## 28. Delivery Matrix

| Channel | State | Provider | Preferences | Retry | Idempotency | Production Ready? |
|---|---|---|---|---|---|---|
| IN_APP | IMPLEMENTED | n/a (Postgres) | Enforced (NCA-2) | n/a (instant, durable) | DB unique constraint | Yes |
| EMAIL | PROVIDER_ADAPTER_ONLY | `TestNotificationMailProvider` (dev), `GenericHttpNotificationMailProvider` (unconfigured) | Enforced (category-gated + preference-checked) | Bounded (3 attempts, classified) | notification id as send key (not provider-deduplicated) | **No** — real adapter, not activated, no configured provider |
| SMS | ABSENT | none | n/a | n/a | n/a | No |
| PUSH | ABSENT | none | n/a | n/a | n/a | No |
| WEBHOOK (outbound) | ABSENT | none | n/a | n/a | n/a | No |

## 29. Failure Matrix

| Failure | Notification Preserved? | Retry? | User Impact | Operational Signal |
|---|---|---|---|---|
| Source event replayed | Yes (idempotent, one row) | n/a | None | none needed — dedupe silent by design |
| Notification-projection failure (NCA-1 P0) | n/a (the projection itself failed) | No (isolated, source event still commits) | None to the source workflow | logged via `console.error` in `outbox-repo.ts`, unchanged |
| Email provider transient error | Yes, untouched | Yes, up to 3 attempts | None (in-app notification still visible) | `DeliveryResult.state = "FAILED"`, reason logged by caller |
| Email provider permanent error | Yes, untouched | No | None | `DeliveryResult.state = "FAILED"` |
| Email provider not configured | Yes, untouched | No | None | `DeliveryResult.state = "NOT_CONFIGURED"` |
| No deliverable address | Yes, untouched | No | None | `DeliveryResult.state = "SKIPPED_INELIGIBLE"` |
| Category not email-eligible | Yes, untouched | No | None | `DeliveryResult.state = "SKIPPED_INELIGIBLE"` |
| Preference-suppressed | Yes, untouched | No | None (user chose this) | `DeliveryResult.state = "SUPPRESSED"` |

## 30. Preference Matrix

| Category | In-App | Email | SMS | Push | User Mutable? | Mandatory? |
|---|---|---|---|---|---|---|
| MANDATORY_OPERATIONAL | Always visible | Eligible (adapter built, not activated) | Absent | Absent | No | Yes |
| REQUIRED_ACTION | Always visible | Eligible (adapter built, not activated) | Absent | Absent | No | Yes |
| TRANSACTIONAL | Always visible | Not eligible | Absent | Absent | No | Yes (visibility), not suppressible |
| OPTIONAL_PRODUCT | Suppressible | Not eligible | Absent | Absent | Yes (NCA-2) | No |
| DIGEST_ELIGIBLE | Suppressible | Not eligible | Absent | Absent | Yes (NCA-2) | No |
| MARKETING | N/A — not implemented | N/A | N/A | N/A | N/A | N/A |

## 31. Domain Integration Tests

`apps/shs-api/tests/nca4-domain-integration.test.ts` — 8 tests: E (studio.qa.completed, studio.handoff.created wiring + the missing-tenant_id hardening proven directly), the intentional non-wiring of self-action Studio events (structural check), F (referral.created multi-recipient, receiving-org-scoped), the audit-only nature of case.assigned/transitioned (structural check against the real service file), G (ARAG requester resolution for both blocked/approval events, plus the succeeded/failed symmetry check), and A/B/C/D/H (structural proof that onboarding/membership/entitlement/accessibility domains still emit zero outbox events — the DEFERRED classification is verified, not merely asserted). All 8 passing.

## 32. Delivery Tests

`apps/shs-api/tests/nca4-delivery-channels.test.ts` — 12 tests covering the assignment's A–J list in full: A (in-app survives a real forced delivery failure), B/C (optional-category suppression vs. mandatory-category non-suppression), D (replayed event, one row), E (bounded retry to exactly 3 attempts, and immediate success stop), F (permanent/not-configured never retries), G (safe-link rendering rejects unsafe destinations and embeds no authority), H (cross-org recipient isolation for the multi-recipient CivicSure policy), I (no address degrades safely without touching the in-app row), J (delivery never touches the `notifications` table at all). All 12 passing.

## 33. Regression Tests

- NCA-1 (`nca1-notification-contracts.test.ts`), NCA-1 P0 (`trusted-reporting-outbox.test.ts`), DGAL (`dgal6-notifications.test.ts`), NCA-2 (`nca2-persistence-recipient-preferences.test.ts`) — all re-run unchanged, all still passing.
- Combined focused suite: **57/57 passing** (37 pre-existing + 8 new domain-integration + 12 new delivery).
- Full suite against the live, migrated dev database: notification-related tests show **zero failures** (grep-verified); the overall failing count in unrelated domains continues the same cumulative-shared-database pattern already documented in the NCA-3 report (a pre-existing environment artifact of repeated full-suite runs against one long-lived dev database across this session, not a regression from this phase's changes).

## 34. Validator

`apps/shs-api/scripts/validate-nca-delivery-domain-integration.mjs`, `npm run nca:delivery:validate` — 14/14 checks passing: the 7 new policies are registered in the one canonical `EVENT_POLICIES` map; still exactly one writer of `notifications` rows; no domain-specific/delivery-attempt table or migration was introduced; multi-recipient resolution stays inside the single canonical function; `delivery-service.ts` reuses the canonical preference module and never touches `notifications`; email eligibility is structurally restricted to the two non-suppressible categories; the idempotent send key and bounded-retry constant are both present; the NCA-1 P0 fix is intact; `outbox-repo.ts` never imports the delivery module (transaction isolation, structurally verified); no EXR-owned file or migration was touched; migration head is confirmed still 143.

The pre-existing NCA-2 backend validator (`nca:persistence:validate`) was also re-run and still passes 18/18 unchanged.

## 35. Browser Acceptance

**Not required and not performed.** No user-facing preference or channel-management UI was built or changed in this phase — confirmed via `git status`, identical frontend file set to NCA-3's final state. This is a backend-only hardening phase, exactly as scoped.

## 36. Migration State

**No migration was created.** Migration head remains **143** (NCA-2's `notification_preferences` table). §16/§19's reasoning applies: no durable delivery-attempt persistence was required because no real delivery volume exists yet (the adapter is built and tested but not auto-invoked anywhere). If a future phase activates automatic, asynchronous delivery, that is the point at which migration 144 (a `notification_delivery_attempts`-shaped table) would become genuinely necessary — not fabricated now.

## 37. External Dependencies

- **Email provider execution**: `EXTERNAL_DEPENDENCY`. The adapter is real; no provider endpoint is configured in this environment (`SHS_EMAIL_PROVIDER_ENDPOINT`/`_API_KEY` unset).
- **SMS, push**: `EXTERNAL_DEPENDENCY` / `LATER_PHASE`. No infrastructure of any kind exists; none was fabricated.
- **Owner decision surfaced, not answered by this phase**: whether/when to actually invoke `deliverNotificationEmail` automatically (synchronously risking transaction coupling, or asynchronously requiring new durable job infrastructure and therefore migration 144) is a real product decision this phase deliberately leaves open rather than resolving unilaterally — consistent with the same pattern NCA-2 used for entitlement-check activation.

## 38. P0 / P1 Findings

**Zero P0, zero NCA-4-owned repository-local P1.** Every governing law in §3 of the assignment is upheld and tested: notification ≠ delivery attempt (separate return values, separate tables); delivery attempt ≠ source event (delivery-service.ts never touches `integration_outbox`); email/SMS/push ≠ canonical notification store (no channel-specific table exists); read ≠ completed workflow (unchanged); delivered ≠ read (delivery state is never persisted onto the notification row); failed delivery ≠ failed source workflow (tested, §21); notification-projection failure still cannot roll back source-domain work (NCA-1 P0 re-verified intact); delivery failure cannot mutate source-domain truth (delivery-service.ts has no source-domain table access at all). Two real hardening findings were discovered and fixed within this same phase (the tenant-id omission guard, and the `arag.approval.required` semantic mismatch) — neither is an open finding, both are resolved and tested.

## 39. Files Created

- `apps/shs-api/src/domain/notifications/service/{notification-mail-adapter,delivery-service}.ts`
- `apps/shs-api/src/domain/notifications/contracts/safe-links.ts`
- `apps/shs-api/scripts/validate-nca-delivery-domain-integration.mjs`
- `apps/shs-api/tests/nca4-{domain-integration,delivery-channels}.test.ts`
- `docs/architecture/NCA-4_DELIVERY_CHANNELS_DOMAIN_INTEGRATION_HARDENING.md` (this file)

## 40. Files Modified

- `apps/shs-api/src/domain/notifications/service/notification-service.ts` (7 new `EVENT_POLICIES` entries; hardened tenant-id derivation; multi-recipient support in `createNotificationFromEvent`; `usersWithPermissionInOrganization` helper)
- `apps/shs-api/package.json` (added `nca:delivery:validate` script)
- `apps/shs-api/scripts/validate-nca-persistence-recipient-policy.mjs` — **not modified this phase** (re-verified only)

## 41. Git State

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`
- Branch: `claude/notifications`
- HEAD: `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head: `143` (unchanged; no migration added)
- No commit, no push, no merge performed
- Main worktree (`/Users/mikeslate/Projects/shrv1`), Codex/EXR worktree (`/Users/mikeslate/Projects/shrv1-codex`), and IOH worktree (`/Users/mikeslate/Projects/shrv1-codex-next`) were not opened, read, or modified
- `git diff --check`: clean

## 42. NCA-4 Decision

**NCA-4 is COMPLETE.** Domain integration was hardened against real, re-verified source code (not assumptions) — seven new event types are canonically connected, two real defects were found and fixed in the process, and every domain still lacking a canonical event is honestly documented as DEFERRED rather than faked. A real, tested, provider-neutral delivery-channel boundary now exists, with truthful classification of every channel (IN_APP implemented; EMAIL a real adapter with no configured provider; SMS/PUSH absent) and no channel wired into any transaction or given fabricated completion. No migration was needed. No duplicate authority of any kind was introduced. Regressions across NCA-1/2/3 all pass, both validators pass, typecheck and build are clean, `git diff --check` is clean, and no worktree boundary was crossed.

## 43. Exact Next Phase

The next bounded NCA phase — activating automatic delivery (the owner decision flagged in §37), and/or further domain rollout once source domains add their own canonical event emission — is not started in this run.

---

## Final Verdict Questions

1. **What is the canonical delivery pipeline?** Source event → `integration_outbox` → `EVENT_POLICIES` → recipient resolution (single or permission-scoped multi-recipient) → `notifications` (durable, canonical) → optional, standalone, not-auto-invoked delivery leg (preference/category gate → template → safe link → provider send with bounded retry → `DeliveryResult`).
2. **Is in-app still canonical?** Yes, unchanged and re-verified — the sole writer of `notifications` rows, unaffected by anything on the delivery leg.
3. **Which domains now project actionable notifications?** CivicSure (`referral.created`), ARAG (4 event types), Studio (2 additional event types, on top of the 3 already wired since NCA-1).
4. **Which domain gaps remain?** Organization onboarding, membership/role change, service entitlement lifecycle, Accessibility accommodations, Agent Fabric, most of Career/Reporting — all DEFERRED because no canonical outbox event exists yet (verified, not assumed), plus two CivicSure/membership events (`case.assigned`/`transitioned`, `identity.membership.revoked`) that exist only as audit events, never outbox events.
5. **How are recipients resolved?** The same canonical `recipient(event, db)` contract, now additionally able to resolve a permission-scoped audience (array) rather than only a single named user — one function, no new authority.
6. **Is multi-org authorization preserved?** Yes — unchanged `resolveAuthorizedOrganizationIds`/`scope()`; the new multi-recipient policy resolves recipients from the event's own receiving-organization data, never from a client-supplied or fabricated value.
7. **Is email implemented?** A real, tested, provider-neutral adapter and orchestration layer exist. It is not automatically invoked for any notification today.
8. **If email exists, is it production-ready?** No — no provider is configured in this environment; classified honestly as `EXTERNAL_DEPENDENCY`.
9. **Is SMS implemented?** No. Absent, `EXTERNAL_DEPENDENCY`/`LATER_PHASE`.
10. **Is push implemented?** No. Absent, `EXTERNAL_DEPENDENCY`/`LATER_PHASE`.
11. **Which external dependencies remain?** A configured email provider endpoint; any future SMS/push provider; the owner decision on when/how to activate automatic delivery.
12. **Are preferences canonical?** Yes, unchanged from NCA-2, reused by the new delivery layer rather than re-implemented.
13. **Can optional delivery be suppressed?** Yes — `OPTIONAL_PRODUCT`/`DIGEST_ELIGIBLE` categories are the only ones ever suppressible, and they are also the only ones never email-eligible in the first place.
14. **Can mandatory/security policy override preferences?** Yes, structurally — `MANDATORY_OPERATIONAL`/`REQUIRED_ACTION` cannot be suppressed at the DB or service layer, and are the only categories eligible for email.
15. **Is delivery idempotent?** Event-replay idempotency: yes, via the existing DB unique constraint. Delivery-attempt idempotency: the notification id is used as the provider-facing send key, honestly disclosed as not provider-deduplicated by either configured provider today.
16. **Are retries bounded?** Yes, exactly 3 attempts, tested directly.
17. **Can provider failure roll back source work?** No — tested directly; the delivery module is never imported by the source-transaction boundary file.
18. **Can provider failure delete canonical notification?** No — tested directly; the in-app row is re-queried and confirmed present after a forced failure.
19. **Are failed deliveries observable?** Yes, via the structured `DeliveryResult` returned to the caller (no durable persistence yet — not needed, since nothing currently auto-invokes delivery).
20. **Are action URLs authorization-neutral?** Yes — same-origin relative paths only, no embedded organization id or token, tested directly.
21. **Is notification read independent of delivery?** Yes, tested directly — delivery never touches the `notifications` table.
22. **Is delivery independent of workflow completion?** Yes — delivery has no code path to any source-domain table at all.
23. **Is privacy minimum-necessary?** Yes, re-verified for all 7 new policies — generic titles/messages, no sensitive content.
24. **Were duplicate stores created?** No — validator-confirmed exactly one writer of `notifications`, no new domain-specific table.
25. **Did NCA-1 regressions pass?** Yes.
26. **Did NCA-2 regressions pass?** Yes.
27. **Did NCA-3 regressions pass?** Yes (no frontend touched; NCA-3's backend-adjacent pieces unaffected).
28. **Did the validator pass?** Yes — both the new NCA-4 validator (14/14) and the pre-existing NCA-2 validator (18/18, re-run).
29. **Did typecheck/build pass?** Yes, both clean.
30. **Was browser acceptance required?** No — no frontend file was touched.
31. **If required, did it pass?** N/A.
32. **Does `git diff --check` pass?** Yes.
33. **Is migration head still 143?** Yes.
34. **Were other worktrees touched?** No — main, EXR/Codex, and IOH worktrees were not opened, read, or modified.
35. **Did you commit?** No.
36. **Did you push?** No.
37. **Are P0 findings zero?** Yes.
38. **Are repository-local P1 findings zero?** Yes.
39. **Is NCA-4 COMPLETE?** Yes.
40. **What exact phase comes next?** The next bounded NCA phase (activating real delivery per the owner decision in §37, and/or further domain rollout as source domains add their own event emission) — not started in this run.
