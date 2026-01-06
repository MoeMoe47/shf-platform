// src/pages/Assignments.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { track } from "@/utils/analytics.js";

export default function Assignments() {
  const { curriculum = "asl" } = useParams();
  const credit = useCreditCtx();

  // Placeholder data (swap when API is ready)
  const [open, setOpen] = React.useState([
    { id: "ref-1",  title: "Lesson 3 Reflection", due: "Sep 20", type: "reflection" },
    { id: "quiz-2", title: "Quiz 2",              due: "Sep 22", type: "quiz" },
    { id: "art-1",  title: "Portfolio Artifact",  due: "Sep 28", type: "artifact" },
  ]);
  const [completed, setCompleted] = React.useState([]);

  function awardAssignmentComplete(assignment) {
    try {
      track?.("assignment_completed", {
        id: assignment?.id,
        title: assignment?.title,
        curriculum,
      });
    } catch {}

    credit?.earn?.({
      action: "assignment.complete",
      rewards: { wheat: 1 }, // 🌾
      scoreDelta: 6,
      meta: { id: assignment?.id, title: assignment?.title, curriculum },
    });
  }

  function markComplete(a) {
    // optimistic move from open → completed
    setOpen((list) => list.filter((x) => x.id !== a.id));
    setCompleted((list) => [
      { ...a, completedAt: Date.now() },
      ...list,
    ]);
    awardAssignmentComplete(a);
  }

  return (
    <main className="app-main">
      <h1 style={{ marginTop: 0 }}>Assignments</h1>
      <p className="sh-muted">All open and completed work for {curriculum.toUpperCase()}.</p>

      {/* Open */}
      <section className="card card--pad" aria-labelledby="open-assignments">
        <h2 id="open-assignments" style={{ marginTop: 0 }}>Open</h2>
        {open.length === 0 ? (
          <p className="sh-muted">No open assignments.</p>
        ) : (
          <ul className="sh-listReset" style={{ display: "grid", gap: 12 }}>
            {open.map((a) => (
              <li key={a.id} className="sb-assignItem" style={{ borderBottom: "1px solid var(--line)" }}>
                <Link className="sb-assignMain" to={`/${curriculum}/lesson/${a.id}`}>
                  <span className="sb-assignTitle">{a.title}</span>
                  <span className="sb-due">
                    <span className="sb-chip due">Due {a.due}</span>
                  </span>
                </Link>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link className="btn btn--small btn--primary" to={`/${curriculum}/lesson/${a.id}`}>
                    Start
                  </Link>
                  <Link className="btn btn--small btn--secondary" to={`/${curriculum}/assignments`}>
                    Details
                  </Link>
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => markComplete(a)}
                    title="Mark this assignment complete"
                  >
                    Mark complete ✓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Completed */}
      <section className="card card--pad" aria-labelledby="completed" style={{ marginTop: 16 }}>
        <h2 id="completed" style={{ marginTop: 0 }}>Completed</h2>
        {completed.length === 0 ? (
          <p className="sh-muted">Nothing completed yet.</p>
        ) : (
          <ul className="sh-listReset" style={{ display: "grid", gap: 12 }}>
            {completed.map((a) => (
              <li key={a.id} className="sb-assignItem" style={{ borderBottom: "1px solid var(--line)" }}>
                <Link className="sb-assignMain" to={`/${curriculum}/lesson/${a.id}`}>
                  <span className="sb-assignTitle">{a.title}</span>
                  <span className="sb-due">
                    <span className="sb-chip info">
                      Submitted {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ""}
                    </span>
                  </span>
                </Link>
                <span className="sb-badge" aria-label="Completed">✓</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
