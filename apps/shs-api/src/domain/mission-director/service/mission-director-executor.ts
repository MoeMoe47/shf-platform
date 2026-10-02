import type { MissionDirectorAction, MissionDirectorExecutorContext, MissionDirectorProposal } from "../model/mission-director.js";

// Executors only ever see the minimized projection; the internal policy context stays server-side.
export interface MissionDirectorExecutor {
  readonly kind: "DETERMINISTIC" | "FIXTURE";
  propose(context: MissionDirectorExecutorContext): Promise<MissionDirectorProposal>;
}

export class DeterministicMissionDirectorExecutor implements MissionDirectorExecutor {
  readonly kind = "DETERMINISTIC" as const;

  async propose(_context: MissionDirectorExecutorContext): Promise<MissionDirectorProposal> {
    return { action: { type: "NO_OP" } satisfies MissionDirectorAction };
  }
}

export class FixtureMissionDirectorExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;

  constructor(private readonly result: MissionDirectorProposal | Error) {}

  async propose(_context: MissionDirectorExecutorContext): Promise<MissionDirectorProposal> {
    if (this.result instanceof Error) throw this.result;
    return structuredClone(this.result);
  }
}
