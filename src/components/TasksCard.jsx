// src/components/TasksCard.jsx
import React from "react";
import { track } from "../utils/analytics.js";
import { useRole } from "../hooks/useRole.js";

export default function TasksCard({
  planId = "draft",
  pathway = {},         // optional context for analytics
}) {
  const { role } = useRole();
  const userId = (window.__user && window.__user.id) || "anon";
  const storageKey = `plan:tasks:${planId || "draft"}`;

  const [text, setText] = React.useState("");
  const [assignee, setAssignee] = React.useState(role || "student");
  const [tasks, setTasks] = React.useState(() => readTasks(storageKey));

  // Reload when plan changes
  React.useEffect(() => {
    setTasks(readTasks(storageKey));
  }, [storageKey]);

  // Cross-tab sync
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === storageKey) {
        setTasks(readTasks(storageKey));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const incomplete = tasks.filter(t => !t.done).length;

  function addTask() {
    const t = text.trim();
    if (!t) return;
    const newTask = {
      id: safeId(),
      text: t,
      assignee: String(assignee || role || "student"),
      done: false,
      ts: Date.now(),
      addedBy: { id: userId, role: role || "member" },
    };
    const next = [newTask, ...tasks];
    setTasks(next);
    writeTasks(storageKey, next);
    setText("");
    try { track("task_added", { planId, pathwayId: pathway?.id || null, assignee: newTask.assignee }); } catch {}
  }

  function toggleTask(id, done) {
    const next = tasks.map(t => (t.id === id ? { ...t, done } : t));
    setTasks(next);
    writeTasks(storageKey, next);
    try { track("task_toggled", { planId, taskId: id, done }); } catch {}
  }

  function removeTask(id) {
    const next = tasks.filter(t => t.id !== id);
    setTasks(next);
    writeTasks(storageKey, next);
    try { track("task_deleted", { planId, taskId: id }); } catch {}
  }

  function clearCompleted() {
    const next = tasks.filter(t => !t.done);
    setTasks(next);
    writeTasks(storageKey, next);
    try { track("tasks_cleared_completed", { planId }); } catch {}
  }

  function onKeyDown(e){
    if (e.key === "Enter") addTask();
  }

  return (
    <section className="card card--pad" aria-label="Tasks">
      <header className="sh-row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>Tasks</h3>
          <div className="subtle">{incomplete} open</div>
        </div>
        {tasks.some(t => t.done) && (
          <button className="sh-btn sh-btn--secondary" onClick={clearCompleted}>
            Clear completed
          </button>
        )}
      </header>

      {/* Add row */}
      <div className="sh-actionsRow" style={{ marginTop: 10 }}>
        <label className="sh-srOnly" htmlFor="task-text">New task</label>
        <input
          id="task-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add a first step…"
          className="sh-inputText"
          style={{ flex: 1, minWidth: 160 }}
        />
        <label className="sh-srOnly" htmlFor="task-assignee">Assignee</label>
        <select
          id="task-assignee"
          className="sh-inputText"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          style={{ width: 150 }}
        >
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="coach">Coach</option>
          <option value="instructor">Instructor</option>
        </select>
        <button className="sh-btn sh-btn--primary" onClick={addTask}>Add</button>
      </div>

      {/* List */}
      {tasks.length === 0 ? (
        <p className="subtle" style={{ marginTop: 10 }}>No tasks yet. Add your first step.</p>
      ) : (
        <ul className="sh-listPlain" style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {tasks
            .slice() // copy
            .sort((a, b) => Number(a.done) - Number(b.done) || b.ts - a.ts) // open first, newest first
            .map(t => (
              <li key={t.id} className="sh-row" style={{
                border: "1px solid var(--ring)",
                borderRadius: 10,
                padding: 8,
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={!!t.done}
                    onChange={(e) => toggleTask(t.id, e.target.checked)}
                    aria-label={`Mark "${t.text}" ${t.done ? "not done" : "done"}`}
                  />
                  <span style={{
                    textDecoration: t.done ? "line-through" : "none",
                    color: t.done ? "var(--ink-soft)" : "var(--ink)"
                  }}>
                    {t.text}
                  </span>
                </label>

                <div className="sh-row" style={{ gap: 8 }}>
                  <span className="sh-chip soft" title="Assignee">{titleCase(t.assignee)}</span>
                  <button className="sh-btn sh-btn--secondary" onClick={() => removeTask(t.id)} aria-label="Delete task">
                    Delete
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

/* ----------------- helpers ----------------- */
function readTasks(key){ try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } }
function writeTasks(key, v){ try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
function safeId(){ try { return crypto.randomUUID(); } catch { return "t_" + Math.random().toString(36).slice(2,10); } }
function titleCase(s){ return String(s||"").replace(/\b\w/g, m => m.toUpperCase()); }
