import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { REVIEW_GATE_POLICY } from "../src/domain/commercial-product-registry/review/review-contract.ts";

const root = path.resolve(import.meta.dirname, "../../..");
const readJson = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));

test("4E reviewer profiles are minimum-capability operational bundles, not new roles", async () => {
  const plan = await readJson("docs/sales/commercial-product-registry-review-pilot/reviewer-provisioning-plan.json");
  const profileIds = plan.profiles.map((profile: any) => profile.profile_id);
  assert.equal(plan.profile_model, "OPERATIONAL_PROVISIONING_PROFILES");
  assert.equal(new Set(profileIds).size, 15);
  for (const profile of plan.profiles) {
    assert.ok(profile.capabilities.includes("commercial_product.read"));
    assert.equal(profile.capabilities.length, 2);
    if (profile.profile_id === "SOURCE_AUTHORITY_REVIEWER") {
      assert.deepEqual(profile.allowed_gate_types, []);
      assert.ok(profile.capabilities.includes("commercial_product.review_source_authority"));
    } else {
      assert.equal(profile.allowed_gate_types.length, 1);
      const expected = REVIEW_GATE_POLICY[profile.allowed_gate_types[0] as keyof typeof REVIEW_GATE_POLICY].capability;
      assert.ok(profile.capabilities.includes(expected));
    }
  }
  assert.equal(plan.scope_enforcement.organization_membership, "ENFORCED_BY_IDENTITY_CONTEXT");
  assert.equal(plan.scope_enforcement.gate_capability, "ENFORCED_BY_4D_REVIEW_API");
  assert.equal(plan.scope_enforcement.candidate_assignment, "OPERATOR_CONTROL_ONLY_NOT_ENFORCED_BY_4D");
  assert.equal(plan.expiry.membership_effective_to_read, "ENFORCED_BY_PRODUCTION_IDENTITY_LOOKUP");
  assert.equal(plan.expiry.membership_assignment_api_sets_expiry, false);
});

test("4E pilot candidate set is deterministic and preserves reviewed manifest state", async () => {
  const review = await readJson("docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json");
  const onboarding = await readJson("docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");
  const assignmentRegister = await readJson("docs/sales/commercial-product-registry-review-pilot/reviewer-assignment-register.json");
  const candidates = await readFile(path.join(root, "docs/sales/commercial-product-registry-review-pilot/03_PILOT_REVIEW_MATRIX.md"), "utf8");
  const expected = new Map([
    ["cc-001", "DATA_CENTER"],
    ["cc-005", "CORE_EDUCATION"],
    ["cc-011", "HEALTHCARE_WORKFORCE"],
    ["cc-019", "METAVERSE"],
    ["cc-025", "INSTITUTIONAL_TECH_SHS"],
    ["cc-029", "ASSURANCE_VERIFICATION_REPORTING"],
  ]);
  assert.equal(expected.size, 6);
  for (const [candidateId, family] of expected) {
    const candidate = review.candidates.find((item: any) => item.candidate_id === candidateId);
    const source = onboarding.candidates.find((item: any) => item.candidate_id === candidateId);
    assert.ok(candidate && source);
    assert.equal(candidate.family, family);
    assert.equal(candidate.commercial_product_id, source.proposed_commercial_product_id);
    assert.match(candidates, new RegExp(`\\b${candidateId}\\b`));
    assert.ok(candidate.sellability !== "SELL_NOW" || source.onboarding_disposition === "READY_TO_REGISTER");
  }
  assert.deepEqual(assignmentRegister.assignments, []);
  assert.equal(assignmentRegister.status, "TEMPLATE_ONLY");
  assert.match(candidates, /Expected pilot outcome/);
  assert.match(candidates, /REGULATORY:PENDING/);
});

test("4E operational readiness, future UI, and no-production boundaries are documented", async () => {
  const dir = "docs/sales/commercial-product-registry-review-pilot";
  for (const name of [
    "00_EXECUTIVE_SUMMARY.md", "01_REVIEWER_PROVISIONING_MODEL.md", "02_PILOT_CANDIDATE_SELECTION.md",
    "03_PILOT_REVIEW_MATRIX.md", "04_OPERATOR_PROCEDURE.md", "05_REVOCATION_AND_EXPIRY.md",
    "06_REAL_REVIEWER_READINESS_CHECKLIST.md", "07_FUTURE_REVIEW_UI_REQUIREMENTS.md", "08_ACCEPTANCE.md",
  ]) assert.ok((await readFile(path.join(root, dir, name), "utf8")).length > 100);
  const procedure = await readFile(path.join(root, dir, "04_OPERATOR_PROCEDURE.md"), "utf8");
  const summary = await readFile(path.join(root, dir, "00_EXECUTIVE_SUMMARY.md"), "utf8");
  assert.match(procedure, /Revoke the membership/);
  assert.match(summary, /no real approval/i);
  assert.match(summary, /candidate-specific assignments/);
});
