// MET-12 — Student Enterprise System contract.
//
// Legal/simulation boundary (build brief §Phase A.6): a Student Enterprise
// is educational/simulated. Creating one, approving one, or holding a role
// in one never makes it, and never implies it is:
//   - a legal business, employer, or payroll entity
//   - a tax entity or licensed contractor
//   - a registered company
//   - an independent organization/tenant
// It is a governed, in-organization simulation reusing canonical Studio
// team, Market, Opportunity Exchange, Treasury, and evidence authorities.
export const STUDENT_ENTERPRISE_LEGAL_BOUNDARY_STATEMENT =
  "Student Enterprise is educational/simulated. It is not a legal business, employer, payroll entity, tax entity, licensed contractor, registered company, or independent organization/tenant.";

export const ENTERPRISE_LIFECYCLE_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "PAUSED",
  "SUSPENDED",
  "CLOSED",
  "ARCHIVED",
] as const;
export type EnterpriseLifecycleStatus = typeof ENTERPRISE_LIFECYCLE_STATUSES[number];

// Statuses in which the enterprise may transact (sell, bid, receive awards).
export const ENTERPRISE_TRANSACTABLE_STATUSES: EnterpriseLifecycleStatus[] = ["ACTIVE"];

export const ENTERPRISE_OPERATING_MODES = [
  "SIMULATED",
  "EDUCATIONAL",
  "PROGRAM_SANDBOX",
  "EXTERNAL_REFERENCE_ONLY",
] as const;
export type EnterpriseOperatingMode = typeof ENTERPRISE_OPERATING_MODES[number];

export const ENTERPRISE_CATEGORIES = [
  "PRODUCT_DESIGN",
  "DIGITAL_SERVICE",
  "CREATIVE_STUDIO",
  "COMMUNITY_SERVICE",
  "TECH_PROTOTYPE",
  "EVENT_SHOWCASE",
  "OTHER_EDUCATIONAL",
] as const;
export type EnterpriseCategory = typeof ENTERPRISE_CATEGORIES[number];

export const ENTERPRISE_ROLES = ["FOUNDER", "OPERATIONS_LEAD", "CATALOG_MANAGER", "MEMBER"] as const;
export type EnterpriseRole = typeof ENTERPRISE_ROLES[number];

// Roles authorized to publish a Market listing / manage the catalog on the
// enterprise's behalf. MEMBER alone is not sufficient (build brief §Phase B).
export const ENTERPRISE_SELLER_AUTHORIZED_ROLES: EnterpriseRole[] = ["FOUNDER", "OPERATIONS_LEAD", "CATALOG_MANAGER"];

export const ENTERPRISE_VISIBILITIES = ["PRIVATE", "PROGRAM", "ORGANIZATION", "NETWORK", "CITY"] as const;
export type EnterpriseVisibility = typeof ENTERPRISE_VISIBILITIES[number];

export const ENTERPRISE_CATALOG_CATEGORIES = ["PRODUCT", "SERVICE", "SHOWCASE_ITEM", "COMMUNITY_OFFERING"] as const;
export type EnterpriseCatalogCategory = typeof ENTERPRISE_CATALOG_CATEGORIES[number];

export const ENTERPRISE_HISTORY_EVENT_TYPES = [
  "FORMED",
  "SUBMITTED_FOR_APPROVAL",
  "APPROVED",
  "RETURNED",
  "PAUSED",
  "RESUMED",
  "SUSPENDED",
  "CLOSED",
  "ARCHIVED",
  "CATALOG_ITEM_ADDED",
  "MARKET_LISTING_PUBLISHED",
  "OPPORTUNITY_BID_SUBMITTED",
  "OPPORTUNITY_AWARDED",
  "PROJECT_STARTED",
  "PROJECT_SUBMITTED",
  "PROJECT_ACCEPTED",
  "ORDER_FULFILLED",
  "SHOWCASE_COMPLETED",
] as const;
export type EnterpriseHistoryEventType = typeof ENTERPRISE_HISTORY_EVENT_TYPES[number];

// Prohibited institutional goods/claims a catalog item may never assert —
// reuses the same discipline as MET-9's isProhibitedInstitutionalGood, kept
// enterprise-specific so a catalog item can never imply verified skill,
// credentials, grades, or admission/eligibility for sale.
const PROHIBITED_CATALOG_CLAIM_PATTERN = /verified\s+skill|credential|diploma|degree|grade|transcript|admission|enrollment\s+guarantee|job\s+guarantee|employment\s+guarantee/i;
export function isProhibitedEnterpriseCatalogClaim(input: { title?: string; summary?: string }): boolean {
  return PROHIBITED_CATALOG_CLAIM_PATTERN.test(String(input?.title || "")) || PROHIBITED_CATALOG_CLAIM_PATTERN.test(String(input?.summary || ""));
}

// Pure lifecycle transition table (build brief §Phase A.4/§K/§27). Kept as
// a standalone pure function so it is independently unit-testable without
// a database, mirroring opportunity-eligibility.ts's evaluateEligibility.
const ALLOWED_TRANSITIONS: Record<EnterpriseLifecycleStatus, EnterpriseLifecycleStatus[]> = {
  DRAFT: ["PENDING_APPROVAL", "ARCHIVED"],
  PENDING_APPROVAL: ["ACTIVE", "DRAFT", "ARCHIVED"], // ACTIVE=approved, DRAFT=returned
  ACTIVE: ["PAUSED", "SUSPENDED", "CLOSED"],
  PAUSED: ["ACTIVE", "SUSPENDED", "CLOSED"],
  SUSPENDED: ["ACTIVE", "CLOSED"], // reinstatement is an explicit admin/instructor action
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function isAllowedLifecycleTransition(from: EnterpriseLifecycleStatus, to: EnterpriseLifecycleStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function canEnterpriseTransact(status: EnterpriseLifecycleStatus): boolean {
  return ENTERPRISE_TRANSACTABLE_STATUSES.includes(status);
}

export interface StudentEnterprise {
  enterpriseId: string;
  organizationId: string;
  tenantId: string;
  studioTeamId: string;
  programId: string | null;
  name: string;
  description: string;
  enterpriseCategory: EnterpriseCategory;
  operatingMode: EnterpriseOperatingMode;
  lifecycleStatus: EnterpriseLifecycleStatus;
  visibility: EnterpriseVisibility;
  legalBoundaryAckVersion: number;
  createdByUserId: string;
  approvedByUserId: string | null;
  suspendedReason: string | null;
  returnReason: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface StudentEnterpriseRole {
  enterpriseRoleId: string;
  enterpriseId: string;
  organizationId: string;
  tenantId: string;
  userId: string;
  enterpriseRole: EnterpriseRole;
  status: "ACTIVE" | "REVOKED";
  grantedByUserId: string;
  grantedAt: string;
}

export interface StudentEnterpriseCatalogItem {
  catalogItemId: string;
  enterpriseId: string;
  organizationId: string;
  tenantId: string;
  title: string;
  summary: string;
  category: EnterpriseCatalogCategory;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  marketListingId: string | null;
  createdByUserId: string;
  createdAt: string;
}

export interface StudentEnterpriseHistoryEntry {
  historyId: string;
  enterpriseId: string;
  organizationId: string;
  tenantId: string;
  eventType: EnterpriseHistoryEventType;
  actorUserId: string;
  detail: Record<string, unknown>;
  occurredAt: string;
}
