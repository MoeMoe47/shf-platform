import {
  COORDINATE_FAMILIES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  VERIFICATION_STATES,
} from "../../../shared/spatial/index.js";
import { createSpatialFeatureId } from "../../../shared/spatial/contracts/featureIds.js";
import { QUALIFIED_OHIO_COUNTY_FIPS } from "../../../shared/spatial/countyIdentity.js";

export const CENSUS_COUNTY_DOMAIN = "census-geography";
export const CENSUS_COUNTY_FEATURE_TYPE = "county";
export const CENSUS_COUNTY_SOURCE_AUTHORITY = "us-census-bureau-2010-cartographic-boundary";
export const CENSUS_COUNTY_COORDINATE_SPACE = "real-world.county-geojson";
export const CENSUS_COUNTY_PROJECTION_VERSION = "1";
export const CENSUS_COUNTY_LAYER_ID = "real-world.counties";
export const CENSUS_COUNTY_ASSET_PATH = "public/assets/maps/ohio-counties.geojson";
export const CENSUS_COUNTY_SOURCE_URL = "https://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_20m.zip";

const CENSUS_COUNTY_DATASET = "2010 Cartographic Boundary File, State-County";
const CENSUS_COUNTY_VINTAGE = "2010";
const CENSUS_COUNTY_SCALE = "1:20,000,000";
const CENSUS_COUNTY_UPDATED_AT = "2010-01-01T00:00:00.000Z";

function extractFips(record) {
  const properties = record?.properties || {};
  const geoId = properties.GEO_ID;
  const state = properties.STATE;
  const county = properties.COUNTY;
  const id = record?.id;
  const geoMatch = typeof geoId === "string" ? geoId.match(/^0500000US(\d{5})$/) : null;
  const fips = geoMatch?.[1] || (typeof id === "string" && /^\d{5}$/.test(id) ? id : null);
  if (!fips || !/^39\d{3}$/.test(fips) || state !== "39" || county !== fips.slice(2)) return null;
  return fips;
}

function finitePosition(position) {
  return Array.isArray(position)
    && position.length >= 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1])
    && position[0] >= -180
    && position[0] <= 180
    && position[1] >= -90
    && position[1] <= 90;
}

function validRing(ring) {
  return Array.isArray(ring) && ring.length >= 4 && ring.every(finitePosition);
}

function validGeometry(geometry) {
  if (!geometry || typeof geometry !== "object") return false;
  if (geometry.type === "Polygon") return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(validRing);
  if (geometry.type === "MultiPolygon") {
    return Array.isArray(geometry.coordinates)
      && geometry.coordinates.length > 0
      && geometry.coordinates.every((polygon) => Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing));
  }
  return false;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function cloneGeometry(geometry) {
  return structuredClone(geometry);
}

function hasQualifiedProvenance(provenance) {
  return Boolean(
    provenance
    && provenance.publisher === "U.S. Census Bureau, Geography Division"
    && provenance.dataset === CENSUS_COUNTY_DATASET
    && provenance.vintage === CENSUS_COUNTY_VINTAGE
    && provenance.scale === CENSUS_COUNTY_SCALE
    && provenance.localSourcePath === CENSUS_COUNTY_ASSET_PATH
    && provenance.officialSourceUrl === CENSUS_COUNTY_SOURCE_URL
    && provenance.sourceAuthority === CENSUS_COUNTY_SOURCE_AUTHORITY
    && provenance.projectionAdapter === "census-county-geometry"
    && provenance.projectionVersion === CENSUS_COUNTY_PROJECTION_VERSION
    && typeof provenance.attribution === "string"
    && provenance.updatedAt === CENSUS_COUNTY_UPDATED_AT,
  );
}

