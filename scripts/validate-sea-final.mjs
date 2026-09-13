import { SEA_FINAL_ACCEPTANCE_ERRORS, SEA_FINAL_GAP_DISPOSITIONS, SEA_FINAL_SERVICE_ACCEPTANCE, SEA_FINAL_TIER_A_TRACEABILITY } from "../src/system/sea/seaFinalAcceptance.js";

if (SEA_FINAL_ACCEPTANCE_ERRORS.length) {
  console.error("SEA final validation failed:");
  for (const error of SEA_FINAL_ACCEPTANCE_ERRORS) console.error(`- ${error}`);
  process.exit(1);
}

const counts = SEA_FINAL_SERVICE_ACCEPTANCE.reduce((result, entry) => {
  result[entry.finalState] = (result[entry.finalState] || 0) + 1;
  return result;
}, {});
const gapCounts = SEA_FINAL_GAP_DISPOSITIONS.reduce((result, entry) => {
  result[entry.finalDisposition] = (result[entry.finalDisposition] || 0) + 1;
  return result;
}, {});

console.log("SEA final validation: PASS");
console.log(`- services: ${SEA_FINAL_SERVICE_ACCEPTANCE.length}`);
console.log(`- Tier A traceability: ${SEA_FINAL_TIER_A_TRACEABILITY.length}/${SEA_FINAL_TIER_A_TRACEABILITY.length}`);
console.log(`- gap dispositions: ${JSON.stringify(gapCounts)}`);
console.log(`- service dispositions: ${JSON.stringify(counts)}`);
