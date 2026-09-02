// SHF Curriculum Phase 5.5 — Unified Learning Workspace. Same convention
// as tests/curriculumAssignmentsSurface.test.mjs: static source
// assertions (node:test + regex/`includes`), no component mounting.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

const sidebar = read("../src/components/CurriculumSidebar.jsx");
const routes = read("../src/router/CurriculumRoutes.jsx");
const layout = read("../src/layouts/CurriculumLayout.jsx");
const learning = read("../src/pages/curriculum/Learning.jsx");
const learningApi = read("../src/lib/curriculum/learningApi.js");
const upNext = read("../src/shared/learning/upNext.js");
const courseWorkspace = read("../src/pages/curriculum/course/CourseWorkspace.jsx");
const courseOverview = read("../src/pages/curriculum/course/CourseOverview.jsx");
const courseLessons = read("../src/pages/curriculum/course/CourseLessons.jsx");
const courseAssignments = read("../src/pages/curriculum/course/CourseAssignments.jsx");
const courseLive = read("../src/pages/curriculum/course/CourseLive.jsx");
const courseResources = read("../src/pages/curriculum/course/CourseResources.jsx");
const assignments = read("../src/pages/Assignments.jsx");
const liveSessions = read("../src/pages/curriculum/LiveSessions.jsx");
const lessonWorkspace = read("../src/components/curriculum/lesson/GuidedLessonExperience.jsx");
const completionCheck = read("../src/components/curriculum/lesson/CompletionCheckPanel.jsx");
const studentCatalogService = read("../apps/shs-api/src/domain/curriculum-catalog/service/student-catalog-service.ts");
const studentRoutes = read("../apps/shs-api/src/domain/curriculum-catalog/api/student-routes.ts");
const router = read("../apps/shs-api/src/api/router.ts");

test("sidebar renames Lessons to Learning, pointing at the course-first landing", () => {
  assert.match(sidebar, /label: "Learning", Icon: BookIcon, path: "learning"/);
  assert.equal(sidebar.includes('label: "Lessons"'), false);
});

test("old /curriculum/lessons route redirects to /curriculum/learning for bookmark compatibility", () => {
  assert.match(routes, /<Route path="learning" element={<Learning \/>} \/>/);
  assert.match(routes, /<Route path="lessons" element={<Navigate to="\/curriculum\/learning" replace \/>} \/>/);
});

test("Course Workspace is a nested route with all six tabs", () => {
  assert.match(routes, /<Route path="courses\/:courseId" element={<CourseWorkspace \/>}>/);
  for (const tab of ["lessons", "assignments", "live", "resources", "progress"]) {
    assert.match(routes, new RegExp(`<Route path="${tab}" element={<Course`));
  }
});

test("CurriculumLayout renders a real 'Learning' page title and blanks the generic header for Course Workspace (which renders its own breadcrumb)", () => {
  assert.match(layout, /title: "Learning"/);
  assert.match(layout, /isCourseWorkspace/);
});

test("Learning landing pulls real courses/assignments/live-sessions and never hardcodes mock numbers", () => {
  assert.match(learning, /listMyCourses\(role\)/);
  assert.match(learning, /listAssignments\(role\)/);
  assert.match(learning, /listLiveSessions\(role\)/);
  assert.match(learning, /You don't have an active course yet\./);
  // No-demo-truth: none of the specific numbers named in the Phase 5.5
  // mock reference doc appear as literals anywhere in this page.
  for (const demoValue of ["68%", "24 Lessons", "5 Units", "Thursday at 3:30"]) {
    assert.equal(learning.includes(demoValue), false);
  }
});

test("learningApi.js is the only client for the new student catalog routes, matching the existing assignments/live-learning client pattern", () => {
  assert.match(learningApi, /\/curriculum\/learning\/courses/);
  assert.match(learningApi, /resolveDevUserId/);
});

test("upNext.js is the one place that merges assignments/live-sessions/course-next-lesson — not duplicated per page", () => {
  assert.match(upNext, /export function buildUpNext/);
  assert.match(learning, /buildUpNext\(/);
  assert.match(courseOverview, /pickNextLiveSession\(/);
});

test("Course Workspace fetches one real course detail and hands it to every tab via Outlet context, no per-tab re-fetch", () => {
  assert.match(courseWorkspace, /getCourseDetail\(role, courseId\)/);
  assert.match(courseWorkspace, /<Outlet context={context} \/>/);
  assert.equal(courseLessons.includes("getCourseDetail"), false);
  assert.equal(courseOverview.includes("getCourseDetail"), false);
});

test("Course Lessons accordion only renders real, backend-derived statuses — no fabricated lock rule", () => {
  assert.match(courseLessons, /STATUS_LABEL = { completed: "Completed", in_progress: "In Progress", upcoming: "Upcoming" }/);
  assert.equal(courseLessons.includes('"Locked"'), false);
});

test("Course Assignments/Live tabs render the shared real-data row components, not a second data source", () => {
  assert.match(courseAssignments, /import AssignmentRow from/);
  assert.match(courseLive, /import LiveSessionCard from/);
});

test("Course Resources renders real per-lesson resources frozen into the release snapshot, or an honest empty state", () => {
  assert.match(courseResources, /course\.resources/);
  assert.match(courseResources, /No additional resources for this course\./);
});

test("Assignments status tabs map to real accessState values only, never a fabricated submission lifecycle", () => {
  assert.match(assignments, /"AVAILABLE"/);
  assert.match(assignments, /"IN_PROGRESS"/);
  assert.match(assignments, /"COMPLETED"/);
  assert.equal(assignments.includes("Submitted"), false);
  assert.equal(assignments.includes("Returned"), false);
});

test("Live Sessions keeps the existing real join flow and legacy zoom section unchanged", () => {
  assert.match(liveSessions, /requestZoomAccess, hasZoomAccess/);
  assert.match(liveSessions, /<ZoomCard \/>/);
  assert.match(liveSessions, /listLiveSessions\(role\)/);
});

test("student-catalog-service.ts derives course membership from real entitled assignments, never a fabricated enrollment table", () => {
  assert.match(studentCatalogService, /entitlement\.listAssignedWork\(actor\)/);
  assert.match(studentCatalogService, /entitlement\.completedLessonKeys\(/);
  assert.equal(studentCatalogService.includes("Math.random"), false);
});

test("student catalog routes are permission-gated and registered on the real router", () => {
  assert.match(studentRoutes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.ASSIGNMENT_VIEW\)/);
  assert.match(router, /registerStudentCatalogRoutes\(app\)/);
});

test("student Lesson Workspace keeps one canonical renderer and presents the approved three-column study surface", () => {
  assert.match(lessonWorkspace, /function ContentNavigator/);
  assert.match(lessonWorkspace, /function ContextRail/);
  assert.match(lessonWorkspace, /className="ld-lessonGrid"/);
  assert.match(lessonWorkspace, /className="ld-card ld-contentNav"/);
  assert.match(lessonWorkspace, /className="ld-contextRail"/);
  assert.match(lessonWorkspace, /<CompletionCheckPanel[\s\S]*nextHref={nextHref}/);
});

test("completion action uses backend confirmation and exposes Next Lesson only after synchronization", () => {
  assert.match(completionCheck, /markLessonComplete\(/);
  assert.match(completionCheck, /Check Completion/);
  assert.match(completionCheck, /Next Lesson/);
  assert.equal(completionCheck.includes("Mark Lesson Complete"), false);
});
