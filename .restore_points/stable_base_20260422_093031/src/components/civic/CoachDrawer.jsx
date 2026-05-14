// src/components/civic/CoachDrawer.jsx
import React from "react";

/**
 * CoachDrawer
 * - Minimal, local coach with smart hints + quick actions
 * - Opens on: 1) Ctrl/⌘+K  2) window.dispatchEvent(new Event("coach:open"))
 * - Closes on: Esc, backdrop click, or window.dispatchEvent(new Event("coach:close"))
 * - Emits light analytics via "analytics:ping"
 *
 * Props:
 *  open: boolean
 *  onClose: fn(nextOpen?: boolean)  // call with false to close, true to request open
 *  lesson: { id?, title, objectives?[] }
 *  reflection: string
 *  masteryMap: { [key]: 0..100 }  // lower = weaker area
 */
export default function CoachDrawer({ open, onClose, lesson, reflection, masteryMap }) {
  const [q, setQ] = React.useState("");

  /* ---------------- Hotkeys + global open/close events ---------------- */
  React.useEffect(() => {
    const onKey = (e) => {
      // Open: Ctrl/⌘+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose?.(!open); // toggle
      }
      // Close: Esc
      if (open && e.key === "Escape") {
        onClose?.(false);
        ping("coach:close", { reason: "esc" });
      }
    };
    const onCoachOpen = () => {
      if (!open) {
        onClose?.(true);
        ping("coach:open", { via: "event" });
      }
    };
    const onCoachClose = () => {
      if (open) {
        onClose?.(false);
        ping("coach:close", { via: "event" });
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("coach:open", onCoachOpen);
    window.addEventListener("coach:close", onCoachClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("coach:open", onCoachOpen);
      window.removeEventListener("coach:close", onCoachClose);
    };
  }, [open, onClose]);

  if (!open) return null;

  /* ---------------- Context → hints ---------------- */
  const weak =
    Object.entries(masteryMap || {})
      .filter(([, v]) => (Number(v) || 0) < 100)
      .map(([k]) => k);

  const hints = [
    ...(weak.length
      ? [
          `You’re close on: ${weak.join(", ")}. Try a 2-sentence “pros vs cons” summary.`,
          `Make a flash card contrasting the two main ideas in “${lesson?.title || "this lesson"}”.`,
        ]
      : [
          `Nice streak on “${lesson?.title || "this lesson"}”. Draft a real-world example to try this week.`,
        ]),
    (reflection || "").trim().length
      ? `Pull one claim from your reflection and back it with a data point or source.`
      : `Write a 2-sentence reflection to earn +2 and lock in the concept.`,
  ];

  /* ---------------- Light analytics helper ---------------- */
  function ping(name, data = {}) {
    try {
      window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name, ...data } }));
    } catch {}
  }

  /* ---------------- Quick inserts (parent listens for coach:suggest) ---------------- */
  const broadcastSuggestion = (text) => {
    try {
      window.dispatchEvent(
        new CustomEvent("coach:suggest", { detail: { text, lessonId: lesson?.id || null } })
      );
    } catch {}
  };

  const quickPrompts = [
    {
      icon: "🧭",
      label: "Explain in my own words",
      text: `In my own words, the core idea of “${lesson?.title || "this lesson"}” is: `,
    },
    {
      icon: "🪜",
      label: "Give me a 3-step example",
      text: `A simple 3-step example that applies this concept is:\n1) \n2) \n3) `,
    },
    {
      icon: "⚖️",
      label: "Pros vs Cons",
      text: `Pros vs Cons of this approach:\nPros: \nCons: `,
    },
    {
      icon: "🧪",
      label: "Try it this week",
      text: `I will try this in the real world by: `,
    },
  ];

  /* ---------------- Ask flow ---------------- */
  function ask() {
    const payload = {
      question: q,
      context: {
        title: lesson?.title || "",
        objectives: lesson?.objectives || [],
        weak,
        reflectionLen: (reflection || "").length,
      },
    };
    ping("coach:ask", payload);

    // local echo – replace with real agent later
    alert(
      "Coach (local): Great question. Try stating the idea in your own words, then compare with the key terms. If it’s still fuzzy, pick one objective and write a 3-step example using it."
    );
    setQ("");
  }

  /* ---------------- UI ---------------- */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Coach"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.(false);
          ping("coach:close", { via: "backdrop" });
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "end",
        zIndex: 60,
      }}
    >
      <aside
        className="card"
        style={{
          width: "min(520px, 96vw)",
          height: "min(85vh, 860px)",
          border: "1px solid var(--ring, #e5e7eb)",
          borderRadius: 16,
          background: "var(--card, #fff)",
          padding: 12,
          margin: 12,
          overflow: "auto",
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
          transform: "translateY(0)",
          transition: "transform 180ms ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ fontSize: 20 }}>🧑‍🏫</span>
          <strong>AI Coach</strong>
          <span className="sh-badge is-ghost" style={{ marginLeft: 6 }}>local</span>
          <button
            className="sh-btn is-ghost"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              onClose?.(false);
              ping("coach:close", { via: "button" });
            }}
          >
            Close
          </button>
        </div>

        <div className="sh-divider" style={{ margin: "10px 0" }} />

        {/* Lesson context card */}
        <div
          className="sh-lightcard"
          style={{
            background: "var(--muted, #fafafa)",
            border: "1px solid var(--ring, #e5e7eb)",
            borderRadius: 12,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span aria-hidden>📘</span>
            <div>
              <div style={{ fontWeight: 600 }}>{lesson?.title || "Current lesson"}</div>
              {!!(lesson?.objectives?.length) && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Objectives: {lesson.objectives.slice(0, 2).join("; ")}
                  {lesson.objectives.length > 2 ? "…" : ""}
                </div>
              )}
            </div>
          </div>
          {!!weak.length && (
            <div style={{ fontSize: 13 }}>
              <span aria-hidden>🧩</span>{" "}
              <strong>Focus zones:</strong> {weak.join(", ")}
            </div>
          )}
        </div>

        {/* Smart suggestions (emoji light cards) */}
        <div style={{ display: "grid", gap: 8 }}>
          {hints.map((h, i) => (
            <div
              key={i}
              className="sh-lightcard"
              style={{
                background: "var(--muted, #fafafa)",
                border: "1px solid var(--ring, #e5e7eb)",
                borderRadius: 12,
                padding: 10,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span aria-hidden style={{ lineHeight: 1.1 }}>💡</span>
              <div style={{ fontSize: 14 }}>{h}</div>
            </div>
          ))}
        </div>

        <div className="sh-divider" style={{ margin: "10px 0" }} />

        {/* Quick actions */}
        <div style={{ marginBottom: 8 }}>
          <div className="sh-subtitle" style={{ marginBottom: 6 }}>Quick actions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                className="sh-btn"
                onClick={() => broadcastSuggestion(p.text)}
                title="Send to page (parent can insert into reflection/editor)"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span aria-hidden>{p.icon}</span>
                {p.label}
              </button>
            ))}
            {/* Direct dataset toggle (kept for convenience) */}
            <button
              className="sh-btn is-ghost"
              onClick={() => {
                try {
                  const cur = document.documentElement.dataset.focus === "1";
                  document.documentElement.dataset.focus = cur ? "0" : "1";
                  ping("coach:focusToggle", { on: !cur, via: "dataset" });
                } catch {}
              }}
            >
              🕶️ Toggle Focus
            </button>
          </div>
        </div>

        <div className="sh-divider" style={{ margin: "10px 0" }} />

        {/* Ask the coach */}
        <label className="sh-subtitle" style={{ display: "block", marginBottom: 6 }}>
          Ask the coach (Ctrl/⌘+K)
        </label>
        <textarea
          rows={3}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sh-inputText"
          style={{ width: "100%", marginBottom: 8 }}
          placeholder="What part is fuzzy? Ask for a hint, example, or step-by-step."
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="sh-btn sh-btn--primary" onClick={ask} disabled={!q.trim()}>
            Ask
          </button>
          <button className="sh-btn is-ghost" onClick={() => setQ("")} disabled={!q}>
            Clear
          </button>

          {/* ✅ Event-driven Focus Mode toggle (for FocusMode.js listener) */}
          <button
            className="sh-btn is-ghost"
            onClick={() => window.dispatchEvent(new Event("focusmode:toggle"))}
            title="Toggle Focus Mode"
          >
            🎯 Toggle Focus
          </button>
        </div>
      </aside>
    </div>
  );
}
