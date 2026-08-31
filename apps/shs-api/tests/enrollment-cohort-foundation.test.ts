import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EnrollmentService, LearningDomainError } from "../src/domain/enrollments/service/enrollment-service.ts";

const migration = readFileSync(new URL("../migrations/041_learning_enrollment_cohorts.sql", import.meta.url), "utf8");

const admin = {
  user_id: "admin-a",
  organization_id: "org-a",
  active_organization_id: "org-a",
  tenant_id: "tenant:org-a",
  roles: ["org_admin"],
  permissions: ["cohort.view", "cohort.manage", "enrollment.view", "enrollment.manage"],
};
const adminB = { ...admin, user_id: "admin-b", organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" };
const student = { user_id: "learner-a", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", roles: ["student"], permissions: ["cohort.view", "enrollment.view"] };
const otherStudent = { ...student, user_id: "other-learner-a" };
const instructor = { user_id: "instructor-a", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", roles: ["instructor"], permissions: ["cohort.view", "enrollment.view"] };
const unauthorizedInstructor = { ...instructor, user_id: "instructor-unassigned-a" };

function now(offset = 0) {
  return new Date(Date.UTC(2026, 0, 1 + offset, 12, 0, 0)).toISOString();
}

class FakeRepo {
  users = new Map([
    ["admin-a", "org-a"],
    ["admin-b", "org-b"],
    ["learner-a", "org-a"],
    ["other-learner-a", "org-a"],
    ["learner-b", "org-b"],
    ["instructor-a", "org-a"],
    ["instructor-unassigned-a", "org-a"],
  ]);
  programs = new Map([
    ["program-a", "org-a"],
    ["program-a2", "org-a"],
    ["program-b", "org-b"],
  ]);
  cohorts = new Map<string, any>();
  enrollments = new Map<string, any>();
  staff = new Set<string>();

  async userExistsInOrganization(userId: string, organizationId: string) {
    return this.users.get(userId) === organizationId;
  }

  async programExistsInOrganization(programId: string, organizationId: string) {
    return this.programs.get(programId) === organizationId;
  }

  async createCohort(input: any) {
    const record = {
      cohortId: input.cohortId,
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      programId: input.programId,
      name: input.name,
      description: input.description,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdByUserId: input.createdByUserId,
      createdAt: now(),
      updatedAt: now(),
      version: 1,
    };
    this.cohorts.set(record.cohortId, record);
    return record;
  }

  async getCohortById(cohortId: string) {
    return this.cohorts.get(cohortId) || null;
  }

  async updateCohort(cohortId: string, organizationId: string, input: any) {
    const current = this.cohorts.get(cohortId);
    if (!current || current.organizationId !== organizationId) return null;
    const updated = { ...current, ...Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)), updatedAt: now(1), version: current.version + 1 };
    this.cohorts.set(cohortId, updated);
    return updated;
  }

  async createEnrollment(input: any) {
    for (const existing of this.enrollments.values()) {
      if (existing.organizationId === input.organizationId &&
          existing.learnerUserId === input.learnerUserId &&
          existing.programId === input.programId &&
          ["PENDING", "ACTIVE"].includes(existing.status)) {
        throw new LearningDomainError("DUPLICATE_ACTIVE_ENROLLMENT", "Active enrollment already exists.", 409);
      }
    }
    const record = {
      enrollmentId: input.enrollmentId,
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      learnerUserId: input.learnerUserId,
      programId: input.programId,
      cohortId: input.cohortId,
      status: input.status,
      enrolledAt: input.enrolledAt,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdByUserId: input.createdByUserId,
      updatedByUserId: input.createdByUserId,
      createdAt: now(),
      updatedAt: now(),
      version: 1,
    };
    this.enrollments.set(record.enrollmentId, record);
    return record;
  }

  async getEnrollmentById(enrollmentId: string) {
    return this.enrollments.get(enrollmentId) || null;
  }

  async listEnrollmentsForLearner(organizationId: string, learnerUserId: string) {
    return [...this.enrollments.values()].filter((row) => row.organizationId === organizationId && row.learnerUserId === learnerUserId);
  }

  async listActiveEnrollmentsForLearner(organizationId: string, learnerUserId: string) {
    return [...this.enrollments.values()].filter((row) => row.organizationId === organizationId && row.learnerUserId === learnerUserId && row.status === "ACTIVE");
  }

  async listEnrollmentsForCohort(organizationId: string, cohortId: string) {
    return [...this.enrollments.values()].filter((row) => row.organizationId === organizationId && row.cohortId === cohortId && ["PENDING", "ACTIVE", "COMPLETED"].includes(row.status));
  }

  async updateEnrollmentStatus(enrollmentId: string, organizationId: string, status: string, actorId: string, endsAt: string | null) {
    const current = this.enrollments.get(enrollmentId);
    if (!current || current.organizationId !== organizationId) return null;
    const updated = { ...current, status, endsAt, updatedByUserId: actorId, updatedAt: now(2), version: current.version + 1 };
    this.enrollments.set(enrollmentId, updated);
    return updated;
  }

  async updateEnrollmentCohort(enrollmentId: string, organizationId: string, cohortId: string | null, actorId: string) {
    const current = this.enrollments.get(enrollmentId);
    if (!current || current.organizationId !== organizationId) return null;
    const updated = { ...current, cohortId, updatedByUserId: actorId, updatedAt: now(2), version: current.version + 1 };
    this.enrollments.set(enrollmentId, updated);
    return updated;
  }

  async addCohortStaff(input: any) {
    this.staff.add(`${input.organizationId}:${input.cohortId}:${input.userId}`);
    return { ...input, cohortStaffId: input.cohortStaffId, status: "ACTIVE", createdAt: now(), updatedAt: now() };
  }

  async isActiveCohortStaff(organizationId: string, cohortId: string, userId: string) {
    return this.staff.has(`${organizationId}:${cohortId}:${userId}`);
  }
}

async function fixture() {
  const repo = new FakeRepo();
  const service = new EnrollmentService(repo as any);
  const cohort = await service.createCohort(admin, { programId: "program-a", name: "Foundations A", startsAt: now(), endsAt: now(90), organization_id: "org-b" });
  const enrollment = await service.createEnrollment(admin, { learnerUserId: "learner-a", programId: "program-a", cohortId: cohort.cohortId, startsAt: now(), organization_id: "org-b" });
  return { repo, service, cohort, enrollment };
}

test("migration creates canonical tables and anti-drift constraints", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS cohorts/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS enrollments/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS cohort_staff/);
  assert.match(migration, /cohorts_program_same_org_fk/);
  assert.match(migration, /enrollments_learner_same_org_fk/);
  assert.match(migration, /enrollments_program_same_org_fk/);
  assert.match(migration, /enrollments_cohort_same_org_fk/);
  assert.match(migration, /enrollments_active_program_idx/);
  assert.doesNotMatch(migration, /team_id/);
});

