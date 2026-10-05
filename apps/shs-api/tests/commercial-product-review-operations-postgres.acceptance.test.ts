import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import pkg from "pg";
import { GOVERNANCE_CAPABILITIES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";
import { buildReviewPackets } from "../src/domain/commercial-product-registry/review/review-packet-generator.ts";

const { Pool } = pkg;
const databaseUrl = process.env.SHS_TEST_DATABASE_URL;
const root = path.resolve(import.meta.dirname, "../../..");

test("4D authenticated review operations persist immutable history and canonical audit on disposable PostgreSQL", {
  skip: databaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable 4D PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = databaseUrl;
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { registerCommercialProductReviewRoutes } = await import("../src/domain/commercial-product-registry/review/review-operations-routes.ts");
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

  const suffix = `${process.pid}_${Date.now()}`;
  const organizationId = `org_cpr_4d_${suffix}`;
  const userId = `user_cpr_4d_${suffix}`;
  const review = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8"));
  const onboarding = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8"));
  const packets = buildReviewPackets(review, onboarding, "2026-10-05T12:00:00.000Z");
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    const permissions = req.header("x-test-permission");
    if (permissions) req.user = { user_id: userId, active_organization_id: organizationId, organization_id: organizationId, tenant_id: `tenant:${organizationId}`, permissions: permissions.split(",") };
    next();
  });
  registerCommercialProductReviewRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const pool = new Pool({ connectionString: databaseUrl });
  const request = (route: string, permission?: string, init: any = {}) => fetch(`${base}${route}`, { ...init, headers: { "content-type": "application/json", ...(permission ? { "x-test-permission": permission } : {}), ...(init.headers || {}) } });

  try {
    await pool.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,'4D Test Org','4D Test Org','SHS','active')", [organizationId]);
    await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,'4D Test Reviewer','active','test')", [userId, organizationId, `${userId}@example.test`]);
    assert.equal((await request("/commercial-product-reviews")).status, 401);
    assert.equal((await request("/commercial-product-reviews", "sales.admin")).status, 403);
    const initial = await request("/commercial-product-reviews?page_size=100", "commercial_product.read");
    assert.equal(initial.status, 200);
    assert.equal((await initial.json() as any).data.total, 32);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS n FROM commercial_products")).rows[0].n), 0);

    const decisionBase = "/commercial-product-reviews/cc-001/decisions";
    const pending = await request(decisionBase, "commercial_product.review_legal", { method: "POST", body: JSON.stringify({ gateType: "LEGAL", decisionStatus: "PENDING", decisionReason: "Awaiting counsel.", reviewedAt: "2026-10-05T12:00:00.000Z" }) });
    assert.equal(pending.status, 201, JSON.stringify(await pending.clone().json()));
    const pendingRow = (await pending.json() as any).data;
    assert.equal(pendingRow.reviewer_actor_id, userId);
    assert.equal(pendingRow.reviewer_org_id, organizationId);
    const badApproval = await request(decisionBase, "commercial_product.review_legal", { method: "POST", body: JSON.stringify({ gateType: "LEGAL", decisionStatus: "APPROVED", reviewedAt: "2026-10-05T12:00:00.000Z", supersedesDecisionId: pendingRow.review_decision_id, expectedVersion: 1 }) });
    assert.equal(badApproval.status, 400);
    const approval = await request(decisionBase, "commercial_product.review_legal", { method: "POST", body: JSON.stringify({ gateType: "LEGAL", decisionStatus: "APPROVED", decisionReason: "Test-only acceptance decision.", authorityType: "LEGAL_COUNSEL", authorityReference: "test-only://authority/legal/review-1", evidenceReferences: ["test-only://evidence/legal/review-1"], reviewedAt: "2026-10-05T12:00:00.000Z", supersedesDecisionId: pendingRow.review_decision_id, expectedVersion: 1 }) });
    assert.equal(approval.status, 201);
    const approvalRow = (await approval.json() as any).data;
    const decisionHistory = await request(`${decisionBase}?gate_type=LEGAL`, "commercial_product.read");
    assert.equal((await decisionHistory.json() as any).data.total, 2);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS n FROM commercial_product_review_decisions WHERE candidate_id='cc-001' AND gate_type='LEGAL'")).rows[0].n), 2);
    await assert.rejects(pool.query("UPDATE commercial_product_review_decisions SET decision_reason='changed' WHERE review_decision_id=$1", [pendingRow.review_decision_id]), /append-only/);

    const sourceBase = "/commercial-product-reviews/cc-005/source-resolutions";
    const invalidSource = await request(sourceBase, "commercial_product.review_source_authority", { method: "POST", body: JSON.stringify({ resolutionStatus: "RESOLVED", resolvedAt: "2026-10-05T12:00:00.000Z" }) });
    assert.equal(invalidSource.status, 400);
    const unresolvedResponse = await request(sourceBase, "commercial_product.review_source_authority", { method: "POST", body: JSON.stringify({ resolutionStatus: "UNRESOLVED", resolutionReason: "Awaiting authority.", remainingRequirements: ["credible source"], resolvedAt: "2026-10-05T12:00:00.000Z" }) });
    assert.equal(unresolvedResponse.status, 201);
    const unresolved = (await unresolvedResponse.json() as any).data;
    const resolvedResponse = await request(sourceBase, "commercial_product.review_source_authority", { method: "POST", body: JSON.stringify({ resolutionStatus: "RESOLVED", authorityDomain: "CURRICULUM", authorityReference: "test-only://authority/curriculum/source-1", evidenceReference: "test-only://evidence/curriculum/source-1", resolvedAt: "2026-10-05T12:00:00.000Z", supersedesResolutionId: unresolved.source_resolution_id, expectedVersion: 1 }) });
    assert.equal(resolvedResponse.status, 201);
    const sourceHistory = await request(sourceBase, "commercial_product.read");
    assert.equal((await sourceHistory.json() as any).data.total, 2);
    const reassessment = await request("/commercial-product-reviews/cc-005/reassessment", "commercial_product.read");
    assert.equal((await reassessment.json() as any).data.source_status, "SOURCE_RESOLVED");
    const audit = await pool.query("SELECT actor_user_id, organization_id FROM audit_events WHERE organization_id=$1 AND action_type LIKE 'commercial_product_registry.review_%'", [organizationId]);
    assert.ok(audit.rows.length >= 3);
    assert.ok(audit.rows.every((row: any) => row.actor_user_id === userId && row.organization_id === organizationId));
    assert.equal(Number((await pool.query("SELECT count(*)::int AS n FROM commercial_product_source_resolutions WHERE candidate_id='cc-005'")).rows[0].n), 2);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS n FROM commercial_products")).rows[0].n), 0);
    assert.equal(packets.find((packet) => packet.candidate_id === "cc-001")?.current_readiness, "YELLOW");
    assert.equal(packets.find((packet) => packet.candidate_id === "cc-001")?.current_sellability, "PILOT");
    assert.equal(GOVERNANCE_CAPABILITIES.includes("commercial_product.review_legal"), true);
    assert.equal(approvalRow.reviewer_actor_id, userId);
    assert.equal((await discoverMigrations(path.join(root, "apps/shs-api/migrations"))).length, migrations.length);
    const statusClient = await pool.connect();
    try {
      const status = await inspectMigrations(statusClient, migrations);
      assert.deepEqual(status.pending, []);
      assert.deepEqual(status.drift, []);
      assert.deepEqual(status.unknownApplied, []);
    }
    finally { statusClient.release(); }
  } finally {
    server.close();
    await once(server, "close");
    await pool.end();
  }
});