function sourceRecordIsEligible(record, qualifiedCountyIds) {
  const properties = record?.properties;
  const fips = extractFips(record);
  const coordinateFamily = record?.coordinateFamily ?? COORDINATE_FAMILIES.REAL_WORLD;
  const coordinateSpaceId = record?.coordinateSpaceId ?? CENSUS_COUNTY_COORDINATE_SPACE;
  return Boolean(
    record?.type === "Feature"
    && properties
    && typeof properties.NAME === "string"
    && properties.NAME.trim()
    && properties.LSAD === "County"
    && Number.isFinite(properties.CENSUSAREA)
    && qualifiedCountyIds.has(fips)
    && validGeometry(record.geometry)
    && coordinateFamily === COORDINATE_FAMILIES.REAL_WORLD
    && coordinateSpaceId === CENSUS_COUNTY_COORDINATE_SPACE
    && hasQualifiedProvenance(record.provenance),
  );
}

export function createCensusCountyGeometryAdapter({ qualifiedCountyIds = QUALIFIED_OHIO_COUNTY_FIPS } = {}) {
  const qualifiedIds = Object.freeze(new Set(qualifiedCountyIds));

  return Object.freeze({
    getDomain: () => CENSUS_COUNTY_DOMAIN,
    getSourceAuthority: () => CENSUS_COUNTY_SOURCE_AUTHORITY,
    getSupportedFeatureTypes: () => [CENSUS_COUNTY_FEATURE_TYPE],
    getSupportedCoordinateSpaces: () => [CENSUS_COUNTY_COORDINATE_SPACE],
    getProjectionVersion: () => CENSUS_COUNTY_PROJECTION_VERSION,
    canProject(record) {
      return sourceRecordIsEligible(record, qualifiedIds);
    },
    project(record) {
      if (!sourceRecordIsEligible(record, qualifiedIds)) {
        throw new Error("Census county record is not a qualified Ohio county feature");
      }

      const properties = record.properties;
      const sourceRecordId = extractFips(record);
      const featureId = createSpatialFeatureId({
        domain: CENSUS_COUNTY_DOMAIN,
        featureType: CENSUS_COUNTY_FEATURE_TYPE,
        sourceAuthority: CENSUS_COUNTY_SOURCE_AUTHORITY,
        sourceRecordId,
      });
      const provenance = {
        sourceAuthority: CENSUS_COUNTY_SOURCE_AUTHORITY,
        sourceRecordId,
        projectionAdapter: "census-county-geometry",
        projectionVersion: CENSUS_COUNTY_PROJECTION_VERSION,
        updatedAt: CENSUS_COUNTY_UPDATED_AT,
        publisher: properties.GEO_ID ? "U.S. Census Bureau, Geography Division" : undefined,
        dataset: CENSUS_COUNTY_DATASET,
        vintage: CENSUS_COUNTY_VINTAGE,
        scale: CENSUS_COUNTY_SCALE,
        localSourcePath: CENSUS_COUNTY_ASSET_PATH,
        officialSourceUrl: CENSUS_COUNTY_SOURCE_URL,
        attribution: "U.S. Census Bureau",
        coordinateProvenance: CENSUS_COUNTY_COORDINATE_SPACE,
      };

      return deepFreeze({
        featureId,
        featureType: CENSUS_COUNTY_FEATURE_TYPE,
        domain: CENSUS_COUNTY_DOMAIN,
        sourceAuthority: CENSUS_COUNTY_SOURCE_AUTHORITY,
        sourceRecordId,
        coordinateFamily: COORDINATE_FAMILIES.REAL_WORLD,
        coordinateSpaceId: CENSUS_COUNTY_COORDINATE_SPACE,
        geometry: cloneGeometry(record.geometry),
        layerId: CENSUS_COUNTY_LAYER_ID,
        title: properties.NAME,
        label: properties.NAME,
        verificationState: VERIFICATION_STATES.VERIFIED,
        publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
        publicEligibility: {
          level: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
          publicationState: PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC,
        },
        provenance,
        updatedAt: CENSUS_COUNTY_UPDATED_AT,
        allowedInteractions: ["SELECT", "FOCUS", "HIGHLIGHT"],
        authorizedActionReferences: [],
        accessibility: {
          label: `${properties.NAME} County`,
          stateText: "Available",
          keyboardInteractions: ["SELECT"],
        },
      });
    },
  });
}

export const QUALIFIED_CENSUS_COUNTY_FIPS = Object.freeze([...QUALIFIED_OHIO_COUNTY_FIPS]);
