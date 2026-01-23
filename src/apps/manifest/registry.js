import { loadManifest } from "./index.js";
import { computeCapabilityFlags } from "./appCapabilities.js";
import { resolveAppEnabledWithSource } from "./overrides.js";

function normalizeAppId(x) {
  if (typeof x === "string") return x.trim();
  if (x && typeof x === "object") {
    const v = x.id ?? x.appId ?? x.slug ?? x.name;
    return String(v ?? "").trim();
  }
  return String(x ?? "").trim();
}

/**
 * Central list of app ids. Keep this aligned with scripts/generate-manifests.mjs.
 */
export const APP_IDS = [
  "career",
  "foundation",
  "admin",
  "curriculum",
  "arcade",
  "civic",
  "credit",
  "debt",
  "treasury",
  "employer",
  "sales",
  "loo",
  "ai",
  "fuel",
  "launch",
  "store",
  "solutions",
];

function readMode() {
  try {
    const dom = (typeof document !== "undefined")
      ? (document.documentElement.getAttribute("data-shf-mode") || "")
      : "";
    const g = (typeof globalThis !== "undefined" && globalThis.__SHF_MODE__)
      ? String(globalThis.__SHF_MODE__)
      : "";
    return String(g || dom || "PILOT").toUpperCase();
  } catch {
    return "PILOT";
  }
}

export function getAppRegistry() {
  const mode = readMode();

  return APP_IDS
    .map(normalizeAppId)
    .filter(Boolean)
    .map((id) => {
      const m = loadManifest(id);
      const caps = computeCapabilityFlags(id, m);

      // enabled resolution (session override > persisted override > manifest)
      const info = resolveAppEnabledWithSource(id, m);
      let enabled = !!info.enabled;
      const enabledSource = info.source || "manifest";

      // mode gating (from manifest meta)
      const shf = (m && m.meta && m.meta.shf) ? m.meta.shf : {};
      const systemOnly = !!shf.systemOnly;
      const pilotOnly = !!shf.pilotOnly;

      let gatedBy = null;
      if (systemOnly && mode !== "SYSTEM") gatedBy = "SYSTEM_ONLY";
      if (pilotOnly && mode === "SYSTEM") gatedBy = "PILOT_ONLY";

      if (gatedBy) enabled = false;

      return {
        id,
        manifest: m,
        caps,
        enabled,
        enabledSource,
        gatedBy,
        mode,
      };
    })
    .sort((a, b) => (a.manifest?.name || a.id).localeCompare(b.manifest?.name || b.id));
}
