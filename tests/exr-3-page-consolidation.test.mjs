import test from "node:test";
import assert from "node:assert/strict";
import {
  EXR_ALIAS_CONSOLIDATION_PLAN,
  EXR_DASHBOARD_RECLASSIFICATION,
  EXR_EXR4_BACKLOG,
  EXR_PAGE_CONSOLIDATION_PLAN,
  validateExrPageConsolidation,
} from "../src/system/exr/exrPageConsolidationPlan.js";

test("EXR-3 reconciles all audited page surfaces", () => {
  assert.equal(EXR_PAGE_CONSOLIDATION_PLAN.length, 37);
  assert.equal(new Set(EXR_PAGE_CONSOLIDATION_PLAN.map((entry) => entry.currentSurface)).size, 37);
  assert.equal(validateExrPageConsolidation().valid, true);
});

test("dashboard classification preserves true dashboards and converts work surfaces", () => {
  assert.equal(EXR_DASHBOARD_RECLASSIFICATION.length, 20);
  assert.equal(EXR_DASHBOARD_RECLASSIFICATION.filter((entry) => entry.classification === "TRUE_DASHBOARD").length, 7);
  assert.equal(EXR_DASHBOARD_RECLASSIFICATION.filter((entry) => entry.classification === "QUEUE").length, 3);
  assert.equal(EXR_DASHBOARD_RECLASSIFICATION.filter((entry) => entry.classification === "WORKFLOW").length, 5);
  assert.ok(EXR_DASHBOARD_RECLASSIFICATION.some((entry) => entry.id === "organization-onboarding" && entry.classification === "WORKFLOW"));
});

test("onboarding, Hub, Studio, CivicSure, and Student plans are role/state bounded", () => {
  const byName = (name) => EXR_PAGE_CONSOLIDATION_PLAN.find((entry) => entry.currentSurface === name);
  assert.equal(byName("Organization Onboarding").canonicalSurfaceType, "WORKFLOW");
  assert.equal(byName("Hub Action Queue").canonicalSurfaceType, "QUEUE");
  assert.equal(byName("Studio QA").canonicalSurfaceType, "QUEUE");
  assert.equal(byName("CivicSure Provider").disposition, "SPLIT_BY_ROLE");
  assert.equal(byName("Student Dashboard").priority, "P1_JOURNEY");
});

test("accessibility, reporting, and help remain contextual rather than collapsed", () => {
  const byName = (name) => EXR_PAGE_CONSOLIDATION_PLAN.find((entry) => entry.currentSurface === name);
  assert.equal(byName("Accessibility Settings").targetDestination, "/account/accessibility");
  assert.equal(byName("Accommodation").targetDestination, "/operator/accommodations");
  assert.equal(byName("Accessibility Operations").targetDestination, "/operator/accessibility-operations");
  assert.equal(byName("Reporting Command").disposition, "MERGE");
  assert.equal(byName("Documentation Center").targetDestination, "/help");
});

test("aliases, retirement prerequisites, NCA boundary, and EXR-4 priorities are explicit", () => {
  assert.equal(EXR_ALIAS_CONSOLIDATION_PLAN.length, 10);
  assert.equal(EXR_ALIAS_CONSOLIDATION_PLAN.filter((entry) => entry.classification === "REDIRECT_CANDIDATE").length, 3);
  assert.equal(EXR_PAGE_CONSOLIDATION_PLAN.filter((entry) => entry.disposition === "RETIRE").length, 0);
  assert.ok(EXR_PAGE_CONSOLIDATION_PLAN.some((entry) => entry.ncaIntegration === "NCA_INTEGRATION_REQUIRED"));
  assert.equal(EXR_EXR4_BACKLOG.length, 9);
  assert.ok(EXR_EXR4_BACKLOG.every((entry) => entry.priority === "P1_JOURNEY" && entry.dependencies.length > 0));
});
