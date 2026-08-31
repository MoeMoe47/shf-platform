import { randomUUID } from "crypto";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import type { Cohort, CohortStaff, CohortStaffRole, CohortStatus, Enrollment, EnrollmentStatus } from "../model/enrollment.js";
import { COHORT_STAFF_ROLES, COHORT_STATUSES, ENROLLMENT_STATUSES } from "../model/enrollment.js";
import { EnrollmentRepo } from "../repo/enrollment-repo.js";

export type LearningActor = {
  user_id?: string;
  id?: string;
  organization_id?: string;
  active_organization_id?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[];
};

const ADMIN_ROLES = new Set(["super_admin", "shs_admin", "shf_admin", "org_admin", "program_manager"]);
const ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  PENDING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "WITHDRAWN"],
  COMPLETED: [],
  WITHDRAWN: [],
  CANCELLED: [],
};
const COHORT_TRANSITIONS: Record<CohortStatus, CohortStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export class LearningDomainError extends Error {
  constructor(public code: string, message = code, public statusCode = 400) {
    super(message);
    this.name = "LearningDomainError";
  }
}

export class EnrollmentService {
  constructor(private repo = new EnrollmentRepo()) {}

  private scope(actor: LearningActor) {
    const userId = String(actor.user_id || actor.id || "");
    const organizationId = String(actor.active_organization_id || actor.organization_id || "");
    const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
    if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) {
      throw new LearningDomainError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
    }
    return { userId, organizationId, tenantId };
  }

  private has(actor: LearningActor, permission: string) {
    return hasPermission(actor.permissions || [], permission);
  }

  private isAdmin(actor: LearningActor) {
    return Boolean(actor.roles?.some((role) => ADMIN_ROLES.has(role))) ||
      this.has(actor, SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE) ||
      this.has(actor, SHS_SECURITY_PERMISSIONS.COHORT_MANAGE);
  }

  private requireManage(actor: LearningActor, permission: string) {
    if (!this.has(actor, permission)) {
      throw new LearningDomainError("FORBIDDEN", `Missing permission: ${permission}`, 403);
    }
  }

  private parseStatus<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
    if (!allowed.includes(value as T)) throw new LearningDomainError("VALIDATION_ERROR", `${field} must be one of: ${allowed.join(", ")}`);
    return value as T;
  }

  private assertValidDateRange(startsAt: string, endsAt?: string | null) {
    if (Number.isNaN(Date.parse(startsAt))) throw new LearningDomainError("VALIDATION_ERROR", "startsAt must be a valid ISO timestamp.");
    if (endsAt != null && Number.isNaN(Date.parse(endsAt))) throw new LearningDomainError("VALIDATION_ERROR", "endsAt must be a valid ISO timestamp.");
    if (endsAt != null && Date.parse(endsAt) < Date.parse(startsAt)) {
      throw new LearningDomainError("VALIDATION_ERROR", "endsAt must be greater than or equal to startsAt.");
    }
  }

  private async requireProgram(programId: string, organizationId: string) {
    if (!programId) throw new LearningDomainError("VALIDATION_ERROR", "programId is required.");
    if (!(await this.repo.programExistsInOrganization(programId, organizationId))) {
      throw new LearningDomainError("PROGRAM_NOT_FOUND", "Program not found.", 404);
    }
  }

  private async requireLearner(learnerUserId: string, organizationId: string) {
    if (!learnerUserId) throw new LearningDomainError("VALIDATION_ERROR", "learnerUserId is required.");
    if (!(await this.repo.userExistsInOrganization(learnerUserId, organizationId))) {
      throw new LearningDomainError("LEARNER_NOT_FOUND", "Learner not found in organization.", 404);
    }
  }

  private async requireCohort(cohortId: string, organizationId: string, programId?: string): Promise<Cohort> {
    const cohort = await this.repo.getCohortById(cohortId);
    if (!cohort || cohort.organizationId !== organizationId) {
      throw new LearningDomainError("COHORT_NOT_FOUND", "Cohort not found.", 404);
    }
    if (programId && cohort.programId !== programId) {
      throw new LearningDomainError("COHORT_PROGRAM_MISMATCH", "Cohort must belong to the enrollment program.");
    }
    return cohort;
  }

  async createCohort(actor: LearningActor, input: any): Promise<Cohort> {
    this.requireManage(actor, SHS_SECURITY_PERMISSIONS.COHORT_MANAGE);
    const scope = this.scope(actor);
    const status = this.parseStatus(input?.status || "DRAFT", COHORT_STATUSES, "status");
    const name = String(input?.name || "").trim();
    if (!name) throw new LearningDomainError("VALIDATION_ERROR", "name is required.");
    const startsAt = String(input?.startsAt || input?.starts_at || "");
    const endsAt = input?.endsAt ?? input?.ends_at ?? null;
    this.assertValidDateRange(startsAt, endsAt);
    await this.requireProgram(String(input?.programId || input?.program_id || ""), scope.organizationId);

    return this.repo.createCohort({
      cohortId: `cohort_${randomUUID()}`,
      organizationId: scope.organizationId,
      tenantId: scope.tenantId,
      programId: String(input.programId || input.program_id),
      name,
      description: input.description == null ? null : String(input.description),
      status,
      startsAt,
      endsAt,
      createdByUserId: scope.userId,
    });
  }

  async updateCohort(actor: LearningActor, cohortId: string, input: any): Promise<Cohort> {
    this.requireManage(actor, SHS_SECURITY_PERMISSIONS.COHORT_MANAGE);
    const scope = this.scope(actor);
    const current = await this.requireCohort(cohortId, scope.organizationId);
    const status = input?.status == null ? undefined : this.parseStatus(input.status, COHORT_STATUSES, "status");
    if (status && status !== current.status && !COHORT_TRANSITIONS[current.status].includes(status)) {
      throw new LearningDomainError("INVALID_LIFECYCLE_TRANSITION", `Invalid cohort transition: ${current.status} -> ${status}`, 409);
    }
    const startsAt = input?.startsAt ?? current.startsAt;
    const endsAt = input?.endsAt === undefined ? current.endsAt : input.endsAt;
    this.assertValidDateRange(startsAt, endsAt);
    const updated = await this.repo.updateCohort(cohortId, scope.organizationId, {
      name: input?.name == null ? undefined : String(input.name).trim(),
      description: input?.description,
      status,
      startsAt,
      endsAt,
    });
    if (!updated) throw new LearningDomainError("COHORT_NOT_FOUND", "Cohort not found.", 404);
    return updated;
  }

  async getCohort(actor: LearningActor, cohortId: string): Promise<Cohort | null> {
    const scope = this.scope(actor);
    const cohort = await this.repo.getCohortById(cohortId);
    if (!cohort || cohort.organizationId !== scope.organizationId) return null;
    if (this.isAdmin(actor)) return cohort;
    if (await this.repo.isActiveCohortStaff(scope.organizationId, cohortId, scope.userId)) return cohort;
    const own = await this.repo.listEnrollmentsForLearner(scope.organizationId, scope.userId);
    return own.some((enrollment) => enrollment.cohortId === cohortId) ? cohort : null;
  }

  async addCohortStaff(actor: LearningActor, cohortId: string, input: any): Promise<CohortStaff> {
    this.requireManage(actor, SHS_SECURITY_PERMISSIONS.COHORT_MANAGE);
    const scope = this.scope(actor);
    await this.requireCohort(cohortId, scope.organizationId);
    const userId = String(input?.userId || input?.user_id || "");
    if (!(await this.repo.userExistsInOrganization(userId, scope.organizationId))) {
      throw new LearningDomainError("STAFF_NOT_FOUND", "Staff user not found in organization.", 404);
    }
    const role = this.parseStatus(input?.role || "INSTRUCTOR", COHORT_STAFF_ROLES, "role") as CohortStaffRole;
    return this.repo.addCohortStaff({
      cohortStaffId: `cstaff_${randomUUID()}`,
      organizationId: scope.organizationId,
      tenantId: scope.tenantId,
      cohortId,
      userId,
      role,
      createdByUserId: scope.userId,
    });
  }

  async createEnrollment(actor: LearningActor, input: any): Promise<Enrollment> {
    this.requireManage(actor, SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE);
    const scope = this.scope(actor);
    const programId = String(input?.programId || input?.program_id || "");
    const learnerUserId = String(input?.learnerUserId || input?.learner_user_id || input?.learnerId || input?.learner_id || "");
    const status = this.parseStatus(input?.status || "ACTIVE", ENROLLMENT_STATUSES, "status");
    if (!["PENDING", "ACTIVE"].includes(status)) {
      throw new LearningDomainError("VALIDATION_ERROR", "New enrollments may only start as PENDING or ACTIVE.");
    }
    const startsAt = String(input?.startsAt || input?.starts_at || input?.enrolledAt || input?.enrolled_at || new Date().toISOString());
    const endsAt = input?.endsAt ?? input?.ends_at ?? null;
    const enrolledAt = String(input?.enrolledAt || input?.enrolled_at || new Date().toISOString());
    this.assertValidDateRange(startsAt, endsAt);
    if (Number.isNaN(Date.parse(enrolledAt))) throw new LearningDomainError("VALIDATION_ERROR", "enrolledAt must be a valid ISO timestamp.");
    await this.requireLearner(learnerUserId, scope.organizationId);
    await this.requireProgram(programId, scope.organizationId);
    const cohortId = input?.cohortId || input?.cohort_id || null;
    if (cohortId) await this.requireCohort(String(cohortId), scope.organizationId, programId);

    return this.repo.createEnrollment({
      enrollmentId: `enr_${randomUUID()}`,
      organizationId: scope.organizationId,
      tenantId: scope.tenantId,
      learnerUserId,
      programId,
      cohortId,
      status,
      enrolledAt,
      startsAt,
      endsAt,
      createdByUserId: scope.userId,
    });
  }

  async getEnrollment(actor: LearningActor, enrollmentId: string): Promise<Enrollment | null> {
    const scope = this.scope(actor);
    const enrollment = await this.repo.getEnrollmentById(enrollmentId);
    if (!enrollment || enrollment.organizationId !== scope.organizationId) return null;
    if (this.isAdmin(actor)) return enrollment;
    if (enrollment.learnerUserId === scope.userId) return enrollment;
    if (enrollment.cohortId && await this.repo.isActiveCohortStaff(scope.organizationId, enrollment.cohortId, scope.userId)) return enrollment;
    return null;
  }

  async listMyEnrollments(actor: LearningActor): Promise<Enrollment[]> {
    const scope = this.scope(actor);
    return this.repo.listEnrollmentsForLearner(scope.organizationId, scope.userId);
  }

  async listActiveEnrollmentsForLearner(actor: LearningActor, learnerUserId?: string): Promise<Enrollment[]> {
    const scope = this.scope(actor);
    const target = learnerUserId || scope.userId;
    if (target !== scope.userId && !this.isAdmin(actor)) throw new LearningDomainError("FORBIDDEN", "Cannot inspect another learner.", 403);
    return this.repo.listActiveEnrollmentsForLearner(scope.organizationId, target);
  }

  async isLearnerActivelyEnrolledInProgram(actor: LearningActor, programId: string, learnerUserId?: string): Promise<boolean> {
    const enrollments = await this.listActiveEnrollmentsForLearner(actor, learnerUserId);
    return enrollments.some((enrollment) => enrollment.programId === programId);
  }

  async isLearnerActivelyEnrolledInCohort(actor: LearningActor, cohortId: string, learnerUserId?: string): Promise<boolean> {
    const enrollments = await this.listActiveEnrollmentsForLearner(actor, learnerUserId);
    return enrollments.some((enrollment) => enrollment.cohortId === cohortId);
  }

  async listRoster(actor: LearningActor, cohortId: string): Promise<Enrollment[]> {
    const scope = this.scope(actor);
    await this.requireCohort(cohortId, scope.organizationId);
    if (!this.isAdmin(actor) && !(await this.repo.isActiveCohortStaff(scope.organizationId, cohortId, scope.userId))) {
      throw new LearningDomainError("FORBIDDEN", "Cohort staff authorization required.", 403);
    }
    return this.repo.listEnrollmentsForCohort(scope.organizationId, cohortId);
  }

  async transitionEnrollment(actor: LearningActor, enrollmentId: string, statusValue: string): Promise<Enrollment> {
    this.requireManage(actor, SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE);
    const scope = this.scope(actor);
    const current = await this.repo.getEnrollmentById(enrollmentId);
    if (!current || current.organizationId !== scope.organizationId) {
      throw new LearningDomainError("ENROLLMENT_NOT_FOUND", "Enrollment not found.", 404);
    }
    const status = this.parseStatus(statusValue, ENROLLMENT_STATUSES, "status");
    if (!ENROLLMENT_TRANSITIONS[current.status].includes(status)) {
      throw new LearningDomainError("INVALID_LIFECYCLE_TRANSITION", `Invalid enrollment transition: ${current.status} -> ${status}`, 409);
    }
    const endsAt = ["COMPLETED", "WITHDRAWN", "CANCELLED"].includes(status) ? new Date().toISOString() : current.endsAt;
    const updated = await this.repo.updateEnrollmentStatus(enrollmentId, scope.organizationId, status, scope.userId, endsAt);
    if (!updated) throw new LearningDomainError("ENROLLMENT_NOT_FOUND", "Enrollment not found.", 404);
    return updated;
  }

  async assignEnrollmentCohort(actor: LearningActor, enrollmentId: string, cohortId: string | null): Promise<Enrollment> {
    this.requireManage(actor, SHS_SECURITY_PERMISSIONS.ENROLLMENT_MANAGE);
    const scope = this.scope(actor);
    const current = await this.repo.getEnrollmentById(enrollmentId);
    if (!current || current.organizationId !== scope.organizationId) {
      throw new LearningDomainError("ENROLLMENT_NOT_FOUND", "Enrollment not found.", 404);
    }
    if (cohortId) await this.requireCohort(cohortId, scope.organizationId, current.programId);
    const updated = await this.repo.updateEnrollmentCohort(enrollmentId, scope.organizationId, cohortId, scope.userId);
    if (!updated) throw new LearningDomainError("ENROLLMENT_NOT_FOUND", "Enrollment not found.", 404);
    return updated;
  }
}
