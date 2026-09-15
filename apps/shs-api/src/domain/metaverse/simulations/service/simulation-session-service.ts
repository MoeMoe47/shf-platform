// MET-13 §21-24 — simulation session runtime.
//
// Every mutating action here goes through the exact same MET-3 unlock
// projection + MET-5 protected entry pipeline every other metaverse
// resource uses (MetaverseEntryService), so a deep link to a locked or
// unknown simulation fails closed exactly like any other metaverse
// resource. organization_id/tenant_id/user_id used for every DB read and
// write are always the values the entry decision itself derived from
// req.user — never anything read from the request body.

import { SILICON_HEARTLAND_CITY_ID } from "../../registry/city-registry.js";
import { MetaverseEntryService, MetaverseEntryServiceError, statusForMetaverseError } from "../../runtime/metaverse-entry-service.js";
import { getSimulationById, METAVERSE_SIMULATION_REGISTRY } from "../registry/simulation-registry.js";
import type { SimulationDefinition } from "../model/simulation-contract.js";
import { describeSimulationEvidenceBoundary } from "./simulation-evidence-adapter.js";
import { emitSimulationOperationalEvent } from "./simulation-event-adapter.js";
import { SimulationTeamAdapter } from "./simulation-team-adapter.js";
import { SimulationSessionRepo, type SimulationSessionRow } from "../repo/simulation-session-repo.js";

export class SimulationServiceError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
  }
}

function tenantIdFor(organizationId: string) {
  return `tenant:${organizationId}`;
}

export class SimulationSessionService {
  constructor(
    private entryService = new MetaverseEntryService(),
    private sessionRepo = new SimulationSessionRepo(),
    private teamAdapter = new SimulationTeamAdapter(),
  ) {}

  private requireSimulation(simulationId: string): SimulationDefinition {
    const simulation = getSimulationById(String(simulationId || "").trim());
    if (!simulation) throw new SimulationServiceError("SIMULATION_NOT_FOUND", "Simulation was not found.", 404);
    return simulation;
  }

  private async decideEntry(user: any, simulation: SimulationDefinition, eventName: "view" | "activity_start" | "activity_exit") {
    try {
      return await this.entryService.decide({
        user,
        resource: {
          scope: "simulation",
          city_id: SILICON_HEARTLAND_CITY_ID,
          district_id: simulation.districtId,
          facility_id: simulation.facilityId,
          activity_id: simulation.simulationId,
          resource_id: simulation.simulationId,
        },
        emitEvent: true,
        eventName,
      });
    } catch (error: any) {
      const status = statusForMetaverseError(error);
      throw new SimulationServiceError(error?.code || "METAVERSE_ENTRY_DENIED", error?.message || "Metaverse entry denied.", status);
    }
  }

  async listCatalog(user: any) {
    const results = [];
    for (const simulation of METAVERSE_SIMULATION_REGISTRY) {
      const entry = await this.decideEntry(user, simulation, "view");
      results.push({ simulation, decision: entry.decision, can_enter: entry.can_enter });
    }
    return results;
  }

  async getSimulationView(user: any, simulationId: string) {
    const simulation = this.requireSimulation(simulationId);
    const entry = await this.decideEntry(user, simulation, "view");
    const session = entry.can_enter
      ? await this.sessionRepo.getActiveSession(entry.decision.organization_id, tenantIdFor(entry.decision.organization_id), entry.decision.user_id, simulation.simulationId)
      : null;
    return { simulation, decision: entry.decision, can_enter: entry.can_enter, session, evidence_boundary: describeSimulationEvidenceBoundary(simulation) };
  }

