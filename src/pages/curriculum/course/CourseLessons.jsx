// src/pages/curriculum/course/CourseLessons.jsx
//
// Units accordion — matches the approved mock. Per-lesson status
// (completed/in_progress/upcoming) comes straight from
// student-catalog-service.ts's real completion-derived computation; this
// component never invents a "locked" rule client-side (see Phase 5.5
// plan's disclosed gaps — locking only reflects a real completion-policy
// prerequisite when one exists, which this endpoint does not yet surface
// per-lesson, so every non-completed lesson here is honestly "upcoming").
import React from "react";
import { Link } from "react-router-dom";
import { useCourseWorkspace } from "./CourseWorkspace.jsx";
import { CheckCircleIcon, CircleIcon, ChevronDownIcon, LayersIcon, BookIcon, ClipboardIcon, CalendarIcon } from "@/components/curriculum/icons.jsx";

const STATUS_LABEL = { completed: "Completed", in_progress: "In Progress", upcoming: "Upcoming" };
const STATUS_ICON = { completed: CheckCircleIcon, in_progress: CircleIcon, upcoming: CircleIcon };

function UnitRow({ unit, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const pct = unit.totalCount > 0 ? Math.round((unit.completedCount / unit.totalCount) * 100) : 0;
  const complete = unit.totalCount > 0 && unit.completedCount === unit.totalCount;

  return (
    <div className="ld-unit" data-open={open ? "true" : "false"}>
      <button type="button" className="ld-unitHeader" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <LayersIcon size={18} className="ld-unitHeaderIcon" />
        <span className="ld-unitHeaderTitle">{unit.title}</span>
        <span className={`ld-unitHeaderPct${complete ? " is-complete" : ""}`}>{pct}%</span>
        <ChevronDownIcon size={16} className="ld-unitChevron" />
      </button>
      {open && (
        <div className="ld-unitBody">
          {unit.lessons.map((lesson, i) => {
            const Icon = STATUS_ICON[lesson.status];
            return (
              <div className="ld-lessonRow" key={lesson.lessonStableKey}>
                <Icon size={18} className={`ld-lessonStatusIcon is-${lesson.status}`} />
                <span className="ld-lessonTitle">{lesson.title}</span>
                <span className="ld-lessonSeq">Lesson {i + 1}</span>
                {lesson.status === "in_progress" ? (
                  <Link className="ld-btn ld-btnPrimary" style={{ padding: "6px 14px", minHeight: 32 }} to={`/curriculum/lessons/${lesson.lessonStableKey}`}>Continue</Link>
                ) : (
                  <span className={`ld-lessonBadge is-${lesson.status}`}>{STATUS_LABEL[lesson.status]}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CourseLessons() {
  const { course, assignments, liveSessions } = useCourseWorkspace();
  const upcomingAssignment = [...assignments]
    .filter((a) => a.accessState !== "COMPLETED" && a.accessState !== "LOCKED")
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0];
  const nextLive = [...liveSessions]
    .filter((s) => s.status === "scheduled" || s.status === "open")
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];

  if (course.units.length === 0) {
    return (
      <div className="ld-card ld-emptyState">
        <p className="ld-emptyStateTitle">No units are available for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="ld-dashGrid">
      <div className="ld-dashCol">
        <section className="ld-card ld-lessonsSummary" aria-label="Course lesson progress">
          <div className="ld-ring ld-ring--small" style={{ "--ld-ring-pct": course.progressPercent ?? 0 }} role="img" aria-label={course.progressPercent === null ? "Course progress not available yet" : `${course.progressPercent}% complete`}>
            <div className="ld-ringInner">
              <span className="ld-ringPct">{course.progressPercent === null ? "—" : `${course.progressPercent}%`}</span>
            </div>
          </div>
          <div>
            <p className="ld-mutedLine">Your Progress</p>
            <p className="ld-lessonName">{course.completedCount} of {course.lessonCount} lessons completed</p>
            <div className="ld-progressBar" aria-hidden="true"><div className="ld-progressBarFill" style={{ width: `${course.progressPercent ?? 0}%` }} /></div>
          </div>
          {course.nextLesson && (
            <div>
              <p className="ld-mutedLine">Next Lesson</p>
              <Link className="ld-viewLink" to={`/curriculum/lessons/${course.nextLesson.lessonStableKey}`}>{course.nextLesson.title}</Link>
            </div>
          )}
        </section>
        <div className="ld-unitAccordion" style={{ marginTop: 20 }}>
          {course.units.map((unit) => (
            <UnitRow key={unit.stableKey} unit={unit} defaultOpen={unit.stableKey === (course.nextLesson?.unitStableKey ?? course.units[0]?.stableKey)} />
          ))}
        </div>
      </div>

      <div className="ld-dashCol">
        <section className="ld-card ld-railCard">
          <div className="ld-sectionTitleRow">
            <BookIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">Course Progress</h2>
          </div>
          <div className="ld-ring ld-ring--rail" style={{ "--ld-ring-pct": course.progressPercent ?? 0 }} role="img" aria-label={`${course.progressPercent ?? 0}% complete`}>
            <div className="ld-ringInner">
              <span className="ld-ringPct">{course.progressPercent ?? 0}%</span>
            </div>
          </div>
          <p className="ld-lessonName">{course.completedCount} of {course.lessonCount}</p>
          <p className="ld-mutedLine">Lessons completed</p>
        </section>

        <section className="ld-card ld-railCard" style={{ marginTop: 20 }}>
          <div className="ld-sectionTitleRow">
            <LayersIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">Unit Progress</h2>
          </div>
          <ul className="ld-unitProgressList">
            {course.units.map((unit, i) => {
              const pct = unit.totalCount > 0 ? Math.round((unit.completedCount / unit.totalCount) * 100) : 0;
              return (
                <li className="ld-unitProgressRow" key={unit.stableKey}>
                  <span className={`ld-unitProgressIndex${pct === 100 ? " is-complete" : ""}`}>{i + 1}</span>
                  <span className="ld-unitProgressName">{unit.title}</span>
                  <span className="ld-unitProgressPct">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </section>

        {(upcomingAssignment || nextLive) && (
          <section className="ld-card ld-railCard" style={{ marginTop: 20 }}>
            <div className="ld-sectionTitleRow">
              <ClipboardIcon size={20} className="ld-sectionIcon" />
              <h2 className="ld-sectionTitle">Up Next</h2>
            </div>
            {upcomingAssignment && <p className="ld-mutedLine">Next Assignment</p>}
            {upcomingAssignment && <p className="ld-lessonName">{upcomingAssignment.title}</p>}
            {nextLive && <p className="ld-mutedLine" style={{ marginTop: 10 }}>Next Live Session</p>}
            {nextLive && <p className="ld-lessonName"><CalendarIcon size={14} /> {new Date(nextLive.startsAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</p>}
          </section>
        )}
      </div>
    </div>
  );
}
