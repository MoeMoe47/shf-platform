import assert from "node:assert/strict";
import test from "node:test";
import { RealReviewPilotError, RealReviewPilotService, type CurrentAssignmentState, type PilotMembershipState } from "../src/domain/commercial-product-registry/review/real-review-pilot-service.ts";

const NOW = "2026-10-06T12:00:00.000Z";
const FUTURE = "2026-10-06T13:00:00.000Z";
const EXPIRES = "2026-10-07T12:00:00.000Z";
const org = "org-real-review";
const operatorId = "TEST_ONLY_4H_operator";
const reviewerId = "TEST_ONLY_4H_reviewer";

function membership(userId: string, permissions: string[], status = "active", organizationId = org): PilotMembershipState {
  return {
    membership_id: `membership_${userId}_${organizationId}`,
    user_id: userId,
    organization_id: organizationId,
    status,
    role_id: `role_${userId}`,
    role_name: `role_${userId}`,
    organization_status: "active",
    effective_from: "2026-10-05T00:00:00.000Z",
    effective_to: null,
    permissions,
  };
}

function setup(overrides: {
  reviewerExists?: boolean;
  reviewerMemberships?: PilotMembershipState[];
  operatorMemberships?: PilotMembershipState[];
  currentAssignments?: CurrentAssignmentState[];
  candidateIdentities?: Map<string, string>;
} = {}) {
  const mutations: any[] = [];
  const verifier = {
    getUser: async (userId: string) => overrides.reviewerExists === false || userId === "missing"
      ? null
      : { user_id: userId, status: "active", organization_id: org },
    getMemberships: async (userId: string, organizationId: string) => {
      if (userId === operatorId) return overrides.operatorMemberships ?? [membership(operatorId, ["commercial_product.review_assignment.manage"], "active", organizationId)];
      return overrides.reviewerMemberships ?? [membership(userId, ["commercial_product.read", "commercial_product.review_legal"], "active", organizationId)];
    },
    listCurrentAssignments: async () => overrides.currentAssignments ?? [],
  };
  const assignmentService = {
    createAssignment: async (input: any) => {
      mutations.push(input);
      return { assignment_id: "cpr_assignment_4h_test", assignment_status: "ACTIVE", ...input };
    },
  };
  const service = new RealReviewPilotService(overrides.candidateIdentities ?? new Map([["cc-001", "cp_test_001"], ["cc-002", "cp_test_002"]]), assignmentService, verifier, (fn: any) => fn({}), () => new Date(NOW));
  return { service, mutations };
}

const actor = {
  user_id: operatorId,
  active_organization_id: org,
  organization_id: org,
  tenant_id: `tenant:${org}`,
  permissions: ["commercial_product.review_assignment.manage"],
};

const input = {
  reviewer_actor_id: reviewerId,
  reviewer_org_id: org,
  candidate_id: "cc-001",
  commercial_product_id: "cp_test_001",
  gate_type: "LEGAL",
  effective_at: FUTURE,
  expires_at: EXPIRES,
  assignment_authority_reference: "pilot-authz://TEST_ONLY/4h/legal",
  reason: "TEST_ONLY controlled real-review pilot assignment",
};

const rejectsWithCode = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: any) => error instanceof RealReviewPilotError && error.code === code);

test("4H dry-run validates real identity, membership, capability, candidate, gate, and expiry without mutation", async () => {
  const { service, mutations } = setup();
  const result = await service.dryRun(input, actor);
  assert.equal(result.mode, "DRY_RUN");
  assert.equal(result.mutation_performed, false);
  assert.equal(result.production_onboarding_performed, false);
  assert.equal(result.readiness_sellability_lifecycle_mutated, false);
  assert.equal(result.reviewer.user_id, reviewerId);
  assert.equal(result.gate.required_capability, "commercial_product.review_legal");
  assert.equal(result.expected_queue_impact, "Reviewer will see candidate cc-001 for LEGAL only after activation and authentication.");
  assert.deepEqual(mutations, []);
});

test("4H rejects unknown user, inactive membership, wrong org, and missing reviewer capability", async () => {
  await rejectsWithCode(setup({ reviewerExists: false }).service.dryRun(input, actor), "REAL_REVIEW_USER_NOT_FOUND");
  await rejectsWithCode(setup({ reviewerMemberships: [membership(reviewerId, ["commercial_product.read", "commercial_product.review_legal"], "revoked")] }).service.dryRun(input, actor), "REAL_REVIEW_MEMBERSHIP_REQUIRED");
  await rejectsWithCode(setup().service.dryRun({ ...input, reviewer_org_id: "org-other" }, actor), "REAL_REVIEW_OPERATOR_ORG_MISMATCH");
  await rejectsWithCode(setup({ reviewerMemberships: [membership(reviewerId, ["commercial_product.read"])] }).service.dryRun(input, actor), "REAL_REVIEW_CAPABILITY_REQUIRED");
});

