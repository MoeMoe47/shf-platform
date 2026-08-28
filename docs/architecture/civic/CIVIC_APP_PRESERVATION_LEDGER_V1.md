# Civic App — Preservation Ledger V1

Anti-regression artifact. Every entry below is a capability that must survive the future
Civic redesign. "Verification method" is written so it can be checked mechanically
(existing test, or a specific manual check) once mock-approved pages are implemented.
Cross-reference `CIVIC_APP_CAPABILITY_AUDIT_V1.md` for full detail on status/bugs.

---

**P-001**
Capability: Cast a practice ballot vote and view vote history.
Current implementation: `src/pages/civic/Elections.jsx`, `localStorage["civic:votes"]`.
Page: Elections (`/elections`).
Must survive redesign: Yes.
Reason: Core "practice democracy" mechanic; explicit product identity of the app.
Dependencies: `Toasts`, `useRewards`, `MissionLogButtons`.
Verification method: `tests/ui/civic-route-recovery.spec.mjs` (route renders); new test should assert a cast vote persists and appears in vote history.

**P-002**
Capability: Submit, upvote/downvote, and delete policy proposals with pass/reject thresholds.
Current implementation: `src/pages/civic/Proposals.jsx`, `localStorage["civic:proposals"]`.
Page: Proposals (`/proposals`).
Must survive redesign: Yes.
Reason: Core deliberation/voting mechanic.
Dependencies: `shared/rewards/history.js`, `shared/storage/guard.js`.
Verification method: `tests/ui/civic-mobile-overflow.spec.mjs` (seeded-proposal containment checks); new test should assert submit → visible in list → vote changes score/status → delete removes it with working Undo.

**P-003**
Capability: Interactive budget simulator (total cap + 5 program sliders) with snapshot save/restore/export/import.
Current implementation: `src/pages/civic/TreasurySim.jsx` + `TreasurySnapshots.jsx`, `localStorage["civic:treasury:state"]` / `["civic:treasury:snapshots"]`.
Page: Treasury Simulator (`/treasury-sim`), Treasury Snapshots (`/snapshots`).
Must survive redesign: Yes.
Reason: The app's most distinctive interactive-learning tool; snapshot export/import is real file I/O, not decorative.
Dependencies: `shared/rewards/history.js`, `shared/storage/guard.jsx`.
Verification method: `tests/ui/civic-mobile-overflow.spec.mjs` desktop-layout checks (sliders on one row); manual: save → appears in Snapshots → restore returns exact state → export/import round-trips.

**P-004**
Capability: Mission logging to the Grant Story, tagged by funding stream (Perkins/WIOA/ESSA/Medicaid/IDEA/Workforce/Philanthropy/Civics), from Elections/Proposals/Treasury Sim/Debt Clock.
Current implementation: `MissionLogButtons.jsx`, writes `localStorage["shf.civicMissionLogs.v1"]`.
Page: Elections, Proposals, Treasury Simulator, Debt Clock.
Must survive redesign: **Yes — highest priority in this entire ledger.**
Reason: Cross-app dependency. Consumed by Admin's `MasterNarrativeViewer.jsx` and `ToolDashboard.jsx` for grant-narrative generation and multi-app usage stats. Also consumed within Civic by Northstar Dashboard, Leaderboard, Badges, Grant Story.
Dependencies: exact localStorage key name and entry shape must not change without an Admin-side migration plan.
Verification method: manual cross-check against `src/pages/admin/MasterNarrativeViewer.jsx` / `ToolDashboard.jsx` after any change to logging shape; consider a dedicated contract test.

**P-005**
Capability: View the AI-generated Grant Story narrative; copy to clipboard; download as Markdown.
Current implementation: `src/pages/civic/GrantStory.jsx`, `utils/binderMerge.js`.
Page: Grant Story (`/grant-story`).
Must survive redesign: Yes.
Reason: Direct downstream consumer of P-004; real file/clipboard I/O.
Dependencies: `binderMerge.js` behavior contract.
Verification method: manual — narrative renders, copy button populates clipboard, download produces a valid `.md` file.

**P-006**
Capability: Leaderboard of top mission contributors by civic minutes.
Current implementation: `src/pages/civic/Leaderboard.jsx`, reads `shf.civicMissionLogs.v1`.
Page: Leaderboard (`/leaderboard`).
Must survive redesign: Yes.
Reason: Motivational/social feature built on the same load-bearing data key as P-004.
Dependencies: P-004's data shape.
Verification method: manual — seed mission logs, confirm ranked table reflects them.

**P-007**
Capability: 5-question issue-stance survey with autosave and live X/Y compass preview.
Current implementation: `src/pages/civic/IssueSurvey.jsx`, `localStorage["civic:survey:issues"]`.
Page: Issue Survey (`/survey`).
Must survive redesign: Yes.
Reason: Core input to the Civic Profile concept; functions correctly on its own.
Dependencies: question/choice IDs are relied on by `ProfileResults.jsx` (currently mismatched — see P-008).
Verification method: `tests/ui/civic-mobile-overflow.spec.mjs` (empty + responsive checks); manual — answer all 5, confirm autosave and compass preview update live.

