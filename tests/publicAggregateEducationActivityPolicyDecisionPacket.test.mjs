import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packet = readFileSync(new URL("../docs/SHF_PUBLIC_AGGREGATE_EDUCATION_ACTIVITY_POLICY_DECISION_PACKET.md", import.meta.url), "utf8");
const service = readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-public-disclosure-policy-service.ts", import.meta.url), "utf8");
const policyContract = readFileSync(new URL("../docs/SHF_PUBLIC_DISCLOSURE_POLICY_CONTRACT.md", import.meta.url), "utf8");

test("decision packet covers every implemented machine-policy field", () => {
  for (const field of [
    "minimum_group_size", "cohort_size", "allowed_geography_levels", "allowed_program_granularity",
    "reporting_period", "reidentification_risk", "rare_event_risk", "sensitive_outcome_type",
    "longitudinal_linkage", "cross_metric_combination_risk", "suppression_required", "exact_count_allowed",
  ]) {
    assert.match(service, new RegExp(`"${field}"`));
    assert.match(packet, new RegExp(`\\b${field}\\b`));
  }
});

test("packet records approved values without expanding authority", () => {
  assert.doesNotMatch(packet, /GOVERNANCE DECISION REQUIRED/);
  assert.match(packet, /conservative posture is a recommendation only, not an approved policy/);
  assert.match(packet, /numeric value `10`/);
  assert.match(packet, /POLICY_SCHEMA_GAP/);
  assert.match(packet, /PRIVACY_DATA_GOVERNANCE/);
  assert.match(packet, /LEGAL_PRIVACY_REVIEW/);
  assert.match(packet, /EXECUTIVE_APPROVAL/);
  assert.match(packet, /PUBLIC_DISCLOSURE_APPROVED.*available only after exact report-review gates/s);
});

test("packet preserves curriculum activity semantics and separate public gates", () => {
  assert.match(packet, /lesson completion activity count/);
  assert.match(packet, /does not mean course completion, graduation, credential attainment, mastery/);
  assert.match(packet, /public_approved/);
  assert.match(packet, /authorize publication/);
  assert.match(packet, /publish/);
  assert.match(policyContract, /Policy v1 is now institutionally approved/);
  assert.doesNotMatch(packet, /The report proves.*(?:graduation|mastery|impact)/s);
});
