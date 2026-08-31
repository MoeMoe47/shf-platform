import { query } from "../../../db/client.js";
import { Opportunity } from "../model/opportunity.js";

function dateOnly(value: any): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function rowToOpportunity(row: any): Opportunity {
  return {
    id: row.opportunity_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description,
    opportunityType: row.opportunity_type,
    status: row.status,
    opensAt: dateOnly(row.opens_at),
    applicationDeadline: dateOnly(row.application_deadline) as string,
    startsAt: dateOnly(row.starts_at),
    endsAt: dateOnly(row.ends_at),
    deliveryMode: row.delivery_mode,
    location: row.location,
    sourceOrganizationId: row.source_organization_id,
    actionUrl: row.action_url,
    actionRoute: row.action_route,
    audienceScope: row.audience_scope,
    programId: row.program_id,
    cohortId: row.cohort_id,
    careerId: row.career_id,
    careerFamilyId: row.career_family_id,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    version: Number(row.version),
  };
}

const COLUMNS = `
  opportunity_id, organization_id, tenant_id, title, description, opportunity_type, status,
  opens_at, application_deadline, starts_at, ends_at, delivery_mode, location,
  source_organization_id, action_url, action_route, audience_scope, program_id, cohort_id,
  career_id, career_family_id, created_by_user_id, created_at, updated_at, version
`;

export class OpportunityRepo {
  async create(input: Omit<Opportunity, "createdAt" | "updatedAt" | "version">): Promise<Opportunity> {
    const res = await query(
      `INSERT INTO opportunities (
        opportunity_id, organization_id, tenant_id, title, description, opportunity_type, status,
        opens_at, application_deadline, starts_at, ends_at, delivery_mode, location,
        source_organization_id, action_url, action_route, audience_scope, program_id, cohort_id,
        career_id, career_family_id, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING ${COLUMNS}`,
      [
        input.id, input.organizationId, input.tenantId, input.title, input.description,
        input.opportunityType, input.status, input.opensAt, input.applicationDeadline,
        input.startsAt, input.endsAt, input.deliveryMode, input.location,
        input.sourceOrganizationId, input.actionUrl, input.actionRoute, input.audienceScope,
        input.programId, input.cohortId, input.careerId, input.careerFamilyId, input.createdByUserId,
      ],
    );
    return rowToOpportunity(res.rows[0]);
  }

  async getById(id: string): Promise<Opportunity | null> {
    const res = await query(`SELECT ${COLUMNS} FROM opportunities WHERE opportunity_id=$1`, [id]);
    return res.rows[0] ? rowToOpportunity(res.rows[0]) : null;
  }

  async listForOrganization(organizationId: string): Promise<Opportunity[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM opportunities WHERE organization_id=$1 ORDER BY application_deadline ASC`,
      [organizationId],
    );
    return res.rows.map(rowToOpportunity);
  }

  /** Student-tier list: OPEN opportunities matching institutional
   * eligibility. DRAFT/CLOSED/CANCELLED/ARCHIVED are never included. */
  async listVisibleForStudent(organizationId: string, userId: string): Promise<Opportunity[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM opportunities o
       WHERE o.organization_id = $1
         AND o.status = 'OPEN'
         AND (
           o.audience_scope = 'ORGANIZATION'
           OR EXISTS (
             SELECT 1 FROM enrollments en
             WHERE en.organization_id = o.organization_id
               AND en.learner_user_id = $2
               AND en.status = 'ACTIVE'
               AND (
                 (o.audience_scope = 'PROGRAM' AND en.program_id = o.program_id)
                 OR (o.audience_scope = 'COHORT' AND en.cohort_id = o.cohort_id)
               )
           )
         )
       ORDER BY o.application_deadline ASC`,
      [organizationId, userId],
    );
    return res.rows.map(rowToOpportunity);
  }

  async listVisibleForInstructor(organizationId: string, userId: string): Promise<Opportunity[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM opportunities o
       WHERE o.organization_id = $1
         AND (
           o.created_by_user_id = $2
           OR (o.audience_scope = 'ORGANIZATION' AND o.status != 'DRAFT')
           OR EXISTS (
             SELECT 1 FROM cohort_staff cs
             WHERE cs.organization_id = o.organization_id
               AND cs.cohort_id = o.cohort_id
               AND cs.user_id = $2
               AND cs.status = 'ACTIVE'
           )
         )
       ORDER BY o.application_deadline ASC`,
      [organizationId, userId],
    );
    return res.rows.map(rowToOpportunity);
  }

  async updateStatus(id: string, status: string): Promise<Opportunity | null> {
    const res = await query(
      `UPDATE opportunities SET status=$2, updated_at=NOW(), version=version+1
       WHERE opportunity_id=$1 RETURNING ${COLUMNS}`,
      [id, status],
    );
    return res.rows[0] ? rowToOpportunity(res.rows[0]) : null;
  }
}
