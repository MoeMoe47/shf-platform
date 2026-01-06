// src/context/Toasts.jsx
import React from "react";

const ToastsCtx = React.createContext({ push: (t) => {} });

export function ToastsProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    const next = { id, kind: t.kind || "info", text: t.text || String(t), ttl: t.ttl ?? 3200 };
    setToasts((arr) => [...arr, next]);
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), next.ttl);
  }, []);

  // Fallback: allow fire via window event if a caller doesn’t have the hook
  React.useEffect(() => {
    const h = (e) => push(e.detail || { text: "Done", kind: "success" });
    window.addEventListener("toast:show", h);
    return () => window.removeEventListener("toast:show", h);
  }, [push]);

  return (
    <ToastsCtx.Provider value={{ push }}>
      {children}
      <Toaster items={toasts} />
    </ToastsCtx.Provider>
  );
}

export function useToasts() {
  return React.useContext(ToastsCtx);
}

function Toaster({ items }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        display: "grid",
        gap: 8,
        zIndex: 60,
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="card"
          style={{
            minWidth: 260,
            maxWidth: 360,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--ring,#e5e7eb)",
            background:
              t.kind === "success"
                ? "#ecfdf5"
                : t.kind === "error"
                ? "#fef2f2"
                : t.kind === "warn"
                ? "#fffbeb"
                : "#ffffff",
            boxShadow: "0 8px 24px rgba(0,0,0,.06)",
            fontSize: 14,
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
