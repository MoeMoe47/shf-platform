// src/pages/curriculum/Learning.jsx
//
// SHF Curriculum Phase 5.5 — Learning landing. Course-first replacement
// for the old flat MyLessons.jsx list (still reachable — see
// CurriculumRoutes.jsx, which now redirects /curriculum/lessons here).
// Every number on this page comes from real backend data: listMyCourses
// (-> student-catalog-service.ts), listAssignments, listLiveSessions.
// src/shared/learning/upNext.js is the ONE place that merges those three
// already-real sources into "Continue Learning" / "Up Next" — this page
// never derives progress or next-work itself.
import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { listMyCourses } from "@/lib/curriculum/learningApi.js";
import { listAssignments } from "@/lib/assignments/api.js";
import { listLiveSessions } from "@/lib/liveLearning/api.js";
import { buildUpNext, assignmentsDueThisWeek } from "@/shared/learning/upNext.js";
import { BookIcon, ClipboardIcon, CalendarIcon, ChevronRightIcon, ArrowRightIcon, LayersIcon } from "@/components/curriculum/icons.jsx";

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
}
function fmtDateTime(iso) {
  return iso ? new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) : null;
}
function courseTone(course) {
  const title = String(course?.title || "").toLowerCase();
  if (title.includes("design")) return "design";
  if (title.includes("ai") || title.includes("operation")) return "ops";
  return "foundation";
}

