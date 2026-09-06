import { randomUUID } from "crypto";
import { withTransaction } from "../../../db/transaction.js";
import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { OrganizationRelationshipService } from "../../organization-relationships/service/organization-relationship-service.js";
import { ServiceCatalogService } from "../../service-catalog/service/service-catalog-service.js";
import { OrganizationOnboardingRepo } from "../repo/organization-onboarding-repo.js";
import {
  ONBOARDING_RELATIONSHIP_TYPES,
  ONBOARDING_STATUSES,
  OrganizationOnboardingError,
} from "../model/organization-onboarding.js";

const PROVIDER_ORGANIZATION_ID = "org_shf_001";
const AUTHORITY_FIELDS = [
  "approved",
  "status",
  "organization_id",
  "organizationId",
  "activated_organization_id",
  "activatedOrganizationId",
  "relationship_status",
  "relationshipStatus",
  "entitlement_status",
  "entitlementStatus",
  "reviewed_by",
  "reviewedBy",
  "activated_by",
  "activatedBy",
  "provider_organization_id",
  "tenant_id",
];

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

function assertNoAuthorityFields(input: any) {
  for (const field of AUTHORITY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input || {}, field)) {
      throw new OrganizationOnboardingError("SERVER_DERIVED_AUTHORITY", `${field} is server-derived.`, 400);
    }
  }
}

function normalizeServiceKeys(value: any) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || "").trim()).filter(Boolean)));
}

