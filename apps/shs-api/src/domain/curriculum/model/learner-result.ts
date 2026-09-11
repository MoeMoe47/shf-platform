export type LearnerOutcomeType = "COMPLETED" | "PASSED" | "FAILED" | "DEMONSTRATED" | "NOT_DEMONSTRATED";
export type LearnerOutcomeStatus = "CURRENT" | "SUPERSEDED" | "RETRACTED";
export type MasteryStatus = "NOT_DEMONSTRATED" | "DEVELOPING" | "DEMONSTRATED" | "MASTERED";
export type VerificationStatus = "UNVERIFIED" | "EVIDENCE_PENDING" | "VERIFIED" | "REVOKED";

export type LearnerOutcome = {
  outcomeId: string; organizationId: string; tenantId: string; learnerUserId: string;
  courseId: string | null; unitStableKey: string | null; lessonStableKey: string | null;
  activityId: string | null; assignmentId: string | null; sourceType: string; sourceId: string;
  outcomeType: LearnerOutcomeType; status: LearnerOutcomeStatus; score: number | null;
  competencyId: string | null; evidenceIds: string[]; occurredAt: string; evaluatedAt: string;
  provenance: Record<string, unknown>; supersedesOutcomeId: string | null;
};

export type LearnerMastery = {
  masteryId: string; organizationId: string; tenantId: string; learnerUserId: string;
  competencyId: string; masteryStatus: MasteryStatus; verificationStatus: VerificationStatus;
  sourceOutcomeId: string; evidenceIds: string[]; determinedAt: string;
};