export default function Learning() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, error: null, courses: [], assignments: [], liveSessions: [] });

  React.useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([
      listMyCourses(role),
      listAssignments(role),
      listLiveSessions(role),
    ]).then(([courseRes, assignmentRes, liveRes]) => {
      if (!active) return;
      setState({ loading: false, error: null, courses: courseRes?.items || [], assignments: assignmentRes?.items || [], liveSessions: liveRes?.items || [] });
    }).catch((error) => {
      if (!active) return;
      setState({ loading: false, error, courses: [], assignments: [], liveSessions: [] });
    });
    return () => {
      active = false;
    };
  }, [role]);

  const { courses, assignments, liveSessions, loading, error } = state;

  // "Continue Learning" = the entitled course with real in-progress work
  // (a lesson already started but not finished); falls back to the first
  // entitled course with an actionable next lesson. Never a fabricated
  // pick when no course qualifies.
  const continueCourse = React.useMemo(() => {
    const inProgress = courses.find((c) => c.completedCount > 0 && c.completedCount < c.lessonCount);
    return inProgress || courses.find((c) => c.nextLesson) || null;
  }, [courses]);

  const upNext = buildUpNext({ assignments, liveSessions, course: continueCourse });
  const dueThisWeek = continueCourse ? assignmentsDueThisWeek(assignments, { courseStableKey: continueCourse.stableKey }) : [];
  const hasUpNext = upNext.nextLesson || upNext.nextAssignment || upNext.nextLive;

  return (
    <div className="ld-dashGrid">
      <div className="ld-dashCol">
        <section className="ld-card ld-sectionCard" aria-labelledby="ld-continue-h">
          <div className="ld-sectionTitleRow">
            <BookIcon size={22} className="ld-sectionIcon" />
            <h2 id="ld-continue-h" className="ld-sectionTitle">Continue Learning</h2>
          </div>
          {loading ? (
            <p className="ld-mutedLine" role="status">Loading your courses…</p>
          ) : error ? (
            <p className="ld-mutedLine" role="alert">Learning is unavailable right now. Please try again.</p>
          ) : !continueCourse ? (
            <div className="ld-emptyState">
              <p className="ld-emptyStateTitle">You don't have an active course yet.</p>
              <p className="ld-mutedLine">Once you're assigned coursework, it will show up here.</p>
            </div>
          ) : (
            <div className="ld-featureCard ld-featureCard--learning">
              <div className={`ld-featureMedia is-${courseTone(continueCourse)}`} aria-hidden="true">
                <span className="ld-dataCenterGlyph"><span /><span /><span /></span>
              </div>
              <div className="ld-featureBody">
                <p className="ld-contextLabel">{continueCourse.title}</p>
                <h3 className="ld-featureTitle">{continueCourse.currentUnitTitle || continueCourse.title}</h3>
                {continueCourse.nextLesson && (
                  <p className="ld-nextLessonLine">
                    <span>Next Lesson</span>
                    <Link to={`/curriculum/lessons/${continueCourse.nextLesson.lessonStableKey}`}>{continueCourse.nextLesson.title}</Link>
                  </p>
                )}
                {continueCourse.progressPercent !== null && (
                  <div className="ld-progressRow">
                    <div className="ld-progressBar"><div className="ld-progressBarFill" style={{ width: `${continueCourse.progressPercent}%` }} /></div>
                    <span className="ld-progressPct">{continueCourse.progressPercent}%</span>
                  </div>
                )}
                <div className="ld-courseMetaRow">
                  {dueThisWeek.length > 0 && (
                    <span><ClipboardIcon size={15} /> {dueThisWeek.length} assignment{dueThisWeek.length === 1 ? "" : "s"} due this week</span>
                  )}
                  {upNext.nextLive && <span><CalendarIcon size={15} /> Live support {fmtDateTime(upNext.nextLive.startsAt)}</span>}
                </div>
                <Link className="ld-btn ld-btnPrimary ld-featureAction" to={`/curriculum/courses/${continueCourse.stableKey}`}>
                  Continue <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="ld-card ld-sectionCard" aria-labelledby="ld-yourcourses-h" style={{ marginTop: 20 }}>
          <div className="ld-sectionTitleRow">
            <BookIcon size={22} className="ld-sectionIcon" />
            <h2 id="ld-yourcourses-h" className="ld-sectionTitle">Your Courses</h2>
          </div>
          {loading ? (
            <p className="ld-mutedLine" role="status">Loading your courses…</p>
          ) : courses.length === 0 ? (
            <div className="ld-emptyState">
              <p className="ld-emptyStateTitle">You don't have an active course yet.</p>
            </div>
          ) : (
            <div className="ld-courseGrid">
              {courses.map((course) => {
                const dueForCourse = assignmentsDueThisWeek(assignments, { courseStableKey: course.stableKey });
                const liveForCourse = liveSessions
                  .filter((s) => s.courseId === course.stableKey && (s.status === "scheduled" || s.status === "open"))
                  .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
                return (
                  <article key={course.courseId} className="ld-card ld-courseCard">
                    <div className={`ld-courseCardMedia is-${courseTone(course)}`} aria-hidden="true">
                      <span className="ld-courseStageBadge">{course.completedCount > 0 ? "Explore" : "Start"}</span>
                      <span className="ld-dataCenterGlyph ld-dataCenterGlyph--small"><span /><span /><span /></span>
                    </div>
                    <div className="ld-courseIconBubble"><LayersIcon size={24} /></div>
                    <h3 className="ld-courseTitle">{course.title}</h3>
                    <p className="ld-courseMeta">{course.unitCount} Unit{course.unitCount === 1 ? "" : "s"} · {course.lessonCount} Lesson{course.lessonCount === 1 ? "" : "s"}</p>
                    {course.progressPercent !== null ? (
                      <div className="ld-progressRow">
                        <div className="ld-progressBar"><div className="ld-progressBarFill" style={{ width: `${course.progressPercent}%` }} /></div>
                        <span className="ld-progressPct">{course.progressPercent}%</span>
                      </div>
                    ) : (
                      <p className="ld-mutedLine">Not started</p>
                    )}
                    {course.nextLesson && <p className="ld-nextLessonLine is-card"><span>Next Lesson</span><Link to={`/curriculum/lessons/${course.nextLesson.lessonStableKey}`}>{course.nextLesson.title}</Link></p>}
                    <div className="ld-courseMetaRow">
                      {dueForCourse.length > 0 && <span><ClipboardIcon size={14} /> {dueForCourse.length} due this week</span>}
                      {liveForCourse[0] && <span><CalendarIcon size={14} /> Live {fmtDate(liveForCourse[0].startsAt)}</span>}
                    </div>
                    <div className="ld-courseFooter">
                      <Link className="ld-btn ld-btnPrimary" style={{ width: "100%" }} to={`/curriculum/courses/${course.stableKey}`}>
                        {course.completedCount > 0 ? "Continue" : "Start Course"}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="ld-dashCol">
        <section className="ld-card ld-railCard" aria-labelledby="ld-upnext-h">
          <div className="ld-sectionTitleRow">
            <BookIcon size={20} className="ld-sectionIcon" />
            <h2 id="ld-upnext-h" className="ld-sectionTitle">Up Next</h2>
          </div>
          {loading ? (
            <p className="ld-mutedLine" role="status">Loading…</p>
          ) : !hasUpNext ? (
            <p className="ld-mutedLine">You're all caught up.</p>
          ) : (
            <ul className="ld-scheduleList">
              {upNext.nextLesson && (
                <li className="ld-scheduleItem">
                  <BookIcon size={18} className="ld-scheduleIcon" />
                  <div>
                    <div className="ld-scheduleWhen">Next Lesson</div>
                    <div className="ld-scheduleTitle">{upNext.nextLesson.title}</div>
                  </div>
                </li>
              )}
              {upNext.nextAssignment && (
                <li className="ld-scheduleItem">
                  <ClipboardIcon size={18} className="ld-scheduleIcon" />
                  <div>
                    <div className="ld-scheduleWhen">Due {fmtDate(upNext.nextAssignment.dueAt)}</div>
                    <div className="ld-scheduleTitle">{upNext.nextAssignment.title}</div>
                  </div>
                </li>
              )}
              {upNext.nextLive && (
                <li className="ld-scheduleItem">
                  <CalendarIcon size={18} className="ld-scheduleIcon" />
                  <div>
                    <div className="ld-scheduleWhen">{fmtDateTime(upNext.nextLive.startsAt)}</div>
                    <div className="ld-scheduleTitle">{upNext.nextLive.title}</div>
                  </div>
                </li>
              )}
            </ul>
          )}
          <Link className="ld-viewLink" style={{ marginTop: 14 }} to="/curriculum/asl/calendar">
            View Full Calendar <ChevronRightIcon size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}
