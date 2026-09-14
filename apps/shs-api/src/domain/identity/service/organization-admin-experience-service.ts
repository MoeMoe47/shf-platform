import { isPlatformGlobalRole, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IdentityService } from "./identity-service.js";
import { MembershipService } from "./membership-service.js";
import { ServiceCatalogService } from "../../service-catalog/service/service-catalog-service.js";
import { OrganizationRelationshipService } from "../../organization-relationships/service/organization-relationship-service.js";
import { toEntitlementResponse, toServiceCatalogResponse } from "../../service-catalog/model/service-catalog.js";
import { toOrganizationRelationshipResponse } from "../../organization-relationships/model/organization-relationship.js";

function actorOrganizationId(actor: any) {
  return String(actor?.active_organization_id || actor?.organization_id || "").trim();
}

function actorRoles(actor: any) {
  return Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
}

function actorHasPermission(actor: any, permission: string) {
  return Array.isArray(actor?.permissions) && actor.permissions.includes(permission);
}

function actorHasPlatformAuthority(actor: any) {
  return actorRoles(actor).some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
}

function requireActiveOrganization(actor: any) {
  const organizationId = actorOrganizationId(actor);
  if (!organizationId) throw new OrganizationAdminExperienceError("ORG_CONTEXT_REQUIRED", "Active organization context is required.", 403);
  return organizationId;
}

function safeOrganizationProfile(organization: any, activeOrganizationId: string) {
  return {
    organization_id: organization?.organization_id || activeOrganizationId,
    display_name: organization?.display_name || organization?.organization_name || organization?.legal_name || activeOrganizationId,
    legal_name: organization?.legal_name || organization?.organization_name || null,
    organization_type: organization?.org_type || organization?.source_system_type || null,
    status: organization?.status || organization?.active_status || "active",
    website: organization?.website || null,
    geography: organization?.geography || null,
    mission: organization?.mission || organization?.eligibility_notes || null,
    onboarding_status: organization?.onboarding_status || null,
  };
}

function serviceState(service: any, entitlement: any) {
  if (!entitlement) return "AVAILABLE_FOR_DISCOVERY";
  return String(entitlement.status || "PENDING").toUpperCase();
}

function serviceActionFor(state: string) {
  if (state === "ACTIVE") return "OPEN_WHERE_PERMISSIONED";
  if (state === "AVAILABLE_FOR_DISCOVERY") return "REQUEST_OR_CONTACT_SUPPORT";
  if (state === "PENDING") return "WAIT_FOR_APPROVAL";
  return "CONTACT_SUPPORT";
}

function memberStatus(member: any) {
  return String(member?.status || "unknown").toLowerCase();
}

export class OrganizationAdminExperienceError extends Error {
  constructor(public readonly code: string, message = code, public readonly statusCode = 400) {
    super(message);
    this.name = "OrganizationAdminExperienceError";
  }
}

export class OrganizationAdminExperienceService {
  constructor(
    private readonly identity = new IdentityService(),
    private readonly memberships = new MembershipService(),
    private readonly serviceCatalog = new ServiceCatalogService(),
    private readonly relationships = new OrganizationRelationshipService(),
  ) {}

  assertCanReadOrganization(actor: any, organizationId: string) {
    const activeOrganizationId = requireActiveOrganization(actor);
    if (!actorHasPermission(actor, SHS_SECURITY_PERMISSIONS.ORGANIZATION_VIEW)) {
      throw new OrganizationAdminExperienceError("FORBIDDEN", "Organization view permission is required.", 403);
    }
    if (!actorHasPlatformAuthority(actor) && organizationId !== activeOrganizationId) {
      throw new OrganizationAdminExperienceError("FORBIDDEN", "Cannot read another organization's administration context.", 403);
    }
  }

