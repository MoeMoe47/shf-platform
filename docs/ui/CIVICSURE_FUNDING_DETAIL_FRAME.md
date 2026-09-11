# CivicSure Funding Detail / Follow the Money — Page Frame

Phase implementation note, same discipline as every other page frame
in this suite. This page is a **visual/layout frame only** — no live
GPA/CivicSure data, Shared Reporting, or a real assurance engine are
wired. See "What remains intentionally unwired" below before building
on it.

## Route

`#/explorer/funding/:fundingId`, registered in
`apps/shf-web/src/routes/index.jsx` alongside the other detail routes.
Matched with a small regex (`/^#\/explorer\/funding\/([^/]+)$/`).
Demo id: `ohio-workforce-innovation-fund`. Unknown ids render a
"Funding record not found" state.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit
`/#/explorer/funding/ohio-workforce-innovation-fund`.

## Money Flow architecture (the signature piece)

The centerpiece — `FundingMoneyFlowPanel.jsx` — is a horizontal,
8-step, **selectable** lineage: Funding Source → Award → Program →
Provider → Obligation → Delivery → Evidence → Outcome. It is a fresh
component, not a reuse of `FollowTheMoneyCard.jsx` (that component
renders one static, non-interactive 7-step illustration with no
per-step data or branching — this page needed 8 selectable,
data-driven nodes plus real branching, which is a different job).

**Branching, without a graph library**: one award funds multiple
programs. `moneyFlow.programs` in `fundingDetailMockData.js` is an
array of three "branches" (Clean Energy Workforce Training / Youth
Career Launch / Infrastructure Skills Initiative), each carrying its
own Program → Provider → Obligation → Delivery → Evidence → Outcome
chain. A row of branch chips beneath the lineage lets the visitor pick
which chain the Program/Provider/Obligation/Delivery/Evidence/Outcome
nodes display — Funding Source and Award stay constant since they're
shared by every branch. Verified live: switching branches updates all
five downstream nodes and the detail panel in one click.

**Selection state**: `selectedLevel` (which of the 8 steps) and
`selectedProgramKey` (which branch) live in `FundingMoneyFlowPanel.jsx`.
Clicking any node sets `selectedLevel`; clicking a branch chip sets
both `selectedProgramKey` and `selectedLevel: "program"`.
`FundingFlowDetailPanel.jsx` reads both to render the selected node's
name, amount, source authority, reporting period, status, plain-English
explanation, and previous/next step labels (a text equivalent for the
flow arrows, not just an arrow glyph) — plus a real "Explore Program"/
"Explore Provider" action for the one branch (Clean Energy Workforce
Training / Community Future Network) that matches an already-built
demo detail page; the other two branches show an honest "not yet
available" placeholder instead of a dead link. Verified live in both
directions (Program and Provider nodes on the Clean Energy branch).

**Reconciliation**: a separate summary below the lineage
(`FundingReconciliationPanel.jsx`) with its own "How these totals
relate" expand-in-place explanation — not tied to node selection,
since the reconciliation totals (Authorized → Awarded → Allocated to
programs → Provider contracts → Expended → Unreconciled) describe the
whole award, not one branch.

## Plain-language accounting terms

Locked CivicSure UX principle: every accounting term ships with an
**always-visible** plain-English definition, never a hover-only
tooltip. `FINANCIAL_TERM_DEFINITIONS` in `fundingDetailMockData.js`
holds one definition each for Authorized/Awarded/Obligated/Expended/
Remaining; `FundingOverviewPanel.jsx`'s `FinancialTerm` sub-component
renders the term, its value, and its definition together for every row
in Key Financial Position (Authorized, Awarded, Obligated, Expended,
Unawarded, Unspent Obligated — the latter two both use the "Remaining"
definition, since both describe money not yet spent).

## Tabs

Overview, Money Flow, Programs, Providers, Delivery, Evidence,
Outcomes, Timeline — `role=tablist`/`role=tab`, same pattern as every
other detail page's tab strip in this suite. All 8 confirmed working
live.

- **Programs/Providers**: reuse the same `funding.moneyFlow.programs`
  data the Money Flow tab uses (one data source, not two lists to keep
  in sync). Real "Explore" links only where a matching demo id exists.
- **Delivery**: target vs. actual with units and reporting period on
  every row — never a bare number.
- **Evidence**: public-safe metadata only (type, related program/
  provider, period, covers, verification, availability, last
  reviewed) — no raw private records. One row is explicitly
  "Restricted (Operator Only)" to show not everything is public.