  async startSession(user: any, simulationId: string, body: any) {
    const simulation = this.requireSimulation(simulationId);
    const entry = await this.decideEntry(user, simulation, "activity_start");
    if (!entry.can_enter) throw new SimulationServiceError("SIMULATION_LOCKED", entry.decision.reason_text || "This simulation is not available yet.", 403);

    const organizationId = entry.decision.organization_id;
    const tenantId = tenantIdFor(organizationId);
    const learnerUserId = entry.decision.user_id;

    let teamSessionRef: string | null = null;
    const requestedTeamId = String(body?.team_session_ref || body?.teamSessionRef || "").trim() || null;
    if (simulation.teamMode === "TEAM" || (simulation.teamMode === "EITHER" && requestedTeamId)) {
      if (!requestedTeamId) {
        throw new SimulationServiceError("TEAM_MEMBERSHIP_REQUIRED", "This simulation requires an active team.", 403);
      }
      const membership = await this.teamAdapter.getActiveMembership(learnerUserId, organizationId, tenantId, requestedTeamId);
      if (!membership) throw new SimulationServiceError("TEAM_MEMBERSHIP_REQUIRED", "Active team membership could not be verified for this team.", 403);
      teamSessionRef = membership.studioTeamId;
    }

    const existing = await this.sessionRepo.getActiveSession(organizationId, tenantId, learnerUserId, simulation.simulationId);
    if (!existing) await this.assertNewAttemptAllowed(simulation, organizationId, tenantId, learnerUserId);
    const session = existing || await this.sessionRepo.createSession({
      organizationId,
      tenantId,
      learnerUserId,
      simulationId: simulation.simulationId,
      districtId: simulation.districtId,
      facilityId: simulation.facilityId,
      simulationType: simulation.simulationType,
      participationMode: teamSessionRef ? "TEAM" : "INDIVIDUAL",
      teamSessionRef,
    });

    emitSimulationOperationalEvent("simulation.started", {
      simulationId: simulation.simulationId,
      sessionId: session.sessionId,
      organizationId,
      userId: learnerUserId,
      districtId: simulation.districtId,
      facilityId: simulation.facilityId,
      extra: { resumed: Boolean(existing) },
    });

    return { simulation, session, decision: entry.decision, evidence_boundary: describeSimulationEvidenceBoundary(simulation) };
  }

  // A *new* attempt (no currently-active session) after at least one prior
  // attempt exists is itself a retry — enforce the same policy the
  // /retry endpoint enforces mid-attempt (MET-13 §7: retry count is never
  // treated as verified mastery; NO_RETRY/LIMITED_ATTEMPTS/instructor-
  // gated policies must hold across full attempt cycles too, not only
  // within one).
  private async assertNewAttemptAllowed(simulation: SimulationDefinition, organizationId: string, tenantId: string, learnerUserId: string) {
    const mostRecent = await this.sessionRepo.getMostRecentSession(organizationId, tenantId, learnerUserId, simulation.simulationId);
    if (!mostRecent) return; // first-ever attempt is never a retry
    const policy = simulation.retryPolicy.policy;
    if (policy === "NO_RETRY") {
      throw new SimulationServiceError("RETRY_NOT_ALLOWED", "This simulation does not allow another attempt.", 403);
    }
    if (policy === "LIMITED_ATTEMPTS") {
      const maxAttempts = simulation.retryPolicy.maxAttempts || 1;
      const total = await this.sessionRepo.countTotalSessions(organizationId, tenantId, learnerUserId, simulation.simulationId);
      if (total >= maxAttempts) throw new SimulationServiceError("RETRY_LIMIT_REACHED", "The attempt limit for this simulation has been reached.", 403);
    }
    if ((policy === "INSTRUCTOR_RELEASED_RETRY" || policy === "REVIEW_REQUIRED") && mostRecent.retryStatus !== "AVAILABLE") {
      throw new SimulationServiceError("RETRY_AWAITS_RELEASE", "A new attempt has not been released yet.", 403);
    }
  }

