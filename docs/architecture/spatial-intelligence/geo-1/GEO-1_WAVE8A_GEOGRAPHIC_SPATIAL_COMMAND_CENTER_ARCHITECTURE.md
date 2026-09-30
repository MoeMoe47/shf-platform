# GEO-1 Wave 8A Geographic / Spatial Command Center Architecture

## 1. Purpose

Wave 8 defines the architecture for a Geographic / Spatial Command Center: a
read-oriented operational surface over qualified Spatial projections and
governed intelligence. It is not a new source system and does not replace the
authority of the systems it presents.

Decision: `WAVE_8_ARCHITECTURE_READY_WITH_CONDITIONS`

The architecture is ready for contract work with these conditions:

- V1 begins with already qualified Spatial clients only.
- Wave 7 governed intelligence is initially available only for Oil Rig.
- Coordinate spaces remain separate workspaces; no unified map or implicit
  overlay is permitted.
- ODOT and every deferred or blocked source remain outside the release.
- Runtime implementation begins only after the Wave 8B contracts are frozen.

## 2. Governing Principle

Separate authorities, shared spatial coordination.

The Command Center consumes governed projections, sanitized client results,
evidence summaries, temporal context, freshness state, and geometric reasoning.
It may coordinate presentation state, but it cannot become source truth, domain
truth, policy authority, identity or authorization authority, publication
authority, metric authority, navigation authority, or operational authority for
traffic, water, transit, or emergency response.

## 3. Existing Qualified Foundations

The current Spatial V1 qualified clients are:

1. IEP Ohio County Map, backed by Census county geography in
   `real-world.county-geojson`.
2. Metaverse Quick Map, backed by the Metaverse Quick Map registry in
   `metaverse.quick-map`.
3. Metaverse Regional Scene - Oil Rig, backed by the Regional Scene and
   Regional Geometry registries in `metaverse.regional-scene`.

The current Wave 7 governed intelligence client is only:

1. Metaverse Regional Scene - Oil Rig.

The existing architecture already provides coordinate and layer registries,
projection adapter registration, the canonical projection pipeline,
presentation-state resolution, sanitized IEP and Quick Map client models, the
Regional Scene intelligence client, Wave 7 evidence/temporal/freshness
contracts, same-space relationships, governed reasoning, a selection store,
and an interaction bus.

## 4. Command Center Role

The Command Center is a presentation and orchestration surface. It may:

- display qualified SpatialFeatures and sanitized client projections;
- group features by registered layer and coordinate space;
- show safe evidence, temporal, freshness, relationship, and limitation
  summaries;
- coordinate selection and highlight presentation state;
- filter already-qualified visible information;
- compare views only as explicitly separate spaces;
- link to an owning system when that link is a deliberate presentation action.

It may not create source records, mutate domain truth, bypass the projection
pipeline, infer unsupported domain relationships, approve publication,
authorize users or organizations, assign eligibility or jurisdiction, assign
service areas, dispatch responders, route traffic/water/transit, create metric
truth, or create coordinate transforms.

## 5. Authority Model

| Capability | Authority owner | Command Center may read/display | Command Center may not decide |
| --- | --- | --- | --- |
| Source/domain records | Owning domain registry | Sanitized projection summaries | Source or domain truth |
| Geometry | Registered geometry authority | Qualified geometry summaries/rendering inputs | Geometry approval or mutation |
| Coordinate spaces | Coordinate Space Registry | Space/family labels and boundaries | Conversion or alignment |
| Publication | Source/publication authority | Public/suppressed status allowed by sanitizer | Publication approval |
| Evidence | Source/Truth Spine contracts | Safe reference summaries | Evidence truth or provenance ownership |
| Temporal state | Source timestamps plus Spatial projection | Safe temporal summary | Source timestamps |
| Freshness | Explicit source/layer policy | Freshness state | Threshold invention or validity |
| Relationships | Wave 7 same-space engine | Geometric facts | Domain/policy conclusions |
| Reasoning | Wave 7 governed service | Allowed result classes and limitations | Domain facts or policy decisions |
| Selection/highlight | Existing Spatial presentation mechanisms | Selected/highlighted state | Source record mutation |
| Navigation | Owning route/system | Explicit links where permitted | Automatic route or scene change |
| Identity/authorization | Identity and access authorities | Safe access result | User/org authorization |
| Eligibility | Owning registry/policy authority | Qualification status if sanitized | Eligibility decisions |
| Traffic/water/transit | Respective operational authorities | Nothing until qualified | Routing or navigability |
| Emergency/dispatch | Emergency/dispatch authority | Nothing until qualified | Dispatch decisions |
| Metrics/reporting | Metric/reporting authority | Approved summaries only | Metric truth |

## 6. Coordinate-Space Isolation

The registered spaces are:

### REAL_WORLD

- `real-world.latlng`
- `real-world.county-geojson`

### METAVERSE

- `metaverse.quick-map`
- `metaverse.master-city`
- `metaverse.regional-scene`
- `metaverse.camera-world`

