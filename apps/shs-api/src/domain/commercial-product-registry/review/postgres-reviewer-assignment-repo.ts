import { query } from "../../../db/client.js";
import { SHS_ROLE_PERMISSION_MAP } from "../../../auth/security-permissions.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> };

function client(executor?: Executor): Executor {
  return executor || { query };
}

export class PostgresReviewerAssignmentRepo {
  async assertIdentityMembership(actorId: string, organizationId: string, executor?: Executor, capability?: string) {
    const result = await client(executor).query(
      `SELECT m.membership_id, r.role_id, r.role_name, r.role_scope_type
       FROM users u
       JOIN memberships m ON m.user_id=u.user_id
       JOIN organizations o ON o.organization_id=m.organization_id
       JOIN roles r ON r.role_id=m.role_id
       WHERE u.user_id=$1 AND u.status='active' AND o.status='active'
         AND m.organization_id=$2 AND m.status='active'
         AND m.effective_from <= clock_timestamp()
         AND (m.effective_to IS NULL OR m.effective_to > clock_timestamp())
       FOR SHARE OF m`,
      [actorId, organizationId],
    );
    if (!result.rows.length) return false;
    if (!capability) return true;
    for (const row of result.rows) {
      const permissions = await client(executor).query(
        "SELECT permission_name FROM role_permissions WHERE role_id=$1 FOR SHARE",
        [row.role_id],
      );
      if (permissions.rows.length) {
        if (permissions.rows.some((permission: any) => permission.permission_name === capability)) return true;
      } else if ((SHS_ROLE_PERMISSION_MAP[row.role_name] || []).includes(capability as any)) return true;
    }
    return false;
  }

  async assertActiveAssignment(input: {
    reviewerActorId: string;
    organizationId: string;
    candidateId: string;
    commercialProductId: string;
    gateType: string;
  }, executor: Executor) {
    const result = await executor.query(
      `SELECT a.assignment_id, a.version, a.effective_at, a.expires_at
       FROM commercial_product_reviewer_assignments a
       JOIN commercial_product_reviewer_assignment_gates g ON g.assignment_id=a.assignment_id
       WHERE a.reviewer_actor_id=$1 AND a.reviewer_org_id=$2
         AND a.candidate_id=$3 AND a.commercial_product_id=$4
         AND g.gate_type=$5 AND a.assignment_status='ACTIVE'
       FOR UPDATE OF a`,
      [input.reviewerActorId, input.organizationId, input.candidateId, input.commercialProductId, input.gateType],
    );
    const assignment = result.rows[0];
    if (!assignment) return null;
    const nowResult = await executor.query("SELECT clock_timestamp() AS now");
    const now = Date.parse(nowResult.rows[0].now);
    if (Date.parse(assignment.effective_at) > now || Date.parse(assignment.expires_at) <= now) return null;
    return assignment;
  }

  async listActiveForReviewer(reviewerActorId: string, organizationId: string, executor?: Executor) {
    const result = await client(executor).query(
      `SELECT a.*, COALESCE(array_agg(g.gate_type ORDER BY g.gate_type) FILTER (WHERE g.gate_type IS NOT NULL), '{}') AS allowed_gate_types
       FROM commercial_product_reviewer_assignments a
       LEFT JOIN commercial_product_reviewer_assignment_gates g ON g.assignment_id=a.assignment_id
       WHERE a.reviewer_actor_id=$1 AND a.reviewer_org_id=$2 AND a.assignment_status='ACTIVE'
         AND a.effective_at <= clock_timestamp() AND a.expires_at > clock_timestamp()
       GROUP BY a.assignment_id
       ORDER BY a.candidate_id, a.created_at`,
      [reviewerActorId, organizationId],
    );
    return result.rows;
  }

  async findActiveForCandidate(reviewerActorId: string, organizationId: string, candidateId: string, executor?: Executor) {
    const result = await client(executor).query(
      `SELECT a.*, COALESCE(array_agg(g.gate_type ORDER BY g.gate_type) FILTER (WHERE g.gate_type IS NOT NULL), '{}') AS allowed_gate_types
       FROM commercial_product_reviewer_assignments a
       LEFT JOIN commercial_product_reviewer_assignment_gates g ON g.assignment_id=a.assignment_id
       WHERE a.reviewer_actor_id=$1 AND a.reviewer_org_id=$2 AND a.candidate_id=$3
         AND a.assignment_status='ACTIVE'
         AND a.effective_at <= clock_timestamp() AND a.expires_at > clock_timestamp()
       GROUP BY a.assignment_id
       ORDER BY a.created_at`,
      [reviewerActorId, organizationId, candidateId],
    );
    return result.rows;
  }

