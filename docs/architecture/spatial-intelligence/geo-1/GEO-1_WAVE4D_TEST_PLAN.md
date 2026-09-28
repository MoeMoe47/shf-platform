# GEO-1 Wave 4D Test Plan

| ID | Requirement | Level |
| --- | --- | --- |
| W4D-01 | Accessible item preserves safe marker identity and label | unit |
| W4D-02 | Selected state is represented consistently in map/list data | unit |
| W4D-03 | Stale and unavailable state text remains available | unit |
| W4D-04 | Restricted/hidden items are not represented | unit |
| W4D-05 | Private fields are absent from non-map items | unit |
| W4D-06 | List interaction metadata matches marker interaction metadata | unit |
| W4D-07 | Modal has dialog semantics and a close control | browser/static |
| W4D-08 | Escape closes the full-map modal | browser |
| W4D-09 | Opening modal focuses an element inside it | browser |
| W4D-10 | Closing modal returns focus to the invoking control | browser |
| W4D-11 | Native buttons support keyboard activation | browser |
| W4D-12 | Hidden restricted items are absent from both presentations | unit/browser |
| W4D-13 | Reduced motion retains state and interaction semantics | browser |
| W4D-14 | Current-location presentation remains separate from selection | unit |
| W4D-15 | Legacy marker text-equivalent behavior remains unchanged | regression |

Browser certification uses the repository Playwright setup where the route can
be mounted without external data. Any environment blocker is reported rather
than treated as a passing accessibility result.
