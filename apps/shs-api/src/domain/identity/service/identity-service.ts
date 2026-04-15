import { IdentityRepo } from "../repo/identity-repo";

export class IdentityService {
  private repo = new IdentityRepo();

  async login(email: string, _password: string) {
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
