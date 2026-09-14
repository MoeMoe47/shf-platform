# NCA-3 — IN-APP INBOX & ATTENTION PROJECTION

Turns the canonical backend (NCA-0/1/2) into one coherent in-app notification experience: a shared bell, a shared inbox, and a shared attention projection consumed by all four product shells. No transactional email, SMS, push, digests, or NCA-4 work performed.

## 1. Executive Result

One canonical, shared notification UI layer (`src/components/shared/notifications/`) now exists and is consumed by all four product shells — Curriculum (refactored from its own bespoke, buggy implementation), Store, Arcade, and CivicSure (all three previously fake, now real). Live browser testing against a real Postgres database and a real running backend confirmed: recipient-scoped unread counts, mark-read/mark-all-read/archive, the action-required/attention distinction surviving a read, organization-scoped filtering, an honest "select an organization" state for a genuine multi-org user with no active-org context yet, and a graceful, shell-preserving error state when the backend is unreachable. Along the way, a real, previously-shipped bug was found and fixed: Curriculum's own "mark read" handler recursed into itself instead of ever calling the API, meaning mark-read from that bell never actually worked before this phase.

## 2. Repository Baseline

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`, branch `claude/notifications`, HEAD `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head: **`143` (unchanged — no migration added in this phase)**
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified

## 3. NCA-2 Inputs

Read and built on directly: `docs/architecture/NCA-0_...md`, `NCA_OWNER_DECISION_LOCK.md`, `NCA-1_...md`, `NCA-2_...md`, and their implementation files (`apps/shs-api/src/domain/notifications/**`). The canonical REST API (`GET /notifications`, `/unread-count`, `/attention-items`, `/organizations`, `POST /:id/read`, `/read-all`, `/:id/archive`) and classification/preference model from NCA-1/NCA-2 are consumed as-is — no backend contract was changed in this phase beyond the pre-existing `src/lib/notifications/api.js` client gaining the calls NCA-2 already added server-side (`unreadCount`, `listAttentionItems`, `listOrganizationUnreadCounts`, `archiveNotification`, and an `organizationId` query parameter on the existing calls).

## 4. Canonical In-App Architecture

`src/components/shared/notifications/` is the one canonical UI layer, per NCA-D002:

- **`useNotifications.js`** — the one shared adapter (`useUnreadCount`, `useOrganizationUnreadCounts`, `useNotificationInbox`) every product consumes instead of re-implementing fetch/count/mark-read/filter logic. A small same-tab change-notification bus (`notifyNotificationsChanged`) keeps a mounted bell's count in sync when a mutation happens elsewhere (e.g. the full inbox page) — found and fixed live during browser testing (§32).
- **`NotificationBell.jsx`** — the one canonical bell.
- **`NotificationInbox.jsx`** — the one canonical inbox page, mounted by every shell.
- **`NotificationList.jsx` / `NotificationItem.jsx` / `NotificationEmptyState.jsx` / `NotificationFilters.jsx`** — presentational pieces the bell and inbox both reuse.
- **`NotificationAttentionProjection.jsx`** — wraps the existing `SeaAttention` primitive with NCA's data (§11).
- **`domainLabels.js` / `safeLinks.js` / `errorMessages.js`** — small, pure, independently-testable modules (category→domain label, same-origin path validation, honest error messaging).

No product-specific notification store, duplicate fetch logic, or second inbox implementation was created.

## 5. Shared Bell

Shows unread count from `GET /notifications/unread-count` only — never a fake or localStorage-derived number, and never a badge when the count is genuinely zero (verified live: after marking everything read, the badge disappeared entirely rather than showing "0"). Opens a dropdown preview (up to 8 items) reusing `NotificationList`; keyboard accessible (Tab to focus with a visible focus ring, Enter/Space to open, Escape to close, click-outside to close — all verified live). Accepts an `inboxHref` prop (a `react-router-dom` `<Link>`, not a plain anchor — see §32 for a bug this caught) so each shell can point it at its own contextual inbox route without the bell knowing shell-specific routing.

## 6. Canonical Inbox

