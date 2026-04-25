import React, { useEffect, useMemo, useState } from "react";
import { createJournalEntry, readJournalEntries } from "../dashboardUtils";

const starterEntries = [
  {
    id: "starter-1",
    title: "Operator reflection",
    body: "Draft note from today’s workspace review.",
    visibility: "Private",
    contextType: "Workspace",
    status: "Private",
    createdAt: new Date().toISOString(),
  },
  {
    id: "starter-2",
    title: "Meeting notes",
    body: "Hamilton provider verification call.",
    visibility: "Workspace",
    contextType: "Meeting",
    status: "Linked",
    createdAt: new Date().toISOString(),
  },
  {
    id: "starter-3",
    title: "Follow-up note",
    body: "Franklin dataset contradiction context.",
    visibility: "Command Team",
    contextType: "Review",
    status: "Review",
    createdAt: new Date().toISOString(),
  },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Now";
  }
}

export default function JournalPanel() {
  const [entries, setEntries] = useState(() => {
    const stored = readJournalEntries();
    return stored.length ? stored : starterEntries;
  });

  const [draft, setDraft] = useState({
    title: "",
    body: "",
    visibility: "Private",
    contextType: "Workspace",
  });

  useEffect(() => {
    function handleJournalUpdate(event) {
      if (Array.isArray(event.detail)) setEntries(event.detail);
    }

    window.addEventListener("shsDash:journalUpdated", handleJournalUpdate);
    return () => window.removeEventListener("shsDash:journalUpdated", handleJournalUpdate);
  }, []);

  const latestEntries = useMemo(() => entries.slice(0, 6), [entries]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    if (!draft.title.trim() && !draft.body.trim()) return;

    const entry = createJournalEntry({
      ...draft,
      title: draft.title.trim() || "Untitled Note",
      body: draft.body.trim(),
    });

    setEntries((current) => [entry, ...current].slice(0, 25));
    setDraft({
      title: "",
      body: "",
      visibility: "Private",
      contextType: "Workspace",
    });
  }

  return (
    <section className="shsDash-card shsDash-journalPanel">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>Journal</h2>
          <p>Private workspace notes, meeting notes, reflections, operator logs, and decision context drafts.</p>
        </div>
      </div>

      <div className="shsDash-journalGrid">
        <article className="shsDash-journalComposer">
          <div className="shsDash-sectionHead">
            <h2>✍ New Entry</h2>
            <button type="button" onClick={handleSave}>Save Entry</button>
          </div>

          <label>
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="Example: Franklin follow-up note"
            />
          </label>

          <label>
            <span>Note</span>
            <textarea
              value={draft.body}
              onChange={(event) => updateDraft("body", event.target.value)}
              placeholder="Write a workspace note, meeting note, reflection, or operator log..."
            />
          </label>

          <div className="shsDash-journalFields">
            <label>
              <span>Visibility</span>
              <select
                value={draft.visibility}
                onChange={(event) => updateDraft("visibility", event.target.value)}
              >
                <option value="Private">Private</option>
                <option value="Workspace">Workspace</option>
                <option value="Command Team">Command Team</option>
              </select>
            </label>

            <label>
              <span>Context Type</span>
              <select
                value={draft.contextType}
                onChange={(event) => updateDraft("contextType", event.target.value)}
              >
                <option value="Workspace">Workspace</option>
                <option value="Meeting">Meeting</option>
                <option value="Review">Review</option>
                <option value="Decision Draft">Decision Draft</option>
              </select>
            </label>
          </div>

          <section className="shsDash-journalNote">
            <strong>Promotion Rule</strong>
            <p>
              Journal entries stay private until promoted into evidence, analyst memo,
              action log, audit record, or decision context.
            </p>
          </section>
        </article>

        <article className="shsDash-journalEntries">
          <div className="shsDash-sectionHead">
            <h2>Recent Notes</h2>
            <button type="button">View All →</button>
          </div>

          {latestEntries.map((entry) => (
            <div className="shsDash-journalEntry" key={entry.id}>
              <span>✍</span>
              <div>
                <strong>{entry.title}</strong>
                <p>{entry.body || "No note body added yet."}</p>
                <small>{entry.contextType} · {entry.visibility} · {formatDate(entry.createdAt)}</small>
              </div>
              <b>{entry.status || entry.visibility}</b>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
