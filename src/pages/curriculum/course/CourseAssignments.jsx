// src/pages/curriculum/course/CourseAssignments.jsx
import React from "react";
import { useCourseWorkspace } from "./CourseWorkspace.jsx";
import AssignmentRow from "@/components/curriculum/AssignmentRow.jsx";

export default function CourseAssignments() {
  const { assignments } = useCourseWorkspace();

  if (assignments.length === 0) {
    return (
      <div className="ld-card ld-emptyState">
        <p className="ld-emptyStateTitle">You're caught up.</p>
        <p className="ld-mutedLine">No assignments in this course right now.</p>
      </div>
    );
  }

  return (
    <section className="ld-card">
      <ul className="ld-workList">
        {assignments.map((a) => (
          <AssignmentRow key={a.id} assignment={a} />
        ))}
      </ul>
    </section>
  );
}
