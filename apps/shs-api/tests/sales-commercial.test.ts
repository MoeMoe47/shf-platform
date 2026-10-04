import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SalesService } from "../src/domain/sales/service/sales-service.ts";
import { evaluateSalesOpportunityStageTransition } from "../src/domain/sales/service/sales-stage-transition-policy.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("migrations/151_sales_commercial_foundation.sql");
const routes = read("src/domain/sales/api/routes.ts");
const router = read("src/api/router.ts");
const shfNextRepo = read("../../../../shf-next/src/domain/sales/repositories/shrv1SalesApiRepository.ts");
const shfNextSnapshot = read("../../../../shf-next/src/domain/sales/services/salesDataService.ts");

const actorA = { user_id: "user_sales_a", active_organization_id: "org_sales_a", organization_id: "org_sales_a", tenant_id: "tenant:org_sales_a", permissions: ["sales.read", "sales.write", "organization.view"] };
const actorB = { user_id: "user_sales_b", active_organization_id: "org_sales_b", organization_id: "org_sales_b", tenant_id: "tenant:org_sales_b", permissions: ["sales.read", "sales.write", "organization.view"] };

function row(base: any) {
  return {
    organization_id: base.organization_id || "org_sales_a",
    tenant_id: base.tenant_id || "tenant:org_sales_a",
    account_organization_id: base.account_organization_id || "org_account_1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    version: 1,
    ...base,
  };
}

class FakeRepo {
  organizations = new Set(["org_sales_a", "org_sales_b", "org_account_1", "org_account_2"]);
  relationships = new Map<string, any>();
  discoveries = new Map<string, any>();
  needs = new Map<string, any>();
  opportunities = new Map<string, any>();

  scoped<T>(records: Map<string, T>, scope: any) {
    return [...records.values()].filter((item: any) => item.organization_id === scope.organization_id && item.tenant_id === scope.tenant_id && !item.archived_at);
  }

  async organizationExists(id: string) { return this.organizations.has(id); }
  async getLinkReference(type: "relationship" | "discovery" | "need", id: string) {
    const records = type === "relationship" ? this.relationships : type === "discovery" ? this.discoveries : this.needs;
    return records.get(id) || null;
  }
  async listActiveNeedsForAccount(accountOrganizationId: string, scope: any) {
    return this.scoped(this.needs, scope).filter((item: any) => item.account_organization_id === accountOrganizationId && !["CLOSED", "RESOLVED"].includes(item.status));
  }
  async listRelationships(scope: any) { return this.scoped(this.relationships, scope); }
  async getRelationship(id: string, scope: any) { const item = this.relationships.get(id); return item?.organization_id === scope.organization_id && item?.tenant_id === scope.tenant_id && !item?.archived_at ? item : null; }
  async createRelationship(input: any) { const created = row({ ...input, relationship_id: input.relationship_id }); this.relationships.set(created.relationship_id, created); return created; }
  async updateRelationship(id: string, scope: any, input: any) { const current = await this.getRelationship(id, scope); if (!current) return null; const updated = { ...current, ...input, updated_by_user_id: input.actor_id, relationship_status: input.relationship_status || current.relationship_status, archived_at: input.relationship_status === "CLOSED" ? "2026-01-02T00:00:00.000Z" : current.archived_at, version: current.version + 1 }; this.relationships.set(id, updated); return updated; }

  async listDiscoveryRecords(scope: any) { return this.scoped(this.discoveries, scope); }
  async getDiscoveryRecord(id: string, scope: any) { const item = this.discoveries.get(id); return item?.organization_id === scope.organization_id && item?.tenant_id === scope.tenant_id && !item?.archived_at ? item : null; }
  async createDiscoveryRecord(input: any) { const created = row({ ...input, discovery_record_id: input.discovery_record_id }); this.discoveries.set(created.discovery_record_id, created); return created; }
  async updateDiscoveryRecord(id: string, scope: any, input: any) { const current = await this.getDiscoveryRecord(id, scope); if (!current) return null; const updated = { ...current, ...input, updated_by_user_id: input.actor_id, version: current.version + 1 }; this.discoveries.set(id, updated); return updated; }
  async archiveDiscoveryRecord(id: string, scope: any, actorId: string) { const current = await this.getDiscoveryRecord(id, scope); if (!current) return null; const updated = { ...current, archived_at: "2026-01-02T00:00:00.000Z", updated_by_user_id: actorId, version: current.version + 1 }; this.discoveries.set(id, updated); return updated; }

