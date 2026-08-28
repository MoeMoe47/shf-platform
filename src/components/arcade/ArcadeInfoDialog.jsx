// src/components/arcade/ArcadeInfoDialog.jsx
// One shared, accessible informational dialog used everywhere the Learning
// Arcade Home / Classical Arcade Room need an honest "planned capability"
// state instead of a dead button (Open Creator Studio, Build Agent Game,
// Submit a Game, How the Arcade Works, Accessibility, Sign Out, etc.) — per
// the audit's explicit instruction not to imply a functioning system that
// doesn't exist yet, and not to leave a control that does nothing.
//
// Focus handling mirrors the two other real dialog/drawer patterns already
// in this codebase (ThemeSwitch.jsx's menu, AppShellLayout.jsx's mobile
// drawer): focus moves into the dialog on open, Tab is trapped inside it,
// Escape closes it, and focus returns to the control that opened it.
import React, { useEffect, useRef } from "react";

export default function ArcadeInfoDialog({ open, onClose, titleId, title, children, returnFocusRef }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;

    const focusables = () =>
      Array.from(node.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef?.current?.focus?.();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="ar-dialog__scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className="ar-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="ar-dialog__head">
          <h2 id={titleId} className="ar-dialog__title">{title}</h2>
          <button type="button" className="ar-dialog__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="ar-dialog__body">{children}</div>
      </div>
    </div>
  );
}
