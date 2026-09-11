# CivicSure County Detail — Page Frame

Phase implementation note, same discipline as
`CIVICSURE_PROGRAM_DETAIL_FRAME.md` and
`CIVICSURE_PROVIDER_DETAIL_FRAME.md`. This page is a **visual/layout
frame only** — no live GPA/CivicSure data, real assurance engine, or
backend writes are wired. See "What remains intentionally unwired"
below before building on it.

## Route

`#/explorer/counties/:countyId`, registered in
`apps/shf-web/src/routes/index.jsx` alongside Explorer, Program
Detail, and Provider Detail. Matched with a small regex
(`/^#\/explorer\/counties\/([^/]+)$/`), same pattern as the other two
detail routes. Unknown `countyId` values render an honest "County not
found" state.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit
`/#/explorer/counties/franklin-county`.

## Shared-primitive refactor (done before this page was built)

Before writing County Detail, three pieces of Provider Detail that
were genuinely reusable — not page-specific — were promoted into
`civicsure-explorer.css` (the stylesheet every public Explorer/detail
page already imports for `cse-btn`/`cse-pill`/`cse-card`/
`cse-metric-card`/`cse-container`/`cse-nav`), so County Detail could
use them from day one instead of a third copy-paste:

- **`StatusBadge.jsx`** (`apps/shf-web/src/pages/civicsure/explorer/components/StatusBadge.jsx`,
  styled by the new `.cse-status-badge` class) replaces the old
  `provider-detail/ProviderStatusBadge.jsx` (deleted). Provider
  Detail's Outcomes/Evidence/Compliance panels and
  `ProviderAssuranceStatus.jsx` were updated to import the shared
  component; behavior and appearance are unchanged (verified live —
  see Validation).
- **`.cse-table` / `.cse-table-wrap`** (was `.cse-pvd-table*`) — the
  data-table primitive used by both Provider Detail's and County
  Detail's Outcomes/Evidence tabs.
- **`.cse-metric-card--amber`** (was defined only in
  `civicsure-program-detail.css`) — needed by County Detail's Open
  Exceptions metric card, alongside the `--green` variant that was
  already shared.

