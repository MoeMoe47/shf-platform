// src/utils/setAppScope.js
/**
 * Idempotently scope <html> to an app and optional theme/classes.
 *
 * Back-compat:
 *   setAppScope("career", ["cur-theme-light"])
 *
 * Enhanced:
 *   setAppScope("store", {
 *     classes: ["cur-theme"],
 *     theme: "auto" | "light" | "dark",
 *     data: { env: "dev" },          // sets data-env="dev"
 *     keepDataApp: true              // keep current data-app on cleanup
 *   })
 *
 * Returns a cleanup function that removes only what this call added.
 */
export function setAppScope(appName, opts = []) {
  // --- SSR guard ---
  if (typeof document === "undefined") return () => {};

  const html = document.documentElement;

  // Normalize options (support array signature)
  const isArray = Array.isArray(opts);
  const classes = (isArray ? opts : opts.classes) || [];
  const theme = isArray ? "auto" : (opts.theme ?? "auto");
  const data = isArray ? null : (opts.data || null);
  const keepDataApp = isArray ? true : (opts.keepDataApp ?? true);

  // Remember state we may want to restore
  const prevApp = html.getAttribute("data-app");
  const prevTheme = html.getAttribute("data-theme");

  // Mark which app is active
  html.setAttribute("data-app", appName);

  // Track exactly what we add so cleanup is precise
  const addedClasses = new Set();
  const add = (c) => {
    if (!c) return;
    html.classList.add(c);
    addedClasses.add(c);
  };

  // Add requested classes
  classes.forEach(add);

  // --- Theme handling ---
  let media; // for 'auto' listener
  let onChange;
  const applyTheme = (t) => {
    // remove any previous theme-* class we added in this session
    if (html.dataset._lastThemeClass) {
      html.classList.remove(html.dataset._lastThemeClass);
      delete html.dataset._lastThemeClass;
    }

    // Resolve actual theme
    let resolved = t;
    if (t === "auto" && typeof window !== "undefined" && window.matchMedia) {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Set data-theme and a matching class
    html.setAttribute("data-theme", resolved);
    const cls = `theme-${resolved}`;
    add(cls);
    html.dataset._lastThemeClass = cls;
  };

  applyTheme(theme);

  // Listen to system changes if theme is auto
  if (theme === "auto" && typeof window !== "undefined" && window.matchMedia) {
    media = window.matchMedia("(prefers-color-scheme: dark)");
    onChange = () => applyTheme("auto");
    media.addEventListener?.("change", onChange);
  }

  // --- Optional data-* attributes ---
  const setDataKeys = [];
  if (data && typeof data === "object") {
    for (const [k, v] of Object.entries(data)) {
      const key = `data-${k}`;
      setDataKeys.push(key);
      html.setAttribute(key, String(v));
    }
  }

  // --- Cleanup handles only what we did here ---
  return () => {
    // Remove classes we added
    addedClasses.forEach((c) => html.classList.remove(c));

    // Remove our theme class and restore prior data-theme if any
    if (html.dataset._lastThemeClass) {
      html.classList.remove(html.dataset._lastThemeClass);
      delete html.dataset._lastThemeClass;
    }
    if (prevTheme != null) html.setAttribute("data-theme", prevTheme);
    else html.removeAttribute("data-theme");

    // Restore or clear data-app
    if (!keepDataApp) {
      if (prevApp == null) html.removeAttribute("data-app");
      else html.setAttribute("data-app", prevApp);
    }

    // Remove any data-* we set
    setDataKeys.forEach((k) => html.removeAttribute(k));

    // Remove listener
    if (media && onChange) media.removeEventListener?.("change", onChange);
  };
}
