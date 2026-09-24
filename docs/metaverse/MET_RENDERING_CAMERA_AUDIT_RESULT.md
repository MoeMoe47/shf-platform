# Silicon Heartland Metaverse — Rendering / Camera Audit

Audit-only. No production code was changed to produce this report.

## 1. Executive Result: **COMPLETE**

The coordinate/transform pipeline, ownership boundaries, and drift risks are fully traceable in code. One material drift source not previously documented (including in the existing MERP‑0 audit) was found and is detailed in §5.

## 2. Production Background Asset Inventory

All production backgrounds are single static plates — **no separate DAY/DUSK/NIGHT image variants exist**. Time-of-day is currently a CSS tint overlay, not different source images.

| Scene | File | Path | Dims | Format |
|---|---|---|---|---|
| City overview | `silicon-heartland-city-master-overview.png` | `public/assets/metaverse/city/` | 1672×941 | PNG |
| Civic District | `civic-district-city-hall-plaza.png` | `public/assets/metaverse/districts/` | 1672×941 | PNG |
| Career & Education | `career-education-district-university-overview.png` | same | 1672×941 | PNG |
| Data Center | `data-center-district-overview.png` | same | 1672×941 | PNG |
| Learning Arcade | `learning-arcade-district-portal-plaza.png` | same | 1672×941 | PNG |
| Treasury & Commerce | `treasury-commerce-district-overview.png` | same | 1672×941 | PNG |
| Technology & Innovation | `technology-innovation-district-overview.png` | same | 1672×941 | PNG |
| Community | `community-district-public-realm.png` | same | 1672×941 | PNG |
| Student Life | `student-life-district-overview.png` | same | 1672×941 | PNG |
| Public Realm | `public-realm-civic-plaza.png` | same | 1672×941 | PNG |
| Facilities (4) | northstar-data-center, data-center-training, infrastructure-project-work-zone, student-social-commons | `public/assets/metaverse/facilities/` | 1672×941 | PNG |

- **Registry**: `src/system/metaverse/metaverseVisualAssets.js` (`METAVERSE_PRODUCTION_BACKGROUND_SET`)
- **Selection**: `findProductionEnvironmentAsset()` in `src/system/metaverse/metaverseNavigationModel.js`
- **Time-of-day resolution**: `src/system/metaverse/metaverseTimeOfDay.js` — `resolveMetaverseAssetVariant()` looks for `dayAsset`/`duskAsset`/`nightAsset` keys on the asset object; none exist on current registry entries, so it always falls back to `baseAsset` (the single dusk-lit plate). `resolveMetaverseTimeOfDay()` and the header's AUTO/DAY/DUSK/NIGHT buttons work correctly as *logic*, but there's nothing downstream for them to switch to yet — confirmed also by the untracked `docs/metaverse/MET-15_CLEAN_PLATE_ASSET_PLAN.md`.
- **DUSK/NIGHT "look"** today comes entirely from a CSS gradient overlay: `MetaverseTimeOfDayLayer.jsx` → `.met-living-layer--time[data-time-of-day="..."]` in `metaverse-city.css:60-75` (`mix-blend-mode: screen` + gradients).
- **Render site**: `MetaverseCamera.jsx` — as a CSS `background-image` on `.met-camera__world`.

## 3. Scene Ownership Map

