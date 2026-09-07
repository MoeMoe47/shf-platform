import { createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { isAdminTier } from "../../shared/audience-eligibility.js";
import { BRANCH_REQUIREMENTS, GRADE12_PROGRAM_ID, SHARED_CORE_LESSONS } from "../model/grade12-eligibility-policy.js";
import { PROGRAM_COMPLETION_AUTHORITY_VERSION, requirementsForProgram } from "../model/program-completion-policy.js";
import { definitionHash, type ProgramCompletionDefinition, type ProgramCompletionRequirementDefinition } from "../model/program-completion-definition.js";
import { ProgramCompletionDefinitionRepo } from "../repo/program-completion-definition-repo.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("completion_scope_missing");
  return { userId, organizationId, tenantId };
}

function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex"); }

function trustedDataCenterDefinition(programReference: string, specializationId: string, current: { organizationId: string; tenantId: string; userId: string }): ProgramCompletionDefinition {
  const policy = requirementsForProgram(programReference, specializationId);
  if (!policy) throw new Error("active_specialization_required");
  const branch = BRANCH_REQUIREMENTS[specializationId];
  const requirements: ProgramCompletionRequirementDefinition[] = [
    ...SHARED_CORE_LESSONS.map((lessonId) => ({ requirementId: `lesson:${lessonId}`, type: "LESSON_COMPLETION" as const, canonicalReference: lessonId, label: "Required shared pathway lesson", metadata: { curriculumId: programReference } })),
    ...branch.lessons.map((lessonId) => ({ requirementId: `lesson:${lessonId}`, type: "LESSON_COMPLETION" as const, canonicalReference: lessonId, label: "Required specialization lesson", metadata: { curriculumId: programReference } })),
    ...branch.competencies.map((slug) => ({ requirementId: `competency:${slug}`, type: "COMPETENCY_DEMONSTRATED" as const, canonicalReference: slug, label: "Required demonstrated specialization competency" })),
  ];
  const definition = { canonicalProgramReference: programReference, version: policy.version, completionMode: "ALL_OF" as const, requirements, authorityReference: PROGRAM_COMPLETION_AUTHORITY_VERSION };
  return { definitionId: `program_completion_definition_${hash(`${current.organizationId}:${current.tenantId}:${programReference}:${policy.version}`).slice(0, 32)}`, ...definition, organizationId: current.organizationId, tenantId: current.tenantId, status: "ACTIVE", definitionHash: definitionHash(definition), createdByUserId: current.userId };
}

type RequirementResult = { requirement: ProgramCompletionRequirementDefinition; satisfied: boolean; evidenceReferences: unknown[] };

export type ProgramCompletionEvaluation = {
  programCompletionId: string | null;
  learnerUserId: string;
  programReference: string;
  requirementsVersion: string | null;
  completionDefinitionId?: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ELIGIBLE_FOR_COMPLETION" | "COMPLETED" | "BLOCKED";
  completed: boolean;
  evaluatedAt: string;
  completedAt: string | null;
  requirements: unknown[];
  missingRequirements: unknown[];
  evidenceReferences: unknown[];
  sourceVersions: Record<string, unknown>;
  reason: string;
};

export class ProgramCompletionService {
  private definitions: ProgramCompletionDefinitionRepo;
  constructor(private dbQuery: typeof query = query, private outbox = new IntegrationOutboxRepo(), definitions = new ProgramCompletionDefinitionRepo(dbQuery)) { this.definitions = definitions; }

