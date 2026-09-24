import test from "node:test";
import assert from "node:assert/strict";

import {
  METAVERSE_CITY_REGISTRIES,
  METAVERSE_DISTRICT_IDS,
  METAVERSE_KNOWN_LIVE_ROUTE_REFERENCES,
  SILICON_HEARTLAND_CITY_ID,
  SILICON_HEARTLAND_CITY_REGISTRY,
  getMetaverseCityProjection,
} from "../src/domain/metaverse/registry/city-registry.ts";
import { validateMetaverseCityRegistry } from "../src/domain/metaverse/registry/city-registry-validator.ts";
import {
  METAVERSE_DESTINATION_ALIASES,
  getCanonicalDestinationId,
  getDestinationById,
  validateMetaverseDestinationIdCrosswalk,
} from "../src/domain/metaverse/registry/destination-id-crosswalk.ts";
import { METAVERSE_AUTHORITY_MAP } from "../src/domain/metaverse/model/metaverse-contract.ts";

function ids(values: { id: string }[]) {
  return values.map((value) => value.id);
}

function unique(values: string[]) {
  return new Set(values).size === values.length;
}

function authority(id: string) {
  const item = METAVERSE_AUTHORITY_MAP.find((entry) => entry.authorityId === id);
  assert.ok(item, `missing authority ${id}`);
  return item;
}

test("city registry validates through the deterministic registry validator", () => {
  const result = validateMetaverseCityRegistry(SILICON_HEARTLAND_CITY_REGISTRY);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});

test("canonical destination aliases resolve explicitly and unknown ids fail safely", () => {
  assert.equal(getCanonicalDestinationId(SILICON_HEARTLAND_CITY_REGISTRY, "public-works"), "public-works-office");
  assert.equal(getCanonicalDestinationId(SILICON_HEARTLAND_CITY_REGISTRY, "park"), "city-park");
  assert.equal(getDestinationById(SILICON_HEARTLAND_CITY_REGISTRY, "student-profile-access")?.id, "student-profile-portfolio-access");
  assert.equal(getDestinationById(SILICON_HEARTLAND_CITY_REGISTRY, "unknown-place"), null);
});

test("destination crosswalk rejects duplicate aliases, canonical collisions, and unknown targets", () => {
  const duplicateAlias = validateMetaverseDestinationIdCrosswalk(SILICON_HEARTLAND_CITY_REGISTRY, [
    ...METAVERSE_DESTINATION_ALIASES,
    { canonical_destination_id: "city-park", aliases: ["public-works"] },
  ]);
  assert.ok(duplicateAlias.some((error) => error.includes("alias maps to multiple destinations")));

  const collision = validateMetaverseDestinationIdCrosswalk(SILICON_HEARTLAND_CITY_REGISTRY, [
    { canonical_destination_id: "city-park", aliases: ["career-center"] },
  ]);
  assert.ok(collision.some((error) => error.includes("alias collides with canonical destination id")));

  const unknownTarget = validateMetaverseDestinationIdCrosswalk(SILICON_HEARTLAND_CITY_REGISTRY, [
    { canonical_destination_id: "missing-destination", aliases: ["missing-alias"] },
  ]);
  assert.ok(unknownTarget.some((error) => error.includes("alias target is unknown")));
});

test("registry contains exactly one canonical Silicon Heartland city", () => {
  assert.equal(METAVERSE_CITY_REGISTRIES.length, 1);
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.city_id, SILICON_HEARTLAND_CITY_ID);
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.label, "Silicon Heartland");
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.scope, "bounded_city_scale_learning_environment");
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.real_government_authority, false);
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.state_or_national_simulation, false);
});

test("district, facility, and destination IDs are unique", () => {
  assert.equal(unique(ids(SILICON_HEARTLAND_CITY_REGISTRY.districts)), true);
  assert.equal(unique(ids(SILICON_HEARTLAND_CITY_REGISTRY.facilities)), true);
  assert.equal(unique(ids(SILICON_HEARTLAND_CITY_REGISTRY.destinations)), true);
});

test("every facility references a real district", () => {
  const districtIds = new Set(ids(SILICON_HEARTLAND_CITY_REGISTRY.districts));
  for (const facility of SILICON_HEARTLAND_CITY_REGISTRY.facilities) {
    assert.equal(facility.city_id, SILICON_HEARTLAND_CITY_ID);
    assert.ok(districtIds.has(facility.district_id), facility.id);
  }
});

test("every destination references a real city, district, and facility when applicable", () => {
  const districtIds = new Set(ids(SILICON_HEARTLAND_CITY_REGISTRY.districts));
  const facilityIds = new Set(ids(SILICON_HEARTLAND_CITY_REGISTRY.facilities));
  for (const destination of SILICON_HEARTLAND_CITY_REGISTRY.destinations) {
    assert.equal(destination.city_id, SILICON_HEARTLAND_CITY_ID, destination.id);
    assert.ok(districtIds.has(destination.district_id), destination.id);
    if (destination.facility_id) assert.ok(facilityIds.has(destination.facility_id), destination.id);
  }
});

test("CivicSure is excluded as SHF Civic authority", () => {
  assert.match(SILICON_HEARTLAND_CITY_REGISTRY.civic_sure_boundary, /excluded/i);
  const serialized = JSON.stringify(SILICON_HEARTLAND_CITY_REGISTRY.destinations);
  assert.doesNotMatch(serialized, /civicsure/i);
  const civicDestinations = SILICON_HEARTLAND_CITY_REGISTRY.destinations.filter((destination) => destination.district_id === METAVERSE_DISTRICT_IDS.civic);
  assert.ok(civicDestinations.length > 0);
  for (const destination of civicDestinations) {
    assert.equal(destination.civic_alignment.canonical_owner, "shf-civic");
  }
});

