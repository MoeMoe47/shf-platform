// Phase 4G — declarative Learning ↔ Metaverse integration envelope.
//
// A Mission may declare which world context it consumes. MOL supplies world
// context; it never starts, progresses, completes or evaluates a Mission.
// Capabilities resolve to MOL System Registry entries by reference; the
// provider mode (LIVE/SIMULATED/...) is reported, never upgraded, and a
// SIMULATED provider is used only when the Mission explicitly allows it.

export const MISSION_WORLD_CAPABILITIES = Object.freeze({
  TRAFFIC_CONTEXT: "road-traffic",
  WATER_CONTEXT: "water-mobility",
  WEATHER_CONTEXT: "ocean-environment",
  INCIDENT_CONTEXT: "incident",
  POWER_CONTEXT: "power-grid",
  DATA_CENTER_CONTEXT: "data-center",
} as const);
export type MissionWorldCapability = keyof typeof MISSION_WORLD_CAPABILITIES;
export const MISSION_WORLD_CAPABILITY_NAMES = Object.freeze(Object.keys(MISSION_WORLD_CAPABILITIES) as MissionWorldCapability[]);
export const MISSION_WORLD_REQUIRED_UNAVAILABLE_POLICIES = Object.freeze(["BLOCK_START", "START_DEGRADED"] as const);

export interface MissionMetaverseContextDeclaration {
  // An approved MOL scenario (validated at start against the MOL scenario registry).
  scenarioId: string;
  requiredCapabilities: MissionWorldCapability[];
  optionalCapabilities: MissionWorldCapability[];
  // Explicit opt-in: without it, a SIMULATED provider is treated as unavailable (no silent fallback).
  allowSimulatedContext: boolean;
  requiredUnavailablePolicy: (typeof MISSION_WORLD_REQUIRED_UNAVAILABLE_POLICIES)[number];
}

const SCENARIO_ID = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

function add(errors: string[], condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateMissionWorldDeclaration(value: Record<string, any>, errors: string[]) {
  const refs = Array.isArray(value.environmentRefs) ? value.environmentRefs : [];
  refs.forEach((ref: any, index: number) => {
    if (isRecord(ref) && ref.required !== undefined) add(errors, typeof ref.required === "boolean", `environmentRefs[${index}].required must be boolean`);
  });
  if (value.metaverseContext === undefined) return;
  const context = value.metaverseContext;
  add(errors, isRecord(context), "metaverseContext must be an object");
  if (!isRecord(context)) return;
  for (const key of Object.keys(context)) {
    add(errors, ["scenarioId", "requiredCapabilities", "optionalCapabilities", "allowSimulatedContext", "requiredUnavailablePolicy"].includes(key), `metaverseContext.${key}: unsupported field`);
  }
  add(errors, typeof context.scenarioId === "string" && SCENARIO_ID.test(context.scenarioId), "metaverseContext.scenarioId must be an approved MOL scenario identifier");
  const seen = new Set<string>();
  for (const key of ["requiredCapabilities", "optionalCapabilities"]) {
    const list = Array.isArray(context[key]) ? context[key] : null;
    add(errors, list !== null && list.length <= MISSION_WORLD_CAPABILITY_NAMES.length, `metaverseContext.${key} must be a bounded array`);
    for (const capability of list || []) {
      add(errors, MISSION_WORLD_CAPABILITY_NAMES.includes(capability), `metaverseContext.${key} contains an undeclared capability`);
      add(errors, !seen.has(capability), `metaverseContext capability ${capability} is declared twice`);
      seen.add(capability);
    }
  }
  add(errors, seen.size > 0, "metaverseContext must declare at least one capability");
  add(errors, typeof context.allowSimulatedContext === "boolean", "metaverseContext.allowSimulatedContext must be boolean");
  add(errors, MISSION_WORLD_REQUIRED_UNAVAILABLE_POLICIES.includes(context.requiredUnavailablePolicy), "metaverseContext.requiredUnavailablePolicy is invalid");
  add(errors, refs.some((ref: any) => ref?.system === "metaverse"), "metaverseContext requires at least one metaverse environmentRef");
}
