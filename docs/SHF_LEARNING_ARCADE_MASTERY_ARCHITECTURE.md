# SHF Learning Arcade + Mastery Architecture

Updated 2026-08-31 for SHF Ecosystem Phase 8.

## Scope

Phase 8 builds the canonical Learning Arcade Activity → Attempt → Result →
Mastery pipeline, integrates verified mastery into Journey Milestones and
the Phase 6.1 Celebration Layer at Tier 1, and resolves the "Community"
domain question by classification rather than new construction. It does
**not** touch, redesign, or extend the existing decorative "Classic
Arcade" mini-games hub, its reward-economy/wallet/Polygon layer, or the
Curriculum lesson flow's structure.

## Pre-Implementation Audit — the honest starting point

Before writing any code, the full repository was searched for every term
in the phase brief. The findings materially shaped what was — and was
not — built this phase:

- **No backend Arcade domain existed at all** — no migration, no table, no
  service, no route, confirmed by exhaustive search of
  `apps/shs-api/src/domain/**` and `apps/shs-api/migrations/*.sql`.
- **The existing "Classic Arcade" ecosystem is decorative, not
  instructional truth.** `src/pages/arcade/**` (Dashboard, Library,
  Tournaments, Leaderboard, Rewards, ClassicalArcadeRoom, History) is a
  real, substantial UI, but `src/data/arcade.js`'s ~10 "games" (Grid
  Runner, Debt Hunter, Career Rush, Resume Quest, etc.) are catalog
  metadata only — `src/pages/arcade/games/` contains no actual game
  implementation (no canvas/game-loop/engine code anywhere in the
  repository), and `ArcadeRoutes.jsx` has no per-game route at all.
  `Tournament.jsx` is a literal `(Placeholder)`.
- **The existing score/reward layer is 100% browser-local and already
  violates every anti-pattern this phase forbids building new.**
  `src/shared/arcade/useArcadeLedger.js` computes XP/tokens/"skill
  impact" and calls `src/utils/creditLedger.js`
  (`localStorage.getItem("shf.credit.ledger.v1")`) plus an optional
  Polygon "on-chain" transaction stub. This is pre-existing legacy code,
  explicitly **not reused, not extended, and not wired to any new
  canonical truth** by this phase.
- **The Curriculum lesson flow's own "Learning Arcade" step is
  metadata-only.** `ArcadeMissionCard.jsx`'s own header comment already
  states the honest truth: a lesson's `games[]` JSON carries a `route`
  that "does not resolve anywhere in the real Arcade app," and "No
  Attempt or Result is created here." The lesson flow's "Practice" step
  literally renders "Practice activities for this lesson will appear here
  once available" — an honest, pre-existing empty state, not something
  this phase invented.
- **No real interactive practice/quiz/simulation mechanic exists
  anywhere** in the frontend that could generate a genuine, checkable
  outcome (confirmed by a broad search for canvas/game-loop/engine code
  across the entire `src/` tree).

**Consequence for this phase's scope:** there is no existing gameplay to
attach canonical Result truth to, and building actual instructional
games is explicitly out of scope ("no broad Arcade redesign," phase
brief §66). This phase therefore builds the **complete, correct,
independently-tested backend pipeline** — proven end-to-end via real HTTP
requests exercising real validation logic — without wiring any existing
decorative catalog page to it. See "What Is Deliberately Not Done" below.

## Domain Boundary

```
Activity   = definition of an instructional game/simulation/challenge (global reference data)
Attempt    = one learner execution of an Activity
Result     = the canonical, immutable outcome of that Attempt
Mastery    = a boolean, computed once server-side at Result-creation time
             from the Activity's own stored policy — never a second stored
             state, never a client-supplied flag
```

`Activity != Attempt != Result != Mastery`, exactly as required. Mastery
is **persisted on the Result** (not re-derived at every read) for the
same non-retroactivity reason `learner_credentials.expires_at` is copied
at issuance time (migration 051): a later change to an Activity's
threshold must never rewrite history.

## Schema (`052_arcade_activities.sql`)

