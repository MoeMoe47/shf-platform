// src/router/CurriculumRoutes.jsx
// Routes-only module: no Router here (entry provides <HashRouter>)
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import CurriculumLayout from "@/layouts/CurriculumLayout.jsx";
import GedWritingChapterStudent from "@/pages/ged/GedWritingChapterStudent.jsx";

/** Universal Dev Index (no layout chrome) */
const DevDocsViewer = lazy(() => import("@/pages/dev/Docs.jsx"));

/** Curriculum + shared pages */
const CurriculumDashboard = lazy(() => import("@/pages/curriculum/CurriculumDashboard.jsx"));
const Lessons = lazy(() => import("@/pages/Lessons.jsx"));
const LessonView = lazy(() => import("@/pages/LessonView.jsx"));
const LessonPage = lazy(() => import("@/pages/LessonPage.jsx"));
const Help = lazy(() => import("@/pages/Help.jsx"));
const Settings = lazy(() => import("@/pages/Settings.jsx"));

/** Curriculum-specific lesson screens. MyLessons.jsx (the old flat
 * cross-curriculum list) is no longer routed — "lessons" now redirects to
 * the Phase 5.5 Learning landing below — but the file itself is left in
 * place rather than deleted, since nothing in this task required removing
 * it. */
const CurriculumLesson = lazy(() => import("@/pages/curriculum/Lesson.jsx"));

/** Phase 5.5 Unified Learning Workspace — course-first Learning landing +
 * Course Workspace (Overview/Lessons/Assignments/Live/Resources/Progress
 * tabs), replacing the old flat "Lessons" nav destination. See
 * CurriculumSidebar.jsx (Learning nav item) and student-catalog-
 * service.ts (apps/shs-api) for the real data these render. */
const Learning = lazy(() => import("@/pages/curriculum/Learning.jsx"));
const CourseWorkspace = lazy(() => import("@/pages/curriculum/course/CourseWorkspace.jsx"));
const CourseOverview = lazy(() => import("@/pages/curriculum/course/CourseOverview.jsx"));
const CourseLessons = lazy(() => import("@/pages/curriculum/course/CourseLessons.jsx"));
const CourseAssignments = lazy(() => import("@/pages/curriculum/course/CourseAssignments.jsx"));
const CourseLive = lazy(() => import("@/pages/curriculum/course/CourseLive.jsx"));
const CourseResources = lazy(() => import("@/pages/curriculum/course/CourseResources.jsx"));
const CourseProgress = lazy(() => import("@/pages/curriculum/course/CourseProgress.jsx"));

/** Sidebar destinations that had no route before (dashboard rebuild) */
const Calendar = lazy(() => import("@/pages/curriculum/CurriculumCalendar.jsx"));
const Assignments = lazy(() => import("@/pages/Assignments.jsx"));
const CareerPortfolio = lazy(() => import("@/pages/career/Portfolio.jsx"));
const Instructor = lazy(() => import("@/pages/Instructor.jsx"));
const InstructorOperations = lazy(() => import("@/pages/curriculum/InstructorOperations.jsx"));
const OperationalDetail = lazy(() => import("@/pages/curriculum/OperationalDetail.jsx"));
const StaffCourseWorkspace = lazy(() => import("@/pages/curriculum/StaffCourseWorkspace.jsx"));
const StaffProjectReview = lazy(() => import("@/pages/curriculum/StaffProjectReview.jsx"));
const StaffAttendance = lazy(() => import("@/pages/curriculum/StaffAttendance.jsx"));
const MasterIndex = lazy(() => import("@/pages/MasterIndex.jsx"));

/** Phase 1 restoration: these real components existed but had no route
 * anywhere in the app (see SHF Curriculum Infrastructure Audit §5/§7). */
const InstructorUnit = lazy(() => import("@/pages/InstructorUnit.jsx"));
const MasterUnit = lazy(() => import("@/pages/MasterUnit.jsx"));
const AdminCompare = lazy(() => import("@/pages/AdminCompare.jsx"));
const StudentUnit = lazy(() => import("@/pages/StudentUnit.jsx"));
const PrepareProveReview = lazy(() => import("@/pages/curriculum/PrepareProveReview.jsx"));

/** Phase 3 Studio shell over the durable Phase 2 project API. */
const StudioHome = lazy(() => import("@/pages/studio/StudioHome.jsx"));
const StudioNewProject = lazy(() => import("@/pages/studio/StudioNewProject.jsx"));
const StudioProjects = lazy(() => import("@/pages/studio/StudioProjects.jsx"));
const StudioProjectShell = lazy(() => import("@/pages/studio/StudioProjectShell.jsx"));
const StudioBuilderWorkspace = lazy(() => import("@/pages/studio/StudioBuilderWorkspace.jsx"));
const StudioAssignments = lazy(() => import("@/pages/studio/StudioAssignments.jsx"));
const StudioTemplates = lazy(() => import("@/pages/studio/StudioTemplates.jsx"));
const StudioReviewSubmission = lazy(() => import("@/pages/studio/StudioReviewSubmission.jsx"));
const StudioAssignmentProgress = lazy(() => import("@/pages/studio/StudioAssignmentProgress.jsx"));

