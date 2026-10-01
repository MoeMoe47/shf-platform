import type { MissionCondition } from "../../mission-content/model/mission-definition.js";
import type { MissionObjectiveState, MissionRuntimeEvent, MissionStageState } from "../model/mission-runtime.js";

export interface MissionConditionContext {
  objectiveStates: readonly MissionObjectiveState[];
  stageStates: readonly MissionStageState[];
  runtimeState: Readonly<Record<string, unknown>>;
  events: readonly Pick<MissionRuntimeEvent, "eventType">[];
  startedAt: string;
  now: string;
}

export function evaluateMissionCondition(condition: MissionCondition, context: MissionConditionContext): boolean {
  switch (condition.type) {
    case "OBJECTIVE_COMPLETE":
      return context.objectiveStates.some((item) => item.objectiveId === condition.objectiveId && item.status === "COMPLETED");
    case "OBJECTIVE_COUNT":
      return context.objectiveStates.filter((item) => item.status === "COMPLETED").length >= condition.count;
    case "STAGE_COMPLETE":
      return context.stageStates.some((item) => item.stageId === condition.stageId && item.status === "COMPLETED");
    case "TIME_ELAPSED": {
      const startedAt = Date.parse(context.startedAt);
      const now = Date.parse(context.now);
      return Number.isFinite(startedAt) && Number.isFinite(now) && now - startedAt >= condition.seconds * 1000;
    }
    case "STATE_EQUALS":
      return Object.hasOwn(context.runtimeState, condition.stateKey) && context.runtimeState[condition.stateKey] === condition.value;
    case "STATE_THRESHOLD": {
      const stateValue = context.runtimeState[condition.stateKey];
      if (typeof stateValue !== "number" || typeof condition.value !== "number") return false;
      if (condition.operator === "GTE") return stateValue >= condition.value;
      if (condition.operator === "LTE") return stateValue <= condition.value;
      return stateValue === condition.value;
    }
    case "EVENT_OCCURRED":
      return context.events.some((event) => event.eventType === condition.eventType);
  }
}
