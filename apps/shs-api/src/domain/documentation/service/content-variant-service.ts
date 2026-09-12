import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId };
}

export class ContentVariantService {
  constructor(private readonly db: any = { query }) {}
  async create(actor: any, input: any) {
    if (!(actor?.permissions || []).includes("documentation.variant.manage")) throw new Error("FORBIDDEN");
    const s = scope(actor);
    if (!input?.sourceReference || !input?.sourceVersionReference || !input?.languageCode || !input?.variantReference || !input?.ownerDomain) throw new Error("VARIANT_METADATA_REQUIRED");
    const result = await this.db.query(`INSERT INTO dgal_content_variants (variant_id,content_kind,source_reference,source_version_reference,language_code,variant_reference,owner_domain,status,approval_reference,organization_id,tenant_id,created_by_user_id,variant_revision) VALUES ($1,$2,$3,$4,$5,$6,$7,'DRAFT',$8,$9,$10,$11,$12) RETURNING *`, [`dgal_variant_${randomUUID()}`, input.contentKind || "GUIDANCE", input.sourceReference, input.sourceVersionReference, input.languageCode, input.variantReference, input.ownerDomain, input.approvalReference || null, s.organizationId, s.tenantId, actor.user_id, Number(input.variantRevision || 1)]);
    return result.rows[0];
  }
  async activate(actor: any, variantId: string) {
    if (!(actor?.permissions || []).includes("documentation.variant.manage")) throw new Error("FORBIDDEN");
    const s = scope(actor);
    await this.db.query("BEGIN");
    try {
      const target = await this.db.query("SELECT source_reference, source_version_reference, language_code, organization_id, tenant_id FROM dgal_content_variants WHERE variant_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE", [variantId, s.organizationId, s.tenantId]);
      if (!target.rows[0]) { await this.db.query("ROLLBACK"); throw new Error("VARIANT_NOT_FOUND"); }
      const t = target.rows[0];
      await this.db.query("UPDATE dgal_content_variants SET status='RETIRED', superseded_at=COALESCE(superseded_at,NOW()), updated_at=NOW() WHERE source_reference=$1 AND source_version_reference=$2 AND language_code=$3 AND organization_id=$4 AND tenant_id=$5 AND status='ACTIVE' AND variant_id<>$6", [t.source_reference, t.source_version_reference, t.language_code, t.organization_id, t.tenant_id, variantId]);
      const result = await this.db.query("UPDATE dgal_content_variants SET status='ACTIVE', updated_at=NOW() WHERE variant_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *", [variantId, s.organizationId, s.tenantId]);
      await this.db.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await this.db.query("ROLLBACK");
      throw error;
    }
  }
  async list(actor: any) { const s = scope(actor); const result = await this.db.query("SELECT * FROM dgal_content_variants WHERE organization_id=$1 AND tenant_id=$2 ORDER BY source_reference, language_code", [s.organizationId, s.tenantId]); return result.rows; }
}
