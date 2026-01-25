import fs from "fs";
import path from "path";

const contractPath = path.resolve("ui/contracts/appRegistry.contract.json");
const raw = fs.readFileSync(contractPath, "utf8");
const j = JSON.parse(raw);

j.version = Number(j.version || 0) + 1;

fs.writeFileSync(contractPath, JSON.stringify(j, null, 2) + "\n", "utf8");
console.log("✅ Bumped UI contract version to:", j.version);
