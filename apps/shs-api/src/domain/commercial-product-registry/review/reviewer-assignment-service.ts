import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { REVIEW_GATE_TYPES } from "../model/commercial-product-registry-contract.js";
import { PostgresReviewerAssignmentRepo } from "./postgres-reviewer-assignment-repo.js";

const ASSIGNMENT_CAPABILITY = "commercial_product.review_assignment.manage";
const SOURCE_GATE = "SOURCE_AUTHORITY";
const ASSIGNABLE_GATES = new Set([...REVIEW_GATE_TYPES, SOURCE_GATE]);

export class ReviewerAssignmentError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "ReviewerAssignmentError";
  }
}

function actorContext(actor: any) {
  const actorId = String(actor?.user_id || actor?.id || "").trim();
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || "").trim();
  if (!actorId || !organizationId || tenantId !== `tenant:${organizationId}`) {
    throw new ReviewerAssignmentError("ASSIGNMENT_ACTOR_CONTEXT_REQUIRED", "Authenticated actor and matching organization context are required.", 403);
  }
  return { actorId, organizationId };
}

function rejectUnexpected(input: any, allowed: readonly string[]) {
  const unexpected = Object.keys(input || {}).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new ReviewerAssignmentError("ASSIGNMENT_INPUT_FIELD_FORBIDDEN", `Unsupported assignment fields: ${unexpected.join(", ")}`);
}

function parseTimestamp(value: unknown, name: string) {
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) {
    throw new ReviewerAssignmentError("ASSIGNMENT_TIME_INVALID", `${name} must be a valid timestamp.`);
  }
  return new Date(value).toISOString();
}

export class CommercialProductReviewerAssignmentService {
  constructor(
    private readonly candidateIdentities: ReadonlyMap<string, string>,
    private readonly repo = new PostgresReviewerAssignmentRepo(),
    private readonly auditWriter = writeAuditEvent,
    private readonly transaction = withTransaction,
    private readonly clock = () => new Date(),
  ) {}

  private async requireManager(actor: any, executor: any) {
    const context = actorContext(actor);
    const valid = await this.repo.assertIdentityMembership(context.actorId, context.organizationId, executor, ASSIGNMENT_CAPABILITY);
    if (!valid) throw new ReviewerAssignmentError("ASSIGNMENT_PROVISIONING_FORBIDDEN", "Explicit reviewer-assignment provisioning authority is required.", 403);
    return context;
  }

