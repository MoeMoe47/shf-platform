import { createHash, randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { ServiceCatalogService } from "../../service-catalog/service/service-catalog-service.js";
import { AiGovernanceRepo, type Executor } from "../repo/ai-governance-repo.js";
import {
  AI_AUTHORITY_DENIAL_CODES,
  AI_GOVERNANCE_SERVICE_KEY,
  CLASSIFICATION_RANK,
  RESOURCE_CLASSIFICATIONS,
  normalizeResourceScope,
  resourceInScope,
  toClassificationResponse,
  toDelegationResponse,
  toModelResponse,
  toSessionResponse,
  toAgentIdentityResponse,
  toTaskResponse,
  toTaskAttemptResponse,
  toWorkerResponse,
  toProposedActionResponse,
  toApprovalRequestResponse,
  toApprovalDecisionResponse,
  toSecurityEventResponse,
  type ResourceClassification,
} from "../model/ai-governance.js";

type Actor = {
  user_id?: string;
  id?: string;
  active_organization_id?: string;
  organization_id?: string;
  tenant_id?: string;
  permissions?: string[];
};

function actorScope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

function requireActorPermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new Error("AI_GOVERNANCE_PERMISSION_REQUIRED");
}

function stableEventId(type: string, id: string) {
  return `${type}:${id}`;
}

function isClassification(value: string): value is ResourceClassification {
  return (RESOURCE_CLASSIFICATIONS as readonly string[]).includes(value);
}

function denial(code: string, detail?: Record<string, unknown>) {
  return { allowed: false, denialCode: code, ...detail };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value) || "null";
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function allowed(detail: Record<string, unknown>) {
  return { allowed: true, denialCode: null, ...detail };
}

const SAFE_TASK_TYPES = new Set(["bounded_review_preparation", "safe_read", "simulation"]);

function safeExecutionEnabled() {
  return ["1", "true", "yes", "on"].includes(String(process.env.SHS_AGENT_SAFE_EXECUTION_ENABLED || "0").trim().toLowerCase());
}

export class AiGovernanceError extends Error {
  constructor(public code: string, message = code, public statusCode = 400) {
    super(message);
  }
}

export class AiGovernanceService {
  constructor(
    private repo = new AiGovernanceRepo(),
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
    private serviceCatalog = new ServiceCatalogService(),
  ) {}

  private async emit(executor: Executor | null, type: string, subjectType: string, subjectId: string, scope: any, payload: Record<string, unknown> = {}) {
    const event = {
      producer_id: "shs-api.ai-governance",
      event_type: type,
      subject_type: subjectType,
      subject_id: subjectId,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      originating_actor_id: scope.userId,
      originating_actor_type: "user",
      occurred_at: new Date().toISOString(),
      idempotency_key: stableEventId(type, subjectId),
      correlation_id: `ai-governance:${subjectId}`,
      destination: "shs-governance",
      payload,
    };
    if (executor) await this.outbox.enqueue(event, executor);
    else await this.outbox.enqueue(event);
  }

  private async entitlementAllowed(organizationId: string) {
    try {
      const result = await this.serviceCatalog.evaluateOrganizationServiceEntitlement({
        organizationId,
        serviceKey: AI_GOVERNANCE_SERVICE_KEY,
      });
      return result.allowed ? null : result.result || AI_AUTHORITY_DENIAL_CODES.ENTITLEMENT_DENIED;
    } catch {
      return AI_AUTHORITY_DENIAL_CODES.ENTITLEMENT_DENIED;
    }
  }

  private validateDelegationInput(actor: Actor, body: any, scope: any) {
    const principalUserId = String(body.principalUserId || body.principal_user_id || "").trim();
    const agentIdentifier = String(body.agentIdentifier || body.agent_identifier || "").trim();
    const purpose = String(body.purpose || "").trim();
    const organizationId = String(body.organizationId || body.organization_id || scope.organizationId).trim();
    const tenantId = String(body.tenantId || body.tenant_id || scope.tenantId).trim();
    const allowedActions: string[] = Array.from(new Set((body.allowedActions || body.allowed_actions || []).map((item: any) => String(item).trim()).filter(Boolean) as string[]));
    const forbiddenActions: string[] = Array.from(new Set((body.forbiddenActions || body.forbidden_actions || []).map((item: any) => String(item).trim()).filter(Boolean) as string[]));
    const resourceScope = normalizeResourceScope(body.resourceScope || body.resource_scope);
    const validFrom = body.validFrom || body.valid_from ? new Date(body.validFrom || body.valid_from) : new Date();
    const expiresAt = new Date(body.expiresAt || body.expires_at || "");
    const autonomyProfile = String(body.autonomyProfile || body.autonomy_profile || "LEVEL_1_RECOMMEND").trim();
    const requestedRestrictedAccess = body.restrictedResourceAccess === true || body.restricted_resource_access === true;
    const allowRedelegation = body.allowRedelegation === true || body.allow_redelegation === true;

    if (!principalUserId || principalUserId !== scope.userId) throw new AiGovernanceError("PRINCIPAL_PERMISSION_DENIED", "Delegator may only delegate their own authority.", 403);
    if (!agentIdentifier) throw new AiGovernanceError("AGENT_REQUIRED", "Agent identifier is required.");
    if (!purpose) throw new AiGovernanceError("PURPOSE_REQUIRED", "Purpose is required.");
    if (organizationId !== scope.organizationId) throw new AiGovernanceError("ORGANIZATION_MISMATCH", "Organization mismatch.", 403);
    if (tenantId !== scope.tenantId || tenantId !== `tenant:${organizationId}`) throw new AiGovernanceError("TENANT_MISMATCH", "Tenant mismatch.", 403);
    if (!allowedActions.length) throw new AiGovernanceError("ACTION_REQUIRED", "At least one allowed action is required.");
    if (!resourceScope.resources.length || resourceScope.all) throw new AiGovernanceError("UNBOUNDED_RESOURCE_SCOPE_DENIED", "Delegation requires explicit bounded resources.");
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date() || expiresAt <= validFrom) throw new AiGovernanceError("FINITE_EXPIRY_REQUIRED", "Delegation requires finite future expiry.");
    if (allowRedelegation) throw new AiGovernanceError("REDELEGATION_DENIED", "Re-delegation is not authorized in Phase 1.", 403);
    if (requestedRestrictedAccess && !hasPermission(actor.permissions || [], SHS_SECURITY_PERMISSIONS.SECURITY_MANAGE)) throw new AiGovernanceError("RESTRICTED_RESOURCE_GRANT_DENIED", "Restricted resource authority requires security management.", 403);
    const overlap = allowedActions.some((action) => forbiddenActions.includes(action));
    if (overlap) throw new AiGovernanceError("ACTION_POLICY_CONFLICT", "Allowed and forbidden actions must not overlap.");
    const missing = allowedActions.filter((permission) => !hasPermission(actor.permissions || [], permission));
    if (missing.length) throw new AiGovernanceError("PRINCIPAL_PERMISSION_DENIED", "Delegation cannot exceed principal permissions.", 403);

