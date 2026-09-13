import assert from "node:assert/strict";
import { test } from "node:test";
import { ONBOARDING_ROLE_PERMISSIONS, resolveOnboardingExperience } from "../apps/shf-web/src/system/sea/onboardingRoleProjection.js";

test("onboarding role projection is server-permission based", () => {
  assert.equal(resolveOnboardingExperience({ permissions: [ONBOARDING_ROLE_PERMISSIONS.submit] }), "APPLICANT");
  assert.equal(resolveOnboardingExperience({ permissions: [ONBOARDING_ROLE_PERMISSIONS.review] }), "REVIEWER");
  assert.equal(resolveOnboardingExperience({ permissions: [ONBOARDING_ROLE_PERMISSIONS.submit, ONBOARDING_ROLE_PERMISSIONS.review] }), "REVIEWER");
  assert.equal(resolveOnboardingExperience({ permissions: [] }), "UNAUTHORIZED");
});

test("onboarding role projection does not trust client role labels", () => {
  assert.equal(resolveOnboardingExperience({ role: "reviewer", permissions: [ONBOARDING_ROLE_PERMISSIONS.submit] }), "APPLICANT");
  assert.equal(resolveOnboardingExperience({ role: "applicant", permissions: [ONBOARDING_ROLE_PERMISSIONS.review] }), "REVIEWER");
});
