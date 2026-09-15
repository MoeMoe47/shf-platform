// MET-7 — City Mission projection contract.
//
// A City Mission is NOT a new assignment/curriculum/arcade/evidence/
// portfolio/career authority. It is a read-time projection of a real
// canonical Assignment (apps/shs-api/src/domain/assignments) — enriched
// with MET-2 registry location, MET-3 unlock-shaped access, Arcade
// practice relation, and Completion Policy requirement facts — into
// metaverse experience space. Nothing in this file is persisted; a
// mission_projection_id is a deterministic derivation, never a stored
// row (MET-7 build brief §31: prefer no migration).

export const MISSION_STATUSES = [
  "LOCKED",
  "AVAILABLE",
  "ASSIGNED",
  "IN_PROGRESS",
  "OVERDUE",
  "SUBMITTED",
  "COMPLETED_SOURCE_PENDING_VERIFICATION",
  "COMPLETED_VERIFIED_SOURCE",
  "CLOSED",
] as const;
export type MissionStatus = typeof MISSION_STATUSES[number];

export type MissionNextActionKind =
  | "CONTINUE_LESSON"
  | "PRACTICE_SKILL"
  | "PLAY_ARCADE_CHALLENGE"
  | "START_CITY_MISSION"
  | "COMPLETE_ASSESSMENT"
  | "SUBMIT_ARTIFACT"
  | "AWAIT_INSTRUCTOR_REVIEW"
  | "CONTINUE_CAREER_PATHWAY"
  | "NONE";

export interface MissionNextAction {
  kind: MissionNextActionKind;
  label: string;
  reason: string;
  // Present only when the next action is itself gated by an unsatisfied
  // completion-policy requirement (apps/shs-api/src/domain/completion-policy).
  blockingRequirementType: string | null;
}

export interface MissionLocation {
  cityId: string;
  districtId: string;
  facilityId: string;
  // Only set when the assignment's bound lesson matches an existing
  // MET-2 registry MetaverseActivity 1:1 (see mission-location-resolver.ts).
  // Most assignments resolve to a district/facility only — this repo's
  // MET-2 registry currently declares 5 concrete activities, and MET-7
  // never invents new registry entries to force a match.
  metaverseActivityId: string | null;
  matchedRule: string;
}

export interface MissionArcadeRelation {
  arcadeActivityId: string;
  title: string;
  relationshipType: "ARCADE_PRACTICE_FOR_MISSION";
  requiredOrRecommended: "REQUIRED" | "RECOMMENDED";
  // Server-derived mastery fact from arcade_results — never a
  // client-supplied flag (see arcade/model/arcade.ts deriveMastery()).
  masteryAchieved: boolean;
  source: "completion_policy_requirement" | "lesson_link";
}

export interface MissionEvidenceExpectation {
  // The verified-evidence domain's own SOURCE_TABLES key
  // (apps/shs-api/src/domain/verified-evidence/service/verified-evidence-service.ts)
  // this mission's underlying source record could be projected from, if
  // any evidence rule exists for it in this organization. MET-7 never
  // creates an evidence rule and never calls projectAuthoritativeFact
  // itself — this field is descriptive only.
  possibleSourceType: "LESSON_COMPLETION" | "ARCADE_RESULT" | "STUDIO_DELIVERY" | "PROJECT_SUBMISSION" | null;
  canBecomeEvidenceCandidate: boolean;
  isVerifiedEvidence: false; // always false from this domain; verification is verified-evidence's authority alone.
  notes: string;
}

export interface MissionCareerContext {
  pathwayIds: string[];
  careerIds: string[];
  notes: string;
}

export interface MissionPrerequisiteStatus {
  requirementType: string;
  required: boolean;
  satisfied: boolean;
  status: string; // RequirementResultStatus from completion-policy, or "NOT_EVALUATED"
  detail: string;
}

export interface CityMission {
  missionProjectionId: string;
  organizationId: string;
  studentId: string;
  assignmentId: string;
  assignmentType: string;
  programId: string | null;
  courseStableKey: string | null;
  unitStableKey: string | null;
  lessonStableKey: string | null;
  arcadeAssignmentId: null; // MET-7 §5/§16: no canonical Arcade-assignment authority exists in this repo (UNRESOLVED) — always null; use arcadeRelations instead.
  location: MissionLocation;
  missionTitle: string;
  missionSummary: string;
  missionStatus: MissionStatus;
  dueState: string;
  dueAt: string;
  prerequisites: MissionPrerequisiteStatus[];
  arcadeRelations: MissionArcadeRelation[];
  nextAction: MissionNextAction;
  evidenceExpectations: MissionEvidenceExpectation;
  careerContext: MissionCareerContext | null;
  projectionVersion: "MET-7";
  computedAt: string;
}
