import { query } from "../../../db/client.js";
import { CareerEvent } from "../model/career-event.js";

function rowToCareerEvent(row: any): CareerEvent {
  return {
    id: row.career_event_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    status: row.status,
    startsAt: row.starts_at instanceof Date ? row.starts_at.toISOString() : row.starts_at,
    endsAt: row.ends_at instanceof Date ? row.ends_at.toISOString() : row.ends_at,
    timezone: row.timezone,
    deliveryMode: row.delivery_mode,
    location: row.location,
    hostOrganizationId: row.host_organization_id,
    capacity: row.capacity,
    registrationRequired: row.registration_required,
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
  career_event_id, organization_id, tenant_id, title, description, event_type, status,
  starts_at, ends_at, timezone, delivery_mode, location, host_organization_id, capacity,
  registration_required, audience_scope, program_id, cohort_id, career_id, career_family_id,
  created_by_user_id, created_at, updated_at, version
`;

export class CareerEventRepo {
  async create(input: Omit<CareerEvent, "createdAt" | "updatedAt" | "version">): Promise<CareerEvent> {
    const res = await query(
      `INSERT INTO career_events (
        career_event_id, organization_id, tenant_id, title, description, event_type, status,
        starts_at, ends_at, timezone, delivery_mode, location, host_organization_id, capacity,
        registration_required, audience_scope, program_id, cohort_id, career_id, career_family_id,
        created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING ${COLUMNS}`,
      [
        input.id, input.organizationId, input.tenantId, input.title, input.description,
        input.eventType, input.status, input.startsAt, input.endsAt, input.timezone,
        input.deliveryMode, input.location, input.hostOrganizationId, input.capacity,
        input.registrationRequired, input.audienceScope, input.programId, input.cohortId,
        input.careerId, input.careerFamilyId, input.createdByUserId,
      ],
    );
    return rowToCareerEvent(res.rows[0]);
  }

  async getById(id: string): Promise<CareerEvent | null> {
    const res = await query(`SELECT ${COLUMNS} FROM career_events WHERE career_event_id=$1`, [id]);
    return res.rows[0] ? rowToCareerEvent(res.rows[0]) : null;
  }

  /** Admin-tier list: full organization visibility, no eligibility filter. */
  async listForOrganization(organizationId: string): Promise<CareerEvent[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM career_events WHERE organization_id=$1 ORDER BY starts_at ASC`,
      [organizationId],
    );
    return res.rows.map(rowToCareerEvent);
  }

  /** Student-tier list: PUBLISHED/COMPLETED events matching institutional
   * eligibility (ORGANIZATION scope, or an ACTIVE enrollment in the
   * targeted PROGRAM/COHORT). DRAFT is never included. */
  async listVisibleForStudent(organizationId: string, userId: string): Promise<CareerEvent[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM career_events e
       WHERE e.organization_id = $1
         AND e.status IN ('PUBLISHED', 'COMPLETED')
         AND (e.status = 'COMPLETED' OR e.ends_at >= NOW())
         AND (
           e.audience_scope = 'ORGANIZATION'
           OR EXISTS (
             SELECT 1 FROM enrollments en
             WHERE en.organization_id = e.organization_id
               AND en.learner_user_id = $2
               AND en.status = 'ACTIVE'
               AND (
                 (e.audience_scope = 'PROGRAM' AND en.program_id = e.program_id)
                 OR (e.audience_scope = 'COHORT' AND en.cohort_id = e.cohort_id)
               )
           )
         )
       ORDER BY e.starts_at ASC`,
      [organizationId, userId],
    );
    return res.rows.map(rowToCareerEvent);
  }

  /** Instructor-tier list: events they created, ORGANIZATION-scope
   * (non-draft), and COHORT-scope events for cohorts they actively staff. */
  async listVisibleForInstructor(organizationId: string, userId: string): Promise<CareerEvent[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM career_events e
       WHERE e.organization_id = $1
         AND (
           e.created_by_user_id = $2
           OR (e.audience_scope = 'ORGANIZATION' AND e.status != 'DRAFT')
           OR EXISTS (
             SELECT 1 FROM cohort_staff cs
             WHERE cs.organization_id = e.organization_id
               AND cs.cohort_id = e.cohort_id
               AND cs.user_id = $2
               AND cs.status = 'ACTIVE'
           )
         )
       ORDER BY e.starts_at ASC`,
      [organizationId, userId],
    );
    return res.rows.map(rowToCareerEvent);
  }

  async updateStatus(id: string, status: string): Promise<CareerEvent | null> {
    const res = await query(
      `UPDATE career_events SET status=$2, updated_at=NOW(), version=version+1
       WHERE career_event_id=$1 RETURNING ${COLUMNS}`,
      [id, status],
    );
    return res.rows[0] ? rowToCareerEvent(res.rows[0]) : null;
  }
}
