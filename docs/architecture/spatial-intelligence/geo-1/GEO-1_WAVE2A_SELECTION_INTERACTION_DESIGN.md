# GEO-1 Wave 2A Selection / Interaction Design

Status: design and executable test harness only

Wave 2A defines shared selection and interaction behavior before production runtime behavior begins. No map integration, domain write actions, backend persistence, WebSocket infrastructure, cross-tab synchronization, or route restoration is included.

## Feature ID Decision

Decision: ACCEPT.

Wave 1 feature IDs use:

```text
spatial:<domain>:<featureType>:<sourceAuthority>:<sourceRecordId>
```

The strategy is accepted for Wave 2 because it is deterministic, namespaced, source-authority preserving, URL-safe after normalization, case-normalized, collision-resistant across authorities, and rejects missing source record IDs. Source record IDs containing colons are normalized into safe delimiters rather than preserved verbatim; the original source record remains available through `sourceRecordId` and provenance. Versioning stays outside the ID unless a future source authority requires versioned identity.

## Selection Lifecycle

Canonical lifecycle:

```text
NONE -> SELECTED -> UPDATED -> CLEARED
```

Wave 2B should implement single selection first. Multi-selection is deferred and must not appear accidentally. Future multi-selection requires explicit `getSelections()` and `selectMany(...)` contracts.

## Selection Store Contract

Recommended Wave 2B model: pure JavaScript in-memory store under `src/shared/spatial/selection/`.

Reason: existing repository patterns include tiny no-dependency event helpers and heavier system event buses. Spatial selection should start with the smallest deterministic store and avoid React-only coupling, persistence, network messaging, or domain authority.

Conceptual API:

```text
getSelection()
select(selection)
updateSelection(selection)
clearSelection(reason)
subscribe(handler)
unsubscribe(handler)
```

The store must preserve source authority, coordinate family, coordinate space, layer, provenance, publication state, and eligible actions. It must not mutate domain records, convert coordinates, authorize actions, verify claims, approve publication, or repair malformed selection.

## Selection Validation

Before state enters the store:

- feature must exist in the supplied projected feature set
- feature ID must be canonical
- coordinate space must be registered
- coordinate family must match the coordinate space
- layer must exist when supplied
- layer must support the coordinate space
- provenance must be valid
- publication state must be retained
- domain and source authority must be retained

Malformed selections are rejected. Unknown values fail safely or remain explicitly unavailable.

## Coordinate-Aware Selection

A `metaverse.quick-map` selection remains `metaverse.quick-map`. It does not become `metaverse.master-city`.

`REAL_WORLD` and `METAVERSE` selections are not interchangeable. Coordinate-space identity is part of the selection contract and interaction envelope.

## SELECT vs REQUEST_DOMAIN_ACTION

`SELECT` exposes context to spatial clients and subscribed panels.

`REQUEST_DOMAIN_ACTION` is a separate interaction that asks a domain authority to consider an action. Selection never means approve, assign, dispatch, purchase, enroll, verify, publish, authorize, complete, or change mission/event state.

## Interaction Envelope

Conceptual fields:

```text
interactionId
interactionType
featureId
layerId
domain
sourceAuthority
coordinateFamily
coordinateSpaceId
timestamp
originClient
originComponent
correlationId
payload
provenance
requestedAction
```

Required for all events: `interactionId`, `interactionType`, `timestamp`, `originClient`, `originComponent`, `domain`, `sourceAuthority`, `correlationId`, and `provenance`.

Feature-scoped events require `featureId`, `layerId`, `coordinateFamily`, and `coordinateSpaceId`.

`REQUEST_DOMAIN_ACTION` requires `requestedAction` and must hand authority checks to the domain service.

## Interaction Types

| Type | Purpose | Publishers | Subscribers | Required payload | Authority implications | Changes Spatial state | Can request domain behavior | Replayable |
|---|---|---|---|---|---|---:|---:|---:|
| SELECT | choose a projected feature | maps, lists, panels | selection store, panels | feature envelope | none | YES | NO | NO |
| DESELECT | clear selected context | maps, panels, keyboard controls | selection store, panels | optional reason | none | YES | NO | NO |
| FOCUS | move attention/viewport/focus | maps, lists, panels | maps, accessibility surfaces | feature or viewport ref | none | MAYBE | NO | NO |
| HIGHLIGHT | temporary visual emphasis | maps, panels | maps, legends | feature or layer ref | none | MAYBE | NO | NO |
| OPEN_RECORD | request opening source record UI | panels, maps | router/domain UI | record reference | domain controls visibility | NO | YES | NO |
| REQUEST_ROUTE | request route/path presentation | maps, panels | route/path presenter | route endpoints/ref | route authority external | NO | YES | NO |
| FOLLOW_ROUTE | request following a route visually | maps, panels | route/path presenter | route id/ref | route authority external | MAYBE | NO | NO |
| INSPECT_EVIDENCE | request evidence panel | maps, panels | evidence UI | evidence reference | evidence authority external | NO | YES | NO |
| REQUEST_DOMAIN_ACTION | request domain behavior | authorized UI | domain action handler | requested action | domain decides | NO | YES | NEVER auto replay |

## Interaction Bus Design

Recommended Wave 2B API:

```text
publish(event)
subscribe(type, handler)
unsubscribe(subscription)
```

`subscribeAll(...)` is deferred until a debugging need exists.

Dispatch should be synchronous and deterministic for local UI interactions. Subscribers are called in subscription order. Subscriber exceptions are isolated and returned in publish results; they must not corrupt selection state. Duplicate subscriptions are allowed only if they return distinct unsubscribe handles and dispatch deterministically.

No network messaging, persistence, cross-tab sync, remote replay, or distributed events are included.

## Replay Policy

Decision: no event replay by default.

Transient UI interactions are not replayed. Canonical selection state lives in the selection store independently. Domain actions are never replayed automatically. Debug capture may be added later only as a development-only hook.

## URL / Query Synchronization

Optional URL state may include:

- `featureId`
- `layerId`
- `coordinateSpaceId`

URLs must not include private data, evidence contents, permission grants, authorization state, or sensitive record details. URL state is a hint for restoring UI context, not authority.

## Stale Selection Handling

Safe behavior:

- selected feature disappears: clear selection or mark unavailable
- feature becomes restricted: clear or restrict
- feature becomes unpublished: clear or restrict
- layer becomes unavailable: clear
- domain record is deleted: clear
- coordinate space becomes unavailable: clear
- feature ID changes: clear and require new selection
- source becomes stale: mark unavailable or clear according to policy

Do not fabricate replacement state.

## Public / Private Selection Boundary

Selection must not bypass projection eligibility. Manually injecting a `NOT_PUBLISHED` feature ID into the selection store must not expose that feature publicly. Spatial may enforce projection eligibility, but authorization and publication authority remain external.

## Accessibility

Wave 2B selection and interactions must support keyboard selection, focus, text-equivalent feature lists, `aria-selected`, focus return after clear, appropriate announcements, reduced-motion equivalents, and non-map equivalent actions.
