import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "src/apps/manifest");

const REQUIRED = ["contractVersion","id","name","entry","routes","layout","shellCss","capabilities"];

function fail(msg) {
  console.error("❌ Manifest validation failed:", msg);
  process.exit(1);
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { fail(`${path.basename(file)} invalid JSON: ${e.message}`); }
}

if (!fs.existsSync(DIR)) fail("missing src/apps/manifest");

const files = fs.readdirSync(DIR).filter(f => f.endsWith(".manifest.json"));
if (!files.length) fail("no *.manifest.json files found");

const ids = new Set();
for (const f of files) {
  const file = path.join(DIR, f);
  const m = readJson(file);

  for (const k of REQUIRED) {
    if (!(k in m)) fail(`${f} missing required key "${k}"`);
  }

  if (typeof m.contractVersion !== "number" || m.contractVersion < 1) fail(`${f} contractVersion must be >= 1`);
  if (typeof m.id !== "string" || !m.id.trim()) fail(`${f} id must be non-empty string`);
  if (ids.has(m.id)) fail(`duplicate id "${m.id}"`);
  ids.add(m.id);

  for (const key of ["entry","routes","layout","shellCss"]) {
    if (typeof m[key] !== "string" || !m[key].trim()) fail(`${f} ${key} must be a string path`);
    const p = path.join(ROOT, m[key]);
    if (!fs.existsSync(p)) {
      console.warn(`⚠️  ${f} references missing file: ${m[key]}`);
    }
  }
}

console.log(`✅ Manifest validation OK (${files.length} manifests).`);
