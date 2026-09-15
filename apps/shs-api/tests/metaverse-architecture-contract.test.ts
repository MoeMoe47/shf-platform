import test from "node:test";
import assert from "node:assert/strict";

import {
  ACCESSIBILITY_CONTRACT,
  CITY_REGISTRY_REQUIRED_FIELDS,
  CIVIC_GOVERNMENT_BOUNDARY,
  ECONOMY_BOUNDARY,
  EVIDENCE_VERIFICATION_CONTRACT,
  JOB_SIMULATION_CONTRACT,
  LEARNER_UNLOCK_CONTRACT,
  MET0_P0_REMEDIATION,
  METAVERSE_AUTHORITY_MAP,
  METAVERSE_SESSION_CONTRACT,
  METAVERSE_TASK_CONTRACT,
  METAVERSE_TASK_REQUIRED_FIELDS,
  SECURITY_SAFETY_BOUNDARY,
  validateMetaverseArchitectureContract,
} from "../src/domain/metaverse/model/metaverse-contract.ts";

function authority(id: string) {
  const entry = METAVERSE_AUTHORITY_MAP.find((item) => item.authorityId === id);
  assert.ok(entry, `missing authority: ${id}`);
  return entry;
}

test("metaverse architecture validator accepts the canonical contract", () => {
  assert.deepEqual(validateMetaverseArchitectureContract(), []);
});

test("metaverse does not duplicate identity authority", () => {
  const identity = authority("identity");
  assert.equal(identity.metaverseMustNotOwn, true);
  assert.equal(identity.metaverseMayWrite, false);
  assert.match(identity.canonicalOwner, /identity/);
  assert.equal(METAVERSE_SESSION_CONTRACT.isIdentityAuthority, false);
});

test("metaverse does not duplicate career authority", () => {
  const career = authority("career-authority");
  assert.equal(career.metaverseMustNotOwn, true);
  assert.equal(career.metaverseMayWrite, false);
  assert.match(career.canonicalOwner, /career/);
});

test("metaverse does not duplicate civic authority and excludes CivicSure", () => {
  const civic = authority("civic-simulations");
  assert.equal(civic.canonicalOwner, "shf-civic");
  assert.equal(civic.metaverseMustNotOwn, true);
  assert.equal(civic.metaverseMayWrite, false);
  assert.equal(CIVIC_GOVERNMENT_BOUNDARY.civicSureExcluded, true);
  assert.ok(CIVIC_GOVERNMENT_BOUNDARY.prohibitedClaims.includes("CivicSure_student_government_authority"));
});

test("metaverse does not duplicate evidence, truth, verification, or credential authority", () => {
  for (const id of ["evidence-emission", "verification", "credential-issuance"]) {
    const entry = authority(id);
    assert.equal(entry.metaverseMustNotOwn, true, id);
    assert.equal(entry.metaverseMayWrite, false, id);
  }
  assert.equal(EVIDENCE_VERIFICATION_CONTRACT.metaverseMayEmitEvents, true);
  assert.equal(EVIDENCE_VERIFICATION_CONTRACT.metaverseMaySelfCertifyTruth, false);
  assert.equal(EVIDENCE_VERIFICATION_CONTRACT.verificationStatusInitialValue, "UNVERIFIED");
});

test("unlock contract requires server-authoritative facts", () => {
  assert.equal(LEARNER_UNLOCK_CONTRACT.serverAuthoritativeRequired, true);
  assert.equal(LEARNER_UNLOCK_CONTRACT.clientStateCanGrantAuthority, false);
  assert.ok(LEARNER_UNLOCK_CONTRACT.allowedInputs.includes("organization"));
  assert.ok(LEARNER_UNLOCK_CONTRACT.allowedInputs.includes("verified_evidence"));
  assert.ok(LEARNER_UNLOCK_CONTRACT.allowedInputs.includes("career_pathway_state"));
  assert.ok(LEARNER_UNLOCK_CONTRACT.forbiddenInputs.includes("localStorage"));
  assert.ok(LEARNER_UNLOCK_CONTRACT.forbiddenInputs.includes("browser_flag"));
  assert.ok(LEARNER_UNLOCK_CONTRACT.forbiddenInputs.includes("client_submitted_mastery"));
});

