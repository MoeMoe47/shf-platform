import { buildPriorityQueue } from "./priority-engine.js";

export async function runOraclePriority(entityIds: string[]) {
  return await buildPriorityQueue(entityIds);
}
