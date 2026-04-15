import { query } from "../../../db/client";

export class CaseRepo {
  async listCases() {
    const res = await query(
      `SELECT case_id, organization_id, program_id, case_type, status, priority,
              assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at
       FROM cases
       ORDER BY updated_at DESC`
    );
    return res.rows;
  }

  async listReferralCases() {
    const res = await query(
      `SELECT case_id, organization_id, program_id, case_type, status, priority,
              assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at
       FROM cases
       WHERE case_type = 'referral'
       ORDER BY updated_at DESC`
    );
    return res.rows;
  }

  async getCaseById(caseId: string) {
    const res = await query(
      `SELECT case_id, organization_id, program_id, case_type, status, priority,
              assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at
       FROM cases
       WHERE case_id = $1
       LIMIT 1`,
      [caseId]
    );
    return res.rows[0] || null;
  }

  async createCase(input: any) {
    const res = await query(
      `INSERT INTO cases (
        case_id, organization_id, program_id, case_type, status, priority, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING case_id, organization_id, program_id, case_type, status, priority,
                assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at`,
      [
        input.case_id,
        input.organization_id,
        input.program_id || null,
        input.case_type,
        input.status,
        input.priority,
        input.created_by_user_id || null,
      ]
    );
    return res.rows[0];
  }

  async assignCase(caseId: string, payload: any) {
    const res = await query(
      `UPDATE cases
       SET assigned_user_id = $2,
           assigned_team_id = $3,
           status = 'assigned',
           updated_at = NOW()
       WHERE case_id = $1
       RETURNING case_id, organization_id, program_id, case_type, status, priority,
                 assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at`,
      [caseId, payload.assigned_user_id || null, payload.assigned_team_id || null]
    );
    return res.rows[0] || null;
  }

  async updateCaseStatus(caseId: string, status: string) {
    const res = await query(
      `UPDATE cases
       SET status = $2, updated_at = NOW()
       WHERE case_id = $1
       RETURNING case_id, organization_id, program_id, case_type, status, priority,
                 assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at`,
      [caseId, status]
    );
    return res.rows[0] || null;
  }
}
