# SHF Learning Companion Intelligence (Phase 11)

Backend: `apps/shs-api/src/domain/companion/`
Route: `GET /companion/context/me`
Frontend: `src/lib/companion/api.js` → `src/companion/CompanionProvider.jsx` (fetch) →
`src/components/companion/Brainiact.jsx` / `CompanionBubble.jsx` (render)

## 1. Purpose and non-authority principle

The Learning Companion ("Brainiact") is an interpretation and support layer, never a truth
source. It reads already-canonical, already-entitled facts from four existing services —
Calendar Intelligence, Journey Milestones, Career Pathway, and Credentials — and derives a
bounded context plus a deterministic guidance list. It never issues credentials, marks
completion, approves projects, creates attendance or mastery, changes deadlines, moves events,
enrolls students, submits assignments, or makes any institutional decision. A Companion message
is not an institutional fact; a Companion recommendation is not an institutional requirement; a
Companion celebration is not itself a canonical achievement — it only announces one that a
different, existing layer (the Celebration Layer, Phase 6.1) already verified.

## 2. Pre-existing architecture (audited, not rebuilt)

Phase 11 found a mature, working Companion runtime already in place and built on top of it
rather than replacing it:

- `src/companion/companionReducer.js` — a pure state machine with exactly the six canonical
  modes (`IDLE`, `HINT`, `CHARADES`, `COACH`, `CAREER`, `CELEBRATION`) plus a pre-existing
  accessibility `FOCUS` mode.
- `src/companion/CompanionProvider.jsx` — the one runtime, mounted once for both Curriculum and
  Career via `RootProviders.jsx`, listening on one wire event (`companion:event`).
- `src/companion/companionEvents.js` / `celebrationRegistry.js` — a real, audited celebration/
  reaction registry already gated on verified achievement statuses.
- `src/experience/celebrations/CelebrationProvider.jsx` / `celebrationPolicy.js` — the real Phase
  6.1 Celebration Layer, with its own dedup (`createCelebrationDeduper`, localStorage-persisted)
  and the single legitimate achievement source, `achievementFromJourneyMilestone()`. It already
  calls `emitCompanionEvent()` on a verified achievement — Companion already correctly consumes
  this rather than deciding achievement itself.
- `src/companion/visualHintEngine.js` — a real, working progressive Hint Mode (gesture → visual →
  verbal → explanation) with accessibility alternatives for every visual clue, never skipping
  ahead, over a small proof-of-concept concept registry (4 concepts: gravity, photosynthesis,
  coding loops, communication).
- `src/components/CoachSlideOver.jsx` / `src/components/AIChat.jsx` — the long-form "Ask Coach"
  chat panel. Audited and found to be a **non-functional placeholder**: it calls no backend, no
  LLM, and no API of any kind — it echoes the user's own message back with the literal text
  "Placeholder reply. In production, call your backend / OpenAI here." This is pre-existing,
  unrelated to Phase 11's scope, and was left untouched (Phase 11 explicitly does not add an LLM
  tutor).

What did **not** exist before Phase 11: any backend Companion service, any Companion Context
aggregation, and any Calendar/Pathway/Journey/Credential-aware guidance. That gap is this phase's
actual deliverable.

## 3. Companion Context Service

`apps/shs-api/src/domain/companion/service/companion-context-service.ts` calls four already-
canonical, already-entitled services exactly once each, via `Promise.allSettled`:

1. `getCalendarProjectionForActor()` + `computeCalendarIntelligence()` (Phase 9/10, unchanged)
2. `listJourneyMilestonesForLearner()` (Phase 6/7, unchanged)
3. `deriveLearnerPathway()` (Phase 5, unchanged)
4. `credentialService.listCredentialsForActor()` (Phase 7, unchanged)

This mirrors the same sibling-projection pattern Journey Milestones and Calendar Projection
already both independently use over the same canonical repos — not a new architectural pattern.
Companion Context re-implements no entitlement and recomputes no source-domain logic; it is a
read-only, stateless, on-demand aggregation, exactly as the phase brief requires. It never
persists anything and introduces no migration.

## 4. Context DTO

```
{
  pathway:     { careerIds, careerFamilyIds } | null,
  calendar:    { weeklyLoadCategory, scheduledEventCount, requiredDeadlineCount,
                 conflictCount, deadlineConcentrationCount } | null,
  credentials: { issuedCount, upcomingRenewalCount } | null,
  journey:     { milestoneCount, completedCount } | null,
  guidance:    CompanionGuidance[],
  sourceAvailability: { partial, unavailableSources },
  generatedAt
}
```

Only the fields the Companion UI actually consumes are exposed — not the full payload any single
source domain would return. `credentials`/`journey` are deliberately reduced to counts; the
Companion has no need for full definitions, verification ids, or evidence payloads.

## 5. Guidance policy

`GUIDANCE_PRIORITY` (`model/companion-context.ts`) encodes a subset of the phase brief's 8-rank
priority scale — only the ranks this phase's guidance types use:

