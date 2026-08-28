import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type {
  ProductionIdentityProvider,
  ShsIdentityResolver,
  VerifiedExternalIdentity,
} from "../src/auth/production-identity.ts";

const migration = readFileSync(new URL("../migrations/028_auth0_identity_links_and_sessions.sql", import.meta.url), "utf8");

test("provider contract returns stable external identity facts, not SHS authorization", async () => {
  const provider: ProductionIdentityProvider = {
    async verifyCredential() {
      return { provider: "oidc", subject: "stable-subject-1", email_verified: true };
    },
  };
  const identity: VerifiedExternalIdentity = await provider.verifyCredential({
    credential: "opaque-test-credential",
    audience: "shs-api",
  });

  assert.equal(identity.subject, "stable-subject-1");
  assert.equal("permissions" in identity, false);
  assert.equal("role" in identity, false);
  assert.equal("tenant_id" in identity, false);
  assert.equal("organization_id" in identity, false);
});

test("SHS resolver, not the provider, owns memberships and role context", async () => {
  const resolver: ShsIdentityResolver = {
    async resolveIdentity(external) {
      return {
        identity_id: `${external.provider}:${external.subject}`,
        memberships: [{ tenant_id: "tenant-a", organization_id: "org-a", role: "read_only_viewer" }],
      };
    },
  };
  const result = await resolver.resolveIdentity({ provider: "oidc", subject: "stable-subject-1" });
  assert.deepEqual(result.memberships[0], {
    tenant_id: "tenant-a",
    organization_id: "org-a",
    role: "read_only_viewer",
  });
});

test("Auth0 identity links and sessions are durable and provider-scoped", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS identity_provider_links/);
  assert.match(migration, /UNIQUE \(provider, provider_subject\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS shs_identity_sessions/);
  assert.match(migration, /session_token_hash TEXT NOT NULL UNIQUE/);
  assert.match(migration, /revoked_at TIMESTAMP/);
  assert.doesNotMatch(migration, /permissions|role_name|tenant_id/);
});
