# GEO-1 Wave 5D IEP Accessibility Certification

## Certified Behaviors

- Keyboard county controls are reachable through native buttons.
- Enter and Space activate county selection.
- `aria-pressed` communicates the selected county.
- The non-map county list is generated from the same loaded county features as the legacy map.
- The county drawer has `role="dialog"`, `aria-modal="true"`, and an accessible heading.
- Dialog focus enters the close control, Escape closes it, and focus returns to the invoking county control.
- Spatial dual-run diagnostics are development-only and contain only parity-safe counts, booleans, and selected identity/label values.

## Chromium Result

`tests/ui/spatial-iep-county-dualrun.spec.mjs`: `4/4 PASS`.

The existing Quick Map accessibility and live-parity specs also passed: `4/4 PASS`.

The production preview could not mount the capital route because the existing built bundle throws `__DEFINES__ is not defined` before React starts. This is recorded as a production-preview harness blocker; it is separate from the DEV/query gate, which remains covered by unit tests and the no-flag browser route.

## Deliberate Boundary

The default IEP map data source and renderer remain unchanged. This certification does not perform the production Spatial cutover.
