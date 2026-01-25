import { loadManifest } from "./index.js";
import { computeCapabilityFlags } from "./appCapabilities.js";
import { resolveAppEnabled } from "./overrides.js";

function normalizeAppId(x) {
  if (typeof x === "string") return x.trim();
  if (x && typeof x === "object") {
    const v = x.id ?? x.appId ?? x.slug ?? x.name;
    return String(v ?? "").trim();
  }
  return String(x ?? "").trim();
}

function getModeSafe() {
  try {
    const raw =
      globalThis?.__SHF_MODE__ ||
      (typeof document !== "undefined"
        ? document.documentElement.getAttribute("data-shf-mode")
        : "") ||
      "PILOT";
    return String(raw).toUpperCase();
  } catch {
    return "PILOT";
  }
}

/**
 * Single source of truth: gatedBy + canOpen.
 * gatedBy: "SYSTEM_ONLY" | "PILOT_ONLY" | null
 */
export function resolveGatedBy(manifest, mode) {
  const m = manifest && typeof manifest === "object" ? manifest : {};
  const meta = m.meta && typeof m.meta === "object" ? m.meta : {};
  const contract = m.contract && typeof m.contract === "object" ? m.contract : {};

  // explicit override if present
  const explicit =
    contract.gatedBy ||
    meta.gatedBy ||
    meta.gate ||
    contract.gate ||
    null;

  let gatedBy = null;

  if (explicit === "SYSTEM_ONLY" || explicit === "PILOT_ONLY") {
    gatedBy = explicit;
  } else {
    // common fields
    const systemOnly = contract.systemOnly === true || meta.systemOnly === true;
    const pilotOnly = contract.pilotOnly === true || meta.pilotOnly === true || contract.pilotGate === true;

    if (systemOnly) gatedBy = "SYSTEM_ONLY";
    else if (pilotOnly) gatedBy = "PILOT_ONLY";
  }

  const mm = String(mode || "PILOT").toUpperCase();
  const canOpen =
    !gatedBy ||
    (gatedBy === "SYSTEM_ONLY" && mm === "SYSTEM") ||
    (gatedBy === "PILOT_ONLY" && mm === "PILOT");

  return { gatedBy, canOpen, mode: mm };
}

/**
 * Central list of app ids. Keep aligned with scripts/generate-manifests.mjs.
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
  "solutions"
];

export function getAppRegistry() {
  const mode = getModeSafe();

  return APP_IDS
    .map(normalizeAppId)
    .filter(Boolean)
    .map((id) => {
      // Never crash the registry if a manifest is missing/broken
      let m = {};
      try {
        m = loadManifest(id) || {};
      } catch {
        m = { id, name: id, meta: {}, contract: {} };
      }

      let caps = { map: false, ledger: false, analytics: false, payments: false };
      try {
        caps = computeCapabilityFlags(id, m) || caps;
      } catch {}

      let enabled = false;
      try {
        enabled = resolveAppEnabled(id, m) === true;
      } catch {
        enabled = false;
      }

      const gate = resolveGatedBy(m, mode);

      return { id, manifest: m, caps, enabled, gatedBy: gate.gatedBy, canOpen: gate.canOpen };
    })
    .sort((a, b) => (a.manifest?.name || a.id).localeCompare(b.manifest?.name || b.id));
}