| Rank | Type | Source |
|---|---|---|
| 1 | (reserved: hard schedule conflict) | Calendar Intelligence `CONFLICT` recommendation, when present |
| 2 | Immediate required deadline / deadline concentration | Calendar Intelligence `DEADLINE_SOON` / `DEADLINE_CONCENTRATION` |
| 4 | Credential renewal | Calendar Intelligence `CREDENTIAL_RENEWAL_SOON` |
| 6 | Pathway-relevant opportunity | New this phase — see §6 |

Guidance for ranks 1/2/4 is a **re-labeling pass only** — `guidanceFromCalendarRecommendations()`
maps each of Calendar Intelligence's own deterministic recommendations (Phase 10, unchanged) into
a `CompanionGuidance` descriptor. Companion never recomputes a conflict, a deadline, or a
concentration cluster itself. Every descriptor carries `reasonCode`, `relatedSourceIds` (always
real, already-entitled Calendar event ids), `action` (label + navigate-only URL), `priority`, and
`dismissible` — fully explainable and traceable to the exact source fact that caused it.

## 6. Pathway-aware guidance (new this phase)

`pathwayRelevantGuidance()` scans the same already-fetched Calendar projection for
`OPPORTUNITY_DEADLINE`/`CAREER_EVENT` items whose `pathwayRelevant` flag (Phase 5, carried by the
Calendar Projection Service since Phase 9) is `true`, and surfaces at most one as a `career`-mode
guidance item — a highlight, never an elevation above a real conflict or required deadline
(rank 6, below all four calendar-derived ranks). This never claims eligibility, entitlement, or
selection odds: the underlying Opportunity/Career Event was already entitled and visible to the
learner before this guidance item exists — pathway relevance only decides ordering, never access.

## 7. Source availability and partial-data safety

If any of the four aggregated sources fails, it's added to `sourceAvailability.unavailableSources`
and the corresponding context field is `null` — never a fabricated zero/empty value presented as
complete. If Calendar Intelligence's own projection is itself partial (one of its six source
domains down), that is folded into Companion's own `unavailableSources` as `calendar:<domain>`
rather than silently absorbed. Only if **all four** sources fail does the endpoint hard-fail
(`503 COMPANION_CONTEXT_UNAVAILABLE`) rather than return a fabricated all-clear context — mirroring
`CalendarHardFailureError`'s own contract exactly.

## 8. Security

`GET /companion/context/me` is gated by `requirePermission("enrollment.view")`, matching
`/calendar/events/me`, `/journey/milestones/me`, and `/careers/pathway/me`. No
`learnerId`/`userId`/`actorId` query parameter is ever read for identity — verified live: a
spoofed request produces identical guidance to the plain one. Cross-org and unentitled actors
receive an honest, empty context (verified live). No private evidence, internal notes, or another
learner's data is exposed — every field traces back to data that endpoint's own actor was already
entitled to see through the four source endpoints directly.

## 9. Career Mode

