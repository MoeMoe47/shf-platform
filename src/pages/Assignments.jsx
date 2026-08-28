// src/pages/Assignments.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { track } from "@/utils/analytics.js";

// This page is mounted at two different routes with two different
// registered lesson/assignments paths (career.html's `assignments`/`learn/:id`
// vs curriculum.html's `curriculum/asl/assignments`/`curriculum/lesson/:id` —
// see src/router/CareerRoutes.jsx and src/router/CurriculumRoutes.jsx). It
// has no route param or prop telling it which app it's in, so the correct
// in-app path shape is resolved from the page URL, matching the pattern
// already used for cross-app links in CareerLearningBridge.jsx.
function useIsCurriculumApp() {
  return typeof window !== "undefined" && window.location.pathname.includes("curriculum.html");
}

export default function Assignments() {
  const { curriculum = "asl" } = useParams();
  const credit = useCreditCtx();
  const isCurriculumApp = useIsCurriculumApp();
  const lessonHref = (id) => (isCurriculumApp ? `/curriculum/lesson/${id}` : `/learn/${id}`);
  const assignmentsHref = isCurriculumApp ? "/curriculum/asl/assignments" : "/assignments";

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

  // Inline styling below (not shared .sh-*/.sb-*/.btn classes) is deliberate:
  // this page mounts on both career.html and curriculum.html, and auditing
  // both apps' loaded stylesheets showed the .sb-* classes this file used
  // to reference are defined nowhere in the repo, while candidate
  // replacements like .sh-chip/.sh-row/.sh-actionsRow/.sh-listPlain/
  // .sh-muted/.sh-btn--primary/.sh-btn--secondary are only styled on one
  // app (or neither) depending on which stylesheet happens to define them.
  // Only .card/.card--pad/.app-main (all in shell.css, loaded by both
  // entries) are confirmed safe on both hosts, so the row/chip/button
  // presentation is done with plain inline styles that don't depend on
  // guessing which stylesheet is loaded.
  const mutedStyle = { color: "#6b7280" };
  const chipStyle = { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, border: "1px solid var(--ring)", background: "var(--card)", whiteSpace: "nowrap" };
  const btnStyle = { display: "inline-flex", alignItems: "center", padding: "8px 14px", fontSize: 14, fontWeight: 600, borderRadius: 8, border: "1px solid var(--ring)", textDecoration: "none", cursor: "pointer", background: "var(--card)", color: "inherit" };
  const btnPrimaryStyle = { ...btnStyle, background: "#FF5A1F", color: "#fff", borderColor: "#FF5A1F" };

  return (
    <main className="app-main">
      <h1 style={{ marginTop: 0 }}>Assignments</h1>
      <p style={mutedStyle}>All open and completed work for {curriculum.toUpperCase()}.</p>

      {/* Open */}
      <section className="card card--pad" aria-labelledby="open-assignments">
        <h2 id="open-assignments" style={{ marginTop: 0 }}>Open</h2>
        {open.length === 0 ? (
          <p style={mutedStyle}>No open assignments.</p>
        ) : (
          <ul style={{ display: "grid", gap: 12, listStyle: "none", margin: 0, padding: 0 }}>
            {open.map((a) => (
              <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid var(--ring)", paddingBottom: 12 }}>
                <Link to={lessonHref(a.id)} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
                  <span style={{ fontWeight: 700 }}>{a.title}</span>
                  <span style={chipStyle}>Due {a.due}</span>
                </Link>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link style={btnPrimaryStyle} to={lessonHref(a.id)}>
                    Start
                  </Link>
                  <Link style={btnStyle} to={assignmentsHref}>
                    Details
                  </Link>
                  <button
                    type="button"
                    style={btnStyle}
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
          <p style={mutedStyle}>Nothing completed yet.</p>
        ) : (
          <ul style={{ display: "grid", gap: 12, listStyle: "none", margin: 0, padding: 0 }}>
            {completed.map((a) => (
              <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid var(--ring)", paddingBottom: 12 }}>
                <Link to={lessonHref(a.id)} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
                  <span style={{ fontWeight: 700 }}>{a.title}</span>
                  <span style={chipStyle}>
                    Submitted {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ""}
                  </span>
                </Link>
                <span aria-label="Completed" style={{ fontSize: 18 }}>✓</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
