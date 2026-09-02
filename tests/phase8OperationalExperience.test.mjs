import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routes = readFileSync(new URL("../src/router/CurriculumRoutes.jsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/pages/curriculum/InstructorOperations.jsx", import.meta.url), "utf8");
const client = readFileSync(new URL("../src/shared/operations/operationsClient.js", import.meta.url), "utf8");
const coursePage = readFileSync(new URL("../src/pages/curriculum/StaffCourseWorkspace.jsx", import.meta.url), "utf8");
const attendancePage = readFileSync(new URL("../src/pages/curriculum/StaffAttendance.jsx", import.meta.url), "utf8");
const liveClient = readFileSync(new URL("../src/lib/liveLearning/api.js", import.meta.url), "utf8");

test("one curriculum operational workspace is routed for instructor and admin contexts", () => {
  assert.match(routes, /instructor\/operations/);
  assert.match(routes, /admin\/operations/);
  assert.match(page, /fetchOperationalOverview/);
  assert.doesNotMatch(page, /localStorage/);
});

test("operational UI keeps honest empty and failure states", () => {
  assert.match(page, /No learners enrolled/);
  assert.match(page, /No reviews awaiting action/);
  assert.match(page, /No live sessions scheduled/);
  assert.match(page, /NO_DATA/);
  assert.match(client, /cache: "no-store"/);
  assert.match(coursePage, /ops-tabs/);
  assert.match(coursePage, /fetchCurriculumLearningProgressReport/);
  assert.match(coursePage, /NO_DATA/);
});

test("operational UI links to canonical assignment and live-learning domains", () => {
  assert.match(page, /\/curriculum\/asl\/assignments/);
  assert.match(page, /\/curriculum\/live-sessions/);
});

test("staff attendance uses the canonical live-learning confirmation boundary", () => {
  assert.match(routes, /operations\/live\/:sessionId\/attendance/);
  assert.match(attendancePage, /listJoinEvents/);
  assert.match(attendancePage, /confirmAttendance\(role, joinEventId\)/);
  assert.match(liveClient, /confirm-attendance/);
});
