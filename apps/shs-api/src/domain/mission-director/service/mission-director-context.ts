import { createHash } from "node:crypto";
import type { MissionRuntimeActor, MissionRuntimeService } from "../../mission-runtime/service/mission-runtime-service.js";
import type { MissionDirectorContext } from "../model/mission-director.js";

const RECENT_EVENT_LIMIT = 20;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export class MissionDirectorContextBuilder {
  constructor(private readonly runtime: MissionRuntimeService) {}

  async build(actor: MissionRuntimeActor, sessionId: string): Promise<{ context: MissionDirectorContext; digest: string }> {
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
    const digest = createHash("sha256").update(stableJson(context)).digest("hex");
    return { context, digest };
  }
}
