import { createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isCanonicalSpecialization } from "../model/specialization-assignment.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("scope_missing");
  return { userId, organizationId, tenantId };
}

function id(...parts: string[]) {
  return `specialization_assignment_${createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 32)}`;
}

export class SpecializationAssignmentService {
  constructor(private dbQuery: typeof query = query, private transaction = withTransaction) {}

  private async ensureProgram(programId: string, organizationId: string) {
    const program = await this.dbQuery("SELECT program_id, organization_id, status FROM programs WHERE program_id=$1 AND organization_id=$2", [programId, organizationId]);
    if (!program.rows[0]) throw new Error("program_not_found");
    return program.rows[0];
  }

  private async ensureLearner(learnerId: string, organizationId: string) {
    const learner = await this.dbQuery("SELECT user_id, organization_id FROM users WHERE user_id=$1 AND organization_id=$2", [learnerId, organizationId]);
    if (!learner.rows[0]) throw new Error("learner_not_found");
  }

  async listAvailable() {
    return [
      { specialization_id: "technical-operations", title: "Data Center Technical Operations" },
      { specialization_id: "networking-fiber", title: "Networking and Fiber" },
      { specialization_id: "electrical-infrastructure", title: "Electrical Infrastructure" },
      { specialization_id: "mechanical-hvac", title: "Mechanical and HVAC Infrastructure" },
      { specialization_id: "cybersecurity-security", title: "Cybersecurity and Physical Security" },
      { specialization_id: "ai-cloud-infrastructure", title: "AI and Cloud Infrastructure" },
    ];
  }

  async getLearnerAssignment(actor: any, learnerId = scope(actor).userId, programId?: string) {
    const current = scope(actor);
    if (learnerId !== current.userId && !hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("assignment_view_required");
    const params: string[] = [learnerId, current.organizationId, current.tenantId];
    const programClause = programId ? " AND program_id=$4" : "";
    if (programId) params.push(programId);
    const result = await this.dbQuery(`SELECT * FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3${programClause} ORDER BY created_at DESC, assignment_id DESC`, params);
    return result.rows;
  }

  async assign(input: { actor: any; learnerId: string; programId: string; specializationId: string; assignmentSource?: string; grade?: number; assignmentType?: string }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("assignment_authority_required");
    const current = scope(input.actor);
    const specializationId = String(input.specializationId || "").trim();
    if (!isCanonicalSpecialization(specializationId)) throw new Error("invalid_specialization");
    const grade = Number(input.grade || 11);
    if (![11, 12].includes(grade)) throw new Error("invalid_grade");
    if (input.assignmentType && input.assignmentType !== "PRIMARY") throw new Error("secondary_assignments_deferred");
    const source = String(input.assignmentSource || "PROGRAM_ASSIGNMENT");
    if (!["LEARNER_SELECTION", "INSTRUCTOR_ASSIGNMENT", "PROGRAM_ASSIGNMENT", "ADVISOR_CHANGE"].includes(source)) throw new Error("invalid_assignment_source");
    await this.ensureProgram(input.programId, current.organizationId);
    await this.ensureLearner(input.learnerId, current.organizationId);
    const stableAssignmentId = id(current.organizationId, input.learnerId, input.programId, specializationId);
    return this.transaction(async (db: any) => {
      const active = await db.query("SELECT * FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND assignment_type='PRIMARY' AND status='ACTIVE' FOR UPDATE", [input.learnerId, current.organizationId, current.tenantId, input.programId]);
      if (active.rows[0]?.specialization_id === specializationId) return active.rows[0];
      if (active.rows[0]) await db.query("UPDATE program_specialization_assignments SET status='TRANSFERRED', effective_to=NOW(), updated_at=NOW() WHERE assignment_id=$1", [active.rows[0].assignment_id]);
      // Grade 12 course participation is branch-specific. Preserve its row,
      // but prevent an old branch course from remaining active after transfer.
      await db.query("UPDATE program_course_assignments SET status='TRANSFERRED', ended_at=NOW(), updated_at=NOW() WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND status='ACTIVE'", [input.learnerId, current.organizationId, current.tenantId, input.programId]);
      const prior = await db.query("SELECT status FROM program_specialization_assignments WHERE assignment_id=$1", [stableAssignmentId]);
      const assignmentId = prior.rows[0] ? id(stableAssignmentId, new Date().toISOString()) : stableAssignmentId;
      const inserted = await db.query(`INSERT INTO program_specialization_assignments (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source) VALUES ($1,$2,$3,$4,$5,$6,$7,'PREPARE_PROVE','PRIMARY','ACTIVE',$8,$9) ON CONFLICT (assignment_id) DO UPDATE SET updated_at=program_specialization_assignments.updated_at RETURNING *`, [assignmentId, input.learnerId, current.organizationId, current.tenantId, input.programId, specializationId, grade, current.userId, source]);
      return inserted.rows[0];
    });
  }

  async change(input: { actor: any; assignmentId: string; specializationId: string; source?: string }) {
    const assignment = await this.dbQuery("SELECT * FROM program_specialization_assignments WHERE assignment_id=$1", [input.assignmentId]);
    if (!assignment.rows[0]) throw new Error("assignment_not_found");
    const row = assignment.rows[0];
    return this.assign({ actor: input.actor, learnerId: row.learner_id, programId: row.program_id, specializationId: input.specializationId, assignmentSource: input.source || "ADVISOR_CHANGE", grade: row.grade, assignmentType: row.assignment_type });
  }
}
