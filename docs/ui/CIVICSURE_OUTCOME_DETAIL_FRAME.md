# CivicSure Outcome Detail / Methodology — Page Frame

Phase implementation note, same discipline as every other page frame
in this suite. This page is a **visual/layout frame only** — no live
GPA/CivicSure data, Shared Reporting, or a real assurance/calculation
engine are wired. See "What remains intentionally unwired" below
before building on it.

## Route

`#/explorer/outcomes/:outcomeId`, registered in
`apps/shf-web/src/routes/index.jsx` alongside the other detail routes.
Matched with a small regex (`/^#\/explorer\/outcomes\/([^/]+)$/`).
Demo id: `employment-placement`. Unknown ids render a clean "Outcome
not found" state — verified live for `nonexistent-outcome-xyz`.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit
`/#/explorer/outcomes/employment-placement`.

## Outcome UX role

Outcome Detail sits below Program/Provider/Funding/Agency Detail in
the CivicSure hierarchy and answers a narrower, deeper question than
any of them: not "what is this program/agency doing overall?" but
"is this one specific claimed result true, and how do I know?" The
locked role split this page enforces:

- **Explorer** — investigate broadly.
- **Outcome Detail** (this page) — understand one outcome claim
  deeply.
- **Methodology** (this page's Methodology tab) — explain how the
  claim was produced.
- **Evidence** (this page's Evidence tab) — show what supports the
  claim.
- **Report** (this page's Related Assurance Report card) — immutable
  proof, referenced but not reproduced here.

No operator/admin functionality is mixed into this page — every
action a visitor can take is either a real local interaction (Follow,
tab switching, expand-in-place panels) or an honest, clearly labeled
placeholder.

## Tabs

Overview, Methodology, Evidence, Population, Related Programs,
Timeline — `role=tablist`/`role=tab`, same pattern as every other
detail page's tab strip in this suite. All 6 confirmed working live,
including tab-panel content changes and tab-strip behavior at each
tested breakpoint.

## Numerator/denominator treatment (the plain-language rule)

The locked rule for this page: **no bare percentage ever appears
alone.** Every place `59.3%` is shown, it is paired with its
numerator (356), denominator (600), target (55%), reporting period
(FY2026), and a link to the methodology that defines it. This is
enforced in three places that intentionally overlap rather than
duplicate blindly:

1. **Outcome Summary** (Overview tab, `OutcomeOverviewPanel.jsx`) — a
   `dl` fact grid showing Target/Actual/Difference/Denominator/
   Numerator/Evidence coverage together.
2. **How this number was calculated** (Overview tab) — a plain-English
   equation card ("356 verified placements ÷ 600 eligible participants
   = 59.3%") followed by a two-column explanation of what the
   numerator and denominator each mean in words, never just symbols.
3. **Calculation** (Methodology tab, `OutcomeMethodologyPanel.jsx`) —
   the same result shown as a literal calculation step
   ("356 ÷ 600 × 100 = 59.3%"), immediately preceded by the full
   Numerator Rule and Denominator Rule paragraphs that define exactly
   what is counted and excluded — not just what the numbers are, but
   why they are what they are.

## Methodology as a trust surface

The Methodology tab is the page's most detail-dense surface by
design, per the brief's explicit framing ("this is a major CivicSure
trust surface"): Outcome Definition, Numerator Rule, Denominator Rule,
Measurement Window, Inclusion Rules, Exclusion Rules, Evidence
Requirements, Calculation, and Verification Threshold each get their
own `cse-card` section rather than being compressed into a single
block of prose — so a visitor can scan for the one rule they care
about (e.g., "am I excluded because I withdrew early?") without
reading the whole page. The Verification Threshold section carries an
explicit, visually distinct disclaimer — `"This is demo methodology
for this page frame, not a production CivicSure policy."` — so the
90% threshold shown here is never mistaken for a real CivicSure
policy.

## Methodology versioning

`OutcomeMethodologyHistory.jsx` shows the current methodology
(Employment Placement Methodology, v2.1, effective Jul 1 2025,
Current) plus a real "View methodology history" expand-in-place panel
listing v2.1 → v2.0 → v1.0 with one-line change notes each — the same
expand-in-place interaction pattern used by
`OutcomeVerificationPanel.jsx`'s "View verification details" and every
prior page's "Why these results?" panels. This is presentation only:
it demonstrates what durable version history should look like without
a real versioned-methodology backend behind it.

## Evidence coverage

`OutcomeEvidencePanel.jsx`'s table shows public-safe evidence metadata
only (Evidence Type, Source, Reporting Period, Records Covered,
Verification Status, Public Availability, Last Reviewed) — no
participant names, PII, case records, wage details, or private
documents. One row (`Financial/service delivery reconciliation
reference`) is explicitly `Restricted (Operator Only)` to show not
everything is public, the same convention Funding Detail's Evidence
tab established. `OutcomeEvidenceCoverage.jsx` below it states the
coverage math in full (600 eligible → 564 with accepted evidence → 94%
→ 36 not yet verified) with an explicit note that missing evidence
does not mean the outcome did not occur — never implying the 36
un-verified records represent 36 failures.

## Population / denominator construction

`OutcomePopulationPanel.jsx` uses a step-down card list (Total
participants served 725 → Excluded before eligibility 85 → Outside
reporting window 24 → Duplicate/reconciled 16 → Eligible denominator
600), deliberately **not** a funnel visual — a funnel graphic implies
a causal drop-off ("725 people tried and only 600 succeeded") that
this data does not support; these are just five independently-counted
exclusion reasons landing on one final denominator. A county-level
breakdown (Franklin/Delaware/Licking/Other) follows as a second,
separate card — geography, not demographics, per the brief's
instruction to avoid sensitive demographic profiling in this frame.

## Related Programs / Related Funding / Related Provider

All three live inside the single "Related Programs" tab (there is no
dedicated tab for Funding or Provider in the 6-tab list) —
`OutcomeRelatedProgramsPanel.jsx` composes a programs table, a reused
`OutcomeRelatedFundingPanel.jsx` (the same component also placed in
the Overview tab's right column — one component, two placements, not
two implementations), and a compact Related Provider card. "Explore
Program" is a real link only for Clean Energy Workforce Training (the
only related program with a built demo Program Detail page); the
same real-vs-placeholder convention applies to the funding lineage
link and the provider link — verified live for all three.

## Timeline

`OutcomeTimelinePanel.jsx` is a vertical rail-and-dot list (no chart
library), the same visual pattern as Funding Detail's Timeline tab —
nine lifecycle events from "Methodology version effective" through
"Report finalized," each showing a date, a `StatusBadge`, and a
public-safe authority/source string (e.g., "CivicSure calculation
engine (demo)") rather than an internal system reference.

## Limitations and the comparability warning

`OutcomeLimitationsPanel.jsx` renders two adjacent cards in the
Overview tab's left column: an amber-bordered **Limitations** card
(matching the visual weight Agency Detail gives its Data Quality
Notice — uncertainty is never hidden or minimized) listing the three
required limitations verbatim, and a **Comparability Notice** card
("Can I compare this outcome to another program? — Only when the
compared outcomes use compatible definitions, populations, reporting
periods, and methodologies.") with an inert "Compare compatible
outcomes" placeholder — a real comparison tool does not exist yet, so
the button is honestly disabled rather than linking anywhere.

## Immutable report connection

`OutcomeReportCard.jsx` ("Related Assurance Report" — FY2026 Workforce
Outcome Assurance Report, R3, Final, FY2026) and the header's "View
Related Report" action both point at the same not-yet-built immutable
public report route. Neither fakes report generation: both render as
clearly labeled, `aria-disabled` demo placeholders with explanatory
`title`/`aria-label` text, the same convention every prior page in
this suite uses for Shared-Reporting-dependent actions.

## Cross-page demo data consistency

`outcomeDetailMockData.js` (marked `DEMO / FRAME DATA — NOT PRODUCTION
CIVICSURE DATA`) deliberately reuses entities already established
elsewhere rather than inventing a parallel set: the producing program
is `clean-energy-workforce-training` (Program Detail), the delivering
provider is `community-future-network` (Provider Detail), and the
funding source is `ohio-workforce-innovation-fund` (Funding Detail,
administered by the `ohio-department-workforce-development` agency
from Agency Detail). Every "Explore"/"View" link on this page that
names one of those three lands on an already-built, already-working
page — verified live for Program, Provider, and Funding lineage.

## Responsive behavior

Breakpoints at 1180px (two-column Overview/Methodology-grid/
Related-grid layouts collapse to one column) and 760px (5-column
metric grid → 2-column, per the shared `.cse-metrics` rules; the
population step-down list switches from a horizontal row of arrows to
a vertical stack with rotated arrows), matching the pattern
established elsewhere in the suite. Verified via same-origin iframe
injection at 390px (mobile) and 900px (tablet):

- All 6 tabs pass the rigorous overflow check (`window.scrollX`
  genuinely stays `0` after `scrollTo(1000, 0)`, not just a
  `scrollWidth` heuristic) at both widths.
- The Evidence and Related Programs tabs' 7- and 8-column tables
  scroll inside their own `.cse-table-wrap` without leaking into
  page-level horizontal scroll, confirming the `.cse-table-wrap` fix
  from the Funding Detail session still holds for this page's tables.
- At 900px (tablet) all 6 tabs fit the tab strip without scrolling and
  the metric grid renders 3-column; at 390px (mobile) the population
  step-down cards stack vertically with rotated arrows as designed.

## Accessibility

Semantic headings throughout every panel; `role=tablist`/`role=tab`
tabs (same convention as every prior page, no roving-tabindex
handling); real `<button>`/`<a>` elements for every interactive
control, never a styled `<div>`; visible focus via the shared
`:focus-visible` outline; `StatusBadge` never carries meaning by color
alone (a text label always renders); the plain-language formula is
readable prose, not bare mathematical notation; the Evidence and
Related Programs tables use `<caption>` (visually hidden), `<th
scope="col">`, and `<th scope="row">` for accessible table structure;
the About This Data drawer follows the suite's established accessible
drawer pattern (`role="dialog"`, `aria-modal`, focus moved to the
close button on open, Escape closes, overlay click closes) — verified
live.

## Mock data boundary

`apps/shf-web/src/pages/civicsure/explorer/outcomeDetailMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. Exports
`OUTCOME_DETAIL_TABS` and `getOutcomeDetail(id)`, returning `null` for
unknown ids. Single demo record keyed `"employment-placement"`. Not
imported from anywhere outside the Explorer/Outcome Detail page frame.

## What remains intentionally unwired

- No live GPA/CivicSure data, Shared Reporting, a real assurance
  engine, or a real calculation engine — everything comes from
  `outcomeDetailMockData.js`.
- Share (header) and Compare compatible outcomes (Comparability
  Notice) — inert placeholders, no share sheet or comparison tool.
- Follow is a real local toggle but does not persist.
- View Related Report (header) and View Report (Related Assurance
  Report card) — inert placeholders; no immutable public report route
  exists yet.
- Related Programs shows 1 of a claimed 3 agency programs that report
  this outcome (explicit "showing N of X" note, not hidden).
- Methodology history is static demo content, not a real versioned
  methodology system.
- The Verification Threshold (90% coverage) is explicitly labeled demo
  methodology, not a production CivicSure policy.

## Visual source

The approved CivicSure Outcome Detail / Methodology brief (provided
directly in the task). Palette, tab structure, and the
plain-language-first, numerator/denominator-always-shown content rules
follow the same locked CivicSure public design system as every other
page in this suite (`--cse-*` tokens: pale civic blue, institutional
blue, deep navy, restrained green/blue/amber for verified/
informational/exception states — no giant success gauges, no
scorecard/gamification styling, no dark admin-dashboard treatment).
