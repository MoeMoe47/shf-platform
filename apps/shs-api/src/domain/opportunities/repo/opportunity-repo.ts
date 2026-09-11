import { query } from "../../../db/client.js";
import { Opportunity, PublicOpportunity } from "../model/opportunity.js";

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
    publicVisibility: row.public_visibility || "PRIVATE",
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
  career_id, career_family_id, created_by_user_id, public_visibility, created_at, updated_at, version
`;

export class OpportunityRepo {
  async create(input: Omit<Opportunity, "createdAt" | "updatedAt" | "version">): Promise<Opportunity> {
    const res = await query(
      `INSERT INTO opportunities (
        opportunity_id, organization_id, tenant_id, title, description, opportunity_type, status,
        opens_at, application_deadline, starts_at, ends_at, delivery_mode, location,
        source_organization_id, action_url, action_route, audience_scope, program_id, cohort_id,
        career_id, career_family_id, created_by_user_id, public_visibility
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING ${COLUMNS}`,
      [
        input.id, input.organizationId, input.tenantId, input.title, input.description,
        input.opportunityType, input.status, input.opensAt, input.applicationDeadline,
        input.startsAt, input.endsAt, input.deliveryMode, input.location,
        input.sourceOrganizationId, input.actionUrl, input.actionRoute, input.audienceScope,
        input.programId, input.cohortId, input.careerId, input.careerFamilyId, input.createdByUserId, "PRIVATE",
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
         AND (o.opens_at IS NULL OR o.opens_at <= NOW())
         AND o.application_deadline >= CURRENT_DATE
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

  async updatePublicVisibility(id: string, visibility: "PRIVATE" | "PUBLIC"): Promise<Opportunity | null> {
    const res = await query(
      `UPDATE opportunities SET public_visibility=$2, updated_at=NOW(), version=version+1
       WHERE opportunity_id=$1 RETURNING ${COLUMNS}`,
      [id, visibility],
    );
    return res.rows[0] ? rowToOpportunity(res.rows[0]) : null;
  }

  async listPublic(): Promise<PublicOpportunity[]> {
    const res = await query(`
      SELECT o.opportunity_id, o.title, o.description, o.opportunity_type,
             o.application_deadline, o.starts_at, o.ends_at, o.delivery_mode,
             o.location, o.action_url, o.action_route,
             org.organization_id AS public_organization_id,
             org.display_name AS public_organization_name, org.org_type AS public_organization_type,
             c.slug AS career_slug, c.title AS career_title, f.name AS career_family_name
      FROM opportunities o
      JOIN organizations org ON org.organization_id = o.organization_id AND org.status = 'active'
      LEFT JOIN careers c ON c.career_id = o.career_id AND c.status = 'active'
      LEFT JOIN career_families f ON f.career_family_id = c.career_family_id AND f.status = 'active'
      WHERE o.public_visibility = 'PUBLIC'
        AND o.status = 'OPEN'
        AND o.audience_scope = 'ORGANIZATION'
        AND o.program_id IS NULL AND o.cohort_id IS NULL
        AND (o.action_url IS NOT NULL OR o.action_route IS NOT NULL)
        AND o.application_deadline >= CURRENT_DATE
      ORDER BY o.application_deadline ASC, o.title ASC, o.opportunity_id ASC`);
    return res.rows.map((row) => ({
      id: row.opportunity_id, title: row.title, description: row.description,
      opportunityType: row.opportunity_type, applicationDeadline: dateOnly(row.application_deadline) as string,
      startsAt: dateOnly(row.starts_at), endsAt: dateOnly(row.ends_at), deliveryMode: row.delivery_mode,
      location: row.location, actionUrl: row.action_url, actionRoute: row.action_route,
      organization: { id: row.public_organization_id, name: row.public_organization_name, type: row.public_organization_type },
      career: row.career_slug ? { slug: row.career_slug, title: row.career_title, familyName: row.career_family_name } : null,
    }));
  }

  async getPublicById(id: string): Promise<PublicOpportunity | null> {
    const items = await this.listPublic();
    return items.find((item) => item.id === id) || null;
  }

  async listPublicEmployers() {
    const items = await this.listPublic();
    const byId = new Map<string, any>();
    for (const item of items) {
      const current = byId.get(item.organization.id) || { id: item.organization.id, name: item.organization.name, type: item.organization.type, opportunityCount: 0, opportunities: [] };
      current.opportunityCount += 1;
      current.opportunities.push(item);
      byId.set(item.organization.id, current);
    }
    return [...byId.values()];
  }

  async getPublicEmployer(id: string) {
    const employers = await this.listPublicEmployers();
    return employers.find((employer) => employer.id === id) || null;
  }
}
