import { randomUUID } from "crypto";
import { isPlatformGlobalRole } from "../../../auth/security-permissions";
import {
  ORGANIZATION_RELATIONSHIP_STATUSES,
  ORGANIZATION_RELATIONSHIP_TYPES,
  canTransitionRelationship,
  isRelationshipCurrentlyActive,
  validateRelationshipLifecycle,
} from "../model/organization-relationship";
import { OrganizationRelationshipRepo } from "../repo/organization-relationship-repo";
import { writeAuditEvent } from "../../audit/service/audit-helper";

function actorId(actor: any) {
  return actor?.user_id || actor?.id;
}

function activeOrganizationId(actor: any) {
  return actor?.active_organization_id || actor?.organization_id;
}

function actorHasPermission(actor: any, permission: string) {
  return Array.isArray(actor?.permissions) && actor.permissions.includes(permission);
}

function actorHasPlatformAuthority(actor: any) {
  const roles = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
  return roles.some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
}

export class OrganizationRelationshipService {
  constructor(
    private repo = new OrganizationRelationshipRepo(),
    private auditWriter = writeAuditEvent,
  ) {}

  private scopeFor(actor: any) {
    const organizationId = activeOrganizationId(actor);
    if (!actorId(actor) || !organizationId) throw new Error("relationship_scope_missing");
    return { organization_id: organizationId, platform_global: actorHasPlatformAuthority(actor) };
  }

  async listRelationships(actor: any) {
    const scope = this.scopeFor(actor);
    if (!actorHasPermission(actor, "organization.relationship.view") && !actorHasPermission(actor, "organization.manage")) {
      throw new Error("relationship_permission_required");
    }
    return this.repo.listRelationshipsForOrganization(scope.organization_id);
  }

  async getRelationship(relationshipId: string, actor: any) {
    const scope = this.scopeFor(actor);
    if (!actorHasPermission(actor, "organization.relationship.view") && !actorHasPermission(actor, "organization.manage")) {
      throw new Error("relationship_permission_required");
    }
    return this.repo.getRelationshipById(relationshipId, scope);
  }

  async createRelationship(input: any, actor: any) {
    const scope = this.scopeFor(actor);
    const organizationId = scope.organization_id;
    const userId = actorId(actor);
    if (!actorHasPermission(actor, "organization.relationship.manage") && !actorHasPermission(actor, "organization.manage")) {
      throw new Error("relationship_permission_required");
    }

    validateRelationshipLifecycle({
      relationship_type: input?.relationship_type,
      status: input?.status || ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED,
      effective_from: input?.effective_from,
      effective_to: input?.effective_to,
    });

    const sourceOrganizationId = String(input?.source_organization_id || "").trim();
    const targetOrganizationId = String(input?.target_organization_id || "").trim();
    if (!sourceOrganizationId || !targetOrganizationId) throw new Error("relationship_organizations_required");
    if (!actorHasPlatformAuthority(actor) && sourceOrganizationId !== organizationId) {
      throw new Error("relationship_source_forbidden");
    }

    return this.repo.createRelationship({
      relationship_id: `orgrel_${randomUUID()}`,
      source_organization_id: sourceOrganizationId,
      target_organization_id: targetOrganizationId,
      relationship_type: input.relationship_type,
      status: input.status || ORGANIZATION_RELATIONSHIP_STATUSES.PROPOSED,
      effective_from: input.effective_from || new Date(),
      effective_to: input.effective_to || null,
      created_by: userId,
      updated_by: userId,
      metadata_version: 1,
    });
  }

  async transitionRelationship(relationshipId: string, nextStatus: string, actor: any, reasonText?: string) {
    const scope = this.scopeFor(actor);
    const userId = actorId(actor);
    if (!actorHasPermission(actor, "organization.relationship.manage") && !actorHasPermission(actor, "organization.manage")) {
      throw new Error("relationship_permission_required");
    }
    if (!isKnownStatus(nextStatus)) throw new Error("unknown_relationship_status");

    const current = await this.repo.getRelationshipById(relationshipId, scope);
    if (!current) return null;
    validateRelationshipLifecycle(current);
    if (!canTransitionRelationship(current.status, nextStatus)) {
      throw new Error(`invalid_relationship_transition:${current.status}->${nextStatus}`);
    }

    const updated = await this.repo.updateRelationshipStatus(relationshipId, nextStatus, current.status, userId, scope);
    if (!updated) {
      const error: any = new Error("relationship_transition_conflict");
      error.statusCode = 409;
      throw error;
    }

    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: scope.organization_id,
      actor_user_id: userId,
      target_object_type: "organization_relationship",
      target_object_id: relationshipId,
      action_type: "organization_relationship.transitioned",
      previous_state_json: {
        relationship_id: relationshipId,
        status: current.status,
        organization_id: scope.organization_id,
        tenant_id: actor?.tenant_id || null,
      },
      new_state_json: {
        relationship_id: relationshipId,
        status: updated.status,
        organization_id: scope.organization_id,
        tenant_id: actor?.tenant_id || null,
      },
      reason_text: reasonText || "Organization relationship transitioned",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    });
    return updated;
  }

  async hasActiveRelationship(sourceOrganizationId: string, targetOrganizationId: string, relationshipType: string, now = new Date()) {
    const relationship = await this.repo.findActiveRelationship(sourceOrganizationId, targetOrganizationId, relationshipType, now);
    return relationship ? isRelationshipCurrentlyActive(relationship, now) : false;
  }
}

export { ORGANIZATION_RELATIONSHIP_TYPES, ORGANIZATION_RELATIONSHIP_STATUSES };

function isKnownStatus(value: string) {
  return Object.values(ORGANIZATION_RELATIONSHIP_STATUSES).includes(value as any);
}
