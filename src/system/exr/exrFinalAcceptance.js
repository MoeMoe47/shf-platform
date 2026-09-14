import { EXR_NOTIFICATION_SLOTS, EXR_IA_DESTINATIONS, validateExrInformationArchitecture } from "./exrInformationArchitecture.js";
import { EXR4_JOURNEY_IDS, validateExrJourneyExperience } from "./exrJourneyExperience.js";

export const EXR_FINAL_SCHEMA_VERSION = 1;

export const EXR_FINAL_CAPABILITIES = Object.freeze([
  { id: "runtime", owner: "Accessibility", status: "ACCEPTED", evidence: "accessibility:runtime:validate" },
  { id: "experience-contracts", owner: "EXR-1", status: "ACCEPTED", evidence: "exr:contracts:validate" },
  { id: "information-architecture", owner: "EXR-2", status: "ACCEPTED", evidence: "exr:ia:validate" },
  { id: "page-consolidation", owner: "EXR-3", status: "ACCEPTED", evidence: "exr:consolidation:validate" },
  { id: "priority-journeys", owner: "EXR-4", status: "ACCEPTED", evidence: "EXR browser acceptance 12/12" },
  { id: "accessibility", owner: "Accessibility", status: "ACCEPTED", evidence: "accessibility:assure" },
  { id: "notification-slots", owner: "EXR", status: "STRUCTURAL_ONLY", evidence: "EXR_NOTIFICATION_SLOTS" },
  { id: "server-authorization", owner: "Identity / Permissions", status: "PRESERVED", evidence: "EXR-4 negative-boundary tests" },
  { id: "migration-state", owner: "Repository", status: "ACCEPTED", evidence: "migration head 142" },
]);

export const EXR_FINAL_EXTERNAL_DEPENDENCIES = Object.freeze([
  { id: "human-screen-reader-review", state: "EXTERNAL_DEPENDENCY", blocks: false },
  { id: "live-learning-provider-capabilities", state: "EXTERNAL_DEPENDENCY", blocks: false },
  { id: "tagged-document-formats", state: "EXTERNAL_DEPENDENCY", blocks: false },
]);

export function validateExrFinalAcceptance() {
  const errors = [];
  errors.push(...validateExrInformationArchitecture());
  errors.push(...validateExrJourneyExperience().errors);
  if (EXR_FINAL_CAPABILITIES.some((entry) => !entry.id || !entry.owner || !entry.status || !entry.evidence)) errors.push("final capability registry has incomplete entries");
  if (EXR_FINAL_CAPABILITIES.some((entry) => entry.id === "notification-slots" && entry.status !== "STRUCTURAL_ONLY")) errors.push("notification slots must remain structural-only");
  if (EXR_NOTIFICATION_SLOTS.some((slot) => /state|recipient|unread|delivery|content/i.test(slot))) errors.push("notification slot names must remain data-neutral");
  if (EXR_IA_DESTINATIONS.some((entry) => Object.keys(entry).some((key) => /permission|authorization|grant/i.test(key)))) errors.push("IA must not encode permission authority");
  if (EXR4_JOURNEY_IDS.length !== 11) errors.push("priority journey registry drifted");
  if (EXR_FINAL_EXTERNAL_DEPENDENCIES.some((entry) => entry.blocks !== false)) errors.push("external dependency incorrectly blocks final acceptance");
  return { valid: errors.length === 0, errors };
}
