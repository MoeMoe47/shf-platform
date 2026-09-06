import { query } from "../../../db/client.js";

export class ServiceCatalogRepo {
  async listServices(includeInactive = false) {
    const res = await query(
      `SELECT service_id, service_key, name, description, category, status,
              provider_organization_id, audience, requires_relationship_type,
              agreement_requirement, created_at, updated_at
       FROM service_catalog
       WHERE ($1::boolean OR status = 'ACTIVE')
       ORDER BY category, name`,
      [includeInactive],
    );
    return res.rows;
  }

  async getServiceByKey(serviceKey: string, executor: any = { query }) {
    const res = await executor.query(
      `SELECT service_id, service_key, name, description, category, status,
              provider_organization_id, audience, requires_relationship_type,
              agreement_requirement, created_at, updated_at
       FROM service_catalog
       WHERE service_key = $1
       LIMIT 1`,
      [serviceKey],
    );
    return res.rows[0] || null;
  }

  async listEntitlementsForOrganization(organizationId: string) {
    const res = await query(
      `SELECT e.*, s.service_key, s.name AS service_name, s.provider_organization_id
       FROM organization_service_entitlements e
       JOIN service_catalog s ON s.service_id = e.service_id
       WHERE e.organization_id = $1
       ORDER BY s.category, s.name, e.updated_at DESC`,
      [organizationId],
    );
    return res.rows;
  }

  async findCurrentEntitlement(organizationId: string, serviceId: string, executor: any = { query }) {
    const res = await executor.query(
      `SELECT e.*, s.service_key, s.name AS service_name, s.provider_organization_id
       FROM organization_service_entitlements e
       JOIN service_catalog s ON s.service_id = e.service_id
       WHERE e.organization_id = $1
         AND e.service_id = $2
         AND e.status IN ('ACTIVE', 'SUSPENDED')
       ORDER BY CASE e.status WHEN 'ACTIVE' THEN 0 ELSE 1 END, e.updated_at DESC
       LIMIT 1`,
      [organizationId, serviceId],
    );
    return res.rows[0] || null;
  }

  async findActiveEntitlementByKey(organizationId: string, serviceKey: string, now: Date, executor: any = { query }) {
    const res = await executor.query(
      `SELECT e.*, s.service_key, s.name AS service_name, s.status AS service_status,
              s.provider_organization_id, s.requires_relationship_type, s.agreement_requirement
       FROM service_catalog s
       LEFT JOIN organization_service_entitlements e
         ON e.service_id = s.service_id
        AND e.organization_id = $1
        AND e.status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')
       WHERE s.service_key = $2
       ORDER BY e.updated_at DESC NULLS LAST
       LIMIT 1`,
      [organizationId, serviceKey],
    );
    return res.rows[0] || null;
  }

  async findActiveRelationship(sourceOrganizationId: string, targetOrganizationId: string, relationshipType: string, now: Date, executor: any = { query }) {
    const res = await executor.query(
      `SELECT relationship_id
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

  async createEntitlement(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO organization_service_entitlements (
         entitlement_id, organization_id, service_id, status, granted_by_user_id,
         effective_from, effective_until, reason, source_relationship_id
       ) VALUES ($1,$2,$3,'ACTIVE',$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        input.entitlement_id,
        input.organization_id,
        input.service_id,
        input.granted_by_user_id,
        input.effective_from,
        input.effective_until || null,
        input.reason || null,
        input.source_relationship_id || null,
      ],
    );
    return res.rows[0];
  }

  async updateEntitlementStatus(entitlementId: string, nextStatus: string, actorId: string, reason: string | null, executor: any) {
    const suspended = nextStatus === "SUSPENDED";
    const revoked = nextStatus === "REVOKED";
    const res = await executor.query(
      `UPDATE organization_service_entitlements
       SET status = $2,
           suspended_by_user_id = CASE WHEN $5::boolean THEN $3 ELSE suspended_by_user_id END,
           suspended_at = CASE WHEN $5::boolean THEN NOW() ELSE suspended_at END,
           revoked_by_user_id = CASE WHEN $6::boolean THEN $3 ELSE revoked_by_user_id END,
           revoked_at = CASE WHEN $6::boolean THEN NOW() ELSE revoked_at END,
           reason = COALESCE($4, reason),
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE entitlement_id = $1
       RETURNING *`,
      [entitlementId, nextStatus, actorId, reason, suspended, revoked],
    );
    return res.rows[0] || null;
  }
}
