export const SIMULATION_STATUSES = ["CREATED", "PLANNING", "POLICY_EVALUATION", "APPROVAL_REQUIRED", "READY", "DENIED", "FAILED", "COMPLETED"] as const;
export const PLAN_STEP_TYPES = ["READ_RESOURCE", "PROPOSE_WRITE", "PROPOSE_EXTERNAL_ACTION", "PROPOSE_MESSAGE", "PROPOSE_DEPLOYMENT", "APPROVAL_CHECK", "POLICY_CHECK", "CONTEXT_CHECK"] as const;
export const ACTION_TYPES = ["READ", "WRITE", "EXTERNAL_CALL", "MESSAGE_SEND", "DEPLOYMENT", "PERMISSION_CHANGE", "DELEGATION_CHANGE", "RELEASE", "WORKFLOW_TRANSITION"] as const;
export const SIMULATION_RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;

export const SIMULATION_DECISION_CODES = {
  SIMULATION_AUTHORITY_DENIED: "SIMULATION_AUTHORITY_DENIED",
  SIMULATION_CONTEXT_DENIED: "SIMULATION_CONTEXT_DENIED",
  SIMULATION_RESOURCE_DENIED: "SIMULATION_RESOURCE_DENIED",
  SIMULATION_MODEL_DENIED: "SIMULATION_MODEL_DENIED",
  SIMULATION_APPROVAL_REQUIRED: "SIMULATION_APPROVAL_REQUIRED",
  SIMULATION_TOOL_NOT_ALLOWED: "SIMULATION_TOOL_NOT_ALLOWED",
  SIMULATION_WRITE_PREVENTED: "SIMULATION_WRITE_PREVENTED",
  SIMULATION_INVALID_PLAN: "SIMULATION_INVALID_PLAN",
  SIMULATION_READY: "SIMULATION_READY",
} as const;

export function toSimulationResponse(row: any, steps: any[] = [], actions: any[] = []) {
  return {
    simulationId: row.simulation_id,
    agentIdentifier: row.agent_identifier,
    sessionId: row.session_id,
    delegationId: row.delegation_id,
    principalUserId: row.principal_user_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    goal: row.goal,
    purpose: row.purpose,
    status: row.status,
    requestedModelProvider: row.requested_model_provider || null,
    requestedModelIdentifier: row.requested_model_identifier || null,
    contextAdmissionIds: row.context_admission_ids || [],
    startedAt: row.started_at,
    completedAt: row.completed_at || null,
    failureReason: row.failure_reason || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activityKind: "SIMULATED",
    plan: steps.map(toPlanStepResponse),
    proposedActions: actions.map(toProposedActionResponse),
  };
}

export function toPlanStepResponse(row: any) {
  return {
    planStepId: row.plan_step_id,
    simulationId: row.simulation_id,
    sequence: Number(row.sequence),
    stepType: row.step_type,
    description: row.description,
    resourceType: row.resource_type || null,
    resourceId: row.resource_id || null,
    requestedAction: row.requested_action || null,
    toolType: row.tool_type || null,
    toolReference: row.tool_reference || null,
    modelProvider: row.model_provider || null,
    modelIdentifier: row.model_identifier || null,
    requiredPermission: row.required_permission || null,
    requiredDelegationScope: row.required_delegation_scope || {},
    classificationRequirement: row.classification_requirement || null,
    approvalRequired: Boolean(row.approval_required),
    expectedOutput: row.expected_output || null,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toProposedActionResponse(row: any) {
  return {
    actionId: row.action_id,
    simulationId: row.simulation_id,
    sequence: Number(row.sequence),
    actionType: row.action_type,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    toolType: row.tool_type || null,
    toolReference: row.tool_reference || null,
    proposedOperation: row.proposed_operation,
    proposedPayload: row.proposed_payload_json || {},
    proposedWrite: row.proposed_write_json || {},
    riskLevel: row.risk_level,
    authorityAllowed: Boolean(row.authority_allowed),
    authorityCode: row.authority_code || null,
    policyAllowed: Boolean(row.policy_allowed),
    policyCode: row.policy_code || null,
    securityAllowed: Boolean(row.security_allowed),
    securityCode: row.security_code || null,
    approvalRequired: Boolean(row.approval_required),
    approvalType: row.approval_type || null,
    approvalReason: row.approval_reason || null,
    predictedSideEffect: row.predicted_side_effect,
    status: row.status,
    activityKind: "SIMULATED",
    createdAt: row.created_at,
  };
}

export function toLedgerResponse(row: any) {
  return {
    simulationId: row.simulation_id,
    sessionId: row.session_id,
    delegationId: row.delegation_id,
    agentIdentifier: row.agent_identifier,
    principalUserId: row.principal_user_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    goal: row.goal,
    purpose: row.purpose,
    status: row.status,
    requestedModelProvider: row.requested_model_provider || null,
    requestedModelIdentifier: row.requested_model_identifier || null,
    contextAdmissionIds: row.context_admission_ids || [],
    proposedActionCount: Number(row.proposed_action_count || 0),
    deniedActionCount: Number(row.denied_action_count || 0),
    approvalRequiredCount: Number(row.approval_required_count || 0),
    securityCodes: row.security_codes || [],
    authorityCodes: row.authority_codes || [],
    startedAt: row.started_at,
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
    activityKind: row.activity_kind || "SIMULATED",
  };
}
