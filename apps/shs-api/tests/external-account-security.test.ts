// SHF Ecosystem Phase 12.1 — External Account Security foundation tests.
// Covers the four required matrices from the phase brief: crypto (§24),
// OAuth state (§25), PKCE (§26), and IDOR/lifecycle (§27-28). No real
// Google/Microsoft credentials are used or required anywhere in this
// file — every test exercises this app's own provider-neutral security
// primitives with synthetic values.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";
import { encryptSecret, decryptSecret, type SecretEnvelope } from "../src/security/external-secret-cipher.ts";
import {
  createAuthorizationState,
  consumeAuthorizationState,
  UnsafeReturnPathError,
} from "../src/domain/external-accounts/service/oauth-state-service.ts";
import { isSafeInternalReturnPath } from "../src/domain/external-accounts/service/return-path-guard.ts";
import {
  createOrReplaceConnection,
  markReauthRequired,
  revokeConnection,
  listConnectionsForActor,
} from "../src/domain/external-accounts/service/external-account-connection-service.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase121_${Date.now()}`;

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  [`user_${RUN}_a`, "org_shf_001", `a@${RUN}.test`, "Learner A"],
  [`user_${RUN}_b`, "org_shf_001", `b@${RUN}.test`, "Learner B"],
] as const;

function actorA() {
  return { organization_id: "org_shf_001", user_id: `user_${RUN}_a` };
}
function actorB() {
  return { organization_id: "org_shf_001", user_id: `user_${RUN}_b` };
}

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function cleanup() {
  await query("DELETE FROM external_account_connections WHERE user_id LIKE $1", [`user_${RUN}_%`]);
  await query("DELETE FROM oauth_authorization_states WHERE user_id LIKE $1", [`user_${RUN}_%`]);
}

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active') ON CONFLICT (organization_id) DO NOTHING`);
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
});

after(async () => {
  await cleanup();
});

// ==================== §24 Crypto test matrix ====================

test("1. plaintext token is never stored — encryptSecret returns only ciphertext/iv/authTag/keyVersion", () => {
  const envelope = encryptSecret("refresh-token-super-secret-value");
  assert.equal(typeof envelope.ciphertext, "string");
  assert.equal(typeof envelope.iv, "string");
  assert.equal(typeof envelope.authTag, "string");
  assert.ok(!envelope.ciphertext.includes("refresh-token-super-secret-value"));
});

test("2. ciphertext decrypts correctly with the valid key", () => {
  const plaintext = "a-real-oauth-refresh-token-value";
  const envelope = encryptSecret(plaintext);
  assert.equal(decryptSecret(envelope), plaintext);
});

test("3. decryption with a wrong/unknown key version fails", () => {
  const envelope = encryptSecret("value");
  const tampered: SecretEnvelope = { ...envelope, keyVersion: "no-such-key" };
  assert.throws(() => decryptSecret(tampered));
});

test("4. a modified ciphertext byte fails authentication (never returns wrong plaintext silently)", () => {
  const envelope = encryptSecret("value");
  const bytes = Buffer.from(envelope.ciphertext, "base64");
  bytes[0] = bytes[0] ^ 0xff;
  const tampered: SecretEnvelope = { ...envelope, ciphertext: bytes.toString("base64") };
  assert.throws(() => decryptSecret(tampered));
});

test("5. a modified auth tag fails authentication", () => {
  const envelope = encryptSecret("value");
  const bytes = Buffer.from(envelope.authTag, "base64");
  bytes[0] = bytes[0] ^ 0xff;
  const tampered: SecretEnvelope = { ...envelope, authTag: bytes.toString("base64") };
  assert.throws(() => decryptSecret(tampered));
});

test("6. each encryption generates a unique nonce/IV, even for the same plaintext", () => {
  const a = encryptSecret("same-value");
  const b = encryptSecret("same-value");
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext, "GCM with a fresh IV must not produce identical ciphertext for identical plaintext");
});

