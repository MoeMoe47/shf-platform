// SHF Lesson + Assignment + Curriculum — Phase 4.
import { query } from "../../../db/client.js";
import type { CompletionPolicyRow, CompletionPolicyRequirementRow, RequirementType } from "../model/completion-policy.js";

function policyFromRow(row: any): CompletionPolicyRow {
  return {
    policyId: row.policy_id,
    organizationId: row.organization_id,
    curriculumReleaseId: row.curriculum_release_id,
    assignedContentType: row.assigned_content_type,
    assignedContentId: row.assigned_content_id,
    version: row.version,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    activatedByUserId: row.activated_by_user_id,
    activatedAt: row.activated_at instanceof Date ? row.activated_at.toISOString() : row.activated_at,
    revision: row.revision,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function requirementFromRow(row: any): CompletionPolicyRequirementRow {
  return {
    requirementId: row.requirement_id,
    policyId: row.policy_id,
    organizationId: row.organization_id,
    requirementType: row.requirement_type,
    targetReference: row.target_reference,
    configuration: row.configuration || {},
    required: row.required,
    sequence: row.sequence,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export class CompletionPolicyRepo {
  async create(input: {
    policyId: string; organizationId: string; curriculumReleaseId: string;
    assignedContentType: string; assignedContentId: string | null; version: number; createdByUserId: string;
  }): Promise<CompletionPolicyRow> {
    const res = await query(
      `INSERT INTO completion_policies (policy_id, organization_id, curriculum_release_id, assigned_content_type, assigned_content_id, version, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.policyId, input.organizationId, input.curriculumReleaseId, input.assignedContentType, input.assignedContentId, input.version, input.createdByUserId],
    );
    return policyFromRow(res.rows[0]);
  }

  async findById(organizationId: string, policyId: string): Promise<CompletionPolicyRow | null> {
    const res = await query(`SELECT * FROM completion_policies WHERE organization_id = $1 AND policy_id = $2`, [organizationId, policyId]);
    return res.rows[0] ? policyFromRow(res.rows[0]) : null;
  }

  async nextVersion(organizationId: string, curriculumReleaseId: string, assignedContentType: string, assignedContentId: string | null): Promise<number> {
    const res = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM completion_policies
       WHERE organization_id = $1 AND curriculum_release_id = $2 AND assigned_content_type = $3 AND assigned_content_id IS NOT DISTINCT FROM $4`,
      [organizationId, curriculumReleaseId, assignedContentType, assignedContentId],
    );
    return Number(res.rows[0].next);
  }

  async activate(organizationId: string, policyId: string, expectedRevision: number, actorUserId: string): Promise<CompletionPolicyRow | null> {
    const res = await query(
      `UPDATE completion_policies SET status = 'ACTIVE', activated_by_user_id = $4, activated_at = NOW(), revision = revision + 1, updated_at = NOW()
       WHERE organization_id = $1 AND policy_id = $2 AND revision = $3 AND status = 'DRAFT'
       RETURNING *`,
      [organizationId, policyId, expectedRevision, actorUserId],
    );
    return res.rows[0] ? policyFromRow(res.rows[0]) : null;
  }

  async retire(organizationId: string, policyId: string, expectedRevision: number): Promise<CompletionPolicyRow | null> {
    const res = await query(
      `UPDATE completion_policies SET status = 'RETIRED', revision = revision + 1, updated_at = NOW()
       WHERE organization_id = $1 AND policy_id = $2 AND revision = $3 AND status = 'ACTIVE'
       RETURNING *`,
      [organizationId, policyId, expectedRevision],
    );
    return res.rows[0] ? policyFromRow(res.rows[0]) : null;
  }

  async addRequirement(input: {
    requirementId: string; policyId: string; organizationId: string; requirementType: RequirementType;
    targetReference: string | null; configuration: Record<string, unknown>; required: boolean; sequence: number;
  }): Promise<CompletionPolicyRequirementRow> {
    const res = await query(
      `INSERT INTO completion_policy_requirements (requirement_id, policy_id, organization_id, requirement_type, target_reference, configuration, required, sequence)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING *`,
      [input.requirementId, input.policyId, input.organizationId, input.requirementType, input.targetReference, JSON.stringify(input.configuration || {}), input.required, input.sequence],
    );
    return requirementFromRow(res.rows[0]);
  }

  async removeRequirement(organizationId: string, policyId: string, requirementId: string): Promise<void> {
    await query(`DELETE FROM completion_policy_requirements WHERE organization_id = $1 AND policy_id = $2 AND requirement_id = $3`, [organizationId, policyId, requirementId]);
  }

  async listRequirements(organizationId: string, policyId: string): Promise<CompletionPolicyRequirementRow[]> {
    const res = await query(`SELECT * FROM completion_policy_requirements WHERE organization_id = $1 AND policy_id = $2 ORDER BY sequence ASC`, [organizationId, policyId]);
    return res.rows.map(requirementFromRow);
  }

  async touchUpdatedAt(organizationId: string, policyId: string): Promise<void> {
    await query(`UPDATE completion_policies SET revision = revision + 1, updated_at = NOW() WHERE organization_id = $1 AND policy_id = $2`, [organizationId, policyId]);
  }
}
