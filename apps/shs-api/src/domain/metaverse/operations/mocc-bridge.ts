// Phase 9 — server-side bridge to the shared Regional Simulation, MOCC and World Audio modules.
// Single source of truth: the same pure modules the Metaverse client uses; never a server copy.
// Same relative depth from src/ and dist/.
import * as regional from "../../../../../../src/system/metaverse/regional/index.js";
import * as mocc from "../../../../../../src/system/metaverse/mocc/index.js";

export const regionalSimulation: any = regional;
export const moccCore: any = mocc;
