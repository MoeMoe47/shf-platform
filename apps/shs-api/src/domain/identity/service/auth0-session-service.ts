import { createAuth0IdentityProvider, type ProductionCredential } from "../../../auth/production-identity.js";
import { applyActiveOrganizationContext, resolveOrganizationContextTransition, OrganizationContextError } from "../../../auth/organization-context.js";
import { ProductionIdentityRepo } from "../repo/production-identity-repo.js";

export class Auth0SessionService {
  constructor(
    private readonly provider = createAuth0IdentityProvider(),
    private readonly repo = new ProductionIdentityRepo(),
  ) {}

  async exchange(credential: ProductionCredential) {
    const external = await this.provider.verifyCredential(credential);
    if (external.account_status && external.account_status !== "active") {
      throw new Error("external_identity_inactive");
    }
    const link = await this.repo.findLink(external);
    if (!link || link.status !== "active") throw new Error("identity_unlinked");
    const identity = await this.repo.getActiveIdentity(link.internal_identity_id);
    if (!identity) throw new Error("identity_or_membership_inactive");
    const session = await this.repo.createSession(identity.user_id);
    const sessionContext = {
      session_status: "active",
      session_expires_at: session.expires_at,
    };
    return {
      session,
      user: identity.memberships.length === 1
        ? { ...applyActiveOrganizationContext(identity, identity.memberships[0].organization_id), ...sessionContext }
        : { ...identity, roles: [], permissions: [], ...sessionContext },
    };
  }

  async getUserForSession(token: string, activeOrganizationId?: string | null, preferredOrganizationId?: string | null) {
    const session = await this.repo.getSession(token);
    if (!session) return null;
    const identity = await this.repo.getActiveIdentity(session.internal_identity_id);
    if (!identity) return null;
    if (activeOrganizationId) {
      return applyActiveOrganizationContext(identity, activeOrganizationId);
    }
    const transition = resolveOrganizationContextTransition(identity, { preferredOrganizationId });
    if (transition.ok && transition.selected_organization_id) {
      return {
        ...applyActiveOrganizationContext(identity, transition.selected_organization_id),
        organization_context_resolution: transition,
        session_status: "active",
        session_expires_at: session.expires_at,
      };
    }
    if (identity.memberships.length === 1) {
      throw new OrganizationContextError(transition.error_code || "ORG_CONTEXT_UNAVAILABLE", "Active organization context is unavailable.");
    }
    return {
      ...identity,
      roles: [],
      permissions: [],
      organization_context_resolution: transition,
      session_status: "active",
      session_expires_at: session.expires_at,
    };
  }

  revoke(token: string) {
    return this.repo.revokeSession(token);
  }
}
