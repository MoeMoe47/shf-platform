export const SHS_AUTH_API_BASE =
  window.__SHS_API_BASE__ ||
  (import.meta.env.VITE_SHS_API_BASE || "/api");

export function isProductionBuild() {
  return import.meta.env.PROD;
}

export function isLocalDevelopmentHost() {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  } catch {
    return false;
  }
}

export function isDemoIdentityAllowed() {
  return !isProductionBuild() &&
    isLocalDevelopmentHost() &&
    String(import.meta.env.VITE_SHS_DEMO_IDENTITY_ENABLED || "").toLowerCase() === "true";
}

