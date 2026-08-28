// src/components/civic/CivicInfoDialog.jsx
// Shared, accessible informational dialog for Civic — mirrors
// src/components/arcade/ArcadeInfoDialog.jsx's proven focus-trap/Escape/
// focus-restoration pattern exactly, scoped to Civic's own class names.
// Used for honest "no live feed yet" states (Notifications) instead of a
// dead control.
import React, { useEffect, useRef } from "react";

export default function CivicInfoDialog({ open, onClose, titleId, title, children, returnFocusRef }) {
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
    <div className="cv-dialog__scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className="cv-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="cv-dialog__head">
          <h2 id={titleId} className="cv-dialog__title">{title}</h2>
          <button type="button" className="cv-dialog__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="cv-dialog__body">{children}</div>
      </div>
    </div>
  );
}
