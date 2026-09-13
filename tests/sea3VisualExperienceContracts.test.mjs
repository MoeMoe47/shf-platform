import test from "node:test";
import assert from "node:assert/strict";
import { SEA_SERVICE_EXPERIENCE_CONTRACTS as serviceContracts } from "../src/system/sea/serviceExperienceContracts.js";
import { DASHBOARD_PROJECTIONS } from "../src/system/sea/dashboardArchitecture.js";
import { VISUAL_EXPERIENCE_CONTRACTS as visualContracts, VISUAL_AUTHORITY_STATES, STATUS_SEMANTICS } from "../src/system/sea/visualExperienceContracts.js";

const byProjection = (id) => visualContracts.find((item) => item.projectionId === id);

test("SEA-3 covers every SEA-2 projection with a Priority A visual contract", () => {
  assert.equal(visualContracts.length, DASHBOARD_PROJECTIONS.length);
  for (const projection of DASHBOARD_PROJECTIONS) assert.ok(byProjection(projection.projectionId), projection.projectionId);
});

test("SEA-3 visual contracts reference valid service roles and routes", () => {
  for (const visual of visualContracts) {
    const service = serviceContracts.find((item) => item.serviceId === visual.serviceId);
    const projection = DASHBOARD_PROJECTIONS.find((item) => item.projectionId === visual.projectionId);
    assert.ok(service);
    assert.ok(service.routes.includes(visual.route));
    assert.equal(projection.role, visual.role);
    assert.ok(VISUAL_AUTHORITY_STATES.includes(visual.visualAuthority.status));
    assert.ok(visual.pageStructure.desktopOrder.length > 0);
    assert.ok(visual.pageStructure.mobileOrder.length > 0);
  }
});

test("SEA-3 preserves role-specific visual structure", () => {
  assert.notEqual(byProjection("student-learning:learner").density, byProjection("instructor:instructor").density);
  assert.notEqual(byProjection("civicsure-provider:provider").components.work, byProjection("civicsure-operator:operator").components.work);
  assert.notEqual(byProjection("organization-onboarding:applicant").pageShell, byProjection("organization-onboarding:reviewer").pageShell);
  assert.notEqual(byProjection("studio:builder").components.work, byProjection("studio:qa").components.work);
  assert.notEqual(byProjection("studio:qa").components.progress, byProjection("studio:reviewer").components.progress);
});

test("SEA-3 preserves authority-safe visual treatment", () => {
  const agent = byProjection("agent-fabric:agent_operator");
  const arag = byProjection("arag-1:approver");
  const executive = byProjection("executive-command:shs_admin");
  const reporting = byProjection("reporting-metric-registry:analyst");
  assert.match(agent.brand.direction, /never autonomous/i);
  assert.ok(agent.acceptance.prohibited.some((item) => /unrestricted execution/i.test(item)));
  assert.ok(arag.acceptance.required.some((item) => /human approval/i.test(item)));
  assert.ok(executive.acceptance.required.some((item) => /superuser/i.test(item)));
  assert.ok(reporting.acceptance.required.some((item) => /verification/i.test(item)));
  assert.equal(executive.pageStructure.requiredRegions.work, "N/A");
});

test("SEA-3 status semantics never depend on color alone", () => {
  for (const status of ["ACTION_REQUIRED", "WAITING", "BLOCKED", "AT_RISK", "VERIFIED", "UNVERIFIED", "PUBLIC_APPROVED", "UNKNOWN"]) {
    assert.equal(STATUS_SEMANTICS[status].textRequired, true);
    assert.equal(STATUS_SEMANTICS[status].colorOnlyAllowed, false);
  }
});

test("SEA-3 defines hierarchy, responsive order, and prohibited deviations", () => {
  for (const visual of visualContracts) {
    assert.ok(visual.actions.primary.treatment);
    assert.ok(visual.actions.secondary.treatment);
    assert.ok(visual.actions.reference.treatment);
    assert.ok(visual.responsive.priorityOrder.includes("CONTEXT"));
    assert.ok(visual.responsive.priorityOrder.includes("ATTENTION"));
    assert.ok(visual.acceptance.prohibited.some((item) => /color|authority|role/i.test(item)));
  }
});
