import { query } from "../../../db/client.js";

export interface ProgramCareer {
  id: string;
  organizationId: string;
  programId: string;
  careerId: string;
  isPrimary: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

function rowToProgramCareer(row: any): ProgramCareer {
  return {
    id: row.program_career_id,
    organizationId: row.organization_id,
    programId: row.program_id,
    careerId: row.career_id,
    isPrimary: row.is_primary,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

const COLUMNS = "program_career_id, organization_id, program_id, career_id, is_primary, created_by_user_id, created_at, updated_at";

export class ProgramCareerRepo {
  async create(input: { id: string; organizationId: string; programId: string; careerId: string; isPrimary: boolean; createdByUserId: string }): Promise<ProgramCareer> {
    const res = await query(
      `INSERT INTO program_careers (program_career_id, organization_id, program_id, career_id, is_primary, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING ${COLUMNS}`,
      [input.id, input.organizationId, input.programId, input.careerId, input.isPrimary, input.createdByUserId],
    );
    return rowToProgramCareer(res.rows[0]);
  }

  async existsForProgramAndCareer(organizationId: string, programId: string, careerId: string): Promise<boolean> {
    const res = await query(
      "SELECT 1 FROM program_careers WHERE organization_id=$1 AND program_id=$2 AND career_id=$3 LIMIT 1",
      [organizationId, programId, careerId],
    );
    return res.rows.length > 0;
  }

  async listForProgram(organizationId: string, programId: string): Promise<ProgramCareer[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM program_careers WHERE organization_id=$1 AND program_id=$2 ORDER BY created_at ASC`,
      [organizationId, programId],
    );
    return res.rows.map(rowToProgramCareer);
  }

  async listProgramIdsForCareerInOrganization(organizationId: string, careerId: string): Promise<string[]> {
    const res = await query(
      "SELECT DISTINCT program_id FROM program_careers WHERE organization_id=$1 AND career_id=$2",
      [organizationId, careerId],
    );
    return res.rows.map((r: any) => String(r.program_id));
  }

  /** Every distinct career_id linked to any of the given programs, in the
   * given organization. Used for learner pathway derivation. */
  async listCareerIdsForPrograms(organizationId: string, programIds: string[]): Promise<string[]> {
    if (!programIds.length) return [];
    const res = await query(
      "SELECT DISTINCT career_id FROM program_careers WHERE organization_id=$1 AND program_id = ANY($2::text[])",
      [organizationId, programIds],
    );
    return res.rows.map((r: any) => String(r.career_id));
  }

  async delete(organizationId: string, programId: string, careerId: string): Promise<boolean> {
    const res = await query(
      "DELETE FROM program_careers WHERE organization_id=$1 AND program_id=$2 AND career_id=$3",
      [organizationId, programId, careerId],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
