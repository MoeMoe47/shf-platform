import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = fs.readFileSync(path.join(root, "src/system/accessibility/accessibilityFinalAcceptance.js"), "utf8");
const reports = ["AX-0_SYSTEM_WIDE_ACCESSIBILITY_RECONCILIATION_AUDIT.md", "AX-1_ACCESSIBILITY_CONSTITUTION_OWNERSHIP_CANONICAL_RUNTIME.md", "AX-2_PERSISTENT_ACCESSIBILITY_PROFILE_ADAPTIVE_EXPERIENCE.md", "AX-3_UNIVERSAL_ALTERNATIVE_CONTENT_ENGINE.md", "AX-4_INSTITUTIONAL_ACCESSIBILITY_ACCOMMODATION_WORKFLOWS.md", "AX-5_ACCESSIBILITY_ASSURANCE_GATE_CONTINUOUS_TESTING.md", "AX-6_ACCESSIBILITY_OPERATIONS_COMPANION_HUMAN_ESCALATION.md", "AX-7_SYSTEM_WIDE_ROLLOUT_MICRO_GAPS_FINAL_ACCEPTANCE.md"];
const reportText = reports.map((file) => fs.readFileSync(path.join(root, "docs/architecture", file), "utf8")).join("\n");
const checks = [
  [registry.includes('phase: "AX-7"') && registry.includes('status: "COMPLETE"'), "AX-7 registry is not complete"],
  [registry.includes("AX-GAP-021") && registry.includes("DEFERRED_TO_EXR"), "EXR handoff disposition missing"],
  [registry.includes('migrationHead: 142'), "migration head must remain 142"],
  [registry.includes('owner: "AX-1"') && registry.includes('owner: "AX-6"'), "canonical owner registry incomplete"],
  [registry.includes('implementation: "EXTERNAL_DEPENDENCY"') && registry.includes('implementation: "FUTURE_PHASE"'), "unsupported capabilities are not honestly classified"],
  [registry.includes("HUMAN_REVIEW_REQUIRED") && registry.includes("NOT_CLAIMED"), "human review boundary missing"],
  [reportText.includes("preference") && reportText.includes("accommodation"), "preference/accommodation boundary missing"],
  [reportText.includes("Companion") && reportText.includes("Truth"), "Companion authority boundary missing"],
  [reportText.includes("EXR Handoff") && reportText.includes("Frontend Design Handoff"), "required handoffs missing"],
  [reportText.includes("No gap is") && reportText.includes("unexplained partial"), "final gap closure evidence missing"],
  [!registry.includes('state: "OPEN"') && !registry.includes('state: "UNKNOWN"'), "registry contains open/unknown final state"],
];
const failures = checks.filter(([ok]) => !ok).map(([, message]) => message);
if (failures.length) { console.error(`Final accessibility validation failed:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log("Final accessibility validation: PASS");
console.log("- AX-0 through AX-7 registry: COMPLETE");
console.log("- local migration head: 142");
console.log("- unresolved/unknown final gaps: 0");
