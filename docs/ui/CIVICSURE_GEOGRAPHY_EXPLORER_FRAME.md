# CivicSure Geography Explorer — Page Frame

Phase implementation note, same discipline as the Program/Provider/
County Detail frame docs. This page is a **visual/layout frame
only** — no live GPA/CivicSure data, real map SDK, or real query
engine are wired. See "What remains intentionally unwired" below
before building on it.

## Route

`#/explorer/geography`, registered in `apps/shf-web/src/routes/index.jsx`
as an exact-match route (no `:param`), alongside Explorer and the
three detail routes.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit `/#/explorer/geography`.

## Shared-primitive refactor before this page was built

Before writing this page, `StatusBadge.jsx`'s vocabulary was extended
with three states this page introduces (`on-track`, `evidence-pending`,
`not-yet-evaluated`) — all green/blue tones, no new amber/red states,
keeping the "amber/red for exceptions only" rule intact. This is an
additive change; Provider Detail's and County Detail's existing usages
are unaffected (verified live — see Validation).

## Map reuse — extended, not duplicated

`GeographyMapWorkspace.jsx` reuses the Explorer main page's CSS-gradient
map illustration classes (`.cse-map-panel`, `.cse-map-panel__illustration`,
`.cse-map-panel__labels`, `.cse-map-highway`, `.cse-map-zoom` — all
shared primitives in `civicsure-explorer.css`) for the same
"real-map-like" cool-blue background. It does **not** reuse
`ExplorerMapPanel.jsx` as a component: that component's API (one
static overlay card) can't cleanly support four different
mode-dependent marker treatments plus clickable clusters without
becoming fragile, so this page has its own dedicated marker layer
built on the same visual language instead — per this page's brief,
"Do not force reuse if doing so would make the component fragile."

`CountyMapPanel.jsx` (County Detail), by contrast, genuinely reuses
`ExplorerMapPanel.jsx` as a component, because its needs (one static
overlay) match that component's API exactly. The two pages made
different, deliberate reuse decisions for the same underlying
component depending on fit.

