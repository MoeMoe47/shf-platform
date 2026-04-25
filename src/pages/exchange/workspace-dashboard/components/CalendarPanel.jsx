import React, { useEffect, useMemo, useState } from "react";
import { createAgendaItem, readAgendaItems } from "../dashboardUtils";

const starterAgenda = [
  {
    id: "starter-agenda-1",
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
  {
    id: "starter-agenda-2",
    title: "Franklin contradiction review",
    type: "Review",
    date: "Today",
    time: "3:00 PM",
    status: "Command handoff",
    priority: "High",
    context: "Oracle / Reconciliation",
    notes: "Review contradiction package before command decision.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "starter-agenda-3",
    title: "Evidence follow-up deadline",
    type: "Deadline",
    date: "Tomorrow",
    time: "10:00 AM",
    status: "Verification",
    priority: "Medium",
    context: "Evidence",
    notes: "Follow up on missing source evidence.",
    createdAt: new Date().toISOString(),
  },
];

const typeIcon = {
  Meeting: "📅",
  Conference: "🎥",
  Review: "🔁",
  Deadline: "🛡",
  Report: "▤",
};

function cleanDateLabel(item) {
  const date = item.date || "Today";
  const time = item.time || "Time TBD";
  return `${date} · ${time}`;
}

export default function CalendarPanel() {
  const [items, setItems] = useState(() => {
    const stored = readAgendaItems();
    return stored.length ? stored : starterAgenda;
  });

  const [draft, setDraft] = useState({
    title: "",
    type: "Meeting",
    date: "Today",
    time: "",
    status: "Scheduled",
    priority: "Normal",
    context: "Workspace",
    notes: "",
  });

  useEffect(() => {
    function handleAgendaUpdate(event) {
      if (Array.isArray(event.detail)) setItems(event.detail);
    }

    window.addEventListener("shsDash:agendaUpdated", handleAgendaUpdate);
    return () => window.removeEventListener("shsDash:agendaUpdated", handleAgendaUpdate);
  }, []);

  const nextItems = useMemo(() => items.slice(0, 8), [items]);

  function updateDraft(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSave() {
    if (!draft.title.trim()) return;

    const next = createAgendaItem({
      ...draft,
      title: draft.title.trim(),
      notes: draft.notes.trim(),
    });

    setItems((current) => [next, ...current].slice(0, 40));
    setDraft({
      title: "",
      type: "Meeting",
      date: "Today",
      time: "",
      status: "Scheduled",
      priority: "Normal",
      context: "Workspace",
      notes: "",
    });
  }

  return (
    <section className="shsDash-card shsDash-calendarPanel">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>Calendar</h2>
          <p>Meetings, deadlines, verification appointments, report release dates, and follow-up reviews.</p>
        </div>
      </div>

      <div className="shsDash-calendarGrid">
        <article className="shsDash-calendarComposer">
          <div className="shsDash-sectionHead">
            <h2>📅 Add Agenda Item</h2>
            <button type="button" onClick={handleSave}>Save Item</button>
          </div>

          <label>
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="Example: Franklin review meeting"
            />
          </label>

          <div className="shsDash-calendarFields">
            <label>
              <span>Type</span>
              <select
                value={draft.type}
                onChange={(event) => updateDraft("type", event.target.value)}
              >
                <option value="Meeting">Meeting</option>
                <option value="Conference">Conference</option>
                <option value="Review">Review</option>
                <option value="Deadline">Deadline</option>
                <option value="Report">Report</option>
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

          <div className="shsDash-calendarFields">
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

          <div className="shsDash-calendarFields">
            <label>
              <span>Status</span>
              <input
                value={draft.status}
                onChange={(event) => updateDraft("status", event.target.value)}
                placeholder="Scheduled"
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
            <span>Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              placeholder="Add meeting purpose, follow-up details, or command handoff notes..."
            />
          </label>

          <section className="shsDash-calendarNote">
            <strong>Calendar Rule</strong>
            <p>
              Calendar items live in the Workspace Dashboard. They only become Command Surface context
              when attached to a case, evidence item, report, analyst memo, or audit event.
            </p>
          </section>
        </article>

        <article className="shsDash-calendarList">
          <div className="shsDash-sectionHead">
            <h2>Upcoming Agenda</h2>
            <button type="button">View All →</button>
          </div>

          {nextItems.map((item) => (
            <div className="shsDash-calendarItem" key={item.id}>
              <span>{typeIcon[item.type] || "📅"}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.notes || "No notes added yet."}</p>
                <small>{cleanDateLabel(item)} · {item.type} · {item.context}</small>
              </div>
              <b className={item.priority === "High" ? "is-high" : ""}>{item.priority}</b>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
