import { createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { toTruthSpineFact } from "../truth-spine-adapter.js";

export type ProjectionActor = { user_id: string; organization_id: string; permissions?: string[] };
export type ProjectionInput = { sourceType: string; sourceRecordId: string; evidenceRuleId: string };
export type EvidenceRuleInput = { evidenceRuleId: string; sourceType: string; evidenceType?: string | null; truthFactType?: string | null; competencyId?: string | null; ruleVersion?: number; reviewRequired?: boolean };
export type ProjectionOutboxEvent = { event_type: string; subject_id: string; organization_id: string; payload_json?: unknown; payload?: Record<string, unknown> };

const SOURCE_TABLES: Record<string, { table: string; id: string; learner: string; occurred: string }> = {
  ASSESSMENT_RESULT: { table: "assessment_results", id: "assessment_result_id", learner: "learner_user_id", occurred: "graded_at" },
  REFLECTION_SUBMISSION: { table: "reflection_submissions", id: "reflection_submission_id", learner: "learner_user_id", occurred: "submitted_at" },
  PRACTICE_RESULT: { table: "practice_results", id: "practice_result_id", learner: "learner_user_id", occurred: "created_at" },
  LESSON_COMPLETION: { table: "curriculum_lesson_completions", id: "completion_id", learner: "user_id", occurred: "completed_at" },
  ARCADE_RESULT: { table: "arcade_results", id: "arcade_result_id", learner: "learner_user_id", occurred: "created_at" },
  PROJECT_SUBMISSION: { table: "project_submissions", id: "submission_id", learner: "submitted_by_user_id", occurred: "submitted_at" },
  ATTENDANCE: { table: "live_session_join_events", id: "join_event_id", learner: "user_id", occurred: "created_at" },
  INSTRUCTOR_VERIFICATION: { table: "learner_competency_decisions", id: "decision_id", learner: "user_id", occurred: "reviewed_at" },
  STUDIO_DELIVERY: { table: "studio_delivery_records", id: "delivery_record_id", learner: "studio_learner_id", occurred: "finalized_at" },
  AGENT_TASK_ATTEMPT: { table: "ai_agent_task_attempts", id: "attempt_id", learner: "agent_principal_user_id", occurred: "finished_at" },
};

function stableId(...parts: string[]) {
  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex").slice(0, 32);
}

async function loadSourceRow(sourceType: string, source: typeof SOURCE_TABLES[string], sourceRecordId: string, organizationId: string, learnerId?: string) {
  if (sourceType === "AGENT_TASK_ATTEMPT") {
    return query(`SELECT a.*, t.principal_user_id AS agent_principal_user_id, t.session_id, t.agent_identity_id,
      t.delegation_id, t.task_type, t.requested_action, t.action_hash, t.consequence_class,
      t.resource_scope, t.tool_scope, t.input_hash, t.policy_snapshot,
      pa.action_fingerprint, pa.proposed_action_id,
      ar.approval_request_id, ar.status AS approval_status
      FROM ai_agent_task_attempts a JOIN ai_agent_tasks t
        ON t.task_id=a.task_id AND t.organization_id=a.organization_id AND t.tenant_id=a.tenant_id
      LEFT JOIN ai_agent_task_proposed_actions pa ON pa.task_id=t.task_id
        AND pa.organization_id=t.organization_id AND pa.tenant_id=t.tenant_id
      LEFT JOIN ai_agent_task_approval_requests ar ON ar.proposed_action_id=pa.proposed_action_id
        AND ar.organization_id=t.organization_id AND ar.tenant_id=t.tenant_id
      WHERE a.attempt_id=$1 AND a.organization_id=$2 AND a.tenant_id=$3`, [sourceRecordId, organizationId, `tenant:${organizationId}`]);
  }
  if (sourceType === "STUDIO_DELIVERY") {
    const learnerClause = learnerId ? " AND p.studio_learner_id=$3" : "";
    const params = learnerId ? [sourceRecordId, organizationId, learnerId] : [sourceRecordId, organizationId];
    return query(`SELECT d.*, p.studio_learner_id, p.studio_destination, p.studio_project_type,
      p.studio_assignment_id AS assignment_id, p.studio_curriculum_release_id AS curriculum_release_id,
      p.course_id FROM studio_delivery_records d
      JOIN projects p ON p.project_id=d.project_id AND p.organization_id=d.organization_id
      WHERE d.delivery_record_id=$1 AND d.organization_id=$2 AND d.status='FINALIZED'${learnerClause}`, params);
  }
  if (sourceType === "ATTENDANCE") {
    const learnerClause = learnerId ? " AND e.user_id=$3" : "";
    const params = learnerId ? [sourceRecordId, organizationId, learnerId] : [sourceRecordId, organizationId];
    return query(`SELECT e.* FROM live_session_join_events e JOIN live_sessions s ON s.live_session_id=e.live_session_id WHERE e.join_event_id=$1 AND s.organization_id=$2${learnerClause}`, params);
  }
  const learnerClause = learnerId ? ` AND ${source.learner}=$3` : "";
  const params = learnerId ? [sourceRecordId, organizationId, learnerId] : [sourceRecordId, organizationId];
  return query(`SELECT * FROM ${source.table} WHERE ${source.id}=$1 AND organization_id=$2${learnerClause}`, params);
}

export async function createEvidenceRule(actor: ProjectionActor, input: EvidenceRuleInput) {
  const evidenceRuleId = String(input.evidenceRuleId || "").trim();
  const sourceType = String(input.sourceType || "").trim();
  if (!evidenceRuleId || !SOURCE_TABLES[sourceType]) throw new Error("invalid_evidence_rule");
  if (!input.evidenceType && !input.truthFactType) throw new Error("evidence_rule_has_no_projection");
  const result = await query(`INSERT INTO curriculum_evidence_rules
    (evidence_rule_id, organization_id, source_type, evidence_type, truth_fact_type, competency_id, rule_version, review_required, created_by_user_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (organization_id, evidence_rule_id, rule_version) DO UPDATE SET status='ACTIVE'
    RETURNING *`, [evidenceRuleId, actor.organization_id, sourceType, input.evidenceType || null, input.truthFactType || null, input.competencyId || null, input.ruleVersion || 1, Boolean(input.reviewRequired), actor.user_id]);
  return result.rows[0];
}

async function projectAuthoritativeFactInternal(actor: ProjectionActor, input: ProjectionInput, emitTruthFact: boolean) {
  const sourceType = String(input.sourceType || "").trim();
  const sourceRecordId = String(input.sourceRecordId || "").trim();
  const evidenceRuleId = String(input.evidenceRuleId || "").trim();
  const source = SOURCE_TABLES[sourceType];
  if (!source || !sourceRecordId || !evidenceRuleId) throw new Error("invalid_projection_input");
  const rule = await query("SELECT * FROM curriculum_evidence_rules WHERE evidence_rule_id=$1 AND organization_id=$2 AND status='ACTIVE'", [evidenceRuleId, actor.organization_id]);
  if (!rule.rows[0]) throw new Error("evidence_rule_not_found");
  const sourceResult = await loadSourceRow(sourceType, source, sourceRecordId, actor.organization_id, actor.user_id);
  const row = sourceResult.rows[0];
  if (!row) throw new Error("source_record_not_found");
  const validSource = sourceType === "AGENT_TASK_ATTEMPT" ? row.status === "SUCCEEDED"
    : sourceType === "STUDIO_DELIVERY" ? row.status === "FINALIZED" && row.studio_destination === "STUDENT"
    : sourceType === "ASSESSMENT_RESULT" ? row.passed === true && row.needs_review !== true
    : sourceType === "REFLECTION_SUBMISSION" ? row.status === "REVIEWED" && row.review_status === "APPROVED"
      : sourceType === "PRACTICE_RESULT" ? row.completed === true
        : sourceType === "ARCADE_RESULT" ? row.mastery_achieved === true
          : sourceType === "PROJECT_SUBMISSION" ? row.status === "ACCEPTED"
            : sourceType === "ATTENDANCE" ? ["attended", "completed"].includes(row.attendance_status)
              : sourceType === "INSTRUCTOR_VERIFICATION" ? row.decision === "DEMONSTRATED"
                : true;
  if (!validSource) throw new Error("source_record_not_evidence_eligible");
  const configured = rule.rows[0];
  return withTransaction(async (db: any) => {
    let evidence = null;
    if (configured.evidence_type) {
      const evidenceId = `evidence_${stableId(actor.organization_id, sourceType, sourceRecordId, evidenceRuleId)}`;
      const result = await db.query(`INSERT INTO prepare_prove_evidence
        (evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, status, provenance_json,
         source_type, assignment_id, curriculum_release_id, release_version, course_id, unit_stable_key, lesson_stable_key, definition_id,
         evidence_rule_id, evidence_rule_version, competency_id, verifier_user_id, source_occurred_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$2,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        ON CONFLICT DO NOTHING
      RETURNING *`, [evidenceId, sourceType, sourceRecordId, sourceType === "AGENT_TASK_ATTEMPT" ? row.agent_principal_user_id : actor.user_id, actor.organization_id, `tenant:${actor.organization_id}`, row.activity_id || sourceRecordId, configured.evidence_type, sourceType === "STUDIO_DELIVERY" || configured.review_required || sourceType === "AGENT_TASK_ATTEMPT" ? "REVIEWABLE" : "REVIEWED", JSON.stringify({ source_type: sourceType, source_record_id: sourceRecordId, rule_id: evidenceRuleId, rule_version: configured.rule_version, project_id: row.project_id || null, workspace_revision: row.workspace_revision || null, agent: sourceType === "AGENT_TASK_ATTEMPT" ? { task_id: row.task_id, attempt_id: row.attempt_id, session_id: row.session_id, agent_identity_id: row.agent_identity_id, delegation_id: row.delegation_id, action_fingerprint: row.action_fingerprint || row.action_hash, approval_request_id: row.approval_request_id || null, approval_status: row.approval_status || null, consequence_class: row.consequence_class } : null }), row.assignment_id || null, row.curriculum_release_id || null, row.release_version || null, row.course_id || null, row.unit_stable_key || null, row.lesson_stable_key || null, row.assessment_definition_id || row.reflection_definition_id || row.practice_definition_id || null, evidenceRuleId, configured.rule_version, configured.competency_id || null, sourceType === "STUDIO_DELIVERY" || configured.review_required || sourceType === "AGENT_TASK_ATTEMPT" ? null : actor.user_id, row[source.occurred] || new Date()]);
      evidence = result.rows[0] || (await db.query("SELECT * FROM prepare_prove_evidence WHERE organization_id=$1 AND source_type=$2 AND source_record_id=$3 AND evidence_rule_id=$4 AND status <> 'SUPERSEDED'", [actor.organization_id, sourceType, sourceRecordId, evidenceRuleId])).rows[0];
    }
    let truthFact = null;
    if (configured.truth_fact_type && emitTruthFact) {
      const truthFactId = `truth_fact_${stableId(actor.organization_id, sourceType, sourceRecordId, configured.truth_fact_type, evidenceRuleId)}`;
      const result = await db.query(`INSERT INTO curriculum_truth_facts
        (truth_fact_id, organization_id, learner_user_id, fact_type, source_type, source_record_id, evidence_id, assignment_id, curriculum_release_id, release_version, course_id, unit_stable_key, lesson_stable_key, definition_id, evidence_rule_id, evidence_rule_version, competency_id, provenance_json, occurred_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        ON CONFLICT (organization_id, source_type, source_record_id, fact_type, evidence_rule_id)
        DO UPDATE SET truth_fact_id=curriculum_truth_facts.truth_fact_id
        RETURNING *`, [truthFactId, actor.organization_id, actor.user_id, configured.truth_fact_type, sourceType, sourceRecordId, evidence?.evidence_id || null, row.assignment_id || null, row.curriculum_release_id || null, row.release_version || null, row.course_id || null, row.unit_stable_key || null, row.lesson_stable_key || null, row.assessment_definition_id || row.reflection_definition_id || row.practice_definition_id || null, evidenceRuleId, configured.rule_version, configured.competency_id || null, JSON.stringify({ source_type: sourceType, source_record_id: sourceRecordId, rule_id: evidenceRuleId, rule_version: configured.rule_version }), row[source.occurred] || new Date()]);
      truthFact = result.rows[0];
    }
    return { evidence, truthFact, truthSpineFact: truthFact ? toTruthSpineFact(truthFact) : null, idempotent: Boolean(evidence || truthFact) };
  });
}

export async function projectAuthoritativeFact(actor: ProjectionActor, input: ProjectionInput) {
  return projectAuthoritativeFactInternal(actor, input, true);
}

/**
 * Bounded Agent Fabric intake. A successful safe attempt becomes an
 * Evidence-domain source record only; Truth promotion still requires the
 * existing GPA claim, admissibility, and human verification path.
 */
export async function projectAgentTaskAttempt(actor: ProjectionActor, input: ProjectionInput) {
  const attemptId = String(input.sourceRecordId || "").trim();
  if (!attemptId) throw new Error("invalid_projection_input");
  const source = await query(`SELECT a.attempt_id, a.task_id, a.organization_id, a.tenant_id,
      a.status, a.result_metadata, a.finished_at, t.principal_user_id
    FROM ai_agent_task_attempts a JOIN ai_agent_tasks t
      ON t.task_id=a.task_id AND t.organization_id=a.organization_id AND t.tenant_id=a.tenant_id
    WHERE a.attempt_id=$1 AND a.organization_id=$2 AND a.tenant_id=$3`, [attemptId, actor.organization_id, `tenant:${actor.organization_id}`]);
  const row = source.rows[0];
  if (!row) throw new Error("source_record_not_found");
  if (row.status !== "SUCCEEDED") throw new Error("source_record_not_evidence_eligible");
  await query(`INSERT INTO prepare_prove_activity_results
    (result_id, activity_type, activity_id, user_id, organization_id, tenant_id, result_status, result_json)
    VALUES ($1,'AGENT_TASK_ATTEMPT',$1,$2,$3,$4,'SUCCEEDED',$5)
    ON CONFLICT (result_id) DO UPDATE SET result_json=EXCLUDED.result_json`, [attemptId, row.principal_user_id, row.organization_id, row.tenant_id, JSON.stringify({ attempt_id: attemptId, task_id: row.task_id, result: row.result_metadata || {}, finished_at: row.finished_at })]);
  return projectAuthoritativeFactInternal(actor, { ...input, sourceType: "AGENT_TASK_ATTEMPT" }, false);
}

const OUTBOX_SOURCE_TYPES: Record<string, string> = {
  "assessment.submitted": "ASSESSMENT_RESULT",
  "reflection.submitted": "REFLECTION_SUBMISSION",
  "practice.submitted": "PRACTICE_RESULT",
  "arcade.resulted": "ARCADE_RESULT",
  "project.submission.reviewed": "PROJECT_SUBMISSION",
  "attendance.confirmed": "ATTENDANCE",
  "competency.reviewed": "INSTRUCTOR_VERIFICATION",
  "lesson.completed": "LESSON_COMPLETION",
  "studio.delivery.finalized": "STUDIO_DELIVERY",
};

/**
 * Internal-only outbox boundary. The source row, learner, and organization
 * are resolved from SHS persistence; none are accepted from a browser.
 */
export async function projectAuthoritativeOutboxEvent(event: ProjectionOutboxEvent) {
  const sourceType = OUTBOX_SOURCE_TYPES[event.event_type];
  if (!sourceType) return { handled: false, projected: 0 };
  const source = SOURCE_TABLES[sourceType];
  const payload = typeof event.payload_json === "string" ? JSON.parse(event.payload_json) : (event.payload || event.payload_json || {});
  const sourceRecordId = String((payload as any)?.source_record_id || (payload as any)?.result_id || (payload as any)?.completion_id || (payload as any)?.decision_id || event.subject_id || "").trim();
  if (!sourceRecordId) { const error: any = new Error("projection_source_record_missing"); error.status = 503; throw error; }
  const sourceResult = await loadSourceRow(sourceType, source, sourceRecordId, event.organization_id);
  const row = sourceResult.rows[0];
  if (!row) { const error: any = new Error("projection_source_record_not_found"); error.status = 503; throw error; }
  const learnerId = String(row[source.learner] || "").trim();
  if (!learnerId) { const error: any = new Error("projection_source_learner_missing"); error.status = 503; throw error; }
  const rules = await query("SELECT evidence_rule_id FROM curriculum_evidence_rules WHERE organization_id=$1 AND source_type=$2 AND status='ACTIVE' ORDER BY evidence_rule_id", [event.organization_id, sourceType]);
  let projected = 0;
  for (const rule of rules.rows) {
    await projectAuthoritativeFactInternal({ user_id: learnerId, organization_id: event.organization_id }, { sourceType, sourceRecordId, evidenceRuleId: rule.evidence_rule_id }, sourceType !== "STUDIO_DELIVERY");
    projected += 1;
  }
  return { handled: true, projected };
}

export async function supersedeEvidence(actor: ProjectionActor, evidenceId: string, replacementStatus: "REVIEWABLE" | "REVIEWED" = "REVIEWED") {
  if (!actor.permissions?.includes("truth.override")) throw new Error("evidence_correction_forbidden");
  return withTransaction(async (db: any) => {
    const original = await db.query("SELECT * FROM prepare_prove_evidence WHERE evidence_id=$1 AND organization_id=$2 FOR UPDATE", [evidenceId, actor.organization_id]);
    if (!original.rows[0]) throw new Error("evidence_not_found");
    if (original.rows[0].status === "SUPERSEDED") return { original: original.rows[0], replacement: null, idempotent: true };
    const replacementId = `evidence_${stableId(actor.organization_id, evidenceId, "correction")}`;
    // Release the deterministic source/rule key only after the original has
    // been explicitly superseded; the transaction preserves both operations.
    await db.query("UPDATE prepare_prove_evidence SET status='SUPERSEDED' WHERE evidence_id=$1 AND organization_id=$2", [evidenceId, actor.organization_id]);
    const replacement = await db.query(`INSERT INTO prepare_prove_evidence
      (evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, status, provenance_json,
       source_type, assignment_id, curriculum_release_id, release_version, course_id, unit_stable_key, lesson_stable_key, definition_id,
       evidence_rule_id, evidence_rule_version, competency_id, verifier_user_id, source_occurred_at, supersedes_evidence_id)
      SELECT $1, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, $2, provenance_json,
       source_type, assignment_id, curriculum_release_id, release_version, course_id, unit_stable_key, lesson_stable_key, definition_id,
       evidence_rule_id, evidence_rule_version, competency_id, verifier_user_id, source_occurred_at, evidence_id
      FROM prepare_prove_evidence WHERE evidence_id=$3
      RETURNING *`, [replacementId, replacementStatus, evidenceId]);
    return { original: { ...original.rows[0], status: "SUPERSEDED" }, replacement: replacement.rows[0], idempotent: false };
  });
}

export const verifiedEvidenceEventSourceTypes = OUTBOX_SOURCE_TYPES;

export async function getEvidenceForActor(actor: ProjectionActor, evidenceId: string) {
  const result = await query("SELECT * FROM prepare_prove_evidence WHERE evidence_id=$1 AND organization_id=$2 AND user_id=$3", [evidenceId, actor.organization_id, actor.user_id]);
  return result.rows[0] || null;
}

export async function getTruthFactForActor(actor: ProjectionActor, truthFactId: string) {
  const result = await query("SELECT * FROM curriculum_truth_facts WHERE truth_fact_id=$1 AND organization_id=$2 AND learner_user_id=$3", [truthFactId, actor.organization_id, actor.user_id]);
  return result.rows[0] || null;
}
