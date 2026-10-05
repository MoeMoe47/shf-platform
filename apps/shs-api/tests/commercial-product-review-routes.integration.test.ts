import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import { registerCommercialProductReviewRoutes } from "../src/domain/commercial-product-registry/review/review-operations-routes.ts";

const read = "commercial_product.read";
const serviceCalls: any[] = [];
const queue = [
  { candidate_id: "cc-001", commercial_product_id: "cp_one", candidate_name: "Alpha", family: "CORE_EDUCATION", source_status: "SOURCE_UNRESOLVED", review_status: "REVIEW_PENDING", remaining_required_gates: ["LEGAL"], blocking_gates: [], stale_gates: [], production_onboarding_eligibility: false },
  { candidate_id: "cc-002", commercial_product_id: "cp_two", candidate_name: "Beta", family: "DATA_CENTER", source_status: "SOURCE_RESOLVED", review_status: "REVIEW_PARTIALLY_RESOLVED", remaining_required_gates: [], blocking_gates: ["PRICING"], stale_gates: [], production_onboarding_eligibility: false },
];

const service: any = {
  async listQueue(actor: any) { serviceCalls.push(["listQueue", actor]); return queue; },
  async getPacket(candidateId: string, actor: any) { serviceCalls.push(["getPacket", candidateId, actor]); if (candidateId !== "cc-001") throw Object.assign(new Error("not found"), { code: "REVIEW_PACKET_NOT_FOUND", statusCode: 404 }); return { packet: { candidate_id: candidateId, current_readiness: "YELLOW", current_sellability: "PILOT" }, latest_decisions: [], latest_source_resolution: null, reassessment: { production_onboarding_eligibility: false } }; },
  async listDecisionHistoryPage(candidateId: string, actor: any, options: any) { serviceCalls.push(["listDecisionHistoryPage", candidateId, actor, options]); return { items: [], total: 0 }; },
  async listSourceResolutionHistoryPage(candidateId: string, actor: any, options: any) { serviceCalls.push(["listSourceResolutionHistoryPage", candidateId, actor, options]); return { items: [], total: 0 }; },
  async reassess(candidateId: string, actor: any) { serviceCalls.push(["reassess", candidateId, actor]); return { source_status: "SOURCE_UNRESOLVED", review_status: "REVIEW_PENDING", production_onboarding_eligibility: false }; },
  async recordDecision(input: any, actor: any) { serviceCalls.push(["recordDecision", input, actor]); return { review_decision_id: "decision-test", ...input, reviewer_actor_id: actor.user_id, reviewer_org_id: actor.active_organization_id }; },
  async recordSourceResolution(input: any, actor: any) { serviceCalls.push(["recordSourceResolution", input, actor]); return { source_resolution_id: "source-test", ...input, resolved_by_actor: actor.user_id, resolved_by_org: actor.active_organization_id }; },
};

async function withApi(run: (base: string) => Promise<void>) {
  serviceCalls.length = 0;
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    const permissions = req.header("x-test-permission");
    if (permissions) req.user = { user_id: "human-reviewer", active_organization_id: "org-review", tenant_id: "tenant-org-review", permissions: permissions.split(",") };
    next();
  });
  registerCommercialProductReviewRoutes(app, service);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.close(); await once(server, "close"); }
}

function request(base: string, path: string, permissions?: string, init: any = {}) {
  return fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", ...(permissions ? { "x-test-permission": permissions } : {}), ...(init.headers || {}) } });
}

test("4D review reads require authenticated Product Registry read capability and bound queue/history queries", async () => {
  await withApi(async (base) => {
    assert.equal((await request(base, "/commercial-product-reviews")).status, 401);
    assert.equal((await request(base, "/commercial-product-reviews", "sales.admin")).status, 403);
    const queueResponse = await request(base, "/commercial-product-reviews?family=DATA_CENTER&blocked=true&page_size=1", read);
    assert.equal(queueResponse.status, 200);
    const payload: any = await queueResponse.json();
    assert.equal(payload.data.total, 1);
    assert.equal(payload.data.items[0].candidate_id, "cc-002");
    assert.equal((await request(base, "/commercial-product-reviews?family=FAKE", read)).status, 400);
    assert.equal((await request(base, "/commercial-product-reviews?page_size=101", read)).status, 400);
    assert.equal((await request(base, "/commercial-product-reviews?sort=sql", read)).status, 400);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/packet", read)).status, 200);
    assert.equal((await request(base, "/commercial-product-reviews/cc-404/packet", read)).status, 404);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/decisions?page=2&page_size=10", read)).status, 200);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/source-resolutions", read)).status, 200);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/reassessment", read)).status, 200);
    const pageCall = serviceCalls.find((call) => call[0] === "listDecisionHistoryPage");
    assert.deepEqual(pageCall[3], { gateType: undefined, limit: 10, offset: 10 });
  });
});

test("4D decision and source writes are gate-specific, context-derived, and never grant sales.admin authority", async () => {
  await withApi(async (base) => {
    const body = { gate_type: "LEGAL", decision_status: "PENDING", reviewed_at: "2026-10-05T12:00:00.000Z" };
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/decisions", undefined, { method: "POST", body: JSON.stringify(body) })).status, 401);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/decisions", "sales.admin", { method: "POST", body: JSON.stringify(body) })).status, 403);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/decisions", "commercial_product.review_regulatory", { method: "POST", body: JSON.stringify(body) })).status, 403);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/decisions", "commercial_product.review_legal", { method: "POST", body: JSON.stringify({ ...body, reviewer_actor_id: "spoof", readiness: "GREEN" }) })).status, 400);
    const legal = await request(base, "/commercial-product-reviews/cc-001/decisions", "commercial_product.review_legal", { method: "POST", body: JSON.stringify(body) });
    assert.equal(legal.status, 201);
    const decisionCall = serviceCalls.find((call) => call[0] === "recordDecision");
    assert.equal(decisionCall[1].candidateId, "cc-001");
    assert.equal(decisionCall[2].user_id, "human-reviewer");
    assert.equal(decisionCall[2].active_organization_id, "org-review");
    assert.equal("reviewer_actor_id" in decisionCall[1], false);
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/source-resolutions", "commercial_product.review_source_authority", { method: "POST", body: JSON.stringify({ resolution_status: "UNRESOLVED", resolved_at: "2026-10-05T12:00:00.000Z" }) })).status, 201);
    const sourceCall = serviceCalls.find((call) => call[0] === "recordSourceResolution");
    assert.equal(sourceCall[1].candidateId, "cc-001");
    assert.equal(sourceCall[2].user_id, "human-reviewer");
    assert.equal((await request(base, "/commercial-product-reviews/cc-001/source-resolutions", "commercial_product.edit", { method: "POST", body: "{}" })).status, 403);
  });
});
