export const ORGANIZATION_RELATIONSHIP_TYPES = {
  INCUBATES: "INCUBATES",
  NETWORK_MEMBER_OF: "NETWORK_MEMBER_OF",
  OPERATES_FOR: "OPERATES_FOR",
  SHARED_SERVICES_PROVIDER_FOR: "SHARED_SERVICES_PROVIDER_FOR",
} as const;

export type OrganizationRelationshipType =
  typeof ORGANIZATION_RELATIONSHIP_TYPES[keyof typeof ORGANIZATION_RELATIONSHIP_TYPES];

export const ORGANIZATION_RELATIONSHIP_STATUSES = {
  PROPOSED: "PROPOSED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  ENDED: "ENDED",
} as const;

export type OrganizationRelationshipStatus =
  typeof ORGANIZATION_RELATIONSHIP_STATUSES[keyof typeof ORGANIZATION_RELATIONSHIP_STATUSES];

export type OrganizationRelationship = {
  relationship_id: string;
  source_organization_id: string;
  target_organization_id: string;
  relationship_type: OrganizationRelationshipType;
  status: OrganizationRelationshipStatus;
  effective_from: string | Date;
  effective_to?: string | Date | null;
  created_by?: string | null;
  created_at?: string | Date;
  updated_by?: string | null;
  updated_at?: string | Date;
  metadata_version: number;
};

const RELATIONSHIP_TYPE_VALUES = new Set(Object.values(ORGANIZATION_RELATIONSHIP_TYPES));
const RELATIONSHIP_STATUS_VALUES = new Set(Object.values(ORGANIZATION_RELATIONSHIP_STATUSES));

export function isKnownOrganizationRelationshipType(value: string): value is OrganizationRelationshipType {
  return RELATIONSHIP_TYPE_VALUES.has(value as OrganizationRelationshipType);
}

export function isKnownOrganizationRelationshipStatus(value: string): value is OrganizationRelationshipStatus {
  return RELATIONSHIP_STATUS_VALUES.has(value as OrganizationRelationshipStatus);
}

export function validateRelationshipLifecycle(input: {
  relationship_type: string;
  status: string;
  effective_from?: string | Date | null;
  effective_to?: string | Date | null;
}) {
  if (!isKnownOrganizationRelationshipType(input.relationship_type)) {
    throw new Error("unknown_relationship_type");
  }
  if (!isKnownOrganizationRelationshipStatus(input.status)) {
    throw new Error("unknown_relationship_status");
  }
  const startsAt = input.effective_from ? new Date(input.effective_from) : new Date();
  if (Number.isNaN(startsAt.getTime())) throw new Error("invalid_relationship_effective_from");
  if (input.effective_to) {
    const endsAt = new Date(input.effective_to);
    if (Number.isNaN(endsAt.getTime())) throw new Error("invalid_relationship_effective_to");
    if (endsAt < startsAt) throw new Error("relationship_end_before_start");
  }
}

export function isRelationshipCurrentlyActive(relationship: Pick<OrganizationRelationship, "status" | "effective_from" | "effective_to">, now = new Date()) {
  if (relationship.status !== ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE) return false;
  const startsAt = new Date(relationship.effective_from);
  if (Number.isNaN(startsAt.getTime()) || startsAt > now) return false;
  if (!relationship.effective_to) return true;
  const endsAt = new Date(relationship.effective_to);
  return !Number.isNaN(endsAt.getTime()) && endsAt >= now;
}

const ALLOWED_RELATIONSHIP_TRANSITIONS: Record<string, string[]> = {
  [ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED]: [ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, ORGANIZATION_RELATIONSHIP_STATUSES.ENDED],
  [ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE]: [ORGANIZATION_RELATIONSHIP_STATUSES.SUSPENDED, ORGANIZATION_RELATIONSHIP_STATUSES.ENDED],
  [ORGANIZATION_RELATIONSHIP_STATUSES.SUSPENDED]: [ORGANIZATION_RELATIONSHIP_STATUSES.ACTIVE, ORGANIZATION_RELATIONSHIP_STATUSES.ENDED],
  [ORGANIZATION_RELATIONSHIP_STATUSES.ENDED]: [],
};

export function canTransitionRelationship(currentStatus: string, nextStatus: string) {
  if (!isKnownOrganizationRelationshipStatus(currentStatus) || !isKnownOrganizationRelationshipStatus(nextStatus)) {
    return false;
  }
  return (ALLOWED_RELATIONSHIP_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}
