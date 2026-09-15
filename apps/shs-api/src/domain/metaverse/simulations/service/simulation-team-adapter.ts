// MET-13 §8/§27 — team-mode simulations must reuse canonical Studio team
// membership (082_studio_team_project_authority.sql) and must never let a
// client self-declare team membership. This adapter is read-only.

import { query } from "../../../../db/client.js";

export type SimulationTeamMembership = {
  studioTeamId: string;
  role: string;
};

export class SimulationTeamAdapter {
  constructor(private dbQuery: typeof query = query) {}

  async getActiveMembership(userId: string, organizationId: string, tenantId: string, studioTeamId: string): Promise<SimulationTeamMembership | null> {
    const result = await this.dbQuery(
      `SELECT studio_team_id, role FROM studio_team_members
       WHERE studio_team_id=$1 AND user_id=$2 AND organization_id=$3 AND tenant_id=$4
         AND status='ACTIVE' AND left_at IS NULL`,
      [studioTeamId, userId, organizationId, tenantId],
    );
    const row = result.rows[0];
    return row ? { studioTeamId: row.studio_team_id, role: row.role } : null;
  }

  async listActiveTeamIds(userId: string, organizationId: string, tenantId: string): Promise<string[]> {
    const result = await this.dbQuery(
      `SELECT DISTINCT studio_team_id FROM studio_team_members
       WHERE user_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' AND left_at IS NULL`,
      [userId, organizationId, tenantId],
    );
    return result.rows.map((row: any) => row.studio_team_id);
  }
}
