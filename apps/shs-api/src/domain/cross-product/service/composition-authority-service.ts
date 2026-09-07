import { createHash, randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { ReportTemplateRegistry } from "../../reporting/report-template-registry.js";

const ALLOWED_POLICIES = new Set(["MOST_RESTRICTIVE", "EXPLICIT_PERIODS", "CANONICAL_SUBJECT_IDENTITY", "SOURCE_PROVENANCE"]);
const CROSS_PRODUCT_FAMILIES = new Set(["cross-product-executive", "cross-product-assurance", "cross-product-evidence-trace", "cross-product-governance-exception"]);
function scope(actor: any) { const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim(); const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim(); const userId = String(actor?.user_id || "").trim(); if (!organizationId || !tenantId || !userId) throw new Error("ORG_CONTEXT_REQUIRED"); return { organizationId, tenantId, userId }; }
function validateSources(sources: any) {
  if (!Array.isArray(sources) || !sources.length) throw new Error("COMPOSITION_SOURCES_REQUIRED");
  const registry = new ReportTemplateRegistry();
  for (const source of sources) {
    if (!source || !String(source.projectionFamily || "").trim() || typeof source.required !== "boolean") throw new Error("COMPOSITION_SOURCE_INVALID");
    try { registry.resolve(String(source.productKey), String(source.projectionFamily)); } catch { throw new Error("COMPOSITION_SOURCE_PROJECTION_UNREGISTERED"); }
  }
}

export async function createDraft(actor: any, input: any) {
  const s = scope(actor); const key = String(input?.definitionKey || input?.definition_key || "").trim(); const version = String(input?.version || "").trim(); const family = String(input?.reportFamily || input?.report_family || "").trim();
  if (!key || !version || !family || !CROSS_PRODUCT_FAMILIES.has(family)) throw new Error("COMPOSITION_DEFINITION_REQUIRED");
  validateSources(input?.sources); const policy = { subject: String(input?.subjectPolicy || "CANONICAL_SUBJECT_IDENTITY"), classification: String(input?.classificationPolicy || "MOST_RESTRICTIVE"), period: String(input?.periodPolicy || "EXPLICIT_PERIODS"), provenance: String(input?.provenancePolicy || "SOURCE_PROVENANCE") };
  if (![policy.subject, policy.classification, policy.period, policy.provenance].every((value) => ALLOWED_POLICIES.has(value))) throw new Error("COMPOSITION_POLICY_INVALID");
  const snapshot = { key, version, family, sources: input.sources, policy }; const hash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  const result = await query("INSERT INTO cross_product_composition_definitions (definition_id, definition_key, version, status, report_family, sources_json, subject_policy, classification_policy, period_policy, provenance_policy, definition_hash, organization_id, tenant_id, created_by_user_id) VALUES ($1,$2,$3,'DRAFT',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *", [`composition_${randomUUID()}`, key, version, family, JSON.stringify(input.sources), policy.subject, policy.classification, policy.period, policy.provenance, hash, s.organizationId, s.tenantId, s.userId]);
  return result.rows[0];
}

export async function list(actor: any) { const s = scope(actor); return (await query("SELECT * FROM cross_product_composition_definitions WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [s.organizationId, s.tenantId])).rows; }
export async function activate(actor: any, definitionId: string) { const s = scope(actor); const result = await query("UPDATE cross_product_composition_definitions SET status='ACTIVE', activated_by_user_id=$4, activated_at=NOW() WHERE definition_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='DRAFT' RETURNING *", [definitionId, s.organizationId, s.tenantId, s.userId]); if (!result.rows[0]) throw new Error("COMPOSITION_DEFINITION_NOT_ACTIVATABLE"); return result.rows[0]; }
export async function retire(actor: any, definitionId: string) { const s = scope(actor); const result = await query("UPDATE cross_product_composition_definitions SET status='RETIRED', retired_by_user_id=$4, retired_at=NOW() WHERE definition_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' RETURNING *", [definitionId, s.organizationId, s.tenantId, s.userId]); if (!result.rows[0]) throw new Error("COMPOSITION_DEFINITION_NOT_RETIRABLE"); return result.rows[0]; }
