// src/context/Toasts.jsx
import React from "react";

/**
 * Toast shape:
 * {
 *   id: string,
 *   kind: "info" | "success" | "error",
 *   text: string,
 *   at: number,
 *   ttl: number,                 // auto-dismiss ms
 *   action?: { label: string, onClick: () => void }
 * }
 */

const ToastsCtx = React.createContext({
  toasts: [],
  // legacy-style helpers
  push: (_msg, _opts) => {},
  success: (_msg, _opts) => {},
  error: (_msg, _opts) => {},
  info: (_msg, _opts) => {},
  remove: (_id) => {},
  // new generic helper w/ actions
  toast: (_msg, _opts) => {},
});

export function useToasts() {
  return React.useContext(ToastsCtx);
}

export function ToastsProvider({ children, defaultTTL = 3500, max = 5 }) {
  const [toasts, setToasts] = React.useState([]);

  const remove = React.useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // Core add function
  const pushBase = React.useCallback(
    (kind, text, opts = {}) => {
      const id = "t_" + Math.random().toString(36).slice(2);
      const ttl = Number(
        // prefer explicit duration if provided, else ttl, else default
        (opts.duration ?? opts.ttl ?? defaultTTL)
      );
      const action =
        opts.action && typeof opts.action.onClick === "function"
          ? { label: opts.action.label || "Action", onClick: opts.action.onClick }
          : undefined;

      const toast = { id, kind, text, at: Date.now(), ttl, action };

      setToasts((t) => {
        const next = [...t, toast];
        return next.slice(-max);
      });

      if (ttl > 0) {
        const timer = setTimeout(() => remove(id), ttl);
        // Return disposer (e.g., to cancel in-flight)
        return () => clearTimeout(timer);
      }
      return () => {};
    },
    [defaultTTL, max, remove]
  );

  // New generic: toast("msg", { type|kind, duration|ttl, action })
  const toast = React.useCallback(
    (message, opts = {}) => {
      const kind = (opts.type || opts.kind || "info").toLowerCase();
      return pushBase(kind, message, opts);
    },
    [pushBase]
  );

  const api = React.useMemo(
    () => ({
      toasts,
      remove,
      // keep legacy names working
      push: (msg, opts) => pushBase("info", msg, opts),
      success: (msg, opts) => pushBase("success", msg, opts),
      error: (msg, opts) => pushBase("error", msg, opts),
      info: (msg, opts) => pushBase("info", msg, opts),
      // new generic w/ action + duration support
      toast,
    }),
    [toasts, remove, pushBase, toast]
  );

  return (
    <ToastsCtx.Provider value={api}>
      {children}
      <ToastsViewport toasts={toasts} onClose={remove} />
    </ToastsCtx.Provider>
  );
}

function ToastsViewport({ toasts, onClose }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="toasts-wrap"
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        display: "grid",
        gap: 8,
        zIndex: 60,
        maxWidth: "min(380px, 90vw)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`sh-toast is-${t.kind || "info"}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--ring,#e5e7eb)",
            background:
              t.kind === "success"
                ? "#ecfdf5"
                : t.kind === "error"
                ? "#fef2f2"
                : "#ffffff",
            boxShadow: "0 6px 20px rgba(0,0,0,.06)",
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>
            {t.kind === "success" ? "✅" : t.kind === "error" ? "⚠️" : "ℹ️"}
          </span>
          <div style={{ lineHeight: 1.35, flex: 1 }}>
            <div style={{ fontSize: 14 }}>{t.text}</div>
            {t.action && (
              <button
                className="toast-action sh-btn is-ghost"
                onClick={() => {
                  try { t.action.onClick?.(); } finally { onClose(t.id); }
                }}
                style={{ marginTop: 6, fontSize: 12, padding: "2px 6px" }}
              >
                {t.action.label || "Undo"}
              </button>
            )}
          </div>
          <button
            onClick={() => onClose(t.id)}
            className="sh-btn is-ghost"
            aria-label="Dismiss notification"
            style={{ marginLeft: "auto" }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
