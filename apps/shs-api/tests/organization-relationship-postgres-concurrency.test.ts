import assert from "node:assert/strict";
import test from "node:test";
import pkg from "pg";

import {
  ORGANIZATION_RELATIONSHIP_STATUSES,
  ORGANIZATION_RELATIONSHIP_TYPES,
} from "../src/domain/organization-relationships/model/organization-relationship";

const { Pool } = pkg;

const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("postgres relationship CAS distinguishes true stale update from sequential invalid transition", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable PostgreSQL concurrency verification",
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { OrganizationRelationshipRepo } = await import("../src/domain/organization-relationships/repo/organization-relationship-repo.ts");
  const { pool: appPool } = await import("../src/db/client.ts");
  const pool = new Pool({ connectionString: testDatabaseUrl });
  const repo = new OrganizationRelationshipRepo();
  const suffix = `${process.pid}_${Date.now()}`;
  const sourceOrg = `org-cas-source-${suffix}`;
  const targetOrg = `org-cas-target-${suffix}`;
  const actorId = `user-cas-${suffix}`;
  const relationshipId = `rel-cas-${suffix}`;
  const scope = { organization_id: sourceOrg, platform_global: false };

  try {
    await pool.query(
      `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
       VALUES ($1, 'CAS Source', 'CAS Source', 'SHF', 'active'),
              ($2, 'CAS Target', 'CAS Target', 'Partner', 'active')`,
      [sourceOrg, targetOrg],
    );
    await pool.query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, 'CAS Actor', 'active', 'test')`,
      [actorId, sourceOrg, `${actorId}@example.test`],
    );
    await pool.query(
      `INSERT INTO organization_relationships (
        relationship_id, source_organization_id, target_organization_id, relationship_type,
        status, effective_from, created_by, updated_by, metadata_version
      ) VALUES ($1, $2, $3, $4, 'PROPOSED', NOW() - INTERVAL '1 day', $5, $5, 1)`,
      [relationshipId, sourceOrg, targetOrg, ORGANIZATION_RELATIONSHIP_TYPES.NETWORK_MEMBER_OF, actorId],
    );

    const firstObserved = await repo.getRelationshipById(relationshipId, scope);
    const secondObserved = await repo.getRelationshipById(relationshipId, scope);
    assert.equal(firstObserved.status, ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED);
    assert.equal(secondObserved.status, ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED);

    const [firstUpdate, staleUpdate] = await Promise.all([
      repo.updateRelationshipStatus(relationshipId, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, firstObserved.status, actorId, scope),
      repo.updateRelationshipStatus(relationshipId, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, secondObserved.status, actorId, scope),
    ]);
    const updateResults = [firstUpdate, staleUpdate];
    assert.equal(updateResults.filter(Boolean).length, 1);
    assert.equal(updateResults.filter((item) => item === null).length, 1);

    const sequentialObserved = await repo.getRelationshipById(relationshipId, scope);
    assert.equal(sequentialObserved.status, ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE);
    assert.equal(sequentialObserved.metadata_version, 2);
  } finally {
    await pool.end();
    await appPool.end();
  }
});