| Responsibility | File |
|---|---|
| City canvas / camera transform | `src/components/metaverse/MetaverseCamera.jsx` |
| Background rendering | `MetaverseCamera.jsx` (`.met-camera__world`) |
| Zoom / pan input | `MetaverseCamera.jsx` (pointer + wheel handlers), keyboard `+/-/arrows` in `MetaverseCityPage.jsx:719-724` |
| Camera state | `camera` state (`{x,y,zoom}`) owned by `MetaverseCityPage.jsx`, passed down |
| Camera UI buttons | `MetaverseCameraControls.jsx` (zoom/reset/back, no coordinate math) |
| District/facility/activity markers | `MetaverseHotspot.jsx`, positions from `metaverseNavigationModel.js` (`METAVERSE_DISTRICT_MARKERS`, `METAVERSE_FACILITIES`) |
| Living-city overlays (traffic, ambient, weather, buildings, events, presence, time tint) | `src/components/metaverse/living-city/*.jsx`, orchestrated by `MetaverseLivingCityLayer.jsx` |
| Living-city data (paths/effects/scenes) | `src/system/metaverse/livingCityRegistry.js` |
| Mini map (abstract, not scene-coordinate) | `MetaverseMiniMap.jsx` — a 3×3 grid of status dots, not spatially mapped to the image |
| Responsive resizing | No dedicated component; `.met-shell`/`.met-camera` are `100vh`/`inset:0`, so the layout is fluid but **unconstrained to the image's aspect ratio** (see §5) |
| Mobile/tablet | `useCompactViewport()` hook in `MetaverseCityPage.jsx:90-100` (`max-width:720px` media query) → feeds `performanceMode` only; CSS breakpoints at 900px/620px reflow HUD panels, not the camera math |
| Reduced-motion | `useReducedMotion()` hook (`prefers-reduced-motion`) → `reducedMotion` prop threads into `MetaverseCamera` (disables transitions via `data-reduced-motion`), `getTrafficPathsForScene()` (returns `[]`), and CSS `.met-shell[data-reduced-motion="true"]` (kills animations) |
| LOW/performance mode | Derived as `reducedMotion || compactViewport ? "LOW" : "STANDARD"` (`MetaverseCityPage.jsx:785`) → `getTrafficPathsForScene()` slices to first path only |

## 4. Coordinate / Transform Pipeline

The scene uses **CSS background-image + a shared inline `transform`**, not `<img>`, SVG, or canvas.

`MetaverseCamera.jsx` renders two sibling divs inside `.met-camera`:

```
.met-camera__world    → background-image (the city plate), inset: -8%, background-size: cover
.met-camera__markers  → holds hotspots + all living-city layers, inset: 0
```

Both get the **same** inline transform: `translate3d(camera.x%, camera.y%, 0) scale(camera.zoom)`. So pan/zoom itself is applied identically to both layers — that part is safe.

**Where drift actually comes from is the static (untransformed) geometry**, not the pan/zoom math:

