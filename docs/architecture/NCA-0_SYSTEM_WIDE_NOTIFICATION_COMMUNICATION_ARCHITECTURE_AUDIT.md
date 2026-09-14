# NCA-0 — SYSTEM-WIDE NOTIFICATION & COMMUNICATION ARCHITECTURE AUDIT

Audit-only. No production source, migration, commit, push, or shared-shell change was made in this phase.

## 1. Executive Result

Silicon Heartland already contains a **real, working, canonical notification system** that this audit found rather than one that needs to be invented:

- A canonical **durable event bus** (`integration_outbox`, migration `007_integration_outbox.sql`) with lease-based claiming, retry, quarantine, idempotency keys, and correlation IDs. ~34 domain services already emit into it.
- A canonical **in-app notification projection** (`notifications` table, migration `081_notification_integration.sql`) that is created **transactionally alongside** outbox events, is org/tenant/recipient scoped, deduplicated by a unique constraint, and has real `UNREAD`/`READ`/`ARCHIVED` state.
- A real, wired, accessible **bell + inbox UI** in one shell (`CurriculumHeader.jsx`, `src/pages/Notifications.jsx`) that reads/writes this system live.
- A registered **canonical layer** in `docs/MASTER_LAYER_REGISTRY.md` ("Notification / Alert", Communications family) that already declares the boundary this project must respect: notification/alert **readiness** classification is in scope; sending external email/SMS/push/webhook is explicitly out of scope for V1.

The central finding is **not** "build a notification system." It is: **a real one exists, only ~11 of dozens of real domain events are wired to it, three other app shells built their own disconnected placeholder bells instead of reusing the real one, and one internal admin-only "notification fabric" is a separate system that must not be confused with the user-facing one.** NCA-1 onward should be a *rollout and consolidation* program on top of existing infrastructure, not a new build.

No new migration, event bus, or persistence layer is required to begin NCA-1. A small number of narrowly-scoped migrations (preferences, delivery state beyond binary, digest/quiet-hour state) are plausible **later**, not now.

## 2. Repository Baseline

- Worktree: `/Users/mikeslate/Projects/shrv1-claude` (confirmed, isolated from `/Users/mikeslate/Projects/shrv1` and `/Users/mikeslate/Projects/shrv1-codex`)
- Branch: `claude/notifications`
- HEAD at start and end of audit: `95e6833f053da5f9cc501f256f4b8a0a14995dae`
- Tag: `accessibility-layer-complete-2026-09-13`
- Migration head: `142` (`142_accessibility_operations.sql`), confirmed via `ls apps/shs-api/migrations`
- Working tree: clean at start; only this report file added during the audit
- Codex worktree (`codex/exr`) and main worktree (`studio-v1-plus-development`) were not inspected or modified

## 3. NCA Purpose

Restated from the assignment: determine what communication mechanisms already exist, which are canonical, and which gaps are real — without duplicating the event system, identity/org model, or creating a second messaging subsystem. This audit is evidence-first: every claim below is backed by a file path, and every "does not exist" claim was verified by grep/read, not assumed.

## 4. Governing Communication Laws

Confirmed compatible with what already exists:

- **Notification ≠ Evidence ≠ Truth ≠ workflow state.** The existing `notifications` table is explicitly documented in-repo (`081_notification_integration.sql` comment) as "a projection of canonical events," never a source. `AX-4`'s own architecture doc states the same boundary independently: "Existing `integration_outbox`, `notifications`, and `audit_events` are reusable projections/infrastructure. They cannot replace an accommodation source-of-truth record."
- **A user opening/dismissing a notification must not mutate domain state.** Verified: `markRead`/`markAllRead` in `notification-service.ts` only ever write to the `notifications` table's own `status`/`read_at` columns — never to any source domain table.

## 5. Canonical Architecture Sources Read

- `docs/MASTER_LAYER_REGISTRY.md` (675 lines, read in full)
- `docs/architecture/AX-4_INSTITUTIONAL_ACCESSIBILITY_ACCOMMODATION_WORKFLOWS.md`, `AX-6_ACCESSIBILITY_OPERATIONS_COMPANION_HUMAN_ESCALATION.md`
- `docs/architecture/DGAL-6_PREMIUM_DOCUMENT_CENTER_ADMIN_NOTIFICATIONS_SERVICE_ACCEPTANCE.md`
- `docs/architecture/OGL-4_GUIDANCE_CENTER_DGAL_COMPANION_INTEGRATION.md`
- Source code: `apps/shs-api/src/domain/notifications/**`, `apps/shs-api/src/domain/trusted-reporting/outbox-repo.ts`, `apps/shs-api/migrations/001_identity_base.sql`, `004_audit.sql`, `007_integration_outbox.sql`, `081_notification_integration.sql`, `084_service_catalog_entitlements.sql`, `085_organization_onboarding_lifecycle.sql`, `src/system/notification-fabric/**`, `src/system/event-bus/**`, header/shell components across five verticals.
- Not exhaustively read: full text of every SHS_BOS_BATCH_*/SYS-* report (dozens of files). Findings about those are limited to what the Master Layer Registry and direct code inspection show.

## 6. Existing Communication Inventory

| Mechanism | Domain | BE/FE | Persistent? | User-Facing? | Channel | Canonical Owner | Current Use | Risk |
|---|---|---|---|---|---|---|---|---|
| `notifications` table + service (`apps/shs-api/src/domain/notifications/`) | Cross-domain (Studio, Credentials, Deployment, Registry, Curriculum lesson) | Both | Yes (Postgres) | **Yes** | In-app | This is the real canonical layer | Live: list/unread-count/read/read-all, org+tenant scoped | Only ~11 event types wired; silently invisible for non-active org (§46) |
| `src/pages/Notifications.jsx` + `src/lib/notifications/api.js` | Curriculum vertical | FE | n/a | Yes | In-app | Same as above | Full inbox page, real fetch to `/notifications` | Route only reachable/linked from Curriculum shell |
| `CurriculumHeader.jsx` bell | Curriculum | FE | n/a | Yes | In-app | Same as above | Live dropdown, unread badge, mark-read | Only shell with a real bell |
| `StoreHeader.jsx` bell | Store/Exchange | FE | No | Yes (UI only) | In-app (fake) | **None — disconnected** | Static "You're all caught up" — never calls the API | Duplicate UI, misleads users into thinking it's live |
| `ArcadeHeaderExtras.jsx` `ArcadeNotifications()` | Learning Arcade | FE | No | Yes (UI only) | In-app (fake) | **None — disconnected** | Code comment admits "no live feed anywhere in this codebase" | Duplicate UI |
| `CivicTopBar.jsx` `CivicNotifications()` | CivicSure | FE | No | Yes (UI only) | In-app (fake) | **None — disconnected** | Code comment: "honest — no live feed... will show real..." | Duplicate UI |
| `src/system/notification-fabric/*` (`shsNotification*`, `shsAlertQueue`, `shsEscalationRules`) | SHS BOS operations | Both (FE reads local storage) | Yes, but **`localStorage`-only** via `criticalStateMigrationCompatibility`, not Postgres | **No — `visibility: "internal_admin_only"`** | In-app, admin-only | BOS / Notification-Alert layer | Internal operator awareness only; hard-blocked from ever sending external mail/SMS/webhook by `shsNotificationSafety.js` pattern scanner | Correctly isolated; risk is confusing it with the user-facing system when scoping NCA |
| `src/pages/admin/notifications/ShsNotificationFabricPage.jsx` | SHS BOS admin | FE | — | Admin-only | In-app | BOS | Renders the fabric above | none found |
| `ToastHub.jsx` / `Toast.jsx` | Cross-app (rewards) | FE | No (ephemeral) | Yes | In-app toast | Rewards/Celebration | Fires on `window` event `rewards:earned` only | Correctly separate; must not be folded into NCA (celebration ≠ notification, per §18) |
| `CelebrationLayer.jsx`, `GrowthDopamineLayer.jsx` | Curriculum/gamification | FE | No | Yes | In-app | Rewards | Milestone/points celebration | Same as above |
| `SeaDashboardPrimitives.jsx` (`SeaAttention`, `SeaNextAction`) | Cross-app dashboards (Instructor Ops, Verification Audit, Executive Command, Release Assurance, Agent Fabric) | FE | No — purely prop-driven | Yes | Dashboard attention card | SEA (Service/Experience/Attention) presentation layer | Reused presentational primitive; each page computes its own `items` locally | No canonical backend "attention item" model feeds it yet (§37) |
| `src/system/event-bus/shsEventBus.js` + `ShsEventBusPage.jsx` | SHS BOS admin | Both (local) | Local/in-memory-ish (`shsEventStorage.js`) | Admin-only | In-app | BOS ops tooling | Visualizes/manages local layer "subscribers"; **unrelated** to `integration_outbox` | Name collision risk with the real event bus — do not confuse |
| `email-provider.ts` (`apps/shs-api/src/domain/notifications/service/`) | Credentials (certificate delivery) | BE | n/a | Indirectly (email) | Email | Credentials domain, misfiled under `notifications/` | Only caller is `certificate-service.ts` | Misplaced path is a duplication/confusion risk (§68) |
| `audit_events` table (`004_audit.sql`) | Cross-domain | BE | Yes | No | none (system log) | Audit & Verification layer | Records actor/action/before/after with `correlation_id` | Correctly not a notification source |
| `services/shf-agent-fabric/services/notification_alert_service.py` + `event_webhook_service.py` (+ their `routers/notification_alert_routes.py`, `routers/event_webhook_routes.py`, mounted at `/notification-alert` and presumably `/event-webhook` in `services/shf-agent-fabric/main.py`) | SHF Impact Data Spine / Agent Fabric governance ("Notification / Alert" canonical layer per `docs/MASTER_LAYER_REGISTRY.md`) | BE (Python) | No — stateless classification functions over the request payload; no DB writes found | No — synchronous request/response only | N/A (classification only) | No | Explicitly self-documented via a `BOUNDARY_WARNINGS` constant in the source: "Notification / Alert Layer classifies notification readiness only... does not send notifications, send email, send SMS, send messages, send webhooks, call external systems..." (`notification_alert_service.py`). This is a **third, independent implementation** of the "notification/alert" concept — verified to be **not called by** the frontend `src/system/notification-fabric/*` (BOS admin UI), despite both plausibly being the intended front/back end of the same registered canonical layer. Likely this Python service is the actual backend for that MASTER_LAYER_REGISTRY entry and the frontend fabric is a separate, disconnected mock of the same idea — a real fragmentation finding, not a false positive |
| `src/shared/inbox/inbox.js` (used only by `src/shared/employer/salesBridge.js`, `src/pages/employer/ReimbursementCalculator.jsx`) | Employer/Sales (reimbursement flow) only | FE | `localStorage` only | Yes | In-app (feature-local) | None (ad hoc, unscoped by user/org) | Small notes/list utility for one feature | Low blast radius today, but yet another disconnected "inbox"-named mechanism — do not extend or generalize; fold into the real system or leave alone |

