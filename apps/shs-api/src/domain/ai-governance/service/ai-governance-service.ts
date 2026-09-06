import { randomUUID } from "node:crypto";
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

function allowed(detail: Record<string, unknown>) {
  return { allowed: true, denialCode: null, ...detail };
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
    const model = body.model || {};
    const evaluation = await this.evaluateAgentAuthority({
      principalUserId: scope.userId,
      agentIdentifier: body.agentIdentifier || body.agent_identifier,
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
        security_metadata: body.securityMetadata || body.security_metadata || {},
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
}
