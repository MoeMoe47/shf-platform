import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import path from "node:path";
import express from "express";
import test from "node:test";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.SHS_TEST_DATABASE_URL;
const root = path.resolve(import.meta.dirname, "../../..");

test("4F candidate-scoped, expiring reviewer authorization uses canonical Identity and audit on disposable PostgreSQL", {
  skip: databaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable 4F PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.SHS_AUTH_ENV = "test";
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { ProductionIdentityRepo } = await import("../src/domain/identity/repo/production-identity-repo.ts");
  const { applyActiveOrganizationContext } = await import("../src/auth/organization-context.ts");
  const { registerCommercialProductReviewRoutes } = await import("../src/domain/commercial-product-registry/review/review-operations-routes.ts");
  const { registerCommercialProductReviewerAssignmentRoutes } = await import("../src/domain/commercial-product-registry/review/reviewer-assignment-routes.ts");
  const { buildReviewPackets } = await import("../src/domain/commercial-product-registry/review/review-packet-generator.ts");
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
  const orgA = `org_cpr_4f_a_${suffix}`;
  const orgB = `org_cpr_4f_b_${suffix}`;
  const manager = `user_cpr_4f_manager_${suffix}`;
  const legal = `user_cpr_4f_legal_${suffix}`;
  const noAssignment = `user_cpr_4f_unassigned_${suffix}`;
  const salesAdmin = `user_cpr_4f_sales_admin_${suffix}`;
  const sourceReviewer = `user_cpr_4f_source_${suffix}`;
  const [reviewManifest, onboardingManifest] = await Promise.all([
    readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8").then(JSON.parse),
  ]);
  const reviewPackets = buildReviewPackets(reviewManifest, onboardingManifest, reviewManifest.reviewed_at);
  const candidates = new Map(reviewPackets.map((packet: any) => [packet.candidate_id, packet.commercial_product_id]));
  const identityRepo = new ProductionIdentityRepo();
  const app = express();
  app.use(express.json());
  app.use(async (req: any, _res: any, next: any) => {
    try {
      const actorId = req.header("x-test-actor");
      const orgId = req.header("x-test-org");
      if (!actorId || !orgId) return next();
      const identity = await identityRepo.getActiveIdentity(actorId);
      if (identity) req.user = applyActiveOrganizationContext(identity, orgId);
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
  const request = (route: string, actorId?: string, orgId = orgA, init: any = {}) => fetch(`${base}${route}`, {
    ...init,
    headers: { "content-type": "application/json", ...(actorId ? { "x-test-actor": actorId, "x-test-org": orgId } : {}), ...(init.headers || {}) },
  });
  const roleId = (name: string) => `role_${name}_${suffix}`;
  const membershipId = (userId: string, orgId: string) => `membership_${userId}_${orgId}`;
  const insertIdentity = async (userId: string, orgId: string, roleName: string, permissions: string[]) => {
    const rid = roleId(`${roleName}_${orgId}`);
    await pool.query(
      "INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','test') ON CONFLICT (user_id) DO NOTHING",
      [userId, orgId, `${userId}@example.test`, `TEST_ONLY ${roleName}`],
    );
    await pool.query("INSERT INTO roles (role_id, organization_id, role_name, role_scope_type) VALUES ($1,$2,$3,'organization')", [rid, orgId, `test_only_${roleName}_${suffix}`]);
    for (const [index, permission] of permissions.entries()) await pool.query("INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ($1,$2,$3)", [`rp_${rid}_${index}`, rid, permission]);
    await pool.query("INSERT INTO memberships (membership_id,user_id,organization_id,role_id,status,effective_from) VALUES ($1,$2,$3,$4,'active',NOW()-interval '1 day')", [membershipId(userId, orgId), userId, orgId, rid]);
  };
  const managerCaps = ["commercial_product.read", "commercial_product.review_assignment.manage", "commercial_product.review.read_all"];
  const legalCaps = ["commercial_product.read", "commercial_product.review_legal"];

  try {
    await pool.query("INSERT INTO organizations (organization_id,legal_name,display_name,org_type,status) VALUES ($1,'TEST_ONLY 4F A','TEST_ONLY 4F A','SHS','active'),($2,'TEST_ONLY 4F B','TEST_ONLY 4F B','SHS','active')", [orgA, orgB]);
    await insertIdentity(manager, orgA, "assignment_manager", managerCaps);
    await insertIdentity(legal, orgA, "legal_reviewer", legalCaps);
    await insertIdentity(legal, orgB, "legal_reviewer_org_b", legalCaps);
    await insertIdentity(noAssignment, orgA, "legal_no_assignment", legalCaps);
    await insertIdentity(salesAdmin, orgA, "sales_admin", ["commercial_product.read", "commercial_product.edit", "sales.admin"]);
    await insertIdentity(sourceReviewer, orgA, "source_reviewer", ["commercial_product.read", "commercial_product.review_source_authority"]);

    assert.equal((await request("/commercial-product-reviews")).status, 401);
    const provision = async (reviewer: string, candidate: string, gates: string[], effectiveAt: string, expiresAt: string, org = orgA) => request("/commercial-product-reviewer-assignments", manager, org, {
      method: "POST", body: JSON.stringify({ reviewer_actor_id: reviewer, reviewer_org_id: org, candidate_id: candidate, commercial_product_id: candidates.get(candidate), allowed_gate_types: gates, effective_at: effectiveAt, expires_at: expiresAt, assignment_authority_reference: "test-only://authority/provisioning/4f", reason: "TEST_ONLY disposable least-privilege fixture" }),
    });
    const now = Date.now();
    const future = new Date(now + 60_000).toISOString();
    const expires = new Date(now + 3_600_000).toISOString();
    const legalAssignmentResponse = await provision(legal, "cc-001", ["LEGAL"], new Date(now - 60_000).toISOString(), expires);
    assert.equal(legalAssignmentResponse.status, 201, JSON.stringify(await legalAssignmentResponse.clone().json()));
    const legalAssignment: any = (await legalAssignmentResponse.json() as any).data;
    assert.equal(legalAssignment.assigned_by_actor_id, manager);
    assert.equal((await provision(legal, "cc-001", ["REGULATORY"], new Date(now - 60_000).toISOString(), expires)).status, 409);
    assert.equal((await request("/commercial-product-reviewer-assignments", salesAdmin, orgA, { method: "POST", body: "{}" })).status, 403);
    assert.equal((await provision(manager, "cc-001", ["LEGAL"], new Date(now - 60_000).toISOString(), expires)).status, 403);

    const queue = await request("/commercial-product-reviews", legal);
    assert.equal(queue.status, 200);
    const queueItems: any[] = (await queue.json() as any).data.items;
    assert.deepEqual(queueItems.map((item) => item.candidate_id), ["cc-001"]);
    const packet = await request("/commercial-product-reviews/cc-001/packet", legal);
    assert.equal(packet.status, 200);
    assert.ok((await packet.json() as any).data.packet.current_review_gates.every((gate: any) => gate.gate_type === "LEGAL"));
    assert.equal((await request("/commercial-product-reviews/cc-002/packet", legal)).status, 403);

    const decision = (candidate: string, gate: string, actorId = legal, org = orgA) => request(`/commercial-product-reviews/${candidate}/decisions`, actorId, org, {
      method: "POST", body: JSON.stringify({ gate_type: gate, decision_status: "PENDING", decision_reason: "TEST_ONLY awaiting human authority", reviewed_at: new Date().toISOString() }),
    });
    assert.equal((await decision("cc-002", "LEGAL")).status, 403);
    assert.equal((await decision("cc-001", "REGULATORY")).status, 403);
    assert.equal((await decision("cc-001", "LEGAL", noAssignment)).status, 403);
    assert.equal((await decision("cc-001", "LEGAL", salesAdmin)).status, 403);
    assert.equal((await decision("cc-001", "LEGAL", legal, orgB)).status, 403);
    const accepted = await decision("cc-001", "LEGAL");
    assert.equal(accepted.status, 201, JSON.stringify(await accepted.clone().json()));
    const acceptedRow: any = (await accepted.json() as any).data;
    assert.equal(acceptedRow.reviewer_actor_id, legal);
    assert.equal(acceptedRow.reviewer_org_id, orgA);
    assert.equal(acceptedRow.review_assignment_id, legalAssignment.assignment_id);

    const sourceProvision = await provision(sourceReviewer, "cc-005", ["SOURCE_AUTHORITY"], new Date(now - 60_000).toISOString(), expires);
    assert.equal(sourceProvision.status, 201);
    const sourceBody = { resolution_status: "UNRESOLVED", resolution_reason: "TEST_ONLY no credible source supplied", remaining_requirements: ["credible external authority reference"], resolved_at: new Date().toISOString() };
    assert.equal((await request("/commercial-product-reviews/cc-006/source-resolutions", sourceReviewer, orgA, { method: "POST", body: JSON.stringify(sourceBody) })).status, 403);
    const sourceResult = await request("/commercial-product-reviews/cc-005/source-resolutions", sourceReviewer, orgA, { method: "POST", body: JSON.stringify(sourceBody) });
    assert.equal(sourceResult.status, 201, JSON.stringify(await sourceResult.clone().json()));
    const sourceRow: any = (await sourceResult.json() as any).data;
    assert.equal(sourceRow.resolved_by_actor, sourceReviewer);
    assert.equal(sourceRow.resolved_by_org, orgA);
    assert.ok(sourceRow.review_assignment_id);
    assert.equal((await request("/commercial-product-reviews/cc-005/decisions", sourceReviewer, orgA, { method: "POST", body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", reviewed_at: new Date().toISOString() }) })).status, 403);

    const futureActor = `user_cpr_4f_future_${suffix}`;
    const expiredActor = `user_cpr_4f_expired_${suffix}`;
    const revokedActor = `user_cpr_4f_revoked_${suffix}`;
    await insertIdentity(futureActor, orgA, "future_reviewer", legalCaps);
    await insertIdentity(expiredActor, orgA, "expired_reviewer", legalCaps);
    await insertIdentity(revokedActor, orgA, "revoked_reviewer", legalCaps);
    const futureAssignment = await provision(futureActor, "cc-002", ["LEGAL"], future, expires);
    assert.equal(futureAssignment.status, 201);
    assert.equal((await decision("cc-002", "LEGAL", futureActor)).status, 403);
    const expiredAssignment = await provision(expiredActor, "cc-003", ["LEGAL"], new Date(now - 3_600_000).toISOString(), new Date(now - 60_000).toISOString());
    assert.notEqual(expiredAssignment.status, 201, "expired assignments cannot be newly provisioned");
    const expiring = await provision(expiredActor, "cc-003", ["LEGAL"], new Date(now - 60_000).toISOString(), new Date(now + 120_000).toISOString());
    assert.equal(expiring.status, 201);
    const expiringId = (await expiring.json() as any).data.assignment_id;
    await pool.query("UPDATE commercial_product_reviewer_assignments SET expires_at=NOW()-interval '1 second' WHERE assignment_id=$1", [expiringId]);
    assert.equal((await decision("cc-003", "LEGAL", expiredActor)).status, 403);
    const revoked = await provision(revokedActor, "cc-004", ["LEGAL"], new Date(now - 60_000).toISOString(), expires);
    assert.equal(revoked.status, 201);
    const revokedId = (await revoked.json() as any).data.assignment_id;
    const revokeResponse = await request(`/commercial-product-reviewer-assignments/${revokedId}/revoke`, manager, orgA, { method: "POST", body: JSON.stringify({ reason: "TEST_ONLY revoke fixture" }) });
    assert.equal(revokeResponse.status, 200);
    assert.equal((await decision("cc-004", "LEGAL", revokedActor)).status, 403);
    const history = await request(`/commercial-product-reviewer-assignments/${revokedId}`, manager);
    assert.equal(history.status, 200);
    assert.equal((await history.json() as any).data.assignment.assignment_status, "REVOKED");

    const revokedMembershipActor = `user_cpr_4f_membership_revoked_${suffix}`;
    await insertIdentity(revokedMembershipActor, orgA, "membership_revoked_reviewer", legalCaps);
    const membershipAssignment = await provision(revokedMembershipActor, "cc-007", ["LEGAL"], new Date(now - 60_000).toISOString(), expires);
    assert.equal(membershipAssignment.status, 201);
    await pool.query("UPDATE memberships SET status='revoked',updated_at=NOW() WHERE user_id=$1 AND organization_id=$2", [revokedMembershipActor, orgA]);
    assert.equal((await decision("cc-007", "LEGAL", revokedMembershipActor)).status, 401);

    const audit = await pool.query("SELECT actor_user_id,organization_id,action_type,new_state_json FROM audit_events WHERE organization_id=$1 AND target_object_type IN ('commercial_product_reviewer_assignment','commercial_product_review_decision','commercial_product_source_resolution')", [orgA]);
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === manager && row.action_type.endsWith("reviewer_assignment_created")));
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === manager && row.action_type.endsWith("reviewer_assignment_revoked")));
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === legal && row.action_type.endsWith("review_decision_recorded")));
    assert.ok(audit.rows.some((row: any) => row.actor_user_id === sourceReviewer && row.action_type.endsWith("source_resolution_recorded")));
    assert.ok(audit.rows.every((row: any) => row.organization_id === orgA));
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_review_decisions WHERE reviewer_actor_id=$1", [legal])).rows[0].count), 1);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_source_resolutions WHERE resolved_by_actor=$1", [sourceReviewer])).rows[0].count), 1);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_reviewer_assignments WHERE assignment_status='REVOKED'")).rows[0].count), 1);
    const latestStatus = await inspectMigrations(pool, migrations);
    assert.deepEqual(latestStatus.pending, []);
    assert.deepEqual(latestStatus.drift, []);
    assert.deepEqual(latestStatus.unknownApplied, []);
  } finally {
    server.close();
    await pool.end();
  }
});
