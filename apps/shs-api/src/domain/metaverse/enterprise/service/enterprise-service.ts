// MET-12 — Student Enterprise formation, approval, lifecycle, roles, and
// catalog. Reuses canonical Studio team authority (studio_teams /
// studio_team_members) instead of duplicating membership; never creates a
// Market listing, Opportunity bid, Treasury balance, or Passport claim
// itself — those remain MET-9/MET-8/MET-10 authority.
import { query } from "../../../../db/client.js";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";
import {
  ENTERPRISE_CATEGORIES,
  ENTERPRISE_OPERATING_MODES,
  ENTERPRISE_ROLES,
  ENTERPRISE_CATALOG_CATEGORIES,
  ENTERPRISE_VISIBILITIES,
  STUDENT_ENTERPRISE_LEGAL_BOUNDARY_STATEMENT,
  isAllowedLifecycleTransition,
  isProhibitedEnterpriseCatalogClaim,
  type EnterpriseCatalogCategory,
  type EnterpriseCategory,
  type EnterpriseLifecycleStatus,
  type EnterpriseOperatingMode,
  type EnterpriseRole,
  type EnterpriseVisibility,
  type StudentEnterprise,
} from "../model/enterprise-contract.js";
import { EnterpriseError, canReviewEnterprises, enterpriseRepo as repo, getEnterpriseOrThrow, scope } from "./enterprise-policy.js";

const outbox = new IntegrationOutboxRepo();

async function assertCanManageTeam(teamId: string, organizationId: string, tenantId: string, userId: string) {
  const result = await query(
    `SELECT role FROM studio_team_members WHERE studio_team_id=$1 AND organization_id=$2 AND tenant_id=$3 AND user_id=$4 AND status='ACTIVE' AND left_at IS NULL`,
    [teamId, organizationId, tenantId, userId],
  );
  const membership = result.rows[0];
  if (!membership) throw new EnterpriseError("TEAM_MEMBERSHIP_REQUIRED", "Team not found or you are not an active member.", 403);
  return membership;
}

async function enqueue(eventType: string, subjectId: string, s: { organizationId: string; tenantId: string; userId: string }, payload: Record<string, unknown>) {
  await outbox.enqueue({
    producer_id: "shs-api.student-enterprise",
    event_type: eventType,
    subject_type: "student_enterprise",
    subject_id: subjectId,
    organization_id: s.organizationId,
    tenant_id: s.tenantId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: `${subjectId}:${eventType}:${Date.now()}`,
    correlation_id: subjectId,
    destination: "shs-metaverse",
    payload,
  });
}

export interface FormEnterpriseInput {
  studioTeamId: string;
  name: string;
  description: string;
  enterpriseCategory: string;
  operatingMode?: string;
  visibility?: string;
  programId?: string | null;
  legalBoundaryAcknowledged: boolean;
}

export async function formEnterprise(actor: any, input: FormEnterpriseInput): Promise<StudentEnterprise> {
  const s = scope(actor);
  await assertCanManageTeam(String(input.studioTeamId || ""), s.organizationId, s.tenantId, s.userId);

  const existing = await repo.getByStudioTeamId(String(input.studioTeamId), s.organizationId, s.tenantId);
  if (existing) throw new EnterpriseError("ENTERPRISE_ALREADY_EXISTS", "This team already sponsors a Student Enterprise.", 409);

  if (!input.legalBoundaryAcknowledged) {
    throw new EnterpriseError("LEGAL_BOUNDARY_ACK_REQUIRED", `The educational/simulated boundary must be acknowledged: ${STUDENT_ENTERPRISE_LEGAL_BOUNDARY_STATEMENT}`, 400);
  }
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  if (!name) throw new EnterpriseError("NAME_REQUIRED", "Enterprise name is required.", 400);
  if (!description) throw new EnterpriseError("DESCRIPTION_REQUIRED", "Enterprise description is required.", 400);
  const category = String(input.enterpriseCategory || "").toUpperCase() as EnterpriseCategory;
  if (!ENTERPRISE_CATEGORIES.includes(category)) throw new EnterpriseError("INVALID_CATEGORY", "Enterprise category is not recognized.", 400);
  const operatingMode = String(input.operatingMode || "SIMULATED").toUpperCase() as EnterpriseOperatingMode;
  if (!ENTERPRISE_OPERATING_MODES.includes(operatingMode)) throw new EnterpriseError("INVALID_OPERATING_MODE", "Operating mode is not recognized.", 400);
  const visibility = String(input.visibility || "PROGRAM").toUpperCase() as EnterpriseVisibility;
  if (!ENTERPRISE_VISIBILITIES.includes(visibility)) throw new EnterpriseError("INVALID_VISIBILITY", "Visibility is not recognized.", 400);

  const enterprise = await repo.createEnterprise({
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    studioTeamId: String(input.studioTeamId),
    programId: input.programId || null,
    name,
    description,
    enterpriseCategory: category,
    operatingMode,
    visibility,
    createdByUserId: s.userId,
  });
  await repo.grantRole({ enterpriseId: enterprise.enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, userId: s.userId, enterpriseRole: "FOUNDER", grantedByUserId: s.userId });
  await repo.recordHistory({ enterpriseId: enterprise.enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "FORMED", actorUserId: s.userId, detail: { name } });
  return enterprise;
}

