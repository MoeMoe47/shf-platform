import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "src/apps/manifest");

const DEFAULT_SHELL = {
  foundation: "src/styles/foundation.css",
  admin: "src/styles/app-shell.css",
  curriculum: "src/styles/curriculum-shell.css",
  arcade: "src/styles/arcade-shell.css",
  civic: "src/styles/civic-shell.css",
  credit: "src/styles/credit-shell.css",
  debt: "src/styles/debt-shell.css",
  treasury: "src/styles/treasury-shell.css",
  employer: "src/styles/employer-shell.css",
  sales: "src/styles/sales-shell.css",
  loo: "src/styles/lordOutcomes.css",
  ai: "src/styles/ai-compass.css",
  fuel: "src/styles/app-shell.css",
  launch: "src/styles/app-shell.css",
  store: "src/styles/app-shell.css",
  solutions: "src/styles/theme-solutions.css"
};

function toCapsObject(caps) {
  if (!caps) return {};
  if (Array.isArray(caps)) {
    const o = {};
    for (const k of caps) o[String(k)] = true;
    return o;
  }
  if (typeof caps === "object") return caps;
  return {};
}

function normalizeOne(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = JSON.parse(raw);

  const id = m.id || path.basename(file).replace(".manifest.json","");
  const out = { ...m };

  // contractVersion
  if (typeof out.contractVersion !== "number") out.contractVersion = 1;

  // capabilities: array -> object
  out.capabilities = toCapsObject(out.capabilities);

  // shellCss
  if (!out.shellCss || typeof out.shellCss !== "string") {
    out.shellCss = DEFAULT_SHELL[id] || "src/styles/app-shell.css";
  }

  // dashboard optional: leave as-is if present

  // stable ordering (nice for diffs)
  const ordered = {
    contractVersion: out.contractVersion,
    id: out.id || id,
    name: out.name || id,
    entry: out.entry,
    routes: out.routes,
    layout: out.layout,
    shellCss: out.shellCss,
    dashboard: out.dashboard,
    capabilities: out.capabilities,
    meta: out.meta
  };

  // remove undefined keys
  Object.keys(ordered).forEach(k => ordered[k] === undefined && delete ordered[k]);

  fs.writeFileSync(file, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  return ordered.id;
}

if (!fs.existsSync(DIR)) {
  console.error("Missing dir:", DIR);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith(".manifest.json"));
if (!files.length) {
  console.error("No manifests found.");
  process.exit(1);
}

const ids = [];
for (const f of files) {
  ids.push(normalizeOne(path.join(DIR, f)));
}

console.log("✅ Normalized manifests:", ids.join(", "));
