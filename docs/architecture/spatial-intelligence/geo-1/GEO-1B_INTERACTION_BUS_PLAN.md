# GEO-1B Interaction Bus Plan

The Interaction Bus carries spatial events. It does not approve domain actions.

## Event Types

- `SELECT`
- `DESELECT`
- `FOCUS`
- `HIGHLIGHT`
- `OPEN_RECORD`
- `REQUEST_ROUTE`
- `FOLLOW_ROUTE`
- `INSPECT_EVIDENCE`
- `REQUEST_DOMAIN_ACTION`

## Event Envelope

Required fields: `interactionId`, `type`, `timestamp`, `publisherId`, `domain`, `sourceAuthority`, and `correlationId`.

Feature events also include `featureId`, `coordinateFamily`, `coordinateSpaceId`, and `layerId`.

Action events include `actionReference` and are handed to the domain authority for authorization and validity checks.

## Runtime Plan

- publisher registration by map client or panel id
- subscriber registration by interaction type and optional domain/layer filter
- no replay by default
- optional debug replay only in dev/test
- correlation ids for action chains
- logs should include envelope metadata, not sensitive payloads
- tests should cover dispatch, filtering, no replay, and authorization handoff