  private async audit(action: string, assignmentId: string, context: { actorId: string; organizationId: string }, before: any, after: any, reason: string, executor: any) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: context.organizationId,
      actor_user_id: context.actorId,
      target_object_type: "commercial_product_reviewer_assignment",
      target_object_id: assignmentId,
      action_type: `commercial_product_registry.reviewer_assignment_${action}`,
      previous_state_json: before,
      new_state_json: after,
      reason_code: `reviewer_assignment_${action}`,
      reason_text: reason,
      correlation_id: `cpr_assignment_${assignmentId}`,
      source_channel: "commercial-product-registry-reviewer-assignment-service",
    }, executor);
  }

  async createAssignment(input: any, actor: any) {
    rejectUnexpected(input, ["reviewer_actor_id", "reviewer_org_id", "candidate_id", "commercial_product_id", "allowed_gate_types", "effective_at", "expires_at", "assignment_authority_reference", "reason"]);
    const context = actorContext(actor);
    const reviewerActorId = String(input?.reviewer_actor_id || "").trim();
    const reviewerOrgId = String(input?.reviewer_org_id || context.organizationId).trim();
    const candidateId = String(input?.candidate_id || "").trim();
    const productId = String(input?.commercial_product_id || "").trim();
    if (!reviewerActorId || reviewerActorId === context.actorId) throw new ReviewerAssignmentError("ASSIGNMENT_SELF_ASSIGNMENT_FORBIDDEN", "Provisioners cannot assign reviewer authority to themselves.", 403);
    if (reviewerOrgId !== context.organizationId) throw new ReviewerAssignmentError("ASSIGNMENT_ORGANIZATION_MISMATCH", "Assignments must be provisioned within the active organization.", 403);
    const canonicalProductId = this.candidateIdentities.get(candidateId);
    if (!canonicalProductId || canonicalProductId !== productId) throw new ReviewerAssignmentError("ASSIGNMENT_CANDIDATE_IDENTITY_MISMATCH", "Candidate/product identity does not match the reviewed manifest.", 404);
    const gates = input?.allowed_gate_types;
    if (!Array.isArray(gates) || gates.length === 0 || gates.some((gate: unknown) => typeof gate !== "string" || !ASSIGNABLE_GATES.has(gate)) || new Set(gates).size !== gates.length) {
      throw new ReviewerAssignmentError("ASSIGNMENT_GATE_INVALID", "One or more allowed gates are invalid or duplicated.");
    }
    const effectiveAt = parseTimestamp(input?.effective_at, "effective_at");
    const expiresAt = parseTimestamp(input?.expires_at, "expires_at");
    if (Date.parse(expiresAt) <= Date.parse(effectiveAt) || Date.parse(expiresAt) <= this.clock().getTime()) {
      throw new ReviewerAssignmentError("ASSIGNMENT_TIME_WINDOW_INVALID", "Expiry must be after the effective time and in the future.");
    }
    const authorityReference = String(input?.assignment_authority_reference || "").trim();
    const reason = String(input?.reason || "").trim();
    if (!authorityReference || authorityReference.length > 1000 || !reason || reason.length > 4000) {
      throw new ReviewerAssignmentError("ASSIGNMENT_PROVENANCE_REQUIRED", "Assignment authority reference and reason are required.");
    }

    return this.transaction(async (executor: any) => {
      const manager = await this.requireManager(actor, executor);
      const targetIsMember = await this.repo.assertIdentityMembership(reviewerActorId, reviewerOrgId, executor);
      if (!targetIsMember) throw new ReviewerAssignmentError("ASSIGNMENT_REVIEWER_MEMBERSHIP_REQUIRED", "Reviewer must have an active membership in the assigned organization.", 403);
      const dbClock = await executor.query("SELECT clock_timestamp() AS now");
      if (Date.parse(expiresAt) <= Date.parse(dbClock.rows[0].now)) throw new ReviewerAssignmentError("ASSIGNMENT_TIME_WINDOW_INVALID", "Expiry must be in the future when the assignment is written.");
      await this.repo.lockAssignmentKey(reviewerActorId, reviewerOrgId, candidateId, executor);
      const expired = await this.repo.expirePastAssignments(reviewerActorId, reviewerOrgId, candidateId, executor);
      for (const row of expired.rows) await this.audit("expired", row.assignment_id, manager,
        { ...row, assignment_status: "ACTIVE", version: Number(row.version) - 1 }, row,
        "Assignment expired before a replacement was provisioned.", executor);
      const existing = await executor.query(
        "SELECT assignment_id FROM commercial_product_reviewer_assignments WHERE reviewer_actor_id=$1 AND reviewer_org_id=$2 AND candidate_id=$3 AND assignment_status='ACTIVE' LIMIT 1 FOR UPDATE",
        [reviewerActorId, reviewerOrgId, candidateId],
      );
      if (existing.rows[0]) throw new ReviewerAssignmentError("ASSIGNMENT_DUPLICATE_ACTIVE", "An active assignment already exists for this reviewer and candidate.", 409);
      const assignmentId = `cpr_assignment_${randomUUID()}`;
      const row = await this.repo.insertAssignment({
        assignment_id: assignmentId,
        reviewer_actor_id: reviewerActorId,
        reviewer_org_id: reviewerOrgId,
        candidate_id: candidateId,
        commercial_product_id: canonicalProductId,
        allowed_gate_types: gates,
        effective_at: effectiveAt,
        expires_at: expiresAt,
        assigned_by_actor_id: manager.actorId,
        assignment_authority_reference: authorityReference,
        reason,
      }, executor);
      await this.audit("created", assignmentId, manager, null, row, reason, executor);
      return row;
    });
  }

  async listAssignments(actor: any, options: { limit: number; offset: number }) {
    return this.transaction(async (executor: any) => {
      const context = await this.requireManager(actor, executor);
      return this.repo.listAssignments(context.organizationId, options, executor);
    });
  }

  async getAssignment(assignmentId: string, actor: any) {
    return this.transaction(async (executor: any) => {
      const context = await this.requireManager(actor, executor);
      const assignment = await this.repo.getAssignment(assignmentId, executor);
      if (!assignment || assignment.reviewer_org_id !== context.organizationId) throw new ReviewerAssignmentError("ASSIGNMENT_NOT_FOUND", "Assignment not found.", 404);
      const history = await this.repo.assignmentHistory(assignmentId, context.organizationId, executor);
      return { assignment, history };
    });
  }

  async listMyAssignments(actor: any) {
    const context = actorContext(actor);
    if (!hasCapability(actor, "commercial_product.read")) throw new ReviewerAssignmentError("REVIEW_READ_CAPABILITY_REQUIRED", "Product Registry read access is required.", 403);
    return this.transaction(async (executor: any) => {
      const member = await this.repo.assertIdentityMembership(context.actorId, context.organizationId, executor, "commercial_product.read");
      if (!member) throw new ReviewerAssignmentError("REVIEW_READ_CAPABILITY_REQUIRED", "Active Product Registry reader membership is required.", 403);
      return this.repo.listActiveForReviewer(context.actorId, context.organizationId, executor);
    });
  }

  async revokeAssignment(assignmentId: string, reasonInput: unknown, actor: any) {
    const reason = typeof reasonInput === "string" ? reasonInput.trim() : "";
    if (!reason || reason.length > 4000) throw new ReviewerAssignmentError("ASSIGNMENT_REVOCATION_REASON_REQUIRED", "A revocation reason is required.");
    return this.transaction(async (executor: any) => {
      const context = await this.requireManager(actor, executor);
      const prior = await this.repo.getAssignment(assignmentId, executor, true);
      if (!prior || prior.reviewer_org_id !== context.organizationId) throw new ReviewerAssignmentError("ASSIGNMENT_NOT_FOUND", "Assignment not found.", 404);
      if (prior.assignment_status === "REVOKED") return { ...prior, replayed: true };
      const revoked = await this.repo.revokeAssignment(assignmentId, context.actorId, context.organizationId, executor);
      if (!revoked) throw new ReviewerAssignmentError("ASSIGNMENT_STATE_CONFLICT", "Assignment is no longer revocable.", 409);
      const result = { ...revoked, allowed_gate_types: prior.allowed_gate_types };
      await this.audit("revoked", assignmentId, context, prior, result, reason, executor);
      return result;
    });
  }
}

function hasCapability(actor: any, capability: string) {
  const capabilities = actor?.capabilities || actor?.permissions || [];
  return Array.isArray(capabilities) && capabilities.includes(capability);
}

export { ASSIGNABLE_GATES, SOURCE_GATE };
