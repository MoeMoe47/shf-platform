# SHF Celebration & Milestone Layer

## Purpose

Phase 6.1 adds restrained celebration presentation for verified learner achievements. It is a student-experience layer only: it does not create completion, evidence, credentials, points, streaks, or institutional truth.

## Ethical Motivation & Progression Principles

Celebrations acknowledge meaningful verified progress. They must not reward page views, clicks, screen time, hovering, retries, Calendar opens, date passage, or unverified browser state.

No reward economy, chance mechanics, scarcity prompts, streak preservation, push notifications, or social leaderboard behavior is introduced.

## Authoritative Triggers

Current eligible producers:

- Curriculum lesson completion after the backend completion API synchronizes successfully.
- Project approval/acceptance as projected by Journey Milestones from `project_submissions.status = 'ACCEPTED'`.
- Capstone approval/acceptance as the same Project truth where `projects.project_type = 'CAPSTONE'`.
- Career Event completion where the backend Journey projection reports a real `COMPLETED` Career Event.
- **(Phase 7) Credential issuance** as projected by Journey Milestones from `learner_credentials.status = 'ISSUED'` — see `docs/SHF_CREDENTIAL_ARCHITECTURE.md`.
- **(Phase 8) Arcade mastery** as projected by Journey Milestones from a stored `arcade_results.mastery_achieved = true` row — see `docs/SHF_LEARNING_ARCADE_MASTERY_ARCHITECTURE.md`. Mastery is always server-derived from the Activity's own policy at Result-creation time; the client never supplies a "mastered" flag.

Current excluded producers:

- Program start milestones, because they are start facts and can be date-derived.
- Assignment deadlines, Project due dates, Capstone due dates, and Calendar clicks.
- Portfolio completion and Assessment pass, because no canonical Phase 6.1-safe backend achievement producer is available for automatic celebration in this implementation.
- **(Phase 7) Credential eligibility, exam registration, evidence submission, expiration, and revocation** — only actual canonical issuance celebrates. These five are explicitly named in `celebrationPolicy.js`'s `NO_CELEBRATION_EVENT_TYPES` and covered by dedicated tests, even though no current code path calls `evaluateCelebration()` with any of them — the exclusion is a tested invariant, not an accident of missing wiring.
- **(Phase 8) Arcade activity launch, Attempt start/abandon, and a below-threshold Result** — only a stored mastery-qualifying Result celebrates. Also named explicitly in `NO_CELEBRATION_EVENT_TYPES` and covered by dedicated tests for the same reason as the Credential exclusions above.

## Celebration Tiers

- `ACKNOWLEDGEMENT`: compact text acknowledgement and subtle host presentation. Used for synchronized lesson completion, completed Career Event milestones, and, as of Phase 8, verified Arcade mastery (`arcade.mastered`) — deliberately kept at the lowest tier; routine individual-Activity mastery is never inflated to Project/Capstone/Credential's `ACHIEVEMENT`/`MAJOR_MILESTONE` tiers.
- `ACHIEVEMENT`: bounded confetti and companion reaction. Used for accepted Projects.
- `MAJOR_MILESTONE`: bounded premium burst and stronger companion reaction. Used for accepted Capstones and, as of Phase 7, canonical Credential issuance (`credential.issued`) — reusing the identical tier and the same `COMPANION_EVENTS.MAJOR_MILESTONE` reaction as Capstone acceptance, not a new Companion event type.

Tiers are selected by the reusable policy in `src/experience/celebrations/celebrationPolicy.js`, not by page location.

## Dedup Identity

Automatic dedup uses:

`sourceDomain + sourceRecordId + achievementType`

The browser stores shown keys in `localStorage` under `shf:celebrations:shown:v1`. This is explicitly non-canonical presentation state. Storage failure falls back to in-memory dedup for the current runtime.

## Calendar Boundary

Calendar remains read-only orchestration. Calendar events, clicks, opening the Calendar, and current date comparisons do not trigger success. Calendar does not write celebration state, Project completion, or evidence.

## Journey Boundary

Journey Milestones may feed celebration presentation only when a completed status is already projected from an owning canonical domain. Journey display does not become truth, and `PROGRAM_START` is not celebrated automatically.

## Companion Integration

The celebration provider emits existing Brainiact companion events through `emitCompanionEvent`. It does not rebuild the companion, add coaching intelligence, or require the companion to be visible. Missing or disabled companion behavior does not block the text acknowledgement.

**Phase 11 update:** the Companion's new Context/Guidance surface (`docs/SHF_LEARNING_COMPANION_INTELLIGENCE.md`) reads Journey Milestones, Calendar Intelligence, Career Pathway, and Credentials for its own *guidance* (deadlines, conflicts, pathway relevance) — it is a fully separate concern from Celebration and does not read this layer's achievement descriptors or its dedup state. Celebration remains the only path from a verified achievement to a Companion reaction; Phase 11 added no second achievement-detection or dedup mechanism.

## Accessibility

The host uses `role="status"`, `aria-live="polite"`, and text content for every celebration. Effects are `aria-hidden` and pointer-events do not block page interaction. The dismiss control is keyboard reachable and does not trap focus.

## Reduced Motion

The provider respects `prefers-reduced-motion`, the existing curriculum accessibility preference (`curriculum:a11yPrefs:v1.reducedMotion`), and the existing companion reduced-animation preference. Reduced motion downgrades confetti/fireworks-style effects to text/subtle acknowledgement.

The existing Curriculum accessibility preferences also include `celebrationIntensity` with `FULL`, `SUBTLE`, and `OFF`. This setting changes presentation only and never writes progress, completion, evidence, or achievement truth.

## Persistence Behavior

Only non-canonical "already shown" presentation acknowledgement and the existing accessibility preference are persisted locally. There is no backend celebration write API and no institutional celebration table.

## Security / Trust Boundary

The client policy accepts only descriptors created from successful canonical API responses or backend Journey projection records. There is no trusted backend route that accepts arbitrary `achievementType`, `projectId`, or `status=completed` values from the browser.

## Performance

Effects are CSS-only, bounded, and rendered only while a celebration is active. Timers are cleaned up on unmount. No animation dependency was added; `framer-motion` was already installed but not required for this bounded layer.

## Non-Goals

- Portfolio backend domain
- Arcade reward economy (points/coins/XP/wallet/on-chain — the pre-existing legacy `useArcadeLedger.js`/`creditLedger.js` remain untouched, browser-local, and out of scope)
- a distinct Community domain (Phase 8 audit found every real community concept already owned by Career Events)
- Calendar Projection Service
- Plan My Week
- conflict detection
- pathway scheduling intelligence
- Learning Companion intelligence
- external calendars
- push notifications
- streaks, points, coins, random rewards, or leaderboards
