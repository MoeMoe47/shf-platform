import { query } from "../../../db/client.js";
import { OrganizationRelationshipConflictError } from "../model/organization-relationship.js";

function isActiveOverlapConflict(error: any) {
  return error?.code === "23P01" &&
    error?.constraint === "organization_relationship_no_active_overlap";
}

function mapRelationshipPersistenceError(error: any) {
  if (isActiveOverlapConflict(error)) {
    throw new OrganizationRelationshipConflictError();
  }
  throw error;
}

export class OrganizationRelationshipRepo {
  async listRelationshipsForOrganization(organizationId: string) {
    const res = await query(
      `SELECT relationship_id, source_organization_id, target_organization_id, relationship_type,
              status, effective_from, effective_to, created_by, created_at, updated_by, updated_at,
              metadata_version
       FROM organization_relationships
       WHERE source_organization_id = $1 OR target_organization_id = $1
       ORDER BY updated_at DESC`,
      [organizationId],
    );
    return res.rows;
  }

  async getRelationshipById(relationshipId: string, scope: any) {
    const res = await query(
      `SELECT relationship_id, source_organization_id, target_organization_id, relationship_type,
              status, effective_from, effective_to, created_by, created_at, updated_by, updated_at,
              metadata_version
       FROM organization_relationships
       WHERE relationship_id = $1
         AND ($3::boolean OR source_organization_id = $2 OR target_organization_id = $2)
       LIMIT 1`,
      [relationshipId, scope.organization_id, Boolean(scope.platform_global)],
    );
    return res.rows[0] || null;
  }

  async createRelationship(input: any, executor: any = { query }) {
    try {
      const res = await executor.query(
        `INSERT INTO organization_relationships (
          relationship_id, source_organization_id, target_organization_id, relationship_type,
          status, effective_from, effective_to, created_by, updated_by, metadata_version
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING relationship_id, source_organization_id, target_organization_id, relationship_type,
                  status, effective_from, effective_to, created_by, created_at, updated_by, updated_at,
                  metadata_version`,
        [
          input.relationship_id,
          input.source_organization_id,
          input.target_organization_id,
          input.relationship_type,
          input.status,
          input.effective_from,
          input.effective_to || null,
          input.created_by,
          input.updated_by,
          input.metadata_version,
        ],
      );
      return res.rows[0];
    } catch (error) {
      mapRelationshipPersistenceError(error);
    }
  }

  async updateRelationshipStatus(relationshipId: string, nextStatus: string, expectedStatus: string, actorId: string, scope: any) {
    try {
      const res = await query(
        `UPDATE organization_relationships
         SET status = $2, updated_by = $5, updated_at = NOW(), metadata_version = metadata_version + 1
         WHERE relationship_id = $1
           AND status = $3
           AND ($6::boolean OR source_organization_id = $4 OR target_organization_id = $4)
         RETURNING relationship_id, source_organization_id, target_organization_id, relationship_type,
                   status, effective_from, effective_to, created_by, created_at, updated_by, updated_at,
                   metadata_version`,
        [relationshipId, nextStatus, expectedStatus, scope.organization_id, actorId, Boolean(scope.platform_global)],
      );
      return res.rows[0] || null;
    } catch (error) {
      mapRelationshipPersistenceError(error);
    }
  }

  async findActiveRelationship(sourceOrganizationId: string, targetOrganizationId: string, relationshipType: string, now = new Date()) {
    const res = await query(
      `SELECT relationship_id, source_organization_id, target_organization_id, relationship_type,
              status, effective_from, effective_to, created_by, created_at, updated_by, updated_at,
              metadata_version
       FROM organization_relationships
       WHERE source_organization_id = $1
         AND target_organization_id = $2
         AND relationship_type = $3
         AND status = 'ACTIVE'
         AND effective_from <= $4
         AND (effective_to IS NULL OR effective_to >= $4)
       ORDER BY effective_from DESC
       LIMIT 1`,
      [sourceOrganizationId, targetOrganizationId, relationshipType, now],
    );
    return res.rows[0] || null;
  }
}
