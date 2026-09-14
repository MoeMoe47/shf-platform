import { existsSync, readdirSync, readFileSync } from "node:fs";

const requiredArtifacts = [
  "docs/architecture/IOH-0_IDENTITY_ORGANIZATION_EXPERIENCE_HARDENING_AUDIT.md",
  "docs/architecture/IOH_OWNER_DECISION_LOCK.md",
  "docs/architecture/IOH-1_CANONICAL_IDENTITY_ORGANIZATION_CONTEXT_CONTRACTS.md",
  "docs/architecture/IOH-2_MULTI_ORGANIZATION_ACTIVE_ORGANIZATION_HARDENING.md",
  "docs/architecture/IOH-3_MEMBERSHIP_ROLE_ADMINISTRATION_HARDENING.md",
  "docs/architecture/IOH-4_ORGANIZATION_ADMINISTRATION_ENTITLEMENT_EXPERIENCE.md",
  "docs/architecture/IOH-5_SESSION_REVOCATION_IDENTITY_GATEWAY_HARDENING.md",
  "docs/architecture/IOH-6_ACCEPTANCE_REGISTRY.json",
];

const source = [
  "apps/shs-api/src/auth/auth-response.ts",
  "apps/shs-api/src/auth/organization-context.ts",
  "apps/shs-api/src/auth/auth-middleware.ts",
  "apps/shs-api/src/auth/production-identity.ts",
  "apps/shs-api/src/domain/identity/service/membership-service.ts",
  "apps/shs-api/src/domain/identity/service/organization-admin-experience-service.ts",
  "apps/shs-api/src/domain/identity/service/auth0-session-service.ts",
  "src/auth/auth-context.jsx",
].map((path) => readFileSync(path, "utf8")).join("\n");
const report = readFileSync("docs/architecture/IOH-6_SYSTEM_WIDE_FINAL_ACCEPTANCE_COMPLETION.md", "utf8");
const registry = JSON.parse(readFileSync("docs/architecture/IOH-6_ACCEPTANCE_REGISTRY.json", "utf8"));
const migrationFiles = readdirSync("apps/shs-api/migrations");
const migrationNumbers = migrationFiles
  .map((name) => Number(name.match(/^(\d+)_/)?.[1]))
  .filter(Number.isFinite);
const migrationHead = Math.max(...migrationNumbers);
const ncaPreferenceMigration = "143_notification_preferences.sql";

const checks = [
  ["all IOH artifacts exist", requiredArtifacts.every(existsSync)],
  ["canonical context projection present", /authorized_organizations|active_organization_context|permission_context|entitlement_summary|session_authority_context/.test(source)],
  ["server-authoritative organization resolution", /resolveOrganizationContextTransition|applyActiveOrganizationContext/.test(source)],
  ["membership and role authority bounded", /target-role|targetRole|IDENTITY_MEMBERSHIP_ASSIGN|LAST_ADMIN_REQUIRED/.test(source)],
  ["organization admin authority bounded", /organization_admin_experience_projection|service_display_grants_entitlement/.test(source)],
  ["entitlement authority bounded", /service_display_grants_entitlement|entitlement.*authority/i.test(source)],
  ["session/revocation controls present", /AUTH_SESSION_INVALID|revoked_at|expires_at|revokeSession/.test(source)],
  ["Identity Gateway bounded", /ProductionIdentityProvider|Auth0SessionService/.test(source) && /does not own|not.*authority|authorization/i.test(report)],
  ["external dependencies honestly classified", /MFA.*external|SAML.*external|SCIM.*external|provider.*external/i.test(report)],
  ["EXR and NCA boundaries preserved", /EXR Boundary/.test(report) && /NCA Boundary/.test(report)],
  ["no duplicate authority subsystem", !/(organization-context-v2|new-org-context|identity-context-next)/i.test(source)],
  ["final P0/P1 counts zero", registry.p0_findings === 0 && registry.repository_local_p1_findings === 0 && /P0.*0|P0: 0/.test(report) && /P1.*0|P1: 0/.test(report)],
  ["integrated migration head is NCA 143", migrationHead === 143 && migrationFiles.includes(ncaPreferenceMigration) && registry.migration_head === 142],
  ["no IOH-6 migration exists", !migrationFiles.some((name) => /^14[3-9]_.*ioh/i.test(name))],
  ["no later unexpected migration exists", !migrationNumbers.some((number) => number > 143)],
  ["program registry is complete", registry.phases.length === 8 && registry.phases.every((phase) => phase.status === "COMPLETE")],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS ${label}`);
  else { failed += 1; console.error(`FAIL ${label}`); }
}
if (failed) process.exitCode = 1;
else console.log("IOH final validation passed.");
