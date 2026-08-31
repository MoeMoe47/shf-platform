// src/utils/storeTheme.js
// Minimal, shared Light/Dark/System theme mechanism for the Store app's
// new Catalog shell. Mirrors src/utils/arcadeTheme.js's established
// pattern exactly (same storage-key shape / change event / resolve+apply
// functions / hook) — the only real precedent for per-app theme
// persistence in this codebase. Kept as its own module, scoped to
// Store's own storage key and its own `data-theme` application, since
// Store is a separate Vite HTML entrypoint/bundle with no shared runtime
// with Curriculum/Career/Arcade.

const STORAGE_KEY = "store:ui:theme"; // "light" | "dark" | "system"
const VALID = new Set(["light", "dark", "system"]);
const CHANGE_EVENT = "store-theme-change";

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

export { STORAGE_KEY, CHANGE_EVENT };

// ---------------------------------------------------------------------
// Shared hook — the single source of theme state for the Store Catalog
// shell. Rendered exactly once, inside StoreHeader.
// ---------------------------------------------------------------------
import { useCallback, useEffect, useState } from "react";

export function useStoreTheme() {
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
