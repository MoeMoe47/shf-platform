/** Auth0 verification and SHS identity-resolution boundaries. */
export function isProductionEnvironment(env: NodeJS.ProcessEnv = process.env): boolean {
  return String(env.SHS_AUTH_ENV || env.NODE_ENV || "development").trim().toLowerCase() === "production";
}

export type VerifiedExternalIdentity = {
  provider: string;
  subject: string;
  email?: string;
  email_verified?: boolean;
  display_name?: string;
  account_status?: "active" | "disabled" | "suspended" | "deleted" | "pending";
};

export type ProductionCredential = {
  credential: string;
  issuer?: string;
  audience: string;
};

/** Provider adapters authenticate only. SHS maps the result to roles/scope. */
export interface ProductionIdentityProvider {
  verifyCredential(input: ProductionCredential): Promise<VerifiedExternalIdentity>;
}

type Auth0Jwk = { kid: string; kty: string; alg?: string; use?: string; n?: string; e?: string };
type Auth0JwksResponse = { keys?: Auth0Jwk[] };
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="), "base64");
}

function parseJwtPart(value: string): Record<string, any> {
  try {
    const parsed = JSON.parse(decodeBase64Url(value).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_claims");
    return parsed;
  } catch {
    throw new Error("invalid_auth0_token");
  }
}

function normalizeIssuer(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/** Standards-based Auth0 access-token verifier. It never maps provider claims to SHS authority. */
export class Auth0IdentityProvider implements ProductionIdentityProvider {
  private jwks?: { expiresAt: number; keys: Auth0Jwk[] };
  private readonly issuer: string;
  private readonly audience: string;
  private readonly fetcher: FetchLike;
  private readonly jwksTtlMs: number;

  constructor(options: { issuer: string; audience: string; fetcher?: FetchLike; jwksTtlMs?: number }) {
    this.issuer = normalizeIssuer(options.issuer);
    this.audience = options.audience.trim();
    this.fetcher = options.fetcher || fetch;
    this.jwksTtlMs = options.jwksTtlMs ?? 300_000;
    if (!this.issuer || !this.audience) throw new Error("auth0_issuer_and_audience_required");
  }

  async verifyCredential(input: ProductionCredential): Promise<VerifiedExternalIdentity> {
    const parts = input.credential.split(".");
    if (parts.length !== 3) throw new Error("invalid_auth0_token");
    const header = parseJwtPart(parts[0]);
    const claims = parseJwtPart(parts[1]);
    if (header.alg !== "RS256" || header.typ && !["JWT", "at+jwt"].includes(header.typ)) throw new Error("invalid_auth0_algorithm");
    if (normalizeIssuer(String(claims.iss || "")) !== this.issuer) throw new Error("invalid_auth0_issuer");
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(this.audience)) throw new Error("invalid_auth0_audience");
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(claims.exp) || claims.exp <= now) throw new Error("expired_auth0_token");
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now)) throw new Error("not_yet_valid_auth0_token");
    if (typeof claims.sub !== "string" || !claims.sub.trim()) throw new Error("auth0_subject_required");
    if (header.crit !== undefined) throw new Error("unsupported_auth0_critical_header");

    let response = await this.getJwks();
    let jwk = response.find((key) => key.kid === header.kid && key.kty === "RSA" && (!key.alg || key.alg === "RS256") && key.use !== "enc");
    if (!jwk) {
      this.jwks = undefined;
      response = await this.getJwks();
      jwk = response.find((key) => key.kid === header.kid && key.kty === "RSA" && (!key.alg || key.alg === "RS256") && key.use !== "enc");
    }
    if (!jwk) throw new Error("auth0_signing_key_not_found");
    const publicKey = createPublicKey({ key: jwk as any, format: "jwk" });
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    if (!verifier.verify(publicKey, decodeBase64Url(parts[2]))) throw new Error("invalid_auth0_signature");

    return {
      provider: "auth0",
      subject: claims.sub,
      ...(typeof claims.email === "string" ? { email: claims.email } : {}),
      ...(typeof claims.email_verified === "boolean" ? { email_verified: claims.email_verified } : {}),
      ...(typeof claims.name === "string" ? { display_name: claims.name } : {}),
      account_status: "active",
    };
  }

  private async getJwks(): Promise<Auth0Jwk[]> {
    if (this.jwks && this.jwks.expiresAt > Date.now()) return this.jwks.keys;
    const response = await this.fetcher(`${this.issuer}/.well-known/jwks.json`, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("auth0_jwks_unavailable");
    const body = await response.json() as Auth0JwksResponse;
    const keys = Array.isArray(body.keys) ? body.keys : [];
    if (!keys.length) throw new Error("auth0_jwks_empty");
    this.jwks = { keys, expiresAt: Date.now() + this.jwksTtlMs };
    return keys;
  }
}

export function createAuth0IdentityProvider(env: NodeJS.ProcessEnv = process.env): Auth0IdentityProvider {
  if (String(env.SHS_IDENTITY_PROVIDER || "").trim().toLowerCase() !== "auth0") {
    throw new Error("auth0_identity_provider_required");
  }
  return new Auth0IdentityProvider({
    issuer: String(env.AUTH0_ISSUER || ""),
    audience: String(env.AUTH0_AUDIENCE || ""),
  });
}

/** The mapping boundary intentionally owns authorization outside the provider. */
export interface ShsIdentityResolver {
  resolveIdentity(external: VerifiedExternalIdentity): Promise<{
    identity_id: string;
    memberships: Array<{ tenant_id: string; organization_id: string; role: string }>;
  }>;
}

export function assertProductionIdentityProviderConfigured(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!isProductionEnvironment(env)) return;

  for (const name of ["SHS_IDENTITY_PROVIDER", "SHS_IDENTITY_PROVIDER_AUDIENCE", "SHS_SESSION_SECRET_REF"]) {
    if (!String(env[name] || "").trim()) {
      throw new Error(`${name} is required in production`);
    }
  }

  if (String(env.SHS_IDENTITY_PROVIDER || "").trim().toLowerCase() !== "auth0") {
    throw new Error("production_identity_provider_required: SHS_IDENTITY_PROVIDER must be auth0");
  }
  for (const name of ["AUTH0_ISSUER", "AUTH0_AUDIENCE"]) {
    if (!String(env[name] || "").trim()) throw new Error(`${name} is required in production`);
  }
}
import { createPublicKey, createVerify } from "node:crypto";
