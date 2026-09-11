export type ActivityKind = "assessment" | "reflection" | "practice";

export interface ActivityActor {
  user_id: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
}

export interface ActivityDefinitionRef {
  assignmentId: string;
  curriculumReleaseId: string;
  releaseVersion: number;
  unitStableKey: string;
  lessonStableKey: string;
  assessmentDefinitionId?: string;
  reflectionDefinitionId?: string;
  practiceDefinitionId?: string;
  assessmentItems?: any[];
  reflectionItems?: any[];
  practiceItems?: any[];
  completionMode?: "OBJECTIVE" | "COMPLETION";
  passThresholdPercent?: number | null;
}

export interface AssessmentResult {
  assessmentResultId: string;
  assessmentAttemptId: string;
  organizationId: string;
  learnerUserId: string;
  assignmentId: string;
  curriculumReleaseId: string;
  releaseVersion: number;
  unitStableKey: string;
  lessonStableKey: string;
  assessmentDefinitionId: string;
  attemptNumber: number | null;
  answers: any[];
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  passThresholdPercent: number | null;
  passed: boolean;
  needsReview: boolean;
  createdAt: string;
}

export interface ReflectionSubmission {
  reflectionSubmissionId: string;
  organizationId: string;
  learnerUserId: string;
  assignmentId: string;
  curriculumReleaseId: string;
  releaseVersion: number;
  unitStableKey: string;
  lessonStableKey: string;
  reflectionDefinitionId: string;
  version: number;
  responses: any[];
  status: "SUBMITTED" | "REVIEWED";
  reviewStatus: "APPROVED" | "NEEDS_REVISION" | null;
  submittedAt: string;
}

export interface PracticeResult {
  practiceResultId: string;
  practiceAttemptId: string;
  organizationId: string;
  learnerUserId: string;
  assignmentId: string;
  curriculumReleaseId: string;
  releaseVersion: number;
  unitStableKey: string;
  lessonStableKey: string;
  practiceDefinitionId: string;
  actions: any[];
  score: number | null;
  maxScore: number | null;
  completed: boolean;
  createdAt: string;
}
