const CACHE = new Map();

// Vite will include these JSON files in the client bundle.
// For JSON modules, Vite exposes the parsed object as `mod.default`.
const MODULES = import.meta.glob("./*.manifest.json", { eager: true });

function modToJson(mod) {
  if (!mod) return null;
  // Vite JSON modules usually come through as { default: <object> }
  if (mod.default && typeof mod.default === "object") return mod.default;
  // Fallback: sometimes it may already be the object
  if (typeof mod === "object") return mod;
  return null;
}

export function listManifestIds() {
  return Object.keys(MODULES)
    .map((k) => k.replace("./", "").replace(".manifest.json", ""))
    .sort();
}

export function loadManifest(appId) {
  // Normalize appId so we never build "./[object Object].manifest.json"
  const rawId = (appId && typeof appId === "object")
    ? (appId.id ?? appId.appId ?? appId.slug ?? appId.name)
    : appId;
  const cleanId = String(rawId ?? "").trim();
  if (!cleanId || cleanId === "[object Object]") {
    throw new Error(`[manifest] invalid appId: ${typeof appId} ${JSON.stringify(appId)}`);
  }
  // ✅ Allow registry to pass a manifest object directly (dev-friendly)
  if (appId && typeof appId === "object") return appId;
  appId = String(appId ?? "").trim();
  if (CACHE.has(cleanId)) return CACHE.get(cleanId);
const key = `./${cleanId}.manifest.json`;
  const mod = MODULES[key];
  if (!mod) {
    throw new Error(`[manifest] not found: ${appId} (${key})`);
  }

  const json = modToJson(mod);
  if (!json || typeof json !== "object") {
    throw new Error(`[manifest] invalid json for: ${appId}`);
  }

  CACHE.set(cleanId, json);
  return json;
}
