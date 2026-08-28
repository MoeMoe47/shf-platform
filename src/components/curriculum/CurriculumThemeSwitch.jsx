// src/components/curriculum/CurriculumThemeSwitch.jsx
// The one shared theme control for the Curriculum app. Rendered exactly
// once, inside CurriculumHeader.jsx — never duplicated per page or per
// breakpoint, per the same locked-placement standard Career's
// ThemeSwitch.jsx / Arcade's ArcadeThemeSwitch.jsx already established.
// Same interaction pattern (menu / menuitemradio / arrow-key navigation /
// Escape / focus restoration) as those, wired to useCurriculumTheme() and
// its own class names so Curriculum's dark/light styling never depends on
// another app's stylesheet being loaded (it isn't — separate bundle).
import React, { useEffect, useId, useRef, useState } from "react";
import { useCurriculumTheme } from "@/utils/curriculumTheme.js";

const OPTIONS = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "🖥️" },
];

export default function CurriculumThemeSwitch() {
  const { preference, resolvedTheme, setPreference } = useCurriculumTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const current = OPTIONS.find((o) => o.value === preference) || OPTIONS[2];

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const focusables = () => Array.from(node.querySelectorAll('[role="menuitemradio"]'));
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
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const choose = (value) => {
    setPreference(value);
    setOpen(false);
  };

  return (
    <div className="ld-themeSwitch" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="ld-iconBtn ld-themeSwitch__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Theme, currently ${current.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{current.icon}</span>
      </button>
      {open && (
        <div className="ld-themeSwitch__menu" id={menuId} role="menu" aria-label="Theme">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === opt.value}
              className={`ld-themeSwitch__item ${preference === opt.value ? "is-selected" : ""}`}
              onClick={() => choose(opt.value)}
            >
              <span aria-hidden="true" className="ld-themeSwitch__itemIcon">{opt.icon}</span>
              <span className="ld-themeSwitch__itemLabel">{opt.label}</span>
              <span aria-hidden="true" className="ld-themeSwitch__check">{preference === opt.value ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      )}
      <span className="ld-srOnly" aria-live="polite">
        {`Theme set to ${current.label}${preference === "system" ? `, currently ${resolvedTheme}` : ""}`}
      </span>
    </div>
  );
}
