import { query } from "../../../db/client.js";
import type { Cohort, CohortStaff, Enrollment } from "../model/enrollment.js";

function iso(value: any): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function rowToCohort(row: any): Cohort {
  return {
    cohortId: row.cohort_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    programId: row.program_id,
    name: row.name,
    description: row.description,
    status: row.status,
    startsAt: iso(row.starts_at) as string,
    endsAt: iso(row.ends_at),
    createdByUserId: row.created_by_user_id,
    createdAt: iso(row.created_at) as string,
    updatedAt: iso(row.updated_at) as string,
    version: Number(row.version),
  };
}

function rowToEnrollment(row: any): Enrollment {
  return {
    enrollmentId: row.enrollment_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    learnerUserId: row.learner_user_id,
    programId: row.program_id,
    cohortId: row.cohort_id,
    status: row.status,
    enrolledAt: iso(row.enrolled_at) as string,
    startsAt: iso(row.starts_at) as string,
    endsAt: iso(row.ends_at),
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    createdAt: iso(row.created_at) as string,
    updatedAt: iso(row.updated_at) as string,
    version: Number(row.version),
  };
}

function rowToStaff(row: any): CohortStaff {
  return {
    cohortStaffId: row.cohort_staff_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    cohortId: row.cohort_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: iso(row.created_at) as string,
    updatedAt: iso(row.updated_at) as string,
  };
}

const COHORT_COLUMNS = "cohort_id, organization_id, tenant_id, program_id, name, description, status, starts_at, ends_at, created_by_user_id, created_at, updated_at, version";
const ENROLLMENT_COLUMNS = "enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, enrolled_at, starts_at, ends_at, created_by_user_id, updated_by_user_id, created_at, updated_at, version";
const STAFF_COLUMNS = "cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, status, created_by_user_id, created_at, updated_at";

export class EnrollmentRepo {
  constructor(private dbQuery = query) {}

  async userExistsInOrganization(userId: string, organizationId: string): Promise<boolean> {
    const res = await this.dbQuery("SELECT 1 FROM users WHERE user_id=$1 AND organization_id=$2 AND status='active' LIMIT 1", [userId, organizationId]);
    return res.rows.length > 0;
  }

  async programExistsInOrganization(programId: string, organizationId: string): Promise<boolean> {
    const res = await this.dbQuery("SELECT 1 FROM programs WHERE program_id=$1 AND organization_id=$2 LIMIT 1", [programId, organizationId]);
    return res.rows.length > 0;
  }

  async createCohort(input: any): Promise<Cohort> {
    const res = await this.dbQuery(
      `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, description, status, starts_at, ends_at, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING ${COHORT_COLUMNS}`,
      [input.cohortId, input.organizationId, input.tenantId, input.programId, input.name, input.description, input.status, input.startsAt, input.endsAt, input.createdByUserId]
    );
    return rowToCohort(res.rows[0]);
  }

  async getCohortById(cohortId: string): Promise<Cohort | null> {
    const res = await this.dbQuery(`SELECT ${COHORT_COLUMNS} FROM cohorts WHERE cohort_id=$1 LIMIT 1`, [cohortId]);
    return res.rows[0] ? rowToCohort(res.rows[0]) : null;
  }

  async updateCohort(cohortId: string, organizationId: string, input: any): Promise<Cohort | null> {
    const res = await this.dbQuery(
      `UPDATE cohorts
       SET name=COALESCE($3, name),
           description=COALESCE($4, description),
           status=COALESCE($5, status),
           starts_at=COALESCE($6, starts_at),
           ends_at=$7,
           updated_at=NOW(),
           version=version + 1
       WHERE cohort_id=$1 AND organization_id=$2
       RETURNING ${COHORT_COLUMNS}`,
      [cohortId, organizationId, input.name ?? null, input.description ?? null, input.status ?? null, input.startsAt ?? null, input.endsAt ?? null]
    );
    return res.rows[0] ? rowToCohort(res.rows[0]) : null;
  }

  async createEnrollment(input: any): Promise<Enrollment> {
    const res = await this.dbQuery(
      `INSERT INTO enrollments (
        enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id,
        status, enrolled_at, starts_at, ends_at, created_by_user_id, updated_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
      RETURNING ${ENROLLMENT_COLUMNS}`,
      [input.enrollmentId, input.organizationId, input.tenantId, input.learnerUserId, input.programId, input.cohortId, input.status, input.enrolledAt, input.startsAt, input.endsAt, input.createdByUserId]
    );
    return rowToEnrollment(res.rows[0]);
  }

