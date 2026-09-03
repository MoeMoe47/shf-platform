import assert from "node:assert/strict";
import test from "node:test";
import { AgentPackageService } from "../src/domain/agent-package/service/agent-package-service.ts";

const actor = { user_id: "learner-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["agent.package.create", "agent.package.view"], roles: ["student"] };
function fakeDb() {
  const rows: any[] = [];
  const events: any[] = [];
  const query = async (sql: string, params: any[] = []) => {
    if (sql.includes("FROM projects p JOIN studio_delivery_records")) return { rows: [{ project_id: "project-a", learner_id: "learner-a", organization_id: "org-a", tenant_id: "tenant:org-a", project_type: "AI_AGENT", delivery_record_id: "delivery-a", workspace_revision: 3, finalized_at: "2026-09-02T00:00:00.000Z", work_json: { name: "Helper", instructions: "Help safely.", tools: [] } }] };
    if (sql.includes("FROM studio_agent_packages")) return { rows: rows.filter((r) => r.project_id === params[2] || r.package_id === params[0]) };
    if (sql.startsWith("INSERT INTO studio_agent_packages")) { const row = { package_id: params[0], organization_id: params[1], tenant_id: params[2], learner_id: params[3], project_id: params[4], delivery_record_id: params[5], workspace_revision: params[6], project_type: "AI_AGENT", package_version: params[7], standard_version: params[8], schema_version: params[9], package_json: JSON.parse(params[10]), package_hash: params[11], validation_status: params[12], validation_results: JSON.parse(params[13]) }; rows.push(row); return { rows: [row] }; }
    throw new Error(`unexpected SQL ${sql}`);
  };
  return { query, events, rows };
}
test("generates an exact immutable package and returns it idempotently", async () => {
  const db = fakeDb();
  const service = new AgentPackageService(db.query as any, async (fn: any) => fn({ query: db.query }), { enqueue: async (event: any) => db.events.push(event) } as any);
  const first = await service.generate(actor, "project-a");
  const second = await service.generate(actor, "project-a");
  assert.equal(first.package.projectType, "AI_AGENT");
  assert.equal(first.package.workspaceRevision, 3);
  assert.equal(first.package.registryReadiness, "READY_FOR_REGISTRY");
  assert.equal(second.idempotent, true);
  assert.equal(db.rows.length, 1);
  assert.equal(db.events.length, 2);
});
test("rejects injected authority fields before any persistence", async () => {
  const service = new AgentPackageService(undefined as any, async () => { throw new Error("must not persist"); });
  await assert.rejects(() => service.generate(actor, "project-a"), /must not persist/);
});
