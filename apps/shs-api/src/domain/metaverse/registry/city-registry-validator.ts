import {
  ECONOMY_BOUNDARY,
  METAVERSE_AUTHORITY_MAP,
  validateMetaverseArchitectureContract,
} from "../model/metaverse-contract.js";
import {
  METAVERSE_CITY_REGISTRIES,
  METAVERSE_DISTRICT_IDS,
  METAVERSE_KNOWN_LIVE_ROUTE_REFERENCES,
  SILICON_HEARTLAND_CITY_ID,
  type MetaverseCityRegistry,
} from "./city-registry.js";
import { validateMetaverseDestinationIdCrosswalk } from "./destination-id-crosswalk.js";

export type MetaverseCityRegistryValidationResult = {
  ok: boolean;
  errors: string[];
};

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

function authority(id: string) {
  return METAVERSE_AUTHORITY_MAP.find((item) => item.authorityId === id);
}

export function validateMetaverseCityRegistry(registry: MetaverseCityRegistry): MetaverseCityRegistryValidationResult {
  const errors: string[] = [];

  errors.push(...validateMetaverseArchitectureContract().map((error) => `MET-1 contract invalid: ${error}`));
  errors.push(...validateMetaverseDestinationIdCrosswalk(registry));

  if (METAVERSE_CITY_REGISTRIES.length !== 1) errors.push("exactly one canonical city registry is required");
  if (registry.city_id !== SILICON_HEARTLAND_CITY_ID) errors.push("canonical city id must be silicon-heartland-city");
  if (registry.label !== "Silicon Heartland") errors.push("canonical city label must be Silicon Heartland");
  if (registry.real_government_authority) errors.push("city registry must not claim real government authority");
  if (registry.state_or_national_simulation) errors.push("city registry must not be state or national simulation");
  if (!registry.declarative_only) errors.push("city registry must remain declarative");
  if (registry.authorization_authority) errors.push("city registry must not become authorization authority");

  const districtIds = registry.districts.map((district) => district.id);
  const facilityIds = registry.facilities.map((facility) => facility.id);
  const destinationIds = registry.destinations.map((destination) => destination.id);

  for (const duplicate of duplicates(districtIds)) errors.push(`duplicate district id: ${duplicate}`);
  for (const duplicate of duplicates(facilityIds)) errors.push(`duplicate facility id: ${duplicate}`);
  for (const duplicate of duplicates(destinationIds)) errors.push(`duplicate destination id: ${duplicate}`);

  const districtSet = new Set(districtIds);
  const facilitySet = new Set(facilityIds);
  const destinationSet = new Set(destinationIds);

  for (const district of registry.districts) {
    if (district.city_id !== registry.city_id) errors.push(`${district.id}: district city reference does not match registry city`);
    for (const facilityId of district.facility_ids) {
      if (!facilitySet.has(facilityId)) errors.push(`${district.id}: references missing facility ${facilityId}`);
    }
    if (!district.visual_asset_slot) errors.push(`${district.id}: visual asset slot is required`);
  }

  for (const facility of registry.facilities) {
    if (facility.city_id !== registry.city_id) errors.push(`${facility.id}: facility city reference does not match registry city`);
    if (!districtSet.has(facility.district_id)) errors.push(`${facility.id}: references missing district ${facility.district_id}`);
    for (const destinationId of facility.destination_ids) {
      if (!destinationSet.has(destinationId)) errors.push(`${facility.id}: references missing destination ${destinationId}`);
    }
    if (!facility.visual_asset_slot) errors.push(`${facility.id}: visual asset slot is required`);
  }

  const liveRoutes = new Set<string>(METAVERSE_KNOWN_LIVE_ROUTE_REFERENCES);
  for (const destination of registry.destinations) {
    if (destination.city_id !== registry.city_id) errors.push(`${destination.id}: destination city reference does not match registry city`);
    if (!districtSet.has(destination.district_id)) errors.push(`${destination.id}: references missing district ${destination.district_id}`);
    if (destination.facility_id && !facilitySet.has(destination.facility_id)) errors.push(`${destination.id}: references missing facility ${destination.facility_id}`);
    if (destination.facility_id) {
      const facility = registry.facilities.find((item) => item.id === destination.facility_id);
      if (facility && facility.district_id !== destination.district_id) errors.push(`${destination.id}: facility district mismatch`);
    }
    if (!destination.accessibility_alternative) errors.push(`${destination.id}: accessibility alternative is required`);
    if (!destination.evidence_capability) errors.push(`${destination.id}: evidence capability field is required`);
    if (destination.status === "LIVE" && !destination.route_reference.path) errors.push(`${destination.id}: live destination requires route path`);
    if (destination.status !== "LIVE" && destination.status !== "PARTIAL" && destination.route_reference.path) errors.push(`${destination.id}: planned/registry destination must not claim live route`);
    if (destination.status === "LIVE" && destination.route_reference.path && !liveRoutes.has(destination.route_reference.path)) {
      errors.push(`${destination.id}: live route not present in verified route references: ${destination.route_reference.path}`);
    }
    if (/civicsure/i.test(`${destination.id} ${destination.label} ${destination.description} ${destination.route_reference.path ?? ""}`)) {
      errors.push(`${destination.id}: CivicSure must not be placed inside student city civic authority`);
    }
    if (destination.id === "universe" || destination.route_reference.path?.startsWith("/universe")) {
      errors.push(`${destination.id}: Universe must not be treated as city registry`);
    }
  }

  const requiredDistrictIds = Object.values(METAVERSE_DISTRICT_IDS);
  for (const id of requiredDistrictIds) {
    if (!districtSet.has(id)) errors.push(`missing required district: ${id}`);
  }

  const dataCenter = registry.districts.find((district) => district.id === METAVERSE_DISTRICT_IDS.dataCenter);
  if (!dataCenter) errors.push("Data Center District is required");
  const requiredDataCenterFacilities = [
    "main-data-center",
    "network-operations-center",
    "power-electrical-facility",
    "cooling-mechanical-plant",
    "security-operations-center",
    "ai-compute-facility",
    "data-center-training-lab",
  ];
  for (const id of requiredDataCenterFacilities) {
    const facility = registry.facilities.find((item) => item.id === id);
    if (!facility) errors.push(`missing required Data Center facility: ${id}`);
    else if (facility.district_id !== METAVERSE_DISTRICT_IDS.dataCenter) errors.push(`${id}: Data Center facility must reference Data Center District`);
  }

  const treasuryDestinations = registry.destinations.filter((destination) => destination.district_id === METAVERSE_DISTRICT_IDS.treasuryCommerce);
  if (!ECONOMY_BOUNDARY.implementationBlockedUntilAuthorityResolved) errors.push("MET-1 economy boundary must remain blocked until resolved");
  for (const destination of treasuryDestinations) {
    if (destination.economy_participation.authority_status !== "not_applicable" && destination.economy_participation.authority_status !== "unresolved_blocked") {
      errors.push(`${destination.id}: Treasury/Commerce destination must not create economy authority`);
    }
  }

  for (const id of ["identity", "career-authority", "evidence-emission", "verification", "reporting"]) {
    const entry = authority(id);
    if (!entry) errors.push(`missing MET-1 authority: ${id}`);
    else if (!entry.metaverseMustNotOwn || entry.metaverseMayWrite) errors.push(`city registry duplicates canonical authority: ${id}`);
  }

  return { ok: errors.length === 0, errors };
}

export function assertValidMetaverseCityRegistry(registry: MetaverseCityRegistry): void {
  const result = validateMetaverseCityRegistry(registry);
  if (!result.ok) {
    throw new Error(`Invalid metaverse city registry:\n${result.errors.join("\n")}`);
  }
}
