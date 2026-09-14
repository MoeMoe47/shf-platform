import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Auth0SessionService } from "../src/domain/identity/service/auth0-session-service.ts";
import { authMiddleware } from "../src/auth/auth-middleware.ts";
import { createAuth0IdentityProvider } from "../src/auth/production-identity.ts";

const middlewareSource = readFileSync(new URL("../src/auth/auth-middleware.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("../src/api/router.ts", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../../../src/auth/auth-context.jsx", import.meta.url), "utf8");

function provider(external: any = { provider: "auth0", subject: "auth0|subject-1", account_status: "active" }) {
  return { verifyCredential: async () => external } as any;
}

function repo(overrides: any = {}) {
  return {
    async findLink() { return { internal_identity_id: "user-1", status: "active" }; },
    async getActiveIdentity() {
      return overrides.identity || {
        user_id: "user-1",
        memberships: [{ membership_id: "membership-1", organization_id: "org-a", role: "operator", status: "active", organization_status: "active", permissions: ["program.read"] }],
      };
    },
    async createSession() { return { token: "session-token", expires_at: "2026-09-14T12:00:00.000Z" }; },
    async getSession() { return overrides.session === undefined ? { internal_identity_id: "user-1", expires_at: "2026-09-14T12:00:00.000Z" } : overrides.session; },
    async revokeSession() { return undefined; },
  } as any;
}

test("expired or revoked application session fails closed before identity resolution", async () => {
  const service = new Auth0SessionService(provider(), repo({ session: null }));
  assert.equal(await service.getUserForSession("expired-token"), null);
});

test("current membership and role state are re-resolved for each valid session request", async () => {
  let role = "operator";
  const identityRepo = repo();
  identityRepo.getActiveIdentity = async () => ({
    user_id: "user-1",
    memberships: [{ membership_id: "membership-1", organization_id: "org-a", role, status: "active", organization_status: "active", permissions: role === "operator" ? ["program.read"] : [] }],
  });
  const service = new Auth0SessionService(provider(), identityRepo);
  const first = await service.getUserForSession("session-token", "org-a");
  role = "viewer";
  const second = await service.getUserForSession("session-token", "org-a");
  assert.deepEqual(first?.roles, ["operator"]);
  assert.deepEqual(second?.roles, ["viewer"]);
  assert.equal(second?.permissions?.length, 0);
});

test("inactive external identity cannot establish an application session", async () => {
  const service = new Auth0SessionService(provider({ provider: "auth0", subject: "auth0|disabled", account_status: "disabled" }), repo());
  await assert.rejects(() => service.exchange({ credential: "provider-token", audience: "shs-api" }), /external_identity_inactive/);
});

test("requested organization cannot be restored from a stale session claim", async () => {
  const service = new Auth0SessionService(provider(), repo({ identity: { user_id: "user-1", memberships: [{ organization_id: "org-b", role: "operator", status: "active", organization_status: "active", permissions: [] }] } }));
  await assert.rejects(
    () => service.getUserForSession("session-token", "org-a"),
    (error: any) => error?.code === "ORG_CONTEXT_FORBIDDEN",
  );
});

test("development authentication remains unavailable for production bearer credentials", async () => {
  const original = process.env.SHS_AUTH_ENV;
  process.env.SHS_AUTH_ENV = "production";
  try {
    const req: any = { headers: { authorization: "Bearer dev-token:user-1" } };
    await authMiddleware(req, {}, () => undefined);
    assert.equal(req.user, null);
  } finally {
    if (original === undefined) delete process.env.SHS_AUTH_ENV;
    else process.env.SHS_AUTH_ENV = original;
  }
});

test("production provider configuration requires Auth0 and explicit issuer/audience", () => {
  assert.throws(() => createAuth0IdentityProvider({ SHS_IDENTITY_PROVIDER: "local-fixture" } as any), /auth0_identity_provider_required/);
  assert.throws(() => createAuth0IdentityProvider({ SHS_IDENTITY_PROVIDER: "auth0" } as any), /auth0_issuer_and_audience_required/);
});

test("logout clears the browser cookie and client org-scoped state", () => {
  assert.match(routerSource, /shs_session=; Max-Age=0; Path=\/; HttpOnly; Secure; SameSite=Lax/);
  assert.match(clientSource, /clearOrganizationScopedClientState\(\)/);
});

test("production session failures are converted to unauthenticated state", () => {
  assert.match(middlewareSource, /req\.user = null;/);
  assert.match(middlewareSource, /req\.auth_error_code = "AUTH_SESSION_INVALID"/);
});
