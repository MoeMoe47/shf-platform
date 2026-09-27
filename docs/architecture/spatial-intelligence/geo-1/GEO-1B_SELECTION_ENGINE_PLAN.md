# GEO-1B Selection Engine Plan

Shared selection lets authorized panels react to a spatial feature without the map owning the domain record.

## Lifecycle

1. User or system emits `SELECT`.
2. Selection engine validates feature id, domain, coordinate family, coordinate space, layer, and eligibility metadata.
3. Selection context updates.
4. Subscribed panels receive selection if authorized and compatible.
5. Stale, unavailable, or unauthorized selections are cleared or downgraded.

## Requirements

- stable selection ids
- feature id and source authority included
- coordinate-space awareness
- optional URL/query synchronization for shareable views
- multi-selection support after single-selection baseline
- explicit clear/reset event
- stale selection detection when layer, auth, or data freshness changes
- keyboard and nonvisual selection equivalents

## Example

Selecting Franklin County may let Programs, Partners, Projects, Opportunities, and Workforce panels react only when they subscribe to county selections and are authorized for the underlying data.

Selection must not grant permissions, fabricate data, modify canonical state, imply verification, or bypass publication rules.
