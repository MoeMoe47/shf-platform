import React from "react";
import SummaryCard from "./SummaryCard";

export default function AdminPanel({
  students,
  atRiskCount,
  verifiedImprovementCount,
  simpleMode,
}) {
  const readingAvg = Math.round(
    students.reduce((sum, s) => sum + s.readingProgress, 0) / students.length
  );

  const completionRate = Math.round(
    (students.filter((s) => s.readingProgress >= 60 || s.mathProgress >= 60).length /
      students.length) *
      100
  );

  return (
    <section className="panel" aria-labelledby="admin-panel-title">
      <div className="panel-header">
        <h2 id="admin-panel-title">Admin View</h2>
      </div>

      <SummaryCard
        title="School Performance Summary"
        body={`Overall reading performance average is ${readingAvg} percent. ${atRiskCount} students are currently high risk.`}
      />

      <div className="stack">
        <SummaryCard
          title="IEP Completion Rate"
          body={`${completionRate}% of students are currently showing measurable progress.`}
        />

        <SummaryCard
          title="Funding Eligibility"
          body={`Verified improvement found for ${verifiedImprovementCount} students. Estimated IDEA-aligned funding eligibility: $78,500.`}
        />

        <SummaryCard
          title="Outcome Trends"
          body={
            simpleMode
              ? "Reading gains are improving. Behavior support should be increased for students with missed sessions or low engagement."
              : "Reading gains are trending upward, and interventions should focus on the highest-risk students."
          }
        />
      </div>
    </section>
  );
}
