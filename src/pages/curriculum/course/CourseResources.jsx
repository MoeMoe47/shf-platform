// src/pages/curriculum/course/CourseResources.jsx
//
// Real data: student-catalog-service.ts flattens each lesson's real
// curriculum_resources rows (frozen into the release snapshot) into
// course.resources. No fabricated resource list, no placeholder links.
import React from "react";
import { useCourseWorkspace } from "./CourseWorkspace.jsx";

export default function CourseResources() {
  const { course } = useCourseWorkspace();

  if (course.resources.length === 0) {
    return (
      <div className="ld-card ld-emptyState">
        <p className="ld-emptyStateTitle">No additional resources for this course.</p>
      </div>
    );
  }

  return (
    <section className="ld-card">
      <ul className="ld-workList">
        {course.resources.map((r) => (
          <li className="ld-workRow" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }} key={r.resourceId}>
            <div className="ld-workMain">
              <div className="ld-workTitle">{r.title}</div>
              <div className="ld-workBreadcrumb">{r.lessonTitle}{r.description ? ` · ${r.description}` : ""}</div>
            </div>
            {r.externalUrl ? (
              <a className="ld-viewLink" href={r.externalUrl} target="_blank" rel="noopener noreferrer">Open</a>
            ) : (
              <span className="ld-workCell">{r.resourceType}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
