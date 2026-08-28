import assert from "node:assert/strict";
import test from "node:test";

import { fetchWorkforceEmploymentStartedVerifiedCountReport } from "../src/shared/reporting/workforceEmploymentReportingClient.js";

const report = {
  report_id: "report.workforce.employment.started_verified_count.v1",
  report_definition_id: "workforce.employment.started_verified_count",
  report_definition_version: 1,
  metric_results: [{ metric_id: "workforce.employment.started_verified_count.v1", value: 4 }],
};

function response(body, ok = true, status = 200) {
  return { ok, status, text: async () => JSON.stringify(body) };
}

test("workforce client requests only the canonical authenticated report", async () => {
  const calls = [];
  const result = await fetchWorkforceEmploymentStartedVerifiedCountReport({
    apiBase: "/api",
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return response({ report });
    },
  });
  assert.deepEqual(result, report);
  assert.equal(calls[0][0], "/api/shf/reports/workforce.employment-started-verified-count");
  assert.deepEqual(calls[0][1], { credentials: "include", cache: "no-store" });
});

test("workforce client accepts canonical zero and rejects unavailable or malformed data", async () => {
  const zero = { ...report, metric_results: [{ ...report.metric_results[0], value: 0 }] };
  const result = await fetchWorkforceEmploymentStartedVerifiedCountReport({ fetchImpl: async () => response({ report: zero }) });
  assert.equal(result.metric_results[0].value, 0);

  await assert.rejects(
    fetchWorkforceEmploymentStartedVerifiedCountReport({ fetchImpl: async () => response({ detail: "unavailable" }, false, 422) }),
    /unavailable/,
  );
  await assert.rejects(
    fetchWorkforceEmploymentStartedVerifiedCountReport({ fetchImpl: async () => response({ report: { ...report, metric_results: [] } }) }),
    /unavailable/,
  );
});

test("workforce client has no browser scope, storage, or aggregation fallback", async () => {
  const source = await (await import("node:fs/promises")).readFile(new URL("../src/shared/reporting/workforceEmploymentReportingClient.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|tenant|organization|reduce\(|filter\(|\.length/);
  assert.doesNotMatch(source, /Truth|Evidence/);
});
