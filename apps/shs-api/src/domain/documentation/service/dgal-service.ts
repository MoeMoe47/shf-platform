import { randomUUID } from "node:crypto";
import { normalizeActorOrganization, safeActionReference, type DgalActor, type RequirementContext, type RequirementResolution, type ResolvedRequirement } from "../model/dgal.js";
import { DgalRepository } from "../repo/dgal-repo.js";

function asArray(value: unknown) { return Array.isArray(value) ? value.map(String) : []; }

export class DgalError extends Error { constructor(public readonly code: string, message = code, public readonly statusCode = 400) { super(message); this.name = "DgalError"; } }

export class DgalService {
  constructor(private readonly repo = new DgalRepository()) {}
  private scope(actor: DgalActor, context: RequirementContext = {}) {
    const actorScope = normalizeActorOrganization(actor);
    const organizationId = String(context.organizationId || actorScope.organizationId).trim();
    const tenantId = String(context.tenantId || actorScope.tenantId).trim();
    if (organizationId !== actorScope.organizationId || tenantId !== actorScope.tenantId) throw new DgalError("ORG_SCOPE_FORBIDDEN", "DGAL context must use the actor's active organization and tenant.", 403);
    return { ...actorScope, organizationId };
  }
  private requireRegistryWrite(actor: DgalActor) { if (!asArray(actor.permissions).includes("documentation.registry.manage")) throw new DgalError("FORBIDDEN", "DGAL registry management permission is required.", 403); normalizeActorOrganization(actor); }
  private requireLegalOwnerPermission(actor: DgalActor, owningDomain: unknown) {
    if (String(owningDomain || "").toUpperCase() === "LEGAL" && !asArray(actor.permissions).includes("legal.artifact.manage")) throw new DgalError("LEGAL_OWNER_REQUIRED", "Legal-owned content requires the canonical Legal owner permission.", 403);
  }
  async createDocumentType(actor: DgalActor, input: any) { this.requireRegistryWrite(actor); return this.repo.createDocumentType({ ...input, documentTypeId: input.documentTypeId || `dgal_dt_${randomUUID()}` }); }
  async createGuidanceItem(actor: DgalActor, input: any) { this.requireRegistryWrite(actor); const scope = input.organizationId ? this.scope(actor,input) : null; return this.repo.createGuidanceItem({ ...input, actionReference: safeActionReference(input.actionReference), guidanceItemId: input.guidanceItemId || `dgal_gi_${randomUUID()}`, organizationId: scope?.organizationId || null, tenantId: scope?.tenantId || null }); }
  async createGuidanceCollection(actor: DgalActor, input: any) { this.requireRegistryWrite(actor); const scope = input.organizationId ? this.scope(actor,input) : null; return this.repo.createGuidanceCollection({ ...input, guidanceCollectionId: input.guidanceCollectionId || `dgal_gc_${randomUUID()}`, organizationId: scope?.organizationId || null, tenantId: scope?.tenantId || null }); }
  async createTemplate(actor: DgalActor, input: any) { this.requireRegistryWrite(actor); this.requireLegalOwnerPermission(actor, input.owningDomain); const scope = input.organizationId ? this.scope(actor,input) : null; return this.repo.createTemplate({ ...input, templateId: input.templateId || `dgal_tpl_${randomUUID()}`, organizationId: scope?.organizationId || null, tenantId: scope?.tenantId || null }); }
  async createTemplateVersion(actor: DgalActor, input: any) { this.requireRegistryWrite(actor); if (!input.templateId || !input.versionNumber || !input.revision || !input.sourceReference) throw new DgalError("INVALID_TEMPLATE_VERSION", "templateId, versionNumber, revision, and sourceReference are required."); const template = typeof (this.repo as any).getTemplateContext === "function" ? await (this.repo as any).getTemplateContext(input.templateId) : null; this.requireLegalOwnerPermission(actor, template?.owning_domain); return this.repo.createTemplateVersion({ ...input, templateVersionId: input.templateVersionId || `dgal_tv_${randomUUID()}` }); }
  async activateTemplateVersion(actor: DgalActor, templateVersionId: string, effectiveAt = new Date(), expectedStatus?: string) { this.requireRegistryWrite(actor); const context = typeof (this.repo as any).getTemplateVersionContext === "function" ? await (this.repo as any).getTemplateVersionContext(templateVersionId) : null; if (typeof (this.repo as any).getTemplateVersionContext === "function" && !context) throw new DgalError("TEMPLATE_VERSION_NOT_FOUND", "Template version was not found.", 404); this.requireLegalOwnerPermission(actor, context?.owning_domain); if (expectedStatus && context?.status !== expectedStatus) throw new DgalError("TEMPLATE_VERSION_STALE", "The template version changed. Reload before publishing.", 409); const version = await this.repo.activateTemplateVersion(templateVersionId,effectiveAt); if (!version) throw new DgalError("TEMPLATE_VERSION_NOT_FOUND", "Template version was not found.", 404); return version; }
  async archiveTemplateVersion(actor: DgalActor, templateVersionId: string, expectedStatus?: string) { this.requireRegistryWrite(actor); const context = typeof (this.repo as any).getTemplateVersionContext === "function" ? await (this.repo as any).getTemplateVersionContext(templateVersionId) : null; if (typeof (this.repo as any).getTemplateVersionContext === "function" && !context) throw new DgalError("TEMPLATE_VERSION_NOT_FOUND", "Template version was not found.", 404); this.requireLegalOwnerPermission(actor, context?.owning_domain); if (expectedStatus && context?.status !== expectedStatus) throw new DgalError("TEMPLATE_VERSION_STALE", "The template version changed. Reload before archiving.", 409); const version = await this.repo.setTemplateVersionStatus(templateVersionId, "RETIRED", expectedStatus); if (!version) throw new DgalError("TEMPLATE_VERSION_STALE", "The template version changed. Reload before archiving.", 409); return version; }
  async registryOverview(actor: DgalActor) { this.requireRegistryWrite(actor); const scope = normalizeActorOrganization(actor); const templates = await this.repo.listTemplates(scope); const versions = (await Promise.all(templates.map((template: any) => this.repo.listTemplateVersions(template.template_id)))).flat(); const rules = await this.repo.listRequirementRules(scope); return { templates, versions, rules }; }
  async createRequirementRule(actor: DgalActor, input: any) { this.requireRegistryWrite(actor); const scope = input.organizationId ? this.scope(actor,input) : null; if (!input.ruleKey || !input.owningDomain || !input.requirementType || !input.sourceReference) throw new DgalError("INVALID_REQUIREMENT_RULE", "ruleKey, owningDomain, requirementType, and sourceReference are required."); return this.repo.createRequirementRule({ ...input, actionReference: safeActionReference(input.actionReference), requirementRuleId: input.requirementRuleId || `dgal_rr_${randomUUID()}`, organizationId: scope?.organizationId || null, tenantId: scope?.tenantId || null }); }

