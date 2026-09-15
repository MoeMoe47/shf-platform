// MET-13 §23/§40 — bounded runtime/session persistence only. See
// migrations/147_metaverse_simulation_activities.sql for the schema and
// boundary notes.

import { randomUUID } from "node:crypto";
import { query } from "../../../../db/client.js";

export type SimulationSessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type SimulationRetryStatus = "NONE" | "AVAILABLE" | "BLOCKED" | "AWAITING_INSTRUCTOR";

export type SimulationSessionRow = {
  sessionId: string;
  organizationId: string;
  tenantId: string;
  learnerUserId: string;
  simulationId: string;
  districtId: string;
  facilityId: string;
  simulationType: string;
  participationMode: "INDIVIDUAL" | "TEAM";
  teamSessionRef: string | null;
  status: SimulationSessionStatus;
  currentStepIndex: number;
  completedStepIds: string[];
  responses: Record<string, unknown>;
  retryCount: number;
  retryStatus: SimulationRetryStatus;
  completionResult: Record<string, unknown> | null;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  version: number;
};

type Executor = { query: typeof query };

function toRow(row: any): SimulationSessionRow {
  return {
    sessionId: row.session_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    learnerUserId: row.learner_user_id,
    simulationId: row.simulation_id,
    districtId: row.district_id,
    facilityId: row.facility_id,
    simulationType: row.simulation_type,
    participationMode: row.participation_mode,
    teamSessionRef: row.team_session_ref,
    status: row.status,
    currentStepIndex: row.current_step_index,
    completedStepIds: row.completed_step_ids || [],
    responses: row.responses_json || {},
    retryCount: row.retry_count,
    retryStatus: row.retry_status,
    completionResult: row.completion_result,
    startedAt: row.started_at,
    lastActivityAt: row.last_activity_at,
    completedAt: row.completed_at,
    version: row.version,
  };
}

export class SimulationSessionRepo {
  constructor(private dbQuery: typeof query = query) {}

  async getActiveSession(organizationId: string, tenantId: string, learnerUserId: string, simulationId: string): Promise<SimulationSessionRow | null> {
    const result = await this.dbQuery(
      `SELECT * FROM metaverse_simulation_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND simulation_id=$4 AND status='IN_PROGRESS'`,
      [organizationId, tenantId, learnerUserId, simulationId],
    );
    return result.rows[0] ? toRow(result.rows[0]) : null;
  }

  async getById(sessionId: string, organizationId: string, tenantId: string): Promise<SimulationSessionRow | null> {
    const result = await this.dbQuery(
      `SELECT * FROM metaverse_simulation_sessions WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3`,
      [sessionId, organizationId, tenantId],
    );
    return result.rows[0] ? toRow(result.rows[0]) : null;
  }

  async listCompletedForLearner(organizationId: string, tenantId: string, learnerUserId: string): Promise<SimulationSessionRow[]> {
    const result = await this.dbQuery(
      `SELECT * FROM metaverse_simulation_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND status='COMPLETED'
       ORDER BY completed_at DESC`,
      [organizationId, tenantId, learnerUserId],
    );
    return result.rows.map(toRow);
  }

  async countPriorAttempts(organizationId: string, tenantId: string, learnerUserId: string, simulationId: string): Promise<number> {
    const result = await this.dbQuery(
      `SELECT COALESCE(MAX(retry_count), 0) AS max_retry FROM metaverse_simulation_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND simulation_id=$4`,
      [organizationId, tenantId, learnerUserId, simulationId],
    );
    return Number(result.rows[0]?.max_retry || 0);
  }

  // Counts every attempt ever started (IN_PROGRESS/COMPLETED/ABANDONED),
  // used to enforce LIMITED_ATTEMPTS/NO_RETRY at the point a *new*
  // session would be created after a prior one finished — retryCount
  // alone only tracks in-attempt resets via the /retry endpoint (see
  // simulation-session-service.ts startSession).
  async countTotalSessions(organizationId: string, tenantId: string, learnerUserId: string, simulationId: string): Promise<number> {
    const result = await this.dbQuery(
      `SELECT COUNT(*) AS total FROM metaverse_simulation_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND simulation_id=$4`,
      [organizationId, tenantId, learnerUserId, simulationId],
    );
    return Number(result.rows[0]?.total || 0);
  }

  async getMostRecentSession(organizationId: string, tenantId: string, learnerUserId: string, simulationId: string): Promise<SimulationSessionRow | null> {
    const result = await this.dbQuery(
      `SELECT * FROM metaverse_simulation_sessions
       WHERE organization_id=$1 AND tenant_id=$2 AND learner_user_id=$3 AND simulation_id=$4
       ORDER BY started_at DESC LIMIT 1`,
      [organizationId, tenantId, learnerUserId, simulationId],
    );
    return result.rows[0] ? toRow(result.rows[0]) : null;
  }

