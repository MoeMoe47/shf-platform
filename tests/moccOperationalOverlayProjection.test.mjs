import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectMoccEvents } from "../src/system/metaverse/operations/moccEventProjection.js";
import { getMoccIntegrationStatus } from "../src/system/metaverse/operations/moccIntegrationStatusRegistry.js";
import { MOCC_OPERATIONAL_OVERLAY_BY_ID } from "../src/system/metaverse/operations/moccOperationalOverlayRegistry.js";
import { projectMoccOperationalOverlayEntities } from "../src/system/metaverse/operations/moccOperationalOverlayProjection.js";
import { QUICK_MAP_COORDINATE_SPACE } from "../src/system/metaverse/metaverseMiniMapRegistry.js";
import { MASTER_CITY_COORDINATE_SPACE } from "../src/system/metaverse/metaverseDestinationRelationshipRegistry.js";
import { METAVERSE_ACTIVITY_PLACEHOLDERS, METAVERSE_DISTRICT_MARKERS } from "../src/system/metaverse/metaverseNavigationModel.js";

const visible = (...overlayIds) => Object.fromEntries(overlayIds.map((id) => [id, true]));

test("Missions and Civic overlays adapt only source-backed, spatial MOCC-3 events", () => {
  const events = projectMoccEvents([
    { event_id: "mission:1", source: "PROGRAM", source_ref: "mission-projection-1", title: "Canonical mission", district_id: "civic-district", facility_id: "city-hall", status: "ACTIVE" },
    { event_id: "civic:1", source: "CIVIC", source_ref: "civic-projection-1", title: "Civic session", district_id: "civic-district", facility_id: "city-hall", status: "ACTIVE" },
    { event_id: "mission:unknown-place", source: "MISSION", source_ref: "mission-no-map", title: "Unmapped", district_id: "unknown-district" },
    { event_id: "unattributed", event_type: "MISSION.ACTIVITY", title: "No source authority", district_id: "civic-district" },
  ]);
  const entities = projectMoccOperationalOverlayEntities({ events, visibility: visible("missions", "civic") });
  const mission = entities.find(({ overlay_id }) => overlay_id === "missions");
  const civic = entities.find(({ overlay_id }) => overlay_id === "civic");

  assert.equal(entities.length, 2);
  assert.equal(mission.source_authority, "MET-7_PROGRAM_MISSION");
  assert.equal(mission.source_reference, "mission-projection-1");
  assert.equal(mission.spatial_reference.facility_id, "city-hall");
  assert.equal(mission.spatial_reference.coordinate_space_id, MASTER_CITY_COORDINATE_SPACE.id);
  assert.equal(mission.state, "ACTIVE");
  assert.equal(civic.source_authority, "SHF_CIVIC");
  assert.equal(civic.source_reference, "civic-projection-1");
  assert.equal(civic.spatial_reference.facility_id, "city-hall");
});

test("connected overlays with no matching source-backed spatial records validly render zero entities", () => {
  assert.equal(MOCC_OPERATIONAL_OVERLAY_BY_ID.missions.status, "CONNECTED");
  assert.equal(MOCC_OPERATIONAL_OVERLAY_BY_ID.civic.status, "CONNECTED");
  assert.deepEqual(projectMoccOperationalOverlayEntities({ events: [], visibility: visible("missions", "civic") }), []);
  assert.deepEqual(projectMoccOperationalOverlayEntities({ events: [{ source_authority: "SHF_CIVIC" }], visibility: visible("civic") }), []);
});

test("Simulations use canonical activity/facility context without inventing runtime state", () => {
  const entities = projectMoccOperationalOverlayEntities({ events: [], visibility: visible("simulations") });
  const canonicalActivities = METAVERSE_ACTIVITY_PLACEHOLDERS.filter(({ mountPoint }) => mountPoint === "simulation");
  assert.equal(entities.length, canonicalActivities.length);
  assert.ok(entities.every(({ source_authority, source_reference, spatial_reference, state, severity, timestamp, metadata }) => (
    source_authority === "MET-2_METAVERSE_ACTIVITY_REGISTRY"
    && canonicalActivities.some(({ id }) => id === source_reference)
    && spatial_reference.coordinate_space_id === MASTER_CITY_COORDINATE_SPACE.id
    && state === null
    && severity === null
    && timestamp === null
    && metadata.context_only === true
  )));
});

