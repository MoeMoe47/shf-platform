import {
  EXR_IA_ALIASES,
  EXR_IA_DESTINATIONS,
  EXR_IA_SHELLS,
  EXR_NAV_GROUPS,
  EXR_NOTIFICATION_SLOTS,
  EXR_SURFACE_KINDS,
  resolveExrNavigation,
  validateExrInformationArchitecture,
} from "../src/system/exr/exrInformationArchitecture.js";
import { EXR_CAPABILITY_STATES } from "../src/system/exr/exrExperienceContracts.js";

const errors = validateExrInformationArchitecture();
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(EXR_IA_DESTINATIONS.length >= 20, "canonical destination hierarchy is incomplete");
assert(EXR_IA_SHELLS.length >= 5, "shell coverage is incomplete");
assert(EXR_IA_ALIASES.every((entry) => ["CANONICAL", "ALIAS_KEEP", "REDIRECT_CANDIDATE", "DEFER_TO_EXR_3", "LEGACY_ARCHIVED"].includes(entry.classification)), "alias vocabulary invalid");
assert(EXR_NOTIFICATION_SLOTS.length === 3, "neutral notification placement slots are incomplete");
assert(EXR_SURFACE_KINDS.includes("QUEUE") && EXR_SURFACE_KINDS.includes("WORKFLOW"), "workflow surface vocabulary missing");
assert(EXR_NAV_GROUPS.includes("PUBLIC") && EXR_NAV_GROUPS.includes("ORGANIZATION"), "navigation groups missing");
assert(EXR_CAPABILITY_STATES.includes("HIDDEN") && EXR_CAPABILITY_STATES.includes("AVAILABLE"), "capability exposure states missing");

const publicProjection = resolveExrNavigation({ isPublic: true, actor: "public" });
assert(publicProjection.entries.some((entry) => entry.id === "foundation"), "public projection must include Foundation");
assert(!publicProjection.entries.some((entry) => entry.id === "hub"), "public projection must not include Hub");

const operatorProjection = resolveExrNavigation({ actor: "org_operator", organizationId: "org-test", capabilityConditions: { "hub-operating-work": "entitled" } });
assert(operatorProjection.entries.some((entry) => entry.id === "hub"), "organization operator projection must include Hub");
assert(!operatorProjection.entries.some((entry) => entry.id === "truth-oracle"), "organization operator projection must not include admin inspection");
assert(operatorProjection.authorization === "SERVER_AUTHORITATIVE", "resolver must preserve server authority");

const unentitledProjection = resolveExrNavigation({ actor: "org_operator", organizationId: "org-test", capabilityConditions: { "hub-operating-work": "unentitled" } });
assert(!unentitledProjection.entries.some((entry) => entry.id === "hub"), "unentitled Hub capability must not be exposed");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`EXR IA validation OK (destinations=${EXR_IA_DESTINATIONS.length}, aliases=${EXR_IA_ALIASES.length}, shells=${EXR_IA_SHELLS.length}).`);
