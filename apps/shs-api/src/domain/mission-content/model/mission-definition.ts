import {
  MISSION_DIFFICULTY_TIERS,
  validateMissionScenarioExtensions,
  type MissionCharacter,
  type MissionDifficultyProfile,
  type MissionScenarioBranching,
} from "./mission-scenario.js";
import { validateMissionWorldDeclaration, type MissionMetaverseContextDeclaration } from "./mission-world.js";

export const MISSION_FAMILIES = [
  "LEARNING",
  "CLASSIC",
  "WORKFORCE",
  "CAREER_EXPLORATION",
  "SIMULATION",
  "PUBLIC_SAFETY",
  "HEALTHCARE",
  "INFRASTRUCTURE",
  "CREATOR_MEDIA",
  "LOGISTICS",
  "AUTONOMOUS_SYSTEMS",
] as const;

export const MISSION_STATUSES = ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"] as const;
// Catalog difficulty and Phase 4F adaptive tiers share one closed vocabulary.
export const MISSION_DIFFICULTIES = MISSION_DIFFICULTY_TIERS;
export const MISSION_OBJECTIVE_TYPES = [
  "REACH", "INTERACT", "ANSWER", "INSPECT", "COLLECT", "OPERATE", "REPAIR", "RESPOND", "ESCORT", "DELIVER", "CREATE", "DECIDE", "SURVIVE", "OBSERVE", "REPORT", "CUSTOM",
] as const;
export const MISSION_CONDITION_TYPES = [
  "OBJECTIVE_COMPLETE", "OBJECTIVE_COUNT", "STAGE_COMPLETE", "TIME_ELAPSED", "STATE_EQUALS", "STATE_THRESHOLD", "EVENT_OCCURRED",
] as const;
export const MISSION_SCORE_POLICIES = ["NONE", "POINTS", "TIME", "OBJECTIVE_WEIGHTED"] as const;

export type MissionFamily = (typeof MISSION_FAMILIES)[number];
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export type MissionObjectiveType = (typeof MISSION_OBJECTIVE_TYPES)[number];
export type MissionConditionType = (typeof MISSION_CONDITION_TYPES)[number];

export interface MissionCondition {
  type: MissionConditionType;
  objectiveId?: string;
  stageId?: string;
  count?: number;
  seconds?: number;
  stateKey?: string;
  operator?: "EQ" | "GTE" | "LTE";
  value?: string | number | boolean;
  eventType?: string;
}

export interface MissionObjective {
  objectiveId: string;
  title: string;
  description: string;
  type: MissionObjectiveType;
  required: boolean;
  order: number;
  completionRule: MissionCondition;
  metadata: Record<string, string | number | boolean>;
}

export interface MissionStage {
  stageId: string;
  title: string;
  description: string;
  order: number;
  objectiveIds: string[];
  entryConditions: MissionCondition[];
  exitConditions: MissionCondition[];
  optional: boolean;
  timeLimitSeconds: number | null;
}

export interface MissionDefinition {
  missionId: string;
  slug: string;
  version: number;
  status: MissionStatus;
  family: MissionFamily;
  title: string;
  summary: string;
  intendedAudience: string[];
  difficulty: (typeof MISSION_DIFFICULTIES)[number];
  roles: string[];
  objectives: MissionObjective[];
  stages: MissionStage[];
  successConditions: MissionCondition[];
  failureConditions: MissionCondition[];
  environmentRefs: Array<{
    system: "metaverse" | "arcade" | "simulation";
    environmentId: string;
    locationId?: string;
    sceneId?: string;
    // Phase 4G: a required metaverse ref must resolve before start; an optional one may degrade.
    required?: boolean;
  }>;
  arcadeActivityId?: string;
  runtimeScorePolicy: (typeof MISSION_SCORE_POLICIES)[number];
  aiCapabilities: {
    missionDirector: boolean;
    adaptiveDifficulty: boolean;
    npcDialogue: boolean;
    scenarioVariation: boolean;
  };
  accessibility: {
    reducedMotionSupported: boolean;
    captionsAvailable: boolean;
    audioDescriptionsAvailable: boolean;
    visualReliance: "NONE" | "OPTIONAL" | "REQUIRED";
    audioReliance: "NONE" | "OPTIONAL" | "REQUIRED";
    inputModes: string[];
  };
  safety: {
    classification: "GENERAL" | "SENSITIVE" | "SUPERVISED";
    contentSensitivity: string[];
    notes: string[];
  };
  metadata: Record<string, string | number | boolean>;
  // Phase 4F optional declarative adaptive-scenario envelope (absent on earlier definitions).
  difficultyProfile?: MissionDifficultyProfile;
  characters?: MissionCharacter[];
  scenarioBranching?: MissionScenarioBranching;
  // Phase 4G optional Learning ↔ Metaverse world-context declaration.
  metaverseContext?: MissionMetaverseContextDeclaration;
}

