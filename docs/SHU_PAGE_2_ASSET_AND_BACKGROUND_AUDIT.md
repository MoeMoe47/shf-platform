# Silicon Heartland Universe - Page 2 Asset & Background Audit

## 1. Route Architecture

| Experience | Route | Component | Status |
|---|---|---|---|
| SHU Cover | `/universe`, `/`, `/universe.html` | `src/pages/universe-v1/UniverseApp.jsx` | Live canonical cinematic cover. Preserved. |
| SHU Directory | `/universe/directory` | `src/pages/universe-v1/gateway/UniverseGateway.jsx` | Live Page 2 destination gateway. Background-only upgrade target. |

The root entry `src/entries/index.main.jsx` lazy-loads `UniverseApp` for `/`, `/universe`, and default root routes. `src/entries/universe.main.jsx` mounts the same `UniverseApp` for `universe.html`. `UniverseApp` owns a small pathname router and renders `UniverseGateway` only when `window.location.pathname === '/universe/directory'`.

Page 1 to Page 2 navigation is handled by the `Card Mode` button in `UniverseApp`, which pushes `/universe/directory`. The Page 2 return button calls `navigate('/universe')`.

## 2. Page 2 Current Implementation

- Component hierarchy: `UniverseGateway` -> `UniverseBackground`, `StarField`, `SolarDustCanvas`, `GalaxySwirl`, `UniverseIntro`, sectioned `DestinationSection` groups, and `PlanetDestination` cards.
- CSS hierarchy: Page 2 uses the isolated `.ugw-*` block in `src/pages/universe-v1/universe-v1.css`, starting at the "Planetary Gateway" section. Page 1 uses `.v1-*` classes earlier in the same stylesheet.
- Current background implementation: `UniverseBackground` renders an `<img class="ugw-backgroundImage">` using `GATEWAY_BACKGROUND_SOURCE`.
- Previous Page 2 background path: `/assets/universe/masters/SHU_UNIVERSE_DIRECTORY_EARTH_HORIZON_MASTER_V1.png`.
- Content overlay: fixed background layers sit at z-index 0/1; `.ugw-layout` sits above them with local text shadows and subtle haze/scrim/vignette layers.
- Sizing and positioning: background image fills the viewport with `object-fit: cover` and `object-position: center 62%`; `.ugw-page` scrolls vertically and hides horizontal overflow.
- Scrolling behavior: Page 2 is a full viewport minimum with `overflow-y: auto`; the background remains `position: fixed`.
- Breakpoint behavior: responsive rules adjust layout grid and planet sizes at 1279px, 1023px, 767px, and 430px. No existing breakpoint-specific background position rules are present.

## 3. Canonical Destination Registry

Source: `src/pages/universe-v1/universeDestinationRegistry.js`; exported through `src/pages/universe-v1/destinations.js`.

| ID | Display Name | Group | Route | Image | Availability |
|---|---|---|---|---|---|
| bos | SHS Business Operating System | institution | `/solutions.html#/home` | ringed giant 01 | available, live, public |
| silicon-heartland-foundation | Silicon Heartland Foundation | institution | `/foundation.html#reports` | earth-like world | available, live, public |
| aos | Autonomous Operating System | platform | `/universe/aos` | cyber sphere | unavailable, restricted, admin-only |
| open-autonomous-standard | Open Autonomous Standard | standard | `/oas.html` | cratered transparent | available, live, public |
| autonomous-registry | Autonomous Registry | institution | independent `/` | ringed giant 02 | available, live, public |
| autonomous-trust-bureau | Autonomous Trust Bureau | institution | `/universe/autonomous-trust-bureau` | banded giant | unavailable, planned, unknown access |
| shs-bos-executive-command | SHS BOS Executive Command Center | platform | `/admin.html#/ops/executive-command` | cratered 01 | available, restricted, admin-only |
| agent-fabric | Agent Fabric Control Center | platform | `/admin.html#/agent-fabric` | rotated application asset | available, restricted, admin-only |
| career | Career Center | application | `/career.html#/` | rotated application asset | available, live, public |
| curriculum | Curriculum Hub | application | `/curriculum.html#/dashboard` | rotated application asset | available, live, public |
| arcade | Workforce Arcade | application | `/arcade.html#/` | rotated application asset | available, live, public |
| civicsure | CivicSure | application | `/index.html#/civicsure` | rotated application asset | available, live, public |
| civic | SHF Civic | application | `/civic.html#/` | rotated application asset | available, live, public |
| credit | Credit Lab | application | `/credit.html#/dashboard` | rotated application asset | available, live, public |
| debt | Debt Clock | application | `/debt.html#/dashboard` | rotated application asset | available, live, public |
| employer | Employer Hub | application | `/employer.html#/dashboard` | rotated application asset | available, live, public |
| treasury | Treasury | application | `/treasury.html#/dashboard` | rotated application asset | available, live, public |
| sales | Sales Studio | application | `/sales.html#/dashboard` | rotated application asset | available, live, public |
| store | Store | application | `/store.html#/catalog` | rotated application asset | available, live, public |
| ai-job-compass | AI Job Compass | application | `/ai.html#/job-compass` | rotated application asset | available, live, public |
| allocation | SHF Allocation Intelligence | application | `/allocation.html` | rotated application asset | available, live, public |
| verifier | External Proof Verifier | application | `/verifier.html` | rotated application asset | available, live, public |
| lord-of-outcomes | Lord of Outcomes | public-surface | `/lord-of-outcomes.html` | not rendered; `universeVisible: false` | available, dormant, hidden from directory |
| shf-impact | SHF Impact Command Center | public-surface | `/foundation.html#/impact` | cratered 02 | available, dormant, public |