  async listNeeds(scope: any) { return this.scoped(this.needs, scope); }
  async getNeed(id: string, scope: any) { const item = this.needs.get(id); return item?.organization_id === scope.organization_id && item?.tenant_id === scope.tenant_id && !item?.archived_at ? item : null; }
  async createNeed(input: any) { const created = row({ ...input, need_id: input.need_id }); this.needs.set(created.need_id, created); return created; }
  async updateNeed(id: string, scope: any, input: any) { const current = await this.getNeed(id, scope); if (!current) return null; const updated = { ...current, ...input, updated_by_user_id: input.actor_id, status: input.status || current.status, archived_at: input.status === "CLOSED" ? "2026-01-02T00:00:00.000Z" : current.archived_at, version: current.version + 1 }; this.needs.set(id, updated); return updated; }

  async listOpportunities(scope: any) { return this.scoped(this.opportunities, scope); }
  async getOpportunity(id: string, scope: any) { const item = this.opportunities.get(id); return item?.organization_id === scope.organization_id && item?.tenant_id === scope.tenant_id && !item?.archived_at ? item : null; }
  async getOpportunityForUpdate(id: string, scope: any) { return this.getOpportunity(id, scope); }
  async createOpportunity(input: any) { const created = row({ ...input, opportunity_id: input.opportunity_id }); this.opportunities.set(created.opportunity_id, created); return created; }
  async updateOpportunity(id: string, scope: any, input: any) { if (input.stage !== undefined && input.stage !== null) throw new Error("DIRECT_STAGE_MUTATION_FORBIDDEN"); const current = await this.getOpportunity(id, scope); if (!current) return null; const updated = { ...current, ...input, updated_by_user_id: input.actor_id, status: input.status || current.status, archived_at: input.status === "ARCHIVED" ? "2026-01-03T00:00:00.000Z" : current.archived_at, version: current.version + 1 }; this.opportunities.set(id, updated); return updated; }
  async transitionOpportunityStage(id: string, scope: any, input: any) { const current = await this.getOpportunity(id, scope); if (!current) return null; const updated = { ...current, stage: input.stage, status: input.status || current.status, updated_by_user_id: input.actor_id, closed_at: input.status === "WON" || input.status === "LOST" || input.stage === "WON" || input.stage === "LOST" ? "2026-01-02T00:00:00.000Z" : current.closed_at, archived_at: input.status === "ARCHIVED" ? "2026-01-03T00:00:00.000Z" : current.archived_at, version: current.version + 1 }; this.opportunities.set(id, updated); return updated; }
}

function service(repo = new FakeRepo()) {
  const audits: any[] = [];
  return { repo, audits, service: new SalesService(repo as any, async (event: any) => { audits.push(event); return event; }) };
}

test("migration creates Sales-owned tables with canonical organization references and no demo seeds", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS sales_relationships/);
  assert.match(migration, /account_organization_id TEXT NOT NULL REFERENCES organizations\(organization_id\)/);
  assert.match(migration, /sales_opportunities_value_nonnegative/);
  assert.match(migration, /employer_incentive_assessment_ids JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.doesNotMatch(migration, /Northstar|Atlas|BridgePoint|Summit|Cedar|INSERT INTO sales_/);
});

test("routes are internal and permission gated", () => {
  assert.match(routes, /requirePermission\("sales\.read"\)/);
  assert.match(routes, /requirePermission\("sales\.write"\)/);
  assert.match(router, /registerSalesRoutes\(app\)/);
});

test("create relationship with valid canonical organization emits audit", async () => {
  const ctx = service();
  const created = await ctx.service.createRelationship({ accountOrganizationId: "org_account_1", relationshipType: "BUYER" }, actorA);
  assert.equal(created.account_organization_id, "org_account_1");
  assert.equal(ctx.audits[0].action_type, "sales.relationship.created");
});

test("missing canonical organization is rejected and not created", async () => {
  const ctx = service();
  await assert.rejects(() => ctx.service.createRelationship({ accountOrganizationId: "org_missing" }, actorA), /Canonical account organization was not found/);
  assert.equal(ctx.repo.relationships.size, 0);
});

test("external canonical Organization requires explicit Organization authority permission", async () => {
  const ctx = service();
  const actorWithoutOrganizationPermission = { ...actorA, permissions: ["sales.write"] };
  await assert.rejects(
    () => ctx.service.createRelationship({ accountOrganizationId: "org_account_1" }, actorWithoutOrganizationPermission),
    (error: any) => error.code === "ORGANIZATION_REFERENCE_NOT_AUTHORIZED",
  );
  assert.equal(ctx.repo.relationships.size, 0);
});

