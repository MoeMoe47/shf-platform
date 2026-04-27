import React, { useEffect, useMemo, useState } from "react";
import { agendaItems } from "../data/dashboardData";
import {
  goToExchangeRoute,
  openDashboardPanel,
  readAgendaItems,
  readCommandActionEvents,
  readWorkspaceReports,
  formatCommandActivityTime,
} from "../dashboardUtils";

export default function RightStack() {
  const [liveAgendaItems, setLiveAgendaItems] = useState(() => readAgendaItems());
  const [liveReports, setLiveReports] = useState(() => readWorkspaceReports());
  const [liveCommandActions, setLiveCommandActions] = useState(() => readCommandActionEvents());

  useEffect(() => {
    function handleAgendaUpdate(event) {
      if (Array.isArray(event.detail)) setLiveAgendaItems(event.detail);
    }

    function handleReportsUpdate(event) {
      if (Array.isArray(event.detail)) setLiveReports(event.detail);
    }

    function handleCommandActionUpdate() {
      setLiveCommandActions(readCommandActionEvents());
    }

    window.addEventListener("shsDash:agendaUpdated", handleAgendaUpdate);
    window.addEventListener("shsDash:reportsUpdated", handleReportsUpdate);
    window.addEventListener("shsCommandActionEvent:created", handleCommandActionUpdate);
    window.addEventListener("storage", handleCommandActionUpdate);

    return () => {
      window.removeEventListener("shsDash:agendaUpdated", handleAgendaUpdate);
      window.removeEventListener("shsDash:reportsUpdated", handleReportsUpdate);
      window.removeEventListener("shsCommandActionEvent:created", handleCommandActionUpdate);
      window.removeEventListener("storage", handleCommandActionUpdate);
    };
  }, []);

  const agendaRows = useMemo(() => {
    if (liveAgendaItems.length) {
      return liveAgendaItems.slice(0, 3).map((item) => [
        item.type === "Conference"
          ? "🎥"
          : item.type === "Deadline"
            ? "🛡"
            : item.type === "Review"
              ? "📅"
              : "📅",
        item.title,
        `${item.date || "Today"} · ${item.time || "Time TBD"}`,
        item.status || "Scheduled",
        item.priority === "High" ? "orange" : "teal",
      ]);
    }

    return agendaItems;
  }, [liveAgendaItems]);

  const reportRows = useMemo(() => {
    if (liveReports.length) {
      return liveReports.slice(0, 3).map((report) => [
        report.title || "Untitled Report",
        report.format || "PDF",
      ]);
    }

    return [
      ["Operational Summary – May 2025", "PDF"],
      ["Provider Verification Trend Report", "PDF"],
      ["Contradictions Analysis – Q2", "XLSX"],
    ];
  }, [liveReports]);

  function openCommandContext(context) {
    if (typeof window !== "undefined") {
      localStorage.setItem("shs.commandContext", JSON.stringify({
        ...context,
        openedFrom: "workspace-dashboard",
        openedAt: new Date().toISOString(),
      }));
    }

    goToExchangeRoute("/exchange/command");
  }

  return (
    <aside className="shsDash-rightStack">
      <section className="shsDash-card shsDash-sideCard">
        <div className="shsDash-sectionHead">
          <h2>🔔 Notifications</h2>
          <button type="button">View All →</button>
        </div>

        <button
          className="shsDash-notice shsDash-noticeButton is-orange"
          type="button"
          onClick={() => openCommandContext({
            kind: "contradiction_review",
            county: "Franklin County",
            title: "Contradiction Review Needed",
            summary: "3 new contradictions require review in Franklin County dataset.",
            priority: "High",
            recommendedAction: "Open Oracle Truth Package and review contradiction state.",
          })}
        >
          <span>⚠</span>
          <div>
            <strong>Contradiction Review Needed</strong>
            <p>3 new contradictions require review in Franklin County dataset.</p>
          </div>
          <small>10:24 AM</small>
        </button>

        <button
          className="shsDash-notice shsDash-noticeButton is-violet"
          type="button"
          onClick={() => openCommandContext({
            kind: "report_ready",
            county: "Statewide",
            title: "Report Ready",
            summary: "Monthly Operational Summary Report is ready for download.",
            priority: "Normal",
            recommendedAction: "Review reporting readiness and export package.",
          })}
        >
          <span>✦</span>
          <div>
            <strong>Report Ready</strong>
            <p>Monthly Operational Summary Report is ready for download.</p>
          </div>
          <small>8:07 AM</small>
        </button>
      </section>

      <section className="shsDash-card shsDash-sideCard shsDash-agendaCard">
        <div className="shsDash-sectionHead">
          <h2>📅 Today’s Agenda</h2>
          <button type="button" onClick={() => openDashboardPanel("Calendar")}>
            Open Calendar →
          </button>
        </div>

        {agendaRows.map(([icon, title, time, status, tone]) => (
          <article className="shsDash-agendaRow" key={`${title}-${time}`}>
            <span className={`shsDash-glow--${tone}`}>{icon}</span>
            <div>
              <strong>{title}</strong>
              <small>{time}</small>
            </div>
            <b>{status}</b>
          </article>
        ))}

        <button className="shsDash-addTask" type="button">
          + Schedule Meeting
        </button>
      </section>


      <section className="shsDash-card shsDash-sideCard shsDash-commandActivityCard">
        <div className="shsDash-sectionHead">
          <h2>⚡ Recent Command Activity</h2>
          <button type="button" onClick={() => openDashboardPanel("Activity")}>
            View All →
          </button>
        </div>

        {liveCommandActions.length ? (
          liveCommandActions.slice(0, 3).map((event) => (
            <article className="shsDash-commandActivityRow" key={event.id}>
              <span>{event.icon || "✓"}</span>
              <div>
                <strong>{event.title || "Command action logged"}</strong>
                <small>
                  {event.status || "confirmed"} · {formatCommandActivityTime(event.createdAt)}
                </small>
              </div>
              <b>{event.confidence || "Logged"}</b>
            </article>
          ))
        ) : (
          <article className="shsDash-commandActivityEmpty">
            <strong>No command actions yet.</strong>
            <small>Confirmed Command Surface actions will appear here.</small>
          </article>
        )}
      </section>

      <section className="shsDash-card shsDash-sideCard">
        <div className="shsDash-sectionHead">
          <h2>Upcoming Tasks</h2>
          <button type="button">View All →</button>
        </div>

        {[
          "Review pending contradictions",
          "Verify new provider submissions",
          "Upload Q2 evidence packages",
        ].map((task, index) => (
          <article className="shsDash-task" key={task}>
            <span />
            <strong>{task}</strong>
            <small>{index === 0 ? "Due Today" : index === 1 ? "May 19" : "May 22"}</small>
            <b>{index === 0 ? "High" : "Medium"}</b>
          </article>
        ))}

        <button className="shsDash-addTask" type="button">
          + Add New Task
        </button>
      </section>

      <section className="shsDash-card shsDash-sideCard">
        <div className="shsDash-sectionHead">
          <h2>Recent Reports</h2>
          <button type="button" onClick={() => openDashboardPanel("Reports")}>
            View All →
          </button>
        </div>

        {reportRows.map(([report, format]) => (
          <article className="shsDash-reportRow" key={`${report}-${format}`}>
            <span>▤</span>
            <strong>{report}</strong>
            <small>{format}</small>
            <button type="button">↓</button>
          </article>
        ))}
      </section>
    </aside>
  );
}