- `arcade_activities` — global reference data (mirrors
  `careers`/`credential_definitions`, migrations 033/051): slug, title,
  `activity_type` (RETRIEVAL/TROUBLESHOOTING/SIMULATION/SCENARIO/
  SYSTEMS_THINKING/CHALLENGE), optional free-text `lesson_id` (no FK — a
  `lessons` table does not exist; matches `assignments.lesson_id`'s
  established convention, migration 039), `mastery_rule`
  (PASSED_FLAG/SCORE_THRESHOLD), optional `max_score`/
  `pass_threshold_score` (DB `CHECK` enforces exactly the fields each rule
  requires), status.
- `arcade_attempts` — org-scoped, learner-scoped, STARTED/COMPLETED/
  ABANDONED.
- `arcade_results` — `UNIQUE(arcade_attempt_id)` (one Attempt produces at
  most one final Result — a retry is a new Attempt, not a revision),
  `passed`/`score`/`max_score`, and the immutable, server-derived
  `mastery_achieved` boolean.

No historical migration was edited.

## Score/Mastery Validation — what the server can and cannot prove

The client never supplies a "mastered" boolean; it supplies only a raw
`passed` flag or a bounds-checked `score`. `deriveMastery()`
(`arcade/model/arcade.ts`) is the sole authority translating that into
mastery, reading only the Activity's own server-stored policy. Verified
by test: a request that smuggles `{ score: 2, mastered: true, passed:
true }` alongside a genuinely failing score still returns
`masteryAchieved: false` — the forged fields are simply never read.

