export const COHORT_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
export type CohortStatus = typeof COHORT_STATUSES[number];

export const ENROLLMENT_STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "WITHDRAWN", "CANCELLED"] as const;
export type EnrollmentStatus = typeof ENROLLMENT_STATUSES[number];

export const COHORT_STAFF_ROLES = ["INSTRUCTOR", "ADMINISTRATOR"] as const;
export type CohortStaffRole = typeof COHORT_STAFF_ROLES[number];

export interface Cohort {
  cohortId: string;
  organizationId: string;
  tenantId: string;
  programId: string;
  name: string;
  description: string | null;
  status: CohortStatus;
  startsAt: string;
  endsAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Enrollment {
  enrollmentId: string;
  organizationId: string;
  tenantId: string;
  learnerUserId: string;
  programId: string;
  cohortId: string | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  startsAt: string;
  endsAt: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CohortStaff {
  cohortStaffId: string;
  organizationId: string;
  tenantId: string;
  cohortId: string;
  userId: string;
  role: CohortStaffRole;
  status: "ACTIVE" | "INACTIVE";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}
