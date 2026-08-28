import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const routes = fs.readFileSync(new URL("../src/router/AdminRoutes.jsx", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../src/pages/admin/reports/ShsReportHistoryPage.jsx", import.meta.url), "utf8");
const table = fs.readFileSync(new URL("../src/pages/admin/reports/components/ShsReportHistoryTable.jsx", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/shared/reporting/shsReportDraftClient.js", import.meta.url), "utf8");
const legacyStore = fs.readFileSync(new URL("../src/data/shsReports/shsReportStorage.js", import.meta.url), "utf8");

test("SHS report history route and component contract are explicit", () => {
  assert.match(routes, /path="\/ops\/reports\/history"/);
  assert.match(routes, /<ShsReportHistoryPage \/>/);
  assert.match(page, /ShsReportHistoryTable/);
  assert.match(table, /shs-report-history-table/);
});

test("history displays backend draft records and canonical revisions", () => {
  assert.match(page, /listShsReportDrafts/);
  assert.match(client, /\/reporting\/drafts/);
  assert.match(page, /listShsReportRevisions/);
  assert.match(client, /revisions/);
  assert.doesNotMatch(page, /shsReportStorage/);
  assert.doesNotMatch(table, /createReportVersion|shsReportStorage/);
  assert.match(table, /revisionsByReport/);
});

test("legacy version storage remains outside the canonical history surface", () => {
  assert.match(legacyStore, /SHS_REPORT_HISTORY_KEY/);
  assert.match(legacyStore, /createReportVersion/);
  assert.doesNotMatch(table, /duplicate as new version/);
  assert.doesNotMatch(table, /Truth|Evidence|metric|Reporting Service/);
});
