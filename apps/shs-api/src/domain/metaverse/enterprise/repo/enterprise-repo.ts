import { randomUUID } from "node:crypto";
import { query } from "../../../../db/client.js";
import type {
  EnterpriseCatalogCategory,
  EnterpriseHistoryEventType,
  EnterpriseLifecycleStatus,
  EnterpriseRole,
  StudentEnterprise,
  StudentEnterpriseCatalogItem,
  StudentEnterpriseHistoryEntry,
  StudentEnterpriseRole,
} from "../model/enterprise-contract.js";

type Executor = { query: typeof query };

function toEnterprise(row: any): StudentEnterprise {
  return {
    enterpriseId: row.enterprise_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    studioTeamId: row.studio_team_id,
    programId: row.program_id,
    name: row.name,
    description: row.description,
    enterpriseCategory: row.enterprise_category,
    operatingMode: row.operating_mode,
    lifecycleStatus: row.lifecycle_status,
    visibility: row.visibility,
    legalBoundaryAckVersion: row.legal_boundary_ack_version,
    createdByUserId: row.created_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    suspendedReason: row.suspended_reason,
    returnReason: row.return_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

function toRole(row: any): StudentEnterpriseRole {
  return {
    enterpriseRoleId: row.enterprise_role_id,
    enterpriseId: row.enterprise_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    enterpriseRole: row.enterprise_role,
    status: row.status,
    grantedByUserId: row.granted_by_user_id,
    grantedAt: row.granted_at,
  };
}

function toCatalogItem(row: any): StudentEnterpriseCatalogItem {
  return {
    catalogItemId: row.catalog_item_id,
    enterpriseId: row.enterprise_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    status: row.status,
    marketListingId: row.market_listing_id,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

function toHistoryEntry(row: any): StudentEnterpriseHistoryEntry {
  return {
    historyId: row.history_id,
    enterpriseId: row.enterprise_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id,
    detail: row.detail_json || {},
    occurredAt: row.occurred_at,
  };
}

export class EnterpriseRepo {
  constructor(private dbQuery: typeof query = query) {}

  async createEnterprise(input: {
    organizationId: string;
    tenantId: string;
    studioTeamId: string;
    programId: string | null;
    name: string;
    description: string;
    enterpriseCategory: string;
    operatingMode: string;
    visibility: string;
    createdByUserId: string;
  }): Promise<StudentEnterprise> {
    const enterpriseId = `student_enterprise_${randomUUID()}`;
    const result = await this.dbQuery(
      `INSERT INTO student_enterprises
        (enterprise_id, organization_id, tenant_id, studio_team_id, program_id, name, description, enterprise_category, operating_mode, visibility, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [enterpriseId, input.organizationId, input.tenantId, input.studioTeamId, input.programId, input.name, input.description, input.enterpriseCategory, input.operatingMode, input.visibility, input.createdByUserId],
    );
    return toEnterprise(result.rows[0]);
  }

  async getById(enterpriseId: string, organizationId: string, tenantId: string): Promise<StudentEnterprise | null> {
    const result = await this.dbQuery("SELECT * FROM student_enterprises WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3", [enterpriseId, organizationId, tenantId]);
    return result.rows[0] ? toEnterprise(result.rows[0]) : null;
  }

  async getByStudioTeamId(studioTeamId: string, organizationId: string, tenantId: string): Promise<StudentEnterprise | null> {
    const result = await this.dbQuery("SELECT * FROM student_enterprises WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3", [studioTeamId, organizationId, tenantId]);
    return result.rows[0] ? toEnterprise(result.rows[0]) : null;
  }

  async listForOrganization(organizationId: string, tenantId: string, statuses?: EnterpriseLifecycleStatus[]): Promise<StudentEnterprise[]> {
    const result = statuses?.length
      ? await this.dbQuery("SELECT * FROM student_enterprises WHERE organization_id=$1 AND tenant_id=$2 AND lifecycle_status = ANY($3) ORDER BY created_at DESC", [organizationId, tenantId, statuses])
      : await this.dbQuery("SELECT * FROM student_enterprises WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [organizationId, tenantId]);
    return result.rows.map(toEnterprise);
  }

  async listForTeamMember(userId: string, organizationId: string, tenantId: string): Promise<StudentEnterprise[]> {
    const result = await this.dbQuery(
      `SELECT e.* FROM student_enterprises e
       JOIN studio_team_members m ON m.studio_team_id = e.studio_team_id AND m.organization_id = e.organization_id AND m.tenant_id = e.tenant_id
       WHERE m.user_id=$1 AND e.organization_id=$2 AND e.tenant_id=$3 AND m.status='ACTIVE' AND m.left_at IS NULL
       ORDER BY e.created_at DESC`,
      [userId, organizationId, tenantId],
    );
    return result.rows.map(toEnterprise);
  }

  async updateLifecycle(
    enterpriseId: string,
    organizationId: string,
    tenantId: string,
    expectedVersion: number,
    to: EnterpriseLifecycleStatus,
    timestampColumn?: "submitted_at" | "approved_at" | "returned_at" | "paused_at" | "suspended_at" | "closed_at" | "archived_at",
    extra: { byUserColumn?: string; byUserId?: string; reasonColumn?: string; reason?: string } = {},
  ): Promise<StudentEnterprise | null> {
    const setClauses = ["lifecycle_status=$4", "version=version+1", "updated_at=NOW()"];
    const params: unknown[] = [enterpriseId, organizationId, tenantId, to, expectedVersion];
    if (timestampColumn) setClauses.push(`${timestampColumn}=NOW()`);
    if (extra.byUserColumn && extra.byUserId) { params.push(extra.byUserId); setClauses.push(`${extra.byUserColumn}=$${params.length}`); }
    if (extra.reasonColumn && extra.reason !== undefined) { params.push(extra.reason); setClauses.push(`${extra.reasonColumn}=$${params.length}`); }
    const result = await this.dbQuery(
      `UPDATE student_enterprises SET ${setClauses.join(", ")} WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3 AND version=$5 RETURNING *`,
      params,
    );
    return result.rows[0] ? toEnterprise(result.rows[0]) : null;
  }

  async grantRole(input: { enterpriseId: string; organizationId: string; tenantId: string; userId: string; enterpriseRole: EnterpriseRole; grantedByUserId: string }): Promise<StudentEnterpriseRole> {
    const enterpriseRoleId = `student_enterprise_role_${randomUUID()}`;
    const result = await this.dbQuery(
      `INSERT INTO student_enterprise_roles (enterprise_role_id, enterprise_id, organization_id, tenant_id, user_id, enterprise_role, granted_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (enterprise_id, user_id) DO UPDATE SET enterprise_role=EXCLUDED.enterprise_role, status='ACTIVE', revoked_at=NULL, granted_by_user_id=EXCLUDED.granted_by_user_id, granted_at=NOW()
       RETURNING *`,
      [enterpriseRoleId, input.enterpriseId, input.organizationId, input.tenantId, input.userId, input.enterpriseRole, input.grantedByUserId],
    );
    return toRole(result.rows[0]);
  }

  async revokeRole(enterpriseId: string, organizationId: string, tenantId: string, userId: string): Promise<void> {
    await this.dbQuery("UPDATE student_enterprise_roles SET status='REVOKED', revoked_at=NOW() WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4", [enterpriseId, organizationId, tenantId, userId]);
  }

  async listRoles(enterpriseId: string, organizationId: string, tenantId: string): Promise<StudentEnterpriseRole[]> {
    const result = await this.dbQuery("SELECT * FROM student_enterprise_roles WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' ORDER BY granted_at", [enterpriseId, organizationId, tenantId]);
    return result.rows.map(toRole);
  }

  async getActiveRole(enterpriseId: string, organizationId: string, tenantId: string, userId: string): Promise<StudentEnterpriseRole | null> {
    const result = await this.dbQuery("SELECT * FROM student_enterprise_roles WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE'", [enterpriseId, organizationId, tenantId, userId]);
    return result.rows[0] ? toRole(result.rows[0]) : null;
  }

  async addCatalogItem(input: { enterpriseId: string; organizationId: string; tenantId: string; title: string; summary: string; category: EnterpriseCatalogCategory; createdByUserId: string }): Promise<StudentEnterpriseCatalogItem> {
    const catalogItemId = `student_enterprise_catalog_${randomUUID()}`;
    const result = await this.dbQuery(
      `INSERT INTO student_enterprise_catalog_items (catalog_item_id, enterprise_id, organization_id, tenant_id, title, summary, category, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [catalogItemId, input.enterpriseId, input.organizationId, input.tenantId, input.title, input.summary, input.category, input.createdByUserId],
    );
    return toCatalogItem(result.rows[0]);
  }

  async listCatalogItems(enterpriseId: string, organizationId: string, tenantId: string): Promise<StudentEnterpriseCatalogItem[]> {
    const result = await this.dbQuery("SELECT * FROM student_enterprise_catalog_items WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at DESC", [enterpriseId, organizationId, tenantId]);
    return result.rows.map(toCatalogItem);
  }

  async linkCatalogItemListing(catalogItemId: string, organizationId: string, tenantId: string, marketListingId: string): Promise<void> {
    await this.dbQuery("UPDATE student_enterprise_catalog_items SET market_listing_id=$4, status='ACTIVE', updated_at=NOW() WHERE catalog_item_id=$1 AND organization_id=$2 AND tenant_id=$3", [catalogItemId, organizationId, tenantId, marketListingId]);
  }

  async recordHistory(input: { enterpriseId: string; organizationId: string; tenantId: string; eventType: EnterpriseHistoryEventType; actorUserId: string; detail?: Record<string, unknown> }): Promise<void> {
    const historyId = `student_enterprise_history_${randomUUID()}`;
    await this.dbQuery(
      `INSERT INTO student_enterprise_history (history_id, enterprise_id, organization_id, tenant_id, event_type, actor_user_id, detail_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [historyId, input.enterpriseId, input.organizationId, input.tenantId, input.eventType, input.actorUserId, JSON.stringify(input.detail || {})],
    );
  }

  async listHistory(enterpriseId: string, organizationId: string, tenantId: string): Promise<StudentEnterpriseHistoryEntry[]> {
    const result = await this.dbQuery("SELECT * FROM student_enterprise_history WHERE enterprise_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY occurred_at DESC LIMIT 100", [enterpriseId, organizationId, tenantId]);
    return result.rows.map(toHistoryEntry);
  }
}
