// Phase 9 — regional scenario definitions hosted by the Regional Simulation Authority.
//
// A regional scenario composes an existing APPROVED MOL scenario (molScenarios.js — the only scenario engine) with
// declared participants. It does not define new event chains or engines. Participants are registered MOL systems
// (required or optional); concepts with no registered system yet are listed as absent and reported UNAVAILABLE,
// never simulated by invention.

export const REGIONAL_SCENARIOS = Object.freeze({
  REGIONAL_POWER_DISRUPTION: Object.freeze({
    regionalScenarioId: "REGIONAL_POWER_DISRUPTION",
    title: "Regional power disruption",
    molScenarioId: "INFRASTRUCTURE_FAILURE",
    participants: Object.freeze([
      Object.freeze({ systemId: "power-grid", required: true }),
      Object.freeze({ systemId: "data-center", required: false }),
      Object.freeze({ systemId: "incident", required: false }),
    ]),
    // Concepts in the brief with no registered MOL system: reported, never fabricated.
    absentParticipants: Object.freeze(["telecom", "traffic-signals", "port-operations", "hospital-backup-power", "public-works"]),
  }),
  STORM_FLOOD_RESPONSE: Object.freeze({
    regionalScenarioId: "STORM_FLOOD_RESPONSE",
    title: "Storm and river restriction response",
    molScenarioId: "WATER_RESTRICTION",
    participants: Object.freeze([
      Object.freeze({ systemId: "ocean-environment", required: true }),
      Object.freeze({ systemId: "water-mobility", required: true }),
      Object.freeze({ systemId: "road-traffic", required: false }),
    ]),
    absentParticipants: Object.freeze(["fire-ems", "public-works", "hospital"]),
  }),
});

export function listRegionalScenarios() {
  return Object.values(REGIONAL_SCENARIOS);
}
