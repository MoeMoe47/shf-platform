import { EXR4_JOURNEY_IDS, validateExrJourneyExperience } from "../src/system/exr/exrJourneyExperience.js";
import { EXR_EXR4_BACKLOG } from "../src/system/exr/exrPageConsolidationPlan.js";

const errors = [...validateExrJourneyExperience().errors];
const backlogIds = new Set(EXR_EXR4_BACKLOG.map((entry) => entry.journey));
for (const id of EXR4_JOURNEY_IDS) {
  if (id !== "studio-builder" && id !== "studio-qa" && id !== "studio-reviewer" && !backlogIds.has(id)) errors.push(`${id}: missing EXR-4 backlog linkage`);
}
if (errors.length) {
  console.error("EXR journey validation failed");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`EXR journey validation passed: ${EXR4_JOURNEY_IDS.length} journey contracts`);
