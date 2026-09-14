# NCA OWNER DECISION LOCK — PRE-NCA-1 ARCHITECTURE DECISION PACKAGE

Decision-framing only. No production source, shared shell UI, or migration was touched in this phase. No commit, no push.

## 1. Executive Summary

NCA-0 established that Silicon Heartland's notification architecture is **not greenfield**: a durable event bus (`integration_outbox`), a durable Postgres notification projection (`notifications`, migration `081`), a working REST API, and a real wired bell/inbox (Curriculum shell) already exist and are already registered as a canonical layer in `docs/MASTER_LAYER_REGISTRY.md`. NCA-0 logged 0 P0-blocking-authority findings against Evidence/Truth/workflow state, 1 P0 architectural tension (transactional coupling), 5 P1s, 6 P2s, and 4 P3s, plus a 7-item owner decision register (`NCA-DEC-01..07`).

This package's job is to **compress that into the smallest possible set of decisions that actually require an owner's judgment**, and separate them cleanly from everything the NCA-0 evidence already answers on its own. The result: **most of what looks like a "decision" is already architecture-determined.** Only two decisions genuinely block NCA-1 from starting (`NCA-D001`, `NCA-D002` below). Everything else gates a *later* phase (NCA-2 through NCA-5) or is a confirmation, not a fork in the road.

