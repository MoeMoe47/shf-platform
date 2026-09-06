export const ARAG_STATUSES = ["CREATED", "VALIDATING", "BLOCKED", "QA_REQUIRED", "REVIEW_REQUIRED", "APPROVAL_REQUIRED", "SIMULATION_REQUIRED", "ASSURANCE_READY", "AUTHORIZED", "RELEASING", "RELEASED", "FAILED", "ROLLBACK_REQUIRED", "ROLLED_BACK", "CANCELLED"] as const;
export const ARAG_DECISION_CODES = {
  QA_MISSING: "RELEASE_QA_MISSING",
  QA_FAILED: "RELEASE_QA_FAILED",
  QA_REVISION_MISMATCH: "RELEASE_QA_REVISION_MISMATCH",
  REVIEW_MISSING: "RELEASE_REVIEW_MISSING",
  REVIEW_REJECTED: "RELEASE_REVIEW_REJECTED",
  REVIEW_REVISION_MISMATCH: "RELEASE_REVIEW_REVISION_MISMATCH",
  AUTHORITY_DENIED: "RELEASE_AUTHORITY_DENIED",
  POLICY_DENIED: "RELEASE_POLICY_DENIED",
  APPROVAL_REQUIRED: "RELEASE_APPROVAL_REQUIRED",
  APPROVAL_INVALID: "RELEASE_APPROVAL_INVALID",
  SIMULATION_MISSING: "RELEASE_SIMULATION_MISSING",
  SIMULATION_STALE: "RELEASE_SIMULATION_STALE",
  PROVIDER_NOT_APPROVED: "RELEASE_PROVIDER_NOT_APPROVED",
  TARGET_NOT_ALLOWED: "RELEASE_TARGET_NOT_ALLOWED",
  SECURITY_BLOCKED: "RELEASE_SECURITY_BLOCKED",
  EVIDENCE_INCOMPLETE: "RELEASE_EVIDENCE_INCOMPLETE",
  SUBJECT_CHANGED: "RELEASE_SUBJECT_CHANGED",
  AUTHORIZED: "RELEASE_AUTHORIZED",
  FAILED: "RELEASE_FAILED",
  ROLLBACK_REQUIRED: "ROLLBACK_REQUIRED",
  REPLAY_DENIED: "RELEASE_AUTHORIZATION_REPLAY_DENIED",
  EXECUTION_DISABLED: "RELEASE_EXECUTION_DISABLED",
} as const;

export function toReleaseResponse(row: any) {
  return {
    releaseRequestId: row.release_request_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    projectId: row.project_id,
    deliveryRecordId: row.delivery_record_id,
    workspaceRevision: Number(row.workspace_revision),
    packageHash: row.package_hash,
    repositoryReference: row.repository_reference,
    providerKey: row.provider_key,
    targetEnvironment: row.target_environment,
    requestedBy: row.requested_by,
    actingAgentIdentifier: row.acting_agent_identifier,
    agentSessionId: row.agent_session_id,
    delegationId: row.delegation_id,
    workOrderReference: row.work_order_reference,
    policyDecision: row.policy_decision,
    qaRunId: row.qa_run_id,
    reviewSubmissionId: row.review_submission_id,
    reviewDecisionId: row.review_decision_id,
    simulationId: row.simulation_id,
    subjectHash: row.subject_hash,
    status: row.status,
    blockingCodes: row.blocking_codes || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPacketResponse(row: any) {
  return {
    packetId: row.packet_id,
    releaseRequestId: row.release_request_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    packetVersion: Number(row.packet_version),
    packetHash: row.packet_hash,
    packet: row.packet_json,
    createdAt: row.created_at,
  };
}
