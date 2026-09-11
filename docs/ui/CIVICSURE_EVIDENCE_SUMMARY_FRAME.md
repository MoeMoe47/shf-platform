# CivicSure Evidence Summary — Page Frame

Phase implementation note, same discipline as every other page frame
in this suite. This page is a **visual/layout frame only** — no live
Evidence authority, GPA/CivicSure data, Shared Reporting, or a real
assurance engine are wired. See "What remains intentionally unwired"
below before building on it.

## Route

`#/explorer/evidence/:evidenceId`, registered in
`apps/shf-web/src/routes/index.jsx` alongside the other detail routes.
Matched with a small regex (`/^#\/explorer\/evidence\/([^/]+)$/`).
Demo id: `employment-placement-evidence-fy2026`. Unknown ids render a
clean "Evidence record not found" state — verified live for
`nonexistent-evidence-xyz`.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit
`/#/explorer/evidence/employment-placement-evidence-fy2026`.

## Public-safe evidence boundary

This is the page's defining constraint, and it is enforced in three
distinct places rather than asserted once and forgotten:

1. **`EvidencePrivacyBoundary.jsx`** ("What CivicSure does not show
   publicly") lists the excluded categories explicitly — participant
   names, Social Security numbers, payroll details, protected wage
   records, private case files, confidential employer records, raw
   restricted evidence documents — with supporting text: "CivicSure
   can show verification metadata and public-safe summaries without
   exposing restricted underlying records."
2. **The Sources tab** (`EvidenceSourcesPanel.jsx`) only ever renders
   aggregate metadata (Evidence Source, Source Type, Submitted By /
   Source Authority, Reporting Period, Records Covered, Verification
   Status, Public Availability, Last Reviewed) — never a document, a
   name, or a raw record.
3. **The mock data file itself** (`evidenceSummaryMockData.js`) is
   structurally incapable of carrying private fields — there is no
   participant-level array anywhere in the fixture, only aggregate
   counts and source-level metadata.

## Public availability model

Four explicit statuses — Public Summary, Metadata Public, Not Public,
Restricted (Operator Only) — rendered as a labeled pill list in the
Sources tab, with the boundary spelled out directly:
`PUBLIC_AVAILABILITY_EXPLANATION` ("Public availability describes what
CivicSure can display publicly. It does not change the underlying
evidence record or access authority.") is exported once from
`evidenceSummaryMockData.js` and imported into both
`EvidenceSourcesPanel.jsx` and `EvidenceAboutData.jsx` rather than
restated with different wording in each place — the same
single-source-of-truth pattern Outcome Detail and Agency Detail used
for `FINANCIAL_TERM_DEFINITIONS`.

## Coverage semantics

`EvidenceCoveragePanel.jsx` treats "94% coverage" the same way every
other page in this suite treats a bare percentage: never alone. It is
always paired with the eligible population (600), accepted verified
count (564), and pending/unverified count (36), plus a labeled
coverage bar — the bar's accessible name states the percentage in
words (`role="img"` with a full `aria-label`), and a visible text
label repeats it below the bar, so the figure is never color-only. The
"Coverage by Source" breakdown (224 + 186 + 96 + 58 = 564) carries an
explicit reconciliation note — "Source totals are reconciled to avoid
double-counting participants represented in more than one evidence
source" — and three Coverage Limitations bullets make explicit that
coverage is not the same as public visibility, and that missing
evidence never implies the claimed activity did not occur.

## Verification semantics

Two distinct verification surfaces exist by design, at two different
levels of detail:

- **Evidence Verification Snapshot** (Overview tab,
  `EvidenceVerificationSnapshot.jsx`) — a quick-glance checklist (6
  verified checks + 1 open-exception "36 records" row) with a "Why
  this status?" expand-in-place explanation, the same interaction
  pattern as Outcome Detail's `OutcomeVerificationPanel.jsx` and
  Agency Detail's `AgencyAssuranceSnapshot.jsx`.
- **Verification Process + Decision** (Verification tab,
  `EvidenceVerificationPanel.jsx`) — the full 8-stage pipeline
  (requirement identified → submitted/received → source validation →
  record matching → duplicate reconciliation → coverage calculation →
  review decision → status assigned), each stage carrying its own
  status, date, and plain-English explanation, followed by a
  Verification Decision panel. The reviewer/authority field is always
  the generic public-safe label `"CivicSure Assurance Review"` —
  never a fabricated named individual, per the brief's explicit
  instruction.

## Related-claim chain

Two levels of the same idea, sharing one component
(`EvidenceClaimChain.jsx`) rather than two implementations:

- A **compact** placement in the Overview tab's right column, next to
  the Verification Snapshot and Related Assurance Report.
- A **full** placement in the Related Claims tab, below four cards
  (Related Outcome, Related Program, Related Provider, Related
  Funding) that each carry a real link to an already-built demo page.

Both render the same 6-node chain — Employer + Provider Records → FY2026
Employment Evidence Set → Verified → 356 Employment Placements → Clean
Energy Workforce Training → Ohio Workforce Innovation Fund — using the
shared `.cse-ftm__*` visual classes already established by Funding
Detail, Agency Detail, and Outcome Detail's own lineage reuses. Every
node is a plain-English label, never a raw record id or technical
provenance term, per the brief's explicit "understandable without
technical provenance terminology" requirement.

## Private-record exclusion (verified in practice, not just in copy)

Beyond the dedicated Privacy Boundary panel, the exclusion is
structural: `evidenceSummaryMockData.js` has no field anywhere that
could carry a participant name, SSN, wage figure, or case file — the
Sources table's "Submitted By / Source Authority" column names
organizations (Participating Employers, Community Future Network,
Clean Energy Workforce Training, CivicSure Demo Projection), never
individuals. This means the privacy boundary is not just a stated
policy on the page — the underlying fixture is incapable of violating
it by construction.

## Cross-page demo data consistency

This evidence record deliberately reuses entities already established
elsewhere rather than inventing a parallel set: it supports the
`employment-placement` outcome (Outcome Detail), was produced by
`clean-energy-workforce-training` (Program Detail), delivered by
`community-future-network` (Provider Detail), funded by
`ohio-workforce-innovation-fund` (Funding Detail), and its Related
Assurance Report is the same `"FY2026 Workforce Outcome Assurance
Report"` (R3, Final) that Outcome Detail's own report card already
names — so every "View" link on this page, and the cross-reference
between this page and Outcome Detail, lands on already-built,
already-consistent content. Verified live for all 4 related-claim
links (Outcome, Program, Provider, Funding).

## Responsive behavior

Breakpoints at 1180px (two-column Overview/related-grid layouts
collapse to one/two columns) and 760px (5-column metric grid →
2-column; coverage summary grid → 2-column; privacy-boundary list →
1-column), matching the pattern established elsewhere in the suite.
Verified via same-origin iframe injection at 390px (mobile) and 900px
(tablet):

- All 6 tabs pass the rigorous overflow check (`window.scrollX`
  genuinely stays `0` after `scrollTo(1000, 0)`, not just a
  `scrollWidth` heuristic) at both widths.
- The Sources tab's 8-column table scrolls inside its own
  `.cse-table-wrap` without leaking into page-level horizontal
  scroll.
- The coverage bar and by-source breakdown render correctly at both
  widths; the Related Claims cards stack to a single column below
  1180px.

## Accessibility

Semantic headings throughout every panel; `role=tablist`/`role=tab`
tabs (same convention as every prior page); real `<button>`/`<a>`
elements for every interactive control; visible focus via the shared
`:focus-visible` outline; `StatusBadge` never carries meaning by color
alone; the coverage bar has a full text `aria-label` stating the
percentage in words, plus a redundant visible text label below it —
never color-only; the Sources and Related Programs-style tables use
`<caption>` (visually hidden), `<th scope="col">`, and `<th
scope="row">`; the evidence-to-claim chain is a plain-English ordered
list understandable without any visual/map dependency; the About This
Data drawer follows the suite's established accessible drawer pattern
(`role="dialog"`, `aria-modal`, focus moved to the close button on
open, Escape closes, overlay click closes) — verified live.

## Mock data boundary

`apps/shf-web/src/pages/civicsure/explorer/evidenceSummaryMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. Exports
`EVIDENCE_DETAIL_TABS`, `PUBLIC_AVAILABILITY_EXPLANATION`, and
`getEvidenceSummary(id)`, returning `null` for unknown ids. Single
demo record keyed `"employment-placement-evidence-fy2026"`. Not
imported from anywhere outside the Explorer/Evidence Summary page
frame, and structurally incapable of carrying private fields (see
"Private-record exclusion" above).

## What remains intentionally unwired

- No live Evidence authority, GPA/CivicSure data, Shared Reporting, or
  a real assurance/calculation engine — everything comes from
  `evidenceSummaryMockData.js`.
- Share (header) — inert placeholder, no share sheet.
- Follow is a real local toggle but does not persist.
- View Report (Related Assurance Report card) — inert placeholder; no
  immutable public report route exists yet.
- The verification threshold and 8-stage process are explicitly demo
  content, not a real Evidence authority pipeline.
- "CivicSure Assurance Review" is a generic public-safe label, not a
  connection to a real review system.

## Visual source

The approved CivicSure Evidence Summary brief (provided directly in
the task). Palette, tab structure, and the public-safe,
never-a-bare-number content rules follow the same locked CivicSure
public design system as every other page in this suite (`--cse-*`
tokens: pale civic blue, institutional blue, deep navy, restrained
green/blue/amber for verified/informational/exception states — no
dark dashboard styling, no forensic/investigation visual treatment, no
shield/checkmark overload, no fake trust scores, no giant verification
gauges).
