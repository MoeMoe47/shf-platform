import { createHash } from "node:crypto";
import { query } from "../../../db/client.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { definitionHash, validateDefinitionInput, type ProgramCompletionDefinition } from "../model/program-completion-definition.js";
import { ProgramCompletionDefinitionRepo } from "../repo/program-completion-definition-repo.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("completion_definition_scope_missing");
  if (!actor?.permissions?.includes("program.course.assign") && !actor?.permissions?.includes("program.update")) throw new Error("completion_definition_manage_required");
  return { userId, organizationId, tenantId };
}

function eventId(value: string) { return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32); }

export class ProgramCompletionDefinitionService {
  constructor(private repo = new ProgramCompletionDefinitionRepo(), private dbQuery: typeof query = query, private outbox = new IntegrationOutboxRepo()) {}

  private async validateReferences(input: any, organizationId: string) {
    const program = await this.dbQuery("SELECT program_id FROM programs WHERE program_id=$1 AND organization_id=$2", [input.canonicalProgramReference, organizationId]);
    if (!program.rows[0]) throw new Error("completion_definition_program_not_found");
    for (const requirement of input.requirements) {
      if (requirement.type === "LESSON_COMPLETION") {
        const curriculumId = requirement.metadata?.curriculumId;
        if (!curriculumId) throw new Error("completion_definition_curriculum_required");
        const lesson = await this.dbQuery(
          `SELECT l.lesson_id FROM curriculum_lessons l JOIN curriculum_units u ON u.unit_id=l.unit_id
           WHERE l.lesson_id=$1 AND u.organization_id=$2 AND u.course_id=$3 AND l.status='ACTIVE'`,
          [requirement.canonicalReference, organizationId, curriculumId],
        );
        if (!lesson.rows[0]) throw new Error("completion_definition_lesson_not_found");
      } else if (requirement.type === "COMPETENCY_DEMONSTRATED") {
        const competency = await this.dbQuery("SELECT competency_id FROM competency_definitions WHERE slug=$1", [requirement.canonicalReference]);
        if (!competency.rows[0]) throw new Error("completion_definition_competency_not_found");
      }
    }
  }

  async list(actor: any, programReference: string) {
    const current = scope(actor);
    return this.repo.list(current, programReference);
  }

  async createDraft(actor: any, programReference: string, raw: any) {
    const current = scope(actor);
    const input = validateDefinitionInput({ ...raw, canonicalProgramReference: programReference });
    await this.validateReferences(input, current.organizationId);
    const definition = await this.repo.insert({
      definitionId: `program_completion_definition_${eventId(`${current.organizationId}:${current.tenantId}:${programReference}:${input.version}`)}`,
      programReference,
      organizationId: current.organizationId,
      tenantId: current.tenantId,
      version: input.version,
      completionMode: input.completionMode,
      requirements: input.requirements,
      authorityReference: input.authorityReference,
      definitionHash: definitionHash(input as any),
      createdByUserId: current.userId,
    });
    await this.emit("program.completion.definition.drafted", definition, current);
    return definition;
  }

  async activate(actor: any, programReference: string, definitionId: string) {
    const current = scope(actor);
    const definition = await this.repo.findById(current, definitionId);
    if (!definition || definition.canonicalProgramReference !== programReference) throw new Error("completion_definition_not_found");
    await this.validateReferences(definition, current.organizationId);
    const activated = await this.repo.setStatus(current, definitionId, "ACTIVE", current.userId);
    if (!activated) throw new Error("completion_definition_activation_failed");
    await this.emit("program.completion.definition.activated", activated, current);
    return activated;
  }

  async retire(actor: any, programReference: string, definitionId: string) {
    const current = scope(actor);
    const definition = await this.repo.findById(current, definitionId);
    if (!definition || definition.canonicalProgramReference !== programReference) throw new Error("completion_definition_not_found");
    const retired = await this.repo.setStatus(current, definitionId, "RETIRED", current.userId);
    if (!retired) throw new Error("completion_definition_retirement_failed");
    await this.emit("program.completion.definition.retired", retired, current);
    return retired;
  }

  private async emit(eventType: string, definition: ProgramCompletionDefinition, current: { userId: string; organizationId: string; tenantId: string }) {
    await this.outbox.enqueue({
      producer_id: "shs-api.program-completion-definition",
      event_type: eventType,
      schema_version: "1.0",
      subject_type: "program-completion-definition",
      subject_id: definition.definitionId,
      organization_id: current.organizationId,
      originating_actor_id: current.userId,
      originating_actor_type: "user",
      tenant_id: current.tenantId,
      occurred_at: new Date().toISOString(),
      idempotency_key: `${eventType}:${definition.definitionId}:${definition.version}`,
      correlation_id: `program-completion-definition:${definition.definitionId}`,
      payload: { definition_id: definition.definitionId, program_reference: definition.canonicalProgramReference, version: definition.version, definition_hash: definition.definitionHash },
      destination: "agent-fabric",
    });
  }
}

export const programCompletionDefinitionService = new ProgramCompletionDefinitionService();
