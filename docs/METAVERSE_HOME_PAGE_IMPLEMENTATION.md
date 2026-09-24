# Silicon Heartland Metaverse Home Page Implementation

## Route

- Public Metaverse home: `/metaverse`
- Existing immersive city runtime: `/metaverse/city`
- Existing regional scene routes, such as `/metaverse/oil-rig`, remain handled by the regional scene registry.
- Existing dev route `/metaverse/dev/ocean` remains unchanged.

## Main Components

- `src/pages/metaverse/MetaverseCityPage.jsx`
  - Adds `MetaverseHomePage` for the exact `/metaverse` route.
  - Keeps `MetaverseCityExperience` intact for `/metaverse/city` and non-regional Metaverse route fallbacks.
  - Preserves `MetaverseRegionalScenePage` and `OceanEngineDevPage` routing.

## Styles Changed

- `src/pages/metaverse/metaverse-city.css`
  - Adds a scoped `.met-home-*` home-page style layer.
  - Uses the approved dark-blue / light-blue city-world visual language.
  - Does not alter SHU, SHF, SHS, backend authority, or the existing `.met-shell` interactive city styling.

## Assets Used

- `/assets/metaverse/branding/silicon-heartland-metaverse-logo-white.png`
- `/assets/metaverse/city/silicon-heartland-city-day.png`
- `/assets/metaverse/city/silicon-heartland-city-dusk.png`
- `/assets/metaverse/city/silicon-heartland-city-master-overview.png`
- `/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png`
- `/assets/metaverse/facilities/data-center-training-facility.png`
- `/assets/metaverse/districts/technology-innovation-district-overview.png`
- `/assets/metaverse/districts/career-education-district-university-overview.png`
- `/assets/foundation/hero-main.jpg`
- `/assets/career/pathways/cta-skyline.jpg`

## Seed Content

The home page uses local front-end seed content for:

- Learn / Work / Build / Serve / Create / Explore pathway cards
- Ecosystem metrics
- Featured programs, opportunities, organizations, projects, and stories
- Region overlay labels
- SHF / SHS foundation cards

No new backend APIs, fabricated authority, authentication changes, or persistence behavior were introduced.

## Future Integration Notes

Future phases can replace the local seed arrays with real program, career, organization, opportunity, story, and event sources while preserving the visual structure. The `Enter the Metaverse` CTA should continue to route to the existing immersive city runtime unless the canonical routing model changes.
