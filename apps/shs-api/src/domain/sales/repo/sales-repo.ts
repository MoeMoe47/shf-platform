import { query } from "../../../db/client.js";

export type SalesScope = {
  tenant_id: string;
  organization_id: string;
};

export class SalesRepo {
  async organizationExists(organizationId: string, executor: any = { query }) {
    const res = await executor.query("SELECT 1 FROM organizations WHERE organization_id=$1 LIMIT 1", [organizationId]);
    return Boolean(res.rows[0]);
  }

  async userBelongsToOrganization(userId: string, organizationId: string, executor: any = { query }) {
    const res = await executor.query(
      "SELECT 1 FROM memberships WHERE user_id=$1 AND organization_id=$2 AND status='active' LIMIT 1",
      [userId, organizationId],
    )
    return Boolean(res.rows[0])
  }

  async getLinkReference(type: "relationship" | "discovery" | "need", id: string, executor: any = { query }) {
    const source = {
      relationship: ["sales_relationships", "relationship_id"],
      discovery: ["sales_discovery_records", "discovery_record_id"],
      need: ["sales_needs", "need_id"],
    }[type]
    const res = await executor.query(
      `SELECT tenant_id, organization_id, account_organization_id, archived_at, relationship_status, discovery_status, status
       FROM ${source[0]} WHERE ${source[1]}=$1 LIMIT 1`,
      [id],
    )
    return res.rows[0] || null
  }

  async listActiveNeedsForAccount(accountOrganizationId: string, scope: SalesScope, executor: any) {
    const res = await executor.query(
      `SELECT * FROM sales_needs
       WHERE tenant_id=$1 AND organization_id=$2 AND account_organization_id=$3
         AND archived_at IS NULL AND status NOT IN ('CLOSED','RESOLVED')
       ORDER BY updated_at DESC`,
      [scope.tenant_id, scope.organization_id, accountOrganizationId],
    )
    return res.rows
  }

  async listRelationships(scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_relationships
       WHERE tenant_id=$1 AND organization_id=$2 AND archived_at IS NULL
       ORDER BY updated_at DESC, created_at DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return res.rows;
  }

  async getRelationship(id: string, scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_relationships
       WHERE relationship_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return res.rows[0] || null;
  }

  async createRelationship(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO sales_relationships (
        relationship_id, organization_id, tenant_id, account_organization_id,
        relationship_type, relationship_status, owner_user_id, source, notes,
        created_by_user_id, updated_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
      RETURNING *`,
      [
        input.relationship_id, input.organization_id, input.tenant_id, input.account_organization_id,
        input.relationship_type, input.relationship_status, input.owner_user_id || null,
        input.source || null, input.notes || null, input.actor_id,
      ],
    );
    return res.rows[0];
  }

  async updateRelationship(id: string, scope: SalesScope, input: any, executor: any) {
    const res = await executor.query(
      `UPDATE sales_relationships
       SET relationship_type=COALESCE($4, relationship_type),
           relationship_status=COALESCE($5, relationship_status),
           owner_user_id=COALESCE($6, owner_user_id),
           source=COALESCE($7, source),
           notes=COALESCE($8, notes),
           updated_by_user_id=$9,
           updated_at=NOW(),
           version=version+1,
           archived_at=CASE WHEN $5 = 'CLOSED' THEN COALESCE(archived_at, NOW()) ELSE archived_at END
       WHERE relationship_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       RETURNING *`,
      [
        id, scope.tenant_id, scope.organization_id, input.relationship_type || null,
        input.relationship_status || null, input.owner_user_id || null, input.source || null,
        input.notes || null, input.actor_id,
      ],
    );
    return res.rows[0] || null;
  }

  async listDiscoveryRecords(scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_discovery_records
       WHERE tenant_id=$1 AND organization_id=$2 AND archived_at IS NULL
       ORDER BY updated_at DESC, created_at DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return res.rows;
  }

  async getDiscoveryRecord(id: string, scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_discovery_records
       WHERE discovery_record_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return res.rows[0] || null;
  }

  async createDiscoveryRecord(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO sales_discovery_records (
        discovery_record_id, organization_id, tenant_id, account_organization_id,
        relationship_id, discovery_status, business_goals, pain_points,
        current_processes, constraints, timeline, budget_context, decision_process,
        stakeholder_context, notes, created_by_user_id, updated_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16,$16)
      RETURNING *`,
      [
        input.discovery_record_id, input.organization_id, input.tenant_id, input.account_organization_id,
        input.relationship_id || null, input.discovery_status, JSON.stringify(input.business_goals || []),
        JSON.stringify(input.pain_points || []), JSON.stringify(input.current_processes || []),
        JSON.stringify(input.constraints || []), input.timeline || null, input.budget_context || null,
        input.decision_process || null, input.stakeholder_context || null, input.notes || null,
        input.actor_id,
      ],
    );
    return res.rows[0];
  }

