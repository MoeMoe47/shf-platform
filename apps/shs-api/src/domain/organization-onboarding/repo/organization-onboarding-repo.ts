import { query } from "../../../db/client.js";

const EXECUTOR = { query };

function withServices(row: any, services: any[]) {
  return {
    ...row,
    services: services.map((service) => ({
      serviceId: service.service_id,
      serviceKey: service.service_key,
      serviceName: service.service_name,
      approved: service.approved,
      provisionedEntitlementId: service.provisioned_entitlement_id,
    })),
  };
}

export class OrganizationOnboardingRepo {
  async listCases(scope: any, executor: any = EXECUTOR) {
    const res = await executor.query(
      `SELECT c.*
       FROM organization_onboarding_cases c
       WHERE $2::boolean
          OR c.submitted_by_organization_id = $1
          OR c.existing_organization_id = $1
          OR c.activated_organization_id = $1
       ORDER BY c.submitted_at DESC`,
      [scope.organization_id, Boolean(scope.platform_global)],
    );
    return this.attachServices(res.rows, executor);
  }

  async getCase(caseId: string, scope: any, executor: any = EXECUTOR) {
    const res = await executor.query(
      `SELECT c.*
       FROM organization_onboarding_cases c
       WHERE c.onboarding_case_id = $1
         AND ($3::boolean
           OR c.submitted_by_organization_id = $2
           OR c.existing_organization_id = $2
           OR c.activated_organization_id = $2)
       LIMIT 1`,
      [caseId, scope.organization_id, Boolean(scope.platform_global)],
    );
    const rows = await this.attachServices(res.rows, executor);
    return rows[0] || null;
  }

  async getCaseForUpdate(caseId: string, executor: any) {
    const res = await executor.query(
      `SELECT * FROM organization_onboarding_cases WHERE onboarding_case_id = $1 FOR UPDATE`,
      [caseId],
    );
    const rows = await this.attachServices(res.rows, executor);
    return rows[0] || null;
  }

