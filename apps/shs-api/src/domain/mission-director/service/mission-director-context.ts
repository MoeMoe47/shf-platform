import { createHash } from "node:crypto";
import type { MissionRuntimeActor, MissionRuntimeService } from "../../mission-runtime/service/mission-runtime-service.js";
import type { MissionRuntimeEvent, MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";
import { MISSION_BRANCH_STATE_KEY, MISSION_DIFFICULTY_STATE_KEY, MISSION_SYSTEM_EVENTS, type MissionDifficultyTier } from "../../mission-content/model/mission-scenario.js";
import type {
  MissionDirectorContext,
  MissionDirectorExecutorCharacter,
  MissionDirectorExecutorContext,
  MissionDirectorExecutorStage,
  MissionDirectorExecutorWorldContext,
} from "../model/mission-director.js";
import type { MissionWorldContext } from "../../mission-runtime/world/mission-world-context.js";
import { missionTeamDirectorSummary, type MissionTeamDirectorSummary } from "../../mission-team/service/mission-team-service.js";
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
  const payload = structuredClone(event.payload ?? {});
  // Team actions keep only their mission role; participant IDs and action keys never reach the executor.
  if (payload.participant && typeof payload.participant === "object") payload.participant = { missionRole: (payload.participant as any).missionRole };
  return { sequence: event.sequence, eventType: event.eventType, payload };
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
    const executorContext = projectExecutorContext(session, events, this.runtime.liveWorldContextFor(session), await missionTeamDirectorSummary(session));
    const digest = createHash("sha256").update(stableJson(executorContext)).digest("hex");
    return { context, executorContext, digest };
  }
}

// Frozen projections are runtime/server-side records; the executor never sees them.
const EXECUTOR_HIDDEN_EVENT_TYPES: ReadonlySet<string> = new Set([MISSION_SYSTEM_EVENTS.worldContextCaptured, MISSION_SYSTEM_EVENTS.accommodationProjected]);

export function projectExecutorWorldContext(live: MissionWorldContext | null): MissionDirectorExecutorWorldContext | null {
  if (!live) return null;
  const conditions = Object.entries(live.conditions).flatMap(([category, value]) => (Array.isArray(value) ? value : value ? [{ key: "weather", ...value }] : [])
    .map((item: any) => ({ category, key: String(item.key), state: String(item.state), freshness: String(item.freshness) })));
  return {
    contextKind: "LIVE",
    simulated: live.simulated,
    conditions,
    unavailableCapabilities: live.capabilities.filter((item) => item.status === "UNAVAILABLE" || item.status === "SIMULATION_NOT_PERMITTED").map((item) => item.capability),
    degradedCapabilities: live.capabilities.filter((item) => item.status === "DEGRADED").map((item) => item.capability),
  };
}

export function projectExecutorContext(session: MissionRuntimeSession, events: readonly MissionRuntimeEvent[], live: MissionWorldContext | null = null, team: MissionTeamDirectorSummary | null = null): MissionDirectorExecutorContext {
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
    recentEvents: events.filter((event) => !CHARACTER_EVENT_TYPES.has(event.eventType) && !EXECUTOR_HIDDEN_EVENT_TYPES.has(event.eventType)).slice(-RECENT_EVENT_LIMIT).map(eventView),
    worldContext: projectExecutorWorldContext(live),
    team: team ? { ...team, rolesPresent: [...team.rolesPresent] } : null,
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
