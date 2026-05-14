import { appScope } from "@/shared/appScope.js";

/** emit("portfolio:update", {...}, "civic")
 *  fires BOTH "civic:portfolio:update" (namespaced) and "portfolio:update" (legacy)
 */
export function emit(name, detail, app = appScope()) {
  try {
    const ns = `${app}:${name}`;
    window.dispatchEvent(new CustomEvent(ns, { detail }));
  } catch {}
  try {
    // legacy broadcast for backwards compatibility
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {}
}

export function on(name, handler, app = appScope()) {
  const ns = `${app}:${name}`;
  const bound = (e) => handler(e.detail ?? e);
  window.addEventListener(ns, bound);
  return () => window.removeEventListener(ns, bound);
}

export function onAny(name, handler) {
  const bound = (e) => handler(e.detail ?? e, e.type);
  window.addEventListener(name, bound);
  return () => window.removeEventListener(name, bound);
}