Audit note: the registry contains 24 records, 23 not hidden by `universeVisible`, and the current Page 2 UI renders 23 destination cards. `UniverseGateway` creates buckets for institution, platform, standard, application, and public-surface section types and skips the hidden Lord of Outcomes record.

## 4. Current Visual Assets

### Logos

| Asset | Path | Used By | Current Status | Reusable? |
|---|---|---|---|---|
| SHF globe logo | `public/assets/brand/shf-globe-logo.png` | SHF/brand surfaces | Present | Yes |
| SHF command logo | `public/assets/shf-command/brand/shf-globe-logo.png` | SHF command surfaces | Present | Yes |
| SHS orbiter logo | `public/assets/shs/shs-orbiter-logo.png` | SHS branding | Present | Yes |
| SHS orbiter logo duplicate | `public/assets/branding/shs_orbiter_logo.png` | Branding library | Present; likely duplicate | Yes, review before reuse |
| Metaverse logo | `public/assets/metaverse/branding/silicon-heartland-metaverse-logo-white.png` | Metaverse | Present; out of scope | No for this task |
| Hub logo | `public/assets/hub/shs-hub-logo.png` | Hub | Present | Possible future portal use |

### Backgrounds

| Asset | Path | Used By | Current Status | Reusable? |
|---|---|---|---|---|
| Page 1 black/ivory master | `public/assets/universe/masters/SHU_UNIVERSE_V1_BLACK_IVORY_MASTER_V2.png` | `UniverseApp.jsx` via registry | Canonical Page 1 background | Preserve only |
| Page 2 old Earth horizon master | `public/assets/universe/masters/SHU_UNIVERSE_DIRECTORY_EARTH_HORIZON_MASTER_V1.png` | `UniverseGateway.jsx` before this task | Previous Page 2 background | Keep; obsolete for active Page 2 |
| Page 2 new production master | `public/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png` | Intended for `UniverseGateway.jsx` | Copied and verified | Yes, Page 2 only |
| 32 SHU cinematic scene masters | `public/assets/universe/masters/shu-s01...shu-s32...png` | Asset manifest / future cinematic flows | Present | Yes for future SHU sequences |
| Deep star map derivatives | `public/assets/environment/deep-star-map-2020/*.webp` | environment lab code | Present | Possible future cosmic surfaces |
| Cosmic stars | `public/assets/cosmic/stars.png` | not found in live SHU code | Present | Possible texture |
| Earth horizon | `public/assets/earth-horizon.png` | not found in live SHU code | Present | Possible duplicate/reference |
| OAS space backgrounds | `public/assets/oas/*background*.png` | OAS pages | Present | Product-specific |
| Metaverse city/district plates | `public/assets/metaverse/**` | Metaverse | Present; out of scope | Future portal story cards only |

### Planets

| Asset | Path | Used By | Current Status | Reusable? |
|---|---|---|---|---|
| Banded giant | `public/assets/universe/planets/shu-planet-banded-giant-01.png` | Trust Bureau | Active | Yes |
| Ringed giant 01 | `public/assets/universe/planets/shu-planet-ringed-giant-01.png` | BOS | Active | Yes |
| Ringed giant 02 | `public/assets/universe/planets/shu-planet-ringed-giant-02.png` | Autonomous Registry | Active | Yes |
| Earth planet | `public/assets/universe/planets/shu-planet-earth-01.png` | SHF | Active | Yes |
| Cyber sphere | `public/assets/universe/planets/shu-planet-cyber-sphere-01.png` | AOS | Active | Yes |
| Cratered transparent | `public/assets/universe/planets/shu-planet-cratered-transparent-01.png` | OAS and app rotation | Active | Yes |
| Cratered 01 | `public/assets/universe/planets/shu-planet-cratered-01.png` | BOS OPS and app rotation | Active | Yes |
| Cratered 02 | `public/assets/universe/planets/shu-planet-cratered-02.png` | SHF Impact and app rotation | Active | Yes |

