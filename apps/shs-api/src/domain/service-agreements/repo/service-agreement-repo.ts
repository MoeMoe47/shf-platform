import { query } from "../../../db/client.js";

const AGREEMENT_SELECT = `
  SELECT a.*, s.service_key, s.name AS service_name, s.provider_organization_id AS canonical_provider_organization_id,
         s.requires_relationship_type, s.agreement_requirement
  FROM service_agreements a
  JOIN service_catalog s ON s.service_id = a.service_id
`;

export class ServiceAgreementRepo {
  async listVisible(actorOrganizationId: string, platform = false, executor: any = { query }) {
    const res = await executor.query(
      `${AGREEMENT_SELECT}
       WHERE $2::boolean
          OR a.provider_organization_id = $1
          OR a.consumer_organization_id = $1
       ORDER BY a.updated_at DESC, a.created_at DESC`,
      [actorOrganizationId, platform],
    );
    return res.rows;
  }

  async getById(agreementId: string, executor: any = { query }) {
    const res = await executor.query(
      `${AGREEMENT_SELECT}
       WHERE a.agreement_id = $1
       LIMIT 1`,
      [agreementId],
    );
    return res.rows[0] || null;
  }

  async getLatestAgreementForService(input: { providerOrganizationId: string; consumerOrganizationId: string; serviceId: string; now: Date }, executor: any = { query }) {
    const res = await executor.query(
      `${AGREEMENT_SELECT}
       WHERE a.provider_organization_id = $1
         AND a.consumer_organization_id = $2
         AND a.service_id = $3
         AND a.status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED', 'EXPIRED', 'APPROVED', 'DRAFT')
         AND a.effective_from <= $4
         AND (a.effective_until IS NULL OR a.effective_until >= $4 OR a.status IN ('SUSPENDED', 'TERMINATED'))
       ORDER BY CASE a.status
                  WHEN 'ACTIVE' THEN 0
                  WHEN 'SUSPENDED' THEN 1
                  WHEN 'TERMINATED' THEN 2
                  WHEN 'EXPIRED' THEN 3
                  WHEN 'APPROVED' THEN 4
                  ELSE 5
                END,
                a.updated_at DESC
       LIMIT 1`,
      [input.providerOrganizationId, input.consumerOrganizationId, input.serviceId, input.now],
    );
    return res.rows[0] || null;
  }

  async findActiveConflict(input: { providerOrganizationId: string; consumerOrganizationId: string; serviceId: string; excludeAgreementId?: string }, executor: any = { query }) {
    const res = await executor.query(
      `SELECT agreement_id
       FROM service_agreements
       WHERE provider_organization_id = $1
         AND consumer_organization_id = $2
         AND service_id = $3
         AND status = 'ACTIVE'
         AND ($4::text IS NULL OR agreement_id <> $4)
       LIMIT 1`,
      [input.providerOrganizationId, input.consumerOrganizationId, input.serviceId, input.excludeAgreementId || null],
    );
    return res.rows[0] || null;
  }

  async createAgreement(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO service_agreements (
         agreement_id, provider_organization_id, consumer_organization_id, service_id,
         source_relationship_id, source_entitlement_id, status, effective_from, effective_until,
         service_scope, support_level, service_expectations, agreement_reference, created_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',$7,$8,$9,$10,$11::jsonb,$12,$13)
       RETURNING *`,
      [
        input.agreement_id,
        input.provider_organization_id,
        input.consumer_organization_id,
        input.service_id,
        input.source_relationship_id || null,
        input.source_entitlement_id || null,
        input.effective_from,
        input.effective_until || null,
        input.service_scope || "",
        input.support_level || "",
        JSON.stringify(input.service_expectations || {}),
        input.agreement_reference || null,
        input.created_by_user_id,
      ],
    );
    return res.rows[0];
  }

  async createVersion(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO service_agreement_versions (
         agreement_version_id, agreement_id, version_number, service_scope,
         support_level, service_expectations, agreement_reference, change_reason, created_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)
       RETURNING *`,
      [
        input.agreement_version_id,
        input.agreement_id,
        input.version_number,
        input.service_scope || "",
        input.support_level || "",
        JSON.stringify(input.service_expectations || {}),
        input.agreement_reference || null,
        input.change_reason || null,
        input.created_by_user_id || null,
      ],
    );
    return res.rows[0];
  }

  async listVersions(agreementId: string, executor: any = { query }) {
    const res = await executor.query(
      `SELECT *
       FROM service_agreement_versions
       WHERE agreement_id = $1
       ORDER BY version_number ASC`,
      [agreementId],
    );
    return res.rows;
  }

  async approveAgreement(agreementId: string, actorId: string, executor: any) {
    const res = await executor.query(
      `UPDATE service_agreements
       SET status = 'APPROVED',
           approved_by_user_id = $2,
           approved_at = NOW(),
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE agreement_id = $1
         AND status IN ('DRAFT', 'APPROVED')
       RETURNING *`,
      [agreementId, actorId],
    );
    return res.rows[0] || null;
  }

  async activateAgreement(agreementId: string, actorId: string, sourceEntitlementId: string, sourceRelationshipId: string | null, executor: any) {
    const res = await executor.query(
      `UPDATE service_agreements
       SET status = 'ACTIVE',
           source_entitlement_id = $3,
           source_relationship_id = COALESCE($4, source_relationship_id),
           activated_by_user_id = $2,
           activated_at = NOW(),
           suspended_by_user_id = NULL,
           suspended_at = NULL,
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE agreement_id = $1
         AND status IN ('APPROVED', 'SUSPENDED', 'ACTIVE')
       RETURNING *`,
      [agreementId, actorId, sourceEntitlementId, sourceRelationshipId],
    );
    return res.rows[0] || null;
  }

  async suspendAgreement(agreementId: string, actorId: string, executor: any) {
    const res = await executor.query(
      `UPDATE service_agreements
       SET status = 'SUSPENDED',
           suspended_by_user_id = $2,
           suspended_at = NOW(),
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE agreement_id = $1
         AND status = 'ACTIVE'
       RETURNING *`,
      [agreementId, actorId],
    );
    return res.rows[0] || null;
  }

  async terminateAgreement(agreementId: string, actorId: string, reason: string | null, executor: any) {
    const res = await executor.query(
      `UPDATE service_agreements
       SET status = 'TERMINATED',
           terminated_by_user_id = $2,
           terminated_at = NOW(),
           termination_reason = COALESCE($3, termination_reason),
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE agreement_id = $1
         AND status IN ('DRAFT', 'APPROVED', 'ACTIVE', 'SUSPENDED')
       RETURNING *`,
      [agreementId, actorId, reason],
    );
    return res.rows[0] || null;
  }

  async amendAgreement(agreementId: string, input: any, actorId: string, executor: any) {
    const res = await executor.query(
      `UPDATE service_agreements
       SET status = 'DRAFT',
           service_scope = $2,
           support_level = $3,
           service_expectations = $4::jsonb,
           agreement_reference = $5,
           current_version = current_version + 1,
           approved_by_user_id = NULL,
           approved_at = NULL,
           activated_by_user_id = NULL,
           activated_at = NULL,
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE agreement_id = $1
         AND status <> 'TERMINATED'
       RETURNING *`,
      [
        agreementId,
        input.service_scope || "",
        input.support_level || "",
        JSON.stringify(input.service_expectations || {}),
        input.agreement_reference || null,
      ],
    );
    return res.rows[0] || null;
  }
}
