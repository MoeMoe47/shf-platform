// SHF Ecosystem Phase 13 — bounded HTTP primitives shared by every real
// external calendar provider adapter.
//
// Phase 12.2's adapters called `fetch()` directly with no timeout — a
// genuinely hung Google/Microsoft request would have awaited forever,
// blocking whichever await chain called it (Calendar Intelligence, a
// mirror sync pass) indefinitely. This was flagged and fixed in Phase 13
// as a real, not hypothetical, production defect. The AbortController +
// setTimeout pattern here mirrors the already-established, already-
// audited convention in trusted-reporting/dispatcher.ts exactly — no new
// primitive invented.
const DEFAULT_TIMEOUT_MS = Number(process.env.SHF_EXTERNAL_CALENDAR_PROVIDER_TIMEOUT_MS || 10000);

export class ProviderTimeoutError extends Error {
  constructor(public url: string) {
    super(`External calendar provider request timed out: ${url}`);
    this.name = "ProviderTimeoutError";
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === "AbortError") throw new ProviderTimeoutError(url);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Retry classification (phase brief §16-17). A caller (the mirror
// dispatcher, a future retry wrapper) decides whether/how to retry —
// this function only classifies, it never itself retries or sleeps.
export type ProviderFailureClass = "RETRYABLE" | "NON_RETRYABLE";

export function classifyProviderHttpFailure(status: number): ProviderFailureClass {
  if (status === 429) return "RETRYABLE"; // rate limited — Retry-After should be honored by the caller if present
  if (status >= 500) return "RETRYABLE"; // provider-side outage
  return "NON_RETRYABLE"; // 4xx other than 429: bad request, invalid_grant, unauthorized — retrying won't help
}

export function classifyProviderErrorFailure(error: unknown): ProviderFailureClass {
  if (error instanceof ProviderTimeoutError) return "RETRYABLE";
  return "NON_RETRYABLE";
}
