import assert from "node:assert/strict";
import test from "node:test";
import { PR4_INTEGRATION_INVENTORY, assessConfiguration, assertTestAdapterCannotRunInProduction, callbackMatchesScope, normalizeProviderError, retryDecision } from "../src/domain/external-integrations/integration-readiness.js";

test("inventory records existing adapters without claiming real activation", () => {
  assert.ok(PR4_INTEGRATION_INVENTORY.some((item) => item.integration === "Registry" && item.adapter && item.production === false));
  assert.ok(PR4_INTEGRATION_INVENTORY.some((item) => item.integration === "Payment provider" && item.adapter));
  assert.equal(PR4_INTEGRATION_INVENTORY.some((item) => item.production), false);
});

test("configuration readiness never equates present config with provider verification", () => {
  assert.deepEqual(assessConfiguration("registry", ["REGISTRY_URL", "REGISTRY_KEY"], { REGISTRY_URL: "https://example.invalid" }), { integration: "registry", requiredConfig: ["REGISTRY_URL", "REGISTRY_KEY"], presentConfig: ["REGISTRY_URL"], status: "DEGRADED", productionConfigured: false, productionTested: false });
});

test("provider errors normalize and retry only idempotent transient work", () => {
  assert.deepEqual(normalizeProviderError({ status: 429 }), { category: "RATE_LIMITED", retryable: true });
  assert.equal(retryDecision({ status: 503 }, 1, { idempotent: true }).retry, true);
  assert.equal(retryDecision({ status: 503 }, 1, { idempotent: false }).retry, false);
  assert.equal(retryDecision({ status: 401 }, 1, { idempotent: true }).retry, false);
});

test("callbacks require provider, external reference, tenant, and organization match", () => {
  const mapping = { provider: "registry", providerReference: "r-1", organizationId: "org-a", tenantId: "tenant-a" };
  assert.equal(callbackMatchesScope({ ...mapping, idempotencyKey: "evt-1" }, mapping), true);
  assert.equal(callbackMatchesScope({ ...mapping, organizationId: "org-b" }, mapping), false);
});

test("test and mock adapters are forbidden in production", () => {
  assert.throws(() => assertTestAdapterCannotRunInProduction("local-test-registry", { NODE_ENV: "production" }), /forbidden/);
  assert.equal(assertTestAdapterCannotRunInProduction("local-test-registry", { NODE_ENV: "test" }), true);
});
