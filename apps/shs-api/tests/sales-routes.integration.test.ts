import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import test from "node:test";
import { SalesError } from "../src/domain/sales/service/sales-service.js";
import { registerSalesRoutes } from "../src/domain/sales/api/routes.js";

async function withApi(routeService: any, run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    const permission = req.header("x-test-permission");
    if (permission) {
      req.user = {
        user_id: "test-sales-user",
        active_organization_id: "test-sales-org",
        tenant_id: "tenant:test-sales-org",
        permissions: permission.split(","),
      };
    }
    next();
  });
  registerSalesRoutes(app, routeService);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("Sales HTTP routes enforce authentication and read/write permissions", async () => {
  const routeService = {
    listRelationships: async () => [],
    createRelationship: async (input: any, actor: any) => ({ relationship_id: "rel-test", account_organization_id: input.accountOrganizationId, created_by_user_id: actor.user_id }),
  };
  await withApi(routeService, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/sales/relationships`);
    assert.equal(unauthenticated.status, 401);

    const forbiddenRead = await fetch(`${baseUrl}/sales/relationships`, { headers: { "x-test-permission": "sales.write" } });
    assert.equal(forbiddenRead.status, 403);

    const forbiddenWrite = await fetch(`${baseUrl}/sales/relationships`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-permission": "sales.read" },
      body: JSON.stringify({ accountOrganizationId: "canonical-org" }),
    });
    assert.equal(forbiddenWrite.status, 403);

    const allowedRead = await fetch(`${baseUrl}/sales/relationships`, { headers: { "x-test-permission": "sales.read" } });
    assert.equal(allowedRead.status, 200);

    const allowedWrite = await fetch(`${baseUrl}/sales/relationships`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-permission": "sales.write" },
      body: JSON.stringify({ accountOrganizationId: "canonical-org" }),
    });
    assert.equal(allowedWrite.status, 201);
    const payload: any = await allowedWrite.json();
    assert.equal(payload.data.createdBy, "test-sales-user");
  });
});

test("Sales HTTP routes preserve structured backend stage-rejection codes", async () => {
  const routeService = {
    updateOpportunity: async () => { throw new SalesError("CONTRACT_AUTHORITY_NOT_CONNECTED", "Contract authority is not connected.", 409); },
  };
  await withApi(routeService, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/sales/opportunities/opp-test`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-test-permission": "sales.write" },
      body: JSON.stringify({ stage: "WON" }),
    });
    assert.equal(response.status, 409);
    const payload: any = await response.json();
    assert.equal(payload.error.code, "CONTRACT_AUTHORITY_NOT_CONNECTED");
  });
});
