import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const routes = fs.readFileSync(new URL("../src/router/AdminRoutes.jsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../src/pages/admin/reports/ShsCreateReportPage.jsx", import.meta.url), "utf8");
const storage = fs.readFileSync(new URL("../src/data/shsReports/shsReportStorage.js", import.meta.url), "utf8");
const apiRoutes = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/routes.ts", import.meta.url), "utf8");
const draftService = fs.readFileSync(new URL("../apps/shs-api/src/domain/reporting/report-draft-service.ts", import.meta.url), "utf8");
const trustedOutbox = fs.readFileSync(new URL("../apps/shs-api/src/domain/trusted-reporting/outbox.ts", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/shared/reporting/shsReportDraftClient.js", import.meta.url), "utf8");

test("SHS Create route and component contract are explicit", () => {
  assert.match(routes, /<Route path="\/ops\/reports\/create" element=\{protect\("\/ops\/reports\/create", <ShsCreateReportPage \/>, \[SHS_SECURITY_PERMISSIONS\.REPORTS_PREVIEW\]\)\} \/>/);
  assert.match(page, /Generate Draft Report/);
  assert.match(page, /createShsReportDraft/);
});

test("SHS Create uses backend authority while legacy storage remains outside this caller", () => {
  assert.match(page, /from "@\/shared\/reporting\/shsReportDraftClient"/);
  assert.equal(page.includes("shsReportStorage"), false);
  assert.equal(page.includes("localStorage"), false);
  assert.match(storage, /localStorage/);
  assert.match(storage, /Date\.now\(\)/);
  assert.match(storage, /new Date\(\)\.toISOString\(\)/);
  assert.match(client, /credentials: "include"/);
  assert.match(client, /\/reporting\/drafts/);
});

test("the backend reporting boundary owns the draft workflow without Trusted Reporting", () => {
  assert.match(apiRoutes, /\/reporting\/exports/);
  assert.match(apiRoutes, /\/reporting\/drafts/);
  assert.equal(apiRoutes.includes("Truth"), false);
  assert.equal(apiRoutes.includes("Metric Registry"), false);
});

test("report.created authority is backend-only and browser code cannot emit it", () => {
  assert.match(draftService, /buildReportCreatedOutboxEvent/);
  assert.match(draftService, /this\.outbox\.enqueue/);
  assert.equal(page.includes("report.created"), false);
  assert.equal(client.includes("report.created"), false);
  assert.match(trustedOutbox, /producer_id: "shs\.reporting"/);
  assert.match(trustedOutbox, /event_type: "report\.created"/);
});

test("SHS Create formulas are readiness presentation, not canonical institutional metrics", () => {
  assert.match(page, /evaluateReportReadiness/);
  assert.match(page, /buildDefaultReadiness/);
  assert.match(page, /ShsReportReadinessPanel/);
  assert.equal(page.includes("Reporting Service"), false);
  assert.equal(page.includes("Metric Registry"), false);
});
