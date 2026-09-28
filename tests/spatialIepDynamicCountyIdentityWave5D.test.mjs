import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  joinIepRecordToCounty,
  normalizeDynamicIepCountyIdentity,
  propagateCountyFipsFromCountyOwnedParent,
  isQualifiedOhioCountyFips,
} from "../src/shared/spatial/countyIdentity.js";
import { mapIEPAlertToRisk } from "../src/apps/iep/iepRiskAdapter.js";
import { COUNTY_PROFILES } from "../src/pages/iep-command-v2/countyProfiles.js";

const activePage = readFileSync(new URL("../src/pages/iep-command-v2/IEPCommandCenterV2.jsx", import.meta.url), "utf8");
const selectedContext = readFileSync(new URL("../src/system/context/SelectedEntityContext.jsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../src/pages/iep/IEPDashboardPage.jsx", import.meta.url), "utf8");
const commandCenter = readFileSync(new URL("../src/pages/iep-command/IEPCommandCenter.jsx", import.meta.url), "utf8");
const interactionLayer = readFileSync(new URL("../src/pages/iep-command-v2/CountyInteractionLayer.jsx", import.meta.url), "utf8");

test("W5D-DYN-01 accepts valid dynamic countyFips", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ id: "case-1", countyFips: "39055" }).countyFips, "39055");
});

test("W5D-DYN-02 rejects malformed dynamic countyFips", () => {
  for (const value of [39055, "3905", "39-055", "390550"]) {
    assert.equal(normalizeDynamicIepCountyIdentity({ countyFips: value }).countyFips, null);
  }
});

test("W5D-DYN-03 rejects non-Ohio FIPS", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ countyFips: "42055" }).countyFips, null);
});

test("W5D-DYN-04 rejects unknown Ohio-looking FIPS", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ countyFips: "39999" }).countyFips, null);
});

test("W5D-DYN-05 missing FIPS stays unresolved", () => {
  assert.deepEqual(normalizeDynamicIepCountyIdentity({ id: "case-unknown" }), {
    id: "case-unknown",
    countyFips: null,
  });
});

test("W5D-DYN-06 county name alone cannot join", () => {
  assert.equal(joinIepRecordToCounty({ county: "Franklin" }, { sourceRecordId: "39049" }).ok, false);
});

test("W5D-DYN-07 entity text cannot join", () => {
  assert.equal(joinIepRecordToCounty({ entityId: "student-001", text: "Franklin" }, { sourceRecordId: "39049" }).ok, false);
});

test("W5D-DYN-08 canonical active IEP path does not import entityToCounty", () => {
  assert.doesNotMatch(activePage, /entityToCounty/);
  assert.doesNotMatch(selectedContext, /entityToCounty/);
});

test("W5D-DYN-09 Franklin fallback cannot assign dynamic identity", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ id: "unknown-entity" }).countyFips, null);
  assert.equal(joinIepRecordToCounty({ id: "unknown-entity" }, { sourceRecordId: "39049" }).ok, false);
});

test("W5D-DYN-10 explicit FIPS joins the matching Census county", () => {
  assert.deepEqual(joinIepRecordToCounty({ countyFips: "39049" }, { sourceRecordId: "39049" }), {
    ok: true,
    countyFips: "39049",
  });
});

test("W5D-DYN-11 incorrect FIPS does not join", () => {
  assert.equal(joinIepRecordToCounty({ countyFips: "39049" }, { sourceRecordId: "39055" }).ok, false);
});

test("W5D-DYN-12 demo risk migration preserves label and unresolved state", () => {
  const risk = mapIEPAlertToRisk({ id: "stu_002", name: "Jason T.", alert: "Low engagement detected" });
  assert.equal(risk.studentName, "Jason T.");
  assert.equal(risk.countyFips, null);
});

test("W5D-DYN-13 ambiguous demo identity remains unresolved", () => {
  assert.equal(normalizeDynamicIepCountyIdentity({ county: "The county near Cleveland" }).countyFips, null);
});

test("W5D-DYN-14 county-owned derived propagation is explicit", () => {
  assert.deepEqual(
    propagateCountyFipsFromCountyOwnedParent(
      { countyFips: "39055" },
      { id: "case-1", label: "Geauga case" },
      "COUNTY_OWNED_DERIVED"
    ),
    { id: "case-1", label: "Geauga case", countyFips: "39055" }
  );
});

test("W5D-DYN-15 unrelated parent propagation is rejected", () => {
  assert.equal(
    propagateCountyFipsFromCountyOwnedParent({ countyFips: "39055" }, { id: "case-1" }, "UNRELATED_PARENT").countyFips,
    null
  );
});

test("W5D-DYN-16 private record remains private after identity normalization", () => {
  const record = normalizeDynamicIepCountyIdentity({ countyFips: "39055", publicApproved: false, visibility: "PRIVATE" });
  assert.equal(record.countyFips, "39055");
  assert.equal(record.publicApproved, false);
  assert.equal(record.visibility, "PRIVATE");
});

test("W5D-DYN-17 unpublished record remains unpublished after identity normalization", () => {
  const record = normalizeDynamicIepCountyIdentity({ countyFips: "39055", publicationState: "DRAFT" });
  assert.equal(record.countyFips, "39055");
  assert.equal(record.publicationState, "DRAFT");
});

test("W5D-DYN-18 selected-entity context does not invent county identity", () => {
  assert.match(selectedContext, /selectedEntity/);
  assert.doesNotMatch(selectedContext, /resolveCounty|Franklin/);
  assert.equal(normalizeDynamicIepCountyIdentity({ id: "selected-1" }).countyFips, null);
});

test("W5D-DYN-19 priority-case source preserves explicit FIPS fields", () => {
  const cases = Object.values(COUNTY_PROFILES)
    .filter((profile) => profile.countyFips)
    .flatMap((profile) => profile.priorityCases || []);
  assert.equal(cases.length, 132);
  assert.equal(cases.every((record) => isQualifiedOhioCountyFips(record.countyFips)), true);
  assert.match(activePage, /profile\.priorityCases/);
});

test("W5D-DYN-20 derived simulation payload carries county identity when available", () => {
  assert.match(interactionLayer, /countyFips: profile\?\.countyFips \|\| null/);
});

test("W5D-DYN-21 domain records never store generated Spatial feature IDs", () => {
  const source = readFileSync(new URL("../src/shared/spatial/countyIdentity.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /createSpatialFeatureId|spatial:/);
  assert.equal(isQualifiedOhioCountyFips("39055"), true);
});

test("W5D-DYN-22 Census remains the geometry authority", () => {
  const source = readFileSync(new URL("../src/shared/spatial/countyIdentity.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /entityToCounty|createSpatialFeatureId|spatial:/);
  assert.equal(joinIepRecordToCounty({ countyFips: "39055" }, { sourceRecordId: "39055" }).ok, true);
});

test("W5D-DYN-23 unresolved records do not receive geometry", () => {
  const result = joinIepRecordToCounty({ countyFips: null }, { sourceRecordId: "39055", geometry: { type: "Polygon" } });
  assert.equal(result.ok, false);
});

test("W5D-DYN-24 identity helpers do not mutate source records", () => {
  const record = { id: "case-1", countyFips: "39055", publicApproved: false };
  const before = structuredClone(record);
  normalizeDynamicIepCountyIdentity(record);
  assert.deepEqual(record, before);
});

test("W5D-DYN-25 demo student records declare unresolved geography rather than guessing", () => {
  assert.equal((dashboard.match(/countyFips: null/g) || []).length, 4);
  assert.match(commandCenter, /countyFips: event\.countyFips \|\| null/);
});
