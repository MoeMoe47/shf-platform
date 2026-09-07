import { randomUUID } from "node:crypto";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { assuranceScope, requireScope, toPublicRow, type AssuranceActor } from "../model/government-assurance.js";
import {
  GPA_ACTION_CLASSES, GPA_PURPOSES, GPA_SOURCE_SCOPE_CODES, classificationRank, fieldsAllowed,
  normalizeClassification, policyAllows, type GpaActionClass,
} from "../model/source-scope.js";
import { SourceScopeRepo } from "../repo/source-scope-repo.js";

function normalizeActor(actor: any): AssuranceActor {
  return {
    userId: String(actor?.userId || actor?.user_id || actor?.id || ""),
    organizationId: String(actor?.organizationId || actor?.organization_id || actor?.active_organization_id || ""),
    tenantId: String(actor?.tenantId || actor?.tenant_id || ""),
    permissions: actor?.permissions || [],
    actor_type: actor?.actor_type || actor?.actorType || "user",
    source: actor?.source,
  };
}

function date(value: any, fallback = new Date()) {
  const result = value ? new Date(value) : fallback;
  if (Number.isNaN(result.getTime())) throw new Error("GPA_SOURCE_SCOPE_INVALID_DATE");
  return result;
}

function permission(actor: AssuranceActor, name: string) {
  if (!hasPermission(actor.permissions || [], name)) throw new Error("GPA_SOURCE_SCOPE_PERMISSION_REQUIRED");
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

export type SourceAccessInput = {
  sourceSystemId: string;
  purposeId: string;
  actionClass: GpaActionClass;
  action: string;
  dataDomain: string;
  recordType: string;
  requestedFields?: string[];
  requestedClassification?: string;
  programReference?: string;
  jurisdictionId?: string;
  correlationId?: string;
  agentAuthority?: { valid: boolean; allowedActions?: string[]; classificationCeiling?: string };
};

export class SourceScopeService {
  constructor(private repo = new SourceScopeRepo()) {}

  private context(actorInput: any) {
    const actor = normalizeActor(actorInput);
    return { actor, scope: assuranceScope(actor) };
  }

  async createJurisdiction(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_MANAGE); requireScope(input, scope);
    if (!input.jurisdictionId || !input.jurisdictionType || !input.canonicalName) throw new Error("GPA_JURISDICTION_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createJurisdiction({
      jurisdiction_id: String(input.jurisdictionId), organization_id: scope.organizationId, tenant_id: scope.tenantId,
      jurisdiction_type: String(input.jurisdictionType), canonical_name: String(input.canonicalName), state_country_code: input.stateCountryCode,
      geographic_reference: input.geographicReference, parent_jurisdiction_id: input.parentJurisdictionId,
      effective_from: date(input.effectiveFrom), effective_to: input.effectiveTo, status: input.status || "ACTIVE", created_by: scope.userId, provenance_json: input.provenance,
    }));
  }

  async listJurisdictions(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listJurisdictions(scope)).map(toPublicRow);
  }

  async createSourceSystem(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_MANAGE); requireScope(input, scope);
    if (!input.sourceSystemId || !input.canonicalName || !input.sourceOwnerReference || !input.environment || !input.systemType || !input.integrationMode) throw new Error("GPA_SOURCE_SYSTEM_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createSourceSystem({
      source_system_id: String(input.sourceSystemId), organization_id: scope.organizationId, tenant_id: scope.tenantId,
      canonical_name: String(input.canonicalName), provider_vendor: input.providerVendor, source_owner_reference: String(input.sourceOwnerReference),
      jurisdiction_id: input.jurisdictionId, environment: String(input.environment), system_type: String(input.systemType),
      data_domains: input.dataDomains || [], record_types: input.recordTypes || [], authority_role: input.authorityRole,
      authority_precedence: Number(input.authorityPrecedence || 0), effective_from: date(input.effectiveFrom), effective_to: input.effectiveTo,
      status: input.status || "DRAFT", data_classification: normalizeClassification(input.dataClassification), integration_mode: String(input.integrationMode),
      credential_reference: input.credentialReference || null, last_verified_metadata_at: input.lastVerifiedMetadataAt, provenance_json: input.provenance, created_by: scope.userId,
    }));
  }

  async listSourceSystems(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listSourceSystems(scope)).map(toPublicRow).map((row: any) => { delete row.credentialReference; return row; });
  }

  async getSourceSystem(actorInput: any, id: string) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    const row = await this.repo.getSourceSystem(id, scope);
    if (!row) return null;
    const safe = toPublicRow(row); delete safe.credentialReference; return safe;
  }

  async listSourceHealth(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listSourceHealth(scope)).map(toPublicRow);
  }

  async listMappings(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listMappings(scope)).map(toPublicRow);
  }

  async createPolicy(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_MANAGE); requireScope(input, scope);
    if (!input.policyId || !input.version || !input.allowedPurposes || !input.allowedActions || !input.allowedDataDomains || !input.allowedRecordTypes) throw new Error("GPA_DATA_USE_POLICY_FIELDS_REQUIRED");
    const purposes = list(input.allowedPurposes);
    if (purposes.some((purpose) => !GPA_PURPOSES.includes(purpose as any))) throw new Error(GPA_SOURCE_SCOPE_CODES.PURPOSE_NOT_FOUND);
    return toPublicRow(await this.repo.createPolicy({
      policy_id: String(input.policyId), version: Number(input.version), organization_id: scope.organizationId, tenant_id: scope.tenantId,
      source_system_id: input.sourceSystemId, source_class: input.sourceClass, allowed_purposes: purposes, allowed_actions: input.allowedActions, allowed_action_classes: input.allowedActionClasses || ["READ"],
      allowed_data_domains: input.allowedDataDomains, allowed_record_types: input.allowedRecordTypes, allowed_fields: input.allowedFields || [],
      jurisdiction_id: input.jurisdictionId, legal_basis_reference: input.legalBasisReference, agreement_reference: input.agreementReference,
      requires_legal_basis: input.requiresLegalBasis !== false, requires_agreement: input.requiresAgreement === true,
      classification_ceiling: normalizeClassification(input.classificationCeiling), retention_rule_reference: input.retentionRuleReference,
      redisclosure_rule: input.redisclosureRule, effective_from: date(input.effectiveFrom), effective_to: input.effectiveTo,
      status: input.status || "DRAFT", approved_by: input.approvedBy, provenance_json: input.provenance, created_by: scope.userId,
    }));
  }

  async listPolicies(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listPolicies(scope)).map(toPublicRow);
  }

  async createProvenance(actorInput: any, input: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_MANAGE); requireScope(input, scope);
    if (!input.provenanceId || !input.sourceSystemId || !input.sourceRecordId || !input.actorServiceIdentity || !input.correlationId || !input.validationStatus) throw new Error("GPA_PROVENANCE_FIELDS_REQUIRED");
    return toPublicRow(await this.repo.createProvenance({
      provenance_id: String(input.provenanceId), organization_id: scope.organizationId, tenant_id: scope.tenantId,
      source_system_id: String(input.sourceSystemId), source_record_id: String(input.sourceRecordId), connector_id: input.connectorId,
      connector_version: input.connectorVersion, jurisdiction_id: input.jurisdictionId, retrieved_at: date(input.retrievedAt),
      source_timestamp: input.sourceTimestamp, batch_event_id: input.batchEventId, transformation_reference: input.transformationReference,
      validation_status: input.validationStatus, rejected_reason: input.rejectedReason, data_use_policy_id: input.dataUsePolicyId,
      data_use_policy_version: input.dataUsePolicyVersion, actor_service_identity: String(input.actorServiceIdentity), correlation_id: String(input.correlationId), provenance_json: input.provenance,
    }));
  }

  async listAccessDecisions(actorInput: any) {
    const { actor, scope } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listAccessDecisions(scope)).map(toPublicRow);
  }

  async listPurposes(actorInput: any) {
    const { actor } = this.context(actorInput); permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW);
    return (await this.repo.listPurposes()).map(toPublicRow);
  }

  async evaluateAccess(actorInput: any, input: SourceAccessInput) {
    const { actor, scope } = this.context(actorInput);
    permission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_ACCESS_EVALUATE);
    const requestedClassificationHint = normalizeClassification(input.requestedClassification);
    if (!input.sourceSystemId || !input.purposeId || !input.action || !input.dataDomain || !input.recordType || !GPA_ACTION_CLASSES.includes(input.actionClass)) throw new Error(GPA_SOURCE_SCOPE_CODES.SOURCE_SCOPE_REQUIRED);
    const source = await this.repo.getSourceSystem(input.sourceSystemId, scope);
    if (!source) return { allowed: false, decision: "DENY", reasonCode: GPA_SOURCE_SCOPE_CODES.SOURCE_NOT_FOUND };
    const requestedClassification = classificationRank(source.data_classification) > classificationRank(requestedClassificationHint)
      ? normalizeClassification(source.data_classification)
      : requestedClassificationHint;
    if (source.status !== "ACTIVE") return this.recordDecision(scope, actor, input, requestedClassification, false, "GPA_SOURCE_SYSTEM_INACTIVE");
    if (!GPA_PURPOSES.includes(input.purposeId as any)) return this.recordDecision(scope, actor, input, requestedClassification, false, GPA_SOURCE_SCOPE_CODES.PURPOSE_NOT_FOUND);
    const now = new Date();
    const policies = await this.repo.listPolicies(scope);
    const policy = policies.find((candidate: any) => candidate.status === "ACTIVE" && (!candidate.source_system_id || candidate.source_system_id === input.sourceSystemId) && new Date(candidate.effective_from) <= now && (!candidate.effective_to || new Date(candidate.effective_to) > now));
    if (!policy) return this.recordDecision(scope, actor, input, requestedClassification, false, GPA_SOURCE_SCOPE_CODES.POLICY_NOT_FOUND);
    let reason = "GPA_ACCESS_ALLOWED";
    if (!policyAllows(policy, "allowed_purposes", input.purposeId)) reason = GPA_SOURCE_SCOPE_CODES.PURPOSE_DENIED;
    else if (!policyAllows(policy, "allowed_action_classes", input.actionClass) || !policyAllows(policy, "allowed_actions", input.action)) reason = GPA_SOURCE_SCOPE_CODES.ACTION_DENIED;
    else if (!policyAllows(policy, "allowed_data_domains", input.dataDomain)) reason = GPA_SOURCE_SCOPE_CODES.DATA_DOMAIN_DENIED;
    else if (!policyAllows(policy, "allowed_record_types", input.recordType)) reason = GPA_SOURCE_SCOPE_CODES.RECORD_TYPE_DENIED;
    else if (!fieldsAllowed(policy, input.requestedFields || [])) reason = GPA_SOURCE_SCOPE_CODES.FIELD_DENIED;
    else if (classificationRank(requestedClassification) > classificationRank(policy.classification_ceiling)) reason = GPA_SOURCE_SCOPE_CODES.CLASSIFICATION_DENIED;
    else if (policy.jurisdiction_id && policy.jurisdiction_id !== input.jurisdictionId) reason = GPA_SOURCE_SCOPE_CODES.JURISDICTION_DENIED;
    else if (policy.requires_legal_basis && !policy.legal_basis_reference) reason = GPA_SOURCE_SCOPE_CODES.LEGAL_BASIS_REQUIRED;
    else if (policy.requires_agreement && !policy.agreement_reference) reason = GPA_SOURCE_SCOPE_CODES.AGREEMENT_REQUIRED;
    else if (String(actor.actor_type).toLowerCase() === "agent" && (!input.agentAuthority?.valid || !(input.agentAuthority.allowedActions || []).includes(input.action) || classificationRank(requestedClassification) > classificationRank(input.agentAuthority.classificationCeiling || "PUBLIC"))) reason = GPA_SOURCE_SCOPE_CODES.AGENT_AUTHORITY_DENIED;
    const result = await this.recordDecision(scope, actor, input, requestedClassification, reason === "GPA_ACCESS_ALLOWED", reason, policy);
    return { ...result, policyId: policy.policy_id, policyVersion: policy.version };
  }

  private async recordDecision(scope: any, actor: AssuranceActor, input: SourceAccessInput, classification: string, allowed: boolean, reasonCode: string, policy?: any) {
    const row = await this.repo.createAccessDecision({
      access_decision_id: `gpa_access_${randomUUID()}`, organization_id: scope.organizationId, tenant_id: scope.tenantId,
      principal_reference: actor.userId, requesting_organization_id: scope.organizationId, source_system_id: input.sourceSystemId,
      program_reference: input.programReference, jurisdiction_id: input.jurisdictionId, purpose_id: input.purposeId,
      action_class: input.actionClass, action: input.action, data_domain: input.dataDomain, record_type: input.recordType,
      requested_fields: input.requestedFields || [], requested_classification: classification, policy_id: policy?.policy_id,
      policy_version: policy?.version, decision: allowed ? "ALLOW" : "DENY", reason_code: reasonCode, correlation_id: input.correlationId || `gpa_access_corr_${randomUUID()}`,
      metadata: { actorType: actor.actor_type },
    });
    return { allowed, decision: allowed ? "ALLOW" : "DENY", reasonCode, accessDecisionId: row?.access_decision_id || row?.accessDecisionId };
  }
}
