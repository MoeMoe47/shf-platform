import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { query, pool } from "../src/db/client.js";
import { ReportDraftService } from "../src/domain/reporting/report-draft-service.js";
import { IntegrationOutboxRepo } from "../src/domain/trusted-reporting/outbox-repo.js";
import { FundingGrantService } from "../src/domain/funding-grants/service/funding-grant-service.js";

const enabled = process.env.WAVE3_LIVE === "1";
const run = `sys3a3-${Date.now()}-${randomUUID().slice(0, 8)}`;
const orgA = `org-${run}-a`;
const orgB = `org-${run}-b`;
const tenantA = `tenant:${orgA}`;
const userA = `user-${run}-a`;
const userB = `user-${run}-b`;

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
    VALUES ($1,$2,$2,'NONPROFIT','active',$3),($4,$5,$5,'FOR_PROFIT','active',$6)`, [orgA, `SYS3A3 A ${run}`, `${run}.a.invalid`, orgB, `SYS3A3 B ${run}`, `${run}.b.invalid`]);
  await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES ($1,$3,$1||'@test.invalid','SYS3A3 A','active','test'),($2,$4,$2||'@test.invalid','SYS3A3 B','active','test')`, [userA, userB, orgA, orgB]);
});

after(async () => { if (enabled) await pool.end(); });

test("SYS-3A3 report review is persisted, scoped, human-authorized, and historical", { skip: !enabled }, async () => {
  const drafts = new ReportDraftService();
  const primary = actor(userA, orgA);
  const other = actor(userB, `${orgB}-unrelated`);
  const draft = await drafts.createDraft({ reportType: "sys3a3-report", subjectName: run }, primary);
  const submitted = await drafts.transitionReview(draft.report_id, "ready_for_review", "Submitted for independent review", primary);
  assert.equal(submitted.lifecycle_status, "ready_for_review");
  const approved = await drafts.transitionReview(draft.report_id, "approved", "Approved after source reconciliation", primary);
  assert.equal(approved.lifecycle_status, "approved");
  assert.equal((await drafts.getDraft(draft.report_id, other)), null);
  await assert.rejects(() => drafts.transitionReview(draft.report_id, "rejected", "cross-org attempt", other), /Report draft not found/);
  await assert.rejects(() => drafts.transitionReview(draft.report_id, "approved", "AI attempt", actor(userA, orgA, { actor_type: "AI" })), /Human report review authority/);
  const history = await query("SELECT version FROM report_draft_revisions WHERE report_id=$1 AND organization_id=$2 ORDER BY version", [draft.report_id, orgA]);
  assert.deepEqual(history.rows.map((row: any) => Number(row.version)), [1, 2, 3]);
});

test("SYS-3A3 quarantined outbox recovery is scoped and idempotent at the repository boundary", { skip: !enabled }, async () => {
  const outbox = new IntegrationOutboxRepo();
  const event = await outbox.enqueue({ producer_id: `sys3a3-${run}`, event_type: "report.publication.ready", subject_type: "report", subject_id: run, organization_id: orgA, originating_actor_id: userA, occurred_at: new Date().toISOString(), idempotency_key: `${run}:recovery`, correlation_id: `${run}:correlation`, tenant_id: tenantA, destination: "trusted-reporting" });
  await query("UPDATE integration_outbox SET delivery_status='QUARANTINED', failure_classification='QUARANTINED', quarantined_at=NOW(), last_error='test terminal failure' WHERE outbox_event_id=$1", [event.outbox_event_id]);
  assert.equal(await outbox.requeueQuarantined(event.outbox_event_id, orgB), null);
  const recovered = await outbox.requeueQuarantined(event.outbox_event_id, orgA);
  assert.equal(recovered?.delivery_status, "PENDING");
  assert.equal(await outbox.requeueQuarantined(event.outbox_event_id, orgA), null);
});

test("SYS-3A3 funding transition cannot cross organization scope and suspended grants reject new allocations", { skip: !enabled }, async () => {
  const funding = new FundingGrantService();
  const primary = actor(userA, orgA);
  const other = actor(userB, `${orgB}-unrelated`);
  const grant = await funding.createGrant({ title: `SYS3A3 grant ${run}`, funderOrganizationId: orgB, recipientOrganizationId: orgA, reportingOrganizationId: orgA, awardAmount: "100.00", startDate: "2026-01-01", endDate: "2026-12-31" }, primary);
  await assert.rejects(() => funding.transitionGrant(grant.grant_id, { status: "SUSPENDED" }, other), /Grant not found/);
  await funding.transitionGrant(grant.grant_id, { status: "ACTIVE" }, primary);
  await funding.transitionGrant(grant.grant_id, { status: "SUSPENDED" }, primary);
  const programId = `program-${run}`;
  await query(`INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1,$2,$3,'SERVICE','ACTIVE')`, [programId, orgA, `Program ${run}`]);
  await assert.rejects(() => funding.createAllocation(grant.grant_id, { programId, allocatedAmount: "10.00" }, primary), /Suspended grants/);
});