The Coordinate Space Registry marks the current spaces as having no available
transform authority. The Command Center must therefore use separate spatial
workspaces or tabs, each with an explicit coordinate family and coordinate-space
label. Side-by-side comparison is allowed only as comparison of separate
governed views. It must not draw a shared geometry canvas, synchronized cursor,
distance, containment, intersection, or alignment between incompatible spaces.

The Command Center must fail closed for cross-space relationships and must not
introduce Quick Map to Regional Scene, master-city to Regional Scene, or
real-world to Metaverse conversion.

## 7. Qualified Client Model

A Command Center client is admitted only through the existing projection and
client contracts. Admission requires a registered adapter or existing governed
client path, valid SpatialFeature or sanitized ClientProjectionResult data,
known coordinate space, allowed publication/visibility state, usable
provenance, and the client-specific qualification contract.

Qualification is additive to source authority. The Command Center does not
qualify a client by displaying it.

## 8. Client-Safe View Model

The proposed bounded view model is `CommandCenterSpatialView`:

```text
{
  viewId,
  coordinateSpace,
  coordinateFamily,
  qualifiedClient,
  layers,
  visibleFeatureSummaries,
  selectedFeatureSummary,
  relationshipSummaries,
  intelligenceSummaries,
  evidenceSummaries,
  temporalSummary,
  freshnessSummary,
  limitations,
  authorityBoundary,
  sourceHealth,
  status
}
```

Every field is client-safe and allowlisted. The view model excludes raw source
records, unrestricted geometry, hidden or restricted IDs, approval internals,
authoring metadata, filesystem paths, raw provenance, domain authority objects,
and policy decisions. Raw geometry may be passed to a renderer only through an
explicit renderer contract for a qualified public feature; it is not part of a
general command payload.

## 9. Layer Architecture

Reuse the existing `SpatialLayerRegistry` and default layer registry. Existing
layers already provide coordinate-space support, owning domain, source
authority, visibility policy, selection capability, verification capability,
accessibility behavior, and lifecycle status.

The first Command Center should group layers by coordinate family and exact
coordinate space. It may add presentation-only visibility toggles and
qualification/freshness badges around those registered layers. It must not
invent a second layer taxonomy or alter layer lifecycle, publication, or source
authority.

Initial visible groups are:

- Real-world Counties: `real-world.county-geojson`.
- Metaverse Quick Map Locations: `metaverse.quick-map`.
- Metaverse Regional Scenes: `metaverse.regional-scene`.

Master-city traces and other experimental layers remain unavailable to the
first release unless separately admitted.

## 10. Selection / Highlight Coordination

Reuse the existing `createSpatialSelectionStore` and `createSpatialInteractionBus`.
They already validate feature identity, domain, source authority, layer,
coordinate family, coordinate space, publication eligibility, and stale
selection behavior. Quick Map interaction also provides a governed example of
presentation-only selection and highlight intent.

Wave 8 should add a thin Command Center coordinator only if the existing store
cannot represent workspace-local selection. Such a coordinator may hold
presentation state keyed by `viewId` and coordinate space, and may clear stale
selection when a workspace changes. It must not become a source store, global
cross-space selection authority, navigation executor, or domain action
executor. The first architecture contract should prefer view-only behavior
until this gap is demonstrated.

## 11. Spatial Intelligence Integration

The Command Center consumes the Wave 7D reasoning service through a client-safe
adapter. For V1, the only governed intelligence surface is the Oil Rig
Regional Scene inspection:

```text
approved Oil Rig Polygon
CONTAINS
scene-local Point
```

The result remains `GEOMETRIC_FACT`, with `GEOMETRIC_FACT_ONLY` authority. The
Command Center may display the relationship, value, coordinate space,
freshness, evidence summary, and limitations. It may not turn that result into
jurisdiction, service-area, dispatch, eligibility, navigation, or publication
behavior.

IEP and Quick Map may appear as qualified Spatial V1 views, but they must not
be presented as Wave 7 governed reasoning clients until separately integrated
and tested.

## 12. Evidence / Temporal / Freshness

Reuse Wave 7 evidence references, temporal context, and freshness resolution.
Evidence stays reference-only. Source-owned fields remain source-owned:
`observedAt`, `effectiveFrom`, `effectiveTo`, `retrievedAt`, and `supersededAt`.
Spatial owns only `projectedAt`.

The Command Center may show `CURRENT`, `STALE`, `EXPIRED`, `HISTORICAL`, or
`UNKNOWN` when present in the sanitized result. `UNKNOWN` is not current, stale
does not mean invalid, and historical is not stale solely due to age. The
Command Center must not invent timestamps, thresholds, or source freshness.

## 13. Privacy

Compose existing sanitizers; do not create a broad bypass. Inputs and results
that are hidden, restricted, not published, invalid, suppressed, unavailable,
or unqualified fail closed or use the existing safe generic behavior.

The Command Center must not make hidden and unknown distinguishable when that
would leak information. It must not expose raw evidence references, source
records, restricted identifiers, reviewer identity, filesystem paths,
authoring data, or internal diagnostics.

## 14. System Health / Status

The Command Center may expose a compact, safe operational status summary with
booleans or bounded states such as:

