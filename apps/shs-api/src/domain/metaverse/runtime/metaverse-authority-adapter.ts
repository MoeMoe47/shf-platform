import { EnrollmentRepo } from "../../enrollments/repo/enrollment-repo.js";
import type { CanonicalLearnerUnlockContext } from "../unlocks/unlock-contract.js";
import type { MetaverseEligibilityFacts } from "../unlocks/unlock-requirements.js";

export type MetaverseRuntimeAuthority = {
  context: CanonicalLearnerUnlockContext;
  facts: MetaverseEligibilityFacts;
  activeMembership: any | null;
};

function compact(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => compact(item)).filter(Boolean))) as string[];
}

function activeMembershipFor(user: any, organizationId: string) {
  const memberships = Array.isArray(user?.memberships) ? user.memberships : [];
  return memberships.find((item: any) => String(item?.organization_id || "") === organizationId) || null;
}

function membershipActive(user: any, membership: any) {
  const membershipStatus = String(membership?.status || user?.membership_status || "active").toLowerCase();
  const organizationStatus = String(membership?.organization_status || user?.organization_status || "active").toLowerCase();
  return membershipStatus === "active" && organizationStatus === "active";
}

function entitlements(user: any, membership: any): string[] {
  const supplied = user?.entitlement_summary?.items || user?.entitlements || membership?.entitlement_summary?.items || [];
  return Array.isArray(supplied)
    ? supplied
      .filter((item: any) => !item?.status || ["active", "ACTIVE", "enabled", "ENABLED"].includes(String(item.status)))
      .map((item: any) => item?.service_key || item?.serviceKey || item)
      .filter(Boolean)
      .map(String)
    : [];
}

function runtimeFactsFromServerContext(user: any) {
  return user?.metaverse_authority_facts || user?.metaverseAuthorityFacts || {};
}

export class MetaverseAuthorityAdapter {
  constructor(private enrollmentRepo = new EnrollmentRepo()) {}

  async resolve(user: any): Promise<MetaverseRuntimeAuthority> {
    const userId = compact(user?.user_id || user?.id);
    const organizationId = compact(user?.active_organization_id || user?.organization_id);
    const tenantId = user?.tenant_id === undefined ? null : compact(user?.tenant_id);
    const membership = organizationId ? activeMembershipFor(user, organizationId) : null;
    const activeMembership = Boolean(userId && organizationId && membershipActive(user, membership || user));
    const serverFacts = runtimeFactsFromServerContext(user);
    const enrollments = organizationId && userId
      ? await this.safeActiveEnrollments(organizationId, userId, serverFacts.enrollments)
      : [];

    const facts: MetaverseEligibilityFacts = {
      organization_id: organizationId || "",
      user_id: userId || "",
      active_membership: activeMembership,
      user_suspended: ["suspended", "revoked", "inactive"].includes(String(user?.status || "").toLowerCase()) || Boolean(serverFacts.user_suspended),
      organization_suspended: ["suspended", "revoked", "inactive"].includes(String(membership?.organization_status || user?.organization_status || "").toLowerCase()) || Boolean(serverFacts.organization_suspended),
      roles: strings(user?.organization_scoped_roles || user?.roles),
      permissions: strings(user?.organization_scoped_permissions || user?.permissions),
      service_entitlements: Array.from(new Set([...entitlements(user, membership), ...strings(serverFacts.service_entitlements)])),
      enrollments,
      cohorts: strings(serverFacts.cohorts || enrollments.map((item: any) => item.cohort_id || item.cohortId)),
      learning_paths: strings(serverFacts.learning_paths),
      course_progress: serverFacts.course_progress || {},
      completed_lessons: strings(serverFacts.completed_lessons),
      assignments: Array.isArray(serverFacts.assignments) ? serverFacts.assignments : [],
      assessments: Array.isArray(serverFacts.assessments) ? serverFacts.assessments : [],
      verified_evidence: strings(serverFacts.verified_evidence),
      outcomes: Array.isArray(serverFacts.outcomes) ? serverFacts.outcomes : [],
      credentials: Array.isArray(serverFacts.credentials) ? serverFacts.credentials : [],
      career_milestones: strings(serverFacts.career_milestones),
      teams: strings(serverFacts.teams),
      instructor_assignments: strings(serverFacts.instructor_assignments),
      civic_eligibilities: strings(serverFacts.civic_eligibilities),
      organization_policies: strings(serverFacts.organization_policies),
      closed_resources: strings(serverFacts.closed_resources),
    };

    return {
      activeMembership: membership,
      context: {
        user_id: userId,
        organization_id: organizationId,
        tenant_id: tenantId,
        roles: facts.roles || [],
        permissions: facts.permissions || [],
        active_membership: activeMembership,
        user_suspended: facts.user_suspended,
        organization_suspended: facts.organization_suspended,
      },
      facts,
    };
  }

  private async safeActiveEnrollments(organizationId: string, userId: string, fallback: any): Promise<Array<{ program_id: string; status: string; cohort_id?: string | null }>> {
    try {
      const rows = await this.enrollmentRepo.listActiveEnrollmentsForLearner(organizationId, userId);
      return rows.map((item) => ({ program_id: item.programId, status: item.status, cohort_id: item.cohortId }));
    } catch {
      if (!Array.isArray(fallback)) return [];
      return fallback.map((item: any) => ({
        program_id: String(item.program_id || item.programId || ""),
        status: String(item.status || ""),
        cohort_id: item.cohort_id || item.cohortId || null,
      })).filter((item: any) => item.program_id);
    }
  }
}
