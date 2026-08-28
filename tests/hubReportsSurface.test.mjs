import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/pages/hub/HubReports.jsx", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/shared/reporting/hubReferralReportingClient.js", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../src/router/AdminRoutes.jsx", import.meta.url), "utf8");

test("Hub Reports route and component contract are explicit", () => {
  assert.match(routes, /<Route path="\/hub\/reports" element=\{protect\("\/hub\/reports", <HubReports \/>\)\} \/>/);
  assert.match(source, /fetchHubReferralCreatedCountReport/);
  assert.match(source, /label="Hub Referrals Created"/);
});

test("only the exact created-referral KPI uses the canonical report", () => {
  assert.match(client, /report\.hub\.referral\.created_count\.v1/);
  assert.match(client, /hub\.referral\.created_count\.v1/);
  assert.equal(source.includes("truthSummary.createdReferralCount"), false);
  assert.equal(source.includes("createdReferralEvents"), false);
  assert.equal(source.includes("count(distinct"), false);
});

test("unsupported Hub Reports values are visibly noncanonical", () => {
  assert.match(source, /Canonical reporting field: Hub Referrals Created/);
  assert.match(source, /operational or demonstration-only/);
  assert.match(source, /Reporting unavailable/);
  assert.match(source, /label="Verified Outcomes"/);
  assert.match(source, /label="Audit Trace Coverage"/);
});

test("browser Truth remains only for noncanonical workflow and export behavior", () => {
  assert.match(source, /getTruthSpineSnapshot/);
  assert.match(source, /createReportingExport/);
  assert.match(source, /appendTruthSpineEvent/);
  assert.match(source, /Hub Workflow Readiness Bridge/);
});

test("remaining Hub Reports fields are explicitly bounded to demo or operational sources", () => {
  for (const label of [
    "Report Readiness",
    "Reports Ready",
    "Pending Reports",
    "Verified Outcomes",
    "Audit Trace Coverage",
    "Truth Records",
    "Backend Audit",
    "Backend Exports",
    "Workflow Ready",
    "Open Referrals",
    "Unassigned",
    "Aging",
    "Capacity Risk",
    "Outcome Snapshot",
    "Export History",
  ]) {
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));
  }

  assert.match(source, /HUB_REPORT_WORKFLOW_REFERRALS/);
  assert.match(source, /shs_hub_report_exports_v1/);
  assert.match(source, /function pct\(numerator, denominator\)/);
  assert.match(source, /function getTruthSpineReportSummary/);
  assert.match(source, /87%/);
  assert.match(source, /FY24 Q2/);
  assert.match(source, /Reporting unavailable/);
  assert.equal(source.includes("hub.referral.created_count.v1"), false);
});
