// Phase 4F: declarative adaptive-scenario envelope carried inside the immutable MissionDefinition.
// Characters are Mission-scoped simulated participants, never Identity accounts or institutional authorities.
import type { MissionCondition, MissionDefinition } from "./mission-definition.js";

export const MISSION_DIFFICULTY_TIERS = ["INTRODUCTORY", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export type MissionDifficultyTier = (typeof MISSION_DIFFICULTY_TIERS)[number];

export const MISSION_CHARACTER_TYPES = ["INSTRUCTOR", "SUPERVISOR", "TEAMMATE", "CUSTOMER", "PATIENT", "WITNESS", "DISPATCHER"] as const;
export const MISSION_CHARACTER_BEHAVIORS = ["SPEAK", "OBSERVE", "REQUEST_ACTION"] as const;
export const MISSION_CHARACTER_KNOWLEDGE_SCOPES = ["CURRENT_STAGE", "MISSION_ONLY"] as const;
export const MISSION_CHARACTER_DIALOGUE_MODES = ["NONE", "SCRIPTED_ONLY", "BOUNDED"] as const;

export type MissionCharacterType = (typeof MISSION_CHARACTER_TYPES)[number];
export type MissionCharacterBehavior = (typeof MISSION_CHARACTER_BEHAVIORS)[number];
export type MissionCharacterKnowledgeScope = (typeof MISSION_CHARACTER_KNOWLEDGE_SCOPES)[number];
export type MissionCharacterDialogueMode = (typeof MISSION_CHARACTER_DIALOGUE_MODES)[number];

export const MISSION_SCENARIO_LIMITS = {
  maxCharacters: 8,
  maxScriptedLines: 24,
  maxScenarioFacts: 12,
  maxBranches: 8,
  textMaxChars: 280,
  labelMaxChars: 80,
  recentDialoguePerCharacter: 10,
} as const;

// Runtime-managed state keys. Only the Mission Director apply path may change them; the
// learner-facing state route rejects the whole reserved prefix.
export const MISSION_RESERVED_STATE_PREFIX = "mission.";
export const MISSION_DIFFICULTY_STATE_KEY = "mission.difficultyTier";
export const MISSION_BRANCH_STATE_KEY = "mission.scenarioBranch";

// Runtime-owned operational events. Mission Definitions cannot declare them as condition events,
// so learner-facing event routes can never forge them.
export const MISSION_SYSTEM_EVENT_PREFIXES = ["MISSION_DIRECTOR_", "MISSION_DIFFICULTY_", "MISSION_SCENARIO_", "MISSION_CHARACTER_"] as const;
export const MISSION_SYSTEM_EVENTS = {
  escalated: "MISSION_DIRECTOR_ESCALATED",
  difficultyAdapted: "MISSION_DIFFICULTY_ADAPTED",
  branchSelected: "MISSION_SCENARIO_BRANCH_SELECTED",
  characterSpoke: "MISSION_CHARACTER_SPOKE",
  characterObserved: "MISSION_CHARACTER_OBSERVED",
  characterRequestedAction: "MISSION_CHARACTER_REQUESTED_ACTION",
} as const;

// Families/classifications where 4F permits only authored (scripted) character dialogue.
const SCRIPTED_ONLY_FAMILIES = new Set(["HEALTHCARE", "PUBLIC_SAFETY"]);

export interface MissionDifficultyProfile {
  // Default tier is always the definition's catalog `difficulty`. Tiers carry no timing or
  // accessibility parameters, so adaptation cannot override accommodations.
  tiers: MissionDifficultyTier[];
}

export interface MissionCharacterLine { lineId: string; text: string }
export interface MissionCharacterFact { factId: string; text: string }

export interface MissionCharacter {
  characterId: string;
  displayName: string;
  characterType: MissionCharacterType;
  simulatedRole: string;
  allowedBehaviors: MissionCharacterBehavior[];
  knowledgeScope: MissionCharacterKnowledgeScope;
  dialogueMode: MissionCharacterDialogueMode;
  scriptedLines: MissionCharacterLine[];
  scenarioFacts: MissionCharacterFact[];
  availableStageIds: string[];
  environmentId?: string;
}

export interface MissionScenarioBranch {
  branchId: string;
  label: string;
  description: string;
  availableDuringStageIds: string[];
}

export interface MissionScenarioBranching {
  defaultBranchId: string;
  branches: MissionScenarioBranch[];
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const EXECUTABLE_TEXT = /<\s*script\b|javascript\s*:|\beval\s*\(|\bnew\s+Function\b/i;

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function add(errors: string[], condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function onlyKeys(value: Record<string, any>, allowed: string[], path: string, errors: string[]) {
  for (const key of Object.keys(value)) add(errors, allowed.includes(key), `${path}.${key}: unsupported field`);
}

function boundedText(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max && !EXECUTABLE_TEXT.test(value);
}

function uniqueIds(items: unknown[], key: string, path: string, errors: string[]) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const id = isRecord(item) ? item[key] : undefined;
    add(errors, typeof id === "string" && ID_PATTERN.test(id), `${path}[${index}].${key} is invalid`);
    add(errors, !seen.has(id), `${path}[${index}].${key} is duplicated`);
    seen.add(id);
  });
  return seen;
}

export function isSystemEventType(eventType: string) {
  return MISSION_SYSTEM_EVENT_PREFIXES.some((prefix) => eventType.startsWith(prefix));
}

export function isReservedStateKey(key: string) {
  return key.startsWith(MISSION_RESERVED_STATE_PREFIX);
}

export function allMissionConditions(definition: Pick<MissionDefinition, "objectives" | "stages" | "successConditions" | "failureConditions">): MissionCondition[] {
  return [
    ...(definition.objectives || []).map((objective) => objective.completionRule),
    ...(definition.stages || []).flatMap((stage) => [...(stage.entryConditions || []), ...(stage.exitConditions || [])]),
    ...(definition.successConditions || []),
    ...(definition.failureConditions || []),
  ].filter(isRecord) as MissionCondition[];
}

// Deterministic fallback: a runtime starts at the catalog difficulty and the default branch.
export function initialScenarioState(definition: MissionDefinition): Record<string, string> {
  return {
    ...(definition.difficultyProfile ? { [MISSION_DIFFICULTY_STATE_KEY]: definition.difficulty } : {}),
    ...(definition.scenarioBranching ? { [MISSION_BRANCH_STATE_KEY]: definition.scenarioBranching.defaultBranchId } : {}),
  };
}

export function validateMissionScenarioExtensions(value: Record<string, any>, stageIds: Set<string>, errors: string[]) {
  const tiers = new Set<string>();
  if (value.difficultyProfile !== undefined) {
    const profile = value.difficultyProfile;
    add(errors, isRecord(profile), "difficultyProfile must be an object");
    if (isRecord(profile)) {
      onlyKeys(profile, ["tiers"], "difficultyProfile", errors);
      const list = Array.isArray(profile.tiers) ? profile.tiers : [];
      add(errors, list.length >= 2 && list.length <= MISSION_DIFFICULTY_TIERS.length, "difficultyProfile.tiers must declare 2-5 tiers");
      for (const tier of list) {
        add(errors, MISSION_DIFFICULTY_TIERS.includes(tier), "difficultyProfile.tiers contains an undeclared tier");
        add(errors, !tiers.has(tier), "difficultyProfile.tiers contains a duplicate tier");
        tiers.add(tier);
      }
      add(errors, tiers.has(value.difficulty), "difficultyProfile.tiers must include the Mission difficulty as the default tier");
    }
  }

  const environmentIds = new Set((Array.isArray(value.environmentRefs) ? value.environmentRefs : []).map((ref: any) => ref?.environmentId));
  const scriptedOnly = SCRIPTED_ONLY_FAMILIES.has(value.family) || value.safety?.classification !== "GENERAL";
  if (value.characters !== undefined) {
    add(errors, Array.isArray(value.characters) && value.characters.length <= MISSION_SCENARIO_LIMITS.maxCharacters, `characters must be an array of at most ${MISSION_SCENARIO_LIMITS.maxCharacters}`);
    const characters = Array.isArray(value.characters) ? value.characters : [];
    uniqueIds(characters, "characterId", "characters", errors);
    characters.forEach((character: any, index: number) => {
      const path = `characters[${index}]`;
      if (!isRecord(character)) return void errors.push(`${path} must be an object`);
      onlyKeys(character, ["characterId", "displayName", "characterType", "simulatedRole", "allowedBehaviors", "knowledgeScope", "dialogueMode", "scriptedLines", "scenarioFacts", "availableStageIds", "environmentId"], path, errors);
      add(errors, boundedText(character.displayName, MISSION_SCENARIO_LIMITS.labelMaxChars), `${path}.displayName must be bounded safe text`);
      add(errors, boundedText(character.simulatedRole, MISSION_SCENARIO_LIMITS.labelMaxChars), `${path}.simulatedRole must be bounded safe text`);
      add(errors, MISSION_CHARACTER_TYPES.includes(character.characterType), `${path}.characterType is invalid`);
      add(errors, MISSION_CHARACTER_KNOWLEDGE_SCOPES.includes(character.knowledgeScope), `${path}.knowledgeScope is invalid`);
      add(errors, MISSION_CHARACTER_DIALOGUE_MODES.includes(character.dialogueMode), `${path}.dialogueMode is invalid`);
      const behaviors = Array.isArray(character.allowedBehaviors) ? character.allowedBehaviors : [];
      add(errors, behaviors.length > 0 && behaviors.every((item: unknown) => MISSION_CHARACTER_BEHAVIORS.includes(item as MissionCharacterBehavior))
        && new Set(behaviors).size === behaviors.length, `${path}.allowedBehaviors must be a non-empty unique subset of ${MISSION_CHARACTER_BEHAVIORS.join(", ")}`);
      add(errors, behaviors.includes("SPEAK") === (character.dialogueMode !== "NONE"), `${path}: SPEAK behavior and a dialogue mode other than NONE must be declared together`);
      add(errors, !(scriptedOnly && character.dialogueMode === "BOUNDED"), `${path}: ${value.family}/${value.safety?.classification} Missions permit only SCRIPTED_ONLY character dialogue`);
      for (const [key, idKey, max] of [["scriptedLines", "lineId", MISSION_SCENARIO_LIMITS.maxScriptedLines], ["scenarioFacts", "factId", MISSION_SCENARIO_LIMITS.maxScenarioFacts]] as const) {
        const items = Array.isArray(character[key]) ? character[key] : null;
        add(errors, items !== null && items.length <= max, `${path}.${key} must be an array of at most ${max}`);
        uniqueIds(items || [], idKey, `${path}.${key}`, errors);
        (items || []).forEach((item: any, i: number) => {
          if (!isRecord(item)) return;
          onlyKeys(item, [idKey, "text"], `${path}.${key}[${i}]`, errors);
          add(errors, boundedText(item.text, MISSION_SCENARIO_LIMITS.textMaxChars), `${path}.${key}[${i}].text must be bounded safe text`);
        });
      }
      add(errors, character.dialogueMode !== "SCRIPTED_ONLY" || (Array.isArray(character.scriptedLines) && character.scriptedLines.length > 0), `${path}: SCRIPTED_ONLY dialogue requires scriptedLines`);
      add(errors, !behaviors.includes("OBSERVE") || (Array.isArray(character.scenarioFacts) && character.scenarioFacts.length > 0), `${path}: OBSERVE behavior requires scenarioFacts`);
      add(errors, Array.isArray(character.availableStageIds) && character.availableStageIds.every((id: string) => stageIds.has(id)), `${path}.availableStageIds references an unknown stage`);
      if (character.environmentId !== undefined) add(errors, environmentIds.has(character.environmentId), `${path}.environmentId must reference a declared environmentRef`);
    });
  }

  const branchIds = new Set<string>();
  if (value.scenarioBranching !== undefined) {
    const branching = value.scenarioBranching;
    add(errors, isRecord(branching), "scenarioBranching must be an object");
    if (isRecord(branching)) {
      onlyKeys(branching, ["defaultBranchId", "branches"], "scenarioBranching", errors);
      const branches = Array.isArray(branching.branches) ? branching.branches : [];
      add(errors, branches.length >= 2 && branches.length <= MISSION_SCENARIO_LIMITS.maxBranches, `scenarioBranching.branches must declare 2-${MISSION_SCENARIO_LIMITS.maxBranches} branches`);
      uniqueIds(branches, "branchId", "scenarioBranching.branches", errors).forEach((id) => branchIds.add(id));
      branches.forEach((branch: any, index: number) => {
        const path = `scenarioBranching.branches[${index}]`;
        if (!isRecord(branch)) return void errors.push(`${path} must be an object`);
        onlyKeys(branch, ["branchId", "label", "description", "availableDuringStageIds"], path, errors);
        add(errors, boundedText(branch.label, MISSION_SCENARIO_LIMITS.labelMaxChars), `${path}.label must be bounded safe text`);
        add(errors, boundedText(branch.description, MISSION_SCENARIO_LIMITS.textMaxChars), `${path}.description must be bounded safe text`);
        add(errors, Array.isArray(branch.availableDuringStageIds) && branch.availableDuringStageIds.every((id: string) => stageIds.has(id)), `${path}.availableDuringStageIds references an unknown stage`);
      });
      add(errors, branchIds.has(branching.defaultBranchId), "scenarioBranching.defaultBranchId must reference a declared branch");
    }
  }

  // Conditions may observe runtime-managed keys only through declared values, and may never
  // declare runtime-owned system events.
  for (const condition of allMissionConditions(value as MissionDefinition)) {
    if (typeof condition.eventType === "string") add(errors, !isSystemEventType(condition.eventType), `condition event '${condition.eventType}' is reserved for Mission Runtime`);
    if (typeof condition.stateKey !== "string" || !isReservedStateKey(condition.stateKey)) continue;
    const declared = condition.stateKey === MISSION_DIFFICULTY_STATE_KEY ? tiers : condition.stateKey === MISSION_BRANCH_STATE_KEY ? branchIds : null;
    add(errors, declared !== null && declared.size > 0, `condition state key '${condition.stateKey}' is reserved and not declared by this Mission`);
    if (declared) add(errors, condition.type === "STATE_EQUALS" && declared.has(String(condition.value)), `condition on '${condition.stateKey}' must be STATE_EQUALS a declared value`);
  }
}
