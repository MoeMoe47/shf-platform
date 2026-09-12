import assert from "node:assert/strict";
import test from "node:test";
import { buildRouter } from "../src/api/router.ts";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.ts";
import { evaluateBreakGlassAttestation } from "../src/security/break-glass.ts";
import {
  assertPr1ProductionSecurityConfigured,
  evaluatePr1ProductionSecurityReadiness,
} from "../src/security/pr1-production-security-readiness.ts";

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, originalEnv);
}

function completePr1Env(): NodeJS.ProcessEnv {
  return {
    SHS_AUTH_ENV: "production",
    SHS_IDENTITY_PROVIDER: "auth0",
    SHS_IDENTITY_PROVIDER_AUDIENCE: "shs-api",
    SHS_SESSION_SECRET_REF: "secret://shs/session",
    AUTH0_ISSUER: "https://tenant.example/",
    AUTH0_AUDIENCE: "https://api.example",
    SHS_PRIVILEGED_MFA_REQUIRED: "1",
    SHS_PRIVILEGED_MFA_POLICY_REF: "idp://auth0/policies/privileged-mfa",
    SHS_FEDERATION_PROVIDER_REF: "idp://auth0/federation",
    SHS_FEDERATION_MAPPING_REF: "idp://auth0/group-map",
    SHF_INTERNAL_SERVICE_ACTIVE_KID: "kid-2026-09",
    SHF_INTERNAL_SERVICE_KEYS_REF: "secret://shf/internal-service",
    SHF_INTERNAL_SERVICE_KEY_ROTATION_REF: "runbook://security/service-key-rotation",
    SHF_EXTERNAL_SECRET_KEYS_REF: "secret://shf/external-secrets",
    SHF_EXTERNAL_SECRET_ACTIVE_KID: "external-kid-2026-09",
    SHS_SECRET_ROTATION_RUNBOOK_REF: "runbook://security/secret-rotation",
    SHS_BREAK_GLASS_POLICY_REF: "policy://security/break-glass",
    SHS_BREAK_GLASS_MFA_REQUIRED: "1",
    SHS_BREAK_GLASS_MAX_TTL_MINUTES: "30",
    SHS_SECURITY_EVENT_TAXONOMY_REF: "policy://security/event-taxonomy",
    SHS_SECURITY_EVENT_ESCALATION_REF: "runbook://security/event-escalation",
    SHS_SECURITY_EVENT_OWNER: "security-operations",
    SHS_SECURITY_EVENT_CLOSURE_REQUIRED: "1",
  };
}

test.afterEach(restoreEnv);

test("PR-1 readiness assertion is inert outside production", () => {
  assert.doesNotThrow(() => assertPr1ProductionSecurityConfigured({ SHS_AUTH_ENV: "development" }));
});

test("production readiness fails closed when repository-local PR-1 controls are incomplete", () => {
  assert.throws(
    () => assertPr1ProductionSecurityConfigured({ SHS_AUTH_ENV: "production" }),
    /PR-1 production security readiness incomplete/,
  );
});

test("PR-1 readiness distinguishes external identity blockers from repository-local closure", () => {
  const readiness = evaluatePr1ProductionSecurityReadiness(completePr1Env());
  const byGap = new Map(readiness.map((item) => [item.gapId, item]));

  assert.equal(byGap.get("PR0-GAP-001")?.status, "BLOCKED — EXTERNAL DEPENDENCY");
  assert.equal(byGap.get("PR0-GAP-002")?.status, "BLOCKED — EXTERNAL DEPENDENCY");
  assert.equal(byGap.get("PR0-GAP-003")?.status, "BLOCKED — EXTERNAL DEPENDENCY");
  assert.equal(byGap.get("PR0-GAP-004")?.status, "BLOCKED — EXTERNAL DEPENDENCY");
  assert.equal(byGap.get("PR0-GAP-005")?.status, "BLOCKED — EXTERNAL DEPENDENCY");
  assert.equal(byGap.get("PR0-GAP-006")?.status, "BLOCKED — EXTERNAL DEPENDENCY");
  assert.equal(byGap.get("PR0-GAP-016")?.status, "RESOLVED");
  assert.doesNotThrow(() => assertPr1ProductionSecurityConfigured(completePr1Env()));
});

test("break-glass attestation is denied without configuration, security permission, reason, ttl, and MFA", () => {
  const env = completePr1Env();
  const actor = {
    user_id: "user_security_1",
    permissions: [SHS_SECURITY_PERMISSIONS.SECURITY_MANAGE],
  };

  assert.equal(evaluateBreakGlassAttestation(null, {}, env).reasonCode, "AUTH_REQUIRED");
  assert.equal(evaluateBreakGlassAttestation(actor, { reason: "short", ttl_minutes: 10 }, env).reasonCode, "REASON_REQUIRED");
  assert.equal(
    evaluateBreakGlassAttestation({ ...actor, permissions: [] }, { reason: "Emergency production recovery", ttl_minutes: 10 }, env).reasonCode,
    "SECURITY_MANAGE_REQUIRED",
  );
  assert.equal(
    evaluateBreakGlassAttestation(actor, { reason: "Emergency production recovery", ttl_minutes: 60 }, env).reasonCode,
    "TTL_OUT_OF_POLICY",
  );
  assert.equal(
    evaluateBreakGlassAttestation(actor, { reason: "Emergency production recovery", ttl_minutes: 10 }, env).reasonCode,
    "MFA_REQUIRED",
  );
});

test("break-glass attestation never grants privilege and requires external MFA evidence", () => {
  const decision = evaluateBreakGlassAttestation(
    {
      user_id: "user_security_1",
      permissions: [SHS_SECURITY_PERMISSIONS.SECURITY_MANAGE],
      auth: { amr: ["pwd", "mfa"] },
    },
    { reason: "Emergency production recovery", ttl_minutes: 10 },
    completePr1Env(),
  );

  assert.equal(decision.status, "READY_FOR_EXTERNAL_MFA_ACTIVATION");
  assert.equal(decision.reasonCode, "ATTESTED");
  assert.equal(decision.auditEvent, "security.break_glass.attested");
});

test("production router registers break-glass attestation without restoring fixture identity routes", () => {
  process.env.SHS_AUTH_ENV = "production";
  process.env.SHS_IDENTITY_PROVIDER = "auth0";
  process.env.SHS_IDENTITY_PROVIDER_AUDIENCE = "shs-api";
  process.env.SHS_SESSION_SECRET_REF = "secret://shs/session";
  process.env.AUTH0_ISSUER = "https://tenant.example/";
  process.env.AUTH0_AUDIENCE = "https://api.example";

  const routes: string[] = [];
  const app: any = {};
  for (const method of ["get", "post", "put", "patch", "delete", "use"]) {
    app[method] = (path: string) => {
      if (typeof path === "string") routes.push(`${method.toUpperCase()} ${path}`);
    };
  }

  buildRouter(app);
  assert.equal(routes.includes("POST /security/break-glass/attest"), true);
  assert.equal(routes.includes("GET /users"), false);
  assert.equal(routes.includes("GET /organizations"), false);
});
