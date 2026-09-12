import { query } from "../../../db/client.js";

export class DgalRepository {
  constructor(private executor: any = { query }) {}
  async createDocumentType(input: any) { return this.insert("dgal_document_types", ["document_type_id","document_type_key","title","description","owning_domain","default_classification","status","source_reference"], [input.documentTypeId,input.documentTypeKey,input.title,input.description||"",input.owningDomain,input.defaultClassification||"INTERNAL",input.status||"ACTIVE",input.sourceReference||null]); }
  async createGuidanceItem(input: any) { return this.insert("dgal_guidance_items", ["guidance_item_id","guidance_key","title","explanation","owning_domain","source_reference","action_reference","audience_roles","service_key","organization_id","tenant_id","status","version_number"], [input.guidanceItemId,input.guidanceKey,input.title,input.explanation,input.owningDomain,input.sourceReference,input.actionReference||null,input.audienceRoles||[],input.serviceKey||null,input.organizationId||null,input.tenantId||null,input.status||"ACTIVE",input.versionNumber||1]); }
  async createGuidanceCollection(input: any) { return this.insert("dgal_guidance_collections", ["guidance_collection_id","collection_key","title","owning_domain","service_key","organization_id","tenant_id","status"], [input.guidanceCollectionId,input.collectionKey,input.title,input.owningDomain,input.serviceKey||null,input.organizationId||null,input.tenantId||null,input.status||"ACTIVE"]); }
  async addGuidanceCollectionItem(collectionId: string, itemId: string, displayOrder: number) { await this.executor.query(`INSERT INTO dgal_guidance_collection_items (guidance_collection_id, guidance_item_id, display_order) VALUES ($1,$2,$3)`, [collectionId,itemId,displayOrder]); }
  async createTemplate(input: any) { return this.insert("dgal_document_templates", ["template_id","document_type_id","template_key","title","owning_domain","service_key","canonical_source_owner","content_reference","organization_id","tenant_id","status"], [input.templateId,input.documentTypeId,input.templateKey,input.title,input.owningDomain,input.serviceKey||null,input.canonicalSourceOwner,input.contentReference,input.organizationId||null,input.tenantId||null,input.status||"DRAFT"]); }
  async createTemplateVersion(input: any) { return this.insert("dgal_template_versions", ["template_version_id","template_id","version_number","revision","effective_at","status","source_reference","content_hash","classification","approval_reference","created_by_user_id"], [input.templateVersionId,input.templateId,input.versionNumber,input.revision,input.effectiveAt||null,input.status||"DRAFT",input.sourceReference,input.contentHash||null,input.classification||"INTERNAL",input.approvalReference||null,input.createdByUserId||null]); }
  async activateTemplateVersion(templateVersionId: string, effectiveAt = new Date()) {
    await this.executor.query("BEGIN");
    try {
      const target = await this.executor.query("SELECT template_id FROM dgal_template_versions WHERE template_version_id=$1 FOR UPDATE", [templateVersionId]);
      if (!target.rows[0]) { await this.executor.query("ROLLBACK"); return null; }
      await this.executor.query("UPDATE dgal_template_versions SET status='DRAFT' WHERE template_version_id=$1", [templateVersionId]);
      await this.executor.query("UPDATE dgal_template_versions SET status='SUPERSEDED', superseded_at=$2 WHERE template_id=$1 AND status='ACTIVE'", [target.rows[0].template_id, effectiveAt]);
      const result = await this.executor.query("UPDATE dgal_template_versions SET status='ACTIVE', effective_at=COALESCE(effective_at,$2) WHERE template_version_id=$1 RETURNING *", [templateVersionId, effectiveAt]);
      await this.executor.query("COMMIT");
      return result.rows[0] || null;
    } catch (error) {
      await this.executor.query("ROLLBACK");
      throw error;
    }
  }
  async setTemplateVersionStatus(templateVersionId: string, status: string, expectedStatus?: string) {
    const result = await this.executor.query(`UPDATE dgal_template_versions SET status=$2, superseded_at=CASE WHEN $2 IN ('SUPERSEDED','RETIRED') THEN COALESCE(superseded_at,NOW()) ELSE superseded_at END WHERE template_version_id=$1 AND ($3::text IS NULL OR status=$3) RETURNING *`, [templateVersionId, status, expectedStatus || null]);
    return result.rows[0] || null;
  }
  async getTemplateVersionContext(templateVersionId: string) {
    const result = await this.executor.query(`SELECT v.*, t.owning_domain, t.organization_id, t.tenant_id FROM dgal_template_versions v JOIN dgal_document_templates t ON t.template_id=v.template_id WHERE v.template_version_id=$1`, [templateVersionId]);
    return result.rows[0] || null;
  }
  async getTemplateContext(templateId: string) {
    const result = await this.executor.query(`SELECT * FROM dgal_document_templates WHERE template_id=$1`, [templateId]);
    return result.rows[0] || null;
  }
  async listTemplates(scope: { organizationId: string; tenantId: string }) {
    const result = await this.executor.query(`SELECT * FROM dgal_document_templates WHERE organization_id IS NULL OR (organization_id=$1 AND tenant_id=$2) ORDER BY template_key`, [scope.organizationId, scope.tenantId]);
    return result.rows;
  }
  async listTemplateVersions(templateId: string) {
    const result = await this.executor.query(`SELECT * FROM dgal_template_versions WHERE template_id=$1 ORDER BY version_number DESC`, [templateId]);
    return result.rows;
  }
  async listRequirementRules(scope: { organizationId: string; tenantId: string }) {
    const result = await this.executor.query(`SELECT * FROM dgal_requirement_rules WHERE organization_id IS NULL OR (organization_id=$1 AND tenant_id=$2) ORDER BY rule_key`, [scope.organizationId, scope.tenantId]);
    return result.rows;
  }
  async createRequirementRule(input: any) { return this.insert("dgal_requirement_rules", ["requirement_rule_id","rule_key","owning_domain","service_key","organization_type","relationship_type","audience_roles","workflow_type","workflow_stage","resource_type","policy_reference","document_type_id","template_id","guidance_item_id","requirement_type","required","requires_entitlement","source_reference","action_reference","effective_from","effective_until","priority","status","organization_id","tenant_id"], [input.requirementRuleId,input.ruleKey,input.owningDomain,input.serviceKey||null,input.organizationType||null,input.relationshipType||null,input.audienceRoles||[],input.workflowType||null,input.workflowStage||null,input.resourceType||null,input.policyReference||null,input.documentTypeId||null,input.templateId||null,input.guidanceItemId||null,input.requirementType,Boolean(input.required),input.requiresEntitlement !== false,input.sourceReference,input.actionReference||null,input.effectiveFrom||null,input.effectiveUntil||null,input.priority ?? 100,input.status||"ACTIVE",input.organizationId||null,input.tenantId||null]); }
  async listRules(scope: { organizationId: string; tenantId: string; serviceKey?: string | null; now: Date }) {
    const result = await this.executor.query(`SELECT r.*, dt.title AS document_type_title, dt.description AS document_type_description, g.title AS guidance_title, g.explanation AS guidance_explanation, tv.version_number AS active_template_version, tv.revision AS active_template_revision FROM dgal_requirement_rules r LEFT JOIN dgal_document_types dt ON dt.document_type_id = r.document_type_id LEFT JOIN dgal_guidance_items g ON g.guidance_item_id = r.guidance_item_id LEFT JOIN dgal_template_versions tv ON tv.template_id = r.template_id AND tv.status = 'ACTIVE' WHERE r.status = 'ACTIVE' AND (r.organization_id IS NULL OR (r.organization_id = $1 AND r.tenant_id = $2)) AND (r.service_key IS NULL OR r.service_key = $3) AND (r.effective_from IS NULL OR r.effective_from <= $4) AND (r.effective_until IS NULL OR r.effective_until >= $4) ORDER BY r.priority ASC, r.rule_key ASC`, [scope.organizationId,scope.tenantId,scope.serviceKey||null,scope.now]);
    return result.rows;
  }
  async getActiveEntitlement(organizationId: string, serviceKey: string) { const result = await this.executor.query(`SELECT e.status, s.service_key FROM organization_service_entitlements e JOIN service_catalog s ON s.service_id = e.service_id WHERE e.organization_id = $1 AND s.service_key = $2 ORDER BY e.updated_at DESC LIMIT 1`, [organizationId,serviceKey]); return { available: true, status: result.rows[0]?.status || "NONE", serviceKey }; }
  private async insert(table: string, columns: string[], values: unknown[]) { const placeholders = values.map((_, index) => `$${index + 1}`).join(","); const result = await this.executor.query(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`, values); return result.rows[0]; }
}
