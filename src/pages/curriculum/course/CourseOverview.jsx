// src/pages/curriculum/course/CourseOverview.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCourseWorkspace } from "./CourseWorkspace.jsx";
import { pickNextLiveSession, assignmentsDueThisWeek } from "@/shared/learning/upNext.js";
import { BookIcon, ClipboardIcon, CalendarIcon, LayersIcon, HeadsetIcon } from "@/components/curriculum/icons.jsx";

function fmtDateTime(iso) {
  return iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) : null;
}

export default function CourseOverview() {
  const { course, assignments, liveSessions } = useCourseWorkspace();
  const nextLive = pickNextLiveSession(liveSessions, {});
  const dueThisWeek = assignmentsDueThisWeek(assignments, {});
  const unitsCompleted = course.units.filter((u) => u.totalCount > 0 && u.completedCount === u.totalCount).length;
  const featuredAssignment = [...assignments]
    .filter((a) => a.accessState !== "COMPLETED" && a.accessState !== "LOCKED")
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))[0];

  return (
    <div className="ld-dashGrid">
      <div className="ld-dashCol">
        <section className="ld-card ld-overviewHero">
          <div className="ld-progressGrid">
            <div className="ld-ring" style={{ "--ld-ring-pct": course.progressPercent ?? 0 }} role="img" aria-label={course.progressPercent === null ? "Course progress not available yet" : `${course.progressPercent}% complete`}>
              <div className="ld-ringInner">
                <span className="ld-ringPct">{course.progressPercent === null ? "—" : `${course.progressPercent}%`}</span>
                <span className="ld-ringLabel">Course Progress</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p className="ld-mutedLine" style={{ marginBottom: 2 }}>Current Unit</p>
              <p className="ld-lessonName" style={{ margin: "0 0 12px" }}>{course.currentUnitTitle || "—"}</p>
              <p className="ld-mutedLine" style={{ marginBottom: 2 }}>Next Lesson</p>
              <p className="ld-lessonName" style={{ margin: "0 0 16px" }}>{course.nextLesson?.title || "You're all caught up"}</p>
              {course.nextLesson ? (
                <Link className="ld-btn ld-btnPrimary" to={`/curriculum/lessons/${course.nextLesson.lessonStableKey}`}>Continue</Link>
              ) : null}
            </div>
            <div className="ld-liveSummary">
              <CalendarIcon size={22} />
              <div>
                <p className="ld-mutedLine" style={{ marginBottom: 2 }}>Live Support</p>
                <p className="ld-lessonName" style={{ margin: 0 }}>{nextLive ? fmtDateTime(nextLive.startsAt) : "None scheduled"}</p>
              </div>
            </div>
          </div>

          <div className="ld-tileRow">
            <div className="ld-tile">
              <LayersIcon size={20} className="ld-tileIcon" />
              <div className="ld-tileValue">{unitsCompleted} / {course.unitCount}</div>
              <div className="ld-tileLabel">Units Completed</div>
            </div>
            <div className="ld-tile">
              <ClipboardIcon size={20} className="ld-tileIcon" />
              <div className="ld-tileValue">{dueThisWeek.length}</div>
              <div className="ld-tileLabel">Assignments Due This Week</div>
            </div>
            <div className="ld-tile">
              <CalendarIcon size={20} className="ld-tileIcon" />
              <div className="ld-tileValue">{nextLive ? fmtDateTime(nextLive.startsAt) : "None scheduled"}</div>
              <div className="ld-tileLabel">Next Live Session</div>
            </div>
            <div className="ld-tile">
              <BookIcon size={20} className="ld-tileIcon" />
              <div className="ld-tileValue">{course.lessonCount}</div>
              <div className="ld-tileLabel">Total Lessons</div>
            </div>
          </div>
        </section>

        <section className="ld-card ld-sectionCard" style={{ marginTop: 20 }}>
          <div className="ld-sectionTitleRow">
            <ClipboardIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">This Week</h2>
          </div>
          {dueThisWeek.length === 0 && !nextLive && course.nextLesson === null ? (
            <p className="ld-mutedLine">Nothing due this week.</p>
          ) : (
            <ul className="ld-scheduleList">
              {course.nextLesson && (
                <li className="ld-scheduleItem">
                  <BookIcon size={18} className="ld-scheduleIcon" />
                  <div><div className="ld-scheduleWhen">Continue</div><div className="ld-scheduleTitle">{course.nextLesson.title}</div></div>
                </li>
              )}
              {dueThisWeek.map((a) => (
                <li className="ld-scheduleItem" key={a.id}>
                  <ClipboardIcon size={18} className="ld-scheduleIcon" />
                  <div><div className="ld-scheduleWhen">Due {new Date(a.dueAt).toLocaleDateString(undefined, { weekday: "short" })}</div><div className="ld-scheduleTitle">{a.title}</div></div>
                </li>
              ))}
              {nextLive && (
                <li className="ld-scheduleItem">
                  <CalendarIcon size={18} className="ld-scheduleIcon" />
                  <div><div className="ld-scheduleWhen">Live Support</div><div className="ld-scheduleTitle">{fmtDateTime(nextLive.startsAt)}</div></div>
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="ld-card ld-sectionCard" style={{ marginTop: 20 }}>
          <div className="ld-sectionTitleRow">
            <LayersIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">Unit Progress</h2>
          </div>
          <ul className="ld-unitProgressList">
            {course.units.map((unit, i) => {
              const pct = unit.totalCount > 0 ? Math.round((unit.completedCount / unit.totalCount) * 100) : 0;
              const complete = unit.totalCount > 0 && unit.completedCount === unit.totalCount;
              return (
                <li className="ld-unitProgressRow" key={unit.stableKey}>
                  <span className={`ld-unitProgressIndex${complete ? " is-complete" : ""}`}>{i + 1}</span>
                  <span className="ld-unitProgressName">{unit.title}</span>
                  <span className="ld-unitProgressPct">{pct}%</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="ld-dashCol">
        <section className="ld-card ld-railCard">
          <div className="ld-sectionTitleRow">
            <BookIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">Up Next</h2>
          </div>
          {course.nextLesson && (
            <div style={{ marginBottom: 10 }}>
              <p className="ld-mutedLine" style={{ marginBottom: 2 }}>Next Lesson</p>
              <Link className="ld-viewLink" to={`/curriculum/lessons/${course.nextLesson.lessonStableKey}`}>{course.nextLesson.title}</Link>
            </div>
          )}
          {nextLive && (
            <div>
              <p className="ld-mutedLine" style={{ marginBottom: 2 }}>Next Live Support</p>
              <p className="ld-lessonName" style={{ margin: 0 }}>{fmtDateTime(nextLive.startsAt)}</p>
            </div>
          )}
          {!course.nextLesson && !nextLive && <p className="ld-mutedLine">You're all caught up.</p>}
        </section>

        {featuredAssignment && (
          <section className="ld-card ld-railCard" style={{ marginTop: 20 }}>
            <div className="ld-sectionTitleRow">
              <ClipboardIcon size={20} className="ld-sectionIcon" />
              <h2 className="ld-sectionTitle">Featured Assignment</h2>
            </div>
            <p className="ld-lessonName" style={{ margin: "0 0 4px" }}>{featuredAssignment.title}</p>
            <p className="ld-mutedLine" style={{ marginBottom: 12 }}>Due {new Date(featuredAssignment.dueAt).toLocaleDateString()}</p>
            <Link className="ld-viewLink" to="/curriculum/asl/assignments">View Assignment</Link>
          </section>
        )}

        <section className="ld-card ld-railCard" style={{ marginTop: 20 }}>
          <div className="ld-sectionTitleRow">
            <HeadsetIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">Need Help?</h2>
          </div>
          <p className="ld-mutedLine" style={{ marginBottom: 12 }}>Get answers from your instructor or join a live support session.</p>
          <Link className="ld-btn ld-btnPrimary" to="/curriculum/live-sessions">
            <HeadsetIcon size={16} /> Join Live Support
          </Link>
        </section>
      </div>
    </div>
  );
}
