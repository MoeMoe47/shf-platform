import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const routeSource = fs.readFileSync(new URL("../src/domain/government-assurance/api/routes.ts", import.meta.url), "utf8");
const pageSource = fs.readFileSync(new URL("../../shf-web/src/pages/operator/GovernmentAssurance.jsx", import.meta.url), "utf8");
const packetSource = fs.readFileSync(new URL("../../../docs/government-program-assurance/COUNTY_PILOT_PRE_ACCEPTANCE_PACKET.md", import.meta.url), "utf8");

test("Phase 8 exposes bounded pilot reporting, readiness, and public-safe routes", () => {
  assert.match(routeSource, /pilot\/dashboard/);
  assert.match(routeSource, /pilot\/readiness/);
  assert.match(routeSource, /public\/summary/);
  assert.match(pageSource, /Government Program Assurance/);
  assert.match(pageSource, /public-approved/);
});

test("Phase 8 packet preserves consumer-only and non-certification boundaries", () => {
  assert.match(packetSource, /Dashboards and exports are projections/);
  assert.match(packetSource, /does not represent external county acceptance/);
  assert.match(packetSource, /public_approval_status/);
});
