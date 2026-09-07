import { query } from "../../../db/client.js";
import { definitionFromRow, type ProgramCompletionDefinition } from "../model/program-completion-definition.js";

export class ProgramCompletionDefinitionRepo {
  constructor(private dbQuery: typeof query = query) {}

  async findActive(scope: { organizationId: string; tenantId: string }, programReference: string) {
    const result = await this.dbQuery(
      `SELECT * FROM program_completion_definitions
       WHERE organization_id=$1 AND tenant_id=$2 AND canonical_program_reference=$3
         AND status='ACTIVE' AND (effective_from IS NULL OR effective_from <= NOW())
         AND (effective_until IS NULL OR effective_until > NOW())
       ORDER BY activated_at DESC LIMIT 1`,
      [scope.organizationId, scope.tenantId, programReference],
    );
    return result.rows[0] ? definitionFromRow(result.rows[0]) : null;
  }

  async list(scope: { organizationId: string; tenantId: string }, programReference: string) {
    const result = await this.dbQuery(
      `SELECT * FROM program_completion_definitions WHERE organization_id=$1 AND tenant_id=$2 AND canonical_program_reference=$3 ORDER BY created_at DESC`,
      [scope.organizationId, scope.tenantId, programReference],
    );
    return result.rows.map(definitionFromRow);
  }

  async insert(input: { definitionId: string; programReference: string; organizationId: string; tenantId: string; version: string; completionMode: string; requirements: unknown[]; authorityReference: string; definitionHash: string; createdByUserId: string }) {
    const result = await this.dbQuery(
      `INSERT INTO program_completion_definitions
        (definition_id, canonical_program_reference, organization_id, tenant_id, version, status, completion_mode, requirements_json, authority_reference, definition_hash, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7,$8,$9,$10) RETURNING *`,
      [input.definitionId, input.programReference, input.organizationId, input.tenantId, input.version, input.completionMode, JSON.stringify(input.requirements), input.authorityReference, input.definitionHash, input.createdByUserId],
    );
    return definitionFromRow(result.rows[0]);
  }

  async upsertTrusted(input: { definitionId: string; programReference: string; organizationId: string; tenantId: string; version: string; completionMode: string; requirements: unknown[]; authorityReference: string; definitionHash: string; createdByUserId: string }) {
    const result = await this.dbQuery(
      `INSERT INTO program_completion_definitions
        (definition_id, canonical_program_reference, organization_id, tenant_id, version, status, completion_mode, requirements_json, authority_reference, definition_hash, created_by_user_id, activated_by_user_id, activated_at)
       VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6,$7,$8,$9,$10,$10,NOW())
       ON CONFLICT (organization_id, tenant_id, canonical_program_reference, version)
       DO UPDATE SET requirements_json=EXCLUDED.requirements_json, definition_hash=EXCLUDED.definition_hash, updated_at=NOW()
       RETURNING *`,
      [input.definitionId, input.programReference, input.organizationId, input.tenantId, input.version, input.completionMode, JSON.stringify(input.requirements), input.authorityReference, input.definitionHash, input.createdByUserId],
    );
    return definitionFromRow(result.rows[0]);
  }

  async setStatus(scope: { organizationId: string; tenantId: string }, definitionId: string, status: "ACTIVE" | "RETIRED", actorId: string) {
    const result = await this.dbQuery(
      `UPDATE program_completion_definitions
       SET status=$4,
           activated_by_user_id=CASE WHEN $4='ACTIVE' THEN $3 ELSE activated_by_user_id END,
           activated_at=CASE WHEN $4='ACTIVE' THEN NOW() ELSE activated_at END,
           retired_by_user_id=CASE WHEN $4='RETIRED' THEN $3 ELSE retired_by_user_id END,
           retired_at=CASE WHEN $4='RETIRED' THEN NOW() ELSE retired_at END,
           updated_at=NOW()
       WHERE definition_id=$1 AND organization_id=$2 AND tenant_id=$5
         AND (($4='ACTIVE' AND status='DRAFT') OR ($4='RETIRED' AND status='ACTIVE'))
       RETURNING *`,
      [definitionId, scope.organizationId, actorId, status, scope.tenantId],
    );
    return result.rows[0] ? definitionFromRow(result.rows[0]) : null;
  }

  async findById(scope: { organizationId: string; tenantId: string }, definitionId: string): Promise<ProgramCompletionDefinition | null> {
    const result = await this.dbQuery("SELECT * FROM program_completion_definitions WHERE definition_id=$1 AND organization_id=$2 AND tenant_id=$3", [definitionId, scope.organizationId, scope.tenantId]);
    return result.rows[0] ? definitionFromRow(result.rows[0]) : null;
  }
}
