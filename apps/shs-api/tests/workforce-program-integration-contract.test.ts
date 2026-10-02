// Phase 8 — Workforce Program Integration Contract (shared workforce foundation / plug-in model).
// ProgramPackages coordinate canonical authorities; they do not replace them.
// A workforce program may add content, mappings and configuration without creating a new engine when a shared
// platform capability already exists.
// Program completion does not establish verified mastery, credential attainment, career eligibility, funding
// eligibility, employment eligibility or institutional truth.
//
// Synthetic shapes (test-only, never registered) prove that any program runs through the same generic pipeline;
// the real Data Center package is checked read-only in its real owning organization. Tests run in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { withTransaction } from "../src/db/transaction.js";
import { canonicalArcadeExperiences } from "../src/domain/arcade-integration/arcade-experience-bridge.js";
import { ArcadeIntegrationService } from "../src/domain/arcade-integration/service/arcade-integration-service.js";
import { CurriculumCatalogRepo } from "../src/domain/curriculum-catalog/repo/curriculum-catalog-repo.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";
import { registerMissionPublicationRoutes } from "../src/domain/mission-content/api/mission-publication-routes.js";
import { DATA_CENTER_COOLING_FAILURE_RESPONSE_V1 } from "../src/domain/mission-content/catalog/canonical-mission-sources.js";
import {
  ACCESSIBILITY_SUPPORT_REQUIREMENTS, EXECUTION_LEVELS, PROGRAM_PACKAGE_SCHEMA_VERSION, PROVIDER_MODES, SUPPORTED_PROGRAM_SCHEMA_VERSIONS,
  validateProgramPackage, validateProgramPackageStructured, type ProgramPackage,
} from "../src/domain/workforce-foundation/model/workforce-foundation.js";
import { evaluateIntegrationReadiness } from "../src/domain/workforce-foundation/model/readiness-and-fundability.js";
import { validateProgramModule } from "../src/domain/workforce-foundation/registry/program-module.js";
import { DATA_CENTER_PROGRAM_ID, DATA_CENTER_PROGRAM_MODULE } from "../src/domain/workforce-foundation/registry/programs/data-center-community-workforce.js";
import { WORKFORCE_PROGRAM_MODULES, buildWorkforceRegistry } from "../src/domain/workforce-foundation/registry/workforce-program-registry.js";
import { WorkforceFoundationService } from "../src/domain/workforce-foundation/service/workforce-foundation-service.js";
import * as mol from "../../../src/system/metaverse/mol/index.js";
import * as sensory from "../../../src/shared/experience/sensory/index.js";
import { blockedGenericTestProgram, completeGenericTestProgram, malformedGenericTestPrograms, partialGenericTestProgram, type SyntheticRefs } from "./fixtures/workforce-program-fixtures.js";

