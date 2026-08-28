import assert from "node:assert/strict";
import test from "node:test";
import { createShsReportDraft, listShsReportRevisions } from "../src/shared/reporting/shsReportDraftClient.js";

function response(body, ok = true, status = ok ? 201 : 400) {
  return {
    ok,
    status,
    async text() { return JSON.stringify(body); },
  };
}

test("draft client posts only workflow fields and accepts server identity", async () => {
  let request;
  const report = { reportId: "report_server", version: 1, lifecycleStatus: "draft" };
  const created = await createShsReportDraft({
    reportType: "generic-shs-report",
    subjectName: "Synthetic Client",
    organization_id: "ignored-by-server",
    tenant_id: "ignored-by-server",
    actor_id: "ignored-by-server",
  }, {
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({ ok: true, data: report });
    },
  });

  assert.equal(created.reportId, "report_server");
  assert.equal(request.url, "/api/reporting/drafts");
  assert.equal(request.options.credentials, "include");
  assert.equal(JSON.parse(request.options.body).reportType, "generic-shs-report");
});

test("failed draft save rejects and cannot fabricate a saved record", async () => {
  await assert.rejects(
    () => createShsReportDraft({ reportType: "generic-shs-report" }, { fetchImpl: async () => response({ error: { message: "save failed" } }, false) }),
    /save failed/
  );
});

test("revision client reads scoped backend history without accepting a browser fallback", async () => {
  let request;
  const revisions = [{ revisionId: "revision_server", reportId: "report_server", version: 2 }];
  const result = await listShsReportRevisions("report/server", {
    fetchImpl: async (url, options) => {
      request = { url, options };
      return response({ ok: true, data: { items: revisions } }, true, 200);
    },
  });

  assert.deepEqual(result, revisions);
  assert.equal(request.url, "/api/reporting/drafts/report%2Fserver/revisions");
  assert.equal(request.options.credentials, "include");
  assert.equal(request.options.cache, "no-store");
});

test("failed revision retrieval rejects instead of returning fabricated history", async () => {
  await assert.rejects(
    () => listShsReportRevisions("report_server", { fetchImpl: async () => response({ error: { message: "history failed" } }, false, 503) }),
    /history failed/
  );
});
