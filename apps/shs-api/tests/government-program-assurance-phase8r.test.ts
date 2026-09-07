import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../migrations/105_government_program_assurance_pilot_configuration.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/government-assurance/api/routes.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../shf-web/src/pages/operator/GovernmentAssurance.jsx", import.meta.url), "utf8");

test("Phase 8R persists scoped pilot configuration and explicit activation", () => {
  assert.match(migration, /gpa_pilot_configurations/);
  assert.match(migration, /READY_FOR_ACCEPTANCE/);
  assert.match(migration, /ACTIVE/);
  assert.match(migration, /tenant_id='tenant:'\|\|organization_id/);
  assert.match(routes, /pilot\/configurations/);
  assert.match(routes, /GOVERNMENT_ASSURANCE_PILOT_MANAGE/);
});

test("Phase 8R operating environment exposes canonical navigation and readiness boundary", () => {
  for (const label of ["Overview", "Programs", "Providers", "Funding", "Claims", "Verification", "Monitoring", "Reconciliation", "Audit", "Data Sources", "Reports", "Pilot Administration"]) assert.match(page, new RegExp(label));
  assert.match(page, /Pilot Readiness/);
  assert.match(page, /public-approved|public-approved facts/i);
});
