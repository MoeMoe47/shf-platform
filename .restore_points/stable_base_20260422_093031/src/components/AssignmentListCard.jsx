// src/components/AssignmentListCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { track } from "@/utils/analytics.js";

export default function AssignmentListCard({
  curriculum = "asl",
  items = [],
  title = "Open Assignments",
  compact = false,
  onComplete = () => {},
}) {
  const credit = useCreditCtx();

  const [list, setList] = React.useState(() =>
    Array.isArray(items) && items.length
      ? items
      : [
          { id: "ref-1", title: "Lesson 3 Reflection", due: "Sep 20", type: "reflection" },
          { id: "quiz-2", title: "Quiz 2", due: "Sep 22", type: "quiz" },
        ]
  );

  function award(assignment) {
    try {
      track?.("assignment_completed", {
        id: assignment?.id,
        title: assignment?.title,
        curriculum,
        surface: "AssignmentListCard",
      });
    } catch {}

    credit?.earn?.({
      action: "assignment.complete",
      rewards: { wheat: 1 },
      scoreDelta: 6,
      meta: { id: assignment?.id, title: assignment?.title, curriculum },
    });
  }

  function markDone(a) {
    setList((xs) => xs.filter((x) => x.id !== a.id));
    award(a);
    onComplete(a);
  }

  return (
    <section className={`card card--pad ${compact ? "card--tight" : ""}`} role="region" aria-labelledby="assign-list-title">
      <div className="sh-row" style={{ alignItems: "baseline" }}>
        <h3 id="assign-list-title" className="h4" style={{ margin: 0 }}>{title}</h3>
        <div style={{ flex: 1 }} />
        <span className="subtle" style={{ fontSize: 12 }}>{list.length} open</span>
      </div>

      {!list.length ? (
        <p className="subtle" style={{ marginTop: 8 }}>You’re all caught up 🎉</p>
      ) : (
        <ul className="sh-listPlain" style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {list.map((a) => (
            <li key={a.id} className="pathRow" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div className="subtle" style={{ fontSize: 12 }}>
                  Due {a.due} · {a.type}
                </div>
              </div>
              <div className="sh-actionsRow" style={{ gap: 6 }}>
                <Link className="sh-btn sh-btn--secondary" to={`/${curriculum}/lesson/${a.id}`}>Start</Link>
                <button className="sh-btn" onClick={() => markDone(a)}>Mark done ✓</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
