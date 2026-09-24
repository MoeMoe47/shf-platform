# SHU Page 2 Upgrade Implementation

## Route

- Page 2 route: `/universe/directory`
- Page 1 remains: `/universe`, `/`, `/universe.html`

## Main Components

- Page 2 component: `src/pages/universe-v1/gateway/UniverseGateway.jsx`
- Page 1 component, unchanged by design: `src/pages/universe-v1/UniverseApp.jsx`

## Styles Changed

- `src/pages/universe-v1/universe-v1.css`
- The upgrade is scoped to `.ugw-*` Page 2 styles appended to the existing Planetary Gateway section.
- Page 1 `.v1-*` cover styles were not changed.

## Assets Used

- Page 2 background: `public/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png`
- Existing planet assets: `public/assets/universe/planets/*.png`
- Existing ecosystem imagery reused for static portal cards:
  - `public/assets/metaverse/facilities/data-center-training-facility.png`
  - `public/assets/metaverse/facilities/northstar-data-center-facility.png`
  - `public/assets/metaverse/facilities/infrastructure-project-work-zone.png`
  - `public/assets/metaverse/districts/data-center-district-overview.png`
  - `public/assets/metaverse/districts/community-district-public-realm.png`
  - `public/assets/metaverse/districts/technology-innovation-district-overview.png`
  - `public/assets/foundation/hero-main.jpg`
  - `public/assets/career/pathways/*.jpg`

## Registry-Backed Data

The hero planet cluster uses canonical records from `src/pages/universe-v1/universeDestinationRegistry.js` through `src/pages/universe-v1/destinations.js`. Routes and availability are resolved with the existing `isDestinationAvailable`, `needsHardNavigation`, and `resolveDestinationHref` helpers.

The current featured planet set is registry-backed and intentionally excludes destinations not present in the canonical registry. The approved mock includes a Metaverse planet, but the registry does not currently expose a Metaverse Universe destination; this implementation preserves repository truth.

## Static Seed Presentation Data

The following sections use local structured presentation seed data inside `UniverseGateway.jsx`:

- Start Here audience cards
- Featured Across the Ecosystem cards
- Explore the Ecosystem browse tiles
- See How It's Connected relationship module
- Latest Activity list
- Featured Stories cards

These are front-end presentation placeholders only. They do not call fake APIs, create backend authority, or change product routing. Future integration can replace these arrays with real portal/search/activity data while preserving the same section contracts.

## Notes For Future Integration

- Wire Universal SHU Search to a real cross-ecosystem search source.
- Replace featured/activity/story seed arrays with governed content projections when available.
- Add a canonical Metaverse destination only through the destination registry if/when the product owner approves it.
- Preserve Page 1 as the cinematic cover and keep Page 2 as the explorer/directory surface.
