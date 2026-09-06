import { before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { ImpactAttributionService } from "../src/domain/impact-attribution/service/impact-attribution-service.ts";

const RUN = `shfp7_${Date.now()}`;
const shf = "org_shf_001";
const orgA = `org_${RUN}_a`;
const orgB = `org_${RUN}_b`;
const orgC = `org_${RUN}_c`;
const funder = `org_${RUN}_funder`;
const shfUser = `user_${RUN}_shf`;
const orgAUser = `user_${RUN}_a`;
const orgBUser = `user_${RUN}_b`;
const orgCUser = `user_${RUN}_c`;
const service = new ImpactAttributionService();

function actor(userId: string, organizationId: string, roles: string[], permissions: string[]) {
  return {
    user_id: userId,
    active_organization_id: organizationId,
    organization_id: organizationId,
    tenant_id: `tenant:${organizationId}`,
    roles,
    permissions,
  };
}

const shfActor = actor(shfUser, shf, ["shf_admin"], ["impact.aggregate.view"]);
const orgAActor = actor(orgAUser, orgA, ["org_admin"], ["impact.aggregate.view"]);
const orgBActor = actor(orgBUser, orgB, ["org_admin"], ["impact.aggregate.view"]);
const noPermissionActor = actor(orgBUser, orgB, ["org_admin"], []);

async function cleanup() {
  await query("DELETE FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM prepare_prove_evidence WHERE evidence_id LIKE $1 OR evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM service_agreement_versions WHERE agreement_id IN (SELECT agreement_id FROM service_agreements WHERE agreement_id LIKE $1)", [`${RUN}%`]);
  await query("DELETE FROM service_agreements WHERE agreement_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM grant_program_allocations WHERE allocation_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM funding_grants WHERE grant_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM organization_relationships WHERE relationship_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM assignments WHERE assignment_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM programs WHERE program_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[shfUser, orgAUser, orgBUser, orgCUser]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[orgA, orgB, orgC, funder]]);
}

async function sideEffectCounts() {
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM prepare_prove_evidence WHERE evidence_id LIKE $1) AS evidence,
       (SELECT COUNT(*)::int FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1) AS truth,
       (SELECT COUNT(*)::int FROM funding_grants WHERE grant_id LIKE $1) AS grants,
       (SELECT COUNT(*)::int FROM service_agreements WHERE agreement_id LIKE $1) AS agreements,
       (SELECT COUNT(*)::int FROM organization_relationships WHERE relationship_id LIKE $1) AS relationships`,
    [`${RUN}%`],
  );
  return res.rows[0];
}

async function insertProgram(programId: string, accountableOrg: string, operatorOrg: string, classification: string) {
  await query(
    `INSERT INTO programs (
       program_id, organization_id, name, program_type, status,
       program_classification, owner_organization_id, operator_organization_id, accountable_organization_id, created_by_user_id
     ) VALUES ($1,$2,$3,'workforce_training','active',$4,$5,$6,$2,$7)
     ON CONFLICT (program_id) DO NOTHING`,
    [programId, accountableOrg, `${programId} Program`, classification, accountableOrg, operatorOrg, shfUser],
  );
}

async function insertTruthFact(input: { factId: string; orgId: string; userId: string; assignmentId?: string | null; programId?: string | null; sourceType?: string; occurredAt: string }) {
  await query(
    `INSERT INTO curriculum_truth_facts (
       truth_fact_id, organization_id, learner_user_id, fact_type, source_type, source_record_id,
       evidence_id, assignment_id, evidence_rule_id, evidence_rule_version, provenance_json, occurred_at
     ) VALUES ($1,$2,$3,'PARTICIPANT_SERVED',$4,$5,NULL,$6,$7,1,$8::jsonb,$9)
     ON CONFLICT DO NOTHING`,
    [
      input.factId,
      input.orgId,
      input.userId,
      input.sourceType || "LESSON_COMPLETION",
      `${input.factId}_source`,
      input.assignmentId || null,
      `${RUN}_rule`,
      JSON.stringify({ phase: 7, source: "impact-attribution-test", program_id: input.programId || null }),
      input.occurredAt,
    ],
  );
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
     VALUES
       ($1, 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
       ($2, 'Network Org A', 'Network Org A', 'INDEPENDENT_NETWORK', 'active', 'a.phase7.test'),
       ($3, 'Network Org B', 'Network Org B', 'INDEPENDENT_NETWORK', 'active', 'b.phase7.test'),
       ($4, 'Network Org C', 'Network Org C', 'INDEPENDENT_NETWORK', 'active', 'c.phase7.test'),
       ($5, 'Phase 7 Funder', 'Phase 7 Funder', 'FUNDER', 'active', 'funder.phase7.test')
     ON CONFLICT (organization_id) DO NOTHING`,
    [shf, orgA, orgB, orgC, funder],
  );
  for (const [userId, organizationId] of [[shfUser, shf], [orgAUser, orgA], [orgBUser, orgB], [orgCUser, orgC]] as const) {
    await query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1,$2,$3,'Phase 7 User','active','test')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, `${userId}@test.invalid`],
    );
  }
  await query(
    `INSERT INTO service_catalog (
       service_id, service_key, name, description, category, status,
       provider_organization_id, audience, requires_relationship_type, agreement_requirement
     ) VALUES
       ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', $1, 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'AGREEMENT_REQUIRED')
     ON CONFLICT (service_key) DO UPDATE SET provider_organization_id=$1, status='ACTIVE'`,
    [shf],
  );
  await insertProgram(`${RUN}_program_a`, shf, orgA, "SHF_INCUBATED");
  await insertProgram(`${RUN}_program_b`, orgB, orgB, "INDEPENDENT_NETWORK");
  await insertProgram(`${RUN}_program_shf`, shf, shf, "SHF_OWNED");
  await insertProgram(`${RUN}_program_c`, orgC, orgC, "INDEPENDENT_NETWORK");
  await query(
    `INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from, effective_to, created_by, updated_by)
     VALUES
       ($1,$2,$3,'NETWORK_MEMBER_OF','ACTIVE','2026-01-01T00:00:00Z',NULL,$7,$7),
       ($4,$3,$2,'INCUBATES','ACTIVE','2026-01-01T00:00:00Z',NULL,$7,$7),
       ($5,$6,$3,'NETWORK_MEMBER_OF','ACTIVE','2026-01-01T00:00:00Z','2026-06-01T00:00:00Z',$7,$7)
     ON CONFLICT DO NOTHING`,
    [`${RUN}_rel_a_member`, orgA, shf, `${RUN}_rel_a_incubates`, `${RUN}_rel_c_member`, orgC, shfUser],
  );
  await query(
    `INSERT INTO service_agreements (agreement_id, provider_organization_id, consumer_organization_id, service_id, status, effective_from, effective_until, service_scope, support_level, service_expectations, agreement_reference, created_by_user_id, approved_by_user_id, approved_at, activated_by_user_id, activated_at)
     VALUES ($1,$2,$3,'svc_reporting','ACTIVE','2026-01-01T00:00:00Z',NULL,'Reporting support','Standard','{}','P7',$4,$4,'2026-01-01T00:00:00Z',$4,'2026-01-01T00:00:00Z')
     ON CONFLICT DO NOTHING`,
    [`${RUN}_agreement_a`, shf, orgA, shfUser],
  );
  await query(
    `INSERT INTO funding_grants (grant_id, title, funder_organization_id, recipient_organization_id, reporting_organization_id, status, award_amount, start_date, end_date, purpose, created_by_user_id)
     VALUES ($1,'Phase 7 Grant',$2,$3,$3,'ACTIVE',1000,'2026-01-01','2026-12-31','Network support',$4)
     ON CONFLICT DO NOTHING`,
    [`${RUN}_grant`, funder, shf, shfUser],
  );
  await query(
    `INSERT INTO grant_program_allocations (allocation_id, grant_id, program_id, allocated_amount, created_by_user_id)
     VALUES ($1,$2,$3,1000,$4)
     ON CONFLICT DO NOTHING`,
    [`${RUN}_alloc`, `${RUN}_grant`, `${RUN}_program_a`, shfUser],
  );
  await insertTruthFact({ factId: `${RUN}_fact_org_a`, orgId: shf, userId: shfUser, assignmentId: `${RUN}_assign_a`, programId: `${RUN}_program_a`, occurredAt: "2026-05-01T00:00:00Z" });
  await insertTruthFact({ factId: `${RUN}_fact_org_b`, orgId: orgB, userId: orgBUser, assignmentId: `${RUN}_assign_b`, programId: `${RUN}_program_b`, occurredAt: "2026-05-01T00:00:00Z" });
  await insertTruthFact({ factId: `${RUN}_fact_shf`, orgId: shf, userId: shfUser, assignmentId: `${RUN}_assign_shf`, programId: `${RUN}_program_shf`, occurredAt: "2026-05-01T00:00:00Z" });
  await insertTruthFact({ factId: `${RUN}_fact_c_active_window`, orgId: orgC, userId: orgCUser, assignmentId: `${RUN}_assign_c`, programId: `${RUN}_program_c`, occurredAt: "2026-05-01T00:00:00Z" });
  await insertTruthFact({ factId: `${RUN}_fact_c_after_window`, orgId: orgC, userId: orgCUser, assignmentId: `${RUN}_assign_c`, programId: `${RUN}_program_c`, occurredAt: "2026-07-01T00:00:00Z" });
  await query(
    `INSERT INTO prepare_prove_evidence (evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, status, provenance_json, evidence_rule_id)
     VALUES ($1,'phase7',$2,$3,$4,$5,'activity','criterion','REVIEWABLE','{}',$6)
     ON CONFLICT DO NOTHING`,
    [`${RUN}_draft_evidence`, `${RUN}_draft_source`, orgAUser, orgA, `tenant:${orgA}`, `${RUN}_draft_rule`],
  );
});