  async listAssignments(organizationId: string, options: { limit: number; offset: number }, executor?: Executor) {
    const sql = client(executor);
    const [items, count] = await Promise.all([
      sql.query(
        `SELECT a.*, COALESCE(array_agg(g.gate_type ORDER BY g.gate_type) FILTER (WHERE g.gate_type IS NOT NULL), '{}') AS allowed_gate_types
         FROM commercial_product_reviewer_assignments a
         LEFT JOIN commercial_product_reviewer_assignment_gates g ON g.assignment_id=a.assignment_id
         WHERE a.reviewer_org_id=$1 GROUP BY a.assignment_id
         ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,
        [organizationId, options.limit, options.offset],
      ),
      sql.query("SELECT count(*)::int AS total FROM commercial_product_reviewer_assignments WHERE reviewer_org_id=$1", [organizationId]),
    ]);
    return { items: items.rows, total: count.rows[0]?.total || 0 };
  }

  async getAssignment(assignmentId: string, executor?: Executor, forUpdate = false) {
    const sql = client(executor);
    const result = await sql.query(`SELECT * FROM commercial_product_reviewer_assignments WHERE assignment_id=$1${forUpdate ? " FOR UPDATE" : ""}`, [assignmentId]);
    if (!result.rows[0]) return null;
    const gates = await sql.query("SELECT gate_type FROM commercial_product_reviewer_assignment_gates WHERE assignment_id=$1 ORDER BY gate_type", [assignmentId]);
    return { ...result.rows[0], allowed_gate_types: gates.rows.map((row: any) => row.gate_type) };
  }

  async lockAssignmentKey(reviewerActorId: string, organizationId: string, candidateId: string, executor: Executor) {
    await executor.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`cpr-assignment:${reviewerActorId}:${organizationId}:${candidateId}`]);
  }

  async expirePastAssignments(reviewerActorId: string, organizationId: string, candidateId: string, executor: Executor) {
    return executor.query(
      `UPDATE commercial_product_reviewer_assignments
       SET assignment_status='EXPIRED', updated_at=clock_timestamp(), version=version+1
       WHERE reviewer_actor_id=$1 AND reviewer_org_id=$2 AND candidate_id=$3
         AND assignment_status='ACTIVE' AND expires_at <= clock_timestamp()
       RETURNING *`,
      [reviewerActorId, organizationId, candidateId],
    );
  }

  async insertAssignment(input: any, executor: Executor) {
    const result = await executor.query(
      `INSERT INTO commercial_product_reviewer_assignments (
        assignment_id, reviewer_actor_id, reviewer_org_id, candidate_id, commercial_product_id,
        effective_at, expires_at, assignment_status, assigned_by_actor_id,
        assignment_authority_reference, reason, version
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,$9,$10,1) RETURNING *`,
      [input.assignment_id, input.reviewer_actor_id, input.reviewer_org_id, input.candidate_id, input.commercial_product_id,
        input.effective_at, input.expires_at, input.assigned_by_actor_id, input.assignment_authority_reference, input.reason],
    );
    for (const gateType of input.allowed_gate_types) {
      await executor.query("INSERT INTO commercial_product_reviewer_assignment_gates (assignment_id, gate_type) VALUES ($1,$2)", [input.assignment_id, gateType]);
    }
    return { ...result.rows[0], allowed_gate_types: input.allowed_gate_types };
  }

  async revokeAssignment(assignmentId: string, actorId: string, organizationId: string, executor: Executor) {
    const result = await executor.query(
      `UPDATE commercial_product_reviewer_assignments
       SET assignment_status='REVOKED', revoked_at=clock_timestamp(), revoked_by_actor_id=$2,
           updated_at=clock_timestamp(), version=version+1
       WHERE assignment_id=$1 AND reviewer_org_id=$3 AND assignment_status IN ('ACTIVE','SUSPENDED')
       RETURNING *`,
      [assignmentId, actorId, organizationId],
    );
    return result.rows[0] || null;
  }

  async assignmentHistory(assignmentId: string, organizationId: string, executor?: Executor) {
    const result = await client(executor).query(
      `SELECT audit_event_id, actor_user_id, organization_id, action_type, previous_state_json,
              new_state_json, reason_text, event_timestamp
       FROM audit_events WHERE organization_id=$1 AND target_object_type='commercial_product_reviewer_assignment'
         AND target_object_id=$2 ORDER BY event_timestamp, audit_event_id`,
      [organizationId, assignmentId],
    );
    return result.rows;
  }
}
