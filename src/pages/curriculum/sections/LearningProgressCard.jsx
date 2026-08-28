// src/pages/curriculum/sections/LearningProgressCard.jsx
import React from "react";
import { BookIcon, ClipboardIcon, AwardIcon, FlameIcon } from "@/components/curriculum/icons.jsx";
import { fetchCurriculumLessonCompletionReport } from "@/shared/reporting/curriculumReportingClient.js";

/**
 * Browser progress remains personal UX/transport state. Institutional lesson
 * completion is read only from the authenticated Reporting Service.
 */
const PROGRESS = {
  percentComplete: 68,
  assignmentsDue: 3,
  credentialsEarned: 8,
  streakDays: 12,
};

export default function LearningProgressCard() {
  const pct = Math.max(0, Math.min(100, PROGRESS.percentComplete));
  const [lessonReport, setLessonReport] = React.useState({ status: "loading", report: null });

  React.useEffect(() => {
    let active = true;
    fetchCurriculumLessonCompletionReport()
      .then((report) => {
        if (active) setLessonReport({ status: "ready", report });
      })
      .catch(() => {
        if (active) setLessonReport({ status: "unavailable", report: null });
      });
    return () => {
      active = false;
    };
  }, []);

  const lessonMetric = lessonReport.report?.metric_results?.[0];
  const lessonCount = lessonReport.status === "ready" ? lessonMetric.value : lessonReport.status === "loading" ? "Pending" : "Unavailable";
  const lessonStatus = lessonReport.status === "ready"
    ? `Canonical metric v${lessonReport.report.report_definition_version}; ${lessonMetric.verification_status}`
    : lessonReport.status === "loading"
      ? "Awaiting canonical report"
      : "Canonical report unavailable";

  return (
    <section className="ld-card" aria-labelledby="ld-progress-h">
      <p id="ld-progress-h" className="ld-eyebrow">Learning Progress</p>

      <div className="ld-progressGrid">
        <div
          className="ld-ring"
          style={{ "--ld-ring-pct": pct }}
          role="img"
          aria-label={`${pct}% of learning pathway complete`}
        >
          <div className="ld-ringInner">
            <span className="ld-ringPct">{pct}%</span>
            <span className="ld-ringLabel">complete</span>
          </div>
        </div>

        <ul className="ld-progressStats">
          <li>
            <BookIcon size={22} className="ld-progressStatIcon" />
            <span className="ld-progressStatValue" data-reporting-status={lessonReport.status}>{lessonCount}</span>
            <span className="ld-progressStatLabel">Lessons completed</span>
            <span className="ld-progressStatLabel" aria-live="polite">{lessonStatus}</span>
          </li>
          <li>
            <ClipboardIcon size={22} className="ld-progressStatIcon" />
            <span className="ld-progressStatValue">{PROGRESS.assignmentsDue}</span>
            <span className="ld-progressStatLabel">Assignments due</span>
          </li>
          <li>
            <AwardIcon size={22} className="ld-progressStatIcon" />
            <span className="ld-progressStatValue">{PROGRESS.credentialsEarned}</span>
            <span className="ld-progressStatLabel">Credentials earned</span>
          </li>
          <li>
            <FlameIcon size={22} className="ld-progressStatIcon" />
            <span className="ld-progressStatValue">{PROGRESS.streakDays}</span>
            <span className="ld-progressStatLabel">Day streak</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
