// src/shared/storage/guard.jsx
import React from "react";

/** Safely parse JSON; return fallback on error */
export function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

/** Soft-reset a single key (remove it) */
export function softResetKey(key) {
  try { localStorage.removeItem(key); } catch {}
  try { window.dispatchEvent(new StorageEvent("storage", { key, newValue: "removed" })); } catch {}
}

/** Bump a numeric KPI key and ping listeners */
export function bumpKPI(key, delta = 1) {
  try {
    const n = Math.max(0, (Number(localStorage.getItem(key)) || 0) + Number(delta || 0));
    localStorage.setItem(key, String(n));
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: String(n) }));
  } catch {}
}

/**
 * useStorageGuard(keys, { toast })
 * - Validates JSON for the provided localStorage keys on mount.
 * - If a key is malformed JSON, it is soft-reset (removed) so pages won’t crash.
 * - Optionally shows a toast per fix.
 */
export function useStorageGuard(keys = [], opts = {}) {
  const toast = opts.toast || opts?.toasts?.toast;
  React.useEffect(() => {
    try {
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw == null) continue;
        try { JSON.parse(raw); }
        catch {
          softResetKey(k);
          toast?.(`Storage fixed for ${k}`, { type: "info" });
        }
      }
    } catch (e) {
      toast?.(`Storage check failed: ${e.message}`, { type: "error" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(keys)]);
}

/* -------------------------------------------
   OPTIONAL: small inline reset control
-------------------------------------------- */
export function StorageSoftReset({ keys = [], onDone, label = "Reset storage" }) {
  return (
    <button
      className="sh-btn is-ghost"
      onClick={() => {
        keys.forEach(softResetKey);
        onDone?.();
      }}
    >
      {label}
    </button>
  );
}
