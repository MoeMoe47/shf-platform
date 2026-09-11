import assert from "node:assert/strict";
import test from "node:test";
import { getPublicReportGovernanceRegistration } from "../src/domain/reporting/report-public-governance-registry.js";
import { evaluateGpaProgramAssurancePublicDisclosure } from "../src/domain/reporting/report-public-disclosure-service.js";
import { APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1 } from "../src/domain/reporting/report-public-disclosure-policy-service.js";

const reportId = "report.gpa.program_assurance_public_summary.v1";

test("GPA public report family is registered against the canonical metric", () => {
  const registration = getPublicReportGovernanceRegistration(reportId, 1);
  assert.ok(registration);
  assert.equal(registration?.domain, "GOVERNMENT_PROGRAM_ASSURANCE");
  assert.equal(registration?.metric_id, "workforce.employment.started_verified_count.v1");
  assert.equal(registration?.metric_version, 1);
  assert.equal(registration?.disclosure_evaluator, "GPA_PROGRAM_ASSURANCE_V1");
});

test("GPA public disclosure suppresses small aggregates and requires residual review", () => {
  const result = evaluateGpaProgramAssurancePublicDisclosure({ policy_definition: APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1 }, {
    canonical_count: 4,
    geography: "COUNTY",
    program_granularity: "NAMED_PROGRAM",
    reporting_period: "QUARTERLY",
    reporting_period_label: "Q3 2026",
    data_as_of: "2026-08-31T00:00:00.000Z",
    complementary_suppression_review: "PASS",
    reidentification_review: "PASS",
    rare_event_review: "PASS",
    reconstruction_review: "PASS",
    longitudinal_review: "PASS",
    combination_risk_review: "PASS",
  });
  assert.deepEqual(result, { internal_value: 4, public_value: "<10", display_mode: "SUPPRESSED_LT_10" });
});