`ExplorerMapPanel.jsx` itself gained optional `overlayTitle`/
`overlayStats`/`actionHref`/`actionLabel`/`mapLabel` props during the
County Detail build (all default to the Explorer main page's original
values, so that page's own usage is unaffected) — Geography Explorer
does not add to that component; it only reuses its CSS.

## Components

All under
`apps/shf-web/src/pages/civicsure/explorer/components/geography-explorer/`,
plus the top-level page and mock data at the `explorer/` root:

- `CivicSureGeographyExplorerPage.jsx` — top-level page; owns all
  local state (`filters`, `mapMode`, `viewMode`, `selectedCountyKey`,
  `aboutDataOpen`, `lastSearchedLabel`) and the chip-derivation/
  removal logic.
- `GeographyExplorerHeader.jsx` — eyebrow/headline/copy and the
  "About this data" drawer trigger.
- `GeographyContextBar.jsx` — removable chips (`Ohio × All Program
  Categories × FY2026 × Active`, plus dynamic Funding Source/County
  chips) and "Clear all" — real local state, verified live: checking
  a Program Category checkbox changes the chip label, and removing
  that chip via its "×" (found via the accessibility tree —
  `aria-label="Remove Education filter"`) reverts both the chip and
  the checkbox.
- `GeographySummaryMetrics.jsx` — four Ohio-wide cards, its own
  4-column grid class (same precedent as Provider Detail's
  `ProviderSummaryMetrics.jsx`, since the shared `.cse-metrics` is a
  5-column grid).
- `GeographyFilterSidebar.jsx` — Geography (State is static text, not
  a fake single-option dropdown; County and City are real selects),
  Program Category checkboxes, Funding Source/Assurance Status/
  Reporting Period selects, the "Showing N of 24" note, and
  `GeographyCountyList`. Real controlled inputs, but per this page's
  brief ("No live query execution yet") none of them changes what the
  map/results actually render — only the County select and County
  Quick List feed the shared `selectedCountyKey` state (a genuine,
  narrower connection, not a full query).
- `GeographyCountyList.jsx` — six county buttons (Franklin, Delaware,
  Licking, Fairfield, Pickaway, Madison); clicking one sets
  `selectedCountyKey` — real buttons, never dead links (only Franklin
  links out, and only from the Selected Geography Panel, not here).
- `GeographyMapWorkspace.jsx` — the map illustration, four
  mode-dependent marker treatments, the mode toggle, "Search this
  area", and the map zoom controls (inert, matching
  `ExplorerMapPanel`'s own zoom buttons).
- `GeographyViewModeToggle.jsx` — "Map | List", reusing the exact
  `.cse-view-toggle` markup/class the Explorer main page's
  `ExplorerFilters.jsx` already uses for its own List/Map toggle.
- `GeographyLegend.jsx` — text-based legend, mode-dependent; every
  swatch is paired with a text label (never color-only).
- `GeographySelectedAreaPanel.jsx` — the floating overlay card;
  Franklin County gets a real `#/explorer/counties/franklin-county`
  link (verified live), every other county shows an honest "County
  Detail page coming soon" placeholder.
- `GeographyResultsList.jsx` — 8 program/provider rows (of a stated
  24), each tagged with a `countyKey`; rows matching the selected
  county are highlighted, and clicking a row's main area sets the
  selected county — real two-way sync with the map, verified live in
  both directions. Doubles as the map's accessible alternative (every
  marker's county has real rows here), per this page's accessibility
  requirement that the map is never the only way to reach program/
  location information.
- `GeographyAboutData.jsx` — accessible drawer mirroring Provider/
  County Detail's pattern, with the extra Geographic Coverage and
  Data Dictionary fields this page's brief calls for.

## Map ↔ Results synchronization (verified both directions)

- Clicking a map cluster (a county marker) updates
  `selectedCountyKey`, which updates the Selected Geography Panel and
  highlights that county's rows in the results list below.
- Clicking a result row's main area does the same, in reverse —
  confirmed live: clicking "Delaware County Youth Mentoring" moved the
  Selected Geography Panel and the map's selection ring to Delaware
  County.
- The County Quick List and the sidebar's County select are a third,
  equivalent way to do the same thing — all three write to the same
  `selectedCountyKey` state, so there's exactly one source of truth.

## A bug found and fixed during responsive validation

At the ≤760px breakpoint, `GeographySelectedAreaPanel` was initially
made `position: static; width: 100%` so it would "stack" instead of
float. This overlapped the map illustration underneath it, because
`.cse-map-panel__illustration` (a shared primitive) is
`position: absolute; inset: 0` and doesn't respond to a preceding
static sibling's height — the panel and the illustration both started
at the same vertical position. Fixed by following the precedent
already set by `ExplorerMapPanel`'s own overlay card, which the
Explorer main page never repositions at mobile either — it just stays
a small floating card at every width. The mobile override was changed
from repositioning the panel to only narrowing it slightly (200px).
Re-verified: no horizontal overflow before or after the fix, and the
overlap is gone.

## Mock data

`apps/shf-web/src/pages/civicsure/explorer/geographyExplorerMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. Franklin
County's numbers are pulled from `countyDetailMockData.js`'s
`getCountyDetail("franklin-county")` (imported, not duplicated), so
the two pages never show conflicting figures for the same county. The
other five counties (Delaware, Licking, Fairfield, Pickaway, Madison)
carry their own small illustrative metrics so the Selected Geography
Panel has something honest to show for any of them.

Result rows whose `programId`/`providerId` matches an id already
built in `programDetailMockData.js` / `providerDetailMockData.js` get
a real "Explore" link (3 of 8 rows); the rest render an inert "Not yet
available" placeholder.

## What remains intentionally unwired

- No live GPA/CivicSure data, map SDK, or real query engine — every
  fact, marker, and cluster comes from `geographyExplorerMockData.js`.
- Filter sidebar controls (category, funding source, assurance status,
  reporting period, city) are real controlled inputs but do not filter
  what the map/results list render — per this page's brief.
- "Search this area" sets a local status message only; it does not
  re-query anything.
- 5 of 6 counties and 5 of 8 results have no real detail page yet —
  both render honest, inert placeholders rather than dead links.
- Local state is shaped for future URL query-string addressability
  (`filters.county/city/categories/fundingSource/assuranceStatus/period`,
  `mapMode`, `viewMode`, `selectedCountyKey`) but is not actually
  synced to the URL in this phase — doing so would require the
  existing hashchange-driven router to remount the whole page on every
  filter change (since `AppRoutes` re-renders on `hashchange`), which
  was judged not "trivial" enough for this phase per the brief.

## Visual source

The approved CivicSure Geography Explorer mock (provided directly in
the task). Palette, layout proportions (≈30/70 sidebar/map split), and
component boundaries follow the same locked CivicSure public design
system as every other page in this suite.
