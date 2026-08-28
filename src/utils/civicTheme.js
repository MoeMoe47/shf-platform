// src/utils/civicTheme.js
// Minimal, shared Light/Dark/System theme mechanism for the Civic app.
//
// Mirrors src/utils/arcadeTheme.js / src/utils/careerTheme.js's established
// pattern exactly (same storage-key/change-event/resolve+apply shape) —
// that is the only real precedent for per-app theme persistence in this
// codebase (no reusable global ThemeProvider exists). Kept as its own
// module, scoped to Civic's own storage key and its own `data-theme`
// application, since Civic is a separate Vite HTML entrypoint/bundle with
// no shared runtime with Arcade/Career/Curriculum.
//
// Civic's own CSS reads the same `data-theme` attribute on <html>, scoped
// under `[data-app="civic"]` so it can never affect the other apps, which
// are separate page loads entirely.

const STORAGE_KEY = "civic:theme"; // "light" | "dark" | "system"
const VALID = new Set(["light", "dark", "system"]);
const CHANGE_EVENT = "civic-theme-change";

export function getStoredPreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (VALID.has(v)) return v;
  } catch {}
  return "system";
}

export function setStoredPreference(pref) {
  if (!VALID.has(pref)) return;
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {}
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { pref } }));
}

export function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveTheme(pref) {
  return pref === "system" ? (systemPrefersDark() ? "dark" : "light") : pref;
}

export function applyResolvedTheme(resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function initCivicTheme() {
  const pref = getStoredPreference();
  applyResolvedTheme(resolveTheme(pref));
}

export { STORAGE_KEY, CHANGE_EVENT };

// ---------------------------------------------------------------------
// Shared hook — the single source of theme state for Civic. Rendered
// exactly once, inside the shared Civic top bar, never duplicated per
// page or per breakpoint.
// ---------------------------------------------------------------------
import { useCallback, useEffect, useState } from "react";

export function useCivicTheme() {
  const [pref, setPref] = useState(getStoredPreference);
  const [resolved, setResolved] = useState(() => resolveTheme(getStoredPreference()));

  useEffect(() => {
    applyResolvedTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    setResolved(resolveTheme(pref));
  }, [pref]);

  useEffect(() => {
    if (pref !== "system" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(resolveTheme("system"));
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () =>
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
  }, [pref]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPref(getStoredPreference());
    };
    const onCustom = () => setPref(getStoredPreference());
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onCustom);
    };
  }, []);

  const setPreference = useCallback((next) => {
    setStoredPreference(next);
    setPref(next);
  }, []);

  return { preference: pref, resolvedTheme: resolved, setPreference };
}
