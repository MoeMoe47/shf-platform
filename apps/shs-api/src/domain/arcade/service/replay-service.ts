import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ArcadeReplayRepo } from "../repo/replay-repo.js";

const repo = new ArcadeReplayRepo();

export class ArcadeReplayError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "ArcadeReplayError";
  }
}

export interface ArcadeReplayActor {
  user_id: string;
  organization_id: string;
  permissions: string[];
}

export async function getResultReplay(actor: ArcadeReplayActor, resultId: string) {
  const organizationId = String(actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId) throw new ArcadeReplayError("SCOPE_MISSING", "Actor organization/user is required.", 403);

  const reviewer = hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_RESULTS_VIEW);
  const learner = hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT);
  if (!reviewer && !learner) throw new ArcadeReplayError("FORBIDDEN", "Arcade replay access is not authorized.", 403);

  const id = String(resultId || "").trim();
  if (!id || id.length > 160) throw new ArcadeReplayError("RESULT_NOT_FOUND", "Arcade Result not found.", 404);

  const source = await repo.getResultReplaySource({
    resultId: id,
    organizationId,
    tenantId: `tenant:${organizationId}`,
    learnerUserId: reviewer ? undefined : userId,
  });
  if (!source) throw new ArcadeReplayError("RESULT_NOT_FOUND", "Arcade Result not found.", 404);

  const timeline: Array<{
    kind: string;
    occurredAt: string;
    sourceType: string;
    sourceId: string;
    label: string;
    details: Record<string, unknown>;
    order: number;
  }> = [
    {
      kind: "ATTEMPT_STARTED",
      occurredAt: source.attempt.startedAt,
      sourceType: "ARCADE_ATTEMPT",
      sourceId: source.attempt.id,
      label: "Attempt started",
      details: {},
      order: 0,
    },
  ];
  if (source.attempt.completedAt !== null) {
    timeline.push({
      kind: "ATTEMPT_COMPLETED",
      occurredAt: source.attempt.completedAt,
      sourceType: "ARCADE_ATTEMPT",
      sourceId: source.attempt.id,
      label: "Attempt completed",
      details: { status: source.attempt.status },
      order: 1,
    });
  }
  timeline.push({
    kind: "RESULT_RECORDED",
    occurredAt: source.result.createdAt,
    sourceType: "ARCADE_RESULT",
    sourceId: source.result.id,
    label: "Canonical Result recorded",
    details: { passed: source.result.passed },
    order: 2,
  });
  if (source.result.score !== null) {
    timeline.push({
      kind: "SCORE_RECORDED",
      occurredAt: source.result.createdAt,
      sourceType: "ARCADE_RESULT",
      sourceId: source.result.id,
      label: "Score recorded",
      details: { score: source.result.score, maxScore: source.result.maxScore },
      order: 3,
    });
  }
  timeline.push({
    kind: "MASTERY_RECORDED",
    occurredAt: source.result.createdAt,
    sourceType: "ARCADE_RESULT",
    sourceId: source.result.id,
    label: `Canonical Result recorded masteryAchieved=${source.result.masteryAchieved}`,
    details: { masteryAchieved: source.result.masteryAchieved },
    order: 4,
  });
  timeline.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)
    || a.order - b.order
    || a.sourceId.localeCompare(b.sourceId));

  const events = timeline.map((event) => ({
    kind: event.kind,
    occurredAt: event.occurredAt,
    sourceType: event.sourceType,
    sourceId: event.sourceId,
    label: event.label,
    details: event.details,
  }));
  return {
    result: source.result,
    attempt: source.attempt,
    activity: source.activity,
    runtimeSession: null,
    timeline: events,
    provenance: {
      replayType: "explanatory_projection",
      authoritativeSources: ["ARCADE_ATTEMPT", "ARCADE_RESULT", "ARCADE_ACTIVITY"],
      runtimeSessionNote: "Runtime Session linkage is not canonically available for this Result.",
    },
  };
}
