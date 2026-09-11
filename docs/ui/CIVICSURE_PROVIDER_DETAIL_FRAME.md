# CivicSure Provider Detail — Page Frame

Phase implementation note, same discipline as
`CIVICSURE_PROGRAM_DETAIL_FRAME.md`. This page is a **visual/layout
frame only** — no live data, real assurance engine, or backend
writes are wired. See "What remains intentionally unwired" below
before building on it.

## Route

`#/explorer/providers/:providerId`, registered in
`apps/shf-web/src/routes/index.jsx` alongside the Explorer and
Program Detail routes. Matched with a small regex
(`/^#\/explorer\/providers\/([^/]+)$/`), same pattern as the Program
Detail route. Unknown `providerId` values render an honest
"Provider not found" state rather than a blank or broken page.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit
`/#/explorer/providers/community-future-network`.

### Router fix carried over from Program Detail

`AppRoutes` previously read `window.location.hash` once per render
with nothing subscribing to `hashchange`, so an in-app
`<a href="#/...">` click updated the URL without re-rendering. That
was already fixed (see the Program Detail frame doc) before this page
was built, so Provider Detail relies on that fix rather than
reintroducing it.

## Components

All under
`apps/shf-web/src/pages/civicsure/explorer/components/provider-detail/`,
plus the top-level page and mock data at the `explorer/` root:

- `CivicSureProviderDetailPage.jsx` — top-level page; owns the two
  bits of local state (`activeTab`, `aboutDataOpen`).
- `ProviderDetailHeader.jsx` — back link, name/status/meta/description,
  Share (placeholder) and Follow (real local toggle).
- `ProviderIdentityPanel.jsx` — hero card (logo placeholder + compact
  fact strip + mission), visible on every tab.
- `ProviderSummaryMetrics.jsx` — four summary metric cards, visible on
  every tab.
- `ProviderDetailTabs.jsx` — Overview/Programs/Funding/Outcomes/
  Evidence/Compliance tab strip (role=tablist/tab, same pattern as
  `ExplorerSectionNav.jsx` and Program Detail's `ProgramDetailTabs.jsx`
  — no roving-tabindex keyboard handling, consistent with that
  established convention).
- `ProviderOverviewPanel.jsx` — Overview tab: fact sheet + mission on
  the left, `ProviderAssuranceStatus` on the right.
- `ProviderAssuranceStatus.jsx` — "Assurance Status" panel with a real
  "View compliance details" action (local tab switch to Compliance —
  the "every status needs a path to explanation" principle, same idea
  as Program Detail's "Why this status?" checklist).
- `ProviderProgramsPanel.jsx` — Programs tab; each row's "Explore
  Program" is a **real** link into the existing Program Detail frame.
- `ProviderFundingPanel.jsx` — Funding tab; reuses the existing
  `FollowTheMoneyCard.jsx` component (built for the Explorer main
  page) for the "Follow the Money" action instead of re-implementing
  the 7-step lineage flow.
- `ProviderOutcomesPanel.jsx` / `ProviderEvidencePanel.jsx` — semantic
  `<table>`s (with `scope` on header cells) wrapped in an
  `overflow-x: auto` container, so a wide table scrolls inside its own
  box on narrow screens instead of forcing page-level horizontal
  scroll.
- `ProviderCompliancePanel.jsx` — reporting/reconciliation, open
  exceptions, corrective actions, audit findings, documentation status.
- `ProviderStatusBadge.jsx` — shared status vocabulary (Verified /
  Current / Pending Review / Open Exception / Corrective Action) used
  by Outcomes, Evidence, and Compliance rows. Text label always
  renders; color is a restrained accent (green/blue/amber), never the
  sole carrier of meaning.
- `ProviderAboutData.jsx` — accessible "About this data" drawer
  (role="dialog", aria-modal, focus moved to the close button on open,
  Escape closes, overlay click closes).

## Cross-page reuse (not duplication)

- **Programs tab → Program Detail**: `provider.programs[].programId`
  values in `providerDetailMockData.js` intentionally match ids
  already defined in `civicsureExplorerMockData.js` /
  `programDetailMockData.js`, so "Explore Program" is genuine
  navigation into the already-built
  `#/explorer/programs/:programId` frame, not a placeholder.
- **Funding tab**: reuses `FollowTheMoneyCard.jsx` as-is rather than
  rebuilding the 7-step lineage flow.
- **Visual primitives**: `cse-btn`, `cse-pill`, `cse-card`,
  `cse-metric-card`, `cse-container`, `cse-nav`, and the skip-link are
  reused from `civicsure-explorer.css` — `civicsure-provider-detail.css`
  only adds page-specific layout (header, hero, tabs, tables, status
  badges, drawer), following the same per-page-stylesheet-with-shared-
  token-duplication convention as `civicsure-program-detail.css` and
  `civicsure-public-footer.css`.
- **Icons**: reuses `explorerIcons.jsx`; added two small icons to that
  shared set (`chevronLeft`, `close`) rather than forking a
  page-local icon file.

## Mock data

`apps/shf-web/src/pages/civicsure/explorer/providerDetailMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA` in its file
header. Contains a single provider record, `community-future-network`
("Community Future Network"), covering every field the Overview,
Programs, Funding, Outcomes, Evidence, Compliance, and About-This-Data
sections need. `getProviderDetail(providerId)` returns `null` for an
unknown id so the page can render a "not found" state instead of
guessing.

The Programs tab shows 4 of the provider's claimed "12 active
programs" (a `programsShownNote` string says so explicitly) — the same
restrained-sample precedent the Explorer main page already set (248
programs claimed, 4 shown).

## What remains intentionally unwired

- No live GPA/CivicSure data, funding/outcomes/evidence/compliance
  records, or a real assurance engine — everything on this page comes
  from `providerDetailMockData.js`.
- Share has no wired destination (no share sheet) — renders as an
  inert, `aria-disabled` placeholder with an explicit `aria-label`
  so it doesn't announce as just "Coming soon" to assistive tech.
- Follow is a real local toggle but does not persist or reach any
  backend.
- This page does not implement Shared Reporting, Public Disclosure,
  Credential, Truth, or Evidence authority, and does not touch GPA,
  provider/program persistence, Legal, or credentials in any way.

## Visual source

The approved CivicSure Provider Detail mock (provided directly in the
task). Palette, tab structure, and component boundaries follow the
same locked CivicSure public design system as Explorer and Program
Detail (`--cse-*` tokens: pale civic blue, institutional blue, deep
navy, restrained green/amber for verified/exception states).
