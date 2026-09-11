import { test } from "node:test";
import assert from "node:assert/strict";
import { StudioReleaseService } from "../src/domain/deployment/service/studio-release-service.ts";

const actor = { user_id: "builder-a", active_organization_id: "org-a", organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["website.deployment.create", "website.deployment.view"] };
const approved = { delivery_record_id: "delivery-a", project_id: "project-a", organization_id: "org-a", tenant_id: "tenant:org-a", artifact_id: "artifact-a", submission_id: "review-a", qa_run_id: "qa-a", content_hash: "a".repeat(64), qa_status: "PASSED", review_status: "APPROVED" };

function harness(options: { gate?: boolean; status?: string; attempts?: any[] } = {}) {
  const rows = options.attempts || [];
  let releaseStatus = options.status || "AUTHORIZED";
  const db = { async query(sql: string, params: any[] = []) {
    if (sql.includes("JOIN studio_build_artifacts")) return { rows: options.gate === false || params[1] === "org-b" ? [] : [approved] };
    if (sql.includes("FROM studio_release_requests") && sql.includes("idempotency_key")) return { rows: [] };
    if (sql.includes("UPDATE studio_release_requests SET status='RELEASING'")) { releaseStatus = "RELEASING"; return { rows: [] }; }
    if (sql.includes("UPDATE studio_release_requests SET status='RELEASED'")) { releaseStatus = "RELEASED"; return { rows: [] }; }
    if (sql.includes("FROM studio_release_requests") && sql.includes("release_id=$1")) return { rows: params[1] === "org-b" ? [] : [{ ...approved, release_id: "release-a", target: "TEST", provider_key: "local_mock", status: releaseStatus, gate_decision: "ALLOW", gate_codes: [], requested_by_user_id: "builder-a" }] };
    if (sql.includes("MAX(attempt_number)")) return { rows: [{ next: rows.length + 1 }] };
    if (sql.includes("FROM studio_release_attempts")) return { rows };
    if (sql.includes("INSERT INTO studio_release_requests")) return { rows: [{ ...approved, release_id: "release-a", target: "TEST", provider_key: "local_mock", status: "AUTHORIZED", gate_decision: "ALLOW", gate_codes: [], requested_by_user_id: "builder-a" }] };
    return { rows: [] };
  } };
  const tx = async (fn: any) => fn(db);
  let calls = 0;
  const deployment = { async requestFromStudioDelivery() { calls += 1; return { deployment: { providerDeploymentId: "provider-a" } }; } };
  return { service: new StudioReleaseService(db.query.bind(db) as any, tx as any, deployment as any), get calls() { return calls; } };
}

test("release gate requires exact approved artifact lineage", async () => {
  await assert.rejects(() => harness({ gate: false }).service.create(actor, { deliveryId: "delivery-a", idempotencyKey: "request-a" }), /RELEASE_GATE_DENIED/);
});

test("release request and execution are durable and replay-safe", async () => {
  const h = harness();
  const created = await h.service.create(actor, { deliveryId: "delivery-a", idempotencyKey: "request-a" });
  assert.equal(created.release.releaseId, "release-a");
  const executed = await h.service.execute(actor, "release-a");
  assert.equal(executed.release.status, "RELEASED");
  assert.equal(h.calls, 1);
});

test("release execution requires organization scope", async () => {
  await assert.rejects(() => harness().service.execute({ ...actor, organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }, "release-a"), /RELEASE_NOT_FOUND/);
});
