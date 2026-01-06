// src/shared/ui/focusMode.js
export function enableFocusMode() {
  try { document.documentElement.dataset.focus = "1"; } catch {}
}
export function disableFocusMode() {
  try { document.documentElement.dataset.focus = "0"; } catch {}
}
export function toggleFocusMode() {
  try {
    const cur = document.documentElement.dataset.focus === "1";
    document.documentElement.dataset.focus = cur ? "0" : "1";
  } catch {}
}

// Global event hook so anything can fire it:
(function installGlobalFocusToggle() {
  if (typeof window === "undefined") return;
  if (window.__focusToggleInstalled) return;
  window.__focusToggleInstalled = true;

  window.addEventListener("focusmode:toggle", toggleFocusMode);
  window.addEventListener("focusmode:on", enableFocusMode);
  window.addEventListener("focusmode:off", disableFocusMode);
})();
