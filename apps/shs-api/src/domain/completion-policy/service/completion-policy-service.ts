// SHF Lesson + Assignment + Curriculum — Phase 4.
//
// Completion Policy authoring: create/edit while DRAFT, activate to
// freeze (Step 4/27/28). Reuses Phase 3's own resolveContentWithinRelease
// for scope validation rather than re-implementing release-snapshot
// resolution a second time.
import { randomBytes } from "node:crypto";
import { CompletionPolicyRepo } from "../repo/completion-policy-repo.js";
import { CurriculumCatalogRepo } from "../../curriculum-catalog/repo/curriculum-catalog-repo.js";
import { query } from "../../../db/client.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { resolveContentWithinRelease, CurriculumBindingError } from "../../assignments/service/assignment-service.js";
import { REQUIREMENT_REGISTRY, REQUIREMENT_TYPES, type RequirementType, type PolicyContentType } from "../model/completion-policy.js";

const repo = new CompletionPolicyRepo();
const catalogRepo = new CurriculumCatalogRepo();

export interface PolicyActor { userId: string; organizationId: string }

export class PolicyValidationError extends Error {
  constructor(public issues: string[]) { super(`Invalid completion policy request: ${issues.join("; ")}`); this.name = "PolicyValidationError"; }
}
export class PolicyNotFoundError extends Error { constructor() { super("completion_policy_not_found"); this.name = "PolicyNotFoundError"; } }
export class PolicyNotEditableError extends Error { constructor() { super("policy is not editable outside DRAFT status"); this.name = "PolicyNotEditableError"; } }
export class PolicyStaleRevisionError extends Error { constructor() { super("completion_policy_stale_revision"); this.name = "PolicyStaleRevisionError"; } }
export class PolicyActivationError extends Error {
  constructor(public issues: string[]) { super(`Cannot activate policy: ${issues.join("; ")}`); this.name = "PolicyActivationError"; }
}

function newId(prefix: string) { return `${prefix}_${randomBytes(12).toString("hex")}`; }

async function audit(actor: PolicyActor, actionType: string, targetId: string, previous: unknown, next: unknown) {
  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organizationId,
    actor_user_id: actor.userId,
    target_object_type: "completion_policy",
    target_object_id: targetId,
    action_type: actionType,
    previous_state_json: previous ?? null,
    new_state_json: next ?? null,
    correlation_id: `corr_${targetId}_${Date.now()}`,
    source_channel: "api",
  });
}

export async function createPolicy(actor: PolicyActor, input: { curriculumReleaseId: string; assignedContentType: PolicyContentType; assignedContentUnitKey?: string; assignedContentLessonKey?: string }) {
  const release = await catalogRepo.findRelease(actor.organizationId, input.curriculumReleaseId);
  if (!release) throw new PolicyValidationError(["curriculumReleaseId does not exist in your organization"]);
  if (release.status !== "PUBLISHED") throw new PolicyValidationError(["Completion policies may only bind to a PUBLISHED curriculum release"]);
  const resolved = resolveContentWithinRelease(release.snapshot, input.assignedContentType, input.assignedContentUnitKey, input.assignedContentLessonKey);

  const version = await repo.nextVersion(actor.organizationId, release.releaseId, input.assignedContentType, resolved.assignedContentId);
  const policy = await repo.create({
    policyId: newId("policy"), organizationId: actor.organizationId, curriculumReleaseId: release.releaseId,
    assignedContentType: input.assignedContentType, assignedContentId: resolved.assignedContentId, version, createdByUserId: actor.userId,
  });
  await audit(actor, "completion_policy.created", policy.policyId, null, { curriculumReleaseId: release.releaseId, assignedContentType: input.assignedContentType });
  return policy;
}

export async function getPolicy(actor: PolicyActor, policyId: string) {
  const policy = await repo.findById(actor.organizationId, policyId);
  if (!policy) throw new PolicyNotFoundError();
  const requirements = await repo.listRequirements(actor.organizationId, policyId);
  return { policy, requirements };
}

async function targetReferenceExists(organizationId: string, requirementType: RequirementType, targetReference: string): Promise<boolean> {
  if (requirementType === "ARCADE") {
    const res = await query(`SELECT 1 FROM arcade_activities WHERE arcade_activity_id = $1`, [targetReference]);
    return res.rows.length > 0;
  }
  if (requirementType === "PROJECT") {
    const res = await query(`SELECT 1 FROM projects WHERE project_id = $1 AND organization_id = $2`, [targetReference, organizationId]);
    return res.rows.length > 0;
  }
  if (requirementType === "LIVE_ATTENDANCE") {
    const res = await query(`SELECT 1 FROM live_sessions WHERE live_session_id = $1 AND organization_id = $2`, [targetReference, organizationId]);
    return res.rows.length > 0;
  }
  if (requirementType === "INSTRUCTOR_VERIFICATION" || requirementType === "EVIDENCE") {
    const res = await query(`SELECT 1 FROM competency_definitions WHERE competency_id = $1`, [targetReference]);
    return res.rows.length > 0;
  }
  return true;
}

