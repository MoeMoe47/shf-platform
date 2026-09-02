// src/pages/curriculum/course/CourseProgress.jsx
import React from "react";
import { useCourseWorkspace } from "./CourseWorkspace.jsx";

export default function CourseProgress() {
  const { course } = useCourseWorkspace();

  return (
    <div className="ld-dashGrid">
      <div className="ld-dashCol">
        <section className="ld-card">
          <div className="ld-progressGrid">
            <div className="ld-ring" style={{ "--ld-ring-pct": course.progressPercent ?? 0 }} role="img" aria-label={course.progressPercent === null ? "Course progress not available yet" : `${course.progressPercent}% complete`}>
              <div className="ld-ringInner">
                <span className="ld-ringPct">{course.progressPercent === null ? "—" : `${course.progressPercent}%`}</span>
                <span className="ld-ringLabel">Overall</span>
              </div>
            </div>
            <div>
              <p className="ld-mutedLine">{course.completedCount} of {course.lessonCount} lessons complete across {course.unitCount} units.</p>
            </div>
          </div>
        </section>

        <section className="ld-card" style={{ marginTop: 20 }}>
          <p className="ld-eyebrow">By Unit</p>
          <ul className="ld-unitProgressList">
            {course.units.map((unit, i) => {
              const pct = unit.totalCount > 0 ? Math.round((unit.completedCount / unit.totalCount) * 100) : 0;
              return (
                <li key={unit.stableKey} style={{ display: "grid", gap: 6 }}>
                  <div className="ld-unitProgressRow">
                    <span className="ld-unitProgressIndex">{i + 1}</span>
                    <span className="ld-unitProgressName">{unit.title}</span>
                    <span className="ld-unitProgressPct">{unit.completedCount}/{unit.totalCount}</span>
                  </div>
                  <div className="ld-progressBar" style={{ marginLeft: 32 }}>
                    <div className="ld-progressBarFill" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
