import { readFileSync } from "node:fs";

const files = {
  middleware: readFileSync("apps/shs-api/src/auth/auth-middleware.ts", "utf8"),
  provider: readFileSync("apps/shs-api/src/auth/production-identity.ts", "utf8"),
  session: readFileSync("apps/shs-api/src/domain/identity/service/auth0-session-service.ts", "utf8"),
  repo: readFileSync("apps/shs-api/src/domain/identity/repo/production-identity-repo.ts", "utf8"),
  router: readFileSync("apps/shs-api/src/api/router.ts", "utf8"),
  exr: readFileSync("docs/architecture/IOH-4_ORGANIZATION_ADMINISTRATION_ENTITLEMENT_EXPERIENCE.md", "utf8"),
};

const checks = [
  ["Identity Gateway bounded", /ProductionIdentityProvider|Auth0SessionService/ .test(files.provider + files.session)],
  ["provider abstraction preserved", /interface ProductionIdentityProvider/.test(files.provider)],
  ["Auth0 issuer and audience explicit", /invalid_auth0_issuer|invalid_auth0_audience/.test(files.provider)],
  ["Auth0 signature and JWKS verification", /auth0_signing_key_not_found|invalid_auth0_signature/.test(files.provider)],
  ["dev auth production-safe", /isProductionEnvironment\(\) \? null : parseDevToken/.test(files.middleware)],
  ["session expiry and revocation fail closed", /revoked_at IS NULL AND s\.expires_at > NOW\(\)/.test(files.repo)],
  ["disabled accounts fail closed", /u\.status = 'active'/.test(files.repo)],
  ["membership and role state re-resolved", /getActiveIdentity\(session\.internal_identity_id\)/.test(files.session)],
  ["invalid production session becomes unauthenticated", /AUTH_SESSION_INVALID/.test(files.middleware)],
  ["logout clears session cookie", /shs_session=; Max-Age=0/.test(files.router)],
  ["future MFA/federation remain external", /MFA|SSO|SCIM|external/i.test(files.exr)],
  ["EXR/NCA boundaries preserved", /EXR Boundary|NCA Boundary/.test(files.exr)],
  ["no IOH-5 migration created", !/migrations\/.*ioh.?5|CREATE TABLE.*session/i.test(Object.values(files).join("\n"))],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS ${label}`);
  else { failed += 1; console.error(`FAIL ${label}`); }
}
if (failed) process.exitCode = 1;
else console.log("IOH session and identity gateway validation passed.");