  async createCase(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO organization_onboarding_cases (
         onboarding_case_id, status, existing_organization_id, organization_name,
         organization_type, website, primary_contact_name, primary_contact_email,
         primary_contact_phone, geography, mission_description, requested_relationship_type,
         submitted_by_user_id, submitted_by_organization_id
       ) VALUES ($1,'SUBMITTED',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        input.onboarding_case_id,
        input.existing_organization_id || null,
        input.organization_name,
        input.organization_type,
        input.website || null,
        input.primary_contact_name,
        input.primary_contact_email,
        input.primary_contact_phone || null,
        input.geography || null,
        input.mission_description || null,
        input.requested_relationship_type,
        input.submitted_by_user_id,
        input.submitted_by_organization_id,
      ],
    );
    return res.rows[0];
  }

  async insertRequestedServices(caseId: string, serviceIds: string[], executor: any) {
    for (const serviceId of serviceIds) {
      await executor.query(
        `INSERT INTO organization_onboarding_requested_services (onboarding_case_id, service_id)
         VALUES ($1,$2)
         ON CONFLICT (onboarding_case_id, service_id) DO NOTHING`,
        [caseId, serviceId],
      );
    }
  }

  async resolveServices(serviceKeys: string[], executor: any) {
    const res = await executor.query(
      `SELECT service_id, service_key, name AS service_name
       FROM service_catalog
       WHERE service_key = ANY($1::text[]) AND status = 'ACTIVE'`,
      [serviceKeys],
    );
    return res.rows;
  }

  async findOrganizationById(organizationId: string, executor: any) {
    const res = await executor.query(`SELECT * FROM organizations WHERE organization_id = $1 LIMIT 1`, [organizationId]);
    return res.rows[0] || null;
  }

  async findOrganizationByDomain(domain: string, executor: any) {
    const res = await executor.query(`SELECT * FROM organizations WHERE lower(primary_domain) = lower($1) LIMIT 1`, [domain]);
    return res.rows[0] || null;
  }

  async createOrganization(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
       VALUES ($1,$2,$3,$4,'active',$5)
       ON CONFLICT (organization_id) DO NOTHING
       RETURNING *`,
      [
        input.organization_id,
        input.legal_name,
        input.display_name,
        input.org_type,
        input.primary_domain || null,
      ],
    );
    if (res.rows[0]) return res.rows[0];
    return this.findOrganizationById(input.organization_id, executor);
  }

  async updateStatus(caseId: string, input: any, executor: any) {
    const res = await executor.query(
      `UPDATE organization_onboarding_cases
       SET status = $2,
           existing_organization_id = COALESCE($3, existing_organization_id),
           activated_organization_id = COALESCE($4, activated_organization_id),
           reviewed_by_user_id = COALESCE($5, reviewed_by_user_id),
           reviewed_at = CASE WHEN $5::text IS NULL THEN reviewed_at ELSE NOW() END,
           decision_reason = COALESCE($6, decision_reason),
           applicant_feedback = COALESCE($7, applicant_feedback),
           activation_relationship_id = COALESCE($8, activation_relationship_id),
           activated_by_user_id = COALESCE($9, activated_by_user_id),
           activated_at = CASE WHEN $9::text IS NULL THEN activated_at ELSE NOW() END,
           suspended_by_user_id = COALESCE($10, suspended_by_user_id),
           suspended_at = CASE WHEN $10::text IS NULL THEN suspended_at ELSE NOW() END,
           exited_by_user_id = COALESCE($11, exited_by_user_id),
           exited_at = CASE WHEN $11::text IS NULL THEN exited_at ELSE NOW() END,
           graduation_relationship_id = COALESCE($12, graduation_relationship_id),
           updated_at = NOW(),
           metadata_version = metadata_version + 1
       WHERE onboarding_case_id = $1
       RETURNING *`,
      [
        caseId,
        input.status,
        input.existing_organization_id || null,
        input.activated_organization_id || null,
        input.reviewed_by_user_id || null,
        input.decision_reason || null,
        input.applicant_feedback || null,
        input.activation_relationship_id || null,
        input.activated_by_user_id || null,
        input.suspended_by_user_id || null,
        input.exited_by_user_id || null,
        input.graduation_relationship_id || null,
      ],
    );
    const rows = await this.attachServices(res.rows, executor);
    return rows[0] || null;
  }

  async approveRequestedServices(caseId: string, serviceIds: string[], actorId: string, executor: any) {
    await executor.query(
      `UPDATE organization_onboarding_requested_services
       SET approved = false, approved_by_user_id = NULL, approved_at = NULL
       WHERE onboarding_case_id = $1`,
      [caseId],
    );
    if (!serviceIds.length) return;
    await executor.query(
      `UPDATE organization_onboarding_requested_services
       SET approved = true, approved_by_user_id = $3, approved_at = NOW()
       WHERE onboarding_case_id = $1 AND service_id = ANY($2::text[])`,
      [caseId, serviceIds, actorId],
    );
  }

  async markProvisioned(caseId: string, serviceId: string, entitlementId: string, executor: any = EXECUTOR) {
    await executor.query(
      `UPDATE organization_onboarding_requested_services
       SET provisioned_entitlement_id = $3
       WHERE onboarding_case_id = $1 AND service_id = $2`,
      [caseId, serviceId, entitlementId],
    );
  }

  async addDecision(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO organization_onboarding_decisions (
         onboarding_decision_id, onboarding_case_id, decision, actor_user_id,
         reason, internal_notes, applicant_feedback, previous_status, new_status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        input.onboarding_decision_id,
        input.onboarding_case_id,
        input.decision,
        input.actor_user_id,
        input.reason || null,
        input.internal_notes || null,
        input.applicant_feedback || null,
        input.previous_status || null,
        input.new_status,
      ],
    );
    return res.rows[0];
  }

  async listDecisions(caseId: string, executor: any = EXECUTOR) {
    const res = await executor.query(
      `SELECT * FROM organization_onboarding_decisions
       WHERE onboarding_case_id = $1
       ORDER BY decided_at DESC`,
      [caseId],
    );
    return res.rows;
  }

  async findActiveRelationship(sourceOrganizationId: string, targetOrganizationId: string, relationshipType: string, executor: any) {
    const res = await executor.query(
      `SELECT *
       FROM organization_relationships
       WHERE source_organization_id = $1
         AND target_organization_id = $2
         AND relationship_type = $3
         AND status = 'ACTIVE'
         AND effective_from <= NOW()
         AND (effective_to IS NULL OR effective_to >= NOW())
       ORDER BY effective_from DESC
       LIMIT 1`,
      [sourceOrganizationId, targetOrganizationId, relationshipType],
    );
    return res.rows[0] || null;
  }

  async attachServices(rows: any[], executor: any = EXECUTOR) {
    if (!rows.length) return rows;
    const ids = rows.map((row) => row.onboarding_case_id);
    const services = await executor.query(
      `SELECT rs.onboarding_case_id, s.service_id, s.service_key, s.name AS service_name,
              rs.approved, rs.provisioned_entitlement_id
       FROM organization_onboarding_requested_services rs
       JOIN service_catalog s ON s.service_id = rs.service_id
       WHERE rs.onboarding_case_id = ANY($1::text[])
       ORDER BY s.category, s.name`,
      [ids],
    );
    return rows.map((row) =>
      withServices(row, services.rows.filter((service) => service.onboarding_case_id === row.onboarding_case_id))
    );
  }
}
