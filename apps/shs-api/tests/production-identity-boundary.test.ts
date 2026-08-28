import assert from "node:assert/strict";
import test from "node:test";
import { IdentityService } from "../src/domain/identity/service/identity-service.ts";
import { authMiddleware } from "../src/auth/auth-middleware.ts";
import { buildRouter } from "../src/api/router.ts";
import {
  assertProductionIdentityProviderConfigured,
  isProductionEnvironment,
} from "../src/auth/production-identity.ts";

const originalEnv = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, originalEnv);
}

test.afterEach(restoreEnv);

test("production identity readiness fails closed for an unsupported provider", () => {
  process.env.SHS_AUTH_ENV = "production";
  process.env.SHS_IDENTITY_PROVIDER = "local-fixture";
  process.env.SHS_IDENTITY_PROVIDER_AUDIENCE = "shs-api";
  process.env.SHS_SESSION_SECRET_REF = "secret://shs/session";

  assert.equal(isProductionEnvironment(), true);
  assert.throws(
    () => assertProductionIdentityProviderConfigured(),
    /SHS_IDENTITY_PROVIDER must be auth0/,
  );
});

test("production startup requirements fail closed when identity configuration is missing", () => {
  process.env.SHS_AUTH_ENV = "production";
  assert.throws(
    () => assertProductionIdentityProviderConfigured(),
    /SHS_IDENTITY_PROVIDER is required in production/,
  );
});

test("development identity fixture is never accepted as a production bearer credential", async () => {
  process.env.SHS_AUTH_ENV = "production";
  const req: any = { headers: { authorization: "Bearer dev-token:user_operator_001" } };
  await authMiddleware(req, {}, () => undefined);
  assert.equal(req.user, null);
});

test("production login cannot authenticate through the development identity repository", async () => {
  process.env.SHS_AUTH_ENV = "production";
  await assert.rejects(
    () => new IdentityService().login("admin@siliconheartland.org", "any-password"),
    /production_identity_provider_required/,
  );
});

test("development fixture authentication remains explicitly environment-scoped", async () => {
  process.env.SHS_AUTH_ENV = "development";
  const req: any = { headers: { authorization: "Bearer dev-token:user_operator_001" } };
  await authMiddleware(req, {}, () => undefined);
  assert.equal(req.user.user_id, "user_operator_001");
});

test("production router does not mount legacy fixture identity routes", () => {
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
      if (typeof path === "string") routes.push(path);
    };
  }
  buildRouter(app);
  assert.equal(routes.includes("/users"), false);
  assert.equal(routes.includes("/organizations"), false);
  assert.equal(routes.includes("/roles"), false);
  assert.equal(routes.includes("/invites"), false);
  assert.equal(routes.includes("/public/impact/curriculum-lesson-completions"), true);
});
