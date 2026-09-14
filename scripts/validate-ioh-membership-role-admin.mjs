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

const service = read("apps/shs-api/src/domain/identity/service/membership-service.ts");
const routes = read("apps/shs-api/src/domain/identity/api/routes.ts");
const ioh3Tests = read("apps/shs-api/tests/ioh3-membership-role-admin.test.ts");
const ioh2Tests = read("apps/shs-api/tests/ioh2-multi-org-context.test.ts");
const reportPath = "docs/architecture/IOH-3_MEMBERSHIP_ROLE_ADMINISTRATION_HARDENING.md";
const report = existsSync(resolve(root, reportPath)) ? read(reportPath) : "";

check("canonical membership owner", service.includes("class MembershipService"));
check("canonical role owner reused", service.includes("JOIN roles") && service.includes("role_id"));
check("allowed lifecycle states explicit", report.includes("active") && report.includes("revoked"));
check("target-role policy explicit", service.includes("ORG_ADMIN_ASSIGNABLE_ROLE_NAMES") && service.includes("TARGET_ROLE_FORBIDDEN"));
check("self-escalation blocked", service.includes("SELF_ROLE_CHANGE_FORBIDDEN") && ioh3Tests.includes("self-escalation"));
check("org isolation", service.includes("Cannot assign membership outside the active organization") && ioh3Tests.includes("NOT_FOUND"));
check("duplicate active membership protection", service.includes("DUPLICATE_ACTIVE_MEMBERSHIP") && ioh3Tests.includes("duplicate active membership"));
check("invitation deferred safely", report.includes("Invitation functionality is deferred") && !service.includes("invitation_token"));
check("revocation behavior", service.includes("identity.membership.revoked") && ioh3Tests.includes("MEMBERSHIP_REVOKED"));
check("role change behavior", service.includes("identity.membership.role_changed") && routes.includes("/identity/memberships/:id/role"));
check("IOH-2 context invalidation", ioh3Tests.includes("resolveOrganizationContextTransition") && ioh2Tests.includes("MEMBERSHIP_REVOKED"));
check("last-admin protection", service.includes("LAST_ADMIN_REQUIRED") && ioh3Tests.includes("last-admin"));
check("audit event coverage", service.includes("identity.membership.assigned") && service.includes("identity.membership.role_changed") && service.includes("identity.membership.revoked"));
check("EXR boundary", report.includes("EXR owns"));
check("NCA boundary", report.includes("NCA remains"));
check("no migration created", !existsSync(resolve(root, "apps/shs-api/migrations/143_ioh_membership_role_admin.sql")));

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}`);
}

if (failed.length) {
  console.error(`IOH membership-role validation failed: ${failed.length} check(s).`);
  process.exit(1);
}

console.log("IOH membership-role validation passed.");
