# GEO-1 Wave 4D Accessibility Implementation Report

## Scope

Wave 4D adds data-level non-map parity for supplied Spatial Quick Map markers and closes the existing full-map modal focus lifecycle gap. Legacy markers, source mappings, navigation, selection authority, and coordinate ownership remain unchanged.

## Implementation

- `src/system/spatial/clients/quickMap/accessibility.js` creates an allowlisted semantic item from the sanitized Wave 4B marker model.
- `MetaverseMiniMap.jsx` renders those items as native buttons when Spatial markers are supplied, using the same marker models as the visual path.
- The full-map dialog now focuses its close control on entry, closes on `Escape`, and returns focus to the invoking control.
- `metaverse-city.css` provides selected/list focus styling and disables list motion under `prefers-reduced-motion: reduce`.

No legacy marker is converted, no source mapping is created, and the current-location marker remains separate from selection.

## Semantic and Privacy Boundary

The non-map projection copies only `id`, label/state, approved modifiers, approved accessibility text, and safe interaction metadata. It excludes source record IDs, provenance, evidence, adapter identity, authorization context, and hidden feature data. Hidden features have no client marker and therefore no semantic list item.

## Verification

- Wave 4D semantic projection: 8/8 PASS.
- Full build: PASS. Existing Vite chunk-size and dynamic-import warnings remain unrelated.
- Browser certification: the Chromium project launched successfully against Vite on port 5174. `tests/ui/spatial-quick-map-accessibility.spec.mjs` passed 1/1 browser test, covering keyboard opener activation, dialog focus entry, Escape close, and focus return. The production city page currently supplies no Spatial marker set, so marker/list parity, restricted absence, and reduced-motion data semantics remain unit-covered rather than being overstated as browser-rendered coverage.

## Remaining Wave 4D Conditions

- Add browser-level coverage for a supplied Spatial marker fixture before certifying rendered marker/list parity.
- Wave 4E remains out of scope.
