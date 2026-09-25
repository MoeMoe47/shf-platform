# SHU Ecosystem Experience V1

Status: implemented 2026-09-25 on `project-1-canonical-city-foundation`.
Scope: `/universe/directory` (SHU Directory) plus the new `/universe/discover`
and `/universe/<type>/<id>` routes. The locked SHU visual system (background,
planets, stars, network animation, horizon readability, production imagery) is
unchanged; this work adds product depth on top of it.

## Principle: SHU is a read-only projection

SHU owns no ecosystem facts. Every searchable item, detail page and graph edge
is projected from a canonical authority and keeps its source domain and source
id. Illustrative editorial content on the directory never enters the index.

| Data | Canonical authority | How SHU reads it |
|---|---|---|
| Careers, career → curriculum requirements | `shs-api` `/careers`, `/careers/:slug/curriculum` | `fetch('/api/...')` (Vite `/api` proxy → `:8091`) |
| Programs (canonical) | `shs-api` `/programs` (empty today) | same |
| Programs (projection) | Curriculum domain: `src/content/curriculum/data-center-pathway-map.json` | lazy `import()` |
| Organizations, organization relationships | `shs-api` `/organizations`, `/organization-relationships` | same |
| Opportunities | `shs-api` `/opportunities`, `/public/career/opportunities` (empty) | same |
| Places (virtual) | Metaverse registries: `metaverseNavigationModel.js`, `metaverseVisualAssets.js` | lazy `import()` |
| Destinations (navigation) | `universeDestinationRegistry.js` | direct import (unchanged authority) |

## Result classes

- **SHU objects** (`resultClass: 'object'`): Programs, Careers, Organizations,
  Projects, Places, Opportunities. These have detail pages.
- **Destinations** (`resultClass: 'destination'`): registry entries (SHF, SHS,
  BOS, Career Center, Civic …). Searchable as their own "Destinations" group,
  but structurally separate: kept in `index.destinations`, never counted as an
  object type, never given an SHU detail page, excluded from category
  relationships. Selecting one enters it through the registry.

## Discovery adapter (`src/pages/universe-v1/discovery/`)

| File | Role |
|---|---|
| `discoveryModel.js` | Types, route builders/parsers, relationship vocabulary (pure) |
| `discoveryAdapter.js` | Projections, relationship derivation, index, search (pure, unit-tested) |
| `discoverySources.js` | Loads each canonical source once per session; per-source status |
| `useDiscovery.js` | React hook over the cached index; debounce helper |
| `DiscoverySearch.jsx` | Gateway hero combobox + category chips |
| `UniverseDiscoverPage.jsx` | `/universe/discover` browse experience |
| `UniverseObjectDetailPage.jsx` | Shared detail shell for all six object types |
| `DiscoveryParts.jsx` | Thumbs/emblems, result cards, empty and no-result states |
| `destinationEntry.js` | Registry-driven destination entry + transition |

Indexed item fields: `id, type, resultClass, kind, title, summary, tags, image,
geography, status, canonicalSource, canonicalSourceId, canonicalRoute,
detailRoute, destination, projection, facts, actions, searchableText`.

### Projections

- **curriculum-as-program** — the Data Center pathway and its 13 courses are
  shown as Programs. Detail pages state the content is owned by the Curriculum
  domain. Migration: `shs-api /programs` records are projected *first*; a
  canonical Program with the same id replaces the projection and keeps the same
  `/universe/program/<id>` route (covered by tests).
- **metaverse-place** — the 9 Metaverse districts are Places labeled
  *Virtual* everywhere (kind "Virtual district", tag "Virtual", geography
  "Silicon Heartland Metaverse (virtual)", provenance banner on detail). They
  keep their Metaverse ids; no Place records are duplicated in SHU.
- **real-world-place** — reserved for a future real-world place source
  (`projectRealWorldPlace`); kept distinct from virtual districts.

Excluded: shs-api organization fixtures (`partner-1` / names containing "Demo").

### Relationships (only edges canonical records state)

| Edge | Source |
|---|---|
| course `PREPARES_FOR` career | curriculum `course.careerConnections`; shs-api `/careers/:slug/curriculum` |
| pathway `CONTAINS` course | curriculum `pathway.courses` |
| course `BUILDS_ON` course | curriculum `course.prerequisites` |
| object `AVAILABLE_IN` destination | registry app that serves the owning domain (Career Center, Curriculum Hub) |
| organization `REPRESENTED_IN` destination | exact title match between an organization and a registry destination |
| organization `PARTNERS_WITH` organization | shs-api `/organization-relationships` (empty today) |

Edges whose endpoints are not both indexed are dropped. Detail pages list
expected-but-unpublished relationship families as "Not published yet".