/** Phase 1 Zoom/live-learning restoration — real components, previously
 * unrouted anywhere (see audit §28-30). AdminZoom.jsx is real, existing
 * approval-queue UI; LiveSessions.jsx is new (thin) but only wires
 * existing zoomAccess.js/ZoomCard.jsx behavior to a route. */
const LiveSessions = lazy(() => import("@/pages/curriculum/LiveSessions.jsx"));
const AdminZoom = lazy(() => import("@/pages/AdminZoom.jsx"));
/** Phase 2A Secure Live Learning — real session create/list/cancel,
 * backed by apps/shs-api. See LiveSessionManage.jsx header comment. */
const LiveSessionManage = lazy(() => import("@/pages/curriculum/LiveSessionManage.jsx"));

/** Phase 2B Complete Learning Experience — real, previously unmounted
 * accessibility preference infrastructure. See Accessibility.jsx. */
const CurriculumAccessibility = lazy(() => import("@/pages/curriculum/Accessibility.jsx"));
const Grade12EntryGate = lazy(() => import("@/pages/curriculum/Grade12EntryGate.jsx"));
const CurriculumImport = lazy(() => import("@/pages/curriculum/CurriculumImport.jsx"));

/**
 * MasterIndex.jsx / MasterUnit.jsx / InstructorUnit.jsx / AdminCompare.jsx
 * all generate their own internal links as bare `/${curriculum}/...` paths
 * (matching the builders in src/router/paths.js: INSTRUCTOR, MASTER,
 * INSTRUCTOR_UNIT, MASTER_UNIT) rather than the `/curriculum/...`-nested
 * paths this app actually serves (the ones the sidebar's own NavLinks use
 * — see CurriculumSidebar.jsx's `to={`/curriculum/${path}`}`). Rather than
 * rewriting those components' internal Links (out of scope for a Phase 1
 * reconnection) or inventing a second, competing route tree, this redirect
 * catches the bare shape they already produce and forwards it into the
 * real, shell-wrapped route — a bridge, not a second routing model.
 */
function CurriculumParamRedirect({ to }) {
  const { slug } = useParams();
  const target = slug ? to.replace(":slug", encodeURIComponent(slug)) : to;
  return <Navigate to={`/curriculum/${target}`} replace />;
}