  async getOverview(actor: any) {
    const activeOrganizationId = requireActiveOrganization(actor);
    this.assertCanReadOrganization(actor, activeOrganizationId);

    const [organization, members, catalog, entitlements, relationshipRows] = await Promise.all([
      this.identity.getOrganizationById(activeOrganizationId),
      this.memberships.list(actor, activeOrganizationId),
      this.safeServiceCatalog(actor),
      this.safeEntitlements(activeOrganizationId, actor),
      this.safeRelationships(actor),
    ]);
    const organizationRecord: any = organization || {};

    const entitlementByServiceKey = new Map(
      entitlements.map((item: any) => [item.serviceKey || item.service_key, item])
    );
    const services = catalog.map((service: any) => {
      const entitlement = entitlementByServiceKey.get(service.serviceKey || service.service_key);
      const state = serviceState(service, entitlement);
      return {
        service_key: service.serviceKey || service.service_key,
        service_name: service.name || service.serviceName || service.service_name,
        status: state,
        catalog_status: service.status || null,
        entitlement_id: entitlement?.entitlementId || entitlement?.entitlement_id || null,
        effective_until: entitlement?.effectiveUntil || entitlement?.effective_until || null,
        actionable: state === "ACTIVE",
        next_action: serviceActionFor(state),
        authority: "service_catalog_projection",
      };
    });

    return {
      authority: "organization_admin_experience_projection",
      organization: safeOrganizationProfile(organizationRecord, activeOrganizationId),
      context: {
        active_organization_id: activeOrganizationId,
        actor_user_id: actor?.user_id || actor?.id || null,
        actor_roles: actorRoles(actor),
        actor_permissions: Array.isArray(actor?.permissions) ? actor.permissions : [],
        organization_status: actor?.organization_status || organizationRecord.status || organizationRecord.active_status || "active",
        membership_status: actor?.membership_status || "active",
        platform_authority: actorHasPlatformAuthority(actor),
      },
      members: members.map((member: any) => ({
        membership_id: member.membership_id,
        user_id: member.user_id,
        organization_id: member.organization_id,
        status: memberStatus(member),
        role_id: member.role_id,
        role_name: member.role_name || null,
        effective_from: member.effective_from || null,
        effective_to: member.effective_to || null,
        actions: {
          can_change_role: actorHasPermission(actor, SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_ASSIGN) && memberStatus(member) === "active",
          can_revoke: actorHasPermission(actor, SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_REVOKE) && memberStatus(member) === "active",
        },
      })),
      roles: {
        policy: "ioh3_target_role_policy",
        org_admin_assignable_role_names: [
          "operator",
          "program_manager",
          "reviewer",
          "reviewer_verifier",
          "instructor",
          "student",
          "read_only_viewer",
          "program_worker",
          "auditor",
          "leadership_funder_viewer",
        ],
        platform_roles_hidden_from_org_admin: true,
        last_admin_protection: true,
      },
      services,
      relationships: relationshipRows.map((relationship: any) => ({
        ...relationship,
        editable: false,
        authority: "organization_relationships_read_only_summary",
      })),
      settings: [
        { key: "legal_name", label: "Legal name", read_write: "READ_ONLY", authority: "source_domain_managed", reason: "Canonical organization update workflow is outside IOH-4." },
        { key: "display_name", label: "Display name", read_write: "READ_ONLY", authority: "source_domain_managed", reason: "Canonical organization update workflow is outside IOH-4." },
        { key: "status", label: "Organization status", read_write: "READ_ONLY", authority: "platform_or_onboarding_managed", reason: "Lifecycle authority remains backend/platform/onboarding owned." },
        { key: "service_entitlements", label: "Service entitlements", read_write: "READ_ONLY", authority: "service_catalog_managed", reason: "Organization admins cannot self-grant service authority." },
        { key: "relationships", label: "Relationships", read_write: "READ_ONLY", authority: "relationship_domain_managed", reason: "Relationship mutation requires explicit relationship-management authority." },
      ],
      empty_states: {
        no_members_beyond_initial_admin: members.length <= 1,
        no_pending_invites: true,
        no_active_services: services.filter((service: any) => service.status === "ACTIVE").length === 0,
        no_relationships: relationshipRows.length === 0,
        no_editable_settings: true,
      },
      boundaries: {
        org_admin_is_platform_admin: false,
        service_display_grants_entitlement: false,
        relationship_display_grants_membership: false,
        relationship_display_grants_entitlement: false,
        mfa_sso_scim_implemented: false,
      },
    };
  }

  private async safeServiceCatalog(actor: any) {
    try {
      return (await this.serviceCatalog.listServices(actor, false)).map(toServiceCatalogResponse);
    } catch {
      return [];
    }
  }

  private async safeEntitlements(organizationId: string, actor: any) {
    try {
      return (await this.serviceCatalog.listEntitlements(organizationId, actor)).map(toEntitlementResponse);
    } catch {
      return [];
    }
  }

  private async safeRelationships(actor: any) {
    try {
      return (await this.relationships.listRelationships(actor)).map(toOrganizationRelationshipResponse);
    } catch {
      return [];
    }
  }
}