test("producer is derived from program operator and not from SHF owner/accountable context", async () => {
  const result = await service.getAttribution({ metricKey: "truth.fact_count", scope: "ORGANIZATION", organizationId: orgA, from: "2026-01-01", until: "2027-01-01" }, shfActor);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].producerOrganizationId, orgA);
  assert.equal(result.items[0].ownerOrganizationId, shf);
  assert.equal(result.items[0].accountableOrganizationId, shf);
});

test("SHF direct excludes independently produced facts while supported network includes eligible facts", async () => {
  const direct = await service.getAttribution({ metricKey: "truth.fact_count", scope: "SHF_DIRECT", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  assert.equal(direct.items.some((item: any) => item.factId === `${RUN}_fact_org_a`), false);
  assert.equal(direct.items.some((item: any) => item.factId === `${RUN}_fact_shf`), true);

  const supported = await service.getAttribution({ metricKey: "truth.fact_count", scope: "SHF_SUPPORTED_NETWORK", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  const orgAFact = supported.items.find((item: any) => item.factId === `${RUN}_fact_org_a`);
  assert.ok(orgAFact);
  assert.equal(orgAFact.producerOrganizationId, orgA);
  assert.deepEqual(orgAFact.supportReasons, ["FUNDING", "INCUBATION", "NETWORK_MEMBERSHIP", "SERVICE_AGREEMENT"]);
});

test("multiple support reasons do not double count one source fact", async () => {
  const supported = await service.getAttribution({ metricKey: "truth.fact_count", scope: "SHF_SUPPORTED_NETWORK", from: "2026-04-01", until: "2026-06-01" }, shfActor);
  assert.equal(supported.items.filter((item: any) => item.factId === `${RUN}_fact_org_a`).length, 1);
  assert.equal(supported.items.find((item: any) => item.factId === `${RUN}_fact_org_a`).value, 1);
});

test("historical support windows qualify only facts inside active intervals", async () => {
  const supported = await service.getAttribution({ metricKey: "truth.fact_count", scope: "SHF_SUPPORTED_NETWORK", from: "2026-01-01", until: "2026-12-31" }, shfActor);
  assert.equal(supported.items.some((item: any) => item.factId === `${RUN}_fact_c_active_window`), true);
  assert.equal(supported.items.some((item: any) => item.factId === `${RUN}_fact_c_after_window`), false);
});

test("truth-state boundary counts canonical truth facts, not draft evidence-only records", async () => {
  const supported = await service.getAttribution({ metricKey: "truth.fact_count", scope: "SHF_SUPPORTED_NETWORK", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  assert.equal(supported.items.some((item: any) => item.evidenceId === `${RUN}_draft_evidence`), false);
});

test("organization privacy and aggregate authority fail closed", async () => {
  await assert.rejects(
    () => service.getAttribution({ metricKey: "truth.fact_count", scope: "ORGANIZATION", organizationId: orgA, from: "2026-01-01", until: "2027-01-01" }, orgBActor),
    /Cannot inspect another organization's attribution detail/,
  );
  await assert.rejects(
    () => service.getAttribution({ metricKey: "truth.fact_count", scope: "WHOLE_NETWORK", from: "2026-01-01", until: "2027-01-01" }, orgBActor),
    /Whole-network impact aggregation requires SHF\/platform authority/,
  );
  await assert.rejects(
    () => service.getAttribution({ metricKey: "truth.fact_count", scope: "ORGANIZATION", organizationId: orgB, from: "2026-01-01", until: "2027-01-01" }, noPermissionActor),
    /Impact aggregation permission is required/,
  );
});

test("funding support and service agreement support do not alter producer attribution", async () => {
  const supported = await service.getAttribution({ metricKey: "truth.fact_count", scope: "SHF_SUPPORTED_NETWORK", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  const orgAFact = supported.items.find((item: any) => item.factId === `${RUN}_fact_org_a`);
  assert.equal(orgAFact.producerOrganizationId, orgA);
  assert.ok(orgAFact.supportReasons.includes("FUNDING"));
  assert.ok(orgAFact.supportReasons.includes("SERVICE_AGREEMENT"));
});

test("read-only attribution queries create no evidence, truth, funding, agreement, or relationship side effects", async () => {
  const beforeCounts = await sideEffectCounts();
  await service.getAttribution({ metricKey: "truth.fact_count", scope: "WHOLE_NETWORK", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  const afterCounts = await sideEffectCounts();
  assert.deepEqual(afterCounts, beforeCounts);
});

test("metric query semantics reuse canonical truth facts without defining parallel metrics", async () => {
  const lesson = await service.getAttribution({ metricKey: "lesson_completion.count", scope: "WHOLE_NETWORK", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  const projects = await service.getAttribution({ metricKey: "project_accepted.count", scope: "WHOLE_NETWORK", from: "2026-01-01", until: "2027-01-01" }, shfActor);
  assert.equal(lesson.total >= 3, true);
  assert.equal(projects.total, 0);
});
