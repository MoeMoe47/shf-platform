// Phase 6.5 — Workforce / Fundability Foundation acceptance.
// Programs are configuration and contracts on shared infrastructure, not course-specific software platforms.
// Funding relationships describe potential alignment; they do not establish eligibility or guarantee funding.
// A GENERIC reference package (PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION) is resolved against the real owning
// authorities: operational Program, Curriculum, Phase 6 Arcade Fabric, published Missions, MOL, Careers,
// competencies, organizations, funding awards and report profiles. Tests run in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { withTransaction } from "../src/db/transaction.js";
import { canonicalArcadeExperiences } from "../src/domain/arcade-integration/arcade-experience-bridge.js";
import { ArcadeIntegrationService } from "../src/domain/arcade-integration/service/arcade-integration-service.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";
import { registerMissionPublicationRoutes } from "../src/domain/mission-content/api/mission-publication-routes.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import type { MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { genericFundingSourceFixtures, infrastructureTechFoundationFixture, type FoundationFixtureRefs } from "../src/domain/workforce-foundation/fixtures/workforce-foundation-fixtures.js";
import {
  CAPABILITY_MATURITY, INTEGRATION_READINESS_QUESTIONS, PROGRAM_LIFECYCLE, WORKFORCE_CAPABILITIES, validateFundingSource, validateProgramPackage, type ProgramPackage,
} from "../src/domain/workforce-foundation/model/workforce-foundation.js";
import { evaluateFundabilityGate, evaluateIntegrationReadiness, evaluateLifecycleTransition, type FundabilityComponent } from "../src/domain/workforce-foundation/model/readiness-and-fundability.js";
import { WORKFORCE_FUNDING_SOURCES, WORKFORCE_PROGRAM_PACKAGES, buildWorkforceRegistry } from "../src/domain/workforce-foundation/registry/workforce-program-registry.js";
import { WorkforceFoundationService } from "../src/domain/workforce-foundation/service/workforce-foundation-service.js";
import * as mol from "../../../src/system/metaverse/mol/index.js";
import * as sensory from "../../../src/shared/experience/sensory/index.js";

const RUN = `wf65_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const PARTNER_ORG = `partner_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const STAFF = `staff_${RUN}`;
const OUTSIDER = `outsider_${RUN}`;
const ARCADE = `arcade_${RUN}`;
const COURSE = `${RUN}:course`;
const OPERATIONAL_PROGRAM = `program_${RUN}`;
const FAMILY = `career_family_${RUN}`;
const CAREER = `career_${RUN}`;
const COMPETENCY = `competency_${RUN}`;
const GRANT = `grant_${RUN}`;
const MISSION = `${RUN}:mission`;
const EXPERIENCE = `experience.learning.${RUN}`;
const COURSE_BODY = `Full course description ${RUN} owned by Curriculum.`;
const CAREER_BODY = `Career registry description ${RUN}.`;
const PASS = (_req: any, _res: any, next: any) => next();

const profile = (userId: string, org: string, permissions: string[]) =>
  ({ user_id: userId, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, permissions, roles: [] });
const users: Record<string, any> = {
  [AUTHOR]: profile(AUTHOR, ORG, ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"]),
  [REVIEWER]: profile(REVIEWER, ORG, ["project.submission.review", "studio.review.queue.view"]),
  [PUBLISHER]: profile(PUBLISHER, ORG, ["curriculum.catalog.publish", "curriculum.catalog.retire"]),
};
const staff = { user_id: STAFF, organization_id: ORG };
const outsider = { user_id: OUTSIDER, organization_id: OTHER_ORG };

const FUNDING_IDS = { grant: `${RUN}.fund.grant`, workforce: `${RUN}.fund.workforce`, employer: `${RUN}.fund.employer`, philanthropy: `${RUN}.fund.philanthropy` };
const REFS: FoundationFixtureRefs = {
  owningOrganizationId: ORG, operationalProgramId: OPERATIONAL_PROGRAM, courseId: COURSE, experienceId: EXPERIENCE, missionId: MISSION, missionVersion: 1,
  careerId: CAREER, competencyId: COMPETENCY, partnerOrganizationId: PARTNER_ORG, fundingSourceIds: FUNDING_IDS,
};
const fixture = () => infrastructureTechFoundationFixture(REFS);
const fundingSources = genericFundingSourceFixtures(FUNDING_IDS);
const mutate = (change: (value: any) => void): ProgramPackage => { const value: any = structuredClone(fixture()); change(value); return value; };

// Phase 6 Fabric, unchanged, over the canonical descriptor catalog plus one Learning reference descriptor.
const learningDescriptor = {
  id: EXPERIENCE, slug: `wf65-${RUN.replaceAll("_", "-")}`, activityReference: { arcadeActivityId: ARCADE },
  product: { family: "learning", experienceType: "mission" }, lifecycle: { status: "active", launchable: true, playable: true },
  launch: { route: `/arcade/learning/${EXPERIENCE}`, runtimeType: "internal" },
  presentation: { title: "Generic infrastructure practice", shortTitle: null, description: "Reference.", category: null, difficulty: "intermediate", artwork: null, thumbnail: null },
  capabilities: { leaderboardEligible: false, tournamentEligible: false, multiplayer: false, spectator: false, evidenceResultCapable: true, missionLaunch: true },
  relationships: {
    career: { relationshipType: "none", pathwayReferences: [] }, metaverse: { relationshipType: "none", experienceReferences: [] },
    agentFabric: { relationshipType: "none", capabilityReferences: [] }, treasury: { relationshipType: "none", rewardPolicyReference: null },
    studio: { relationshipType: "none", projectReferences: [] }, mission: { relationshipType: "reference", missionReferences: [{ missionId: MISSION, missionVersion: 1 }] },
  },
  accessibility: { profileAware: false, reducedMotionRequired: false, keyboardRequired: false },
  provenance: { classification: "canonical_descriptor", migratedFrom: [] },
};
const arcadeCatalog = canonicalArcadeExperiences([learningDescriptor]);
const fabric = new ArcadeIntegrationService({ experiences: () => arcadeCatalog.descriptors });
const serviceFor = (packages: ProgramPackage[]) => new WorkforceFoundationService({ registry: () => buildWorkforceRegistry({ packages, fundingSources }), arcade: fabric });
const service = serviceFor([fixture()]);

let server: Server;
let base = "";
async function call(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", "x-test-user": userId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}

async function publish(definition: MissionDefinition) {
  const created = await call("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const submitted = await call(`/studio/missions/drafts/${created.body.data.draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Phase 6.5" });
  const submissionId = submitted.body.data.submission.submissionId;
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "ok" })).status, 200);
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {})).status, 201);
}

