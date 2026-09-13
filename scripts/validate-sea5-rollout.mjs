import { SEA5_COVERAGE_VALIDATION_ERRORS, SEA5_ECOSYSTEM_COVERAGE } from "../src/system/sea/sea5EcosystemCoverage.js";

if (SEA5_COVERAGE_VALIDATION_ERRORS.length) {
  console.error(`SEA-5 rollout validation failed:\n- ${SEA5_COVERAGE_VALIDATION_ERRORS.join("\n- ")}`);
  process.exit(1);
}

const counts = Object.fromEntries(SEA5_ECOSYSTEM_COVERAGE.reduce((map, entry) => map.set(entry.disposition, (map.get(entry.disposition) || 0) + 1), new Map()));
console.log(`SEA-5 rollout validation OK (40 records; ${JSON.stringify(counts)}).`);
