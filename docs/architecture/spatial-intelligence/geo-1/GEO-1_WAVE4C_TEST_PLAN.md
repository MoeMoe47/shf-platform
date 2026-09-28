# GEO-1 Wave 4C Test Plan

## Unit and Integration Cases

| ID | Case | Owner | Expected |
| --- | --- | --- | --- |
| W4C-01 | Spatial marker activation publishes SELECT and selects one visible feature | controller/store/bus | PASS |
| W4C-02 | Selecting a second Spatial marker replaces the first | selection store | PASS |
| W4C-03 | Hidden or non-selectable marker creates no selection or event | controller | PASS |
| W4C-04 | DESELECT clears the current Spatial selection | controller/store | PASS |
| W4C-05 | FOCUS does not select or navigate | controller/bus | PASS |
| W4C-06 | HIGHLIGHT remains separate from selection | controller/bus | PASS |
| W4C-07 | OPEN_RECORD is request-only and has no executor | controller/bus | PASS |
| W4C-08 | Event envelope preserves origin, correlation, layer, and coordinate space | controller/bus | PASS |
| W4C-09 | Event payload excludes source record ID and private provenance | controller | PASS |
| W4C-10 | Master-city and REAL_WORLD markers cannot enter Quick Map selection | controller/store | PASS |
| W4C-11 | Legacy marker activation remains outside Spatial store/bus | MiniMap boundary | PASS |
| W4C-12 | Current-location identity is independent from Spatial selection | MiniMap boundary | PASS |
| W4C-13 | stale/unavailable selection follows existing store validation | store/controller | PASS |
| W4C-14 | Spatial marker view model preserves selected presentation state | MiniMap | PASS |
| W4C-15 | Keyboard and pointer activation share the same Spatial handler | MiniMap | PASS |

Browser focus traversal, screen-reader journeys, focus return, and non-map list
parity remain Wave 4D acceptance work.
