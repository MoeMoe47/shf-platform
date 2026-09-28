# GEO-1 Wave 4C Acceptance Gate

Wave 4C may be accepted only when:

- the existing Wave 4B adapter is frozen;
- the existing Selection Store and Interaction Bus are reused;
- Spatial markers alone use the new event path;
- legacy markers, registry identities, and `MetaverseCityPage` navigation are
  unchanged;
- SELECT, DESELECT, FOCUS, HIGHLIGHT, and request-only OPEN_RECORD are the
  only emitted event types;
- hidden markers cannot be selected or reconstructed;
- source record IDs and private provenance do not enter event payloads;
- Quick Map remains `METAVERSE` / `metaverse.quick-map` only;
- no coordinate transform, domain mutation, route engine, or source mapping is
  introduced;
- existing Spatial, Quick Map, Wave 4A, and Wave 4B suites remain green;
- focused Wave 4C tests pass and the build succeeds;
- browser-level Wave 4D accessibility work is not claimed complete.
