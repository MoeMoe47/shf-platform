import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import test from "node:test";
import pkg from "pg";
import { GOVERNANCE_CAPABILITIES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";
import { CommercialProductReviewService } from "../src/domain/commercial-product-registry/review/commercial-product-review-service.ts";
import { buildReviewPackets } from "../src/domain/commercial-product-registry/review/review-packet-generator.ts";

const { Pool } = pkg;
const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;
const root = path.resolve(import.meta.dirname, "../../..");

test("4C review decisions and source resolutions persist immutably with canonical audit on disposable PostgreSQL", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable 4C PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const migrationsDir = path.join(root, "apps/shs-api/migrations");
  const pool = new Pool({ connectionString: testDatabaseUrl });
  const migrationPool = new Pool({ connectionString: testDatabaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    const migrations = await discoverMigrations(migrationsDir);
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
  const organizationId = `org_cpr_4c_${suffix}`;
  const userId = `user_cpr_4c_${suffix}`;
  const review = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-review/commercial-product-review-manifest.json"), "utf8"));
  const onboarding = JSON.parse(await readFile(path.join(root, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json"), "utf8"));
  const packets = buildReviewPackets(review, onboarding, "2026-10-05T12:00:00.000Z");
  assert.equal(packets.length, 32);
  const identities = new Map(packets.map((packet) => [packet.candidate_id, packet.commercial_product_id]));
  const packetById = new Map(packets.map((packet) => [packet.candidate_id, packet]));
  const client = await pool.connect();
  const executor = { query: client.query.bind(client) };
  const transaction = async (fn: any) => {
    await client.query("BEGIN");
    try { const result = await fn(executor); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
  };
  const service = new CommercialProductReviewService(identities, packetById, undefined, undefined, transaction);
  const actor = { user_id: userId, active_organization_id: organizationId, capabilities: [...GOVERNANCE_CAPABILITIES] };
  try {
    await client.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,'4C Test Org','4C Test Org','SHS','active')", [organizationId]);
    await client.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,'4C Test Reviewer','active','test')", [userId, organizationId, `${userId}@example.test`]);
    assert.equal(Number((await client.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);
    assert.equal(Number((await client.query("SELECT count(*)::int AS count FROM commercial_product_review_decisions")).rows[0].count), 0);
    assert.ok(packets.every((packet) => !packet.current_review_gates.some((gate: any) => gate.current_status === "APPROVED")));

    const candidate = "cc-001";
    const productId = identities.get(candidate)!;
    const pending = await service.recordDecision({ candidateId: candidate, commercialProductId: productId, gateType: "LEGAL", decisionStatus: "PENDING", decisionReason: "Awaiting qualified counsel.", reviewedAt: "2026-10-05T12:00:00.000Z" }, actor);
    await assert.rejects(service.recordDecision({ candidateId: candidate, commercialProductId: productId, gateType: "LEGAL", decisionStatus: "APPROVED", reviewedAt: "2026-10-05T12:00:00.000Z" }, actor), (error: any) => error.code === "REVIEW_APPROVAL_AUTHORITY_REQUIRED");
    await assert.rejects(service.recordDecision({ candidateId: candidate, commercialProductId: productId, gateType: "LEGAL", decisionStatus: "BLOCKED", reviewedAt: "2026-10-05T12:00:00.000Z" }, actor), (error: any) => error.code === "REVIEW_DECISION_REASON_REQUIRED");
    const approved = await service.recordDecision({ candidateId: candidate, commercialProductId: productId, gateType: "LEGAL", decisionStatus: "APPROVED", decisionReason: "Test-only qualified review fixture.", authorityType: "LEGAL_COUNSEL", authorityReference: "test-only://authority/legal/acceptance-1", evidenceReferences: ["test-only://evidence/legal/acceptance-1"], reviewedAt: "2026-10-05T12:00:00.000Z", supersedesDecisionId: pending.review_decision_id }, actor);
    assert.equal(approved.version, 2);
    assert.equal(approved.supersedes_decision_id, pending.review_decision_id);
    assert.equal((await service.listDecisionHistory(candidate, actor, "LEGAL")).length, 2);
    const decisionProjection = await service.reassess(candidate, actor);
    assert.equal(decisionProjection.production_onboarding_eligibility, false);
    assert.ok(!decisionProjection.remaining_required_gates.includes("LEGAL"));
    await assert.rejects(client.query("UPDATE commercial_product_review_decisions SET decision_reason='mutated' WHERE review_decision_id=$1", [pending.review_decision_id]), /append-only/);

    await assert.rejects(service.recordSourceResolution({ candidateId: "cc-005", commercialProductId: identities.get("cc-005"), resolutionStatus: "RESOLVED", resolvedAt: "2026-10-05T12:00:00.000Z" }, actor), (error: any) => error.code === "SOURCE_RESOLUTION_AUTHORITY_REQUIRED");
    const unresolved = await service.recordSourceResolution({ candidateId: "cc-005", commercialProductId: identities.get("cc-005"), resolutionStatus: "UNRESOLVED", resolutionReason: "Awaiting canonical curriculum record.", remainingRequirements: ["canonical curriculum record"], resolvedAt: "2026-10-05T12:00:00.000Z" }, actor);
    const resolved = await service.recordSourceResolution({ candidateId: "cc-005", commercialProductId: identities.get("cc-005"), resolutionStatus: "RESOLVED", authorityDomain: "CURRICULUM", authorityReference: "test-only://authority/curriculum/acceptance-1", authorityVersion: "test-only-v1", evidenceReference: "test-only://evidence/curriculum/acceptance-1", resolutionReason: "Test-only authority fixture.", resolvedAt: "2026-10-05T12:00:00.000Z", supersedesResolutionId: unresolved.source_resolution_id }, actor);
    assert.equal(resolved.version, 2);
    assert.equal((await service.listSourceResolutionHistory("cc-005", actor)).length, 2);
    assert.equal((await service.reassess("cc-005", actor)).source_status, "SOURCE_RESOLVED");
    await assert.rejects(client.query("DELETE FROM commercial_product_source_resolutions WHERE source_resolution_id=$1", [unresolved.source_resolution_id]), /append-only/);

    const auditCount = Number((await client.query("SELECT count(*)::int AS count FROM audit_events WHERE organization_id=$1 AND action_type LIKE 'commercial_product_registry.review_%' OR organization_id=$1 AND action_type LIKE 'commercial_product_registry.source_resolution_%'", [organizationId])).rows[0].count);
    assert.ok(auditCount >= 6);
    assert.equal(Number((await client.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);
    assert.equal(packets.find((packet) => packet.candidate_id === candidate)?.current_readiness, "YELLOW");
    assert.equal(packets.find((packet) => packet.candidate_id === candidate)?.current_sellability, "PILOT");
    const latestMigrations = await discoverMigrations(migrationsDir);
    const finalStatus = await inspectMigrations(executor, latestMigrations);
    assert.deepEqual(finalStatus.pending, []);
    assert.deepEqual(finalStatus.drift, []);
    assert.deepEqual(finalStatus.unknownApplied, []);
  } finally {
    client.release();
    await pool.end();
  }
});
