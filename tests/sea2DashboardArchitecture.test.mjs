import test from "node:test";
import assert from "node:assert/strict";
import { SEA_SERVICE_EXPERIENCE_CONTRACTS as contracts } from "../src/system/sea/serviceExperienceContracts.js";
import { DASHBOARD_PROJECTIONS, ATTENTION_TYPES, SOURCE_STATUS } from "../src/system/sea/dashboardArchitecture.js";

const projection = (serviceId, role, responsibility = role) => DASHBOARD_PROJECTIONS.find((item) => item.serviceId === serviceId && item.role === role && item.responsibility === responsibility);

test("SEA-2 covers every Tier A service with a dashboard projection", () => {
  for (const contract of contracts.filter((item) => item.tier === "A")) assert.ok(DASHBOARD_PROJECTIONS.some((item) => item.serviceId === contract.serviceId), contract.serviceId);
});

test("SEA-2 keeps distinct role projections", () => {
  assert.notDeepEqual(projection("student-learning", "learner").work, projection("instructor", "instructor").work);
  assert.notEqual(projection("civicsure-provider", "provider").pattern, projection("civicsure-operator", "operator").pattern);
  assert.notEqual(projection("organization-onboarding", "applicant").nextAction.label, projection("organization-onboarding", "reviewer").nextAction.label);
  assert.notEqual(projection("studio", "builder").responsibility, projection("studio", "reviewer", "QA").responsibility);
  assert.notEqual(projection("studio", "reviewer", "QA").responsibility, projection("studio", "reviewer", "reviewer").responsibility);
});

test("SEA-2 preserves governed AI, release, executive, and reporting boundaries", () => {
  for (const item of [projection("agent-fabric", "agent_operator"), projection("arag-1", "approver"), projection("executive-command", "shs_admin"), projection("reporting-metric-registry", "analyst")]) {
    assert.equal(item.authorityNotes.evidenceWrite, false);
    assert.equal(item.authorityNotes.truthWrite, false);
    assert.equal(item.authorityNotes.companionReadOnly, true);
  }
  assert.ok(projection("agent-fabric", "agent_operator").pattern === "GOVERNED_AI_OPERATOR");
});

test("SEA-2 models honest attention and source states", () => {
  for (const item of DASHBOARD_PROJECTIONS) {
    assert.ok(item.pattern);
    assert.ok(item.metrics.every((metric) => ["OPERATIONAL", "VERIFIED", "PUBLIC_APPROVED", "ESTIMATED", "UNKNOWN", "SOURCE_STATED"].includes(metric.verification)));
    assert.ok(item.attention.every((type) => ATTENTION_TYPES.includes(type)));
    assert.ok(item.sourceStatus.every((status) => SOURCE_STATUS.includes(status)));
    assert.notEqual(item.sections.attention, "N/A");
    assert.ok(item.nextAction.source !== "NONE");
  }
  assert.ok(projection("student-learning", "learner").attention.includes("WAITING"));
  assert.ok(projection("student-learning", "learner").attention.includes("BLOCKED"));
});

test("SEA-2 has action hierarchy and responsive priorities", () => {
  for (const item of DASHBOARD_PROJECTIONS) {
    assert.match(item.nextAction.safeActionRef, /^contract\.actions\.primary/);
    assert.ok(item.responsivePriority.includes("CONTEXT"));
    assert.ok(item.responsivePriority.includes("ATTENTION"));
  }
});
