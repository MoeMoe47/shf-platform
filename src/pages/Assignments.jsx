// src/pages/Assignments.jsx
//
// SHF Curriculum Phase 5.5 rework of the Phase 3 Assignments page —
// same real backend data (listAssignments -> assignment-entitlement-
// service.ts), now presented per the approved mock: Needs Your
// Attention, status tabs, and Upcoming Deadlines / Upcoming Live Session
// side cards. This page only renders what the server already computed;
// it never derives or mutates completion/access state itself.
//
// One deliberate, disclosed deviation from the mock: the backend's real
// accessState is LOCKED/AVAILABLE/IN_PROGRESS/OVERDUE/COMPLETED — there
// is no post-submission review-lifecycle domain (see assignment.ts's own
// comment on computeDueState). Status tabs below map to real states (To
// Do/In Progress/Completed) rather than inventing that lifecycle.
import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { listAssignments } from "@/lib/assignments/api.js";
import { listLiveSessions } from "@/lib/liveLearning/api.js";
import AssignmentRow, { ACCESS_STATE_LABEL, breadcrumbFor, nextLessonHref } from "@/components/curriculum/AssignmentRow.jsx";
import { pickNextLiveSession } from "@/shared/learning/upNext.js";
import { ClipboardIcon, HeadsetIcon, CalendarIcon, ChevronRightIcon } from "@/components/curriculum/icons.jsx";

