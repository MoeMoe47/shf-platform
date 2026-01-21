import { loadManifest } from "./index.js";
import { computeCapabilityFlags } from "./appCapabilities.js";

/**
 * Central list of app ids. Keep this aligned with scripts/generate-manifests.mjs.
 * If you want, we can later auto-generate this list from the manifest directory
 * at build-time, but keeping it explicit is safer for multi-entry apps.
 */
export const APP_IDS = [
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
  "solutions"
];

export function getAppRegistry() {
  return APP_IDS.map((id) => {
    const m = loadManifest(id);
    const caps = computeCapabilityFlags(id, m);
    return { id, manifest: m, caps };
  }).sort((a, b) => (a.manifest?.name || a.id).localeCompare(b.manifest?.name || b.id));
}
