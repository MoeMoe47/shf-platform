import { withTransaction } from "../../../db/transaction.js";
import { query } from "../../../db/client.js";
import { REVIEW_GATE_TYPES, type ReviewGateType } from "../model/commercial-product-registry-contract.js";
import { REVIEW_GATE_POLICY } from "./review-contract.js";
import { CommercialProductReviewerAssignmentService } from "./reviewer-assignment-service.js";

export const REAL_REVIEW_PILOT_MANAGE_CAPABILITY = "commercial_product.review_assignment.manage";
export const SOURCE_AUTHORITY_GATE = "SOURCE_AUTHORITY";
export const REAL_REVIEW_ASSIGNABLE_GATES = [...REVIEW_GATE_TYPES, SOURCE_AUTHORITY_GATE] as const;
export type RealReviewAssignableGate = typeof REAL_REVIEW_ASSIGNABLE_GATES[number];

export type RealReviewerProfile = {
  profile_name: string;
  gate_authority: readonly RealReviewAssignableGate[];
  required_capability: string;
  prohibited_gates: readonly RealReviewAssignableGate[];
  source_resolution_authority_allowed: boolean;
  provisioning_authority_prohibited: boolean;
  admin_authority_prohibited: boolean;
};

export const REAL_REVIEWER_PROFILES: readonly RealReviewerProfile[] = [
  {
    profile_name: "LEGAL_REVIEWER",
    gate_authority: ["LEGAL", "PARTNER"],
    required_capability: "commercial_product.review_legal",
    prohibited_gates: ["FUNDING", "PRICING", "MARGIN", "COMMISSION", "SOURCE_AUTHORITY"],
    source_resolution_authority_allowed: false,
    provisioning_authority_prohibited: true,
    admin_authority_prohibited: true,
  },
  {
    profile_name: "FUNDING_REVIEWER",
    gate_authority: ["FUNDING"],
    required_capability: "commercial_product.review_funding",
    prohibited_gates: ["LEGAL", "PRICING", "MARGIN", "COMMISSION", "SOURCE_AUTHORITY"],
    source_resolution_authority_allowed: false,
    provisioning_authority_prohibited: true,
    admin_authority_prohibited: true,
  },
  {
    profile_name: "PRICING_REVIEWER",
    gate_authority: ["PRICING", "MARGIN"],
    required_capability: "commercial_product.review_pricing",
    prohibited_gates: ["LEGAL", "FUNDING", "REGULATORY", "COMMISSION", "SOURCE_AUTHORITY"],
    source_resolution_authority_allowed: false,
    provisioning_authority_prohibited: true,
    admin_authority_prohibited: true,
  },
  {
    profile_name: "EVIDENCE_REVIEWER",
    gate_authority: ["EVIDENCE"],
    required_capability: "commercial_product.review_evidence",
    prohibited_gates: ["LEGAL", "FUNDING", "PRICING", "MARGIN", "COMMISSION", "SOURCE_AUTHORITY"],
    source_resolution_authority_allowed: false,
    provisioning_authority_prohibited: true,
    admin_authority_prohibited: true,
  },
  {
    profile_name: "SOURCE_AUTHORITY_REVIEWER",
    gate_authority: ["SOURCE_AUTHORITY"],
    required_capability: "commercial_product.review_source_authority",
    prohibited_gates: ["LEGAL", "FUNDING", "PRICING", "MARGIN", "COMMISSION"],
    source_resolution_authority_allowed: true,
    provisioning_authority_prohibited: true,
    admin_authority_prohibited: true,
  },
];

export class RealReviewPilotError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "RealReviewPilotError";
  }
}

export type PilotActor = {
  user_id?: string;
  id?: string;
  active_organization_id?: string;
  organization_id?: string;
  tenant_id?: string;
  permissions?: string[];
  capabilities?: string[];
};

export type PilotActivationInput = {
  reviewer_actor_id: string;
  reviewer_org_id: string;
  candidate_id: string;
  commercial_product_id?: string;
  gate_type: string;
  effective_at: string;
  expires_at: string;
  assignment_authority_reference: string;
  reason: string;
  confirm?: boolean;
};

