// src/pages/curriculum/LiveSessions.jsx
//
// Phase 1 (SHF Curriculum Infrastructure Audit §28-30) reconnected the
// real, existing request/approval flow (src/utils/zoomAccess.js) and
// ZoomCard.jsx to a reachable route, with no real meeting provider
// connected — left completely unchanged below (behavior-identical,
// still explicitly DISPLAY/CACHE ONLY, never a real join grant).
//
// Phase 2A added the real, server-authorized session list + join flow
// via src/lib/liveLearning/api.js. Phase 5.5 (this rework) presents that
// same real data per the approved mock: Next Live Session, Today, This
// Week, Past Sessions, and a This Week's Schedule / Upcoming Support side
// column — no new data source, no fabricated instructor/attendance/
// recording details beyond what StudentFacingLiveSession actually
// carries. "Upcoming Support" only renders when a real session's title
// matches an office-hours/study-group pattern — there is no real
// session "type" field, so this is disclosed pattern-matching, not a
// fabricated taxonomy.
import React from "react";
import { Link } from "react-router-dom";
import ZoomCard from "@/components/ZoomCard.jsx";
import { requestZoomAccess, hasZoomAccess } from "@/utils/zoomAccess.js";
import { useUser } from "@/context/UserContext.jsx";
import { listLiveSessions } from "@/lib/liveLearning/api.js";
import LiveSessionCard from "@/components/curriculum/LiveSessionCard.jsx";
import { CalendarIcon, HeadsetIcon, ClipboardIcon, BookIcon, VideoIcon } from "@/components/curriculum/icons.jsx";