  async createSession(input: {
    organizationId: string;
    tenantId: string;
    learnerUserId: string;
    simulationId: string;
    districtId: string;
    facilityId: string;
    simulationType: string;
    participationMode: "INDIVIDUAL" | "TEAM";
    teamSessionRef: string | null;
  }): Promise<SimulationSessionRow> {
    const sessionId = `met_sim_session_${randomUUID()}`;
    const result = await this.dbQuery(
      `INSERT INTO metaverse_simulation_sessions
        (session_id, organization_id, tenant_id, learner_user_id, simulation_id, district_id, facility_id, simulation_type, participation_mode, team_session_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [sessionId, input.organizationId, input.tenantId, input.learnerUserId, input.simulationId, input.districtId, input.facilityId, input.simulationType, input.participationMode, input.teamSessionRef],
    );
    return toRow(result.rows[0]);
  }

  async recordStep(sessionId: string, organizationId: string, tenantId: string, expectedVersion: number, input: { stepIndex: number; completedStepIds: string[]; responses: Record<string, unknown> }): Promise<SimulationSessionRow | null> {
    const result = await this.dbQuery(
      `UPDATE metaverse_simulation_sessions
       SET current_step_index=$5, completed_step_ids=$6::jsonb, responses_json = responses_json || $7::jsonb,
           last_activity_at=NOW(), updated_at=NOW(), version=version+1
       WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND version=$4 AND status='IN_PROGRESS'
       RETURNING *`,
      [sessionId, organizationId, tenantId, expectedVersion, input.stepIndex, JSON.stringify(input.completedStepIds), JSON.stringify(input.responses)],
    );
    return result.rows[0] ? toRow(result.rows[0]) : null;
  }

  async retry(sessionId: string, organizationId: string, tenantId: string, expectedVersion: number): Promise<SimulationSessionRow | null> {
    const result = await this.dbQuery(
      `UPDATE metaverse_simulation_sessions
       SET current_step_index=0, completed_step_ids='[]'::jsonb, responses_json='{}'::jsonb,
           retry_count=retry_count+1, last_activity_at=NOW(), updated_at=NOW(), version=version+1
       WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND version=$4 AND status='IN_PROGRESS'
       RETURNING *`,
      [sessionId, organizationId, tenantId, expectedVersion],
    );
    return result.rows[0] ? toRow(result.rows[0]) : null;
  }

  async complete(sessionId: string, organizationId: string, tenantId: string, expectedVersion: number, completionResult: Record<string, unknown>): Promise<SimulationSessionRow | null> {
    const result = await this.dbQuery(
      `UPDATE metaverse_simulation_sessions
       SET status='COMPLETED', completion_result=$5::jsonb, completed_at=NOW(), last_activity_at=NOW(), updated_at=NOW(), version=version+1
       WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND version=$4 AND status='IN_PROGRESS'
       RETURNING *`,
      [sessionId, organizationId, tenantId, expectedVersion, JSON.stringify(completionResult)],
    );
    return result.rows[0] ? toRow(result.rows[0]) : null;
  }

  async addArtifact(input: { sessionId: string; organizationId: string; tenantId: string; artifactType: string; stepId: string | null; content: Record<string, unknown>; createdByUserId: string }): Promise<{ artifactId: string; createdAt: string }> {
    const artifactId = `met_sim_artifact_${randomUUID()}`;
    const result = await this.dbQuery(
      `INSERT INTO metaverse_simulation_artifacts (artifact_id, session_id, organization_id, tenant_id, artifact_type, step_id, content_json, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING artifact_id, created_at`,
      [artifactId, input.sessionId, input.organizationId, input.tenantId, input.artifactType, input.stepId, JSON.stringify(input.content), input.createdByUserId],
    );
    return { artifactId: result.rows[0].artifact_id, createdAt: result.rows[0].created_at };
  }

  async listArtifacts(sessionId: string, organizationId: string, tenantId: string): Promise<Array<{ artifactId: string; artifactType: string; stepId: string | null; content: Record<string, unknown>; createdAt: string }>> {
    const result = await this.dbQuery(
      `SELECT artifact_id, artifact_type, step_id, content_json, created_at FROM metaverse_simulation_artifacts
       WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at`,
      [sessionId, organizationId, tenantId],
    );
    return result.rows.map((row: any) => ({ artifactId: row.artifact_id, artifactType: row.artifact_type, stepId: row.step_id, content: row.content_json, createdAt: row.created_at }));
  }
}
