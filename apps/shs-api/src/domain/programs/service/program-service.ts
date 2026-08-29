import { randomUUID } from "crypto";
import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
import { ORGANIZATION_RELATIONSHIP_TYPES, OrganizationRelationshipService } from "../../organization-relationships/service/organization-relationship-service.js";
import { ProgramRepo } from "../repo/program-repo.js";
import { canTransitionProgram } from "./program-transitions.js";
import { normalizeProgramStewardship, PROGRAM_CLASSIFICATIONS } from "../model/program-stewardship.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";

export class ProgramService {
  constructor(
    private repo = new ProgramRepo(),
    private relationships = new OrganizationRelationshipService(),
    private auditWriter = writeAuditEvent,
  ) {}

  private scopeFromActor(actor: any) {
    const organizationId = actor?.active_organization_id || actor?.organization_id;
    if (!actor?.user_id && !actor?.id) throw new Error("Actor is required");
    if (!organizationId) throw new Error("Active organization is required");
    return { organization_id: organizationId };
  }

  private isPlatformActor(actor: any) {
    const roles = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
    return roles.some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
  }

  private async validateStewardship(input: any, actor: any) {
    const scope = this.scopeFromActor(actor);
    const stewardship = normalizeProgramStewardship(input, scope.organization_id);
    if (this.isPlatformActor(actor)) return stewardship;

    if (stewardship.owner_organization_id !== scope.organization_id) {
      throw new Error("program_owner_scope_forbidden");
    }

    if (stewardship.program_classification === PROGRAM_CLASSIFICATIONS.INDEPENDENT_NETWORK &&
        stewardship.owner_organization_id !== stewardship.operator_organization_id) {
      throw new Error("independent_network_owner_operator_mismatch");
    }

    if (stewardship.operator_organization_id !== stewardship.owner_organization_id) {
      const operatesFor = await this.relationships.hasActiveRelationship(
        stewardship.operator_organization_id,
        stewardship.owner_organization_id,
        ORGANIZATION_RELATIONSHIP_TYPES.OPERATES_FOR,
      );
      const incubates = stewardship.program_classification === PROGRAM_CLASSIFICATIONS.SHF_INCUBATED
        ? await this.relationships.hasActiveRelationship(
          stewardship.owner_organization_id,
          stewardship.operator_organization_id,
          ORGANIZATION_RELATIONSHIP_TYPES.INCUBATES,
        )
        : false;
      if (!operatesFor && !incubates) throw new Error("program_operator_relationship_required");
    }

    if (![stewardship.owner_organization_id, stewardship.operator_organization_id].includes(stewardship.accountable_organization_id)) {
      throw new Error("program_accountable_scope_forbidden");
    }

    return stewardship;
  }

  async listPrograms(actor: any) {
    return this.repo.listPrograms(this.scopeFromActor(actor));
  }

  async getProgram(programId: string, actor: any) {
    return this.repo.getProgramById(programId, this.scopeFromActor(actor));
  }

  async createProgram(input: any, actor?: any) {
    if (!input?.name) throw new Error("Program name is required");
    if (!input?.program_type) throw new Error("Program type is required");
    const scope = this.scopeFromActor(actor);
    const stewardship = await this.validateStewardship(input, actor);

    return this.repo.createProgram({
      ...input,
      program_id: `prog_${randomUUID()}`,
      ...stewardship,
      organization_id: stewardship.accountable_organization_id || scope.organization_id,
      status: "draft",
      created_by_user_id: actor?.user_id || actor?.id || null,
    });
  }

  async transitionProgram(programId: string, nextStatus: string, actor?: any, reasonText?: string) {
    const scope = this.scopeFromActor(actor);
    const current = await this.repo.getProgramForTransition(programId, scope);
    if (!current) throw new Error("Program not found");

    if (!canTransitionProgram(current.status, nextStatus)) {
      throw new Error(`Invalid program transition: ${current.status} -> ${nextStatus}`);
    }

    const updated = await this.repo.updateProgramStatus(programId, nextStatus, scope, current.status);
    if (!updated) {
      const error: any = new Error("program_transition_conflict");
      error.statusCode = 409;
      throw error;
    }

    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: updated.accountable_organization_id || updated.organization_id,
      actor_user_id: actor?.user_id || actor?.id || null,
      target_object_type: "program",
      target_object_id: programId,
      action_type: "program.transitioned",
      previous_state_json: {
        program_id: programId,
        status: current.status,
        organization_id: updated.accountable_organization_id || updated.organization_id,
        tenant_id: actor?.tenant_id || null,
      },
      new_state_json: {
        program_id: programId,
        status: updated.status,
        organization_id: updated.accountable_organization_id || updated.organization_id,
        tenant_id: actor?.tenant_id || null,
      },
      reason_text: reasonText || "Program transitioned",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    });
    return updated;
  }

  async listTaxonomy() {
    return this.repo.listTaxonomy();
  }
}
