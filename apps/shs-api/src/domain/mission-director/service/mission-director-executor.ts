import type { MissionDirectorAction, MissionDirectorContext, MissionDirectorProposal } from "../model/mission-director.js";

export interface MissionDirectorExecutor {
  readonly kind: "DETERMINISTIC" | "FIXTURE";
  propose(context: MissionDirectorContext): Promise<MissionDirectorProposal>;
}

export class DeterministicMissionDirectorExecutor implements MissionDirectorExecutor {
  readonly kind = "DETERMINISTIC" as const;

  async propose(_context: MissionDirectorContext): Promise<MissionDirectorProposal> {
    return { action: { type: "NO_OP" } satisfies MissionDirectorAction };
  }
}

export class FixtureMissionDirectorExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;

  constructor(private readonly result: MissionDirectorProposal | Error) {}

  async propose(_context: MissionDirectorContext): Promise<MissionDirectorProposal> {
    if (this.result instanceof Error) throw this.result;
    return structuredClone(this.result);
  }
}