test("Sales service rejects missing server-derived tenant context", async () => {
  const ctx = service();
  await assert.rejects(
    () => ctx.service.listRelationships({ user_id: "user_sales_a", active_organization_id: "org_sales_a", permissions: ["sales.read"] }),
    (error: any) => error.code === "AUTH_REQUIRED",
  );
});

test("tenant scoped relationship list and cross tenant access are blocked", async () => {
  const ctx = service();
  const created = await ctx.service.createRelationship({ accountOrganizationId: "org_account_1" }, actorA);
  assert.equal((await ctx.service.listRelationships(actorA)).length, 1);
  assert.equal(await ctx.service.getRelationship(created.relationship_id, actorB), null);
});

test("create discovery record linked to correct organization", async () => {
  const ctx = service();
  const rel = await ctx.service.createRelationship({ accountOrganizationId: "org_account_1" }, actorA);
  const discovery = await ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_1", relationshipId: rel.relationship_id, painPoints: ["manual intake"] }, actorA);
  assert.equal(discovery.account_organization_id, "org_account_1");
  assert.equal(discovery.relationship_id, rel.relationship_id);
});

test("create need and opportunity with validation and external incentive refs only", async () => {
  const ctx = service();
  const discovery = await ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_1" }, actorA);
  const need = await ctx.service.createNeed({ accountOrganizationId: "org_account_1", discoveryRecordId: discovery.discovery_record_id, title: "Reduce cycle time", priority: "HIGH" }, actorA);
  const opportunity = await ctx.service.createOpportunity({
    accountOrganizationId: "org_account_1",
    discoveryRecordId: discovery.discovery_record_id,
    primaryNeedIds: [need.need_id],
    employerIncentiveAssessmentIds: ["emp_incentive_assessment_1"],
    name: "Commercial rollout",
    estimatedValue: 12000,
  }, actorA);
  assert.deepEqual(opportunity.primary_need_ids, [need.need_id]);
  assert.deepEqual(opportunity.employer_incentive_assessment_ids, ["emp_incentive_assessment_1"]);
  assert.equal(opportunity.estimated_value, "12000.00");
});

