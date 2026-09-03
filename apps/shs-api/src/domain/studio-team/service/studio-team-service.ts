import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";

function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}
function manager(actor: any) { return hasPermission(actor?.permissions || [], SHS_SECURITY_PERMISSIONS.PROJECT_TEAM_MANAGE); }
function row(row: any) { return { teamId: row.studio_team_id, organizationId: row.organization_id, tenantId: row.tenant_id, name: row.name, status: row.status, createdByUserId: row.created_by_user_id, createdAt: row.created_at, updatedAt: row.updated_at }; }

export class StudioTeamService {
  constructor(private dbQuery: typeof query = query, private transaction: typeof withTransaction = withTransaction, private outbox = new IntegrationOutboxRepo()) {}
  async list(actor: any) {
    const s = scope(actor);
    const result = await this.dbQuery(`SELECT DISTINCT t.* FROM studio_teams t LEFT JOIN studio_team_members m ON m.studio_team_id=t.studio_team_id AND m.user_id=$3 AND m.status='ACTIVE' AND m.left_at IS NULL WHERE t.organization_id=$1 AND t.tenant_id=$2 AND (m.studio_team_membership_id IS NOT NULL OR $4) ORDER BY t.created_at DESC`, [s.organizationId, s.tenantId, s.userId, manager(actor)]);
    return result.rows.map(row);
  }
  async get(actor: any, teamId: string) {
    const s = scope(actor);
    const team = (await this.dbQuery("SELECT * FROM studio_teams WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3", [teamId, s.organizationId, s.tenantId])).rows[0];
    if (!team) throw new Error("TEAM_NOT_FOUND");
    const allowed = manager(actor) || (await this.dbQuery("SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND user_id=$2 AND organization_id=$3 AND tenant_id=$4 AND status='ACTIVE' AND left_at IS NULL", [teamId, s.userId, s.organizationId, s.tenantId])).rows[0];
    if (!allowed) throw new Error("TEAM_NOT_FOUND");
    const members = await this.dbQuery("SELECT studio_team_membership_id AS membership_id, user_id, role, status, joined_at, left_at FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' AND left_at IS NULL ORDER BY joined_at, user_id", [teamId, s.organizationId, s.tenantId]);
    return { ...row(team), members: members.rows };
  }
  async create(actor: any, input: any) {
    if (!manager(actor)) throw new Error("project_team_manage_required");
    const s = scope(actor); const name = String(input?.name || "").trim().slice(0, 160); if (!name) throw new Error("TEAM_NAME_REQUIRED");
    const teamId = `studio_team_${randomUUID()}`;
    const result = await this.dbQuery("INSERT INTO studio_teams (studio_team_id, organization_id, tenant_id, name, created_by_user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *", [teamId, s.organizationId, s.tenantId, name, s.userId]);
    await this.outbox.enqueue({ producer_id: "shs-api.studio-team", event_type: "studio.team.created", subject_type: "studio_team", subject_id: teamId, organization_id: s.organizationId, tenant_id: s.tenantId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: teamId, correlation_id: teamId, destination: "shs-studio", payload: { team_id: teamId } });
    return row(result.rows[0]);
  }
  async addMember(actor: any, teamId: string, input: any) {
    if (!manager(actor)) throw new Error("project_team_manage_required");
    const s = scope(actor); const userId = String(input?.userId || input?.user_id || "");
    const team = (await this.dbQuery("SELECT studio_team_id FROM studio_teams WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE'", [teamId, s.organizationId, s.tenantId])).rows[0];
    if (!team) throw new Error("TEAM_NOT_FOUND");
    const user = (await this.dbQuery("SELECT user_id FROM users WHERE user_id=$1 AND organization_id=$2 AND status IN ('active','ACTIVE')", [userId, s.organizationId])).rows[0];
    if (!user) throw new Error("TEAM_MEMBER_NOT_ELIGIBLE");
    const membershipId = `studio_team_membership_${randomUUID()}`;
    const result = await this.dbQuery(`INSERT INTO studio_team_members (studio_team_membership_id, studio_team_id, organization_id, tenant_id, user_id, role, added_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (studio_team_id,user_id) DO UPDATE SET status='ACTIVE', left_at=NULL, role=EXCLUDED.role, added_by_user_id=EXCLUDED.added_by_user_id RETURNING *`, [membershipId, teamId, s.organizationId, s.tenantId, userId, input?.role === "LEAD" ? "LEAD" : "MEMBER", s.userId]);
    await this.outbox.enqueue({ producer_id: "shs-api.studio-team", event_type: "studio.team.member_added", subject_type: "studio_team_membership", subject_id: result.rows[0].studio_team_membership_id, organization_id: s.organizationId, tenant_id: s.tenantId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: result.rows[0].studio_team_membership_id, correlation_id: teamId, destination: "shs-studio", payload: { team_id: teamId, user_id: userId } });
    return result.rows[0];
  }
  async removeMember(actor: any, teamId: string, userId: string) {
    if (!manager(actor)) throw new Error("project_team_manage_required");
    const s = scope(actor);
    const result = await this.dbQuery("UPDATE studio_team_members SET status='REMOVED', left_at=NOW() WHERE studio_team_id=$1 AND user_id=$2 AND organization_id=$3 AND tenant_id=$4 AND status='ACTIVE' AND left_at IS NULL RETURNING *", [teamId, userId, s.organizationId, s.tenantId]);
    if (!result.rows[0]) throw new Error("TEAM_MEMBER_NOT_FOUND");
    await this.outbox.enqueue({ producer_id: "shs-api.studio-team", event_type: "studio.team.member_removed", subject_type: "studio_team_membership", subject_id: result.rows[0].studio_team_membership_id, organization_id: s.organizationId, tenant_id: s.tenantId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: `${result.rows[0].studio_team_membership_id}:removed`, correlation_id: teamId, destination: "shs-studio", payload: { team_id: teamId, user_id: userId } });
    return result.rows[0];
  }
  async archive(actor: any, teamId: string) {
    if (!manager(actor)) throw new Error("project_team_manage_required");
    const s = scope(actor);
    const result = await this.dbQuery("UPDATE studio_teams SET status='ARCHIVED', updated_at=NOW() WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' RETURNING *", [teamId, s.organizationId, s.tenantId]);
    if (!result.rows[0]) throw new Error("TEAM_NOT_FOUND");
    await this.outbox.enqueue({ producer_id: "shs-api.studio-team", event_type: "studio.team.archived", subject_type: "studio_team", subject_id: teamId, organization_id: s.organizationId, tenant_id: s.tenantId, originating_actor_id: s.userId, occurred_at: new Date().toISOString(), idempotency_key: `${teamId}:archived`, correlation_id: teamId, destination: "shs-studio", payload: { team_id: teamId } });
    return row(result.rows[0]);
  }
}
