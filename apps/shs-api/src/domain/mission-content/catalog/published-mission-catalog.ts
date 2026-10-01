import {
  assertValidMissionDefinition,
  type MissionDefinition,
} from "../model/mission-definition.js";

export interface PublishedMissionIdentity {
  missionId: string;
  version: number;
}

export interface PublishedMissionResolver {
  resolvePublishedMission(identity: PublishedMissionIdentity): Promise<MissionDefinition | null>;
}

export class PublishedMissionCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishedMissionCatalogError";
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function cloneDefinition(definition: MissionDefinition): MissionDefinition {
  return JSON.parse(JSON.stringify(definition)) as MissionDefinition;
}

export class ServerPublishedMissionCatalog implements PublishedMissionResolver {
  private readonly entries: readonly MissionDefinition[];

  constructor(definitions: readonly MissionDefinition[]) {
    const seen = new Set<string>();
    this.entries = Object.freeze(definitions.map((input) => {
      const definition = deepFreeze(cloneDefinition(input));
      assertValidMissionDefinition(definition);
      const key = `${definition.missionId}\u0000${definition.version}`;
      if (seen.has(key)) throw new PublishedMissionCatalogError(`Duplicate published Mission identity/version: ${definition.missionId}@${definition.version}`);
      seen.add(key);
      return definition;
    }));
  }

  async resolvePublishedMission(identity: PublishedMissionIdentity): Promise<MissionDefinition | null> {
    const entry = this.entries.find((item) => item.missionId === identity.missionId && item.version === identity.version);
    if (!entry || entry.status !== "PUBLISHED") return null;
    assertValidMissionDefinition(entry);
    return cloneDefinition(entry);
  }
}

// No 4A draft fixture is promoted or exposed as production content here.
// 4D may replace this code-backed source while preserving the resolver contract.
export const SERVER_PUBLISHED_MISSION_DEFINITIONS: readonly MissionDefinition[] = Object.freeze([]);
export const serverPublishedMissionResolver = new ServerPublishedMissionCatalog(SERVER_PUBLISHED_MISSION_DEFINITIONS);
