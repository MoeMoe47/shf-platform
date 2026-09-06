import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { ServiceAgreementRepo } from "../../service-agreements/repo/service-agreement-repo.js";
import { ServiceCatalogRepo } from "../repo/service-catalog-repo.js";
import { AGREEMENT_REQUIREMENTS, ENTITLEMENT_RESULTS, ENTITLEMENT_STATUSES, SERVICE_STATUSES } from "../model/service-catalog.js";

function actorId(actor: any) {
  return String(actor?.user_id || actor?.id || actor?.actor_user_id || "").trim();
}

function activeOrganizationId(actor: any) {
  return String(actor?.active_organization_id || actor?.organization_id || "").trim();
}

function actorHasPermission(actor: any, permission: string) {
  return Array.isArray(actor?.permissions) && actor.permissions.includes(permission);
}

function actorHasPlatformAuthority(actor: any) {
  const roles = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
  return roles.some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
}

export class ServiceEntitlementError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "ServiceEntitlementError";
  }
}

export class ServiceCatalogService {
  constructor(
    private repo = new ServiceCatalogRepo(),
    private auditWriter = writeAuditEvent,
    private agreementRepo = new ServiceAgreementRepo(),
  ) {}

  async listServices(actor: any, includeInactive = false) {
    this.assertReadable(actor);
    return this.repo.listServices(includeInactive && this.canManage(actor));
  }

  async listEntitlements(organizationId: string, actor: any) {
    this.assertOrganizationReadable(organizationId, actor);
    return this.repo.listEntitlementsForOrganization(organizationId);
  }

  async evaluateOrganizationServiceEntitlement(input: { organizationId: string; serviceKey: string; now?: Date }) {
    const organizationId = String(input.organizationId || "").trim();
    const serviceKey = String(input.serviceKey || "").trim();
    if (!organizationId || !serviceKey) {
      return { result: ENTITLEMENT_RESULTS.DENIED_NO_ENTITLEMENT, allowed: false, entitlement: null, service: null };
    }
    const now = input.now || new Date();
    const row = await this.repo.findActiveEntitlementByKey(organizationId, serviceKey, now);
    if (!row?.service_key) {
      return { result: ENTITLEMENT_RESULTS.DENIED_NO_ENTITLEMENT, allowed: false, entitlement: null, service: null };
    }
    if (row.service_status !== SERVICE_STATUSES.ACTIVE) {
      return { result: ENTITLEMENT_RESULTS.DENIED_SERVICE_INACTIVE, allowed: false, entitlement: row, service: row };
    }
    if (row.provider_organization_id === organizationId) {
      return { result: ENTITLEMENT_RESULTS.ALLOWED, allowed: true, entitlement: row.entitlement_id ? row : null, service: row };
    }
    if (!row.entitlement_id) {
      return { result: ENTITLEMENT_RESULTS.DENIED_NO_ENTITLEMENT, allowed: false, entitlement: null, service: row };
    }
    if (row.status === ENTITLEMENT_STATUSES.SUSPENDED) {
      return { result: ENTITLEMENT_RESULTS.DENIED_SUSPENDED, allowed: false, entitlement: row, service: row };
    }
    if (row.status === ENTITLEMENT_STATUSES.REVOKED) {
      return { result: ENTITLEMENT_RESULTS.DENIED_REVOKED, allowed: false, entitlement: row, service: row };
    }
    if (row.status === ENTITLEMENT_STATUSES.EXPIRED || (row.effective_until && new Date(row.effective_until) < now)) {
      return { result: ENTITLEMENT_RESULTS.DENIED_EXPIRED, allowed: false, entitlement: row, service: row };
    }
    if (row.status !== ENTITLEMENT_STATUSES.ACTIVE || new Date(row.effective_from) > now) {
      return { result: ENTITLEMENT_RESULTS.DENIED_NO_ENTITLEMENT, allowed: false, entitlement: row, service: row };
    }
    if (row.requires_relationship_type) {
      const relationship = await this.repo.findActiveRelationship(organizationId, row.provider_organization_id, row.requires_relationship_type, now);
      if (!relationship) {
        return { result: ENTITLEMENT_RESULTS.DENIED_RELATIONSHIP_REQUIRED, allowed: false, entitlement: row, service: row };
      }
    }
    if (row.agreement_requirement === AGREEMENT_REQUIREMENTS.AGREEMENT_REQUIRED) {
      const agreement = await this.agreementRepo.getLatestAgreementForService({
        providerOrganizationId: row.provider_organization_id,
        consumerOrganizationId: organizationId,
        serviceId: row.service_id,
        now,
      });
      if (!agreement) {
        return { result: ENTITLEMENT_RESULTS.DENIED_AGREEMENT_REQUIRED, allowed: false, entitlement: row, service: row };
      }
      if (agreement.status === "SUSPENDED") {
        return { result: ENTITLEMENT_RESULTS.DENIED_AGREEMENT_SUSPENDED, allowed: false, entitlement: row, service: row, agreement };
      }
      if (agreement.status === "TERMINATED") {
        return { result: ENTITLEMENT_RESULTS.DENIED_AGREEMENT_TERMINATED, allowed: false, entitlement: row, service: row, agreement };
      }
      if (agreement.status === "EXPIRED" || (agreement.effective_until && new Date(agreement.effective_until) < now)) {
        return { result: ENTITLEMENT_RESULTS.DENIED_AGREEMENT_EXPIRED, allowed: false, entitlement: row, service: row, agreement };
      }
      if (agreement.status !== "ACTIVE") {
        return { result: ENTITLEMENT_RESULTS.DENIED_AGREEMENT_REQUIRED, allowed: false, entitlement: row, service: row, agreement };
      }
    }
    return { result: ENTITLEMENT_RESULTS.ALLOWED, allowed: true, entitlement: row, service: row };
  }

