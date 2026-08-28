import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync(new URL("../src/foundation/pages/Home.jsx", import.meta.url), "utf8");
const client = readFileSync(new URL("../src/shared/reporting/publicImpactReportingClient.js", import.meta.url), "utf8");

test("public Foundation surface uses only the canonical curriculum projection", () => {
  assert.match(home, /fetchPublicCurriculumLessonCompletions/);
  assert.match(client, /\/public\/impact\/curriculum-lesson-completions/);
  assert.match(home, /Verified Lesson Completions/);
  assert.doesNotMatch(home, /shfImpactData|localStorage|Oracle|Truth|Evidence|reduce\(|filter\(/i);
});

test("public projection preserves exact and suppressed representations and fails closed", () => {
  assert.match(client, /public_display_value !== "<10"/);
  assert.match(client, /displayValue: String\(item\.public_display_value\)/);
  assert.match(home, /value: "Unavailable"/);
  assert.match(client, /return safeProjection\(items\[0\]\)/);
});

test("the public field does not claim graduation, mastery, success, or impact", () => {
  const field = home.match(/<strong aria-live="polite">[\s\S]*?<\/div>\n\s*<\/div>/)?.[0] || "";
  assert.match(field, /Verified Lesson Completions/);
  assert.doesNotMatch(field, /Graduat|Mastery|Student Success|Workforce Readiness|Impact.*Completion/i);
});
