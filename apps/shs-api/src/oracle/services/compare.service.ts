import { compareTruthPackages } from "./compare-engine";

export async function runOracleCompare(entityIds: string[]) {
  return await compareTruthPackages(entityIds);
}