  async grantEntitlement(organizationId: string, input: any, actor: any) {
    const actorUserId = actorId(actor);
    if (!actorUserId) throw new ServiceEntitlementError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!this.canManage(actor)) throw new ServiceEntitlementError("FORBIDDEN", "Service entitlement management permission is required.", 403);
    const targetOrganizationId = String(organizationId || "").trim();
    const serviceKey = String(input?.service_key || input?.serviceKey || "").trim();
    if (!targetOrganizationId || !serviceKey) throw new ServiceEntitlementError("INVALID_REQUEST", "organizationId and serviceKey are required.", 400);
    if ("granted_by" in (input || {}) || "grantedByUserId" in (input || {})) {
      throw new ServiceEntitlementError("SERVER_DERIVED_AUTHORITY", "granted_by is server-derived.", 400);
    }
    return withTransaction(async (executor) => {
      const service = await this.repo.getServiceByKey(serviceKey, executor);
      if (!service || service.status !== SERVICE_STATUSES.ACTIVE) {
        throw new ServiceEntitlementError("SERVICE_NOT_AVAILABLE", "Service is not available.", 404);
      }
      if (!actorHasPlatformAuthority(actor) && activeOrganizationId(actor) !== service.provider_organization_id) {
        throw new ServiceEntitlementError("FORBIDDEN", "Only the service provider or platform authority may grant this entitlement.", 403);
      }
      const current = await this.repo.findCurrentEntitlement(targetOrganizationId, service.service_id, executor);
      if (current?.status === ENTITLEMENT_STATUSES.ACTIVE) return { entitlement: current, replayed: true };

      let sourceRelationshipId: string | null = null;
      if (targetOrganizationId !== service.provider_organization_id && service.requires_relationship_type) {
        const relationship = await this.repo.findActiveRelationship(targetOrganizationId, service.provider_organization_id, service.requires_relationship_type, new Date(), executor);
        if (!relationship) {
          throw new ServiceEntitlementError("RELATIONSHIP_REQUIRED", "An active eligible organization relationship is required before granting this service.", 403);
        }
        sourceRelationshipId = relationship.relationship_id;
      }
      if (current?.status === ENTITLEMENT_STATUSES.SUSPENDED) {
        const updated = await this.repo.updateEntitlementStatus(current.entitlement_id, ENTITLEMENT_STATUSES.ACTIVE, actorUserId, input?.reason || null, executor);
        await this.writeEntitlementAudit("organization.service_entitlement.granted", updated, actor, current, executor);
        return { entitlement: updated, replayed: false };
      }
      const entitlement = await this.repo.createEntitlement({
        entitlement_id: `orgsvc_${randomUUID()}`,
        organization_id: targetOrganizationId,
        service_id: service.service_id,
        granted_by_user_id: actorUserId,
        effective_from: input?.effective_from || input?.effectiveFrom || new Date(),
        effective_until: input?.effective_until || input?.effectiveUntil || null,
        reason: input?.reason || null,
        source_relationship_id: sourceRelationshipId,
      }, executor);
      const enriched = { ...entitlement, service_key: service.service_key, service_name: service.name, provider_organization_id: service.provider_organization_id };
      await this.writeEntitlementAudit("organization.service_entitlement.granted", enriched, actor, null, executor);
      return { entitlement: enriched, replayed: false };
    });
  }

  async transitionEntitlement(organizationId: string, entitlementId: string, input: any, actor: any) {
    const actorUserId = actorId(actor);
    if (!actorUserId) throw new ServiceEntitlementError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!this.canManage(actor)) throw new ServiceEntitlementError("FORBIDDEN", "Service entitlement management permission is required.", 403);
    const nextStatus = String(input?.status || input?.next_status || input?.nextStatus || "").trim().toUpperCase();
    if (![ENTITLEMENT_STATUSES.ACTIVE, ENTITLEMENT_STATUSES.SUSPENDED, ENTITLEMENT_STATUSES.REVOKED].includes(nextStatus as any)) {
      throw new ServiceEntitlementError("INVALID_STATUS", "Unsupported entitlement status.", 400);
    }
    return withTransaction(async (executor) => {
      const rows = await executor.query(
        `SELECT e.*, s.service_key, s.name AS service_name, s.provider_organization_id
         FROM organization_service_entitlements e
         JOIN service_catalog s ON s.service_id = e.service_id
         WHERE e.entitlement_id = $1 AND e.organization_id = $2
         LIMIT 1`,
        [entitlementId, organizationId],
      );
      const current = rows.rows[0];
      if (!current) return null;
      if (!actorHasPlatformAuthority(actor) && activeOrganizationId(actor) !== current.provider_organization_id) {
        throw new ServiceEntitlementError("FORBIDDEN", "Only the service provider or platform authority may change this entitlement.", 403);
      }
      if (current.status === nextStatus) return { entitlement: current, replayed: true };
      const updated = await this.repo.updateEntitlementStatus(entitlementId, nextStatus, actorUserId, input?.reason || null, executor);
      const enriched = { ...updated, service_key: current.service_key, service_name: current.service_name, provider_organization_id: current.provider_organization_id };
      const event = nextStatus === ENTITLEMENT_STATUSES.SUSPENDED
        ? "organization.service_entitlement.suspended"
        : nextStatus === ENTITLEMENT_STATUSES.REVOKED
          ? "organization.service_entitlement.revoked"
          : "organization.service_entitlement.granted";
      await this.writeEntitlementAudit(event, enriched, actor, current, executor);
      return { entitlement: enriched, replayed: false };
    });
  }

  private assertReadable(actor: any) {
    if (!actorId(actor)) throw new ServiceEntitlementError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.service_entitlement.view") && !actorHasPermission(actor, "organization.view")) {
      throw new ServiceEntitlementError("FORBIDDEN", "Service catalog view permission is required.", 403);
    }
  }

  private assertOrganizationReadable(organizationId: string, actor: any) {
    this.assertReadable(actor);
    if (!actorHasPlatformAuthority(actor) && !this.canManage(actor) && activeOrganizationId(actor) !== organizationId) {
      throw new ServiceEntitlementError("FORBIDDEN", "Cannot read another organization's service entitlements.", 403);
    }
  }

  private canManage(actor: any) {
    return actorHasPermission(actor, "organization.service_entitlement.manage");
  }

  private async writeEntitlementAudit(actionType: string, entitlement: any, actor: any, previous: any, executor: any) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: entitlement.organization_id,
      actor_user_id: actorId(actor),
      target_object_type: "organization_service_entitlement",
      target_object_id: entitlement.entitlement_id,
      action_type: actionType,
      previous_state_json: previous ? { status: previous.status, service_id: previous.service_id, organization_id: previous.organization_id } : null,
      new_state_json: { status: entitlement.status, service_id: entitlement.service_id, organization_id: entitlement.organization_id },
      reason_text: entitlement.reason || "Organization service entitlement changed",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    }, executor);
  }
}
