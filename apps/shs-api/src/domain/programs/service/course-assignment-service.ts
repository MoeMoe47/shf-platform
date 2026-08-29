import { createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { Grade12EligibilityService } from "./grade12-eligibility-service.js";
import { CAPSTONE_ROLE_BY_SPECIALIZATION } from "../model/grade12-eligibility-policy.js";

const PROGRAM_ID = "data-center-specialization-11";
const GRADE12_COURSES: Record<string, string> = {
  "data-center-technical-operations-12": "technical-operations",
  "data-center-networking-fiber-12": "networking-fiber",
  "data-center-electrical-infrastructure-12": "electrical-infrastructure",
  "data-center-mechanical-hvac-12": "mechanical-hvac",
  "data-center-cybersecurity-security-12": "cybersecurity-security",
  "data-center-ai-cloud-infrastructure-12": "ai-cloud-infrastructure",
};

function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("scope_missing");
  return { userId, organizationId, tenantId };
}
function id(...parts: string[]) { return `course_assignment_${createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 32)}`; }

export class CourseAssignmentService {
  constructor(private dbQuery: typeof query = query, private transaction = withTransaction, private eligibility = new Grade12EligibilityService(dbQuery)) {}

  async list(actor: any, learnerId = scope(actor).userId) {
    const current = scope(actor);
    if (learnerId !== current.userId && !hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_COURSE_ASSIGN)) throw new Error("course_assignment_view_required");
    const result = await this.dbQuery("SELECT * FROM program_course_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at DESC, assignment_id DESC", [learnerId, current.organizationId, current.tenantId]);
    return result.rows;
  }

  async assign(input: { actor: any; learnerId: string; programId: string; courseId: string; specializationId: string }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_COURSE_ASSIGN)) throw new Error("course_assignment_authority_required");
    const current = scope(input.actor);
    const expected = GRADE12_COURSES[input.courseId];
    if (!expected || input.programId !== PROGRAM_ID || input.specializationId !== expected) throw new Error("course_specialization_mismatch");
    const eligibility = await this.eligibility.evaluate({ ...input.actor, user_id: input.learnerId }, input.learnerId, input.programId);
    if (!eligibility.eligible || eligibility.specialization_id !== input.specializationId) throw new Error("grade12_eligibility_required");
    const assignmentId = id(current.organizationId, input.learnerId, input.programId, input.courseId);
    return this.transaction(async (db: any) => {
      const existing = await db.query("SELECT * FROM program_course_assignments WHERE assignment_id=$1 AND organization_id=$2", [assignmentId, current.organizationId]);
      if (existing.rows[0]?.status === "ACTIVE") return existing.rows[0];
      await db.query("UPDATE program_course_assignments SET status='TRANSFERRED', ended_at=NOW(), updated_at=NOW() WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND status='ACTIVE' AND course_id<>$5", [input.learnerId, current.organizationId, current.tenantId, input.programId, input.courseId]);
      const inserted = await db.query(`INSERT INTO program_course_assignments (assignment_id, learner_id, organization_id, tenant_id, program_id, course_id, grade, stage, specialization_id, status, assigned_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,12,'PREPARE_PROVE',$7,'ACTIVE',$8) ON CONFLICT (assignment_id) DO UPDATE SET status='ACTIVE', updated_at=NOW() RETURNING *`, [assignmentId, input.learnerId, current.organizationId, current.tenantId, input.programId, input.courseId, input.specializationId, current.userId]);
      return inserted.rows[0];
    });
  }

  roleForSpecialization(specializationId: string) { return CAPSTONE_ROLE_BY_SPECIALIZATION[specializationId] || null; }
}

export { PROGRAM_ID, GRADE12_COURSES };
