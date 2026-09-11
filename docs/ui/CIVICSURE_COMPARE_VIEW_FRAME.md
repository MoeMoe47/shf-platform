# CivicSure Compare View — Page Frame

Phase implementation note, same discipline as every other page frame
in this suite. This page is a **visual/layout frame only** — no live
CivicSure/GPA comparison query is wired. See "What remains
intentionally unwired" below before building on it.

## Route

`#/explorer/compare`, registered in `apps/shf-web/src/routes/index.jsx`
as an exact-match case alongside `#/explorer/geography`. No id segment
— comparison selection is local component state for this frame (see
"Future query/projection integration" below for how that state is
already shaped to become URL-addressable).

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit `/#/explorer/compare`.

## Supported comparison types

Programs, Providers, Counties, Outcomes — one at a time, selected via
`CompareTypeSelector.jsx`'s single-select segmented control. Switching
type swaps the available entity set entirely; the brief's "do not
allow unlike entity types in the same comparison" rule is enforced
structurally, not just by convention — there is no code path that can
put a Program and a County in the same `selectedEntities` array,
because the entity picker only ever renders `getEntitiesByType(compareType)`.

Selections are tracked **per type** (`selectionsByType: { programs:
[...], providers: [...], counties: [...], outcomes: [...] }`), so
switching from Programs to Providers and back preserves each type's
own in-progress selection rather than discarding it — verified live.

## Maximum comparison size

`MAX_COMPARE_ITEMS = 4`, `MIN_COMPARE_ITEMS = 2`, both exported
constants from `compareViewMockData.js` rather than hardcoded in
components. Add/remove is a single toggle button per entity in
`CompareEntityPicker.jsx` (`aria-pressed` reflects selection); "replace"
is satisfied by remove-then-add through that same control rather than a
dedicated swap widget — removing one entity immediately frees a slot,
and the picker's remaining "Add" buttons stay enabled. At the max, every
unselected entity's "Add" button becomes `disabled` with a `title`
explaining why. Below the minimum (1 selected), the page shows "Choose
at least two items to compare." instead of any comparison section.

## Comparability model

