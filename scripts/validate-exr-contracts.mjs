import {
  EXR_ACCESSIBILITY_PLACEMENT_CONTRACT,
  EXR_CAPABILITY_EXPOSURE_CONTRACTS,
  EXR_CAPABILITY_STATES,
  EXR_CONTRACT_SCHEMA_VERSION,
  EXR_CUSTOMER_JOURNEY_CONTRACTS,
  EXR_HUB_CONTRACT,
  EXR_JOURNEY_STATES,
  EXR_NEXT_ACTION_SOURCES,
  EXR_RETURN_TARGETS,
  EXR_ROLE_CONTEXT_CONTRACTS,
  EXR_REPORTING_ENTRY_CONTRACT,
  EXR_SHELL_OWNERSHIP_CONTRACT,
} from "../src/system/exr/exrExperienceContracts.js";

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(EXR_CONTRACT_SCHEMA_VERSION === 1, "unsupported EXR contract schema version");
assert(new Set(EXR_ROLE_CONTEXT_CONTRACTS.map((entry) => entry.id)).size === EXR_ROLE_CONTEXT_CONTRACTS.length, "duplicate role context id");
assert(EXR_ROLE_CONTEXT_CONTRACTS.length >= 10, "critical role coverage is incomplete");
assert(new Set(EXR_CAPABILITY_EXPOSURE_CONTRACTS.map((entry) => entry.id)).size === EXR_CAPABILITY_EXPOSURE_CONTRACTS.length, "duplicate capability id");
assert(EXR_CAPABILITY_EXPOSURE_CONTRACTS.length >= 10, "capability exposure coverage is incomplete");
assert(new Set(EXR_CUSTOMER_JOURNEY_CONTRACTS.map((entry) => entry.id)).size === EXR_CUSTOMER_JOURNEY_CONTRACTS.length, "duplicate journey id");
assert(EXR_CUSTOMER_JOURNEY_CONTRACTS.length >= 8, "critical journey coverage is incomplete");

for (const entry of EXR_ROLE_CONTEXT_CONTRACTS) {
  assert(entry.organizationContext && EXR_RETURN_TARGETS.includes(entry.defaultReturnTarget), `${entry.id}: invalid role context`);
  assert(Array.isArray(entry.allowedSurfaceKinds) && entry.allowedSurfaceKinds.length > 0, `${entry.id}: surface kinds missing`);
}
for (const entry of EXR_CAPABILITY_EXPOSURE_CONTRACTS) {
  assert(entry.serviceId && entry.primarySurface && EXR_NEXT_ACTION_SOURCES.includes(entry.nextActionSource), `${entry.id}: capability contract incomplete`);
  for (const [condition, state] of Object.entries(entry.stateRules || {})) {
    assert(EXR_CAPABILITY_STATES.includes(state), `${entry.id}.${condition}: invalid capability state ${state}`);
  }
}
for (const entry of EXR_CUSTOMER_JOURNEY_CONTRACTS) {
  assert(entry.audience.length > 0 && entry.stages.length > 0, `${entry.id}: journey incomplete`);
  assert(entry.stages.every((state) => EXR_JOURNEY_STATES.includes(state)), `${entry.id}: invalid journey state`);
  assert(entry.currentWorkKinds.length > 0 && EXR_RETURN_TARGETS.includes(entry.returnTarget), `${entry.id}: return contract incomplete`);
  assert(EXR_NEXT_ACTION_SOURCES.includes(entry.nextActionSource), `${entry.id}: invalid next-action source`);
}

assert(EXR_HUB_CONTRACT.owner === "SHS/BOS", "Hub owner must remain SHS/BOS");
assert(EXR_HUB_CONTRACT.excluded.includes("generic ecosystem super-dashboard"), "Hub super-dashboard boundary missing");
assert(EXR_ACCESSIBILITY_PLACEMENT_CONTRACT.separation.length === 4, "Accessibility placement separation missing");
assert(EXR_REPORTING_ENTRY_CONTRACT.strategy === "CONTEXT_SPECIFIC_GOVERNED_REGISTRY", "reporting strategy is not context-specific");
assert(EXR_SHELL_OWNERSHIP_CONTRACT.exr.includes("primary_navigation"), "EXR navigation ownership missing");
assert(EXR_SHELL_OWNERSHIP_CONTRACT.notifications.includes("notification_state"), "Notifications state ownership missing");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`EXR contract validation OK (roles=${EXR_ROLE_CONTEXT_CONTRACTS.length}, capabilities=${EXR_CAPABILITY_EXPOSURE_CONTRACTS.length}, journeys=${EXR_CUSTOMER_JOURNEY_CONTRACTS.length}).`);
