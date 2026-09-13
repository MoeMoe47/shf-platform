import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policy = fs.readFileSync(path.join(root, "src/system/accessibility/accessibilityAssurancePolicy.js"), "utf8");
const schema = fs.readFileSync(path.join(root, "src/system/accessibility/accessibilityFindingSchema.js"), "utf8");
const runner = fs.readFileSync(path.join(root, "scripts/run-accessibility-assurance.mjs"), "utf8");
const report = fs.existsSync(path.join(root, "docs/architecture/AX-5_ACCESSIBILITY_ASSURANCE_GATE_CONTINUOUS_TESTING.md"));
const checks = [
  [policy.includes("ACCESSIBILITY_ASSURANCE_POLICY"), "canonical assurance policy missing"],
  [policy.includes("automatedPassIsVerified: false"), "automated pass may not equal verified"],
  [policy.includes("AUTHORIZED_HUMAN"), "human waiver authority missing"],
  [policy.includes("BLOCK_RELEASE") && policy.includes("REQUIRES_REVIEW"), "release impact policy incomplete"],
  [schema.includes("FINDING_STATES") && schema.includes("REGRESSION"), "finding lifecycle missing"],
  [runner.includes("--scenario") && runner.includes("BLOCKED"), "synthetic gate scenarios missing"],
  [runner.includes("ARAG") || policy.includes("ARAG-1"), "ARAG boundary missing"],
  [!policy.includes("ignore all") && !runner.includes("ignore all"), "blanket accessibility suppression found"],
  [report, "AX-5 report missing"],
];
const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length) { console.error(`Accessibility assurance validation failed:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log("Accessibility assurance validation: PASS");
console.log("- policy: ax5.v1");
console.log("- waiver authority: authorized human only");
console.log("- automated PASS is not VERIFIED");