  private async loadOwnedSession(user: any, simulation: SimulationDefinition, sessionId: string): Promise<{ session: SimulationSessionRow; organizationId: string; tenantId: string; learnerUserId: string }> {
    const entry = await this.decideEntry(user, simulation, "activity_start");
    if (!entry.can_enter) throw new SimulationServiceError("SIMULATION_LOCKED", entry.decision.reason_text || "This simulation is not available.", 403);
    const organizationId = entry.decision.organization_id;
    const tenantId = tenantIdFor(organizationId);
    const learnerUserId = entry.decision.user_id;
    const session = await this.sessionRepo.getById(String(sessionId || "").trim(), organizationId, tenantId);
    if (!session || session.simulationId !== simulation.simulationId) throw new SimulationServiceError("SESSION_NOT_FOUND", "Simulation session was not found.", 404);
    if (session.learnerUserId !== learnerUserId) throw new SimulationServiceError("SESSION_NOT_FOUND", "Simulation session was not found.", 404);
    return { session, organizationId, tenantId, learnerUserId };
  }

  async recordStep(user: any, simulationId: string, sessionId: string, body: any) {
    const simulation = this.requireSimulation(simulationId);
    const { session, organizationId, tenantId } = await this.loadOwnedSession(user, simulation, sessionId);
    if (session.status !== "IN_PROGRESS") throw new SimulationServiceError("SESSION_NOT_ACTIVE", "This session is no longer in progress.", 409);

    const stepId = String(body?.step_id || body?.stepId || "").trim();
    const expectedStep = simulation.taskSteps[session.currentStepIndex];
    if (!expectedStep || expectedStep.stepId !== stepId) {
      throw new SimulationServiceError("STEP_OUT_OF_SEQUENCE", "This step is not the next required step for this simulation.", 400);
    }

    const completedStepIds = [...session.completedStepIds, stepId];
    const nextIndex = session.currentStepIndex + 1;
    const responses = { [stepId]: body?.response ?? null };
    const updated = await this.sessionRepo.recordStep(session.sessionId, organizationId, tenantId, session.version, { stepIndex: nextIndex, completedStepIds, responses });
    if (!updated) throw new SimulationServiceError("SESSION_CONFLICT", "This session was updated elsewhere; reload and try again.", 409);

    emitSimulationOperationalEvent("simulation.step_completed", {
      simulationId: simulation.simulationId,
      sessionId: session.sessionId,
      organizationId,
      userId: session.learnerUserId,
      districtId: simulation.districtId,
      facilityId: simulation.facilityId,
      extra: { step_id: stepId, step_index: session.currentStepIndex },
    });

    return { simulation, session: updated };
  }

  async retrySession(user: any, simulationId: string, sessionId: string) {
    const simulation = this.requireSimulation(simulationId);
    const { session, organizationId, tenantId } = await this.loadOwnedSession(user, simulation, sessionId);

    const policy = simulation.retryPolicy.policy;
    if (policy === "NO_RETRY") {
      throw new SimulationServiceError("RETRY_NOT_ALLOWED", "This simulation does not allow retries.", 403);
    }
    if ((policy === "INSTRUCTOR_RELEASED_RETRY" || policy === "REVIEW_REQUIRED") && session.retryStatus !== "AVAILABLE") {
      throw new SimulationServiceError("RETRY_AWAITS_RELEASE", "A retry for this attempt has not been released yet.", 403);
    }
    if (policy === "LIMITED_ATTEMPTS") {
      const maxAttempts = simulation.retryPolicy.maxAttempts || 1;
      if (session.retryCount + 1 >= maxAttempts) {
        throw new SimulationServiceError("RETRY_LIMIT_REACHED", "The retry limit for this simulation has been reached.", 403);
      }
    }

    const updated = await this.sessionRepo.retry(session.sessionId, organizationId, tenantId, session.version);
    if (!updated) throw new SimulationServiceError("SESSION_CONFLICT", "This session was updated elsewhere; reload and try again.", 409);

    emitSimulationOperationalEvent("simulation.retried", {
      simulationId: simulation.simulationId,
      sessionId: session.sessionId,
      organizationId,
      userId: session.learnerUserId,
      districtId: simulation.districtId,
      facilityId: simulation.facilityId,
      extra: { retry_count: updated.retryCount },
    });

    return { simulation, session: updated };
  }

