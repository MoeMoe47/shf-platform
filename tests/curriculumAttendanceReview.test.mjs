import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");
const weeklyCard = fs.readFileSync(new URL("../src/pages/curriculum/sections/WeeklySummaryCard.jsx", import.meta.url), "utf8");
const registry = JSON.parse(fs.readFileSync(new URL("../docs/SHF_REPORTING_SURFACE_REGISTRY.v1.json", import.meta.url), "utf8"));

test("Attendance is rendered by WeeklySummaryCard on the curriculum dashboard", () => {
  assert.match(dashboard, /WeeklySummaryCard/);
  assert.match(weeklyCard, /Attendance/);
});

test("Attendance is a mock value with no authoritative formula or population", () => {
  assert.match(weeklyCard, /readMock\("__mockAttendancePct", 86\)/);
  assert.equal(weeklyCard.includes("attendanceNumerator"), false);
  assert.equal(weeklyCard.includes("attendanceDenominator"), false);
  assert.equal(weeklyCard.includes("attendance\.recorded"), false);
  assert.equal(weeklyCard.includes("curriculum.lesson.completion_count.v1"), false);
  assert.equal(registry.surfaces.find((item) => item.surface_id === "surface.attendance").producer_status, "missing");
});

test("Attendance has no backend producer or canonical lineage in this dashboard path", () => {
  assert.doesNotMatch(weeklyCard, /fetch\(/);
  assert.doesNotMatch(weeklyCard, /attendance_id|session_id|enrollment_id|tenant_id|organization_id/);
  assert.match(weeklyCard, /window\[key\]/);
});