async function requireOwnEnterpriseAccess(actor: any, enterprise: StudentEnterprise, s: ReturnType<typeof scope>) {
  if (canReviewEnterprises(actor)) return;
  await assertCanManageTeam(enterprise.studioTeamId, s.organizationId, s.tenantId, s.userId);
}

export async function submitForApproval(actor: any, enterpriseId: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "PENDING_APPROVAL")) {
    throw new EnterpriseError("INVALID_TRANSITION", `Cannot submit an enterprise in status ${enterprise.lifecycleStatus} for approval.`, 400);
  }
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "PENDING_APPROVAL", "submitted_at");
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "SUBMITTED_FOR_APPROVAL", actorUserId: s.userId });
  await enqueue("metaverse.enterprise.proposal_submitted", enterpriseId, s, { name: enterprise.name });
  return updated;
}

function assertReviewer(actor: any) {
  if (!canReviewEnterprises(actor)) throw new EnterpriseError("APPROVAL_AUTHORITY_REQUIRED", "Instructor, program manager, or admin authority is required.", 403);
}

export async function approveEnterprise(actor: any, enterpriseId: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  assertReviewer(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "ACTIVE")) {
    throw new EnterpriseError("INVALID_TRANSITION", `Cannot approve an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  }
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "ACTIVE", "approved_at", { byUserColumn: "approved_by_user_id", byUserId: s.userId });
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "APPROVED", actorUserId: s.userId });
  await enqueue("metaverse.enterprise.approved", enterpriseId, s, { name: enterprise.name });
  return updated;
}

export async function returnEnterprise(actor: any, enterpriseId: string, reason: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  assertReviewer(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "DRAFT")) {
    throw new EnterpriseError("INVALID_TRANSITION", `Cannot return an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  }
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "DRAFT", "returned_at", { byUserColumn: "returned_by_user_id", byUserId: s.userId, reasonColumn: "return_reason", reason: String(reason || "").trim() || "Returned for revision." });
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "RETURNED", actorUserId: s.userId, detail: { reason } });
  await enqueue("metaverse.enterprise.returned", enterpriseId, s, { reason });
  return updated;
}

export async function pauseEnterprise(actor: any, enterpriseId: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "PAUSED")) throw new EnterpriseError("INVALID_TRANSITION", `Cannot pause an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "PAUSED", "paused_at");
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "PAUSED", actorUserId: s.userId });
  return updated;
}

export async function resumeEnterprise(actor: any, enterpriseId: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "ACTIVE")) throw new EnterpriseError("INVALID_TRANSITION", `Cannot resume an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "ACTIVE");
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "RESUMED", actorUserId: s.userId });
  return updated;
}

export async function suspendEnterprise(actor: any, enterpriseId: string, reason: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  assertReviewer(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "SUSPENDED")) throw new EnterpriseError("INVALID_TRANSITION", `Cannot suspend an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "SUSPENDED", "suspended_at", { byUserColumn: "suspended_by_user_id", byUserId: s.userId, reasonColumn: "suspended_reason", reason: String(reason || "").trim() || "Suspended by review authority." });
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "SUSPENDED", actorUserId: s.userId, detail: { reason } });
  await enqueue("metaverse.enterprise.suspended", enterpriseId, s, { reason });
  return updated;
}

export async function closeEnterprise(actor: any, enterpriseId: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "CLOSED")) throw new EnterpriseError("INVALID_TRANSITION", `Cannot close an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "CLOSED", "closed_at", { byUserColumn: "closed_by_user_id", byUserId: s.userId });
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "CLOSED", actorUserId: s.userId });
  return updated;
}

export async function archiveEnterprise(actor: any, enterpriseId: string): Promise<StudentEnterprise> {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  if (!isAllowedLifecycleTransition(enterprise.lifecycleStatus, "ARCHIVED")) throw new EnterpriseError("INVALID_TRANSITION", `Cannot archive an enterprise in status ${enterprise.lifecycleStatus}.`, 400);
  const updated = await repo.updateLifecycle(enterpriseId, s.organizationId, s.tenantId, enterprise.version, "ARCHIVED", "archived_at");
  if (!updated) throw new EnterpriseError("VERSION_CONFLICT", "Enterprise was modified concurrently.", 409);
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "ARCHIVED", actorUserId: s.userId });
  return updated;
}

export async function getEnterpriseForActor(actor: any, enterpriseId: string) {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  if (enterprise.visibility === "PRIVATE") await requireOwnEnterpriseAccess(actor, enterprise, s);
  const [roles, catalog] = await Promise.all([repo.listRoles(enterpriseId, s.organizationId, s.tenantId), repo.listCatalogItems(enterpriseId, s.organizationId, s.tenantId)]);
  return { ...enterprise, roles, catalog };
}