  async updateDiscoveryRecord(id: string, scope: SalesScope, input: any, executor: any) {
    const res = await executor.query(
      `UPDATE sales_discovery_records
       SET discovery_status=COALESCE($4, discovery_status),
           business_goals=COALESCE($5::jsonb, business_goals),
           pain_points=COALESCE($6::jsonb, pain_points),
           current_processes=COALESCE($7::jsonb, current_processes),
           constraints=COALESCE($8::jsonb, constraints),
           timeline=COALESCE($9, timeline),
           budget_context=COALESCE($10, budget_context),
           decision_process=COALESCE($11, decision_process),
           stakeholder_context=COALESCE($12, stakeholder_context),
           notes=COALESCE($13, notes),
           updated_by_user_id=$14,
           updated_at=NOW(),
           version=version+1
       WHERE discovery_record_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       RETURNING *`,
      [
        id, scope.tenant_id, scope.organization_id, input.discovery_status || null,
        input.business_goals ? JSON.stringify(input.business_goals) : null,
        input.pain_points ? JSON.stringify(input.pain_points) : null,
        input.current_processes ? JSON.stringify(input.current_processes) : null,
        input.constraints ? JSON.stringify(input.constraints) : null,
        input.timeline || null, input.budget_context || null, input.decision_process || null,
        input.stakeholder_context || null, input.notes || null, input.actor_id,
      ],
    );
    return res.rows[0] || null;
  }

  async archiveDiscoveryRecord(id: string, scope: SalesScope, actorId: string, executor: any) {
    const res = await executor.query(
      `UPDATE sales_discovery_records
       SET archived_at=COALESCE(archived_at,NOW()), updated_at=NOW(), updated_by_user_id=$4, version=version+1
       WHERE discovery_record_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       RETURNING *`,
      [id, scope.tenant_id, scope.organization_id, actorId],
    )
    return res.rows[0] || null
  }

  async listNeeds(scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_needs
       WHERE tenant_id=$1 AND organization_id=$2 AND archived_at IS NULL
       ORDER BY updated_at DESC, created_at DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return res.rows;
  }

  async getNeed(id: string, scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_needs
       WHERE need_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return res.rows[0] || null;
  }

