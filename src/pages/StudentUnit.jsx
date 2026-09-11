// src/pages/StudentUnit.jsx
//
// Phase 1 restoration (SHF Curriculum Infrastructure Audit §5/§18): the
// canonical student loader (src/content/lessons/studentLoader.js) had
// exactly one live consumer in the entire app — the unrouted
// AdminCompare.jsx — so no canonical student lesson (with its real
// media/objectives/vocab/quiz content) was reachable from any route. This
// mirrors the exact same pattern already used by MasterUnit.jsx/
// InstructorUnit.jsx: a thin :slug detail page over the existing,
// unmodified loader.
//
// SHF Student Lesson Guided Experience — Phase 1 (2026-08-27): this route
// is the canonical target for the approved guided-flow mock, so it now
// renders <GuidedLessonExperience/> instead of the flat <LessonBody/>.
// LessonBody itself is untouched and still serves the separate, legacy
// /curriculum/lesson/:id localStorage-backed preview route (see
// src/pages/curriculum/Lesson.jsx) — see GuidedLessonExperience.jsx's own
// header comment for why the two are intentionally not shared.
//
// Phase 1 correction (2026-08-27): this route (/curriculum/lessons/:slug)
// has no :curriculum URL segment, so the previous `useParams().curriculum
// ?? "asl"` silently stamped "asl" onto every lesson regardless of its
// real content — not a real default, a bug that happened to look correct
// only because every real lesson today lives under asl-student/. Lesson
// context is now derived from the real file path via
// getStudentUnitBySlug() (studentLoader.js), so it stays correct if a
// non-ASL "-student" folder is ever added, instead of hardcoding one
// curriculum as the app's general identity.
import React from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { getStudentUnitBySlug } from "@/content/lessons/studentLoader.js";
import GuidedLessonExperience from "@/components/curriculum/lesson/GuidedLessonExperience.jsx";
import { listAssignments } from "@/lib/assignments/api.js";
import { getLearnerActivityState } from "@/lib/curriculum/activityApi.js";
import { getCourseDetail } from "@/lib/curriculum/learningApi.js";
import { useUser } from "@/context/UserContext.jsx";

export default function StudentUnit() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { role } = useUser();
  const [lesson, setLesson] = React.useState(null);
  const [curriculum, setCurriculum] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [canonical, setCanonical] = React.useState({ loading: true, assignmentId: null, unitStableKey: null, state: null, error: null });

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    getStudentUnitBySlug(slug)
      .then((res) => {
        if (!alive) return;
        setLesson(res?.unit || null);
        setCurriculum(res?.unit?.curriculum || res?.curriculum || null);
        setLoading(false);
      })
      .catch(() => { if (alive) { setLesson(null); setCurriculum(null); setLoading(false); } });
    return () => { alive = false; };
  }, [slug]);

  React.useEffect(() => {
    let alive = true;
    setCanonical({ loading: true, assignmentId: null, unitStableKey: null, state: null, error: null });
    listAssignments(role).then((response) => {
      const requested = searchParams.get("assignmentId");
      const items = response?.items || [];
      const assignment = items.find((item) => item.id === requested)
        || items.find((item) => item.nextLesson?.lessonStableKey === slug || item.scopeLessons?.some((lessonItem) => lessonItem.lessonStableKey === slug));
      if (!assignment) throw new Error("This lesson is not available through an active student assignment.");
      const lessonRef = assignment.nextLesson?.lessonStableKey === slug
        ? assignment.nextLesson
        : (assignment.scopeLessons || []).find((lessonItem) => lessonItem.lessonStableKey === slug);
      const resolveUnit = lessonRef?.unitStableKey || assignment.assignedContentId?.split(":")?.[0]
        ? Promise.resolve(lessonRef?.unitStableKey || assignment.assignedContentId?.split(":")?.[0])
        : getCourseDetail(role, assignment.curriculumRelease?.courseStableKey).then((course) => {
          const match = (course?.units || []).find((unit) => (unit.lessons || []).some((lessonItem) => lessonItem.lessonStableKey === slug));
          return match?.stableKey || null;
        });
      return resolveUnit.then((unitStableKey) => {
        if (!unitStableKey) throw new Error("The assigned lesson scope is incomplete.");
        return getLearnerActivityState(role, assignment.id, unitStableKey, slug).then((state) => ({ assignment, unitStableKey, state }));
      });
    }).then(({ assignment, unitStableKey, state }) => {
      if (alive) setCanonical({ loading: false, assignmentId: assignment.id, unitStableKey, state, error: null });
    }).catch((error) => {
      if (alive) setCanonical({ loading: false, assignmentId: null, unitStableKey: null, state: null, error });
    });
    return () => { alive = false; };
  }, [role, searchParams, slug]);

  if (loading) {
    return (
      <div className="card card--pad">
        <p className="subtle">Loading lesson…</p>
      </div>
    );
  }

  if (!lesson && !canonical.state?.lesson) {
    return (
      <div className="card card--pad">
        <h2 style={{ marginTop: 0 }}>Not Found</h2>
        <p>
          No student lesson found for slug <code>{slug}</code>.
        </p>
        <Link className="btn" to="/curriculum/learning">Back to Learning</Link>
      </div>
    );
  }

  if (canonical.loading) {
    return <div className="card card--pad"><p className="subtle" role="status">Loading your assigned lesson state…</p></div>;
  }

  if (canonical.error || !canonical.assignmentId) {
    return <div className="card card--pad"><h2 style={{ marginTop: 0 }}>Lesson unavailable</h2><p role="alert">{canonical.error?.message || "No active assignment was found for this lesson."}</p><Link className="btn" to="/curriculum/learning">Back to Learning</Link></div>;
  }

  const renderedLesson = canonical.state?.lesson || lesson;
  const nextHref = renderedLesson?.nextSlug
    ? `/curriculum/lessons/${encodeURIComponent(renderedLesson.nextSlug)}`
    : null;

  return (
    <GuidedLessonExperience
      lesson={renderedLesson}
      nextHref={nextHref}
      curriculum={curriculum}
      role={role}
      assignmentId={canonical.assignmentId}
      unitStableKey={canonical.unitStableKey}
      activityState={canonical.state}
    />
  );
}