const FORBIDDEN_KEYS = new Set([
  "mastery", "masteryachieved", "verifiedskill", "evidence", "evidenceid", "credential", "credentialid",
  "truthspine", "truthspinefact", "reward", "rewardentitlement", "xp", "xpreward", "evu", "credits",
  "wallet", "tokens", "money", "curriculumcompletion", "careerreadiness", "employmenteligibility",
  "incidenttruth", "mapgeometry", "lessonid", "courseid", "unitid", "useridentity", "userid",
]);

const EXECUTABLE_TEXT = /<\s*script\b|javascript\s*:|\beval\s*\(|\bnew\s+Function\b/i;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeText(value: unknown): boolean {
  return typeof value === "string" && !EXECUTABLE_TEXT.test(value);
}

function add(errors: string[], condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function onlyKeys(value: Record<string, any>, allowed: string[], path: string, errors: string[]) {
  for (const key of Object.keys(value)) add(errors, allowed.includes(key), `${path}.${key}: unsupported field`);
}

function validateScalarMetadata(value: unknown, path: string, errors: string[]) {
  add(errors, isRecord(value), `${path} must be an object`);
  if (!isRecord(value)) return;
  add(errors, Object.keys(value).length <= 32, `${path} supports at most 32 fields`);
  for (const [key, item] of Object.entries(value)) {
    add(errors, ID_PATTERN.test(key), `${path} contains an invalid key`);
    add(errors, ["string", "number", "boolean"].includes(typeof item) && (typeof item !== "number" || Number.isFinite(item)), `${path}.${key} must be a finite scalar`);
  }
}

function validateCondition(condition: any, path: string, errors: string[]) {
  if (!isRecord(condition) || !MISSION_CONDITION_TYPES.includes(condition.type)) {
    errors.push(`${path}: unsupported condition type`);
    return;
  }
  const allowedKeys: Record<string, string[]> = {
    OBJECTIVE_COMPLETE: ["type", "objectiveId"],
    OBJECTIVE_COUNT: ["type", "count"],
    STAGE_COMPLETE: ["type", "stageId"],
    TIME_ELAPSED: ["type", "seconds"],
    STATE_EQUALS: ["type", "stateKey", "value"],
    STATE_THRESHOLD: ["type", "stateKey", "operator", "value"],
    EVENT_OCCURRED: ["type", "eventType"],
  };
  onlyKeys(condition, allowedKeys[condition.type], path, errors);
  const required: Record<string, string[]> = {
    OBJECTIVE_COMPLETE: ["objectiveId"], OBJECTIVE_COUNT: ["count"], STAGE_COMPLETE: ["stageId"],
    TIME_ELAPSED: ["seconds"], STATE_EQUALS: ["stateKey", "value"], STATE_THRESHOLD: ["stateKey", "operator", "value"], EVENT_OCCURRED: ["eventType"],
  };
  for (const key of required[condition.type]) add(errors, condition[key] !== undefined, `${path}: ${condition.type} requires ${key}`);
  if (condition.objectiveId !== undefined) add(errors, typeof condition.objectiveId === "string" && ID_PATTERN.test(condition.objectiveId), `${path}: invalid objectiveId`);
  if (condition.stageId !== undefined) add(errors, typeof condition.stageId === "string" && ID_PATTERN.test(condition.stageId), `${path}: invalid stageId`);
  if (condition.count !== undefined) add(errors, Number.isInteger(condition.count) && condition.count >= 0, `${path}: count must be a non-negative integer`);
  if (condition.seconds !== undefined) add(errors, Number.isFinite(condition.seconds) && condition.seconds >= 0, `${path}: seconds must be non-negative`);
  if (condition.stateKey !== undefined) add(errors, typeof condition.stateKey === "string" && ID_PATTERN.test(condition.stateKey), `${path}: invalid stateKey`);
  if (condition.eventType !== undefined) add(errors, typeof condition.eventType === "string" && ID_PATTERN.test(condition.eventType), `${path}: invalid eventType`);
  if (condition.operator !== undefined) add(errors, ["EQ", "GTE", "LTE"].includes(condition.operator), `${path}: invalid operator`);
  if (condition.value !== undefined) add(errors, ["string", "number", "boolean"].includes(typeof condition.value) && (typeof condition.value !== "number" || Number.isFinite(condition.value)), `${path}: value must be a finite scalar`);
}

function validateNoAuthorityOrExecutableContent(value: unknown, path: string, errors: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoAuthorityOrExecutableContent(item, `${path}[${index}]`, errors));
  } else if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      add(errors, !FORBIDDEN_KEYS.has(key.toLowerCase().replace(/[_-]/g, "")), `${path}.${key}: field is outside Mission authority`);
      validateNoAuthorityOrExecutableContent(nested, `${path}.${key}`, errors);
    }
  } else if (typeof value === "string") {
    add(errors, !EXECUTABLE_TEXT.test(value), `${path}: executable content is not allowed`);
  } else {
    add(errors, typeof value !== "function", `${path}: executable values are not allowed`);
  }
}

