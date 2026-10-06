import assert from "node:assert/strict";
import test from "node:test";
import { PostgresReviewerAssignmentRepo } from "../src/domain/commercial-product-registry/review/postgres-reviewer-assignment-repo.ts";
import { CommercialProductReviewerAssignmentService } from "../src/domain/commercial-product-registry/review/reviewer-assignment-service.ts";

const actor = {
  user_id: "TEST_ONLY provisioner",
  active_organization_id: "org-test",
  organization_id: "org-test",
  tenant_id: "tenant:org-test",
  permissions: ["commercial_product.review_assignment.manage"],
};

function setup() {
  const rows: any[] = [];
  const audits: any[] = [];
  const repo: any = {
    assertIdentityMembership: async (actorId: string, orgId: string, _executor: any, capability?: string) =>
      orgId === "org-test" && (actorId === "TEST_ONLY provisioner" || actorId === "TEST_ONLY reviewer" || actorId === "TEST_ONLY other") &&
      (!capability || actorId === "TEST_ONLY provisioner" && capability === "commercial_product.review_assignment.manage"),
    lockAssignmentKey: async () => {},
    expirePastAssignments: async () => ({ rows: [] }),
    getAssignment: async (id: string) => rows.find((row) => row.assignment_id === id) || null,
    revokeAssignment: async (id: string, revokedBy: string) => {
      const row = rows.find((item) => item.assignment_id === id && item.assignment_status === "ACTIVE");
      if (!row) return null;
      Object.assign(row, { assignment_status: "REVOKED", revoked_by_actor_id: revokedBy, revoked_at: "2026-10-05T12:00:00.000Z", version: Number(row.version || 1) + 1 });
      return row;
    },
    assignmentHistory: async () => audits,
    insertAssignment: async (input: any) => { rows.push({ ...input, assignment_status: "ACTIVE" }); return rows.at(-1); },
  };
  const transaction = (fn: any) => fn({ query: async (sql: string) => ({ rows: sql.includes("SELECT assignment_id") ? rows.filter((row) => row.assignment_status === "ACTIVE") : [{ now: "2026-10-05T12:00:00.000Z" }] }) });
  const service = new CommercialProductReviewerAssignmentService(new Map([["cc-001", "cp_test_001"]]), repo, async (event: any) => audits.push(event), transaction, () => new Date("2026-10-05T12:00:00.000Z"));
  return { service, rows, audits, repo };
}

const assignment = {
  reviewer_actor_id: "TEST_ONLY reviewer",
  reviewer_org_id: "org-test",
  candidate_id: "cc-001",
  commercial_product_id: "cp_test_001",
  allowed_gate_types: ["LEGAL"],
  effective_at: "2026-10-05T12:00:00.000Z",
  expires_at: "2026-10-06T12:00:00.000Z",
  assignment_authority_reference: "test-only://provisioning/4f/assignment-1",
  reason: "TEST_ONLY least-privilege assignment fixture",
};

const rejectsWithCode = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: any) => error?.code === code);

test("reviewer assignment requires explicit manager capability, active target membership, and candidate/gate scope", async () => {
  const { service, rows, audits } = setup();
  await rejectsWithCode(service.createAssignment(assignment, { ...actor, user_id: "TEST_ONLY other", permissions: ["commercial_product.review_legal"] }), "ASSIGNMENT_PROVISIONING_FORBIDDEN");
  await rejectsWithCode(service.createAssignment({ ...assignment, reviewer_actor_id: actor.user_id }, actor), "ASSIGNMENT_SELF_ASSIGNMENT_FORBIDDEN");
  await rejectsWithCode(service.createAssignment({ ...assignment, candidate_id: "cc-999" }, actor), "ASSIGNMENT_CANDIDATE_IDENTITY_MISMATCH");
  await rejectsWithCode(service.createAssignment({ ...assignment, allowed_gate_types: ["OTHER"] }, actor), "ASSIGNMENT_GATE_INVALID");
  await rejectsWithCode(service.createAssignment({ ...assignment, assigned_by_actor_id: "spoof" }, actor), "ASSIGNMENT_INPUT_FIELD_FORBIDDEN");
  const created = await service.createAssignment(assignment, actor);
  assert.equal(created.reviewer_actor_id, "TEST_ONLY reviewer");
  assert.deepEqual(created.allowed_gate_types, ["LEGAL"]);
  assert.equal(rows.length, 1);
  assert.equal(audits[0].actor_user_id, actor.user_id);
  assert.equal(audits[0].organization_id, "org-test");
  assert.equal(audits[0].action_type, "commercial_product_registry.reviewer_assignment_created");
});

