# Civic App — Page Inventory V1

Companion to `CIVIC_APP_CAPABILITY_AUDIT_V1.md`. Every page Civic actually routes to
today, plus the unrouted/orphaned files that are real evidence of prior work and must be
accounted for before anything is discarded. "Future mock required?" is answered here at
the page level; the actual blueprints are in the Final Report §10 / to be elaborated in a
follow-up mock-blueprint pass per the governing brief (Phase C).

## Routed pages (20 routes, 21 distinct components — `micro-lessons` and `assignments` share one)

### Civic Dashboard — `/dashboard` (default landing page)
- **Component:** `CivicDashboard.jsx`
- **Purpose:** Orientation/overview landing page.
- **Primary user:** Any Civic user (no role gating exists).
- **Capabilities:** KPI strip, 3 hardcoded stat cards, "Next Actions" checklist, quick links, dashboard-mode switch.
- **Primary CTA:** "Write a Proposal →" / "All Missions →".
- **Secondary actions:** "View Community Impact →" (broken — no matching route).
- **Data shown:** Mostly hardcoded/decorative; real components (`CivicKpis`, `DashboardSwitcher`, `RewardsChip`) are wired in but the headline stat cards (Active Parties/Open Proposals/Voter Turnout) are static numbers.
- **Current issues:** Fake stats presented as if live; broken Community Impact link; ~99px dark-background gap at the page bottom (B-08).
- **Dependencies:** `CivicKpis`, `DashboardSwitcher`, `RewardsChip`.
- **Future mock required?** Yes.

### Northstar Dashboard — `/dashboard-ns`
- **Component:** `DashboardNorthstar.jsx`
- **Purpose:** Personal-progress view (points, badges, civic minutes, badge-unlock progress).
- **Primary user:** Student tracking their own civic engagement.
- **Capabilities:** Read-only summary, live-synced to real mission-log data.
- **Primary CTA:** none (read-only).
- **Data shown:** `useRewards()`, `shf.civicMissionLogs.v1`.
- **Current issues:** Progress bar not screen-reader accessible.
- **Dependencies:** `useRewards` hook.
- **Future mock required?** Yes — likely to merge into a single "Dashboard" concept with a view toggle, see §9 of the final report.

### Micro-Lessons / Assignments — `/micro-lessons`, `/assignments`
- **Component:** `Assignments.jsx`
- **Purpose:** Browse the civic micro-lesson catalog.
- **Primary user:** Student choosing what to learn next.
- **Capabilities:** List with estimated minutes, open a lesson.
- **Primary CTA:** "Open" per item.
- **Data shown:** `src/data/civic/micro-lessons.v1.json` (real dataset).
- **Current issues:** Minor a11y — repeated ambiguous "Open" link text.
- **Dependencies:** static JSON dataset.
- **Future mock required?** Yes.

### Lesson — `/lesson`, `/lesson/:id`
- **Component:** `Lesson.jsx`
- **Purpose:** Consume a lesson: read content, quiz, take notes, get AI coaching, save evidence.
- **Primary user:** Student mid-lesson.
- **Capabilities:** Lesson body, inline quiz (`MicroQuiz`), notes panel, AI Coach drawer, save-to-Portfolio, next-lesson navigation.
- **Primary CTA:** "Save to Portfolio".
- **Secondary actions:** "💬 Coach", next lesson.
- **Data shown:** **Hardcoded placeholder lesson regardless of `:id`** (B: see capability audit) — real interaction shell, wrong content source.
- **Current issues:** Content is not actually wired to `:id`; a materially richer, correctly-wired alternate implementation already exists unrouted (`CivicLesson.jsx`) and should inform the redesign rather than be discarded.
- **Dependencies:** `LessonBody`, `CoachDrawer`, `MicroQuiz`, `NotesPanel`, `exports.js`.
- **Future mock required?** Yes — and the mock should reconcile `Lesson.jsx` + `CivicLesson.jsx` into one design (see final report §9).

### Elections — `/elections`
- **Component:** `Elections.jsx`
- **Purpose:** Practice voting.
- **Primary user:** Student practicing the mechanics of voting.
- **Capabilities:** Cast a ballot (2 mock races), view vote history, log the mission to Grant Story.
- **Primary CTA:** "Cast Vote".
- **Secondary actions:** "View Proposals", "Northstar", "Cancel".
- **Data shown:** Mock `BALLOT` (candidates), real vote history from storage.
- **Current issues:** None functional; explicitly labeled "(Practice)" so mock-ballot content is intentional, not a defect.
- **Dependencies:** `Toasts`, `useRewards`, `RewardsChip`, `MissionLogButtons`.
- **Future mock required?** Yes.

