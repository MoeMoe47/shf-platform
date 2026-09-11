# CivicSure Explorer — Page Frame

Phase 1 implementation note. This page is a **visual/layout frame only** — no
live data, map SDK, search, filtering, or program-detail navigation logic is
wired. See "What remains intentionally unwired" below before building on it.

## Route

`#/explorer`, registered in `apps/shf-web/src/routes/index.jsx`.

The route returns `CivicSureExplorerPage` directly, without `OperatorLayout`
or `CivicSureShell` — both of those are internal operator-console shells and
are not appropriate for a public-facing surface. Explorer renders its own
full page chrome, including a new public nav header.

`apps/shf-web` is a separate Vite app from the monorepo's root app; run it
with `cd apps/shf-web && npm run dev` and visit `/#/explorer`.

## Components

All under `apps/shf-web/src/pages/civicsure/explorer/`, except the nav:

- `apps/shf-web/src/components/civicsure/CivicSurePublicNav.jsx` — new
  public-facing top nav (logo, Overview/Explorer/How It Works/Reports/For
  Government/Providers/Public Trust, search icon, Sign In). **Not** a
  redesign of `CivicSureShell.jsx` (the existing internal operator console
  chrome) — that component's nav vocabulary, org/role context, and disabled
  search/help are internal-only and were not reused. This is a distinct
  component for a distinct audience.
- `CivicSureExplorerPage.jsx` — top-level page; owns the only two bits of
  local state (`activeCategory` for the section-nav tabs, `view` for
  List/Map).
- `components/ExplorerHero.jsx` — split hero (copy + Columbus photo/overlay).
- `components/ExplorerSearch.jsx` — hero search field + popular-search links.
- `components/ExplorerSectionNav.jsx` — the six large category tabs.
- `components/ExplorerMetrics.jsx` — five assurance summary cards.
- `components/ExplorerFilters.jsx` — filter toolbar + List/Map toggle.
- `components/ProgramResultList.jsx` / `ProgramResultCard.jsx` — program rows.
- `components/ExplorerMapPanel.jsx` — static map illustration. The
  road/park/river surface is layered CSS gradients only (no image asset,
  no map SDK) — see `.cse-map-panel`'s background in
  `civicsure-explorer.css`.
- `components/FollowTheMoneyCard.jsx` — the 7-step lineage flow.
- `components/ExplorerTrustCallout.jsx` — closing callout.
- `explorerIcons.jsx` — shared hand-authored line-icon set for the page.
- `apps/shf-web/src/components/civicsure/CivicSurePublicFooter.jsx` — new
  reusable public footer (skyline banner + brand/newsletter/nav-columns/
  bottom-bar), mounted after `<main>` in `CivicSureExplorerPage.jsx`. Named
  and written generically (no Explorer-specific imports or logic) so it can
  be reused by future public CivicSure pages. Its own icons (mail, social,
  Ohio outline, shield) are self-contained in the component file rather
  than imported from `explorerIcons.jsx`, for the same reusability reason.
  Style lives in `apps/shf-web/src/styles/civicsure-public-footer.css`,
  which redeclares the same `--cse-*` token values as
  `civicsure-explorer.css` on its own `.civicsure-public-footer` root
  class, so the footer renders correctly even on a page that isn't inside
  `.civicsure-explorer`. Explore-column links point to the real `#/explorer`
  route; Learn/Resources/Legal links have no real destinations yet and
  render as inert, aria-disabled placeholders (excluded from tab order,
  confirmed) rather than fabricated routes.

## Visual source

The approved CivicSure Explorer mock (provided directly in the task; not a
repo asset). Layout, copy, palette, and component boundaries follow it
closely — see "Remaining differences" in the delivery report for the small,
deliberate departures (e.g., filter-count text and any spacing tuned against
the live page rather than pixel-matched).

**2026-09-08 visual-fidelity pass**: a second, higher-fidelity mock was
provided and used to correct four things the first pass got visually wrong:
the color palette (too muted/gray-green), the hero image (too zoomed, too
soft, wrong composition), the map panel (too pale/abstract, no road-like
detail), and the hero's overall height (too tall — target ~320–380px). See
the "Design tokens" and "Assets" sections below for what changed; no
component structure or architecture changed in this pass.

## Assets

`apps/shf-web/public/assets/civicsure/explorer/civicsure-columbus-downtown-hero-v2.png`
(435×285) — replaces the original `...hero.png`, which was deleted as part
of the 2026-09-08 visual-fidelity pass (too zoomed, too soft, wrong
composition per owner feedback).

A brighter, sharper, wider text-free crop of the Columbus, OH skyline+river,
taken directly from the second approved mock image (also a single flattened
image with all copy baked in as pixels — the crop deliberately excludes
every region that contained baked-in text, since that text is rebuilt as
live HTML on top of it here, not reused as pixels). No network image
loading, no fabricated stock photography.

**Known limitation**: the source mock is only ~1450px wide overall, so the
clean (text-free) region extractable from it tops out at 435px wide — well
short of the ~1800–2200px+ target resolution for crisp desktop display.
There is no higher-resolution version of this exact image available in the
project, and no image-generation capability was available to produce one.
The hero's own CSS compensates partly (the hero band is short and wide, so
`object-fit: cover` is usually width-bound and doesn't need to stretch the
image as much as a taller hero would), but some upscaling still occurs at
large viewports. This should be swapped for a true high-resolution source
photo in a future pass.

## Design tokens

Explorer-local `--cse-*` tokens, declared on `.civicsure-explorer` in
`apps/shf-web/src/styles/civicsure-explorer.css`:

