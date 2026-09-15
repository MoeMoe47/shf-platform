# MET-4 Interactive City Shell + Camera Navigation

Status: COMPLETE

Baseline: `1ce01749fa3eb1e6ecb8af4463e05bc918dff063`

## Route

The canonical browser route for the immersive city shell is `/metaverse`.

The Universe remains a separate ecosystem navigation experience. MET-4 does not alter `/universe` into the metaverse.

## Frontend Audit

| Surface | Repository finding | MET-4 decision |
| --- | --- | --- |
| Root routing | The root app routes from `src/entries/index.main.jsx` using pathname/hash selection. | Add `/metaverse` to the existing root route switch. |
| Universe routes | Universe is mounted separately through `src/entries/universe.main.jsx` and `src/pages/universe-v1/UniverseApp.jsx`. | Keep Universe separate. |
| Metaverse routes | No canonical immersive city route existed. `src/pages/metaverse/GrowthObservationTower.jsx` is a separate concept page. | Create `src/pages/metaverse/MetaverseCityPage.jsx`. |
| Shell/layout | Existing root app has dashboard and module shells, but MET-4 requires an immersive environment-first shell. | Use a route-local full-screen shell, not the admin/dashboard layout. |
| Camera utilities | No reusable bounded pan/zoom camera utility was found. | Create a bounded 2D camera component. |
| Accessibility primitives | The repo has accessibility helpers and route-level UI patterns, but the city needs semantic spatial alternatives. | Implement direct semantic buttons, breadcrumbs, keyboard controls, and an accessible location browser. |
| Overlay/panel components | Existing panels are dashboard-oriented. | Create route-local minimal HUD and context panels. |
| CSS architecture | Route/page CSS imports are already used. | Add `src/pages/metaverse/metaverse-city.css`. |
| Mobile breakpoints | Existing CSS commonly uses responsive route-local breakpoints. | Add tablet/mobile breakpoints at 900px and 620px. |
| Visual registry | MET-2A assets are exposed in `src/system/metaverse/metaverseVisualAssets.js`. | Reuse the asset registry and reject reference-only assets as production environments. |
| Unlock projection | MET-3 API integration is not wired to the frontend. | Add a bounded frontend adapter that fails closed outside development fixture mode. |

Chosen canonical integration point: `src/entries/index.main.jsx` mounts `/metaverse`, while `src/system/metaverse/metaverseNavigationModel.js` acts as a frontend-safe projection of the canonical city registry and visual asset registry. It is marked as non-authoritative and must not replace the backend registry.

## Component Architecture

| Component | Responsibility |
| --- | --- |
| `MetaverseCityPage` | Owns route state, camera level, selection, unlock lookups, breadcrumbs, and activity placeholder entry. |
| `MetaverseCamera` | Renders the environment layer, pointer/touch pan, wheel zoom, and hotspot layer. |
| `MetaverseHotspot` | Reusable marker for district, facility, and activity resources. |
| `MetaverseBreadcrumbs` | Interactive hierarchy navigation guarded by the same selection handlers. |
| `MetaverseCameraControls` | Minimal HUD controls for zoom, reset, back, and location browser. |
| `MetaverseLocationNavigator` | Accessible non-spatial district/facility browser using the same unlock resolver. |
| `MetaverseContextPanel` | Compact selected-location and locked-state explanation panel. |

## Camera State Model

Camera state is local UI state only:

- `x`
- `y`
- `zoom`
- selected location
- camera level

Supported levels:

- `CITY_OVERVIEW`
- `DISTRICT_VIEW`
- `FACILITY_VIEW`
- `ACTIVITY_SIMULATION_VIEW`

Camera coordinates never grant access. Direct entry is still checked through the unlock adapter before changing to protected levels.

## Registry Integration

The frontend navigation model derives:

- all 9 canonical district markers
- facility markers from the MET-2 registry vocabulary
- breadcrumb hierarchy
- activity placeholder mount points where MET-3 allows future activity decisions

The projection records `duplicatesCanonicalRegistry: false` and references `apps/shs-api/src/domain/metaverse/registry/city-registry.ts#getMetaverseCityProjection` as canonical source. It is a browser projection for rendering, not authority.

## Visual Asset Integration

City, district, and facility environments come from `src/system/metaverse/metaverseVisualAssets.js`.

Rules:

- city overview uses the approved master city production background
- district views use approved district production backgrounds
- facility views use mapped facility production backgrounds where present
- facility views may fall back to district imagery when the registry permits reuse
- reference-only images are rejected as production environments
- live markers, labels, unlock states, and future presence indicators are rendered as dynamic UI, never baked into images

