// src/components/store/StoreInfoDialog.jsx
// Shared, accessible informational dialog for Catalog offering cards that
// have no real detail route yet (see catalogOfferings.js's detailHref —
// null cards open this instead of a dead link). Same focus-trap/Escape/
// return-focus pattern already established by ArcadeInfoDialog.jsx and
// CivicInfoDialog.jsx, duplicated locally rather than imported (Store is
// a separate bundle from Arcade/Civic).
import React, { useEffect, useRef } from "react";

export default function StoreInfoDialog({ open, onClose, titleId, title, children, returnFocusRef }) {
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
    <div className="cs-dialogScrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="cs-dialogCard" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        <div>{children}</div>
        <button type="button" className="cs-dialogClose" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