  async evaluate(actor: any, learnerId = scope(actor).userId, programReference = GRADE12_PROGRAM_ID): Promise<ProgramCompletionEvaluation> {
    const current = scope(actor);
    if (learnerId !== current.userId && !isAdminTier(actor?.roles) && !actor?.permissions?.includes("program.read")) throw new Error("completion_view_required");
    let definition = await this.definitions.findActive(current, programReference);
    if (!definition && programReference === GRADE12_PROGRAM_ID) {
      const assignment = await this.dbQuery("SELECT specialization_id FROM program_specialization_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id=$4 AND assignment_type='PRIMARY' AND status='ACTIVE' ORDER BY effective_from DESC LIMIT 1", [learnerId, current.organizationId, current.tenantId, programReference]);
      const specializationId = assignment.rows[0]?.specialization_id || null;
      if (!specializationId || !BRANCH_REQUIREMENTS[specializationId]) return this.persist(current, learnerId, programReference, { status: "BLOCKED", reason: "PROGRAM_COMPLETION_REQUIREMENTS_UNAVAILABLE", requirementsVersion: null, completionDefinitionId: null, requirements: [], missingRequirements: [{ code: "ACTIVE_SPECIALIZATION_REQUIRED", label: "An active canonical specialization assignment" }], evidenceReferences: [], sourceVersions: {} });
      const trusted = trustedDataCenterDefinition(programReference, specializationId, current);
      definition = await this.definitions.upsertTrusted({ definitionId: trusted.definitionId, programReference, organizationId: current.organizationId, tenantId: current.tenantId, version: trusted.version, completionMode: trusted.completionMode, requirements: trusted.requirements, authorityReference: trusted.authorityReference, definitionHash: trusted.definitionHash, createdByUserId: current.userId });
    }
    if (!definition || definition.status !== "ACTIVE") return this.persist(current, learnerId, programReference, { status: "BLOCKED", reason: "PROGRAM_COMPLETION_DEFINITION_UNAVAILABLE", requirementsVersion: null, completionDefinitionId: null, requirements: [], missingRequirements: [{ code: "PROGRAM_REQUIREMENTS_UNAVAILABLE", label: "An active trusted program completion definition" }], evidenceReferences: [], sourceVersions: {} });
    const results = await this.evaluateRequirements(current, learnerId, definition);
    const required = results.filter((result) => result.requirement.required !== false);
    const complete = this.isComplete(definition, results, required.filter((result) => result.satisfied).length, required.length);
    const missingRequirements = results.filter((result) => !result.satisfied).map((result) => ({ code: "COMPLETION_REQUIREMENT_MISSING", label: result.requirement.label, detail: result.requirement.canonicalReference, requirementId: result.requirement.requirementId, type: result.requirement.type }));
    return this.persist(current, learnerId, programReference, { status: complete ? "COMPLETED" : "IN_PROGRESS", reason: complete ? "PROGRAM_COMPLETION_VERIFIED" : "PROGRAM_REQUIREMENTS_INCOMPLETE", requirementsVersion: definition.version, completionDefinitionId: definition.definitionId, requirements: definition.requirements, missingRequirements, evidenceReferences: results.flatMap((result) => result.evidenceReferences), sourceVersions: { authority: PROGRAM_COMPLETION_AUTHORITY_VERSION, definition: definition.version, definitionHash: definition.definitionHash } });
  }

  private isComplete(definition: ProgramCompletionDefinition, results: RequirementResult[], requiredSatisfied: number, requiredCount: number) {
    if (definition.completionMode === "ALL_OF") return requiredSatisfied === requiredCount;
    if (definition.completionMode === "ONE_OF") return results.some((result) => result.satisfied);
    return results.filter((result) => result.satisfied).length >= requiredCount;
  }

  private async evaluateRequirements(current: { organizationId: string; tenantId: string }, learnerUserId: string, definition: ProgramCompletionDefinition): Promise<RequirementResult[]> {
    const lessonRequirements = definition.requirements.filter((requirement) => requirement.type === "LESSON_COMPLETION");
    const lessonIds = lessonRequirements.map((requirement) => requirement.canonicalReference);
    const curriculumId = lessonRequirements[0]?.metadata?.curriculumId || definition.canonicalProgramReference;
    const lessonRows = lessonIds.length ? await this.dbQuery("SELECT lesson_id, completed_at FROM curriculum_lesson_completions WHERE user_id=$1 AND organization_id=$2 AND curriculum_id=$3 AND lesson_id = ANY($4::text[])", [learnerUserId, current.organizationId, curriculumId, lessonIds]) : { rows: [] };
    const completedLessons = new Map(lessonRows.rows.map((row: any) => [row.lesson_id, row.completed_at]));
    const competencyRequirements = definition.requirements.filter((requirement) => requirement.type === "COMPETENCY_DEMONSTRATED");
    const competencySlugs = competencyRequirements.map((requirement) => requirement.canonicalReference);
    const decisionRows = competencySlugs.length ? await this.dbQuery("SELECT c.slug FROM learner_competency_decisions d JOIN competency_definitions c ON c.competency_id=d.competency_id WHERE d.user_id=$1 AND d.organization_id=$2 AND d.tenant_id=$3 AND d.decision='DEMONSTRATED' AND c.slug = ANY($4::text[])", [learnerUserId, current.organizationId, current.tenantId, competencySlugs]) : { rows: [] };
    const demonstrated = new Set(decisionRows.rows.map((row: any) => row.slug));
    return definition.requirements.map((requirement) => {
      if (requirement.type === "LESSON_COMPLETION") {
        const completedAt = completedLessons.get(requirement.canonicalReference);
        return { requirement, satisfied: Boolean(completedAt), evidenceReferences: completedAt ? [{ type: "lesson-completion", id: `${definition.canonicalProgramReference}:${requirement.canonicalReference}`, completedAt }] : [] };
      }
      const satisfied = demonstrated.has(requirement.canonicalReference);
      return { requirement, satisfied, evidenceReferences: satisfied ? [{ type: "competency-decision", id: requirement.canonicalReference, status: "DEMONSTRATED" }] : [] };
    });
  }

