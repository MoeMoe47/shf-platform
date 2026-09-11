# CivicSure Search Results — Page Frame

Phase implementation note, same discipline as every other page frame
in this suite. This page is a **visual/layout frame only** — no live
search API or backend indexing is wired. See "What remains
intentionally unwired" below before building on it.

## Route

`#/explorer/search`, registered in `apps/shf-web/src/routes/index.jsx`
as an exact-match case alongside `#/explorer/geography` and
`#/explorer/compare`. Chosen over a bare `#/search` because this page
is architecturally part of the Explorer surface — it reuses Explorer's
nav context, its shared `.cse-*` primitives, and links back to
`#/explorer` from its empty state, the same way Compare View sits at
`#/explorer/compare` rather than a top-level route.

`apps/shf-web` is a separate Vite app; run it with
`cd apps/shf-web && npm run dev` and visit `/#/explorer/search`.

## Public search scope

Search covers exactly 8 result types — Programs, Providers, Counties,
Funding, Agencies, Outcomes, Evidence, Reports — and nothing else.
There is no code path in this page that can surface operator/admin
content: every record comes from the single `SEARCH_RESULTS` array in
`searchResultsMockData.js`, which contains only the same kind of
public-safe demo entities the rest of the Explorer suite already
publishes. This boundary is also stated explicitly in the About Search
drawer ("Private and operator records are never searched or returned
here") rather than left implicit.

## Result types and the default query

The corpus (27 records) is sized so the default demo query
`"workforce"` reproduces the brief's own example exactly — verified
live and by direct evaluation of `searchResults()`:

```
27 results for "workforce"
Programs 8 · Providers 4 · Counties 2 · Funding 3 ·
Agencies 2 · Outcomes 4 · Evidence 3 · Reports 1
```

Records deliberately reuse ids and figures already established
elsewhere in the suite (`clean-energy-workforce-training`,
`community-future-network`, `franklin-county`,
`ohio-workforce-innovation-fund`,
`ohio-department-workforce-development`, `employment-placement`,
`employment-placement-evidence-fy2026`) so their "View →" links land
on already-built, already-working detail pages. The remaining 20
records are new demo-only entities (no detail route) that round out
each type's count and give the filter/sort/suggestion demos real
variety to work with — e.g. Delaware and Licking County records,
several additional workforce/education/health/housing programs, and
two additional funding/agency/outcome/evidence records.

## Filter model

Four independent filters — Geography, Program Category, Status,
Reporting Period — each a plain `<select>`, combined with the query
via simple AND logic in `matchesFilters()`. "All Ohio" / "All" are the
explicit no-filter sentinel values (matching the brief's own filter
option wording) rather than a separate hidden "no filter" state.
`hasActiveFilters` is computed once and used to enable/disable "Clear
filters," which resets to `DEFAULT_FILTERS` in one action. Verified
live: filtering to "Franklin County" against the default "workforce"
query correctly narrows 27 results to 8, and every result-type tab
count updates to match (Programs 4, Providers 1, Counties 1, Funding
0, Agencies 0, Outcomes 1, Evidence 1, Reports 0).

Category, status, and reporting period are applied uniformly across
all 8 result types in this demo frame (e.g. a County record carries a
`category` field too, even though "category" is a less natural
concept for a county) — a deliberate simplification so one filter
model works for every type without per-type branching, documented here
rather than left unexplained.

## Sorting

Four options — Relevance (default, the corpus's built-in demo order),
Recently Updated (by each record's `lastUpdated` date), Funding Amount
(by each record's `fundingValue`, descending; 0 for types with no
natural funding figure, such as Outcomes and Evidence), Alphabetical
(by title) — implemented as a pure `sortResults()` function. This is
explicitly demo/local behavior, not a production search ranking
policy, per the brief's instruction. Verified live: sorting the
Programs tab by Funding Amount and by Alphabetical both produced the
correct order against the actual corpus values.

## Public visibility boundary

`SearchPublicLimitNotice.jsx` renders one fixed, generic sentence —
"Some results are unavailable because they are not approved for
public display." — always visible beneath the search summary. It
never states or implies a count of hidden/private records (the brief's
explicit "do not say '3 private records hidden'" instruction), because
stating a count would leak the existence of records this page has no
authority to describe.

## Result cards

One shared `SearchResultCard.jsx` renders all 8 types using a uniform
record shape (`meta` — an ordered array of label/value pairs — plus a
`statusLabel`), so there is no per-type card component to keep in
sync. Every card shows: entity type, title (optionally highlighted
with a semantic `<mark>` when the query text is found in it), a short
plain-English description (also highlighted), 1–3 contextual metrics,
a status (rendered as `StatusBadge` when the label maps to the suite's
shared vocabulary — Verified/On Track/Pending Review/Open Exception —
or a plain `.cse-pill` for lifecycle labels like "Active"/"Final",
matching the precedent already set on Funding Detail and Agency
Detail headers), a one-line match explanation, and a real "View →"
action where a demo detail route exists. All 8 type-specific examples
from the brief (Program, Provider, County, Funding, Agency, Outcome,
Evidence, Report) were verified live to render their exact field sets
and values.

## Explainability, not fabricated relevance

`getMatchExplanation()` returns a short, honest sentence naming
exactly where the query text was found — title, category, description,
or "related keywords" — by checking each field directly, never a
manufactured relevance score or percentage. Verified live for several
queries, including multi-word phrases ("workforce training" correctly
highlights as one phrase and reports "Matched 'workforce training' in
title").

## Compare preparation

Only Programs, Providers, Counties, and Outcomes — the four types
Compare View itself supports — get a "Select to compare" checkbox;
Funding, Agencies, Evidence, and Reports cards never show one, so a
user can't select an incompatible type by accident. `SearchCompareSelection.jsx`
tracks the selection as a flat array and:

- Enables "Compare selected" (a real link to `#/explorer/compare`)
  only when 2+ items of the **same** type are selected.
- Shows "Compare requires items of the same type." — verified live —
  when the selection spans more than one type, rather than silently
  failing or guessing.
- No query-param handoff to Compare View is implemented — the brief's
  "do not implement full URL state handoff unless trivial" instruction
  — so the linked Compare View opens with its own default selection,
  not the search page's selection. This is documented here as the
  known gap for a future iteration.

## No-result behavior

An empty result set renders `SearchEmptyState.jsx`: the exact required
headline, all 5 suggestions (Check spelling / Try a broader term /
Remove filters / Search by county / Explore all programs), and two
real actions — "Clear Search" (resets query and filters together) and
"Open Explorer" (a real link to `#/explorer`) — verified live for a
deliberately non-matching query. Never a dead end.

## Detail-page navigation

Real "View →" links were click-verified for all 7 linkable types
(Program, Provider, County, Funding, Agency, Outcome, Evidence); the
one Report record renders an honest `aria-disabled` placeholder button
instead of a fake report route, since no public immutable report page
exists yet — the same convention every other page in this suite uses
for Shared-Reporting-dependent actions.

## Demo-data boundary

`apps/shf-web/src/pages/civicsure/explorer/searchResultsMockData.js`,
marked `DEMO / FRAME DATA — NOT PRODUCTION CIVICSURE DATA`. Holds the
27-record corpus, all filter/sort option lists, and the pure
search/filter/sort/explain helper functions in one file. Matching is
an explicitly-labeled simplified case-insensitive substring check, not
a production search ranking policy. Not imported from anywhere outside
the Explorer/Search Results page frame.

## Future search/index integration

`CivicSureSearchResultsPage.jsx`'s state — `query`, `activeType`,
`filters`, `sortKey` — is deliberately the minimal set a future
version would mirror into the URL (e.g.
`?q=workforce&type=program&geography=Franklin+County&sort=funding`).
No URL syncing is implemented in this frame, per the brief's "do not
implement production URL syncing unless trivial and safe" instruction,
and no live search index is queried — every result comes from
`searchResultsMockData.js`.

## What remains intentionally unwired

- No live search API or backend indexing — everything comes from
  `searchResultsMockData.js`.
- "Compare selected" does not hand off the search page's specific
  selection to Compare View's own state — it links to the page, not a
  pre-populated comparison.
- The Report result's "View Report" is an inert placeholder; no
  immutable public report route exists yet.
- 20 of 27 corpus records have no real detail route yet (honest "Not
  yet available" placeholders shown instead).
- Relevance sort preserves corpus order rather than implementing a
  real ranking algorithm — explicitly demo behavior.

## Visual source

The approved CivicSure Search Results brief (provided directly in the
task). Palette, result-card structure, and the locked "no fabricated
relevance" rules follow the same CivicSure public design system as
every other page in this suite (`--cse-*` tokens: pale civic blue,
institutional blue, deep navy, restrained green/blue/amber — no
Google-search clone styling, no dark dashboard styling, no dense
enterprise search grids, no relevance scores, no SEO-style snippets, no
admin filters).