test("Universe is not treated as the metaverse city registry", () => {
  assert.match(SILICON_HEARTLAND_CITY_REGISTRY.universe_relationship, /not the metaverse city registry/i);
  assert.notEqual(SILICON_HEARTLAND_CITY_REGISTRY.city_id, "universe");
  for (const destination of SILICON_HEARTLAND_CITY_REGISTRY.destinations) {
    assert.notEqual(destination.id, "universe");
    assert.equal(destination.route_reference.path?.startsWith("/universe") ?? false, false, destination.id);
  }
});

test("Data Center district exists with required core facilities and actual repository alignment", () => {
  const district = SILICON_HEARTLAND_CITY_REGISTRY.districts.find((item) => item.id === METAVERSE_DISTRICT_IDS.dataCenter);
  assert.ok(district);
  for (const facilityId of [
    "main-data-center",
    "network-operations-center",
    "power-electrical-facility",
    "cooling-mechanical-plant",
    "security-operations-center",
    "ai-compute-facility",
    "data-center-training-lab",
  ]) {
    assert.ok(SILICON_HEARTLAND_CITY_REGISTRY.facilities.find((facility) => facility.id === facilityId && facility.district_id === METAVERSE_DISTRICT_IDS.dataCenter), facilityId);
  }
  const trainingLab = SILICON_HEARTLAND_CITY_REGISTRY.destinations.find((destination) => destination.id === "data-center-training-lab");
  assert.ok(trainingLab);
  assert.ok(trainingLab.curriculum_alignment.refs.includes("168 data-center lesson JSON files"));
  assert.ok(trainingLab.curriculum_alignment.refs.includes("41 prepare-prove proof activities"));
  assert.ok(trainingLab.career_alignment.refs.includes("data-center-ai-infrastructure"));
});

test("Treasury and Commerce registry does not create economy authority", () => {
  const destinations = SILICON_HEARTLAND_CITY_REGISTRY.destinations.filter((destination) => destination.district_id === METAVERSE_DISTRICT_IDS.treasuryCommerce);
  assert.ok(destinations.length > 0);
  for (const destination of destinations) {
    assert.notEqual(destination.economy_participation.authority_status, "projection_only", destination.id);
  }
  assert.match(SILICON_HEARTLAND_CITY_REGISTRY.economy_boundary, /unresolved/i);
});

test("identity, career, and evidence/truth authorities are not duplicated", () => {
  for (const id of ["identity", "career-authority", "evidence-emission", "verification", "reporting"]) {
    const entry = authority(id);
    assert.equal(entry.metaverseMustNotOwn, true, id);
    assert.equal(entry.metaverseMayWrite, false, id);
  }
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.authorization_authority, false);
});

test("accessibility alternative is required on every destination", () => {
  for (const destination of SILICON_HEARTLAND_CITY_REGISTRY.destinations) {
    assert.equal(typeof destination.accessibility_alternative, "string");
    assert.ok(destination.accessibility_alternative.length > 0, destination.id);
  }
});

test("planned and registry-only destinations do not falsely claim live routes", () => {
  for (const destination of SILICON_HEARTLAND_CITY_REGISTRY.destinations) {
    if (destination.status === "PLANNED" || destination.status === "REGISTRY_ONLY") {
      assert.equal(destination.route_reference.path, null, destination.id);
    }
  }
});

test("live-route destinations correspond to verified repository route evidence", () => {
  const knownRoutes = new Set<string>(METAVERSE_KNOWN_LIVE_ROUTE_REFERENCES);
  const liveDestinations = SILICON_HEARTLAND_CITY_REGISTRY.destinations.filter((destination) => destination.status === "LIVE");
  assert.ok(liveDestinations.length > 0);
  for (const destination of liveDestinations) {
    assert.ok(destination.route_reference.path, destination.id);
    assert.ok(knownRoutes.has(destination.route_reference.path), `${destination.id}: ${destination.route_reference.path}`);
    assert.match(destination.route_reference.source, /src\/router|docs\/career|src\/pages/);
  }
});

test("city registry is declarative and exposes a frontend-safe projection without duplicating authority", () => {
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.declarative_only, true);
  assert.equal(SILICON_HEARTLAND_CITY_REGISTRY.authorization_authority, false);
  // MET-2 shipped with an empty activities array; MET-7 and MET-13 added
  // real declarative activity entries (curriculum mounts + simulations).
  // Every one must still declare its own evidence/completion boundary
  // rather than duplicating curriculum/assessment/evidence authority.
  assert.ok(SILICON_HEARTLAND_CITY_REGISTRY.activities.length > 0);
  for (const activity of SILICON_HEARTLAND_CITY_REGISTRY.activities) {
    assert.ok(activity.evidence_capability, `${activity.id}: evidence_capability is required`);
    assert.ok(activity.completion_authority, `${activity.id}: completion_authority is required`);
  }

  const projection = getMetaverseCityProjection();
  assert.equal(projection.city_id, SILICON_HEARTLAND_CITY_ID);
  assert.equal(projection.districts.length, SILICON_HEARTLAND_CITY_REGISTRY.districts.length);
  assert.equal(projection.destinations.length, SILICON_HEARTLAND_CITY_REGISTRY.destinations.length);
  assert.equal("career_alignment" in projection.destinations[0], false);
});
