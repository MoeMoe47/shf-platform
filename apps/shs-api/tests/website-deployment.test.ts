import assert from "node:assert/strict";
import test from "node:test";
import { WebsiteDeploymentService } from "../src/domain/deployment/service/website-deployment-service.ts";

const actor = { user_id: "learner-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["website.deployment.create", "website.deployment.view"], roles: ["student"] };

function store(provider?: any) {
  let deployment: any = null;
  const events: any[] = [];
  const query = async (sql: string, params: any[] = []) => {
    if (sql.includes("FROM studio_delivery_records")) return { rows: [{ delivery_record_id: "delivery-a", project_id: "project-a", organization_id: "org-a", tenant_id: "tenant:org-a", learner_id: "learner-a", studio_destination: "STUDENT", status: "FINALIZED", project_type: "WEBSITE", destination: "STUDENT", workspace_revision: 3, work_json: { pages: [{ path: "/", title: "Home", content: "hello" }] } }] };
    if (sql.includes("FROM website_deployment_records")) return { rows: deployment ? [deployment] : [] };
    if (sql.startsWith("INSERT INTO website_deployment_records")) {
      deployment = { deployment_id: params[0], organization_id: params[1], tenant_id: params[2], learner_id: params[3], project_id: params[4], delivery_record_id: params[5], workspace_revision: params[6], project_type: "WEBSITE", provider_key: params[7], target: "TEST", status: "REQUESTED", package_hash: params[8] };
      return { rows: [deployment] };
    }
    if (sql.startsWith("UPDATE website_deployment_records SET status='DEPLOYING'")) { deployment.status = "DEPLOYING"; return { rows: [deployment] }; }
    if (sql.startsWith("UPDATE website_deployment_records SET status='LIVE'")) { deployment.status = "LIVE"; deployment.provider_deployment_id = params[1]; deployment.deployed_at = "now"; return { rows: [deployment] }; }
    if (sql.startsWith("UPDATE website_deployment_records SET status='FAILED'")) { deployment.status = "FAILED"; return { rows: [deployment] }; }
    throw new Error(`unexpected SQL: ${sql}`);
  };
  return { query, events, get: () => deployment, provider };
}

test("deployment service derives exact Website delivery provenance and is idempotent", async () => {
  const db = store();
  const service = new WebsiteDeploymentService(db.query as any, async (fn: any) => fn({ query: db.query }), { enqueue: async (event: any) => db.events.push(event) } as any);
  const first = await service.requestFromStudioDelivery(actor, { deliveryId: "delivery-a" });
  const second = await service.requestFromStudioDelivery(actor, { deliveryId: "delivery-a" });
  assert.equal(first.deployment.projectType, "WEBSITE");
  assert.equal(first.deployment.workspaceRevision, 3);
  assert.equal(first.deployment.target, "TEST");
  assert.equal(second.idempotent, true);
  assert.equal(db.events.filter((e) => e.event_type === "deployment.live").length, 1);
});

test("deployment service rejects authority fields before persistence", async () => {
  const service = new WebsiteDeploymentService(undefined as any, async () => { throw new Error("must not persist"); });
  await assert.rejects(() => service.requestFromStudioDelivery(actor, { deliveryId: "delivery-a", projectType: "AI_AGENT", status: "LIVE", liveUrl: "https://evil" }), /DEPLOYMENT_FIELD_NOT_ALLOWED/);
});

test("provider failure records FAILED without changing the Studio source", async () => {
  const db = store();
  const provider = { deploy: async () => { throw new Error("provider unavailable"); } };
  const service = new WebsiteDeploymentService(db.query as any, async (fn: any) => fn({ query: db.query }), { enqueue: async (event: any) => db.events.push(event) } as any, provider);
  await assert.rejects(() => service.requestFromStudioDelivery(actor, { deliveryId: "delivery-a" }), /DEPLOYMENT_PROVIDER_FAILED/);
  assert.equal(db.get().status, "FAILED");
  assert.equal(db.events.some((e) => e.event_type === "deployment.live"), false);
});
