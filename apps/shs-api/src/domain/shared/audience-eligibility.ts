// SHF Ecosystem Phase 4 — shared audience/eligibility primitives for
// Career Events and Opportunities. Both domains use the identical
// ORGANIZATION/PROGRAM/COHORT audience shape (see live-learning-service.ts
// for the precedent this mirrors), so the eligibility check is centralized
// here instead of duplicated per-domain. This does not replace canonical
// Enrollment/Cohort ownership — it only reads it.
import { EnrollmentRepo } from "../enrollments/repo/enrollment-repo.js";

export const ADMIN_TIER_ROLES = ["shf_admin", "shs_admin", "org_admin", "super_admin", "program_manager"];

const enrollmentRepo = new EnrollmentRepo();

export function isAdminTier(roles: string[]): boolean {
  return roles.some((role) => ADMIN_TIER_ROLES.includes(role));
}

export function isStudentOnly(roles: string[]): boolean {
  return roles.includes("student") && !roles.includes("instructor") && !isAdminTier(roles);
}

export type AudienceScope = "ORGANIZATION" | "PROGRAM" | "COHORT";

export interface AudienceScopedRecord {
  organizationId: string;
  audienceScope: AudienceScope;
  programId: string | null;
  cohortId: string | null;
  createdByUserId: string;
}

export interface EligibilityActor {
  user_id: string;
  organization_id: string;
  roles: string[];
}

/** Institutional visibility only — callers still apply their own
 * lifecycle-status rules (DRAFT/CANCELLED/etc.) on top of this. */
export async function isEligibleForAudience(actor: EligibilityActor, record: AudienceScopedRecord): Promise<boolean> {
  if (record.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  if (record.audienceScope === "ORGANIZATION") return true;
  const active = await enrollmentRepo.listActiveEnrollmentsForLearner(actor.organization_id, actor.user_id);
  if (record.audienceScope === "PROGRAM") return active.some((e) => e.programId === record.programId);
  if (record.audienceScope === "COHORT") return active.some((e) => e.cohortId === record.cohortId);
  return false;
}

export async function canManageAudienceScopedRecord(actor: EligibilityActor, record: AudienceScopedRecord): Promise<boolean> {
  if (record.organizationId !== actor.organization_id) return false;
  if (isAdminTier(actor.roles)) return true;
  if (record.createdByUserId === actor.user_id) return true;
  if (record.audienceScope === "COHORT" && record.cohortId) {
    return enrollmentRepo.isActiveCohortStaff(actor.organization_id, record.cohortId, actor.user_id);
  }
  return false;
}

export class AudienceScopeError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "AudienceScopeError";
  }
}

/** Validates a create request's audience target server-side. Cross-org
 * program/cohort references, archived/inactive targets, and unauthorized
 * non-admin scheduling are all rejected here before any row is written. */
export async function validateAudienceScopeForCreate(
  actor: EligibilityActor,
  input: { audienceScope: AudienceScope; programId?: string | null; cohortId?: string | null },
): Promise<void> {
  if (input.audienceScope === "ORGANIZATION") {
    if (!isAdminTier(actor.roles)) {
      throw new AudienceScopeError("ORGANIZATION_SCOPE_REQUIRES_ADMIN", "Organization-wide scheduling requires an admin-tier role.", 403);
    }
    return;
  }
  if (input.audienceScope === "PROGRAM") {
    if (!input.programId) throw new AudienceScopeError("PROGRAM_REQUIRED", "programId is required for PROGRAM scope.", 400);
    if (!(await enrollmentRepo.programExistsInOrganization(input.programId, actor.organization_id))) {
      throw new AudienceScopeError("PROGRAM_NOT_FOUND", "Program not found in organization.", 400);
    }
    if (!isAdminTier(actor.roles)) {
      throw new AudienceScopeError("PROGRAM_SCOPE_REQUIRES_ADMIN", "Program-wide scheduling requires an admin or program manager role.", 403);
    }
    return;
  }
  if (input.audienceScope === "COHORT") {
    if (!input.cohortId) throw new AudienceScopeError("COHORT_REQUIRED", "cohortId is required for COHORT scope.", 400);
    const cohort = await enrollmentRepo.getCohortById(input.cohortId);
    if (!cohort || cohort.organizationId !== actor.organization_id) {
      throw new AudienceScopeError("COHORT_NOT_FOUND", "Cohort not found in organization.", 400);
    }
    if (cohort.status !== "ACTIVE") {
      throw new AudienceScopeError("COHORT_INACTIVE", "Scheduling requires an ACTIVE cohort.", 400);
    }
    if (!isAdminTier(actor.roles) && !(await enrollmentRepo.isActiveCohortStaff(actor.organization_id, input.cohortId, actor.user_id))) {
      throw new AudienceScopeError("COHORT_STAFF_REQUIRED", "Instructor must be active cohort staff to schedule for this cohort.", 403);
    }
    return;
  }
  throw new AudienceScopeError("INVALID_AUDIENCE_SCOPE", "Unsupported audience scope.", 400);
}