Career Mode consumes `pathway` (derived Career ids) and the one `PATHWAY_RELEVANT_OPPORTUNITY`
guidance item when present. It never fabricates career fit, qualification ("you are qualified for
this job"), or outcome ("you will get this job") — no such logic exists anywhere in this codebase,
so none was invented. Pathway relevance is presented only as relevance, never suitability or
entitlement.

## 10. Hint Mode / Charades Mode

Unchanged this phase. Hint Mode's existing safety properties (progressive levels, never skip to
explanation, accessibility alternatives for every visual clue, no answer-submission capability)
are preserved exactly as audited in §2. Charades Mode is the same visual/gesture clue mechanism
Hint Mode already implements (the phase brief's own distinction between the two modes maps to
Hint's `gesture`/`visual` levels in the existing engine) — no new animation engine was built, per
the brief's own guidance not to build one if not already supported.

## 11. Coach Mode

The new guidance panel (`CompanionBubble.jsx`'s `GuidancePanel`) is Coach Mode's new content: it
distinguishes fact from suggestion in its own message text (e.g. "'Quiz 2' is due in 2 days" —
fact — vs. "Consider prioritizing these first" — suggestion, in the action label), exactly
mirroring Calendar Intelligence's own language discipline (Phase 10). The long-form "Ask Coach"
chat panel is unchanged (see §2's placeholder-chat finding).

## 12. Celebration Mode

Untouched. Companion still only reacts to `emitCompanionEvent()` calls the Celebration Layer
itself makes from a verified achievement descriptor — no second achievement-detection path, no
second dedup, no new call site was added anywhere in Companion Context or Guidance.

## 13. Assessment safety

Companion Context and the new Guidance Policy never read or return lesson, quiz, or assessment
content of any kind — they operate exclusively over Calendar/Pathway/Journey/Credential data. This
introduces **no new answer-leakage surface**: there was nothing lesson-related to leak in the first
place. The pre-existing Hint Mode (the only Companion capability that touches instructional
content) is unchanged and keeps its own independent safety design (§10). No page-state signal
distinguishing "practice" from "assessment" was found anywhere in the codebase during the audit —
this is a pre-existing gap, unrelated to and not blocking Phase 11, since nothing this phase built
ever needs that distinction.

## 14. Privacy

The Companion Context response contains only the learner's own already-entitled facts, reduced to
counts and ids — no admin metadata, no other learner's schedule or credentials, no internal notes.

## 15. Responsive safe-zone

The persistent, always-visible collapsed Companion icon (`.brainiact-fab`) was verified live at
1440px, 1024px, 768px, and the narrowest width the available browser-automation tooling could
reach (~606px CSS width — true 390px/360px could not be forced in this environment; see
`docs/SHF_CALENDAR_INTELLIGENCE.md`'s Phase 10.1 note on the same tooling limitation) to never
overlap the Calendar's Weekly Load cards or Plan My Week button, confirming the Phase 10.1 fix
holds under Phase 11's additional guidance content. The **expanded** interactive bubble (opened
by explicit user click) can temporarily overlap page content behind it at narrow widths — the
same category of behavior as any dropdown or popover in this application, fully dismissible via
its own close button, Escape, or an outside click (all pre-existing, verified working). This was
judged not to warrant a redesign-level docking/safe-zone change under the phase's own "no
redesign" constraint, and is documented here rather than silently accepted.

## 16. Accessibility

Unchanged pre-existing properties preserved: dynamic `aria-label` reflecting mode + message,
Escape/outside-click close, no focus trap, reduced-motion respected live (`prefers-reduced-motion`
+ a user toggle), Hide/reveal always available. The new guidance panel adds a `role="status"`
region with plain-text message and action — no color-only meaning, no new motion, no focus theft
on load (the guidance panel never auto-opens the bubble; it only renders inside a bubble the user
already opened).

## 17. Ethical engagement

No streak pressure, daily-login rewards, countdown scarcity, random rewards, loss aversion, or
notification nags were added. Guidance is capped to what the four source services themselves
produce (no artificial padding), sorted deterministically, and shown one bubble-open at a time —
never a flood of simultaneous popups.

## 17b. Phase 12 note: no external-availability guidance

Phase 12 did not add Google/Microsoft OAuth or free/busy ingestion (see
`docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`), so Companion Context has no external-busy signal to
consume. Companion's guidance remains exactly as described in §5-6 above — Calendar Intelligence
recommendations plus pathway-relevant highlights, unchanged.

## 18. Non-goals (explicit scope boundary)

No external calendar sync, no notification system (email/SMS), no autonomous task execution, no
automated Opportunity application, no credential issuance/assignment submission/project approval/
grading from Companion, no full LLM tutor, no hidden psychological profiling, no long-term
Companion memory system, no new points/streaks economy, no `BACK_TO_BACK` conflict guidance (not
implemented by Calendar Intelligence itself — see `docs/SHF_CALENDAR_INTELLIGENCE.md`).

## 19. Phase 12 boundary

Companion Context's `guidance` array is structured and stable enough for a future phase to add new
`reasonCode`s (at unused priority ranks 3/5/7/8) without touching the aggregation or dedup logic.
Any future phase that wants Companion to read a new source domain should add one more
`Promise.allSettled` entry to `companion-context-service.ts` and one new field to the DTO — it
should never need to change the partial-data-safety or guidance-sorting logic, which are
source-agnostic by design.

## 20. Phase 11.5 boundary (resolved)

Unaffected by Phase 11.5's frontend Calendar surface unification: Companion Context is a single
backend endpoint (`GET /companion/context/me`) already consumed identically by every SHF surface
that renders Brainiact, regardless of which Calendar page is open. Migrating Career Calendar onto
the canonical Projection Service did not touch this service and did not require a second Companion
context computation anywhere. See `docs/SHF_CALENDAR_SURFACE_UNIFICATION.md`.

## 21. Phase 12.2 boundary (resolved) — external busy guidance

`getCompanionContextForActor()` now also fetches a bounded 14-day external availability window
(`external-availability-service.ts`) alongside its existing four sources, isolated the same way
(a total failure never breaks Companion Context — caught and treated as an empty/incomplete
result) and fed into `computeCalendarIntelligence()`'s new fourth parameter. This fills guidance
priority rank 3 — one of the ranks this document's own §16/§19 boundary notes explicitly reserved
for exactly this kind of future addition, so no existing guidance type was renumbered.

The resulting `EXTERNAL_BUSY_CONFLICT` guidance item is deliberately generic: it names only the
real SHF event ("your Live Session overlaps a busy period on your connected calendar"), never the
external event's own title or any inferred cause — `FreeBusyInterval` (the type this guidance is
built from) carries no title field at all, so there is nothing private to leak even by accident.
Disconnecting a provider removes this guidance from the very next context fetch (the connection
simply stops appearing in `listConnectionsForActor()`) without affecting any other guidance type.
See `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §13 for the full Phase 12.2 accounting.
