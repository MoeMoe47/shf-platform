// src/pages/curriculum/course/CourseLive.jsx
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { useCourseWorkspace } from "./CourseWorkspace.jsx";
import LiveSessionCard from "@/components/curriculum/LiveSessionCard.jsx";

export default function CourseLive() {
  const { role } = useUser();
  const { course, liveSessions } = useCourseWorkspace();

  if (liveSessions.length === 0) {
    return (
      <div className="ld-card ld-emptyState">
        <p className="ld-emptyStateTitle">No live sessions are scheduled.</p>
      </div>
    );
  }

  const sorted = [...liveSessions].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  return (
    <section className="ld-card">
      <ul className="ld-sessionList">
        {sorted.map((s) => (
          <LiveSessionCard key={s.id} session={s} role={role} courseTitle={course.title} />
        ))}
      </ul>
    </section>
  );
}
