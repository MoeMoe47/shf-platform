import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboard = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumDashboard.jsx", import.meta.url), "utf8");
const calendar = fs.readFileSync(new URL("../src/pages/curriculum/sections/CurriculumCalendar.jsx", import.meta.url), "utf8");
const calendarPage = fs.readFileSync(new URL("../src/pages/curriculum/CurriculumCalendar.jsx", import.meta.url), "utf8");
const assignments = fs.readFileSync(new URL("../src/pages/Assignments.jsx", import.meta.url), "utf8");

test("CurriculumCalendar is mounted on the curriculum dashboard", () => {
  assert.match(dashboard, /CurriculumCalendar/);
  assert.match(calendar, /className="ld-card ld-cardCalendar"/);
});

test("calendar uses the existing server-backed live-learning source", () => {
  assert.match(calendarPage, /listLiveSessions\(role\)/);
  assert.match(calendarPage, /createCalendarEvent/);
  assert.match(calendarPage, /type: "instructor"/);
  assert.match(calendarPage, /source: "curriculum-live-learning"/);
  assert.doesNotMatch(calendarPage, /MOCK_EVENT_DAYS|localStorage|sessionStorage/);
});

test("dashboard widget links to the full calendar without fake event markers", () => {
  assert.match(calendar, /Open calendar/);
  assert.match(calendar, /\/curriculum\/asl\/calendar/);
  assert.doesNotMatch(calendar, /MOCK_EVENT_DAYS|eventDays\.includes/);
  assert.match(assignments, /Placeholder data/);
});

test("Curriculum reuses Career calendar interaction primitives", () => {
  for (const primitive of ["CalendarMonthView", "CalendarWeekView", "CalendarAgendaView", "CalendarFilters", "CalendarEventDetail", "CalendarUpcomingRail"]) {
    assert.match(calendarPage, new RegExp(`import ${primitive}`));
  }
  assert.match(calendarPage, /Calendar view/);
  assert.match(calendarPage, /Try again/);
  assert.match(calendarPage, /No sessions match your filters/);
});