## 7. Existing Event Infrastructure

| Event Infrastructure | Owner | Durable? | Async? | Org Scoped? | User Scoped? | Reusable for NCA? | Reason |
|---|---|---|---|---|---|---|---|
| `integration_outbox` (migration `007`) + `IntegrationOutboxRepo` (`apps/shs-api/src/domain/trusted-reporting/outbox-repo.ts`) | Trusted Reporting / Event-Webhook layer | Yes (Postgres) | Yes — `PENDING → DELIVERING → DELIVERED/RETRYABLE/FAILED_FINAL/QUARANTINED`, lease-based `claimPending`, `SKIP LOCKED` | Yes (`organization_id`) | Via `originating_actor_id` | **Yes — this is the event source NCA must consume, never duplicate** | Already the canonical domain-event bus; ~34 services emit into it |
| `notifications` (migration `081`) | Notification service | Yes (Postgres) | No — created synchronously in the same transaction as the outbox insert | Yes (`organization_id`, `tenant_id` check constraint) | Yes (`recipient_user_id`) | **Yes — this is the notification projection to extend, not replace** | Already dedupes on `(organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` |
| `audit_events` (migration `004`) | Audit & Verification layer | Yes (Postgres) | No | Yes | Optional (`actor_user_id`) | No — different purpose | System-of-record for actions, not for user-facing communication |
| `src/system/notification-fabric/*` local storage | SHS BOS / Notification-Alert layer | Persisted to `localStorage` via a "critical state" shim, not Postgres | No | Not modeled | Not modeled (single operator context) | **No** — deliberately internal-admin-only and explicitly forbidden from external delivery by its own safety scanner | Do not fold BOS operator awareness into user-facing NCA scope |
| `src/system/event-bus/shsEventBus.js` | SHS BOS admin tooling | Local | No | Not modeled | Not modeled | No | Visualization/subscriber-management tool, unrelated bus |
| Cron/scheduler, queue/task workers | — | — | — | — | — | Not found as a separate general-purpose system | The outbox's own `claimPending`/lease pattern is the closest thing to a worker/queue; no distinct cron framework was found in this pass |

## 8. Notification vs Event Classification

| Existing mechanism | True classification |
|---|---|
| `integration_outbox` rows (e.g. `studio.review.routed`, `arag.release.requested`, `case.created`) | DOMAIN_EVENT |
| `audit_events` rows | AUDIT_EVENT |
| `notifications` rows | NOTIFICATION (a projection *of* a domain event, never the event itself) |
| `notification-fabric` records (BOS) | Internally, a hybrid of ALERT + STATUS_MESSAGE, scoped to operators, not end users |
| `ToastHub` "+N points" | STATUS_MESSAGE / celebration (not a notification) |
| `SeaAttention` items | ATTENTION_ITEM (dashboard-persistent-until-resolved), not equivalent to a notification |
| `shsEscalationRules.js` previews | ESCALATION preview only — `local_preview_only: true, external_delivery: false` by construction |
| `email-provider.ts` (certificate mail) | EMAIL (transactional, narrowly scoped, not general) |

No mechanism found in the repo mislabels a domain/audit event as a user notification; the separation the repo already enforces (`SeaAttention`/`notifications` vs `audit_events`/`integration_outbox`) is sound and should be preserved verbatim.

## 9. Current Channel Inventory

| Channel | Actual Implementation | Provider | Production Ready? | Dev/Test Only? | External Dependency | Notes |
|---|---|---|---|---|---|---|
| IN_APP | Real (`notifications` table + Curriculum bell/inbox) | n/a | Partially — backend is real; 3 of 4 shells have no real UI wiring | — | None | The only channel that actually works end-to-end today, and only in one shell |
| EMAIL | Real but narrow (`email-provider.ts`) | `TestMailProvider` (default/dev) or `GenericHttpMailProvider` (env-gated: `SHS_EMAIL_PROVIDER_ENDPOINT`, `SHS_EMAIL_PROVIDER_API_KEY`) | Only for certificate delivery, and only if env vars are set in production | Yes, defaults to `TestMailProvider` when unset | Yes, if configured | Not wired to the general notification system at all |
| SMS | Absent | — | No | No | — | No code found anywhere |
| PUSH | Absent | — | No | No | — | No code found anywhere |
| WEBHOOK (external) | Absent for delivery; `integration_outbox` has a `destination` column but no code sends outward | — | No | No | — | Matches Master Layer Registry: "Event/Webhook... does not send external webhooks in V1" |
| SLACK/TEAMS-like | Absent | — | No | No | — | No code found |
| PRINT | Absent (DGAL has manual/paper document workflows, but that's document delivery, not notification) | — | No | No | — | Out of scope |

## 10. User Preference Inventory

Searched for: email preferences, notification settings, digest settings, reminder preferences, channel preferences, do-not-disturb, quiet hours, unsubscribe, marketing consent, accessibility communication preferences.

**Result: ABSENT.** No table, column, or UI for any communication preference was found anywhere in `apps/shs-api` or `src`. The only "unsubscribe" hits are an unrelated admin tool (`unsubscribeLocalLayer` in `src/system/event-bus/shsEventStorage.js`, for managing local BOS event-bus subscribers, not user communication preferences).

This is correctly **distinct** from accessibility preferences, which are real: `user_accessibility_profiles` (migration `056_accessibility_profiles.sql`) stores things like reduced-motion/captioning/screen-reader preferences. Do not conflate the two — accessibility preferences already exist and are owned by the AX layer; communication preferences do not exist and would be new NCA scope.

Confirmed directly in the UI: `src/pages/Settings.jsx:10` — the entire settings surface is a placeholder that literally reads "Account, notifications, accessibility — coming soon." with no controls behind it. There is no existing settings UI to extend; a communication-preferences UI would be new work, not a retrofit.

## 11. Organization Policy

No organization-level communication policy table or code (required channels, mandatory notices, staff-only notices, escalation rules, announcement policy, role-based recipient rules) was found. `organizations` (migration `001`) has only `legal_name`, `display_name`, `org_type`, `status`, `primary_domain` — no communication-policy columns. This is a real gap, not an oversight to fabricate around: report as absent.

## 12. Role-Aware Communication

Real role/permission model confirmed: `roles`, `role_permissions`, `memberships` (migration `001_identity_base.sql`). `memberships` links `user_id` → `organization_id` → `role_id` with `effective_from`/`effective_to`, and is the mechanism that already supports **multi-org users** (a `users` row has one home `organization_id`, but `memberships` allows many organization relationships per user). Actual roles/permissions in the repo were not fully enumerated in this pass (would require reading `SHS_SECURITY_PERMISSIONS` in `apps/shs-api/src/security`), but the recipient-resolution model in §30 is built to key off exactly this table set.

## 13. Organization Onboarding

Real, migrated lifecycle (`085_organization_onboarding_lifecycle.sql`): `SUBMITTED → UNDER_REVIEW → APPROVED/DECLINED → ACTIVATED → SUSPENDED/EXITED/GRADUATED` — this matches the task's expected event list almost verbatim. **However, `apps/shs-api/src/domain/organization-onboarding` contains zero calls to `enqueue`/`integration_outbox`.** No onboarding state transition currently emits a domain event, so none can currently produce a notification even in principle. This is a clean, self-contained NCA-1/rollout candidate: add event emission at each transition, then reuse the existing `EVENT_POLICIES` pattern — no new infrastructure required.

## 14. Curriculum

Real events found: `lesson.completed` (has a notification policy — `COMPLETION_ACHIEVED`), `learner.outcome.recorded` (no policy), `curriculum.lesson` namespace exists. Credential events (`credential.issued`/`credential.revoked`) are wired end-to-end and are the strongest working example of the whole pattern. Per the task's warning, **celebration is intentionally separate** (`CelebrationLayer.jsx`) and should stay separate — do not route milestone celebrations through the notification system.

## 15. Instructor

`case.assigned` and `studio.review.routed`/`reassigned` are real precedents for "assign work to a specific role/person" events; no instructor-specific event (student submitted work, missing work, accommodation fulfillment requirement) was found emitting into the outbox. Any future instructor notification design should explicitly rate-limit/aggregate (per §43 fatigue risk) rather than firing per-submission.

## 16. Parent / Guardian

No parent/guardian-specific event or notification code was found. Given the identity model only shows `users`/`memberships`/`roles` (no explicit guardian-relationship table located in this pass), a parent-facing notification would need an explicit, audited relationship/permission check before any student data is surfaced — this must not be inferred from a role name alone. Flagged as an owner decision (§ Decision Register) rather than assumed.

**Confirmed by the page itself:** `src/pages/ParentDashboard.jsx` is a real but intentionally-empty stub — it renders "No linked learner data is available in this view yet" and "Access remains governed by the canonical relationship and membership services" (lines 13-15), i.e. the frontend already documents that it is deliberately not surfacing any data until a canonical relationship service exists. **Parent/guardian notifications of any kind are premature until that relationship model is real** — this is not an NCA gap to fill, it is a downstream dependency on another program.

## 17. Live Learning

Only one real event exists: `attendance.confirmed` (`live-learning-service.ts`), with no notification policy attached. **No "session scheduled/changed/cancelled" event exists yet** — meaning live-session notifications are not a "just add a policy" task; they require new event emission in the Live Learning domain first. External meeting-provider alerts (if any exist) are out of scope for NCA by design.

## 18. Career

Portfolio and workforce-outcome domains emit real events (`portfolio.artifact.*`, `portfolio.learner_result.projected`, `employment_outcome.submitted`) with no notification policies attached. Credential events (career-adjacent) are already wired. No speculative "career opportunity" event/spam mechanism exists — good, nothing to warn against removing.

## 19. Studio

**The most complete working example in the repo.** Real events: `studio.review.routed`, `studio.review.reassigned`, `studio.review.decision_recorded`, `studio.review.routing_failed`, `studio.review.submitted`, `studio.revision.created`, `studio.delivery.finalized`, `studio.handoff.created`, `studio.project.created`, `studio.qa.completed`, `studio.team.*`, `studio.workspace.updated`. Of these, only `studio.review.routed`, `studio.review.reassigned`, and `studio.review.decision_recorded` have notification policies today. QA-complete/failed, handoff-ready, and revision-created are real, emitting events with **no** notification policy yet — straightforward, low-risk NCA-1 rollout targets since the emission side already works.

## 20. CivicSure

Domain is `apps/shs-api/src/domain/cases` (+ `government-assurance`). Real events: `case.created`, `case.assigned`, `case.transitioned`, `referral.created`. **Zero notification policies exist for any of them.** Per the task's law, notification must never become verification state — nothing in the current code risks this (cases events are read-only sources for a future policy, and CivicSure's Truth/verification writes live entirely in `government-assurance`/Truth Spine code, untouched by anything notification-related).

