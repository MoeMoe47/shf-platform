# CivicSure Agency / Department Detail — Page Frame

Phase implementation note, same discipline as every other page frame
in this suite. This page is a **visual/layout frame only** — no live
GPA/CivicSure data, Shared Reporting, or a real assurance engine are
wired. See "What remains intentionally unwired" below before building
on it.

## Route

`#/explorer/agencies/:agencyId`, registered in
`apps/shf-web/src/routes/index.jsx` alongside the other detail routes.
Matched with a small regex (`/^#\/explorer\/agencies\/([^/]+)$/`).
Demo id: `ohio-department-workforce-development`. Unknown ids render
an "Agency not found" state (verified live for `nonexistent-agency-xyz`).

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit
`/#/explorer/agencies/ohio-department-workforce-development`.

## Agency UX role

An Agency/Department Detail page answers a different question than
Program or Provider Detail: not "did this one thing work?" but "is
this whole part of government administering its programs, funding,
and providers honestly?" It sits one level above Program/Provider/
Funding Detail in the CivicSure hierarchy — the header metrics (42
Active Programs, $684M Funding Administered, 118 Providers, 81%
Verified Outcomes, 9 Open Exceptions) and the Assurance Snapshot both
describe the agency's full portfolio, not one program's. The
Responsibilities section (`AgencyOverviewPanel.jsx`) exists
specifically to translate what an agency *does* into plain English —
six cards (Workforce Programs, Grant Administration, Provider
Oversight, Employer Partnerships, Outcome Monitoring, Public
Reporting), each a one-line description with no bureaucratic language
left unexplained, per the task brief's explicit instruction.

## Tabs

Overview, Programs, Funding, Providers, Outcomes, Evidence, Reports —
`role=tablist`/`role=tab`, same pattern as every other detail page's
tab strip in this suite. All 7 confirmed working live, including
tab-panel content changes and tab-strip horizontal scroll on mobile
(see Responsive behavior below).

- **Overview**: Agency facts (type/jurisdiction/headquarters/
  established/reporting period) + Mission, Responsibilities (6 cards),
  Data Quality Notice, and a right column stacking Assurance Snapshot
  → Geography panel → Funding Sources panel.
- **Programs**: `AgencyProgramsPanel.jsx` — "Showing 3 of 42 active
  programs in this demo frame," reusing the same real/placeholder link
  convention as every other page: a real "Explore Program →" link only
  for Clean Energy Workforce Training (the one program with an actual
  built demo page); Youth Career Launch and Infrastructure Skills
  Initiative render an inert "Not yet available" instead of a dead
  link. `StatusBadge` renders correctly for all three tones exercised
  here (`verified`, `open-exception`).
- **Funding**: `AgencyFundingPanel.jsx` — plain-language, always-visible
  definitions for Authorized/Awarded/Obligated/Expended/Remaining (via
  `FinancialTerm`, reusing `FINANCIAL_TERM_DEFINITIONS` imported from
  `fundingDetailMockData.js` rather than redefining the same five
  sentences a third time), a real "Explore Funding →" link to
  `#/explorer/funding/ohio-workforce-innovation-fund` (verified live),
  three breakdown lists (top sources / by program / by county), and a
  compact 7-step money-flow lineage (Federal/State Source → Agency →
  Program → Provider → Delivery → Evidence → Outcome) built from the
  shared `.cse-ftm__*` visual classes rather than a new component —
  this is the third page in the suite to reuse those classes for a
  page-specific step sequence (Explorer's generic 7-step card, Funding
  Detail's interactive 8-node lineage, County Detail's compact
  lineage, now this agency-level one).
- **Providers**: `AgencyProvidersPanel.jsx` — same "showing 3 of 118"
  pattern; real link only for Community Future Network.
- **Outcomes**: `AgencyOutcomesPanel.jsx` — a `.cse-table` 7-column
  table (Outcome/Target/Actual/Denominator/Period/Evidence Coverage/
  Verification), 5 rows, no universal agency-wide score fabricated.
