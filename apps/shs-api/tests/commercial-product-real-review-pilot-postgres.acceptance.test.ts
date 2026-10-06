import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";
import express from "express";
import test from "node:test";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.SHS_TEST_DATABASE_URL;
const root = path.resolve(import.meta.dirname, "../../..");

test("4H real-review pilot activation remains canonical, scoped, revocable, expiring, and non-onboarding on PostgreSQL", {
  skip: databaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable 4H PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.SHS_AUTH_ENV = "test";
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { ProductionIdentityRepo } = await import("../src/domain/identity/repo/production-identity-repo.ts");
  const { applyActiveOrganizationContext } = await import("../src/auth/organization-context.ts");
  const { registerCommercialProductReviewRoutes } = await import("../src/domain/commercial-product-registry/review/review-operations-routes.ts");
  const { registerCommercialProductReviewerAssignmentRoutes } = await import("../src/domain/commercial-product-registry/review/reviewer-assignment-routes.ts");
  const { buildReviewPackets } = await import("../src/domain/commercial-product-registry/review/review-packet-generator.ts");
  const { CommercialProductReviewerAssignmentService } = await import("../src/domain/commercial-product-registry/review/reviewer-assignment-service.ts");
  const { RealReviewPilotService } = await import("../src/domain/commercial-product-registry/review/real-review-pilot-service.ts");

  const migrations = await discoverMigrations(path.join(root, "apps/shs-api/migrations"));
  const migrationPool = new Pool({ connectionString: databaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    await runMigrations(migrationClient, migrations);
    const status = await inspectMigrations(migrationClient, migrations);
    assert.deepEqual(status.pending, []);
    assert.deepEqual(status.drift, []);
    assert.deepEqual(status.unknownApplied, []);
  } finally {
    migrationClient.release();
    await migrationPool.end();
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const suffix = `${process.pid}_${Date.now()}`;
  const orgA = `org_cpr_4h_a_${suffix}`;
  const orgB = `org_cpr_4h_b_${suffix}`;
  const operator = `user_cpr_4h_operator_${suffix}`;
  const legal = `user_cpr_4h_legal_${suffix}`;
  const revokedReviewer = `user_cpr_4h_revoked_${suffix}`;
  const expiredReviewer = `user_cpr_4h_expired_${suffix}`;
  const orgBReviewer = `user_cpr_4h_orgb_${suffix}`;
  const [reviewManifest, onboardingManifest] = await Promise.all([
    readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8").then(JSON.parse),
  ]);
  const reviewPackets = buildReviewPackets(reviewManifest, onboardingManifest, reviewManifest.reviewed_at);
  const candidateIdentities = new Map(reviewPackets.map((packet: any) => [packet.candidate_id, packet.commercial_product_id]));
  const identityRepo = new ProductionIdentityRepo();
  const assignmentService = new CommercialProductReviewerAssignmentService(candidateIdentities);
  const pilot = new RealReviewPilotService(candidateIdentities, assignmentService);

  const app = express();
  app.use(express.json());
  app.use(async (req: any, _res: any, next: any) => {
    try {
      const actorId = req.header("x-test-actor");
      const orgId = req.header("x-test-org");
      if (!actorId || !orgId) return next();
      const identity = await identityRepo.getActiveIdentity(actorId);
      if (identity) {
        try { req.user = applyActiveOrganizationContext(identity, orgId); }
        catch { req.user = { user_id: actorId, active_organization_id: orgId, organization_id: orgId, tenant_id: `tenant:${orgId}`, org_context_error: "ORG_CONTEXT_FORBIDDEN", permissions: [] }; }
      }
      return next();
    } catch (error) { return next(error); }
  });
  registerCommercialProductReviewRoutes(app);
  registerCommercialProductReviewerAssignmentRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const request = (route: string, actorId: string, orgId = orgA, init: any = {}) => fetch(`${base}${route}`, {
    ...init,
    headers: { "content-type": "application/json", "x-test-actor": actorId, "x-test-org": orgId, ...(init.headers || {}) },
  });
  const operatorActor = {
    user_id: operator,
    active_organization_id: orgA,
    organization_id: orgA,
    tenant_id: `tenant:${orgA}`,
    permissions: ["commercial_product.review_assignment.manage"],
  };
  const roleId = (userId: string, orgId: string) => `role_${userId}_${orgId}`;
  const insertIdentity = async (userId: string, orgId: string, roleName: string, permissions: string[]) => {
    await pool.query("INSERT INTO users (user_id,organization_id,email,full_name,status,identity_source) VALUES ($1,$2,$3,$4,'active','test') ON CONFLICT (user_id) DO NOTHING", [userId, orgId, `${userId}@example.test`, `TEST_ONLY ${roleName}`]);
    await pool.query("INSERT INTO roles (role_id,organization_id,role_name,role_scope_type) VALUES ($1,$2,$3,'organization')", [roleId(userId, orgId), orgId, `test_only_${roleName}_${suffix}`]);
    for (const [index, permission] of permissions.entries()) {
      await pool.query("INSERT INTO role_permissions (role_permission_id,role_id,permission_name) VALUES ($1,$2,$3)", [`rp_${roleId(userId, orgId)}_${index}`, roleId(userId, orgId), permission]);
    }
    await pool.query("INSERT INTO memberships (membership_id,user_id,organization_id,role_id,status,effective_from) VALUES ($1,$2,$3,$4,'active',NOW()-interval '1 day')", [`membership_${userId}_${orgId}`, userId, orgId, roleId(userId, orgId)]);
  };
  const activate = (reviewer: string, candidate: string, gate = "LEGAL") => pilot.activate({
    reviewer_actor_id: reviewer,
    reviewer_org_id: orgA,
    candidate_id: candidate,
    commercial_product_id: candidateIdentities.get(candidate),
    gate_type: gate,
    effective_at: new Date(Date.now() - 60_000).toISOString(),
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    assignment_authority_reference: "test-only://4h/operator-authorization",
    reason: "TEST_ONLY controlled real-human review pilot fixture",
    confirm: true,
  }, operatorActor);

  try {
    await pool.query("INSERT INTO organizations (organization_id,legal_name,display_name,org_type,status) VALUES ($1,'TEST_ONLY 4H A','TEST_ONLY 4H A','SHS','active'),($2,'TEST_ONLY 4H B','TEST_ONLY 4H B','SHS','active')", [orgA, orgB]);
    await insertIdentity(operator, orgA, "operator", ["commercial_product.read", "commercial_product.review_assignment.manage", "commercial_product.review.read_all"]);
    await insertIdentity(legal, orgA, "legal_reviewer", ["commercial_product.read", "commercial_product.review_legal"]);
    await insertIdentity(revokedReviewer, orgA, "revoked_reviewer", ["commercial_product.read", "commercial_product.review_legal"]);
    await insertIdentity(expiredReviewer, orgA, "expired_reviewer", ["commercial_product.read", "commercial_product.review_legal"]);
    await insertIdentity(orgBReviewer, orgB, "orgb_reviewer", ["commercial_product.read", "commercial_product.review_legal"]);

    const dryRun = await pilot.dryRun({
      reviewer_actor_id: legal,
      reviewer_org_id: orgA,
      candidate_id: "cc-001",
      commercial_product_id: candidateIdentities.get("cc-001"),
      gate_type: "LEGAL",
      effective_at: new Date(Date.now() - 60_000).toISOString(),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      assignment_authority_reference: "test-only://4h/operator-authorization",
      reason: "TEST_ONLY dry-run",
    }, operatorActor);
    assert.equal(dryRun.mutation_performed, false);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_reviewer_assignments")).rows[0].count), 0);

    const activated = await activate(legal, "cc-001");
    assert.equal(activated.assignment.assignment_status, "ACTIVE");
    const queue = await request("/commercial-product-reviews", legal);
    assert.equal(queue.status, 200);
    assert.deepEqual((await queue.json() as any).data.items.map((item: any) => item.candidate_id), ["cc-001"]);
    assert.equal((await request("/commercial-product-reviews/cc-002/packet", legal)).status, 403);
    assert.equal((await request("/commercial-product-reviews/cc-001/decisions", legal, orgA, {
      method: "POST",
      body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", decision_reason: "TEST_ONLY real reviewer will decide manually", reviewed_at: new Date().toISOString() }),
    })).status, 201);
    assert.equal((await request("/commercial-product-reviews/cc-001/decisions", legal, orgB, {
      method: "POST",
      body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", decision_reason: "TEST_ONLY wrong org", reviewed_at: new Date().toISOString() }),
    })).status, 403);

    const revoked = await activate(revokedReviewer, "cc-002");
    const revokeResponse = await request(`/commercial-product-reviewer-assignments/${revoked.assignment.assignment_id}/revoke`, operator, orgA, { method: "POST", body: JSON.stringify({ reason: "TEST_ONLY revocation drill" }) });
    assert.equal(revokeResponse.status, 200);
    assert.equal((await request("/commercial-product-reviews/cc-002/packet", revokedReviewer)).status, 403);

    const expiring = await activate(expiredReviewer, "cc-003");
    await pool.query("UPDATE commercial_product_reviewer_assignments SET expires_at=NOW()-interval '1 second' WHERE assignment_id=$1", [expiring.assignment.assignment_id]);
    assert.equal((await request("/commercial-product-reviews/cc-003/packet", expiredReviewer)).status, 403);
    assert.equal((await request("/commercial-product-reviews/cc-003/decisions", expiredReviewer, orgA, {
      method: "POST",
      body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", decision_reason: "TEST_ONLY expired", reviewed_at: new Date().toISOString() }),
    })).status, 403);

    await assert.rejects(pilot.dryRun({
      reviewer_actor_id: orgBReviewer,
      reviewer_org_id: orgA,
      candidate_id: "cc-004",
      commercial_product_id: candidateIdentities.get("cc-004"),
      gate_type: "LEGAL",
      effective_at: new Date(Date.now() - 60_000).toISOString(),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      assignment_authority_reference: "test-only://4h/operator-authorization",
      reason: "TEST_ONLY wrong org",
    }, operatorActor), (error: any) => error?.code === "REAL_REVIEW_MEMBERSHIP_REQUIRED");

    const audit = await pool.query("SELECT audit_event_id,actor_user_id,organization_id,target_object_type,action_type FROM audit_events WHERE organization_id=$1 AND target_object_type IN ('commercial_product_reviewer_assignment','commercial_product_review_decision')", [orgA]);
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === operator && row.action_type.endsWith("reviewer_assignment_created")));
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === operator && row.action_type.endsWith("reviewer_assignment_revoked")));
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === legal && row.action_type.endsWith("review_decision_recorded")));
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_review_decisions WHERE reviewer_actor_id=$1", [legal])).rows[0].count), 1);
    const latestStatus = await inspectMigrations(pool, migrations);
    assert.deepEqual(latestStatus.pending, []);
    assert.deepEqual(latestStatus.drift, []);
    assert.deepEqual(latestStatus.unknownApplied, []);
  } finally {
    server.close();
    await pool.end();
  }
});
