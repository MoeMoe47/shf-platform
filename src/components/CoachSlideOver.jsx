import React from "react";
import AIChat from "@/components/AIChat.jsx";

/**
 * CoachSlideOver (universal)
 * - Title is always "Coach Mode" (no curriculum names).
 * - Opens via props, Alt+C (handled in layout), or window.coach.open() event.
 * - Focus-safe, accessible slide-over with backdrop.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 */
export default function CoachSlideOver({ open, onClose }) {
  const panelRef = React.useRef(null);
  const closeBtnRef = React.useRef(null);

  // Allow external trigger: window.dispatchEvent(new CustomEvent("open-coach-panel"))
  React.useEffect(() => {
    const handleOpen = () => {
      if (!open) {
        // bubble up to parent to toggle open; if none provided, fallback to local state (no-op here)
        try {
          // best-effort: if parent didn't pass onClose/open, do nothing
          // in our app, CareerLayout owns the state and will pass setCoachOpen.
        } catch {}
      }
    };
    window.addEventListener("open-coach-panel", handleOpen);
    return () => window.removeEventListener("open-coach-panel", handleOpen);
  }, [open]);

  // Close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll + focus the close button on open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      try {
        closeBtnRef.current?.focus?.({ preventScroll: true });
      } catch {}
    }, 0);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="coach-scrim is-visible"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Coach Mode"
        onClick={(e) => e.stopPropagation()}
        className="coach-panel"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(720px, 92vw)",
          background: "var(--card, #fff)",
          borderLeft: "1px solid var(--ring, #e5e7eb)",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
          zIndex: 101,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          animation: "coachSlideIn .18s ease-out",
        }}
      >
        {/* Header */}
        <header
          className="coach-head"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: 12,
            borderBottom: "1px solid var(--ring,#e5e7eb)",
            background:
              "linear-gradient(135deg, #ff8947 0%, #ff4f00 60%, #ff9659 100%)",
            color: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden style={{ fontSize: 20 }}>🧠</span>
              <strong style={{ fontSize: 16, lineHeight: 1 }}>Coach Mode</strong>
            </div>
            <span style={{ fontSize: 12, opacity: 0.95 }}>
              Ask anything about lessons, portfolio polish, career steps, or funding.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <kbd
              title="Keyboard shortcut"
              style={{
                border: "1px solid rgba(255,255,255,.6)",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 12,
                background: "rgba(255,255,255,.15)",
              }}
            >
              Alt + C
            </kbd>
            <button
              ref={closeBtnRef}
              className="sh-btn sh-btn--secondary"
              onClick={onClose}
              aria-label="Close Coach"
              style={{
                borderColor: "rgba(255,255,255,.7)",
                background: "rgba(255,255,255,.15)",
                color: "#fff",
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Chat body */}
        <div style={{ overflow: "auto" }}>
          {/* AIChat is our generic chat component. We pass a stable mode for analytics theming. */}
          <AIChat mode="coach" />
        </div>

        {/* Footer helper */}
        <footer
          className="coach-foot"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: 10,
            borderTop: "1px solid var(--ring,#e5e7eb)",
            background: "var(--card,#fff)",
          }}
        >
          <div className="subtle" style={{ fontSize: 12 }}>
            Tip: Drag files or paste text for feedback. Use <strong>Shift+Enter</strong> for new lines.
          </div>
          <a
            className="sh-btn sh-btn--soft"
            href="/coach"
            onClick={(e) => {
              // allow default nav
            }}
          >
            Open Coach Page →
          </a>
        </footer>
      </aside>

      {/* styles */}
      <style>{`
        @keyframes coachSlideIn {
          from { transform: translateX(12px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        :not([data-app="curriculum"])[data-theme="dark"] .coach-panel {
          background:#0b0b0b;
          border-left-color:#23262d;
        }
        :not([data-app="curriculum"])[data-theme="dark"] .coach-head {
          border-bottom-color:#23262d;
        }
        :not([data-app="curriculum"])[data-theme="dark"] .coach-foot {
          background:#0b0b0b;
          border-top-color:#23262d;
        }
      `}</style>
    </>
  );
}
