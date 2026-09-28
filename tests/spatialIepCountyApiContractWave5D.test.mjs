import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isQualifiedOhioCountyFips,
  joinIepRecordToCounty,
  normalizeDynamicIepCountyIdentity,
} from "../src/shared/spatial/countyIdentity.js";

const identitySource = readFileSync(new URL("../src/shared/spatial/countyIdentity.js", import.meta.url), "utf8");
const resolverSource = readFileSync(new URL("../src/system/resolvers/entityToCounty.js", import.meta.url), "utf8");

test("W5D-API-01 accepts a valid Ohio FIPS", () => {
  assert.equal(isQualifiedOhioCountyFips("39055"), true);
});

test("W5D-API-02 accepts null as unresolved identity", () => {
  assert.deepEqual(normalizeDynamicIepCountyIdentity({ countyFips: null }), { countyFips: null });
});

test("W5D-API-03 rejects malformed FIPS", () => {
  for (const value of [39055, "3905", "39-055", "390550", ""]) {
    assert.equal(isQualifiedOhioCountyFips(value), false);
  }
});

test("W5D-API-04 rejects non-Ohio FIPS", () => {
  assert.equal(isQualifiedOhioCountyFips("42055"), false);
});

test("W5D-API-05 rejects unknown Ohio-looking FIPS", () => {
  assert.equal(isQualifiedOhioCountyFips("39999"), false);
});

test("W5D-API-06 county name cannot substitute for FIPS", () => {
  assert.deepEqual(joinIepRecordToCounty({ countyName: "Geauga" }, { sourceRecordId: "39055" }).ok, false);
});

test("W5D-API-07 no Franklin default is introduced", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ countyName: "Unknown" }).countyFips, null);
});

test("W5D-API-08 DTO-like payload preserves explicit FIPS", () => {
  const dto = { id: "case-1", countyFips: "39055", countyName: "Geauga" };
  assert.deepEqual(normalizeDynamicIepCountyIdentity(dto), dto);
});

test("W5D-API-09 DTO-like payload preserves null", () => {
  const dto = { id: "case-2", countyFips: null, countyName: "Unknown" };
  assert.deepEqual(normalizeDynamicIepCountyIdentity(dto), dto);
});

test("W5D-API-10 private status remains unchanged", () => {
  const record = { countyFips: "39055", visibility: "PRIVATE", publicApproved: false };
  const normalized = normalizeDynamicIepCountyIdentity(record);
  assert.equal(normalized.visibility, "PRIVATE");
  assert.equal(normalized.publicApproved, false);
});

test("W5D-API-11 unpublished status remains unchanged", () => {
  const record = { countyFips: "39055", publicationState: "DRAFT", publicApproved: false };
  const normalized = normalizeDynamicIepCountyIdentity(record);
  assert.equal(normalized.publicationState, "DRAFT");
  assert.equal(normalized.publicApproved, false);
});

test("W5D-API-12 authorization metadata remains unchanged", () => {
  const record = { countyFips: "39055", authorization: "RESTRICTED" };
  assert.equal(normalizeDynamicIepCountyIdentity(record).authorization, "RESTRICTED");
});

test("W5D-API-13 serialization does not invent countyFips", () => {
  const serialized = JSON.parse(JSON.stringify({ id: "case-3", countyName: "Geauga" }));
  assert.equal(Object.hasOwn(serialized, "countyFips"), false);
  assert.equal(normalizeDynamicIepCountyIdentity(serialized).countyFips, null);
});

test("W5D-API-14 derived UI payload is not a new source authority", () => {
  const derived = normalizeDynamicIepCountyIdentity({ id: "risk-1", countyFips: "39055", source: "derived-ui" });
  assert.equal(derived.source, "derived-ui");
  assert.equal(derived.countyFips, "39055");
  assert.equal(Object.hasOwn(derived, "sourceAuthority"), false);
});

test("W5D-API-15 Spatial feature IDs are not domain county identity", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ countyFips: "spatial:census-geography:county:39055" }).countyFips, null);
});

test("W5D-API-16 countyFips does not add county geometry", () => {
  const normalized = normalizeDynamicIepCountyIdentity({ countyFips: "39055" });
  assert.equal(Object.hasOwn(normalized, "geometry"), false);
});

test("W5D-API-17 explicit FIPS joins qualified Census identity", () => {
  assert.deepEqual(joinIepRecordToCounty({ countyFips: "39055" }, { sourceRecordId: "39055" }), {
    ok: true,
    countyFips: "39055",
  });
});

test("W5D-API-18 invalid identity fails closed", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ countyFips: "39000" }).countyFips, null);
});

test("W5D-API-19 canonical contract has no resolver dependency", () => {
  assert.doesNotMatch(identitySource, /entityToCounty/);
  assert.match(resolverSource, /Franklin|franklin/);
  assert.equal(normalizeDynamicIepCountyIdentity({ countyName: "Unknown" }).countyFips, null);
});

test("W5D-API-20 join mismatch fails without alternate matching", () => {
  assert.deepEqual(joinIepRecordToCounty({ countyFips: "39055", countyName: "Franklin" }, { sourceRecordId: "39049" }), {
    ok: false,
    reason: "COUNTY_IDENTITY_MISMATCH",
  });
});
