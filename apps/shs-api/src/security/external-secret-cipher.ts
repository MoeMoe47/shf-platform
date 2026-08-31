// SHF Ecosystem Phase 12.1 — reusable authenticated-encryption envelope
// for third-party secrets that this app must later replay back to their
// owner (OAuth refresh/access tokens, PKCE verifiers). This is the first
// reversible-encryption primitive in this codebase — everything before it
// (session tokens, calendar feed tokens) is a self-issued bearer credential
// this app both creates and verifies, so one-way SHA-256 hashing was
// sufficient (see calendar-feed-token-service.ts's own header comment).
// An OAuth refresh token must be sent back to Google/Microsoft verbatim,
// so it cannot be hashed — it must be reversibly, authentically encrypted
// at rest instead.
//
// Key management deliberately mirrors the existing, already-audited
// service-key convention in outbox.ts / .env.example
// (SHF_INTERNAL_SERVICE_ACTIVE_KID / _KEYS_JSON / _KEYS_REF) rather than
// inventing a second pattern: an active key id names which key in a
// { kid: base64(32 bytes) } map is used for new encryptions; every
// envelope records the kid it was encrypted under, so old envelopes stay
// decryptable after the active kid is rotated forward, as long as the old
// key remains in the map. Production must source keys from an approved
// secret manager (SHF_EXTERNAL_SECRET_KEYS_REF) and fails closed if only
// the local/dev JSON var is set.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { isProductionEnvironment } from "../auth/production-identity.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96-bit nonce, the GCM-recommended size
const KEY_LENGTH_BYTES = 32; // AES-256

export interface SecretEnvelope {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  keyVersion: string;
}

function loadKeyMap(env: NodeJS.ProcessEnv): Record<string, string> {
  if (isProductionEnvironment(env) && !env.SHF_EXTERNAL_SECRET_KEYS_REF) {
    throw new Error("production_external_secret_key_provider_required");
  }
  const raw = String(env.SHF_EXTERNAL_SECRET_KEYS_JSON || "").trim();
  if (!raw) throw new Error("external_secret_keys_missing");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("external_secret_keys_invalid");
    }
    return parsed;
  } catch {
    throw new Error("external_secret_keys_invalid");
  }
}

function resolveKey(keyVersion: string, env: NodeJS.ProcessEnv): Buffer {
  const keys = loadKeyMap(env);
  const encoded = keys[keyVersion];
  if (!encoded) throw new Error("external_secret_key_unknown");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== KEY_LENGTH_BYTES) throw new Error("external_secret_key_invalid_length");
  return key;
}

function activeKeyVersion(env: NodeJS.ProcessEnv): string {
  const kid = String(env.SHF_EXTERNAL_SECRET_ACTIVE_KID || "").trim();
  if (!kid) throw new Error("external_secret_active_kid_missing");
  return kid;
}

/** Encrypts one secret value under the currently active key. */
export function encryptSecret(plaintext: string, env: NodeJS.ProcessEnv = process.env): SecretEnvelope {
  const keyVersion = activeKeyVersion(env);
  const key = resolveKey(keyVersion, env);
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyVersion,
  };
}

/**
 * Decrypts a previously-encrypted envelope, verifying its GCM auth tag.
 * Throws (never returns a "best effort" plaintext) if the ciphertext, IV,
 * or auth tag has been tampered with, or if the recorded key version is
 * no longer available — a decryption failure must never be treated as an
 * empty/absent secret by a caller.
 */
export function decryptSecret(envelope: SecretEnvelope, env: NodeJS.ProcessEnv = process.env): string {
  const key = resolveKey(envelope.keyVersion, env);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** True only when an active key and a resolvable key map are both configured. */
export function externalSecretCipherConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    resolveKey(activeKeyVersion(env), env);
    return true;
  } catch {
    return false;
  }
}