## 2. NCA-0 Baseline

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`, branch `claude/notifications`, HEAD `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged)
- Migration head: `142` (unchanged; no migration created in this phase)
- Canonical event bus: `integration_outbox` (migration `007`), ~34 producer domains
- Canonical notification projection: `notifications` table + `notification-service.ts` (migration `081`), `EVENT_POLICIES` map covering ~11 event types (Studio, Credentials, Deployment, Registry, Curriculum lesson, DGAL policies present-but-unreachable)
- Real in-app surface: `CurriculumHeader.jsx` bell + `src/pages/Notifications.jsx` inbox — reachable only from the Curriculum shell today
- Disconnected/fake notification-like surfaces: `StoreHeader.jsx`, `ArcadeHeaderExtras.jsx`, `CivicTopBar.jsx` (fake bells); `src/system/notification-fabric/*` (BOS, localStorage, admin-only, by-design non-external); `services/shf-agent-fabric/services/notification_alert_service.py` + `event_webhook_service.py` (Python, stateless classification, by-design non-external, disconnected from the BOS frontend fabric despite matching the same registered canonical-layer boundary)
- P0: 1 (transactional coupling between notification-projection creation and the source event's own DB commit — an explicit, intentional design choice per an in-code comment, not an oversight)
- P1: 5 (DGAL/Accessibility/Onboarding notification policies wired to events that are never emitted; multi-org visibility gap; three duplicate fake bells)
- No user communication preferences, no organization-level communication policy, no general email/SMS/push/webhook delivery exist today

Full evidence, file:line citations, and matrices: `docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md`. This document does not re-derive that evidence — it only decides what to do about it.

## 3. Canonical Infrastructure Decision

**CURRENT STATE:** `integration_outbox` (event bus) + `notifications` (projection) are real, durable, org/tenant/recipient-scoped, deduplicated, and already in production use by ~11 wired event types. Three other mechanisms exist alongside them: the BOS frontend fabric (localStorage, admin-only), the Agent Fabric Python classification service (stateless, admin/governance-only), and three fake bells (no backend at all).

**OPTIONS:**
- (a) Lock `integration_outbox` + `notifications` as the sole canonical notification infrastructure; require every other mechanism to either adapt to it or be explicitly scoped as a non-notification, domain-local tool.
- (b) Treat the BOS fabric and Agent Fabric classification service as co-equal parallel notification systems for their respective audiences.
- (c) Build new infrastructure and migrate everything to it.

**RECOMMENDED OPTION:** (a).

**WHY:** The evidence gives no reason to build new infrastructure (c) — `integration_outbox`/`notifications` already satisfy the durability, idempotency, org-scoping, and dedupe requirements NCA-0 evaluated them against. Option (b) would formalize fragmentation that NCA-0 found to already be causing confusion (the BOS fabric and the Agent Fabric Python service appear to be two disconnected halves of one intended layer). The three fake bells have zero backend and are not a real "mechanism" to preserve — they must adapt to the canonical bell/inbox pattern (see §12).

The BOS fabric and Agent Fabric classification service are **not** competing notification systems and should **not** be forced onto the canonical delivery path wholesale — they serve a genuinely different purpose (internal governance/readiness classification, explicitly self-scoped to never send externally). They need **adapters, not replacement**: where their classification output represents something a real human must act on, that should additionally produce a canonical `integration_outbox` event → `notifications` row, rather than living only in an internal, non-durable surface. See §13 for the specific recommendation.

**WHAT THIS UNLOCKS:** A single answer to "where does a notification come from" for every future domain (DGAL, Accessibility, Organization Onboarding, CivicSure, ARAG all just call the existing `enqueue()` + add an `EVENT_POLICIES` entry — no new infrastructure, no migration). It also gives NCA-3 (bell/inbox consolidation) an unambiguous target to point every shell at.

## 4. Universal Inbox Decision

**OPTIONS EVALUATED:**
- A. One global inbox (single shared route/UI, no per-app variation)
- B. Separate per-app inboxes (status quo direction if the fake bells were made real independently)
- C. One canonical inbox (single backend, single data contract) with app/domain-specific **projections** (each shell mounts the same underlying bell/inbox component, styled/placed per its own shell)

**RECOMMENDED: C.**

Reasoning against the evaluation criteria:
- **Multi-org users**: a single canonical backend is required regardless — org/tenant scoping already lives at the data layer (`organization_id`, `tenant_id` on every row), so B would either duplicate that logic per app (risk of drift) or silently ignore it (worse).
- **Role context**: recipient resolution is already per-event-type, not per-app, so there is no role-based reason to split by app.
- **Shell differences**: real — Curriculum, Store, Arcade, CivicSure, Admin all have visually distinct headers. C accommodates this (each shell mounts the shared component, not a shared page layout).
- **EXR shell work**: EXR owns header/shell placement (§16 below); a single canonical bell component is the only shape that lets EXR slot the *same* component into every shell without NCA maintaining N divergent implementations.
- **Cross-product navigation & organization scoping**: a single inbox route (or a route-per-shell that reads the same API) keeps "your notifications" consistent no matter which shell a user is currently in.

This is **architecture-determined**, not a genuine fork — B (separate per-app) is what produced the three fake bells in the first place, and A (one global inbox with no shell-specific projection) is not achievable given the shell diversity NCA-0 documented in FE-1/FE-2. Owner input is useful only on **sequencing** (which shells get the real projection first — see §12), not on the model itself.

## 5. Multi-Org Decision

**CURRENT STATE (verified, not proposed):** Every `notifications` row already carries `organization_id`/`tenant_id`. `listNotifications`/`unreadCount` filter strictly by the user's **currently active** organization. A user with real, unread, action-required notifications in an organization that is not their active one sees **zero signal** today — no badge, no aggregate count, no warning.

**Answers:**
- Should each notification carry organization identity? **Yes — already true, keep as-is.**
- Should inbox support organization filtering? **Yes — already true structurally; the gap is visibility across orgs, not scoping correctness.**
- Should the current active org hide notifications from other authorized orgs? **No.** This is the actual defect to fix, not a feature to preserve.
- How should cross-org notifications remain understandable? Recommend: the active-org inbox stays the default view (no unrequested cross-org content mixed into one list, which would be confusing about *which org an action applies to*), but the shell must surface an **aggregate, non-blocking signal** ("You have notifications in another organization") without requiring a silent org switch, and any action link must make the target organization explicit before the user acts.

**RECOMMENDED EXACT BEHAVIOR:** Active-org-scoped inbox by default + a small aggregate cross-org indicator, never silent suppression. This requires no new backend model (data already supports it) — it is a UI/UX policy decision about how much cross-org noise to surface, which is why it remains an owner decision (§17) rather than a pure architecture fact, even though the underlying data support is already architecture-determined.

## 6. Transactional Email Decision

**OPTIONS EVALUATED:**
- A. In-app first, email later
- B. In-app + transactional email in the core release
- C. Event/contracts now, provider integration deferred

**Evidence basis (not assumed):** The only real email code (`email-provider.ts`, `GenericHttpMailProvider`/`TestMailProvider`) is scoped to certificate delivery only, is env-gated (`SHS_EMAIL_PROVIDER_ENDPOINT`/`_API_KEY`), and is not wired to the general notification system at all. There is **no** user communication-preference system (§10 of NCA-0) — meaning if email shipped broadly today, there would be no way for a user to control or opt out of it.

**RECOMMENDED OPTION: A** (in-app first, email later — matches NCA-0's `NCA-DEC-03` recommendation). Option B is not responsibly achievable yet: shipping general transactional email before any opt-out mechanism exists risks exactly the kind of unwanted-communication problem the governing law is meant to prevent. Option C is close to A operationally (no provider work happens now either way) but undersells that the *event/notification contract itself* is already sufficient — no new contract work is needed to defer email, only new *provider generalization* work (moving `email-provider.ts` from certificate-only to general use), which is real, scoped, and correctly deferred to NCA-4.

**This does not block NCA-1.** It blocks NCA-4.

## 7. Mandatory / Optional Policy

Using the six categories as an architecture-derived draft (NCA-0 §31), cross-checked against real event types:

| Category | Can user suppress in-app? | Preference-controllable (channel/frequency)? | Must remain visible in-app? |
|---|---|---|---|
| MANDATORY_OPERATIONAL | No | Channel choice only, not suppression | Yes, always |
| REQUIRED_ACTION | No | Channel choice only, not suppression | Yes, always |
| TRANSACTIONAL | No (informational but not user-optional) | Yes, once preferences exist | Yes |
| OPTIONAL_PRODUCT | Yes | Yes | No |
| DIGEST_ELIGIBLE | Yes (can be batched or muted) | Yes | No (digest cadence acceptable) |
| MARKETING | Yes, always (opt-in, not opt-out) | Yes, fully | No — must be a wholly separate, explicitly-consented channel, never the `notifications` table |

**Marketing separation:** confirmed as a hard requirement, not a style preference — NCA-0 found the `notifications` table is authenticated-org-scoped operational infrastructure; reusing it for anything marketing-shaped would conflate consent regimes. No marketing mechanism exists today (correctly out of scope); if one is ever built, it must be its own system with its own consent record, never layered onto `notifications`.

**What is architecture-determined vs. owner-decided here:** the *shape* of the six-category model and which column governs suppression is architecture-derivable from what already exists (no preference table exists yet, so nothing can be suppressed today regardless). What genuinely requires owner sign-off is: **which specific real event types get classified as MANDATORY_OPERATIONAL / REQUIRED_ACTION** (i.e., which ones a user may never suppress) — that is a business/compliance judgment NCA-0 explicitly declined to make ("do not make legal conclusions beyond architecture evidence"), and none exist today, so it is not blocking NCA-1.

## 8. Digest Decision

**Evaluated against:** immediate need, current infrastructure, fatigue risk, urgency semantics, scheduling complexity.

- Immediate need: low — only ~11 event types are wired today, none yet high-volume.
- Current infrastructure: **none** — no cron/scheduler/digest-batching code exists anywhere in the repo to reuse.
- Fatigue risk: real but **forward-looking**, concentrated in Agent Fabric (dynamic/unbounded event types) and, to a lesser degree, Studio.
- Scheduling complexity: non-trivial net-new work (would need a real job scheduler, which does not exist as a general-purpose system today — only the outbox's own lease/claim pattern is worker-shaped, and that is not a digest scheduler).

**RECOMMENDATION: LATER_PHASE.** Not needed for NCA-1; becomes relevant once Agent Fabric or another high-volume domain is wired (NCA-5 per the roadmap), and only after the preference model (NCA-2) exists to let a digest be something a user actually chose.

## 9. Quiet Hours Decision

- Immediate need: no evidence of one — no repository requirement, complaint, or use case found.
- Current infrastructure: a plain `timezone` column on `users` (migration `001`) exists as a seed, but no scheduling/suppression logic of any kind.
- Fatigue risk: quiet hours address a different problem (timing) than volume; not a substitute for dedupe/digest.
- Urgency semantics: **critical** — quiet hours must never silently suppress CRITICAL/REQUIRED_ACTION communication, which means quiet hours cannot be built correctly until the urgency/mandatory model (§7) exists.

**RECOMMENDATION: NOT_NEEDED for initial scope; LATER_PHASE if a real need materializes.** Do not build ahead of evidence.

## 10. Retention Decision

Distinguishing the five retention concerns explicitly:

- **Active inbox visibility**: governed by `status` (`UNREAD`/`READ`/`ARCHIVED`) — already real, no change needed.
- **Archive**: `ARCHIVED` status exists as a value but nothing automatically transitions a row into it — currently manual-only.
- **Expiration**: not modeled (`expires_at` does not exist on `notifications` today).
- **Source-domain retention**: explicitly out of scope for NCA — each domain (e.g., DGAL's document retention) owns its own retention rules, untouched by anything notification-related. This must stay separate; the notification projection expiring does not mean the source record expires.
- **Delivery/audit history**: not modeled beyond the `notifications` row's own timestamps; no separate audit trail for "was this notification ever shown."

**RECOMMENDATION: HYBRID.** A fixed system-level default (e.g., time-based auto-archive of read, non-action-required notifications) should exist as a baseline so the table doesn't grow unbounded, but the exact retention *window*, and whether any notification category must be retained longer for compliance reasons, is not derivable from the repository — it is a genuine owner/legal input (matches NCA-0 `NCA-DEC-06`/`NCA-DEC-07`). Domain-defined overrides (e.g., DGAL wanting its own notification retention aligned with document retention) should be possible but are not required to start. Fully user-configurable retention is not recommended as the default — it adds preference-system complexity for a benefit (user-chosen retention windows) nobody has asked for yet.

**Blocks:** NCA-2, not NCA-1.

## 11. Attention vs Notification Boundary

Confirming the boundary as stated (already effectively derived in NCA-0 §33/§47, and now stated as agreed with EXR):

- **EXR / SEA owns**: where attention regions exist in UI (placement, page/shell information architecture) — matches `SeaAttention`'s existing role as a presentation-only primitive that takes whatever `items` a page hands it.
- **NCA owns**: notification/attention **projection data** — i.e., the canonical `actionRequired`-filtered subset of notifications, unread/action-required counts, and notification lifecycle (read/archived/expiry) — supplying the `items` that feed `SeaAttention` and any future EXR-defined slot.
- **Source domains own**: whether work is actually still required — canonical workflow state (e.g., ARAG's own approval state, DGAL's own signature state) is never overridden or completed by a notification/attention item; the attention item only reflects it.

**CONFIRMED, not refined.** This is exactly what the existing `notifications`/`SeaAttention` separation already does today (NCA-0 §33 found no violation of this boundary anywhere in the repo). The one addition NCA-1/NCA-3 should make explicit: define the canonical **attention-item projection** (a filtered view of `notifications` where `actionRequired = true`) as its own named contract, so every future `SeaAttention` consumer gets it the same way instead of each page hand-rolling its own `items` computation.

**Architecture-determined. No owner decision required.**

## 12. Store / Arcade / CivicSure Bell Decisions

| Shell | Current State | Recommended Disposition | Why |
|---|---|---|---|
| Store/Exchange (`StoreHeader.jsx`) | Fake — static "You're all caught up," never calls the API | **B — adapt to canonical notification projection** | No unique Store-specific notification need was found; swapping in the shared, real bell component costs little and immediately removes a misleading "all caught up" claim that may not be true |
| Learning Arcade (`ArcadeHeaderExtras.jsx`) | Fake — code comment admits no live feed is wired | **B — adapt to canonical notification projection** | Same reasoning; the component already self-documents that it's a placeholder awaiting exactly this |
| CivicSure (`CivicTopBar.jsx`) | Fake — code comment: "honest — no live feed... will show real..." | **B — adapt to canonical notification projection** | CivicSure additionally has real unwired events (`case.assigned`, `case.transitioned`, `referral.created`) that are strong near-term candidates for `EVENT_POLICIES` entries (§NCA-0 §20) — CivicSure is the shell most likely to have real content to show soon after adaptation |

**None recommended for "keep product-local" (C) or "remove eventually" (A) alone** — removing a bell without replacing it is a UX regression once real notifications exist for that vertical, and keeping them product-local perpetuates duplicate, drifting fake UI that already contradicts what the backend can actually provide.

**This is a low-owner-input, mostly architecture-determined disposition** — the "how" is clear; the only genuine owner input is **timing** (do this as part of NCA-3 as currently sequenced, or pull it earlier). Recommend keeping it at NCA-3, since it depends on the shared bell component being generalized beyond the Curriculum shell first. **Do not implement in this phase.**

## 13. BOS / Agent Fabric Decision

Two separate mechanisms, evaluated independently:

**BOS frontend "Notification & Alert Fabric" (`src/system/notification-fabric/*`, localStorage, admin-only):**
**Recommendation: KEEP_DOMAIN_LOCAL_WITH_CANONICAL_PROJECTION.**
Why: it is explicitly self-scoped to internal operator awareness and hard-blocked (by its own safety scanner) from ever sending externally — that scope is intentional and correct, not a gap to close by replacing it. However, where it represents something a human operator must actually act on (e.g., a `policy_violation` or `readiness_blocker` that maps to a real person's queue), that signal should **also** produce a canonical `integration_outbox` event → `notifications` row for that operator, rather than existing only in a non-durable, single-browser `localStorage` surface. Today an operator who clears their browser storage loses the alert entirely — that is a real availability risk this recommendation would close, without touching the fabric's non-external-sending guarantee.

**Agent Fabric Python `notification_alert_service.py` + `event_webhook_service.py` (stateless classification, `services/shf-agent-fabric`):**
**Recommendation: KEEP_DOMAIN_LOCAL_WITH_CANONICAL_PROJECTION.**
Why: this is a classification/readiness-scoring function, not a delivery mechanism — it should keep doing exactly what it does (score/classify), not be replaced. But two things follow from NCA-0's finding that it is disconnected from the BOS frontend fabric despite matching the same registered canonical-layer boundary: (1) confirm with the layer's actual owner whether these are meant to be connected (an ownership/authority question outside NCA's scope to resolve by itself — see NCA-D015), and (2) when this service classifies something as requiring human action for an end user (not just an internal operator), that classification should feed the same canonical `integration_outbox`/`notifications` path as everything else, gated carefully given Agent Fabric's demonstrated fatigue risk (dynamic, unbounded event types).

**REPLACE_LATER and NO_CHANGE were both rejected**: REPLACE_LATER would discard working, correctly-scoped governance tooling for no benefit; NO_CHANGE would leave a known fragmentation (two halves of one canonical layer, disconnected) undocumented and let it silently worsen as both sides accrue more logic independently.

**This targets NCA-5 per the roadmap** (Agent Fabric rollout, last and most carefully, given fatigue risk) — it does not block NCA-1.

## 14. Channel Scope

| Channel | Classification | Basis |
|---|---|---|
| IN_APP | **CORE_NOW** | Real, production Postgres-backed projection + working UI in one shell today; this is the only channel with anything to build on |
| EMAIL | **LATER** | Real code exists but is certificate-scoped only, env-gated, and not wired to general notifications; no preference system exists to gate opt-out — see §6 |
| SMS | **NOT_APPLICABLE** (for this release); **EXTERNAL_DEPENDENCY** if ever pursued | No code, no provider, no evidence of product need found anywhere in the repo |
| PUSH | **NOT_APPLICABLE** (for this release); **EXTERNAL_DEPENDENCY** if ever pursued | No code, no provider, and — critically — no mobile app surface was found to push to |
| WEBHOOK (outbound to external partners) | **LATER**, **EXTERNAL_DEPENDENCY** once pursued | `integration_outbox.destination` column exists in schema but nothing consumes it to call out externally; building this requires partner-side coordination, not just internal work |

**Architecture-determined, not a genuine fork.** The evidence permits exactly one honest answer for the first canonical release: in-app only. Owner input is a confirmation, not a choice among live alternatives — there is currently no working alternative to choose.

## 15. Persistence / Migration Outlook

- **Can existing notification tables support canonical consolidation?** Yes. `notifications` (migration `081`) already has the org/tenant/recipient scoping, dedupe constraint, and read-state model needed to onboard DGAL, Accessibility, Organization Onboarding, CivicSure, and ARAG as soon as those domains add event emission (a code change in each domain, not a schema change).
- **Can read/unread remain where it is?** Yes — `UNREAD`/`READ`/`ARCHIVED` on `notifications.status` is sufficient for NCA-1 and does not need to move or be duplicated.
- **Are recipient/dedupe/delivery states sufficient?** Recipient resolution and dedupe: yes, sufficient, reuse verbatim. Delivery state: sufficient **only** because in-app is the only live channel (instantaneous, binary); this will need real work (§39/§42 of NCA-0) once email is generalized, but that is an NCA-4 concern.
- **Is a future migration needed?** Yes, but not now and not to start NCA-1. Concretely deferred, additive migrations: a communication-preferences table; `priority`/`urgency`, `channel_eligibility`, `action_state`, `expires_at` columns on `notifications`; a delivery-state model once email generalizes; a `privacy_classification` column before any accommodation/CivicSure/ARAG policy goes live.
- **Minimal need if/when it happens:** additive columns and one new preferences table — not a new notification table, not a new event bus.

**Migration head remains `142`. No migration created in this phase. Architecture-determined — no owner decision required to begin NCA-1.**

## 16. EXR Integration Boundary

Per instruction, this boundary is treated as approved and was not verified against the Codex worktree — translated here into concrete NCA implementation constraints:

- NCA components (bell, inbox, attention-item projection) must be built as **mountable units with a data contract**, never as changes to shell/header/navigation/routing files — those remain EXR's exclusively.
- NCA must not assume a specific header DOM structure or CSS; the canonical bell component must accept placement from whatever slot EXR defines, not the other way around.
- The organization-context switcher (if/when EXR builds or owns one) remains EXR's; NCA reads the currently-active organization reactively and must never introduce its own competing org-switching UI.
- Any consolidation of the three fake bells (§12) must go through whatever slot/mounting convention EXR has defined by the time NCA-3 starts — not before, and not by directly editing `StoreHeader.jsx`/`ArcadeHeaderExtras.jsx`/`CivicTopBar.jsx`'s surrounding shell structure.
- `RootProviders` duplication (`src/entries/RootProviders.jsx` vs `src/providers/RootProviders.jsx`, flagged in NCA-0 §63) is a **pre-existing, cross-cutting risk** — if NCA ever needs a `NotificationProvider`, it must first get an explicit answer (from whoever owns EXR/shell coordination) about which `RootProviders` is canonical, rather than picking one unilaterally.
- NCA does not require anything from EXR to begin NCA-1 — NCA-1's scope (event emission ownership, `EVENT_POLICIES` additions, the P0 fix) is entirely backend/contract work with no shell dependency. EXR coordination becomes load-bearing starting at NCA-3.

## 17. Owner Decision Register

| Decision ID | Topic | Current State | Options | Recommendation | Owner Approval Needed? | Blocks Which NCA Phase |
|---|---|---|---|---|---|---|
| NCA-D001 | P0 transactional coupling (notification-projection creation shares the source event's DB transaction, by design) | Confirmed intentional (in-code comment), creates a real failure-isolation tension | (a) Fix/decouple, (b) accept and document the risk | (a) — cheap to fix now, before more domains reuse this exact path | **Yes** | **NCA-1 (blocking)** |
| NCA-D002 | Event-emission ownership for DGAL, Accessibility, Organization Onboarding | Notification policies exist and are wired for DGAL; none of these three domains emit real events yet | (a) NCA adds emission itself, (b) each owning domain program adds emission, NCA only adds the policy | (b) — for authority/ownership cleanliness; NCA should not modify DGAL/AX/Onboarding domain services | **Yes** | **NCA-1 (blocking)** |
| NCA-D003 | Canonical infrastructure lock (`integration_outbox` + `notifications` as sole canonical system) | Real, durable, already in production use | (a) Lock as canonical, (b) allow parallel systems, (c) build new infra | (a) | No — evidence-determined; log for the record | Informational |
| NCA-D004 | Universal inbox model | One real backend + UI exists (Curriculum only) | A. One global inbox, B. Separate per-app, C. Canonical backend + per-shell projection | C | Confirmation only (sequencing, not shape) | NCA-3 |
| NCA-D005 | Multi-org notification visibility | Non-active-org notifications are silently invisible today | (a) Aggregate cross-org badge, (b) leave as-is, (c) require org switch before any notification-bearing action | (a) | **Yes** | NCA-2/NCA-3 |
| NCA-D006 | Transactional email in first release | No general email path exists; certificate-only email exists | A. In-app first, B. In-app + email in core, C. Contracts now/provider deferred | A | Yes (product prioritization, not architecture) | NCA-4 (not NCA-1) |
| NCA-D007 | Mandatory vs optional classification of *specific* real event types | No preference system exists; draft 6-category model proposed | Owner names which event types are MANDATORY_OPERATIONAL/REQUIRED_ACTION | Draft model in §7; specific event-type assignments pending | Yes (business/compliance judgment) | NCA-2 |
| NCA-D008 | Digest scope | No digest infrastructure exists | IN_SCOPE_INITIAL / LATER_PHASE / NOT_NEEDED | LATER_PHASE | No — evidence-determined | NCA-5 |
| NCA-D009 | Quiet hours scope | No quiet-hours infrastructure exists | IN_SCOPE_INITIAL / LATER_PHASE / NOT_NEEDED | NOT_NEEDED (revisit if evidence of need emerges) | No — evidence-determined | Unscheduled |
| NCA-D010 | Retention policy specifics (window length, compliance overrides) | No retention/expiration policy exists today | Fixed / domain-defined / user-configurable / hybrid | Hybrid (fixed default + domain override where compliance requires) | Yes (legal/compliance input needed for the actual window) | NCA-2 |
| NCA-D011 | Attention vs Notification boundary | Already respected in practice; EXR boundary stated as approved | Confirm or refine | Confirm as-is | No — architecture-determined and already agreed with EXR | Informational |
| NCA-D012 | Store/Arcade/CivicSure fake bell disposition | Three disconnected fake bells | A. Remove, B. Adapt to canonical, C. Keep local | B for all three | Confirmation only (timing) | NCA-3 |
| NCA-D013 | BOS fabric / Agent Fabric Python service relationship to canonical | Two disconnected, correctly-scoped-but-fragmented governance tools | ADAPT_TO_CANONICAL / KEEP_DOMAIN_LOCAL_WITH_CANONICAL_PROJECTION / REPLACE_LATER / NO_CHANGE | KEEP_DOMAIN_LOCAL_WITH_CANONICAL_PROJECTION (both) | Yes (prioritization/authority — confirm intended relationship between the two halves) | NCA-5 |
| NCA-D014 | Delivery channel scope for first release | Only in-app is real | Classify each of IN_APP/EMAIL/SMS/PUSH/WEBHOOK | See §14 table | No — evidence-determined | Informational |
| NCA-D015 | Persistence/migration sufficiency for NCA-1 | Existing tables sufficient; no schema change needed | Proceed without migration / require migration first | Proceed without migration | No — evidence-determined | Informational (confirms NCA-1 is unblocked) |

## 18. Architecture-Determined Decisions

No owner input required — the NCA-0 evidence already dictates the answer:

- Canonical infrastructure identity (`NCA-D003`): `integration_outbox` + `notifications` are canonical; nothing else competes with them credibly.
- Universal inbox shape (`NCA-D004`): one canonical backend with per-shell projections — the shell diversity documented in FE-1/FE-2 rules out a single undifferentiated UI, and the existing fake-bell pattern rules out per-app reinvention.
- Digest and quiet-hours initial scope (`NCA-D008`, `NCA-D009`): no infrastructure exists, no urgent evidence of need — defer.
- Attention vs Notification boundary (`NCA-D011`): already respected in every code path checked; EXR boundary already stated as approved.
- Delivery channel scope (`NCA-D014`): only in-app has anything real to build on; every other channel is either fully absent or narrowly certificate-scoped.
- Persistence/migration sufficiency (`NCA-D015`): existing schema supports NCA-1's full scope with zero migration.
- Store/Arcade/CivicSure disposition mechanism (`NCA-D012`, the "how," not the "when"): adapt to the canonical shared component — removing without replacing is a regression, keeping local perpetuates known-fake UI.

## 19. Owner-Approval Decisions

Genuinely requiring a human owner's judgment, not derivable from the repository alone:

| ID | Question | Recommended Choice | Short Reason |
|---|---|---|---|
| NCA-D001 | Fix the P0 transactional-coupling risk before NCA-1 proceeds, or accept it? | Fix it | It's cheap now and about to be relied on by more domains; the tradeoff (consistency vs. isolation) is real enough that silently choosing "accept" without sign-off would be presumptuous |
| NCA-D002 | Should NCA or each domain's own program add event emission for DGAL/Accessibility/Onboarding? | Each domain's own program | Authority/ownership boundary — NCA should project events, not modify other programs' domain services |
| NCA-D005 | Should non-active-org notifications get an aggregate cross-org signal? | Yes, aggregate badge, never silent suppression | Real, demonstrated risk of a missed required action; but the exact UX tradeoff (how much cross-org noise to surface) is a product call |
| NCA-D006 | Does transactional email belong in the first release? | No — in-app first | No preference system exists yet to support opt-out; shipping broad email before that is a real risk, but this is a product/timeline call, not purely technical |
| NCA-D007 | Which specific event types are legally/operationally MANDATORY_OPERATIONAL (never suppressible)? | None exist yet — decide per-policy as each is added | This is a compliance judgment NCA-0 explicitly declined to make on the owner's behalf |
| NCA-D010 | What is the actual retention window, and does anything require longer/compliance-driven retention? | Hybrid: fixed default + domain overrides where required | No legal/retention requirement is derivable from the repository |
| NCA-D013 | Should the BOS frontend fabric and Agent Fabric Python classification service be wired together, or intentionally remain separate? | Confirm intended relationship; if uncertain, keep both domain-local with canonical projection for human-actionable output | This is a cross-program authority question (who owns the "Notification/Alert" canonical layer's two halves), not something NCA can resolve unilaterally |

**Only NCA-D001 and NCA-D002 block NCA-1 from starting.** The rest gate NCA-2 through NCA-5 and can be decided in parallel with NCA-1 execution.

## 20. NCA-1 Entry Conditions

Before **NCA-1 — Canonical Notification Contracts, Consolidation & Policy** begins, the following must be locked:

**Must be approved (blocking):**
1. `NCA-D001` — P0 transactional-coupling disposition (recommend: fix)
2. `NCA-D002` — event-emission ownership for DGAL/Accessibility/Onboarding (recommend: each domain's own program)

**Already locked by architecture evidence (no further sign-off needed to start):**
- Canonical infrastructure identity (`integration_outbox` + `notifications`)
- No migration required to begin
- Recipient-resolution pattern, dedupe/idempotency model (reuse as-is)
- Attention-projection contract shape (filtered `actionRequired` view of `notifications`, feeding existing `SeaAttention`)
- Channel eligibility for NCA-1 (in-app only)
- EXR shell-interface contract (§16) — no shell dependency exists for NCA-1's actual scope

**Explicitly deferred out of NCA-1** (per the assignment's own scoping): universal multi-shell UI rollout (`NCA-D004`/`NCA-D012`, → NCA-3), transactional email (`NCA-D006`, → NCA-4), preferences/mandatory-optional policy specifics (`NCA-D007`, → NCA-2), retention specifics (`NCA-D010`, → NCA-2), BOS/Agent Fabric wiring (`NCA-D013`, → NCA-5), digest/quiet hours (`NCA-D008`/`NCA-D009`, → NCA-5/unscheduled).

NCA-1 itself should build: the canonical event→notification contract (formalizing what `EVENT_POLICIES` already does, additively — no breaking change), consolidation documentation for the disconnected surfaces identified in NCA-0 (not their removal — that's NCA-3), recipient-semantics hardening (entitlement check addition), org-scoping confirmation, dedupe/idempotency reuse, read/action-state contract definition (additive, no migration required yet), channel-eligibility field definition (values reserved, only `IN_APP` populated), the attention-projection contract, and the EXR shell-interface contract as constraints (not UI). **No major new UI should be built in NCA-1** unless directly required to prove the contract (e.g., a thin verification, not a rollout) — consistent with the assignment's instruction.

## 21. Git State

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`
- Branch: `claude/notifications`
- HEAD: `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged; no commit made)
- Migration head: `142` (unchanged; no migration created)
- No commit, no push, no merge performed in this phase
- Files created this phase: `docs/architecture/NCA_OWNER_DECISION_LOCK.md` (this file)
- Files modified this phase: none
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified

## 22. Exact Next Step

Obtain explicit owner sign-off on `NCA-D001` and `NCA-D002` (the only two decisions that actually block NCA-1). All other decisions in §19 may be worked in parallel with NCA-1 execution and only need to be resolved before their respective later phase begins. **NCA-1 — Canonical Notification Contracts, Consolidation & Policy** is not started in this run.
