import fs from "fs";

const file = "src/pages/admin/AppRegistry.jsx";
const contract = "docs/contracts/admin/app-registry.ui-contract.json";

function fail(msg) {
  console.error("❌ UI CONTRACT CHECK FAILED:", msg);
  process.exit(1);
}

if (!fs.existsSync(file)) fail(`missing ${file}`);
if (!fs.existsSync(contract)) fail(`missing ${contract}`);

const src = fs.readFileSync(file, "utf8");
const cfg = JSON.parse(fs.readFileSync(contract, "utf8"));

const mustContain = [
  "App Registry",
  "Search apps (name or id)",
  "Show disabled",
  "Primary Funnel",
  "System Core",
  "Funding Ready",
  "Pilot Only",
  "Enable (Demo)",
  "Disable (Demo)",
  "Enable (Saved)",
  "Disable (Saved)",
  "Reset",
  cfg.lock_message
];

for (const s of mustContain) {
  if (!src.includes(s)) fail(`expected string not found in AppRegistry.jsx: "${s}"`);
}

console.log("✅ UI Contract OK:", cfg.id);
console.log("   - Route:", cfg.route);
console.log("   - File:", cfg.file);
console.log("   - Locked status:", cfg.status);
