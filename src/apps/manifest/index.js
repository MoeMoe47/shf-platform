import fs from "fs";
import path from "path";

const MANIFEST_DIR = path.resolve(process.cwd(), "src/apps/manifest");
const CACHE = new Map();

export function listManifestIds() {
  return fs.readdirSync(MANIFEST_DIR)
    .filter(f => f.endsWith(".manifest.json"))
    .map(f => f.replace(".manifest.json",""))
    .sort();
}

export function loadManifest(appId) {
  if (CACHE.has(appId)) return CACHE.get(appId);
  const file = path.join(MANIFEST_DIR, `${appId}.manifest.json`);
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  CACHE.set(appId, json);
  return json;
}
