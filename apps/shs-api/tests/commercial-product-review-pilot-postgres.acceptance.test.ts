import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import pkg from "pg";

const { Pool } = pkg;
const databaseUrl = process.env.SHS_TEST_DATABASE_URL;
const root = path.resolve(import.meta.dirname, "../../..");

test("4E reviewer pilot uses canonical memberships and gate-specific role permissions on disposable PostgreSQL", {
  skip: databaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable 4E PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.SHS_AUTH_ENV = "test";
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { ProductionIdentityRepo } = await import("../src/domain/identity/repo/production-identity-repo.ts");
  const { MembershipService } = await import("../src/domain/identity/service/membership-service.ts");
  const { applyActiveOrganizationContext } = await import("../src/auth/organization-context.ts");
  const { registerCommercialProductReviewRoutes } = await import("../src/domain/commercial-product-registry/review/review-operations-routes.ts");
  const migrations = await discoverMigrations(path.join(root, "apps/shs-api/migrations"));
  const migrationPool = new Pool({ connectionString: databaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    await runMigrations(migrationClient, migrations);
    const migrationStatus = await inspectMigrations(migrationClient, migrations);
    assert.deepEqual(migrationStatus.pending, []);
    assert.deepEqual(migrationStatus.drift, []);
    assert.deepEqual(migrationStatus.unknownApplied, []);
  } finally {
    migrationClient.release();
    await migrationPool.end();
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const suffix = `${process.pid}_${Date.now()}`;
  const orgId = `org_cpr_4e_${suffix}`;
  const operatorId = `user_cpr_4e_operator_${suffix}`;
  const plan = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-review-pilot/reviewer-provisioning-plan.json"), "utf8"));
  const operatorProcedure = await readFile(path.join(root, "docs/sales/commercial-product-registry-review-pilot/04_OPERATOR_PROCEDURE.md"), "utf8");
  const profiles = new Map(plan.profiles.map((profile: any) => [profile.profile_id, profile]));
  const reviewerIds = new Map<string, string>();
  const memberships = new Map<string, string>();
  const app = express();
  app.use(express.json());
  const identityRepo = new ProductionIdentityRepo();
  app.use(async (req: any, _res: any, next: any) => {
    try {
      const actorId = req.header("x-test-actor");
      if (!actorId) return next();
      const identity = await identityRepo.getActiveIdentity(actorId);
      if (identity) req.user = applyActiveOrganizationContext(identity, orgId);
      return next();
    } catch (error) { return next(error); }
  });
  registerCommercialProductReviewRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const request = (route: string, actor?: string, init: any = {}) => fetch(`${base}${route}`, { ...init, headers: { "content-type": "application/json", ...(actor ? { "x-test-actor": actor } : {}), ...(init.headers || {}) } });
  const membershipService = new MembershipService();
  const operator = {
    user_id: operatorId, active_organization_id: orgId, organization_id: orgId, tenant_id: `tenant:${orgId}`,
    roles: ["super_admin"], role_scope_type: "platform", permissions: ["identity.membership.assign", "identity.membership.revoke"],
  };
  const assignments: Array<{ user_id: string; role_id: string; profile_id: string }> = [];

  try {
    await pool.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,'4E TEST ONLY','4E TEST ONLY','SHS','active')", [orgId]);
    await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,'4E TEST ONLY Operator','active','test')", [operatorId, orgId, `${operatorId}@example.test`]);

    for (const profile of plan.profiles) {
      const userId = `user_cpr_4e_${profile.profile_id.toLowerCase()}_${suffix}`;
      const roleId = `role_cpr_4e_${profile.profile_id.toLowerCase()}_${suffix}`;
      const email = `${userId}@example.test`;
      reviewerIds.set(profile.profile_id, userId);
      await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','test')", [userId, orgId, email, `TEST_ONLY ${profile.profile_name}`]);
      await pool.query("INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, description) VALUES ($1,$2,$3,'organization',$4)", [roleId, orgId, `test_only_${profile.profile_id.toLowerCase()}_${suffix}`, `TEST_ONLY operational profile ${profile.profile_id}`]);
      for (const permission of profile.capabilities) {
        await pool.query("INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ($1,$2,$3)", [`rp_${roleId}_${permission.replace(/[^a-z0-9]/gi, "_")}`, roleId, permission]);
      }
      const assignment = await membershipService.assign({ user_id: userId, role_id: roleId, organization_id: orgId, reason: "TEST_ONLY 4E disposable pilot profile" }, operator);
      memberships.set(profile.profile_id, assignment.membership.membership_id);
      assignments.push({ user_id: userId, role_id: roleId, profile_id: profile.profile_id });
    }

    for (const [profileId, profile] of profiles as Map<string, any>) {
      const userId = reviewerIds.get(profileId)!;
      const resolved = await identityRepo.getActiveIdentity(userId);
      assert.ok(resolved, `${profileId} has active canonical test membership`);
      const context = applyActiveOrganizationContext(resolved, orgId);
      assert.deepEqual([...context.permissions].sort(), [...profile.capabilities].sort(), `${profileId} has only its planned capabilities`);
      assert.equal(context.active_organization_id, orgId);
    }

    const legalId = reviewerIds.get("LEGAL_REVIEWER")!;
    const regulatoryId = reviewerIds.get("REGULATORY_REVIEWER")!;
    const pricingId = reviewerIds.get("PRICING_REVIEWER")!;
    const marginId = reviewerIds.get("MARGIN_REVIEWER")!;
    const evidenceId = reviewerIds.get("EVIDENCE_REVIEWER")!;
    const sourceId = reviewerIds.get("SOURCE_AUTHORITY_REVIEWER")!;
    assert.equal((await request("/commercial-product-reviews/cc-005/packet")).status, 401);
    const packetRead = await request("/commercial-product-reviews/cc-005/packet", legalId);
    assert.equal(packetRead.status, 200);
    const legalPending = await request("/commercial-product-reviews/cc-005/decisions", legalId, { method: "POST", body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", decision_reason: "TEST_ONLY awaiting authorized human evidence", reviewed_at: "2026-10-05T12:00:00.000Z" }) });
    assert.equal(legalPending.status, 201, JSON.stringify(await legalPending.clone().json()));
    assert.equal((await request("/commercial-product-reviews/cc-005/decisions", legalId, { method: "POST", body: JSON.stringify({ gate_type: "REGULATORY", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 403);
    assert.equal((await request("/commercial-product-reviews/cc-011/decisions", regulatoryId, { method: "POST", body: JSON.stringify({ gate_type: "REGULATORY", decision_status: "BLOCKED", decision_reason: "TEST_ONLY external authority evidence absent", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 201);
    assert.equal((await request("/commercial-product-reviews/cc-019/decisions", pricingId, { method: "POST", body: JSON.stringify({ gate_type: "PRICING", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 201);
    assert.equal((await request("/commercial-product-reviews/cc-019/decisions", pricingId, { method: "POST", body: JSON.stringify({ gate_type: "MARGIN", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 403);
    assert.equal((await request("/commercial-product-reviews/cc-019/decisions", marginId, { method: "POST", body: JSON.stringify({ gate_type: "MARGIN", decision_status: "STALE", decision_reason: "TEST_ONLY stale evidence marker", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 201);
    assert.equal((await request("/commercial-product-reviews/cc-025/decisions", evidenceId, { method: "POST", body: JSON.stringify({ gate_type: "EVIDENCE", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 201);
    assert.equal((await request("/commercial-product-reviews/cc-005/decisions", sourceId, { method: "POST", body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 403);

    const resolvedBody = { resolution_status: "RESOLVED", authority_domain: "CURRICULUM", authority_reference: "test-only://authority/curriculum/cc-005", evidence_reference: "test-only://evidence/curriculum/cc-005", resolved_at: "2026-10-05T12:00:00.000Z" };
    assert.equal((await request("/commercial-product-reviews/cc-005/source-resolutions", sourceId, { method: "POST", body: JSON.stringify({ ...resolvedBody, authority_reference: undefined }) })).status, 400);
    const sourceResolved = await request("/commercial-product-reviews/cc-005/source-resolutions", sourceId, { method: "POST", body: JSON.stringify(resolvedBody) });
    assert.equal(sourceResolved.status, 201, JSON.stringify(await sourceResolved.clone().json()));
    const sourceRow: any = (await sourceResolved.json() as any).data;
    assert.equal(sourceRow.resolved_by_actor, sourceId);
    assert.equal(sourceRow.resolved_by_org, orgId);

    const reassessmentResponse = await request("/commercial-product-reviews/cc-005/reassessment", legalId);
    assert.equal(reassessmentResponse.status, 200);
    const reassessment: any = (await reassessmentResponse.json() as any).data;
    assert.equal(reassessment.source_status, "SOURCE_RESOLVED");
    assert.equal(reassessment.production_onboarding_eligibility, false);
    assert.ok(reassessment.remaining_required_gates.length > 0);
    const blockedAssessment = await request("/commercial-product-reviews/cc-011/reassessment", regulatoryId);
    assert.ok((await blockedAssessment.json() as any).data.blocking_gates.includes("REGULATORY"));
    const staleAssessment = await request("/commercial-product-reviews/cc-019/reassessment", marginId);
    assert.ok((await staleAssessment.json() as any).data.stale_gates.includes("MARGIN"));
    const detail = (await packetRead.json() as any).data.packet;
    assert.equal(detail.current_readiness, "UNKNOWN");
    assert.equal(detail.current_sellability, "DEVELOP");

    const untrustedRoleId = `role_cpr_4e_sales_editor_${suffix}`;
    const untrustedUserId = `user_cpr_4e_sales_editor_${suffix}`;
    await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,'TEST_ONLY Sales editor','active','test')", [untrustedUserId, orgId, `${untrustedUserId}@example.test`]);
    await pool.query("INSERT INTO roles (role_id, organization_id, role_name, role_scope_type) VALUES ($1,$2,'test_only_sales_editor','organization')", [untrustedRoleId, orgId]);
    await pool.query("INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ($1,$2,'commercial_product.read'),($3,$2,'commercial_product.edit'),($4,$2,'sales.admin')", [`rp_${untrustedRoleId}_read`, untrustedRoleId, `rp_${untrustedRoleId}_edit`, `rp_${untrustedRoleId}_sales_admin`]);
    const untrustedAssignment = await membershipService.assign({ user_id: untrustedUserId, role_id: untrustedRoleId, organization_id: orgId, reason: "TEST_ONLY boundary fixture" }, operator);
    const untrustedMembershipId = untrustedAssignment.membership.membership_id;
    assert.equal((await request("/commercial-product-reviews/cc-005/decisions", untrustedUserId, { method: "POST", body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 403);
    assert.equal((await request("/commercial-product-reviews/cc-005/decisions", legalId, { method: "POST", body: JSON.stringify({ gate_type: "LEGAL", decision_status: "PENDING", reviewer_actor_id: "spoof", reviewed_at: "2026-10-05T12:00:00.000Z" }) })).status, 400);

    const sourceHistory = await request("/commercial-product-reviews/cc-005/source-resolutions", sourceId);
    assert.equal((await sourceHistory.json() as any).data.total, 1);
    const decisionHistory = await request("/commercial-product-reviews/cc-005/decisions?gate_type=LEGAL", legalId);
    assert.equal((await decisionHistory.json() as any).data.total, 1);
    const reviewEvents = await pool.query("SELECT actor_user_id, organization_id, action_type FROM audit_events WHERE organization_id=$1 AND action_type LIKE 'commercial_product_registry.%'", [orgId]);
    assert.ok(reviewEvents.rows.some((row: any) => row.actor_user_id === legalId && row.action_type.endsWith("review_decision_recorded")));
    assert.ok(reviewEvents.rows.some((row: any) => row.actor_user_id === sourceId && row.action_type.endsWith("source_resolution_recorded")));
    assert.ok(reviewEvents.rows.every((row: any) => row.organization_id === orgId));
    const provisioningEvents = await pool.query("SELECT actor_user_id, action_type FROM audit_events WHERE organization_id=$1 AND target_object_type='membership'", [orgId]);
    assert.ok(provisioningEvents.rows.filter((row: any) => row.action_type === "identity.membership.assigned").length >= 16);
    assert.ok(provisioningEvents.rows.every((row: any) => row.actor_user_id === operatorId));

    const service = new MembershipService();
    await service.revoke(untrustedMembershipId, { reason: "TEST_ONLY pilot revocation" }, operator);
    assert.equal(await identityRepo.getActiveIdentity(untrustedUserId), null);
    assert.equal((await request("/commercial-product-reviews/cc-005/packet", untrustedUserId)).status, 401);
    assert.equal(Number((await pool.query("SELECT COUNT(*)::int AS n FROM commercial_product_review_decisions WHERE reviewer_actor_id=$1", [untrustedUserId])).rows[0].n), 0);
    await service.revoke(memberships.get("LEGAL_REVIEWER")!, { reason: "TEST_ONLY pilot authority revoked" }, operator);
    assert.equal(await identityRepo.getActiveIdentity(legalId), null);
    assert.equal((await request("/commercial-product-reviews/cc-005/packet", legalId)).status, 401);
    assert.equal(Number((await pool.query("SELECT COUNT(*)::int AS n FROM commercial_product_review_decisions WHERE reviewer_actor_id=$1", [legalId])).rows[0].n), 1);
    assert.ok(assignments.length === 15);

    const expiryProfileId = "SOURCE_AUTHORITY_REVIEWER";
    const expiryMembershipId = memberships.get(expiryProfileId)!;
    await pool.query("UPDATE memberships SET effective_to=NOW() - interval '1 minute' WHERE membership_id=$1", [expiryMembershipId]);
    assert.equal(await identityRepo.getActiveIdentity(reviewerIds.get(expiryProfileId)!), null);
    assert.equal((await request("/commercial-product-reviews/cc-005/packet", reviewerIds.get(expiryProfileId)!)).status, 401);
    assert.match(operatorProcedure, /Candidate routing is not API-enforced in 4D/);
    assert.equal(Number((await pool.query("SELECT COUNT(*)::int AS n FROM commercial_products")).rows[0].n), 0);
    const finalStatusClient = await pool.connect();
    try {
      const migrationStatus = await inspectMigrations(finalStatusClient, migrations);
      assert.deepEqual(migrationStatus.pending, []);
      assert.deepEqual(migrationStatus.drift, []);
      assert.deepEqual(migrationStatus.unknownApplied, []);
    }
    finally { finalStatusClient.release(); }
  } finally {
    server.close();
    await once(server, "close");
    await pool.end();
  }
});
