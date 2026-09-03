import assert from "node:assert/strict";
import test from "node:test";
import { PortfolioService } from "../src/domain/portfolio/service/portfolio-service.ts";

const actor = {
  user_id: "learner-a",
  active_organization_id: "org-a",
  organization_id: "org-a",
  tenant_id: "tenant:org-a",
  permissions: ["studio.project.view", "studio.project.update"],
  roles: ["student"],
};

function fakeStore() {
  let profile: any = null;
  let artifact: any = null;
  const events: any[] = [];
  const source = {
    evidence_id: "evidence-a", source_type: "STUDIO_DELIVERY", evidence_status: "REVIEWABLE",
    learner_id: "learner-a", organization_id: "org-a", tenant_id: "tenant:org-a",
    studio_delivery_id: "delivery-a", studio_project_id: "project-a", workspace_revision: 4,
    project_type: "WEBSITE", destination: "STUDENT", studio_learner_id: "learner-a",
    studio_destination: "STUDENT", finalized_at: "2026-09-02T00:00:00.000Z",
    assignment_id: null, curriculum_release_id: null, competency_id: null,
  };
  const execute = async (sql: string, params: any[] = []) => {
    if (sql.includes("FROM prepare_prove_evidence")) return { rows: [source] };
    if (sql.includes("FROM portfolio_profiles")) return { rows: profile ? [profile] : [] };
    if (sql.includes("INSERT INTO portfolio_profiles")) {
      if (!profile) profile = { portfolio_id: params[0], organization_id: params[1], tenant_id: params[2], learner_id: params[3], status: "ACTIVE", created_at: "now", updated_at: "now" };
      return { rows: [profile] };
    }
    if (sql.includes("FROM portfolio_artifacts")) return { rows: artifact ? [artifact] : [] };
    if (sql.includes("INSERT INTO portfolio_artifacts")) {
      artifact = {
        artifact_id: params[0], portfolio_id: params[1], organization_id: params[2], tenant_id: params[3], learner_id: params[4],
        source_type: params[5], evidence_id: params[6], studio_project_id: params[7], studio_delivery_id: params[8], workspace_revision: params[9],
        project_type: params[10], assignment_id: params[11], curriculum_release_id: params[12], competency_ids: params[13] ? JSON.parse(params[13]) : [], finalized_at: params[14],
        display_title: params[15], summary: params[16], reflection: params[17], thumbnail_reference: params[18], collection_key: params[19], position: params[20], visibility: params[21], status: "ACTIVE", created_at: "now", updated_at: "now",
      };
      return { rows: [artifact] };
    }
    throw new Error(`unexpected SQL: ${sql}`);
  };
  return { execute, events, state: () => ({ profile, artifact }) };
}

test("Portfolio backend creates one scoped profile/artifact and retries idempotently", async () => {
  const store = fakeStore();
  const service = new PortfolioService(
    store.execute as any,
    async (fn: any) => fn({ query: store.execute }),
    { enqueue: async (event: any) => { store.events.push(event); } } as any,
  );
  const first = await service.createFromEvidence(actor, { evidenceId: "evidence-a", title: "My website" });
  const second = await service.createFromEvidence(actor, { evidenceId: "evidence-a", title: "ignored on retry" });
  assert.equal(first.idempotent, false);
  assert.equal(second.idempotent, true);
  assert.equal(first.artifact.artifactId, second.artifact.artifactId);
  assert.equal(store.events.length, 2);
  assert.equal(store.state().profile.learner_id, "learner-a");
  assert.equal(store.state().artifact.workspace_revision, 4);
});

test("Portfolio backend rejects authority fields before persistence", async () => {
  const service = new PortfolioService(undefined as any, async () => { throw new Error("persistence must not run"); });
  await assert.rejects(() => service.createFromEvidence(actor, {
    evidenceId: "evidence-a", learnerId: "learner-b", organizationId: "org-b", tenantId: "tenant:org-b",
    projectId: "foreign-project", deliveryId: "foreign-delivery", revisionId: "99", verified: true,
  }), /PORTFOLIO_FIELD_NOT_ALLOWED/);
});

test("Portfolio backend rejects invalid organization/tenant context", async () => {
  const service = new PortfolioService();
  await assert.rejects(() => service.getPortfolio({ ...actor, tenant_id: "tenant:org-b" }), /scope must agree/);
});

test("Portfolio backend rejects executable thumbnail schemes", async () => {
  const store = fakeStore();
  const service = new PortfolioService(
    store.execute as any,
    async (fn: any) => fn({ query: store.execute }),
    { enqueue: async () => undefined } as any,
  );
  await assert.rejects(() => service.createFromEvidence(actor, { evidenceId: "evidence-a", thumbnailRef: "javascript:alert(1)" }), /PORTFOLIO_THUMBNAIL_REFERENCE_UNSAFE/);
});
