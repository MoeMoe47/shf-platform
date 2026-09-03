import { createHash } from "node:crypto";
import { REGISTRY_PROVIDER, type RegistrySubmissionPackage, type RegistrySubmissionResult } from "../model/registry-submission-contract.js";

export interface RegistryProvider {
  readonly key: string;
  submit(pkg: RegistrySubmissionPackage): Promise<RegistrySubmissionResult>;
}

export type LocalTestRegistryScenario = "ACCEPTED" | "SUBMITTED" | "CHANGES_REQUIRED" | "REJECTED" | "FAILED" | "FAILED_ONCE";

const TEST_SCENARIOS: readonly LocalTestRegistryScenario[] = ["ACCEPTED", "SUBMITTED", "CHANGES_REQUIRED", "REJECTED", "FAILED", "FAILED_ONCE"];

function configuredScenario(): LocalTestRegistryScenario {
  const value = process.env.SHS_TEST_REGISTRY_SCENARIO as LocalTestRegistryScenario | undefined;
  if (process.env.NODE_ENV === "production" || !value || !TEST_SCENARIOS.includes(value)) return "ACCEPTED";
  return value;
}

export class LocalTestRegistryProvider implements RegistryProvider {
  readonly key = REGISTRY_PROVIDER;
  private failedOnce = false;
  constructor(private readonly scenario: LocalTestRegistryScenario = configuredScenario()) {}
  async submit(pkg: RegistrySubmissionPackage): Promise<RegistrySubmissionResult> {
    const reference = `test-registry:${createHash("sha256").update(`${pkg.packageId}:${pkg.packageVersion}:${pkg.packageHash}`).digest("hex").slice(0, 24)}`;
    if (this.scenario === "FAILED" || (this.scenario === "FAILED_ONCE" && !this.failedOnce)) {
      this.failedOnce = true;
      throw new Error("Registry test provider unavailable");
    }
    const status = this.scenario === "CHANGES_REQUIRED" && pkg.packageVersion > 1 ? "ACCEPTED" : this.scenario === "FAILED_ONCE" ? "ACCEPTED" : this.scenario;
    const messages = {
      SUBMITTED: "The package was submitted to the local test Registry and is awaiting review.",
      ACCEPTED: "Accepted by the local test Registry; this is not production approval.",
      CHANGES_REQUIRED: "The local test Registry requested changes to this package.",
      REJECTED: "The local test Registry rejected this package; this is not a Studio failure."
    } as const;
    return { status, registryReference: reference, message: messages[status] };
  }
}

export function defaultRegistryProvider(): RegistryProvider { return new LocalTestRegistryProvider(); }
