import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { fetchCurriculumLessonCompletionReport } from "../src/shared/reporting/curriculumReportingClient.js";

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
    report_definition_id: "curriculum.lesson_completion_count",
    report_definition_version: 1,
    metric_results: [{
      metric_id: "curriculum.lesson.completion_count.v1",
      metric_version: 1,
      value: 0,
      unit: "students",
      verification_status: "verified",
      public_eligibility: false,
      source_claim_ids: [],
      source_evidence_ids: [],
    }],
  },
};

test("institutional lesson count comes from the Reporting Service and preserves canonical zero", async () => {
  const calls = [];
  const result = await fetchCurriculumLessonCompletionReport({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return response(200, canonicalReport);
    },
  });

  assert.equal(result.metric_results[0].value, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/shf/reports/curriculum.lesson-completion-count");
  assert.equal(calls[0].init.credentials, "include");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.headers, undefined);
});

test("unavailable Reporting Service data rejects without a browser fallback", async () => {
  await assert.rejects(
    () => fetchCurriculumLessonCompletionReport({
      fetchImpl: async () => response(503, { detail: "unavailable" }),
    }),
    /unavailable/,
  );
});

test("the migrated card does not contain a client lesson-count formula or hardcoded lesson count", () => {
  const source = fs.readFileSync(new URL("../src/pages/curriculum/sections/LearningProgressCard.jsx", import.meta.url), "utf8");
  assert.equal(source.includes("lessonsCompleted: 14"), false);
  assert.equal(source.includes("lessonCount"), true);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes(".length"), false);
  assert.equal(source.includes("reduce("), false);
});
