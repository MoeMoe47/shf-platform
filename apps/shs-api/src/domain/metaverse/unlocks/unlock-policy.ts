import { METAVERSE_DISTRICT_IDS, SILICON_HEARTLAND_CITY_REGISTRY } from "../registry/city-registry.js";
import type { MetaverseAccessLevel, MetaverseResourceType } from "./unlock-contract.js";
import type { MetaverseRequirementGroup, MetaverseUnlockRequirement } from "./unlock-requirements.js";

export const METAVERSE_DISTRICT_POLICY_CATEGORIES = [
  "OPEN_CORE",
  "PROGRAM_GATED",
  "PATHWAY_GATED",
  "ROLE_GATED",
  "ACTIVITY_GATED",
] as const;

export type MetaverseDistrictPolicyCategory = (typeof METAVERSE_DISTRICT_POLICY_CATEGORIES)[number];

export const METAVERSE_DISTRICT_UNLOCK_POLICY = {
  [METAVERSE_DISTRICT_IDS.publicRealm]: { category: "OPEN_CORE", decision: "Authenticated organization members may see and enter orientation/public-realm navigation." },
  [METAVERSE_DISTRICT_IDS.studentLife]: { category: "OPEN_CORE", decision: "Authenticated organization members may see student-life navigation; social features remain MET-2B policy gated." },
  [METAVERSE_DISTRICT_IDS.learningArcade]: { category: "OPEN_CORE", decision: "Authenticated organization members may see arcade district; specific challenges may be curriculum gated." },
  [METAVERSE_DISTRICT_IDS.careerEducation]: { category: "OPEN_CORE", decision: "Authenticated organization members may see career/education district; pathway/facility depth may use curriculum/career facts." },
  [METAVERSE_DISTRICT_IDS.community]: { category: "ACTIVITY_GATED", decision: "District visibility is broad; program/service-learning activities may be cohort, program, or policy gated." },
  [METAVERSE_DISTRICT_IDS.technologyInnovation]: { category: "ACTIVITY_GATED", decision: "District visibility is broad; Studio/team/AI activities may be assignment/team/entitlement gated." },
  [METAVERSE_DISTRICT_IDS.dataCenter]: { category: "PATHWAY_GATED", decision: "District visibility is broad educational context; simulations/facilities require Data Center enrollment, lesson, assignment, or pathway facts." },
  [METAVERSE_DISTRICT_IDS.civic]: { category: "ROLE_GATED", decision: "District visibility is broad civic orientation; sessions/actions delegate to SHF Civic eligibility/state." },
  [METAVERSE_DISTRICT_IDS.treasuryCommerce]: { category: "ACTIVITY_GATED", decision: "Navigation is projection-only; any economy action remains blocked until canonical authority is resolved." },
} as const satisfies Record<string, { category: MetaverseDistrictPolicyCategory; decision: string }>;

const membershipRequirement: MetaverseUnlockRequirement = {
  id: "active-membership",
  type: "membership",
  authority: "identity-organization-membership",
  reason_code: "ROLE_ALLOWED",
  description: "Active canonical organization membership is required.",
  fact_key: "active_membership",
  expected: true,
};

const dataCenterEnrollmentRequirement: MetaverseUnlockRequirement = {
  id: "data-center-enrollment",
  type: "enrollment",
  authority: "enrollments-domain",
  reason_code: "ENROLLED",
  description: "Active enrollment in Data Center Foundations or related program.",
  fact_key: "enrollments.program_id",
  expected: "data-center-foundations",
  next_action: { next_action_type: "START_LESSON", next_action_resource_id: "data-center-foundations", next_action_label: "Start Data Center Foundations", route_reference: "/career.html#/pathways/data-center-ai-infrastructure" },
};

export function districtRequirementGroup(districtId: string): MetaverseRequirementGroup {
  const policy = METAVERSE_DISTRICT_UNLOCK_POLICY[districtId as keyof typeof METAVERSE_DISTRICT_UNLOCK_POLICY];
  if (!policy || policy.category === "OPEN_CORE" || policy.category === "ACTIVITY_GATED" || policy.category === "ROLE_GATED") {
    return { operator: "ALL_OF", requirements: [membershipRequirement] };
  }
  if (districtId === METAVERSE_DISTRICT_IDS.dataCenter) {
    return { operator: "ALL_OF", requirements: [membershipRequirement] };
  }
  return { operator: "ALL_OF", requirements: [membershipRequirement] };
}

export function facilityRequirementGroup(facilityId: string): MetaverseRequirementGroup {
  const facility = SILICON_HEARTLAND_CITY_REGISTRY.facilities.find((item) => item.id === facilityId);
  if (!facility) return { operator: "ALL_OF", requirements: [membershipRequirement] };
  if (facility.district_id === METAVERSE_DISTRICT_IDS.dataCenter && facilityId !== "data-center-training-lab") {
    return { operator: "ALL_OF", requirements: [membershipRequirement, dataCenterEnrollmentRequirement] };
  }
  if (facilityId === "data-center-training-lab") return { operator: "ALL_OF", requirements: [membershipRequirement] };
  return { operator: "ALL_OF", requirements: [membershipRequirement] };
}