export async function listMyEnterprises(actor: any) {
  const s = scope(actor);
  return repo.listForTeamMember(s.userId, s.organizationId, s.tenantId);
}

/** Discovery listing: never returns SUSPENDED/CLOSED/ARCHIVED/DRAFT/PENDING_APPROVAL, and never PRIVATE visibility (build brief §K/§27/§49). */
export async function listDiscoverableEnterprises(actor: any) {
  const s = scope(actor);
  const enterprises = await repo.listForOrganization(s.organizationId, s.tenantId, ["ACTIVE", "PAUSED"]);
  return enterprises.filter((enterprise) => enterprise.visibility !== "PRIVATE");
}

/**
 * Reviewer listing (MET-12 remediation): every enterprise in the reviewer's
 * own organization, regardless of visibility or lifecycle status — review
 * authority is a governance concern, not a discovery-audience concern.
 * Gated by the same `assertReviewer` every approve/return/suspend action
 * already uses; a STUDENT actor is rejected here exactly as it is rejected
 * from those actions, and the route additionally requires the
 * METAVERSE_ENTERPRISE_APPROVE permission (never granted to STUDENT).
 */
export async function listEnterprisesForReview(actor: any) {
  const s = scope(actor);
  assertReviewer(actor);
  return repo.listForOrganization(s.organizationId, s.tenantId);
}

export async function grantEnterpriseRole(actor: any, enterpriseId: string, targetUserId: string, role: string) {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  const enterpriseRole = String(role || "").toUpperCase() as EnterpriseRole;
  if (!ENTERPRISE_ROLES.includes(enterpriseRole)) throw new EnterpriseError("INVALID_ROLE", "Enterprise role is not recognized.", 400);
  try {
    await assertCanManageTeam(enterprise.studioTeamId, s.organizationId, s.tenantId, String(targetUserId || ""));
  } catch {
    throw new EnterpriseError("TARGET_NOT_TEAM_MEMBER", "Roles may only be granted to active canonical team members.", 400);
  }
  return repo.grantRole({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, userId: String(targetUserId), enterpriseRole, grantedByUserId: s.userId });
}

export async function revokeEnterpriseRole(actor: any, enterpriseId: string, targetUserId: string) {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  await requireOwnEnterpriseAccess(actor, enterprise, s);
  await repo.revokeRole(enterpriseId, s.organizationId, s.tenantId, String(targetUserId));
}

export interface AddCatalogItemInput {
  title: string;
  summary: string;
  category: string;
}

export async function addCatalogItem(actor: any, enterpriseId: string, input: AddCatalogItemInput) {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  const role = await repo.getActiveRole(enterpriseId, s.organizationId, s.tenantId, s.userId);
  if (!canReviewEnterprises(actor) && (!role || !["FOUNDER", "OPERATIONS_LEAD", "CATALOG_MANAGER"].includes(role.enterpriseRole))) {
    throw new EnterpriseError("ENTERPRISE_ROLE_REQUIRED", "An authorized enterprise role is required to manage the catalog.", 403);
  }
  const title = String(input.title || "").trim();
  const summary = String(input.summary || "").trim();
  if (!title) throw new EnterpriseError("TITLE_REQUIRED", "Catalog item title is required.", 400);
  if (!summary) throw new EnterpriseError("SUMMARY_REQUIRED", "Catalog item summary is required.", 400);
  if (isProhibitedEnterpriseCatalogClaim({ title, summary })) {
    throw new EnterpriseError("PROHIBITED_CATALOG_CLAIM", "Catalog items cannot claim to sell verified skills, credentials, grades, or admission.", 400);
  }
  const category = String(input.category || "").toUpperCase() as EnterpriseCatalogCategory;
  if (!ENTERPRISE_CATALOG_CATEGORIES.includes(category)) throw new EnterpriseError("INVALID_CATALOG_CATEGORY", "Catalog category is not recognized.", 400);
  const item = await repo.addCatalogItem({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, title, summary, category, createdByUserId: s.userId });
  await repo.recordHistory({ enterpriseId, organizationId: s.organizationId, tenantId: s.tenantId, eventType: "CATALOG_ITEM_ADDED", actorUserId: s.userId, detail: { title } });
  return item;
}

export async function listCatalog(actor: any, enterpriseId: string) {
  const s = scope(actor);
  await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  return repo.listCatalogItems(enterpriseId, s.organizationId, s.tenantId);
}

export async function listEnterpriseHistory(actor: any, enterpriseId: string) {
  const s = scope(actor);
  const enterprise = await getEnterpriseOrThrow(enterpriseId, s.organizationId, s.tenantId);
  if (enterprise.visibility === "PRIVATE") await requireOwnEnterpriseAccess(actor, enterprise, s);
  return repo.listHistory(enterpriseId, s.organizationId, s.tenantId);
}

export function statusForEnterpriseError(error: any): number {
  return error instanceof EnterpriseError ? error.statusCode : 500;
}

export { EnterpriseError };