export async function addRequirement(actor: PolicyActor, policyId: string, input: { requirementType: string; targetReference?: string | null; configuration?: Record<string, unknown>; required?: boolean }) {
  const policy = await repo.findById(actor.organizationId, policyId);
  if (!policy) throw new PolicyNotFoundError();
  if (policy.status !== "DRAFT") throw new PolicyNotEditableError();
  if (!REQUIREMENT_TYPES.includes(input.requirementType as RequirementType)) {
    throw new PolicyValidationError([`requirementType must be one of: ${REQUIREMENT_TYPES.join(", ")}`]);
  }
  const requirementType = input.requirementType as RequirementType;
  const registryEntry = REQUIREMENT_REGISTRY[requirementType];
  if (registryEntry.requiresTargetReference && !input.targetReference) {
    throw new PolicyValidationError([`${requirementType} requires a targetReference`]);
  }
  if (input.targetReference && !(await targetReferenceExists(actor.organizationId, requirementType, input.targetReference))) {
    throw new PolicyValidationError([`targetReference does not resolve to a real record in your organization for type ${requirementType}`]);
  }

  const existing = await repo.listRequirements(actor.organizationId, policyId);
  const requirement = await repo.addRequirement({
    requirementId: newId("requirement"), policyId, organizationId: actor.organizationId, requirementType,
    targetReference: input.targetReference ?? null, configuration: input.configuration ?? {}, required: input.required !== false, sequence: existing.length + 1,
  });
  await repo.touchUpdatedAt(actor.organizationId, policyId);
  await audit(actor, "completion_policy.requirement_added", policyId, null, { requirementType, targetReference: input.targetReference ?? null, required: requirement.required });
  return requirement;
}

export async function removeRequirement(actor: PolicyActor, policyId: string, requirementId: string) {
  const policy = await repo.findById(actor.organizationId, policyId);
  if (!policy) throw new PolicyNotFoundError();
  if (policy.status !== "DRAFT") throw new PolicyNotEditableError();
  await repo.removeRequirement(actor.organizationId, policyId, requirementId);
  await repo.touchUpdatedAt(actor.organizationId, policyId);
  await audit(actor, "completion_policy.requirement_removed", policyId, { requirementId }, null);
}

// Step 27/28: validate before activation. My chosen (brief-preferred)
// rule: reject activation outright if any REQUIRED requirement's type
// cannot currently be verified (ASSESSMENT/REFLECTION/PRACTICE today) —
// an institutional policy must never promise a gate it cannot actually
// enforce. Draft policies may still contain such requirements while
// being iterated on; only activation is blocked.
export async function activatePolicy(actor: PolicyActor, policyId: string, expectedRevision: number) {
  const policy = await repo.findById(actor.organizationId, policyId);
  if (!policy) throw new PolicyNotFoundError();
  if (policy.status !== "DRAFT") throw new PolicyActivationError(["policy is not in DRAFT status"]);
  const requirements = await repo.listRequirements(actor.organizationId, policyId);
  if (requirements.length === 0) throw new PolicyActivationError(["policy has no requirements"]);

  const issues: string[] = [];
  for (const req of requirements) {
    const entry = REQUIREMENT_REGISTRY[req.requirementType];
    if (req.required && !entry.canVerify) {
      issues.push(`required requirement "${req.requirementType}" has no authoritative verification domain yet (${entry.unavailableReason})`);
    }
    if (req.required && req.requirementType === "ASSESSMENT") {
      const threshold = Number((req.configuration as any)?.passThresholdPercent);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
        issues.push(`required requirement "ASSESSMENT" must configure passThresholdPercent between 0 and 100`);
      }
    }
    if (req.targetReference && !(await targetReferenceExists(actor.organizationId, req.requirementType, req.targetReference))) {
      issues.push(`requirement "${req.requirementType}" targetReference no longer resolves`);
    }
  }
  if (issues.length) throw new PolicyActivationError(issues);

  const activated = await repo.activate(actor.organizationId, policyId, expectedRevision, actor.userId);
  if (!activated) throw new PolicyStaleRevisionError();
  await audit(actor, "completion_policy.activated", policyId, { status: "DRAFT" }, { status: "ACTIVE" });
  return activated;
}

export async function retirePolicy(actor: PolicyActor, policyId: string, expectedRevision: number) {
  const policy = await repo.findById(actor.organizationId, policyId);
  if (!policy) throw new PolicyNotFoundError();
  const retired = await repo.retire(actor.organizationId, policyId, expectedRevision);
  if (!retired) throw new PolicyStaleRevisionError();
  await audit(actor, "completion_policy.retired", policyId, { status: "ACTIVE" }, { status: "RETIRED" });
  return retired;
}

export { CurriculumBindingError };
