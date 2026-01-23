const KEY = "shf.mode.v1";

function safeUpper(x) {
  return String(x || "").toUpperCase();
}

export function getMode() {
  if (typeof window === "undefined") return "PILOT";
  try {
    const v = safeUpper(window.localStorage.getItem(KEY) || "");
    return v === "SYSTEM" ? "SYSTEM" : "PILOT";
  } catch {
    return "PILOT";
  }
}

/**
 * Set mode and (optionally) emit event.
 * Emits ONLY if the value actually changed.
 */
export function setMode(next, opts = {}) {
  if (typeof window === "undefined") return safeUpper(next) === "SYSTEM" ? "SYSTEM" : "PILOT";

  const desired = safeUpper(next) === "SYSTEM" ? "SYSTEM" : "PILOT";
  const prev = getMode();

  // Always keep DOM synced
  try { document.documentElement.setAttribute("data-shf-mode", desired); } catch {}
  try { window.__SHF_MODE__ = desired; } catch {}

  // Persist (best effort)
  try { window.localStorage.setItem(KEY, desired); } catch {}

  // Emit ONLY if changed and not silenced
  const silent = !!opts.silent;
  if (!silent && prev !== desired) {
    try { window.dispatchEvent(new CustomEvent("shf:mode", { detail: { mode: desired, prev } })); } catch {}
  }

  return desired;
}

export function toggleMode() {
  const cur = getMode();
  return setMode(cur === "PILOT" ? "SYSTEM" : "PILOT");
}

// Called once at startup by RootProviders
export function initMode() {
  // ensure a stored value exists, but do NOT emit on boot
  return setMode(getMode(), { silent: true });
}
