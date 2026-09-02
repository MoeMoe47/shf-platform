// src/pages/curriculum/course/CourseWorkspace.jsx
//
// SHF Curriculum Phase 5.5 — Course Workspace shell. Fetches the real
// course detail (student-catalog-service.ts, via learningApi.js) plus
// the assignments/live-session lists once here, and hands them to every
// tab via useOutletContext so no tab re-fetches or re-derives progress.
// Renders its own breadcrumb + title + tab strip (CurriculumLayout.jsx
// blanks the generic header for this route — see isCourseWorkspace
// there), matching the approved mock's header treatment.
import React from "react";
import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { getCourseDetail } from "@/lib/curriculum/learningApi.js";
import { listAssignments } from "@/lib/assignments/api.js";
import { listLiveSessions } from "@/lib/liveLearning/api.js";
import { ArrowRightIcon } from "@/components/curriculum/icons.jsx";

const TABS = [
  { key: "overview", label: "Overview", path: "" },
  { key: "lessons", label: "Lessons", path: "lessons" },
  { key: "assignments", label: "Assignments", path: "assignments" },
  { key: "live", label: "Live", path: "live" },
  { key: "resources", label: "Resources", path: "resources" },
  { key: "progress", label: "Progress", path: "progress" },
];

export function useCourseWorkspace() {
  return useOutletContext();
}

export default function CourseWorkspace() {
  const { courseId } = useParams();
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, error: null, course: null, assignments: [], liveSessions: [] });

  React.useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([
      getCourseDetail(role, courseId),
      listAssignments(role).catch(() => ({ items: [] })),
      listLiveSessions(role).catch(() => ({ items: [] })),
    ])
      .then(([courseRes, assignmentRes, liveRes]) => {
        if (!active) return;
        setState({ loading: false, error: null, course: courseRes || null, assignments: assignmentRes?.items || [], liveSessions: liveRes?.items || [] });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error, course: null, assignments: [], liveSessions: [] });
      });
    return () => {
      active = false;
    };
  }, [role, courseId]);

  const { loading, error, course } = state;
  const courseAssignments = React.useMemo(
    () => (course ? state.assignments.filter((a) => a.curriculumRelease?.courseStableKey === course.stableKey) : []),
    [state.assignments, course],
  );
  const courseLiveSessions = React.useMemo(
    () => (course ? state.liveSessions.filter((s) => s.courseId === course.stableKey) : []),
    [state.liveSessions, course],
  );

  if (loading) {
    return <p className="ld-mutedLine" role="status">Loading course…</p>;
  }
  if (error || !course) {
    return (
      <div className="ld-emptyState">
        <p className="ld-emptyStateTitle">This course isn't available.</p>
        <p className="ld-mutedLine">You may not have an assignment in this course yet, or it may not exist.</p>
      </div>
    );
  }

  const context = { course, assignments: courseAssignments, liveSessions: courseLiveSessions };

  return (
    <div>
      <header className="ld-courseHero">
        <div className="ld-courseHeroMedia" aria-hidden="true">
          <span className="ld-dataCenterGlyph"><span /><span /><span /></span>
        </div>
        <div className="ld-courseHeroBody">
          <nav className="ld-breadcrumb" aria-label="Breadcrumb">
            <NavLink to="/curriculum/learning" className="ld-breadcrumbLink">Courses</NavLink>
            <span className="ld-breadcrumbSep">/</span>
            <span className="ld-breadcrumbCurrent">{course.title}</span>
          </nav>
          <h1 className="ld-h1" style={{ margin: 0 }}>{course.title}</h1>
          {course.shortDescription && <p className="ld-courseHeroDescription">{course.shortDescription}</p>}
          {course.nextLesson && (
            <NavLink className="ld-btn ld-btnPrimary ld-courseHeroAction" to={`/curriculum/lessons/${course.nextLesson.lessonStableKey}`}>
              Continue <ArrowRightIcon size={16} />
            </NavLink>
          )}
        </div>
      </header>

      <div className="ld-tabs" role="tablist" aria-label="Course sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.path ? `/curriculum/courses/${courseId}/${tab.path}` : `/curriculum/courses/${courseId}`}
            end={tab.path === ""}
            className={({ isActive }) => `ld-tab${isActive ? " is-active" : ""}`}
            role="tab"
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={context} />
    </div>
  );
}
