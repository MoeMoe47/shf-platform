import assert from "node:assert/strict";
import test from "node:test";
import { LocalTestRegistryProvider } from "../src/domain/registry-submission/provider/registry-provider.ts";
import { registryStudentStatus } from "../src/domain/registry-submission/model/registry-submission-contract.ts";
import { RegistrySubmissionService } from "../src/domain/registry-submission/service/registry-submission-service.ts";
import { packageHash } from "../src/domain/agent-package/model/agent-package-contract.ts";

const actor = { user_id: "learner-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["agent.registry.submit", "agent.registry.view"] };
const packageJson = { provenance: { projectId: "project-a" }, definition: { name: "Helper", instructions: "Help safely.", tools: [] } };
const packageRow = { package_id: "package-a", organization_id: "org-a", tenant_id: "tenant:org-a", learner_id: "learner-a", project_id: "project-a", package_version: 1, package_hash: packageHash(packageJson), package_json: packageJson, validation_status: "VALID" };

test("local Registry adapter is explicitly test-only and deterministic", async () => {
  const provider = new LocalTestRegistryProvider();
  const input = { packageId: "package-a", packageVersion: 1, packageHash: "a".repeat(64), packageJson: {} };
  const first = await provider.submit(input);
  const second = await provider.submit(input);
  assert.equal(first.status, "ACCEPTED");
  assert.equal(first.registryReference, second.registryReference);
  assert.match(first.registryReference!, /^test-registry:/);
  assert.equal(registryStudentStatus("ACCEPTED"), "Accepted by Test Registry");
}
);

test("local Registry adapter exposes only process-injected status scenarios", async () => {
  for (const scenario of ["ACCEPTED", "SUBMITTED", "CHANGES_REQUIRED", "REJECTED"] as const) {
    const result = await new LocalTestRegistryProvider(scenario).submit({ packageId: "package-a", packageVersion: 1, packageHash: "a".repeat(64), packageJson: {} });
    assert.equal(result.status, scenario);
  }
  await assert.rejects(() => new LocalTestRegistryProvider("FAILED").submit({ packageId: "package-a", packageVersion: 1, packageHash: "a".repeat(64), packageJson: {} }), /provider unavailable/);
  const failOnce = new LocalTestRegistryProvider("FAILED_ONCE");
  await assert.rejects(() => failOnce.submit({ packageId: "package-a", packageVersion: 1, packageHash: "a".repeat(64), packageJson: {} }), /provider unavailable/);
  assert.equal((await failOnce.submit({ packageId: "package-a", packageVersion: 1, packageHash: "a".repeat(64), packageJson: {} })).status, "ACCEPTED");
});

test("foreign package scope fails closed before submission", async () => {
  const db = { query: async () => ({ rows: [] }) };
  const service = new RegistrySubmissionService(db.query as any, async (fn: any) => fn({ query: db.query }), { enqueue: async () => ({}) } as any);
  await assert.rejects(() => service.submit({ ...actor, user_id: "learner-b" }, "package-a"), /REGISTRY_PACKAGE_NOT_ELIGIBLE/);
});

test("provider failure is represented as a failed submission without rewriting the package", async () => {
  const rows: any[] = [];
  const events: any[] = [];
  const query = async (sql: string, params: any[] = []) => {
    if (sql.includes("FROM studio_agent_packages")) return { rows: [packageRow] };
    if (sql.includes("FROM agent_registry_submissions") && sql.includes("status NOT IN")) return { rows: [] };
    if (sql.includes("status='CHANGES_REQUIRED'")) return { rows: [] };
    if (sql.startsWith("INSERT INTO agent_registry_submissions")) { const row = { submission_id: params[0], organization_id: params[1], tenant_id: params[2], learner_id: params[3], project_id: params[4], package_id: params[5], package_version: params[6], package_hash: params[7], registry_provider: params[8], status: "SUBMITTED", package_json: packageRow.package_json }; rows.push(row); return { rows: [row] }; }
    if (sql.includes("UPDATE agent_registry_submissions SET status='FAILED'")) { rows[0].status = "FAILED"; rows[0].failure_code = params[1]; return { rows: [rows[0]] }; }
    if (sql.includes("SELECT pg_advisory")) return { rows: [] };
    if (sql.includes("SELECT * FROM agent_registry_submissions WHERE submission_id=$1 FOR UPDATE")) return { rows: [rows[0]] };
    throw new Error(`unexpected SQL: ${sql}`);
  };
  const provider = { key: "local_test_registry", submit: async () => { throw new Error("provider unavailable"); } };
  const service = new RegistrySubmissionService(query as any, async (fn: any) => fn({ query }), { enqueue: async (event: any) => events.push(event) } as any, provider as any);
  await assert.rejects(() => service.submit(actor, "package-a"), /REGISTRY_SUBMISSION_FAILED/);
  assert.equal(rows[0].status, "FAILED");
  assert.equal(events.at(-1).event_type, "registry.submission.failed");
  assert.equal(packageRow.validation_status, "VALID");
});
