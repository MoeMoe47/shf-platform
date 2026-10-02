# Universal Metaverse Event Registry (Phase 9)

`src/system/metaverse/mol/molEventRegistry.js` extends the existing MOL event contract (`molEventContract.js`). It does not replace it, and the bus and envelope are unchanged.

## What the registry declares

For each event type, the registry declares:

- `category` (one of 16 `MOL_EVENT_CATEGORIES`);
- `schemaVersion`;
- `simulationAllowed`, `replayable`, `auditable`;
- `spatial`;
- `sensoryEligible`, `moccVisible`;
- `defaultSeverity`;
- the allowed `payloadKeys`.

`sourceSystem` and `sourceAuthority` are never written into the registry. They are derived from the MOL System Registry, so each type keeps exactly one owning system.

## Phase 9 additions

Phase 9 adds two event types:

- `SIMULATION_STATE_CHANGED`
- `REGIONAL_IMPACT_PROJECTED`

Both are owned by `regional-simulation`.

It also adds two optional, validated envelope keys:

- `simulationId`
- `simulationTime`

## Validation

`validateRegisteredMolEvent` rejects an event when:

- the type is unregistered;
- the authority is missing or wrong;
- a payload key is undeclared;
- the envelope is malformed.

The bus still rejects an unknown event type from any source. Every event remains `NOT_EVIDENCE` and `NOT_INSTITUTIONAL_TRUTH`.
