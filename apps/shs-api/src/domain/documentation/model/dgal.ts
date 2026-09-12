export const DGAL_STATUSES = { DRAFT: "DRAFT", ACTIVE: "ACTIVE", SUPERSEDED: "SUPERSEDED", RETIRED: "RETIRED" } as const;
export const DGAL_REQUIREMENT_TYPES = { REFERENCE: "REFERENCE", GUIDANCE: "GUIDANCE", REQUIRED_DOCUMENT: "REQUIRED_DOCUMENT", REQUIRED_ACKNOWLEDGMENT: "REQUIRED_ACKNOWLEDGMENT", REQUIRED_SIGNATURE: "REQUIRED_SIGNATURE", OPTIONAL_DOCUMENT: "OPTIONAL_DOCUMENT" } as const;
export type DgalRequirementType = typeof DGAL_REQUIREMENT_TYPES[keyof typeof DGAL_REQUIREMENT_TYPES];
export type DgalActor = { user_id?: string; organization_id?: string; active_organization_id?: string; tenant_id?: string; roles?: string[]; permissions?: string[] };
export type RequirementContext = {
  organizationId?: string; tenantId?: string; organizationType?: string; serviceKey?: string;
  entitlementStatus?: "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "NONE" | "UNKNOWN";
  roles?: string[]; workflowType?: string; workflowStage?: string; resourceType?: string; resourceId?: string;
  relationshipType?: string; policyReference?: string; now?: Date;
};
export type ResolvedRequirement = {
  requirementId: string; ruleKey: string; requirementType: DgalRequirementType; required: boolean;
  title: string; explanation: string; sourceDomain: string; sourceReference: string; organizationId: string;
  serviceKey: string | null; workflowType: string | null; workflowStage: string | null; resourceType: string | null;
  documentTypeId: string | null; templateId: string | null; guidanceItemId: string | null; actionReference: string | null;
  priority: number; versionReference: string | null; sources: string[];
};
export type RequirementResolution =
  | { status: "RESOLVED"; requirements: ResolvedRequirement[]; context: Record<string, unknown> }
  | { status: "NO_REQUIREMENTS"; requirements: []; context: Record<string, unknown> }
  | { status: "UNKNOWN"; requirements: []; unresolved: string[]; context: Record<string, unknown> };

export function tenantForOrganization(organizationId: string) { return `tenant:${organizationId}`; }

export function normalizeActorOrganization(actor: DgalActor) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  if (!organizationId) throw new Error("organization_context_required");
  const tenantId = String(actor?.tenant_id || tenantForOrganization(organizationId)).trim();
  if (tenantId !== tenantForOrganization(organizationId)) throw new Error("tenant_organization_mismatch");
  return { organizationId, tenantId };
}

export function safeActionReference(actionReference: unknown) {
  if (actionReference == null || actionReference === "") return null;
  const value = String(actionReference).trim();
  if (!value || /^(https?:|javascript:|data:|\/\/)/i.test(value)) throw new Error("unsafe_action_reference");
  return value;
}
