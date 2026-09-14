import { EXR_FINAL_CAPABILITIES, EXR_FINAL_EXTERNAL_DEPENDENCIES, validateExrFinalAcceptance } from "../src/system/exr/exrFinalAcceptance.js";

const result = validateExrFinalAcceptance();
if (!result.valid) {
  console.error("EXR final acceptance validation failed");
  result.errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`EXR final acceptance validation passed: ${EXR_FINAL_CAPABILITIES.length} capabilities, ${EXR_FINAL_EXTERNAL_DEPENDENCIES.length} non-blocking external dependencies`);