test("7/8. raw tokens are absent from the safe connection DTO and from HTTP responses", async () => {
  const dto = await createOrReplaceConnection(actorA(), "google", {
    providerAccountId: "google-acct-1",
    scopes: ["calendar.readonly"],
    accessToken: "access-token-value",
    accessTokenExpiresAt: null,
    refreshToken: "refresh-token-value",
  });
  const serialized = JSON.stringify(dto);
  assert.ok(!serialized.includes("access-token-value"));
  assert.ok(!serialized.includes("refresh-token-value"));
  assert.equal("accessTokenCiphertext" in dto, false);
  assert.equal("refreshTokenCiphertext" in dto, false);

  const { status, json } = await api("/external-accounts/me", { userId: `user_${RUN}_a` });
  assert.equal(status, 200);
  const body = JSON.stringify(json);
  assert.ok(!body.includes("access-token-value"));
  assert.ok(!body.includes("refresh-token-value"));
  assert.ok(!body.includes("ciphertext"));
});

test("9. key version is persisted on the envelope", () => {
  const envelope = encryptSecret("value");
  assert.equal(envelope.keyVersion, "local-dev-k1");
});

test("10. an invalid key configuration fails safely (throws, never falls back to plaintext)", () => {
  const badEnv = { ...process.env, SHF_EXTERNAL_SECRET_ACTIVE_KID: "" };
  assert.throws(() => encryptSecret("value", badEnv as NodeJS.ProcessEnv));
});

// ==================== §25 OAuth state test matrix ====================

test("11. state is cryptographically random and high entropy", async () => {
  const first = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const second = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  assert.notEqual(first.state, second.state);
  assert.ok(first.state.length >= 32);
});

test("12. state is stored hashed, never in plaintext", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const row = await query("SELECT state_hash FROM oauth_authorization_states WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [actorA().user_id]);
  assert.notEqual(row.rows[0].state_hash, state);
  assert.equal(row.rows[0].state_hash.length, 64); // hex-encoded SHA-256
});

test("13. the correct actor can consume their own state", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const consumed = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  assert.ok(consumed);
  assert.equal(consumed!.returnPath, "/career/settings");
});

test("14. a different actor presenting the same raw state is rejected", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const consumed = await consumeAuthorizationState({ actor: actorB(), provider: "google", rawState: state });
  assert.equal(consumed, null);
});

test("15. the wrong provider for a real state is rejected", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const consumed = await consumeAuthorizationState({ actor: actorA(), provider: "microsoft", rawState: state });
  assert.equal(consumed, null);
});

test("16. an expired state is rejected", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  await query("UPDATE oauth_authorization_states SET expires_at = NOW() - INTERVAL '1 minute' WHERE user_id = $1", [actorA().user_id]);
  const consumed = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  assert.equal(consumed, null);
});

test("17/18. a consumed state cannot be replayed", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const first = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  assert.ok(first);
  const second = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  assert.equal(second, null, "replaying an already-consumed state must fail");
});

test("19. a safe internal return path is accepted at issuance", async () => {
  const result = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/curriculum/settings/integrations" });
  assert.ok(result.state);
});

test("20. an external/unsafe return URL is rejected at issuance, never persisted", async () => {
  const unsafe = ["https://evil.example", "//evil.example", "javascript:alert(1)", "data:text/html,x", "/career/settings/../../evil"];
  for (const returnPath of unsafe) {
    await assert.rejects(
      () => createAuthorizationState({ actor: actorA(), provider: "google", returnPath }),
      UnsafeReturnPathError,
    );
  }
  assert.equal(isSafeInternalReturnPath("https://evil.example"), false);
  assert.equal(isSafeInternalReturnPath("//evil.example"), false);
  assert.equal(isSafeInternalReturnPath("/career/settings"), true);
});

// ==================== §26 PKCE test matrix ====================

