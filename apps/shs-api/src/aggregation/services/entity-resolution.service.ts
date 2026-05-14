export type CanonicalEntity = {
  entityId: string;
  entityType: "case";
  county: string;
  programId: string;
  status: string;
  assignedTeam: string;
  sourceSystem: string;
};

const ENTITY_FIXTURES: Record<string, CanonicalEntity> = {
  test_case_001: {
    entityId: "test_case_001",
    entityType: "case",
    county: "Franklin",
    programId: "career_launchpad",
    status: "active",
    assignedTeam: "north_ops",
    sourceSystem: "providerA",
  },
  test_case_002: {
    entityId: "test_case_002",
    entityType: "case",
    county: "Cuyahoga",
    programId: "career_launchpad",
    status: "documentation_gap",
    assignedTeam: "lake_ops",
    sourceSystem: "providerB",
  },
  test_case_003: {
    entityId: "test_case_003",
    entityType: "case",
    county: "Hamilton",
    programId: "career_launchpad",
    status: "conflict_review",
    assignedTeam: "south_ops",
    sourceSystem: "partner_upload",
  },
};

export async function resolveEntity(entityId: string): Promise<CanonicalEntity> {
  return (
    ENTITY_FIXTURES[entityId] || {
      entityId,
      entityType: "case",
      county: "Unknown",
      programId: "unassigned",
      status: "intake",
      assignedTeam: "unassigned",
      sourceSystem: "aggregation_layer",
    }
  );
}

export async function getEntity(entityId: string): Promise<CanonicalEntity> {
  return resolveEntity(entityId);
}

export async function getEntityResolution(entityId: string): Promise<CanonicalEntity> {
  return resolveEntity(entityId);
}

export async function resolveEntities(entityId: string): Promise<CanonicalEntity> {
  return resolveEntity(entityId);
}