    return {
      principal_user_id: principalUserId,
      agent_identifier: agentIdentifier,
      organization_id: organizationId,
      tenant_id: tenantId,
      purpose,
      resource_scope: { resources: resourceScope.resources, all: false, allowRestricted: requestedRestrictedAccess },
      allowed_actions: allowedActions,
      forbidden_actions: forbiddenActions,
      autonomy_profile: autonomyProfile,
      model_provider_constraint: body.modelProviderConstraint || body.model_provider_constraint || null,
      model_identifier_constraint: body.modelIdentifierConstraint || body.model_identifier_constraint || null,
      restricted_resource_access: requestedRestrictedAccess,
      allow_redelegation: false,
      valid_from: validFrom,
      expires_at: expiresAt,
    };
  }

  async createDelegation(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const entitlementDenied = await this.entitlementAllowed(scope.organizationId);
    if (entitlementDenied) throw new AiGovernanceError("ENTITLEMENT_DENIED", "AI governance service entitlement is required.", 403);
    const input = this.validateDelegationInput(actor, body, scope);
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.createDelegation({
        delegation_id: `ai_delegation_${randomUUID()}`,
        ...input,
        created_by: scope.userId,
      }, db);
      await this.emit(db, "delegation.created", "ai_delegated_authority", row.delegation_id, scope, {
        agent_identifier: row.agent_identifier,
        purpose: row.purpose,
        expires_at: row.expires_at,
      });
      return toDelegationResponse(row);
    });
  }

  async listDelegations(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const rows = await this.repo.listDelegations(scope.organizationId, scope.tenantId);
    return rows.map(toDelegationResponse);
  }

  async getDelegation(actor: Actor, delegationId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const row = await this.repo.getDelegation(delegationId, scope.organizationId, scope.tenantId);
    if (!row) throw new AiGovernanceError("DELEGATION_NOT_FOUND", "Delegation not found.", 404);
    return toDelegationResponse(row);
  }

  async revokeDelegation(actor: Actor, delegationId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.revokeDelegation({
        delegation_id: delegationId,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        revoked_by: scope.userId,
        revocation_reason: String(body.reason || body.revocationReason || body.revocation_reason || "").trim() || null,
      }, db);
      if (!row) throw new AiGovernanceError("DELEGATION_NOT_FOUND", "Delegation not found.", 404);
      await this.emit(db, "delegation.revoked", "ai_delegated_authority", row.delegation_id, scope, {
        reason: row.revocation_reason || null,
      });
      const revokeActiveExecutionByDelegation = (this.repo as any).revokeActiveExecutionByDelegation;
      if (typeof revokeActiveExecutionByDelegation === "function") {
        await revokeActiveExecutionByDelegation.call(this.repo, row.delegation_id, scope.organizationId, scope.tenantId, db);
      }
      return toDelegationResponse(row);
    });
  }

  async assignClassification(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const resourceType = String(body.resourceType || body.resource_type || "").trim();
    const resourceId = String(body.resourceId || body.resource_id || "").trim();
    const classification = String(body.classification || "").trim().toUpperCase();
    if (!resourceType || !resourceId) throw new AiGovernanceError("RESOURCE_REQUIRED", "Resource reference is required.");
    if (!isClassification(classification)) throw new AiGovernanceError("CLASSIFICATION_INVALID", "Classification is invalid.");
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.assignClassification({
        classification_id: `ai_resource_classification_${randomUUID()}`,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        resource_type: resourceType,
        resource_id: resourceId,
        classification,
        classification_reason: body.classificationReason || body.classification_reason || null,
        classified_by: scope.userId,
      }, db);
      await this.emit(db, "resource_classification.assigned", "ai_resource_classification", row.classification_id, scope, {
        resource_type: resourceType,
        resource_id: resourceId,
        classification,
      });
      return toClassificationResponse(row);
    });
  }

  async getClassification(actor: Actor, resourceType: string, resourceId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const row = await this.repo.getClassification({
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      resource_type: resourceType,
      resource_id: resourceId,
    });
    if (!row) throw new AiGovernanceError("CLASSIFICATION_NOT_FOUND", "Classification not found.", 404);
    return toClassificationResponse(row);
  }

  async upsertModelPolicy(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const provider = String(body.providerIdentifier || body.provider_identifier || "").trim();
    const model = String(body.modelIdentifier || body.model_identifier || "").trim();
    const displayName = String(body.displayName || body.display_name || `${provider}/${model}`).trim();
    const classificationCeiling = String(body.classificationCeiling || body.classification_ceiling || "INTERNAL").trim().toUpperCase();
    if (!provider || !model) throw new AiGovernanceError("MODEL_REQUIRED", "Provider and model are required.");
    if (!isClassification(classificationCeiling)) throw new AiGovernanceError("MODEL_CLASSIFICATION_INVALID", "Model classification ceiling is invalid.");
    const row = await this.repo.upsertModelPolicy({
      model_policy_id: `ai_model_policy_${randomUUID()}`,
      organization_id: body.global === true ? null : scope.organizationId,
      tenant_id: body.global === true ? null : scope.tenantId,
      provider_identifier: provider,
      model_identifier: model,
      display_name: displayName,
      lifecycle_status: String(body.lifecycleStatus || body.lifecycle_status || "ACTIVE").trim().toUpperCase(),
      approval_status: String(body.approvalStatus || body.approval_status || "APPROVED").trim().toUpperCase(),
      classification_ceiling: classificationCeiling,
      capability_metadata: body.capabilityMetadata || body.capability_metadata || {},
      effective_from: body.effectiveFrom || body.effective_from ? new Date(body.effectiveFrom || body.effective_from) : new Date(),
      retires_at: body.retiresAt || body.retires_at ? new Date(body.retiresAt || body.retires_at) : null,
      actor_user_id: scope.userId,
    });
    return toModelResponse(row);
  }

  async listModelPolicies(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const rows = await this.repo.listModelPolicies({ organization_id: scope.organizationId, tenant_id: scope.tenantId });
    return rows.map(toModelResponse);
  }

  async validateModel(input: any, classification: ResourceClassification, now = new Date()) {
    const provider = String(input?.providerIdentifier || input?.provider_identifier || input?.provider || "").trim();
    const model = String(input?.modelIdentifier || input?.model_identifier || input?.model || "").trim();
    if (!provider || !model) {
      if (CLASSIFICATION_RANK[classification] >= CLASSIFICATION_RANK.SENSITIVE) return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
      return allowed({ modelDecision: { required: false } });
    }
    const policy = await this.repo.findModelPolicy({
      provider_identifier: provider,
      model_identifier: model,
      organization_id: input.organizationId || input.organization_id,
      tenant_id: input.tenantId || input.tenant_id,
    });
    if (!policy) return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
    if (policy.approval_status !== "APPROVED" || policy.lifecycle_status === "BLOCKED" || policy.lifecycle_status === "RETIRED") return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED, { modelDecision: { lifecycleStatus: policy.lifecycle_status, approvalStatus: policy.approval_status } });
    if (policy.retires_at && new Date(policy.retires_at) <= now) return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
    const ceiling = String(policy.classification_ceiling || "PUBLIC") as ResourceClassification;
    if (CLASSIFICATION_RANK[classification] > CLASSIFICATION_RANK[ceiling]) return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_CLASSIFICATION_DENIED, { modelDecision: { classificationCeiling: ceiling } });
    return allowed({ modelDecision: { modelPolicyId: policy.model_policy_id, lifecycleStatus: policy.lifecycle_status, approvalStatus: policy.approval_status, classificationCeiling: ceiling } });
  }

  async evaluateAgentAuthority(input: any) {
    const now = input.now instanceof Date ? input.now : new Date(input.now || Date.now());
    const principalUserId = String(input.principalUserId || input.principal_user_id || input.principal?.user_id || input.principal?.id || "").trim();
    const organizationId = String(input.organizationId || input.organization_id || input.organization?.organization_id || "").trim();
    const tenantId = String(input.tenantId || input.tenant_id || "").trim();
    const agentIdentifier = String(input.agentIdentifier || input.agent_identifier || input.agent?.identifier || input.agent?.id || "").trim();
    const purpose = String(input.purpose || "").trim();
    const action = String(input.action || "").trim();
    const resource = {
      organization_id: String(input.resource?.organizationId || input.resource?.organization_id || organizationId).trim(),
      tenant_id: String(input.resource?.tenantId || input.resource?.tenant_id || tenantId).trim(),
      resource_type: String(input.resource?.resourceType || input.resource?.resource_type || "").trim(),
      resource_id: String(input.resource?.resourceId || input.resource?.resource_id || "").trim(),
    };
    const delegation = input.delegation || (input.delegationId || input.delegation_id
      ? await this.repo.getDelegation(String(input.delegationId || input.delegation_id), organizationId, tenantId)
      : null);
    if (!delegation) return denial(AI_AUTHORITY_DENIAL_CODES.NO_DELEGATION);

    const entitlementDenied = await this.entitlementAllowed(organizationId);
    if (entitlementDenied) return denial(AI_AUTHORITY_DENIAL_CODES.ENTITLEMENT_DENIED, { entitlementDecision: entitlementDenied });
    if (String(delegation.principal_user_id) !== principalUserId) return denial(AI_AUTHORITY_DENIAL_CODES.PRINCIPAL_MISMATCH);
    if (String(delegation.agent_identifier) !== agentIdentifier) return denial(AI_AUTHORITY_DENIAL_CODES.AGENT_MISMATCH);
    if (String(delegation.organization_id) !== organizationId) return denial(AI_AUTHORITY_DENIAL_CODES.ORGANIZATION_MISMATCH);
    if (String(delegation.tenant_id) !== tenantId || tenantId !== `tenant:${organizationId}`) return denial(AI_AUTHORITY_DENIAL_CODES.TENANT_MISMATCH);
    if (new Date(delegation.valid_from) > now) return denial(AI_AUTHORITY_DENIAL_CODES.DELEGATION_NOT_YET_VALID);
    if (new Date(delegation.expires_at) <= now) return denial(AI_AUTHORITY_DENIAL_CODES.DELEGATION_EXPIRED);
    if (delegation.revoked_at) return denial(AI_AUTHORITY_DENIAL_CODES.DELEGATION_REVOKED);
    if (String(delegation.purpose) !== purpose) return denial(AI_AUTHORITY_DENIAL_CODES.PURPOSE_NOT_ALLOWED);
    if (!Array.isArray(delegation.allowed_actions) || !delegation.allowed_actions.includes(action)) return denial(AI_AUTHORITY_DENIAL_CODES.ACTION_NOT_ALLOWED);
    if (Array.isArray(delegation.forbidden_actions) && delegation.forbidden_actions.includes(action)) return denial(AI_AUTHORITY_DENIAL_CODES.ACTION_EXPLICITLY_DENIED);
    if (!resource.resource_type || !resource.resource_id || !resourceInScope(delegation.resource_scope, { resourceType: resource.resource_type, resourceId: resource.resource_id })) return denial(AI_AUTHORITY_DENIAL_CODES.RESOURCE_OUT_OF_SCOPE);

    if (input.sessionId || input.session_id) {
      const session = await this.repo.getSession(String(input.sessionId || input.session_id), organizationId, tenantId);
      if (!session) return denial(AI_AUTHORITY_DENIAL_CODES.SESSION_NOT_FOUND);
      if (session.delegation_id !== delegation.delegation_id || session.agent_identifier !== agentIdentifier || session.acting_for_user_id !== principalUserId) return denial(AI_AUTHORITY_DENIAL_CODES.SESSION_MISMATCH);
      if (session.status === "REVOKED") return denial(AI_AUTHORITY_DENIAL_CODES.SESSION_REVOKED);
      if (session.status !== "ACTIVE") return denial(AI_AUTHORITY_DENIAL_CODES.SESSION_CLOSED);
      if (new Date(session.expires_at) <= now) return denial(AI_AUTHORITY_DENIAL_CODES.SESSION_EXPIRED);
    }

    const classificationRow = await this.repo.getClassification(resource);
    const classification = String(classificationRow?.classification || "INTERNAL") as ResourceClassification;
    if (classification === "INTERNAL" && (resource.organization_id !== organizationId || resource.tenant_id !== tenantId)) return denial(AI_AUTHORITY_DENIAL_CODES.RESOURCE_CLASSIFICATION_DENIED);
    if (classification === "SENSITIVE" && !purpose) return denial(AI_AUTHORITY_DENIAL_CODES.RESOURCE_CLASSIFICATION_DENIED);
    if (classification === "RESTRICTED" && delegation.restricted_resource_access !== true) return denial(AI_AUTHORITY_DENIAL_CODES.RESOURCE_CLASSIFICATION_DENIED);

    const requestedProvider = String(input.model?.providerIdentifier || input.model?.provider_identifier || input.model?.provider || "").trim();
    const requestedModel = String(input.model?.modelIdentifier || input.model?.model_identifier || input.model?.model || "").trim();
    if (delegation.model_provider_constraint && requestedProvider && delegation.model_provider_constraint !== requestedProvider) return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_CONSTRAINT_MISMATCH);
    if (delegation.model_identifier_constraint && requestedModel && delegation.model_identifier_constraint !== requestedModel) return denial(AI_AUTHORITY_DENIAL_CODES.MODEL_CONSTRAINT_MISMATCH);

    const modelDecision: any = await this.validateModel({
      ...input.model,
      organizationId,
      tenantId,
    }, isClassification(classification) ? classification : "INTERNAL", now);
    if (!modelDecision.allowed) return { ...modelDecision, delegationStatus: "ACTIVE", classificationDecision: { classification } };

    return allowed({
      delegationStatus: "ACTIVE",
      classificationDecision: { classification, classificationId: classificationRow?.classification_id || null },
      modelDecision: modelDecision.modelDecision,
    });
  }

  async evaluateAndEmit(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const result = await this.evaluateAgentAuthority({
      ...body,
      principalUserId: body.principalUserId || scope.userId,
      organizationId: body.organizationId || scope.organizationId,
      tenantId: body.tenantId || scope.tenantId,
    });
    if (!result.allowed) {
      await this.emit(null, "agent_authority.denied", "ai_authority_evaluation", `denied_${randomUUID()}`, scope, {
        denial_code: result.denialCode,
      }).catch(() => null);
    }
    return result;
  }

  async createSession(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const delegationId = String(body.delegationId || body.delegation_id || "").trim();
    const delegation = await this.repo.getDelegation(delegationId, scope.organizationId, scope.tenantId);
    if (!delegation) throw new AiGovernanceError("NO_DELEGATION", "Delegation not found.", 404);
    const agentIdentifier = String(body.agentIdentifier || body.agent_identifier || "").trim();
    const getAgentIdentityByIdentifier = (this.repo as any).getAgentIdentityByIdentifier;
    if (typeof getAgentIdentityByIdentifier === "function") {
      const identity = await getAgentIdentityByIdentifier.call(this.repo, agentIdentifier, scope.organizationId, scope.tenantId);
      if (!identity || identity.status !== "ACTIVE") throw new AiGovernanceError("AGENT_IDENTITY_DISABLED", "Agent identity is not active.", 403);
    }
    const model = body.model || {};
    const evaluation = await this.evaluateAgentAuthority({
      principalUserId: scope.userId,
      agentIdentifier,
      organizationId: scope.organizationId,
      tenantId: scope.tenantId,
      delegation,
      purpose: body.purpose,
      resource: body.resource,
      action: body.action || "agent.session.open",
      model,
    });
    if (!evaluation.allowed) throw new AiGovernanceError(String(evaluation.denialCode), String(evaluation.denialCode), 403);
    const requestedExpiry = body.expiresAt || body.expires_at ? new Date(body.expiresAt || body.expires_at) : new Date(delegation.expires_at);
    const delegationExpiry = new Date(delegation.expires_at);
    const expiresAt = requestedExpiry < delegationExpiry ? requestedExpiry : delegationExpiry;
    const now = new Date();
    if (expiresAt <= now) throw new AiGovernanceError("SESSION_EXPIRY_REQUIRED", "Session requires future expiry.");
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.createSession({
        session_id: `ai_session_${randomUUID()}`,
        agent_identifier: String(body.agentIdentifier || body.agent_identifier),
        acting_for_user_id: scope.userId,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        delegation_id: delegation.delegation_id,
        declared_purpose: String(body.purpose),
        autonomy_profile: delegation.autonomy_profile,
        model_provider: model.providerIdentifier || model.provider_identifier || model.provider || null,
        model_identifier: model.modelIdentifier || model.model_identifier || model.model || null,
        started_at: now,
        expires_at: expiresAt,
        security_metadata: {
          ...(body.securityMetadata || body.security_metadata || {}),
          resource: body.resource || null,
          resourceScope: body.resourceScope || body.resource_scope || null,
          toolScope: body.toolScope || body.tool_scope || [],
          policySnapshot: body.policySnapshot || body.policy_snapshot || null,
          executionMode: body.executionMode || body.execution_mode || "GOVERNED_PRE_EXECUTION",
        },
      }, db);
      await this.emit(db, "agent_session.created", "ai_agent_session", row.session_id, scope, {
        delegation_id: row.delegation_id,
        agent_identifier: row.agent_identifier,
        expires_at: row.expires_at,
      });
      return toSessionResponse(row);
    });
  }

  async getSession(actor: Actor, sessionId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const row = await this.repo.getSession(sessionId, scope.organizationId, scope.tenantId);
    if (!row) throw new AiGovernanceError("SESSION_NOT_FOUND", "Session not found.", 404);
    return toSessionResponse(row);
  }

  async closeSession(actor: Actor, sessionId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.closeSession({
        session_id: sessionId,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        status: "CLOSED",
        close_reason: body.reason || body.closeReason || body.close_reason || null,
      }, db);
      if (!row) throw new AiGovernanceError("SESSION_NOT_FOUND", "Session not found or already closed.", 404);
      await this.emit(db, "agent_session.closed", "ai_agent_session", row.session_id, scope, {
        reason: row.close_reason || null,
      });
      return toSessionResponse(row);
    });
  }

  async createAgentIdentity(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const agentIdentifier = String(body.agentIdentifier || body.agent_identifier || "").trim();
    const agentType = String(body.agentType || body.agent_type || "governed_agent").trim();
    const allowedMode = String(body.allowedMode || body.allowed_mode || "LIMITED").trim().toUpperCase();
    if (!agentIdentifier) throw new AiGovernanceError("AGENT_REQUIRED", "Agent identifier is required.");
    if (!["OFF", "LIMITED", "ON"].includes(allowedMode)) throw new AiGovernanceError("AGENT_MODE_INVALID", "Agent mode is invalid.");
    const row = await this.repo.createAgentIdentity({ agent_identity_id: `ai_agent_identity_${randomUUID()}`, organization_id: scope.organizationId, tenant_id: scope.tenantId, agent_identifier: agentIdentifier, agent_type: agentType, allowed_mode: allowedMode, created_by: scope.userId });
    return toAgentIdentityResponse(row);
  }

  async listAgentIdentities(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    return (await this.repo.listAgentIdentities(scope.organizationId, scope.tenantId)).map(toAgentIdentityResponse);
  }

  async getAgentIdentity(actor: Actor, agentIdentityId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const row = await this.repo.getAgentIdentity(agentIdentityId, scope.organizationId, scope.tenantId);
    if (!row) throw new AiGovernanceError("AGENT_IDENTITY_NOT_FOUND", "Agent identity not found.", 404);
    return toAgentIdentityResponse(row);
  }

  async setAgentIdentityStatus(actor: Actor, agentIdentityId: string, status: "DISABLED" | "REVOKED") {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const row = await this.repo.setAgentIdentityStatus({ agent_identity_id: agentIdentityId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status });
    if (!row) throw new AiGovernanceError("AGENT_IDENTITY_NOT_FOUND", "Agent identity not found.", 404);
    const revokeActiveExecutionByAgent = (this.repo as any).revokeActiveExecutionByAgent;
    if (typeof revokeActiveExecutionByAgent === "function") {
      await revokeActiveExecutionByAgent.call(this.repo, row.agent_identity_id, scope.organizationId, scope.tenantId);
    }
    await this.emit(null, `agent_identity.${status.toLowerCase()}`, "ai_agent_identity", row.agent_identity_id, scope, { agent_identifier: row.agent_identifier });
    return toAgentIdentityResponse(row);
  }

  async createTask(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const agentIdentityId = String(body.agentIdentityId || body.agent_identity_id || "").trim();
    const sessionId = String(body.sessionId || body.session_id || "").trim();
    const delegationId = String(body.delegationId || body.delegation_id || "").trim();
    const taskType = String(body.taskType || body.task_type || "").trim();
    const purpose = String(body.purpose || "").trim();
    const requestedAction = String(body.requestedAction || body.requested_action || "").trim();
    const idempotencyKey = String(body.idempotencyKey || body.idempotency_key || "").trim();
    const consequenceClass = String(body.consequenceClass || body.consequence_class || "READ_ONLY").trim().toUpperCase();
    const inputSnapshot = body.inputSnapshot || body.input_snapshot || {};
    const resourceScope = normalizeResourceScope(body.resourceScope || body.resource_scope);
    const toolScope = Array.isArray(body.toolScope || body.tool_scope) ? Array.from(new Set((body.toolScope || body.tool_scope).map((value: any) => String(value).trim()).filter(Boolean))) : [];
    if (!agentIdentityId || !sessionId || !delegationId || !taskType || !purpose || !requestedAction || !idempotencyKey) throw new AiGovernanceError("TASK_REQUIRED", "Task identity, session, delegation, purpose, action, and idempotency key are required.");
    if (!["READ_ONLY", "REVERSIBLE_CHANGE", "EXTERNAL_SIDE_EFFECT", "CONSEQUENTIAL_HIGH_RISK"].includes(consequenceClass)) throw new AiGovernanceError("TASK_CONSEQUENCE_INVALID", "Task consequence class is invalid.");
    const serializedInput = stableJson(inputSnapshot);
    if (Buffer.byteLength(serializedInput, "utf8") > 32768) throw new AiGovernanceError("TASK_INPUT_TOO_LARGE", "Task input snapshot exceeds the bounded limit.");
    const scopeResources = resourceScope.resources;
    if (!scopeResources.length || resourceScope.all) throw new AiGovernanceError("TASK_SCOPE_REQUIRED", "Task requires explicit bounded resources.");
    const agent = await this.repo.getAgentIdentity(agentIdentityId, scope.organizationId, scope.tenantId);
    if (!agent || agent.status !== "ACTIVE") throw new AiGovernanceError("AGENT_IDENTITY_DISABLED", "Agent identity is not active.", 403);
    const delegation = await this.repo.getDelegation(delegationId, scope.organizationId, scope.tenantId);
    const session = await this.repo.getSession(sessionId, scope.organizationId, scope.tenantId);
    if (!delegation || !session) throw new AiGovernanceError("TASK_AUTHORITY_NOT_FOUND", "Task authority records were not found.", 404);
    if (session.status !== "ACTIVE") throw new AiGovernanceError("SESSION_NOT_ACTIVE", "Session is not active.", 403);
    if (session.agent_identifier !== agent.agent_identifier || session.delegation_id !== delegation.delegation_id || session.acting_for_user_id !== scope.userId) throw new AiGovernanceError("TASK_AUTHORITY_MISMATCH", "Task authority does not match the session.", 403);
    const resource = scopeResources[0];
    const evaluation = await this.evaluateAgentAuthority({ principalUserId: scope.userId, agentIdentifier: agent.agent_identifier, organizationId: scope.organizationId, tenantId: scope.tenantId, delegation, sessionId, purpose, resource, action: requestedAction, model: body.model || {} });
    if (!evaluation.allowed) throw new AiGovernanceError(String(evaluation.denialCode), String(evaluation.denialCode), 403);
    const policySnapshot = { delegationId, delegationExpiresAt: delegation.expires_at, sessionId, sessionExpiresAt: session.expires_at, evaluation, capturedAt: new Date().toISOString() };
    const actionHash = fingerprint({ requestedAction, resourceScope: { resources: scopeResources }, toolScope, purpose });
    const inputHash = fingerprint(inputSnapshot);
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.createTask({ task_id: `ai_task_${randomUUID()}`, organization_id: scope.organizationId, tenant_id: scope.tenantId, session_id: sessionId, agent_identity_id: agentIdentityId, delegation_id: delegationId, principal_user_id: scope.userId, task_type: taskType, purpose, requested_action: requestedAction, resource_scope: { resources: scopeResources, all: false }, tool_scope: toolScope, input_snapshot: inputSnapshot, input_hash: inputHash, action_hash: actionHash, consequence_class: consequenceClass, policy_snapshot: policySnapshot, provider_model: body.model || {}, idempotency_key: idempotencyKey, created_by: scope.userId }, db);
      if (!row) {
        const existing = (await this.repo.listTasks(scope.organizationId, scope.tenantId, db)).find((item: any) => item.idempotency_key === idempotencyKey);
        if (!existing) throw new AiGovernanceError("TASK_REPLAY_UNRESOLVED", "Task replay could not be resolved.", 409);
        return toTaskResponse(existing);
      }
      await this.emit(db, "agent.task.created", "ai_agent_task", row.task_id, scope, { session_id: sessionId, delegation_id: delegationId, action_hash: actionHash });
      return toTaskResponse(row);
    });
  }

  async listTasks(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    return (await this.repo.listTasks(scope.organizationId, scope.tenantId)).map(toTaskResponse);
  }

  async getTask(actor: Actor, taskId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const row = await this.repo.getTask(taskId, scope.organizationId, scope.tenantId);
    if (!row) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
    return toTaskResponse(row);
  }

  async listTaskAttempts(actor: Actor, taskId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    if (!(await this.repo.getTask(taskId, scope.organizationId, scope.tenantId))) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
    return (await this.repo.listAttempts(taskId, scope.organizationId, scope.tenantId)).map(toTaskAttemptResponse);
  }

  private async recordSecurityEvent(scope: { userId: string; organizationId: string; tenantId: string }, input: any, executor?: Executor) {
    const row = await this.repo.createSecurityEvent({ ...input, security_event_id: `ai_security_${randomUUID()}`, organization_id: scope.organizationId, tenant_id: scope.tenantId, actor_user_id: input.actor_user_id || scope.userId }, executor);
    await this.emit(executor || null, "agent.governance.security_event", "ai_governance_security_event", row.security_event_id, scope, { event_type: row.event_type, task_id: row.task_id, approval_request_id: row.approval_request_id });
    return row;
  }

  async requestTaskApproval(actor: Actor, taskId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    return this.transaction(async (db: Executor) => {
      const task = await this.repo.getTask(taskId, scope.organizationId, scope.tenantId, db);
      if (!task) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
      if (task.consequence_class === "READ_ONLY") throw new AiGovernanceError("APPROVAL_NOT_REQUIRED", "Read-only tasks do not require human approval.", 409);
      const target = body.target || {};
      const targetType = String(target.type || target.resourceType || target.resource_type || "resource").trim();
      const targetId = String(target.id || target.resourceId || target.resource_id || (task.resource_scope?.resources || [])[0]?.resourceId || "").trim();
      const actionType = String(body.actionType || body.action_type || task.requested_action).trim();
      const owningDomain = String(body.owningDomain || body.owning_domain || "agent_fabric").trim();
      if (!targetId || !actionType || !owningDomain) throw new AiGovernanceError("PROPOSED_ACTION_REQUIRED", "Action type, owning domain, and target are required.");
      const parameterHash = fingerprint(body.parameters || {});
      const actionFingerprint = fingerprint({ taskId, taskActionHash: task.action_hash, actionType, owningDomain, targetType, targetId, parameterHash, consequenceClass: task.consequence_class, organizationId: scope.organizationId, tenantId: scope.tenantId });
      const proposal = await this.repo.createProposedAction({ proposed_action_id: `ai_proposed_action_${randomUUID()}`, task_id: taskId, organization_id: scope.organizationId, tenant_id: scope.tenantId, action_type: actionType, owning_domain: owningDomain, target_type: targetType, target_id: targetId, parameter_hash: parameterHash, consequence_class: task.consequence_class, side_effect_class: body.sideEffectClass || body.side_effect_class || task.consequence_class, action_fingerprint: actionFingerprint, task_action_hash: task.action_hash, policy_version: body.policyVersion || body.policy_version || null, requested_by: scope.userId }, db);
      const existing = proposal ? null : await this.repo.getApprovalForTask(taskId, scope.organizationId, scope.tenantId, db);
      const request = proposal ? await this.repo.createApprovalRequest({ approval_request_id: `ai_approval_${randomUUID()}`, task_id: taskId, proposed_action_id: proposal.proposed_action_id, organization_id: scope.organizationId, tenant_id: scope.tenantId, action_fingerprint: actionFingerprint, required_permission: SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE, requested_by: scope.userId, expires_at: body.expiresAt || body.expires_at || null }, db) : existing;
      if (!request) throw new AiGovernanceError("APPROVAL_REPLAY_UNRESOLVED", "Approval request replay could not be resolved.", 409);
      if (task.status !== "WAITING_APPROVAL" && task.status !== "AUTHORIZED" && task.status !== "COMPLETED") await this.repo.transitionTask({ task_id: taskId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: "WAITING_APPROVAL", from_status: task.status, reason: "HUMAN_APPROVAL_REQUIRED" }, db);
      await this.emit(db, "agent.task.approval_requested", "ai_agent_task_approval_request", request.approval_request_id, scope, { task_id: taskId, action_fingerprint: request.action_fingerprint });
      return { proposedAction: toProposedActionResponse(proposal || await this.repo.getApprovalForTask(taskId, scope.organizationId, scope.tenantId, db)), approvalRequest: toApprovalRequestResponse(request) };
    });
  }

  async listTaskApprovals(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    return (await this.repo.listApprovalRequests(scope.organizationId, scope.tenantId)).map(toApprovalRequestResponse);
  }

  async getTaskApproval(actor: Actor, approvalRequestId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    const request = await this.repo.getApprovalRequest(approvalRequestId, scope.organizationId, scope.tenantId);
    if (!request) throw new AiGovernanceError("APPROVAL_NOT_FOUND", "Approval request not found.", 404);
    return { approvalRequest: toApprovalRequestResponse(request), decisions: (await this.repo.listApprovalDecisions(approvalRequestId, scope.organizationId, scope.tenantId)).map(toApprovalDecisionResponse) };
  }

  async decideTaskApproval(actor: Actor, approvalRequestId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const decision = String(body.decision || "").trim().toUpperCase();
    if (!["APPROVED", "DENIED"].includes(decision)) throw new AiGovernanceError("APPROVAL_DECISION_INVALID", "Decision must be APPROVED or DENIED.");
    return this.transaction(async (db: Executor) => {
      const request = await this.repo.getApprovalRequest(approvalRequestId, scope.organizationId, scope.tenantId, db);
      if (!request) throw new AiGovernanceError("APPROVAL_NOT_FOUND", "Approval request not found.", 404);
      const task = await this.repo.getTask(request.task_id, scope.organizationId, scope.tenantId, db);
      if (!task) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
      if (task.principal_user_id === scope.userId && task.consequence_class !== "READ_ONLY") throw new AiGovernanceError("SELF_APPROVAL_DENIED", "The task principal cannot approve this consequential action.", 403);
      const current = await this.repo.getApprovalForTask(task.task_id, scope.organizationId, scope.tenantId, db);
      if (!current || current.task_action_hash !== task.action_hash || current.action_fingerprint !== request.action_fingerprint || ["CANCELLED", "REVOKED", "FAILED", "COMPLETED"].includes(task.status)) {
        // Commit the invalidation and security event outside the decision transaction;
        // the caller still receives the rejection without rolling those records back.
        await this.repo.setApprovalStatus({ approval_request_id: approvalRequestId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: "INVALIDATED" });
        await this.recordSecurityEvent(scope, { event_type: "STALE_APPROVAL_OR_INVALID_TASK", severity: "HIGH", task_id: task.task_id, session_id: task.session_id, agent_identity_id: task.agent_identity_id, approval_request_id: approvalRequestId, action_fingerprint: request.action_fingerprint, metadata: { currentActionHash: task.action_hash, approvedActionFingerprint: request.action_fingerprint } });
        throw new AiGovernanceError("STALE_APPROVAL", "Approval no longer matches the current task action.", 409);
      }
      if (request.status !== "PENDING") {
        const prior = await this.repo.listApprovalDecisions(approvalRequestId, scope.organizationId, scope.tenantId, db);
        return { approvalRequest: toApprovalRequestResponse(request), decision: prior[prior.length - 1] ? toApprovalDecisionResponse(prior[prior.length - 1]) : null, replay: true };
      }
      const updated = await this.repo.setApprovalStatus({ approval_request_id: approvalRequestId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: decision }, db);
      const row = await this.repo.createApprovalDecision({ approval_decision_id: `ai_approval_decision_${randomUUID()}`, approval_request_id: approvalRequestId, organization_id: scope.organizationId, tenant_id: scope.tenantId, decision, action_fingerprint: request.action_fingerprint, approver_user_id: scope.userId, reason: body.reason || null }, db);
      if (decision === "APPROVED") {
        if (task.status !== "WAITING_APPROVAL") throw new AiGovernanceError("TASK_APPROVAL_STATE_INVALID", "Task is not waiting for approval.", 409);
        await this.repo.transitionTask({ task_id: task.task_id, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: "AUTHORIZED", from_status: task.status, reason: "HUMAN_APPROVED_EXACT_ACTION" }, db);
      }
      await this.emit(db, `agent.task.approval_${decision.toLowerCase()}`, "ai_agent_task_approval_request", approvalRequestId, scope, { task_id: task.task_id, action_fingerprint: request.action_fingerprint, approver_user_id: scope.userId });
      return { approvalRequest: toApprovalRequestResponse(updated || request), decision: toApprovalDecisionResponse(row) };
    });
  }

  async listSecurityEvents(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    return (await this.repo.listSecurityEvents(scope.organizationId, scope.tenantId)).map(toSecurityEventResponse);
  }

  async recordTaskAttempt(actor: Actor, taskId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const task = await this.repo.getTask(taskId, scope.organizationId, scope.tenantId);
    if (!task) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
    const status = String(body.status || "FAILED").toUpperCase();
    if (!["FAILED", "CANCELLED", "REVOKED", "RECORDED"].includes(status)) throw new AiGovernanceError("ATTEMPT_STATUS_INVALID", "Attempt status is invalid.");
    if (["CANCELLED", "REVOKED", "COMPLETED"].includes(task.status)) throw new AiGovernanceError("TASK_TERMINAL", "Terminal task cannot receive another attempt.", 409);
    const attempts = await this.repo.listAttempts(taskId, scope.organizationId, scope.tenantId);
    const row = await this.repo.createAttempt({ attempt_id: `ai_task_attempt_${randomUUID()}`, task_id: taskId, organization_id: scope.organizationId, tenant_id: scope.tenantId, sequence: attempts.length + 1, provider_model: body.model || task.provider_model || {}, status, error_class: body.errorClass || body.error_class || null, result_metadata: body.resultMetadata || body.result_metadata || {}, started_at: body.startedAt || body.started_at || new Date(), finished_at: body.finishedAt || body.finished_at || new Date(), created_by: scope.userId });
    await this.emit(null, `agent.task.attempt_${status.toLowerCase()}`, "ai_agent_task_attempt", row.attempt_id, scope, { task_id: taskId, sequence: row.sequence });
    return toTaskAttemptResponse(row);
  }

  async transitionTask(actor: Actor, taskId: string, nextStatus: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const task = await this.repo.getTask(taskId, scope.organizationId, scope.tenantId);
    if (!task) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
    if (nextStatus === "AUTHORIZED" && task.consequence_class !== "READ_ONLY") {
      const approval = await this.repo.getApprovalForTask(taskId, scope.organizationId, scope.tenantId);
      if (!approval || approval.status !== "APPROVED" || approval.task_action_hash !== task.action_hash || (approval.expires_at && new Date(approval.expires_at) <= new Date())) throw new AiGovernanceError("APPROVAL_REQUIRED", "A current approval bound to the exact task action is required.", 403);
    }
    const transitions: Record<string, string[]> = { REQUESTED: ["VALIDATED", "CANCELLED", "REVOKED"], VALIDATED: ["AUTHORIZED", "WAITING_APPROVAL", "READY", "CANCELLED", "REVOKED"], AUTHORIZED: ["READY", "WAITING_APPROVAL", "PAUSED", "CANCELLED", "REVOKED"], WAITING_APPROVAL: ["AUTHORIZED", "CANCELLED", "REVOKED"], READY: ["PAUSED", "CANCELLED", "REVOKED", "FAILED"], PAUSED: ["READY", "CANCELLED", "REVOKED"], RUNNING: ["CANCELLED", "REVOKED"] };
    if (!transitions[task.status]?.includes(nextStatus)) throw new AiGovernanceError("TASK_TRANSITION_DENIED", `Transition ${task.status} -> ${nextStatus} is not allowed.`, 409);
    if (["AUTHORIZED", "READY"].includes(nextStatus)) {
      const delegation = await this.repo.getDelegation(task.delegation_id, scope.organizationId, scope.tenantId);
      if (!delegation || delegation.revoked_at || new Date(delegation.expires_at) <= new Date()) throw new AiGovernanceError("TASK_AUTHORITY_REVOKED", "Task delegation is no longer valid.", 403);
      const agent = await this.repo.getAgentIdentity(task.agent_identity_id, scope.organizationId, scope.tenantId);
      if (!agent || agent.status !== "ACTIVE") throw new AiGovernanceError("AGENT_IDENTITY_DISABLED", "Agent identity is not active.", 403);
    }
    return this.transaction(async (db: Executor) => {
      const row = await this.repo.transitionTask({ task_id: taskId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: nextStatus, from_status: task.status, reason: body.reason || null }, db);
      if (!row) throw new AiGovernanceError("TASK_TRANSITION_CONFLICT", "Task changed before transition.", 409);
      await this.emit(db, `agent.task.${nextStatus.toLowerCase()}`, "ai_agent_task", taskId, scope, { from_status: task.status, to_status: nextStatus });
      return toTaskResponse(row);
    });
  }

  async cancelTask(actor: Actor, taskId: string, body: any = {}) {
    const result = await this.transitionTask(actor, taskId, "CANCELLED", body);
    const scope = actorScope(actor);
    await this.repo.cancelActiveAttempts(taskId, scope.organizationId, scope.tenantId, body.reason || "CANCELLED");
    await this.repo.invalidateApprovalsForTask(taskId, scope.organizationId, scope.tenantId, "CANCELLED");
    return result;
  }

  async createWorker(actor: Actor, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE);
    const scope = actorScope(actor);
    const workerIdentifier = String(body.workerIdentifier || body.worker_identifier || "").trim();
    const executionMode = String(body.executionMode || body.execution_mode || "TEST_SAFE").trim().toUpperCase();
    if (!workerIdentifier) throw new AiGovernanceError("WORKER_REQUIRED", "Worker identifier is required.");
    if (!["TEST_SAFE", "SIMULATION"].includes(executionMode)) throw new AiGovernanceError("WORKER_MODE_INVALID", "Worker execution mode is invalid.");
    return toWorkerResponse(await this.repo.createWorker({ worker_id: `ai_worker_${randomUUID()}`, organization_id: scope.organizationId, tenant_id: scope.tenantId, worker_identifier: workerIdentifier, execution_mode: executionMode, registered_by: scope.userId }));
  }

  async listWorkers(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW);
    const scope = actorScope(actor);
    return (await this.repo.listWorkers(scope.organizationId, scope.tenantId)).map(toWorkerResponse);
  }

  private async assertRunnableTask(actor: Actor, taskId: string, workerId: string) {
    if (!safeExecutionEnabled()) throw new AiGovernanceError("EXECUTION_DISABLED", "Safe execution is disabled by the Agent Fabric execution gate.", 403);
    const scope = actorScope(actor);
    const task = await this.repo.getTask(taskId, scope.organizationId, scope.tenantId);
    const worker = await this.repo.getWorker(workerId, scope.organizationId, scope.tenantId);
    if (!task) throw new AiGovernanceError("TASK_NOT_FOUND", "Task not found.", 404);
    if (!worker || worker.status !== "ACTIVE" || !["TEST_SAFE", "SIMULATION"].includes(worker.execution_mode)) throw new AiGovernanceError("WORKER_NOT_ALLOWED", "Worker is not active for safe execution.", 403);
    if (!SAFE_TASK_TYPES.has(task.task_type)) throw new AiGovernanceError("TASK_TYPE_NOT_ALLOWED", "Task type is not registered for safe execution.", 403);
    if (task.consequence_class !== "READ_ONLY") throw new AiGovernanceError("CONSEQUENCE_BLOCKED", "Only read-only tasks are eligible for the safe runner.", 403);
    const resources = Array.isArray(task.resource_scope?.resources) ? task.resource_scope.resources : [];
    const resource = resources[0];
    const delegation = await this.repo.getDelegation(task.delegation_id, scope.organizationId, scope.tenantId);
    if (!delegation || delegation.revoked_at || new Date(delegation.expires_at) <= new Date()) throw new AiGovernanceError("TASK_AUTHORITY_REVOKED", "Task authority is no longer valid.", 403);
    const evaluation = await this.evaluateAgentAuthority({ principalUserId: scope.userId, agentIdentifier: (await this.repo.getAgentIdentity(task.agent_identity_id, scope.organizationId, scope.tenantId))?.agent_identifier, organizationId: scope.organizationId, tenantId: scope.tenantId, delegation, sessionId: task.session_id, purpose: task.purpose, resource, action: task.requested_action, model: task.provider_model || {} });
    if (!evaluation.allowed) throw new AiGovernanceError(String(evaluation.denialCode), String(evaluation.denialCode), 403);
    return { scope, task, worker };
  }

  async claimTask(actor: Actor, taskId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const workerId = String(body.workerId || body.worker_id || "").trim();
    if (!workerId) throw new AiGovernanceError("WORKER_REQUIRED", "Worker is required.");
    const { scope, task } = await this.assertRunnableTask(actor, taskId, workerId);
    return this.transaction(async (db: Executor) => {
      const claimed = await this.repo.claimTask({ task_id: taskId, organization_id: scope.organizationId, tenant_id: scope.tenantId, worker_id: workerId, lease_seconds: Math.min(Math.max(Number(body.leaseSeconds || 30), 5), 300), policy_binding_hash: task.policy_snapshot?.evaluation ? fingerprint(task.policy_snapshot.evaluation) : null, action_binding_hash: task.action_hash, created_by: scope.userId }, db);
      if (!claimed) throw new AiGovernanceError("TASK_CLAIM_CONFLICT", "Task is not ready or is already claimed.", 409);
      await this.emit(db, "agent.task.attempt_claimed", "ai_agent_task_attempt", claimed.attempt.attempt_id, scope, { task_id: taskId, worker_id: workerId, sequence: claimed.attempt.sequence });
      return { task: toTaskResponse(claimed.task), attempt: toTaskAttemptResponse(claimed.attempt) };
    });
  }

  async heartbeatAttempt(actor: Actor, taskId: string, attemptId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const workerId = String(body.workerId || body.worker_id || "").trim();
    const row = await this.repo.heartbeatAttempt({ task_id: taskId, attempt_id: attemptId, worker_id: workerId, organization_id: scope.organizationId, tenant_id: scope.tenantId, lease_seconds: Math.min(Math.max(Number(body.leaseSeconds || 30), 5), 300) });
    if (!row) throw new AiGovernanceError("ATTEMPT_NOT_ACTIVE", "Attempt is not active for this worker.", 409);
    return toTaskAttemptResponse(row);
  }

  async completeAttempt(actor: Actor, taskId: string, attemptId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const workerId = String(body.workerId || body.worker_id || "").trim();
    const { scope } = await this.assertRunnableTask(actor, taskId, workerId);
    return this.transaction(async (db: Executor) => {
      const completed = await this.repo.completeAttempt({ task_id: taskId, attempt_id: attemptId, worker_id: workerId, organization_id: scope.organizationId, tenant_id: scope.tenantId, checkpoint: body.checkpoint || { completed: true }, result_metadata: { runner: "bounded_safe_runner", result: "SAFE_RESULT" } }, db);
      if (!completed) throw new AiGovernanceError("ATTEMPT_NOT_ACTIVE", "Attempt is not active for this worker.", 409);
      await this.emit(db, "agent.task.succeeded", "ai_agent_task", taskId, scope, { attempt_id: attemptId, execution_mode: "TEST_SAFE" });
      return { task: toTaskResponse(completed.task), attempt: toTaskAttemptResponse(completed.attempt) };
    });
  }

  async failAttempt(actor: Actor, taskId: string, attemptId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const workerId = String(body.workerId || body.worker_id || "").trim();
    return this.transaction(async (db: Executor) => {
      const failed = await this.repo.failAttempt({ task_id: taskId, attempt_id: attemptId, worker_id: workerId, organization_id: scope.organizationId, tenant_id: scope.tenantId, status: "FAILED", error_class: body.errorClass || "TRANSIENT_PROVIDER_FAILURE", retryable: body.retryable === true, result_metadata: body.resultMetadata || {} }, db);
      if (!failed) throw new AiGovernanceError("ATTEMPT_NOT_ACTIVE", "Attempt is not active for this worker.", 409);
      await this.emit(db, "agent.task.failed", "ai_agent_task", taskId, scope, { attempt_id: attemptId, error_class: failed.attempt.error_class, retryable: failed.attempt.retryable });
      return { task: toTaskResponse(failed.task), attempt: toTaskAttemptResponse(failed.attempt) };
    });
  }

  async retryTask(actor: Actor, taskId: string, body: any = {}) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const row = await this.transaction((db: Executor) => this.repo.retryTask({ task_id: taskId, organization_id: scope.organizationId, tenant_id: scope.tenantId, max_attempts: Math.min(Math.max(Number(body.maxAttempts || 3), 1), 5) }, db));
    if (!row || row.exhausted) throw new AiGovernanceError("RETRY_EXHAUSTED", "Task retry limit reached or task is not retryable.", 409);
    await this.emit(null, "agent.task.retry_ready", "ai_agent_task", taskId, scope, { max_attempts: body.maxAttempts || 3 });
    return toTaskResponse(row);
  }

  async expireLeases(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE);
    const scope = actorScope(actor);
    const rows = await this.transaction((db: Executor) => this.repo.expireLeases(new Date(), db));
    await Promise.all(rows.map((row) => this.emit(null, "agent.task.lease_expired", "ai_agent_task_attempt", row.attempt_id, scope, { task_id: row.task_id })));
    return rows.map(toTaskAttemptResponse);
  }
}
