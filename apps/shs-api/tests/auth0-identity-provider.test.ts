import assert from "node:assert/strict";
import { generateKeyPairSync, createSign } from "node:crypto";
import test from "node:test";
import { Auth0IdentityProvider } from "../src/auth/production-identity.ts";

const issuer = "https://tenant.example.auth0.com/";
const audience = "https://api.example.test";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk: any = publicKey.export({ format: "jwk" });
publicJwk.kid = "key-1";
publicJwk.alg = "RS256";
publicJwk.use = "sig";

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function token(claims: Record<string, unknown> = {}, header: Record<string, unknown> = {}) {
  const encodedHeader = encode({ alg: "RS256", typ: "JWT", kid: "key-1", ...header });
  const encodedClaims = encode({ iss: issuer, aud: audience, sub: "auth0|subject-1", exp: Math.floor(Date.now() / 1000) + 300, ...claims });
  const input = `${encodedHeader}.${encodedClaims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  return `${input}.${signer.sign(privateKey).toString("base64url")}`;
}

function provider(keys = [publicJwk]) {
  return new Auth0IdentityProvider({
    issuer,
    audience,
    fetcher: async () => ({ ok: true, json: async () => ({ keys }) } as Response),
    jwksTtlMs: 1,
  });
}

test("valid Auth0 RS256 token verifies and returns only external identity facts", async () => {
  const identity = await provider().verifyCredential({ credential: token({ email: "person@example.test", email_verified: true }), audience });
  assert.deepEqual(identity, {
    provider: "auth0",
    subject: "auth0|subject-1",
    email: "person@example.test",
    email_verified: true,
    account_status: "active",
  });
  assert.equal("permissions" in identity, false);
  assert.equal("role" in identity, false);
  assert.equal("organization_id" in identity, false);
});

test("issuer, audience, algorithm, signature, expiry, and not-before are verified", async () => {
  await assert.rejects(() => provider().verifyCredential({ credential: token({ iss: "https://wrong.example/" }), audience }), /invalid_auth0_issuer/);
  await assert.rejects(() => provider().verifyCredential({ credential: token({ aud: "wrong" }), audience }), /invalid_auth0_audience/);
  await assert.rejects(() => provider().verifyCredential({ credential: token({ exp: 1 }), audience }), /expired_auth0_token/);
  await assert.rejects(() => provider().verifyCredential({ credential: token({ nbf: Math.floor(Date.now() / 1000) + 60 }), audience }), /not_yet_valid_auth0_token/);
  await assert.rejects(() => provider().verifyCredential({ credential: token({}, { alg: "none" }), audience }), /invalid_auth0_algorithm/);
  const invalidSignature = `${token().split(".").slice(0, 2).join(".")}.aW52YWxpZA`;
  await assert.rejects(() => provider().verifyCredential({ credential: invalidSignature, audience }), /invalid_auth0_signature/);
});

test("unknown signing keys refresh JWKS and then fail closed when absent", async () => {
  let requests = 0;
  const instance = new Auth0IdentityProvider({
    issuer,
    audience,
    fetcher: async () => {
      requests += 1;
      return { ok: true, json: async () => ({ keys: requests === 1 ? [] : [publicJwk] }) } as Response;
    },
    jwksTtlMs: 1,
  });
  await assert.rejects(() => instance.verifyCredential({ credential: token({}), audience }), /auth0_jwks_empty/);
  assert.equal(requests, 1);
  await assert.rejects(() => provider([{ ...publicJwk, kid: "other" }]).verifyCredential({ credential: token({}), audience }), /auth0_signing_key_not_found/);
});
