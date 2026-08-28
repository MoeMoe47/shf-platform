import { IdentityRepo } from "../repo/identity-repo";
import { isProductionEnvironment } from "../../../auth/production-identity";

export class IdentityService {
  private repo = new IdentityRepo();

  async login(email: string, password: string) {
    if (isProductionEnvironment()) {
      throw new Error("production_identity_provider_required");
    }
    if (!email || !password) {
      throw new Error("Invalid credentials");
    }

    const user = await this.repo.getUserByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    return {
      token: `dev-token:${user.user_id}`,
      user,
    };
  }

  async getMe(userId: string) {
    return this.repo.getUserById(userId);
  }

  async listOrganizations() {
    return this.repo.listOrganizations();
  }

  async getOrganizationById(organizationId: string) {
    return this.repo.getOrganizationById(organizationId);
  }
}
