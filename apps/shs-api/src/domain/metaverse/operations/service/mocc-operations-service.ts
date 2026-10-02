// Phase 9 — Core MOCC operations service (authorized, audited, organization-scoped).
//
// The MOCC coordinates authorities; it does not replace them. This service hosts one in-memory Regional Simulation
// session per organization (simulated regional state only — sessions are ephemeral and replay is reconstructed from
// the session's own event log), executes only allow-listed simulation controls, records every operator action in
// the existing audit_events table, and reads program and Mission/Arcade observability from their authorities.
// Workforce program activation remains a workforce/program authority and is not owned by MOCC.
import { randomUUID } from "node:crypto";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import { query } from "../../../../db/client.js";
import { writeAuditEvent } from "../../../audit/service/audit-helper.js";
import { ArcadeIntegrationService } from "../../../arcade-integration/service/arcade-integration-service.js";
import { WorkforceFoundationService } from "../../../workforce-foundation/service/workforce-foundation-service.js";
import { moccCore, regionalSimulation } from "../mocc-bridge.js";

export class MoccOperationsError extends Error {
  constructor(readonly code: string, message: string, readonly statusCode: number) { super(message); }
}

export interface MoccActor { user_id?: string; organization_id?: string; active_organization_id?: string; permissions?: string[] }

export interface MoccOperationsDependencies {
  audit?: (record: any) => Promise<unknown>;
  programImpact?: (actor: any) => Promise<any[]>;
  missionObservability?: (actor: any) => Promise<any>;
}

interface Session { simulation: any; auditLog: any; presentation: any; persistAudit: (entry: any) => Promise<unknown>; queue: Promise<unknown> }

export class MoccOperationsService {
  private readonly sessions = new Map<string, Session>();
  private readonly deps: Required<MoccOperationsDependencies>;

  constructor(dependencies: MoccOperationsDependencies = {}) {
    const workforce = new WorkforceFoundationService();
    const fabric = new ArcadeIntegrationService();
    this.deps = {
      audit: dependencies.audit ?? ((record) => writeAuditEvent(record)),
      // Phase 8 MOCC program packets: aggregates, no learner identity.
      programImpact: dependencies.programImpact ?? (async (actor) => (await workforce.moccProgramPackets({ user_id: actor.user_id, organization_id: actor.organization_id })).programs),
      // Read-only aggregates from Mission Runtime and the Arcade Fabric; no learner details.
      missionObservability: dependencies.missionObservability ?? (async (actor) => {
        const counts = (await query(
          `SELECT status, COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 GROUP BY status`, [actor.organization_id])).rows;
        const arcade = await fabric.operationalProjection({ user_id: actor.user_id, organization_id: actor.organization_id, permissions: actor.permissions } as any);
        return { readOnly: true, missionRuntimesByStatus: Object.fromEntries(counts.map((row: any) => [row.status, row.count])), teams: arcade.teams, containsLearnerIdentity: false };
      }),
    };
  }

  private scope(actor: MoccActor, permission: string) {
    const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
    if (!organizationId || !actor?.user_id) throw new MoccOperationsError("ANONYMOUS_OPERATOR", "An authenticated operator is required.", 401);
    if (!hasPermission(actor.permissions || [], permission)) throw new MoccOperationsError("NOT_AUTHORIZED", `Missing ${permission}.`, 403);
    return { organizationId, userId: String(actor.user_id) };
  }

  private session(organizationId: string): Session {
    let existing = this.sessions.get(organizationId);
    if (!existing) {
      const created = regionalSimulation.createRegionalSimulation({ simulationId: `regional:${organizationId}`, mode: "SIMULATED" });
      if (!created.ok) throw new MoccOperationsError("SIMULATION_UNAVAILABLE", created.reason, 503);
      // Durable audit writer (audit_events). The executor persists an AUTHORIZED intent before any simulation
      // mutation, then the RESULT; both rows share the action's correlation id.
      const persistAudit = (entry: any) => this.deps.audit({
        audit_event_id: `mocc_${randomUUID()}`, organization_id: organizationId, actor_user_id: entry.operatorId,
        target_object_type: "mocc_operator_action", target_object_id: entry.controlId, action_type: `MOCC_${entry.decision}`,
        new_state_json: { phase: entry.phase, controlId: entry.controlId, targetSystem: entry.targetSystem, owningAuthority: entry.owningAuthority, simulationId: entry.simulationId,
          simulationMode: entry.simulationMode, simulationTime: entry.simulationTime, decision: entry.decision, result: { ok: entry.result?.ok ?? false, reason: entry.result?.reason ?? null } },
        reason_text: entry.reason, correlation_id: entry.correlationId, source_channel: "mocc",
      });
      existing = { simulation: created.simulation, auditLog: moccCore.createMoccAuditLog(), presentation: moccCore.createMoccPresentationState(), persistAudit, queue: Promise.resolve() };
      this.sessions.set(organizationId, existing);
    }
    return existing;
  }

  async getView(actor: MoccActor, timelineFilters: Record<string, string> = {}) {
    const { organizationId, userId } = this.scope(actor, SHS_SECURITY_PERMISSIONS.METAVERSE_OPERATIONS_VIEW);
    const current = this.session(organizationId);
    const [programImpact, missionObservability] = await Promise.all([
      this.deps.programImpact({ ...actor, user_id: userId, organization_id: organizationId }).catch(() => null),
      this.deps.missionObservability({ ...actor, user_id: userId, organization_id: organizationId }).catch(() => null),
    ]);
    return moccCore.buildMoccViewModel({
      simulation: current.simulation, auditLog: current.auditLog, presentation: current.presentation,
      operator: { operatorId: userId, permissions: actor.permissions || [] },
      programImpact, missionObservability: missionObservability ?? { readOnly: true, status: "UNAVAILABLE" }, timelineFilters,
    });
  }

  async act(actor: MoccActor, controlId: string, params: Record<string, unknown> = {}) {
    const { organizationId, userId } = this.scope(actor, SHS_SECURITY_PERMISSIONS.METAVERSE_OPERATIONS_VIEW);
    const current = this.session(organizationId);
    // The shared executor enforces the allow-list and each control's own permission, and audits every attempt.
    // Actions on one organization's session run one at a time, so an intent record and its mutation are never
    // interleaved with another action's.
    const run = current.queue.then(() => moccCore.executeMoccOperatorActionDurable({
      simulation: current.simulation, operator: { operatorId: userId, permissions: actor.permissions || [] }, controlId, params,
      auditLog: current.auditLog, persistAudit: current.persistAudit, presentation: current.presentation, correlationId: `mocc:${organizationId}:${randomUUID()}`,
    }));
    current.queue = run.catch(() => undefined);
    const outcome = await run;
    // No durable audit record, no MOCC-owned simulation mutation: the simulation was not changed.
    if (outcome.decision === "AUDIT_FAILED") throw new MoccOperationsError("AUDIT_PERSISTENCE_FAILED", "The operator action was not applied because its audit record could not be persisted.", 503);
    return { decision: outcome.decision, result: outcome.result, auditId: outcome.audit.auditId, resultAuditPersisted: outcome.resultAuditPersisted };
  }

  // Test/maintenance helper: drops an organization's ephemeral simulation session.
  dispose(organizationId: string) {
    this.sessions.delete(organizationId);
  }
}