test("estimatedValue validation rejects negative amounts", async () => {
  const ctx = service();
  await assert.rejects(() => ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", name: "Bad", estimatedValue: -1 }, actorA), /estimatedValue cannot be negative/);
});

test("opportunity stage update and close/archive behavior emits audit", async () => {
  const ctx = service();
  const opportunity = await ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", name: "Pipeline", estimatedValue: 50 }, actorA);
  await assert.rejects(
    () => ctx.service.updateOpportunity(opportunity.opportunity_id, { stage: "PROPOSAL" }, actorA),
    (error: any) => error.code === "INVALID_TRANSITION",
  );
  await assert.rejects(
    () => ctx.service.updateOpportunity(opportunity.opportunity_id, { status: "WON", stage: "WON" }, actorA),
    (error: any) => error.code === "INVALID_TRANSITION",
  );
});

test("cross-account relationship, discovery, and Need links are rejected", async () => {
  const ctx = service();
  const rel = await ctx.service.createRelationship({ accountOrganizationId: "org_account_1" }, actorA);
  await assert.rejects(
    () => ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_2", relationshipId: rel.relationship_id }, actorA),
    (error: any) => error.code === "CROSS_ACCOUNT_REFERENCE",
  );
  const discovery = await ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_2" }, actorA);
  await assert.rejects(
    () => ctx.service.createNeed({ accountOrganizationId: "org_account_1", discoveryRecordId: discovery.discovery_record_id, title: "Need" }, actorA),
    (error: any) => error.code === "CROSS_ACCOUNT_REFERENCE",
  );
});

test("Opportunity update cannot attach a Need from a different account", async () => {
  const ctx = service();
  const foreignNeed = await ctx.service.createNeed({ accountOrganizationId: "org_account_2", title: "Other account" }, actorA);
  const opportunity = await ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", name: "Account one" }, actorA);
  await assert.rejects(
    () => ctx.service.updateOpportunity(opportunity.opportunity_id, { primaryNeedIds: [foreignNeed.need_id] }, actorA),
    (error: any) => error.code === "CROSS_ACCOUNT_REFERENCE",
  );
});

test("protected server-derived fields cannot be mass assigned", async () => {
  const ctx = service();
  for (const field of [{ tenantId: "attacker-tenant" }, { activeOrganizationId: "attacker-org" }, { createdBy: "attacker" }, { version: 999 }, { archivedAt: "2026-01-01" }, { approvalStatus: "APPROVED" }, { verifiedState: "VERIFIED" }, { systemProvenance: "client" }]) {
    await assert.rejects(
      () => ctx.service.createRelationship({ accountOrganizationId: "org_account_1", ...field }, actorA),
      (error: any) => error.code === "SERVER_DERIVED_AUTHORITY",
    );
  }
  assert.equal(ctx.repo.relationships.size, 0);
});

test("generic opportunity persistence rejects direct stage mutation", async () => {
  const ctx = service();
  const opportunity = await ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", name: "Direct mutation guard" }, actorA);
  await assert.rejects(
    () => ctx.repo.updateOpportunity(opportunity.opportunity_id, { tenant_id: actorA.tenant_id, organization_id: actorA.active_organization_id }, { stage: "RELATIONSHIP", actor_id: actorA.user_id }),
    /DIRECT_STAGE_MUTATION_FORBIDDEN/,
  );
  assert.equal((await ctx.service.getOpportunity(opportunity.opportunity_id, actorA)).stage, "TARGET");
});

test("discovery archive is scoped and emits safe server audit", async () => {
  const ctx = service();
  const discovery = await ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_1", notes: "private notes" }, actorA);
  const archived = await ctx.service.archiveDiscoveryRecord(discovery.discovery_record_id, actorA);
  assert.ok(archived.archived_at);
  const event = ctx.audits.find((item) => item.action_type === "sales.discovery.archived");
  assert.equal(event.organization_id, actorA.active_organization_id);
  assert.equal(event.actor_user_id, actorA.user_id);
  assert.equal(event.target_object_id, discovery.discovery_record_id);
  assert.equal(JSON.stringify(event.new_state_json).includes("private notes"), false);
});

test("opportunity rejects cross-account relationship, discovery, and Need references", async () => {
  const ctx = service();
  const rel = await ctx.service.createRelationship({ accountOrganizationId: "org_account_2" }, actorA);
  const discovery = await ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_2" }, actorA);
  const need = await ctx.service.createNeed({ accountOrganizationId: "org_account_2", title: "Other account" }, actorA);
  for (const input of [
    { relationshipId: rel.relationship_id },
    { discoveryRecordId: discovery.discovery_record_id },
    { primaryNeedIds: [need.need_id] },
  ]) {
    await assert.rejects(
      () => ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", name: "Mismatch", ...input }, actorA),
      (error: any) => error.code === "CROSS_ACCOUNT_REFERENCE",
    );
  }
});

test("cross-tenant references are explicitly rejected and scoped reads conceal other records", async () => {
  const ctx = service();
  const foreign = row({ relationship_id: "same-looking-id", organization_id: actorB.organization_id, tenant_id: actorB.tenant_id, account_organization_id: "org_account_2" });
  ctx.repo.relationships.set("same-looking-id", foreign);
  await assert.rejects(
    () => ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_1", relationshipId: "same-looking-id" }, actorA),
    (error: any) => error.code === "REFERENCE_TENANT_MISMATCH",
  );
  assert.equal(await ctx.service.getRelationship("same-looking-id", actorA), null);
});

test("backend stage policy validates context and blocks disconnected Proposal and Contract authorities", async () => {
  const context = {
    relationshipStatus: "ACTIVE",
    discoveryStatus: "COMPLETE",
    hasActiveNeed: true,
    productAuthorityConnected: false,
    fundingReviewComplete: true,
    noFundingNeeded: false,
    proposalAuthorityConnected: false,
    contractAuthorityConnected: false,
  };
  assert.equal(evaluateSalesOpportunityStageTransition("TARGET", "RELATIONSHIP", context).code, "TRANSITION_ALLOWED");
  assert.equal(evaluateSalesOpportunityStageTransition("RELATIONSHIP", "DISCOVERY", context).code, "TRANSITION_ALLOWED");
  assert.equal(evaluateSalesOpportunityStageTransition("DISCOVERY", "SOLUTION", context).code, "TRANSITION_ALLOWED");
  assert.equal(evaluateSalesOpportunityStageTransition("SOLUTION", "FUNDING", context).warnings.length, 1);
  assert.equal(evaluateSalesOpportunityStageTransition("FUNDING", "PROPOSAL", context).code, "PROPOSAL_AUTHORITY_NOT_CONNECTED");
  assert.equal(evaluateSalesOpportunityStageTransition("PROPOSAL", "CONTRACT", context).code, "PROPOSAL_AUTHORITY_NOT_CONNECTED");
  assert.equal(evaluateSalesOpportunityStageTransition("CONTRACT", "WON", context).code, "CONTRACT_AUTHORITY_NOT_CONNECTED");
  assert.equal(evaluateSalesOpportunityStageTransition("TARGET", "SOLUTION", context).code, "INVALID_TRANSITION");
  assert.equal(evaluateSalesOpportunityStageTransition("RELATIONSHIP", "DISCOVERY", { ...context, relationshipStatus: null }).code, "MISSING_RELATIONSHIP");
  assert.equal(evaluateSalesOpportunityStageTransition("DISCOVERY", "SOLUTION", { ...context, discoveryStatus: "IN_PROGRESS" }).code, "DISCOVERY_INCOMPLETE");
  assert.equal(evaluateSalesOpportunityStageTransition("DISCOVERY", "SOLUTION", { ...context, hasActiveNeed: false }).code, "MISSING_ACTIVE_NEED");
});

test("valid sequential stage changes persist backend transition decisions and audit", async () => {
  const ctx = service();
  const relationship = await ctx.service.createRelationship({ accountOrganizationId: "org_account_1", relationshipStatus: "ACTIVE" }, actorA);
  const discovery = await ctx.service.createDiscoveryRecord({ accountOrganizationId: "org_account_1", relationshipId: relationship.relationship_id, discoveryStatus: "COMPLETE" }, actorA);
  const need = await ctx.service.createNeed({ accountOrganizationId: "org_account_1", discoveryRecordId: discovery.discovery_record_id, title: "Need" }, actorA);
  const opportunity = await ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", relationshipId: relationship.relationship_id, discoveryRecordId: discovery.discovery_record_id, primaryNeedIds: [need.need_id], name: "Valid progression" }, actorA);
  await ctx.service.updateOpportunity(opportunity.opportunity_id, { stage: "RELATIONSHIP" }, actorA);
  await ctx.service.updateOpportunity(opportunity.opportunity_id, { stage: "DISCOVERY" }, actorA);
  await ctx.service.updateOpportunity(opportunity.opportunity_id, { stage: "SOLUTION" }, actorA);
  const funding = await ctx.service.updateOpportunity(opportunity.opportunity_id, { stage: "FUNDING" }, actorA);
  assert.equal(funding.transition_decision.code, "TRANSITION_ALLOWED");
  assert.match(funding.transition_decision.warnings[0], /No product approval is implied/);
  await assert.rejects(() => ctx.service.updateOpportunity(opportunity.opportunity_id, { stage: "PROPOSAL" }, actorA), (error: any) => error.code === "FUNDING_REVIEW_REQUIRED");
  assert.ok(ctx.audits.some((event) => event.action_type === "sales.opportunity.stage_changed"));
});

test("terminal Opportunity status cannot be reopened", async () => {
  const ctx = service();
  const record = row({ opportunity_id: "won-terminal", stage: "WON", status: "WON", name: "Terminal" });
  ctx.repo.opportunities.set(record.opportunity_id, record);
  await assert.rejects(
    () => ctx.service.updateOpportunity(record.opportunity_id, { status: "OPEN" }, actorA),
    (error: any) => error.code === "INVALID_TRANSITION",
  );
});

test("cross tenant opportunity access is blocked and empty scope returns zero records", async () => {
  const ctx = service();
  const opportunity = await ctx.service.createOpportunity({ accountOrganizationId: "org_account_1", name: "Pipeline" }, actorA);
  assert.equal(await ctx.service.getOpportunity(opportunity.opportunity_id, actorB), null);
  assert.deepEqual(await ctx.service.listOpportunities(actorB), []);
});

test("SHF-Next production repository uses API, not localStorage, and unconfigured returns NOT_CONNECTED", () => {
  assert.match(shfNextRepo, /\/sales\/relationships/);
  assert.match(shfNextRepo, /\/sales\/opportunities/);
  assert.match(shfNextRepo, /if \(!config\.enabled\) return null/);
  assert.match(shfNextRepo, /connectionState: connected \? 'CONNECTED' : 'NOT_CONNECTED'/);
  assert.doesNotMatch(shfNextRepo, /localStorage|salesCommandData|Northstar|Atlas|BridgePoint|Summit|Cedar/);
});

test("SalesCommandSnapshot calculates durable opportunity KPIs with provenance", () => {
  assert.match(shfNextSnapshot, /openPipelineValue = openOpportunities\.reduce/);
  assert.match(shfNextSnapshot, /sourceRecordIds: openPipelineRecords\.map/);
  assert.match(shfNextSnapshot, /recordCount: openPipelineRecords\.length/);
});
