// src/components/CollabPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { track } from "../utils/analytics.js";

const storageKey = (planId) => `collab:${planId || "global"}`;

export default function CollabPanel({ planId = null, role = "student" }) {
  const key = useMemo(() => storageKey(planId), [planId]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [taskText, setTaskText] = useState("");

  // load/save
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "{}");
      setNotes(Array.isArray(raw.notes) ? raw.notes : []);
      setTasks(Array.isArray(raw.tasks) ? raw.tasks : []);
    } catch {
      setNotes([]); setTasks([]);
    }
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ notes, tasks }));
    } catch {}
  }, [key, notes, tasks]);

  const addNote = () => {
    if (!noteText.trim()) return;
    const n = { ts: Date.now(), authorRole: role, text: noteText.trim() };
    setNotes([n, ...notes]);
    setNoteText("");
    try { track("collab_note_added", { planId, role }); } catch {}
  };

  const addTask = () => {
    if (!taskText.trim()) return;
    const t = { id: crypto.randomUUID(), text: taskText.trim(), assignee: role, done: false, ts: Date.now() };
    setTasks([t, ...tasks]);
    setTaskText("");
    try { track("collab_task_added", { planId, role }); } catch {}
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    try { track("collab_task_toggled", { planId }); } catch {}
  };

  const removeTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const removeNote = (ts) => setNotes(notes.filter(n => n.ts !== ts));

  return (
    <section className="card card--pad" aria-labelledby="collab-title">
      <h3 id="collab-title" className="h3" style={{ marginTop: 0 }}>Collaboration</h3>
      <p className="subtle" style={{ marginTop: 4 }}>
        Shared notes and tasks for this plan {planId ? <span className="sh-chip">#{planId.slice(0,6)}</span> : null}
      </p>

      {/* Add note */}
      <div className="sh-grid" style={{ marginTop: 8, gap: 8 }}>
        <label className="sh-inputText">
          <span className="sh-srOnly">New note</span>
          <input
            value={noteText}
            onChange={(e)=>setNoteText(e.target.value)}
            placeholder="Add a note for your coach or parent…"
            aria-label="Add a note"
            style={{ width: "100%", border: "none", outline: "none", background: "transparent" }}
            onKeyDown={(e)=>e.key==="Enter" && addNote()}
          />
        </label>
        <button className="sh-btn sh-btn--secondary" onClick={addNote}>Add note</button>
      </div>

      {/* Notes list */}
      <ul className="sh-listPlain" style={{ marginTop: 10 }}>
        {notes.length === 0 ? <li className="subtle">No notes yet.</li> : null}
        {notes.map(n => (
          <li key={n.ts} className="sh-row" style={{ justifyContent:"space-between", border:"1px solid var(--ring)", borderRadius:10, padding:8, marginTop:6 }}>
            <div>
              <div style={{ fontWeight:600 }}>{n.text}</div>
              <div className="subtle">{new Date(n.ts).toLocaleString()} • {n.authorRole}</div>
            </div>
            <button className="sh-btn sh-btn--tiny" aria-label="Delete note" onClick={()=>removeNote(n.ts)}>✕</button>
          </li>
        ))}
      </ul>

      <hr className="app-hr" />

      {/* Add task */}
      <div className="sh-grid" style={{ gap: 8 }}>
        <label className="sh-inputText">
          <span className="sh-srOnly">New task</span>
          <input
            value={taskText}
            onChange={(e)=>setTaskText(e.target.value)}
            placeholder="Add a task (e.g., 'Call WIOA office')"
            aria-label="Add a task"
            style={{ width:"100%", border:"none", outline:"none", background:"transparent" }}
            onKeyDown={(e)=>e.key==="Enter" && addTask()}
          />
        </label>
        <button className="sh-btn sh-btn--secondary" onClick={addTask}>Add task</button>
      </div>

      {/* Tasks list */}
      <ul className="sh-listPlain" style={{ marginTop: 10 }}>
        {tasks.length === 0 ? <li className="subtle">No tasks yet.</li> : null}
        {tasks.map(t => (
          <li key={t.id} className="sh-row" style={{ justifyContent:"space-between", gap:8, border:"1px solid var(--ring)", borderRadius:10, padding:8, marginTop:6 }}>
            <label className="sh-row" style={{ gap:8, alignItems:"center" }}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={()=>toggleTask(t.id)}
                aria-label={`Mark "${t.text}" ${t.done ? "not done" : "done"}`}
              />
              <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
            </label>
            <div className="sh-row" style={{ gap:8 }}>
              <span className="sh-chip soft">{t.assignee}</span>
              <button className="sh-btn sh-btn--tiny" aria-label="Delete task" onClick={()=>removeTask(t.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
