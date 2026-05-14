// src/components/AssignmentsCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { track } from "@/utils/analytics.js";

const FALLBACK_ITEMS = [
  { id: "ref-1",  title: "Lesson 3 Reflection", due: "Sep 20", type: "reflection" },
  { id: "quiz-2", title: "Quiz 2",              due: "Sep 22", type: "quiz" },
  { id: "art-1",  title: "Portfolio Artifact",  due: "Sep 28", type: "artifact" },
];

export default function AssignmentsCard({
  curriculum = "asl",
  items = FALLBACK_ITEMS,
  onComplete = () => {},
  title = "Assignments",
}) {
  const credit = useCreditCtx();

  const [open, setOpen] = React.useState(() =>
    Array.isArray(items) && items.length ? items : FALLBACK_ITEMS
  );
  const [completed, setCompleted] = React.useState([]);

  function award(assignment) {
    try {
      track?.("assignment_completed", {
        id: assignment?.id,
        title: assignment?.title,
        curriculum,
        surface: "AssignmentsCard",
      });
    } catch {}

    // SHF layer award
    credit?.earn?.({
      action: "assignment.complete",
      rewards: { wheat: 1 }, // 🌾
      scoreDelta: 6,
      meta: { id: assignment?.id, title: assignment?.title, curriculum },
    });
  }

  function markComplete(a) {
    setOpen((list) => list.filter((x) => x.id !== a.id));
    setCompleted((list) => [{ ...a, completedAt: Date.now() }, ...list]);
    award(a);
    onComplete(a);
  }

  return (
    <section className="card card--pad" role="region" aria-labelledby="assignments-card-title">
      <div className="sh-row" style={{ alignItems: "baseline" }}>
        <h3 id="assignments-card-title" className="h4" style={{ margin: 0 }}>
          {title}
        </h3>
        <div style={{ flex: 1 }} />
        <span className="subtle" style={{ fontSize: 12 }}>
          {open.length} open
        </span>
      </div>

      {/* Open list */}
      {!open.length ? (
        <p className="subtle" style={{ marginTop: 8 }}>No open assignments.</p>
      ) : (
        <ul className="sh-listPlain" style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {open.map((a) => (
            <li key={a.id} className="pathRow" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  Due {a.due} · {a.type}
                </div>
              </div>
              <div className="sh-actionsRow" style={{ gap: 6 }}>
                <Link className="sh-btn sh-btn--secondary" to={`/${curriculum}/lesson/${a.id}`}>
                  Start
                </Link>
                <button className="sh-btn" onClick={() => markComplete(a)} title="Mark complete">
                  Mark complete ✓
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Completed list (recent) */}
      {!!completed.length && (
        <>
          <hr style={{ border: 0, borderTop: "1px solid var(--ring,#e5e7eb)", margin: "12px 0" }} />
          <div className="subtle" style={{ marginBottom: 6 }}>Recently completed</div>
          <ul className="sh-listPlain" style={{ display: "grid", gap: 8 }}>
            {completed.slice(0, 5).map((a) => (
              <li key={`done-${a.id}`} className="pathRow" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div className="subtle" style={{ fontSize: 12 }}>
                    Submitted {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ""}
                  </div>
                </div>
                <span aria-label="Completed">✓</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
