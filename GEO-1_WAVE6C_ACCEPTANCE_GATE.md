# GEO-1 Wave 6C Acceptance Gate

## Decision

`QUALIFIED_WITH_CONDITIONS`

Wave 6C-G geometry qualification keeps the runtime gate blocked until a
scene-local coordinate standard and approved geometry payload exist.

## Conditions Before Runtime Implementation

1. Confirm the regional scene registry as an approved source authority, or
   introduce a reviewed authority contract that names the true owner.
2. Define the record contract for implemented scenes without treating the 13
   route-context-only stops as present geometry.
3. Preserve `METAVERSE` and `metaverse.regional-scene`; no implicit transform
   may be added.
4. Keep Quick Map, master-city, and camera-world spaces separate.
5. Prove the client-safe projection boundary and keep navigation outside
   Spatial.
6. Preserve separate traffic, water, river, ocean, transit, and emergency
   authorities.
7. Re-run the existing regional/browser accessibility baselines before any
   runtime adapter work.
8. Freeze scene-local geometry semantics and approval ownership before
   authoring.
9. Prove asset alignment or explicitly approve variant-specific geometry.

## Gate Results

| Gate | Result |
| --- | --- |
| Stable scene identity | PASS for registry IDs; coverage is partial. |
| Coordinate space | PASS: registered scene-local METAVERSE space. |
| No implicit transforms | PASS. |
| Mounted client | PASS for implemented slugs. |
| Source authority | CONDITION: current registry is presentation authority, not yet confirmed geographic authority. |
| Publication boundary | PASS for current separation; future contract required. |
| Navigation boundary | PASS: router/page remains owner. |
| Feature contract | CONDITION: planning-only, not implemented. |
| Scene-local geometry | BLOCKED: no approved geometry payload; coordinate bounds remain scene-defined. |

## Wave 6 Decision

`METAVERSE_REGIONAL_CAN_PROCEED`

This means Wave 6C may proceed to a contract/red-test review after the listed
conditions are addressed. It does not authorize an adapter or client runtime.
Geometry authoring is separately `BLOCKED_BY_COORDINATE_STANDARD` until the
Wave 6C-G entry conditions are closed.

## Validation Snapshot

- Full Spatial suite: `383/383 PASS`.
- Existing regional/mobility unit slice: `163/163 PASS`.
- Production build: `PASS`.
- `git diff --check`: `PASS`.
- Fresh browser check: `5/6 PASS`; the single failure was an environmental
  `500`/connection-refused response from the unavailable companion API on
  `127.0.0.1:8091`, not a regional Spatial assertion. The previously certified
  browser baseline remains `12/12 PASS`.
- No production files, scene assets, routes, coordinate registries, or runtime
  adapters were changed in Wave 6C.

## ODOT Relationship

ODOT remains `PARKED`: source-qualified with conditions, rights clarification
pending, snapshot model defined, and adapter blocked by the absence of a
legitimate consuming client.