**Honest limitation, stated plainly rather than hidden:** because no
server-side game execution exists (by design — that would be "broad
Arcade redesign"), the `score` number itself still originates from
whatever client submits it. The server validates *structure* (bounds,
integer, activity/attempt ownership) and *always* derives mastery from
its own policy rather than trusting a client-asserted outcome — but it
cannot independently re-simulate a game to verify the number is
truthful. This is an inherent characteristic of any client-executed
activity without server-side replay, not something this phase claims to
have solved.

## Curriculum / Objective Linkage

`lesson_id` is a real, nullable, free-text column — an Activity *can* be
linked to a real lesson slug. No canonical Learning Objective/skill
taxonomy exists anywhere in the repository, so no second taxonomy was
invented; objective-level mastery attribution is documented here as
deferred, not built speculatively.

## Journey Milestone Integration

`ARCADE_MASTERY` requires a stored `arcade_results.mastery_achieved=true`
row (`journey-milestone-service.ts`'s `arcadeMasteryMilestones()`) —
never a mere Attempt, a launch, or a failing score. The first mastery of
a given Activity is the milestone (`DISTINCT ON` in
`ArcadeRepo.listMasteredActivitiesForLearner`); repeated re-mastery of
the same Activity never produces a duplicate.

## Celebration Integration (Tier 1, never Tier 3)

`arcade.mastered` is `CELEBRATION_TIER.ACKNOWLEDGEMENT` (Tier 1) in
`celebrationPolicy.js`, reusing the existing `COMPANION_EVENTS
.LESSON_COMPLETED` reaction — no new Companion mechanism. Explicitly
excluded from ever celebrating (both structurally, since no policy entry
exists for them, and named for documentation): `arcade.activity_launched`,
`arcade.attempt_started`, `arcade.attempt_abandoned`,
`arcade.result_below_threshold`. Tier 3 remains reserved for Capstone/
Credential, per the phase brief's own instruction not to inflate routine
Arcade achievement to institutional-milestone significance.

## Calendar Projection — deliberately not built this phase

No Arcade Calendar projection exists. Two independent reasons converged
on this decision:

1. **No legitimate scheduled Arcade concept exists to project.** No
   Activity has a due date, no scheduled challenge/tournament data exists
   anywhere real (`Tournament.jsx` is a placeholder), and Section 17 of
   the phase brief explicitly forbids projecting "every playable game" or
   an activity's `created_at`.
2. **If an institution ever wants to assign an Activity with a due date,
   the existing Assignment domain (already real, already Calendar-
   integrated, already tested) is the correct owner** — per the phase
   brief's own §40/§41 guidance to reuse Assignment for due dates rather
   than building a second, competing Arcade deadline concept that risks
   duplicate Calendar events for the same due date.

This is an honest "empty by design" outcome, not an oversight.

## Community Domain Decision

**No new Community domain, table, or route was created.** Every real,
product-evidenced "community" concept found in the repository —
workshops, site visits, mentoring sessions, networking — is already the
canonical Career Event domain's own `WORKSHOP`/`SITE_VISIT`/
`MENTOR_SESSION`/`NETWORKING` `event_type` (built Phase 4, migration
046). `src/pages/civic/CommunityImpact.jsx` is an unrelated page from a
different product vertical (civic missions/proposals), not a Learning
Arcade/SHF-learner "Community" concept. No genuinely distinct Community
activity — with its own participants, attendance, or completion truth
not already owned by Career Events or Projects — was found anywhere.

Building a parallel Community Event domain here would have duplicated
existing, already-tested, already-Calendar-integrated canonical truth —
exactly what the phase brief's §20/§42/§43/§44 explicitly forbid. Instead,
`tests/community-classification.test.ts` proves the reuse decision
directly: a WORKSHOP/SITE_VISIT/MENTOR_SESSION-typed Career Event already
gets full audience-scope entitlement, direct-ID protection, a single
stable Calendar projection, an honest DRAFT-hidden state, and a
completion boundary that is never inferred from date passage — with zero
new code required to prove it.

## Evidence / Truth Relationship

No integration with Prepare/Prove or Trusted Reporting was built — as
with Phase 7's Credentials, no existing tie-in point was found, and none
was fabricated. Calendar and Journey remain read-only projections; they
never write institutional Arcade truth.

## Security / Entitlement Summary

- `arcade.activity.manage` (org_admin/program_manager/super_admin) —
  define Activities. Students and instructors cannot.
- `arcade.attempt` (student) — start Attempts, submit/read one's own
  Results. Never another learner's; a probing request against another
  learner's or another org's Attempt returns 404 (Attempt-not-found),
  never 403, so existence is never confirmed to an unentitled caller.
- `arcade.results.view` (org_admin/program_manager) — organization-wide
  results reporting. Deliberately never granted alongside
  `arcade.attempt` to the same role (mirrors the pre-existing
  `PROJECT_SUBMISSION_WRITE`/`PROJECT_SUBMISSION_VIEW` split) — `GET
  /arcade/results` uses a small local OR-permission gate
  (`requireAnyPermission`) rather than a change to the shared permission
  guard, since the two legitimate caller groups hold disjoint
  permissions.
- Instructors hold no Arcade permission at all — no existing
  reviewer/staff relationship for Arcade was evidenced, matching the
  identical, already-documented Project/Credential precedent.

## Ethical Motivation / Anti-Addiction Verification

No points economy, coins, streaks, loot boxes, random rewards, or social
leaderboard were added. The pre-existing legacy `Rewards.jsx`/
`Leaderboard.jsx`/`useArcadeLedger.js` (XP, tokens, wallet, on-chain
transactions) were **not touched, not extended, and not wired to any new
canonical data** — they remain exactly what they were: decorative,
browser-local, out of scope. The one new celebration entry
(`arcade.mastered`) rewards a verified deterministic mastery outcome
only, at the lowest tier, with no repeat-triggering on re-attempt of an
already-mastered Activity beyond the single first-mastery Journey
milestone.

## What Is Deliberately Not Done This Phase

- No real instructional game/simulation was built (would be "broad
  Arcade redesign," explicitly out of scope).
- No existing Classic Arcade page was wired to the new API — none of
  them can produce a genuine Result, so none were made to pretend to.
- No Arcade Calendar projection (see above — nothing legitimate exists to
  project; reuse Assignment when a real due date is needed).
- No Learning Objective/skill taxonomy.
- No new Community domain.
- No points/coins/streaks/leaderboard/reward economy of any kind.
