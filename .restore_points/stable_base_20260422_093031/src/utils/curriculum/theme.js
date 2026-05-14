// src/utils/curriculum/theme.js
const THEME_KEY  = "cur:ui:theme";      // "light" | "dark"
const ANCHOR_KEY = "cur:ui:no-anchor";  // "1" | "0"

export function currentTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme = "light") {
  const html = document.documentElement;
  // Scope to Curriculum by class, not a global data-theme attribute
  html.classList.toggle("cur-theme-light", theme === "light");
  html.classList.toggle("cur-theme-dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme(defaultTheme = "light") {
  const html = document.documentElement;
  // Scope this page to Curriculum only
  html.setAttribute("data-app", "curriculum");
  applyTheme(localStorage.getItem(THEME_KEY) || defaultTheme || currentTheme());
}

export function setNoAnchor(enabled) {
  const html = document.documentElement;
  html.classList.toggle("no-anchor", !!enabled);
  localStorage.setItem(ANCHOR_KEY, enabled ? "1" : "0");
  if (enabled) html.style.setProperty("--cur-anchor-w", "0px");
}

export function initAnchor(defaultEnabled = true) {
  const saved = localStorage.getItem(ANCHOR_KEY);
  const enabled = saved == null ? defaultEnabled : saved === "1";
  setNoAnchor(enabled);
}
