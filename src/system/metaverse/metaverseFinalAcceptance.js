export const MET_FINAL_SCHEMA_VERSION = 1;

export const MET_FINAL_CAPABILITIES = Object.freeze([
  { id: "audit", owner: "MET-0", status: "ACCEPTED", evidence: "docs/metaverse/MET-0_SYSTEM_WIDE_METAVERSE_CURRENT_STATE_AUDIT.md" },
  { id: "canonical-architecture", owner: "MET-1", status: "ACCEPTED", evidence: "docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md" },
  { id: "city-district-registry", owner: "MET-2", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/registry/city-registry.ts" },
  { id: "visual-design-lock", owner: "MET-2A", status: "ACCEPTED", evidence: "docs/metaverse/MET-2A_VISUAL_DESIGN_LOCK_ASSET_MAPPING.md" },
  { id: "presence-safety-architecture", owner: "MET-2B", status: "ACCEPTED", evidence: "docs/metaverse/MET-2B_PRESENCE_COMMUNICATION_STUDENT_SAFETY_ARCHITECTURE.md" },
  { id: "learner-unlock-projection", owner: "MET-3", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/unlocks/unlock-resolver.ts" },
  { id: "interactive-city-shell", owner: "MET-4", status: "ACCEPTED", evidence: "docs/metaverse/MET-4_INTERACTIVE_CITY_SHELL_CAMERA_NAVIGATION.md" },
  { id: "runtime-protected-entry", owner: "MET-5", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/runtime/metaverse-entry-service.ts" },
  { id: "presence-communication-runtime", owner: "MET-6", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/communication/runtime/routes.ts" },
  { id: "curriculum-assignment-arcade-integration", owner: "MET-7", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/missions/mission-projection-service.ts" },
  { id: "student-opportunity-exchange", owner: "MET-8", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/opportunities/api/routes.ts" },
  { id: "student-market-treasury-integration", owner: "MET-9", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/market/api/routes.ts" },
  { id: "work-passport-capability-graph", owner: "MET-10", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/passport/service/passport-projection-service.ts" },
  { id: "city-economy-orchestration", owner: "MET-11", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/orchestration/service/city-orchestration-service.ts" },
  { id: "reporting-acceptance", owner: "MET-12", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/reporting/metaverse-city-report-adapter.ts" },
  { id: "student-enterprise-system", owner: "MET-12", status: "ACCEPTED", evidence: "apps/shs-api/src/domain/metaverse/enterprise/service/enterprise-service.ts" },
]);

export const MET_FINAL_BOUNDARIES = Object.freeze([
  { id: "civic-government-boundary", statement: "SHF Civic remains the canonical owner of civic-learning and simulated governance rules; the metaverse must never imply actual governmental authority.", source: "docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md" },
  { id: "civicsure-boundary", statement: "CivicSure is excluded from the student civic district and remains a separate public-program assurance product.", source: "docs/metaverse/MET-1_CANONICAL_METAVERSE_ARCHITECTURE.md" },
  { id: "exr-boundary", statement: "MET does not integrate into EXR's shared dashboard/route shell; MET-4 deliberately uses its own route-local, full-screen immersive shell instead.", source: "docs/metaverse/MET-4_INTERACTIVE_CITY_SHELL_CAMERA_NAVIGATION.md" },
  { id: "nca-boundary", statement: "MET-11 does not duplicate NCA; low-urgency items appear in the briefing only, actionable triggers use the notification domain.", source: "docs/metaverse/MET-11_CITY_ECONOMY_ORCHESTRATION.md" },
  { id: "treasury-persistence-boundary", statement: "Treasury balances are served by an in-memory adapter; no durable ledger is fabricated for reporting or elsewhere.", source: "apps/shs-api/src/domain/metaverse/market/service/market-treasury-adapter.ts" },
]);

export const MET_FINAL_DEFERRED_ITEMS = Object.freeze([
  { id: "civic-realtime-transport", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "civic-moderation-persistence", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "production-invalidation-wiring", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "durable-treasury-ledger", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "richer-recommendation-matching", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "multi-user-browser-fixtures", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "mission-chain-sequencing", state: "DEFERRED_ENHANCEMENT", blocks: false },
  { id: "sound-ambient-systems", state: "DEFERRED_ENHANCEMENT", blocks: false },
]);

export function validateMetaverseFinalAcceptance() {
  const errors = [];
  if (MET_FINAL_CAPABILITIES.length !== 16) errors.push("MET phase capability registry drifted from MET-0 through MET-12");
  if (MET_FINAL_CAPABILITIES.some((entry) => !entry.id || !entry.owner || !entry.status || !entry.evidence)) errors.push("final capability registry has incomplete entries");
  if (MET_FINAL_CAPABILITIES.some((entry) => entry.status !== "ACCEPTED")) errors.push("all MET phases must be ACCEPTED for program completion");
  if (MET_FINAL_BOUNDARIES.some((entry) => !entry.id || !entry.statement || !entry.source)) errors.push("boundary registry has incomplete entries");
  if (!MET_FINAL_BOUNDARIES.some((entry) => entry.id === "civic-government-boundary")) errors.push("civic government boundary must be declared");
  if (!MET_FINAL_BOUNDARIES.some((entry) => entry.id === "treasury-persistence-boundary")) errors.push("treasury persistence boundary must be declared honestly");
  if (MET_FINAL_DEFERRED_ITEMS.some((entry) => entry.blocks !== false)) errors.push("deferred item incorrectly blocks final acceptance");
  return { valid: errors.length === 0, errors };
}
