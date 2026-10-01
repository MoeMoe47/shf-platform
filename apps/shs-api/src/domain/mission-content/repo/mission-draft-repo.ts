import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";

function rowToDraft(row: any) {
  return {
    draftId: row.draft_id,
    missionId: row.mission_id,
    missionVersion: Number(row.mission_version),
    revision: Number(row.revision),
    status: row.status,
    definition: row.definition_json,
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

const COLUMNS = `draft_id, mission_id, mission_version, revision, status, definition_json,
  created_by_user_id, updated_by_user_id, created_at, updated_at`;

export interface MissionDraftScope {
  organizationId: string;
  tenantId: string;
  userId: string;
}

export class MissionDraftRepo {
  constructor(private readonly dbQuery: typeof query = query) {}

  async list(scope: MissionDraftScope) {
    const result = await this.dbQuery(
      `SELECT ${COLUMNS} FROM mission_definition_drafts
       WHERE organization_id=$1 AND tenant_id=$2 AND author_user_id=$3
       ORDER BY updated_at DESC, draft_id ASC LIMIT 100`,
      [scope.organizationId, scope.tenantId, scope.userId],
    );
    return result.rows.map(rowToDraft);
  }

  async get(scope: MissionDraftScope, draftId: string) {
    const result = await this.dbQuery(
      `SELECT ${COLUMNS} FROM mission_definition_drafts
       WHERE draft_id=$1 AND organization_id=$2 AND tenant_id=$3 AND author_user_id=$4`,
      [draftId, scope.organizationId, scope.tenantId, scope.userId],
    );
    return result.rows[0] ? rowToDraft(result.rows[0]) : null;
  }

  async create(scope: MissionDraftScope, definition: Record<string, unknown>) {
    const draftId = randomUUID();
    const result = await this.dbQuery(
      `INSERT INTO mission_definition_drafts
         (draft_id, mission_id, mission_version, organization_id, tenant_id, author_user_id,
          definition_json, created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$6,$6)
       RETURNING ${COLUMNS}`,
      [draftId, definition.missionId, definition.version, scope.organizationId, scope.tenantId, scope.userId, JSON.stringify(definition)],
    );
    return rowToDraft(result.rows[0]);
  }

  async update(scope: MissionDraftScope, draftId: string, expectedRevision: number, definition: Record<string, unknown>) {
    const result = await this.dbQuery(
      `UPDATE mission_definition_drafts
       SET definition_json=$5::jsonb, revision=revision+1, updated_by_user_id=$4, updated_at=NOW()
       WHERE draft_id=$1 AND organization_id=$2 AND tenant_id=$3 AND author_user_id=$4
         AND revision=$6 AND mission_id=$7 AND mission_version=$8
       RETURNING ${COLUMNS}`,
      [draftId, scope.organizationId, scope.tenantId, scope.userId, JSON.stringify(definition), expectedRevision, definition.missionId, definition.version],
    );
    if (result.rows[0]) return { kind: "OK" as const, draft: rowToDraft(result.rows[0]) };
    const current = await this.get(scope, draftId);
    if (!current) return { kind: "NOT_FOUND" as const };
    if (current.missionId !== definition.missionId || current.missionVersion !== definition.version) return { kind: "IDENTITY_IMMUTABLE" as const };
    return { kind: "REVISION_CONFLICT" as const, currentRevision: current.revision };
  }
}
