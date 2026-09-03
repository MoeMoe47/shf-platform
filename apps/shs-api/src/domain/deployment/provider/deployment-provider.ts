import { createHash } from "node:crypto";
import { validateWebsiteDeploymentPackage, type WebsiteDeploymentPackage } from "../model/deployment-contract.js";

export type ProviderDeploymentResult = {
  providerDeploymentId: string;
  liveUrl: null;
  public: false;
  target: "TEST";
};

export interface WebsiteDeploymentProvider {
  deploy(input: WebsiteDeploymentPackage): Promise<ProviderDeploymentResult>;
}

export class LocalMockWebsiteDeploymentProvider implements WebsiteDeploymentProvider {
  async deploy(input: WebsiteDeploymentPackage): Promise<ProviderDeploymentResult> {
    const pkg = validateWebsiteDeploymentPackage(input);
    const id = `mock_deployment_${createHash("sha256").update(`${pkg.projectId}:${pkg.revision}:${pkg.packageHash}`).digest("hex").slice(0, 24)}`;
    return { providerDeploymentId: id, liveUrl: null, public: false, target: "TEST" };
  }
}

class FailOnceWebsiteDeploymentProvider implements WebsiteDeploymentProvider {
  private failed = false;
  constructor(private delegate = new LocalMockWebsiteDeploymentProvider()) {}

  async deploy(input: WebsiteDeploymentPackage): Promise<ProviderDeploymentResult> {
    if (!this.failed) {
      this.failed = true;
      throw new Error("test provider failure");
    }
    return this.delegate.deploy(input);
  }
}

export function defaultWebsiteDeploymentProvider(): WebsiteDeploymentProvider {
  // Process-only switch for disposable acceptance environments. It is never
  // read from request input and is disabled in production.
  if (process.env.SHS_DEPLOYMENT_TEST_FAIL_ONCE === "1" && process.env.NODE_ENV !== "production") return new FailOnceWebsiteDeploymentProvider();
  return new LocalMockWebsiteDeploymentProvider();
}
