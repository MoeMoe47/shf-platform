import {
  canEnterProtectedMetaverseResource,
  resolveMetaverseUnlock,
} from "../unlocks/unlock-resolver.js";
import { MetaverseAuthorityAdapter } from "./metaverse-authority-adapter.js";
import {
  MetaverseResourceResolutionError,
  resolveMetaverseEntryResource,
  type MetaverseEntryResourceRequest,
} from "./metaverse-resource-resolver.js";
import { emitMetaverseOperationalEvent } from "./metaverse-event-adapter.js";

export class MetaverseEntryServiceError extends Error {
  constructor(public code: string, message: string, public statusCode = 403) {
    super(message);
  }
}

const CLIENT_AUTHORITY_FIELDS = [
  "unlock",
  "unlocked",
  "decision",
  "role",
  "roles",
  "permissions",
  "enrollment",
  "enrollments",
  "credential",
  "credentials",
  "civicEligibility",
  "civic_eligibility",
  "organization_id",
  "organizationId",
  "user_id",
  "userId",
  "entitlement",
  "entitlements",
] as const;

function hasClientAuthorityClaim(body: any) {
  const source = body || {};
  return CLIENT_AUTHORITY_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(source, field));
}

export class MetaverseEntryService {
  constructor(private authority = new MetaverseAuthorityAdapter()) {}

  async decide(input: {
    user: any;
    resource: MetaverseEntryResourceRequest;
    clientBody?: any;
    cameraContext?: any;
    emitEvent?: boolean;
    eventName?: "view" | "enter" | "activity_start" | "activity_exit" | "next_action";
    now?: Date;
  }) {
    if (!input.user) throw new MetaverseEntryServiceError("AUTH_REQUIRED", "Authentication required.", 401);
    if (input.user.org_context_error) {
      throw new MetaverseEntryServiceError(input.user.org_context_error, "Valid active organization context is required.", 403);
    }
    if (!input.user.active_organization_id) {
      throw new MetaverseEntryServiceError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
    }

    const authority = await this.authority.resolve(input.user);
    if (!authority.context.organization_id) {
      throw new MetaverseEntryServiceError("ORG_CONTEXT_REQUIRED", "Valid active organization context is required.", 403);
    }

    const resource = resolveMetaverseEntryResource(input.resource, authority.context.organization_id);
    const now = input.now || new Date();
    const expiresAt = new Date(now.getTime() + 60_000).toISOString();
    const decision = resolveMetaverseUnlock({
      context: {
        ...authority.context,
        client_claimed_unlock: hasClientAuthorityClaim(input.clientBody),
        camera_context: input.cameraContext,
      },
      facts: authority.facts,
      resource,
      computed_at: now.toISOString(),
      expires_at: expiresAt,
    });

    const canEnter = canEnterProtectedMetaverseResource(decision, now);
    if (input.emitEvent) {
      if (canEnter && input.eventName === "enter") emitMetaverseOperationalEvent("metaverse.resource.entered", decision);
      else if (canEnter && input.eventName === "activity_start") emitMetaverseOperationalEvent("metaverse.activity.started", decision);
      else if (input.eventName === "activity_exit") emitMetaverseOperationalEvent("metaverse.activity.exited", decision);
      else if (input.eventName === "next_action") emitMetaverseOperationalEvent("metaverse.next_action.selected", decision);
      else if (!canEnter) emitMetaverseOperationalEvent("metaverse.unlock.denied", decision);
      else emitMetaverseOperationalEvent("metaverse.resource.viewed", decision);
    }

    return {
      resource: {
        scope: resource.scope,
        resource_id: resource.resource_id,
        resource_type: resource.resource_type,
        city_id: resource.city_id,
        district_id: resource.district_id || null,
        facility_id: resource.facility_id || null,
        activity_id: resource.activity_id || null,
        label: resource.label,
        route_reference: resource.route_reference || null,
        registry_status: resource.registry_status,
      },
      decision,
      can_enter: canEnter,
      authority: {
        source: "server_authoritative_metaverse_entry",
        projection_version: "MET-5",
        client_authority_ignored: hasClientAuthorityClaim(input.clientBody),
      },
      revalidation: {
        policy: decision.revalidation_policy,
        expires_at: decision.expires_at,
        entry_time_recheck_required: true,
        invalidation_hooks: [
          "membership_revoked",
          "role_revoked",
          "entitlement_revoked",
          "org_suspended",
          "user_suspended",
          "enrollment_removed",
          "cohort_team_change",
          "assignment_change",
          "course_progress_update",
          "assessment_result",
          "credential_issued_or_revoked",
          "civic_eligibility_change",
        ],
      },
    };
  }
}

export function statusForMetaverseError(error: any) {
  if (error instanceof MetaverseEntryServiceError || error instanceof MetaverseResourceResolutionError) return error.statusCode;
  if (String(error?.message || "").includes("client_cannot_grant_unlock")) return 403;
  if (String(error?.message || "").includes("cross_org_unlock_denied")) return 403;
  if (String(error?.message || "").includes("camera_position_cannot_grant_unlock")) return 403;
  return 500;
}