  async createNeed(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO sales_needs (
        need_id, organization_id, tenant_id, account_organization_id,
        discovery_record_id, need_type, title, description, priority, status,
        source, created_by_user_id, updated_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
      RETURNING *`,
      [
        input.need_id, input.organization_id, input.tenant_id, input.account_organization_id,
        input.discovery_record_id || null, input.need_type, input.title, input.description || null,
        input.priority, input.status, input.source || null, input.actor_id,
      ],
    );
    return res.rows[0];
  }

  async updateNeed(id: string, scope: SalesScope, input: any, executor: any) {
    const res = await executor.query(
      `UPDATE sales_needs
       SET need_type=COALESCE($4, need_type),
           title=COALESCE($5, title),
           description=COALESCE($6, description),
           priority=COALESCE($7, priority),
           status=COALESCE($8, status),
           source=COALESCE($9, source),
           updated_by_user_id=$10,
           updated_at=NOW(),
           version=version+1,
           archived_at=CASE WHEN $8 = 'CLOSED' THEN COALESCE(archived_at, NOW()) ELSE archived_at END
       WHERE need_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       RETURNING *`,
      [id, scope.tenant_id, scope.organization_id, input.need_type || null, input.title || null, input.description || null, input.priority || null, input.status || null, input.source || null, input.actor_id],
    );
    return res.rows[0] || null;
  }

  async listOpportunities(scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_opportunities
       WHERE tenant_id=$1 AND organization_id=$2 AND archived_at IS NULL
       ORDER BY updated_at DESC, created_at DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return res.rows;
  }

  async getOpportunity(id: string, scope: SalesScope, executor: any = { query }) {
    const res = await executor.query(
      `SELECT * FROM sales_opportunities
       WHERE opportunity_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return res.rows[0] || null;
  }

  async getOpportunityForUpdate(id: string, scope: SalesScope, executor: any) {
    const res = await executor.query(
      `SELECT * FROM sales_opportunities
       WHERE opportunity_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [id, scope.tenant_id, scope.organization_id],
    )
    return res.rows[0] || null
  }

  async createOpportunity(input: any, executor: any) {
    const res = await executor.query(
      `INSERT INTO sales_opportunities (
        opportunity_id, organization_id, tenant_id, account_organization_id,
        relationship_id, discovery_record_id, stage, status, name,
        estimated_value, currency, target_close_date, owner_user_id,
        primary_need_ids, employer_incentive_assessment_ids, created_by_user_id,
        updated_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16,$16)
      RETURNING *`,
      [
        input.opportunity_id, input.organization_id, input.tenant_id, input.account_organization_id,
        input.relationship_id || null, input.discovery_record_id || null, input.stage, input.status,
        input.name, input.estimated_value, input.currency, input.target_close_date || null,
        input.owner_user_id || null, JSON.stringify(input.primary_need_ids || []),
        JSON.stringify(input.employer_incentive_assessment_ids || []), input.actor_id,
      ],
    );
    return res.rows[0];
  }

  async updateOpportunity(id: string, scope: SalesScope, input: any, executor: any) {
    const res = await executor.query(
      `UPDATE sales_opportunities
       SET stage=COALESCE($4, stage),
           status=COALESCE($5, status),
           name=COALESCE($6, name),
           estimated_value=COALESCE($7, estimated_value),
           currency=COALESCE($8, currency),
           target_close_date=COALESCE($9, target_close_date),
           owner_user_id=COALESCE($10, owner_user_id),
           primary_need_ids=COALESCE($11::jsonb, primary_need_ids),
           employer_incentive_assessment_ids=COALESCE($12::jsonb, employer_incentive_assessment_ids),
           updated_by_user_id=$13,
           updated_at=NOW(),
           closed_at=CASE WHEN $5 IN ('WON','LOST') OR $4 IN ('WON','LOST') THEN COALESCE(closed_at, NOW()) ELSE closed_at END,
           archived_at=CASE WHEN $5 = 'ARCHIVED' THEN COALESCE(archived_at, NOW()) ELSE archived_at END,
           version=version+1
       WHERE opportunity_id=$1 AND tenant_id=$2 AND organization_id=$3 AND archived_at IS NULL
       RETURNING *`,
      [
        id, scope.tenant_id, scope.organization_id, input.stage || null, input.status || null,
        input.name || null, input.estimated_value ?? null, input.currency || null, input.target_close_date || null,
        input.owner_user_id || null, input.primary_need_ids ? JSON.stringify(input.primary_need_ids) : null,
        input.employer_incentive_assessment_ids ? JSON.stringify(input.employer_incentive_assessment_ids) : null,
        input.actor_id,
      ],
    );
    return res.rows[0] || null;
  }
}
