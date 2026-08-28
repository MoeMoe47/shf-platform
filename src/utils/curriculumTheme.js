// src/utils/curriculumTheme.js
// Minimal, shared Light/Dark/System theme mechanism for the Curriculum app.
//
// Mirrors src/utils/careerTheme.js / src/utils/arcadeTheme.js's established
// pattern exactly (same shape of storage key / change event / resolve+apply
// functions / hook / markDarkScope) — the only real precedent for per-app
// theme persistence in this codebase. Kept as its own module rather than
// importing careerTheme.js/arcadeTheme.js directly: Curriculum is a
// separate Vite HTML entrypoint/bundle with no shared runtime, and a shared
// preference would be the wrong behavior anyway (a Career light-mode choice
// must not silently force Curriculum students into Career's palette).
//
// A curriculum-specific theme mechanism already existed before this
// (src/utils/curriculum/theme.js, src/components/curriculum/ThemeToggle.jsx)
// but had zero live callers and only ever toggled `cur-theme-light/dark`
// classes that no live stylesheet reads (curriculum-shell.css/
// curriculum-sidebar.css/curriculum-skin.css — the pre-dashboard-redesign
// shell, itself unused). This module is additive and does not remove that
// dead code; it follows the *live* `data-theme` attribute convention every
// other real app in this repo already uses, which curriculum-dashboard.css
// / curriculum-lesson.css's new dark-mode rules are written against.
//
// Curriculum's own CSS reads the same `data-theme` attribute on <html>,
// scoped under `[data-app="curriculum"]` so it can never affect
// Career/Arcade/Civic/Sales/other apps, which are separate page loads
// entirely.

const STORAGE_KEY = "curriculum:ui:theme"; // "light" | "dark" | "system"
const VALID = new Set(["light", "dark", "system"]);
const CHANGE_EVENT = "curriculum-theme-change";

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

export function initCurriculumTheme() {
  const pref = getStoredPreference();
  applyResolvedTheme(resolveTheme(pref));
}

// Lets a mounted component announce "I have real dark styling" so shared
// cross-app chrome (Brainiact — src/styles/companion.css) only goes dark
// where it's actually been given curriculum-appropriate dark colors. See
// careerTheme.js's identical markDarkScope for the full rationale.
export function markDarkScope(scopeName, active) {
  if (typeof document === "undefined") return;
  const el = document.body;
  const existing = new Set((el.getAttribute("data-dark-scope") || "").split(/\s+/).filter(Boolean));
  if (active) existing.add(scopeName);
  else existing.delete(scopeName);
  if (existing.size) el.setAttribute("data-dark-scope", Array.from(existing).join(" "));
  else el.removeAttribute("data-dark-scope");
}

export { STORAGE_KEY, CHANGE_EVENT };

// ---------------------------------------------------------------------
// Shared hook — the single source of theme state. Rendered exactly once
// (CurriculumThemeSwitch, mounted in CurriculumHeader.jsx), never
// duplicated per page or per breakpoint, per the locked-placement standard
// every other app's ThemeSwitch already follows.
// ---------------------------------------------------------------------
import { useCallback, useEffect, useState } from "react";

export function useCurriculumTheme() {
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
