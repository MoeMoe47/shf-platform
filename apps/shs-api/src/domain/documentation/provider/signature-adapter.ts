import { createHmac, randomUUID } from "node:crypto";
import type { ProviderSignatureEvent, SignatureEnvironment, ElectronicSignatureStatus } from "../model/signature.js";

export type ProviderRequest = {
  providerRequestReference: string;
  status: ElectronicSignatureStatus;
  rawStatus: string;
  metadata?: Record<string, unknown>;
};

export interface SignatureProviderAdapter {
  readonly key: string;
  readonly environment: SignatureEnvironment;
  createRequest(input: Record<string, unknown>): Promise<ProviderRequest>;
  createSigningSession(input: { providerRequestReference: string }): Promise<{ sessionReference: string; expiresAt: string }>;
  getStatus(providerRequestReference: string): Promise<ProviderRequest>;
  voidRequest(providerRequestReference: string, reason: string): Promise<ProviderRequest>;
  verifyWebhook(headers: Record<string, string | undefined>, body: string): boolean;
  normalizeWebhook(body: Record<string, unknown>): ProviderSignatureEvent;
  retrieveSignedArtifactReference(providerRequestReference: string): Promise<{ reference: string; bytes?: Buffer; mediaType: string } | null>;
  healthCheck(): Promise<"AVAILABLE" | "DEGRADED" | "UNAVAILABLE" | "NOT_CONFIGURED">;
}

export class TestSignatureProviderAdapter implements SignatureProviderAdapter {
  readonly key = "test";
  readonly environment: SignatureEnvironment = "TEST";
  private readonly requests = new Map<string, ProviderRequest>();
  private readonly secret: string;

  constructor(secret = process.env.DGAL_TEST_SIGNATURE_WEBHOOK_SECRET || "dgal-test-only-webhook-secret") { this.secret = secret; }

  async createRequest(): Promise<ProviderRequest> {
    const result = { providerRequestReference: `test_req_${randomUUID()}`, status: "SENT" as const, rawStatus: "sent", metadata: { adapter: "test", testOnly: true } };
    this.requests.set(result.providerRequestReference, result);
    return result;
  }
  async createSigningSession(input: { providerRequestReference: string }) {
    const providerRequestReference = input.providerRequestReference;
    if (!this.requests.has(providerRequestReference)) throw new Error("SIGNATURE_PROVIDER_REQUEST_NOT_FOUND");
    return { sessionReference: `test_session_${providerRequestReference}`, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
  }
  async getStatus(providerRequestReference: string) { return this.requests.get(providerRequestReference) || { providerRequestReference, status: "FAILED" as const, rawStatus: "not_found" }; }
  async voidRequest(providerRequestReference: string, reason: string) { const result = { ...(this.requests.get(providerRequestReference) || { providerRequestReference }), status: "VOIDED" as const, rawStatus: "voided", metadata: { reason } }; this.requests.set(providerRequestReference, result); return result; }
  verifyWebhook(headers: Record<string, string | undefined>, body: string) { const provided = String(headers["x-test-signature"] || ""); const expected = createHmac("sha256", this.secret).update(body).digest("hex"); return provided.length === expected.length && provided === expected; }
  normalizeWebhook(body: Record<string, unknown>): ProviderSignatureEvent { return { eventReference: String(body.eventReference || ""), requestReference: String(body.requestReference || ""), normalizedStatus: String(body.status || "FAILED").toUpperCase() as ElectronicSignatureStatus, rawStatus: String(body.rawStatus || body.status || "unknown"), providerMetadata: { testOnly: true }, signedArtifact: body.signedArtifact as any }; }
  async retrieveSignedArtifactReference(providerRequestReference: string) { const request = this.requests.get(providerRequestReference); if (!request || request.status !== "SIGNED") return null; return { reference: `test-artifact:${providerRequestReference}`, bytes: Buffer.from("%PDF-1.7\nDGAL test signed artifact\n", "ascii"), mediaType: "application/pdf" }; }
  async healthCheck() { return "AVAILABLE" as const; }

  signWebhook(body: Record<string, unknown>) { const payload = JSON.stringify(body); return { payload, signature: createHmac("sha256", this.secret).update(payload).digest("hex") }; }
  setStatus(providerRequestReference: string, status: ElectronicSignatureStatus, rawStatus = status.toLowerCase()) { const current = this.requests.get(providerRequestReference); if (!current) throw new Error("SIGNATURE_PROVIDER_REQUEST_NOT_FOUND"); this.requests.set(providerRequestReference, { ...current, status, rawStatus }); }
}

export class SignatureProviderRegistry {
  private readonly adapters = new Map<string, SignatureProviderAdapter>();
  register(adapter: SignatureProviderAdapter) { this.adapters.set(`${adapter.key}:${adapter.environment}`, adapter); return this; }
  get(key: string, environment: SignatureEnvironment) { return this.adapters.get(`${key}:${environment}`) || null; }
  has(key: string, environment: SignatureEnvironment) { return Boolean(this.get(key, environment)); }
}

export function defaultSignatureProviderRegistry() { return new SignatureProviderRegistry().register(new TestSignatureProviderAdapter()); }
