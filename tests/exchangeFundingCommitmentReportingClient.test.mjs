import assert from "node:assert/strict";
import test from "node:test";

import { fetchExchangeFundingCommitmentCountReport } from "../src/shared/reporting/exchangeFundingCommitmentReportingClient.js";

const report = {
  report_id: "report.exchange.funding.commitment_count.v1",
  report_definition_id: "exchange.funding.commitment_count",
  report_definition_version: 1,
  metric_results: [{ metric_id: "exchange.funding.commitment_count.v1", value: 0 }],
};

function response(body, ok = true, status = 200) {
  return { ok, status, text: async () => JSON.stringify(body) };
}

test("Exchange client requests the canonical report without client scope overrides", async () => {
  let request;
  const result = await fetchExchangeFundingCommitmentCountReport({
    apiBase: "",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({ report });
    },
  });
  assert.equal(result.metric_results[0].value, 0);
  assert.equal(request.url, "/shf/reports/exchange.funding-commitment-count");
  assert.equal(request.options.credentials, "include");
  assert.equal(request.options.cache, "no-store");
  assert.doesNotMatch(request.url, /tenant|organization|org=/i);
});

test("Exchange client rejects unavailable reports without a fallback", async () => {
  await assert.rejects(
    fetchExchangeFundingCommitmentCountReport({ fetchImpl: async () => response({ detail: "Report request rejected" }, false, 422) }),
    /Report request rejected/,
  );
});

test("Exchange client rejects malformed reports and network failures", async () => {
  await assert.rejects(
    fetchExchangeFundingCommitmentCountReport({ fetchImpl: async () => response({ report: { metric_results: [{ value: 4 }] } }) }),
    /Canonical Exchange funding commitment report unavailable/,
  );
  await assert.rejects(
    fetchExchangeFundingCommitmentCountReport({ fetchImpl: async () => { throw new Error("network"); } }),
    /network/,
  );
});