  async submitArtifact(user: any, simulationId: string, sessionId: string, body: any) {
    const simulation = this.requireSimulation(simulationId);
    const { session, organizationId, tenantId, learnerUserId } = await this.loadOwnedSession(user, simulation, sessionId);
    if (session.status !== "IN_PROGRESS") throw new SimulationServiceError("SESSION_NOT_ACTIVE", "This session is no longer in progress.", 409);

    const artifactType = String(body?.artifact_type || body?.artifactType || "TEXT_REFLECTION").trim();
    const content = body?.content && typeof body.content === "object" ? body.content : { text: String(body?.content ?? "") };
    if (JSON.stringify(content).length > 20_000) throw new SimulationServiceError("ARTIFACT_TOO_LARGE", "Artifact content exceeds the allowed size.", 400);

    const artifact = await this.sessionRepo.addArtifact({
      sessionId: session.sessionId,
      organizationId,
      tenantId,
      artifactType,
      stepId: body?.step_id || body?.stepId || null,
      content,
      createdByUserId: learnerUserId,
    });

    emitSimulationOperationalEvent("simulation.artifact_submitted", {
      simulationId: simulation.simulationId,
      sessionId: session.sessionId,
      organizationId,
      userId: learnerUserId,
      districtId: simulation.districtId,
      facilityId: simulation.facilityId,
      extra: { artifact_id: artifact.artifactId, artifact_type: artifactType },
    });

    return { artifact };
  }

  async completeSession(user: any, simulationId: string, sessionId: string) {
    const simulation = this.requireSimulation(simulationId);
    const { session, organizationId, tenantId, learnerUserId } = await this.loadOwnedSession(user, simulation, sessionId);
    if (session.status !== "IN_PROGRESS") throw new SimulationServiceError("SESSION_NOT_ACTIVE", "This session is no longer in progress.", 409);

    const requiredStepIds = simulation.taskSteps.filter((step) => !step.isOptional).map((step) => step.stepId);
    const missingSteps = requiredStepIds.filter((stepId) => !session.completedStepIds.includes(stepId));
    if (simulation.completionRules.requiresAllRequiredSteps && missingSteps.length) {
      emitSimulationOperationalEvent("simulation.failed", {
        simulationId: simulation.simulationId,
        sessionId: session.sessionId,
        organizationId,
        userId: learnerUserId,
        districtId: simulation.districtId,
        facilityId: simulation.facilityId,
        extra: { reason: "missing_required_steps", missing_steps: missingSteps },
      });
      throw new SimulationServiceError("STEPS_INCOMPLETE", "Not every required step has been completed yet.", 409);
    }

    if (simulation.completionRules.requiresArtifactSubmission) {
      const artifacts = await this.sessionRepo.listArtifacts(session.sessionId, organizationId, tenantId);
      if (!artifacts.length) throw new SimulationServiceError("ARTIFACT_REQUIRED", "This simulation requires at least one submitted artifact before completion.", 409);
    }

    const evidenceBoundary = describeSimulationEvidenceBoundary(simulation);
    const completionResult = {
      evidence_boundary: evidenceBoundary,
      completed_step_ids: session.completedStepIds,
      verified_skill: false,
      credential: false,
      course_completion: false,
      career_eligibility: false,
      job_readiness: false,
      civic_authority: false,
    };

    const updated = await this.sessionRepo.complete(session.sessionId, organizationId, tenantId, session.version, completionResult);
    if (!updated) throw new SimulationServiceError("SESSION_CONFLICT", "This session was updated elsewhere; reload and try again.", 409);

    emitSimulationOperationalEvent("simulation.completed", {
      simulationId: simulation.simulationId,
      sessionId: session.sessionId,
      organizationId,
      userId: learnerUserId,
      districtId: simulation.districtId,
      facilityId: simulation.facilityId,
      extra: { assessment_boundary: simulation.assessmentBoundary },
    });

    return { simulation, session: updated, evidence_boundary: evidenceBoundary };
  }
}

export function statusForSimulationError(error: any) {
  if (error instanceof SimulationServiceError || error instanceof MetaverseEntryServiceError) return error.statusCode;
  return statusForMetaverseError(error);
}
