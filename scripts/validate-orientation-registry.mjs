import { assertValidOrientationRegistry, OGL_ORIENTATION_CONTRACTS } from "../src/system/orientation/orientationRegistry.js";

assertValidOrientationRegistry();
console.log(`Orientation registry validation OK (${OGL_ORIENTATION_CONTRACTS.length} contracts).`);
