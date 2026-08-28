import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../src/pages/admin/GrantBinder.jsx", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/shared/reporting/grantBinderClient.js", import.meta.url), "utf8");
const route = fs.readFileSync(new URL("../src/router/AdminRoutes.jsx", import.meta.url), "utf8");

test("Grant Binder keeps browser logs operational while canonical workspace state is backend-owned", () => {
  assert.match(page, /from "@\/shared\/reporting\/grantBinderClient\.js"/);
  assert.match(page, /listGrantBinders\(\)/);
  assert.match(page, /createGrantBinder\(\)/);
  assert.match(page, /Canonical Grant Binder workspace unavailable/);
  assert.match(page, /buildUnifiedLogSummary/);
  assert.match(page, /shf\.adminToolLogs|logAggregator/);
  assert.equal(page.includes("localStorage.setItem"), false);
  assert.equal(page.includes("grant_binder.created"), false);
});

test("client uses authenticated backend routes and fails closed on invalid canonical data", () => {
  assert.match(client, /credentials: "include"/);
  assert.match(client, /\/grant-binders/);
  assert.match(client, /lifecycleStatus !== "draft"/);
  assert.match(client, /!Number\.isInteger\(Number\(data\.version\)\)/);
  assert.equal(client.includes("tenant_id"), false);
  assert.equal(client.includes("organization_id"), false);
  assert.equal(client.includes("created_at"), false);
  assert.equal(client.includes("created_by"), false);
});

test("route remains protected and legacy log storage remains outside canonical client", () => {
  assert.match(route, /<Route path="\/grant-binder" element=\{protect\("\/grant-binder", <GrantBinder \/>\)/);
  assert.equal(client.includes("shf.adminToolLogs.v1"), false);
  assert.equal(client.includes("shf.civicMissionLogs.v1"), false);
});