  async getEnrollmentById(enrollmentId: string): Promise<Enrollment | null> {
    const res = await this.dbQuery(`SELECT ${ENROLLMENT_COLUMNS} FROM enrollments WHERE enrollment_id=$1 LIMIT 1`, [enrollmentId]);
    return res.rows[0] ? rowToEnrollment(res.rows[0]) : null;
  }

  async listEnrollmentsForLearner(organizationId: string, learnerUserId: string): Promise<Enrollment[]> {
    const res = await this.dbQuery(
      `SELECT ${ENROLLMENT_COLUMNS}
       FROM enrollments
       WHERE organization_id=$1 AND learner_user_id=$2
       ORDER BY starts_at DESC, created_at DESC`,
      [organizationId, learnerUserId]
    );
    return res.rows.map(rowToEnrollment);
  }

  async listActiveEnrollmentsForLearner(organizationId: string, learnerUserId: string): Promise<Enrollment[]> {
    const res = await this.dbQuery(
      `SELECT ${ENROLLMENT_COLUMNS}
       FROM enrollments
       WHERE organization_id=$1 AND learner_user_id=$2 AND status='ACTIVE'
       ORDER BY starts_at DESC, created_at DESC`,
      [organizationId, learnerUserId]
    );
    return res.rows.map(rowToEnrollment);
  }

  async listEnrollmentsForCohort(organizationId: string, cohortId: string): Promise<Enrollment[]> {
    const res = await this.dbQuery(
      `SELECT ${ENROLLMENT_COLUMNS}
       FROM enrollments
       WHERE organization_id=$1 AND cohort_id=$2 AND status IN ('PENDING', 'ACTIVE', 'COMPLETED')
       ORDER BY learner_user_id ASC`,
      [organizationId, cohortId]
    );
    return res.rows.map(rowToEnrollment);
  }

  async updateEnrollmentStatus(enrollmentId: string, organizationId: string, status: string, actorId: string, endsAt: string | null): Promise<Enrollment | null> {
    const res = await this.dbQuery(
      `UPDATE enrollments
       SET status=$3,
           ends_at=$5,
           updated_by_user_id=$4,
           updated_at=NOW(),
           version=version + 1
       WHERE enrollment_id=$1 AND organization_id=$2
       RETURNING ${ENROLLMENT_COLUMNS}`,
      [enrollmentId, organizationId, status, actorId, endsAt]
    );
    return res.rows[0] ? rowToEnrollment(res.rows[0]) : null;
  }

  async updateEnrollmentCohort(enrollmentId: string, organizationId: string, cohortId: string | null, actorId: string): Promise<Enrollment | null> {
    const res = await this.dbQuery(
      `UPDATE enrollments
       SET cohort_id=$3,
           updated_by_user_id=$4,
           updated_at=NOW(),
           version=version + 1
       WHERE enrollment_id=$1 AND organization_id=$2
       RETURNING ${ENROLLMENT_COLUMNS}`,
      [enrollmentId, organizationId, cohortId, actorId]
    );
    return res.rows[0] ? rowToEnrollment(res.rows[0]) : null;
  }

  async addCohortStaff(input: any): Promise<CohortStaff> {
    const res = await this.dbQuery(
      `INSERT INTO cohort_staff (cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING
       RETURNING ${STAFF_COLUMNS}`,
      [input.cohortStaffId, input.organizationId, input.tenantId, input.cohortId, input.userId, input.role, input.createdByUserId]
    );
    if (res.rows[0]) return rowToStaff(res.rows[0]);
    const existing = await this.dbQuery(
      `SELECT ${STAFF_COLUMNS}
       FROM cohort_staff
       WHERE organization_id=$1 AND cohort_id=$2 AND user_id=$3 AND role=$4 AND status='ACTIVE'
       LIMIT 1`,
      [input.organizationId, input.cohortId, input.userId, input.role]
    );
    return rowToStaff(existing.rows[0]);
  }

  async isActiveCohortStaff(organizationId: string, cohortId: string, userId: string): Promise<boolean> {
    const res = await this.dbQuery(
      "SELECT 1 FROM cohort_staff WHERE organization_id=$1 AND cohort_id=$2 AND user_id=$3 AND status='ACTIVE' LIMIT 1",
      [organizationId, cohortId, userId]
    );
    return res.rows.length > 0;
  }
}