test("task completion is distinct from verified mastery", () => {
  assert.equal(METAVERSE_TASK_CONTRACT.completionEqualsVerifiedMastery, false);
  assert.equal(METAVERSE_TASK_CONTRACT.verifiedMasteryRequiresVerification, true);
  assert.ok(METAVERSE_TASK_REQUIRED_FIELDS.includes("evidence_requirements"));
  assert.ok(METAVERSE_TASK_REQUIRED_FIELDS.includes("accessibility_equivalent"));
  assert.ok(METAVERSE_TASK_REQUIRED_FIELDS.includes("scoring_rubric_reference"));
});

test("economy categories remain distinct and transactions stay blocked until authority is resolved", () => {
  const categories = ECONOMY_BOUNDARY.categories.map((category) => category.id);
  assert.deepEqual(categories.sort(), ["experience_rewards", "learning_credits", "real_money", "shf_dollars"].sort());
  assert.equal(new Set(categories).size, categories.length);
  assert.equal(ECONOMY_BOUNDARY.canonicalEconomyAuthorityResolved, false);
  assert.equal(ECONOMY_BOUNDARY.implementationBlockedUntilAuthorityResolved, true);

  const shfDollars = ECONOMY_BOUNDARY.categories.find((category) => category.id === "shf_dollars");
  const realMoney = ECONOMY_BOUNDARY.categories.find((category) => category.id === "real_money");
  assert.equal(shfDollars?.spent, "blocked");
  assert.equal(realMoney?.earned, false);
  assert.equal(realMoney?.spent, false);
  assert.equal(realMoney?.transferred, false);
});

test("accessibility equivalent and cross-organization boundaries are explicit", () => {
  assert.ok(ACCESSIBILITY_CONTRACT.requiredCapabilities.includes("keyboard_operable_path"));
  assert.ok(ACCESSIBILITY_CONTRACT.requiredCapabilities.includes("screen_reader_equivalent"));
  assert.ok(ACCESSIBILITY_CONTRACT.requiredCapabilities.includes("non_spatial_alternate_interaction"));
  assert.ok(ACCESSIBILITY_CONTRACT.requiredCapabilities.includes("accessible_task_equivalent"));
  assert.equal(SECURITY_SAFETY_BOUNDARY.crossOrganizationBoundaryExplicit, true);
  assert.ok(SECURITY_SAFETY_BOUNDARY.requiredProtections.includes("cross_organization_access"));
  assert.ok(METAVERSE_SESSION_CONTRACT.requiredFields.includes("user_id"));
  assert.ok(METAVERSE_SESSION_CONTRACT.requiredFields.includes("organization_id"));
});

test("city registry and job simulation contracts contain required safety fields", () => {
  assert.ok(CITY_REGISTRY_REQUIRED_FIELDS.includes("access_requirements"));
  assert.ok(CITY_REGISTRY_REQUIRED_FIELDS.includes("career_alignment"));
  assert.ok(CITY_REGISTRY_REQUIRED_FIELDS.includes("civic_alignment"));
  assert.ok(CITY_REGISTRY_REQUIRED_FIELDS.includes("accessibility_alternatives"));
  assert.ok(CITY_REGISTRY_REQUIRED_FIELDS.includes("evidence_capabilities"));

  assert.ok(JOB_SIMULATION_CONTRACT.requiredFields.includes("pathway_alignment"));
  assert.ok(JOB_SIMULATION_CONTRACT.requiredFields.includes("verification_path"));
  assert.ok(JOB_SIMULATION_CONTRACT.requiredFields.includes("simulated_not_employment_disclaimer"));
  assert.equal(JOB_SIMULATION_CONTRACT.disclaimerRequired, true);
  assert.equal(JOB_SIMULATION_CONTRACT.employmentAuthority, false);
});

test("MET-0 P0 gaps are mapped to MET-1 architecture decisions", () => {
  const gapIds = MET0_P0_REMEDIATION.map((gap) => gap.gapId).sort();
  assert.deepEqual(gapIds, ["MET-GAP-001", "MET-GAP-002", "MET-GAP-003", "MET-GAP-004", "MET-GAP-005"]);

  for (const gap of MET0_P0_REMEDIATION) {
    assert.ok(gap.decision);
    assert.ok(gap.resultingContract);
    assert.ok(gap.acceptanceTest);
    assert.ok(gap.remainingImplementationDependency);
  }
});