export function activityRequirementGroup(resourceId: string, accessLevel: MetaverseAccessLevel): MetaverseRequirementGroup {
  const byResource: Record<string, MetaverseUnlockRequirement[]> = {
    "data-center-foundations-introduction": [
      membershipRequirement,
      dataCenterEnrollmentRequirement,
    ],
    "data-center-safety-simulation": [
      membershipRequirement,
      dataCenterEnrollmentRequirement,
      {
        id: "lesson-4-complete",
        type: "lesson_completion",
        authority: "curriculum-domain",
        reason_code: "LESSON_COMPLETE",
        description: "Complete Lesson 4 before entering the safety simulation.",
        fact_key: "completed_lessons",
        expected: "data-center-foundations-lesson-4",
        next_action: { next_action_type: "START_LESSON", next_action_resource_id: "data-center-foundations-lesson-4", next_action_label: "Complete Lesson 4", route_reference: "/curriculum.html#/curriculum/learning" },
      },
      {
        id: "safety-assessment-passed",
        type: "assessment_threshold",
        authority: "curriculum-assessment-domain",
        reason_code: "ASSESSMENT_PASSED",
        description: "Pass the safety assessment.",
        fact_key: "assessments",
        expected: "data-center-safety-assessment",
        next_action: { next_action_type: "COMPLETE_ASSESSMENT", next_action_resource_id: "data-center-safety-assessment", next_action_label: "Complete safety assessment", route_reference: "/curriculum.html#/curriculum/learning" },
      },
    ],
    "civic-council-session": [
      membershipRequirement,
      {
        id: "shf-civic-eligible",
        type: "civic_eligibility",
        authority: "shf-civic",
        reason_code: "CIVIC_ELIGIBLE",
        description: "SHF Civic eligibility/state permits this civic session.",
        fact_key: "civic_eligibilities",
        expected: "civic-council-session",
      },
    ],
    "capstone-project-room": [
      membershipRequirement,
      {
        id: "capstone-team-member",
        type: "team_membership",
        authority: "studio-team-domain",
        reason_code: "TEAM_MEMBER",
        description: "Active team membership is required.",
        fact_key: "teams",
        expected: "capstone-team",
        next_action: { next_action_type: "JOIN_TEAM", next_action_resource_id: "capstone-team", next_action_label: "Join assigned team", route_reference: "/curriculum.html#/studio" },
      },
    ],
    "data-center-technician-simulation": [
      membershipRequirement,
      dataCenterEnrollmentRequirement,
      {
        id: "pathway-milestone",
        type: "career_pathway_milestone",
        authority: "career-pathways-domain",
        reason_code: "CAREER_PATHWAY_ELIGIBLE",
        description: "Reach the Data Center pathway milestone.",
        fact_key: "career_milestones",
        expected: "data-center-technician-simulation-ready",
      },
    ],
    "credential-gated-lab": [
      membershipRequirement,
      {
        id: "credential-issued",
        type: "credential",
        authority: "credentials-domain",
        reason_code: "CREDENTIAL_VERIFIED",
        description: "Canonical credential fact must be active.",
        fact_key: "credentials",
        expected: "credential-data-center-safety",
      },
    ],
    "entitled-ai-agent-lab": [
      membershipRequirement,
      {
        id: "metaverse-ai-lab-entitled",
        type: "entitlement",
        authority: "service-catalog-entitlements",
        reason_code: "SERVICE_ENTITLED",
        description: "Organization service entitlement must enable this lab.",
        fact_key: "service_entitlements",
        expected: "metaverse-ai-lab",
      },
    ],
  };
  if (accessLevel === "SOCIAL_SPACE_ACCESS") {
    return { operator: "ALL_OF", requirements: [membershipRequirement] };
  }
  return { operator: "ALL_OF", requirements: byResource[resourceId] || [membershipRequirement] };
}

export function inferResourceType(accessLevel: MetaverseAccessLevel): MetaverseResourceType {
  if (accessLevel === "CITY_ACCESS") return "CITY";
  if (accessLevel === "DISTRICT_ACCESS") return "DISTRICT";
  if (accessLevel === "FACILITY_ACCESS") return "FACILITY";
  if (accessLevel === "SOCIAL_SPACE_ACCESS") return "SOCIAL_SPACE";
  if (accessLevel === "CIVIC_SESSION_ACCESS") return "CIVIC_SESSION";
  if (accessLevel === "JOB_SIMULATION_ACCESS") return "JOB_SIMULATION";
  if (accessLevel === "CAREER_EXPERIENCE_ACCESS") return "CAREER_EXPERIENCE";
  if (accessLevel === "SIMULATION_ACCESS") return "SIMULATION";
  return "ACTIVITY";
}