const ORGS = [ORG, OTHER_ORG, PARTNER_ORG];
const SCOPED = ["mission_definition_drafts", "mission_review_submissions", "mission_published_releases", "mission_publication_events", "curriculum_courses", "programs", "users", "organizations"];
const TRIGGERS: Array<[string, string]> = [["mission_publication_events", "mission_publication_events_append_only"], ["mission_published_releases", "mission_published_release_immutable"],
  ["mission_review_submissions", "mission_review_submission_snapshot_immutable"]];

async function cleanup() {
  await withTransaction(async (tx) => {
    for (const [table, trigger] of TRIGGERS) await tx.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    for (const table of ["mission_publication_events", "mission_published_releases", "mission_review_submissions", "mission_definition_drafts"]) {
      await tx.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS]);
    }
    await tx.query("DELETE FROM funding_grants WHERE grant_id=$1", [GRANT]);
    await tx.query("DELETE FROM programs WHERE organization_id = ANY($1::text[])", [ORGS]);
    await tx.query("DELETE FROM curriculum_courses WHERE organization_id = ANY($1::text[])", [ORGS]);
    await tx.query("DELETE FROM arcade_activities WHERE arcade_activity_id=$1", [ARCADE]);
    await tx.query("DELETE FROM competency_definitions WHERE competency_id=$1", [COMPETENCY]);
    await tx.query("DELETE FROM careers WHERE career_id=$1", [CAREER]);
    await tx.query("DELETE FROM career_families WHERE career_family_id=$1", [FAMILY]);
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER, STAFF, OUTSIDER]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [ORGS]);
    for (const [table, trigger] of TRIGGERS) await tx.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
  });
}

const COUNTED = ["organizations", "users", "careers", "career_families", "curriculum_courses", "curriculum_units", "curriculum_lessons", "arcade_activities", "competency_definitions",
  "credential_definitions", "learner_credentials", "prepare_prove_evidence", "truth_spine_records", "curriculum_truth_facts", "program_careers", "organization_relationships",
  "funding_grants", "gpa_funding_references", "mission_runtime_sessions", "career_events", "opportunities"];
