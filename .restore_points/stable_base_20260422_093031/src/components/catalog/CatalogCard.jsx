import React from "react";
import { seedExternal } from "@/shared/progress/progressClient.js";
import { buildLaunchUrl } from "@/shared/external/partnerRegistry.js";
import { useUserId } from "@/shared/external/getUserId.js";

export default function CatalogCard({ course, progress, onProof }) {
  const userId = useUserId();
  const isExternal = course.providerType && course.providerType !== "internal";
  const label = isExternal
    ? (course.providerName ? `Launch on ${course.providerName}` : "Launch")
    : (progress?.status === "in_progress" ? "Resume" : "Start");

  function handleClick(){
    if (!isExternal) {
      // internal route: you can replace with your curriculum route
      location.href = `curriculum.html#/course/${course.id || course.courseId}`;
      return;
    }
    // external — seed pending + open provider
    seedExternal({ userId, courseId: course.id || course.courseId });
    const url = buildLaunchUrl(course, { utm: "utm_source=shf&utm_medium=catalog" });
    window.open(url, "_blank", "noopener");
  }

  return (
    <article className="cat-card">
      <div className="cat-icon">📘</div>
      <h3 className="cat-card-title">{course.title}</h3>
      <div className="cat-meta">
        <span>{course.providerName || "Billy Gateson"}</span>
        <span aria-hidden>•</span>
        <span>{course.duration || `${course.durationHours||2} hours`}</span>
      </div>

      <div className="cat-progress">
        <div className="cat-progress-bar" style={{ width: `${progress?.pct || 0}%` }} />
      </div>
      <div className="cat-progress-label">{progress?.pct || 0}% complete</div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button className="cat-btn-primary" onClick={handleClick}>{label}</button>
        {isExternal && (
          <button className="cat-btn-outline" onClick={() => onProof(course)}>Submit Proof</button>
        )}
      </div>
    </article>
  );
}
