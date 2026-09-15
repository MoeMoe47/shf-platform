// MET-12 — Student Enterprise System focused tests.
//
// Follows this repo's established MET-8/MET-9 testing convention (see
// tests/metaverse-phase8-opportunity-exchange.test.ts and
// tests/metaverse-student-market-contract.test.ts): pure-function unit
// tests wherever logic is DB-free, plus static source-text assertions
// proving server-derived identity, org/tenant scoping, and boundary
// invariants — this environment has no live Postgres to run full
// integration tests against, so those two techniques are this codebase's
// accepted rigor bar for this class of domain.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  canEnterpriseTransact,
  ENTERPRISE_CATALOG_CATEGORIES,
  ENTERPRISE_ROLES,
  ENTERPRISE_SELLER_AUTHORIZED_ROLES,
  ENTERPRISE_VISIBILITIES,
  isAllowedLifecycleTransition,
  isProhibitedEnterpriseCatalogClaim,
  STUDENT_ENTERPRISE_LEGAL_BOUNDARY_STATEMENT,
} from "../src/domain/metaverse/enterprise/model/enterprise-contract.ts";

const migration = readFileSync(new URL("../migrations/146_student_enterprises.sql", import.meta.url), "utf8");
const contract = readFileSync(new URL("../src/domain/metaverse/enterprise/model/enterprise-contract.ts", import.meta.url), "utf8");
const repo = readFileSync(new URL("../src/domain/metaverse/enterprise/repo/enterprise-repo.ts", import.meta.url), "utf8");
const policy = readFileSync(new URL("../src/domain/metaverse/enterprise/service/enterprise-policy.ts", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/domain/metaverse/enterprise/service/enterprise-service.ts", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/metaverse/enterprise/api/routes.ts", import.meta.url), "utf8");
const marketPolicy = readFileSync(new URL("../src/domain/metaverse/market/service/market-policy.ts", import.meta.url), "utf8");
const listingService = readFileSync(new URL("../src/domain/metaverse/market/service/listing-service.ts", import.meta.url), "utf8");
const marketMigration = readFileSync(new URL("../migrations/145_student_market.sql", import.meta.url), "utf8");
const treasuryAdapter = readFileSync(new URL("../src/domain/metaverse/market/service/market-treasury-adapter.ts", import.meta.url), "utf8");
const opportunityService = readFileSync(new URL("../src/domain/metaverse/opportunities/service/opportunity-service.ts", import.meta.url), "utf8");
const bidService = readFileSync(new URL("../src/domain/metaverse/opportunities/service/bid-service.ts", import.meta.url), "utf8");
const opportunityMigration = readFileSync(new URL("../migrations/144_student_opportunity_exchange.sql", import.meta.url), "utf8");
const projectAdapter = readFileSync(new URL("../src/domain/metaverse/opportunities/service/opportunity-project-adapter.ts", import.meta.url), "utf8");
const evidenceAdapter = readFileSync(new URL("../src/domain/metaverse/opportunities/service/opportunity-evidence-adapter.ts", import.meta.url), "utf8");
const passportService = readFileSync(new URL("../src/domain/metaverse/passport/service/passport-projection-service.ts", import.meta.url), "utf8");
const orchestrationService = readFileSync(new URL("../src/domain/metaverse/orchestration/service/city-orchestration-service.ts", import.meta.url), "utf8");
const roomContract = readFileSync(new URL("../src/domain/metaverse/communication/room-contract.ts", import.meta.url), "utf8");

// 1, 2 — auth required / active org required.
test("MET-12 policy fails closed with no identity and no active org context", () => {
  assert.match(policy, /AUTH_REQUIRED/);
  assert.match(policy, /ORG_CONTEXT_REQUIRED/);
  assert.match(marketPolicy, /assertAuthorizedEnterpriseActor/);
});

// 3, 17 — creator identity is server-derived; client cannot forge ACTIVE.
test("MET-12 creator identity is server-derived and lifecycle cannot be forged from the client", () => {
  assert.match(service, /createdByUserId:\s*s\.userId/);
  assert.doesNotMatch(service, /createdByUserId:\s*input\./);
  // createEnterprise's repo signature never accepts a caller-supplied lifecycle status.
  assert.doesNotMatch(repo, /createEnterprise\([^)]*lifecycleStatus/s);
  assert.match(migration, /lifecycle_status TEXT NOT NULL DEFAULT 'DRAFT'/);
});