export function validateMissionDefinition(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["mission must be an object"];
  onlyKeys(value, ["missionId", "slug", "version", "status", "family", "title", "summary", "intendedAudience", "difficulty", "roles", "objectives", "stages", "successConditions", "failureConditions", "environmentRefs", "arcadeActivityId", "runtimeScorePolicy", "aiCapabilities", "accessibility", "safety", "metadata", "difficultyProfile", "characters", "scenarioBranching", "metaverseContext"], "mission", errors);
  validateNoAuthorityOrExecutableContent(value, "mission", errors);

  add(errors, typeof value.missionId === "string" && ID_PATTERN.test(value.missionId), "missionId is required and must be a stable identifier");
  add(errors, typeof value.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug), "slug must be lowercase kebab-case");
  add(errors, Number.isInteger(value.version) && value.version > 0, "version must be a positive integer");
  add(errors, MISSION_STATUSES.includes(value.status), "status is invalid");
  add(errors, MISSION_FAMILIES.includes(value.family), "family is invalid");
  add(errors, MISSION_DIFFICULTIES.includes(value.difficulty), "difficulty is invalid");
  for (const field of ["title", "summary"]) add(errors, safeText(value[field]), `${field} is required safe text`);
  for (const field of ["intendedAudience", "roles"]) {
    add(errors, Array.isArray(value[field]) && value[field].every(safeText), `${field} must be an array of safe text`);
  }

  const objectives = Array.isArray(value.objectives) ? value.objectives : [];
  const objectiveIds = new Set<string>();
  objectives.forEach((objective: any, index: number) => {
    const path = `objectives[${index}]`;
    add(errors, isRecord(objective), `${path} must be an object`);
    if (!isRecord(objective)) return;
    onlyKeys(objective, ["objectiveId", "title", "description", "type", "required", "order", "completionRule", "metadata"], path, errors);
    add(errors, typeof objective.objectiveId === "string" && ID_PATTERN.test(objective.objectiveId), `${path}.objectiveId is invalid`);
    add(errors, !objectiveIds.has(objective.objectiveId), `${path}.objectiveId is duplicated`);
    objectiveIds.add(objective.objectiveId);
    add(errors, MISSION_OBJECTIVE_TYPES.includes(objective.type), `${path}.type is invalid`);
    add(errors, Number.isInteger(objective.order) && objective.order === index + 1, `${path}.order must be contiguous and one-based`);
    add(errors, typeof objective.required === "boolean", `${path}.required must be boolean`);
    add(errors, safeText(objective.title) && safeText(objective.description), `${path} title and description must be safe text`);
    validateScalarMetadata(objective.metadata, `${path}.metadata`, errors);
    validateCondition(objective.completionRule, `${path}.completionRule`, errors);
  });
  add(errors, objectives.length > 0, "at least one objective is required");

  const stages = Array.isArray(value.stages) ? value.stages : [];
  const stageIds = new Set<string>();
  stages.forEach((stage: any, index: number) => {
    const path = `stages[${index}]`;
    add(errors, isRecord(stage), `${path} must be an object`);
    if (!isRecord(stage)) return;
    onlyKeys(stage, ["stageId", "title", "description", "order", "objectiveIds", "entryConditions", "exitConditions", "optional", "timeLimitSeconds"], path, errors);
    add(errors, typeof stage.stageId === "string" && ID_PATTERN.test(stage.stageId), `${path}.stageId is invalid`);
    add(errors, !stageIds.has(stage.stageId), `${path}.stageId is duplicated`);
    stageIds.add(stage.stageId);
    add(errors, Number.isInteger(stage.order) && stage.order === index + 1, `${path}.order must be contiguous and one-based`);
    add(errors, safeText(stage.title) && safeText(stage.description), `${path} title and description must be safe text`);
    add(errors, typeof stage.optional === "boolean", `${path}.optional must be boolean`);
    add(errors, stage.timeLimitSeconds === null || (Number.isInteger(stage.timeLimitSeconds) && stage.timeLimitSeconds >= 0), `${path}.timeLimitSeconds must be null or non-negative`);
    add(errors, Array.isArray(stage.objectiveIds) && stage.objectiveIds.every((id: string) => objectiveIds.has(id)), `${path} references an unknown objective`);
    for (const key of ["entryConditions", "exitConditions"]) {
      add(errors, Array.isArray(stage[key]), `${path}.${key} must be an array`);
      (Array.isArray(stage[key]) ? stage[key] : []).forEach((condition: any, i: number) => {
        validateCondition(condition, `${path}.${key}[${i}]`, errors);
        if (condition?.objectiveId) add(errors, objectiveIds.has(condition.objectiveId), `${path}.${key}[${i}] references an unknown objective`);
      });
    }
  });
  stages.forEach((stage: any, index: number) => {
    for (const condition of [...(stage.entryConditions || []), ...(stage.exitConditions || [])]) {
      if (condition?.stageId) add(errors, stageIds.has(condition.stageId), `stages[${index}] references an unknown stage`);
    }
  });
  for (const key of ["successConditions", "failureConditions"]) {
    add(errors, Array.isArray(value[key]), `${key} must be an array`);
    (Array.isArray(value[key]) ? value[key] : []).forEach((condition: any, i: number) => {
      validateCondition(condition, `${key}[${i}]`, errors);
      if (condition?.objectiveId) add(errors, objectiveIds.has(condition.objectiveId), `${key}[${i}] references an unknown objective`);
      if (condition?.stageId) add(errors, stageIds.has(condition.stageId), `${key}[${i}] references an unknown stage`);
    });
  }
  if (Array.isArray(value.successConditions) && Array.isArray(value.failureConditions)) {
    const successKeys = new Set(value.successConditions.map((condition: unknown) => JSON.stringify(condition)));
    add(errors, !value.failureConditions.some((condition: unknown) => successKeys.has(JSON.stringify(condition))), "the same condition cannot be declared as both success and failure");
  }
  add(errors, MISSION_SCORE_POLICIES.includes(value.runtimeScorePolicy), "runtimeScorePolicy is invalid");
  add(errors, isRecord(value.aiCapabilities), "aiCapabilities must be an object");
  if (isRecord(value.aiCapabilities)) {
    onlyKeys(value.aiCapabilities, ["missionDirector", "adaptiveDifficulty", "npcDialogue", "scenarioVariation"], "aiCapabilities", errors);
    add(errors, Object.keys(value.aiCapabilities).length === 4 && Object.values(value.aiCapabilities).every((flag) => typeof flag === "boolean"), "aiCapabilities must contain all four boolean permission flags");
  }
  add(errors, isRecord(value.accessibility), "accessibility is required");
  if (isRecord(value.accessibility)) {
    onlyKeys(value.accessibility, ["reducedMotionSupported", "captionsAvailable", "audioDescriptionsAvailable", "visualReliance", "audioReliance", "inputModes"], "accessibility", errors);
    for (const key of ["reducedMotionSupported", "captionsAvailable", "audioDescriptionsAvailable"]) add(errors, typeof value.accessibility[key] === "boolean", `accessibility.${key} must be boolean`);
    for (const key of ["visualReliance", "audioReliance"]) add(errors, ["NONE", "OPTIONAL", "REQUIRED"].includes(value.accessibility[key]), `accessibility.${key} is invalid`);
    add(errors, Array.isArray(value.accessibility.inputModes) && value.accessibility.inputModes.length > 0 && value.accessibility.inputModes.every(safeText), "accessibility.inputModes must contain safe text values");
  }
  add(errors, isRecord(value.safety), "safety metadata is required");
  if (isRecord(value.safety)) {
    onlyKeys(value.safety, ["classification", "contentSensitivity", "notes"], "safety", errors);
    add(errors, ["GENERAL", "SENSITIVE", "SUPERVISED"].includes(value.safety.classification), "safety classification is invalid");
    add(errors, Array.isArray(value.safety.contentSensitivity) && value.safety.contentSensitivity.every(safeText), "safety.contentSensitivity must be safe text values");
    add(errors, Array.isArray(value.safety.notes) && value.safety.notes.every(safeText), "safety.notes must be safe text values");
  }
  add(errors, Array.isArray(value.environmentRefs), "environmentRefs must be an array");
  (Array.isArray(value.environmentRefs) ? value.environmentRefs : []).forEach((ref: any, i: number) => {
    if (!isRecord(ref)) {
      errors.push(`environmentRefs[${i}] must be an object`);
      return;
    }
    onlyKeys(ref, ["system", "environmentId", "locationId", "sceneId", "required"], `environmentRefs[${i}]`, errors);
    add(errors, ["metaverse", "arcade", "simulation"].includes(ref.system), `environmentRefs[${i}].system is invalid`);
    add(errors, typeof ref.environmentId === "string" && ID_PATTERN.test(ref.environmentId), `environmentRefs[${i}].environmentId is invalid`);
    for (const field of ["locationId", "sceneId"]) if (ref[field] !== undefined) add(errors, typeof ref[field] === "string" && ID_PATTERN.test(ref[field]), `environmentRefs[${i}].${field} is invalid`);
  });
  if (value.arcadeActivityId !== undefined) add(errors, typeof value.arcadeActivityId === "string" && ID_PATTERN.test(value.arcadeActivityId), "arcadeActivityId must be a real canonical reference identifier");
  validateScalarMetadata(value.metadata, "metadata", errors);
  validateMissionScenarioExtensions(value, stageIds, errors);
  validateMissionWorldDeclaration(value, errors);
  return errors;
}

export function assertValidMissionDefinition(value: unknown): asserts value is MissionDefinition {
  const errors = validateMissionDefinition(value);
  if (errors.length) throw new Error(`Invalid Mission Definition: ${errors.join("; ")}`);
}
