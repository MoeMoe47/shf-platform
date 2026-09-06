import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { ENTITLEMENT_STATUSES, SERVICE_STATUSES } from "../../service-catalog/model/service-catalog.js";
import { ServiceCatalogRepo } from "../../service-catalog/repo/service-catalog-repo.js";
import { SERVICE_AGREEMENT_STATUSES } from "../model/service-agreement.js";
import { ServiceAgreementRepo } from "../repo/service-agreement-repo.js";

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

export class ServiceAgreementError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "ServiceAgreementError";
  }
}

export class ServiceAgreementService {
  constructor(
    private repo = new ServiceAgreementRepo(),
    private catalogRepo = new ServiceCatalogRepo(),
    private auditWriter = writeAuditEvent,
  ) {}

  async listAgreements(actor: any) {
    this.assertView(actor);
    return this.repo.listVisible(activeOrganizationId(actor), actorHasPlatformAuthority(actor));
  }

  async getAgreement(agreementId: string, actor: any) {
    this.assertView(actor);
    const agreement = await this.repo.getById(agreementId);
    if (!agreement) return null;
    this.assertAgreementReadable(agreement, actor);
    return agreement;
  }

  async listVersions(agreementId: string, actor: any) {
    const agreement = await this.getAgreement(agreementId, actor);
    if (!agreement) return null;
    return this.repo.listVersions(agreementId);
  }