export type PilotIdentityState = {
  user_id: string;
  status: string;
  organization_id?: string | null;
};

export type PilotMembershipState = {
  membership_id: string;
  user_id: string;
  organization_id: string;
  status: string;
  role_id: string;
  role_name: string;
  organization_status: string;
  effective_from: string;
  effective_to?: string | null;
  permissions: string[];
};

export type CurrentAssignmentState = {
  assignment_id: string;
  assignment_status: string;
  candidate_id: string;
  reviewer_actor_id: string;
  reviewer_org_id: string;
  effective_at: string;
  expires_at: string;
  allowed_gate_types: string[];
};

export type RealReviewPilotVerifier = {
  getUser(userId: string, executor?: any): Promise<PilotIdentityState | null>;
  getMemberships(userId: string, organizationId: string, executor?: any): Promise<PilotMembershipState[]>;
  listCurrentAssignments(userId: string, organizationId: string, candidateId: string, executor?: any): Promise<CurrentAssignmentState[]>;
};

function sqlClient(executor?: any) {
  return executor || { query };
}

function rowTime(value: unknown) {
  return value instanceof Date ? value.toISOString() : value == null ? null : String(value);
}

export class PostgresRealReviewPilotVerifier implements RealReviewPilotVerifier {
  async getUser(userId: string, executor?: any) {
    const result = await sqlClient(executor).query("SELECT user_id,status,organization_id FROM users WHERE user_id=$1", [userId]);
    return result.rows[0] || null;
  }

  async getMemberships(userId: string, organizationId: string, executor?: any) {
    const result = await sqlClient(executor).query(
      `SELECT m.membership_id, m.user_id, m.organization_id, m.status, m.role_id, r.role_name,
              o.status AS organization_status, m.effective_from, m.effective_to,
              COALESCE(array_agg(rp.permission_name ORDER BY rp.permission_name) FILTER (WHERE rp.permission_name IS NOT NULL), '{}') AS permissions
       FROM memberships m
       JOIN organizations o ON o.organization_id=m.organization_id
       JOIN roles r ON r.role_id=m.role_id
       LEFT JOIN role_permissions rp ON rp.role_id=r.role_id
       WHERE m.user_id=$1 AND m.organization_id=$2
       GROUP BY m.membership_id, r.role_name, o.status
       ORDER BY m.created_at`,
      [userId, organizationId],
    );
    return result.rows.map((row: any) => ({
      ...row,
      effective_from: rowTime(row.effective_from),
      effective_to: rowTime(row.effective_to),
      permissions: row.permissions || [],
    }));
  }

  async listCurrentAssignments(userId: string, organizationId: string, candidateId: string, executor?: any) {
    const result = await sqlClient(executor).query(
      `SELECT a.assignment_id, a.assignment_status, a.candidate_id, a.reviewer_actor_id, a.reviewer_org_id,
              a.effective_at, a.expires_at,
              COALESCE(array_agg(g.gate_type ORDER BY g.gate_type) FILTER (WHERE g.gate_type IS NOT NULL), '{}') AS allowed_gate_types
       FROM commercial_product_reviewer_assignments a
       LEFT JOIN commercial_product_reviewer_assignment_gates g ON g.assignment_id=a.assignment_id
       WHERE a.reviewer_actor_id=$1 AND a.reviewer_org_id=$2 AND a.candidate_id=$3
       GROUP BY a.assignment_id
       ORDER BY a.created_at DESC`,
      [userId, organizationId, candidateId],
    );
    return result.rows.map((row: any) => ({
      ...row,
      effective_at: rowTime(row.effective_at),
      expires_at: rowTime(row.expires_at),
      allowed_gate_types: row.allowed_gate_types || [],
    }));
  }
}

function actorContext(actor: PilotActor) {
  const actorId = String(actor?.user_id || actor?.id || "").trim();
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || "").trim();
  if (!actorId || !organizationId || tenantId !== `tenant:${organizationId}`) {
    throw new RealReviewPilotError("REAL_REVIEW_OPERATOR_CONTEXT_REQUIRED", "Authenticated operator and matching active organization context are required.", 403);
  }
  return { actorId, organizationId };
}

