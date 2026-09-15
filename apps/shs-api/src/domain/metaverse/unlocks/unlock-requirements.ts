import type { MetaverseNextActionProjection, MetaverseSourceFact, MetaverseUnlockReasonCode } from "./unlock-contract.js";

export const METAVERSE_REQUIREMENT_OPERATORS = ["ALL_OF", "ANY_OF", "NONE_OF"] as const;
export type MetaverseRequirementOperator = (typeof METAVERSE_REQUIREMENT_OPERATORS)[number];

export const METAVERSE_REQUIREMENT_TYPES = [
  "membership",
  "organization",
  "role",
  "entitlement",
  "enrollment",
  "cohort",
  "learning_path",
  "course_progress",
  "lesson_completion",
  "assignment",
  "assessment_threshold",
  "verified_evidence",
  "outcome",
  "credential",
  "career_pathway_milestone",
  "team_membership",
  "instructor_assignment",
  "civic_eligibility",
  "time_window",
  "organization_policy",
] as const;

export type MetaverseRequirementType = (typeof METAVERSE_REQUIREMENT_TYPES)[number];

export type MetaverseUnlockRequirement = {
  id: string;
  type: MetaverseRequirementType;
  authority: string;
  reason_code: MetaverseUnlockReasonCode;
  description: string;
  fact_key: string;
  expected?: unknown;
  next_action?: MetaverseNextActionProjection | null;
};

export type MetaverseRequirementGroup = {
  operator: MetaverseRequirementOperator;
  requirements: MetaverseUnlockRequirement[];
};

export type MetaverseEligibilityFacts = {
  organization_id: string;
  user_id: string;
  active_membership?: boolean;
  user_suspended?: boolean;
  organization_suspended?: boolean;
  roles?: string[];
  permissions?: string[];
  service_entitlements?: string[];
  enrollments?: Array<{ program_id: string; status: string; cohort_id?: string | null }>;
  cohorts?: string[];
  learning_paths?: string[];
  course_progress?: Record<string, number>;
  completed_lessons?: string[];
  assignments?: Array<{ assignment_id: string; status: string }>;
  assessments?: Array<{ assessment_id: string; passed: boolean; score?: number }>;
  verified_evidence?: string[];
  outcomes?: Array<{ outcome_id: string; type: string; status: string; verified?: boolean }>;
  credentials?: Array<{ credential_definition_id: string; lifecycle: "ISSUED" | "RENEWAL_DUE" | "EXPIRED" | "REVOKED" }>;
  career_milestones?: string[];
  teams?: string[];
  instructor_assignments?: string[];
  civic_eligibilities?: string[];
  organization_policies?: string[];
  closed_resources?: string[];
};

export type MetaverseRequirementEvaluation = {
  ok: boolean;
  satisfied: string[];
  remaining: string[];
  sourceFacts: MetaverseSourceFact[];
  firstRemaining: MetaverseUnlockRequirement | null;
};

function includesValue(collection: unknown, expected: unknown): boolean {
  return Array.isArray(collection) && collection.includes(expected);
}

function evaluateOne(requirement: MetaverseUnlockRequirement, facts: MetaverseEligibilityFacts): { ok: boolean; sourceFact?: MetaverseSourceFact } {
  let ok = false;
  switch (requirement.type) {
    case "membership":
      ok = facts.active_membership === true;
      break;
    case "organization":
      ok = facts.organization_id === requirement.expected;
      break;
    case "role":
      ok = includesValue(facts.roles, requirement.expected);
      break;
    case "entitlement":
      ok = includesValue(facts.service_entitlements, requirement.expected);
      break;
    case "enrollment":
      ok = (facts.enrollments || []).some((enrollment) => enrollment.program_id === requirement.expected && enrollment.status === "ACTIVE");
      break;
    case "cohort":
      ok = includesValue(facts.cohorts, requirement.expected);
      break;
    case "learning_path":
      ok = includesValue(facts.learning_paths, requirement.expected);
      break;
    case "course_progress":
      ok = Number((facts.course_progress || {})[String(requirement.expected)]) > 0;
      break;
    case "lesson_completion":
      ok = includesValue(facts.completed_lessons, requirement.expected);
      break;
    case "assignment":
      ok = (facts.assignments || []).some((assignment) => assignment.assignment_id === requirement.expected && ["ASSIGNED", "SUBMITTED", "COMPLETED"].includes(assignment.status));
      break;
    case "assessment_threshold":
      ok = (facts.assessments || []).some((assessment) => assessment.assessment_id === requirement.expected && assessment.passed === true);
      break;
    case "verified_evidence":
      ok = includesValue(facts.verified_evidence, requirement.expected);
      break;
    case "outcome":
      ok = (facts.outcomes || []).some((outcome) => outcome.outcome_id === requirement.expected && outcome.status === "CURRENT" && outcome.verified === true);
      break;
    case "credential":
      ok = (facts.credentials || []).some((credential) => credential.credential_definition_id === requirement.expected && ["ISSUED", "RENEWAL_DUE"].includes(credential.lifecycle));
      break;
    case "career_pathway_milestone":
      ok = includesValue(facts.career_milestones, requirement.expected);
      break;
    case "team_membership":
      ok = includesValue(facts.teams, requirement.expected);
      break;
    case "instructor_assignment":
      ok = includesValue(facts.instructor_assignments, requirement.expected);
      break;
    case "civic_eligibility":
      ok = includesValue(facts.civic_eligibilities, requirement.expected);
      break;
    case "time_window":
      ok = !includesValue(facts.closed_resources, requirement.expected);
      break;
    case "organization_policy":
      ok = includesValue(facts.organization_policies, requirement.expected);
      break;
  }
  return {
    ok,
    sourceFact: ok ? { authority: requirement.authority, fact_type: requirement.type, fact_id: String(requirement.expected || requirement.id), status: "SATISFIED" } : undefined,
  };
}

export function evaluateRequirementGroup(group: MetaverseRequirementGroup, facts: MetaverseEligibilityFacts): MetaverseRequirementEvaluation {
  const evaluated = group.requirements.map((requirement) => ({ requirement, result: evaluateOne(requirement, facts) }));
  const satisfied = evaluated.filter((item) => item.result.ok).map((item) => item.requirement.id);
  const remaining = evaluated.filter((item) => !item.result.ok).map((item) => item.requirement.id);
  const sourceFacts = evaluated.flatMap((item) => item.result.sourceFact ? [item.result.sourceFact] : []);
  const firstRemaining = evaluated.find((item) => !item.result.ok)?.requirement || null;
  const ok = group.operator === "ALL_OF"
    ? remaining.length === 0
    : group.operator === "ANY_OF"
      ? satisfied.length > 0
      : satisfied.length === 0;
  return { ok, satisfied, remaining, sourceFacts, firstRemaining };
}