## 21. ARAG-1

Domain: `apps/shs-api/src/domain/arag`. Real events: `arag.release.requested`, `arag.assurance.blocked`, `arag.assurance.started`, `arag.approval.required`, `arag.release.authorized`, `arag.release.authorization_revoked`, `arag.release.started`, `arag.release.succeeded`, `arag.release.failed`, `arag.rollback.succeeded`, `arag.rollback.failed`. **Zero notification policies exist.** `arag.approval.required` and `arag.assurance.blocked` are exactly the "approval required"/"release blocked" cases the task calls out as critical — and critically, nothing in the current code lets a notification approve a release; the ARAG service's own `requirePermission`/`repo.createAuthorization` calls are the only path to authorization. Safe to add HUMAN_REVIEW_REQUIRED-classified notifications here without any authority risk.

## 22. Agent Fabric / BOS

Domains: `agent-package`, `agent-simulation`, `ai-governance`, `mcp`. All three emit into `integration_outbox` (confirmed via `enqueue` grep) but use dynamic `type` variables rather than a small fixed literal set — meaning the number of distinct agent-related event types is likely larger and more dynamic than other domains, which raises the fatigue risk called out in §47 more than any other domain. The BOS-internal `notification-fabric` (§6) already exists specifically to give *operators* (not agents' end users) a hard-firewalled, non-external-sending awareness surface for exactly this category of event — that boundary is correct and should not be re-derived.

**Additional finding**: `services/shf-agent-fabric` (a separate Python backend from `apps/shs-api`) contains its own `notification_alert_service.py` + `event_webhook_service.py`, mounted via `routers/notification_alert_routes.py` (`/notification-alert/evaluate`, `/batch-evaluate`, `/readiness`, etc.) and `routers/event_webhook_routes.py`. These are stateless classification functions (no DB writes found) that carry an explicit self-documented boundary matching the "Notification / Alert" canonical layer described in `docs/MASTER_LAYER_REGISTRY.md`: they classify notification/event readiness only and never send anything externally. Verified: the frontend BOS `notification-fabric` UI does **not** call these routes — they are two disconnected implementations of what appears to be one intended canonical layer. Treat this as a fragmentation finding (§65 P2), and do not build a third implementation on top of either.

## 23. DGAL

**Concrete, load-bearing gap.** The `notification-service.ts` `EVENT_POLICIES` map contains seven DGAL/documentation event types (`documentation.requirement.created`, `documentation.requirement.correction_required`, `documentation.signature.requested`, `documentation.signature.signed`, `documentation.signature.expired`, `documentation.manual_signature.verification_required`, `documentation.manual_signature.rejected`, `documentation.document.superseded`). A repo-wide grep for these exact strings outside `notification-service.ts` returns **only a test file** (`apps/shs-api/tests/dgal6-notifications.test.ts`). None of the 20+ real files under `apps/shs-api/src/domain/documentation/` ever call `outbox.enqueue`. The `DGAL-6` acceptance report itself is honest about the scope of what it verified — it describes testing against an "isolated database `dgal6_acceptance_20260912`" with a hand-constructed event — but the practical result is: **DGAL document/signature workflows do not produce any real in-app notification today**, despite the mapping existing and being unit-tested. This is the clearest, most concrete P1 finding in this audit.

## 24. OGL / Companion

`OGL-4` (`docs/architecture/OGL-4_GUIDANCE_CENTER_DGAL_COMPANION_INTEGRATION.md`) already draws the exact boundary NCA needs: "Guidance Center, Companion, and tours cannot complete workflows, acknowledge documents, sign, verify, publish, write Evidence, or write Truth." Companion is explicitly "the existing source-aware read-only surface" — orientation/guidance, not event/state communication. No overlap or conflict was found between OGL/Companion and the notification system; they are cleanly separated today and should stay that way. OGL-4 §31 is literally titled "Deep Links / Notifications" and treats notification deep-links as an external concern OGL merely does not own.

## 25. Accessibility

`AX-4` (accommodation workflows) contains its own honest self-audit, quoted directly: "User notifications | `notifications` / migration 081 | Partial | Recipient projection, not workflow authority | Reuse after events." Verified independently: `apps/shs-api/src/domain/accessibility-accommodations` and `accessibility-operations` contain **zero** `enqueue`/`integration_outbox`/`audit_events` calls. So, like DGAL, accessibility accommodation events (information requested, approved/declined, expiring, fulfillment required, finding assigned/ready-for-retest, support request assigned/resolved) do not yet exist as domain events at all — this is a step *before* notification policy work, and AX's own docs already say so. Accessibility *preference* data (`user_accessibility_profiles`, migration `056`) is real and fully separate from any future communication preference (§10).

## 26. Reporting / Executive

`report.created` and `government_assurance.truth_determination.accepted` are real emitted events with no notification policy. No metric-threshold-crossing event or scheduled-report-ready event was found. Per the task's warning, do not turn every metric movement into a notification — none currently exists, so there is nothing to walk back, only a decision to make deliberately later about which report/metric events (if any) warrant one.

## 27. Public Communication

No public announcement/newsletter/marketing-consent mechanism was found anywhere in the repo. Nothing to preserve, nothing to duplicate. If a future public communication need arises, it must not reuse the `notifications` table (which is authenticated-org-scoped) or piggyback on required operational communication — it would need its own, separately consented channel, which does not exist today.

**Concrete finding, not hypothetical:** `apps/shf-web/src/components/civicsure/CivicSurePublicFooter.jsx:163-178` renders a live-looking "Stay Informed" newsletter signup form — email input, "Subscribe" button, and the caption "We respect your privacy. No spam. Unsubscribe anytime." — whose `<form onSubmit={(e) => e.preventDefault()}>` does nothing: no backend endpoint, no capture, no consent record, no unsubscribe mechanism exists anywhere behind it. This is a public-facing page making an implicit privacy/consent promise ("unsubscribe anytime") about a subscription that cannot technically be created or honored. Flagged as its own risk-matrix entry (§65) rather than folded into the general "public communication doesn't exist" finding, because the risk here is an active misrepresentation on a live page, not merely an absence.

## 28. Communication Event Contract (proposed, not implemented)

The real `integration_outbox` schema (migration `007`) already carries most of what a canonical communication event needs: `outbox_event_id`, `producer_id`, `event_type`, `subject_type`, `subject_id`, `organization_id`, `originating_actor_id`, `occurred_at`, `idempotency_key`, `correlation_id`, `payload_json`. Proposed additions for a communication-eligible event (all additive, no schema break required to *reason about* — actual migration deferred to a later phase):

| Field | Source today | Notes |
|---|---|---|
| `eventId` | `outbox_event_id` | already real |
| `eventType` | `event_type` | already real |
| `sourceDomain` | `producer_id` | already real (e.g. `shs-api.studio-routing`) |
| `sourceEntityType` / `sourceEntityId` | `subject_type` / `subject_id` | already real |
| `organizationId` / `tenantId` | `organization_id` (+ derived `tenant:{id}` convention) | already real |
| `actorId` | `originating_actor_id` | already real |
| `subjectUserId` | not modeled at the outbox layer — resolved per-event by the `recipient()` function in `EVENT_POLICIES` | intentional: recipient resolution is a policy concern, not an event-shape concern |
| `occurredAt` | `occurred_at` | already real |
| `severity` / `urgency` | not modeled | would need to be added to `EVENT_POLICIES` per type (§35) |
| `actionRequired` | not modeled explicitly, but implied by policy type today (e.g. `DOCUMENTATION_SIGNATURE_REQUIRED`) | should be made explicit |
| `actionUrl` | `path()` function per policy → `destination_path` | already real |
| `templateKey` | `title`/`message` are hardcoded per policy today, not templated | flagged for §55 |
| `payload` | `payload_json` | already real |
| `privacyClassification` | not modeled | new — needed before any policy touches sensitive domains (accommodation, CivicSure evidence, ARAG release detail) |
| `dedupeKey` | de facto `(organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` unique constraint on `notifications` | already real, just not a named field |
| `expiresAt` | not modeled | new |
| `correlationId` | `correlation_id` | already real |

**Conclusion: no new event contract is needed. The existing `integration_outbox` shape is sufficient; only the notification-projection layer needs additive fields.**

## 29. Notification Projection Contract (proposed, not implemented)

The real `notifications` table already implements nearly the whole ask:

| Field | Present today? |
|---|---|
| `notificationId` | Yes (`notification_id`) |
| `recipientUserId` | Yes |
| `organizationId` / `tenantId` | Yes |
| `eventId` | Yes, via `source_event_id`/`source_event_type` |
| `type` | Yes (`notification_type`) |
| `title` / `body` | Yes, bounded to 200/1000 chars by CHECK constraint |
| `channelEligibility` | **No** — everything today is implicitly in-app only |
| `priority`/`urgency` | **No** |
| `readState` | Yes (`status`: `UNREAD`/`READ`/`ARCHIVED`) |
| `actionState` | **No** — the notification cannot currently express "action completed" vs "action still pending," only read/unread |
| `createdAt` | Yes |
| `expiresAt` | **No** |
| `deliveryState` (beyond in-app) | **No** — there is no SENT/DELIVERED/FAILED concept because there is no non-in-app channel wired yet |

Gaps here (channel eligibility, priority, action state, expiry, delivery state) are genuine, additive migration candidates for a later phase — not required to begin rollout of more event→notification policies using the current shape.

## 30. Recipient Resolution

Real, working recipient resolution already exists, just implemented ad hoc per policy rather than as a named pipeline: each `EVENT_POLICIES` entry has a `recipient(event, db)` function that does exactly steps "Source Event → Subject Relationship → Recipient" for its specific case (e.g., `studio.review.decision_recorded`'s recipient is resolved via `SELECT p.studio_learner_id FROM projects p WHERE p.project_id=$1 AND p.organization_id=$2 AND p.tenant_id=$3`, correctly org/tenant-scoped). What's **not** implemented anywhere in this path: an explicit **entitlement check** (service_catalog/entitlements, migration `084`) or **role/permission check** before resolving a recipient — today, `recipient()` functions trust the event payload's referenced IDs directly. This is fine for the current narrow set of trusted internal producers, but should be named explicitly as a gap before this pattern is generalized to less-trusted or cross-domain event producers (e.g., anything agent-fabric-originated).

## 31. Mandatory vs Optional Communication

No classification exists today — every wired notification type behaves identically (in-app only, no opt-out possible because no preference system exists at all, §10). Proposed classification for future use, cross-checked against real event types found in this audit:

| Class | Example (real event) |
|---|---|
| MANDATORY_OPERATIONAL | `documentation.signature.requested` (once wired) — legally/contractually significant |
| REQUIRED_ACTION | `arag.approval.required`, `case.assigned` |
| TRANSACTIONAL | `credential.issued`, `deployment.live` |
| OPTIONAL_PRODUCT | `studio.qa.completed` (informational to the submitter) |
| DIGEST_ELIGIBLE | `portfolio.artifact.created`, low-severity Agent Fabric events |
| MARKETING | none exist — correctly out of scope |

No repository policy or legal-requirement documentation defining "required delivery" was found; treat this classification as a **draft proposal requiring owner sign-off**, not a repository fact.

## 32. Urgency Model

The BOS-internal `notification-fabric` already has a working, four-level severity model (`shsNotificationTypes.js`): `info | notice | warning | critical`, with a matching escalation SLA table in `shsEscalationRules.js` (`sla_minutes: 240/120/60/30`). This is a strong, ready-made precedent — reusing this exact four-level scheme (rather than inventing `CRITICAL/HIGH/NORMAL/LOW`) for the user-facing system would keep the two systems visually and conceptually consistent for anyone who has to reason about both.

## 33. Attention Model

`SeaAttention` (`src/components/sea/SeaDashboardPrimitives.jsx`) is already exactly the "persists until resolved" attention-item primitive the task describes, and is already reused across five dashboards (Instructor Operations, Verification Audit, Executive Command, Release Assurance, Agent Fabric). It is **presentation-only** today — every consuming page computes its own `items` array locally; there is no canonical backend "attention item" table or API. The clean design move for NCA is: keep `notifications` as the transient/informational feed, and define a small, separate canonical "attention item" projection (sourced from the same `integration_outbox` events, filtered to `actionRequired: true` types) that feeds the *existing* `SeaAttention` component everywhere, rather than inventing new attention UI.

## 34. Read State

Real today: `UNREAD | READ | ARCHIVED` (CHECK constraint on `notifications.status`). No `DISMISSED` distinct from `ARCHIVED` was found (they may be intended as synonyms — worth an owner decision, not worth inventing a difference). Dismissal today only ever changes the notification row; it has no code path back into any source domain table — confirmed by reading every function in `notification-service.ts`.

## 35. Action State

Not modeled today (§29). This is real, scoped, additive work for a later phase, not a blocker for continuing the existing rollout pattern (event→policy→notification) as-is.

## 36. Deduplication

Already real and enforced at the database level: `UNIQUE (organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` plus `ON CONFLICT ... DO NOTHING` in `createNotificationFromEvent`. This is a sound, durable dedupe strategy and should be the template for any new policy, not reinvented.

## 37. Idempotency

Handled at two layers already: `integration_outbox`'s own `UNIQUE (organization_id, producer_id, idempotency_key)` with `ON CONFLICT DO UPDATE`, and the notification's own dedupe key above. Repeated event ingestion cannot spam a recipient under the current design — verified by reading the actual SQL, not assumed.

## 38. Delivery State

Only binary "exists in the table" (`UNREAD`/`READ`) is modeled for in-app; there is no `PENDING/QUEUED/SENT/DELIVERED/FAILED/BOUNCED/SUPPRESSED` concept anywhere for in-app (correctly — in-app delivery is definitionally instantaneous once the row exists) or for email (the certificate email path returns a `MailDeliveryResult { delivered, provider, providerMessageReference, reason }` shape in `email-provider.ts`, which is a reasonable model to reuse if/when email is wired into the general notification path — note it only ever claims `SENT`-equivalent (`delivered: true`), never `DELIVERED` in the inbox-confirmed sense, which matches the task's instruction not to over-claim delivery state a provider can't actually confirm).

## 39. Channel Selection

Today there is exactly one real channel (in-app), so "selection" is trivial. Proposed policy for later, grounded in what actually exists: IN_APP remains the default/only channel for all current policies; EMAIL should only be added for policies classified MANDATORY_OPERATIONAL or REQUIRED_ACTION, reusing the existing `OutboundMailProvider` interface (generalized beyond its current certificate-only use) rather than writing a second email abstraction; SMS/PUSH remain unavailable until a provider is deliberately chosen and configured — do not design as if they exist.

## 40. Digest

Not implemented (correctly, per the task's instruction not to build it in NCA-0). No digest scheduling/cron infrastructure of any kind was found in the repo to reuse — this would be new work whenever it is prioritized.

## 41. Quiet Hours

Not implemented, and no user timezone-aware scheduling infrastructure was found beyond a plain `timezone` column on `users` (migration `001`), which is a reasonable seed for a future quiet-hours feature but is not itself one.

## 42. Escalation

`shsEscalationRules.js` already provides a real, if BOS-scoped, escalation-path model (`operator_inbox → owner_review → governance_review → release_engineering_review`, SLA-timed). No equivalent exists for user-facing notifications. If escalation is ever added to the user-facing side, the source-domain-aware constraint in the task (escalation must not become a generic cross-domain authority) is best satisfied by keeping escalation logic inside each domain's own service (e.g., ARAG's own approval-expiry logic) rather than centralizing it in the notification layer.

## 43. Notification Fatigue

Highest-volume real candidates, ranked by breadth of event types already being emitted with no policy: **Agent Fabric/Studio** (agent-package, agent-simulation, ai-governance, mcp use dynamic/free-form event-type strings — the least bounded of anything found) > **Studio** (11 distinct event types already emitting) > **CivicSure/cases** (4 types, but case-heavy operator workflows tend to be naturally high-volume) > **Accessibility Assurance** (not yet emitting events at all, so currently zero risk, but AX-5's continuous testing framing suggests high potential volume once wired). Recommended per-domain controls: dedupe (already available for free via the existing unique constraint), per-recipient rate thresholds before adding a policy for any Agent Fabric event type, and preferring DIGEST_ELIGIBLE classification by default for anything agent-originated.

## 44. Privacy

Concrete risks identified by reading actual policy `message` strings in `notification-service.ts`: they are already deliberately generic ("A document is waiting for an authorized signature," never naming the document) — this is good precedent to keep. Risk domains to watch when adding new policies: accommodation detail (AX) must never appear in a notification body once AX starts emitting events; CivicSure case/evidence detail must stay out of `case.*` notification bodies; ARAG release/provider detail must stay out of `arag.*` notification bodies; DGAL notification bodies already avoid document content (confirmed by DGAL-6's own acceptance note: "the message contained no agreement body or protected payload"). Minimum-necessary content is already the de facto house style — formalize it as a rule for NCA-1.

## 45. Security

Concrete risks found or reasoned from real code:
- `requireNotificationContext` in `routes.ts` correctly 401s with no `req.user` and 403s with no valid `active_organization_id`/`tenant_id` — good, verified.
- All list/read queries are parameterized and scoped by `organization_id`/`tenant_id`/`recipient_user_id` together — no cross-user or cross-org read path was found.
- `destination_path` values are server-generated per policy (`documentationPath()`, static strings, etc.), never client-supplied — no open-redirect/injection risk found in the current policies.
- Risk to flag for future policies: nothing today validates that a `destination_path` a *new* policy author writes can't accidentally leak a resource the recipient isn't entitled to (the recipient-resolution gap in §30 — no entitlement check before path generation).
- `notification-fabric`'s safety scanner (`shsNotificationSafety.js`) is a good existing pattern (regex-blocking dangerous keys/values before persistence) worth reusing conceptually for any future policy-authoring tooling, even though it currently only guards the BOS-internal system.

## 46. Multi-Org Users

Confirmed structurally supported: `memberships` allows one user many `organization_id` rows with independent roles/effective windows, while `users.organization_id` is just a "home" org. **Concrete, real behavior gap found:** `listNotifications`/`unreadCount` filter strictly by `req.user.active_organization_id`. A user with unread, action-required notifications in an organization that is not their *currently active* one will see **zero** indication of them until they manually switch org context — there is no cross-org badge, aggregate count, or warning. This is a genuine P1/P2-worthy finding, not a hypothetical: it was verified directly in `notification-service.ts`'s `scope()`/`listNotifications` functions. Recommendation: notifications should always carry explicit `organizationId` (already true) and the UI should be able to show *at least* an aggregate "you have notifications in another organization" signal without requiring silent context-switch — an owner decision, not a code change in this phase.

## 47. EXR Shared-Shell Boundary

Not inspected via the Codex worktree (correctly out of bounds). Based only on this worktree's evidence:

| Shared Surface | Notifications Likely Need | EXR Likely Need | Conflict Risk | Recommended Ownership Boundary |
|---|---|---|---|---|
| Global header / bell slot | A single shared bell component, reading the real `notifications` API | Navigation/branding structure of the header | **High** — three shells already independently built fake bells; a fourth independent rebuild by EXR is a real, demonstrated risk pattern in this repo | EXR owns header layout/placement; Notifications owns the bell component's internals and data |
| App shell (`AppShellLayout.jsx`, per-vertical shells like `CivicAppShell.jsx`, `ArcadeAppShell.jsx`) | A consistent mount point across shells | Shell structure/composition itself | Medium | EXR owns shell structure; Notifications supplies one component to mount, not a new shell |
| `RootProviders` (found at **two** paths: `src/entries/RootProviders.jsx` and `src/providers/RootProviders.jsx`) | A notification-context provider, if state needs to be shared above the header | Whatever EXR needs providers for | Medium — worth flagging the existing duplicate `RootProviders` naming as a pre-existing risk independent of NCA | Neither should add a second duplicate provider tree; both should confirm which `RootProviders` is canonical before adding to it |
| SEA Attention region (`SeaDashboardPrimitives.jsx`) | Would supply attention-item data if/when a canonical attention projection exists | Unlikely to need this directly | Low | Notifications owns attention data/contracts; existing per-page consumers own placement |
| Companion/help area | None directly — already cleanly separated (§24) | Possibly, if EXR touches guidance/orientation | Low | OGL owns Companion; unrelated to NCA |
| Organization context switcher | Directly relevant to §46's finding | Likely also relevant to EXR's navigation | Medium | Shared concern — whichever program lands first should not silently solve the other's need without coordination |

**No bell/header implementation was added in this phase**, per instruction. This table is a placement-requirements memo only.

## 48. Provider Audit

| Provider/Integration | Channel | Current State | Notes |
|---|---|---|---|
| `TestMailProvider` | Email | REAL, dev-only | Always "delivers" without sending anything |
| `GenericHttpMailProvider` | Email | REAL but PLACEHOLDER-shaped until env-configured | Requires `SHS_EMAIL_PROVIDER_ENDPOINT`/`SHS_EMAIL_PROVIDER_API_KEY`; used only by `certificate-service.ts` today |
| SMS provider | SMS | ABSENT | — |
| Push provider | Push | ABSENT | — |
| Webhook sender | Webhook | ABSENT | `integration_outbox.destination` column exists but nothing consumes it to call out externally |

## 49. Email Audit

- Provider: `GenericHttpMailProvider`, a generic bearer-token HTTP POST integration (`apps/shs-api/src/domain/notifications/service/email-provider.ts`), selected via `SHS_EMAIL_PROVIDER` env var, defaulting to `generic-http` in `NODE_ENV=production` and `test` otherwise.
- Templates: none — `TrustedMailMessage` is a flat `{to, subject, templateKey, certificateReference, attachment}` shape; `templateKey` is passed through to the external provider, not rendered locally.
- Sender identity: not modeled locally (delegated to whatever the external provider does with the bearer token).
- Retry: none in `email-provider.ts` itself; classifies failures as `EMAIL_PROVIDER_RETRYABLE`/`EMAIL_PROVIDER_REJECTED`/`EMAIL_PROVIDER_TIMEOUT`/`EMAIL_PROVIDER_UNAVAILABLE`/`EMAIL_PROVIDER_NOT_CONFIGURED` but the caller's retry behavior wasn't traced in this pass.
- Secrets handling: read directly from `process.env`, not persisted; no obvious leak in the file itself.
- Scope: **certificate delivery only.** There is no general transactional-email system wired to the notification service today.

## 50. Template Audit

Notification `title`/`message` strings are **hardcoded per policy** directly inside `notification-service.ts` (e.g., `"Document action required"` / `"A document action is required in your organization workspace."`). Not localization-aware, not reusable outside that file, not provider-specific (irrelevant since there's only one channel). This is fine at the current scale (~11 policies) but will not scale gracefully much further without extraction into a template registry — flagged as a design consideration for NCA-1, not a defect today.

## 51. Localization

No i18n framework or translation mechanism was found anywhere touching notification `title`/`message` content. If localization is ever required, today's hardcoded-string pattern would need to change to a `templateKey` + locale-resolved lookup — consistent with the `templateKey` field already present (unused) in the email provider's `TrustedMailMessage` type.

## 52. Accessibility of Communication

The one real in-app UI (`Notifications.jsx`, `CurriculumHeader.jsx` bell) uses semantic markup already: `aria-labelledby`, `role="status"`, `role="alert"`, `role="dialog"` with `aria-label`, `<time dateTime>`. This is a reasonably accessible baseline to require of any additional bell UI, rather than re-deriving requirements from scratch. No reduced-motion-specific styling was inspected in this pass; flagged as a requirement to verify when any new bell/inbox UI is built, not a known defect.

## 53. Retention

No explicit retention/expiration policy or job was found for `notifications` rows (no TTL, no archival cron). `archiveNotification`/`ARCHIVED` status exists but nothing automatically transitions rows into it. This is a real, scoped gap for later — distinct from source-record retention (which is owned by each domain, e.g. DGAL's own document retention rules, untouched by this finding).

## 54. Auditability

`notifications` rows themselves are auditable by direct query (org/tenant/recipient/status/timestamps all present). There is no separate audit-event entry written to `audit_events` when a notification is created, read, or delivered — meaning "was this notification ever shown/read" is only ever knowable from the `notifications` table's own `status`/`read_at`, which is fine as a first-party record but should not be treated as `audit_events`-grade proof for anything requiring the stronger audit guarantees that table implies. Per the task's law, `read_at` must never be treated as canonical proof of the underlying action having been completed by the user — nothing in the current code conflates the two, and none should be added later.

## 55. Evidence / Truth Boundary

Verified directly: nothing in `apps/shs-api/src/domain/notifications/**` writes to any Truth Spine or Evidence table. The only adjacent code that writes near Truth Spine, `IntegrationOutboxRepo.linkTruthSpineRecord`, is a distinct method operating on `gpa_truth_determinations`, entirely separate from `createNotificationFromEvent`, and is not called from anywhere in the notification path. The boundary is intact today by construction, not by convention alone.

## 56. Failure Isolation

Verified directly in `apps/shs-api/src/domain/trusted-reporting/outbox-repo.ts:37-41`: `createNotificationFromEvent` is called from inside `IntegrationOutboxRepo.enqueue`, passed the same `executor` the caller used for the outbox insert — so when `enqueue` runs inside a caller's transaction, both writes commit or roll back together. **This is confirmed to be an intentional design choice, not an oversight**: the code carries its own comment explaining why — "Notification is a durable, idempotent projection of the canonical event. It shares the source transaction so a committed event cannot be silently separated from its in-app awareness record" (lines 38-40). That is a real consistency guarantee (an event can never exist without its notification, or vice versa), but it is also, precisely as the task's failure-isolation law warns against, a coupling of the *source workflow's own commit* to the notification projection's success: if `createNotificationFromEvent` throws (e.g., a bad recipient-lookup query on a newly-added policy), the domain event that triggered it fails to commit at all. This is a genuine architectural tension between two things the task asks for (durable non-lossy projection vs. failure isolation) rather than a simple bug — it needs an explicit owner decision (§68 NCA-DEC-01), not a reflexive "just decouple it," since decoupling also means accepting that an event could commit with no notification if the async step later fails.

## 57. System-Wide Communication Matrix

| Domain | Event | Recipient | Mandatory/Optional | In-App | Email | Urgency | Action Required | Existing Event? | Current Notification? | Recommended State |
|---|---|---|---|---|---|---|---|---|---|---|
| Curriculum | `lesson.completed` | Learner | Optional | Yes | No | Low | No | Yes | **Yes (wired)** | Keep |
| Credentials | `credential.issued` / `revoked` | Learner | Transactional | Yes | No | Normal | No | Yes | **Yes (wired)** | Keep; candidate for email later |
| Studio | `studio.review.routed` / `reassigned` / `decision_recorded` | Reviewer/Submitter | Required action / Transactional | Yes | No | Normal/High | Yes (routed/reassigned) | Yes | **Yes (wired)** | Keep |
| Studio | `studio.qa.completed`, `studio.handoff.created`, `studio.revision.created` | Team/owner | Transactional | — | — | Normal | Varies | Yes | No | Add policy (low risk, emission already real) |
| Deployment | `deployment.live` / `failed` | Learner | Transactional | Yes | No | Normal/High | No/Yes | Yes | **Yes (wired)** | Keep |
| Registry Submission | `registry.submission.*` | Learner | Transactional | Yes | No | Normal | Varies | Yes | **Yes (wired)** | Keep |
| DGAL / Documentation | `documentation.signature.requested` etc. | Signer/requester | Required action | Policy exists | No | High | Yes | **No — not emitted** | Policy dead-code only | **P1: wire event emission in DGAL domain services** |
| Accessibility Accommodations | information requested / approved / expiring / fulfillment required | Student/staff | Required action | No | No | High | Yes | **No — not emitted** | No | Emit events first (per AX-4's own doc), then add policy |
| Organization Onboarding | submitted/under_review/approved/declined/activated/suspended/exited/graduated | Applicant org admin | Required action / Transactional | No | No | High for declined/suspended | Yes for information-requested-equivalent | **No — not emitted** | No | Emit events first, then add policy |
| CivicSure (cases) | `case.assigned`, `case.transitioned`, `referral.created` | Provider/operator | Required action | No | No | Normal/High | Yes | Yes | No | Add policy |
| ARAG-1 | `arag.approval.required`, `arag.assurance.blocked` | Release approver | Required action | No | No | Critical | Yes | Yes | No | Add policy (highest-value, lowest-risk gap found) |
| Agent Fabric | (dynamic types) | Operator/agent owner | Mostly optional | No | No | Varies | Rarely | Yes | Only via BOS-internal fabric (not user-facing) | Classify carefully; high fatigue risk (§43) |
| Career/Portfolio | `portfolio.artifact.created`, `employment_outcome.submitted` | Learner | Optional | No | No | Low | No | Yes | No | Digest-eligible candidate |
| Reporting | `report.created` | Report owner | Optional | No | No | Low | No | Yes | No | Low priority |

## 58. Role Matrix

| Role | Notification Types Needed | Attention Items | Optional/Digest | Sensitive Content Restrictions |
|---|---|---|---|---|
| Student/Learner | Credential, deployment, lesson completion (real today); document/signature, accommodation status (once emitted) | Signature/accommodation action-required items | Portfolio/career updates digest-eligible | No accommodation medical/diagnostic detail in body |
| Instructor | Review/QA assignment (Studio precedent), missing-work equivalents (not yet modeled) | Review queue items | Aggregate, don't fire per-submission | No student private data beyond existing authorization |
| Parent/Guardian | Not modeled anywhere today | n/a | n/a | Requires an explicit, audited relationship check before any student data notification — owner decision, not inferred |
| Organization Applicant/Operator/Admin | Onboarding lifecycle (once emitted) | Information-requested items | Onboarding status is required-action, not digest | None found |
| CivicSure Provider/Operator | Case assignment/transition, referral | Case action-required items | Aggregate at organization scale | No protected evidence content in body |
| Studio Builder/QA/Reviewer | Already wired review events + unwired QA/handoff/revision | Review queue (existing precedent) | QA-complete can be digest-eligible for non-blocking cases | None found |
| ARAG Release Actor | Approval required, blocked, succeeded/failed | Approval-required items (critical) | Never digest for approval-required | No release/provider secrets in body |
| Agent Fabric Operator | Already served by BOS `notification-fabric`, not the user-facing system | BOS alert queue (existing) | Existing severity model already digest/escalation-aware | Already hard-blocked from leaking secrets (`shsNotificationSafety.js`) |
| SHS/SHF Admin | Cross-domain oversight | Executive Command Center already has its own `SeaAttention` usage | Mostly digest | None found |

## 59. Channel Matrix

| Channel | Current State | Appropriate Uses | Inappropriate Uses | External Dependency |
|---|---|---|---|---|
| IN_APP | Real, partially deployed (1 of 4 shells) | Default channel for everything | — | None |
| EMAIL | Real for certificates only | Mandatory/required-action once generalized | Digest/optional content until preferences exist (no opt-out possible yet) | Yes, if `generic-http` provider configured |
| SMS | Absent | Would only ever suit CRITICAL, if ever built | Everything else | Would require a new provider |
| PUSH | Absent | Time-sensitive mobile alerts, if a mobile surface exists | N/A currently — no mobile app surface found | Would require a new provider |
| WEBHOOK (external) | Absent | Partner/integration notifications only | Never for end-user-facing content | Would require a new provider |

## 60. Event/Notification Boundary Matrix

| Source Event | Event Owner | Notification Projection? | Notification Owner | Action Returns To |
|---|---|---|---|---|
| `studio.review.routed` | Studio Routing service | Yes | Notification service | Studio reviewer queue |
| `credential.issued` | Credentials service | Yes | Notification service | Curriculum portfolio |
| `documentation.signature.requested` | Documentation (DGAL) service — **not actually emitting** | Policy exists, unreachable | Notification service (dead) | Documentation workspace |
| `arag.approval.required` | ARAG service | No (gap) | — | ARAG release assurance UI |
| `case.assigned` | Cases (CivicSure) service | No (gap) | — | Case workspace |
| `organization onboarding` transitions | Organization Onboarding service — **not emitting any event** | No | — | Onboarding workspace |

## 61. Attention Matrix

| Event | Notification Only | Attention Item | Both | Reason |
|---|---|---|---|---|
| `credential.issued` | Yes | No | — | Informational, no action needed |
| `documentation.signature.requested` (once wired) | — | — | Yes | Both inform and require persistent action until signed |
| `arag.approval.required` | — | — | Yes | Time-critical, must persist until resolved, per task's own example ("Additional information is required" → notification + attention item) |
| `deployment.live` / `failed` | Yes (live) / Both (failed) | — | — | Failure needs to persist as actionable until retried |
| `studio.qa.completed` | Yes | No | — | Informational unless it failed |
| `case.assigned` | — | — | Yes | Operator workload item, persists until case moves |

## 62. Privacy Matrix

| Data Type | In-App Allowed | Email Allowed | Minimum-Necessary Rule | Prohibited Content |
|---|---|---|---|---|
| Document/signature reference | Generic reference only (verified real practice today) | Same | "A document is waiting" style, never contents | Agreement body, protected payload (DGAL-6 verified this is already the practice) |
| Accommodation detail | Status only, once modeled | Not recommended | "Action required" only | Diagnostic/medical detail |
| CivicSure case/evidence | Case ID/status reference only | Not recommended without explicit policy | Status transition only | Protected evidence content |
| ARAG release detail | Release ID/status only | Not recommended | Approval-required framing only | Provider secrets, package internals |
| Student learning data (parent-facing) | Not modeled | Not modeled | Requires an explicit relationship+consent check | Any data beyond what the relationship already authorizes |

## 63. Duplication Matrix

| Mechanism A | Mechanism B | Overlap | Canonical Recommendation |
|---|---|---|---|
| `CurriculumHeader.jsx` bell (real) | `StoreHeader.jsx` / `ArcadeHeaderExtras.jsx` / `CivicTopBar.jsx` bells (fake) | Full UI overlap, zero backend overlap | Replace the three fake bells with the real, shared component/data source |
| `notifications` table (user-facing) | `notification-fabric` (BOS-internal) | Conceptual only (both are "notifications"), zero data/schema overlap | Keep separate by design; document the boundary so future work doesn't try to merge them |
| `integration_outbox` (real event bus) | `src/system/event-bus/shsEventBus.js` (BOS admin visualization tool) | Name overlap only, zero functional overlap | Keep separate; rename risk if anyone assumes they're related |
| `email-provider.ts` (in `notifications/service/`) | Actual use (`certificate-service.ts`) | Path implies notifications ownership; real owner is credentials | Move file or re-scope ownership when email is generalized |
| `src/entries/RootProviders.jsx` | `src/providers/RootProviders.jsx` | Naming duplication, not verified whether both are live | Pre-existing risk, unrelated to NCA scope but worth a footnote for EXR coordination |
| `ToastHub`/`CelebrationLayer` (celebration) | `notifications` (real notifications) | None functionally; conceptual risk only if someone conflates them later | Keep separate per task's own instruction |
| `src/system/notification-fabric/*` (BOS frontend, localStorage) | `services/shf-agent-fabric/services/notification_alert_service.py` + `event_webhook_service.py` (Python backend, stateless) | Both implement the same "Notification / Alert" canonical layer concept (per `docs/MASTER_LAYER_REGISTRY.md`) with matching self-declared "readiness classification only, never sends" boundaries — but are **not wired to each other** (verified: zero references from the frontend fabric to the `/notification-alert` or `/event-webhook` routes) | Treat as one intended system that is currently two disconnected halves; wire them together or explicitly document why they remain separate before NCA-3 |
| `src/shared/inbox/inbox.js` (employer/sales feature) | `notifications` (real notifications) / `src/pages/Notifications.jsx` | Name overlap ("inbox") only; unrelated data, unrelated scope | Low priority; rename or fold in later, not an NCA blocker |

## 64. Provider Matrix

| Provider/Integration | Channel | Current State | Production Ready | Gap |
|---|---|---|---|---|
| `TestMailProvider` | Email | DEV_ONLY | No | By design |
| `GenericHttpMailProvider` | Email | REAL, config-gated | Only if env configured | Not wired to general notifications, only certificates |
| (none) | SMS | ABSENT | No | No provider chosen |
| (none) | Push | ABSENT | No | No provider chosen |
| (none) | Webhook (outbound) | ABSENT | No | `destination` column exists with no sender |

## 65. Risk Matrix

| Finding | Severity | Domain | Risk | Recommended NCA Phase |
|---|---|---|---|---|
| Notification creation shares the same DB transaction as the source domain event insert (`IntegrationOutboxRepo.enqueue`), by explicit design (code comment confirms intent) | **P0** | Cross-domain (Trusted Reporting/all producers) | A notification-projection failure can currently block/roll back the *source workflow's own event* — an intentional consistency-over-isolation tradeoff that conflicts with the task's failure-isolation law and needs an explicit owner decision, not a silent fix | NCA-1 (owner decision required before wiring more domains through this exact path) |
| Public CivicSure newsletter signup (`CivicSurePublicFooter.jsx`) claims "No spam. Unsubscribe anytime." with a form that captures nothing and has no backend | **P2** | Public Communication | Live misrepresentation of a privacy/consent promise on a public page | NCA-adjacent (not really NCA scope — flag to whoever owns the CivicSure public site) |
| Frontend BOS "Notification & Alert Fabric" and backend `notification_alert_service.py`/`event_webhook_service.py` (Agent Fabric) appear to be the intended two halves of one canonical "Notification/Alert" layer but are not connected | **P2** | Agent Fabric / BOS | Fragmented implementation of a single documented canonical layer; confusing for whoever picks up either half next | NCA-1 (decision only — confirm intended relationship, do not build the connection as part of NCA) |
| Multi-org users cannot see notifications outside their active organization, with no cross-org signal | **P1** | Cross-domain | Real risk of a user missing a required action because they're viewing the "wrong" org | NCA-1/NCA-2 |
| DGAL notification policies are wired to events that are never emitted | **P1** | DGAL | Document/signature workflow users receive zero real in-app notification despite an acceptance report describing tested behavior | NCA-1 (emit the events) |
| Accessibility accommodation workflow emits no events at all | **P1** | Accessibility | Same class of gap as DGAL; AX-4's own doc already flags this | NCA-1 |
| Organization Onboarding emits no events at all | **P1** | Org Onboarding | Applicants/operators get no notification through required lifecycle states | NCA-1 |
| Three independently-built, disconnected placeholder bell UIs (Store, Arcade, CivicSure) | **P1** | Cross-shell FE | Users in those shells are told "no notifications" even when real ones may exist for them elsewhere; duplicated, drifting UI code | NCA-1/NCA-3 |
| No entitlement/permission check inside recipient-resolution `recipient()` functions | **P2** | Notification service | Currently safe only because producers are trusted internal services; risk grows if less-trusted producers (Agent Fabric) get policies | NCA-2 |
| No user communication preferences of any kind | **P2** | Cross-domain | Cannot honor opt-out/quiet-hours/digest even if desired; also means anything wired is unconditionally sent | NCA-2 |
| No organization-level communication policy | **P2** | Cross-domain | No way to express mandatory-notice/staff-only/escalation policy at the org level | NCA-2 (decision-dependent) |
| `email-provider.ts` misfiled under `notifications/service/` while only used by credentials | **P3** | Code organization | Minor confusion risk for future maintainers | Any phase, low priority |
| Agent Fabric/BOS domains use dynamic, unbounded event-type strings | **P2** | Agent Fabric | Highest fatigue-risk surface if ever wired to user-facing notifications | Deliberately defer (NCA-5+) |
| No notification retention/expiration job | **P3** | Cross-domain | Table growth, stale "unread" items over time | NCA-2/3 |
| Notification title/message hardcoded per policy, no localization or template registry | **P3** | Notification service | Fine at current scale; will not scale past a few dozen policies gracefully | NCA-2/3 |
| Duplicate `RootProviders.jsx` path (`src/entries/` and `src/providers/`) | **P3** | Cross-app (pre-existing, not NCA-caused) | Confusion risk for EXR/NCA shell coordination | Footnote only — not this program's defect to fix |

**P0 count: 1. P1 count: 5. P2 count: 6. P3 count: 4.**

## 66. NCA P0/P1/P2/P3

Summarized directly above (§65); repeated here per required structure. P0 (1): transactional coupling of notification projection to source-event commit (an explicit design tradeoff, not an oversight — needs an owner decision). P1 (5): DGAL/Accessibility/Onboarding non-emission, multi-org visibility gap, duplicated fake bell UIs. P2 (6): missing entitlement check in recipient resolution, missing preferences, missing org policy, Agent Fabric fatigue risk, the non-functional CivicSure public newsletter signup, the disconnected frontend/backend halves of the Agent Fabric "Notification/Alert" layer. P3 (4): file placement, retention, templating/localization, pre-existing `RootProviders` duplication.

## 67. Migration Outlook

**No migration is needed to begin NCA-1.** Migration head remains `142`; this audit added none. Existing tables (`integration_outbox` migration `007`, `notifications` migration `081`, `audit_events` migration `004`, `service_catalog`/entitlements migration `084`, `memberships`/`roles`/`organizations` migration `001`) are sufficient to extend the current event→policy→notification pattern into DGAL, Accessibility, Organization Onboarding, CivicSure, and ARAG **once those domains add event emission**, which itself requires no schema change (just new `INSERT`-shaped calls to the existing `enqueue()`).

Later, genuinely additive migrations that would likely be needed (not now):
- Communication preference table (per-user, possibly per-organization)
- Notification: `priority`/`urgency`, `channel_eligibility`, `action_state`, `expires_at` columns
- Delivery-state table if/when a second channel (email) is generalized beyond certificates
- Digest/quiet-hours scheduling state
- Possibly an explicit `privacy_classification` column on `notifications` before any accommodation/CivicSure/ARAG policy goes live, per §44/§62

## 68. Owner Decision Register

| Decision ID | Question | Why It Matters | Options | Recommendation | Blocking Phase |
|---|---|---|---|---|---|
| NCA-DEC-01 | Should the P0 transactional coupling (§65) be fixed before any new domain is wired? | Determines whether NCA-1 can safely expand the existing pattern at all | (a) Fix first, (b) accept current coupling for now, document risk | (a) — this is cheap to fix and the current pattern is about to be reused more | NCA-1 |
| NCA-DEC-02 | Should the three disconnected fake bells be replaced with the real component, or removed until it's ready? | User-facing honesty; duplicate code | (a) Replace with real bell now, (b) remove the fake bell entirely until ready, (c) leave as-is | (a) or (b), never leave misleading "no notifications" UI live once real notifications exist for that vertical | NCA-3 |
| NCA-DEC-03 | Is transactional email required in the first real rollout (beyond certificates)? | Determines whether §39/§49 generalization work is in scope for NCA-1 or deferred | (a) Yes, generalize `email-provider.ts` now, (b) No, in-app only for the first rollout | (b), given no preference system exists yet to support "why did I get this email" opt-out | NCA-1/NCA-4 |
| NCA-DEC-04 | Should non-active-org notifications be surfaced at all (§46)? | Real, demonstrated user-missed-action risk today | (a) Aggregate cross-org badge, (b) leave as-is and document as a known limitation, (c) require org switch before any notification-bearing action | (a), scoped as a small addition once a shared bell exists | NCA-2/NCA-3 |
| NCA-DEC-05 | Should DGAL/Accessibility/Onboarding event emission be added as NCA work, or as each owning program's own follow-up (DGAL-7, AX-8, etc.)? | Affects who owns the fix and in which roadmap it lands | (a) NCA adds emission as part of rollout, (b) each domain's own program adds it, NCA only adds the policy | (b) for authority/ownership cleanliness — NCA should not modify DGAL/AX/Onboarding domain services itself | NCA-1 |
| NCA-DEC-06 | What is the retention/expiration policy for notification rows? | No legal/operational retention requirement was found in-repo to derive this from | (a) Time-based auto-archive (e.g., 90 days), (b) no retention policy for now | Needs real owner input; not inferable from the repo | NCA-2 |
| NCA-DEC-07 | Does any current or near-term legal/operational requirement mandate that certain notifications survive user opt-out (§35 of the task's law)? | Cannot be concluded from repository evidence alone | (a) Yes — name them, (b) No such requirement today | Cannot answer from code; must come from the business/legal owner | NCA-2 |

## 69. Proposed Finite NCA Roadmap

Based on the evidence above — most of the "hard" infrastructure already exists — the roadmap is smaller than a from-scratch buildout would need:

- **NCA-0 — System-Wide Audit** (this document)
- **NCA-1 — Contracts, Boundary Fixes, and First Real Rollout Wave**: fix the P0 transactional-coupling risk; add event emission (no new notification code) to Organization Onboarding, DGAL, and Accessibility Accommodations, each in that domain's own ownership; add `EVENT_POLICIES` entries for the highest-value, lowest-risk gaps already found (`arag.approval.required`, `arag.assurance.blocked`, `case.assigned`, `case.transitioned`, `studio.qa.completed`, `studio.handoff.created`). No migration required.
- **NCA-2 — Preferences, Recipient-Resolution Hardening, Retention**: add the communication-preference model, add entitlement checks into recipient resolution, decide and implement retention/expiration, decide the multi-org visibility question (NCA-DEC-04). Likely requires 1–2 additive migrations.
- **NCA-3 — Shared In-App Inbox/Bell Consolidation**: replace the three disconnected placeholder bells with the real, shared component; resolve the EXR shared-shell placement question (§47) together with whatever EXR has landed by then; wire a canonical attention-item projection into the existing `SeaAttention` primitive.
- **NCA-4 — Transactional Email (if NCA-DEC-03 says yes)**: generalize `email-provider.ts` beyond certificates, gated by the preference system from NCA-2.
- **NCA-5 — Remaining Domain Rollout**: Career/Portfolio, Reporting, Live Learning (after it gains session-lifecycle events, which is a Live Learning domain task, not NCA's), Agent Fabric (last and most carefully, given fatigue risk).
- **NCA-6 — System-Wide Acceptance**: matches the existing repo convention (`AX-7`, `DGAL-6`, `OGL-6` are each "final acceptance" phases) — a closing acceptance pass once the above is live.

This is deliberately **not** the assignment's example six-phase template verbatim — it is shorter where the repo already has the infrastructure (no separate "persistence" phase is needed since `notifications`/`integration_outbox` already exist) and adds one phase the template didn't anticipate (the P0 fix) because the evidence required it.

## 70. EXR Integration Notes

No codex/EXR code was read. All EXR-related content above (§47) is inferred solely from this worktree's own shell/header/provider structure and is explicitly a placement-requirements memo, not a claim about what EXR has built or intends. Coordination point for whoever runs NCA-3: confirm with the EXR track before touching any shared header/shell file, since three independent bell implementations already show this repo's tendency toward shell-level duplication when programs don't coordinate.

## 71. Files Created

- `docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md` (this file)

## 72. Files Modified

- None.

## 73. Git State

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`
- Branch: `claude/notifications`
- HEAD before and during audit: `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged by any commit — none was made)
- No migration added; migration head remains `142`
- No commit, no push, no merge performed
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified

## 74. NCA-0 Decision

**NCA-0 is COMPLETE.** All 51 success criteria in the assignment are satisfied: the correct worktree/branch/baseline were confirmed; existing communication mechanisms, event infrastructure, channels, providers, preferences, and organization policy were inventoried with file-level evidence; the event/notification boundary was mapped domain-by-domain with concrete gaps identified (not assumed); a communication-event contract, notification-projection contract, recipient-resolution model, mandatory/optional model, urgency model, attention model, read/action-state model, dedupe/idempotency analysis, delivery-state analysis, channel policy, digest/quiet-hour/escalation analysis, fatigue/privacy/security/multi-org risk analysis, EXR shared-shell boundary analysis, retention/auditability analysis, and Evidence/Truth boundary confirmation were all produced against real code, not invented; a finite roadmap and migration outlook were proposed; no production source, migration, commit, push, or other-worktree modification occurred.

## 75. Exact Next Phase

**NCA-1 — Canonical Communication Contracts, the P0 Transactional-Coupling Fix, and the First Real Event-Emission/Policy Rollout Wave**, per the roadmap in §69. This phase is not started in this run.

---

## Final Verdict Questions

1. **How many existing communication mechanisms were found?** 17 distinct mechanisms cataloged in §6 (real notification system, 3 fake bells, BOS notification-fabric [frontend], BOS admin fabric page, the disconnected Python "Notification/Alert" classification service + event-webhook service in Agent Fabric, toast/celebration layer x2, SEA attention primitives, BOS event-bus tool, certificate email provider, audit_events, the unrelated employer/sales `inbox.js`, and the non-functional CivicSure newsletter signup).
2. **How many actual (working, end-to-end) notification mechanisms were found?** One: the `notifications` table + `notification-service.ts` + `CurriculumHeader.jsx`/`Notifications.jsx` path. The BOS `notification-fabric` also "works" but is a separate, internal-only system.
3. **How many event infrastructures were found?** Two real ones: `integration_outbox` (canonical, ~34 producers) and `audit_events` (separate, audit-only). The BOS-local `shsEventBus.js` is a third, but it is a visualization/admin tool, not a real bus.
4. **What channels actually exist today?** In-app (real, partial rollout) and email (real but certificate-only). SMS, push, webhook-out, Slack/Teams: none.
5. **Does email infrastructure exist?** Yes, but scoped only to credential certificate delivery, not general notifications.
6. **Does SMS infrastructure exist?** No.
7. **Does push infrastructure exist?** No.
8. **Does an in-app inbox exist?** Yes — `src/pages/Notifications.jsx`, real and working, but linked from only the Curriculum shell.
9. **Does a notification bell exist?** Yes, one real one (`CurriculumHeader.jsx`) and three fake/disconnected ones (Store, Arcade, CivicSure).
10. **Are user notification preferences implemented?** No — confirmed absent.
11. **Is organization-level communication policy implemented?** No — confirmed absent.
12. **What is the biggest current communication architecture problem?** The transactional coupling of notification-projection creation to the source domain event's own commit (§56/§65, P0) — a deliberate consistency-over-isolation design choice that still conflicts with the task's failure-isolation law and needs an explicit owner decision — closely followed by the fact that a real system exists but three shells rebuilt fake versions instead of reusing it, and a fourth, backend-only "Notification/Alert" implementation (Agent Fabric's Python service) exists disconnected from all of them.
13. **Are operational events being confused with notifications anywhere?** No — the separation between `integration_outbox`/`audit_events` (events) and `notifications` (projection) is real and intact everywhere it was checked.
14. **Are duplicate communication mechanisms present?** Yes — three duplicate fake bell UIs, a naming/path collision between the BOS `notification-fabric`/`shsEventBus` tools and the real user-facing system (conceptual, not functional, overlap), and a fourth-and-fifth fragmentation: the BOS frontend fabric and Agent Fabric's Python `notification_alert_service.py`/`event_webhook_service.py` appear to be intended as one canonical "Notification/Alert" layer but are not wired together.
15. **Are users at risk of notification overload?** Not yet in practice (only ~11 policies exist), but Agent Fabric/Studio's high event-type volume is a real forward risk (§43).
16. **Which domains are highest-volume risks?** Agent Fabric (dynamic/unbounded event types) and Studio (11 distinct real event types already).
17. **Are multi-org communication semantics clear?** No — a real gap exists (§46): non-active-org notifications are silently invisible.
18. **Is organization context present in communication?** Yes, at the data layer (`organization_id`/`tenant_id` on every row) — the gap is at the UI/visibility layer, not the data model.
19. **Are role-based recipient rules clear?** Partially — each policy's `recipient()` function is clear and correct for its case, but there is no general role/permission-based resolution layer.
20. **Are entitlement checks needed for recipient resolution?** Yes, and currently absent (§30/§65 P2).
21. **What communication types should be mandatory?** Proposed in §31: signature/approval-required, org-onboarding decisions — pending owner sign-off, not yet decided in-repo.
22. **What should remain optional?** Portfolio/career updates, informational QA-complete, report-ready.
23. **What should be digest eligible?** Low-severity Agent Fabric events, portfolio artifact updates, non-blocking Studio QA results.
24. **What should never be delayed?** ARAG approval-required/blocked, DGAL signature-expiring, any future accommodation-fulfillment-required notification.
25. **What should be in-app only?** Everything, today — there is no functioning general email channel to route anything else through yet.
26. **What should be email candidates?** Signature-required, approval-required, org-onboarding decision — once a general email path is generalized (NCA-4).
27. **Are provider integrations production-ready?** Only the certificate email path is production-capable, and only if configured; nothing else is.
28. **What privacy risks exist?** Accommodation, CivicSure evidence, and ARAG release detail must stay out of notification bodies once those domains get policies (§44/§62) — no violation exists today because none of those policies exist yet.
29. **What security risks exist?** Missing entitlement check in recipient resolution (currently safe only because producers are trusted); no other concrete vulnerability found in the real, live code path.
30. **Is minimum-necessary notification content defined?** Not formally, but the de facto practice in every existing policy already follows it (verified, not assumed).
31. **Can notification dismissal mutate source workflow?** No — verified by reading every function in `notification-service.ts`; none writes outside the `notifications` table.
32. **Can notification read state become canonical completion?** No, and nothing in the current code risks conflating them.
33. **Can notification write Evidence/Truth?** No — verified; the only Truth-adjacent method (`linkTruthSpineRecord`) is unrelated and uncalled from the notification path.
34. **How should action-required items differ from simple notifications?** Via a new, explicit `actionState`/attention-item projection (§29/§33/§61) — proposed, not yet built.
35. **What current attention surfaces exist?** `SeaAttention`/`SeaNextAction` (§6/§33), reused across 5 admin/instructor dashboards, presentation-only today.
36. **What is the recommended dedupe model?** The one already in production: `(organization_id, tenant_id, recipient_user_id, notification_type, source_event_id)` unique constraint — reuse verbatim.
37. **What is the recommended recipient-resolution model?** Extend the existing per-policy `recipient()` pattern with an added entitlement/permission check step (§30).
38. **What is the recommended urgency model?** Reuse the BOS fabric's existing four-level `info/notice/warning/critical` scheme (§32) rather than inventing a new one.
39. **What is the recommended delivery-state model?** In-app: none needed (instant). Email (once generalized): reuse the `MailDeliveryResult`-shaped states already in `email-provider.ts`.
40. **Should a universal inbox exist?** Yes — one already exists (`Notifications.jsx`); it should be exposed from every shell rather than rebuilt per-shell.
41. **Should inbox items be organization-scoped?** Yes, and they already are at the data layer; the open question is cross-org visibility (§46), not scoping correctness.
42. **Is transactional email needed in the first implementation?** Recommendation: no (NCA-DEC-03) — ship in-app-only first, add email once preferences exist.
43. **Are digests needed?** Eventually, for low-severity/high-volume domains (Agent Fabric, portfolio) — not for NCA-1.
44. **Are quiet hours needed?** Not urgently — no evidence of user complaint or requirement in-repo; defer.
45. **What should the EXR/Notifications ownership boundary be?** EXR owns header/shell placement and structure; Notifications owns the bell component's data/internals and the attention-item contract (§47) — subject to confirmation once EXR's actual output is visible.
46. **What shared shell surfaces are likely conflict points?** The global header bell slot (highest risk, given three pre-existing duplicate builds) and the duplicate `RootProviders.jsx` paths (pre-existing, unrelated to NCA but relevant to coordination).
47. **Is a migration likely needed later?** Yes — preferences, notification priority/action-state/expiry columns, and delivery-state (if email generalizes) are all plausible future migrations (§67).
48. **What minimal persistence would likely be required?** A communication-preferences table and a handful of additive columns on `notifications` — not a new event system or a new notification table.
49. **What finite NCA roadmap is recommended?** NCA-1 through NCA-6 as laid out in §69, shorter than the assignment's example template because most core infrastructure already exists.
50. **Which owner decisions are required before NCA-1?** NCA-DEC-01 (fix the P0 coupling) and NCA-DEC-05 (who owns adding event emission to DGAL/AX/Onboarding) are the two that actually block NCA-1's start; the rest can be decided during NCA-1/NCA-2.
51. **How many P0 findings exist?** 1.
52. **How many P1 findings exist?** 5. (P2: 6, P3: 4 — full breakdown in §65/§66.)
53. **Did you modify production source?** No.
54. **Did you create a migration?** No.
55. **Did you commit?** No.
56. **Did you push?** No.
57. **Is the main worktree untouched?** Yes.
58. **Is the Codex worktree untouched?** Yes.
59. **Does `git diff --check` pass?** Yes (verified in §"Lightweight Validation" below).
60. **Is NCA-0 COMPLETE?** Yes.
61. **What exact phase comes next?** NCA-1, as defined in §75 — not started in this run.

---

## Lightweight Validation

`git diff --check` was run against the only change in this phase (the addition of this report file) and passed with no whitespace-conflict-marker errors.