test("canonical city infrastructure context resolves existing destination references only", () => {
  const entities = projectMoccOperationalOverlayEntities({ events: [], visibility: visible("data-centers-infrastructure") });
  assert.equal(entities.length, 6);
  assert.ok(entities.every(({ source_authority, source_reference, spatial_reference, metadata }) => (
    source_authority === "MET-2_CANONICAL_CITY_REGISTRY"
    && source_reference === metadata.destination_id
    && spatial_reference.facility_id === source_reference
    && spatial_reference.coordinate_space_id === MASTER_CITY_COORDINATE_SPACE.id
    && metadata.context_only
  )));
});

test("PARTIAL port, marine, and aviation layers use provisional Quick Map context only", () => {
  for (const id of ["port-logistics", "marine", "aviation"]) {
    assert.equal(MOCC_OPERATIONAL_OVERLAY_BY_ID[id].status, getMoccIntegrationStatus("MARINE_AVIATION").status);
    assert.equal(MOCC_OPERATIONAL_OVERLAY_BY_ID[id].status, "PARTIAL");
  }
  const entities = projectMoccOperationalOverlayEntities({ events: [], visibility: visible("port-logistics", "marine", "aviation") });
  assert.equal(entities.length, 2);
  const marina = entities.find(({ label }) => label === "Marina / Harbor");
  const airport = entities.find(({ label }) => label === "Airport");
  assert.equal(marina.source_authority, "QUICK_MAP_CANONICAL_SPATIAL_REGISTRY");
  assert.equal(marina.source_reference, "marina-harbor");
  assert.equal(airport.source_reference, "airport");
  assert.ok(entities.every(({ spatial_reference, metadata, state, severity, timestamp }) => (
    spatial_reference.coordinate_space_id === QUICK_MAP_COORDINATE_SPACE.id
    && spatial_reference.status === "PROVISIONAL"
    && metadata.context_only === true
    && metadata.provisional === true
    && state === null
    && severity === null
    && timestamp === null
  )));
  assert.ok(entities.every(({ label }) => !/vessel|aircraft|cargo|active|arrival|departure/i.test(label)));
});

test("visibility, pending/disconnected layers, and existing district markers remain presentation-only", () => {
  const sourceEvents = Object.freeze([{ event_id: "event-1", source: "CIVIC", source_ref: "civic-1", district_id: "civic-district", facility_id: "city-hall", status: "ACTIVE" }]);
  const snapshot = structuredClone(sourceEvents);
  const enabled = projectMoccOperationalOverlayEntities({ events: projectMoccEvents(sourceEvents), visibility: visible("civic") });
  const disabled = projectMoccOperationalOverlayEntities({ events: projectMoccEvents(sourceEvents), visibility: {} });
  assert.equal(enabled.length, 1);
  assert.deepEqual(disabled, []);
  assert.deepEqual(sourceEvents, snapshot);
  assert.deepEqual(projectMoccOperationalOverlayEntities({ events: sourceEvents, visibility: visible("traffic", "agents", "shnn-media", "power") }), []);
  assert.equal(MOCC_OPERATIONAL_OVERLAY_BY_ID.traffic.status, "PENDING");
  assert.equal(MOCC_OPERATIONAL_OVERLAY_BY_ID["shnn-media"].status, "NOT_CONNECTED");
  assert.equal(new Set(METAVERSE_DISTRICT_MARKERS.map(({ id }) => id)).size, METAVERSE_DISTRICT_MARKERS.length);
});

test("Digital Twin renders projected entities only in their canonical spatial view", () => {
  const component = readFileSync(new URL("../src/pages/metaverse/operations/MetaverseOperationsCommandCenter.jsx", import.meta.url), "utf8");
  assert.match(component, /projectMoccOperationalOverlayEntities\(\{ events: projectedEvents, visibility: overlayVisibility \}\)/);
  assert.match(component, /cityOverlayEntities\.map\(\(entity\) =>/);
  assert.match(component, /quickMapOverlayEntities\.map\(\(entity\) =>/);
  assert.match(component, /METAVERSE_DISTRICTS\.filter\(\(district\) => PRIMARY_DISTRICT_MARKER_IDS\.has\(district\.id\)\)/);
});
