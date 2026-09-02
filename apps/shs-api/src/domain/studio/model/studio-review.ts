export const STUDIO_REVIEW_SUBMISSION_STATUSES = ["SUBMITTED", "CHANGES_REQUESTED", "APPROVED"] as const;
export const STUDIO_REVIEW_DECISIONS = ["APPROVED", "CHANGES_REQUESTED"] as const;
export type StudioReviewSubmissionStatus = typeof STUDIO_REVIEW_SUBMISSION_STATUSES[number];
export type StudioReviewDecision = typeof STUDIO_REVIEW_DECISIONS[number];

export function rowToStudioReviewSubmission(row: any, decision: any = null, currentWorkspaceRevision: number | null = null) {
  const workspaceRevision = Number(row.workspace_revision);
  return {
    submissionId: row.review_submission_id,
    projectId: row.project_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    projectType: row.project_type,
    workspaceRevision,
    qaRunId: row.qa_run_id,
    status: row.status,
    submittedByUserId: row.submitted_by_user_id,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    decision: decision ? {
      decisionId: decision.review_decision_id,
      decision: decision.decision,
      feedback: decision.feedback,
      reviewedByUserId: decision.reviewed_by_user_id,
      reviewedAt: decision.reviewed_at,
    } : null,
    isCurrent: currentWorkspaceRevision == null ? true : workspaceRevision === currentWorkspaceRevision,
  };
}