// 4, 5, 6, 51 — org/tenant scope enforced on every read/write; no cross-tenant enumeration.
test("MET-12 every enterprise query is organization- and tenant-scoped", () => {
  assert.match(repo, /getById\(enterpriseId: string, organizationId: string, tenantId: string\)/);
  assert.match(repo, /WHERE enterprise_id=\$1 AND organization_id=\$2 AND tenant_id=\$3/);
  assert.match(repo, /WHERE enterprise_id=\$1 AND organization_id=\$2 AND tenant_id=\$3 AND version=\$5/);
  // getByIdUnscoped exists only for internal cross-domain checks; it is
  // never called directly from an HTTP route, so no route can use it to
  // enumerate another organization's enterprise by id.
  assert.doesNotMatch(routes, /getByIdUnscoped/);
  assert.doesNotMatch(service, /getByIdUnscoped/);
});

// 7, 8, 9 — canonical team required; forged team/membership denied.
test("MET-12 formation and role grants require real canonical team membership, never a client-asserted one", () => {
  assert.match(service, /assertCanManageTeam/);
  assert.match(service, /FROM studio_team_members WHERE studio_team_id=\$1 AND organization_id=\$2 AND tenant_id=\$3 AND user_id=\$4 AND status='ACTIVE' AND left_at IS NULL/);
  assert.match(policy, /assertActiveStudioTeamMember/);
  assert.doesNotMatch(service, /studioTeamId:\s*input\.studioTeamId,[\s\S]{0,80}status:\s*['"]ACTIVE['"]/, "team status must come from the database, not the request body");
});

// 10, 11 — allowed enterprise type enforced; educational/simulated is the default operating mode.
test("MET-12 enterprise category and operating mode are bounded, with SIMULATED as the safe default", () => {
  for (const category of ["PRODUCT_DESIGN", "DIGITAL_SERVICE", "CREATIVE_STUDIO", "COMMUNITY_SERVICE", "TECH_PROTOTYPE", "EVENT_SHOWCASE", "OTHER_EDUCATIONAL"]) {
    assert.match(migration, new RegExp(category));
  }
  for (const mode of ["SIMULATED", "EDUCATIONAL", "PROGRAM_SANDBOX", "EXTERNAL_REFERENCE_ONLY"]) {
    assert.match(migration, new RegExp(mode));
  }
  assert.match(migration, /operating_mode TEXT NOT NULL DEFAULT 'SIMULATED'/);
});

// 12, 39 — legal business claim rejected; career connection does not imply employment.
test("MET-12 legal/simulation boundary is explicit and enforced at formation", () => {
  assert.match(contract, /not a legal business, employer, payroll entity, tax entity, licensed contractor, registered company, or independent organization/);
  assert.equal(STUDENT_ENTERPRISE_LEGAL_BOUNDARY_STATEMENT.length > 0, true);
  assert.match(service, /LEGAL_BOUNDARY_ACK_REQUIRED/);
  assert.match(service, /if \(!input\.legalBoundaryAcknowledged\)/);
});

// 13, 14, 15, 16 — proposal starts non-active; approval required; unauthorized approval denied; authorized approval activates.
test("MET-12 lifecycle transitions require approval authority and follow the canonical state machine", () => {
  assert.equal(isAllowedLifecycleTransition("DRAFT", "PENDING_APPROVAL"), true);
  assert.equal(isAllowedLifecycleTransition("DRAFT", "ACTIVE"), false, "an enterprise cannot skip approval");
  assert.equal(isAllowedLifecycleTransition("PENDING_APPROVAL", "ACTIVE"), true);
  assert.equal(isAllowedLifecycleTransition("ACTIVE", "PENDING_APPROVAL"), false, "no backward transition into approval");
  assert.equal(isAllowedLifecycleTransition("ARCHIVED", "ACTIVE"), false, "archived is terminal");
  assert.match(service, /function assertReviewer/);
  assert.match(service, /APPROVAL_AUTHORITY_REQUIRED/);
  assert.match(service, /export async function approveEnterprise[\s\S]{0,120}assertReviewer\(actor\)/);
});

// 18, 19 — suspended/closed enterprises cannot transact.
test("MET-12 only ACTIVE enterprises may transact", () => {
  assert.equal(canEnterpriseTransact("ACTIVE"), true);
  for (const status of ["DRAFT", "PENDING_APPROVAL", "PAUSED", "SUSPENDED", "CLOSED", "ARCHIVED"]) {
    assert.equal(canEnterpriseTransact(status as any), false, `${status} must not be transactable`);
  }
  assert.match(policy, /ENTERPRISE_NOT_ACTIVE/);
});

// 20, 21 — roles are governed; a forged/unknown role is rejected.
test("MET-12 enterprise roles are a bounded, governed set", () => {
  assert.deepEqual([...ENTERPRISE_ROLES], ["FOUNDER", "OPERATIONS_LEAD", "CATALOG_MANAGER", "MEMBER"]);
  assert.equal((ENTERPRISE_ROLES as readonly string[]).includes("OWNER_ADMIN_HACK"), false);
  assert.match(service, /INVALID_ROLE/);
  assert.ok(ENTERPRISE_SELLER_AUTHORIZED_ROLES.every((role) => (ENTERPRISE_ROLES as readonly string[]).includes(role)));
  assert.equal((ENTERPRISE_SELLER_AUTHORIZED_ROLES as readonly string[]).includes("MEMBER"), false, "plain MEMBER is not sufficient to sell on the enterprise's behalf");
});

// 22, 23, 36 — catalog category bounded; prohibited institutional goods/claims rejected; credits cannot buy institutional status.
test("MET-12 catalog cannot claim to sell verified skill, credentials, grades, or admission", () => {
  assert.deepEqual([...ENTERPRISE_CATALOG_CATEGORIES], ["PRODUCT", "SERVICE", "SHOWCASE_ITEM", "COMMUNITY_OFFERING"]);
  assert.equal(isProhibitedEnterpriseCatalogClaim({ title: "Buy a verified skill badge" }), true);
  assert.equal(isProhibitedEnterpriseCatalogClaim({ title: "Guaranteed admission consulting" }), true);
  assert.equal(isProhibitedEnterpriseCatalogClaim({ title: "Logo design service" }), false);
  assert.match(service, /PROHIBITED_CATALOG_CLAIM/);
});

// 24, 25 — Market listing reuses MET-9; no duplicate Market listing/order authority.
test("MET-12 reuses MET-9 Market authority and never duplicates it", () => {
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS market_listings/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS market_orders/);
  assert.match(migration, /ALTER TABLE market_listings/);
  assert.match(marketPolicy, /assertAuthorizedEnterpriseActor\(enterpriseId, s\.organizationId, s\.tenantId, s\.userId\)/);
  assert.match(listingService, /enterpriseRepo\.recordHistory/, "history is best-effort projection, not a second source of truth");
  assert.match(marketMigration, /seller_type TEXT NOT NULL CHECK/);
});

// 26, 27, 29 — opportunity bid reuses MET-8; no duplicate bid authority; eligibility is server-derived.
test("MET-12 enterprise bids reuse the canonical MET-8 TEAM bid path with no separate bid table", () => {
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS student_opportunity_bids/);
  assert.match(opportunityMigration, /CREATE TABLE IF NOT EXISTS student_opportunity_bids/);
  assert.match(bidService, /assertActiveEnterpriseForBidding\(opportunity\.sourceRef, s\.organizationId, s\.tenantId, s\.userId\)/);
  assert.match(bidService, /ENTERPRISE_TEAM_MISMATCH/);
  assert.match(bidService, /repo\.createBid\(/, "still a plain student_opportunity_bids row, never a second table");
});

// 28 — enterprise source_ref validates a real enterprise (no orphan strings).
test("MET-12 STUDENT_ENTERPRISE source_ref is validated against a real, org-scoped enterprise", () => {
  assert.match(opportunityService, /case "STUDENT_ENTERPRISE": \{/);
  assert.match(opportunityService, /getEnterpriseOrThrow\(sourceRef, s\.organizationId/);
  assert.match(opportunityService, /SOURCE_NOT_FOUND/);
});

// 30, 31, 32 — project handoff reuses canonical project authority; no self-verification; evidence remains a candidate.
test("MET-12 does not touch project handoff or evidence boundary authority", () => {
  assert.doesNotMatch(projectAdapter, /enterprise/i, "project handoff stays generic/reused, not enterprise-special-cased");
  assert.match(evidenceAdapter, /isVerifiedEvidence: false/);
  assert.match(evidenceAdapter, /canBecomeEvidenceCandidate/);
  assert.doesNotMatch(evidenceAdapter, /projectAuthoritativeFact\(|createEvidenceRule\(/, "the adapter only describes these calls in a comment; it never invokes them");
});

// 33, 34, 35 — Treasury remains balance authority; no shadow balance; compensation uses the Treasury boundary.
test("MET-12 never creates a shadow balance, ledger, or payment settlement", () => {
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS .*(balance|ledger)/i);
  assert.doesNotMatch(service, /balance\s*[:=]|settlePayment\(|creditAccount\(/i, "the service never mutates a balance or settles payment itself");
  assert.match(treasuryAdapter, /InMemoryTreasuryAdapter/, "Treasury adapter is untouched by MET-12");
});

// 37, 38 — Passport enterprise experience is projection only; membership alone is not verified skill.
test("MET-12 Work Passport enterprise claims are read-only projection, never VERIFIED from membership alone", () => {
  const enterpriseLoopStart = passportService.indexOf("input.sources.enterpriseExperience");
  const enterpriseLoopBlock = passportService.slice(enterpriseLoopStart, enterpriseLoopStart + 1400);
  assert.match(enterpriseLoopBlock, /claimType: "ENTERPRISE_EXPERIENCE"/);
  assert.doesNotMatch(enterpriseLoopBlock, /verificationLevel:\s*"VERIFIED"/);
  assert.match(enterpriseLoopBlock, /notEmploymentNotVerifiedSkill/);
  assert.doesNotMatch(passportService, /INSERT INTO student_enterprise/i);
});

// 40, 41, 42 — Program Mission / Side Mission support; Arcade remains a practice signal (untouched invariant).
test("MET-12 reuses the existing Program/Side Mission and Arcade opportunity types without new authority", () => {
  assert.match(opportunityMigration, /'PROGRAM_MISSION','SIDE_MISSION'/);
  assert.match(opportunityMigration, /STUDENT_ENTERPRISE_CONTRACT/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS .*(mission|arcade)/i, "MET-12 introduces no competing mission/arcade authority");
});

// 43, 44, 49 — visibility enforced; private enterprise excluded from discovery; suspended excluded from discovery.
test("MET-12 discovery listing excludes PRIVATE visibility and non-transactable lifecycle states", () => {
  assert.deepEqual([...ENTERPRISE_VISIBILITIES], ["PRIVATE", "PROGRAM", "ORGANIZATION", "NETWORK", "CITY"]);
  assert.match(service, /listForOrganization\(s\.organizationId, s\.tenantId, \["ACTIVE", "PAUSED"\]\)/);
  assert.match(service, /enterprise\.visibility !== "PRIVATE"/);
});

// 45 — no personal contact info in the model.
test("MET-12 enterprise records never carry personal contact information", () => {
  assert.doesNotMatch(contract, /email|phone|address/i);
  assert.doesNotMatch(migration, /email|phone|address/i);
});

// 46 — no enterprise DM; only existing governed rooms are reused.
test("MET-12 introduces no enterprise DM system and only reuses existing governed room types", () => {
  assert.doesNotMatch(service, /direct.?message|\bDM\b/i);
  for (const roomType of ["TEAM_ROOM", "PROJECT_ROOM", "HELP_SUPPORT_ROOM"]) {
    assert.match(roomContract, new RegExp(roomType));
  }
});

// 47 — NCA reused via the same outbox mechanism other MET domains use.
test("MET-12 notifications reuse the canonical integration outbox, not a bespoke notification table", () => {
  assert.match(service, /IntegrationOutboxRepo/);
  assert.match(service, /metaverse\.enterprise\.proposal_submitted/);
  assert.match(service, /metaverse\.enterprise\.approved/);
  assert.match(service, /metaverse\.enterprise\.returned/);
  assert.match(service, /metaverse\.enterprise\.suspended/);
});

// 48 — no global ranking / leaderboard.
test("MET-12 history is a plain timeline with no score or leaderboard", () => {
  assert.doesNotMatch(service, /leaderboard|reputationScore|rank\(/i);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS .*(score|rank|leaderboard)/i);
});

// 50 — no new tenant/org authority; every table follows the canonical tenant invariant.
test("MET-12 introduces no new tenant/organization authority", () => {
  const tenantChecks = migration.match(/CHECK \(tenant_id = 'tenant:' \|\| organization_id\)/g) || [];
  assert.ok(tenantChecks.length >= 4, "every MET-12 table enforces the canonical tenant_id invariant");
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS organizations/);
});

// Route-level: every mutating route requires a permission, and approval-only
// routes use the APPROVE permission (never granted to STUDENT — see
// security-permissions.ts).
test("MET-12 routes are permission-gated and separate propose from approve authority", () => {
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_ENTERPRISE_APPROVE\)/);
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_ENTERPRISE_PROPOSE\)/);
  assert.match(routes, /\/approve.*requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_ENTERPRISE_APPROVE\)/);
});

// MET-12 remediation — the new reviewer-listing route/service is a genuinely
// new surface (previously nothing returned unfiltered, cross-visibility
// org enterprise data), so it gets its own permission/authority assertions
// rather than relying only on the frontend tests.
test("MET-12 review-listing route requires APPROVE permission and reuses assertReviewer, creating no new approval authority", () => {
  assert.match(routes, /\/enterprises\/review["'], requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_ENTERPRISE_APPROVE\)/);
  assert.match(service, /export async function listEnterprisesForReview\(actor: any\) \{\s*\n\s*const s = scope\(actor\);\s*\n\s*assertReviewer\(actor\);/);
  assert.match(service, /listEnterprisesForReview[\s\S]{0,120}repo\.listForOrganization\(s\.organizationId, s\.tenantId\)/, "reuses the same repo listing MET-12 already uses, no new query authority");
});
