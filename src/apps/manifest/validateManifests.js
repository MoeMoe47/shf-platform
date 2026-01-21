import fs from "fs";
import path from "path";
import { normalizeManifest } from "./app.contract.js";

const dir = path.resolve(process.cwd(), "src/apps/manifest");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".manifest.json"));

let ok = true;
for (const f of files) {
  const p = path.join(dir, f);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  try {
    const m = normalizeManifest(raw);
    console.log("OK", f, "->", m.id);
  } catch (e) {
    ok = false;
    console.error("BAD", f, "->", e.message);
  }
}

process.exit(ok ? 0 : 1);