function normalizeDomain(website: string | null) {
  const raw = String(website || "").trim();
  if (!raw) return null;
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function orgTypeForRelationship(relationshipType: string) {
  return relationshipType === "INCUBATES" ? "SHF_INCUBATED" : "INDEPENDENT_NETWORK";
}

export class OrganizationOnboardingService {
  constructor(
    private repo = new OrganizationOnboardingRepo(),
    private relationships = new OrganizationRelationshipService(),
    private serviceCatalog = new ServiceCatalogService(),
    private auditWriter = writeAuditEvent,
  ) {}

  async listCases(actor: any) {
    this.assertReadable(actor);
    return this.repo.listCases(this.scopeFor(actor));
  }

  async getCase(caseId: string, actor: any) {
    this.assertReadable(actor);
    const found = await this.repo.getCase(caseId, this.scopeFor(actor));
    if (!found) return null;
    return { ...found, decisions: await this.repo.listDecisions(caseId) };
  }

  async submitCase(input: any, actor: any) {
    const userId = actorId(actor);
    const organizationId = activeOrganizationId(actor);
    if (!userId || !organizationId) throw new OrganizationOnboardingError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.onboarding.submit")) {
      throw new OrganizationOnboardingError("FORBIDDEN", "Onboarding submit permission is required.", 403);
    }
    assertNoAuthorityFields(input);
    const serviceKeys = normalizeServiceKeys(input?.requested_services || input?.requestedServices);
    return withTransaction(async (executor) => {
      const services = await this.requireServices(serviceKeys, executor);
      const relationshipType = this.requireRelationship(input?.requested_relationship_type || input?.requestedRelationshipType);
      const required = {
        organization_name: String(input?.organization_name || input?.organizationName || "").trim(),
        organization_type: String(input?.organization_type || input?.organizationType || orgTypeForRelationship(relationshipType)).trim(),
        primary_contact_name: String(input?.primary_contact_name || input?.primaryContactName || "").trim(),
        primary_contact_email: String(input?.primary_contact_email || input?.primaryContactEmail || "").trim(),
      };
      if (!required.organization_name || !required.primary_contact_name || !required.primary_contact_email) {
        throw new OrganizationOnboardingError("INVALID_REQUEST", "organization name and primary contact are required.", 400);
      }
      const website = String(input?.website || "").trim() || null;
      const existingOrganizationId = String(input?.existing_organization_id || input?.existingOrganizationId || "").trim() || null;
      if (existingOrganizationId && !(await this.repo.findOrganizationById(existingOrganizationId, executor))) {
        throw new OrganizationOnboardingError("ORGANIZATION_NOT_FOUND", "Existing organization was not found.", 404);
      }
      const caseId = `onb_${randomUUID()}`;
      const created = await this.repo.createCase({
        onboarding_case_id: caseId,
        existing_organization_id: existingOrganizationId,
        organization_name: required.organization_name,
        organization_type: required.organization_type,
        website,
        primary_contact_name: required.primary_contact_name,
        primary_contact_email: required.primary_contact_email,
        primary_contact_phone: input?.primary_contact_phone || input?.primaryContactPhone || null,
        geography: input?.geography || null,
        mission_description: input?.mission_description || input?.missionDescription || null,
        requested_relationship_type: relationshipType,
        submitted_by_user_id: userId,
        submitted_by_organization_id: organizationId,
      }, executor);
      await this.repo.insertRequestedServices(caseId, services.map((service) => service.service_id), executor);
      await this.recordDecision(caseId, "SUBMITTED", userId, null, ONBOARDING_STATUSES.SUBMITTED, "Onboarding case submitted.", null, null, executor);
      await this.writeAudit("organization.onboarding.submitted", created, actor, null, executor);
      const withServices = await this.repo.getCaseForUpdate(caseId, executor);
      return withServices || created;
    });
  }

  async approveCase(caseId: string, input: any, actor: any) {
    const userId = this.assertReviewAuthority(actor);
    assertNoAuthorityFields(input);
    return withTransaction(async (executor) => {
      const current = await this.requireCaseForReview(caseId, executor);
      this.assertNotSelfDecision(current, actor);
      const serviceKeys = normalizeServiceKeys(input?.approved_services || input?.approvedServices);
      const services = serviceKeys.length ? await this.requireServices(serviceKeys, executor) : current.services.map((service: any) => ({
        service_id: service.serviceId,
      }));
      const existingOrganizationId = String(input?.existing_organization_id || input?.existingOrganizationId || "").trim() || null;
      if (existingOrganizationId && !(await this.repo.findOrganizationById(existingOrganizationId, executor))) {
        throw new OrganizationOnboardingError("ORGANIZATION_NOT_FOUND", "Existing organization was not found.", 404);
      }
      await this.repo.approveRequestedServices(caseId, services.map((service: any) => service.service_id), userId, executor);
      const updated = await this.repo.updateStatus(caseId, {
        status: ONBOARDING_STATUSES.APPROVED,
        existing_organization_id: existingOrganizationId,
        reviewed_by_user_id: userId,
        decision_reason: input?.reason || "Onboarding approved.",
        applicant_feedback: input?.applicant_feedback || input?.applicantFeedback || null,
      }, executor);
      await this.recordDecision(caseId, "APPROVED", userId, current.status, ONBOARDING_STATUSES.APPROVED, input?.reason, input?.internal_notes || input?.internalNotes, input?.applicant_feedback || input?.applicantFeedback, executor);
      await this.writeAudit("organization.onboarding.approved", updated, actor, current, executor);
      return updated;
    });
  }

  async declineCase(caseId: string, input: any, actor: any) {
    const userId = this.assertReviewAuthority(actor);
    assertNoAuthorityFields(input);
    return withTransaction(async (executor) => {
      const current = await this.requireCaseForReview(caseId, executor);
      this.assertNotSelfDecision(current, actor);
      const updated = await this.repo.updateStatus(caseId, {
        status: ONBOARDING_STATUSES.DECLINED,
        reviewed_by_user_id: userId,
        decision_reason: input?.reason || "Onboarding declined.",
        applicant_feedback: input?.applicant_feedback || input?.applicantFeedback || null,
      }, executor);
      await this.recordDecision(caseId, "DECLINED", userId, current.status, ONBOARDING_STATUSES.DECLINED, input?.reason, input?.internal_notes || input?.internalNotes, input?.applicant_feedback || input?.applicantFeedback, executor);
      await this.writeAudit("organization.onboarding.declined", updated, actor, current, executor);
      return updated;
    });
  }

  async activateCase(caseId: string, input: any, actor: any) {
    const userId = this.assertActivateAuthority(actor);
    assertNoAuthorityFields(input);
    const activation = await withTransaction(async (executor) => {
      const current = await this.repo.getCaseForUpdate(caseId, executor);
      if (!current) throw new OrganizationOnboardingError("NOT_FOUND", "Onboarding case not found.", 404);
      if (current.status === ONBOARDING_STATUSES.ACTIVATED) {
        return { current, organizationId: current.activated_organization_id, relationshipId: current.activation_relationship_id, replayed: true };
      }
      if (current.status !== ONBOARDING_STATUSES.APPROVED) {
        throw new OrganizationOnboardingError("INVALID_STATUS", "Only approved onboarding cases can activate.", 409);
      }
      const organization = await this.resolveOrCreateOrganization(current, executor);
      const relationship = await this.ensureRelationship(current, organization.organization_id, actor, executor);
      return { current, organizationId: organization.organization_id, relationshipId: relationship.relationship_id, replayed: false };
    });

    if (!activation.replayed) {
      await this.provisionApprovedServices(caseId, activation.organizationId, actor);
      await withTransaction(async (executor) => {
        const current = await this.repo.getCaseForUpdate(caseId, executor);
        if (current.status === ONBOARDING_STATUSES.ACTIVATED) return current;
        const updated = await this.repo.updateStatus(caseId, {
          status: ONBOARDING_STATUSES.ACTIVATED,
          activated_organization_id: activation.organizationId,
          activation_relationship_id: activation.relationshipId,
          activated_by_user_id: userId,
        }, executor);
        await this.recordDecision(caseId, "ACTIVATED", userId, current.status, ONBOARDING_STATUSES.ACTIVATED, input?.reason || "Onboarding activated.", null, null, executor);
        await this.writeAudit("organization.onboarding.activated", updated, actor, current, executor);
        return updated;
      });
    }
    return this.repo.getCase(caseId, { organization_id: activeOrganizationId(actor), platform_global: true });
  }

  async suspendCase(caseId: string, input: any, actor: any) {
    const userId = this.assertSuspendAuthority(actor);
    assertNoAuthorityFields(input);
    return this.endNetworkAccess(caseId, ONBOARDING_STATUSES.SUSPENDED, "SUSPENDED", "organization.onboarding.suspended", userId, input, actor);
  }

  async exitCase(caseId: string, input: any, actor: any) {
    const userId = this.assertExitAuthority(actor);
    assertNoAuthorityFields(input);
    return this.endNetworkAccess(caseId, ONBOARDING_STATUSES.EXITED, "REVOKED", "organization.onboarding.exited", userId, input, actor);
  }

  private async endNetworkAccess(caseId: string, nextCaseStatus: string, nextEntitlementStatus: string, event: string, userId: string, input: any, actor: any) {
    const current = await withTransaction(async (executor) => {
      const locked = await this.repo.getCaseForUpdate(caseId, executor);
      if (!locked) throw new OrganizationOnboardingError("NOT_FOUND", "Onboarding case not found.", 404);
      if (![ONBOARDING_STATUSES.ACTIVATED, ONBOARDING_STATUSES.SUSPENDED].includes(locked.status)) {
        throw new OrganizationOnboardingError("INVALID_STATUS", "Only activated or suspended onboarding cases can transition network access.", 409);
      }
      return locked;
    });
    if (current.activation_relationship_id) {
      const relationshipStatus = nextCaseStatus === ONBOARDING_STATUSES.SUSPENDED ? "SUSPENDED" : "ENDED";
      try {
        await this.relationships.transitionRelationship(current.activation_relationship_id, relationshipStatus, actor, input?.reason);
      } catch (error: any) {
        if (!String(error?.message || "").includes(`invalid_relationship_transition:${relationshipStatus}->${relationshipStatus}`)) throw error;
      }
    }
    for (const service of current.services.filter((item: any) => item.approved && item.provisionedEntitlementId)) {
      try {
        await this.serviceCatalog.transitionEntitlement(
          current.activated_organization_id,
          service.provisionedEntitlementId,
          { status: nextEntitlementStatus, reason: input?.reason || nextCaseStatus },
          actor,
        );
      } catch (error: any) {
        if (!String(error?.message || "").includes("Unsupported entitlement status")) throw error;
      }
    }
    return withTransaction(async (executor) => {
      const locked = await this.repo.getCaseForUpdate(caseId, executor);
      const updated = await this.repo.updateStatus(caseId, {
        status: nextCaseStatus,
        suspended_by_user_id: nextCaseStatus === ONBOARDING_STATUSES.SUSPENDED ? userId : null,
        exited_by_user_id: nextCaseStatus === ONBOARDING_STATUSES.EXITED ? userId : null,
      }, executor);
      await this.recordDecision(caseId, nextCaseStatus, userId, locked.status, nextCaseStatus, input?.reason, input?.internal_notes || input?.internalNotes, input?.applicant_feedback || input?.applicantFeedback, executor);
      await this.writeAudit(event, updated, actor, locked, executor);
      return updated;
    });
  }

  private async provisionApprovedServices(caseId: string, organizationId: string, actor: any) {
    const current = await this.repo.getCase(caseId, { organization_id: activeOrganizationId(actor), platform_global: true });
    for (const service of current.services.filter((item: any) => item.approved)) {
      const result = await this.serviceCatalog.grantEntitlement(organizationId, {
        service_key: service.serviceKey,
        reason: `Phase 4 onboarding activation ${caseId}`,
      }, actor);
      await this.repo.markProvisioned(caseId, service.serviceId, result.entitlement.entitlement_id);
    }
  }

  private async resolveOrCreateOrganization(current: any, executor: any) {
    const existingId = current.existing_organization_id || current.activated_organization_id;
    if (existingId) {
      const existing = await this.repo.findOrganizationById(existingId, executor);
      if (!existing) throw new OrganizationOnboardingError("ORGANIZATION_NOT_FOUND", "Linked organization was not found.", 404);
      return existing;
    }
    const domain = normalizeDomain(current.website);
    if (domain) {
      const matched = await this.repo.findOrganizationByDomain(domain, executor);
      if (matched) return matched;
    }
    return this.repo.createOrganization({
      organization_id: `org_${current.onboarding_case_id}`,
      legal_name: current.organization_name,
      display_name: current.organization_name,
      org_type: current.organization_type || orgTypeForRelationship(current.requested_relationship_type),
      primary_domain: domain,
    }, executor);
  }

  private async ensureRelationship(current: any, organizationId: string, actor: any, executor: any) {
    const existing = await this.repo.findActiveRelationship(organizationId, PROVIDER_ORGANIZATION_ID, current.requested_relationship_type, executor);
    if (existing) return existing;
    return this.relationships.createRelationshipForOnboarding({
      source_organization_id: organizationId,
      target_organization_id: PROVIDER_ORGANIZATION_ID,
      relationship_type: current.requested_relationship_type,
      status: "ACTIVE",
      effective_from: new Date(),
      authority_context: "organization_onboarding",
    }, actor, executor);
  }

  private async requireServices(serviceKeys: string[], executor: any) {
    if (!serviceKeys.length) return [];
    const rows = await this.repo.resolveServices(serviceKeys, executor);
    const found = new Set(rows.map((row) => row.service_key));
    const missing = serviceKeys.filter((key) => !found.has(key));
    if (missing.length) throw new OrganizationOnboardingError("INVALID_SERVICE", `Unknown service: ${missing.join(", ")}`, 400);
    return rows;
  }

  private requireRelationship(value: string) {
    const relationshipType = String(value || "").trim().toUpperCase();
    if (!ONBOARDING_RELATIONSHIP_TYPES.includes(relationshipType as any)) {
      throw new OrganizationOnboardingError("INVALID_RELATIONSHIP", "Unsupported requested relationship type.", 400);
    }
    return relationshipType;
  }

  private requireCaseForReview(caseId: string, executor: any) {
    return this.repo.getCaseForUpdate(caseId, executor).then((current) => {
      if (!current) throw new OrganizationOnboardingError("NOT_FOUND", "Onboarding case not found.", 404);
      if (![ONBOARDING_STATUSES.SUBMITTED, ONBOARDING_STATUSES.UNDER_REVIEW, ONBOARDING_STATUSES.APPROVED].includes(current.status)) {
        throw new OrganizationOnboardingError("INVALID_STATUS", "Onboarding case is not reviewable.", 409);
      }
      return current;
    });
  }

  private assertReadable(actor: any) {
    if (!actorId(actor)) throw new OrganizationOnboardingError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.onboarding.view") && !actorHasPermission(actor, "organization.onboarding.submit")) {
      throw new OrganizationOnboardingError("FORBIDDEN", "Onboarding view permission is required.", 403);
    }
  }

  private assertReviewAuthority(actor: any) {
    const userId = actorId(actor);
    if (!userId) throw new OrganizationOnboardingError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.onboarding.review")) {
      throw new OrganizationOnboardingError("FORBIDDEN", "Onboarding review permission is required.", 403);
    }
    return userId;
  }

  private assertActivateAuthority(actor: any) {
    const userId = actorId(actor);
    if (!userId) throw new OrganizationOnboardingError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.onboarding.activate")) {
      throw new OrganizationOnboardingError("FORBIDDEN", "Onboarding activation permission is required.", 403);
    }
    return userId;
  }

  private assertSuspendAuthority(actor: any) {
    const userId = actorId(actor);
    if (!userId) throw new OrganizationOnboardingError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.onboarding.suspend")) {
      throw new OrganizationOnboardingError("FORBIDDEN", "Onboarding suspension permission is required.", 403);
    }
    return userId;
  }

  private assertExitAuthority(actor: any) {
    const userId = actorId(actor);
    if (!userId) throw new OrganizationOnboardingError("AUTH_REQUIRED", "Authentication required.", 401);
    if (!actorHasPermission(actor, "organization.onboarding.exit")) {
      throw new OrganizationOnboardingError("FORBIDDEN", "Onboarding exit permission is required.", 403);
    }
    return userId;
  }

  private assertNotSelfDecision(current: any, actor: any) {
    if (actorHasPlatformAuthority(actor)) return;
    if (current.submitted_by_user_id === actorId(actor) || current.submitted_by_organization_id === activeOrganizationId(actor)) {
      throw new OrganizationOnboardingError("SELF_APPROVAL_FORBIDDEN", "Applicant cannot approve or decline its own onboarding case.", 403);
    }
  }

  private scopeFor(actor: any) {
    return {
      organization_id: activeOrganizationId(actor),
      platform_global: actorHasPlatformAuthority(actor) ||
        actorHasPermission(actor, "organization.onboarding.review") ||
        actorHasPermission(actor, "organization.onboarding.activate") ||
        actorHasPermission(actor, "organization.onboarding.suspend") ||
        actorHasPermission(actor, "organization.onboarding.exit"),
    };
  }

  private async recordDecision(caseId: string, decision: string, userId: string, previousStatus: string | null, newStatus: string, reason: string | null, internalNotes: string | null, applicantFeedback: string | null, executor: any) {
    return this.repo.addDecision({
      onboarding_decision_id: `onbdec_${randomUUID()}`,
      onboarding_case_id: caseId,
      decision,
      actor_user_id: userId,
      reason,
      internal_notes: internalNotes,
      applicant_feedback: applicantFeedback,
      previous_status: previousStatus,
      new_status: newStatus,
    }, executor);
  }

  private async writeAudit(actionType: string, current: any, actor: any, previous: any, executor: any) {
    await this.auditWriter({
      audit_event_id: `audit_${randomUUID()}`,
      organization_id: activeOrganizationId(actor),
      actor_user_id: actorId(actor),
      target_object_type: "organization_onboarding_case",
      target_object_id: current.onboarding_case_id,
      action_type: actionType,
      previous_state_json: previous ? { status: previous.status, onboarding_case_id: previous.onboarding_case_id } : null,
      new_state_json: {
        status: current.status,
        onboarding_case_id: current.onboarding_case_id,
        activated_organization_id: current.activated_organization_id || null,
      },
      reason_text: current.decision_reason || "Organization onboarding changed",
      correlation_id: `corr_${randomUUID()}`,
      source_channel: "api",
    }, executor);
  }
}