function requireText(input: unknown, name: string) {
  const value = typeof input === "string" ? input.trim() : "";
  if (!value) throw new RealReviewPilotError("REAL_REVIEW_REQUIRED_INPUT_MISSING", `${name} is required.`);
  return value;
}

function rejectWildcard(value: string, name: string) {
  if (["*", "ALL", "ANY", "WILDCARD"].includes(value.toUpperCase())) {
    throw new RealReviewPilotError("REAL_REVIEW_WILDCARD_FORBIDDEN", `${name} cannot be wildcarded.`);
  }
}

function parseTimestamp(value: unknown, name: string) {
  const text = requireText(value, name);
  if (!Number.isFinite(Date.parse(text))) throw new RealReviewPilotError("REAL_REVIEW_TIME_INVALID", `${name} must be a valid timestamp.`);
  return new Date(text).toISOString();
}

function gateCapability(gateType: string) {
  if (gateType === SOURCE_AUTHORITY_GATE) return "commercial_product.review_source_authority";
  return REVIEW_GATE_POLICY[gateType as ReviewGateType]?.capability;
}

function hasActiveMembershipCapability(memberships: PilotMembershipState[], capability: string, now: Date) {
  const nowMs = now.getTime();
  return memberships.some((membership) =>
    membership.status === "active" &&
    membership.organization_status === "active" &&
    Date.parse(membership.effective_from) <= nowMs &&
    (!membership.effective_to || Date.parse(membership.effective_to) > nowMs) &&
    membership.permissions.includes(capability));
}

export class RealReviewPilotService {
  constructor(
    private readonly candidateIdentities: ReadonlyMap<string, string>,
    private readonly assignmentService: Pick<CommercialProductReviewerAssignmentService, "createAssignment">,
    private readonly verifier: RealReviewPilotVerifier = new PostgresRealReviewPilotVerifier(),
    private readonly transaction = withTransaction,
    private readonly clock = () => new Date(),
  ) {}

  async dryRun(input: PilotActivationInput, operator: PilotActor) {
    return this.transaction(async (executor: any) => this.validate(input, operator, executor));
  }

  async activate(input: PilotActivationInput, operator: PilotActor) {
    if (input.confirm !== true) throw new RealReviewPilotError("REAL_REVIEW_CONFIRM_REQUIRED", "Activation requires explicit confirmation.");
    const dryRun = await this.dryRun(input, operator);
    const assignment = await this.assignmentService.createAssignment({
      reviewer_actor_id: dryRun.reviewer.user_id,
      reviewer_org_id: dryRun.organization_id,
      candidate_id: dryRun.candidate.candidate_id,
      commercial_product_id: dryRun.candidate.commercial_product_id,
      allowed_gate_types: [dryRun.gate.gate_type],
      effective_at: dryRun.proposed_assignment.effective_at,
      expires_at: dryRun.proposed_assignment.expires_at,
      assignment_authority_reference: dryRun.proposed_assignment.assignment_authority_reference,
      reason: dryRun.proposed_assignment.reason,
    }, operator);
    return { mode: "ACTIVATED" as const, dry_run: dryRun, assignment };
  }