test("admin can create cohort in own organization and client organization_id is ignored", async () => {
  const { cohort } = await fixture();
  assert.equal(cohort.organizationId, "org-a");
  assert.equal(cohort.tenantId, "tenant:org-a");
});

test("cannot create cohort for another organization's program", async () => {
  const service = new EnrollmentService(new FakeRepo() as any);
  await assert.rejects(
    service.createCohort(admin, { programId: "program-b", name: "Bad", startsAt: now() }),
    (error: any) => error.code === "PROGRAM_NOT_FOUND"
  );
});

test("invalid cohort dates are rejected", async () => {
  const service = new EnrollmentService(new FakeRepo() as any);
  await assert.rejects(
    service.createCohort(admin, { programId: "program-a", name: "Bad", startsAt: now(2), endsAt: now(1) }),
    (error: any) => error.code === "VALIDATION_ERROR"
  );
});

test("direct-id cross-org cohort read returns null", async () => {
  const { service, cohort } = await fixture();
  assert.equal(await service.getCohort(adminB, cohort.cohortId), null);
});

test("admin can enroll learner in valid program", async () => {
  const { enrollment } = await fixture();
  assert.equal(enrollment.organizationId, "org-a");
  assert.equal(enrollment.status, "ACTIVE");
});

test("learner organization mismatch is rejected", async () => {
  const service = new EnrollmentService(new FakeRepo() as any);
  await assert.rejects(
    service.createEnrollment(admin, { learnerUserId: "learner-b", programId: "program-a", startsAt: now() }),
    (error: any) => error.code === "LEARNER_NOT_FOUND"
  );
});

test("cohort organization mismatch is rejected", async () => {
  const repo = new FakeRepo();
  const service = new EnrollmentService(repo as any);
  const other = await service.createCohort(adminB, { programId: "program-b", name: "Other", startsAt: now() });
  await assert.rejects(
    service.createEnrollment(admin, { learnerUserId: "learner-a", programId: "program-a", cohortId: other.cohortId, startsAt: now() }),
    (error: any) => error.code === "COHORT_NOT_FOUND"
  );
});