- **Outcomes**: five-outcome chain, no universal score. Employment
  Retention is honestly marked "n/a — not yet due" rather than
  fabricating a number for a metric that isn't measured yet.
  "Methodology" per row opens the existing About This Data drawer
  (real interaction) instead of duplicating methodology text five
  times.
- **Timeline**: a vertical rail-and-dot list, no chart library —
  ten lifecycle events from authorization through current status.

## Right-column trust content (Overview tab)

`FundingAssuranceSnapshot.jsx` (checklist + a real "Why these
results?" expand-in-place explanation), `FundingReportCard.jsx` (the
"Assurance Report" section — `View Report` is an inert, clearly
labeled demo placeholder since no Shared Reporting connection exists
yet), and `FundingGeographyPanel.jsx` (distribution list + a real
"Explore on map" link to `#/explorer/geography`, verified live) —
same stacked-cards pattern established by Provider/County Detail's
right columns.

`FundingDataQualityNotice.jsx` sits in the left column instead,
directly under Key Financial Position — the brief calls for funding
gaps to be displayed openly, not tucked into a corner.

## Mock data

`apps/shf-web/src/pages/civicsure/explorer/fundingDetailMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. The
Clean Energy Workforce Training branch intentionally reuses
Community Future Network (`providerId: "community-future-network"`)
and Clean Energy Workforce Training (`programId:
"clean-energy-workforce-training"`) — both already-built demo pages,
already linked to each other in `providerDetailMockData.js` — so this
page's Programs/Providers/Money-Flow tabs link to real, working pages
rather than placeholders. The other two branches (Youth Career Launch,
Infrastructure Skills Initiative) are fictional on purpose, to
demonstrate the honest "not yet available" treatment.

## A real bug found and fixed during responsive validation

**`.cse-metrics` grid overflow**: the shared 5-column metric-card grid
(used by Explorer, County Detail, Geography Explorer, and this page)
used bare `1fr` tracks (`repeat(n, 1fr)` ≡ `repeat(n, minmax(auto, 1fr))`),
which lets a track grow past its fair share to fit a card's
min-content width. Every prior page's card labels were short enough
to never trigger this; this page's "Remaining Obligated" label was
long enough to push the 2-column mobile grid to 410px inside a 390px
viewport. Fixed by changing all three `.cse-metrics` breakpoints
(5/3/2-column) to `minmax(0, 1fr)` in `civicsure-explorer.css` —
correct, standard fix with zero visual change wherever content already
fit. Verified live on Explorer, County Detail, and this page after the
fix.

**`.cse-table-wrap` phantom horizontal scroll**: the shared table-wrap
primitive's own box was always correctly sized and clipped its table
internally (confirmed via `getBoundingClientRect`), but a sufficiently
wide table (this page's 8-column Outcomes table, vs. 6–7 columns on
every prior page) could still make `document.documentElement.scrollWidth`
exceed the viewport, and the page could actually be scrolled into a
blank, content-free region — a real (if low-severity) issue by this
suite's own "no horizontal overflow" standard. Fixed by adding
`max-width: 100%; contain: paint;` to `.cse-table-wrap` in
`civicsure-explorer.css`, which forces true visual/scroll containment
regardless of a descendant table's intrinsic width. Verified live
(`window.scrollX` genuinely stays `0` after attempting to scroll)
across all 8 tabs, and re-verified County Detail's own Outcomes table
still renders identically after the fix.

## What remains intentionally unwired

- No live GPA/CivicSure data, Shared Reporting, or a real assurance
  engine — everything comes from `fundingDetailMockData.js`.
- Share and View Assurance Report (header) — inert placeholders, no
  share sheet or report system.
- Follow is a real local toggle but does not persist.
- Programs/Providers tabs show 3 of a claimed 12 (explicit "showing N
  of 12" notes, not hidden).
- Two of the three program branches have no real Program/Provider
  Detail page yet — inert placeholders, not dead links.
- The Assurance Report section is a static demo card; no real Shared
  Reporting connection exists.

## Visual source

The approved CivicSure Funding Detail mock (provided directly in the
task). Palette, tab structure, and the Money Flow node/branch/detail
pattern follow the same locked CivicSure public design system as
every other page in this suite (`--cse-*` tokens: pale civic blue,
institutional blue, deep navy, restrained green/blue/amber for
verified/informational/exception states — no fintech neon, no Sankey
complexity, no fake accounting visualizations).
