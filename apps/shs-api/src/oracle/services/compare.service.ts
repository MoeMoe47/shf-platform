import { compareTruthPackages } from "./compare-engine.js";

export async function runOracleCompare(entityIds: string[]) {
  return await compareTruthPackages(entityIds);
}