export default function CurriculumRoutes() {
  return (
    <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
      <Routes>
        {/* Dev index without layout chrome */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* ✅ Base route for Curriculum app */}
        <Route path="/curriculum" element={<CurriculumLayout />}>
          {/* Default inside curriculum */}
          <Route index element={<Navigate to="asl/dashboard" replace />} />

          {/* Keep your “asl/dashboard” path */}
          <Route path="asl/dashboard" element={<CurriculumDashboard />} />

          {/* Sidebar destinations (previously unrouted — links were dead) */}
          <Route path="asl/calendar" element={<Calendar />} />
          <Route path="asl/assignments" element={<Assignments />} />
          <Route path="asl/portfolio" element={<CareerPortfolio />} />
          <Route path="instructor" element={<Instructor />} />
          <Route path="instructor/operations" element={<InstructorOperations />} />
          <Route path="instructor/operations/learners/:learnerId" element={<OperationalDetail kind="learner" />} />
          <Route path="instructor/operations/assignments/:assignmentId" element={<OperationalDetail kind="assignment" />} />
          <Route path="instructor/operations/courses/:courseId" element={<StaffCourseWorkspace />} />
          <Route path="instructor/operations/reviews/project/:submissionId" element={<StaffProjectReview />} />
          <Route path="instructor/operations/live/:sessionId/attendance" element={<StaffAttendance />} />
          <Route path="instructor/:slug" element={<InstructorUnit />} />
          <Route path="instructor/prove/:evidenceId" element={<PrepareProveReview />} />
          <Route path="master" element={<MasterIndex />} />
          <Route path="master/:slug" element={<MasterUnit />} />
          <Route path="admin" element={<AdminCompare />} />
          <Route path="admin/operations" element={<InstructorOperations />} />
          <Route path="admin/operations/learners/:learnerId" element={<OperationalDetail kind="learner" />} />
          <Route path="admin/operations/assignments/:assignmentId" element={<OperationalDetail kind="assignment" />} />
          <Route path="admin/operations/courses/:courseId" element={<StaffCourseWorkspace />} />
          <Route path="admin/operations/reviews/project/:submissionId" element={<StaffProjectReview />} />
          <Route path="admin/operations/live/:sessionId/attendance" element={<StaffAttendance />} />
          <Route path="admin/:slug" element={<AdminCompare />} />

          {/* Live Sessions (Zoom) — see LiveSessions.jsx header comment */}
          <Route path="live-sessions" element={<LiveSessions />} />
          <Route path="live-sessions/admin" element={<AdminZoom />} />
          <Route path="live-sessions/manage" element={<LiveSessionManage />} />
          <Route path="accessibility" element={<CurriculumAccessibility />} />
          <Route path="grade12-entry" element={<Grade12EntryGate />} />
          <Route path="import" element={<CurriculumImport />} />
          <Route path="import/:jobId" element={<CurriculumImport />} />

          {/* GED Writing Student Chapter Route */}
          <Route path="ged-writing/ch/:number" element={<GedWritingChapterStudent />} />

          {/* Phase 5.5: Learning landing replaces the flat "Lessons" list as
              the sidebar destination. The old MyLessons.jsx list itself is
              left routable at library/lessons-style access is unaffected;
              only the primary "lessons" path now redirects for bookmark
              compatibility rather than rendering the flat list. */}
          <Route path="learning" element={<Learning />} />
          <Route path="lessons" element={<Navigate to="/curriculum/learning" replace />} />

          {/* Phase 5.5 Course Workspace — nested tabs share one fetch via
              CourseWorkspace.jsx's <Outlet context={...}/>. */}
          <Route path="courses/:courseId" element={<CourseWorkspace />}>
            <Route index element={<CourseOverview />} />
            <Route path="lessons" element={<CourseLessons />} />
            <Route path="assignments" element={<CourseAssignments />} />
            <Route path="live" element={<CourseLive />} />
            <Route path="resources" element={<CourseResources />} />
            <Route path="progress" element={<CourseProgress />} />
          </Route>

          {/* Curriculum lesson routes */}
          <Route path="lesson/:id" element={<CurriculumLesson />} />
          {/* Canonical student content (src/content/lessons/asl-student/*)
              — previously unreachable, see StudentUnit.jsx header comment.
              Deliberately "lessons/:slug" (plural), matching the shape
              AdminCompare.jsx's own "Open" link and paths.js's LESSON
              builder already generate, distinct from the singular
              "lesson/:id" localStorage-backed route above. */}
          <Route path="lessons/:slug" element={<StudentUnit />} />

          {/* Library routes */}
          <Route path="library/lessons" element={<Lessons />} />
          <Route path="library/lesson/:id" element={<LessonView />} />
          <Route path="library/lesson" element={<LessonPage />} />

          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />

          {/* Fallback inside curriculum */}
          <Route path="*" element={<Navigate to="asl/dashboard" replace />} />
        </Route>

        {/* Phase 3: student Studio is a sibling student route tree, not an
            alias for the curriculum admin/BuilderHub surfaces. It reuses
            the established student shell and keeps Studio's durable API
            boundary in the page modules. */}
        <Route path="/studio" element={<CurriculumLayout />}>
          <Route index element={<StudioHome />} />
          <Route path="new" element={<StudioNewProject />} />
          <Route path="projects" element={<StudioProjects />} />
          <Route path="projects/:projectId" element={<StudioProjectShell />} />
          <Route path="projects/:projectId/build" element={<StudioBuilderWorkspace />} />
          <Route path="review/:projectId/:submissionId" element={<StudioReviewSubmission />} />
          <Route path="assignments/:assignmentId/progress" element={<StudioAssignmentProgress />} />
          <Route path="assignments" element={<StudioAssignments />} />
          <Route path="templates" element={<StudioTemplates />} />
          <Route path="*" element={<Navigate to="/studio" replace />} />
        </Route>

        {/* Bridge routes: forward the bare `/${curriculum}/...` shape that
            MasterIndex/MasterUnit/InstructorUnit/AdminCompare's own internal
            links already generate (see CurriculumParamRedirect above) into
            the real, shell-wrapped `/curriculum/...` routes above. Declared
            after the `/curriculum/*` tree and before the final catch-all so
            they only catch this shape. */}
        <Route path="/:curriculum/instructor" element={<CurriculumParamRedirect to="instructor" />} />
        <Route path="/:curriculum/instructor/:slug" element={<CurriculumParamRedirect to="instructor/:slug" />} />
        <Route path="/:curriculum/master" element={<CurriculumParamRedirect to="master" />} />
        <Route path="/:curriculum/master/:slug" element={<CurriculumParamRedirect to="master/:slug" />} />
        <Route path="/:curriculum/admin" element={<CurriculumParamRedirect to="admin" />} />
        <Route path="/:curriculum/admin/:slug" element={<CurriculumParamRedirect to="admin/:slug" />} />
        <Route path="/:curriculum/lessons" element={<CurriculumParamRedirect to="lessons" />} />
        <Route path="/:curriculum/lessons/:slug" element={<CurriculumParamRedirect to="lessons/:slug" />} />

        {/* ✅ If someone hits just "#/" in this app, send them to curriculum */}
        <Route path="/" element={<Navigate to="/curriculum" replace />} />
        <Route path="*" element={<Navigate to="/curriculum" replace />} />
      </Routes>
    </Suspense>
  );
}
