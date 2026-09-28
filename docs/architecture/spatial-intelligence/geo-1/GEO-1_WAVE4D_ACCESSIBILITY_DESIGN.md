# GEO-1 Wave 4D Accessibility and Non-Map Parity Design

## Boundary

Wave 4D certifies access to the Spatial-enabled Quick Map without changing
domain, navigation, coordinate, or source authority. The map and semantic
list consume the same sanitized Wave 4B marker models.

```text
ClientProjectionResult[]
  -> Quick Map marker models
       -> visual markers
       -> semantic non-map items
```

Legacy registry markers retain their existing text-equivalent content and are
not converted into Spatial records.

## Semantic Items

`toQuickMapAccessibleItems()` copies only safe marker identity, label, state,
modifiers, accessibility text, and interaction intent. It does not add source
record IDs, provenance, evidence, authorization context, or hidden identity.
Spatial list activation calls the same Wave 4C controller as marker activation.

## Keyboard and Focus

Native buttons provide Tab, Enter, and Space behavior. The full-map modal moves
focus to its close control on open, closes on Escape, and returns focus to the
invoking full-map control. Selection updates do not programmatically move
focus. Hidden items are absent; unavailable items expose disabled semantics.

## State Semantics

Selection uses `aria-pressed` on the toggle-like Spatial marker/list button.
Stale, unavailable, and restricted-notice text comes from the safe client
model. Current location remains a separate presentation concept and is never
derived from selection.

## Motion and Privacy

Reduced-motion users retain all information through labels, state text, focus,
and selection styling; pulsing and transitions are not required. HIDE results
produce neither map markers nor list items. Restricted notices remain generic.