### Proposals — `/proposals`
- **Component:** `Proposals.jsx`
- **Purpose:** Draft, debate, and vote on policy proposals.
- **Primary user:** Student proposing or reacting to civic policy ideas.
- **Capabilities:** Submit proposal, upvote/downvote with pass/reject thresholds, delete own proposal (Undo), log mission.
- **Primary CTA:** "Create Proposal".
- **Secondary actions:** Upvote/Downvote/Delete per proposal.
- **Data shown:** `localStorage["civic:proposals"]`, seeded with 2 examples.
- **Current issues:** Author identity hardcoded to `"local:user"` (`// swap later`); a richer unrouted sibling (`Proposals.lord-demo.jsx`) has vote-undo and a storage-repair control this page lacks.
- **Dependencies:** `shared/rewards/history.js`, `shared/storage/guard.js`, `Toasts`, `useRewards`, `MissionLogButtons`.
- **Future mock required?** Yes.

### Treasury Simulator — `/treasury-sim` (alias `/treasury`)
- **Component:** `TreasurySim.jsx`
- **Purpose:** Interactive budget-allocation simulation.
- **Primary user:** Student exploring fiscal trade-offs.
- **Capabilities:** Total-cap slider, 5 program sliders, save snapshot, log mission.
- **Primary CTA:** "Save Snapshot".
- **Secondary actions:** "Open Snapshots →".
- **Data shown:** In-memory simulation state, mirrored live to storage for the Snapshots page.
- **Current issues:** None functional; intentionally simplified model (`// Demo state`).
- **Dependencies:** `Toasts`, `RewardsChip`, `shared/rewards/history.js`, `PortfolioHint`, `MissionLogButtons`.
- **Future mock required?** Yes.

### Debt Clock — `/debtclock`
- **Component:** `DebtClock.jsx`
- **Purpose:** Educational display of a simulated national/local debt figure.
- **Primary user:** Student building fiscal-literacy context.
- **Capabilities:** Static display, log mission.
- **Primary CTA:** none (display-only) besides mission logging.
- **Data shown:** Hardcoded `$89,420,000,000`.
- **Current issues:** Caption ("Source: Public treasury data") implies live sourcing that doesn't exist — should either be labeled as simulated more clearly or wired to real data in a future iteration.
- **Dependencies:** `MissionLogButtons`.
- **Future mock required?** Yes.

### Grant Story — `/grant-story`
- **Component:** `GrantStory.jsx`
- **Purpose:** View/export the AI-generated grant narrative blending Admin logs + Civic mission logs.
- **Primary user:** Instructor/admin-facing artifact, though reachable by any Civic user today (no role gate).
- **Capabilities:** Copy to clipboard, download as `.md`.
- **Primary CTA:** "Copy for Grant Portal".
- **Data shown:** `binderMerge.js` output (real, not mocked).
- **Current issues:** Heading level inconsistency (`h2` here vs `h1` elsewhere).
- **Dependencies:** `utils/binderMerge.js` — **cross-app: consumed conceptually the same way Admin's own Grant Story viewer works.**
- **Future mock required?** Yes.

### Leaderboard — `/leaderboard`
- **Component:** `Leaderboard.jsx`
- **Purpose:** Rank contributors by civic minutes logged.
- **Primary user:** Any Civic user; also useful to instructors.
- **Capabilities:** Read-only ranked table.
- **Primary CTA:** none.
- **Data shown:** `shf.civicMissionLogs.v1`, aggregated client-side.
- **Current issues:** No sort/filter controls; missing `scope` attributes on table headers.
- **Dependencies:** none beyond localStorage.
- **Future mock required?** Yes.

### Treasury Snapshots — `/snapshots`
- **Component:** `TreasurySnapshots.jsx`
- **Purpose:** Manage saved Treasury Simulator scenarios.
- **Primary user:** Student comparing fiscal scenarios over time.
- **Capabilities:** Save/restore/export/import/delete/clear-all, storage repair.
- **Primary CTA:** "Save Snapshot".
- **Secondary actions:** Restore/Download/Delete per snapshot; Import JSON.
- **Data shown:** `localStorage["civic:treasury:snapshots"]`.
- **Current issues:** None functional.
- **Dependencies:** `shared/rewards/history.js`, `shared/storage/guard.jsx`.
- **Future mock required?** Yes.