const SUPPORT_PATTERN = /office hours|study group/i;

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}
function startsIn(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Starting now";
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return `Starts in ${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.max(1, Math.round(diff / 3_600_000));
  return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
}

export default function LiveSessions() {
  const { email, role } = useUser();
  const userId = email || "local-student";
  const [approved, setApproved] = React.useState(() => hasZoomAccess(userId));
  const [requested, setRequested] = React.useState(false);
  const [sessions, setSessions] = React.useState([]);
  const [loadError, setLoadError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key || e.key.includes("zoom:")) setApproved(hasZoomAccess(userId));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    listLiveSessions(role)
      .then(({ items }) => { if (alive) { setSessions(items || []); setLoadError(null); } })
      .catch((err) => { if (alive) setLoadError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [role]);

  function handleRequest() {
    requestZoomAccess({ userId, name: userId });
    setRequested(true);
  }

  const now = Date.now();
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const endOfToday = new Date().setHours(23, 59, 59, 999);
  const weekOut = now + 7 * 86_400_000;

  const upcoming = sessions.filter((s) => (s.status === "scheduled" || s.status === "open") && new Date(s.startsAt).getTime() >= now).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const next = upcoming[0] || null;
  const today = upcoming.filter((s) => { const t = new Date(s.startsAt).getTime(); return t >= startOfToday && t <= endOfToday; });
  const thisWeek = upcoming.filter((s) => { const t = new Date(s.startsAt).getTime(); return t > endOfToday && t <= weekOut; });
  const past = sessions.filter((s) => s.status === "completed" || (new Date(s.endsAt).getTime() < now && s.status !== "cancelled")).sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt)).slice(0, 5);
  const supportSessions = upcoming.filter((s) => SUPPORT_PATTERN.test(`${s.title} ${s.description || ""}`)).slice(0, 3);

  return (
    <div className="ld-dashGrid">
      <div className="ld-dashCol">
        {loading ? (
          <section className="ld-card"><p className="ld-mutedLine" role="status">Loading live sessions…</p></section>
        ) : loadError ? (
          <section className="ld-card"><p className="ld-mutedLine" role="alert">Live Learning is unavailable right now.</p></section>
        ) : (
          <>
            <section className="ld-card ld-sectionCard" id="next-live-session" aria-labelledby="ld-next-live-h">
              <div className="ld-featureEyebrow">
                <div className="ld-sectionTitleRow">
                  <CalendarIcon size={22} className="ld-sectionIcon" />
                  <h2 id="ld-next-live-h" className="ld-sectionTitle">Next Live Session</h2>
                </div>
                {next && <span className="ld-urgencyPill">{startsIn(next.startsAt)}</span>}
              </div>
              {!next ? (
                <div className="ld-emptyState">
                  <p className="ld-emptyStateTitle">No live sessions are scheduled.</p>
                </div>
              ) : (
                <div className="ld-featureCard ld-featureCard--live">
                  <div className="ld-featureMedia is-live" aria-hidden="true">
                    <span className="ld-dataCenterGlyph"><span /><span /><span /></span>
                  </div>
                  <div className="ld-featureBody">
                    {next.courseId && <p className="ld-contextLabel">{next.courseId}</p>}
                    <h3 className="ld-featureTitle">{next.title}</h3>
                    <p className="ld-sessionTime"><CalendarIcon size={16} /> {fmtDateTime(next.startsAt)} - {fmtDateTime(next.endsAt)}</p>
                    <div className="ld-personRow">
                      <span className="ld-personAvatar" aria-hidden="true">I</span>
                      <span><span className="ld-personLabel">Instructor</span><span className="ld-personName">{next.instructorId || "Instructor"}</span></span>
                    </div>
                    <div className="ld-relatedGrid">
                      {next.lessonId && <span><BookIcon size={16} /> Related Lesson <b>{next.lessonId}</b></span>}
                      {next.moduleId && <span><ClipboardIcon size={16} /> Related Unit <b>{next.moduleId}</b></span>}
                    </div>
                    <LiveSessionCard session={next} role={role} compact />
                  </div>
                </div>
              )}
            </section>

            <section className="ld-card ld-sectionCard" style={{ marginTop: 20 }}>
              <div className="ld-sectionTitleRow"><VideoIcon size={20} className="ld-sectionIcon" /><h2 className="ld-sectionTitle">Today</h2></div>
              {today.length === 0 ? <p className="ld-mutedLine">No sessions today.</p> : (
                <ul className="ld-sessionList">{today.map((s) => <LiveSessionCard key={s.id} session={s} role={role} />)}</ul>
              )}
            </section>

            <section className="ld-card ld-sectionCard" style={{ marginTop: 20 }}>
              <div className="ld-sectionTitleRow"><CalendarIcon size={20} className="ld-sectionIcon" /><h2 className="ld-sectionTitle">This Week</h2></div>
              {thisWeek.length === 0 ? <p className="ld-mutedLine">Nothing else scheduled this week.</p> : (
                <ul className="ld-sessionList">{thisWeek.map((s) => <LiveSessionCard key={s.id} session={s} role={role} />)}</ul>
              )}
            </section>

            <section className="ld-card ld-sectionCard" style={{ marginTop: 20 }}>
              <div className="ld-sectionTitleRow"><VideoIcon size={20} className="ld-sectionIcon" /><h2 className="ld-sectionTitle">Past Sessions</h2></div>
              {past.length === 0 ? <p className="ld-mutedLine">No past sessions yet.</p> : (
                <ul className="ld-sessionList">{past.map((s) => <LiveSessionCard key={s.id} session={s} role={role} />)}</ul>
              )}
            </section>
          </>
        )}

        <details className="ld-card ld-legacyAccess" style={{ marginTop: 20 }}>
          <summary>Legacy access request</summary>
          <p className="ld-mutedLine" style={{ marginTop: 10 }}>
            {approved ? "Approved — you can check in below." : requested ? "Request sent — waiting on instructor/admin approval." : "You have not requested access yet."}
          </p>
          {!approved && (
            <button className="ld-btn" style={{ marginTop: 10 }} onClick={handleRequest} disabled={requested}>
              {requested ? "Request sent" : "Request access"}
            </button>
          )}
          <div style={{ marginTop: 14 }}><ZoomCard /></div>
        </details>
      </div>

      <div className="ld-dashCol">
        <section className="ld-card ld-railCard">
          <div className="ld-sectionTitleRow"><CalendarIcon size={20} className="ld-sectionIcon" /><h2 className="ld-sectionTitle">This Week's Schedule</h2></div>
          {upcoming.length === 0 ? <p className="ld-mutedLine">Nothing scheduled.</p> : (
            <ul className="ld-scheduleList">
              {upcoming.slice(0, 5).map((s) => (
                <li className="ld-scheduleItem" key={s.id}>
                  <CalendarIcon size={18} className="ld-scheduleIcon" />
                  <div><div className="ld-scheduleWhen">{fmtDateTime(s.startsAt)}</div><div className="ld-scheduleTitle">{s.title}</div></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {supportSessions.length > 0 && (
          <section className="ld-card ld-railCard" style={{ marginTop: 20 }}>
            <div className="ld-sectionTitleRow"><HeadsetIcon size={20} className="ld-sectionIcon" /><h2 className="ld-sectionTitle">Upcoming Support</h2></div>
            {supportSessions.map((s) => (
              <div className="ld-supportCard" key={s.id}>
                <p className="ld-lessonName" style={{ margin: "0 0 4px" }}>{s.title}</p>
                <p className="ld-mutedLine" style={{ marginBottom: 10 }}>{fmtDateTime(s.startsAt)}</p>
                <Link className="ld-viewLink" to="#next-live-session"><HeadsetIcon size={14} /> Details above</Link>
              </div>
            ))}
          </section>
        )}

        <section className="ld-card ld-railCard" style={{ marginTop: 20 }}>
          <div className="ld-sectionTitleRow"><HeadsetIcon size={20} className="ld-sectionIcon" /><h2 className="ld-sectionTitle">Can't make a session?</h2></div>
          <p className="ld-mutedLine">Check lesson resources or watch the recording when it is available.</p>
          {(role === "admin" || role === "instructor") && (
            <p className="ld-mutedLine" style={{ marginTop: 10 }}>
              <Link to="/curriculum/live-sessions/admin">Manage access →</Link>
              <br />
              <Link to="/curriculum/live-sessions/manage">Manage sessions →</Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
