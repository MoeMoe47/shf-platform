import React, { useEffect, useMemo, useState } from "react";
import { createAgendaItem, openDashboardPanel, readAgendaItems } from "../dashboardUtils";

const starterConferences = [
  {
    id: "conf-starter-1",
    title: "Provider verification conference",
    type: "Conference",
    date: "Today",
    time: "1:30 PM",
    status: "Zoom ready",
    priority: "High",
    context: "Verification",
    notes: "Workspace meeting for provider verification follow-up.",
    createdAt: new Date().toISOString(),
  },
];

function isConference(item) {
  return item?.type === "Conference";
}

function displayDate(item) {
  return `${item.date || "Today"} · ${item.time || "Time TBD"}`;
}

export default function ConferencePanel() {
  const [agendaItems, setAgendaItems] = useState(() => {
    const stored = readAgendaItems();
    const conferences = stored.filter(isConference);
    return conferences.length ? conferences : starterConferences;
  });

  const [draft, setDraft] = useState({
    title: "",
    date: "Today",
    time: "",
    meetingMode: "Zoom-style conference",
    status: "Conference ready",
    priority: "Normal",
    context: "Workspace",
    notes: "",
  });

  useEffect(() => {
    function handleAgendaUpdate(event) {
      if (Array.isArray(event.detail)) {
        setAgendaItems(event.detail.filter(isConference));
      }
    }

    window.addEventListener("shsDash:agendaUpdated", handleAgendaUpdate);
    return () => window.removeEventListener("shsDash:agendaUpdated", handleAgendaUpdate);
  }, []);

  const upcomingConferences = useMemo(() => agendaItems.slice(0, 8), [agendaItems]);

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleScheduleConference() {
    if (!draft.title.trim()) return;

    const conference = createAgendaItem({
      title: draft.title.trim(),
      type: "Conference",
      date: draft.date || "Today",
      time: draft.time || "Time TBD",
      status: draft.status || "Conference ready",
      priority: draft.priority || "Normal",
      context: draft.context || "Workspace",
      notes: `${draft.meetingMode}. ${draft.notes || ""}`.trim(),
    });

    setAgendaItems((current) => [conference, ...current].filter(isConference).slice(0, 8));

    setDraft({
      title: "",
      date: "Today",
      time: "",
      meetingMode: "Zoom-style conference",
      status: "Conference ready",
      priority: "Normal",
      context: "Workspace",
      notes: "",
    });
  }

  function handleStartInstantConference() {
    const conference = createAgendaItem({
      title: draft.title.trim() || "Instant SHS workspace conference",
      type: "Conference",
      date: "Today",
      time: "Now",
      status: "Live room ready",
      priority: "High",
      context: draft.context || "Workspace",
      notes: "Instant workspace conference created from the SHS Workspace Dashboard.",
    });

    setAgendaItems((current) => [conference, ...current].filter(isConference).slice(0, 8));
  }

  return (
    <section className="shsDash-card shsDash-conferencePanel">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>Conference</h2>
          <p>Start, join, schedule, and attach meeting notes to SHS workspace activity.</p>
        </div>

        <button type="button" onClick={() => openDashboardPanel("Calendar")}>
          Open Calendar →
        </button>
      </div>

      <div className="shsDash-conferenceGrid">
        <article className="shsDash-conferenceComposer">
          <div className="shsDash-sectionHead">
            <h2>🎥 Schedule Conference</h2>
            <button type="button" onClick={handleStartInstantConference}>
              Start Now
            </button>
          </div>

          <label>
            <span>Conference Title</span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="Example: Franklin review conference"
            />
          </label>

          <div className="shsDash-conferenceFields">
            <label>
              <span>Date</span>
              <input
                value={draft.date}
                onChange={(event) => updateDraft("date", event.target.value)}
                placeholder="Today, Tomorrow, May 22"
              />
            </label>

            <label>
              <span>Time</span>
              <input
                value={draft.time}
                onChange={(event) => updateDraft("time", event.target.value)}
                placeholder="1:30 PM"
              />
            </label>
          </div>

          <div className="shsDash-conferenceFields">
            <label>
              <span>Meeting Mode</span>
              <select
                value={draft.meetingMode}
                onChange={(event) => updateDraft("meetingMode", event.target.value)}
              >
                <option value="Zoom-style conference">Zoom-style conference</option>
                <option value="Internal workspace call">Internal workspace call</option>
                <option value="Partner review meeting">Partner review meeting</option>
                <option value="Provider verification call">Provider verification call</option>
                <option value="Command handoff briefing">Command handoff briefing</option>
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select
                value={draft.priority}
                onChange={(event) => updateDraft("priority", event.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>

          <div className="shsDash-conferenceFields">
            <label>
              <span>Status</span>
              <input
                value={draft.status}
                onChange={(event) => updateDraft("status", event.target.value)}
                placeholder="Conference ready"
              />
            </label>

            <label>
              <span>Context</span>
              <input
                value={draft.context}
                onChange={(event) => updateDraft("context", event.target.value)}
                placeholder="Workspace, Verification, Report"
              />
            </label>
          </div>

          <label>
            <span>Meeting Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Add meeting purpose, attendees, follow-up details, or command handoff notes..."
            />
          </label>

          <footer className="shsDash-conferenceActions">
            <button type="button" className="is-primary" onClick={handleScheduleConference}>
              Schedule Conference
            </button>

            <button type="button" onClick={() => openDashboardPanel("Journal")}>
              Attach Notes Later
            </button>
          </footer>

          <section className="shsDash-conferenceNote">
            <strong>Conference Rule</strong>
            <p>
              Conference activity stays in the Workspace Dashboard until meeting notes, action items,
              or decisions are promoted into evidence, analyst memos, audit records, or command context.
            </p>
          </section>
        </article>

        <article className="shsDash-conferenceList">
          <div className="shsDash-sectionHead">
            <h2>Upcoming Conferences</h2>
            <button type="button" onClick={() => openDashboardPanel("Calendar")}>
              View Calendar →
            </button>
          </div>

          {upcomingConferences.map((item) => (
            <div className="shsDash-conferenceItem" key={item.id}>
              <span>🎥</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.notes || "No conference notes added yet."}</p>
                <small>{displayDate(item)} · {item.context}</small>
              </div>
              <b className={item.priority === "High" ? "is-high" : ""}>{item.status}</b>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