  async resolveDocumentationRequirements(actor: DgalActor, context: RequirementContext = {}): Promise<RequirementResolution> {
    const scope = this.scope(actor,context); const serviceKey = context.serviceKey ? String(context.serviceKey).trim() : null; const roles = context.roles?.length ? context.roles.map(String) : asArray(actor.roles); const now = context.now || new Date();
    const resolvedContext = { organizationId: scope.organizationId, tenantId: scope.tenantId, serviceKey, roles, workflowType: context.workflowType || null, workflowStage: context.workflowStage || null, resourceType: context.resourceType || null };
    if (serviceKey) {
      try {
        const entitlement = await this.repo.getActiveEntitlement(scope.organizationId,serviceKey);
        if (!entitlement?.available) return { status:"UNKNOWN", requirements:[], unresolved:["service_entitlement"], context:resolvedContext };
        context = { ...context, entitlementStatus: entitlement.status as any };
      } catch {
        return { status:"UNKNOWN", requirements:[], unresolved:["service_entitlement"], context:resolvedContext };
      }
    }
    const rows = await this.repo.listRules({ organizationId:scope.organizationId, tenantId:scope.tenantId, serviceKey, now });
    const applicable = rows.filter((row: any) => {
      if (row.organization_type && row.organization_type !== context.organizationType) return false;
      if (row.relationship_type && row.relationship_type !== context.relationshipType) return false;
      if (row.workflow_type && row.workflow_type !== context.workflowType) return false;
      if (row.workflow_stage && row.workflow_stage !== context.workflowStage) return false;
      if (row.resource_type && row.resource_type !== context.resourceType) return false;
      if (row.policy_reference && row.policy_reference !== context.policyReference) return false;
      if (row.audience_roles?.length && !row.audience_roles.some((role: string) => roles.includes(role))) return false;
      if (row.requires_entitlement && row.service_key && context.entitlementStatus !== "ACTIVE") return false;
      return true;
    });
    const selected = new Map<string, any>();
    for (const row of applicable) { const key = row.template_id || row.document_type_id || row.guidance_item_id || row.rule_key; const previous = selected.get(key); if (previous && previous.required !== row.required && previous.priority === row.priority) return { status:"UNKNOWN", requirements:[], unresolved:[`conflicting_rules:${key}`], context:resolvedContext }; if (!previous || row.priority < previous.priority) { if (previous) row.source_reference = `${row.source_reference},${previous.source_reference}`; selected.set(key,row); } else { previous.source_reference = `${previous.source_reference},${row.source_reference}`; } }
    const requirements: ResolvedRequirement[] = [...selected.values()].map((row: any) => ({ requirementId:row.requirement_rule_id, ruleKey:row.rule_key, requirementType:row.requirement_type, required:Boolean(row.required), title:row.document_type_title || row.guidance_title || row.rule_key, explanation:row.guidance_explanation || `${row.requirement_type} applies from ${row.owning_domain}.`, sourceDomain:row.owning_domain, sourceReference:row.source_reference, organizationId:scope.organizationId, serviceKey:row.service_key || null, workflowType:row.workflow_type || null, workflowStage:row.workflow_stage || null, resourceType:row.resource_type || null, documentTypeId:row.document_type_id || null, templateId:row.template_id || null, guidanceItemId:row.guidance_item_id || null, actionReference:safeActionReference(row.action_reference), priority:row.priority, versionReference:row.active_template_version ? `${row.template_id}:${row.active_template_version}:${row.active_template_revision}` : null, sources:String(row.source_reference).split(",").filter(Boolean) })).sort((a,b) => a.priority - b.priority || a.requirementId.localeCompare(b.requirementId));
    return requirements.length ? { status:"RESOLVED", requirements, context:resolvedContext } : { status:"NO_REQUIREMENTS", requirements:[], context:resolvedContext };
  }
}
