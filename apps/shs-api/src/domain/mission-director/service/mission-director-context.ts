import { createHash } from "node:crypto";
import type { MissionRuntimeActor, MissionRuntimeService } from "../../mission-runtime/service/mission-runtime-service.js";
import type { MissionRuntimeEvent, MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";
import { MISSION_BRANCH_STATE_KEY, MISSION_DIFFICULTY_STATE_KEY, type MissionDifficultyTier } from "../../mission-content/model/mission-scenario.js";
import type {
  MissionDirectorContext,
  MissionDirectorExecutorCharacter,
  MissionDirectorExecutorContext,
  MissionDirectorExecutorStage,
} from "../model/mission-director.js";
import { CHARACTER_EVENT_TYPES, activeStageIds, availableCharacters } from "./mission-director-scenario-rules.js";

const RECENT_EVENT_LIMIT = 20;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function eventView(event: MissionRuntimeEvent) {
  return { sequence: event.sequence, eventType: event.eventType, payload: structuredClone(event.payload) };
}

// Builds both contexts from the frozen runtime snapshot (never a draft or current release):
// - `context`: INTERNAL, full snapshot, used only by server-side deterministic policy.
// - `executorContext`: least-privilege projection handed to the executor.
// `digest` covers exactly the executor-visible projection, so a decision record proves which
// minimized information produced its proposal without storing that information.
export class MissionDirectorContextBuilder {
  constructor(private readonly runtime: MissionRuntimeService) {}

  async build(actor: MissionRuntimeActor, sessionId: string): Promise<{ context: MissionDirectorContext; executorContext: MissionDirectorExecutorContext; digest: string }> {
    const session = await this.runtime.get(actor, sessionId);
    const events = await this.runtime.listEvents(actor, sessionId);
    const context: MissionDirectorContext = {
      runtimeSessionId: session.id,
      organizationId: session.organizationId,
      tenantId: session.tenantId,
      missionId: session.missionId,
      missionVersion: session.missionVersion,
      runtimeRevision: session.revision,
      runtimeStatus: session.status,
      definitionSnapshot: structuredClone(session.definitionSnapshot),
      objectiveStates: structuredClone(session.objectiveStates),
      stageStates: structuredClone(session.stageStates),
      runtimeState: structuredClone(session.runtimeState),
      recentEvents: structuredClone(events.slice(-RECENT_EVENT_LIMIT)),
      aiCapabilities: structuredClone(session.definitionSnapshot.aiCapabilities),
    };
    const executorContext = projectExecutorContext(session, events);
    const digest = createHash("sha256").update(stableJson(executorContext)).digest("hex");
    return { context, executorContext, digest };
  }
}

export function projectExecutorContext(session: MissionRuntimeSession, events: readonly MissionRuntimeEvent[]): MissionDirectorExecutorContext {
  const definition = session.definitionSnapshot;
  const capabilities = definition.aiCapabilities;
  const active = activeStageIds(session);
  const stageView = (ids: Iterable<string>): MissionDirectorExecutorStage[] => {
    const wanted = new Set(ids);
    return definition.stages.filter((stage) => wanted.has(stage.stageId))
      .map((stage) => ({ stageId: stage.stageId, title: stage.title, description: stage.description }));
  };
  // Only objectives belonging to an active stage (all objectives when the Mission declares no stages).
  const relevantObjectiveIds = definition.stages.length
    ? new Set(definition.stages.filter((stage) => active.has(stage.stageId)).flatMap((stage) => stage.objectiveIds))
    : new Set(definition.objectives.map((objective) => objective.objectiveId));
  const branching = definition.scenarioBranching;

  return {
    runtimeSessionId: session.id,
    missionId: session.missionId,
    missionVersion: session.missionVersion,
    runtimeRevision: session.revision,
    runtimeStatus: session.status,
    aiCapabilities: { ...capabilities },
    activeStages: stageView(active),
    objectives: definition.objectives.filter((objective) => relevantObjectiveIds.has(objective.objectiveId)).map((objective) => ({
      objectiveId: objective.objectiveId,
      title: objective.title,
      type: objective.type,
      required: objective.required,
      status: session.objectiveStates.find((state) => state.objectiveId === objective.objectiveId)?.status ?? "PENDING",
    })),
    runtimeState: structuredClone(session.runtimeState),
    // Character dialogue appears only inside the owning character's view.
    recentEvents: events.filter((event) => !CHARACTER_EVENT_TYPES.has(event.eventType)).slice(-RECENT_EVENT_LIMIT).map(eventView),
    difficulty: capabilities.adaptiveDifficulty && definition.difficultyProfile ? {
      currentTier: (session.runtimeState[MISSION_DIFFICULTY_STATE_KEY] ?? definition.difficulty) as MissionDifficultyTier,
      allowedTiers: [...definition.difficultyProfile.tiers],
    } : null,
    scenarioBranching: capabilities.scenarioVariation && branching ? {
      currentBranchId: String(session.runtimeState[MISSION_BRANCH_STATE_KEY] ?? branching.defaultBranchId),
      branches: branching.branches.map((branch) => ({
        branchId: branch.branchId,
        label: branch.label,
        available: branch.availableDuringStageIds.length === 0 || branch.availableDuringStageIds.some((id) => active.has(id)),
      })),
    } : null,
    // Directory only: no authored line/fact text, no dialogue payloads, no character knowledge content.
    // The executor selects opaque declared IDs; Mission Runtime resolves them from the frozen snapshot.
    characters: capabilities.npcDialogue ? availableCharacters(definition, session).map((character): MissionDirectorExecutorCharacter => ({
      characterId: character.characterId,
      displayName: character.displayName,
      characterType: character.characterType,
      simulatedRole: character.simulatedRole,
      allowedBehaviors: [...character.allowedBehaviors],
      knowledgeScope: character.knowledgeScope,
      dialogueMode: character.dialogueMode,
      scriptedLineIds: character.scriptedLines.map((line) => line.lineId),
      scenarioFactIds: character.scenarioFacts.map((fact) => fact.factId),
      interactionCount: events.filter((event) => CHARACTER_EVENT_TYPES.has(event.eventType) && event.payload?.characterId === character.characterId).length,
    })) : [],
  };
}
