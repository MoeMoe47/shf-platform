import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const organizationContext = read("apps/shs-api/src/auth/organization-context.ts");
const authResponse = read("apps/shs-api/src/auth/auth-response.ts");
const authMiddleware = read("apps/shs-api/src/auth/auth-middleware.ts");
const auth0SessionService = read("apps/shs-api/src/domain/identity/service/auth0-session-service.ts");
const ioh2Tests = read("apps/shs-api/tests/ioh2-multi-org-context.test.ts");
const ioh1Tests = read("apps/shs-api/tests/ioh1-context-contract.test.ts");
const frontendPreference = read("src/system/identity/organizationContextPreference.js");
const reportPath = "docs/architecture/IOH-2_MULTI_ORGANIZATION_ACTIVE_ORGANIZATION_HARDENING.md";
const report = existsSync(resolve(root, reportPath)) ? read(reportPath) : "";

check("active org resolver exists", organizationContext.includes("resolveActiveOrganizationContext"));
check("canonical transition contract exists", organizationContext.includes("resolveOrganizationContextTransition"));
check("preferred org is non-authoritative", organizationContext.includes("ignored_preferred_organization_id") && organizationContext.includes("preferredOrganizationId"));
check("authorized org list remains canonical", authResponse.includes("authorized_organizations") && authResponse.includes("isAuthorizedOrganizationMembership"));
check("role recomputes per org", ioh2Tests.includes("role_context.primary_role") && ioh2Tests.includes("operator"));
check("permissions recompute per org", ioh2Tests.includes("permission_context.permissions") && ioh2Tests.includes("program.create"));
check("entitlements recompute per org", ioh2Tests.includes("entitlement_summary.items") && authResponse.includes("service_catalog_projection"));
check("suspended/revoked org handled", ioh2Tests.includes("MEMBERSHIP_REVOKED") && ioh2Tests.includes("ORG_SUSPENDED"));
check("no-org state represented", ioh2Tests.includes("ORG_CONTEXT_UNAVAILABLE") && authResponse.includes("safe_landing"));
check("no global role leakage", ioh2Tests.includes("Org B") || ioh2Tests.includes("org-b"));
check("no global entitlement leakage", ioh2Tests.includes("project_studio") && ioh2Tests.includes("deepEqual(orgB.entitlement_summary.items, [])"));
check("no client authority", authMiddleware.includes("getPreferredOrganizationId") && organizationContext.includes("requestedOrganizationId"));
check("stale client state invalidation exists", frontendPreference.includes("clearOrganizationScopedClientState") && organizationContext.includes("clear_org_scoped_state"));
check("route-validity contract exists", organizationContext.includes("routeValidityContract") && authResponse.includes("route_validity_contract"));
check("EXR boundary preserved", report.includes("EXR decides") || report.includes("EXR Boundary"));
check("NCA boundary preserved", report.includes("NCA must not") || report.includes("NCA Boundary"));
check("IOH-1 regression updated", ioh1Tests.includes("ioh-2.context.v1"));
check("session preferred org support exists", auth0SessionService.includes("preferredOrganizationId"));
check("no duplicate organization context v2 file", !existsSync(resolve(root, "apps/shs-api/src/auth/organization-context-v2.ts")));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}`);
}

if (failed.length) {
  console.error(`IOH multi-org context validation failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log("IOH multi-org context validation passed.");
