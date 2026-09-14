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

const servicePath = "apps/shs-api/src/domain/identity/service/organization-admin-experience-service.ts";
const routePath = "apps/shs-api/src/domain/identity/api/routes.ts";
const membershipPath = "apps/shs-api/src/domain/identity/service/membership-service.ts";
const pagePath = "src/pages/admin/identity/IdentityManagement.jsx";
const testsPath = "apps/shs-api/tests/ioh4-org-admin-experience.test.ts";
const reportPath = "docs/architecture/IOH-4_ORGANIZATION_ADMINISTRATION_ENTITLEMENT_EXPERIENCE.md";

const service = existsSync(resolve(root, servicePath)) ? read(servicePath) : "";
const routes = existsSync(resolve(root, routePath)) ? read(routePath) : "";
const membership = existsSync(resolve(root, membershipPath)) ? read(membershipPath) : "";
const page = existsSync(resolve(root, pagePath)) ? read(pagePath) : "";
const tests = existsSync(resolve(root, testsPath)) ? read(testsPath) : "";
const report = existsSync(resolve(root, reportPath)) ? read(reportPath) : "";

check("org-admin surface bounded", service.includes("organization_admin_experience_projection") && routes.includes("/identity/organization-admin/overview"));
check("no platform authority leakage", service.includes("org_admin_is_platform_admin: false") && service.includes("platform_roles_hidden_from_org_admin: true"));
check("members consume canonical IOH-3 state", service.includes("MembershipService") && page.includes("/identity/memberships/") && membership.includes("LAST_ADMIN_REQUIRED"));
check("role policy preserved", membership.includes("ORG_ADMIN_ASSIGNABLE_ROLE_NAMES") && page.includes("Permitted role"));
check("entitlement source authority preserved", service.includes("service_catalog_projection") && tests.includes("cannot directly self-grant service entitlement"));
check("relationship summary read-only bounded", service.includes("organization_relationships_read_only_summary") && page.includes("read-only"));
check("active org context required", service.includes("Active organization context is required") && page.includes("active backend session"));
check("multi-org scoping", service.includes("Cannot read another organization's administration context") && tests.includes("active-org bounded"));
check("suspended org semantics", page.includes("Organization suspended") && report.includes("Suspended / Revoked Services"));
check("settings bounded", service.includes("READ_ONLY") && page.includes("No organization settings are editable"));
check("EXR boundary", report.includes("EXR owns"));
check("NCA boundary", report.includes("NCA remains"));
check("no MFA SSO SCIM implementation", service.includes("mfa_sso_scim_implemented: false") && report.includes("MFA, SSO, and SCIM"));
check("no migration created", !existsSync(resolve(root, "apps/shs-api/migrations/144_ioh_org_admin_experience.sql")));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}`);
}

if (failed.length) {
  console.error(`IOH organization admin validation failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log("IOH organization admin experience validation passed.");