- adapter registered;
- geometry qualified;
- projection eligible;
- publication permitted for this viewer;
- freshness state;
- evidence available;
- qualified client;
- reasoning available;
- transform unavailable.

These are presentation summaries derived from existing contracts. They are not
health authority, publication authority, or qualification authority. Raw error
messages, filesystem paths, private IDs, stack traces, and sensitive
diagnostics remain internal.

## 15. Accessibility

Wave 8 must preserve the existing Quick Map accessibility direction and Wave 7
panel requirements:

- keyboard access to every control;
- semantic landmarks and named workspaces;
- screen-reader text summaries for map state;
- visible focus;
- layer and selection state expressed without color alone;
- reduced-motion support;
- text alternatives for critical spatial state;
- selection/highlight announcements that identify the active workspace;
- deterministic loading, empty, error, suppressed, unavailable, and restricted
  states.

The primary spatial canvas must have a meaningful text-equivalent summary. A
visual map is never the only representation of a critical state.

## 16. Deferred / Blocked Sources

No source is promoted in Wave 8A.

ODOT remains `QUALIFIED_WITH_CONDITIONS` and parked pending rights
clarification, governed snapshot lifecycle, and a named ODOT-specific
consumer.

Open Sea, Metaverse master-city geometry, Traffic, Water Mobility, Transit /
Sky Bridge, Emergency / Dispatch, SHS / Exchange, SHF, CivicSure, Career,
Opportunities, Events, Workforce, Projects, and legacy globes remain deferred,
blocked, or not justified according to their existing disposition. They do not
appear in the first Command Center release.

## 17. Proposed First Release

The first production-safe Command Center release should contain:

1. A space selector with separate workspaces for the qualified real-world
   county view and qualified Metaverse views.
2. The IEP Ohio County Map as a read-only real-world workspace.
3. The Metaverse Quick Map as a read-only Metaverse workspace.
4. The Oil Rig Regional Scene as a separate `metaverse.regional-scene`
   workspace.
5. The Oil Rig DEV-only governed inspection as a gated intelligence panel,
   not a production-wide reasoning surface.
6. Existing selection/highlight behavior where its client contract permits it.
7. Compact layer, freshness, evidence, limitation, and source-health summaries.

The first release must not overlay these spaces or add a cross-space comparison
operation. The safest initial implementation can launch as view-only workspace
navigation and defer shared selection until its contracts are explicit.

## 18. Test Strategy

Proposed Wave 8 contracts:

- `tests/spatialCommandCenterArchitectureWave8B.test.mjs`
- `tests/spatialCommandCenterQualifiedClientsWave8B.test.mjs`
- `tests/spatialCommandCenterCoordinateIsolationWave8B.test.mjs`
- `tests/spatialCommandCenterViewModelWave8B.test.mjs`
- `tests/spatialCommandCenterPrivacyWave8B.test.mjs`
- `tests/spatialCommandCenterLayerStateWave8C.test.mjs`
- `tests/spatialCommandCenterSelectionWave8C.test.mjs`
- `tests/spatialCommandCenterReasoningWave8E.test.mjs`
- `tests/spatialCommandCenterEvidenceFreshnessWave8E.test.mjs`
- `tests/spatialCommandCenterAccessibilityWave8F.test.mjs`
- `tests/ui/spatial-command-center-wave8f.spec.mjs`

The contracts should prove qualified-client admission, exact-space isolation,
sanitized view output, fail-closed privacy, presentation-only selection,
bounded intelligence integration, accessibility, deterministic states, and no
authority or transform expansion.

## 19. Wave 8 Implementation Phases

1. **Wave 8A - Architecture and authority audit:** freeze this document and
   the entry gates.
2. **Wave 8B - Contracts and qualified-client registry:** define the bounded
   CommandCenterSpatialView, admission rules, workspace identity, and
   coordinate-space isolation contracts.
3. **Wave 8C - State foundation:** compose existing layer registry, selection
   store, interaction bus, visibility state, and safe status summaries without
   creating a new authority.
4. **Wave 8D - First spatial workspace UI:** implement the separate real-world
   county and Metaverse workspaces with accessible canvas summaries and no
   overlay.
5. **Wave 8E - Intelligence/evidence/freshness integration:** expose only
   sanitized Oil Rig intelligence and bounded evidence/temporal/freshness
   summaries.
6. **Wave 8F - Browser and accessibility acceptance:** verify keyboard,
   screen-reader semantics, reduced motion, privacy, loading/error states, and
   route/workspace isolation.
7. **Wave 8G - Final acceptance:** rerun all Spatial regressions, certify
   qualified and deferred clients, and record the final decision.

Dependencies are deliberate: admission and space isolation precede state;
state precedes UI; UI precedes intelligence presentation; browser acceptance
precedes final certification.

## 20. Architecture Decision

`WAVE_8_ARCHITECTURE_READY_WITH_CONDITIONS`

Wave 8 may proceed to contract design. It may not proceed by treating the
Command Center as a source or policy system, by unifying coordinate spaces, by
promoting deferred clients, or by implying that IEP and Quick Map have Wave 7
governed reasoning. New authorities: `NONE`. New transforms: `NONE`.