test("assignment actor and tenant context must match; source authority is an explicit scope", async () => {
  const { service, rows } = setup();
  await rejectsWithCode(service.createAssignment(assignment, { ...actor, tenant_id: "tenant:org-other" }), "ASSIGNMENT_ACTOR_CONTEXT_REQUIRED");
  await rejectsWithCode(service.createAssignment({ ...assignment, reviewer_org_id: "org-other" }, actor), "ASSIGNMENT_ORGANIZATION_MISMATCH");
  const sourceAssignment = await service.createAssignment({ ...assignment, allowed_gate_types: ["SOURCE_AUTHORITY"] }, actor);
  assert.deepEqual(sourceAssignment.allowed_gate_types, ["SOURCE_AUTHORITY"]);
  assert.equal(rows.length, 1);
});

test("duplicate active assignment, revocation authority, and history preservation are enforced", async () => {
  const { service, rows, audits } = setup();
  const created = await service.createAssignment(assignment, actor);
  await rejectsWithCode(service.createAssignment(assignment, actor), "ASSIGNMENT_DUPLICATE_ACTIVE");
  await rejectsWithCode(service.revokeAssignment(created.assignment_id, "nope", { ...actor, user_id: "TEST_ONLY other", permissions: ["commercial_product.review_legal"] }), "ASSIGNMENT_PROVISIONING_FORBIDDEN");
  const revoked = await service.revokeAssignment(created.assignment_id, "TEST_ONLY revocation", actor);
  assert.equal(revoked.assignment_status, "REVOKED");
  assert.equal(revoked.revoked_by_actor_id, actor.user_id);
  assert.equal(rows.length, 1);
  assert.ok(audits.some((event) => event.action_type === "commercial_product_registry.reviewer_assignment_created"));
  assert.ok(audits.some((event) => event.action_type === "commercial_product_registry.reviewer_assignment_revoked"));
  const history = await service.getAssignment(created.assignment_id, actor);
  assert.equal(history.assignment.assignment_status, "REVOKED");
  assert.ok(history.history.length >= 2);
});

test("active assignment lookup enforces effective_at, expires_at, active status query, and row lock", async () => {
  const repo = new PostgresReviewerAssignmentRepo();
  const active = {
    assignment_id: "cpr_assignment_active",
    version: 1,
    effective_at: "2026-10-05T11:00:00.000Z",
    expires_at: "2026-10-05T13:00:00.000Z",
  };
  const lookup = async (assignmentRow: any) => {
    const queries: string[] = [];
    const executor = {
      query: async (sql: string) => {
        queries.push(sql);
        if (sql.includes("clock_timestamp()")) return { rows: [{ now: "2026-10-05T12:00:00.000Z" }] };
        return { rows: assignmentRow ? [assignmentRow] : [] };
      },
    };
    return { result: await repo.assertActiveAssignment({ reviewerActorId: "reviewer", organizationId: "org-test", candidateId: "cc-001", commercialProductId: "cp_test_001", gateType: "LEGAL" }, executor), queries };
  };
  const allowed = await lookup(active);
  assert.equal(allowed.result.assignment_id, "cpr_assignment_active");
  assert.ok(allowed.queries[0].includes("a.assignment_status='ACTIVE'"));
  assert.ok(allowed.queries[0].includes("FOR UPDATE OF a"));
  assert.equal((await lookup({ ...active, effective_at: "2026-10-05T12:01:00.000Z" })).result, null);
  assert.equal((await lookup({ ...active, expires_at: "2026-10-05T12:00:00.000Z" })).result, null);
  assert.equal((await lookup(null)).result, null);
});
