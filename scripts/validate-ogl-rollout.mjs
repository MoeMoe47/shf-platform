import { assertValidOglRolloutCoverage, OGL_ROLLOUT_COVERAGE } from "../src/system/orientation/rolloutCoverage.js";

assertValidOglRolloutCoverage();
const counts = OGL_ROLLOUT_COVERAGE.reduce((result, entry) => {
  result[entry.status] = (result[entry.status] || 0) + 1;
  return result;
}, {});
console.log(`OGL rollout coverage validation OK (${OGL_ROLLOUT_COVERAGE.length} destinations; ${JSON.stringify(counts)}).`);
