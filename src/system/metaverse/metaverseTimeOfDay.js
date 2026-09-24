export const METAVERSE_TIME_OF_DAY_MODES = ["AUTO", "DAY", "DUSK", "NIGHT"];

export const METAVERSE_TIME_OF_DAY_WINDOWS = {
  DAY: { startHour: 7, endHour: 17 },
  DUSK: { startHour: 17, endHour: 20 },
  NIGHT: { startHour: 20, endHour: 7 },
};

export const METAVERSE_TIME_OF_DAY_META = {
  presentationOnly: true,
  usesLearnerLocalBrowserTime: true,
  grantsAuthority: false,
  affectsEligibility: false,
  persistsInstitutionalTruth: false,
};

export function normalizeTimeOfDayMode(mode = "AUTO") {
  const normalized = String(mode || "AUTO").toUpperCase();
  return METAVERSE_TIME_OF_DAY_MODES.includes(normalized) ? normalized : "AUTO";
}

// DEV MODE TIME-OF-DAY REVIEW CONTROLS — `?metaverseDev=1` (dev build
// only, same review-flag convention as every other Metaverse gate:
// dayBirdsReview, dayWaterReview, dayRapidsMotionReview, ...). Gates a
// developer/owner-only manual AUTO/DAY/DUSK/NIGHT toolbar — see
// MetaverseCityPage.jsx. Students never see this: it requires a dev
// build AND the explicit query param, and is never linked from normal
// navigation. A feature-specific review flag (dayRapidsMotionReview,
// etc.) still takes priority over this when both are present — see the
// priority chain documented at MetaverseCityPage.jsx's timePreviewMode.
export function resolveMetaverseDevModeEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("metaverseDev")) return false;
  const value = params.get("metaverseDev");
  return value !== "0" && value !== "false";
}

// A URL-scoped developer selection is an input to the same scene-time
// authority as the live dev control. It is intentionally ignored outside
// dev mode so production AUTO behavior cannot be changed by a URL.
export function resolveMetaverseDevTimeOverride({ isDev, search } = {}) {
  if (!resolveMetaverseDevModeEnabled({ isDev, search })) return null;
  const raw = new URLSearchParams(search || "").get("metSceneTime");
  if (!raw) return null;
  const mode = normalizeTimeOfDayMode(raw);
  return mode === "AUTO" && String(raw).toUpperCase() !== "AUTO" ? null : mode;
}

export function resolveMetaverseTimeOfDay({ mode = "AUTO", date = new Date() } = {}) {
  const normalized = normalizeTimeOfDayMode(mode);
  if (normalized !== "AUTO") return normalized;
  const hour = date.getHours();
  if (hour >= METAVERSE_TIME_OF_DAY_WINDOWS.DAY.startHour && hour < METAVERSE_TIME_OF_DAY_WINDOWS.DAY.endHour) return "DAY";
  if (hour >= METAVERSE_TIME_OF_DAY_WINDOWS.DUSK.startHour && hour < METAVERSE_TIME_OF_DAY_WINDOWS.DUSK.endHour) return "DUSK";
  return "NIGHT";
}

export function resolveMetaverseAssetVariant(asset, requestedVariant = "DUSK") {
  const variant = normalizeTimeOfDayMode(requestedVariant) === "AUTO" ? "DUSK" : normalizeTimeOfDayMode(requestedVariant);
  const variantKey = `${variant.toLowerCase()}Asset`;
  const fallbackOrder = [variantKey, "duskAsset", "dayAsset", "nightAsset", "baseAsset"];
  for (const key of fallbackOrder) {
    if (asset?.[key]) {
      return {
        requestedVariant: variant,
        resolvedVariant: key === "baseAsset" ? "BASE" : key.replace("Asset", "").toUpperCase(),
        assetPath: asset[key],
        fallbackUsed: key !== variantKey,
      };
    }
  }
  return {
    requestedVariant: variant,
    resolvedVariant: "MISSING",
    assetPath: null,
    fallbackUsed: true,
  };
}