### Card Imagery

| Asset | Path | Used By | Current Status | Reusable? |
|---|---|---|---|---|
| Career pathway images | `public/assets/career/pathways/*.jpg` | Career pages | Present | Yes for future Careers cards |
| Arcade/course imagery | `public/assets/arcade/**/*.jpg` | Arcade pages | Present | Yes for Programs/Stories |
| Store catalog imagery | `src/assets/store/catalog/*.webp` | Store | Present | Yes for Opportunities/Programs |
| Foundation hero | `public/assets/foundation/hero-main.jpg` | Foundation | Present | Yes with brand review |
| SHF map/report imagery | `public/assets/shf-command/maps/*` | SHF command | Present | Yes for Places/Reports |
| Metaverse districts/facilities | `public/assets/metaverse/districts/*.png`, `public/assets/metaverse/facilities/*.png` | Metaverse | Present; out of task scope | Future Places/Projects cards |

### Icons

| Asset | Path | Used By | Current Status | Reusable? |
|---|---|---|---|---|
| USA map SVGs | `public/assets/maps/usa-base.svg`, `public/assets/maps/usa-state-lines.svg` | Map surfaces | Present | Yes for Places |
| SHF map download SVG | `public/assets/shf-command/maps/download.svg` | SHF command maps | Present | Maybe |
| Arcade icon SVGs | `public/assets/arcade/classical/*.svg` | Arcade | Present | Maybe |
| Curriculum icons | `src/components/curriculum/icons.jsx` | Curriculum | Code icons | Maybe |
| Many UI icons | Component code and likely icon library usage | App-wide | Not asset files | Reuse through existing code conventions |

### Videos

| Asset | Path | Used By | Current Status | Reusable? |
|---|---|---|---|---|
| None found | n/a | n/a | No `.mp4`, `.webm`, `.mov`, or poster-frame assets found under searched roots | n/a |

## 5. New Background

Asset: `SHU_DIRECTORY_BACKGROUND_MASTER_V2.png`

Source path: `/Users/mikeslate/Downloads/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png`

Production-served path: `public/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png`

Dimensions: 1672 x 941

File size: 2,151,655 bytes

Format: PNG

SHA-256: `4040ede718a333a6de41ccb8cf2d58d5c5363e234b8f0b276419da7e29982d8c`

Copy verification: source and destination matched with `cmp -s` and identical SHA-256.

Intended usage: SHU Page 2 background only.

## 6. Risks

- Text contrast: the new warm central sunrise can sit behind the intro and top rows depending on viewport crop.
- Earth horizon collision: existing planet cards scroll over a fixed background, so lower rows may pass over the Earth band.
- Cropping: `object-fit: cover` will crop horizontally on tablet/mobile and vertically on ultra-wide viewports.
- Mobile: showing the entire Earth is not realistic; text and navigation must remain primary.
- Image size: 2.1 MB PNG is acceptable relative to existing masters and smaller than many current planet assets; no derivative is required in this pass.
- Duplicate backgrounds: old Page 2 V1 master and generic `public/assets/earth-horizon.png` remain in the repo.
- Stacking context: Page 2 uses fixed background layers and z-indexed content; a bad edit could affect readability or motion layers.

## 7. Recommended Safe Implementation

Make the smallest possible Page 2-only change:

- Change `GATEWAY_BACKGROUND_SOURCE` in `src/pages/universe-v1/gateway/UniverseGateway.jsx` from `/assets/universe/masters/SHU_UNIVERSE_DIRECTORY_EARTH_HORIZON_MASTER_V1.png` to `/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png`.
- Update the file header comment to identify the new production background and copied project path.
- Keep the existing `<img>` implementation, `object-fit: cover`, `object-position: center 62%`, haze, vignette, scrim, planet rendering, destination registry, section grouping, routing, and responsive rules.
- Do not change Page 1 `universeV1BlackIvoryMaster`, destination records, planet assets, SHF, SHS, Metaverse, auth, backend, or app routes.

## Future Page 2 Portal Expansion

The approved future Page 2 direction is to preserve the planet-directory experience while eventually adding Universal SHU Search, Programs, Careers, Organizations, Projects, Places, Opportunities, Discover Across Silicon Heartland, Featured Stories, and Quick Access. These additions should borrow structural discipline from modern portal/explorer systems while preserving the canonical SHU black/ivory cosmic visual identity. The new production Earth-horizon background should be treated as the visual foundation for that future upgrade.
