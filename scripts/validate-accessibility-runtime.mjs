import {
  ACCESSIBILITY_CAPABILITIES,
  ACCESSIBILITY_CONSTITUTION_ERRORS,
  ACCESSIBILITY_RUNTIME_OWNER,
  RUNTIME_MECHANISMS,
  AX1_GAP_CLOSURE,
} from "../src/system/accessibility/accessibilityConstitution.js";

if (ACCESSIBILITY_CONSTITUTION_ERRORS.length) {
  console.error("Accessibility runtime validation failed:");
  for (const error of ACCESSIBILITY_CONSTITUTION_ERRORS) console.error(`- ${error}`);
  process.exit(1);
}

const canonical = RUNTIME_MECHANISMS.filter((item) => item.treatment === "CANONICAL");
const unresolvedAx1 = AX1_GAP_CLOSURE.filter((gap) => gap.status !== "RESOLVED_FOR_AX1");
if (canonical.length !== 2 || unresolvedAx1.length) {
  console.error("Accessibility runtime validation failed: canonical owner or AX-1 closure is incomplete");
  process.exit(1);
}

const counts = Object.fromEntries([...new Set(ACCESSIBILITY_CAPABILITIES.map((item) => item.status))]
  .map((status) => [status, ACCESSIBILITY_CAPABILITIES.filter((item) => item.status === status).length]));
console.log(`Accessibility runtime: PASS (${ACCESSIBILITY_RUNTIME_OWNER.id})`);
console.log(`Mount: ${ACCESSIBILITY_RUNTIME_OWNER.mount}`);
console.log(`Mechanisms: ${RUNTIME_MECHANISMS.length}; canonical: ${canonical.length}; adapters/local/deprecated: ${RUNTIME_MECHANISMS.length - canonical.length}`);
console.log(`Capabilities: ${JSON.stringify(counts)}`);
console.log(`AX-1 gap closures: ${AX1_GAP_CLOSURE.length}`);
