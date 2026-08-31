// src/components/AppSwitcher.jsx
// Consolidates the header's former permanent row of 5 separate cross-app
// buttons (Career/Curriculum/Sales/Arcade/Debt) into one compact,
// accessible switcher. Every destination is preserved — nothing removed,
// just moved behind one control. Mirrors ThemeSwitch.jsx's interaction
// pattern (trigger + menu, Escape, outside-click, focus restoration,
// contained in viewport) for a consistent "equivalent shared control".
import React, { useEffect, useId, useRef, useState } from "react";

const APPS = [
  { key: "career", label: "Career", href: "/career.html#/dashboard", icon: "🎯" },
  { key: "curriculum", label: "Curriculum", href: "/curriculum.html#/", icon: "📚" },
  { key: "sales", label: "Sales", href: "/sales.html#/sales/dashboard", icon: "📈" },
  { key: "arcade", label: "Arcade", href: "/arcade.html#/dashboard", icon: "🕹️" },
  { key: "debt", label: "Debt", href: "/debt.html#/clock", icon: "⏱️" },
  { key: "store", label: "Store", href: "/store.html#/catalog", icon: "🛍️" },
];

export default function AppSwitcher({ currentApp }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const focusables = () => Array.from(node.querySelectorAll('[role="menuitem"]'));
    focusables()[0]?.focus();

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

  const current = APPS.find((a) => a.key === currentApp);

  return (
    <div className="app-switcher" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="app-switcher__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Switch application, currently ${current?.label || "Career"}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" className="app-switcher__icon">⊞</span>
        <span className="app-switcher__label">Apps</span>
      </button>
      {open && (
        <div className="app-switcher__menu" id={menuId} role="menu" aria-label="Applications">
          {APPS.map((a) => (
            <a
              key={a.key}
              href={a.href}
              role="menuitem"
              className={`app-switcher__item ${a.key === currentApp ? "is-current" : ""}`}
              aria-current={a.key === currentApp ? "page" : undefined}
            >
              <span aria-hidden="true" className="app-switcher__itemIcon">{a.icon}</span>
              <span className="app-switcher__itemLabel">{a.label}</span>
              {a.key === currentApp && <span aria-hidden="true" className="app-switcher__check">✓</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