Each page still owns its own layout CSS (header, hero, tab-strip,
funding grid, drawer) — only the small, literally-identical vocabulary
pieces were consolidated. Deliberately **not** consolidated: the
tab-strip CSS (`cse-pd-tab`/`cse-pvd-tab`/`cse-cty-tab` each stay
page-local, matching the established "Explorer-local tokens" precedent
already documented in `civicsure-explorer.css`'s own header comment).

## Components

All under
`apps/shf-web/src/pages/civicsure/explorer/components/county-detail/`,
plus the top-level page and mock data at the `explorer/` root:

- `CivicSureCountyDetailPage.jsx` — top-level page; owns the two bits
  of local state (`activeTab`, `aboutDataOpen`).
- `CountyDetailHeader.jsx` — back link, name/meta/description, Share
  (placeholder) and Follow (real local toggle). No status pill (county
  identity, unlike a program or provider, doesn't carry one in this
  brief).
- `CountySummaryMetrics.jsx` — five summary metric cards, reusing
  `.cse-metrics` (the same 5-column grid class the Explorer main
  page's own metric row already uses) rather than a new grid class.
- `CountyDetailTabs.jsx` — Overview/Programs/Funding/Providers/
  Outcomes/Evidence tab strip (role=tablist/tab, same pattern as
  Program/Provider Detail's tab strips).
- `CountyMapPanel.jsx` — a **thin wrapper around the existing
  `ExplorerMapPanel.jsx`** (built for the Explorer main page), not a
  second CSS-gradient map. See "Map panel reuse" below.
- `CountyOverviewPanel.jsx` — Overview tab: facts + plain-English
  landscape summary + Program Categories bars on the left; the map and
  assurance snapshot on the right.
- `CountyAssuranceSnapshot.jsx` — "County Assurance Snapshot" checklist
  with a real "Why these results?" action (local tab switch to
  Evidence — the "every status needs a path to explanation" principle,
  same idea as Program Detail's "Why this status?" and Provider
  Detail's "View compliance details"). Uses the shared `StatusBadge`.
- `CountyProgramsPanel.jsx` — Programs tab; "Explore Program" is a
  **real** link into the existing Program Detail frame for every row
  (all four demo programs already have a built detail page).
- `CountyFundingPanel.jsx` — Funding tab; stats, three funding lists,
  and a county-specific "Follow the Money" lineage card. See "Funding
  lineage" below for why this isn't a second copy of
  `FollowTheMoneyCard.jsx`.
- `CountyProvidersPanel.jsx` — Providers tab; "Explore Provider" is a
  real link only for the one row (`community-future-network`) whose id
  matches a built demo provider — the rest render an inert "Not yet
  available" placeholder rather than a dead link.
- `CountyOutcomesPanel.jsx` / `CountyEvidencePanel.jsx` — the shared
  `.cse-table` primitive; Outcomes never shows a bare percentage
  (always paired with target + denominator + evidence coverage).
- `CountyAboutData.jsx` — accessible "About this data" drawer,
  mirroring (not importing) Provider Detail's drawer accessibility
  pattern — role="dialog", aria-modal, focus moved to the close button
  on open, Escape closes, overlay click closes. Adds a Data Dictionary
  field beyond Provider Detail's version, per this page's brief.

## Map panel reuse

`CountyMapPanel.jsx` renders `<ExplorerMapPanel />` directly instead of
a second CSS-gradient map implementation. To make that reuse work
without breaking the Explorer main page's existing usage,
`ExplorerMapPanel.jsx` gained optional props (all default to its
original Explorer-page values, so `<ExplorerMapPanel />` with no props
is 100% unchanged):

- `overlayTitle` / `overlayStats` — County Detail passes this county's
  own `mapOverlayStats` (Active Programs / Total Funding / Verified
  Outcomes / **Open Exceptions** — a different 4th stat than the
  Explorer page's default "On Track").
- `actionHref` / `actionLabel` — the "View County Details" link is now
  **optional**: the Explorer main page passes
  `actionHref="#/explorer/counties/franklin-county"` (previously a
  dead `#/explorer` placeholder — now a real link, verified working
  live), while County Detail itself omits the prop, since a link back
  to the page you're already on would be a dead end.

## Funding lineage (not a second Follow the Money widget)

The brief asks for a county-specific lineage — Funding Source →
**County** → Program → Provider → Delivery → Evidence → Outcome —
which is a different sequence than `FollowTheMoneyCard.jsx`'s
generic one (no "County" step, has "Obligation"). `CountyFundingPanel.jsx`
reuses that component's CSS classes (`.cse-ftm__head`, `.cse-ftm__flow`,
`.cse-ftm__step`, `.cse-ftm__arrow`, `.cse-ftm__footer` — all shared
primitives in `civicsure-explorer.css`) with this county's own step
data, rather than either misrepresenting the sequence by reusing the
component as-is, or showing two near-identical widgets on the same
tab. Verified live that the Explorer main page's own
`FollowTheMoneyCard` still renders its original 7 steps unchanged.

## Mock data

`apps/shf-web/src/pages/civicsure/explorer/countyDetailMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA` in its file
header. Contains one county record, `franklin-county`, covering every
field the Overview, Programs, Funding, Providers, Outcomes, Evidence,
Assurance Snapshot, and About-This-Data sections need.
`getCountyDetail(countyId)` returns `null` for an unknown id.

`programs[].programId` values reuse the four demo program ids from
`civicsureExplorerMockData.js` (all four already have a built Program
Detail page). `providers[].providerId` is set only for
`community-future-network` (the one built demo provider) — the other
three provider rows omit it and render as an inert placeholder rather
than a dead link.

## What remains intentionally unwired

- No live GPA/CivicSure data, funding/outcomes/evidence/assurance
  records, or a real assurance engine — everything comes from
  `countyDetailMockData.js`.
- Share has no wired destination (no share sheet) — inert,
  `aria-disabled` placeholder with an explicit `aria-label`.
- Follow is a real local toggle but does not persist.
- Programs/Providers tabs show 4 of the county's claimed 248/312
  totals (explicit "showing N of M" notes, not hidden).
- Three of the four provider rows have no real Provider Detail page
  yet — their "Explore Provider" action is an inert placeholder.

## Visual source

The approved CivicSure County Detail mock (provided directly in the
task). Palette, tab structure, and component boundaries follow the
same locked CivicSure public design system as Explorer, Program
Detail, and Provider Detail (`--cse-*` tokens: pale civic blue,
institutional blue, deep navy, restrained green/blue/amber for
verified/informational/exception states).