| Token | Value | Use |
|---|---|---|
| `--cse-navy` | `#102a52` | headlines, primary buttons, active nav/tab text |
| `--cse-blue` | `#1857b0` | links, tab/metric/map icons, focus rings, connector arrows |
| `--cse-blue-soft` | `#dce9fb` | icon-circle backgrounds (metrics, Follow the Money head icon) |
| `--cse-blue-pale` | `#eef5fd` | wash surfaces: hero background, active tab fill, trust callout, tag chips |
| `--cse-bg` | `#eef3f9` | inactive tab fill |
| `--cse-border` | `#d7e3f0` | card/input borders |
| `--cse-surface` | `#ffffff` | cards, inputs |
| `--cse-text` | `#16223a` | body ink |
| `--cse-muted` | `#566380` | secondary/slate-blue text |
| `--cse-success` | `#15804a` | verified/positive state only |
| `--cse-success-soft` | `#ddf5e8` | Active pill / verified icon backgrounds |

Replaces a first pass that reused `civicsure.css`'s `--civic-*` values
directly — those read too muted/gray-green against the approved mock on
direct visual comparison (confirmed by the owner). This is a new, bounded
token set local to this file; `civicsure.css` and `.civicsure-shell` (the
internal operator console) were not touched. All body-text-weight colors
were checked against WCAG AA (4.5:1) on white/pale-blue backgrounds;
`--cse-success` was specifically darkened from an initial `#178a52`
(4.38:1, failing) to `#15804a` (4.98:1, passing).

## Mock data boundary

**`civicsureExplorerMockData.js`** — every static value on this page (nav
items, popular searches, the five metric numbers, the four program fixture
records, county summary stats, map marker/label positions, the Follow the
Money step list) lives here, and the file is headed:

```
DEMO / FRAME DATA — NOT PRODUCTION ASSURANCE DATA
```

Nothing in it is wired to GPA data models, the Truth Spine, Evidence
authority, Metric Registry, Public Disclosure, or Shared Reporting. Do not
import it from anything outside this page frame.

Two button variants (`.cse-btn--primary`, `.cse-btn--outline`) also live in
`civicsure-explorer.css`, since the shared `civicsure.css` file defines
shell chrome, not a general button system.

## Responsive behavior

Verified at all 10 required viewports (1600×1000 down to 375×667) — 0
console errors, 0 horizontal overflow at every one.

- **Desktop** (>1120px): full nav, 46/54 hero split, 5-across metrics,
  two-column content grid (list left, map/Follow the Money/trust callout
  right, sticky).
- **1120px and below**: nav collapses to a hamburger menu (measured: the
  logo + 7 links + search + Sign In doesn't fit down to the original
  980px hero-stack breakpoint — confirmed by a real 59px overflow at
  1024px before this was split into its own, wider breakpoint).
- **≤1180px**: metrics wrap 3+2; content grid stacks to one column (list,
  then map, then Follow the Money, then trust callout).
- **≤980px**: hero stacks (copy above photo).
- **≤760px**: hero heading shrinks; metrics become 2-up; filters stack;
  section header stacks.
- **≤480px**: nav bar gaps/padding tighten and the header tagline hides
  (confirmed necessary — logo + hamburger + search + Sign In genuinely
  overflowed narrow phones before this).
- Category nav tabs scroll horizontally at every width rather than
  shrinking into unreadable icons (explicit requirement).
- Follow the Money's 7-step flow was resized (34px icons, 64px step width)
  specifically so it fits without scrolling inside its ~50%-width card at
  desktop widths — confirmed by measurement, not just visual inspection.

## Accessibility

- Semantic landmarks: `<header>`, `<nav>` (×2, each labelled), `<main>`,
  program cards as `<article>`, tag lists as real `<ul>`/`<li>`.
- Skip-to-main-content link, first in tab order.
- All interactive elements are real `<button>`/`<a>`/`<select>` — no
  clickable `<div>`s.
- Filter `<select>` elements have associated `<label>`s.
- Category tabs use `role="tablist"`/`role="tab"`/`aria-selected`.
- The map panel's decorative illustration (labels, markers, highway
  shields) is isolated in its own `role="img"` container with a
  descriptive `aria-label`; the real interactive controls next to it
  (the "View County Details" link, the zoom buttons) are siblings, not
  descendants of that `role="img"` element — nesting them inside would
  have hidden them from assistive tech.
- Focus-visible outlines defined globally (`:focus-visible`).
- `prefers-reduced-motion: reduce` support (transition durations collapsed).
- Verified image alt text: the hero background and map illustration are
  `alt=""`/`aria-hidden="true"` (purely decorative, same message present as
  live text); no `alt` is used to convey information that isn't also live
  text elsewhere on the page.
- No information is conveyed by color alone — every status (Active pill,
  metric deltas, active tab/view state) also carries text.

## What remains intentionally unwired

Per the task's scope boundary, none of the following exist yet:

- Live API data of any kind — every number/record is from the mock-data file.
- A real map SDK (Google Maps / Mapbox / Leaflet) — the map panel is a
  static, percentage-positioned illustration.
- Live search or filter query execution — the hero search form
  `preventDefault()`s on submit; filter `<select>`s are uncontrolled with a
  single option each, matching the mock exactly.
- Program detail navigation — the chevron button on each program card is a
  real, focusable button with no destination yet.
- Report generation.
- Real assurance metrics, Metric Registry integration, or Truth Spine /
  Evidence authority / Public Disclosure / Shared Reporting wiring of any
  kind — Explorer remains architecturally separate from all of those, as
  required.

The only client-side state on this page is which category tab and which
List/Map view is selected — both are ordinary `useState` presentation state
with no backend implication.
