import React from "react";
import { Link, useParams } from "react-router-dom";
import { getStudentUnitBySlug } from "@/content/lessons/studentLoader.js";
import GuidedLessonExperience from "@/components/curriculum/lesson/GuidedLessonExperience.jsx";
import { useUser } from "@/context/UserContext.jsx";

export default function DraftLessonPreview() {
  const { slug } = useParams();
  const { role } = useUser();

  const [lesson, setLesson] = React.useState(null);
  const [curriculum, setCurriculum] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;

    setLoading(true);
    setError(null);

    getStudentUnitBySlug(slug)
      .then((result) => {
        if (!alive) return;

        if (!result?.unit) {
          setLesson(null);
          setCurriculum(null);
          setError(new Error("Draft lesson not found."));
          return;
        }

        setLesson(result.unit);
        setCurriculum(
          result.curriculum ||
          result.unit.curriculum ||
          null
        );
      })
      .catch((err) => {
        if (!alive) return;
        setLesson(null);
        setCurriculum(null);
        setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="page pad">
        <p className="subtle">Loading guided draft preview…</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="page pad">
        <h1>Draft lesson unavailable</h1>
        <p>{error?.message || "The lesson could not be loaded."}</p>
        <p>
          <Link to="/curriculum/learning">← Back to Learning</Link>
        </p>
      </div>
    );
  }

  const nextHref = lesson.nextSlug
    ? `/curriculum/preview/lessons/${encodeURIComponent(lesson.nextSlug)}`
    : null;

  return (
    <div>
      <div
        className="card card--pad"
        style={{
          margin: "16px 24px 0",
          padding: "12px 16px"
        }}
        role="note"
        aria-label="Draft preview notice"
      >
        <strong>Draft guided lesson preview</strong>
        <p style={{ margin: "4px 0 0" }}>
          Source curriculum preview only. Assignment status, institutional
          completion, verified evidence, competency attainment, publication,
          and learner eligibility are disabled.
        </p>
      </div>

      <GuidedLessonExperience
        lesson={lesson}
        curriculum={curriculum}
        nextHref={nextHref}
        role={role}
        assignmentId={null}
        unitStableKey={null}
        activityState={null}
        previewMode
      />
    </div>
  );
}