const TABS = [
  { key: "AVAILABLE", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
];

const TYPE_LABEL = { assignment: "Assignment", quiz: "Quiz", reflection: "Reflection", artifact: "Artifact" };
function daysUntil(iso) {
  if (!iso) return null;
  const day = 86_400_000;
  const due = new Date(iso);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dueStart = new Date(due);
  dueStart.setHours(0, 0, 0, 0);
  return Math.round((dueStart.getTime() - todayStart.getTime()) / day);
}
function urgencyText(iso) {
  const days = daysUntil(iso);
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export default function Assignments() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, error: null, items: [], liveSessions: [] });
  const [activeTab, setActiveTab] = React.useState("AVAILABLE");

  React.useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([listAssignments(role), listLiveSessions(role).catch(() => ({ items: [] }))])
      .then(([assignmentRes, liveRes]) => {
        if (active) setState({ loading: false, error: null, items: assignmentRes?.items || [], liveSessions: liveRes?.items || [] });
      })
      .catch((error) => {
        if (active) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      active = false;
    };
  }, [role]);

  const { loading, error, items, liveSessions } = state;
  const counts = {
    AVAILABLE: items.filter((a) => a.accessState === "AVAILABLE").length,
    IN_PROGRESS: items.filter((a) => a.accessState === "IN_PROGRESS").length,
    COMPLETED: items.filter((a) => a.accessState === "COMPLETED").length,
  };
  const visibleItems = items.filter((a) => a.accessState === activeTab);
  const needsAttention = items
    .filter((a) => a.accessState === "AVAILABLE" || a.accessState === "OVERDUE")
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 3);
  const upcomingDeadlines = items
    .filter((a) => a.accessState !== "COMPLETED" && a.accessState !== "LOCKED")
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5);
  const nextLive = pickNextLiveSession(liveSessions, {});

  return (
    <div className="ld-dashGrid">
      <div className="ld-dashCol">
        <section className="ld-card ld-sectionCard" aria-labelledby="ld-attention-h">
          <div className="ld-sectionTitleRow">
            <ClipboardIcon size={22} className="ld-sectionIcon" />
            <h2 id="ld-attention-h" className="ld-sectionTitle">Needs Your Attention</h2>
          </div>
          {loading ? (
            <p className="ld-mutedLine" role="status">Loading assignments…</p>
          ) : needsAttention.length === 0 ? (
            <p className="ld-mutedLine">You're caught up.</p>
          ) : (
            <div className="ld-attentionGrid">
              {needsAttention.map((a) => {
                const crumb = breadcrumbFor(a);
                const href = nextLessonHref(a);
                return (
                  <article className="ld-attentionCard" key={a.id}>
                    <div className="ld-attentionTop">
                      <span className={`ld-typePill is-${a.assignmentType}`}>{TYPE_LABEL[a.assignmentType] || a.assignmentType}</span>
                      <span className={`ld-workThumb is-${a.assignmentType}`} aria-hidden="true"><ClipboardIcon size={22} /></span>
                    </div>
                    <p className="ld-lessonName">{a.title}</p>
                    {crumb.length > 0 && <p className="ld-mutedLine" style={{ margin: "0 0 4px" }}>{crumb.join(" › ")}</p>}
                    <div className="ld-courseMetaRow" style={{ marginTop: 0 }}>
                      <span><CalendarIcon size={15} /> Due {new Date(a.dueAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="ld-urgencyPill">{urgencyText(a.dueAt)}</span>
                    </div>
                    {a.progress?.total > 0 && (
                      <div className="ld-progressRow" style={{ marginTop: 10, marginBottom: 0 }}>
                        <div className="ld-progressBar"><div className="ld-progressBarFill" style={{ width: `${Math.round((a.progress.completed / a.progress.total) * 100)}%` }} /></div>
                        <span className="ld-progressPct">{a.progress.completed}/{a.progress.total}</span>
                      </div>
                    )}
                    {href && <Link className="ld-iconAction ld-attentionAction" to={href} aria-label={`Open ${a.title}`}><ChevronRightIcon size={16} /></Link>}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="ld-card ld-sectionCard" style={{ marginTop: 20 }}>
          <div className="ld-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={activeTab === t.key} className={`ld-tab${activeTab === t.key ? " is-active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label} ({counts[t.key]})
              </button>
            ))}
          </div>
          {loading ? (
            <p className="ld-mutedLine" role="status">Loading assignments…</p>
          ) : error ? (
            <p className="ld-mutedLine" role="alert">Assignments are unavailable right now.</p>
          ) : visibleItems.length === 0 ? (
            <p className="ld-mutedLine">No assignments here.</p>
          ) : (
            <>
              <div className="ld-workHeader" aria-hidden="true">
                <span>Assignment</span><span>Type</span><span>Due Date</span><span>Status</span><span>Progress</span><span></span>
              </div>
              <ul className="ld-workList">
              {visibleItems.map((a) => <AssignmentRow key={a.id} assignment={a} />)}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="ld-dashCol">
        <section className="ld-card ld-railCard">
          <div className="ld-sectionTitleRow">
            <CalendarIcon size={20} className="ld-sectionIcon" />
            <h2 className="ld-sectionTitle">Upcoming Deadlines</h2>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="ld-mutedLine">Nothing due.</p>
          ) : (
            <ul className="ld-scheduleList">
              {upcomingDeadlines.map((a) => (
                <li className="ld-deadlineItem" key={a.id}>
                  <span className="ld-dateTile"><b>{new Date(a.dueAt).toLocaleDateString(undefined, { month: "short" })}</b>{new Date(a.dueAt).toLocaleDateString(undefined, { day: "numeric" })}</span>
                  <div>
                    <div className="ld-scheduleTitle">{a.title}</div>
                    <div className="ld-scheduleWhen">{urgencyText(a.dueAt)} · {ACCESS_STATE_LABEL[a.accessState]}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {nextLive && (
          <section className="ld-card ld-railCard ld-livePromo" style={{ marginTop: 20 }}>
            <div className="ld-sectionTitleRow">
              <HeadsetIcon size={20} className="ld-sectionIcon" />
              <h2 className="ld-sectionTitle">Upcoming Live Session</h2>
            </div>
            <p className="ld-lessonName" style={{ margin: "0 0 4px" }}>{nextLive.title}</p>
            <p className="ld-mutedLine" style={{ marginBottom: 12 }}>{new Date(nextLive.startsAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</p>
            <Link className="ld-btn ld-btnPrimary" to="/curriculum/live-sessions"><HeadsetIcon size={16} /> View</Link>
          </section>
        )}
      </div>
    </div>
  );
}
