export const CONDUCTOR_STATUSES = ["CREATED", "ANALYZING", "PLANNING", "SIMULATING", "APPROVAL_REQUIRED", "BLOCKED", "READY", "COMPLETED", "FAILED"] as const;
export const CONDUCTOR_TASK_STATUSES = ["PLANNED", "SIMULATION_REQUESTED", "READY", "APPROVAL_REQUIRED", "BLOCKED", "DENIED", "FAILED"] as const;

export const CONDUCTOR_CAPABILITIES = {
  READ_RESOURCE: "READ_RESOURCE",
  ANALYZE_DOCUMENT: "ANALYZE_DOCUMENT",
  SUMMARIZE: "SUMMARIZE",
  GENERATE_REPORT_DRAFT: "GENERATE_REPORT_DRAFT",
  PROPOSE_WORKFLOW_ACTION: "PROPOSE_WORKFLOW_ACTION",
  PROPOSE_MESSAGE: "PROPOSE_MESSAGE",
  PROPOSE_DEPLOYMENT: "PROPOSE_DEPLOYMENT",
  SIMULATE_RELEASE: "SIMULATE_RELEASE",
  QUERY_VERIFIED_OUTCOMES: "QUERY_VERIFIED_OUTCOMES",
} as const;

export const CONDUCTOR_DECISION_CODES = {
  CONDUCTOR_READY: "CONDUCTOR_READY",
  CONDUCTOR_APPROVAL_REQUIRED: "CONDUCTOR_APPROVAL_REQUIRED",
  CONDUCTOR_BLOCKED_MISSING_INFORMATION: "CONDUCTOR_BLOCKED_MISSING_INFORMATION",
  CONDUCTOR_INVALID_DEPENDENCY_GRAPH: "CONDUCTOR_INVALID_DEPENDENCY_GRAPH",
  CONDUCTOR_SIMULATION_DENIED: "CONDUCTOR_SIMULATION_DENIED",
  CONDUCTOR_EXECUTION_DISABLED: "CONDUCTOR_EXECUTION_DISABLED",
  CONDUCTOR_PERMISSION_DENIED: "CONDUCTOR_PERMISSION_DENIED",
} as const;

const EXPLANATIONS: Record<string, string> = {
  DELEGATION_EXPIRED: "The agent's delegated authority has expired.",
  DELEGATION_REVOKED: "The agent's delegated authority has been revoked.",
  AGENT_MISMATCH: "The selected agent does not match the delegation.",
  PRINCIPAL_MISMATCH: "The delegation does not belong to the requesting user.",
  ORGANIZATION_MISMATCH: "The request does not match the active organization.",
  TENANT_MISMATCH: "The request does not match the active tenant.",
  PURPOSE_NOT_ALLOWED: "The delegation does not allow this purpose.",
  ACTION_NOT_ALLOWED: "The delegation does not allow this action.",
  RESOURCE_OUT_OF_SCOPE: "The resource is outside the agent's delegated scope.",
  RESOURCE_CLASSIFICATION_DENIED: "The resource classification does not allow this agent/model context.",
  MODEL_CLASSIFICATION_DENIED: "The selected model is not approved for this resource classification.",
  MODEL_NOT_APPROVED: "The selected model is not approved for this organization.",
  PROMPT_INJECTION_DETECTED: "The source contains instructions that may attempt to manipulate the AI.",
  CONTENT_QUARANTINED: "The source is quarantined and cannot be used as AI context.",
  SECURITY_REVIEW_REQUIRED: "The source requires human security review before AI context use.",
  CONDUCTOR_EXECUTION_DISABLED: "BOS Conductor can plan and simulate, but real execution is disabled in this phase.",
};

export function explainDecision(code: string | null | undefined) {
  if (!code) return null;
  return EXPLANATIONS[code] || "BOS could not proceed because a governance or security control denied the request.";
}

export function toConductorRequestResponse(row: any, tasks: any[] = []) {
  return {
    conductorRequestId: row.conductor_request_id,
    principalUserId: row.principal_user_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    goal: row.goal,
    purpose: row.purpose,
    status: row.status,
    sourceSessionId: row.source_session_id || null,
    requestedOperationRef: row.requested_operation_ref || null,
    interpretation: row.interpretation_json || {},
    unresolvedQuestions: row.unresolved_questions_json || [],
    riskSummary: row.risk_summary_json || {},
    result: row.result_json || {},
    failureReason: row.failure_reason || null,
    createdBy: row.created_by,
    startedAt: row.started_at,
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks: tasks.map(toConductorTaskResponse),
  };
}

export function toConductorTaskResponse(row: any) {
  return {
    conductorTaskId: row.conductor_task_id,
    conductorRequestId: row.conductor_request_id,
    sequence: Number(row.sequence),
    dependencyTaskIds: row.dependency_task_ids || [],
    description: row.description,
    capability: row.capability,
    candidateAgentIdentifier: row.candidate_agent_identifier || null,
    resourceRefs: row.resource_refs_json || [],
    modelProvider: row.model_provider || null,
    modelIdentifier: row.model_identifier || null,
    simulationRequired: Boolean(row.simulation_required),
    simulationId: row.simulation_id || null,
    approvalRequired: Boolean(row.approval_required),
    approvalReason: row.approval_reason || null,
    status: row.status,
    decisionCode: row.decision_code || null,
    explanation: row.explanation || explainDecision(row.decision_code),
    expectedOutput: row.expected_output || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
