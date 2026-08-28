import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCurriculumPublicDisclosure } from "../src/domain/reporting/report-public-disclosure-service.ts";
import { APPROVED_CURRICULUM_POLICY_V1 } from "../src/domain/reporting/report-public-disclosure-policy-service.ts";

const policy = { policy_definition: APPROVED_CURRICULUM_POLICY_V1 };
const base = {
  canonical_count: 10,
  geography: "COUNTY",
  program_granularity: "FOUNDATION_WIDE",
  reporting_period: "ANNUAL",
  reporting_period_label: "2026",
  data_as_of: "2026-08-01",
  evaluated_at: "2026-08-26",
  complementary_suppression_review: "PASS",
  reidentification_review: "PASS",
  rare_event_review: "PASS",
  reconstruction_review: "PASS",
  longitudinal_review: "PASS",
  combination_risk_review: "PASS",
};

test("curriculum v1 allows only governed slices and preserves the internal count", () => {
  for (const geography of ["COUNTY", "STATE", "ORGANIZATION_WIDE"]) assert.doesNotThrow(() => evaluateCurriculumPublicDisclosure(policy, { ...base, geography }));
  for (const program_granularity of ["FOUNDATION_WIDE", "NAMED_PROGRAM"]) assert.doesNotThrow(() => evaluateCurriculumPublicDisclosure(policy, { ...base, program_granularity }));
  for (const reporting_period of ["QUARTERLY", "ANNUAL"]) assert.doesNotThrow(() => evaluateCurriculumPublicDisclosure(policy, { ...base, reporting_period }));
  for (const geography of ["MUNICIPALITY", "SITE"]) assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, geography }));
  for (const program_granularity of ["COHORT", "COURSE", "LESSON"]) assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, program_granularity }));
  assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, reporting_period: "MONTHLY" }));
  assert.equal(evaluateCurriculumPublicDisclosure(policy, base).internal_value, 10);
});

test("curriculum v1 suppresses counts below ten without mutating the canonical value", () => {
  const result = evaluateCurriculumPublicDisclosure(policy, { ...base, canonical_count: 9 });
  assert.equal(result.internal_value, 9);
  assert.equal(result.public_value, "<10");
  assert.equal(result.display_mode, "SUPPRESSED_LT_10");
  assert.equal(evaluateCurriculumPublicDisclosure(policy, { ...base, canonical_count: 0 }).public_value, "<10");
  assert.equal(evaluateCurriculumPublicDisclosure(policy, { ...base, canonical_count: 0, zero_publicly_safe: true }).public_value, 0);
});

test("curriculum v1 requires every residual-risk review and freshness metadata", () => {
  for (const key of ["complementary_suppression_review", "reidentification_review", "rare_event_review", "reconstruction_review", "longitudinal_review", "combination_risk_review"]) {
    assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, [key]: "UNKNOWN" }));
  }
  assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, reporting_period_label: undefined }));
  assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, data_as_of: undefined }));
  assert.throws(() => evaluateCurriculumPublicDisclosure(policy, { ...base, data_as_of: "2024-01-01" }));
  assert.doesNotThrow(() => evaluateCurriculumPublicDisclosure(policy, { ...base, data_as_of: "2024-01-01", renewed_review: true }));
});