**P-008**
Capability: Derived Civic Profile (X/Y compass) and "what moved your profile" activity feed.
Current implementation: `src/pages/civic/ProfileResults.jsx`.
Page: Profile Results (`/profile`).
Must survive redesign: Yes, **but fix B-01 first** (scoring map doesn't match real survey answer IDs — the profile currently likely never moves from center based on real answers).
Reason: Conceptually central to the "civic DNA" framing used in the app's own marketing copy (`apps.registry.js` tagline: "Build civic DNA, missions, and impact portfolios").
Dependencies: P-007's answer ID shape; also note `utils/civic/evaluateCivicDNA.js` exists as unused orphaned logic that may have been the intended real scoring engine — check it before rebuilding scoring from scratch.
Verification method: manual — answer survey with a clear directional bias, confirm the compass position actually reflects it (this will currently fail; that failure is the acceptance bar for calling B-01 fixed).

**P-009**
Capability: Add/edit/delete free-form civic notes with tags and Undo.
Current implementation: `src/pages/civic/Notes.jsx`, `localStorage["civic:notes"]`.
Page: Notes (`/notes`).
Must survive redesign: Yes.
Reason: General-purpose research capability used alongside every other civic tool.
Dependencies: `shared/storage/guard.js`.
Verification method: manual CRUD + Undo check; fix B-04 (missing `<label>`s) as part of the redesign, not a separate pass.

**P-010**
Capability: Add/edit/delete portfolio artifacts (document/link/media/certificate/code), export JSON, offline-sync queueing.
Current implementation: `src/pages/civic/Portfolio.jsx`, `localStorage["civic:portfolio:artifacts"]`, `shared/offline/queue.js`.
Page: Portfolio (`/portfolio`).
Must survive redesign: Yes.
Reason: Evidence-collection is core to the app's stated purpose ("impact portfolios").
Dependencies: `shared/offline/queue.js` — offline-first behavior is easy to silently drop in a rewrite since it has no visible UI of its own.
Verification method: manual CRUD/export; confirm `enqueue("portfolio", ...)` still fires (check via `shared/offline/queue.js` call, e.g. Cache Storage inspection).

**P-011**
Capability: Points/badges display with deep-linkable badge-details modal.
Current implementation: `src/pages/civic/Rewards.jsx`, `AchievementsBar`, `BadgeDetailsModal`.
Page: Rewards (`/rewards`).
Must survive redesign: Yes.
Reason: Motivational layer tied to `shared/rewards/shim.js`, itself tied to 6 other files.
Dependencies: `shared/rewards/shim.js` contract; note the civic badge **catalog** (`catalog.civic.js`) is currently an empty stub — badges awarded still record in history, but there's no defined catalog to unlock against. Decide during redesign whether to populate a real catalog or keep history-only.
Verification method: manual — earn a badge (e.g. via Elections or Proposals), confirm it's visible and the `?badge=` deep link opens its modal.

**P-012**
Capability: Grouped badge display (Civic & Grant / Micro-lesson / Other) with Grant-Story-Contributor progress.
Current implementation: `src/pages/civic/Badges.jsx`.
Page: Badges (`/badges`).
Must survive redesign: Yes.
Reason: Same rewards system as P-011; distinct grouped presentation.
Dependencies: same as P-011, plus `shf.civicMissionLogs.v1` for the 60-minute threshold calculation.
Verification method: manual; fix B-05 (progressbar a11y) and B-07 (stray backtick) as part of the redesign.

**P-013**
Capability: Privacy controls — external-publish opt-in (default off), public handle.
Current implementation: `src/pages/civic/Settings.jsx`, `localStorage["civic:privacy"]`.
Page: Settings (`/settings`).
Must survive redesign: Yes.
Reason: The default-off external-publish gate is a real privacy control, not decorative — losing it silently would be a privacy regression, not just a UX one.
Dependencies: none external.
Verification method: manual — toggle stays off by default on fresh state; confirm value persists across reload.

**P-014**
Capability: "Reset local rewards & logs" local-data wipe.
Current implementation: `src/pages/civic/Settings.jsx`.
Page: Settings (`/settings`).
Must survive redesign: Yes (the capability), but **must gain a confirmation step and success feedback** (B-06) — this is a preservation entry for the underlying capability, not for its current unsafe UX.
Reason: Legitimate user need (start fresh); currently unsafe because it's irreversible with zero confirmation.
Dependencies: none external.
Verification method: manual — clicking reset must require an explicit confirm step post-redesign, and must show the user it succeeded.

**P-015**
Capability: Full CRUD Constitution Journal with funding-stream tagging, filtering, search, and JSON/Markdown export.
Current implementation: `src/pages/civic/ConstitutionJournal.jsx`, `shared/journal/journalStore.js`, `localStorage["shf.journal.v1"]`.
Page: Constitution Journal (`/journal`).
Must survive redesign: Yes, in full — this is the most completely and correctly engineered page in the app.
Reason: Grant-compliance relevant (Perkins/WIOA/ESSA/etc. funding-stream taxonomy is a fixed, meaningful vocabulary, not placeholder copy).
Dependencies: `journalStore.js`'s schema and the `FUNDING` taxonomy list.
Verification method: `tests/ui/civic-journal-header.spec.mjs` (existing, comprehensive) + `tests/ui/civic-mobile-overflow.spec.mjs`'s journal-grid checks — keep both passing.

**P-016**
Capability: Contextual AI Coach drawer (mastery-aware hints, quick-insert prompts, hotkey open via Ctrl/⌘+K) available from the Lesson page.
Current implementation: `src/components/civic/CoachDrawer.jsx`.
Page: Lesson (`/lesson`), mounted globally at the app shell.
Must survive redesign: Yes.
Reason: A meaningfully-built feature (not a stub) even though its "Ask" flow is a local canned response rather than a real AI backend — losing the drawer itself would be a regression; upgrading the Ask flow to a real backend is a legitimate future enhancement, not a preservation concern.
Dependencies: `masteryMap`/`reflection` props supplied by whichever page hosts it.
Verification method: manual — open via Ctrl/⌘+K and via a trigger button, confirm hints reflect mastery state, confirm Esc/backdrop/close all work.

**P-017**
Capability: Micro-lesson catalog browsing and lesson consumption (quiz, notes, save-to-portfolio).
Current implementation: `src/pages/civic/Assignments.jsx` (catalog) + `src/pages/civic/Lesson.jsx` (consumption).
Page: Micro-Lessons/Assignments (`/micro-lessons`, `/assignments`), Lesson (`/lesson`, `/lesson/:id`).
Must survive redesign: Yes, **and the content-wiring bug must be fixed as part of the redesign** — `Lesson.jsx` currently ignores `:id` and always shows one hardcoded lesson (see capability audit). `CivicLesson.jsx` (unrouted) shows how to wire the real dataset correctly and adds TTS/Focus Mode/progress-bar — use it as a reference during the mock/implementation, don't discard its approach.
Reason: Core learning-content delivery mechanic.
Dependencies: `src/data/civic/micro-lessons.v1.json`.
Verification method: manual — opening different lessons from the catalog must show different content post-redesign (currently fails this check).

**P-018**
Capability: Dashboard ⇄ Northstar Dashboard mode switch with persisted preference.
Current implementation: `src/components/civic/DashboardSwitcher.jsx`, `localStorage["civic:pref:dashboard"]`.
Page: Civic Dashboard / Northstar Dashboard.
Must survive redesign: Yes, unless the redesign intentionally merges the two dashboards into one (see final report §9) — if merged, the preserved capability becomes "both dashboards' distinct information is visible in the merged page," not literally the switcher control itself.
Reason: Both dashboard variants show materially different, real information (KPIs vs. personal-progress/badge-threshold view).
Dependencies: none external.
Verification method: manual — confirm no information present in either current dashboard is missing from whatever replaces them.

**P-019**
Capability: "Fix storage" soft-reset controls for malformed localStorage state (Proposals-demo, Notes, Portfolio, Treasury Snapshots).
Current implementation: `shared/storage/guard.jsx`'s `StorageSoftReset` component.
Page: Notes, Portfolio, Treasury Snapshots (and the unrouted Proposals demo/Surveys).
Must survive redesign: Yes, at least on the pages where it's already routed (Notes, Portfolio, Treasury Snapshots).
Reason: Real recovery mechanism for corrupted client-side state; not decorative.
Dependencies: `shared/storage/guard.jsx`.
Verification method: manual — deliberately corrupt a storage key, confirm the reset control repairs it.

**P-020**
Capability: Undo affordance (7-second window) on every destructive delete/clear action across the app.
Current implementation: consistent pattern via `Toasts` context, used in Notes, Portfolio, Treasury Snapshots, Proposals (delete only — not vote-removal, see B and `Proposals.lord-demo.jsx`).
Page: Notes, Portfolio, Treasury Snapshots, Proposals.
Must survive redesign: Yes.
Reason: This is the app's actual safety net for destructive actions everywhere except Settings' reset (P-014) and Constitution Journal's delete (which intentionally uses a native `confirm()` instead — also acceptable, just a different pattern). Consistency matters: the redesign should pick one pattern and apply it everywhere, preserving the safety property either way.
Dependencies: `Toasts` context.
Verification method: manual — delete something, confirm Undo restores it within the window on every page listed.

---

## Capabilities explicitly NOT preservation-critical (documented so they aren't accidentally treated as gaps)

- **Help page content** (P: none) — currently empty; the redesign should write real content, this is net-new work, not preservation.
- **Debt Clock's static figure** — intentionally simulated/educational; no live data integration to preserve, though the misleading "Source" caption (see capability audit) should be reworded for honesty during redesign.
- **`shared/quiz/store.js`, `shared/rewards/badges.js`, `shared/ledger/schema.js`, `shared/ns/events.js`, `utils/civicLogs.js`, `content/civic-lessons.js`** — confirmed zero consumers; nothing currently depends on them, so their removal (if the redesign chooses to clean them up) preserves 100% of visible functionality. Do not treat "a shared module exists" as proof a capability must be preserved — check consumers first, per the capability audit's module-by-module table.
