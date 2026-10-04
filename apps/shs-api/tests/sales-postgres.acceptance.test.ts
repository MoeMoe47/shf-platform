import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import pkg from "pg";

const { Pool } = pkg;
const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

async function assertForeignKeyViolation(action: () => Promise<unknown>) {
  await assert.rejects(action, (error: any) => error?.code === "23503");
}

test("Sales service persists scoped records and rejects invalid account references on PostgreSQL", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable Sales PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { discoverMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { SalesRepo } = await import("../src/domain/sales/repo/sales-repo.ts");
  const { SalesService } = await import("../src/domain/sales/service/sales-service.ts");
  const { pool: appPool } = await import("../src/db/client.ts");

  const migrationPool = new Pool({ connectionString: testDatabaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    const migrationsDir = path.resolve(new URL("../migrations", import.meta.url).pathname);
    await runMigrations(migrationClient, await discoverMigrations(migrationsDir));
  } finally {
    migrationClient.release();
    await migrationPool.end();
  }

  const pool = new Pool({ connectionString: testDatabaseUrl });
  const suffix = `${process.pid}_${Date.now()}`;
  const salesOrg = `org_sales_pg_${suffix}`;
  const accountA = `org_account_pg_a_${suffix}`;
  const accountB = `org_account_pg_b_${suffix}`;
  const actorId = `user_sales_pg_${suffix}`;
  const actor = {
    user_id: actorId,
    active_organization_id: salesOrg,
    organization_id: salesOrg,
    tenant_id: `tenant:${salesOrg}`,
    permissions: ["sales.read", "sales.write", "organization.view"],
  };
  const service = new SalesService();
  const repo = new SalesRepo();

  try {
    await pool.query(
      `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
       VALUES ($1, 'Sales PG Org', 'Sales PG Org', 'SHS', 'active'),
              ($2, 'Account A', 'Account A', 'Partner', 'active'),
              ($3, 'Account B', 'Account B', 'Partner', 'active')`,
      [salesOrg, accountA, accountB],
    );
    await pool.query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, 'Sales PG Actor', 'active', 'test')`,
      [actorId, salesOrg, `${actorId}@example.test`],
    );
    assert.equal((await repo.organizationExists(accountA, { query: pool.query.bind(pool) })), true);

    const relationship = await service.createRelationship({ accountOrganizationId: accountA, relationshipStatus: "ACTIVE" }, actor);
    const discovery = await service.createDiscoveryRecord({ accountOrganizationId: accountA, relationshipId: relationship.relationship_id, discoveryStatus: "COMPLETE" }, actor);
    const need = await service.createNeed({ accountOrganizationId: accountA, discoveryRecordId: discovery.discovery_record_id, title: "PostgreSQL need" }, actor);
    const opportunity = await service.createOpportunity({
      accountOrganizationId: accountA,
      relationshipId: relationship.relationship_id,
      discoveryRecordId: discovery.discovery_record_id,
      primaryNeedIds: [need.need_id],
      name: "PostgreSQL opportunity",
    }, actor);

    assert.equal((await service.getOpportunity(opportunity.opportunity_id, actor))?.opportunity_id, opportunity.opportunity_id);
    assert.equal((await service.listOpportunities(actor)).length, 1);
    assert.deepEqual(
      (await pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM sales_relationships WHERE relationship_id=$1) AS relationships,
           (SELECT COUNT(*)::int FROM sales_discovery_records WHERE discovery_record_id=$2) AS discoveries,
           (SELECT COUNT(*)::int FROM sales_needs WHERE need_id=$3) AS needs,
           (SELECT COUNT(*)::int FROM sales_opportunities WHERE opportunity_id=$4) AS opportunities`,
        [relationship.relationship_id, discovery.discovery_record_id, need.need_id, opportunity.opportunity_id],
      )).rows[0],
      { relationships: 1, discoveries: 1, needs: 1, opportunities: 1 },
    );

    await assert.rejects(
      () => service.createRelationship({ accountOrganizationId: `org_missing_pg_${suffix}` }, actor),
      (error: any) => error.code === "ORGANIZATION_NOT_FOUND",
    );
    await assert.rejects(
      () => service.createOpportunity({ accountOrganizationId: accountB, relationshipId: relationship.relationship_id, name: "Bad link" }, actor),
      (error: any) => error.code === "CROSS_ACCOUNT_REFERENCE",
    );
    await assert.rejects(
      () => repo.updateOpportunity(opportunity.opportunity_id, { tenant_id: actor.tenant_id, organization_id: salesOrg }, { stage: "RELATIONSHIP", actor_id: actorId }, { query: pool.query.bind(pool) }),
      /DIRECT_STAGE_MUTATION_FORBIDDEN/,
    );

    const transitioned = await service.updateOpportunity(opportunity.opportunity_id, { stage: "RELATIONSHIP" }, actor);
    assert.equal(transitioned.stage, "RELATIONSHIP");
    assert.equal((await service.getOpportunity(opportunity.opportunity_id, { ...actor, tenant_id: `tenant:${accountB}`, active_organization_id: accountB })), null);
    await assert.rejects(
      () => service.updateOpportunity(opportunity.opportunity_id, { stage: "WON" }, actor),
      (error: any) => error.code === "INVALID_TRANSITION",
    );
    assert.equal((await service.getOpportunity(opportunity.opportunity_id, actor))?.stage, "RELATIONSHIP");

    const auditRows = await pool.query(
      `SELECT action_type, target_object_type
       FROM audit_events
       WHERE organization_id=$1 AND target_object_id = ANY($2::text[])
       ORDER BY event_timestamp ASC, created_at ASC`,
      [salesOrg, [relationship.relationship_id, discovery.discovery_record_id, need.need_id, opportunity.opportunity_id]],
    );
    assert.deepEqual(
      auditRows.rows.map((row: any) => row.action_type),
      [
        "sales.relationship.created",
        "sales.discovery.created",
        "sales.need.created",
        "sales.opportunity.created",
        "sales.opportunity.stage_changed",
      ],
    );

    const directRelationshipA = `sales_rel_direct_a_${suffix}`;
    const directRelationshipB = `sales_rel_direct_b_${suffix}`;
    const directDiscoveryA = `sales_disc_direct_a_${suffix}`;
    const directDiscoveryB = `sales_disc_direct_b_${suffix}`;
    const directNeedA = `sales_need_direct_a_${suffix}`;
    await pool.query(
      `INSERT INTO sales_relationships (
         relationship_id, organization_id, tenant_id, account_organization_id,
         relationship_type, relationship_status, created_by_user_id, updated_by_user_id
       ) VALUES
         ($1, $3, $4, $5, 'BUYER', 'ACTIVE', $7, $7),
         ($2, $3, $4, $6, 'BUYER', 'ACTIVE', $7, $7)`,
      [directRelationshipA, directRelationshipB, salesOrg, actor.tenant_id, accountA, accountB, actorId],
    );
    await pool.query(
      `INSERT INTO sales_discovery_records (
         discovery_record_id, organization_id, tenant_id, account_organization_id,
         relationship_id, discovery_status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'COMPLETE', $6, $6)`,
      [directDiscoveryA, salesOrg, actor.tenant_id, accountA, directRelationshipA, actorId],
    );
    await pool.query(
      `INSERT INTO sales_needs (
         need_id, organization_id, tenant_id, account_organization_id,
         discovery_record_id, need_type, title, priority, status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'BUSINESS', 'Direct valid need', 'MEDIUM', 'OPEN', $6, $6)`,
      [directNeedA, salesOrg, actor.tenant_id, accountA, directDiscoveryA, actorId],
    );
    await pool.query(
      `INSERT INTO sales_opportunities (
         opportunity_id, organization_id, tenant_id, account_organization_id,
         relationship_id, discovery_record_id, stage, status, name,
         primary_need_ids, employer_incentive_assessment_ids, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, 'TARGET', 'OPEN', 'Direct valid opportunity', $7::jsonb, '[]'::jsonb, $8, $8)`,
      [`sales_opp_direct_valid_${suffix}`, salesOrg, actor.tenant_id, accountA, directRelationshipA, directDiscoveryA, JSON.stringify([directNeedA]), actorId],
    );

    await assertForeignKeyViolation(() => pool.query(
      `INSERT INTO sales_discovery_records (
         discovery_record_id, organization_id, tenant_id, account_organization_id,
         relationship_id, discovery_status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', $6, $6)`,
      [`sales_disc_bad_rel_${suffix}`, salesOrg, actor.tenant_id, accountA, directRelationshipB, actorId],
    ));

    await pool.query(
      `INSERT INTO sales_discovery_records (
         discovery_record_id, organization_id, tenant_id, account_organization_id,
         relationship_id, discovery_status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'COMPLETE', $6, $6)`,
      [directDiscoveryB, salesOrg, actor.tenant_id, accountB, directRelationshipB, actorId],
    );
    await assertForeignKeyViolation(() => pool.query(
      `INSERT INTO sales_needs (
         need_id, organization_id, tenant_id, account_organization_id,
         discovery_record_id, need_type, title, priority, status, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'BUSINESS', 'Bad direct need', 'MEDIUM', 'OPEN', $6, $6)`,
      [`sales_need_bad_disc_${suffix}`, salesOrg, actor.tenant_id, accountA, directDiscoveryB, actorId],
    ));
    await assertForeignKeyViolation(() => pool.query(
      `INSERT INTO sales_opportunities (
         opportunity_id, organization_id, tenant_id, account_organization_id,
         relationship_id, stage, status, name, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'TARGET', 'OPEN', 'Bad direct relationship opportunity', $6, $6)`,
      [`sales_opp_bad_rel_${suffix}`, salesOrg, actor.tenant_id, accountA, directRelationshipB, actorId],
    ));
    await assertForeignKeyViolation(() => pool.query(
      `INSERT INTO sales_opportunities (
         opportunity_id, organization_id, tenant_id, account_organization_id,
         discovery_record_id, stage, status, name, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, 'TARGET', 'OPEN', 'Bad direct discovery opportunity', $6, $6)`,
      [`sales_opp_bad_disc_${suffix}`, salesOrg, actor.tenant_id, accountA, directDiscoveryB, actorId],
    ));

    const needLinkColumns = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name='sales_opportunities' AND column_name IN ('need_id', 'primary_need_ids')
       ORDER BY column_name`,
    );
    assert.deepEqual(needLinkColumns.rows, [{ column_name: "primary_need_ids", data_type: "jsonb" }]);

    const txClient = await pool.connect();
    const rollbackRelationshipId = `sales_rel_rollback_${suffix}`;
    try {
      await txClient.query("BEGIN");
      await txClient.query(
        `INSERT INTO sales_relationships (
           relationship_id, organization_id, tenant_id, account_organization_id,
           relationship_type, relationship_status, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $4, 'BUYER', 'ACTIVE', $5, $5)`,
        [rollbackRelationshipId, salesOrg, actor.tenant_id, accountA, actorId],
      );
      await assertForeignKeyViolation(() => txClient.query(
        `INSERT INTO sales_discovery_records (
           discovery_record_id, organization_id, tenant_id, account_organization_id,
           relationship_id, discovery_status, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', $6, $6)`,
        [`sales_disc_rollback_bad_${suffix}`, salesOrg, actor.tenant_id, accountA, directRelationshipB, actorId],
      ));
      await txClient.query("ROLLBACK");
    } finally {
      txClient.release();
    }
    assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM sales_relationships WHERE relationship_id=$1", [rollbackRelationshipId])).rows[0].count, 0);
  } finally {
    await pool.query("DELETE FROM audit_events WHERE organization_id=$1", [salesOrg]);
    await pool.query("DELETE FROM sales_opportunities WHERE organization_id=$1", [salesOrg]);
    await pool.query("DELETE FROM sales_needs WHERE organization_id=$1", [salesOrg]);
    await pool.query("DELETE FROM sales_discovery_records WHERE organization_id=$1", [salesOrg]);
    await pool.query("DELETE FROM sales_relationships WHERE organization_id=$1", [salesOrg]);
    await pool.query("DELETE FROM users WHERE user_id=$1", [actorId]);
    await pool.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[salesOrg, accountA, accountB]]);
    await pool.end();
    await appPool.end();
  }
});
