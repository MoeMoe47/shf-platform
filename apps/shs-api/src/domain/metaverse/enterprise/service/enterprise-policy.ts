// MET-12 — shared scope/authority helpers, mirroring market-policy.ts and
// opportunities/service/bid-service.ts's server-derived-identity discipline.
import { query } from "../../../../db/client.js";
import { isAdminTier } from "../../../shared/audience-eligibility.js";
import { ENTERPRISE_SELLER_AUTHORIZED_ROLES, canEnterpriseTransact, type EnterpriseRole, type StudentEnterprise } from "../model/enterprise-contract.js";
import { EnterpriseRepo } from "../repo/enterprise-repo.js";

export class EnterpriseError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
  }
}

export function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId) throw new EnterpriseError("AUTH_REQUIRED", "Authentication required.", 401);
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new EnterpriseError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { userId, organizationId, tenantId, roles: actor?.roles || [] };
}

export function canReviewEnterprises(actor: any) {
  return isAdminTier(actor?.roles || []) || Boolean(actor?.roles?.includes?.("instructor")) || Boolean(actor?.roles?.includes?.("program_manager"));
}

export async function assertActiveStudioTeamMember(teamId: string, organizationId: string, tenantId: string, userId: string) {
  const result = await query(
    `SELECT t.studio_team_id FROM studio_teams t
     JOIN studio_team_members m ON m.studio_team_id=t.studio_team_id AND m.organization_id=t.organization_id AND m.tenant_id=t.tenant_id
     WHERE t.studio_team_id=$1 AND t.organization_id=$2 AND t.tenant_id=$3 AND t.status='ACTIVE'
       AND m.user_id=$4 AND m.status='ACTIVE' AND m.left_at IS NULL`,
    [teamId, organizationId, tenantId, userId],
  );
  if (!result.rows[0]) throw new EnterpriseError("TEAM_MEMBERSHIP_REQUIRED", "Team not found or you are not an active member.", 403);
}

const repo = new EnterpriseRepo();

/** Loads and org/tenant-scopes an enterprise by id, or throws NOT_FOUND — never leaks cross-org existence. */
export async function getEnterpriseOrThrow(enterpriseId: string, organizationId: string, tenantId: string): Promise<StudentEnterprise> {
  const enterprise = await repo.getById(enterpriseId, organizationId, tenantId);
  if (!enterprise) throw new EnterpriseError("NOT_FOUND", "Enterprise not found.", 404);
  return enterprise;
}

/**
 * Cross-domain entry point for Market/Opportunity integration (build brief
 * §Phase B/§Phase C). Validates, against the real durable record, that:
 *   - the enterprise exists in the caller's own organization (source_ref
 *     validation — no orphan-string acceptance)
 *   - it is ACTIVE (transactable lifecycle state)
 *   - the acting user is an active canonical team member of its studio_team
 *   - the acting user holds an authorized enterprise role
 * Throws EnterpriseError on any failure; callers must not weaken this to a
 * boolean they might ignore.
 */
export async function assertAuthorizedEnterpriseActor(enterpriseId: string, organizationId: string, tenantId: string, userId: string): Promise<StudentEnterprise> {
  const enterprise = await getEnterpriseOrThrow(enterpriseId, organizationId, tenantId);
  if (!canEnterpriseTransact(enterprise.lifecycleStatus)) {
    throw new EnterpriseError("ENTERPRISE_NOT_ACTIVE", `Enterprise is ${enterprise.lifecycleStatus.toLowerCase()} and cannot transact.`, 403);
  }
  await assertActiveStudioTeamMember(enterprise.studioTeamId, organizationId, tenantId, userId);
  const role = await repo.getActiveRole(enterpriseId, organizationId, tenantId, userId);
  if (!role || !ENTERPRISE_SELLER_AUTHORIZED_ROLES.includes(role.enterpriseRole as EnterpriseRole)) {
    throw new EnterpriseError("ENTERPRISE_ROLE_REQUIRED", "An authorized enterprise role (Founder, Operations Lead, or Catalog Manager) is required.", 403);
  }
  return enterprise;
}

/**
 * Bidding-only variant (build brief §Phase C): any active canonical team
 * member may bid on behalf of the enterprise's team, not only sellers —
 * an enterprise still requires ACTIVE lifecycle and real team membership.
 */
export async function assertActiveEnterpriseForBidding(enterpriseId: string, organizationId: string, tenantId: string, userId: string): Promise<StudentEnterprise> {
  const enterprise = await getEnterpriseOrThrow(enterpriseId, organizationId, tenantId);
  if (!canEnterpriseTransact(enterprise.lifecycleStatus)) {
    throw new EnterpriseError("ENTERPRISE_NOT_ACTIVE", `Enterprise is ${enterprise.lifecycleStatus.toLowerCase()} and cannot bid.`, 403);
  }
  await assertActiveStudioTeamMember(enterprise.studioTeamId, organizationId, tenantId, userId);
  return enterprise;
}

export { repo as enterpriseRepo };