async function globalCounts() {
  return Object.fromEntries(await Promise.all(COUNTED.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table}`)).rows[0].count)])));
}
let baseline: Record<string, number> = {};

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active'),($5,$6,$6,'partner','active')`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`, PARTNER_ORG, `${RUN} Employer`]);
  for (const [userId, org] of [[AUTHOR, ORG], [REVIEWER, ORG], [PUBLISHER, ORG], [STAFF, ORG], [OUTSIDER, OTHER_ORG]]) {
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`, [userId, org, `${userId}@test.invalid`, `Person ${userId.split("_")[0]}`]);
  }
  await query("INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1,$2,'Generic infrastructure program','workforce','draft')", [OPERATIONAL_PROGRAM, ORG]);
  await query(`INSERT INTO curriculum_courses (course_id, organization_id, stable_key, title, full_description, status, created_by_user_id, updated_by_user_id) VALUES ($1,$2,$3,'Infrastructure Fundamentals',$4,'PUBLISHED',$5,$5)`,
    [COURSE, ORG, `${RUN}-course`, COURSE_BODY, AUTHOR]);
  await query("INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Generic practice','SCENARIO','PASSED_FLAG',$3)",
    [ARCADE, `${RUN.replaceAll("_", "-")}-practice`, AUTHOR]);
  await query("INSERT INTO career_families (career_family_id, slug, name) VALUES ($1,$2,'Infrastructure')", [FAMILY, `${RUN.replaceAll("_", "-")}-family`]);
  await query("INSERT INTO careers (career_id, slug, title, description, career_family_id) VALUES ($1,$2,'Infrastructure Technician',$3,$4)", [CAREER, `${RUN.replaceAll("_", "-")}-career`, CAREER_BODY, FAMILY]);
  await query(`INSERT INTO competency_definitions (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status)
    VALUES ($1,$2,'Safe system inspection','Generic competency.','infrastructure',1,'{}'::jsonb,'{}'::jsonb,'ACTIVE')`, [COMPETENCY, `${RUN.replaceAll("_", "-")}-competency`]);
  // A real award owned by the funding authority, used only to prove VERIFIED resolution.
  await query(`INSERT INTO funding_grants (grant_id, title, funder_organization_id, recipient_organization_id, reporting_organization_id, award_amount, start_date)
    VALUES ($1,'Generic award',$2,$3,$3,1000,'2026-01-01')`, [GRANT, PARTNER_ORG, ORG]);
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  const mission = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  mission.missionId = MISSION; mission.slug = `${RUN.replaceAll("_", "-")}-mission`; mission.status = "DRAFT"; mission.arcadeActivityId = ARCADE;
  await publish(mission);
  baseline = await globalCounts();
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await cleanup();
  // 30 — zero residue, and immutability triggers are enabled again.
  for (const table of SCOPED) {
    assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS])).rows[0].count), 0, `${table} residue`);
  }
  for (const [table, column, id] of [["arcade_activities", "arcade_activity_id", ARCADE], ["careers", "career_id", CAREER], ["career_families", "career_family_id", FAMILY],
    ["competency_definitions", "competency_id", COMPETENCY], ["funding_grants", "grant_id", GRANT]]) {
    assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${column}=$1`, [id])).rows[0].count), 0, `${table} residue`);
  }
  const triggers = (await query("SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = ANY($1::text[])", [TRIGGERS.map(([, name]) => name)])).rows;
  assert.equal(triggers.length, 3);
  for (const trigger of triggers) assert.equal(trigger.tgenabled, "O", trigger.tgname);
});

function sources(dir = "../src/domain/workforce-foundation/"): Array<[string, string]> {
  const root = new URL(dir, import.meta.url);
  return readdirSync(root).flatMap((name) => {
    const path = new URL(name, root);
    if (statSync(path).isDirectory()) return sources(`${dir}${name}/`);
    return name.endsWith(".ts") ? [[`${dir}${name}`, readFileSync(path, "utf8")] as [string, string]] : [];
  });
}

const component = (overrides: Partial<FundabilityComponent> = {}): FundabilityComponent => ({
  componentId: "generic.component", bucket: "DESTINATION_PROGRAM", workforceRelevance: "MET", measurableOutcomes: "MET", evidencePathway: "MET",
  employerRelevance: "MET", authorityClarity: "MET", implementationRisk: "LOW", reuseProgramCount: 1, ...overrides,
});

// ---------------------------------------------------------------- contracts and registries

test("registry: production registries start empty; the generic fixture validates; invalid entries are rejected and reported", () => {
  // Phase 7 registers exactly one real package; no illustrative fixture and no funding source is registered.
  assert.deepEqual([WORKFORCE_PROGRAM_PACKAGES.map((pkg) => pkg.program.programId), WORKFORCE_FUNDING_SOURCES.length], [["DATA_CENTER_COMMUNITY_WORKFORCE"], 0]);
  assert.deepEqual(validateProgramPackage(fixture()), []);
  for (const source of fundingSources) assert.deepEqual(validateFundingSource(source), [], source.fundingSourceId);
  const registry = buildWorkforceRegistry({ packages: [fixture(), fixture(), mutate((value) => { value.fundingRefs[0].fundingSourceId = "unregistered.source"; value.program.programId = "OTHER"; })], fundingSources });
  // Phase 8: a duplicated programId rejects every entry that claims it (fail closed).
  assert.equal(registry.packages.length, 0);
  assert.deepEqual(registry.rejected.map((item) => item.id), ["OTHER", "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION", "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION"]);
  assert.ok(registry.rejected.find((item) => item.id === "OTHER")!.errors.some((error) => /not a registered funding source/.test(error)));
  assert.deepEqual([...PROGRAM_LIFECYCLE], ["PLANNED", "DESIGN", "AUTHORITY_REVIEW", "INTEGRATION_READINESS", "PARTNER_VALIDATION", "PILOT_READY", "PILOT", "ACTIVE", "SUSPENDED", "RETIRED"]);
  assert.equal(Object.keys(WORKFORCE_CAPABILITIES).length, 14);
  assert.equal(INTEGRATION_READINESS_QUESTIONS.length, 12);
});

test("1/24 Program references Curriculum without copying it", async () => {
  const resolved = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(resolved.curriculum, { status: "AVAILABLE", items: [{ courseId: COURSE, title: "Infrastructure Fundamentals", status: "PUBLISHED", resolved: true }] });
  assert.doesNotMatch(JSON.stringify(resolved), new RegExp(COURSE_BODY));
  assert.deepEqual(resolved.operationalProgram, { status: "AVAILABLE", items: [{ programId: OPERATIONAL_PROGRAM, name: "Generic infrastructure program", status: "draft", resolved: true }] });
});

test("2/19/23 Program references Career without copying it or inferring job readiness", async () => {
  const resolved = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(resolved.careers.items, [{ careerId: CAREER, title: "Infrastructure Technician", status: "active", resolved: true, jobEligibilityInferred: false }]);
  assert.doesNotMatch(JSON.stringify(resolved), new RegExp(CAREER_BODY));
  assert.deepEqual(resolved.competencies.items, [{ competencyId: COMPETENCY, title: "Safe system inspection", status: "ACTIVE", resolved: true }]);
  const missing = await serviceFor([mutate((value) => { value.careerRefs = [{ careerId: `missing_${RUN}` }]; })]).resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(missing.careers.items, [{ careerId: `missing_${RUN}`, resolved: false, jobEligibilityInferred: false }], "unknown careers are reported, never fabricated");
});

test("3/25 Program references Arcade descriptors through the Phase 6 Fabric (no second Arcade registry)", async () => {
  const resolved = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(resolved.arcade.items, [{ experienceId: EXPERIENCE, productType: "learning", capabilities: fabric.describeCapabilities(EXPERIENCE).capabilities, arcadeActivityId: ARCADE, activityExists: true, resolved: true }]);
  const unknown = await serviceFor([mutate((value) => { value.arcadeExperienceRefs = [{ experienceId: "experience.unknown.x" }]; })]).resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(unknown.arcade.items, [{ experienceId: "experience.unknown.x", resolved: false }]);
  for (const [file, source] of sources()) {
    assert.doesNotMatch(source, /arcadeExperienceCatalog|legacyArcadeCatalogAdapter|activityReference\s*:/, `${file} must not define Arcade descriptors`);
  }
});

test("4 Program references Missions through the canonical Mission catalog, exact version only", async () => {
  const resolved = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.equal(resolved.missions.items.length, 1);
  assert.deepEqual(resolved.missions.items[0], { missionId: MISSION, missionVersion: 1, title: MISSION_DEFINITION_FIXTURES[0].title, published: true, resolved: true });
  const v2 = await serviceFor([mutate((value) => { value.missionRefs = [{ missionId: MISSION, missionVersion: 2 }]; })]).resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(v2.missions.items, [{ missionId: MISSION, missionVersion: 2, published: false, resolved: false }]);
  assert.ok(validateProgramPackage(mutate((value) => { value.missionRefs = [{ missionId: MISSION }]; })).some((error) => /exact positive integer/.test(error)), "no floating 'latest'");
});

// ---------------------------------------------------------------- capability maturity

test("5/6/7/26 capability maturity is the MOL vocabulary, honest, and cannot overstate SIMULATED systems", async () => {
  assert.equal(CAPABILITY_MATURITY, mol.MOL_CAPABILITY_MATURITY, "one maturity vocabulary, shared with MOL");
  assert.ok(validateProgramPackage(mutate((value) => { value.capabilityRefs[0].maturity = "BETA"; })).some((error) => /maturity must be one of/.test(error)));
  assert.ok(validateProgramPackage(mutate((value) => { value.capabilityRefs[0].capability = "QUANTUM_TELEPORT"; })).some((error) => /capability registry/.test(error)));
  assert.ok(validateProgramPackage(mutate((value) => { value.capabilityRefs[0].maturity = "PRODUCTION"; })).some((error) => /PRODUCTION requires a passed acceptanceRef/.test(error)));
  assert.deepEqual(validateProgramPackage(mutate((value) => { value.capabilityRefs[0].maturity = "PRODUCTION"; value.capabilityRefs[0].acceptanceRef = "tests/curriculum-acceptance"; })), []);
  // MOL registers power-grid as SIMULATED provider at CONTRACT_DEFINED: LIVE or even SIMULATED maturity overstates it.
  const live = serviceFor([mutate((value) => { value.capabilityRefs.find((cap: any) => cap.capability === "METAVERSE_ENVIRONMENT").maturity = "LIVE"; })]);
  const capabilities = await live.resolveCapabilities(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  const metaverse = capabilities.find((cap) => cap.capability === "METAVERSE_ENVIRONMENT")!;
  assert.deepEqual(metaverse.issues.sort(), ["MATURITY_EXCEEDS_SYSTEM:power-grid", "SIMULATED_SYSTEM_CANNOT_BE_LIVE:power-grid"]);
  assert.deepEqual(metaverse.molSystems, [{ systemId: "power-grid", displayName: "Power Grid", mode: "SIMULATED", maturity: "CONTRACT_DEFINED", authorityDomain: "POWER_GRID" }]);
  assert.equal((await live.describeProgramReadiness(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION")).status, "BLOCKED");
  const honest = (await service.resolveCapabilities(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION")).find((cap) => cap.capability === "METAVERSE_ENVIRONMENT")!;
  assert.deepEqual(honest.issues, []);
  for (const [file, source] of sources()) assert.doesNotMatch(source, /systemId:\s*"|MOL_CAPABILITY_MATURITY\s*=|Object\.freeze\(\["PLANNED", "CONTRACT_DEFINED"/, `${file} must not re-register MOL systems or maturity`);
});

// ---------------------------------------------------------------- dependencies, authority, readiness

test("8/9 required dependencies block readiness; optional dependencies degrade it without blocking", async () => {
  const readiness = await service.describeProgramReadiness(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.equal(readiness.status, "DEGRADED");
  assert.deepEqual(readiness.gaps, []);
  assert.deepEqual(readiness.blockingDependencies, []);
  assert.deepEqual(readiness.degradedDependencies.map((dep) => dep.dependencyId).sort(), ["dep.credential-issuer", "dep.power-grid-simulation"]);
  const required = serviceFor([mutate((value) => { value.dependencyRefs.find((dep: any) => dep.dependencyId === "dep.credential-issuer").required = true; })]);
  const blocked = await required.describeProgramReadiness(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual([blocked.status, blocked.blockingDependencies], ["BLOCKED", ["dep.credential-issuer"]]);
  assert.deepEqual(required.resolveDependencies(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION").find((dep) => dep.dependencyId === "dep.credential-issuer")!.blocking, true);
});

test("10/11 authority owner is required; credential issuance is never inferred from SHF/SHS ownership", async () => {
  assert.ok(validateProgramPackage(mutate((value) => { value.program.authorityOwner = ""; })).some((error) => /authorityOwner is required/.test(error)));
  assert.ok(validateProgramPackage(mutate((value) => { value.authorityRefs = []; })).some((error) => /authorityRefs must declare/.test(error)));
  // An internal (SHF/SHS) authority cannot claim legal/contractual issuance, nor ISSUE without a basis.
  assert.ok(validateProgramPackage(mutate((value) => { value.authorityRefs[0].levels.push("ISSUE"); value.authorityRefs[0].issuanceBasis = { type: "LEGAL", reference: "x" }; }))
    .some((error) => /internal authority cannot claim LEGAL issuance/.test(error)));
  assert.ok(validateProgramPackage(mutate((value) => { value.authorityRefs[0].levels.push("ISSUE"); })).some((error) => /ISSUE requires an explicit issuanceBasis/.test(error)));
  const authority = await service.describeAuthority(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.equal(authority.owningOrganizationIsIssuer, false);
  assert.deepEqual(authority.credentialIssuers, [{ domain: "credential", owner: "External credential issuer (placeholder)", external: true, basis: { type: "LEGAL", reference: "placeholder:external-issuer-statute" }, basisResolved: null }]);
  // An internal ISSUE claim citing a credential definition that does not exist is not issuance authority.
  const claimed = await serviceFor([mutate((value) => { value.authorityRefs[0].levels.push("ISSUE"); value.authorityRefs[0].issuanceBasis = { type: "INTERNAL_CREDENTIAL_DEFINITION", reference: `missing_${RUN}` }; })])
    .describeAuthority(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual([claimed.credentialIssuers.find((issuer) => issuer.domain === "program")!.basisResolved, claimed.owningOrganizationIsIssuer], [false, false]);
  const noIssuer = await serviceFor([mutate((value) => { value.authorityRefs = value.authorityRefs.filter((ref: any) => ref.domain !== "credential"); })]).describeAuthority(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual([noIssuer.credentialIssuerStatus, noIssuer.credentialIssuers, noIssuer.owningOrganizationIsIssuer], ["NOT_DECLARED", [], false]);
  const program = authority.authorities.find((ref) => ref.domain === "program")!;
  assert.ok(!program.levels.includes("ISSUE") && program.mayNotControl.includes("credential issuance") && program.mayNotControl.includes("hiring"));
});

test("15/16 lifecycle: Integration Readiness precedes Partner Validation; PILOT_READY is unreachable with gaps", async () => {
  const pkg = fixture();
  const resolution = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  const ready = evaluateIntegrationReadiness(pkg, resolution.facts);
  assert.deepEqual(evaluateLifecycleTransition("AUTHORITY_REVIEW", "PARTNER_VALIDATION", ready), { allowed: false, reasons: ["STEP_NOT_ALLOWED"] });
  assert.deepEqual(evaluateLifecycleTransition("AUTHORITY_REVIEW", "INTEGRATION_READINESS", ready), { allowed: true, reasons: [] });
  assert.deepEqual(evaluateLifecycleTransition("INTEGRATION_READINESS", "PILOT_READY", ready), { allowed: false, reasons: ["STEP_NOT_ALLOWED"] });
  assert.equal((await service.evaluateLifecycle(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION", "PARTNER_VALIDATION")).allowed, true);
  // Unanswered, unsupported and not-applicable-but-mandatory questions are all gaps.
  const gapped = mutate((value) => { delete value.integrationReadiness.PARTNERS; value.integrationReadiness.ACCESSIBILITY = { answer: "NOT_APPLICABLE", justification: "n/a" }; value.missionRefs = [{ missionId: MISSION, missionVersion: 2 }]; });
  const gappedReadiness = evaluateIntegrationReadiness(gapped, (await serviceFor([gapped]).resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION")).facts);
  assert.deepEqual(gappedReadiness.gaps.sort(), ["ACCESSIBILITY", "MISSIONS", "PARTNERS"]);
  assert.deepEqual(gappedReadiness.questions.find((item) => item.question === "MISSIONS")!.reason, "DECLARED_ANSWER_UNSUPPORTED");
  assert.deepEqual(evaluateLifecycleTransition("INTEGRATION_READINESS", "PARTNER_VALIDATION", gappedReadiness), { allowed: false, reasons: ["INTEGRATION_READINESS_GAPS"] });
  assert.deepEqual(evaluateLifecycleTransition("PARTNER_VALIDATION", "PILOT_READY", gappedReadiness).reasons, ["INTEGRATION_READINESS_GAPS"]);
  assert.equal(evaluateLifecycleTransition("PARTNER_VALIDATION", "PILOT_READY", ready).allowed, true, "DEGRADED (optional only) may proceed");
  assert.deepEqual(evaluateLifecycleTransition("RETIRED", "ACTIVE", ready).reasons, ["RETIRED_IS_TERMINAL"]);
  assert.equal(evaluateLifecycleTransition("PILOT", "SUSPENDED", ready).allowed, true);
  assert.deepEqual(evaluateLifecycleTransition("SUSPENDED", "ACTIVE", gappedReadiness).reasons, ["READINESS_BLOCKED"]);
});

// ---------------------------------------------------------------- funding

test("12/13 funding relationships preserve UNKNOWN/POTENTIAL/VERIFIED and never establish eligibility", async () => {
  const relationships = await service.listFundingRelationships(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(relationships.map((item) => [item.sourceType, item.alignment, item.eligibilityEstablished, item.fundingGuaranteed]),
    [["GRANT", "POTENTIAL", false, false], ["WORKFORCE", "POTENTIAL", false, false], ["EMPLOYER", "POTENTIAL", false, false], ["PHILANTHROPY", "UNKNOWN", false, false]]);
  assert.ok(validateProgramPackage(mutate((value) => { value.fundingRefs[0].alignment = "VERIFIED"; })).some((error) => /VERIFIED requires a verification reference/.test(error)));
  assert.ok(validateProgramPackage(mutate((value) => { value.fundingRefs[0].alignment = "ELIGIBLE"; })).some((error) => /UNKNOWN, POTENTIAL or VERIFIED/.test(error)));
  const verified = serviceFor([mutate((value) => {
    value.fundingRefs[0] = { ...value.fundingRefs[0], alignment: "VERIFIED", verification: { source: "FUNDING_GRANT", recordId: GRANT } };
    value.fundingRefs[1] = { ...value.fundingRefs[1], alignment: "VERIFIED", verification: { source: "FUNDING_GRANT", recordId: `missing_${RUN}` } };
  })]);
  const listed = await verified.listFundingRelationships(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(listed.slice(0, 2).map((item) => [item.alignment, item.verificationResolved, item.eligibilityEstablished]), [["VERIFIED", true, false], ["VERIFIED", false, false]],
    "declared status is preserved; an unresolvable VERIFIED claim is reported, not silently upgraded or erased");
  // The award belongs to ORG; another organization's package cannot resolve it.
  const foreign = new WorkforceFoundationService({ registry: () => buildWorkforceRegistry({ packages: [mutate((value) => {
    value.program.owningOrganizationId = OTHER_ORG; value.fundingRefs[0] = { ...value.fundingRefs[0], alignment: "VERIFIED", verification: { source: "FUNDING_GRANT", recordId: GRANT } };
  })], fundingSources }), arcade: fabric });
  assert.equal((await foreign.listFundingRelationships(outsider, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION"))[0].verificationResolved, false);
});

test("14 fundability gate outputs BUILD/HOLD/REJECT deterministically with reason codes, never scores", async () => {
  const derived = { fundingLaneCount: 3, blockingDependencyCount: 0, readinessStatus: "DEGRADED" as const };
  assert.deepEqual(evaluateFundabilityGate(component(), derived), { decision: "BUILD", reasons: [], eligibilityEstablished: false, fundingGuaranteed: false });
  assert.deepEqual(evaluateFundabilityGate(component(), { ...derived, fundingLaneCount: 2 }).reasons, ["INSUFFICIENT_FUNDING_LANES"]);
  // No shared-infrastructure exception: heavy reuse does not lower the 3-lane bar.
  assert.deepEqual(evaluateFundabilityGate(component({ bucket: "SHARED_INFRASTRUCTURE", reuseProgramCount: 9 }), { ...derived, fundingLaneCount: 2 }),
    { decision: "HOLD", reasons: ["INSUFFICIENT_FUNDING_LANES"], eligibilityEstablished: false, fundingGuaranteed: false });
  assert.deepEqual(evaluateFundabilityGate(component({ employerRelevance: "PARTIAL", implementationRisk: "UNKNOWN" }), { ...derived, blockingDependencyCount: 1, readinessStatus: "BLOCKED" }),
    { decision: "HOLD", reasons: ["EMPLOYERRELEVANCE_PARTIAL", "DEPENDENCIES_NOT_MATURE", "INTEGRATION_NOT_READY", "IMPLEMENTATION_RISK_UNKNOWN"], eligibilityEstablished: false, fundingGuaranteed: false });
  assert.deepEqual(evaluateFundabilityGate(component({ workforceRelevance: "NOT_MET", authorityClarity: "NOT_MET" }), derived).reasons, ["NO_WORKFORCE_NEED", "AUTHORITY_UNCLEAR"]);
  assert.deepEqual(evaluateFundabilityGate(component({ implementationRisk: "HIGH" }), { ...derived, fundingLaneCount: 0 }).reasons, ["HIGH_RISK_WITHOUT_FUNDING_LANE"]);
  assert.equal(evaluateFundabilityGate(component({ workforceRelevance: "MAYBE" as any }), derived).decision, "REJECT");
  for (let i = 0; i < 5; i += 1) assert.deepEqual(evaluateFundabilityGate(component(), derived), evaluateFundabilityGate(component(), derived));
  const evaluated = await service.evaluateFundability(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION", component());
  assert.deepEqual([evaluated.decision, evaluated.fundingLanes, evaluated.eligibilityEstablished], ["BUILD", ["EMPLOYER", "GRANT", "WORKFORCE"], false], "UNKNOWN alignments are not counted as lanes");
  assert.doesNotMatch(JSON.stringify(evaluated), /"score"|probability|odds/i);
});

// ---------------------------------------------------------------- outcome claim safety

test("17/18/20 evidence requirements, program completion and employer partners create nothing and imply nothing", async () => {
  const resolved = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.ok(resolved.evidenceRequirements.every((item) => item.authority === "verified-evidence" && item.createsEvidence === false));
  assert.deepEqual(resolved.partners.items, [{ organizationId: PARTNER_ORG, role: "EMPLOYER", status: "DECLARED", resolved: true, impliesEmployment: false, impliesHiring: false }]);
  assert.ok(validateProgramPackage(mutate((value) => { value.partnerRefs[0].status = "CONFIRMED"; })).some((error) => /CONFIRMED requires a relationshipRef/.test(error)));
  assert.ok(resolved.reportProfiles.items.filter((item) => item.kind === "VERIFIED_INSTITUTIONAL_TRUTH").every((item) => item.truthAuthority === "truth-spine" && item.verifiedByThisRegistry === false));
  const methods = Object.getOwnPropertyNames(WorkforceFoundationService.prototype);
  assert.ok(!methods.some((name) => /issue|award|enroll|hire|complete|verify|write|create|publish/i.test(name)), methods.join(","));
  assert.deepEqual(await globalCounts(), baseline, "no Evidence, Truth, credential, career, curriculum, identity, relationship, funding or runtime writes");
});

test("21 cross-organization isolation: packages and their references are owning-org only", async () => {
  await assert.rejects(service.resolveProgram(outsider, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION"), (error: any) => error.code === "PROGRAM_NOT_FOUND" && error.statusCode === 404);
  await assert.rejects(service.describeAuthority(outsider, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION"), (error: any) => error.code === "PROGRAM_NOT_FOUND");
  assert.throws(() => service.resolveDependencies(outsider, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION"), (error: any) => error.code === "PROGRAM_NOT_FOUND");
  assert.deepEqual(service.moccSystemImpact(outsider, "power-grid").programs, []);
  // The same references declared by another organization resolve nothing of this organization's.
  const foreign = new WorkforceFoundationService({ registry: () => buildWorkforceRegistry({ packages: [mutate((value) => { value.program.owningOrganizationId = OTHER_ORG; })], fundingSources }), arcade: fabric });
  const resolved = await foreign.resolveProgram(outsider, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(resolved.curriculum.items, [{ courseId: COURSE, resolved: false }]);
  assert.deepEqual(resolved.operationalProgram.items, [{ programId: OPERATIONAL_PROGRAM, resolved: false }]);
  assert.deepEqual(resolved.missions.items, [{ missionId: MISSION, missionVersion: 1, published: false, resolved: false }]);
  assert.equal((await foreign.describeProgramReadiness(outsider, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION")).status, "BLOCKED");
});

test("22/23/24/27 no duplicate identity, Career, Curriculum or spatial registries: the foundation writes and stores nothing", () => {
  for (const [file, source] of sources()) {
    assert.doesNotMatch(source, /\b(INSERT INTO|DELETE FROM|CREATE TABLE|ALTER TABLE)\b|\bUPDATE\s+[a-z_]+\s+SET\b/, `${file} writes SQL`);
    assert.doesNotMatch(source, /zoneRegistry|spatialRegistry|registerMap|coordinates\s*:|latitude|longitude/i, `${file} defines a spatial registry`);
    for (const [, specifier] of source.matchAll(/from\s+"([^"]+)"/g)) {
      assert.doesNotMatch(specifier, /verified-evidence\/service|prepare-prove|truth-spine|credential-service|certificate|identity\/|membership|treasury|payments|metaverse\/(market|passport|enterprise)/i, `${file} imports ${specifier}`);
    }
  }
  const migrations = readdirSync(new URL("../migrations/", import.meta.url)).filter((name) => /^\d+_/.test(name)).sort();
  assert.match(migrations.at(-1)!, /^156_/, "Phase 6.5 adds no migration");
});

test("28 MOCC projection is read-only, aggregate and future-facing", async () => {
  const impact = service.moccSystemImpact(staff, "power-grid");
  assert.deepEqual([impact.readOnly, impact.controls, impact.system?.maturity], [true, [], "CONTRACT_DEFINED"]);
  assert.deepEqual(impact.programs, [{
    programId: "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION", lifecycle: "INTEGRATION_READINESS", affectedCapabilities: ["METAVERSE_ENVIRONMENT"],
    affectedMissions: [{ missionId: MISSION, missionVersion: 1 }], fundingBuckets: ["DESTINATION_PROGRAM"], authorityOwner: "Owning organization program office", sensoryRefs: null,
  }]);
  assert.deepEqual(service.moccSystemImpact(staff, "road-traffic").programs, []);
  assert.doesNotMatch(JSON.stringify(impact), new RegExp(`${STAFF}|user_id|userId`));
});

test("sensory 11/12 ProgramPackage references sensory profiles without owning or copying them", async () => {
  assert.equal(fixture().sensoryRefs, undefined, "sensory references are optional: existing packages stay valid");
  const refs = { soundProfileRef: "sound-profile.reference", celebrationProfileRef: "celebration-profile.missing", environmentAudioProfileRef: null, sensoryPolicyRef: "policy.reference" };
  const withSensory = mutate((value) => { value.sensoryRefs = refs; });
  assert.deepEqual(validateProgramPackage(withSensory), []);
  assert.ok(validateProgramPackage(mutate((value) => { value.sensoryRefs = { ...refs, soundProfileRef: "bad ref!" }; })).some((error) => /sensoryRefs.soundProfileRef/.test(error)));
  // Embedding profile content instead of referencing it is rejected.
  assert.ok(validateProgramPackage(mutate((value) => { value.sensoryRefs = { ...refs, soundIds: ["ui.click"] }; })).some((error) => /sensoryRefs.soundIds: unsupported field/.test(error)));
  const sound = { soundId: "ui.click", category: "UI", source: "asset:pending", environment: null, looping: false, spatial: false, maxDistance: null, priority: 10, volumeClass: "QUIET", occlusionSupported: false, caption: "Click", accessibilityLabel: "Click" };
  const sensoryRegistry = sensory.buildSensoryRegistry({
    sounds: [sound], soundProfiles: [{ profileId: "sound-profile.reference", soundIds: ["ui.click"] }],
    presentationPolicies: [{ policyId: "policy.reference", defaultIntensity: "CALM", allowedIntensities: ["CALM"], maxTier: "TIER_2_ACTIVITY_COMPLETE", allowCamera: false, allowHaptics: false, allowFlashing: false, requireCaptions: true }],
  });
  assert.deepEqual(sensoryRegistry.rejected, []);
  const service = new WorkforceFoundationService({ registry: () => buildWorkforceRegistry({ packages: [withSensory], fundingSources }), arcade: fabric, sensory: () => sensoryRegistry });
  const resolved = await service.resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION");
  assert.deepEqual(resolved.sensory, {
    authority: "experience-layer", ownedByProgram: false,
    references: [
      { kind: "SOUND_PROFILE", id: "sound-profile.reference", resolved: true },
      { kind: "CELEBRATION_PROFILE", id: "celebration-profile.missing", resolved: false },
      { kind: "PRESENTATION_POLICY", id: "policy.reference", resolved: true },
    ],
  });
  assert.doesNotMatch(JSON.stringify(resolved.sensory), /ui\.click|soundIds|maxTier|caption/, "profiles are referenced, never copied into the program");
  // Production sensory registry is empty, so no program sensory content exists yet.
  assert.deepEqual((await serviceFor([withSensory]).resolveProgram(staff, "PROGRAM_INFRASTRUCTURE_TECH_FOUNDATION")).sensory.references.map((ref: any) => ref.resolved), [false, false, false]);
});

test("29 Phase 6 Arcade Integration Fabric is unchanged", () => {
  // Fabric logic and the descriptor contract are unchanged. Phase 7 adds canonical descriptor *data* only
  // (canonicalArcadeExperienceDescriptors.js, wired into the catalog's canonical list).
  const changed = execFileSync("git", ["diff", "--name-only", "4d0aed9", "--", "src/domain/arcade-integration", "../../src/shared/arcade/experience/arcadeExperienceValidation.js",
    "../../src/shared/arcade/experience/arcadeExperienceDescriptor.js", "../../src/shared/arcade/experience/legacyArcadeCatalogAdapter.js"], { cwd: new URL("..", import.meta.url), encoding: "utf8" }).trim();
  assert.equal(changed, "");
});
