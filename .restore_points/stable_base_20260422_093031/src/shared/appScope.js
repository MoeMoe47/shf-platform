/** Return current app scope by reading the root [data-app] or a global. */
export function appScope() {
  try {
    const el = document.querySelector("[data-app]") || document.body;
    return (el && el.dataset && el.dataset.app) || window.__APP_SCOPE || "unknown";
  } catch {
    return "unknown";
  }
}

/** Prefix a storage/event key with the current app (e.g., "civic:portfolio:items") */
export function nsKey(key, app = appScope()) {
  return `${app}:${key}`;
}
