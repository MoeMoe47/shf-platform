import { MissionRuntimeError, type MissionRuntimeActor, MissionRuntimeService } from "../../mission-runtime/service/mission-runtime-service.js";
import { MISSION_DIRECTOR_POLICY_VERSION, type MissionDirectorAction, type MissionDirectorInvocation } from "../model/mission-director.js";
import { MissionDirectorRepo, type MissionDirectorDecisionRecord } from "../repo/mission-director-repo.js";
import { MissionDirectorContextBuilder } from "./mission-director-context.js";
import type { MissionDirectorExecutor } from "./mission-director-executor.js";
import { validateMissionDirectorAction } from "./mission-director-policy.js";

const REQUEST_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

function isUniqueViolation(error: unknown) {
  return !!error && typeof error === "object" && (error as { code?: unknown }).code === "23505";
}

// The Mission Director proposes bounded actions; Mission Runtime applies them.
// It never writes runtime tables itself and never re-resolves publication state.
export class MissionDirectorService {
  private readonly contextBuilder: MissionDirectorContextBuilder;

  constructor(
    private readonly runtime: MissionRuntimeService,
    private readonly executor: MissionDirectorExecutor,
    private readonly repo = new MissionDirectorRepo(),
  ) {
    this.contextBuilder = new MissionDirectorContextBuilder(runtime);
  }

  async direct(actor: MissionRuntimeActor, runtimeSessionId: string, input: { expectedRevision: unknown; idempotencyKey: unknown }): Promise<MissionDirectorInvocation> {
    const expectedRevision = Number(input?.expectedRevision);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new MissionRuntimeError("MISSION_RUNTIME_REVISION_INVALID", "expectedRevision must be a positive integer.");
    const idempotencyKey = typeof input?.idempotencyKey === "string" ? input.idempotencyKey.trim() : "";
    if (!REQUEST_KEY.test(idempotencyKey)) throw new MissionRuntimeError("MISSION_DIRECTOR_IDEMPOTENCY_KEY_INVALID", "A bounded idempotencyKey is required.");

    // Scope-checked read: another organization's runtime is NOT_FOUND and records nothing.
    const observed = await this.runtime.get(actor, runtimeSessionId);
    const actorOrganizationId = String(actor.organization_id || "").trim();
    const actorScope = { organizationId: actorOrganizationId, tenantId: `tenant:${actorOrganizationId}` };
    const previous = await this.repo.findByIdempotency({ ...actorScope, idempotencyKey });
    if (previous) return this.replay(actor, previous, observed.id, expectedRevision);

    const { context, digest } = await this.contextBuilder.build(actor, runtimeSessionId);
    let providerExecutionRef: string | null = null;
    let status: "NO_OP" | "REJECTED" | "FAILED" = "REJECTED";
    let action: MissionDirectorAction | null = null;
    let rejectionReason: string | null = null;

    if (context.organizationId !== actorScope.organizationId) {
      rejectionReason = "ORGANIZATION_MISMATCH";
    } else if (context.tenantId !== actorScope.tenantId) {
      rejectionReason = "TENANT_MISMATCH";
    } else if (context.runtimeRevision !== expectedRevision) {
      rejectionReason = "STALE_REVISION";
    } else if (!context.aiCapabilities.missionDirector) {
      rejectionReason = "CAPABILITY_DENIED";
    } else {
      let rawAction: unknown;
      try {
        const proposal = await this.executor.propose(structuredClone(context));
        rawAction = proposal?.action;
        providerExecutionRef = typeof proposal?.providerExecutionRef === "string" && proposal.providerExecutionRef.length <= 256
          ? proposal.providerExecutionRef : null;
      } catch {
        status = "FAILED";
        rejectionReason = "EXECUTOR_UNAVAILABLE";
      }
      if (status !== "FAILED") {
        const validation = validateMissionDirectorAction(context, expectedRevision, rawAction, actorScope);
        if (validation.ok === false) {
          rejectionReason = validation.reason;
        } else if (validation.action.type === "NO_OP") {
          action = validation.action;
          status = "NO_OP";
        } else {
          action = validation.action;
          try {
            // Runtime mutation and APPLIED provenance commit in one Mission Runtime transaction.
            await this.runtime.applyDirectorAction(actor, runtimeSessionId, expectedRevision, action, {
              idempotencyKey,
              capability: "missionDirector",
              proposal: action,
              executorKind: this.executor.kind,
              providerExecutionRef,
              policyVersion: MISSION_DIRECTOR_POLICY_VERSION,
              contextDigest: digest,
            });
            const applied = await this.repo.findByIdempotency({ ...actorScope, idempotencyKey });
            if (!applied) throw new Error("MISSION_DIRECTOR_DECISION_PERSISTENCE_FAILED");
            return this.invocation(actor, applied);
          } catch (error) {
            if (isUniqueViolation(error)) {
              // A concurrent invocation with the same key won; its runtime change stands and ours rolled back.
              const winner = await this.repo.findByIdempotency({ ...actorScope, idempotencyKey });
              if (winner) return this.replay(actor, winner, observed.id, expectedRevision);
            }
            if (error instanceof MissionRuntimeError) {
              status = "REJECTED";
              rejectionReason = error.code;
            } else {
              status = "FAILED";
              rejectionReason = "RUNTIME_APPLY_FAILED";
            }
          }
        }
      }
    }

    const decision = await this.repo.recordUnapplied({
      runtime: observed,
      expectedRevision,
      idempotencyKey,
      capability: "missionDirector",
      action,
      status,
      rejectionReason,
      executorKind: this.executor.kind,
      providerExecutionRef,
      policyVersion: MISSION_DIRECTOR_POLICY_VERSION,
      contextDigest: digest,
    });
    // recordUnapplied returns an existing row on key conflict; it must describe this same invocation.
    return this.replay(actor, decision, observed.id, expectedRevision);
  }

  private async replay(actor: MissionRuntimeActor, decision: MissionDirectorDecisionRecord, runtimeSessionId: string, expectedRevision: number) {
    if (decision.runtimeSessionId !== runtimeSessionId) {
      throw new MissionRuntimeError("MISSION_DIRECTOR_IDEMPOTENCY_KEY_REUSED", "idempotencyKey was already used for a different Mission Runtime.", 409);
    }
    if (decision.expectedRevision !== expectedRevision) {
      throw new MissionRuntimeError("MISSION_DIRECTOR_IDEMPOTENCY_KEY_REUSED", "idempotencyKey was already used for a different runtime revision.", 409);
    }
    return this.invocation(actor, decision);
  }

  private async invocation(actor: MissionRuntimeActor, decision: MissionDirectorDecisionRecord): Promise<MissionDirectorInvocation> {
    return {
      status: decision.status,
      action: decision.action,
      rejectionReason: decision.rejectionReason,
      contextDigest: decision.contextDigest,
      decisionId: decision.decisionId,
      runtime: await this.runtime.get(actor, decision.runtimeSessionId),
    };
  }
}
