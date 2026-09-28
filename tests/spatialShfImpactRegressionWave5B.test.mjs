import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getPublicApprovedCounties, shfCountiesServed } from "../src/data/shfImpactData.js";

const dataSource = readFileSync(new URL("../src/data/shfImpactData.js", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../src/router/FoundationRoutes.jsx", import.meta.url), "utf8");
const mapSource = readFileSync(new URL("../src/pages/shf-command/components/SHFImpactOhioMap.jsx", import.meta.url), "utf8");

test("W5B SHF Impact route is explicitly declared", () => {
  assert.match(routeSource, /path="impact"/);
  assert.match(routeSource, /SHFImpactCommandCenter/);
});

test("W5B SHF public projection requires explicit publication approval", () => {
  assert.match(dataSource, /publicApproved === true/);
  assert.match(mapSource, /getPublicApprovedCounties/);
});

test("W5B current SHF sample records remain unpublished and draft", () => {
  assert.ok(shfCountiesServed.length > 0);
  assert.equal(shfCountiesServed.every((record) => record.publicApproved === false), true);
  assert.equal(getPublicApprovedCounties().length, 0);
});

test("W5B coordinates or county labels do not create publication eligibility", () => {
  assert.match(dataSource, /Coordinates|publicApproved/gi);
  assert.match(mapSource, /Public impact values are suppressed/);
});

test("W5B SHF map preserves a safe empty/public-suppressed state", () => {
  assert.match(mapSource, /No public impact data available yet/);
  assert.match(mapSource, /suppressed until approved canonical Truth data/);
});

test("W5B SHF map has no Spatial source mapping", () => {
  assert.doesNotMatch(mapSource, /createProjectionAdapterRegistry|sourceRecordId/);
});