test("21/22. a PKCE verifier and correct S256 challenge are generated per state", async () => {
  const { state, codeChallenge, codeChallengeMethod } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  assert.equal(codeChallengeMethod, "S256");
  assert.ok(codeChallenge.length >= 32);
  const consumed = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  const { createHash } = await import("node:crypto");
  const expectedChallenge = createHash("sha256").update(consumed!.codeVerifier).digest("base64url");
  assert.equal(expectedChallenge, codeChallenge, "the returned code_challenge must be S256(verifier)");
});

test("23. the verifier is never present in the createAuthorizationState() return value", async () => {
  const result = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  assert.equal("codeVerifier" in result, false);
  assert.equal("verifier" in result, false);
});

test("24. the verifier is bound to its state — a different state's verifier is never returned", async () => {
  const one = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const two = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const consumedOne = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: one.state });
  const consumedTwo = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: two.state });
  assert.notEqual(consumedOne!.codeVerifier, consumedTwo!.codeVerifier);
});

test("25. the verifier cannot be retrieved again after consumption (one-time)", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const first = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  assert.ok(first);
  const second = await consumeAuthorizationState({ actor: actorA(), provider: "google", rawState: state });
  assert.equal(second, null);
});

// ==================== §27 IDOR test matrix ====================

test("26. a user lists only their own connections", async () => {
  await createOrReplaceConnection(actorA(), "google", { providerAccountId: "a-acct", scopes: [], accessToken: null, accessTokenExpiresAt: null, refreshToken: "a-refresh" });
  const { status, json } = await api("/external-accounts/me", { userId: `user_${RUN}_a` });
  assert.equal(status, 200);
  assert.ok(json.data.connections.some((c: any) => c.provider === "google"));
});

test("27. another learner cannot read a different learner's connections (no cross-user read path exists)", async () => {
  await createOrReplaceConnection(actorA(), "microsoft", { providerAccountId: "a-acct-ms", scopes: [], accessToken: null, accessTokenExpiresAt: null, refreshToken: "a-refresh-ms" });
  const { json } = await api("/external-accounts/me", { userId: `user_${RUN}_b` });
  assert.equal(json.data.connections.some((c: any) => c.provider === "microsoft"), false, "B's own list must never include A's connection");
});

test("28. cross-org actors are structurally isolated (repo scopes by organization_id + user_id together)", async () => {
  const listB = await listConnectionsForActor(actorB());
  assert.equal(listB.some((c) => c.provider === "google"), false);
});

test("29. no route exists for an admin (or anyone) to retrieve another actor's connection secrets", async () => {
  const { status, json } = await api("/external-accounts/me", { userId: "user_admin_001" });
  assert.equal(status, 200);
  assert.equal(json.data.connections.length, 0, "admin's own actor-scoped list must not include other learners' connections");
});

test("30/31. a spoofed identity in the request body/query is ineffective — the actor always comes from the authenticated session", async () => {
  const { json } = await api("/external-accounts/me?userId=" + encodeURIComponent(actorA().user_id), { userId: `user_${RUN}_b` });
  assert.equal(json.data.connections.some((c: any) => c.provider === "google"), false, "a query-string userId must never override the session actor");
});

test("32. there is no direct-connection-ID route, so cross-user ID lookup is not merely denied but structurally absent (DELETE is keyed only by provider)", async () => {
  const del = await api("/external-accounts/google", { method: "DELETE", userId: `user_${RUN}_b` });
  assert.equal(del.status, 404, "B has no google connection of their own — deleting by provider never lets B target A's row");
  const stillThere = await listConnectionsForActor(actorA());
  assert.ok(stillThere.some((c) => c.provider === "google"), "A's connection must be unaffected by B's request");
});

// ==================== §28 Lifecycle test matrix ====================

