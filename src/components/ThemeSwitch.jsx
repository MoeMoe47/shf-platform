// src/components/ThemeSwitch.jsx
// The one shared theme control for the Career app. Rendered exactly once,
// inside the shared AppShellLayout header — never duplicated per page or
// per breakpoint, per the locked placement standard. Same component, same
// state (useCareerTheme), same DOM/interaction pattern at every viewport;
// only its position within the (already-responsive) header may reflow.
import React, { useEffect, useId, useRef, useState } from "react";
import { useCareerTheme } from "@/utils/careerTheme.js";

const OPTIONS = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "🖥️" },
];

export default function ThemeSwitch() {
  const { preference, resolvedTheme, setPreference } = useCareerTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const current = OPTIONS.find((o) => o.value === preference) || OPTIONS[2];

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const focusables = () => Array.from(node.querySelectorAll('[role="menuitemradio"]'));
    // Focus the currently-selected option so keyboard users land on state,
    // not always the first item.
    const selected = focusables().find((el) => el.getAttribute("aria-checked") === "true");
    (selected || focusables()[0])?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
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
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = focusables();
        const idx = items.indexOf(document.activeElement);
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    const onDocClick = (e) => {
      if (node && !node.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDocClick);
      // preventScroll: the trigger is already on-screen when this fires;
      // without it the browser was jumping the page ~255px on close.
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const choose = (value) => {
    setPreference(value);
    setOpen(false);
  };

  return (
    <div className="theme-switch" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="theme-switch__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Theme, currently ${current.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" className="theme-switch__icon">{current.icon}</span>
        <span className="theme-switch__label">Theme</span>
      </button>
      {open && (
        <div className="theme-switch__menu" id={menuId} role="menu" aria-label="Theme">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === opt.value}
              className={`theme-switch__item ${preference === opt.value ? "is-selected" : ""}`}
              onClick={() => choose(opt.value)}
            >
              <span aria-hidden="true" className="theme-switch__itemIcon">{opt.icon}</span>
              <span className="theme-switch__itemLabel">{opt.label}</span>
              <span aria-hidden="true" className="theme-switch__check">{preference === opt.value ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      )}
      <span className="sh-srOnly" aria-live="polite">
        {`Theme set to ${current.label}${preference === "system" ? `, currently ${resolvedTheme}` : ""}`}
      </span>
    </div>
  );
}
