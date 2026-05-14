// src/components/KeyboardOverlay.jsx
import React from "react";
import PropTypes from "prop-types";

export const DEFAULT_SHORTCUTS = [
  { keys: "⌘K / Ctrl+K", label: "Open command palette" },
  { keys: "G then D",     label: "Go to Dashboard" },
  { keys: "J",            label: "Rewind 10s (video)" },
  { keys: "K",            label: "Play / Pause (video)" },
  { keys: "L",            label: "Forward 10s (video)" },
  { keys: "1–4",          label: "Pick answer choices" },
  { keys: "Tab / Shift+Tab", label: "Move focus" },
  { keys: "Esc",          label: "Close overlays / drawer" },
];

export default function KeyboardOverlay({ open, onClose, shortcuts = DEFAULT_SHORTCUTS }) {
  const cardRef = React.useRef(null);
  const lastFocusRef = React.useRef(null);

  const close = React.useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Focus trap & keyboard handling
  React.useEffect(() => {
    if (!open) return;

    // Remember previously focused element
    lastFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Prevent body scroll while open
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    // Focus the first focusable in the dialog
    requestAnimationFrame(() => {
      const focusables = getFocusables(cardRef.current);
      (focusables[0] || cardRef.current)?.focus();
    });

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab") {
        const focusables = getFocusables(cardRef.current);
        if (focusables.length === 0) return;
        const i = focusables.indexOf(document.activeElement);
        if (e.shiftKey) {
          // Shift+Tab on first -> wrap to last
          if (i <= 0) {
            e.preventDefault();
            focusables[focusables.length - 1].focus();
          }
        } else {
          // Tab on last -> wrap to first
          if (i === focusables.length - 1) {
            e.preventDefault();
            focusables[0].focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Restore focus & scrolling
      lastFocusRef.current?.focus?.();
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  function onScrimMouseDown(e) {
    // Only close if scrim itself was clicked
    if (e.target === e.currentTarget) close();
  }

  const titleId = "kb-title";
  const descId  = "kb-desc";

  return (
    <div
      className="kb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={onScrimMouseDown}
    >
      <div
        className="kb-card"
        ref={cardRef}
        tabIndex={-1}
        role="document"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <h2 id={titleId} style={{ margin: 0 }}>Keyboard Shortcuts</h2>
          <button className="sh-btn sh-btn--tiny" onClick={close} aria-label="Close">×</button>
        </div>

        <p id={descId} className="sh-muted" style={{ margin: "6px 0 12px" }}>
          Navigate faster, no mouse needed.
        </p>

        <ul className="kb-grid" role="list">
          {shortcuts.map((s, i) => (
            <li key={`${s.keys}-${i}`}>
              <span className="kbd" aria-hidden>{s.keys}</span>
              <span className="sh-srOnly">Keys: {s.keys}. </span>
              {s.label}
            </li>
          ))}
        </ul>

        <div className="kb-actions" style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="sh-btn" onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}

KeyboardOverlay.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  shortcuts: PropTypes.arrayOf(
    PropTypes.shape({
      keys: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

/* ---------- small util ---------- */
function getFocusables(root) {
  if (!root) return [];
  const sel = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(root.querySelectorAll(sel)).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
  );
}