  async createAgreement(input: any, actor: any) {
    const actorUserId = this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.manage")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement management permission is required.", 403);
    }
    this.rejectServerDerived(input);
    const consumerOrganizationId = String(input?.consumer_organization_id || input?.consumerOrganizationId || "").trim();
    const serviceKey = String(input?.service_key || input?.serviceKey || "").trim();
    if (!consumerOrganizationId || !serviceKey) {
      throw new ServiceAgreementError("INVALID_REQUEST", "consumerOrganizationId and serviceKey are required.", 400);
    }
    return withTransaction(async (executor) => {
      const service = await this.catalogRepo.getServiceByKey(serviceKey, executor);
      if (!service || service.status !== SERVICE_STATUSES.ACTIVE) {
        throw new ServiceAgreementError("SERVICE_NOT_AVAILABLE", "Service is not available.", 404);
      }
      this.assertProviderAuthority(service.provider_organization_id, actor, "create provider service agreements");
      const sourceRelationshipId = await this.requiredRelationshipId(consumerOrganizationId, service, executor);
      const agreement = await this.repo.createAgreement({
        agreement_id: `svcagr_${randomUUID()}`,
        provider_organization_id: service.provider_organization_id,
        consumer_organization_id: consumerOrganizationId,
        service_id: service.service_id,
        source_relationship_id: sourceRelationshipId,
        source_entitlement_id: null,
        effective_from: input?.effective_from || input?.effectiveFrom || new Date(),
        effective_until: input?.effective_until || input?.effectiveUntil || null,
        service_scope: input?.service_scope || input?.serviceScope || "",
        support_level: input?.support_level || input?.supportLevel || "",
        service_expectations: input?.service_expectations || input?.serviceExpectations || {},
        agreement_reference: input?.agreement_reference || input?.agreementReference || null,
        created_by_user_id: actorUserId,
      }, executor);
      const enriched = { ...agreement, service_key: service.service_key, service_name: service.name };
      await this.repo.createVersion({
        agreement_version_id: `svcagrv_${randomUUID()}`,
        agreement_id: agreement.agreement_id,
        version_number: 1,
        service_scope: agreement.service_scope,
        support_level: agreement.support_level,
        service_expectations: agreement.service_expectations,
        agreement_reference: agreement.agreement_reference,
        change_reason: input?.reason || "Initial service agreement terms",
        created_by_user_id: actorUserId,
      }, executor);
      await this.writeAgreementAudit("service.agreement.created", enriched, actor, null, executor, input?.reason || null);
      return enriched;
    });
  }

  async approveAgreement(agreementId: string, input: any, actor: any) {
    const actorUserId = this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.approve")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement approval permission is required.", 403);
    }
    return this.transitionWithAgreement(agreementId, actor, async (current, executor) => {
      this.assertProviderAuthority(current.provider_organization_id, actor, "approve provider service agreements");
      if (current.status === SERVICE_AGREEMENT_STATUSES.APPROVED) return { updated: current, replayed: true };
      if (current.status !== SERVICE_AGREEMENT_STATUSES.DRAFT) {
        throw new ServiceAgreementError("INVALID_STATUS", "Only draft agreements may be approved.", 409);
      }
      const updated = await this.repo.approveAgreement(agreementId, actorUserId, executor);
      await this.writeAgreementAudit("service.agreement.approved", { ...updated, service_key: current.service_key, service_name: current.service_name }, actor, current, executor, input?.reason || null);
      return { updated: { ...updated, service_key: current.service_key, service_name: current.service_name }, replayed: false };
    });
  }

  async activateAgreement(agreementId: string, input: any, actor: any) {
    const actorUserId = this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.activate")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement activation permission is required.", 403);
    }
    return this.transitionWithAgreement(agreementId, actor, async (current, executor) => {
      this.assertProviderAuthority(current.provider_organization_id, actor, "activate provider service agreements");
      if (current.status === SERVICE_AGREEMENT_STATUSES.ACTIVE) return { updated: current, replayed: true };
      if (![SERVICE_AGREEMENT_STATUSES.APPROVED, SERVICE_AGREEMENT_STATUSES.SUSPENDED].includes(current.status)) {
        throw new ServiceAgreementError("INVALID_STATUS", "Only approved or suspended agreements may be activated.", 409);
      }
      const entitlement = await this.activeEntitlement(current.consumer_organization_id, current.service_id, executor);
      const relationshipId = await this.requiredRelationshipId(current.consumer_organization_id, current, executor);
      const conflict = await this.repo.findActiveConflict({
        providerOrganizationId: current.provider_organization_id,
        consumerOrganizationId: current.consumer_organization_id,
        serviceId: current.service_id,
        excludeAgreementId: current.agreement_id,
      }, executor);
      if (conflict) throw new ServiceAgreementError("DUPLICATE_ACTIVE_AGREEMENT", "A conflicting active service agreement already exists.", 409);
      const updated = await this.repo.activateAgreement(agreementId, actorUserId, entitlement.entitlement_id, relationshipId, executor);
      await this.writeAgreementAudit("service.agreement.activated", { ...updated, service_key: current.service_key, service_name: current.service_name }, actor, current, executor, input?.reason || null);
      return { updated: { ...updated, service_key: current.service_key, service_name: current.service_name }, replayed: false };
    });
  }

  async suspendAgreement(agreementId: string, input: any, actor: any) {
    const actorUserId = this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.activate")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement activation permission is required.", 403);
    }
    return this.transitionWithAgreement(agreementId, actor, async (current, executor) => {
      this.assertProviderAuthority(current.provider_organization_id, actor, "suspend provider service agreements");
      if (current.status === SERVICE_AGREEMENT_STATUSES.SUSPENDED) return { updated: current, replayed: true };
      if (current.status !== SERVICE_AGREEMENT_STATUSES.ACTIVE) {
        throw new ServiceAgreementError("INVALID_STATUS", "Only active agreements may be suspended.", 409);
      }
      const updated = await this.repo.suspendAgreement(agreementId, actorUserId, executor);
      await this.writeAgreementAudit("service.agreement.suspended", { ...updated, service_key: current.service_key, service_name: current.service_name }, actor, current, executor, input?.reason || null);
      return { updated: { ...updated, service_key: current.service_key, service_name: current.service_name }, replayed: false };
    });
  }

  async terminateAgreement(agreementId: string, input: any, actor: any) {
    const actorUserId = this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.activate")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement activation permission is required.", 403);
    }
    return this.transitionWithAgreement(agreementId, actor, async (current, executor) => {
      this.assertProviderAuthority(current.provider_organization_id, actor, "terminate provider service agreements");
      if (current.status === SERVICE_AGREEMENT_STATUSES.TERMINATED) return { updated: current, replayed: true };
      const updated = await this.repo.terminateAgreement(agreementId, actorUserId, input?.reason || null, executor);
      await this.writeAgreementAudit("service.agreement.terminated", { ...updated, service_key: current.service_key, service_name: current.service_name }, actor, current, executor, input?.reason || null);
      return { updated: { ...updated, service_key: current.service_key, service_name: current.service_name }, replayed: false };
    });
  }

  async amendAgreement(agreementId: string, input: any, actor: any) {
    const actorUserId = this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.manage")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement management permission is required.", 403);
    }
    this.rejectServerDerived(input);
    return this.transitionWithAgreement(agreementId, actor, async (current, executor) => {
      this.assertProviderAuthority(current.provider_organization_id, actor, "amend provider service agreements");
      if (current.status === SERVICE_AGREEMENT_STATUSES.TERMINATED) {
        throw new ServiceAgreementError("INVALID_STATUS", "Terminated agreements cannot be amended.", 409);
      }
      const nextInput = {
        service_scope: input?.service_scope || input?.serviceScope || current.service_scope,
        support_level: input?.support_level || input?.supportLevel || current.support_level,
        service_expectations: input?.service_expectations || input?.serviceExpectations || current.service_expectations || {},
        agreement_reference: input?.agreement_reference || input?.agreementReference || current.agreement_reference || null,
      };
      const updated = await this.repo.amendAgreement(agreementId, nextInput, actorUserId, executor);
      await this.repo.createVersion({
        agreement_version_id: `svcagrv_${randomUUID()}`,
        agreement_id: agreementId,
        version_number: updated.current_version,
        ...nextInput,
        change_reason: input?.reason || null,
        created_by_user_id: actorUserId,
      }, executor);
      await this.writeAgreementAudit("service.agreement.amended", { ...updated, service_key: current.service_key, service_name: current.service_name }, actor, current, executor, input?.reason || null);
      return { updated: { ...updated, service_key: current.service_key, service_name: current.service_name }, replayed: false };
    });
  }

  private async transitionWithAgreement(agreementId: string, actor: any, fn: (agreement: any, executor: any) => Promise<{ updated: any; replayed: boolean }>) {
    return withTransaction(async (executor) => {
      const agreement = await this.repo.getById(String(agreementId || "").trim(), executor);
      if (!agreement) return null;
      this.assertAgreementReadable(agreement, actor);
      return fn(agreement, executor);
    });
  }

  private async activeEntitlement(organizationId: string, serviceId: string, executor: any) {
    const current = await this.catalogRepo.findCurrentEntitlement(organizationId, serviceId, executor);
    if (!current || current.status !== ENTITLEMENT_STATUSES.ACTIVE) {
      throw new ServiceAgreementError("ENTITLEMENT_REQUIRED", "An active matching service entitlement is required before activation.", 403);
    }
    const now = new Date();
    if (new Date(current.effective_from) > now || (current.effective_until && new Date(current.effective_until) < now)) {
      throw new ServiceAgreementError("ENTITLEMENT_REQUIRED", "The matching service entitlement is not currently effective.", 403);
    }
    return current;
  }

  private async requiredRelationshipId(consumerOrganizationId: string, service: any, executor: any) {
    if (consumerOrganizationId === service.provider_organization_id || !service.requires_relationship_type) return null;
    const relationship = await this.catalogRepo.findActiveRelationship(
      consumerOrganizationId,
      service.provider_organization_id,
      service.requires_relationship_type,
      new Date(),
      executor,
    );
    if (!relationship) {
      throw new ServiceAgreementError("RELATIONSHIP_REQUIRED", "An active eligible organization relationship is required.", 403);
    }
    return relationship.relationship_id;
  }

  private assertProviderAuthority(providerOrganizationId: string, actor: any, action: string) {
    if (!actorHasPlatformAuthority(actor) && activeOrganizationId(actor) !== providerOrganizationId) {
      throw new ServiceAgreementError("FORBIDDEN", `Only the service provider or platform authority may ${action}.`, 403);
    }
  }

  private assertAgreementReadable(agreement: any, actor: any) {
    if (actorHasPlatformAuthority(actor)) return;
    const orgId = activeOrganizationId(actor);
    if (orgId !== agreement.provider_organization_id && orgId !== agreement.consumer_organization_id) {
      throw new ServiceAgreementError("FORBIDDEN", "Cannot read another organization's service agreement.", 403);
    }
  }

  private assertView(actor: any) {
    this.requireActor(actor);
    if (!actorHasPermission(actor, "service.agreement.view") && !actorHasPermission(actor, "organization.service_entitlement.view")) {
      throw new ServiceAgreementError("FORBIDDEN", "Service agreement view permission is required.", 403);
    }
  }

  private requireActor(actor: any) {
    const id = actorId(actor);
    if (!id) throw new ServiceAgreementError("AUTH_REQUIRED", "Authentication required.", 401);
    return id;
  }

  private rejectServerDerived(input: any) {
    for (const key of ["approved_by", "approvedByUserId", "activated_by", "activatedByUserId", "provider_organization_id", "providerOrganizationId", "actor_user_id", "actorUserId"]) {
      if (key in (input || {})) {
        throw new ServiceAgreementError("SERVER_DERIVED_AUTHORITY", `${key} is server-derived.`, 400);
      }
    }
  }

  private async writeAgreementAudit(actionType: string, agreement: any, actor: any, previous: any, executor: any, reason: string | null) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: agreement.consumer_organization_id,
      actor_user_id: actorId(actor),
      target_object_type: "service_agreement",
      target_object_id: agreement.agreement_id,
      action_type: actionType,
      previous_state_json: previous ? {
        status: previous.status,
        service_id: previous.service_id,
        current_version: previous.current_version,
      } : null,
      new_state_json: {
        status: agreement.status,
        service_id: agreement.service_id,
        provider_organization_id: agreement.provider_organization_id,
        consumer_organization_id: agreement.consumer_organization_id,
        current_version: agreement.current_version,
      },
      reason_text: reason || "Service agreement changed",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    }, executor);
  }
}