## Unlock Integration

`src/system/metaverse/metaverseUnlockProjection.js` maps MET-3 decisions into UI state:

- `AVAILABLE`
- `LOCKED`
- `HIDDEN`
- `RESTRICTED`
- `ASSIGNED`
- `COMPLETED_ACCESSIBLE`
- `TEMPORARILY_UNAVAILABLE`

The adapter is explicit that production unlock API wiring is not complete. It fails closed outside development fixture mode and denies any client, camera, or query-parameter grant attempt.

The fixture exists only to make the shell testable before a production unlock endpoint is wired. It does not create credentials, verified mastery, job eligibility, civic eligibility, or curriculum authority.

## Navigation Hierarchy

Canonical flow:

`Silicon Heartland -> District -> Facility -> Activity / Simulation placeholder`

City overview shows all 9 district markers:

- Civic
- Career & Education
- Data Center
- Learning Arcade
- Treasury & Commerce
- Technology & Innovation
- Community
- Student Life
- Public Realm

District view shows facility markers from the canonical projection. Facility view shows supported future activity placeholders only where the model includes them.

## Locked And Restricted UX

Locked or restricted resources are not silently disabled. Selecting them opens a compact explanation and, when available, a canonical next action.

The UI does not manufacture next actions. If no next action is present in the decision, no next-action button is rendered.

## Accessibility

The shell supports:

- keyboard-operable markers and controls
- semantic breadcrumbs
- a semantic location browser for non-spatial navigation
- screen-reader labels that include unlock state
- focus-visible rings
- explanations for locked/restricted resources
- non-color-only state labels
- no requirement for drag, precise camera movement, hover, or visual map interpretation
- mobile/tablet bottom-sheet navigation

The non-spatial navigator uses the same resource and unlock resolver as the visual camera path.

## Reduced Motion

The shell respects `prefers-reduced-motion`.

Reduced motion behavior:

- long camera/background transitions collapse to short fades
- continuous marker animation is disabled
- navigation remains fully functional

## Responsive And Mobile Behavior

Desktop emphasizes the immersive camera and small HUD.

Tablet uses larger controls and simplified overlays.

Mobile keeps the city environment visible and exposes the location browser as a bottom sheet. Users are not required to pan precisely or rely on hover interactions.

## Security Boundary

MET-4 protects the shell against:

- camera-state authorization
- query-parameter privilege changes
- client-set unlock state
- direct UI activation of unavailable resources
- breadcrumb bypass
- hidden use of reference images as production environments
- fake presence data
- duplicate city registry authority
- duplicate unlock authority

Every production protected entry point still requires a future server-side unlock check.

## Presence Placeholders

MET-4 reserves empty UI space for future MET-2B-backed presence and communication projections. It renders no fake student names, fake online users, fake participant counts, or fake chat data.

## Activity Mount Boundary

Authorized activity entry may show a placeholder mount such as `Data Center Cooling Simulation`.

The placeholder includes:

- activity title
- parent facility/district
- unlock reason
- exit/back control
- future simulation mount point

MET-4 does not implement the actual simulation and does not convert activity completion into mastery, credentials, jobs, or civic authority.

## Operational Events

No production event client was proven during this phase. MET-4 therefore defines the shell boundary but does not emit runtime telemetry.

Future safe events may include:

- `metaverse.resource.viewed`
- `metaverse.resource.entered`
- `metaverse.unlock.denied`
- `metaverse.next_action.selected`

These remain operational events only and must not create evidence, credentials, verified outcomes, employment eligibility, or civic authority.

## Browser Acceptance Notes

Browser acceptance was run against the local Vite dev server for `/metaverse`.

Verified:

- `/metaverse` loads
- city background is visible
- no dashboard shell is used
- 9 district markers render
- district selection transitions to district view
- facility selection transitions to facility view
- breadcrumbs and HUD remain available
- zoom/reset controls work
- non-spatial location browser opens
- mobile-width location browser remains usable
- no fake presence users or counts render
- no console-breaking errors were reported

## Remaining Gaps

### P0

None.

### P1

- Production unlock API wiring is deferred.
- Real-time presence and communication rendering are deferred to a future phase.
- Full activity/simulation mounts are deferred.
- Production operational event telemetry is deferred until a canonical client is proven.
- Richer camera focal-point metadata may be added as the production asset set grows.