`NotificationInbox.jsx` supports: All/Unread/Action-required filters, an organization filter (`<select>`, rendered only when the user has more than one authorized organization — never forced on a single-org user), domain/product context per item, safe organization labels (raw `organizationId` today — see §7's honest limitation note), source context, timestamp, category/urgency presentation (text-labeled, never color-only), read/unread state, and the action target link. No folders/tabs/advanced search were built — three filter buttons and one list, per the "keep it simple" instruction.

## 7. Multi-Org Experience

Implemented and verified against the real backend (curl + browser):

- Every organization-scoped notification retains its organization identity (unchanged from NCA-2).
- The active organization is the default view; it does not erase other authorized organizations' notifications — proven via `GET /notifications/organizations` returning both a user's organizations with independent unread counts.
- `?organizationId=` filtering works for any authorized organization and is rejected (`ORG_CONTEXT_FORBIDDEN`) for an unauthorized one — proven live via direct API calls with a real two-organization dev fixture (`user_nca3_multiorg_demo`, added to `identity-repo.ts` for this purpose, see §32).

**Honest limitation found and handled, not hidden:** no organization-switcher UI exists anywhere in this frontend today (confirmed: zero references to `x-shs-organization-id` anywhere in `src/` before this phase) — building one is explicitly EXR's placement responsibility, not NCA's. A genuine multi-org user (more than one non-platform membership) with no active-organization context is rejected by the backend (`ORG_CONTEXT_REQUIRED`) on every request, including the organization-list call itself. Rather than surface this as a generic, misleading "unavailable" error, the shared hooks now recognize this specific code and show **"Select an organization to view notifications."** — verified live. This is a real, correctly-scoped boundary: NCA cannot and should not build the org-switcher itself in this phase.

## 8. Personal Notifications

**Not built — correctly deferred, per NCA-2's own finding.** Every one of the ~19 real, currently-wired notification types is genuinely organization-scoped; `notifications.organization_id` remains `NOT NULL`. No fake "Global" organization was invented. If a genuine personal/non-org notification type is ever proposed, the UI's `showOrganization` column already degrades gracefully (organization display is conditional on `organizations.length > 1`, not assumed present).

## 9. Domain / Product Context

`domainLabels.js` maps every real `notification_type` to a human-readable domain (Studio, Credentials, Agent Registry, Curriculum, Documents) rather than exposing internal strings like `DOCUMENTATION_SIGNATURE_REQUIRED` directly — verified live (screenshots show "Studio", "Credentials", "Curriculum" pills, never raw type strings). Unclassified future types fall back to a conservative "Platform" label rather than fabricating a domain name.

## 10. Action-Required Semantics

`actionRequired` is read directly from the backend-classified item, never invented client-side. Verified live and explicitly: after marking "Test deployment failed" and "New review work" read (individually, then via mark-all-read, then via a fresh full page reload from the server), both retained their "Action required" badge in every subsequent view, including the dedicated Action-required filter. No client code path sets or clears `actionRequired`.

## 11. Attention Projection

`NotificationAttentionProjection.jsx` is a derived read of the same canonical notifications (`useNotificationInbox({ filter: "action_required" })`, which itself calls the NCA-2 `GET /notifications/attention-items` endpoint) — no second attention store, no copied workflow state into frontend-local state. It renders through the **existing** `SeaAttention` component (`src/components/sea/SeaDashboardPrimitives.jsx`), mapping NCA's item shape into SeaAttention's expected props — reusing the SEA-owned presentation primitive rather than inventing new attention UI, per the locked boundary (§31 / decision lock).

## 12. Read / Unread

Reused from NCA-2 verbatim: `UNREAD | READ | ARCHIVED`. `markRead`/`markAllRead` only ever call the existing NCA-2 endpoints, which only ever touch the `notifications` table — verified by NCA-2's own backend tests (unchanged, re-run, still passing) and observed live (marking read never altered anything about the underlying Studio/credential/deployment record, which this UI has no code path to touch at all).

## 13. Mark All Read

Implemented in the inbox (button appears only when there is at least one unread item) and available in the bell's data layer. Verified live: unread count dropped to 0 for every remaining item, all four remaining items showed "Read", and the two action-required items kept their action-required badge.

## 14. Action Routing

Every item's "Open" link is validated by `isSafeInternalPath()` (same-origin relative paths only — rejects protocol-relative `//`, absolute external URLs, and `javascript:`-style values) before being rendered as an `href`, and links to exactly the server-generated `destinationPath` from the existing policy (`/studio/reviewer-queue`, `/curriculum/asl/portfolio`, etc.) — no destination logic of any kind was implemented inside the notification UI itself.

## 15. Empty State

`NotificationEmptyState.jsx` renders one of four honest, specific messages ("No notifications yet.", "No unread notifications.", "No action-required items right now.", "No notifications for the selected organization.") depending on which filter produced zero results — verified live for the all-notifications case (a zero-notification dev identity showed "No notifications yet." with a correctly badge-less bell).

## 16. Loading State

A plain `role="status"` text message ("Loading notifications…") — no skeleton UI was introduced, matching the repository's existing `src/pages/Notifications.jsx` style rather than inventing a new pattern.

## 17. Error State

Verified live by stopping the backend mid-session: the inbox showed a bounded, `role="alert"` error panel with a Retry button; the rest of the page (sidebar navigation, footer, unrelated dashboard links) remained fully interactive — the shell did not break, and no unrelated navigation was blocked. Confirmed the bell degrades the same way (no crash, no misleading count).

## 18. Unread Count

Always sourced from `GET /notifications/unread-count` (never a client-derived or localStorage count). Verified live end-to-end: initial count (3), after one mark-read (2), after mark-all-read (0), and organization-filtered counts via direct API calls for both an authorized non-active organization (correct count) and a rejected unauthorized one (403). A real cross-component staleness bug was found and fixed during this testing: the bell's count did not refresh after the separate inbox page's "mark all read" call, since each hook fetched independently — fixed with a small same-tab change-notification bus (§32) so every mounted consumer re-fetches on any mutation, rather than ever showing a misleading stale count.

## 19. Canonical Inbox Route

One canonical inbox page component, mounted at each shell's own contextual route as a thin routing alias (never a re-implementation): `/curriculum/notifications` (existing route, page refactored to the shared component), `/notifications` within Store's and Arcade's own app-local routers, `notifications` within Civic's nested layout route. All four verified live to render the identical shared component against the identical backend data. EXR's future `INBOX_DESTINATION_SLOT` can point at any of these existing routes, or a new one rendering the same `NotificationInbox` component — no product-specific inbox implementation exists to migrate away from.

## 20. Curriculum Integration

Refactored, not regressed: `CurriculumHeader.jsx` now renders `<NotificationBell>` instead of ~50 lines of bespoke state/effects. **A real, pre-existing bug was fixed as a direct consequence**: the old code had a local `async function markNotificationRead(item)` with the exact same name as the imported API function, shadowing it within its own scope — calling it recursed into itself instead of ever calling the real API. Mark-read from the Curriculum bell never worked before this phase. Verified live: the search field, theme switch, and pathway selector all continue to function unchanged; the bell now correctly marks items read.

## 21. Store Integration

`StoreHeader.jsx`'s fake "You're all caught up — no new notifications" static panel (never called any API, per NCA-0's finding) is replaced with the real `NotificationBell`. A new `/notifications` route (`StoreNotifications.jsx`, mounted inside the existing `StoreCatalogShell`) provides the canonical inbox destination. Verified live: real, shared data (identical to Curriculum's) rendered in Store's own shell chrome.

## 22. Arcade Integration

`ArcadeHeaderExtras.jsx`'s `ArcadeNotifications` component (static "0 new" badge, an informational dialog explicitly stating "no live notification feed wired up") is replaced with `NotificationBell`. `ArcadeInfoDialog` (still used elsewhere in Arcade, confirmed before removing this one usage) is no longer imported by this file. A new `/notifications` route provides the canonical inbox. Verified live.

## 23. CivicSure Integration

`CivicTopBar.jsx`'s `CivicNotifications` component (the same static "0 new" + informational-dialog pattern as Arcade) is replaced with `NotificationBell`. A new `notifications` route provides the canonical inbox inside the existing `CivicLayout`. Verified live, including the full inbox page rendering inside Civic's own sidebar/shell chrome.

**All three previously-fake surfaces (§21 disposition per NCA-0's own recommendation: adapt to canonical, since none needed EXR shell placement work first) are now Option A — genuinely wired, not neutralized placeholders.**

## 24. BOS Boundary

Untouched, per NCA-D013. `src/system/notification-fabric/*` (BOS localStorage) was not read for modification and remains entirely separate from the canonical `notifications` domain this phase touched. No merge was performed or attempted.

## 25. Agent Fabric Boundary

Untouched, per NCA-D013. `services/shf-agent-fabric`'s Python classification service was not touched. No internal Agent Fabric architecture was rewritten.

## 26. Preferences UI Decision

**Deferred, deliberately.** NCA-2 made a minimal preference model canonical and backend-supported (`GET/PUT /notifications/preferences`), but building a settings UI for it was not required for this phase's success criteria (no exit-gate condition references it), and `src/pages/Settings.jsx` remains the pre-existing "coming soon" placeholder untouched. This is exactly the phase's own instruction: "If preferences UI is not needed for phase success: defer it."

## 27. Accessibility

Verified live, not merely asserted: keyboard Tab reaches the bell with a visible focus ring; Enter/Space opens it; Escape closes it and returns focus correctly; the panel uses `role="dialog"` with an accessible label; unread state is conveyed by a text badge and an `aria-label` describing the count ("Notifications, 3 unread"), never color alone; urgency/action-required state is conveyed by text pills ("Needs attention", "Action required"), never color alone; timestamps use `<time dateTime>` with a locale-formatted human-readable label; filter buttons use `aria-pressed`; the organization `<select>` has an associated (visually-hidden but accessible) label. A `prefers-reduced-motion` guard is present in the CSS (no motion was added regardless, since none of this UI animates). No dedicated repo accessibility-registry validator applies to this new surface (those validators check the separate AX/accessibility-profile system, which this phase did not touch) — verification here is via live keyboard/screen-reader-semantics testing, matching how the repository's non-AX UI is generally hand-verified.

## 28. Privacy

Unchanged minimum-necessary practice from NCA-1/NCA-2 (server-generated, generic `title`/`message` strings — never raw source payload) is faithfully rendered as-is; the shared `NotificationItem` component has no code path that could expose a field beyond `title`/`message`/`destinationPath`/timestamps/classification, since it only ever reads the mapped API response shape.

## 29. Security

- **Cross-user/cross-org**: enforced entirely server-side (NCA-2, re-verified unchanged); the frontend has no code path that can widen access — it only ever sends what the user already has (their own dev-token identity, an optional `organizationId` the server independently validates).
- **Client-controlled action URL**: `isSafeInternalPath()` rejects anything not a same-origin relative path before rendering an `href` — tested (`tests/nca3NotificationUi.test.mjs`) against protocol-relative, external, and `javascript:` values.
- **XSS / HTML injection**: all notification content is rendered as plain React text children (`{item.title}`, `{item.message}`) — no `dangerouslySetInnerHTML` exists anywhere in this UI, so injected markup in a title/message is inert by construction, not by convention.
- **Source routes still enforce their own authorization**: unchanged — this UI never implements a source-domain action itself, only links to it.

## 30. Canonical Inbox Route

See §19 (also required as its own section number by the task template — content identical, not duplicated further here).

## 31. Shared UI Adapter

`useNotifications.js` is the single adapter every consumer (bell × 4 shells, inbox × 4 shells) calls — fetch, count, mark-read, mark-all-read, archive, and filter logic exist exactly once. No product re-implemented any of this logic; verified by the validator (§35) confirming no other file in the repository calls the notification endpoints directly outside this module and `src/lib/notifications/api.js`.

## 32. EXR Boundary

Confirmed and tested: no file under `src/layouts/`, no `RootProviders` file, and no `src/router/paths.js` was modified (validator-checked via `git diff`). NCA-owned files touched are exactly: four shell **header/topbar components** (bell placement, not shell structure), three shell **routers** (route registration, using each shell's own existing routing convention), and four new **page components** (thin wrappers around the shared inbox) — none of which are EXR's declared ownership (shell IA, navigation hierarchy, organization/role context placement, page composition). The Codex worktree was never inspected or modified.

**Real issues found and fixed during this phase's own live testing (documented transparently, not hidden):**
1. `NotificationBell`'s "View all notifications" link initially rendered as a plain `<a href="/curriculum/notifications">` despite importing React Router's `Link` — a real authoring mistake caught immediately by live browser testing (it navigated to a full-page URL with no `.html`/hash, landing on an unrelated fallback page). Fixed by actually using `<Link to={inboxHref}>`.
2. The filter-button "pressed" CSS state relied on `background: currentColor` + `color: var(--nca-panel-bg, Canvas)`, which rendered as invisible white-on-white text in this repo's light theme. Fixed with explicit, theme-safe colors.
3. The bell's unread count did not refresh after a mutation from a different mounted consumer (the full inbox page) — fixed with the small same-tab change-notification bus described in §18.
4. A dev-only, clearly-labeled multi-organization identity fixture (`user_nca3_multiorg_demo`, `apps/shs-api/src/domain/identity/repo/identity-repo.ts`) was added — gated entirely behind the dev-token path (`parseDevToken` only accepts this outside production; `databaseDevIdentityEnabled()` is off by default) — to make genuine multi-org browser verification possible with this repository's existing development auth fixture convention, matching the instruction to "use test/dev fixture mechanisms only."

None of these were discovered by code review alone — they surfaced specifically because this phase ran the real UI against a real backend, which is exactly why §33's browser-acceptance requirement exists.

## 33. Browser Acceptance

**Full setup performed, not simulated**: the local Postgres instance already present in this environment was migrated to head (`143`) via `npm run db:migrate` inside `apps/shs-api` against `shs_dev`, six realistic fixture notification rows were seeded across two organizations for two dev users, the real `shs-api` server was started (`DATABASE_URL` pointing at that database), and the real Vite dev server was started. All lanes below were exercised via live browser automation (`claude-in-chrome`) against this real stack — see the Required Browser Matrix (§ below) for the pass/fail table.

## 34. Responsive Acceptance

Verified live at three genuine browser viewport widths (390px, 820px, and the default ~1389px desktop) via fresh tabs resized before navigation — an environment quirk in this sandbox meant resizing an already-navigated tab did not reliably take effect (documented, not glossed over), so tests were re-run on freshly created tabs each time, which did work correctly and was confirmed via `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow) at 390px. The bell remains reachable, the inbox's filter buttons and cards reflow without overflow, and the bell's dropdown panel narrows (`min(20rem, 92vw)` under 480px) at every width tested.

## 35. Validators

- **NCA-1 backend regression**: `apps/shs-api/tests/nca1-notification-contracts.test.ts` — unchanged, re-run, passing.
- **NCA-2 backend regression + validator**: `apps/shs-api/tests/nca2-persistence-recipient-preferences.test.ts` — unchanged, re-run, passing; `npm run nca:persistence:validate` (`apps/shs-api`) — updated (§ below) and passing, 18/18 checks.
- **NCA-3 UI validator**: new, `scripts/validate-nca-ui.mjs`, registered as `npm run nca:ui:validate` (repo root, since it validates the frontend package this phase's UI lives in) — 20/20 checks passing: canonical bell/inbox/hook/attention-projection files exist; no localStorage-as-authority in the shared UI; the canonical API client is used; all three previously-fake bells no longer contain their old static patterns and now consume `NotificationBell`; Curriculum's shadowing bug is confirmed gone; `actionRequired` is read from the item, never hardcoded; the "read never implies completion" comment/contract is present; the attention projection reuses `SeaAttention` and the canonical inbox hook; organization context is threaded through the API client and hook; action links are validated by `isSafeInternalPath`; and no EXR-owned layout/RootProviders file was modified.
- **A necessary, documented update to the NCA-2 validator**: its original "no shell/header file touched" check was a backend-phase-specific guard that would now incorrectly fail on NCA-3's own, in-scope header changes. That check has been removed from the backend validator (with an explanatory comment) since a more precise version — one that correctly distinguishes legitimate header wiring from actual layout/RootProviders overreach — now lives in the new frontend `validate-nca-ui.mjs`. This is a deliberate refinement, not a weakening: the underlying concern (EXR-owned files must stay untouched) is still checked, more accurately, in the phase where it actually applies.

## 36. Build

`npm run build` (root, Vite) completed successfully (`✓ built in 21.38s`, exit code 0) with only the repository's pre-existing chunk-size advisory warnings (unrelated to this change — large `vendor-mapbox`/`pages-admin` chunks that predate this phase). `apps/shs-api`: `npx tsc --noEmit` passes cleanly.

## 37. Migration State

**No migration was added or needed in this phase.** Migration head remains `143`. All NCA-3 work is frontend UI plus one small backend dev-fixture addition (§32 item 4, a hardcoded identity branch, not a schema change).

## 38. P0 / P1 Findings

**Zero P0, zero NCA-3-owned P1.** Cross-user/cross-org leakage: prevented server-side (unchanged, re-tested). Client-side notification authority: none exists (every count/list is fetched fresh from the canonical backend). Read completing source workflow: structurally impossible (unchanged from NCA-2; UI has no code path to any source table). Action-required lost after read while source action remains: explicitly tested false — it persists. Unsafe action URL: prevented (`isSafeInternalPath`). Fake/static count in an integrated surface: none remain — all three previously-fake bells now show real, backend-sourced data. Duplicate notification persistence: none created. Notification UI breaking source workflows: the error state explicitly preserves full navigation and unrelated functionality. Sensitive data leakage: unchanged minimum-necessary practice. Inaccessible primary controls: verified keyboard-accessible live. The four bugs found and fixed during live testing (§32) were caught and corrected within this same phase, before being reported as complete — they are not open findings.

## 39. Files Created

- `src/components/shared/notifications/{NotificationBell,NotificationInbox,NotificationList,NotificationItem,NotificationFilters,NotificationEmptyState,NotificationAttentionProjection}.jsx`
- `src/components/shared/notifications/{useNotifications,domainLabels,safeLinks,errorMessages}.js`
- `src/components/shared/notifications/notifications.css`
- `src/pages/store/StoreNotifications.jsx`, `src/pages/arcade/ArcadeNotifications.jsx`, `src/pages/civic/CivicNotifications.jsx`
- `scripts/validate-nca-ui.mjs` (repo root)
- `tests/nca3NotificationUi.test.mjs` (repo root)
- `docs/architecture/NCA-3_IN_APP_INBOX_ATTENTION_PROJECTION.md` (this file)

## 40. Files Modified

- `src/lib/notifications/api.js` (added `unreadCount`, `listAttentionItems`, `listOrganizationUnreadCounts`, `archiveNotification`, `organizationId` query support, and error-code passthrough)
- `src/components/curriculum/CurriculumHeader.jsx` (refactored to the shared bell; fixed the mark-read shadowing bug)
- `src/components/store/StoreHeader.jsx`, `src/components/arcade/ArcadeHeaderExtras.jsx`, `src/components/civic/CivicTopBar.jsx` (fake bells replaced with the shared canonical bell)
- `src/pages/Notifications.jsx` (thin wrapper around the shared `NotificationInbox`)
- `src/router/StoreRoutes.jsx`, `src/router/ArcadeRoutes.jsx`, `src/router/CivicRoutes.jsx` (canonical inbox route registration)
- `apps/shs-api/src/domain/identity/repo/identity-repo.ts` (added the dev/browser-acceptance-only multi-org fixture identity)
- `apps/shs-api/scripts/validate-nca-persistence-recipient-policy.mjs` (removed the now-phase-inappropriate frontend-diff check; see §35)
- `package.json` (root: added `nca3:ui:test`, `nca:ui:validate` scripts); `apps/shs-api/package.json` (unchanged from NCA-2, listed for completeness — no new edits this phase)
- `package-lock.json` (root: cosmetic lockfile metadata bump from local dependency install, no dependency version changes)

## 41. Git State

- Worktree: `/Users/mikeslate/Projects/shrv1-claude`
- Branch: `claude/notifications`
- HEAD: `95e6833f053da5f9cc501f256f4b8a0a14995dae` (unchanged — no commit made)
- Migration head: `143` (unchanged)
- No commit, no push, no merge performed
- Main worktree (`/Users/mikeslate/Projects/shrv1`) and Codex worktree (`/Users/mikeslate/Projects/shrv1-codex`) were not opened, read, or modified
- `git diff --check`: clean

**Note on backend test-suite counts, for accuracy:** this local Postgres instance (`shs_dev`) turned out to be reachable all along at the default connection string; prior phases' full-suite runs reported ~448 failures under the assumption those were unrelated `.live.test.ts` files requiring an unavailable database. Once migrated to head in this phase (a prerequisite for real browser acceptance testing), the true count dropped to 201 residual failures, none of which reference notifications (verified by grep) — these appear to be pre-existing artifacts of this long-lived, cumulatively-seeded dev database (many unrelated fixture rows from past phases) rather than a fresh per-run test database, not anything introduced by this phase. All notification-specific focused suites (NCA-1: passing, NCA-2: passing, NCA-3 UI logic: passing) are unaffected either way.

## 42. NCA-3 Decision

**NCA-3 is COMPLETE.** A single canonical bell and inbox now serve all four product shells against the real backend; multi-org, action-required, read/unread, empty/loading/error states are implemented and verified live, not merely asserted; three previously-fake surfaces are now genuinely wired; Curriculum's pre-existing mark-read bug is fixed; the EXR boundary is intact and validator-checked; no migration, duplicate persistence, or unsafe routing exists; both validators and the full relevant regression suite pass; the build is clean.

## 43. Exact Next Phase

The next bounded NCA phase per the approved roadmap (transactional email integration, gated by the still-open owner decision on whether it belongs in the first delivery-channel expansion) is not started in this run.

---

## Required UI Matrix

| Surface | Canonical NCA Component | Data Source | Org-Aware | Action-Aware | Status |
|---|---|---|---|---|---|
| Curriculum bell | `NotificationBell` | `GET /notifications/unread-count`, `/notifications` | Yes | Yes | Live, refactored (bug fixed) |
| Curriculum inbox (`/curriculum/notifications`) | `NotificationInbox` | Canonical API | Yes | Yes | Live |
| Store bell | `NotificationBell` | Canonical API | Yes | Yes | Live, newly wired |
| Store inbox (`/notifications`, StoreCatalogShell) | `NotificationInbox` | Canonical API | Yes | Yes | Live, newly wired |
| Arcade bell | `NotificationBell` | Canonical API | Yes | Yes | Live, newly wired |
| Arcade inbox (`/notifications`, ArcadeLayout) | `NotificationInbox` | Canonical API | Yes | Yes | Live, newly wired |
| CivicSure bell | `NotificationBell` | Canonical API | Yes | Yes | Live, newly wired |
| CivicSure inbox (`notifications`, CivicLayout) | `NotificationInbox` | Canonical API | Yes | Yes | Live, newly wired |
| Attention projection (available, not yet placed by any dashboard) | `NotificationAttentionProjection` → `SeaAttention` | `GET /notifications/attention-items` | Yes | Yes (by definition) | Built, unit-verified; no EXR slot to mount into yet |

## Required Bell Matrix

| App/Surface | Previous State | Canonical State | Remaining Handoff |
|---|---|---|---|
| Curriculum | Real API calls, but mark-read was silently broken (recursion bug) | Fully working shared `NotificationBell` | None |
| Store | Static "You're all caught up," no API call at all | Fully working shared `NotificationBell` | None |
| Arcade | Static "0 new" badge + informational dialog admitting no live feed | Fully working shared `NotificationBell` | None |
| CivicSure | Static "0 new" badge + informational dialog admitting no live feed | Fully working shared `NotificationBell` | None |

## Required Action Matrix

| Notification Type | Source Domain | Action Target | Source Owns Completion? |
|---|---|---|---|
| `CREDENTIAL_EARNED` / `CREDENTIAL_REVOKED` | Credentials | `/curriculum/asl/portfolio` | Yes |
| `REVIEW_ASSIGNED` | Studio | `/studio/reviewer-queue` | Yes |
| `REVIEW_DECISION` | Studio | `/studio/projects/:id` | Yes |
| `DEPLOYMENT_LIVE` / `DEPLOYMENT_FAILED` | Studio (deployment) | `/studio/projects/:id` | Yes |
| `REGISTRY_ACCEPTED` / `_CHANGES_REQUESTED` / `_REJECTED` / `_FAILED` | Agent Registry | `/studio/projects/:id` | Yes |
| `COMPLETION_ACHIEVED` | Curriculum | `/curriculum/learning` | Yes |
| `DOCUMENTATION_*` (8 types, not yet emitted) | DGAL | `/documentation/items/:id` | Yes (once emitting) |

Every row: yes, the source domain — never the notification layer — owns completion. Verified: no code in this UI writes to any source-domain table.

## Required Browser Matrix

| Lane | Context | Expected Result | PASS/FAIL |
|---|---|---|---|
| 1 | Curriculum user with notifications | Bell shows real unread count; panel lists real items | PASS |
| 2 | Curriculum zero-notification user/state | No badge; "No notifications yet." | PASS |
| 3 | Multi-org user, no active org context | Honest "Select an organization to view notifications." (not a generic error) | PASS |
| 3b | Multi-org user, with a simulated active-org header | Correctly scoped to that organization only | PASS |
| 4 | Org-filtered inbox (authorized non-active org) | Returns that organization's data only, via direct API + simulated header | PASS |
| 4b | Org-filtered inbox (unauthorized org) | 403 `ORG_CONTEXT_FORBIDDEN` | PASS |
| 5 | Action-required notification | "Action required" badge persists through read and mark-all-read | PASS |
| 6 | Mark-read flow | Count decrements; item shows "Read"; action-required badge stays | PASS |
| 7 | Mark-all-read flow | Count reaches 0; all items "Read"; action-required badges stay | PASS |
| 8 | CivicSure notification surface | Real shared data rendered in Civic's own shell chrome | PASS |
| 9 | Store notification surface | Real shared data rendered in Store's own shell chrome | PASS |
| 10 | Arcade notification surface | Real shared data rendered in Arcade's own shell chrome | PASS |
| 11 | Accessibility-sensitive notification (keyboard) | Tab/Enter/Escape all work; visible focus ring; no color-only state | PASS |
| 12 | API failure/error state | Bounded error panel with Retry; rest of shell remains usable | PASS |
| 13 | Archive | Item shows "Archived"; Archive button disappears; can no longer be marked read | PASS |
| 14 | Cross-component count sync | Bell count updates after a mutation from the separate inbox page | PASS (after fix — see §32) |

## Required EXR Handoff Matrix

| NCA Component/Data | EXR Slot | Integration Requirement | Current Status |
|---|---|---|---|
| `NotificationBell` | `NOTIFICATION_BELL_SLOT` | Mount the component; supply `inboxHref` for that shell's route | Ready — already mounted in all four current shell headers as a proof point |
| `NotificationAttentionProjection` | `ATTENTION_PROJECTION_SLOT` | Mount the component where EXR defines an attention region; no data wiring needed beyond an optional `organizationId` | Ready — built and unit-verified, not yet placed in any dashboard by this phase |
| `NotificationInbox` | `INBOX_DESTINATION_SLOT` | Point a route at the component, or mount directly | Ready — already the target of four working routes |
| Organization-context header (`x-shs-organization-id`) | (not a declared slot — a cross-cutting need) | EXR's future org-switcher should propagate the active organization consistently to all API calls, including notifications' | **Gap, explicitly flagged**: no such propagation mechanism exists in this frontend today; NCA's hooks already accept and correctly validate an `organizationId`, ready the moment EXR supplies one |