test("cohort program mismatch is rejected", async () => {
  const repo = new FakeRepo();
  const service = new EnrollmentService(repo as any);
  const cohort = await service.createCohort(admin, { programId: "program-a2", name: "Other Program", startsAt: now() });
  await assert.rejects(
    service.createEnrollment(admin, { learnerUserId: "learner-a", programId: "program-a", cohortId: cohort.cohortId, startsAt: now() }),
    (error: any) => error.code === "COHORT_PROGRAM_MISMATCH"
  );
});

test("student can read own enrollment", async () => {
  const { service, enrollment } = await fixture();
  const result = await service.getEnrollment(student, enrollment.enrollmentId);
  assert.equal(result?.enrollmentId, enrollment.enrollmentId);
});

test("student cannot read another learner's enrollment", async () => {
  const { service, enrollment } = await fixture();
  assert.equal(await service.getEnrollment(otherStudent, enrollment.enrollmentId), null);
});

test("student cannot read another organization's enrollment", async () => {
  const { service, enrollment } = await fixture();
  assert.equal(await service.getEnrollment({ ...student, organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }, enrollment.enrollmentId), null);
});

test("instructor cannot see unauthorized roster", async () => {
  const { service, cohort } = await fixture();
  await assert.rejects(service.listRoster(unauthorizedInstructor, cohort.cohortId), (error: any) => error.code === "FORBIDDEN");
});

test("authorized instructor can see roster derived from enrollments", async () => {
  const { service, cohort, enrollment } = await fixture();
  await service.addCohortStaff(admin, cohort.cohortId, { userId: "instructor-a", role: "INSTRUCTOR" });
  const roster = await service.listRoster(instructor, cohort.cohortId);
  assert.deepEqual(roster.map((row) => row.enrollmentId), [enrollment.enrollmentId]);
});

test("admin cannot cross organization by direct id", async () => {
  const { service, enrollment } = await fixture();
  assert.equal(await service.getEnrollment(adminB, enrollment.enrollmentId), null);
});

test("direct-id access cannot bypass entitlement", async () => {
  const { service, enrollment } = await fixture();
  assert.equal(await service.getEnrollment(unauthorizedInstructor, enrollment.enrollmentId), null);
});

test("invalid lifecycle transition is rejected", async () => {
  const { service, enrollment } = await fixture();
  const completed = await service.transitionEnrollment(admin, enrollment.enrollmentId, "COMPLETED");
  assert.equal(completed.status, "COMPLETED");
  await assert.rejects(service.transitionEnrollment(admin, enrollment.enrollmentId, "ACTIVE"), (error: any) => error.code === "INVALID_LIFECYCLE_TRANSITION");
});

test("re-enrollment preserves history after terminal status but blocks concurrent duplicates", async () => {
  const { service, enrollment } = await fixture();
  await assert.rejects(
    service.createEnrollment(admin, { learnerUserId: "learner-a", programId: "program-a", startsAt: now() }),
    (error: any) => error.code === "DUPLICATE_ACTIVE_ENROLLMENT"
  );
  await service.transitionEnrollment(admin, enrollment.enrollmentId, "WITHDRAWN");
  const next = await service.createEnrollment(admin, { learnerUserId: "learner-a", programId: "program-a", startsAt: now(10) });
  assert.notEqual(next.enrollmentId, enrollment.enrollmentId);
});

test("client-supplied organization_id cannot expand access", async () => {
  const { enrollment } = await fixture();
  assert.equal(enrollment.organizationId, "org-a");
});

test("unknown IDs fail safely", async () => {
  const service = new EnrollmentService(new FakeRepo() as any);
  assert.equal(await service.getEnrollment(student, "missing"), null);
  assert.equal(await service.getCohort(student, "missing"), null);
});

test("permission denial returns forbidden domain status", async () => {
  const service = new EnrollmentService(new FakeRepo() as any);
  await assert.rejects(
    service.createEnrollment(student, { learnerUserId: "learner-a", programId: "program-a", startsAt: now() }),
    (error: any) => error.code === "FORBIDDEN" && error.statusCode === 403
  );
});

test("downstream enrollment contract answers active program and cohort questions", async () => {
  const { service, cohort } = await fixture();
  assert.equal(await service.isLearnerActivelyEnrolledInProgram(student, "program-a"), true);
  assert.equal(await service.isLearnerActivelyEnrolledInCohort(student, cohort.cohortId), true);
  assert.equal(await service.isLearnerActivelyEnrolledInProgram(student, "program-a2"), false);
});