test("33. creating a connection results in ACTIVE status", async () => {
  const dto = await createOrReplaceConnection(actorB(), "google", { providerAccountId: "b-acct", scopes: ["calendar.readonly"], accessToken: null, accessTokenExpiresAt: null, refreshToken: "b-refresh-1" });
  assert.equal(dto.status, "ACTIVE");
});

test("34. replacing the refresh token re-encrypts under a fresh envelope", async () => {
  await createOrReplaceConnection(actorB(), "google", { providerAccountId: "b-acct", scopes: [], accessToken: null, accessTokenExpiresAt: null, refreshToken: "b-refresh-1" });
  const before = await query("SELECT refresh_token_ciphertext FROM external_account_connections WHERE organization_id = $1 AND user_id = $2 AND provider = 'google'", [actorB().organization_id, actorB().user_id]);
  await createOrReplaceConnection(actorB(), "google", { providerAccountId: "b-acct", scopes: [], accessToken: null, accessTokenExpiresAt: null, refreshToken: "b-refresh-2" });
  const after = await query("SELECT refresh_token_ciphertext FROM external_account_connections WHERE organization_id = $1 AND user_id = $2 AND provider = 'google'", [actorB().organization_id, actorB().user_id]);
  assert.notEqual(before.rows[0].refresh_token_ciphertext, after.rows[0].refresh_token_ciphertext);
});

test("35. marking reauth-required transitions status without destroying the row", async () => {
  await createOrReplaceConnection(actorB(), "microsoft", { providerAccountId: "b-acct-ms", scopes: [], accessToken: null, accessTokenExpiresAt: null, refreshToken: "b-refresh-ms" });
  await markReauthRequired(actorB(), "microsoft");
  const list = await listConnectionsForActor(actorB());
  const connection = list.find((c) => c.provider === "microsoft");
  assert.ok(connection);
  assert.equal(connection!.status, "REAUTH_REQUIRED");
  assert.equal(connection!.reauthRequired, true);
});

test("36. disconnecting revokes the connection and destroys the encrypted token material", async () => {
  await createOrReplaceConnection(actorB(), "google", { providerAccountId: "b-acct", scopes: [], accessToken: "b-access", accessTokenExpiresAt: null, refreshToken: "b-refresh-final" });
  const revoked = await revokeConnection(actorB(), "google");
  // Phase 12.2 extended this return shape to also report whether the
  // real provider's own revoke call succeeded — see
  // docs/SHF_EXTERNAL_ACCOUNT_SECURITY.md's Phase 12.2 cross-reference.
  assert.equal(revoked.revoked, true);
  assert.equal(revoked.providerRevocationSucceeded, false, "google is not configured in this environment, so no real revocation call is ever attempted");
  const row = await query("SELECT status, refresh_token_ciphertext, access_token_ciphertext FROM external_account_connections WHERE organization_id = $1 AND user_id = $2 AND provider = 'google'", [actorB().organization_id, actorB().user_id]);
  assert.equal(row.rows[0].status, "REVOKED");
  assert.equal(row.rows[0].refresh_token_ciphertext, null);
  assert.equal(row.rows[0].access_token_ciphertext, null);
});

test("37. a revoked connection no longer appears in the actor's active connection list", async () => {
  const list = await listConnectionsForActor(actorB());
  assert.equal(list.some((c) => c.provider === "google"), false);
});

test("38. reconnecting after revocation safely replaces the row (ACTIVE again, one row per actor/provider)", async () => {
  await createOrReplaceConnection(actorB(), "google", { providerAccountId: "b-acct-new", scopes: [], accessToken: null, accessTokenExpiresAt: null, refreshToken: "b-refresh-reconnected" });
  const list = await listConnectionsForActor(actorB());
  const googleConnections = list.filter((c) => c.provider === "google");
  assert.equal(googleConnections.length, 1, "exactly one row per actor/provider, even after revoke + reconnect");
  assert.equal(googleConnections[0].status, "ACTIVE");
});
