// SHF Lesson + Assignment + Curriculum — Phase 4.
//
// Ownership boundary (see docs in each service file for detail):
//   Curriculum Definition   — what instructional experiences exist (Phase 2)
//   Assignment              — who must do it, on what release (Phase 3)
//   Completion Policy       — WHAT satisfies institutional completion (this domain)
//   Activity Result Domains — what the learner actually did (Arcade/Project/
//                              Live Learning/Prepare-Prove — all pre-existing,
//                              never duplicated here)
//   Completion Evaluator    — reads the above and decides, server-side only
//
// This file holds the canonical Requirement Registry (Step 6): one place
// naming every supported requirement type, its authoritative domain, and
// its current verification capability. No switch statement scattered
// across services — every consumer (evaluator, policy validation, API)
// reads this table.

export const POLICY_STATUS_VALUES = ["DRAFT", "ACTIVE", "RETIRED"] as const;
export type PolicyStatus = typeof POLICY_STATUS_VALUES[number];

export const ASSIGNED_CONTENT_TYPES = ["COURSE", "UNIT", "LESSON"] as const;
export type PolicyContentType = typeof ASSIGNED_CONTENT_TYPES[number];

export const REQUIREMENT_TYPES = [
  "CONTENT",
  "ARCADE",
  "PROJECT",
  "STUDIO_PROJECT",
  "LIVE_ATTENDANCE",
  "INSTRUCTOR_VERIFICATION",
  "EVIDENCE",
  "ASSESSMENT",
  "REFLECTION",
  "PRACTICE",
] as const;
export type RequirementType = typeof REQUIREMENT_TYPES[number];

export const REQUIREMENT_RESULT_STATUSES = ["SATISFIED", "UNSATISFIED", "NOT_AVAILABLE", "NOT_VERIFIABLE", "ERROR"] as const;
export type RequirementResultStatus = typeof REQUIREMENT_RESULT_STATUSES[number];

export interface RequirementRegistryEntry {
  type: RequirementType;
  authoritativeDomain: string;
  // Whether this repo currently has a real backend record this type can
  // read. false means every evaluation MUST return NOT_VERIFIABLE — see
  // Steps 20-22. This is a static, honest capability flag, not a feature
  // toggle to flip lightly.
  canVerify: boolean;
  unavailableReason: string | null;
  // Whether this type needs a target_reference (an external record id —
  // arcade_activity_id/project_id/live_session_id/competency_id) or
  // applies to the policy's own assigned content scope directly.
  requiresTargetReference: boolean;
}

export const REQUIREMENT_REGISTRY: Record<RequirementType, RequirementRegistryEntry> = {
  CONTENT: {
    type: "CONTENT",
    authoritativeDomain: "curriculum_lesson_completions (Phase 0)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: false,
  },
  ARCADE: {
    type: "ARCADE",
    authoritativeDomain: "arcade_results (Learning Arcade)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: true,
  },
  PROJECT: {
    type: "PROJECT",
    authoritativeDomain: "project_submissions (Project domain)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: true,
  },
  STUDIO_PROJECT: {
    type: "STUDIO_PROJECT",
    authoritativeDomain: "studio_delivery_records (Studio finalization)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: true,
  },
  LIVE_ATTENDANCE: {
    type: "LIVE_ATTENDANCE",
    authoritativeDomain: "live_session_join_events (Live Learning)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: true,
  },
  INSTRUCTOR_VERIFICATION: {
    type: "INSTRUCTOR_VERIFICATION",
    authoritativeDomain: "learner_competency_decisions (Prepare/Prove)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: true,
  },
  EVIDENCE: {
    type: "EVIDENCE",
    authoritativeDomain: "learner_competency_decisions (Prepare/Prove)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: true,
  },
  ASSESSMENT: {
    type: "ASSESSMENT",
    authoritativeDomain: "assessment_results (Assessment Activity domain)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: false,
  },
  REFLECTION: {
    type: "REFLECTION",
    authoritativeDomain: "reflection_submissions (Reflection Activity domain)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: false,
  },
  PRACTICE: {
    type: "PRACTICE",
    authoritativeDomain: "practice_results (Practice Activity domain)",
    canVerify: true,
    unavailableReason: null,
    requiresTargetReference: false,
  },
};

export interface CompletionPolicyRow {
  policyId: string;
  organizationId: string;
  curriculumReleaseId: string;
  assignedContentType: PolicyContentType;
  assignedContentId: string | null;
  version: number;
  status: PolicyStatus;
  createdByUserId: string;
  activatedByUserId: string | null;
  activatedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionPolicyRequirementRow {
  requirementId: string;
  policyId: string;
  organizationId: string;
  requirementType: RequirementType;
  targetReference: string | null;
  configuration: Record<string, unknown>;
  required: boolean;
  sequence: number;
  createdAt: string;
}

export interface RequirementResult {
  requirementId: string;
  type: RequirementType;
  required: boolean;
  status: RequirementResultStatus;
  satisfied: boolean;
  authoritativeSource: string;
  sourceRecordId: string | null;
  evaluatedAt: string;
  reason: string;
}