### Issue Survey — `/survey`
- **Component:** `IssueSurvey.jsx`
- **Purpose:** Capture a student's stance on 5 civic issues.
- **Primary user:** Student establishing their civic profile inputs.
- **Capabilities:** Likert-style answers with autosave, live X/Y compass preview, manual save.
- **Primary CTA:** "Save Survey".
- **Data shown:** `localStorage["civic:survey:issues"]`.
- **Current issues:** Feeds `ProfileResults.jsx`, but that page's scoring map doesn't actually match this page's answer IDs (B-01) — the survey itself works, the downstream consumer is broken.
- **Dependencies:** `Toasts`, `RewardsChip`, `useRewards`.
- **Future mock required?** Yes.

### Profile Results — `/profile`
- **Component:** `ProfileResults.jsx`
- **Purpose:** Show the derived Civic Profile (X/Y compass) and an aggregated activity feed.
- **Primary user:** Student reflecting on their overall civic engagement pattern.
- **Capabilities:** XY compass render, "what moved your profile" feed (votes/proposals/treasury/attestations/wallet).
- **Primary CTA:** "Edit Survey".
- **Data shown:** Multiple localStorage keys, aggregated.
- **Current issues:** **B-01 — scoring map doesn't match real survey answer IDs, so the profile likely never actually moves from center regardless of what a student answers.** Fix this before or during redesign; it undermines the page's entire premise.
- **Dependencies:** none beyond localStorage.
- **Future mock required?** Yes — after B-01 is understood/fixed.

### Notes — `/notes`
- **Component:** `Notes.jsx`
- **Purpose:** General-purpose civic research/debate notes.
- **Primary user:** Student capturing research while working through Civic tools.
- **Capabilities:** Add/edit/delete with tags, Undo, clear-all, storage repair.
- **Primary CTA:** "Save Note".
- **Data shown:** `localStorage["civic:notes"]`.
- **Current issues:** Form fields rely on placeholder text instead of `<label>` (B-04).
- **Dependencies:** `Toasts`, `shared/storage/guard.jsx`, `shared/rewards/history.js`.
- **Future mock required?** Yes.

### Portfolio — `/portfolio`
- **Component:** `Portfolio.jsx`
- **Purpose:** Curate a portfolio of civic-work artifacts.
- **Primary user:** Student assembling evidence of their civic work.
- **Capabilities:** Add/edit/delete artifacts (document/link/media/certificate/code), export JSON, offline-sync queueing.
- **Primary CTA:** "Save Artifact".
- **Data shown:** `localStorage["civic:portfolio:artifacts"]`.
- **Current issues:** Same label/placeholder a11y gap as Notes (B-04).
- **Dependencies:** `Toasts`, `shared/storage/guard.jsx`, `shared/rewards/history.js`, `shared/offline/queue.js`.
- **Future mock required?** Yes.

### Rewards — `/rewards`
- **Component:** `Rewards.jsx`
- **Purpose:** View points/badges, inspect a specific badge via deep link.
- **Primary user:** Any Civic user checking their progress.
- **Capabilities:** Badge chip grid, badge-details modal, URL-synced deep link.
- **Primary CTA:** click a badge chip.
- **Data shown:** `RewardsChip`, `AchievementsBar`, `BadgeDetailsModal`.
- **Current issues:** A code comment marks a wallet-history/points-breakdown section as planned-but-unbuilt.
- **Dependencies:** none unusual.
- **Future mock required?** Yes.

### Badges — `/badges`
- **Component:** `Badges.jsx`
- **Purpose:** Browse earned badges by category, track Grant-Story-Contributor progress.
- **Primary user:** Any Civic user.
- **Capabilities:** Grouped badge display, progress bar.
- **Primary CTA:** none (display-only).
- **Data shown:** `useRewards`, `shf.civicMissionLogs.v1`.
- **Current issues:** B-05 (progress bar a11y), B-07 (stray backtick string).
- **Dependencies:** none unusual.
- **Future mock required?** Yes — likely mergeable with Rewards, see final report §9.

### Settings — `/settings`
- **Component:** `Settings.jsx`
- **Purpose:** Privacy controls + local data reset.
- **Primary user:** Any Civic user.
- **Capabilities:** External-publish opt-in toggle, public handle, destructive local reset.
- **Primary CTA:** none singular — a settings form.
- **Current issues:** B-06 — destructive reset has no confirmation or feedback.
- **Dependencies:** none unusual.
- **Future mock required?** Yes.

