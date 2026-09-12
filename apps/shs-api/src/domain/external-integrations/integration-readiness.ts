export type IntegrationStatus = "NOT_CONFIGURED" | "CONFIGURED" | "PROVIDER_VERIFIED" | "DEGRADED" | "UNAVAILABLE";
export type ProviderErrorCategory = "AUTHENTICATION_FAILURE" | "AUTHORIZATION_FAILURE" | "INVALID_REQUEST" | "RATE_LIMITED" | "UNAVAILABLE" | "TIMEOUT" | "CONFLICT" | "PROVIDER_ERROR";

export type IntegrationReadiness = {
  integration: string;
  requiredConfig: string[];
  presentConfig: string[];
  status: IntegrationStatus;
  productionConfigured: boolean;
  productionTested: boolean;
};

export type ExternalCallback = { provider: string; providerReference: string; organizationId: string; tenantId: string; idempotencyKey?: string };

export const PR4_INTEGRATION_INVENTORY = Object.freeze([
  { integration: "Registry", owner: "Registry Submission", adapter: true, realProviderNeeded: true, sandbox: true, production: false },
  { integration: "Google/Microsoft Calendar", owner: "External Accounts", adapter: true, realProviderNeeded: true, sandbox: false, production: false },
  { integration: "Zoom/Live Learning", owner: "Live Learning", adapter: true, realProviderNeeded: true, sandbox: true, production: false },
  { integration: "Email", owner: "Notifications", adapter: true, realProviderNeeded: true, sandbox: true, production: false },
  { integration: "Local source/report storage", owner: "Source Ingestion/Reporting", adapter: true, realProviderNeeded: false, sandbox: true, production: false },
  { integration: "MCP", owner: "Agent Fabric", adapter: true, realProviderNeeded: true, sandbox: true, production: false },
  { integration: "Payment provider", owner: "Payments", adapter: true, realProviderNeeded: true, sandbox: true, production: false },
  { integration: "Identity provider", owner: "Identity", adapter: true, realProviderNeeded: true, sandbox: false, production: false },
  { integration: "GitHub/source control", owner: "ARAG-1/Studio", adapter: false, realProviderNeeded: false, sandbox: false, production: false },
]);

export function assessConfiguration(integration: string, requiredConfig: string[], env: NodeJS.ProcessEnv = process.env): IntegrationReadiness {
  const presentConfig = requiredConfig.filter((key) => String(env[key] || "").trim().length > 0);
  return { integration, requiredConfig: [...requiredConfig], presentConfig, status: presentConfig.length === 0 ? "NOT_CONFIGURED" : presentConfig.length === requiredConfig.length ? "CONFIGURED" : "DEGRADED", productionConfigured: false, productionTested: false };
}

export function normalizeProviderError(error: unknown): { category: ProviderErrorCategory; retryable: boolean } {
  const source = error as { status?: number; code?: string; name?: string } | undefined;
  const status = Number(source?.status || 0); const code = String(source?.code || source?.name || "").toLowerCase();
  if (status === 401 || code.includes("auth")) return { category: "AUTHENTICATION_FAILURE", retryable: false };
  if (status === 403) return { category: "AUTHORIZATION_FAILURE", retryable: false };
  if (status === 408 || code.includes("timeout")) return { category: "TIMEOUT", retryable: true };
  if (status === 409) return { category: "CONFLICT", retryable: false };
  if (status === 429) return { category: "RATE_LIMITED", retryable: true };
  if (status >= 400 && status < 500) return { category: "INVALID_REQUEST", retryable: false };
  if (status === 502 || status === 503 || status === 504 || code.includes("unavailable")) return { category: "UNAVAILABLE", retryable: true };
  return { category: "PROVIDER_ERROR", retryable: false };
}

export function retryDecision(error: unknown, attempt: number, options: { idempotent: boolean; maxAttempts?: number } = { idempotent: false }): { retry: boolean; delayMs: number; category: ProviderErrorCategory } {
  const normalized = normalizeProviderError(error); const maxAttempts = options.maxAttempts ?? 3;
  const retry = Boolean(options.idempotent && normalized.retryable && attempt < maxAttempts);
  return { retry, delayMs: retry ? Math.min(30_000, 250 * (2 ** Math.max(0, attempt - 1))) : 0, category: normalized.category };
}

export function callbackMatchesScope(callback: ExternalCallback, mapping: { provider: string; providerReference: string; organizationId: string; tenantId: string }) {
  return callback.provider === mapping.provider && callback.providerReference === mapping.providerReference && callback.organizationId === mapping.organizationId && callback.tenantId === mapping.tenantId;
}

export function assertTestAdapterCannotRunInProduction(adapterKey: string, env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV === "production" && /^(test|mock|local)/i.test(adapterKey)) throw new Error("test_adapter_forbidden_in_production");
  return true;
}
