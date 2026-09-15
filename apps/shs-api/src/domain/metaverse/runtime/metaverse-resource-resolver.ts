import {
  SILICON_HEARTLAND_CITY_ID,
  SILICON_HEARTLAND_CITY_REGISTRY,
  type MetaverseActivity,
  type MetaverseDistrict,
  type MetaverseFacility,
} from "../registry/city-registry.js";
import type { MetaverseAccessLevel, MetaverseResourceType } from "../unlocks/unlock-contract.js";
import type { MetaverseUnlockResource } from "../unlocks/unlock-resolver.js";

export type MetaverseRuntimeScope = "city" | "district" | "facility" | "activity" | "simulation";

export type MetaverseEntryResourceRequest = {
  scope?: string;
  city_id?: string;
  cityId?: string;
  district_id?: string;
  districtId?: string;
  facility_id?: string;
  facilityId?: string;
  activity_id?: string;
  activityId?: string;
  resource_id?: string;
  resourceId?: string;
};

export type ResolvedMetaverseResource = MetaverseUnlockResource & {
  scope: MetaverseRuntimeScope;
  resource_type: MetaverseResourceType;
  label: string;
  route_reference: string | null;
  registry_status: string;
};

export class MetaverseResourceResolutionError extends Error {
  constructor(public code: string, message: string, public statusCode = 404) {
    super(message);
  }
}

const accessByScope: Record<MetaverseRuntimeScope, MetaverseAccessLevel> = {
  city: "CITY_ACCESS",
  district: "DISTRICT_ACCESS",
  facility: "FACILITY_ACCESS",
  activity: "ACTIVITY_ACCESS",
  simulation: "SIMULATION_ACCESS",
};

const typeByScope: Record<MetaverseRuntimeScope, MetaverseResourceType> = {
  city: "CITY",
  district: "DISTRICT",
  facility: "FACILITY",
  activity: "ACTIVITY",
  simulation: "SIMULATION",
};

function compact(value: unknown) {
  return String(value || "").trim();
}

function normalizeScope(value: unknown): MetaverseRuntimeScope {
  const scope = compact(value).toLowerCase();
  if (["city", "district", "facility", "activity", "simulation"].includes(scope)) return scope as MetaverseRuntimeScope;
  throw new MetaverseResourceResolutionError("METAVERSE_SCOPE_INVALID", "Metaverse resource scope is invalid.", 400);
}

function idFrom(input: MetaverseEntryResourceRequest, key: "city" | "district" | "facility" | "activity") {
  return compact((input as any)[`${key}_id`] || (input as any)[`${key}Id`]);
}

function routePath(routeReference: any): string | null {
  return typeof routeReference?.path === "string" ? routeReference.path : null;
}

export function resolveMetaverseEntryResource(input: MetaverseEntryResourceRequest, organizationId: string): ResolvedMetaverseResource {
  const scope = normalizeScope(input.scope);
  const cityId = idFrom(input, "city") || SILICON_HEARTLAND_CITY_ID;
  if (cityId !== SILICON_HEARTLAND_CITY_ID) {
    throw new MetaverseResourceResolutionError("METAVERSE_CITY_NOT_FOUND", "Metaverse city was not found.");
  }

  if (scope === "city") {
    return {
      scope,
      organization_id: organizationId,
      city_id: cityId,
      resource_id: cityId,
      access_level: accessByScope.city,
      resource_type: typeByScope.city,
      label: SILICON_HEARTLAND_CITY_REGISTRY.label,
      route_reference: null,
      registry_status: SILICON_HEARTLAND_CITY_REGISTRY.status,
    };
  }

  const resourceId = compact(input.resource_id || input.resourceId);
  const districtId = idFrom(input, "district") || (scope === "district" ? resourceId : "");
  const district = SILICON_HEARTLAND_CITY_REGISTRY.districts.find((item) => item.id === districtId) as MetaverseDistrict | undefined;
  if (!district) throw new MetaverseResourceResolutionError("METAVERSE_DISTRICT_NOT_FOUND", "Metaverse district was not found.");

  if (scope === "district") {
    return {
      scope,
      organization_id: organizationId,
      city_id: cityId,
      district_id: district.id,
      resource_id: district.id,
      access_level: accessByScope.district,
      resource_type: typeByScope.district,
      label: district.label,
      route_reference: null,
      registry_status: district.status,
    };
  }

  const facilityId = idFrom(input, "facility") || (scope === "facility" ? resourceId : "");
  const facility = SILICON_HEARTLAND_CITY_REGISTRY.facilities.find((item) => item.id === facilityId) as MetaverseFacility | undefined;
  if (!facility) throw new MetaverseResourceResolutionError("METAVERSE_FACILITY_NOT_FOUND", "Metaverse facility was not found.");
  if (facility.district_id !== district.id || !district.facility_ids.includes(facility.id)) {
    throw new MetaverseResourceResolutionError("METAVERSE_FACILITY_PARENT_INVALID", "Metaverse facility does not belong to the requested district.", 400);
  }

  if (scope === "facility") {
    return {
      scope,
      organization_id: organizationId,
      city_id: cityId,
      district_id: district.id,
      facility_id: facility.id,
      resource_id: facility.id,
      access_level: accessByScope.facility,
      resource_type: typeByScope.facility,
      label: facility.label,
      route_reference: null,
      registry_status: facility.status,
    };
  }

  const activityId = idFrom(input, "activity") || resourceId;
  const activity = SILICON_HEARTLAND_CITY_REGISTRY.activities.find((item) => item.id === activityId) as MetaverseActivity | undefined;
  if (!activity) throw new MetaverseResourceResolutionError("METAVERSE_ACTIVITY_NOT_FOUND", "Metaverse activity was not found.");
  if (activity.district_id !== district.id || activity.facility_id !== facility.id) {
    throw new MetaverseResourceResolutionError("METAVERSE_ACTIVITY_PARENT_INVALID", "Metaverse activity does not belong to the requested facility.", 400);
  }

  return {
    scope,
    organization_id: organizationId,
    city_id: cityId,
    district_id: district.id,
    facility_id: facility.id,
    activity_id: activity.id,
    resource_id: activity.id,
    access_level: activity.activity_type === "civic_session" ? "CIVIC_SESSION_ACCESS" : scope === "simulation" || activity.activity_type === "simulation" ? accessByScope.simulation : accessByScope.activity,
    resource_type: activity.activity_type === "civic_session" ? "CIVIC_SESSION" : scope === "simulation" || activity.activity_type === "simulation" ? typeByScope.simulation : typeByScope.activity,
    label: activity.label,
    route_reference: routePath(activity.route_reference),
    registry_status: activity.status,
  };
}
