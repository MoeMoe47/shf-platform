// Studio Phase 1 contract-only boundary. This module defines vocabulary and
// validation for later durable Studio work. It deliberately does not create
// tables, routes, events, or institutional truth.

export const STUDIO_PROJECT_TYPES = ["WEBSITE", "AI_AGENT"] as const;
export type StudioProjectType = typeof STUDIO_PROJECT_TYPES[number];
export const STUDIO_PROJECT_ORIGINS = ["ASSIGNMENT", "STUDENT_IDEA", "PROGRAMMATIC"] as const;
export type StudioProjectOrigin = typeof STUDIO_PROJECT_ORIGINS[number];
export const STUDIO_DESTINATIONS = ["STUDENT", "COMMERCIAL"] as const;
export type StudioDestination = typeof STUDIO_DESTINATIONS[number];

export const STUDIO_PROJECT_STATUSES = ["DRAFT", "PLANNING", "BUILDING", "READY_FOR_CHECK", "CHANGES_REQUIRED", "READY_FOR_REVIEW", "APPROVED", "DELIVERY_READY", "DELIVERED"] as const;
export type StudioProjectStatus = typeof STUDIO_PROJECT_STATUSES[number];
export const STUDIO_QA_STATUSES = ["NOT_RUN", "IN_PROGRESS", "PASSED", "FAILED"] as const;
export type StudioQaStatus = typeof STUDIO_QA_STATUSES[number];
export const STUDIO_REVIEW_STATUSES = ["NOT_REQUESTED", "PENDING", "CHANGES_REQUIRED", "APPROVED"] as const;
export type StudioReviewStatus = typeof STUDIO_REVIEW_STATUSES[number];
export const STUDIO_DELIVERY_STATUSES = ["NOT_READY", "READY", "DELIVERED"] as const;
export type StudioDeliveryStatus = typeof STUDIO_DELIVERY_STATUSES[number];
export const STUDIO_EVENT_TYPES = ["studio.handoff.created", "studio.project.created", "studio.project.versioned", "studio.workspace.updated", "studio.qa.completed", "studio.delivery.completed", "studio.destination.dispatched"] as const;
export type StudioEventType = typeof STUDIO_EVENT_TYPES[number];

export const STUDENT_EXPERIENCE_MODES = ["BEGINNER", "ADVANCED"] as const;
export type StudentExperienceMode = typeof STUDENT_EXPERIENCE_MODES[number];
export const STUDENT_EXPERIENCE_LABELS = { handoff: "Start Project", project: "My Project", resources: "Project Resources", buildPacket: "Project Plan / Requirements", qa: "Check My Project", delivery: "Submit / Publish / Finish", evidence: "What You Proved" } as const;
export const PRESENTATION_STATES = ["ORIENT", "ACTIONABLE", "IN_PROGRESS", "BLOCKED", "READY_TO_CONTINUE"] as const;
export type PresentationState = typeof PRESENTATION_STATES[number];
export const INSTITUTIONAL_STATES_NOT_OWNED_BY_EXPERIENCE = ["COMPLETED", "VERIFIED", "QA_PASSED", "DELIVERED", "EVIDENCE_VERIFIED"] as const;
export type InstitutionalStateNotOwnedByExperience = typeof INSTITUTIONAL_STATES_NOT_OWNED_BY_EXPERIENCE[number];

export interface StudioHandoff {
  handoffId: string;
  organizationId: string;
  tenantId: string;
  learnerId: string;
  origin: StudioProjectOrigin;
  projectType: StudioProjectType;
  assignmentId: string | null;
  enrollmentId: string | null;
  cohortId: string | null;
  programId: string | null;
  courseId: string | null;
  unitKey: string | null;
  lessonKey: string | null;
  curriculumReleaseId: string | null;
  completionPolicyId: string | null;
  reviewerId: string | null;
  dueAt: string | null;
  requirements: readonly string[];
  destination: StudioDestination;
}

