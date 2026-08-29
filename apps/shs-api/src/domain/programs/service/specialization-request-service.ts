import { createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isCanonicalSpecialization } from "../model/specialization-assignment.js";
import { SpecializationAssignmentService } from "./specialization-assignment-service.js";

function context(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("scope_missing");
  return { userId, organizationId, tenantId };
}

function requestId(organizationId: string, learnerId: string, programId: string, specializationId: string) {
  return `specialization_request_${createHash("sha256").update([organizationId, learnerId, programId, specializationId].join("|"), "utf8").digest("hex").slice(0, 32)}`;
}

export class SpecializationRequestService {
  constructor(private dbQuery: typeof query = query, private transaction = withTransaction, private assignments = new SpecializationAssignmentService()) {}

  async list(actor: any, learnerId = context(actor).userId, programId = "data-center-specialization-11") {
    const current = context(actor);
    if (learnerId !== current.userId && !hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("request_view_required");
    const result = await this.dbQuery("SELECT * FROM program_specialization_requests WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 ORDER BY created_at DESC, request_id DESC", [learnerId, current.organizationId, current.tenantId, programId]);
    return result.rows;
  }

  async getById(actor: any, id: string) {
    const current = context(actor);
    const result = await this.dbQuery("SELECT * FROM program_specialization_requests WHERE request_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, current.organizationId, current.tenantId]);
    if (!result.rows[0]) throw new Error("request_not_found");
    if (result.rows[0].learner_id !== current.userId && !hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("request_view_required");
    return result.rows[0];
  }

  async listPending(actor: any, programId = "data-center-specialization-11") {
    if (!hasPermission(actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("request_view_required");
    const current = context(actor);
    const result = await this.dbQuery("SELECT * FROM program_specialization_requests WHERE organization_id=$1 AND tenant_id=$2 AND program_id=$3 AND status='PENDING' ORDER BY requested_at ASC, request_id ASC", [current.organizationId, current.tenantId, programId]);
    return result.rows;
  }

  async request(input: { actor: any; specializationId: string; programId?: string; learnerRationale?: string }) {
    const current = context(input.actor);
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.CURRICULUM_LESSON_COMPLETE)) throw new Error("request_submission_required");
    const specializationId = String(input.specializationId || "").trim();
    const programId = String(input.programId || "data-center-specialization-11").trim();
    if (!isCanonicalSpecialization(specializationId)) throw new Error("invalid_specialization");
    const active = await this.dbQuery("SELECT assignment_id, specialization_id FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND assignment_type='PRIMARY' AND status='ACTIVE'", [current.userId, current.organizationId, current.tenantId, programId]);
    const type = active.rows[0] ? "CHANGE" : "PRIMARY";
    const existing = await this.dbQuery("SELECT * FROM program_specialization_requests WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND requested_specialization_id=$5 AND status='PENDING' ORDER BY created_at DESC LIMIT 1", [current.userId, current.organizationId, current.tenantId, programId, specializationId]);
    if (existing.rows[0]) return existing.rows[0];
    return this.transaction(async (db: any) => {
      await db.query("UPDATE program_specialization_requests SET status='SUPERSEDED', updated_at=NOW() WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND request_type=$5 AND status='PENDING'", [current.userId, current.organizationId, current.tenantId, programId, type]);
      const inserted = await db.query(`INSERT INTO program_specialization_requests (request_id, learner_id, organization_id, tenant_id, program_id, requested_specialization_id, grade, stage, request_type, status, learner_rationale) VALUES ($1,$2,$3,$4,$5,$6,11,'PREPARE_PROVE',$7,'PENDING',$8) ON CONFLICT (request_id) DO UPDATE SET updated_at=program_specialization_requests.updated_at RETURNING *`, [requestId(current.organizationId, current.userId, programId, specializationId), current.userId, current.organizationId, current.tenantId, programId, specializationId, type, String(input.learnerRationale || "").trim().slice(0, 1000) || null]);
      return inserted.rows[0];
    });
  }

  async confirm(input: { actor: any; requestId: string; specializationId?: string; staffNote?: string }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("assignment_authority_required");
    const current = context(input.actor);
    const found = await this.dbQuery("SELECT * FROM program_specialization_requests WHERE request_id=$1 AND organization_id=$2 AND tenant_id=$3", [input.requestId, current.organizationId, current.tenantId]);
    if (!found.rows[0]) throw new Error("request_not_found");
    const request = found.rows[0];
    if (request.status === "CONFIRMED" && !input.specializationId) return request;
    if (request.status !== "PENDING" && request.status !== "CONFIRMED") throw new Error("request_not_pending");
    const specializationId = String(input.specializationId || request.requested_specialization_id).trim();
    const assignment = await this.assignments.assign({ actor: input.actor, learnerId: request.learner_id, programId: request.program_id, specializationId, assignmentSource: "PROGRAM_ASSIGNMENT", grade: request.grade, assignmentType: "PRIMARY" });
    const updated = await this.dbQuery("UPDATE program_specialization_requests SET status='CONFIRMED', reviewed_at=NOW(), reviewed_by_user_id=$2, staff_note=$3, resulting_assignment_id=$4, updated_at=NOW() WHERE request_id=$1 AND organization_id=$5 AND tenant_id=$6 RETURNING *", [request.request_id, current.userId, String(input.staffNote || "").trim().slice(0, 1000) || null, assignment.assignment_id, current.organizationId, current.tenantId]);
    return updated.rows[0];
  }

  async decline(input: { actor: any; requestId: string; staffNote?: string }) {
    if (!hasPermission(input.actor?.permissions, SHS_SECURITY_PERMISSIONS.PROGRAM_SPECIALIZATION_ASSIGN)) throw new Error("assignment_authority_required");
    const current = context(input.actor);
    const result = await this.dbQuery("UPDATE program_specialization_requests SET status='DECLINED', reviewed_at=NOW(), reviewed_by_user_id=$2, staff_note=$3, updated_at=NOW() WHERE request_id=$1 AND organization_id=$4 AND tenant_id=$5 AND status='PENDING' RETURNING *", [input.requestId, current.userId, String(input.staffNote || "").trim().slice(0, 1000) || null, current.organizationId, current.tenantId]);
    if (!result.rows[0]) throw new Error("request_not_pending");
    return result.rows[0];
  }
}