`computeComparability(entities)` in `compareViewMockData.js` is
explicitly **DEMO comparison logic**, not a production CivicSure
policy — the file's header comment says so, and so does this page's
`CompareCompatibilityPanel.jsx`. It operates on 6 comparability fields
each entity carries (`reportingPeriod`, `fundingType`,
`populationDefinition`, `geographicScope`, `category`, plus each
entity's own `methodology.name`+`version`) and derives one of four
statuses:

- **Compatible** — category, methodology, and population all match.
- **Mostly Compatible** — category/methodology/population match, but
  reporting period, funding type, or evidence coverage differ.
- **Limited Comparison** — methodology or population differ (but
  category still matches).
- **Not Directly Comparable** — category itself differs.

All four statuses were exercised and verified live in this session:
Compatible (Community Future Network + Central Ohio Workforce
Collaborative — same methodology, same population), Limited Comparison
(Clean Energy Workforce Training + Summer STEM Initiative — the
brief's own canonical example, reproduced verbatim by this demo logic),
and Not Directly Comparable (Summer STEM Initiative + Supportive
Housing Program — different categories). The status is always paired
with 5 explicit pass/warn checks and a 6-row rules table (Reporting
period / Outcome methodology / Population definition / Geographic
scope / Evidence threshold / `{EntityType} category`) — never shown as
a bare label. A "Why does this matter?" control expands a fixed
plain-English explanation in place, the same interaction pattern used
by every other detail page's assurance/verification panel in this
suite.

## Non-ranking rule

Enforced in several concrete ways, not just by omission:

- `CompareOutcomesPanel.jsx`'s "Actual" row uses one neutral CSS class
  (`.cse-cmp-panel__neutral-value`) applied identically to every
  entity's cell — there is no comparison, sort, or conditional styling
  based on which value is higher.
- No component in this page ever sorts entities by a metric.
- `StatusBadge` is reused for every status field exactly as it renders
  elsewhere in the suite — text-first, color as accent only.
- The Outcomes panel shows a prominent **"Not directly comparable —
  the selected items use different outcome methodologies."** notice
  whenever methodologies differ, which supersedes any percentage
  comparison the reader might otherwise draw.
- No trophy icons, no first/second/third ranking, no green-winner/
  red-loser treatment, no composite/aggregate score anywhere on the
  page — confirmed absent from every panel (Overview through
  Methodology) during validation.

## Methodology handling

`CompareMethodologyPanel.jsx` shows a full per-entity table (name,
version, effective date, measurement window, numerator rule,
denominator rule, evidence threshold), then — only when methodologies
differ — renders a **Methodology mismatch** card in exactly the
"Program A / Program B / Result: Not directly comparable" format the
brief specifies, listing each entity's methodology + measurement
window followed by the mismatch verdict. Verified live for Clean
Energy Workforce Training (Employment Placement Methodology v2.1,
90-day window) vs. Summer STEM Initiative (Credential Attainment
Methodology v1.4, 120-day window).

## Evidence handling

`CompareEvidencePanel.jsx` leads with the fixed, always-visible
statement **"Coverage is not the same as performance."** before
showing coverage, verified count, pending review, missing, restricted,
and last review date per entity — the same "coverage ≠ performance"
principle already established on the Evidence Summary page, carried
into a multi-entity context. `CompareFundingPanel.jsx` reuses
`FINANCIAL_TERM_DEFINITIONS` from `fundingDetailMockData.js` (imported,
not redefined) so Authorized/Obligated/Expended/Remaining always carry
their plain-English definition inline, and shows the brief's exact
scope-mismatch warning whenever funding type or reporting period
differ across the selection.

## Difference explanations and comparison limitations

Both are computed, not static copy, from the same comparability fields
the Compatibility panel uses — `buildDifferenceExplanations` and
`buildComparisonLimitations` in `compareViewMockData.js` — so the two
sections never contradict the Compatibility panel's own verdict.
Differences are phrased as correlated factors ("these entities serve
different populations"), never as causal claims. Limitations
dynamically compute and report the actual evidence-coverage spread
(e.g., "Evidence coverage ranges from 78% to 94%") and the actual count
of entities with pending evidence — verified live to match the
selected entities' real figures, not hardcoded strings.

## Entity detail connections

Every selected entity's identity card (`CompareEntityCards.jsx`) and
the Overview/Related sections carry a real "View →" link wherever a
matching demo detail route exists (`clean-energy-workforce-training`,
`community-future-network`, `franklin-county`, `employment-placement`)
and an honest inert "Not yet available" placeholder otherwise — the
same real-vs-placeholder convention every other page in this suite
uses. All 3 currently-real links were click-verified to navigate
correctly.

## Responsive design

Breakpoints at 1180px (entity-card grid collapses from 3–4 columns to
2) and 760px (entity cards and the entity picker collapse to a single
column). Every comparison section (Overview through Methodology) uses
the shared `.cse-table`/`.cse-table-wrap` primitive, so wide
comparisons scroll internally rather than causing page-level
horizontal overflow — verified via same-origin iframe injection at
390px and 900px: all 7 sections passed the rigorous `scrollX`-attempt
overflow check (not just a `scrollWidth` heuristic) at both widths.

## Demo-data boundary

`apps/shf-web/src/pages/civicsure/explorer/compareViewMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. Holds all
entities (3–4 per type), the comparability heuristic, and the
difference/limitation builders in one file. Not imported from anywhere
outside the Explorer/Compare page frame. Entities deliberately reuse
ids and figures already established elsewhere in the suite
(`clean-energy-workforce-training`, `community-future-network`,
`franklin-county`, `employment-placement`) so cross-page consistency
holds and real links resolve correctly.

## Future query/projection integration

`CivicSureComparePage.jsx`'s state is deliberately shaped so a future
version could mirror it into the URL without restructuring: `compareType`
(one of `COMPARE_TYPES`), `selectionsByType[compareType]` (an ordered
array of entity ids, capped at `MAX_COMPARE_ITEMS`), and `activeSection`
(one of `COMPARE_SECTIONS`) are the three pieces that would become query
params — e.g. `?type=programs&ids=a,b&section=funding`. No URL syncing
is implemented in this frame, per the brief's "do not implement
production URL syncing unless trivial and safe" instruction, and no
live comparison query is wired — every figure comes from
`compareViewMockData.js`.

## What remains intentionally unwired

- No live CivicSure/GPA comparison query — everything comes from
  `compareViewMockData.js`.
- Share Comparison (header) — inert placeholder, no share sheet.
- The comparability heuristic (`computeComparability`) is explicitly
  demo logic, not a production CivicSure comparability policy.
- Only 1 entity per type (of 3–4) has a real detail route; the rest
  render honest "Not yet available" placeholders.
- Starting-question shortcuts and quick actions configure local demo
  state only — no persistence, no sharing.

## Visual source

The approved CivicSure Compare View brief (provided directly in the
task). Palette, section structure, and the locked non-ranking rules
follow the same CivicSure public design system as every other page in
this suite (`--cse-*` tokens: pale civic blue, institutional blue, deep
navy, restrained green/blue/amber — no sports-scoreboard styling, no
financial-trading dashboard styling, no winner/loser colors, no radar
charts, no giant gauges, no rankings, no fake composite scores).
