import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  joinIepRecordToCounty,
  isQualifiedOhioCountyFips,
  QUALIFIED_OHIO_COUNTY_FIPS,
  resolveExactQualifiedCountyNameToFips,
  validateQualifiedOhioCountyFips,
} from "../src/shared/spatial/countyIdentity.js";
import { COUNTY_PROFILES } from "../src/pages/iep-command-v2/countyProfiles.js";

const census = JSON.parse(readFileSync(new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url), "utf8"));

test("W5D-ID-01 accepts a qualified Ohio FIPS string", () => {
  assert.equal(isQualifiedOhioCountyFips("39055"), true);
  assert.deepEqual(validateQualifiedOhioCountyFips("39055"), { ok: true, value: "39055" });
});

test("W5D-ID-02 rejects non-Ohio FIPS", () => {
  assert.equal(isQualifiedOhioCountyFips("42055"), false);
  assert.equal(isQualifiedOhioCountyFips("39000"), false);
});

test("W5D-ID-03 rejects malformed and numeric FIPS", () => {
  for (const value of [39055, "3905", "390550", "39-055", "", null]) {
    assert.equal(isQualifiedOhioCountyFips(value), false, String(value));
  }
});

test("W5D-ID-04 accepts exactly the qualified 88-county set", () => {
  assert.equal(QUALIFIED_OHIO_COUNTY_FIPS.length, 88);
  assert.equal(new Set(QUALIFIED_OHIO_COUNTY_FIPS).size, 88);
  assert.equal(QUALIFIED_OHIO_COUNTY_FIPS.every(isQualifiedOhioCountyFips), true);
});

test("W5D-ID-05 county name alone is not a canonical join", () => {
  assert.deepEqual(joinIepRecordToCounty({ county: "Geauga" }, { sourceRecordId: "39055" }), {
    ok: false,
    reason: "UNRESOLVED_COUNTY_IDENTITY",
  });
});

test("W5D-ID-06 exact qualified name migration resolves the expected FIPS", () => {
  assert.equal(resolveExactQualifiedCountyNameToFips("Geauga"), "39055");
  assert.equal(resolveExactQualifiedCountyNameToFips(" geauga "), "39055");
});

test("W5D-ID-07 unmatched or unsupported names remain unresolved", () => {
  assert.equal(resolveExactQualifiedCountyNameToFips("Geauga County East"), null);
  assert.equal(resolveExactQualifiedCountyNameToFips("Unknown County"), null);
});

test("W5D-ID-08 explicit FIPS joins the matching Census county only", () => {
  assert.deepEqual(joinIepRecordToCounty({ countyFips: "39055" }, { sourceRecordId: "39055" }), {
    ok: true,
    countyFips: "39055",
  });
  assert.deepEqual(joinIepRecordToCounty({ countyFips: "39055" }, { sourceRecordId: "39035" }), {
    ok: false,
    reason: "COUNTY_IDENTITY_MISMATCH",
  });
});

test("W5D-ID-09 missing or unknown FIPS remains unresolved without a default", () => {
  for (const record of [{}, { countyFips: null }, { countyFips: "39999" }]) {
    assert.equal(joinIepRecordToCounty(record, { sourceRecordId: "39049" }).ok, false);
  }
});

test("W5D-ID-10 canonical identity path has no entityToCounty dependency", () => {
  const source = readFileSync(new URL("../src/shared/spatial/countyIdentity.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /entityToCounty/);
  const page = readFileSync(new URL("../src/pages/iep-command-v2/IEPCommandCenterV2.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /entityToCounty/);
});

test("W5D-ID-11 publication flags are not changed by identity joining", () => {
  const privateRecord = { countyFips: "39049", publicApproved: false, visibility: "PRIVATE" };
  const unpublishedRecord = { countyFips: "39049", publicApproved: false, publicationState: "DRAFT" };
  assert.equal(joinIepRecordToCounty(privateRecord, { sourceRecordId: "39049" }).ok, true);
  assert.equal(privateRecord.publicApproved, false);
  assert.equal(joinIepRecordToCounty(unpublishedRecord, { sourceRecordId: "39049" }).ok, true);
  assert.equal(unpublishedRecord.publicationState, "DRAFT");
});

test("W5D-ID-12 all static county profiles receive additive qualified FIPS", () => {
  const profiles = Object.entries(COUNTY_PROFILES).filter(([key]) => key !== "__default");
  assert.equal(profiles.length, 88);
  assert.equal(profiles.every(([, profile]) => isQualifiedOhioCountyFips(profile.countyFips)), true);
});

test("W5D-ID-13 static profile identities are unique and Census-backed", () => {
  const profiles = Object.entries(COUNTY_PROFILES).filter(([key]) => key !== "__default");
  const fips = profiles.map(([, profile]) => profile.countyFips);
  assert.equal(new Set(fips).size, 88);
  assert.equal(fips.every((id) => census.features.some((feature) => feature.properties.GEO_ID.endsWith(id))), true);
});

test("W5D-ID-14 display labels remain unchanged while identity is additive", () => {
  assert.equal(COUNTY_PROFILES.GEAUGA.label, "GEAUGA");
  assert.equal(COUNTY_PROFILES.GEAUGA.countyFips, "39055");
  assert.equal(COUNTY_PROFILES["VAN WERT"].label, "VAN WERT");
  assert.equal(COUNTY_PROFILES["VAN WERT"].countyFips, "39161");
});

test("W5D-ID-15 identity joining does not mutate geometry or records", () => {
  const record = { countyFips: "39055", publicApproved: false };
  const county = { sourceRecordId: "39055", geometry: { type: "Polygon", coordinates: [[[1, 2], [3, 4], [1, 2]]] } };
  const recordBefore = structuredClone(record);
  const geometryBefore = structuredClone(county.geometry);
  joinIepRecordToCounty(record, county);
  assert.deepEqual(record, recordBefore);
  assert.deepEqual(county.geometry, geometryBefore);
});

test("W5D-ID-16 IEP stores countyFips, never a generated Spatial feature ID", () => {
  const profiles = Object.values(COUNTY_PROFILES).filter((profile) => profile.countyFips);
  assert.equal(profiles.some((profile) => profile.countyFips.startsWith("spatial:")), false);
});
