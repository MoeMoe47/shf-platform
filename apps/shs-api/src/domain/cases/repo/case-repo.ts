import { query } from "../../../db/client";

export class CaseRepo {
  async listCases(scope: any) {
    const res = await query(
      `SELECT case_id, organization_id, program_id, case_type, status, priority,
              assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at
       FROM cases
       WHERE organization_id = $1
       ORDER BY updated_at DESC`,
      [scope.organization_id]
    );
    return res.rows;
  }

  async listReferralCases(scope: any) {
    const res = await query(
      `SELECT c.case_id, c.organization_id, c.program_id, c.case_type, c.status, c.priority,
              c.assigned_team_id, c.assigned_user_id, c.created_by_user_id, c.created_at, c.updated_at,
              rd.receiving_organization_id, rd.need_category, rd.urgency_level, rd.notes
       FROM cases c
       LEFT JOIN referral_details rd ON rd.case_id = c.case_id
       WHERE c.case_type = 'referral' AND c.organization_id = $1
       ORDER BY c.updated_at DESC`,
      [scope.organization_id]
    );
    return res.rows;
  }

  async getCaseById(caseId: string, scope: any) {
    const res = await query(
      `SELECT case_id, organization_id, program_id, case_type, status, priority,
              assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at
       FROM cases
       WHERE case_id = $1 AND organization_id = $2
       LIMIT 1`,
      [caseId, scope.organization_id]
    );
    return res.rows[0] || null;
  }

  async createCase(input: any, executor: any = { query }) {
    const res = await executor.query(
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

  async upsertReferralDetails(caseId: string, payload: any, executor: any = { query }) {
    const res = await executor.query(
      `INSERT INTO referral_details (
        case_id, receiving_organization_id, need_category, urgency_level, notes
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (case_id)
      DO UPDATE SET
        receiving_organization_id = EXCLUDED.receiving_organization_id,
        need_category = EXCLUDED.need_category,
        urgency_level = EXCLUDED.urgency_level,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING case_id, receiving_organization_id, need_category, urgency_level, notes, created_at, updated_at`,
      [
        caseId,
        payload.receiving_organization_id || null,
        payload.need_category || null,
        payload.urgency_level || null,
        payload.notes || null,
      ]
    );
    return res.rows[0];
  }


  async assignCase(caseId: string, payload: any, scope: any) {
    const res = await query(
      `UPDATE cases
       SET assigned_user_id = $2,
           assigned_team_id = $3,
           status = 'assigned',
           updated_at = NOW()
       WHERE case_id = $1 AND organization_id = $4
       RETURNING case_id, organization_id, program_id, case_type, status, priority,
                 assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at`,
      [caseId, payload.assigned_user_id || null, payload.assigned_team_id || null, scope.organization_id]
    );
    return res.rows[0] || null;
  }

  async updateCaseStatus(caseId: string, status: string, scope: any) {
    const res = await query(
      `UPDATE cases
       SET status = $2, updated_at = NOW()
       WHERE case_id = $1 AND organization_id = $3
       RETURNING case_id, organization_id, program_id, case_type, status, priority,
                 assigned_team_id, assigned_user_id, created_by_user_id, created_at, updated_at`,
      [caseId, status, scope.organization_id]
    );
    return res.rows[0] || null;
  }
}
