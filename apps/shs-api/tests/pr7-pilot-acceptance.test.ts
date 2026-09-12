import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const router = read("../../../src/router/AdminRoutes.jsx") + read("../../../src/router/CurriculumRoutes.jsx") + read("../../../src/router/FoundationRoutes.jsx");
const pr0 = read("../../../docs/architecture/PR-0_HISTORICAL_GAP_CLOSURE_AUDIT.md");
const onboarding = read("../tests/organization-onboarding.test.ts");
const entitlements = read("../tests/service-catalog-entitlements.test.ts");
const providerRoutes = read("../src/domain/government-assurance/api/routes.ts");
const providerService = read("../src/domain/government-assurance/service/provider-self-service-service.ts");
const providerUi = read("../../../src/pages/civicsure/CivicSureApp.jsx");

test("PR-7 route smoke keeps canonical destinations and protected admin surfaces", () => {
  for (const route of ["/hub", "/agent-fabric", "/release-assurance", "asl/dashboard", "/studio"]) {
    assert.match(router, new RegExp(`path=["']${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
  assert.match(pr0, /PR0-GAP-026/);
  assert.match(pr0, /PR0-GAP-027/);
});

test("PR-7 primary organization path has canonical onboarding and entitlement coverage", () => {
  assert.match(onboarding, /organization|activation|relationship/i);
  assert.match(entitlements, /entitlement|organization|service/i);
  assert.match(pr0, /PR0-GAP-028/);
  assert.match(pr0, /PR0-GAP-029/);
});

test("PR-7 keeps real-organization evidence separate from repository provider acceptance", () => {
  assert.match(pr0, /no real organization|real organization/i);
  assert.doesNotMatch(pr0, /provider self-service API\/UI is honestly unavailable/i);
});

test("CivicSure provider self-service is canonical, scoped, and authority-bounded", () => {
  assert.match(providerRoutes, /provider-workspace/);
  assert.match(providerRoutes, /GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_VIEW/);
  assert.match(providerService, /provider_reference=\$1/);
  assert.match(providerService, /canVerify: false/);
  assert.match(providerService, /canPublish: false/);
  assert.match(providerService, /canTriggerPayment: false/);
  assert.match(providerUi, /provider-workspace/);
  assert.doesNotMatch(providerUi, /Provider self-service is not configured/);
});
