export type AragReleaseSubject = { projectId: string; revision: number; packageHash: string; providerKey: string; target: string };
export type AragProviderResult = { providerReleaseId: string; target: string; rollbackAvailable: boolean; responseMetadata: Record<string, unknown> };

export interface AragReleaseProvider {
  key: string;
  productionCapable: boolean;
  validateTarget(subject: AragReleaseSubject): Promise<{ allowed: boolean; code?: string }>;
  release(subject: AragReleaseSubject, idempotencyKey: string): Promise<AragProviderResult>;
  rollback(providerReleaseId: string, subject: AragReleaseSubject, idempotencyKey: string): Promise<{ status: "ROLLED_BACK" | "ROLLBACK_FAILED"; responseMetadata: Record<string, unknown> }>;
}

export class LocalMockAragReleaseProvider implements AragReleaseProvider {
  key = "local_mock";
  productionCapable = false;

  async validateTarget(subject: AragReleaseSubject) {
    return { allowed: subject.providerKey === this.key && subject.target === "TEST", code: subject.target === "TEST" ? undefined : "RELEASE_TARGET_NOT_ALLOWED" };
  }

  async release(subject: AragReleaseSubject, idempotencyKey: string) {
    return { providerReleaseId: `mock_arag_${Buffer.from(`${subject.projectId}:${subject.revision}:${idempotencyKey}`).toString("hex").slice(0, 24)}`, target: subject.target, rollbackAvailable: true, responseMetadata: { simulatedProvider: true, productionCapable: false } };
  }

  async rollback(providerReleaseId: string) {
    return { status: "ROLLED_BACK" as const, responseMetadata: { simulatedProvider: true, providerReleaseId } };
  }
}
