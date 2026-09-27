# GEO-1B Type and Schema Plan

This plan describes implementation types only. It does not create schemas, migrations, or production code.

| Type | Required fields | Optional fields | Enum candidates | Validation | Authority expectations | Serialization |
|---|---|---|---|---|---|---|
| CoordinateFamily | `id` | `description` | `REAL_WORLD`, `METAVERSE` | must be known enum | Spatial owns family labels | JSON-safe string |
| CoordinateSpace | `id`, `family`, `units`, `origin`, `axisOrientation`, `boundsOrRange`, `source`, `version` | `transformAvailability`, `transformAuthority`, `provenance` | real-world lat/lng, GeoJSON, jurisdiction, quick-map, master-city, regional-scene, camera-world | no implicit conversion; stable id | Spatial owns registry metadata | JSON object |
| SpatialFeature | `featureId`, `featureType`, `domain`, `sourceAuthority`, `sourceRecordId`, `coordinateFamily`, `coordinateSpaceId`, `geometry`, `layerId` | title, label, state, temporalState, provenance, actions | feature types by layer | coordinate space must exist | source authority owns record | JSON object/array |
| SpatialLayer | `layerId`, `name`, `owningDomain`, `sourceAuthority`, `supportedCoordinateSpaces`, `visibilityPolicy` | permissions, time-aware, lifecycle, accessibility | lifecycle values from GEO-1A | coordinate spaces must exist | layer owner not data authority | JSON object |
| SpatialSelection | `selectionId`, `featureId`, `domain`, `sourceAuthority`, `coordinateFamily`, `coordinateSpaceId`, `layerId`, `timestamp` | reason, provenance, eligibleActions | selection reason enums | selected feature must be eligible | Spatial owns selection only | JSON object/query-safe id |
| SpatialInteraction | `type`, `interactionId`, `timestamp`, `publisher`, `featureId` or `layerId` | correlationId, actionRef, payload | SELECT, DESELECT, FOCUS, HIGHLIGHT, OPEN_RECORD, REQUEST_ROUTE, FOLLOW_ROUTE, INSPECT_EVIDENCE, REQUEST_DOMAIN_ACTION | known type and authority refs | bus owns envelope only | JSON event |
| SpatialState | `state`, `sourceAuthority` | priority, reason, visualToken | NORMAL, SELECTED, NEXT, SCHEDULED, EVENT_SOON, EVENT_LIVE, MISSION_ACTIVE, EMERGENCY, RESTRICTED, CLOSED, COMPLETED, UNAVAILABLE | no fabricated state | state source owns truth | JSON object |
| TemporalProjection | `category`, `sourceTimestamp`, `sourceAuthority`, `freshness` | effectiveStart, effectiveEnd, timezone | current, upcoming, soon, live, ended, scheduled_later | timezone/freshness required where relevant | source owns event time | JSON object |
| SpatialProvenance | `sourceAuthority`, `sourceRecordId`, `updatedAt`, `projectionAdapter`, `projectionVersion` | evidenceRef, coordinateProvenance, freshness | verification/publication enums referenced | timestamps parseable | truth/evidence external | JSON object |
| PublicationEligibility | `level`, `publicationState` | reason, requiredPermissions | PUBLIC, AUTHENTICATED, ORGANIZATION, OPERATOR, ADMIN, RESTRICTED, NOT_PUBLISHED | must be enforced at projection/render | publication authority external | JSON object |
| SpatialActionReference | `actionId`, `domain`, `sourceAuthority`, `actionType` | label, href, method, requiredPermissions | domain-specific | request only, no implicit approval | domain decides validity | JSON object |
