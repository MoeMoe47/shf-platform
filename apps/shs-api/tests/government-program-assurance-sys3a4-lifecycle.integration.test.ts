import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { pool, query } from "../src/db/client.js";
import { FundingGrantService } from "../src/domain/funding-grants/service/funding-grant-service.js";
import { ReportDraftService } from "../src/domain/reporting/report-draft-service.js";

const enabled = process.env.WAVE3_LIVE === "1";
const run = `sys3a4-${Date.now()}-${randomUUID().slice(0, 8)}`;
const orgA = `org-${run}-a`;
const orgB = `org-${run}-b`;
const userA = `user-${run}-a`;
const userB = `user-${run}-b`;
const programA = `program-${run}-a`;

const actor = (userId: string, organizationId: string, overrides: any = {}) => ({
  user_id: userId,
  organization_id: organizationId,
  active_organization_id: organizationId,
  tenant_id: `tenant:${organizationId}`,
  permissions: ["reports.preview", "reports.view", "reports.publication.authorize", "funding.grant.view", "funding.grant.manage"],
  actor_type: "USER",
  ...overrides,
});

before(async () => {
  if (!enabled) return;
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
    VALUES ($1,$2,$2,'NONPROFIT','active',$3),($4,$5,$5,'FOR_PROFIT','active',$6)`, [orgA, `SYS3A4 A ${run}`, `${run}.a.invalid`, orgB, `SYS3A4 B ${run}`, `${run}.b.invalid`]);
  await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES ($1,$3,$1||'@test.invalid','SYS3A4 A','active','test'),($2,$4,$2||'@test.invalid','SYS3A4 B','active','test')`, [userA, userB, orgA, orgB]);
  await query(`INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1,$2,$3,'SERVICE','ACTIVE')`, [programA, orgA, `Program ${run}`]);
});

after(async () => { if (enabled) await pool.end(); });

test("SYS-3A4 funding use enforces scope, state, program, and effective period", { skip: !enabled }, async () => {
  const funding = new FundingGrantService();
  const primary = actor(userA, orgA);
  const wrongOrg = actor(userB, `${orgB}-unrelated`);
  const grant = await funding.createGrant({
    title: `SYS3A4 grant ${run}`,
    funderOrganizationId: orgB,
    recipientOrganizationId: orgA,
    reportingOrganizationId: orgA,
    awardAmount: "100.00",
    startDate: "2026-01-01",
    endDate: "2026-09-08",
  }, primary);
  await funding.transitionGrant(grant.grant_id, { status: "ACTIVE" }, primary);
  await funding.createAllocation(grant.grant_id, { programId: programA, allocatedAmount: "100.00" }, primary);

  const authorized = await funding.authorizeFundedUse({ grantId: grant.grant_id, programId: programA, occurredOn: "2026-06-01" }, primary);
  assert.equal(authorized.authorized, true);
  await assert.rejects(() => funding.authorizeFundedUse({ grantId: grant.grant_id, programId: programA, occurredOn: "2025-12-31" }, primary), /outside the grant effective period/);
  await assert.rejects(() => funding.authorizeFundedUse({ grantId: grant.grant_id, programId: programA, occurredOn: "2026-09-09" }, primary), /outside the grant effective period/);
  await assert.rejects(() => funding.authorizeFundedUse({ grantId: grant.grant_id, programId: `wrong-${run}`, occurredOn: "2026-06-01" }, primary), /no allocation for this program/);
  await assert.rejects(() => funding.authorizeFundedUse({ grantId: grant.grant_id, programId: programA, occurredOn: "2026-06-01" }, wrongOrg), /Grant not found/);
  await funding.transitionGrant(grant.grant_id, { status: "SUSPENDED" }, primary);
  await assert.rejects(() => funding.authorizeFundedUse({ grantId: grant.grant_id, programId: programA, occurredOn: "2026-06-01" }, primary), /active grant/);
  await assert.rejects(() => funding.transitionGrant(grant.grant_id, { status: "ACTIVE" }, primary), /Expired grants cannot be resumed/);
  await funding.transitionGrant(grant.grant_id, { status: "CLOSED" }, primary);
  await assert.rejects(() => funding.transitionGrant(grant.grant_id, { status: "ACTIVE" }, primary), /cannot re-enter lifecycle|cannot transition/);
  const finalReport = await new ReportDraftService().createDraft({ reportType: "sys3a4-final-funding-report", subjectName: grant.grant_id }, primary);
  assert.equal((await new ReportDraftService().getDraft(finalReport.report_id, primary)).report_id, finalReport.report_id);
  const history = await query("SELECT COUNT(*)::int AS count FROM audit_events WHERE organization_id=$1 AND target_object_id=$2", [orgA, grant.grant_id]);
  assert.ok(Number(history.rows[0].count) >= 4);
});

test("SYS-3A4 rejected reports revise, resubmit, approve, and preserve immutable history", { skip: !enabled }, async () => {
  const reports = new ReportDraftService();
  const primary = actor(userA, orgA);
  const ai = actor(userA, orgA, { actor_type: "AI" });
  const draft = await reports.createDraft({ reportType: "sys3a4-report", subjectName: run }, primary);
  await reports.transitionReview(draft.report_id, "ready_for_review", "Submitted for review", primary);
  const rejected = await reports.transitionReview(draft.report_id, "rejected", "Evidence needs correction", primary);
  assert.equal(rejected.lifecycle_status, "rejected");
  const revised = await reports.updateDraft(draft.report_id, { subjectName: `${run}-corrected`, expectedVersion: rejected.version }, primary, rejected.version);
  assert.equal(revised.lifecycle_status, "rejected");
  const resubmitted = await reports.transitionReview(draft.report_id, "ready_for_review", "Corrected report resubmitted", primary);
  const approved = await reports.transitionReview(draft.report_id, "approved", "Corrected report approved", primary);
  assert.equal(resubmitted.lifecycle_status, "ready_for_review");
  assert.equal(approved.lifecycle_status, "approved");
  await assert.rejects(() => reports.transitionReview(draft.report_id, "approved", "AI approval", ai), /Human report review authority/);
  const correction = await reports.beginCorrection(draft.report_id, "Authorized V2 correction", primary);
  assert.equal(correction.lifecycle_status, "draft");
  const revisions = await reports.listRevisions(draft.report_id, primary);
  assert.ok(revisions.length >= 7);
  assert.deepEqual(revisions.map((item: any) => item.version), [...revisions.map((item: any) => item.version)].sort((a: number, b: number) => b - a));
  assert.equal((await reports.getDraft(draft.report_id, actor(userB, orgB))), null);
});