- **Evidence**: `AgencyEvidencePanel.jsx` — 4 tiles (Verified/Pending
  Review/Missing/Not Public record counts), a Data Quality Notices
  list, a Known Limitations paragraph, and the exact plain-language
  note from the brief ("Evidence coverage reflects CivicSure
  verification metadata and does not expose private underlying
  records").
- **Reports**: `AgencyReportsPanel.jsx` — 3 report cards (FY2026
  Agency Assurance Report, Workforce Program Portfolio Report, and a
  third), each with a `<dl>` of Status/Version/Reporting period and an
  inert "View Report" button — a safe placeholder, no fake report
  generation. The header's "View Reports" action is real: it switches
  the page's own `activeTab` state to `"reports"` (verified live).

## Assurance and data-quality treatment

`AgencyAssuranceSnapshot.jsx` follows the pattern established by
Funding Detail: a checklist (Funding reconciliation current / Provider
submissions received / Required public reports available — all
`verified`; Open exceptions — `9 open`; Outcome measures pending
evidence — `4 pending`) plus a "Why these results?" link that expands
in place (not a tab switch) to a plain-English paragraph explaining
that open exceptions and pending evidence don't mean missing money or
failed programs. Verified live: clicking toggles the chevron and
reveals the explanation without navigating away from Overview.

`AgencyDataQualityNotice.jsx` renders as its own amber-bordered card
directly in the Overview tab's left column (not tucked into a corner),
consistent with this suite's "funding/data gaps are displayed openly"
principle. `AgencyAboutData.jsx` (the "About this data" drawer) adds
two fields specific to this page's brief beyond the ten-field pattern
used elsewhere: **Agency Authority** (the statutory basis for the
agency, e.g. "Ohio Revised Code, Chapter 6301 (demo)") and
**Reconciliation Status** ("In progress — $1.2M of provider-reported
expenditure is not yet independently reconciled").

## Report connection

The header's "View Reports" button and the Reports tab are the only
two places this page references CivicSure's reporting system, and
both are intentionally inert beyond local tab-switching: no Shared
Reporting connection exists yet, so every report card's "View Report"
button is a clearly-labeled demo placeholder rather than a working
document link.

## Cross-page demo data consistency

`agencyDetailMockData.js` (marked `DEMO / FRAME DATA — NOT PRODUCTION
CIVICSURE DATA`) deliberately reuses entities already established in
earlier pages rather than inventing new ones: the agency (Ohio
Department of Workforce Development) is the same one referenced by
Clean Energy Workforce Training's program facts; its one "real"
funding record is `ohio-workforce-innovation-fund` (Funding Detail's
subject); its one "real" program is `clean-energy-workforce-training`;
its one "real" provider is `community-future-network`. This means all
four "Explore →" links on this page (Program, Provider, Funding,
Geography) land on already-built, already-working pages — verified
live for each.

## Responsive behavior

Breakpoints at 1180px (two-column layouts collapse to one) and 760px
(5-column metric grid → 2-column, per the shared `.cse-metrics`
rules), matching every other page in the suite. Verified via
same-origin iframe injection at 390px (mobile) and 900px (tablet):

- All 7 tabs pass the rigorous overflow check (`window.scrollX`
  genuinely stays `0` after `scrollTo(1000, 0)`, not just a
  `scrollWidth` heuristic) at both widths.
- At 390px the 7-tab strip does not fit its container and becomes
  independently horizontally scrollable (`overflow-x: auto` on
  `[role=tablist]`, `scrollWidth` 658px vs. `clientWidth` 198px) —
  this is by design, the same pattern used elsewhere in the suite, not
  a defect; scrolling the tab strip itself reveals Outcomes/Evidence/
  Reports.
- The Outcomes tab's 7-column table scrolls inside its own
  `.cse-table-wrap` at 390px (`wrapScrollWidth` 1289px vs.
  `wrapClientWidth` 706px) without leaking into page-level horizontal
  scroll — confirms the `.cse-table-wrap` fix from the Funding Detail
  session (`max-width: 100%; contain: paint;`) holds for this page's
  own wide table too.
- At 900px all 7 tabs fit the tab strip without scrolling, and the
  metric grid renders 3-column.

## A shared-primitive bug found and fixed this session

**Oversized `.cse-btn` icon**: `ExplorerIcon` SVGs carry no intrinsic
`width`/`height` (only `viewBox="0 0 24 24"`), and `civicsure-
explorer.css` had no global `.cse-btn svg` sizing rule — every prior
page relied entirely on its own page-scoped override
(`grep -n "^\.cse-btn " -A20 civicsure-explorer.css | grep svg`
returned nothing before this fix). `AgencyReportsPanel.jsx`'s "View
Report" button had no such scoped override, so its icon rendered at a
huge, unstyled default size. The same latent bug was confirmed to
pre-exist, undetected, in the previous (Funding Detail) session's
`FundingReportCard.jsx` "View Report" button
(`.cse-fnd-report .cse-btn { width:100%; justify-content:center; }`
had no `svg` sub-rule either). Fixed by adding one shared default rule
directly after the base `.cse-btn` block in `civicsure-explorer.css`:

```css
.cse-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
```

Verified live on both pages after the fix: all three Agency Reports
cards render correctly-sized icons, and Funding Detail's Assurance
Report card (previously affected, previously unnoticed) now also
renders correctly — a retroactive fix with zero visual change
anywhere an icon was already sized by a page-scoped rule.

## Mock data

`apps/shf-web/src/pages/civicsure/explorer/agencyDetailMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. Exports
`AGENCY_DETAIL_TABS`, `FINANCIAL_TERM_DEFINITIONS` (re-exported from
`fundingDetailMockData.js`, not redefined), and `getAgencyDetail(id)`
returning `null` for unknown ids. Single demo record keyed
`"ohio-department-workforce-development"`.

## What remains intentionally unwired

- No live GPA/CivicSure data, Shared Reporting, or a real assurance
  engine — everything comes from `agencyDetailMockData.js`.
- Share (header) — inert placeholder, no share sheet.
- Follow is a real local toggle but does not persist.
- Programs/Providers tabs show 3 of a claimed 42/118 (explicit
  "showing N of X" notes, not hidden).
- Two of the three shown programs and two of the three shown providers
  have no real Program/Provider Detail page yet — inert placeholders,
  not dead links.
- All three Reports cards are static demo cards with inert "View
  Report" buttons; no real Shared Reporting connection exists.
- Agency Authority and Reconciliation Status (About This Data drawer)
  are illustrative demo text, not real statutory citations or
  reconciliation figures.

## Visual source

The approved CivicSure Agency Detail brief (provided directly in the
task). Palette, tab structure, and the plain-language-first content
rules follow the same locked CivicSure public design system as every
other page in this suite (`--cse-*` tokens: pale civic blue,
institutional blue, deep navy, restrained green/blue/amber for
verified/informational/exception states — no admin-dashboard styling,
no tan/beige/gray-green).