### Help — `/help`
- **Component:** `Help.jsx`
- **Purpose:** Intended as FAQ/support.
- **Primary user:** Any Civic user needing assistance.
- **Capabilities:** None — static text only.
- **Current issues:** Effectively empty; no real content exists to preserve here, but the page slot itself (and its sidebar entry) should be preserved for the redesign to fill in.
- **Dependencies:** none.
- **Future mock required?** Yes (net-new content, not a preservation exercise).

### Constitution Journal — `/journal`
- **Component:** `ConstitutionJournal.jsx`
- **Purpose:** Structured journaling tied to grant-funding-stream tags.
- **Primary user:** Student or instructor documenting civic work for compliance/reporting.
- **Capabilities:** Full CRUD, autosave, filter by site/funding/tag/search, JSON/Markdown export, funding-stream tagging.
- **Primary CTA:** "New entry".
- **Secondary actions:** Export JSON/Markdown, delete (native confirm).
- **Data shown:** `shared/journal/journalStore.js` → `shf.journal.v1`.
- **Current issues:** None functional — this is the best-engineered page in the app (typed schema, dedicated store module, SSR-safe, real error handling).
- **Dependencies:** `shared/journal/journalStore.js` — **grant-compliance relevant, treat funding-stream taxonomy as a hard constraint.**
- **Future mock required?** Yes.

## Route aliases

- `/missions` → redirects to `/micro-lessons` (i.e., renders `Assignments.jsx`).
- `/treasury` → redirects to `/treasury-sim`.

## Orphaned / unrouted pages (real files on disk, zero route reaches them)

These are not "future pages to design a mock for" by default — they are **evidence to
reconcile against the routed pages above** before anything is finalized, because several
of them contain functionality or data-wiring superior to what's actually live.

| File | Relationship to a routed page | Recommendation |
|---|---|---|
| `MicroLessonDetail.jsx` + `MicroLessons.jsx` | Earlier, hardcoded-2-lesson alternative to `Assignments.jsx`/`Lesson.jsx` | Superseded; safe to retire once functionality parity with `Assignments.jsx` is confirmed |
| `Proposals.lord-demo.jsx` | Superset of routed `Proposals.jsx` (adds vote-undo, storage repair) | **Review for promotion** — don't just delete; some of its extras look like they were meant to ship |
| `Profile.jsx` | Different, broken alternative to `ProfileResults.jsx` | Discard — contains a real syntax-level defect (orphaned code after the component closes) and is superseded |
| `Missions.jsx` + `Mission.jsx` | Real-dataset-driven alternative to `Assignments.jsx`/`Lesson.jsx`, with its own (unregistered) `/mission/:id` route | Reconcile with `CivicLesson.jsx` findings below — there appear to be two or three parallel, half-finished attempts at "the lesson experience" |
| `CivicHome.jsx` | Explicit incident-recovery placeholder, its own text says so | Discard |
| `CivicLesson.jsx` | Real-dataset-driven, TTS + Focus Mode + progress bar alternative to `Lesson.jsx` | **Review for promotion / merge** — has real content wiring `Lesson.jsx` lacks; `Lesson.jsx` has quiz/notes/coach/portfolio-save integration this page lacks. The redesign should design one page that has both. |
| `Surveys.jsx` | Generic multi-survey engine, distinct purpose from `IssueSurvey.jsx` | Low priority — depends on an un-seeded catalog and has an acknowledged incomplete submit pipeline; not clearly needed unless a future multi-survey use case is planned |
| `pages/civic/CoachDrawer.jsx` | Stale duplicate of `components/civic/CoachDrawer.jsx` | Discard — confirmed unreferenced anywhere |

Also present on disk but outside this pass's page-by-page read (flagged for completeness,
not yet fully audited): `CommunityImpact.jsx`, `Parties.jsx`. Neither is routed.
`CivicDashboard.jsx`'s broken `/impact` link suggests `CommunityImpact.jsx` may have been
intended to fill that route — worth checking before writing that page's mock.

## Out of scope for this audit (explicitly, per the governing brief)

- **Sales app** (`src/pages/sales/*`, `sales.html`) — a structurally-parallel sibling app for
  B2B sales/employer-outreach, not a Civic page. Shares `.crb-*` shell CSS with Civic and has
  a documented history of Civic-code contamination (repaired today, commit `ce1f297`). Not
  touched, not further audited here.
- Career Center, Curriculum Hub, Workforce Arcade, Classical Arcade Room, Universe routing, SHS BOS — untouched, not referenced by anything above except as sibling "Foundation Apps" registry entries.