test("4H requires candidate assignment, gate assignment, explicit expiry, and refuses wildcards", async () => {
  const { service } = setup();
  await rejectsWithCode(service.dryRun({ ...input, candidate_id: "cc-999", commercial_product_id: "cp_test_999" }, actor), "REAL_REVIEW_CANDIDATE_SCOPE_INVALID");
  await rejectsWithCode(service.dryRun({ ...input, gate_type: "OTHER" }, actor), "REAL_REVIEW_GATE_INVALID");
  await rejectsWithCode(service.dryRun({ ...input, expires_at: "" }, actor), "REAL_REVIEW_REQUIRED_INPUT_MISSING");
  await rejectsWithCode(service.dryRun({ ...input, candidate_id: "*" }, actor), "REAL_REVIEW_WILDCARD_FORBIDDEN");
  await rejectsWithCode(service.dryRun({ ...input, gate_type: "ALL" }, actor), "REAL_REVIEW_WILDCARD_FORBIDDEN");
});

test("4H refuses self-provisioning and unauthorized operators", async () => {
  await rejectsWithCode(setup().service.dryRun({ ...input, reviewer_actor_id: operatorId }, actor), "REAL_REVIEW_SELF_PROVISIONING_FORBIDDEN");
  await rejectsWithCode(setup({ operatorMemberships: [membership(operatorId, ["commercial_product.read"])] }).service.dryRun(input, actor), "REAL_REVIEW_OPERATOR_FORBIDDEN");
});

test("4H activation requires confirm and creates exactly one least-privilege assignment", async () => {
  const { service, mutations } = setup();
  await rejectsWithCode(service.activate(input, actor), "REAL_REVIEW_CONFIRM_REQUIRED");
  const result = await service.activate({ ...input, confirm: true }, actor);
  assert.equal(result.mode, "ACTIVATED");
  assert.equal(result.assignment.assignment_status, "ACTIVE");
  assert.equal(mutations.length, 1);
  assert.deepEqual(mutations[0].allowed_gate_types, ["LEGAL"]);
  assert.equal(mutations[0].reviewer_actor_id, reviewerId);
  assert.equal(mutations[0].reviewer_org_id, org);
  assert.equal(mutations[0].candidate_id, "cc-001");
});

test("4H queue scope conflicts, revocation/expiry concepts, history preservation, and audit are delegated to 4F services", async () => {
  const currentAssignments = [{
    assignment_id: "cpr_assignment_existing",
    assignment_status: "ACTIVE",
    candidate_id: "cc-001",
    reviewer_actor_id: reviewerId,
    reviewer_org_id: org,
    effective_at: "2026-10-05T00:00:00.000Z",
    expires_at: EXPIRES,
    allowed_gate_types: ["LEGAL"],
  }];
  const result = await setup({ currentAssignments }).service.dryRun(input, actor);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.expected_queue_impact, "CONFLICTING_ACTIVE_ASSIGNMENT_REQUIRES_REVOCATION_OR_EXPIRY");
});

test("4H source-authority activation requires source capability and does not imply review-gate approval", async () => {
  await rejectsWithCode(setup({ reviewerMemberships: [membership(reviewerId, ["commercial_product.read", "commercial_product.review_legal"])] }).service.dryRun({ ...input, gate_type: "SOURCE_AUTHORITY" }, actor), "REAL_REVIEW_CAPABILITY_REQUIRED");
  const source = await setup({ reviewerMemberships: [membership(reviewerId, ["commercial_product.read", "commercial_product.review_source_authority"])] }).service.dryRun({ ...input, gate_type: "SOURCE_AUTHORITY" }, actor);
  assert.equal(source.gate.required_capability, "commercial_product.review_source_authority");
  assert.match(source.expected_queue_impact, /SOURCE_AUTHORITY only/);
});

test("4H contains no production onboarding, readiness, sellability, lifecycle, fake approval, or credential storage path", async () => {
  const { service } = setup();
  const result = await service.dryRun(input, actor);
  assert.equal(result.production_onboarding_performed, false);
  assert.equal(result.readiness_sellability_lifecycle_mutated, false);
  assert.doesNotMatch(JSON.stringify(result), /SELL_NOW|GREEN|ACTIVE_PRODUCT|password|secret|token|fake approval|human approval generated/i);
});
