import { createAuth0IdentityProvider, type ProductionCredential } from "../../../auth/production-identity";
import { applyActiveOrganizationContext } from "../../../auth/organization-context";
import { ProductionIdentityRepo } from "../repo/production-identity-repo";

export class Auth0SessionService {
  constructor(
    private readonly provider = createAuth0IdentityProvider(),
    private readonly repo = new ProductionIdentityRepo(),
  ) {}

  async exchange(credential: ProductionCredential) {
    const external = await this.provider.verifyCredential(credential);
    const link = await this.repo.findLink(external);
    if (!link || link.status !== "active") throw new Error("identity_unlinked");
    const identity = await this.repo.getActiveIdentity(link.internal_identity_id);
    if (!identity) throw new Error("identity_or_membership_inactive");
    const session = await this.repo.createSession(identity.user_id);
    return {
      session,
      user: identity.memberships.length === 1
        ? applyActiveOrganizationContext(identity, identity.memberships[0].organization_id)
        : { ...identity, roles: [], permissions: [] },
    };
  }

  async getUserForSession(token: string, activeOrganizationId?: string | null) {
    const session = await this.repo.getSession(token);
    if (!session) return null;
    const identity = await this.repo.getActiveIdentity(session.internal_identity_id);
    if (!identity) return null;
    if (activeOrganizationId || identity.memberships.length === 1) {
      return applyActiveOrganizationContext(identity, activeOrganizationId || identity.memberships[0].organization_id);
    }
    return { ...identity, roles: [], permissions: [] };
  }

  revoke(token: string) {
    return this.repo.revokeSession(token);
  }
}
