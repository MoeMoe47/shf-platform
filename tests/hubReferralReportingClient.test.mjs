import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { fetchHubReferralCreatedCountReport } from "../src/shared/reporting/hubReferralReportingClient.js";

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

const canonicalReport = {
  ok: true,
  report: {
    report_id: "report.hub.referral.created_count.v1",
    report_definition_id: "hub.referral.created_count",
    report_definition_version: 1,
    metric_results: [{
      metric_id: "hub.referral.created_count.v1",
      metric_version: 1,
      value: 0,
      unit: "referrals",
    }],
  },
};

test("Hub created-referral count uses the canonical report and preserves zero", async () => {
  const calls = [];
  const report = await fetchHubReferralCreatedCountReport({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return response(200, canonicalReport);
    },
  });

  assert.equal(report.metric_results[0].value, 0);
  assert.equal(calls[0].url, "/api/shf/reports/hub.referral-created-count");
  assert.equal(calls[0].init.credentials, "include");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.headers, undefined);
  assert.equal(calls[0].url.includes("tenant_id"), false);
  assert.equal(calls[0].url.includes("organization_id"), false);
});

test("invalid report or metric payloads fail closed", async () => {
  await assert.rejects(
    () => fetchHubReferralCreatedCountReport({
      fetchImpl: async () => response(200, {
        report: {
          report_id: "report.other.v1",
          report_definition_id: "hub.referral.created_count",
          report_definition_version: 1,
          metric_results: [{ metric_id: "hub.referral.created_count.v1", value: 1 }],
        },
      }),
    }),
    /Canonical Hub referral report unavailable/,
  );

  await assert.rejects(
    () => fetchHubReferralCreatedCountReport({
      fetchImpl: async () => response(200, {
        report: {
          report_id: "report.hub.referral.created_count.v1",
          report_definition_id: "hub.referral.created_count",
          report_definition_version: 1,
          metric_results: [{ metric_id: "other.metric.v1", value: 1 }],
        },
      }),
    }),
    /Canonical Hub referral report unavailable/,
  );
});

test("unavailable report does not fall back to browser referral state", async () => {
  await assert.rejects(
    () => fetchHubReferralCreatedCountReport({
      fetchImpl: async () => response(503, { detail: "unavailable" }),
    }),
    /unavailable/,
  );

  const source = fs.readFileSync(new URL("../src/pages/hub/ReferralLifecycleView.jsx", import.meta.url), "utf8");
  assert.match(source, /fetchHubReferralCreatedCountReport/);
  assert.match(source, /Referrals Created/);
  assert.match(source, /Reporting unavailable/);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("value={loading ? \"…\" : counts.total}"), false);
  assert.equal(source.includes("completed \/ total"), false);
});
