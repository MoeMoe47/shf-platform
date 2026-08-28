import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  UNIVERSE_ASSET_LEDGER,
  validateUniverseWorldCatalog,
  getUniverseWorlds,
} from "../src/data/universe/universeWorldCatalog.js";

const worlds = getUniverseWorlds();
const result = validateUniverseWorldCatalog(worlds);

if (!result.valid) {
  console.error("UNIVERSE_WORLD_CATALOG_INVALID");
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

const requiredSlugs = new Set([
  "bos",
  "aos",
  "open-autonomous-standard",
  "autonomous-registry",
  "autonomous-trust-bureau",
]);

for (const slug of requiredSlugs) {
  if (!worlds.some((world) => world.slug === slug)) {
    console.error(`UNIVERSE_WORLD_CATALOG_INVALID missing ${slug}`);
    process.exit(1);
  }
}

for (const scene of UNIVERSE_ASSET_LEDGER) {
  const filePath = join(process.cwd(), "public", "assets", "universe", "masters", scene.filename);
  const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex");
  if (hash !== scene.sha256) {
    console.error(`UNIVERSE_ASSET_HASH_MISMATCH scene=${scene.id} file=${scene.filename}`);
    console.error(`expected=${scene.sha256}`);
    console.error(`actual=${hash}`);
    process.exit(1);
  }
}

console.log(`UNIVERSE_WORLD_CATALOG_VALID worlds=${worlds.length} scenes=${UNIVERSE_ASSET_LEDGER.length} hashes=pass`);
