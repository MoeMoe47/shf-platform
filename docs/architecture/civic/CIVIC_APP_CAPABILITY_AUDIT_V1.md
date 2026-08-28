# Civic App — Capability Audit V1

Audit date: 2026-08-24. Repo: `/Users/mikeslate/Projects/shrv1`, branch `v1.2-development`.
Scope: the "Civic Lab" sub-app only (`civic.html` → `src/entries/civic.main.jsx` →
`src/router/CivicRoutes.jsx` → `src/layouts/CivicLayout.jsx` → `src/pages/civic/*`).
This is a discovery document. No production code was changed to produce it, other than
the pre-existing, already-in-progress, uncommitted Civic restoration work found already
in the working tree (see "In-flight state" below) — none of it was altered.

## In-flight state (read this first)

Civic is mid-restoration, not a stable baseline. `git status` shows uncommitted changes to
`civic.html`, `src/entries/civic.main.jsx`, `src/layouts/CivicLayout.jsx`,
`src/styles/civic-shell.css`, and six pages (`ConstitutionJournal.jsx`, `Elections.jsx`,
`IssueSurvey.jsx`, `Portfolio.jsx`, `Proposals.jsx`, `TreasurySim.jsx`,
`TreasurySnapshots.jsx`), plus three new untracked Playwright specs
(`tests/ui/civic-route-recovery.spec.mjs`, `civic-mobile-overflow.spec.mjs`,
`civic-journal-header.spec.mjs`). Git history shows Civic was baselined once
(2026-01-05), touched once more (2026-01-23), then sat frozen for ~7 months while
(per file mtimes) content was bulk-replaced out of band without civic-labeled commits —
consistent with `civic.html` having been, until this in-flight work, a static
"smoke test" page with no mounted app (per the route-recovery test's own header comment).
**Treat everything below as "what Civic can do once this in-flight restoration is
complete," not as a long-stable production baseline.**

## Legend

Status values: `WORKING` (real, routed, functional), `PARTIAL` (real logic but a gap —
mismatched data, missing validation, no confirmation, etc.), `SCAFFOLDED` (built and
functional but not reachable via any route), `PLACEHOLDER` (present but intentionally
mocked/stubbed content), `BROKEN` (present but non-functional or would error),
`ARCHIVED` (not applicable here — nothing Civic-specific lives in `src/_archive/`),
`UNKNOWN` (not applicable — everything below was proven from code).

## A. Capability matrix — routed pages (reachable today)

| Capability | Page | Component | Route | Data source | Status | Must preserve? | Notes |
|---|---|---|---|---|---|---|---|
| View KPI strip + static stat cards | Civic Dashboard | `CivicDashboard.jsx` | `/dashboard` | `CivicKpis`, hardcoded numbers | PARTIAL | Yes (shell), No (fake numbers) | "Active Parties" (3), "Open Proposals" (8), "Voter Turnout" (62%) are hardcoded, not derived |
| "View Community Impact" link | Civic Dashboard | `CivicDashboard.jsx` | `/dashboard` → `/impact` | n/a | BROKEN | Investigate | No `/impact` route exists in `CivicRoutes.jsx`; 404s to RouteFallback |
| Switch Dashboard ⇄ Northstar Dashboard | Dashboard header | `DashboardSwitcher.jsx` | `/dashboard`, `/dashboard-ns` | `localStorage["civic:pref:dashboard"]` | WORKING | Yes | Persists preference |
| View points/badges/civic-minutes progress summary | Northstar Dashboard | `DashboardNorthstar.jsx` | `/dashboard-ns` | `useRewards`, `localStorage["shf.civicMissionLogs.v1"]` | WORKING | Yes | Progress bar lacks `role="progressbar"` (a11y gap) |
| Browse micro-lesson list, open a lesson | Assignments | `Assignments.jsx` | `/micro-lessons`, `/assignments` | `src/data/civic/micro-lessons.v1.json` (real dataset) | WORKING | Yes | Link text "Open" repeated per item — mild a11y gap |
| View lesson body, take inline quiz, save notes, open AI Coach, save quiz evidence to Portfolio, go to next lesson | Lesson | `Lesson.jsx` | `/lesson`, `/lesson/:id` | **hardcoded placeholder lesson**, ignores `:id` | PARTIAL | Yes (interaction shell), fix data source | Explicit `// placeholder — wire your data` comment; always shows "Civic Trade-offs 101" regardless of which lesson was opened |
| Open contextual AI Coach drawer (hints, quick-insert prompts, ask flow) | Lesson (global) | `components/civic/CoachDrawer.jsx` | mounted at app root + on `/lesson` | local heuristic, no real backend | PARTIAL | Yes | "Ask" flow is a canned `alert()`, not a real AI call; root-level mount in `civic.main.jsx` renders with no `open` prop wired, so it is inert unless a page (Lesson) supplies its own instance |
| Cast a practice ballot vote (Mayor + Treasurer races) | Elections | `Elections.jsx` | `/elections` | `localStorage["civic:votes"]`, mock `BALLOT` array | WORKING | Yes | Real persistence, KPI bump, points, badge, wallet log |
| View recent practice-vote history | Elections | `Elections.jsx` (`VoteLog`) | `/elections` | `localStorage["civic:votes"]` | WORKING | Yes | Live-synced via storage events + polling |
| Submit a policy proposal (title/rationale/budget impact) | Proposals | `Proposals.jsx` | `/proposals` | `localStorage["civic:proposals"]` | WORKING | Yes | Seeds 2 example proposals on first run |
| Upvote / downvote a proposal, auto pass/reject at ±5 score | Proposals | `Proposals.jsx` | `/proposals` | `localStorage["civic:proposals"]` | WORKING | Yes | Awards pass bonus + badge on threshold cross |
| Delete own proposal, with 7s Undo | Proposals | `Proposals.jsx` | `/proposals` | `localStorage["civic:proposals"]` | WORKING | Yes | Author check is hardcoded to `"local:user"` (comment: `// swap later`) — no real multi-user identity yet |
| Adjust total budget cap + 5 program allocation sliders | Treasury Simulator | `TreasurySim.jsx` | `/treasury-sim` (alias `/treasury`) | in-memory state, mirrored to `localStorage["civic:treasury:state"]` | WORKING | Yes | Comment: `// Demo state — adapt to your real logic` — intentionally simplified fiscal model |
| Save current simulation as a named snapshot | Treasury Simulator / Snapshots | `TreasurySim.jsx`, `TreasurySnapshots.jsx` | `/treasury-sim`, `/snapshots` | `localStorage["civic:treasury:snapshots"]` | WORKING | Yes | |
| Restore / export / import / delete / clear-all Treasury snapshots | Treasury Snapshots | `TreasurySnapshots.jsx` | `/snapshots` | `localStorage["civic:treasury:snapshots"]` | WORKING | Yes | Real file download + file import (`<input type="file">`); delete/clear have 7s Undo |
| "Fix storage" soft-reset for malformed snapshot data | Treasury Snapshots | `TreasurySnapshots.jsx` (`StorageSoftReset`) | `/snapshots` | localStorage | WORKING | Yes | Same pattern reused on Notes, Portfolio, Surveys (dead) |
| View a static simulated public-debt figure | Debt Clock | `DebtClock.jsx` | `/debtclock` | hardcoded `$89,420,000,000` | PLACEHOLDER | Yes (as an explicitly-labeled educational simulation) | Caption implies a live "Source" but the number is static |
| View/copy/download the AI-generated Grant Story narrative | Grant Story | `GrantStory.jsx` | `/grant-story` | `binderMerge.js` → merges Admin AI logs + `shf.civicMissionLogs.v1` | WORKING | **Yes — cross-app dependency** | Consumed by Admin's `MasterNarrativeViewer.jsx`/`ToolDashboard.jsx`; changing the mission-log contract breaks Admin |
| Log a mission (minutes/summary/outcome) to the Grant Story, tagged by funding stream | Elections, Proposals, Treasury Sim, Debt Clock | `MissionLogButtons.jsx` | 4 routes above | `localStorage["shf.civicMissionLogs.v1"]` | WORKING | **Yes — cross-app dependency** | This is the single most load-bearing capability in Civic: Admin's grant-narrative pipeline and multi-app usage stats read this exact key |
| View leaderboard of top mission contributors | Leaderboard | `Leaderboard.jsx` | `/leaderboard` | `localStorage["shf.civicMissionLogs.v1"]` | WORKING | Yes | Read-only table, no sort/filter/pagination; no `scope` attrs on `<th>` |
| Answer a fixed 5-question issue-stance survey with autosave | Issue Survey | `IssueSurvey.jsx` | `/survey` | `localStorage["civic:survey:issues"]` | WORKING | Yes | |
| Live X/Y "political compass" preview while answering survey | Issue Survey | `IssueSurvey.jsx` | `/survey` | derived in-memory | WORKING | Yes | |
| View derived Civic Profile (X/Y compass, confidence, "what moved your profile" feed) | Profile Results | `ProfileResults.jsx` | `/profile` | multiple localStorage keys (votes/proposals/snapshots/attestations/wallet) | **BROKEN (silent)** | Yes (fix first) | `scoreFromSurvey()`'s hardcoded `WEIGHTS` map uses answer-IDs that do not match `IssueSurvey.jsx`'s real question/choice IDs — real survey answers likely never move the score. Self-documented as swappable placeholder scoring |
| Add / edit / delete free-form civic notes with tags, Undo | Notes | `Notes.jsx` | `/notes` | `localStorage["civic:notes"]` | WORKING | Yes | Inputs rely on placeholder text only, not `<label>` (a11y gap) |
| Add / edit / delete portfolio artifacts (doc/link/media/certificate/code), export JSON | Portfolio | `Portfolio.jsx` | `/portfolio` | `localStorage["civic:portfolio:artifacts"]` | WORKING | Yes | Also queues an offline-sync payload via `shared/offline/queue.js` — a real, if partially-invisible, offline-first hook |
| View points/badges, open badge-details modal via deep link (`?badge=`) | Rewards | `Rewards.jsx` | `/rewards` | `RewardsChip`, `AchievementsBar`, `BadgeDetailsModal` | WORKING | Yes | URL query param stays in sync with modal open state |
| View earned badges grouped by category + Grant-Story-Contributor progress | Badges | `Badges.jsx` | `/badges` | `useRewards`, `shf.civicMissionLogs.v1` | WORKING | Yes | Cosmetic bug: stray literal backtick in one status string (line ~196) will render to users |
| Toggle "allow external publish of mission evidence" (default off), set public handle | Settings | `Settings.jsx` | `/settings` | `localStorage["civic:privacy"]` | WORKING | Yes | |
| "Reset local rewards & logs" | Settings | `Settings.jsx` | `/settings` | localStorage | **PARTIAL (unsafe UX)** | Yes (the capability), fix the UX | Destructive, no confirmation dialog, no success feedback of any kind |
| Static help text | Help | `Help.jsx` | `/help` | none | PLACEHOLDER | No real content to preserve | No FAQ, no links, no search — effectively an empty stub |
| Create/edit/delete Constitution Journal entries, autosave | Constitution Journal | `ConstitutionJournal.jsx` | `/journal` | `shared/journal/journalStore.js` → `localStorage["shf.journal.v1"]` | WORKING | Yes | Best-built shared data module in Civic (typed schema, SSR-safe, real error handling) |
| Filter journal by site / funding stream / tag / free-text search | Constitution Journal | `ConstitutionJournal.jsx` | `/journal` | same store | WORKING | Yes | |
| Tag entries with funding stream (Perkins/WIOA/ESSA/Medicaid/IDEA/Workforce/Philanthropy/Civics) | Constitution Journal | `ConstitutionJournal.jsx` | `/journal` | same store | WORKING | **Yes — grant-compliance relevant** | |
| Export journal entries as JSON or Markdown | Constitution Journal | `ConstitutionJournal.jsx` | `/journal` | same store | WORKING | Yes | |
| Delete a journal entry (native `window.confirm()`) | Constitution Journal | `ConstitutionJournal.jsx` | `/journal` | same store | WORKING | Yes | Only page using a native confirm instead of the Undo-toast pattern used everywhere else — an inconsistency, not a defect |

## B. Capability matrix — scaffolded but unrouted (real code, zero users can reach it today)

| Capability | File | Real or stub logic? | Status | Must preserve? | Notes |
|---|---|---|---|---|---|
| List + complete missions from the real lesson dataset, award points/badge/attestation | `Missions.jsx` + `Mission.jsx` | Real | SCAFFOLDED | Evaluate | `Missions.jsx` links to `/mission/:id`, which doesn't exist in the router even if `Missions.jsx` were wired in |
| List + complete 2 hardcoded micro-lessons, award points/badge/attestation | `MicroLessons.jsx` + `MicroLessonDetail.jsx` | Real (completion logic), hardcoded content | SCAFFOLDED | Low — superseded by `Assignments.jsx` | Duplicates completion logic independently rather than sharing it |
| Richer proposals flow: vote-removal Undo, per-vote wallet logging, "Fix storage" reset button | `Proposals.lord-demo.jsx` | Real, superset of routed `Proposals.jsx` | SCAFFOLDED | **Yes — review for promotion** | Strict superset of the live page's robustness; worth folding in during redesign rather than discarding |
| Alternate lesson viewer: real dataset lookup by id, text-to-speech, scroll progress bar, Focus Mode | `CivicLesson.jsx` | Real | SCAFFOLDED | **Yes — review for promotion** | More correctly wired to real content than the routed `Lesson.jsx`, but lacks `Lesson.jsx`'s quiz/notes/coach/portfolio-save integration — these two pages should likely be merged, not one discarded |
| Quadrant-based civic profile, "Suggested Learning Gaps", clipboard summary | `Profile.jsx` | **Broken** — dead import + orphaned JSX statement outside any function after the component closes | BROKEN | No (fix `ProfileResults.jsx` instead) | Would likely throw a build/syntax error if ever imported; treat as abandoned WIP |
| Generic multi-survey catalog engine, free-text answers | `Surveys.jsx` | Real but incomplete (`// TODO: validation / submit pipeline as needed`) | SCAFFOLDED / PARTIAL | Low | Expects a survey catalog seeded into `localStorage["civic:surveys"]` that nothing in the app ever seeds — currently unusable even if routed |
| "Safe restore" fallback placeholder screen | `CivicHome.jsx` | Static | PLACEHOLDER | No | Its own text says it's a rollback/recovery artifact, explicitly temporary |
| Self-contained duplicate AI Coach drawer with fake canned reply | `pages/civic/CoachDrawer.jsx` | Stub (`setTimeout` + hardcoded reply) | BROKEN (unreachable) | No | Confirmed imported nowhere in the repo; superseded by `components/civic/CoachDrawer.jsx` |

## C. Shared data-layer modules — live vs. orphaned

| Module | Backing | Consumers | Status |
|---|---|---|---|
| `shared/civic/completeMission.js` | `localStorage` (`civic:attestations`, `wallet:history`, 2 duplicate KPI keys) | `Mission.jsx` (unrouted) | SCAFFOLDED |
| `shared/journal/journalStore.js` | `localStorage["shf.journal.v1"]` | `ConstitutionJournal.jsx` | WORKING — best-built module in the app |
| `shared/notes/notesStore.js` | `localStorage["civic:lesson:{id}:notes"]` | `components/civic/NotesHighlighter.jsx` | WORKING |
| `shared/quiz/store.js` | `localStorage["civic:quiz:{id}"]` | **none** — `MicroQuiz.jsx` reimplements its own local read/write instead of importing this | ORPHANED |
| `shared/rewards/badges.js` | `localStorage["rewards:badges"]` | **none** | ORPHANED, and internally broken — a second `getBadgeProgress`/`isUnlocked` declaration later in the same file silently shadows the real implementation via hoisting |
| `shared/rewards/catalog.js` + `catalog.civic.js` | static | transitively used by `engine.js`/`shim.js` | civic's badge catalog is a literal `{ badges: [] }` stub — badge *catalog* lookups for civic currently return nothing, even though `award()` history-tracking still works |
| `shared/rewards/shim.js` (+ `engine.js`) | `localStorage["rewards:history"]`, namespaced | `MicroLessons.jsx`, `Proposals.jsx`, `Proposals.lord-demo.jsx`, `MicroLessonDetail.jsx`, `MicroQuiz.jsx`, `LessonBody.jsx` | WORKING — this is the real, live rewards path |
| `shared/review/spacedReview.js` | `localStorage["review:cards"]`, migrates legacy `civic:review:items` | `components/civic/LessonBody.jsx` | WORKING |
| `shared/sync/syncQueue.js` | `fetch` + Cache Storage fallback + Background Sync | **none in civic** — only consumer repo-wide is `pages/hub/PartnerActionQueueV2.jsx` | not part of civic's live dependency graph |
| `shared/storage/guard.js` | `localStorage["shf.guard.v1.*"]` | Portfolio, Proposals, TreasurySnapshots, Proposals.lord-demo, Notes, Surveys | WORKING, but `useStorageGuard` is an explicit placeholder that always reports "ok" — no real quota/private-mode detection exists yet |
| `shared/ledger/schema.js` | none (reference constant only) | **none** | ORPHANED |
| `shared/ns/events.js` | window CustomEvents | **none in civic** | ORPHANED |
| `shared/reading-level/getVariant.js` | static transform | `components/civic/LessonBody.jsx` | WORKING, self-described placeholder (`es` locale has only 4 dictionary keys) |
| `utils/civic/evaluateCivicDNA.js` | pure computation | **none** | ORPHANED — no page (including `Profile.jsx`/`ProfileResults.jsx`) actually calls it despite the obvious conceptual fit |
| `utils/civicLogs.js` | `localStorage["shf.civicMissionLogs.v1"]` | **none** — nothing calls these specific helper functions; pages read/write the same key directly instead | ORPHANED as a module, but the key it targets is the most important one in the app |
| `content/civic-lessons.js` | static `CIVIC_LESSONS` (2 onboarding-style entries) | **none** | ORPHANED |

## D. Cross-app dependencies (do not break these during redesign)

1. **`localStorage["shf.civicMissionLogs.v1"]`** — written by `MissionLogButtons.jsx` (used on Elections/Proposals/Treasury Sim/Debt Clock), read by `DashboardNorthstar.jsx`, `Leaderboard.jsx`, `Badges.jsx`, `GrantStory.jsx`, and — outside Civic entirely — by Admin's `MasterNarrativeViewer.jsx` and `ToolDashboard.jsx` (`src/pages/admin/`, confirmed live, not just the `_patchbak/` copies) for grant-narrative generation and multi-app usage stats. **This is the single highest-risk integration point in the whole app.** Any redesign that changes how/where mission completions are logged must keep writing this exact key in this exact shape, or must coordinate an Admin-side migration.
2. **`shared/rewards/shim.js` behavior contract** (`getBadges`, `award`, `isUnlocked`, etc.) — six civic files depend on its exact function signatures.
3. **Sales app (`src/pages/sales/*`) shares the `.crb-*` shell CSS classnames** with Civic (structurally parallel sibling app, not a Civic page). It has a documented history of code contamination from Civic (Sales previously shipped near-unmodified copies of Civic's `Proposals.jsx`/`Settings.jsx`/`Header.jsx`/`Help.jsx`, writing to `civic:*` keys, repaired today in commit `ce1f297`). **Do not change `.crb-*` class contracts without checking `src/styles/civic-shell.css`'s consumers include `SalesLayout.jsx`.** Sales itself is out of scope for this audit and must not be modified.

## E. Bugs found during the audit (documented, not fixed — see Section 19 of the governing brief)

| ID | Severity | Description | Evidence |
|---|---|---|---|
| B-01 | FUNCTIONAL / HIGH | Civic Profile score never actually reflects real Issue Survey answers | `ProfileResults.jsx`'s `WEIGHTS` map keys (e.g. `budget-balance`, `civic-participation`) don't match `IssueSurvey.jsx`'s real question ids (`public-safety`, `schools`, `taxes`, `jobs`, `housing`) or choice ids |
| B-02 | ARCHITECTURAL / MEDIUM | `shared/rewards/badges.js` has a second `getBadgeProgress`/`isUnlocked` declared later in the file that silently shadows the first via hoisting, and the module has zero consumers anyway | direct read of the file |
| B-03 | DEAD CONTROL / LOW | "View Community Impact" link on Dashboard points at `/impact`, which has no route | `CivicDashboard.jsx` + `CivicRoutes.jsx` cross-check |
| B-04 | ACCESSIBILITY / LOW | Notes and Portfolio add-item forms rely on placeholder text instead of `<label>` elements | direct read of both files |
| B-05 | ACCESSIBILITY / LOW | Progress bars on Northstar Dashboard and Badges are plain styled `<div>`s with no `role="progressbar"`/`aria-valuenow` | direct read |
| B-06 | UX / MEDIUM | Settings "Reset local rewards & logs" is destructive with no confirmation dialog and no success feedback | `Settings.jsx`, comment explicitly acknowledges the no-toast choice |
| B-07 | VISUAL / LOW | Stray literal backtick character in one Badges status string will render to users | `Badges.jsx` ~line 196 |
| B-08 | VISUAL / LOW–MEDIUM | ~99px of the page's raw dark global background (`rgb(11,15,20)`) is visible below `.crb-root` on the Dashboard at 1440×900 — `.crb-root` (`min-height:100vh`) measures exactly 900px while its own child `.crb-body` extends to 999px, a mismatch not caught by the existing overflow tests (they check horizontal overflow only) | live Playwright measurement, reproduced twice independently; screenshot `reverify-dashboard.png` |
| B-09 | VISUAL / MEDIUM | At ≤860px, the same dark-background gap recurs at every stacked-section seam (sidebar→main, and end of page), and the full un-collapsed sidebar (20+ links across 4 sections) renders above all page content with no drawer/hamburger pattern — confirmed by the CSS's own comment: "no narrow-viewport treatment... This is a minimal containment fix, not a new mobile nav pattern (no drawer/hamburger is introduced here)" | live screenshot `dashboard-390x844.png`; `civic-shell.css` comment at line ~223 |
| B-10 | ARCHITECTURAL / LOW | `civic-shell.css` contains a second, competing, unscoped sidebar system (`.civic-sidebar`/`.civic-nav`/`.civic-link` and `.crb-shell`/`.crb-rail`) alongside the real scoped `.crb-sidebar`/`.crb-body` system in active use | direct read of `civic-shell.css` |

All existing Civic Playwright tests (80 tests across 3 spec files) pass against the current in-flight state — see baseline in Section 20 of the final report. None of the bugs above cause a test failure; they were found by direct inspection and live browser measurement, which is why the audit brief called for exactly this kind of check.