const RUN = `wf8_${Date.now()}`;
const SLUG = RUN.replaceAll("_", "-");
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const PARTNER_ORG = `partner_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const ARCADE = `arcade_${RUN}`;
const MISSION = `${SLUG}-mission`;
const EXPERIENCE = `experience.learning.${RUN}`;
const FAMILY = `career_family_${RUN}`;
const CAREER = `career_${RUN}`;
const COMPETENCY = `competency_${RUN}`;
const CREDENTIAL = `credential_${RUN}`;
const RELATIONSHIP = `relationship_${RUN}`;
const SERVICE = `service_${RUN}`;
const ENTITLEMENT = `entitlement_${RUN}`;
const COURSE_BODY = `Lesson body ${RUN} owned by Curriculum.`;
const PASS = (_req: any, _res: any, next: any) => next();

const REFS: SyntheticRefs = {
  organizationId: ORG, courseStableKey: `${SLUG}-course`, experienceId: EXPERIENCE, missionId: MISSION, careerId: CAREER, competencyId: COMPETENCY,
  partnerOrganizationId: PARTNER_ORG, partnerRelationshipId: RELATIONSHIP, credentialDefinitionId: CREDENTIAL,
  fundingSourceIds: [`${RUN}.fund.grant`, `${RUN}.fund.workforce`, `${RUN}.fund.employer`], serviceKey: `${SLUG}-svc`, sensoryPolicyId: `policy.${SLUG}`,
};
const FUNDING_SOURCES = (["GRANT", "WORKFORCE", "EMPLOYER"] as const).map((sourceType, index) => ({
  fundingSourceId: REFS.fundingSourceIds[index], name: `${sourceType} category (test)`, sourceType, jurisdiction: "Test", eligibleProgramTypes: ["workforce"],
  eligibleCostCategories: ["instruction"], matchRequired: "UNKNOWN" as const, reportingRequirements: [], authority: "Not identified", status: "UNKNOWN" as const, evidenceRequirements: [],
}));
const ALL_MET = { componentId: "synthetic", bucket: "SHARED_INFRASTRUCTURE" as const, workforceRelevance: "MET" as const, measurableOutcomes: "MET" as const,
  evidencePathway: "MET" as const, employerRelevance: "MET" as const, authorityClarity: "MET" as const, implementationRisk: "LOW" as const, reuseProgramCount: 3 };
const NO_ARTIFACTS = { arcadeActivityIds: [], arcadeExperienceIds: [], missionSources: [], sensoryProfileIds: [] };
const module = (pkg: ProgramPackage, withAssessment = true) => ({ package: pkg, artifactRefs: NO_ARTIFACTS, ...(withAssessment ? { fundabilityAssessment: { component: ALL_MET, basis: {} } } : {}) });

const users: Record<string, any> = {
  [AUTHOR]: { user_id: AUTHOR, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"], roles: [] },
  [REVIEWER]: { user_id: REVIEWER, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["project.submission.review", "studio.review.queue.view"], roles: [] },
  [PUBLISHER]: { user_id: PUBLISHER, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["curriculum.catalog.publish", "curriculum.catalog.retire"], roles: [] },
};
const staff = { user_id: AUTHOR, organization_id: ORG };
const outsider = { user_id: `outsider_${RUN}`, organization_id: OTHER_ORG };

// Generic Learning descriptor on the Phase 6 contract, referencing the test activity and test Mission.
const descriptor = {
  id: EXPERIENCE, slug: `${SLUG}-experience`, activityReference: { arcadeActivityId: ARCADE },
  product: { family: "learning", experienceType: "mission" }, lifecycle: { status: "active", launchable: true, playable: false }, launch: { route: "/learning", runtimeType: "internal" },
  presentation: { title: "Synthetic", shortTitle: null, description: "Synthetic test experience.", category: null, difficulty: "beginner", artwork: null, thumbnail: null },
  capabilities: { leaderboardEligible: false, tournamentEligible: false, multiplayer: true, spectator: false, evidenceResultCapable: true, missionLaunch: true },
  relationships: {
    career: { relationshipType: "none", pathwayReferences: [] }, metaverse: { relationshipType: "none", experienceReferences: [] },
    agentFabric: { relationshipType: "none", capabilityReferences: [] }, treasury: { relationshipType: "none", rewardPolicyReference: null },
    studio: { relationshipType: "none", projectReferences: [] }, mission: { relationshipType: "reference", missionReferences: [{ missionId: MISSION, missionVersion: 1 }] },
  },
  accessibility: { profileAware: false, reducedMotionRequired: false, keyboardRequired: false },
  provenance: { classification: "canonical_descriptor", migratedFrom: [] },
};
const fabric = new ArcadeIntegrationService({ experiences: () => canonicalArcadeExperiences([descriptor]).descriptors });
const testSensory = sensory.buildSensoryRegistry({ presentationPolicies: [{ policyId: REFS.sensoryPolicyId, defaultIntensity: "CALM", allowedIntensities: ["CALM"], maxTier: "TIER_2_ACTIVITY_COMPLETE",
  allowCamera: false, allowHaptics: false, allowFlashing: false, requireCaptions: true }] });
const serviceFor = (modules: any[], packages: ProgramPackage[] = []) => new WorkforceFoundationService({
  registry: () => buildWorkforceRegistry({ modules, packages, fundingSources: FUNDING_SOURCES }), arcade: fabric, sensory: () => testSensory,
});
const COMPLETE = completeGenericTestProgram(REFS);
const PARTIAL = partialGenericTestProgram(REFS);
const BLOCKED = blockedGenericTestProgram(REFS);
const service = serviceFor([module(COMPLETE), module(PARTIAL), module(BLOCKED, false)]);
// The real Data Center package, read-only, in its real owning organization.
const dataCenter = new WorkforceFoundationService();
const shf = { user_id: "phase8-read-only-check", organization_id: "org_shf_001" };

let server: Server;
let base = "";
async function call(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", "x-test-user": userId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json().catch(() => null) };
}

const ORGS = [ORG, OTHER_ORG, PARTNER_ORG];
const TRIGGERS: Array<[string, string]> = [["mission_publication_events", "mission_publication_events_append_only"], ["mission_published_releases", "mission_published_release_immutable"],
  ["mission_review_submissions", "mission_review_submission_snapshot_immutable"]];
async function cleanup() {
  await withTransaction(async (tx) => {
    for (const [table, trigger] of TRIGGERS) await tx.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    for (const table of ["mission_publication_events", "mission_published_releases", "mission_review_submissions", "mission_definition_drafts", "organization_service_entitlements", "curriculum_courses"]) {
      await tx.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS]);
    }
    await tx.query("DELETE FROM organization_relationships WHERE relationship_id=$1", [RELATIONSHIP]);
    await tx.query("DELETE FROM service_catalog WHERE service_id=$1", [SERVICE]);
    await tx.query("DELETE FROM credential_definitions WHERE credential_definition_id=$1", [CREDENTIAL]);
    await tx.query("DELETE FROM arcade_activities WHERE arcade_activity_id=$1", [ARCADE]);
    await tx.query("DELETE FROM competency_definitions WHERE competency_id=$1", [COMPETENCY]);
    await tx.query("DELETE FROM careers WHERE career_id=$1", [CAREER]);
    await tx.query("DELETE FROM career_families WHERE career_family_id=$1", [FAMILY]);
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [ORGS]);
    for (const [table, trigger] of TRIGGERS) await tx.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
  });
}
const COUNTED = ["prepare_prove_evidence", "learner_competency_decisions", "learner_credentials", "truth_spine_records", "curriculum_truth_facts", "funding_grants", "gpa_funding_references",
  "career_events", "mission_runtime_sessions", "arcade_results"];
async function counts() {
  return Object.fromEntries(await Promise.all(COUNTED.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table}`)).rows[0].count)])));
}
let baseline: Record<string, number> = {};

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active'),($5,$6,$6,'partner','active')`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`, PARTNER_ORG, `${RUN} Employer`]);
  for (const userId of Object.keys(users)) {
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`, [userId, ORG, `${userId}@test.invalid`, `Person ${userId.split("_")[0]}`]);
  }
  await new CurriculumCatalogRepo().createCourse({ courseId: `${RUN}:course`, organizationId: ORG, stableKey: REFS.courseStableKey, title: "Synthetic course",
    shortDescription: null, fullDescription: COURSE_BODY, estimatedDurationMinutes: null, actorUserId: AUTHOR });
  await query("INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Synthetic activity','SCENARIO','PASSED_FLAG',$3)", [ARCADE, `${SLUG}-activity`, AUTHOR]);
  await query("INSERT INTO career_families (career_family_id, slug, name) VALUES ($1,$2,'Synthetic family')", [FAMILY, `${SLUG}-family`]);
  await query("INSERT INTO careers (career_id, slug, title, description, career_family_id) VALUES ($1,$2,'Synthetic career','Owned by the Career registry.',$3)", [CAREER, `${SLUG}-career`, FAMILY]);
  await query(`INSERT INTO competency_definitions (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status)
    VALUES ($1,$2,'Synthetic competency','Owned by Prepare & Prove.','synthetic',1,'{}'::jsonb,'{}'::jsonb,'ACTIVE')`, [COMPETENCY, `${SLUG}-competency`]);
  await query("INSERT INTO credential_definitions (credential_definition_id, slug, name, credential_type, issuing_authority, created_by_user_id) VALUES ($1,$2,'Synthetic external credential','EXTERNAL','External test credential issuer',$3)",
    [CREDENTIAL, `${SLUG}-credential`, AUTHOR]);
  // The confirmed partner link is an existing authority record (organization relationship), not a partner database.
  await query("INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from) VALUES ($1,$2,$3,'NETWORK_MEMBER_OF','ACTIVE',NOW())",
    [RELATIONSHIP, PARTNER_ORG, ORG]);
  await query("INSERT INTO service_catalog (service_id, service_key, name, category, status, provider_organization_id) VALUES ($1,$2,'Synthetic service','CAREER_WORKFORCE','ACTIVE',$3)", [SERVICE, REFS.serviceKey, ORG]);
  await query("INSERT INTO organization_service_entitlements (entitlement_id, organization_id, service_id, status) VALUES ($1,$2,$3,'ACTIVE')", [ENTITLEMENT, ORG, SERVICE]);
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  // A synthetic Mission published through the real Mission Content workflow (shape of the canonical source).
  const definition = structuredClone(DATA_CENTER_COOLING_FAILURE_RESPONSE_V1);
  definition.missionId = MISSION; definition.slug = MISSION; definition.arcadeActivityId = ARCADE; definition.title = "Synthetic team mission";
  const created = await call("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const submitted = await call(`/studio/missions/drafts/${created.body.data.draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Phase 8" });
  const submissionId = submitted.body.data.submission.submissionId;
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "ok" })).status, 200);
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {})).status, 201);
  baseline = await counts();
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await cleanup();
  // 62 — zero residue.
  for (const table of ["mission_definition_drafts", "mission_review_submissions", "mission_published_releases", "mission_publication_events", "organization_service_entitlements", "curriculum_courses", "users", "organizations"]) {
    assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS])).rows[0].count), 0, `${table} residue`);
  }
  for (const [table, column, id] of [["organization_relationships", "relationship_id", RELATIONSHIP], ["service_catalog", "service_id", SERVICE], ["credential_definitions", "credential_definition_id", CREDENTIAL],
    ["arcade_activities", "arcade_activity_id", ARCADE], ["competency_definitions", "competency_id", COMPETENCY], ["careers", "career_id", CAREER], ["career_families", "career_family_id", FAMILY]]) {
    assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${column}=$1`, [id])).rows[0].count), 0, `${table} residue`);
  }
  const triggers = (await query("SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = ANY($1::text[])", [TRIGGERS.map(([, name]) => name)])).rows;
  for (const trigger of triggers) assert.equal(trigger.tgenabled, "O", trigger.tgname);
});

// ---------------------------------------------------------------- schema and registration

test("1/2/3/4 schemaVersion is enforced; registration is generic, deterministic and fails closed", () => {
  assert.deepEqual([PROGRAM_PACKAGE_SCHEMA_VERSION, [...SUPPORTED_PROGRAM_SCHEMA_VERSIONS]], [2, [2]]);
  assert.deepEqual(validateProgramPackage(COMPLETE), []);
  const malformed = malformedGenericTestPrograms(REFS);
  assert.deepEqual(validateProgramPackageStructured(malformed.legacy).errors.map((error) => error.code), ["UNSUPPORTED_SCHEMA_VERSION"], "schemaVersion 1 / contractVersion fails closed");
  assert.deepEqual(validateProgramPackageStructured(malformed.future).errors.map((error) => error.code), ["UNSUPPORTED_SCHEMA_VERSION"]);
  const registry = buildWorkforceRegistry({ modules: [module(COMPLETE), module(PARTIAL), module(COMPLETE), { package: BLOCKED, artifactRefs: NO_ARTIFACTS, extra: true } as any], fundingSources: FUNDING_SOURCES });
  assert.deepEqual(registry.packages.map((pkg) => pkg.program.programId), ["PARTIAL_GENERIC_TEST_PROGRAM"], "duplicates and malformed modules are all rejected");
  assert.deepEqual(registry.rejected.map((item) => item.id), ["BLOCKED_GENERIC_TEST_PROGRAM", "COMPLETE_GENERIC_TEST_PROGRAM", "COMPLETE_GENERIC_TEST_PROGRAM"]);
  assert.ok(registry.rejected.find((item) => item.id === "BLOCKED_GENERIC_TEST_PROGRAM")!.errors.includes("module.extra: unsupported field"));
  const ordered = buildWorkforceRegistry({ modules: [module(PARTIAL), module(BLOCKED), module(COMPLETE)], fundingSources: FUNDING_SOURCES });
  assert.deepEqual(ordered.packages.map((pkg) => pkg.program.programId), ["BLOCKED_GENERIC_TEST_PROGRAM", "COMPLETE_GENERIC_TEST_PROGRAM", "PARTIAL_GENERIC_TEST_PROGRAM"], "deterministic order");
  // A module is plain data: code cannot ride along in a program module.
  assert.ok(validateProgramModule({ ...module(COMPLETE), package: { ...COMPLETE, run: () => "engine" } } as any).some((error) => /plain data/.test(error)));
  // The production allow-list contains only the real Data Center module.
  assert.deepEqual(WORKFORCE_PROGRAM_MODULES.map((item) => item.package.program.programId), [DATA_CENTER_PROGRAM_ID]);
});

test("5/6/7/8/9 malformed packages with embedded authority data, learner identity or duplicate refs fail closed", () => {
  const malformed = malformedGenericTestPrograms(REFS);
  const codes = (name: string) => validateProgramPackageStructured(malformed[name]).errors.map((error) => error.code);
  assert.ok(codes("curriculum").includes("PROHIBITED_EMBEDDED_PAYLOAD"), "5: copied lesson content");
  assert.ok(codes("runtime").includes("PROHIBITED_EMBEDDED_PAYLOAD"), "6: Mission runtime state");
  assert.ok(codes("evidence").includes("PROHIBITED_EMBEDDED_PAYLOAD"), "7: Evidence truth");
  assert.ok(codes("learner").includes("PROHIBITED_EMBEDDED_PAYLOAD"), "8: learner identity");
  assert.ok(codes("duplicates").includes("DUPLICATE_REFERENCE"), "9: duplicate refs");
  assert.ok(codes("award").includes("PROHIBITED_EMBEDDED_PAYLOAD"), "grant award");
  assert.ok(codes("secret").includes("PROHIBITED_EMBEDDED_PAYLOAD"), "organization secret");
  assert.ok(validateProgramPackage(malformed.latest).some((error) => /exact positive integer/.test(error)), "no 'latest' Mission version");
  const structured = validateProgramPackageStructured(malformed.learner);
  assert.equal(structured.valid, false);
  assert.ok(structured.errors.every((error) => error.code && error.path && error.message));
});

// ---------------------------------------------------------------- resolution

test("10/11/12/13/14/15 a generic program resolves every reference through its owning authority", async () => {
  const integration = await service.resolveProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  const resolution = integration.resolution;
  assert.deepEqual(resolution.curriculum.items.map((item: any) => [item.courseStableKey, item.resolved]), [[REFS.courseStableKey, true]]);
  assert.doesNotMatch(JSON.stringify(resolution), new RegExp(COURSE_BODY));
  assert.deepEqual(resolution.careers.items, [{ careerId: CAREER, title: "Synthetic career", status: "active", resolved: true, jobEligibilityInferred: false }]);
  assert.deepEqual(resolution.arcade.items.map((item: any) => [item.experienceId, item.activityExists, item.resolved]), [[EXPERIENCE, true, true]]);
  assert.deepEqual(resolution.missions.items, [{ missionId: MISSION, missionVersion: 1, title: "Synthetic team mission", published: true, resolved: true, requirementIssues: [] }]);
  assert.deepEqual(resolution.metaverse.map((item: any) => [item.molSystemId, item.system.mode, item.system.maturity]), [["mission-runtime", "LIVE", "PRODUCTION"], ["power-grid", "SIMULATED", "CONTRACT_DEFINED"]]);
  assert.deepEqual(resolution.destinations, [{ destinationId: "simulation-hall", resolved: true }]);
  assert.deepEqual(resolution.governance.items.map((item: any) => item.resolved), [true, true]);
  // Requirements are checked against the published Mission definition, not asserted.
  const wrongRole = serviceFor([module({ ...structuredClone(COMPLETE), missionRefs: [{ missionId: MISSION, missionVersion: 1, roleRequirements: ["PILOT"], worldCapabilities: ["WEATHER_CONTEXT"] }] })]);
  const missing = (await wrongRole.resolveProgram(staff, "COMPLETE_GENERIC_TEST_PROGRAM")).missions.items[0] as any;
  assert.deepEqual([missing.resolved, missing.requirementIssues], [false, ["MISSION_ROLE_NOT_DECLARED:PILOT", "WORLD_CAPABILITY_NOT_DECLARED:WEATHER_CONTEXT"]]);
  const v2 = serviceFor([module({ ...structuredClone(COMPLETE), missionRefs: [{ missionId: MISSION, missionVersion: 2 }] })]);
  assert.equal(((await v2.resolveProgram(staff, "COMPLETE_GENERIC_TEST_PROGRAM")).missions.items[0] as any).resolved, false, "exact version only");
});

test("16/17 capability minimum maturity is enforced; provider mode is separate from maturity", async () => {
  const blocked = await service.resolveProgramIntegration(staff, "BLOCKED_GENERIC_TEST_PROGRAM");
  assert.ok(blocked.readiness.requirementIssues.some((issue) => issue.capability === "MISSION_SIMULATION" && issue.reason === "MINIMUM_MATURITY_UNMET" && issue.effect === "BLOCKING"));
  assert.deepEqual([...PROVIDER_MODES], ["LIVE", "SIMULATED", "HYBRID", "TEST", "UNAVAILABLE"]);
  // power-grid: maturity CONTRACT_DEFINED, mode SIMULATED — valid when SIMULATED is allowed …
  const complete = await service.resolveProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual(complete.readiness.requirementIssues, []);
  // … and refused by mode alone (maturity unchanged) when only LIVE supply is allowed.
  const liveOnly = structuredClone(COMPLETE);
  liveOnly.capabilityRefs = liveOnly.capabilityRefs.map((cap) => cap.capability === "METAVERSE_ENVIRONMENT" ? { ...cap, allowedProviderModes: ["LIVE"], fallbackPolicy: "NONE" as const } : cap);
  const issues = (await serviceFor([module(liveOnly)]).resolveProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM")).readiness.requirementIssues;
  assert.deepEqual(issues, [{ capability: "METAVERSE_ENVIRONMENT", reason: "PROVIDER_MODE_NOT_ALLOWED:power-grid:SIMULATED", effect: "DEGRADED" }]);
  assert.ok(validateProgramPackage({ ...structuredClone(COMPLETE), capabilityRefs: [{ ...COMPLETE.capabilityRefs[0], providerAuthority: "my-own-engine" }] }).some((error) => /registered authority curriculum/.test(error)));
  assert.ok(validateProgramPackage({ ...structuredClone(COMPLETE), capabilityRefs: [{ ...COMPLETE.capabilityRefs[0], minimumMaturity: "EXCELLENT" }] }).some((error) => /minimumMaturity/.test(error)));
});

test("18/19/42/43 required unavailable dependencies block; optional ones degrade", async () => {
  const partial = await service.validateProgramIntegration(staff, "PARTIAL_GENERIC_TEST_PROGRAM");
  assert.deepEqual([partial.sections.dependencies.status, partial.sections.capabilities.status, partial.sections.integrationReadiness.status], ["DEGRADED", "DEGRADED", "DEGRADED"]);
  assert.deepEqual(partial.sections.dependencies.warnings, ["OPTIONAL_DEPENDENCY_DEGRADED:dep.optional-engine"]);
  assert.deepEqual(partial.sections.capabilities.warnings, ["METAVERSE_ENVIRONMENT:PROVIDER_UNAVAILABLE:data-center"]);
  assert.deepEqual([partial.lifecycle.evaluatedState, partial.lifecycle.allowed], ["PILOT_READY", true], "42: degraded, not blocked");
  const blocked = await service.validateProgramIntegration(staff, "BLOCKED_GENERIC_TEST_PROGRAM");
  assert.deepEqual([blocked.sections.dependencies.status, blocked.sections.dependencies.issues], ["BLOCKED", ["REQUIRED_DEPENDENCY_BLOCKING:dep.required-authority"]]);
  assert.deepEqual(blocked.lifecycle, { requestedState: "PILOT_READY", evaluatedState: "PARTNER_VALIDATION", allowed: false,
    blockingReasons: ["REQUIRED_DEPENDENCIES_BLOCKING", "CAPABILITY_REQUIREMENTS_UNMET", "PARTNER_VALIDATION_INCOMPLETE"] }, "43: remains blocked");
});

test("20/21/22 execution levels: STANDALONE uses approved simulated stand-ins, HYBRID mixes modes, LIVING_WORLD cannot be claimed", async () => {
  assert.deepEqual([...EXECUTION_LEVELS], ["STANDALONE", "HYBRID", "LIVING_WORLD"]);
  const hybrid = await service.validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual(hybrid.executionLevel, { declared: "HYBRID", evaluated: "HYBRID" });
  const standalone = structuredClone(COMPLETE);
  standalone.program.executionLevel = "STANDALONE";
  standalone.metaverseRefs = [{ molSystemId: "power-grid" }];
  const standaloneReport = await serviceFor([module(standalone)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([standaloneReport.executionLevel, standaloneReport.sections.executionLevel.status], [{ declared: "STANDALONE", evaluated: "STANDALONE" }, "RESOLVED"]);
  const overstated = structuredClone(standalone);
  overstated.program.executionLevel = "HYBRID";
  assert.deepEqual((await serviceFor([module(overstated)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM")).sections.executionLevel.issues, ["EXECUTION_LEVEL_OVERSTATED"]);
  const living = structuredClone(COMPLETE);
  living.program.executionLevel = "LIVING_WORLD";
  const livingReport = await serviceFor([module(living)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  // Phase 9: the Regional Simulation Authority exists, but a program must reference it (and it must be mature) to qualify.
  assert.deepEqual(livingReport.sections.executionLevel.issues, ["EXECUTION_LEVEL_OVERSTATED", "LIVING_WORLD_REQUIRES_REGIONAL_SIMULATION"]);
  assert.equal(livingReport.lifecycle.allowed, false);
});

test("23/24/25/26/41 lifecycle: requested never overrides evaluated; Partner Validation cannot be skipped; ACTIVE needs activation", async () => {
  const complete = await service.validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual(complete.lifecycle, { requestedState: "PILOT_READY", evaluatedState: "PILOT_READY", allowed: true, blockingReasons: [] }, "41: complete fixture is pilot-ready");
  assert.deepEqual([complete.fundability.decision, complete.fundability.reasons], ["BUILD", []]);
  for (const requested of ["PILOT", "ACTIVE"] as const) {
    const claim = structuredClone(COMPLETE);
    claim.program.lifecycle = requested;
    const report = await serviceFor([module(claim)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
    assert.deepEqual([report.lifecycle.evaluatedState, report.lifecycle.allowed, report.lifecycle.blockingReasons], ["PILOT_READY", false, ["ACTIVATION_RECORD_REQUIRED"]], `26: ${requested} from configuration`);
  }
  // A gap stops evaluation at INTEGRATION_READINESS: Partner Validation is never skipped to reach a later state.
  const gapped = structuredClone(COMPLETE);
  gapped.integrationReadiness.PARTNERS = { answer: "GAP" };
  const gappedReport = await serviceFor([module(gapped)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([gappedReport.lifecycle.evaluatedState, gappedReport.lifecycle.blockingReasons], ["INTEGRATION_READINESS", ["INTEGRATION_READINESS_GAPS"]]);
  const activation = await service.evaluateActivation(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([activation.activatable, activation.activationRecord, activation.writes], [true, "NOT_PERSISTED", []]);
  const blockedActivation = await service.evaluateActivation(staff, "BLOCKED_GENERIC_TEST_PROGRAM");
  assert.deepEqual(blockedActivation.unmet, ["DEPENDENCIES_MEET_POLICY", "LIFECYCLE_ALLOWS_ACTIVATION"]);
});

// ---------------------------------------------------------------- outcome claim safety

test("27/28/29/30 evidence, career and credential claims stay with their authorities", async () => {
  const resolution = (await service.resolveProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM")).resolution;
  assert.ok(resolution.evidenceRequirements.every((item) => item.createsEvidence === false && item.authority === "verified-evidence"));
  assert.ok(resolution.careers.items.every((item: any) => item.jobEligibilityInferred === false));
  const report = await service.validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([report.createsEvidence, report.createsCredential, report.establishesEligibility, report.writes], [false, false, false, []]);
  const methods = Object.getOwnPropertyNames(WorkforceFoundationService.prototype);
  assert.ok(!methods.some((name) => /issue|award|enroll|hire|verifyEvidence|write|create|publish|start/i.test(name)), methods.join(","));
  assert.deepEqual(await counts(), baseline, "no Evidence, competency decision, credential, Truth, funding, career-event, runtime or result writes");
});

test("31/32/33/34 funding, partner and credential claims require real canonical sources", async () => {
  const potential = await service.listFundingRelationships(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.ok(potential.every((item) => item.alignment === "POTENTIAL" && item.verificationResolved === null && item.eligibilityEstablished === false));
  const fakeVerified = structuredClone(COMPLETE);
  fakeVerified.fundingRefs[0] = { ...fakeVerified.fundingRefs[0], alignment: "VERIFIED", verification: { source: "FUNDING_GRANT", recordId: `grant_missing_${RUN}` } };
  const fakeReport = await serviceFor([module(fakeVerified)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([fakeReport.sections.funding.status, fakeReport.sections.funding.issues[0]], ["BLOCKED", `VERIFIED_WITHOUT_CANONICAL_SOURCE:funding:${REFS.fundingSourceIds[0]}`]);
  // CONFIRMED partner without an ACTIVE relationship between the two organizations does not count.
  const fakePartner = structuredClone(COMPLETE);
  fakePartner.partnerRefs[0] = { ...fakePartner.partnerRefs[0], relationshipRef: { kind: "ORGANIZATION_RELATIONSHIP", id: `relationship_missing_${RUN}` } };
  const partnerReport = await serviceFor([module(fakePartner)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([partnerReport.sections.partners.status, partnerReport.sections.partners.warnings, partnerReport.lifecycle.evaluatedState],
    ["UNRESOLVED", [`CONFIRMED_WITHOUT_ACTIVE_RELATIONSHIP:${PARTNER_ORG}`], "PARTNER_VALIDATION"]);
  const complete = await service.validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([complete.sections.partners.status, complete.sections.partners.resolvedRefs], ["RESOLVED", [`partner:${PARTNER_ORG}`]]);
  // An internal ISSUE claim needs a real INTERNAL credential definition (this one is EXTERNAL).
  const internalClaim = structuredClone(COMPLETE);
  internalClaim.authorityRefs[0] = { ...internalClaim.authorityRefs[0], levels: ["ADVISE", "ISSUE"], issuanceBasis: { type: "INTERNAL_CREDENTIAL_DEFINITION", reference: CREDENTIAL } };
  const issuerReport = await serviceFor([module(internalClaim)]).validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([issuerReport.sections.authority.status, issuerReport.lifecycle.evaluatedState, issuerReport.lifecycle.blockingReasons[0]], ["BLOCKED", "AUTHORITY_REVIEW", "INTERNAL_ISSUER_UNRESOLVED"]);
  assert.deepEqual(complete.sections.credentials.resolvedRefs, [`credential:${CREDENTIAL}`]);
});

test("35/36/37 accessibility and sensory stay declarative: no accommodation data, references only, no truth", async () => {
  assert.ok(validateProgramPackage(malformedGenericTestPrograms(REFS).accommodation).some((error) => /platform support vocabulary/.test(error)));
  assert.equal(ACCESSIBILITY_SUPPORT_REQUIREMENTS.length, 9);
  const report = await service.validateProgramIntegration(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual(report.sections.sensory, { status: "RESOLVED", issues: [], warnings: [], resolvedRefs: [`PRESENTATION_POLICY:${REFS.sensoryPolicyId}`], unresolvedRefs: [] });
  assert.ok(validateProgramPackage({ ...structuredClone(COMPLETE), sensoryRefs: { ...COMPLETE.sensoryRefs!, soundIds: ["x"] } as any }).some((error) => /sensoryRefs.soundIds: unsupported field/.test(error)));
  const production = sensory.buildSensoryRegistry();
  const event = sensory.buildSensoryEvent(sensory.DATA_CENTER_SENSORY_TRIGGERS.MISSION_SUCCESS, { sensoryEventId: "sensory.phase8", sourceRecordId: "runtime_1", correlationId: "runtime_1" });
  const plan = sensory.planSensoryPresentation(event, { registry: production, policyId: "policy.data-center-training", accessibility: Object.fromEntries(sensory.ACCESSIBILITY_SENSORY_KEYS.map((key: string) => [key, false])) });
  assert.deepEqual([plan.plan.createsTruth, plan.plan.createsEvidence, plan.plan.createsCredential, plan.plan.worldStateWrites], [false, false, false, []]);
});

test("38/39/40 BOS and MOCC packets are read-only and learner-agnostic; the validation report is deterministic", async () => {
  const bos = await service.bosProgramReadinessPacket(staff, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.deepEqual([bos.readOnly, bos.controls, bos.lifecycle.evaluatedState, bos.fundability.decision, bos.partnerGaps, bos.credentialGaps, bos.fundingGaps], [true, [], "PILOT_READY", "BUILD", [], [], []]);
  assert.deepEqual(Object.keys(bos).sort(), ["authorityGaps", "capabilityMaturity", "controls", "credentialGaps", "dependencies", "fundability", "fundingGaps", "integrationReadiness",
    "lifecycle", "partnerGaps", "program", "readOnly", "reportingReadiness", "risk", "sensoryReadiness"]);
  const mocc = await service.moccProgramPackets(staff);
  assert.deepEqual([mocc.readOnly, mocc.controls, mocc.programs.map((item) => item.programId)], [true, [], ["BLOCKED_GENERIC_TEST_PROGRAM", "COMPLETE_GENERIC_TEST_PROGRAM", "PARTIAL_GENERIC_TEST_PROGRAM"]]);
  const partial = mocc.programs.find((item) => item.programId === "PARTIAL_GENERIC_TEST_PROGRAM")!;
  assert.deepEqual([partial.status, partial.executionLevel, partial.degradedCapabilities, partial.affectedSystems], ["PILOT_READY", "HYBRID", ["METAVERSE_ENVIRONMENT"], ["data-center", "mission-runtime", "power-grid"]]);
  assert.doesNotMatch(JSON.stringify(mocc), new RegExp(`${AUTHOR}|user_id|userId|learner|accommodat|diagnosis`));
  assert.deepEqual((await service.moccProgramPackets(outsider)).programs, []);
  const first = await service.validateProgramIntegration(staff, "BLOCKED_GENERIC_TEST_PROGRAM");
  const second = await service.validateProgramIntegration(staff, "BLOCKED_GENERIC_TEST_PROGRAM");
  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first.sections), ["schema", "references", "authority", "capabilities", "dependencies", "integrationReadiness", "executionLevel", "partners",
    "credentials", "funding", "reporting", "accessibility", "sensory", "governance", "lifecycle", "fundability"]);
  for (const section of Object.values(first.sections)) assert.deepEqual(Object.keys(section), ["status", "issues", "warnings", "resolvedRefs", "unresolvedRefs"]);
  assert.equal(first.fundability.decision, null, "no assessment declared: fundability is NOT_ASSESSED, never assumed");
});

test("44 MALFORMED shapes are rejected by the registry", () => {
  const malformed = malformedGenericTestPrograms(REFS);
  const registry = buildWorkforceRegistry({ packages: Object.values(malformed) as any, fundingSources: FUNDING_SOURCES });
  assert.deepEqual([registry.packages.length, registry.rejected.length], [0, Object.keys(malformed).length]);
});

// ---------------------------------------------------------------- Data Center regression (real package, real org, read-only)

test("45/46/47/48/49/50 the Data Center package still resolves honestly: INTEGRATION_READINESS, HOLD, gaps visible", async () => {
  assert.deepEqual(buildWorkforceRegistry().rejected, []);
  assert.deepEqual(validateProgramModule(DATA_CENTER_PROGRAM_MODULE), []);
  const report = await dataCenter.validateProgramIntegration(shf, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual([report.lifecycle.requestedState, report.lifecycle.evaluatedState, report.lifecycle.allowed], ["INTEGRATION_READINESS", "INTEGRATION_READINESS", true]);
  assert.equal(report.fundability.decision, "HOLD");
  assert.ok(report.fundability.reasons.includes("INSUFFICIENT_FUNDING_LANES"));
  assert.deepEqual(report.executionLevel, { declared: "STANDALONE", evaluated: "STANDALONE" });
  assert.deepEqual([report.sections.partners.status, report.sections.partners.issues], ["UNRESOLVED", ["PARTNER_VALIDATION_INCOMPLETE"]], "48");
  assert.deepEqual([report.sections.credentials.status, report.sections.credentials.issues], ["UNRESOLVED", ["CREDENTIAL_AUTHORITY_NOT_DECLARED"]], "49");
  assert.deepEqual([report.sections.funding.status, report.sections.funding.issues], ["UNRESOLVED", ["NO_FUNDING_LANES"]], "50");
  assert.deepEqual(report.sections.capabilities.warnings, ["METAVERSE_ENVIRONMENT:PROVIDER_UNAVAILABLE:data-center"], "data-center stays honestly unavailable");
  assert.deepEqual(report.sections.governance.status, "RESOLVED");
  const bos = await dataCenter.bosProgramReadinessPacket(shf, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual([bos.fundability.decision, bos.partnerGaps, bos.risk.implementationRisk], ["HOLD", ["PARTNER_VALIDATION_INCOMPLETE"], "MEDIUM"]);
  const mocc = await dataCenter.moccProgramPackets(shf);
  assert.deepEqual(mocc.programs.map((item) => [item.programId, item.status, item.executionLevel]), [[DATA_CENTER_PROGRAM_ID, "INTEGRATION_READINESS", "STANDALONE"]]);
});

// ---------------------------------------------------------------- authority boundaries

function sources(dir: URL): Array<[string, string]> {
  return readdirSync(dir).flatMap((name) => {
    const path = new URL(name, dir);
    if (statSync(path).isDirectory()) return sources(new URL(`${name}/`, dir));
    return /\.(ts|js)$/.test(name) ? [[path.pathname, readFileSync(path, "utf8")] as [string, string]] : [];
  });
}

test("51-60 no program-specific engine and no duplicate authority", () => {
  const workforce = sources(new URL("../src/domain/workforce-foundation/", import.meta.url));
  for (const [file, source] of workforce) {
    assert.doesNotMatch(file, /engine|runtime|simulator/i, `${file}: no program engine`);
    assert.doesNotMatch(source, /\b(INSERT INTO|DELETE FROM|CREATE TABLE|ALTER TABLE)\b|\bUPDATE\s+[a-z_]+\s+SET\b/, `${file} writes SQL`);
    assert.doesNotMatch(source, /programId\s*===\s*["']|DATA_CENTER_PROGRAM_ID\s*===|FireProgram|HealthcareProgram|StnaProgram/, `${file} special-cases a program`);
    for (const [, specifier] of source.matchAll(/from\s+"([^"]+)"/g)) {
      assert.doesNotMatch(specifier, /verified-evidence\/service|prepare-prove|truth-spine|credential-service|funding-grant-service|metaverse\/(market|passport)/i, `${file} imports ${specifier}`);
    }
  }
  const domains = readdirSync(new URL("../src/domain/", import.meta.url));
  assert.ok(!domains.some((name) => /fire|ems|healthcare|stna|phlebotomy|nurse/i.test(name)), "no Fire/Healthcare domain or engine");
  // MOL maturity and provider modes are reused, not redefined.
  assert.equal(PROVIDER_MODES, mol.MOL_PROVIDER_MODES);
  const migrations = readdirSync(new URL("../migrations/", import.meta.url)).filter((name) => /^\d+_/.test(name)).sort();
  assert.match(migrations.at(-1)!, /^156_/, "63: Phase 8 adds no migration");
});

test("61 organization isolation", async () => {
  await assert.rejects(service.validateProgramIntegration(outsider, "COMPLETE_GENERIC_TEST_PROGRAM"), (error: any) => error.code === "PROGRAM_NOT_FOUND");
  await assert.rejects(dataCenter.validateProgramIntegration(staff, DATA_CENTER_PROGRAM_ID), (error: any) => error.code === "PROGRAM_NOT_FOUND");
  const foreign = structuredClone(COMPLETE);
  foreign.program.owningOrganizationId = OTHER_ORG;
  const report = await serviceFor([module(foreign)]).validateProgramIntegration(outsider, "COMPLETE_GENERIC_TEST_PROGRAM");
  assert.equal(report.sections.references.status, "UNRESOLVED", "another organization resolves none of this organization's course, Mission or entitlement");
  assert.equal(report.sections.governance.status, "UNRESOLVED");
  assert.equal(report.sections.partners.status, "UNRESOLVED");
});

test("no readiness shortcut: readiness for the generic shapes is computed, never declared", () => {
  const facts = { curriculumResolved: true, arcadeResolved: true, missionsResolved: true, careersResolved: true, molSystems: { "power-grid": { mode: "SIMULATED", maturity: "CONTRACT_DEFINED" }, "mission-runtime": { mode: "LIVE", maturity: "PRODUCTION" } },
    fundingSourceTypes: Object.fromEntries(REFS.fundingSourceIds.map((id, index) => [id, ["GRANT", "WORKFORCE", "EMPLOYER"][index]])) };
  assert.equal(evaluateIntegrationReadiness(COMPLETE, facts).status, "READY");
  assert.equal(evaluateIntegrationReadiness(BLOCKED, facts).status, "BLOCKED");
  assert.equal(evaluateIntegrationReadiness(COMPLETE, { ...facts, missionsResolved: false }).status, "BLOCKED", "an unpublished Mission cannot be declared ready");
});