- `.met-camera__world` is `inset: -8%` → its box is **116% of the viewport** in both dimensions (a deliberate overscan so panning/zooming doesn't expose edges).
- It uses `background-size: cover`, `background-position: center` (no asset defines a `focalPoint`, so it's always `center`).
- `.met-camera__markers` is `inset: 0` → exactly **100% of the viewport**.
- Marker/overlay positions (`left: x%, top: y%`) are percentages of the **100% markers box**, hand-authored in `metaverseNavigationModel.js` and `livingCityRegistry.js`.

Net effect: overlay coordinates are percentages of the *viewport*, while the visible image content is a `cover`-cropped, 116%-oversized rendition of a fixed 1672×941 (≈1.777:1) source. Whenever the viewport's aspect ratio isn't ≈1.777:1 — which is true for almost every real window/tablet/phone size — `background-size: cover` crops a different portion of the source image than at the aspect ratio the markers were eyeballed against, and the 116% overscan box is not accounted for in the markers' 100% coordinate space at all. There is no `object-fit`/letterboxing constraint anywhere forcing `.met-camera` to the image's native aspect ratio.

## 5. Risks to Normalized Coordinate Alignment

1. **Aspect-ratio-dependent `background-size: cover` crop** (`metaverse-city.css:26`): as the browser window/viewport aspect ratio changes, `cover` crops a different slice of the 1672×941 source. Overlay percentages don't crop with it — this is the single biggest risk for a normalized road-trace layer and is **not called out in the existing MERP‑0 audit**.
2. **`-8%` overscan mismatch** (`metaverse-city.css:25`): the background box is 116% of the box that markers/overlays are percentaged against. There's no compensating transform reconciling the two coordinate spaces at rest (zoom=1, x=0, y=0).
3. **Hand-eyeballed coordinates, not image-derived**: every `x`/`y` value in `METAVERSE_DISTRICT_MARKERS`, `METAVERSE_FACILITIES`, and `METAVERSE_TRAFFIC_PATHS`/`METAVERSE_TRANSIT_PATHS` was manually entered against however the image rendered at authoring time — confirmed directly by `docs/metaverse/merp/MERP-0_VISUAL_BASELINE_ASSET_INVENTORY.md`: *"Paths are hand-entered normalized percentages and do not trace actual curved roads."*
4. **Traffic renderer only uses first/last path point**: `MetaverseTrafficLayer.jsx` animates via CSS keyframes between `path.points[0]` and `path.points[length-1]` only — intermediate points in a multi-point road trace are currently ignored, so even a correctly normalized polyline wouldn't be followed today.
5. **No day/night image variants**: `resolveMetaverseAssetVariant` fallback logic is correct, but since every scene only has `baseAsset`, there's nothing to validate cross-variant alignment against yet — if DAY/NIGHT plates are produced later, they must be pixel-identical in composition/crop to the current DUSK plate, or road traces will misalign per-variant.
6. **No focal-point data**: `background?.focalPoint || "center"` in `MetaverseCamera.jsx:59` always resolves to `"center"` since no registry asset defines `focalPoint` — acceptable today only because `center` happens to be what's been eyeballed against.

## 6. Existing Code That Can Be Reused

- **Coordinate convention**: `livingCityRegistry.js` already normalizes all traffic/ambient/building/event data as 0–100 `x`/`y` percentages, the same convention markers use — `validateLivingCityRegistry()` already asserts points stay in `[0,100]`. A road-trace registry should reuse this exact convention.
- **Scene keying**: `getLivingCitySceneId({ level, districtId, facilityId })` already maps camera level/district/facility → a single `sceneId` string that matches `METAVERSE_LIVING_CITY_SCENES` (derived 1:1 from `METAVERSE_PRODUCTION_BACKGROUND_SET`). A road-trace registry can key off the same `sceneId`.
- **Filtering pattern**: `getTrafficPathsForScene(sceneId, { performanceMode, reducedMotion })` already implements the reduced-motion/LOW-mode filtering a road-trace system would need.
- **Authority/classification pattern**: `LIVING_CITY_AUTHORITY_BOUNDARY` and `stateClassification: "DECORATIVE"` are an established, validated convention (`validateLivingCityRegistry` enforces it) — reuse rather than inventing a new one.
- **Container/transform**: `.met-camera__markers` is already the correct shared-transform container to render new overlays into (via the `livingCityLayer` prop already threaded through `MetaverseCamera.jsx`).

## 7. Recommended Canonical Implementation Location

- `src/system/metaverse/metaverseRoadTraceRegistry.js` — sibling to `livingCityRegistry.js`, following its exact shape (`sceneId`, 0–100 `points[]`, `stateClassification: "DECORATIVE"`).
- Perspective/scale utilities → same file or a `metaverseRoadTracePerspective.js` sibling in `src/system/metaverse/` — do not create a new top-level `src/lib` or `src/services` tree.
- Traffic presentation profiles (speed/density/vehicle scale-by-y) → extend `livingCityRegistry.js`'s existing path objects rather than a parallel system, since `MetaverseTrafficLayer.jsx` already consumes that shape.
- Overlay coordinate utilities (the world↔viewport reconciliation fix from §5) → belongs in `MetaverseCamera.jsx` itself or a small `metaverseCameraProjection.js` in `src/system/metaverse/`, since that's the one place both the background and markers transforms are set.

This keeps everything inside the existing `src/system/metaverse/` + `src/components/metaverse/living-city/` ownership boundary MERP already established — no new top-level systems needed.

## 8. Proposed Validation Method

Manual, in-browser, via `npm run dev` (Vite) navigating to `/metaverse`, since no automated visual-regression harness exists for this pipeline today:

1. **Aspect-ratio sweep** (root-causes §5.1/5.2): resize the browser window through several aspect ratios (ultrawide, square, portrait) at zoom=1/pan=0 and check whether a known image landmark (e.g., a bridge) stays under its corresponding marker.
2. **Desktop / tablet / mobile**: repeat at representative breakpoints (below/above 900px and 620px CSS breakpoints, plus the 720px `useCompactViewport` threshold) since that hook changes `performanceMode` and could mask alignment drift behind reduced traffic density.
3. **DAY / DUSK / NIGHT**: use the header's time-preview buttons (`MetaverseCityPage.jsx:812-824`) — since all three currently resolve to the same base plate, this validates only the CSS tint, not cross-image alignment (no day/night plates exist yet to test against).
4. **Zoomed / panned**: zoom in (wheel/`+`/zoom button) and drag-pan, confirming markers and any future road trace move in lockstep with background content, not just with each other.
5. **Reduced-motion**: enable OS-level `prefers-reduced-motion: reduce`, confirm traffic layer returns empty (`getTrafficPathsForScene` short-circuits) and static markers/road traces remain correctly positioned.
6. **LOW/performance mode**: force via compact viewport (<720px) or reduced motion, confirm the sliced single traffic path (if any) still aligns.
7. Existing automated coverage (`tests/metaverseLivingCity.test.mjs`, `tests/metaverseVisualAssetMapping.test.mjs`, `tests/metaverseCityShell.test.mjs`) validates registry shape/bounds (0–100 checks) but **does not** and cannot validate visual pixel alignment — that remains manual/browser-based unless a screenshot-diff tool is introduced later (out of scope here).

## 9. Files Inspected

`metaverseVisualAssets.js`, `metaverseTimeOfDay.js`, `metaverseNavigationModel.js`, `livingCityRegistry.js`, `MetaverseCityPage.jsx`, `MetaverseCamera.jsx`, `MetaverseHotspot.jsx`, `MetaverseCameraControls.jsx`, `MetaverseMiniMap.jsx`, `metaverse-city.css`, all 7 files in `src/components/metaverse/living-city/`, `docs/metaverse/merp/MERP-0_VISUAL_BASELINE_ASSET_INVENTORY.md`, `docs/metaverse/merp/MERP_PROGRAM_CHARTER.md`, `docs/metaverse/MET-15_CLEAN_PLATE_ASSET_PLAN.md`, plus image inspection (`file`, `sips`) of representative production PNGs and a full listing of `public/assets/metaverse/`.

## 10. Files Changed

**None.** Verified via `git status --short` before and after audit work — output was byte-identical to the session-start snapshot at the time this report was written.

## 11. Git Status Summary

Unchanged from session start: same 8 modified owner files and same 6 untracked owner paths (`docs/metaverse/MET-15_*`, `docs/metaverse/merp/`, `src/components/metaverse/living-city/`, `livingCityRegistry.js`, `metaverseTimeOfDay.js`, `tests/metaverseLivingCity.test.mjs`). No commits, no staging, no destructive commands were run.

---

**Bottom line for the road-trace work**: the normalized-percentage convention already used by markers and `livingCityRegistry.js` is the right shared coordinate space to build on, but it currently only self-consistently aligns *between overlays* — not against the actual background pixels — because of the `background-size: cover` + `inset: -8%` mismatch in `MetaverseCamera.jsx`/`metaverse-city.css`. That mismatch (§5.1–5.2) should be fixed before road traces are authored against the image, or every trace will need re-eyeballing once it is.
