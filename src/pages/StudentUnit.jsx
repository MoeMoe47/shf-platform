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
import { useParams, Link } from "react-router-dom";
import { getStudentUnitBySlug } from "@/content/lessons/studentLoader.js";
import GuidedLessonExperience from "@/components/curriculum/lesson/GuidedLessonExperience.jsx";

export default function StudentUnit() {
  const { slug } = useParams();
  const [lesson, setLesson] = React.useState(null);
  const [curriculum, setCurriculum] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

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

  if (loading) {
    return (
      <div className="card card--pad">
        <p className="subtle">Loading lesson…</p>
      </div>
    );
  }

  if (!lesson) {
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

  const nextHref = lesson.nextSlug
    ? `/curriculum/lessons/${encodeURIComponent(lesson.nextSlug)}`
    : null;

  return (
    <GuidedLessonExperience
      lesson={lesson}
      nextHref={nextHref}
      curriculum={curriculum}
    />
  );
}
