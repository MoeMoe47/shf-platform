// src/pages/curriculum/calendar/TodayPanel.jsx
//
// Today's events, chronologically, with real contextual actions. Live
// sessions call the real, server-authorized requestJoin() (see
// src/lib/liveLearning/api.js) rather than opening a fabricated link —
// join/deny is decided by the backend, never assumed here. Every other
// action is a real in-app route from the event's own `route` field.
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { requestJoin } from "@/lib/liveLearning/api.js";
import { EVENT_TYPE_META } from "@/pages/career/calendar/eventContract.js";
import { formatDayLabel, formatTime, parseLocalDate, startOfDay, isSameDay } from "@/pages/career/calendar/dateUtils.js";

// Wave 2A Live Learning metadata completion — real provider label (the
// only genuinely new, safe-to-surface field found by the audit; instructor
// name resolution and post-session recording links stay deferred, see the
// Wave 2A report's §12 — no instructor-lookup endpoint or recording-exists
// signal exists yet to source them from honestly).
const PROVIDER_LABELS = { mock: "Practice session", zoom: "Zoom" };
function providerLabel(evt) {
  if (evt.type !== "instructor") return null;
  return PROVIDER_LABELS[evt.metadata?.provider] || null;
}

function actionLabelFor(evt) {
  if (evt.type === "instructor") return "Join";
  if (evt.type === "lesson") return "Continue";
  if (evt.type === "assignment") return "Submit";
  if (evt.route) return "View";
  return null;
}

function JoinButton({ event, role }) {
  const [state, setState] = React.useState({ status: "idle", message: "" }); // idle | joining | denied

  async function handleJoin() {
    const liveSessionId = event.metadata?.liveSessionId;
    if (!liveSessionId) {
      setState({ status: "denied", message: "This session can't be joined yet." });
      return;
    }
    setState({ status: "joining", message: "" });
    try {
      const result = await requestJoin(role, liveSessionId);
      if (result?.allowed && result?.launchUrl) {
        window.open(result.launchUrl, "_blank", "noopener");
        setState({ status: "idle", message: "" });
      } else {
        setState({ status: "denied", message: result?.reason || "Join isn't available right now." });
      }
    } catch (err) {
      setState({ status: "denied", message: err?.message || "Couldn't reach Live Learning." });
    }
  }

  return (
    <div className="lc-todayAction">
      <button type="button" className="lc-todayActionBtn" onClick={handleJoin} disabled={state.status === "joining"}>
        {state.status === "joining" ? "Joining…" : "Join"}
      </button>
      {state.status === "denied" && <span className="lc-todayActionNote">{state.message}</span>}
    </div>
  );
}

export default function TodayPanel({ events, today, onOpenEvent, onViewAgenda }) {
  const { role } = useUser();
  const todayEvents = React.useMemo(() => {
    const start = startOfDay(today);
    return events
      .filter((evt) => {
        const d = parseLocalDate(evt.start);
        return d && isSameDay(startOfDay(d), start);
      })
      .sort((a, b) => parseLocalDate(a.start) - parseLocalDate(b.start));
  }, [events, today]);

  return (
    <section className="lc-railCard lc-todayCard" aria-labelledby="lc-today-title">
      <div className="lc-railCardHead">
        <h2 id="lc-today-title" className="lc-railCardTitle">
          Today <span className="lc-railCardSub">· {formatDayLabel(today)}</span>
        </h2>
        {onViewAgenda && (
          <button type="button" className="lc-railViewAll" onClick={onViewAgenda}>
            View agenda
          </button>
        )}
      </div>

      {todayEvents.length === 0 ? (
        <p className="lc-railEmpty">You're clear today. Review upcoming work or explore opportunities.</p>
      ) : (
        <ul className="lc-todayList">
          {todayEvents.map((evt) => {
            const meta = EVENT_TYPE_META[evt.type];
            const label = actionLabelFor(evt);
            return (
              <li key={evt.id} className="lc-todayItem">
                <button type="button" className="lc-todayItemMain" onClick={() => onOpenEvent(evt)}>
                  <span className="lc-todayTime">{evt.allDay ? "All day" : formatTime(evt.start)}</span>
                  <span className="lc-todayBody">
                    <span className="lc-todayTitle">
                      <span className="lc-typeDot" style={{ "--chip-color": `var(${meta.colorVar})` }} aria-hidden="true" />
                      {evt.title}
                    </span>
                    {evt.organizer && (
                      <span className="lc-todayMeta">
                        With {evt.organizer}
                        {providerLabel(evt) ? ` · ${providerLabel(evt)}` : ""}
                      </span>
                    )}
                  </span>
                </button>
                {evt.type === "instructor" ? (
                  <JoinButton event={evt} role={role} />
                ) : label && evt.route ? (
                  <a className="lc-todayActionBtn" href={`/curriculum.html#${evt.route}`}>
                    {label}
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
