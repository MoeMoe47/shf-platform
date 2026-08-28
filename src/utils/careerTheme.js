// src/utils/careerTheme.js
// Minimal, shared Light/Dark/System theme mechanism for the Career app.
//
// No reusable global theme provider exists in this codebase today (checked:
// no ThemeProvider/useTheme context anywhere; the only two prior art pieces
// are `setAppScope.js`'s per-mount matchMedia resolver, used by debt/employer
// /treasury only and never wired to any live dark CSS, and curriculum's own
// class-based `cur:ui:theme` toggle, which is curriculum-only). Career's own
// stylesheets (theme-shf.css, shell.css, unified-shell.css, career-shell.css)
// define a single light palette with no dark variants and no
// prefers-color-scheme handling. This module intentionally does not try to
// unify with either of those — it follows the `data-theme` attribute naming
// convention `setAppScope.js` already established (so a future shared
// provider can adopt the same attribute name), backed by real persistence,
// which neither existing mechanism has.
//
// IMPORTANT SCOPE NOTE: setting `data-theme="dark"` on <html> is safe today
// because no live Career stylesheet currently reads that attribute — but as
// dark support is added incrementally, every dark rule must additionally be
// gated so it only paints pages that have actually been given dark styling
// (see markDarkScope() below), so an unfinished page never ends up half
// dark / half light.

const STORAGE_KEY = "career:ui:theme"; // "light" | "dark" | "system"
const VALID = new Set(["light", "dark", "system"]);
const CHANGE_EVENT = "career-theme-change";

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

// A page opts into actually rendering dark styling by setting this on
// document.body while it's mounted (and clearing it on unmount). Dark CSS
// rules for shared shell chrome (header/sidebar) are written as
// `body[data-dark-scope~="resume-builder"][data-theme="dark"] .sh-header {...}`
// so the shared header only goes dark while a page that has real dark
// support is active — the theme *preference* is global and persists
// everywhere, but the *visual* dark application only reaches pages that
// have been explicitly built for it, exactly as instructed.
export function markDarkScope(scopeName, active) {
  if (typeof document === "undefined") return;
  const el = document.body;
  const existing = new Set((el.getAttribute("data-dark-scope") || "").split(/\s+/).filter(Boolean));
  if (active) existing.add(scopeName);
  else existing.delete(scopeName);
  if (existing.size) el.setAttribute("data-dark-scope", Array.from(existing).join(" "));
  else el.removeAttribute("data-dark-scope");
}

export function initCareerTheme() {
  const pref = getStoredPreference();
  applyResolvedTheme(resolveTheme(pref));
}

export { STORAGE_KEY, CHANGE_EVENT };

// ---------------------------------------------------------------------
// Shared hook — the single source of theme state. Both the desktop and
// mobile presentations of the header render the *same* <ThemeSwitch/>
// component instance tree (AppShellLayout's header is not duplicated per
// breakpoint), so there is exactly one place this hook is used, not one
// per viewport.
// ---------------------------------------------------------------------
import { useCallback, useEffect, useState } from "react";

export function useCareerTheme() {
  const [pref, setPref] = useState(getStoredPreference);
  const [resolved, setResolved] = useState(() => resolveTheme(getStoredPreference()));

  useEffect(() => {
    applyResolvedTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    setResolved(resolveTheme(pref));
  }, [pref]);

  // Live-update when "system" is selected and the OS preference changes.
  useEffect(() => {
    if (pref !== "system" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(resolveTheme("system"));
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () =>
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
  }, [pref]);

  // Stay in sync if another tab/window changes the preference.
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
