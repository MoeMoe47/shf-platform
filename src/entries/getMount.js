// src/entries/getMount.js

/**
 * getMount(appName)
 * - Tries: [data-app="<appName>"] → #app → #root
 * - If none exist, it creates <div id="root" data-app="<appName>"></div>
 * - Ensures the chosen element has data-app set (idempotent).
 */
export function getMount(appName) {
  // 1) Prefer an explicit data-app match (most robust when multiple apps)
  let el = document.querySelector(`[data-app="${appName}"]`);

  // 2) Fall back to common ids
  if (!el) el = document.getElementById("app");
  if (!el) el = document.getElementById("root");

  // 3) If still not found, create one
  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
  }

  // 4) Ensure data-app attribute for styling/themes
  try {
    el.setAttribute("data-app", appName);
  } catch {}

  return el;
}

// Default export for convenience
export default getMount;
