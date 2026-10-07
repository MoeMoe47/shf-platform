// src/components/curriculum/lesson/LessonHeader.jsx
//
// Lesson orientation header for the Guided Lesson Experience (Phase 1).
// Shows only real, derivable lesson data — title, objective/summary,
// estimated time — plus a "Lesson progress" indicator computed from the
// student's own guided-stage navigation (real UI state), never a fake
// institutional completion percentage, due date, or instructor name (none
// of that exists in the real lesson content — see
// src/content/lessons/asl-student/*.json).
import React from "react";
import { Link } from "react-router-dom";
import { HomeIcon, ClockIcon, ChevronRightIcon } from "@/components/curriculum/icons.jsx";
import { lessonCoursePosition } from "@/utils/lessonCoursePosition.js";

const CURRICULUM_LABELS = {
  asl: "ASL",
  "shu-universal-career-readiness": "SHU Universal Career Readiness",
};

function curriculumLabel(curriculum) {
  const key = String(curriculum || "").toLowerCase();
  if (CURRICULUM_LABELS[key]) return CURRICULUM_LABELS[key];
  return key ? key.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ") : "Curriculum";
}

export default function LessonHeader({
  lesson,
  curriculum,
  completedCount,
  availableCount,
  previewMode = false,
}) {
  const position = lessonCoursePosition(lesson);
  const displayCompletedCount = previewMode ? 0 : completedCount;
  const pct =
    availableCount > 0
      ? Math.round((displayCompletedCount / availableCount) * 100)
      : 0;

  return (
    <div className="ld-lessonPage__header">
      <nav className="ld-lessonCrumb" aria-label="Breadcrumb">
        <Link className="ld-lessonCrumbLink" to={`/curriculum/asl/dashboard`} aria-label="Home">
          <HomeIcon size={16} />
        </Link>
        <ChevronRightIcon size={14} className="ld-lessonCrumbSep" />
        <Link className="ld-lessonCrumbLink" to="/curriculum/learning">Learning</Link>
        <ChevronRightIcon size={14} className="ld-lessonCrumbSep" />
        {position ? (
          <>
            <span className="ld-lessonCrumbLink">
              Unit {position.unitNumber}
            </span>

            <ChevronRightIcon
              size={14}
              className="ld-lessonCrumbSep"
            />

            <span className="ld-lessonCrumbCurrent">
              Lesson {position.lessonCode}
            </span>
          </>
        ) : (
          <span className="ld-lessonCrumbCurrent">
            {lesson.title || "Lesson"}
          </span>
        )}
      </nav>

      <div className="ld-card ld-lessonHeaderCard ld-lessonHeader" style={{ marginTop: 10 }}>
        <div className="ld-lessonHeaderMain">
          {position ? (
            <div className="ld-coursePosition">
              <p className="ld-coursePositionCourse">
                {position.courseTitle}
              </p>

              <div className="ld-coursePositionRows">
                <span>
                  <strong>
                    Unit {position.unitNumber} of {position.unitCount}
                  </strong>
                  {" · "}
                  {position.unitTitle}
                </span>

                <span>
                  <strong>
                    Lesson {position.lessonNumber} of {position.lessonCount}
                  </strong>
                  {" · "}
                  {position.lessonCode}
                </span>
              </div>
            </div>
          ) : null}

          <h1 className="ld-lessonTitle">{lesson.title}</h1>
          {!position ? (
            <p className="ld-lessonContext">
              {previewMode
                ? curriculumLabel(curriculum)
                : `${curriculumLabel(curriculum)} Curriculum`}
            </p>
          ) : null}
          {lesson.summary ? (
            <p className="ld-lessonSummary">{lesson.summary}</p>
          ) : Array.isArray(lesson.objectives) && lesson.objectives[0] ? (
            <p className="ld-lessonSummary">{lesson.objectives[0]}</p>
          ) : null}

          <div className="ld-lessonMetaRow">
            {lesson.estMinutes ? (
              <span className="ld-lessonPill">
                <ClockIcon size={14} className="ld-lessonPillIcon" />
                {lesson.estMinutes} min
              </span>
            ) : null}
          </div>
        </div>

        {availableCount > 0 && (
          <div className="ld-lessonHeaderSide">
            <p className="ld-lessonUnitLabel">
              {previewMode ? (
                <>Draft preview <span className="ld-lessonUnitPct">0%</span></>
              ) : (
                <>Lesson progress <span className="ld-lessonUnitPct">{pct}%</span></>
              )}
            </p>
            <div className="ld-lessonUnitProgress">
              <div className="ld-lessonUnitProgressFill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
