import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";
import {
  MISSION_BRANCH_STATE_KEY,
  MISSION_DIFFICULTY_STATE_KEY,
  MISSION_SYSTEM_EVENTS,
  type MissionCharacter,
} from "../../mission-content/model/mission-scenario.js";
import type { MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";
import type { MissionDirectorAction } from "../model/mission-director.js";

type ScenarioState = Pick<MissionRuntimeSession, "stageStates" | "objectiveStates" | "runtimeState">;
type ScenarioAction = Exclude<MissionDirectorAction, { type: "NO_OP" | "EMIT_DECLARED_EVENT" | "SET_DECLARED_RUNTIME_STATE" | "ESCALATE" }>;

export const CHARACTER_EVENT_TYPES: ReadonlySet<string> = new Set([
  MISSION_SYSTEM_EVENTS.characterSpoke,
  MISSION_SYSTEM_EVENTS.characterObserved,
  MISSION_SYSTEM_EVENTS.characterRequestedAction,
]);

export function activeStageIds(state: Pick<ScenarioState, "stageStates">) {
  return new Set(state.stageStates.filter((stage) => stage.status === "ACTIVE").map((stage) => stage.stageId));
}

function availableNow(stageIds: string[], active: Set<string>) {
  return stageIds.length === 0 || stageIds.some((id) => active.has(id));
}

export function availableCharacters(definition: MissionDefinition, state: Pick<ScenarioState, "stageStates">): MissionCharacter[] {
  const active = activeStageIds(state);
  return (definition.characters || []).filter((character) => availableNow(character.availableStageIds, active));
}

export function characterKnowledgeStageIds(definition: MissionDefinition, character: MissionCharacter, state: Pick<ScenarioState, "stageStates">) {
  // MISSION_ONLY: Mission-wide stage outline. CURRENT_STAGE: only active stages this character may appear in.
  if (character.knowledgeScope === "MISSION_ONLY") return definition.stages.map((stage) => stage.stageId);
  const active = activeStageIds(state);
  return definition.stages.map((stage) => stage.stageId)
    .filter((id) => active.has(id) && (character.availableStageIds.length === 0 || character.availableStageIds.includes(id)));
}

// Single source of declaration checks for Phase 4F actions. The Director policy calls it against
// its context; Mission Runtime calls it again against the row-locked session before mutating.
export function scenarioActionDenial(
  definition: MissionDefinition,
  state: ScenarioState,
  action: ScenarioAction,
): string | null {
  const capabilities = definition.aiCapabilities;
  if (action.type === "ADAPT_DIFFICULTY") {
    if (!capabilities.adaptiveDifficulty) return "ADAPTIVE_DIFFICULTY_DENIED";
    if (!definition.difficultyProfile) return "DIFFICULTY_PROFILE_NOT_DECLARED";
    if (!definition.difficultyProfile.tiers.includes(action.tier)) return "DIFFICULTY_TIER_NOT_DECLARED";
    if ((state.runtimeState[MISSION_DIFFICULTY_STATE_KEY] ?? definition.difficulty) === action.tier) return "DIFFICULTY_TIER_UNCHANGED";
    return null;
  }
  if (action.type === "SELECT_SCENARIO_BRANCH") {
    if (!capabilities.scenarioVariation) return "SCENARIO_VARIATION_DENIED";
    if (!definition.scenarioBranching) return "SCENARIO_BRANCHING_NOT_DECLARED";
    const branch = definition.scenarioBranching.branches.find((item) => item.branchId === action.branchId);
    if (!branch) return "SCENARIO_BRANCH_NOT_DECLARED";
    if (!availableNow(branch.availableDuringStageIds, activeStageIds(state))) return "SCENARIO_BRANCH_NOT_AVAILABLE";
    if ((state.runtimeState[MISSION_BRANCH_STATE_KEY] ?? definition.scenarioBranching.defaultBranchId) === action.branchId) return "SCENARIO_BRANCH_UNCHANGED";
    return null;
  }
  if (!capabilities.npcDialogue) return "NPC_DIALOGUE_DENIED";
  const character = (definition.characters || []).find((item) => item.characterId === action.characterId);
  if (!character) return "CHARACTER_NOT_DECLARED";
  if (!availableNow(character.availableStageIds, activeStageIds(state))) return "CHARACTER_NOT_AVAILABLE";
  if (action.type === "CHARACTER_SPEAK") {
    if (!character.allowedBehaviors.includes("SPEAK") || character.dialogueMode === "NONE") return "CHARACTER_DIALOGUE_NOT_PERMITTED";
    return character.scriptedLines.some((line) => line.lineId === action.lineId) ? null : "CHARACTER_LINE_NOT_DECLARED";
  }
  if (action.type === "CHARACTER_OBSERVE") {
    if (!character.allowedBehaviors.includes("OBSERVE")) return "CHARACTER_BEHAVIOR_NOT_PERMITTED";
    return character.scenarioFacts.some((fact) => fact.factId === action.factId) ? null : "CHARACTER_FACT_NOT_DECLARED";
  }
  if (!character.allowedBehaviors.includes("REQUEST_ACTION")) return "CHARACTER_BEHAVIOR_NOT_PERMITTED";
  const objective = state.objectiveStates.find((item) => item.objectiveId === action.objectiveId);
  if (!objective) return "OBJECTIVE_NOT_DECLARED";
  if (objective.status === "COMPLETED") return "OBJECTIVE_ALREADY_COMPLETED";
  const active = activeStageIds(state);
  // The objective must sit in an active stage inside this character's knowledge scope.
  const knowledge = new Set(characterKnowledgeStageIds(definition, character, state));
  const inActiveStage = definition.stages.length === 0
    || definition.stages.some((stage) => active.has(stage.stageId) && knowledge.has(stage.stageId) && stage.objectiveIds.includes(action.objectiveId));
  return inActiveStage ? null : "OBJECTIVE_NOT_IN_ACTIVE_STAGE";
}

// Runtime-owned state/event produced by an already-validated 4F action. Payloads are built here by
// the server from declared content, never copied from executor output beyond validated fields.
export function scenarioActionEffect(definition: MissionDefinition, state: ScenarioState, action: ScenarioAction): {
  statePatch: Record<string, string>;
  event: { eventType: string; payload: Record<string, unknown> };
} {
  if (action.type === "ADAPT_DIFFICULTY") {
    return {
      statePatch: { [MISSION_DIFFICULTY_STATE_KEY]: action.tier },
      event: { eventType: MISSION_SYSTEM_EVENTS.difficultyAdapted, payload: {
        fromTier: state.runtimeState[MISSION_DIFFICULTY_STATE_KEY] ?? definition.difficulty, toTier: action.tier,
      } },
    };
  }
  if (action.type === "SELECT_SCENARIO_BRANCH") {
    return {
      statePatch: { [MISSION_BRANCH_STATE_KEY]: action.branchId },
      event: { eventType: MISSION_SYSTEM_EVENTS.branchSelected, payload: {
        fromBranchId: state.runtimeState[MISSION_BRANCH_STATE_KEY] ?? definition.scenarioBranching!.defaultBranchId, toBranchId: action.branchId,
      } },
    };
  }
  const character = definition.characters!.find((item) => item.characterId === action.characterId)!;
  const base = { characterId: character.characterId, characterType: character.characterType, simulated: true };
  if (action.type === "CHARACTER_SPEAK") {
    // Authored text is resolved here, server-side, from the frozen snapshot.
    const text = character.scriptedLines.find((line) => line.lineId === action.lineId)!.text;
    return { statePatch: {}, event: { eventType: MISSION_SYSTEM_EVENTS.characterSpoke, payload: { ...base, lineId: action.lineId, text, scripted: true } } };
  }
  if (action.type === "CHARACTER_OBSERVE") {
    const text = character.scenarioFacts.find((fact) => fact.factId === action.factId)!.text;
    return { statePatch: {}, event: { eventType: MISSION_SYSTEM_EVENTS.characterObserved, payload: { ...base, factId: action.factId, text } } };
  }
  return { statePatch: {}, event: { eventType: MISSION_SYSTEM_EVENTS.characterRequestedAction, payload: { ...base, objectiveId: action.objectiveId } } };
}

export function isScenarioAction(action: MissionDirectorAction): action is ScenarioAction {
  return ["ADAPT_DIFFICULTY", "SELECT_SCENARIO_BRANCH", "CHARACTER_SPEAK", "CHARACTER_OBSERVE", "CHARACTER_REQUEST_ACTION"].includes(action.type);
}
