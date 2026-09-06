export const MCP_SERVER_STATES = ["PENDING", "APPROVED", "ACTIVE", "DISABLED", "REVOKED"] as const;
export const MCP_SIDE_EFFECTS = ["READ_ONLY", "PROPOSED_WRITE", "COMMUNICATION", "DESTRUCTIVE", "DEPLOYMENT", "SECURITY_SENSITIVE", "FINANCIAL"] as const;
export const MCP_RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;

export const MCP_DENIAL_CODES = {
  SERVER_NOT_FOUND: "MCP_SERVER_NOT_FOUND",
  SERVER_NOT_APPROVED: "MCP_SERVER_NOT_APPROVED",
  SERVER_DISABLED: "MCP_SERVER_DISABLED",
  SERVER_REVOKED: "MCP_SERVER_REVOKED",
  TOOL_NOT_FOUND: "MCP_TOOL_NOT_FOUND",
  TOOL_NOT_ALLOWLISTED: "MCP_TOOL_NOT_ALLOWLISTED",
  RESOURCE_NOT_FOUND: "MCP_RESOURCE_NOT_FOUND",
  ORGANIZATION_MISMATCH: "MCP_ORGANIZATION_MISMATCH",
  TENANT_MISMATCH: "MCP_TENANT_MISMATCH",
  DISCOVERY_PERMISSION_REQUIRED: "MCP_DISCOVERY_PERMISSION_REQUIRED",
  AUTHORITY_DENIED: "MCP_AUTHORITY_DENIED",
  CLASSIFICATION_DENIED: "MCP_CLASSIFICATION_DENIED",
  SECURITY_DENIED: "MCP_SECURITY_DENIED",
  APPROVAL_REQUIRED: "MCP_APPROVAL_REQUIRED",
  LIVE_INVOCATION_DISABLED: "MCP_LIVE_INVOCATION_DISABLED",
  TOOL_NOT_READ_ONLY: "MCP_TOOL_NOT_READ_ONLY",
  LIVE_READ_NOT_ALLOWED: "MCP_LIVE_READ_NOT_ALLOWED",
  CREDENTIAL_UNAVAILABLE: "MCP_CREDENTIAL_UNAVAILABLE",
  ENDPOINT_UNSAFE: "MCP_ENDPOINT_UNSAFE",
  RESPONSE_SECURITY_DENIED: "MCP_RESPONSE_SECURITY_DENIED",
  RESPONSE_NOT_ADMITTED: "MCP_RESPONSE_NOT_ADMITTED",
  SECRET_NOT_ALLOWED: "MCP_SECRET_NOT_ALLOWED",
} as const;

export function approvalForSideEffect(sideEffect: string) {
  if (sideEffect === "READ_ONLY") return { required: false, profile: "NONE", reason: null };
  if (sideEffect === "FINANCIAL") return { required: true, profile: "HIGH_TRUST", reason: "Financial actions are simulation-only and require explicit high-trust approval." };
  if (["DESTRUCTIVE", "SECURITY_SENSITIVE", "DEPLOYMENT"].includes(sideEffect)) return { required: true, profile: "HIGH_TRUST", reason: "High-impact external actions require explicit approval." };
  return { required: true, profile: "HUMAN_REVIEW", reason: "External mutation or communication requires human approval." };
}

export function toServerResponse(row: any) {
  return { serverId: row.mcp_server_id, organizationId: row.organization_id, tenantId: row.tenant_id, displayName: row.display_name, providerIdentifier: row.provider_identifier, endpointReference: row.endpoint_reference, transportType: row.transport_type, trustStatus: row.trust_status, lifecycleStatus: row.lifecycle_status, credentialReference: row.credential_reference || null, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function toToolResponse(row: any) {
  return { toolId: row.mcp_tool_id, serverId: row.mcp_server_id, toolKey: row.tool_key, displayName: row.display_name, description: row.description, inputSchema: row.input_schema_json, outputSchema: row.output_schema_json, sideEffectClass: row.side_effect_class, riskLevel: row.risk_level, requiredApprovalProfile: row.required_approval_profile, discoveryVersion: row.discovery_version, enabled: row.enabled, discoveredAt: row.discovered_at };
}

export function toResourceResponse(row: any) {
  return { resourceId: row.mcp_resource_id, serverId: row.mcp_server_id, resourceUri: row.resource_uri, resourceType: row.resource_type, displayName: row.display_name, mediaType: row.media_type, externalClassificationHint: row.external_classification_hint, bosClassification: row.bos_classification, organizationId: row.organization_id, tenantId: row.tenant_id, provenance: row.provenance_json, enabled: row.enabled, discoveredAt: row.discovered_at };
}

export function toInvocationResponse(row: any) {
  return { invocationId: row.mcp_invocation_id, serverId: row.mcp_server_id, toolId: row.mcp_tool_id, resourceId: row.mcp_resource_id, simulationId: row.simulation_id, conductorRequestId: row.conductor_request_id, authorityAllowed: row.authority_allowed, authorityCode: row.authority_code, policyAllowed: row.policy_allowed, policyCode: row.policy_code, classification: row.classification, securityCode: row.security_code, approvalRequired: row.approval_required, status: row.status, executionMode: row.execution_mode || "SIMULATED", sideEffectClass: row.side_effect_class, simulated: (row.execution_mode || "SIMULATED") === "SIMULATED", input: row.input_json, provenance: row.provenance_json, resultAdmissionStatus: row.result_admission_status || null, durationMs: row.duration_ms ?? null, createdAt: row.created_at };
}

export function toReadResultResponse(row: any, content?: unknown) {
  return { readResultId: row.mcp_read_result_id, invocationId: row.mcp_invocation_id, serverId: row.mcp_server_id, toolId: row.mcp_tool_id, resourceId: row.mcp_resource_id, principalUserId: row.principal_user_id, agentIdentifier: row.agent_identifier, sessionId: row.session_id, delegationId: row.delegation_id, organizationId: row.organization_id, tenantId: row.tenant_id, sourceIdentity: row.source_identity, contentType: row.content_type, responseSha256: row.response_sha256, responseBytes: row.response_bytes, responseStatus: row.response_status, securityScanId: row.security_scan_id, contextAdmissionId: row.context_admission_id, admissionStatus: row.admission_status, failureCode: row.failure_code || null, durationMs: row.duration_ms ?? null, provenance: row.provenance_json, content };
}