## Search and filters

- Tokenized, accent-insensitive search over title, summary, kind, tags,
  geography, type labels and source-specific extras (course outcomes, pathway
  name, district facilities). Every token must match; title/phrase matches rank
  higher. Input is debounced (120 ms gateway / 160 ms Discover) and results are
  memoized.
- Gateway: ARIA combobox (`role=combobox` + `listbox` with `group`s),
  ArrowUp/Down/Home/End, Enter (open option or go to Discover), Escape (close,
  then clear). Chips are a single-select `aria-pressed` category filter; with an
  empty query a selected chip lists that category.
- Featured filters filter the *editorial* cards by their own type label; empty
  categories show an honest state linking to Discover.
- Every "View All", Explore tile, Featured CTA and "Explore the Full Network"
  routes to `/universe/discover` (with `?type=` where relevant). Query and
  category live in the URL (`?q=&type=`); back/forward restore them.

## Detail routing

`/universe/{program|career|organization|project|place|opportunity}/<id>`,
parsed in `UniverseApp.jsx` before the registry's single-segment destination
routes. The router now matches on pathname only, so routes may carry a query.
States: loading skeleton, found, not found (bad id), source unavailable (with
retry), and "no source yet" (Projects). Actions only use real routes: Career
Center career detail, Curriculum Hub (via the registry), `/metaverse`.

## Relationship graph ("See How It's Connected")

The approved network (planet hub, drift, glow, SVG signals) is unchanged. Nodes
are now `role="button"` toggles (click/tap, Enter/Space; Escape clears).
Selecting a category: related categories (real edges only) stay bright with
emphasized spokes, unrelated nodes dim to 38% and pause drift/glow, signals are
restricted to the selection and its relations, and a panel shows the live
canonical count, connected categories with edge counts, up to four records and
a "View Details" CTA. Nothing navigates until the CTA. On mobile the stacked
node list is the selectable grid and the panel sits beneath it.

## Destination transitions

`useDestinationEntry` (registry-driven): available destination → planet
brightens (scale 1.05, orbit ring), page settles to 0.8 opacity, "Entering X"
status label, navigation after 380 ms. Unavailable destinations are blocked
(no animation; accessible name ends "(not yet available)"). Reduced motion →
immediate navigation. A `pageshow` listener clears the state after a
back/forward-cache restore.

## Responsive and accessibility

- Verified 1440 / 1280 / 1024 / 768 / 430 / 390 / 360: no horizontal page
  scroll on the directory, Discover, detail and not-found pages.
- Touch (`pointer: coarse`): chips, filters, section actions, card CTAs, top-bar
  links/icon, search buttons and footer links are ≥ 44 px.
- Section eyebrows are real `<h2>`s (same styling); sections are labelled by
  their headings. Detail pages set `document.title` and move focus to the `h1`.
- Decorative layers stay `aria-hidden`; production images in detail heroes
  carry descriptive alt text; editorial thumbnails remain decorative.
- Reduced motion: stars, planets, network drift/signals, entry transition and
  card lifts are all off; the graph remains fully usable.

## Editorial content (non-canonical)

Featured, Latest Activity and Featured Stories remain as presentation content,
each marked `data-content-class="editorial"` with a visible italic note
("Illustrative … not published ecosystem records" / "not a live feed"). They
never enter search, create detail pages, create graph edges, or present facts
as verified.

## Performance

- No new dependencies. Discovery UI ≈ 6 KB minified per page component.
- Curriculum map is a separate lazy chunk (58 KB); Metaverse registries load
  via dynamic import (they live in the repo's shared `components` chunk under
  the existing `manualChunks` config).
- Sources are fetched once per session and cached; category relationships and
  search results are memoized.
- Background art `fetchPriority="high"`; hero planets eager for the first row.
  Featured and story images use `srcset` (800w + 1200/1600w) with `sizes`.
- Animations remain transform/opacity only; signals use timeouts, not rAF.

## Tests

`tests/universeDiscoveryV1.test.mjs` (16 tests): projections, fixture exclusion,
editorial exclusion, grouped search / category filter / no-results, edge
provenance, detail route round-trip and bad ids, Discover params, destination
entry (blocked / animated / reduced-motion), router order, degraded sources,
destination class separation, canonical fields, curriculum→program migration,
virtual place labeling, future-source ingestion, editorial labeling.

## Known gaps

See `docs/SHU_CANONICAL_DATA_GAP_REPORT_V1.md`. UI-level: the top navigation
(Explore/Learn/…), Sign In, Join and footer links, and the "Start Here" audience
cards are still presentation anchors — out of scope for this program.
