// src/shared/storage/guard.js
// Lightweight guard + KPI bump utilities used by Civic Proposals, etc.

import React from "react";

const PREFIX = "shf.guard.v1.";

/** Safe localStorage get */
function safeGet(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Safe localStorage set */
function safeSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // swallow – storage can be full or disabled
  }
}

/**
 * useStorageGuard(namespace?: string)
 *
 * Simple hook that always returns ok=true for now, but
 * gives you a place to plug in quota / device checks later.
 */
export function useStorageGuard(namespace = "default") {
  const [state] = React.useState(() => ({
    ok: true,
    blocked: false,
    reason: null,
    namespace,
  }));

  // Future: add detection for private mode / disabled storage here.
  return state;
}

/**
 * bumpKPI(key: string, delta?: number)
 *
 * Tiny helper to increment a numeric KPI counter in localStorage.
 * Used by Proposals and other pages to track engagement.
 */
export function bumpKPI(key, delta = 1) {
  if (!key) return;
  const fullKey = PREFIX + key;
  const raw = safeGet(fullKey);
  const current = raw ? parseInt(raw, 10) || 0 : 0;
  const next = current + delta;
  safeSet(fullKey, String(next));
  return next;
}
