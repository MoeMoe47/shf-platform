# GEO-1 Wave 4D Acceptance Gate

Wave 4D is accepted only when:

- the non-map list is derived from the same safe Spatial marker models;
- legacy marker semantics remain separate and unchanged;
- Spatial items expose safe labels, state, selection, availability, and
  restricted semantics;
- Tab, Enter, Space, and Escape work through native/modal behavior;
- modal focus entry and focus return are verified;
- hidden items are absent and unavailable items communicate their limitation;
- reduced motion removes no essential information;
- map/list interactions use the existing Wave 4C controller;
- browser tests pass or a concrete tooling blocker is documented;
- all prior 235 tests and the build remain green;
- no source mapping, legacy migration, coordinate transform, or authority
  change is introduced.