  private async validate(input: PilotActivationInput, operator: PilotActor, executor: any) {
    const context = actorContext(operator);
    const reviewerActorId = requireText(input.reviewer_actor_id, "reviewer_actor_id");
    const organizationId = requireText(input.reviewer_org_id, "reviewer_org_id");
    const candidateId = requireText(input.candidate_id, "candidate_id");
    const gateType = requireText(input.gate_type, "gate_type").toUpperCase();
    rejectWildcard(reviewerActorId, "reviewer_actor_id");
    rejectWildcard(organizationId, "reviewer_org_id");
    rejectWildcard(candidateId, "candidate_id");
    rejectWildcard(gateType, "gate_type");
    if (organizationId !== context.organizationId) throw new RealReviewPilotError("REAL_REVIEW_OPERATOR_ORG_MISMATCH", "Operator active organization must match reviewer assignment organization.", 403);
    if (reviewerActorId === context.actorId) throw new RealReviewPilotError("REAL_REVIEW_SELF_PROVISIONING_FORBIDDEN", "Operator cannot activate their own reviewer assignment.", 403);
    if (!(REAL_REVIEW_ASSIGNABLE_GATES as readonly string[]).includes(gateType)) throw new RealReviewPilotError("REAL_REVIEW_GATE_INVALID", "Gate is not assignable for real review pilot.");
    const requiredCapability = gateCapability(gateType);
    if (!requiredCapability) throw new RealReviewPilotError("REAL_REVIEW_GATE_INVALID", "Gate capability is unavailable.");
    const effectiveAt = parseTimestamp(input.effective_at, "effective_at");
    const expiresAt = parseTimestamp(input.expires_at, "expires_at");
    if (Date.parse(expiresAt) <= Date.parse(effectiveAt) || Date.parse(expiresAt) <= this.clock().getTime()) {
      throw new RealReviewPilotError("REAL_REVIEW_EXPIRY_REQUIRED", "expires_at must be supplied, after effective_at, and in the future.");
    }
    const authorityReference = requireText(input.assignment_authority_reference, "assignment_authority_reference");
    const reason = requireText(input.reason, "reason");
    const commercialProductId = input.commercial_product_id?.trim() || this.candidateIdentities.get(candidateId);
    if (!commercialProductId || this.candidateIdentities.get(candidateId) !== commercialProductId) {
      throw new RealReviewPilotError("REAL_REVIEW_CANDIDATE_SCOPE_INVALID", "Candidate and commercial product identity must match the controlled manifest.");
    }
    const [operatorMemberships, reviewer, reviewerMemberships, currentAssignments] = await Promise.all([
      this.verifier.getMemberships(context.actorId, context.organizationId, executor),
      this.verifier.getUser(reviewerActorId, executor),
      this.verifier.getMemberships(reviewerActorId, organizationId, executor),
      this.verifier.listCurrentAssignments(reviewerActorId, organizationId, candidateId, executor),
    ]);
    if (!hasActiveMembershipCapability(operatorMemberships, REAL_REVIEW_PILOT_MANAGE_CAPABILITY, this.clock())) {
      throw new RealReviewPilotError("REAL_REVIEW_OPERATOR_FORBIDDEN", "Operator must hold explicit reviewer-assignment provisioning authority.", 403);
    }
    if (!reviewer || reviewer.status !== "active") throw new RealReviewPilotError("REAL_REVIEW_USER_NOT_FOUND", "Reviewer must be an existing active Identity user.", 404);
    if (!hasActiveMembershipCapability(reviewerMemberships, "commercial_product.read", this.clock())) {
      throw new RealReviewPilotError("REAL_REVIEW_MEMBERSHIP_REQUIRED", "Reviewer must have active organization membership with Product Registry read capability.", 403);
    }
    if (!hasActiveMembershipCapability(reviewerMemberships, requiredCapability, this.clock())) {
      throw new RealReviewPilotError("REAL_REVIEW_CAPABILITY_REQUIRED", "Reviewer membership lacks the required gate capability.", 403);
    }
    const conflicts = currentAssignments.filter((assignment) => assignment.assignment_status === "ACTIVE" && Date.parse(assignment.expires_at) > this.clock().getTime());
    return {
      mode: "DRY_RUN" as const,
      operator: { actor_id: context.actorId, organization_id: context.organizationId, capability: REAL_REVIEW_PILOT_MANAGE_CAPABILITY },
      reviewer: { user_id: reviewerActorId, status: reviewer.status, memberships: reviewerMemberships },
      organization_id: organizationId,
      candidate: { candidate_id: candidateId, commercial_product_id: commercialProductId },
      gate: { gate_type: gateType, required_capability: requiredCapability },
      proposed_assignment: { effective_at: effectiveAt, expires_at: expiresAt, assignment_authority_reference: authorityReference, reason },
      current_assignments: currentAssignments,
      conflicts,
      expected_queue_impact: conflicts.length
        ? "CONFLICTING_ACTIVE_ASSIGNMENT_REQUIRES_REVOCATION_OR_EXPIRY"
        : `Reviewer will see candidate ${candidateId} for ${gateType} only after activation and authentication.`,
      mutation_performed: false,
      production_onboarding_performed: false,
      readiness_sellability_lifecycle_mutated: false,
    };
  }
}