  private async persist(scopeValue: { organizationId: string; tenantId: string }, learnerUserId: string, programReference: string, result: any): Promise<ProgramCompletionEvaluation> {
    const evaluatedAt = new Date().toISOString();
    const completed = result.status === "COMPLETED";
    const payload = { learnerUserId, programReference, requirementsVersion: result.requirementsVersion, completionDefinitionId: result.completionDefinitionId, status: result.status, requirements: result.requirements, missingRequirements: result.missingRequirements, evidenceReferences: result.evidenceReferences, sourceVersions: result.sourceVersions };
    const completionId = `program_completion_${hash([scopeValue.organizationId, scopeValue.tenantId, learnerUserId, programReference, result.requirementsVersion || "unavailable"]).slice(0, 32)}`;
    const previous = await this.dbQuery("SELECT status FROM program_completion_records WHERE program_completion_id=$1", [completionId]);
    const saved = await withTransaction(async (db: any) => {
      const row = await db.query(`INSERT INTO program_completion_records (program_completion_id, learner_user_id, organization_id, tenant_id, canonical_program_reference, requirements_version, status, evaluated_at, completed_at, requirements_json, missing_requirements_json, evidence_references_json, source_versions_json, authority_version, completion_hash, completion_definition_id, completion_definition_version, requirements_snapshot_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$6,$17) ON CONFLICT (organization_id, tenant_id, learner_user_id, canonical_program_reference, requirements_version) DO UPDATE SET status=EXCLUDED.status, evaluated_at=EXCLUDED.evaluated_at, completed_at=COALESCE(program_completion_records.completed_at, EXCLUDED.completed_at), requirements_json=EXCLUDED.requirements_json, missing_requirements_json=EXCLUDED.missing_requirements_json, evidence_references_json=EXCLUDED.evidence_references_json, source_versions_json=EXCLUDED.source_versions_json, completion_hash=EXCLUDED.completion_hash, completion_definition_id=EXCLUDED.completion_definition_id, completion_definition_version=EXCLUDED.completion_definition_version, requirements_snapshot_hash=EXCLUDED.requirements_snapshot_hash, updated_at=NOW() RETURNING *`, [completionId, learnerUserId, scopeValue.organizationId, scopeValue.tenantId, programReference, result.requirementsVersion || "unavailable", result.status, evaluatedAt, completed ? evaluatedAt : null, JSON.stringify(result.requirements), JSON.stringify(result.missingRequirements), JSON.stringify(result.evidenceReferences), JSON.stringify(result.sourceVersions), PROGRAM_COMPLETION_AUTHORITY_VERSION, hash(payload), result.completionDefinitionId || null, result.requirements ? hash(result.requirements) : null]);
      if (completed && previous.rows[0]?.status !== "COMPLETED") await this.outbox.enqueue({ producer_id: "shs-api.program-completion", event_type: "program.completed", schema_version: "1.0", subject_type: "program", subject_id: programReference, organization_id: scopeValue.organizationId, originating_actor_id: learnerUserId, originating_actor_type: "user", tenant_id: scopeValue.tenantId, occurred_at: evaluatedAt, idempotency_key: `program.completed:${completionId}`, correlation_id: `program-completion:${completionId}`, payload: { program_completion_id: completionId, learner_user_id: learnerUserId, program_reference: programReference, requirements_version: result.requirementsVersion, completion_definition_id: result.completionDefinitionId, completion_hash: hash(payload) }, destination: "agent-fabric" }, db);
      return row.rows[0];
    });
    return { programCompletionId: saved.program_completion_id, learnerUserId, programReference, requirementsVersion: result.requirementsVersion, completionDefinitionId: saved.completion_definition_id, status: saved.status, completed: saved.status === "COMPLETED", evaluatedAt: saved.evaluated_at.toISOString?.() || saved.evaluated_at, completedAt: saved.completed_at?.toISOString?.() || saved.completed_at || null, requirements: saved.requirements_json, missingRequirements: saved.missing_requirements_json, evidenceReferences: saved.evidence_references_json, sourceVersions: saved.source_versions_json, reason: result.reason };
  }
}

export const programCompletionService = new ProgramCompletionService();