export interface StudioProject {
  projectId: string;
  organizationId: string;
  tenantId: string;
  learnerId: string;
  projectType: StudioProjectType;
  origin: StudioProjectOrigin;
  originReferenceId: string | null;
  assignmentId: string | null;
  curriculumReleaseId: string | null;
  completionPolicyId: string | null;
  status: StudioProjectStatus;
  currentVersionId: string | null;
  destination: StudioDestination;
  qaStatus: StudioQaStatus;
  reviewStatus: StudioReviewStatus;
  deliveryStatus: StudioDeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudioBuildPacketBoundary {
  packetId: string;
  projectId: string;
  version: number;
  project: { id: string; type: StudioProjectType; title: string; lifecycleStatus: StudioProjectStatus };
  lineage: { assignmentId: string | null; curriculumReleaseId: string | null; unitKey: string | null; lessonKey: string | null };
  requirements: unknown;
  deliverables: readonly unknown[];
  resources: readonly unknown[];
  templates: readonly unknown[];
  tools: readonly unknown[];
  artifactReferences: readonly unknown[];
}

export interface StudioDestinationDispatch {
  destination: StudioDestination;
  consumer: "STUDENT_EVIDENCE" | "COMMERCIAL_CLIENTOPS";
  requiresCanonicalDelivery: true;
}

export interface StudentExperienceContract {
  mode: StudentExperienceMode;
  presentationState: PresentationState;
  recommendedNextAction: string | null;
  unmetRequirementExplanation: string | null;
  canonicalSource: "SERVER";
}

export const STUDIO_PROJECT_TRANSITIONS: Readonly<Record<StudioProjectStatus, readonly StudioProjectStatus[]>> = {
  DRAFT: ["PLANNING", "BUILDING"], PLANNING: ["BUILDING", "CHANGES_REQUIRED"], BUILDING: ["READY_FOR_CHECK", "CHANGES_REQUIRED"], READY_FOR_CHECK: ["BUILDING", "READY_FOR_REVIEW"], CHANGES_REQUIRED: ["BUILDING"], READY_FOR_REVIEW: ["APPROVED", "CHANGES_REQUIRED"], APPROVED: ["DELIVERY_READY"], DELIVERY_READY: ["DELIVERED", "CHANGES_REQUIRED"], DELIVERED: [],
};

export function isStudioProjectType(value: unknown): value is StudioProjectType { return typeof value === "string" && (STUDIO_PROJECT_TYPES as readonly string[]).includes(value); }
export function isStudioDestination(value: unknown): value is StudioDestination { return typeof value === "string" && (STUDIO_DESTINATIONS as readonly string[]).includes(value); }

export function validateStudioHandoff(handoff: StudioHandoff): string[] {
  const errors: string[] = [];
  if (!handoff.handoffId) errors.push("handoffId is required");
  if (!handoff.organizationId || !handoff.tenantId) errors.push("organization and tenant context are required");
  if (!handoff.learnerId) errors.push("learnerId is required");
  if (!isStudioProjectType(handoff.projectType)) errors.push("projectType is unsupported");
  if (!isStudioDestination(handoff.destination)) errors.push("destination is unsupported");
  if (handoff.origin === "ASSIGNMENT" && !handoff.assignmentId) errors.push("assignment-origin handoffs require assignmentId");
  if (handoff.origin === "ASSIGNMENT" && !handoff.curriculumReleaseId) errors.push("assignment-origin handoffs require curriculumReleaseId");
  if (handoff.origin !== "ASSIGNMENT" && handoff.assignmentId) errors.push("independent/programmatic handoffs cannot claim an assignment without an explicit assignment origin");
  if (handoff.origin === "STUDENT_IDEA" && handoff.completionPolicyId) errors.push("independent student ideas cannot fabricate a completion policy");
  return errors;
}

export function canTransitionStudioProject(from: StudioProjectStatus, to: StudioProjectStatus): boolean { return STUDIO_PROJECT_TRANSITIONS[from]?.includes(to) ?? false; }
export function destinationDispatch(destination: StudioDestination): StudioDestinationDispatch { return destination === "COMMERCIAL" ? { destination, consumer: "COMMERCIAL_CLIENTOPS", requiresCanonicalDelivery: true } : { destination, consumer: "STUDENT_EVIDENCE", requiresCanonicalDelivery: true }; }
export function isPresentationState(value: unknown): value is PresentationState { return typeof value === "string" && (PRESENTATION_STATES as readonly string[]).includes(value); }
export function experienceStateCannotAssertInstitutionalTruth(value: unknown): boolean { return !INSTITUTIONAL_STATES_NOT_OWNED_BY_EXPERIENCE.includes(value as InstitutionalStateNotOwnedByExperience); }
