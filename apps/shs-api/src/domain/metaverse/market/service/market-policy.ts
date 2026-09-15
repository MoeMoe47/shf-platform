import { query } from "../../../../db/client.js";
import { MarketError } from "./market-errors.js";

export function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId) throw new MarketError("AUTH_REQUIRED", "Authentication required.", 401);
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new MarketError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
  return { userId, organizationId, tenantId };
}

export function hasRole(actor: any, roles: string[]) {
  const actual = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
  return actual.some((role: string) => roles.includes(String(role)));
}

export function canAdminMarket(actor: any) {
  return hasRole(actor, ["super_admin", "shs_admin", "shf_admin", "org_admin", "program_manager", "instructor"]);
}

export async function isActiveTeamMember(teamId: string, organizationId: string, tenantId: string, userId: string) {
  const result = await query(
    "SELECT 1 FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL",
    [teamId, organizationId, tenantId, userId],
  );
  return Boolean(result.rows[0]);
}

export async function deriveSeller(actor: any, input: any) {
  const s = scope(actor);
  const sellerType = String(input?.sellerType || "STUDENT").toUpperCase();
  if (sellerType === "STUDENT") {
    if (!hasRole(actor, ["student", "super_admin"])) throw new MarketError("UNAUTHORIZED_SELLER", "Student seller authority is required.", 403);
    return { sellerType: "STUDENT" as const, sellerRef: s.userId };
  }
  if (sellerType === "TEAM") {
    const teamId = String(input?.teamId || "");
    if (!teamId) throw new MarketError("TEAM_REQUIRED", "Team seller requires a canonical team.", 400);
    if (!(await isActiveTeamMember(teamId, s.organizationId, s.tenantId, s.userId)) && !canAdminMarket(actor)) {
      throw new MarketError("UNAUTHORIZED_SELLER", "Active team seller authority is required.", 403);
    }
    return { sellerType: "TEAM" as const, sellerRef: teamId };
  }
  if (sellerType === "PROGRAM") {
    if (!canAdminMarket(actor)) throw new MarketError("UNAUTHORIZED_SELLER", "Program seller authority is required.", 403);
    const programId = String(input?.programId || "");
    if (!programId) throw new MarketError("PROGRAM_REQUIRED", "Program seller requires a program.", 400);
    return { sellerType: "PROGRAM" as const, sellerRef: programId };
  }
  if (sellerType === "ORGANIZATION" || sellerType === "SYSTEM") {
    if (!canAdminMarket(actor)) throw new MarketError("UNAUTHORIZED_SELLER", "Organization/System seller authority is required.", 403);
    return { sellerType: sellerType as "ORGANIZATION" | "SYSTEM", sellerRef: s.organizationId };
  }
  if (sellerType === "STUDENT_ENTERPRISE") throw new MarketError("SELLER_TYPE_P1", "Student enterprise seller authority is P1 for MET-12.", 400);
  throw new MarketError("INVALID_SELLER_TYPE", "Seller type is not supported.", 400);
}

export function assertListingVisible(actor: any, listing: { organizationId: string; visibility: string; programId?: string | null; status: string }) {
  const s = scope(actor);
  if (listing.organizationId !== s.organizationId && !["NETWORK", "CITY"].includes(listing.visibility)) {
    throw new MarketError("NOT_FOUND", "Listing not found.", 404);
  }
  if (!["PUBLISHED", "SOLD_OUT"].includes(listing.status) && !canAdminMarket(actor)) {
    throw new MarketError("NOT_FOUND", "Listing not found.", 404);
  }
}

export function assertNoSelfPurchase(actor: any, listing: { sellerType: string; sellerRef: string }) {
  const s = scope(actor);
  if (listing.sellerType === "STUDENT" && listing.sellerRef === s.userId) {
    throw new MarketError("SELF_PURCHASE_DENIED", "Direct self-purchase is not permitted.", 403);
  }
}
